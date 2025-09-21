# 📱 App Store Preparation Guide

## Overview

This guide provides detailed steps for preparing AlterEgo-AI for App Store and Google Play Store submission, incorporating all the critical configurations and best practices for a successful launch.

## 1. Developer Accounts & Prerequisites

### Apple Developer Program ($99/year)
- **Enroll**: Visit [developer.apple.com](https://developer.apple.com) and complete enrollment
- **Complete Agreements**: Sign all legal agreements, tax forms, and banking details
- **Verify Email**: Ensure your Apple ID email is verified
- **Two-Factor Authentication**: Enable 2FA on your Apple ID

### Google Play Developer Account ($25 one-time)
- **Register**: Visit [play.google.com/console](https://play.google.com/console)
- **Complete Setup**: Add financial information, tax details, and payout settings
- **Verify Identity**: Complete identity verification process

## 2. App Assets & Branding

### App Icons
**Requirements:**
- **iOS**: 1024×1024px PNG (single source image)
- **Android**: 512×512px PNG for Play Store
- **Format**: PNG with transparent background recommended

**Generation Tools:**
```bash
# Using ImageMagick (recommended)
convert input.png -resize 1024x1024 app-icon-1024.png

# Using online tools
# - https://appicon.co/
# - https://easyappicon.com/
```

### Screenshots
**Requirements:**
- **iOS**: Minimum 4 screenshots, maximum 10 per device type
- **Android**: Minimum 2 screenshots, maximum 8
- **Resolution**: High-quality, actual device screenshots
- **Content**: Show key features (photo upload, AI transformation, results)

**Best Practices:**
- Show the app in action with real transformations
- Include different device orientations
- Highlight unique AI features
- Show in-app purchase flows

### App Metadata
**Store Listing:**
- **Title**: "AlterEgo-AI" (30 characters max)
- **Subtitle**: "AI Photo Transformations" (iOS only)
- **Description**: 4000 characters max, include keywords
- **Keywords**: AI, photo, transformation, style, filter, art
- **Category**: Photo & Video (iOS), Photography (Android)

## 3. Native Project Configuration

### Bundle ID / Package Name
**Choose carefully** - cannot be changed after first release!

**Recommended Format:**
```properties
# iOS Bundle ID (Xcode)
com.yourname.alteregoai

# Android Package Name (build.gradle)
com.yourname.alteregoai
```

### Minimum Requirements
```xml
<!-- iOS: Info.plist -->
<key>MinimumOSVersion</key>
<string>12.0</string>
```

```gradle
// Android: build.gradle
android {
    defaultConfig {
        minSdkVersion 21
        targetSdkVersion 33
    }
}
```

### Permissions Configuration

**iOS (Info.plist):**
```xml
<key>NSCameraUsageDescription</key>
<string>AlterEgo-AI needs camera access to capture photos for AI transformation</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>AlterEgo-AI needs photo library access to select images for transformation</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>AlterEgo-AI needs permission to save transformed images to your photo library</string>
```

**Android (AndroidManifest.xml):**
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

## 4. In-App Purchase Configuration

### Product Setup

**Consumable Products (Credits):**
- `credits_100`: 100 Credits - $0.99
- `credits_500`: 500 Credits - $3.99
- `credits_1000`: 1000 Credits - $6.99

**Subscription (PRO):**
- `pro_monthly`: PRO Monthly - $4.99/month
- `pro_yearly`: PRO Yearly - $29.99/year

### Store Configuration

**App Store Connect:**
1. Navigate to "App Store" → "In-App Purchases"
2. Create new IAP for each product
3. Set pricing and availability
4. Submit for review (can be before app submission)

**Google Play Console:**
1. Go to "Monetize" → "Products"
2. Create in-app products
3. Set pricing and distribution
4. Activate products

### Receipt Validation

**Server-Side Validation** (Recommended):
```javascript
// Backend validation endpoint
app.post('/api/validate-purchase', async (req, res) => {
  const { receipt, platform } = req.body;

  if (platform === 'ios') {
    // Validate with Apple servers
    const validationResponse = await validateWithApple(receipt);
    // Process validation result
  } else if (platform === 'android') {
    // Validate with Google Play servers
    const validationResponse = await validateWithGoogle(receipt);
    // Process validation result
  }

  res.json({ valid: true, credits: 100 });
});
```

## 5. Build Configuration

### Code Signing Setup

**iOS:**
1. Create App ID in Apple Developer Console
2. Generate development/production certificates
3. Create provisioning profiles
4. Configure in Xcode → Signing & Capabilities

**Android:**
1. Generate keystore:
```bash
keytool -genkeypair -v -keystore my-release-key.keystore \
  -alias alias_name -keyalg RSA -keysize 2048 -validity 10000
```

2. Configure in `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('my-release-key.keystore')
            storePassword 'store_password'
            keyAlias 'key_alias'
            keyPassword 'key_password'
        }
    }
}
```

### Build Commands

**iOS Release Build:**
```bash
# Archive in Xcode
# Product → Archive
# Then distribute via App Store Connect
```

**Android Release Build:**
```bash
# Generate AAB (recommended for Play Store)
./gradlew bundleRelease

# Generate APK (alternative)
./gradlew assembleRelease
```

## 6. Privacy & Compliance

### Privacy Policy
**Requirements:**
- Must be publicly accessible URL
- Cover data collection, usage, and sharing
- Include GDPR/CCPA compliance statements
- Detail AI processing and data handling

**Template Sections:**
- Information Collection
- How We Use Information
- Data Sharing and Disclosure
- Data Security
- User Rights and Choices
- Contact Information

### Data Handling
- **Images**: Processed temporarily for AI transformation
- **User Data**: Stored locally only
- **Analytics**: Optional, with user consent
- **Third Parties**: Google Gemini API only

## 7. Testing & Quality Assurance

### Pre-Submission Testing

**Functional Testing:**
- [ ] Photo capture and selection
- [ ] AI transformation with various styles
- [ ] Image saving and sharing
- [ ] In-app purchases
- [ ] Offline functionality
- [ ] Error handling

**Device Testing:**
- [ ] iPhone SE (smallest screen)
- [ ] iPhone 14 Pro Max (largest screen)
- [ ] iPad (tablet experience)
- [ ] Android devices (various manufacturers)

**Network Testing:**
- [ ] Slow network conditions
- [ ] No internet connectivity
- [ ] API failures and retries

### Beta Testing

**TestFlight (iOS):**
1. Upload build to App Store Connect
2. Add internal/external testers
3. Collect feedback and crash reports
4. Iterate based on feedback

**Google Play Beta (Android):**
1. Create internal testing track
2. Upload AAB file
3. Add testers via email
4. Monitor feedback and analytics

## 8. Submission Process

### App Store (iOS)
1. **Archive Build**: Create archive in Xcode
2. **Upload**: Upload to App Store Connect via Xcode/Transporter
3. **Fill Metadata**: Complete app information, screenshots, description
4. **Submit for Review**: Submit to Apple for review
5. **Review Time**: 1-3 days typically
6. **Release**: Release when approved

### Google Play Store (Android)
1. **Upload AAB**: Upload to Play Console
2. **Complete Listing**: Add descriptions, screenshots, privacy policy
3. **Rollout**: Choose rollout percentage (start with 20%)
4. **Review Time**: Usually approved within hours
5. **Production**: Gradually increase rollout percentage

## 9. Post-Launch Monitoring

### Analytics Setup
- **App Store Connect**: Built-in analytics
- **Google Play Console**: Statistics dashboard
- **Third-party**: Firebase Analytics, Mixpanel

### Crash Reporting
- **iOS**: Xcode Organizer, Firebase Crashlytics
- **Android**: Google Play Vitals, Firebase Crashlytics

### User Feedback
- **App Store Ratings**: Monitor and respond
- **Google Play Reviews**: Engage with users
- **Support Channels**: Email, in-app feedback

## 10. Cost Breakdown

### One-time Costs:
- **Apple Developer Program**: $99/year
- **Google Play Developer**: $25 one-time
- **App Icons/Screenshots**: $0-200 (if outsourcing)

### Per-submission Costs:
- **App Store**: Free
- **Google Play**: Free

### Monthly Costs:
- **Developer Accounts**: $8.25/month (Apple)
- **Analytics/Monitoring**: $0-50/month
- **Backend Hosting**: $5-25/month

## Success Metrics

**Launch Goals:**
- [ ] 1000+ downloads in first month
- [ ] 4.5+ star rating
- [ ] < 1% crash rate
- [ ] 50+ daily active users

**Monetization Targets:**
- [ ] 10% conversion to IAP
- [ ] $0.50+ ARPU
- [ ] 70%+ subscription retention

This comprehensive guide ensures your AlterEgo-AI app meets all store requirements and provides the best possible user experience from day one.