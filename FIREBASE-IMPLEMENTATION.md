# 🔥 Firebase Implementation Guide for AlterEgo-AI

## Overview

This guide provides detailed Firebase implementation for AlterEgo-AI, covering web hosting, serverless functions, mobile integration, and security best practices.

## Why Firebase for AlterEgo-AI?

### Perfect Fit Analysis
- **✅ Unified Platform**: Single solution for hosting, backend, and mobile
- **✅ Google Integration**: Seamless Gemini API integration
- **✅ Security**: Built-in authentication and secure environment variables
- **✅ Scalability**: Auto-scaling serverless functions
- **✅ Cost-Effective**: Generous free tier, pay-per-use pricing
- **✅ Analytics**: Built-in usage tracking and performance monitoring

### Architecture Overview
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web App       │────│  Firebase        │────│  Gemini API     │
│  (React/Vite)   │    │  Functions       │    │  (Google AI)    │
└─────────────────┘    │  (Backend Proxy) │    └─────────────────┘
         │             └──────────────────┘            │
         │                      │                      │
┌─────────────────┐             │             ┌─────────────────┐
│  Mobile App     │─────────────┼─────────────│  Firebase       │
│  (React Native) │             │             │  Hosting        │
└─────────────────┘             │             └─────────────────┘
                                │
                       ┌──────────────────┐
                       │  Firebase        │
                       │  Auth/Storage    │
                       └──────────────────┘
```

## 1. Firebase Project Setup

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project" or use existing project
3. Choose project name: `alterego-ai` or similar
4. Enable Google Analytics (recommended)
5. Wait for project creation (1-2 minutes)

### 1.2 Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### 1.3 Initialize Firebase in Project
```bash
# In your project root directory
firebase init hosting
firebase init functions
```

**Configuration Options:**
- **Hosting**: Choose `dist` as public directory
- **Functions**: Choose JavaScript (not TypeScript for simplicity)
- **Single-page app**: Yes (for React routing)

## 2. Firebase Functions Backend (API Proxy)

### 2.1 Project Structure
```
functions/
├── src/
│   └── index.js          # Main functions file
├── package.json          # Functions dependencies
└── .firebaserc          # Firebase project config
```

### 2.2 Functions Package.json
```json
{
  "name": "functions",
  "scripts": {
    "build": "npm run build",
    "serve": "npm run build && firebase emulators:start --only functions",
    "shell": "npm run build && firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "18"
  },
  "main": "lib/index.js",
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0",
    "@google/generative-ai": "^0.1.3",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "firebase-functions-test": "^3.1.0"
  },
  "private": true
}
```

### 2.3 Main Functions File
```javascript
// functions/src/index.js
const functions = require('firebase-functions');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');

// Initialize Gemini AI with secure environment variable
const genAI = new GoogleGenerativeAI(functions.config().gemini.key);

// CORS configuration
const corsHandler = cors({
  origin: true, // Allow all origins in development
  credentials: true
});

// Transform image function (Callable Function)
exports.transformImage = functions.https.onCall(async (data, context) => {
  // Verify Firebase Auth if needed
  // if (!context.auth) {
  //   throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  // }

  const { imageDataUrl, prompt, caption } = data;

  if (!imageDataUrl || !prompt) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  try {
    // Validate image data
    const match = imageDataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!match) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid image format');
    }

    const [, mimeType, base64Data] = match;

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT']
      }
    });

    // Prepare request
    const imagePart = {
      inlineData: { mimeType, data: base64Data }
    };
    const textPart = { text: prompt };

    // Generate content
    const result = await model.generateContent([imagePart, textPart]);
    const response = await result.response;

    // Extract generated image
    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(
      part => part.inlineData
    );

    if (!imagePartFromResponse?.inlineData) {
      throw new functions.https.HttpsError('internal', 'No image generated');
    }

    const { mimeType: responseMimeType, data } = imagePartFromResponse.inlineData;
    const generatedImageUrl = `data:${responseMimeType};base64,${data}`;

    return {
      success: true,
      imageDataUrl: generatedImageUrl,
      usage: {
        model: 'gemini-1.5-flash',
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('Error in transformImage:', error);

    // Handle specific Gemini errors
    if (error.message.includes('API_KEY')) {
      throw new functions.https.HttpsError('failed-precondition', 'Invalid API key');
    }

    if (error.message.includes('quota') || error.message.includes('rate limit')) {
      throw new functions.https.HttpsError('resource-exhausted', 'API quota exceeded');
    }

    throw new functions.https.HttpsError('internal', 'Image transformation failed');
  }
});

// HTTP endpoint for web client (alternative to callable)
exports.transformImageHTTP = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const { imageDataUrl, prompt, caption } = req.body;

      // Call the same logic as the callable function
      const result = await functions.https.onCall(async (data) => {
        return await exports.transformImage(data, { });
      })({ imageDataUrl, prompt, caption });

      res.json(result);
    } catch (error) {
      console.error('HTTP endpoint error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});
```

### 2.4 Environment Configuration
```bash
# Set API key securely
firebase functions:config:set gemini.key="your_gemini_api_key_here"

# Optional: Set other config
firebase functions:config:set app.environment="production"
firebase functions:config:set app.allowed_origins="https://yourdomain.com"
```

### 2.5 Deploy Functions
```bash
# Build and deploy
cd functions
npm run build
firebase deploy --only functions
```

## 3. Firebase Hosting Setup

### 3.1 Configuration
**firebase.json:**
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "transformImageHTTP"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|ico)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  ],
  "functions": {
    "predeploy": [
      "npm --prefix \"$RESOURCE_DIR\" run build"
    ]
  }
}
```

### 3.2 Build and Deploy
```bash
# Build web app
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

## 4. Mobile App Integration

### 4.1 Install Firebase SDK
```bash
# In mobile directory
cd mobile
npm install @react-native-firebase/app @react-native-firebase/functions
```

### 4.2 Android Setup
1. Download `google-services.json` from Firebase Console
2. Place in `mobile/android/app/`
3. Add to `mobile/android/app/build.gradle`:
```gradle
apply plugin: 'com.google.gms.google-services'
```

### 4.3 iOS Setup
1. Download `GoogleService-Info.plist` from Firebase Console
2. Place in `mobile/ios/Runner/`
3. Add to `mobile/ios/Podfile`:
```ruby
pod 'Firebase/Functions'
```

### 4.4 Update Mobile Service
```typescript
// mobile/src/services/geminiService.ts
import functions from '@react-native-firebase/functions';

export async function generateStyledImage(imageDataUrl: string, prompt: string, caption: string): Promise<string> {
  try {
    const result = await functions().httpsCallable('transformImage')({
      imageDataUrl,
      prompt,
      caption
    });

    if (!result.data.success) {
      throw new Error(result.data.error || 'Transformation failed');
    }

    return result.data.imageDataUrl;
  } catch (error) {
    console.error('Firebase Functions error:', error);
    throw error;
  }
}
```

## 5. Security Configuration

### 5.1 CORS Configuration
```javascript
// functions/src/index.js - Update CORS
const corsHandler = cors({
  origin: [
    'http://localhost:3000',
    'https://your-project-id.web.app',
    'https://your-project-id.firebaseapp.com',
    'https://yourdomain.com'
  ],
  credentials: true
});
```

### 5.2 Rate Limiting
```javascript
// Add to functions
exports.transformImage = functions.runWith({
  timeoutSeconds: 300,
  memory: '1GB',
  maxInstances: 10
}).https.onCall(async (data, context) => {
  // Function logic here
});
```

### 5.3 Authentication (Optional)
```javascript
// Require authentication
exports.transformImage = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }

  // Check user permissions
  if (!context.auth.token.admin) {
    // Rate limiting per user
  }

  // Function logic here
});
```

## 6. Additional Firebase Features

### 6.1 User Authentication
```javascript
// Web client
import { getAuth, signInAnonymously } from 'firebase/auth';

const auth = getAuth();
await signInAnonymously(auth);
```

### 6.2 Image Storage
```javascript
// Store original and transformed images
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const storage = getStorage();
const imageRef = ref(storage, `images/${userId}/${Date.now()}.jpg`);
await uploadBytes(imageRef, imageBlob);
const downloadURL = await getDownloadURL(imageRef);
```

### 6.3 Analytics
```javascript
// Automatically included with Firebase
import { getAnalytics, logEvent } from 'firebase/analytics';

const analytics = getAnalytics();
logEvent(analytics, 'image_transformed', {
  style: caption,
  success: true
});
```

## 7. Deployment Commands

### 7.1 Development
```bash
# Start web development server
npm run dev

# Start Firebase emulators
firebase emulators:start

# Test functions locally
firebase functions:shell
```

### 7.2 Production Deployment
```bash
# Deploy everything
firebase deploy

# Deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only storage

# View deployment status
firebase deploy --only hosting:function
```

### 7.3 Monitoring
```bash
# View function logs
firebase functions:log

# View hosting logs
firebase hosting:log

# Monitor usage
firebase functions:list
```

## 8. Cost Optimization

### 8.1 Free Tier Limits
- **Hosting**: 1 GB storage, 10 GB/month bandwidth
- **Functions**: 2 million invocations/month
- **Storage**: 5 GB storage, 1 GB/day download
- **Auth**: 50,000 monthly active users

### 8.2 Cost Monitoring
```bash
# Check usage
firebase functions:log --only transformImage

# Set up billing alerts in Firebase Console
# Monitor in Google Cloud Console
```

### 8.3 Optimization Tips
- Cache images in browser/CDN
- Implement user quotas
- Use Firebase Storage for large files
- Monitor function execution time

## 9. Troubleshooting

### 9.1 Common Issues
```bash
# Check function status
firebase functions:list

# View detailed logs
firebase functions:log --only transformImage

# Test function locally
curl -X POST https://us-central1-your-project-id.cloudfunctions.net/transformImageHTTP \
  -H "Content-Type: application/json" \
  -d '{"imageDataUrl":"data:image/png;base64,...","prompt":"test"}'
```

### 9.2 Error Handling
- **CORS Errors**: Update allowed origins
- **Auth Errors**: Check Firebase Auth setup
- **Quota Errors**: Monitor API usage
- **Timeout Errors**: Increase function timeout

## 10. Next Steps

1. **Set up Firebase project** (5 minutes)
2. **Create and deploy functions** (15 minutes)
3. **Update mobile app** to use Firebase Functions (30 minutes)
4. **Test end-to-end** functionality (15 minutes)
5. **Deploy to production** and monitor (5 minutes)

This Firebase implementation provides a secure, scalable, and cost-effective solution for AlterEgo-AI's production deployment.