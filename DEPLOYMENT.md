# AlterEgo-AI Production Deployment Guide

## Overview

AlterEgo-AI is an AI-powered photo transformation application with both web and mobile versions. This guide provides a comprehensive roadmap for deploying the application to production with all services working correctly.

## Architecture Analysis

### Current Stack
- **Web Frontend**: React 19 + Vite + TypeScript
- **Mobile App**: React Native 0.74.3 (iOS/Android)
- **AI Service**: Google Gemini 2.5 Flash API
- **Image Processing**: Client-side with watermarking
- **State Management**: React Context (web) + AsyncStorage (mobile)

### Key Dependencies
- `@google/genai` for AI image generation
- React Native modules for camera, storage, and in-app purchases
- Vite for web build tooling

## Environment Configuration

### Required Environment Variables

```bash
# Google Gemini API Configuration
API_KEY=your_gemini_api_key_here

# Optional: Additional configuration
NODE_ENV=production
```

### Security Considerations
- ✅ `.env.local` is properly ignored by git
- ✅ API keys are not committed to version control
- ✅ Environment variables are required at runtime

## Deployment Strategy

### Phase 1: Firebase Deployment (Recommended) 🔥

#### Why Firebase?
Firebase is the optimal choice for AlterEgo-AI because it provides:
- **Unified Platform**: Single solution for web hosting, backend functions, and mobile integration
- **Google Integration**: Seamless integration with Google Gemini API
- **Security**: Built-in authentication and secure environment variables
- **Scalability**: Auto-scaling serverless functions
- **Analytics**: Built-in usage tracking and performance monitoring
- **Cost-Effective**: Generous free tier, pay-per-use pricing

#### Option 1: Firebase (Recommended) ⭐
**Pros**:
- Complete solution for web, mobile, and backend
- Secure API key management via Cloud Functions
- Built-in authentication and user management
- Real-time database for user data
- Built-in analytics and crash reporting
- Google Cloud integration for Gemini API

**Cons**:
- Learning curve for Firebase-specific features
- Vendor lock-in to Google Cloud

**Setup Steps:**

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Initialize Firebase Project**:
   ```bash
   firebase init hosting
   firebase init functions
   ```

3. **Configure Hosting**:
   - Public directory: `dist`
   - Single-page app: Yes
   - Automatic builds and deploys: Yes

4. **Deploy Backend Functions**:
   ```bash
   cd functions
   npm install
   firebase deploy --only functions
   ```

5. **Deploy Web App**:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

#### Option 2: Vercel
**Pros**: Excellent React/Vite support, automatic deployments, global CDN
**Cons**: Limited mobile app deployment support, separate backend needed

**Setup Steps:**
1. Connect GitHub repository to Vercel
2. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
3. Add environment variables in Vercel dashboard
4. Deploy with automatic domain (e.g., `alterego-ai.vercel.app`)

#### Option 3: Netlify
**Pros**: Great for static sites, form handling
**Cons**: Less optimized for SPAs, separate backend needed

**Setup Steps:**
1. Connect GitHub repository to Netlify
2. Configure build settings:
   - Build Command: `npm run build`
   - Publish Directory: `dist`
3. Add environment variables in Netlify dashboard
4. Deploy with automatic domain

### Phase 2: Mobile Application Deployment

#### iOS Deployment (App Store)
1. **Apple Developer Account**: $99/year
2. **Code Signing**: Set up certificates and provisioning profiles
3. **Build & Archive**: Use Xcode to create archive
4. **TestFlight**: Beta testing with internal/external testers
5. **App Store Review**: Submit for review (typically 1-3 days)
6. **Release**: Publish to App Store

#### Android Deployment (Google Play Store)
1. **Google Play Developer Account**: $25 one-time fee
2. **App Signing**: Configure signing in `android/app/build.gradle`
3. **Generate AAB**: Use `./gradlew bundleRelease`
4. **Internal Testing**: Upload to Google Play Console for testing
5. **Production Release**: Roll out to production track

### Phase 3: Backend Services & API Integration

#### Firebase Functions Backend (Recommended) 🔥

**Why Firebase Functions?**
- **Secure API Key Management**: Environment variables never exposed to client
- **Google Cloud Integration**: Direct access to Gemini API
- **Auto-scaling**: Handles traffic spikes automatically
- **Built-in Security**: CORS, authentication, and rate limiting
- **Cost-Effective**: Pay only for actual usage

**Setup Steps:**
1. **Initialize Firebase Functions**:
   ```bash
   firebase init functions
   cd functions
   npm install firebase-functions firebase-admin @google/generative-ai
   ```

2. **Create API Function**:
   ```javascript
   // functions/src/index.js
   const functions = require('firebase-functions');
   const { GoogleGenerativeAI } = require('@google/generative-ai');

   const genAI = new GoogleGenerativeAI(functions.config().gemini.key);

   exports.transformImage = functions.https.onCall(async (data, context) => {
     const { imageDataUrl, prompt, caption } = data;

     const model = genAI.getGenerativeModel({
       model: 'gemini-1.5-flash',
       generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
     });

     const imagePart = { inlineData: { mimeType, data: base64Data } };
     const textPart = { text: prompt };
     const result = await model.generateContent([imagePart, textPart]);

     return { imageDataUrl: result.imageDataUrl };
   });
   ```

3. **Deploy Functions**:
   ```bash
   firebase deploy --only functions
   ```

#### Alternative: Express.js Backend
**For non-Firebase deployments**, use the Express.js backend detailed in `backend-proxy.md`.

#### Google Gemini API Setup
1. **API Key Management**:
   - Create API key in Google AI Studio
   - Set up proper quotas and rate limits
   - Enable required APIs (if using other Google services)

2. **Security Best Practices**:
   - Use environment variables (already implemented)
   - Implement API key rotation strategy
   - Monitor usage and costs
   - Set up proper error handling and fallbacks

3. **Performance Optimization**:
   - Implement request caching where appropriate
   - Use appropriate image compression
   - Monitor API response times
   - Set up proper retry mechanisms (already implemented)

### Phase 4: CI/CD Pipeline

#### GitHub Actions Setup
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  web-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        if: github.ref == 'refs/heads/main'
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist

  mobile-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd mobile && npm ci
      - run: cd mobile && npm test
```

### Phase 5: Domain & SSL Setup

#### Domain Registration
1. **Purchase Domain**: Register `alterego-ai.com` or similar
2. **DNS Configuration**: Point to hosting provider
3. **SSL Certificate**: Use Let's Encrypt (free) or provider's SSL

#### Hosting Options
- **Firebase Hosting** (Recommended): Global CDN, automatic SSL, custom domains
- **Vercel/Netlify**: Automatic SSL and custom domains
- **AWS**: Route 53 for DNS, Certificate Manager for SSL
- **Cloudflare**: DNS management and free SSL

## Production Checklist

### Pre-Deployment
- [ ] Set up production environment variables
- [ ] Test all API integrations
- [ ] Optimize images and assets
- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Configure analytics (Google Analytics, Mixpanel)
- [ ] Test mobile app builds
- [ ] Set up monitoring and alerting

### Security
- [ ] API keys properly secured
- [ ] HTTPS enforced everywhere
- [ ] Content Security Policy (CSP) headers
- [ ] Rate limiting implemented
- [ ] Input validation and sanitization
- [ ] Regular security updates

### Performance
- [ ] Image optimization and lazy loading
- [ ] Code splitting and bundle optimization
- [ ] CDN for static assets
- [ ] Database query optimization
- [ ] Caching strategies implemented

### Monitoring & Analytics
- [ ] Error tracking and monitoring
- [ ] Performance monitoring
- [ ] User analytics
- [ ] API usage monitoring
- [ ] Server uptime monitoring

## Cost Estimation

### Monthly Costs (Approximate)

#### Firebase Deployment (Recommended)
- **Domain**: $10-15/year
- **Firebase Hosting**: $0/month (generous free tier)
- **Firebase Functions**: $0.40/million invocations (first 2M free/month)
- **Google Gemini API**: Pay-per-use (first $300 free/month)
- **Firebase Auth/Storage**: $0/month (free tier)
- **SSL Certificate**: $0 (automatic with Firebase)
- **Monitoring**: $0/month (built-in Firebase monitoring)
- **Mobile App Stores**: $25 (Android) + $99/year (iOS)

#### Alternative: Vercel/Netlify
- **Domain**: $10-15/year
- **Hosting**: $0-25/month (free tier available)
- **Backend (Railway/Render)**: $5-25/month
- **Google Gemini API**: Pay-per-use (first $300 free/month)
- **SSL Certificate**: $0 (automatic)
- **Monitoring**: $0-50/month

### Total First Year Cost:
- **Firebase**: $150-300 (excluding API usage)
- **Alternative**: $200-400 (excluding API usage)

## Next Steps

### Immediate Actions (Firebase Priority)
1. **Set up Firebase Project**:
   - Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Install Firebase CLI: `npm install -g firebase-tools`
   - Initialize hosting and functions: `firebase init`

2. **Deploy Backend API**:
   - Create Firebase Functions for secure Gemini API proxy
   - Set environment variables: `firebase functions:config:set gemini.key="your_api_key"`
   - Deploy functions: `firebase deploy --only functions`

3. **Deploy Web Application**:
   - Build web app: `npm run build`
   - Deploy to Firebase Hosting: `firebase deploy --only hosting`
   - Your app will be live at `your-project-id.web.app`

### Short Term (1-2 weeks)
1. **Mobile Integration**:
   - Add Firebase SDK to React Native app
   - Update API calls to use Firebase Functions
   - Test mobile app with Firebase backend

2. **App Store Preparation**:
   - Set up developer accounts (Apple/Google)
   - Create app icons and screenshots
   - Configure in-app purchases

3. **Production Testing**:
   - Test AI transformations in production
   - Verify mobile app builds
   - Set up monitoring and analytics

### Medium Term (1-3 months)
1. **Advanced Features**:
   - Implement user authentication
   - Add image storage and history
   - Set up push notifications

2. **Performance Optimization**:
   - Implement image caching
   - Optimize bundle sizes
   - Add offline support

3. **Scale and Monitor**:
   - Monitor Firebase usage and costs
   - Scale functions as needed
   - Implement advanced analytics

## Support & Maintenance

### Regular Tasks
- Monitor API usage and costs
- Update dependencies monthly
- Review and respond to user feedback
- Monitor app store ratings and reviews
- Perform regular security audits

### Backup Strategy
- Code: Git version control
- Assets: CDN with replication
- Configuration: Environment variables and config files
- Database: Regular backups (if applicable)

## Troubleshooting

### Common Issues
1. **API Rate Limits**: Implement exponential backoff
2. **Image Upload Failures**: Check file size limits and formats
3. **Mobile Build Issues**: Ensure all dependencies are compatible
4. **SSL Certificate Issues**: Verify domain configuration

### Emergency Contacts
- **Development Team**: [Your Contact Info]
- **Hosting Support**: [Provider Support]
- **Google Cloud Support**: [Google Support]

---

**Last Updated**: September 2025
**Version**: 1.0
**Status**: Planning Phase