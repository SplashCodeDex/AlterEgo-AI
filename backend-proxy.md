# 🔐 Backend API Proxy for Secure Gemini Integration

## 🚨 Critical Security Issue

**Current Problem**: Your mobile app exposes the Gemini API key in the binary, making it vulnerable to decompilation and unauthorized usage.

**Solution**: Create a secure backend proxy that handles all Gemini API calls server-side.

## Backend Architecture

### Option 1: Express.js Server (Recommended)

**File Structure:**
```
backend/
├── src/
│   ├── server.js          # Main server file
│   ├── routes/
│   │   └── api.js         # API routes
│   └── middleware/
│       └── security.js    # Security middleware
├── package.json
├── .env                   # Server environment variables
└── Dockerfile            # For containerized deployment
```

**Implementation:**

```javascript
// backend/src/server.js
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { GoogleGenAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Initialize Gemini AI
const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

// API Routes
app.post('/api/transform', async (req, res) => {
  try {
    const { imageDataUrl, prompt, caption } = req.body;

    if (!imageDataUrl || !prompt) {
      return res.status(400).json({
        error: 'Missing required fields: imageDataUrl and prompt'
      });
    }

    // Validate image data
    const match = imageDataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!match) {
      return res.status(400).json({
        error: 'Invalid image data URL format'
      });
    }

    const [, mimeType, base64Data] = match;

    // Call Gemini API
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT']
      }
    });

    const imagePart = {
      inlineData: { mimeType, data: base64Data }
    };

    const textPart = { text: prompt };
    const result = await model.generateContent([imagePart, textPart]);
    const response = await result.response;

    // Extract image from response
    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(
      part => part.inlineData
    );

    if (imagePartFromResponse?.inlineData) {
      const { mimeType: responseMimeType, data } = imagePartFromResponse.inlineData;
      const dataUrl = `data:${responseMimeType};base64,${data}`;

      res.json({
        success: true,
        imageDataUrl: dataUrl
      });
    } else {
      res.status(500).json({
        error: 'No image generated from AI model'
      });
    }

  } catch (error) {
    console.error('Error in /api/transform:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
});
```

**Package.json:**
```json
{
  "name": "alterego-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.1.5",
    "dotenv": "^16.3.1",
    "@google/generative-ai": "^0.1.3"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

### Option 2: Vercel Serverless Functions

**File Structure:**
```
api/
└── transform.js
```

**Implementation:**
```javascript
// api/transform.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageDataUrl, prompt, caption } = req.body;

    if (!imageDataUrl || !prompt) {
      return res.status(400).json({
        error: 'Missing required fields: imageDataUrl and prompt'
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash'
    });

    // Process image and call API (similar to above)
    // ... implementation details

    res.json({ success: true, imageDataUrl: result });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

## Environment Variables

**Backend .env:**
```env
GEMINI_API_KEY=your_secure_api_key_here
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

## Deployment Options

### 1. Railway (Recommended)
- **Free tier** available
- **Easy deployment** with GitHub integration
- **Built-in database** support if needed later

### 2. Render
- **Free tier** with 512MB RAM
- **Auto-deploys** from Git
- **Custom domains** and SSL included

### 3. DigitalOcean App Platform
- **Starting at $5/month**
- **Scalable** and reliable
- **Good performance**

### 4. Vercel (Serverless)
- **Free tier** available
- **Serverless** functions (pay per invocation)
- **Integrated** with your frontend

## Mobile App Updates

Update `mobile/src/services/geminiService.ts`:

```typescript
// Replace direct Gemini calls with backend proxy calls
const API_BASE_URL = __DEV__
  ? 'http://localhost:3001'
  : 'https://your-backend-url.com';

export async function generateStyledImage(imageDataUrl: string, prompt: string, caption: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/transform`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageDataUrl,
        prompt,
        caption
      })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Backend API error');
    }

    return result.imageDataUrl;
  } catch (error) {
    console.error('Backend API error:', error);
    throw error;
  }
}
```

## Security Features

1. **API Key Protection**: Never exposed to client-side code
2. **Rate Limiting**: Prevents API abuse
3. **CORS Configuration**: Controls which domains can access your API
4. **Input Validation**: Validates all incoming data
5. **Error Handling**: Doesn't expose sensitive server information
6. **HTTPS Only**: Enforce HTTPS in production

## Cost Considerations

- **Railway/Render**: $5-25/month for backend
- **Gemini API**: Still pay-per-use, but now secure
- **Total**: $10-50/month for complete setup

## Next Steps

1. **Create the backend** using one of the options above
2. **Test locally** with your mobile app
3. **Deploy backend** to production
4. **Update mobile app** to use backend URLs
5. **Test end-to-end** functionality
6. **Submit to app stores** with confidence

This backend proxy is **essential** for production deployment and will protect your API key from being exposed in the mobile app binary.