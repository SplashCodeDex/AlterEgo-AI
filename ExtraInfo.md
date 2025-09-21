Here’s a comprehensive breakdown of the external configurations, native project adjustments, and best practices you'll need to address.

1. Prerequisites: Developer Accounts & App Assets
   Before you can submit anything, you need to set up your presence on the app stores.
   Apple Developer Program: You must enroll in the Apple Developer Program. It costs $99/year. This gives you access to App Store Connect, where you'll manage your app, its listings, and In-App Purchases.
   Google Play Developer Account: You'll need to register for a Google Play Developer account. This is a $25 one-time fee. This gives you access to the Google Play Console.
   App Assets: Prepare high-quality marketing materials. This is crucial for attracting users.
   App Icon: You'll need various sizes for both platforms. Create a high-resolution version (e.g., 1024x1024 px) and use a service or tool to generate all the required sizes.
   Screenshots: Take compelling screenshots of your app on different device sizes (phones and tablets).
   Privacy Policy: This is mandatory. Because you handle user-uploaded images, you must have a privacy policy. It needs to be hosted on a public URL that you can link to from your store listings.
2. Critical Security Task: Securing Your Gemini API Key
   This is the most important architectural change you must make before going public.
   The Problem: Your current setup, const API_KEY = process.env.API_KEY;, embeds your API key directly into the mobile app's binary. Anyone can decompile your app and steal your key, leading to fraudulent usage and massive bills.
   The Solution: You must create a simple backend server (e.g., using Node.js with Express, or a serverless function like Firebase Functions or AWS Lambda).
   The mobile app sends the user's photo and prompt to your server.
   Your server securely stores the API_KEY as an environment variable.
   Your server makes the call to the Gemini API on the user's behalf and returns the result to the mobile app.
   Flow: Mobile App → Your Secure Backend → Gemini API
   This is the industry-standard practice and is non-negotiable for a production app.
3. Native Project Configuration
   You need to go beyond the JavaScript code and configure the native ios and android projects.
   Bundle ID & Package Name: Your app needs a unique, reverse-DNS identifier.
   iOS: Set the "Bundle Identifier" in Xcode (e.g., com.yourcompany.alteregoai).
   Android: Set the "applicationId" in android/app/build.gradle (e.g., com.yourcompany.alteregoai).
   This ID must be unique and cannot be changed after you publish your app.
   App Icons & Native Splash Screen:
   The current JavaScript-based splash screen is good, but a true native splash screen provides a better user experience by showing up instantly.
   Use a library like react-native-bootsplash to easily configure the native splash screen and icons for both platforms. This will involve placing image assets in the native ios and android directories.
   Permissions: You must declare why you need to access the camera and photo library.
   iOS: In your ios/[YourAppName]/Info.plist file, add keys like NSCameraUsageDescription and NSPhotoLibraryUsageDescription with a user-facing string explaining why you need access (e.g., "AlterEgo AI needs access to your camera to take a photo for stylization.").
   Android: These permissions are usually handled correctly by react-native-image-picker in the android/app/src/main/AndroidManifest.xml, but it's crucial to double-check.
4. In-App Purchase (IAP) Setup
   This is a detailed process that must be done correctly for your monetization to work.
   Define Products in the Consoles:
   In App Store Connect, go to "App Store" -> "In-App Purchases" and create your consumable products (credit packs) and auto-renewing subscription (PRO).
   In the Google Play Console, go to your app and find "Monetize" -> "Products" to create the same set of consumables and subscriptions.
   Match Product IDs (SKUs):
   The "Product ID" you set in App Store Connect and the "Product ID" in the Play Console must exactly match the strings you have in mobile/src/constants.ts (IAP_SKUS). Any typo will cause the products to fail to load.
   Agreements, Tax, and Banking:
   You must complete all financial agreements, tax forms, and banking information in both App Store Connect and the Google Play Console before you can sell anything.
   Testing IAP:
   iOS: Create "Sandbox Testers" in App Store Connect. When you build and run the app from Xcode (or a TestFlight build), you can sign in with these sandbox accounts to test purchases without real money.
   Android: Set up "License Testers" in the Play Console. You can then create internal test builds to test the purchase flow.
   Server-Side Receipt Validation (Highly Recommended):
   For a robust system, after a purchase is successful, your app should send the purchase receipt to your backend server. Your server then validates this receipt with Apple/Google's servers to confirm it's a legitimate transaction before granting the user credits or PRO access. This prevents fraud.
5. Building & Releasing
   Finally, you'll need to create the actual release builds and submit them.
   Code Signing: Both platforms require your app to be cryptographically signed.
   Android: You'll generate a Java Keystore (.keystore file) and use it to sign your Android App Bundle (.aab). You must back this key up securely; if you lose it, you can never update your app again.
   iOS: Xcode manages this through Certificates, Identifiers, and Profiles, which you'll create in your Apple Developer account.
   Building for Release:
   You will create a release build, not a debug build. This will generate an .aab file for Android and an .ipa file for iOS.
   Submitting for Review:
   Upload your signed binary to the Play Console and App Store Connect.
   Fill out all the store listing information (description, screenshots, etc.).
   Submit the app for review. The Google Play review is often faster (hours to a couple of days). The Apple review is more stringent and can take several days. Be prepared for potential rejections if you violate any of their guidelines.
