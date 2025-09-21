# Jules AI Agent Instructions for AlterEgo AI

This document provides instructions for Jules, the AI development agent, on how to work with the AlterEgo AI repository.

## 1. Project Overview & Architecture

This is a monorepo containing two main applications that share a common goal but have distinct, platform-specific implementations. The application architecture has been updated for security and scalability.

1.  **Web Application (Root `/`)**: A React-based web app.
2.  **Native Mobile Application (`/mobile`)**: A React Native application for iOS and Android.
3.  **Backend (`/functions`)**: A **secure backend proxy** built with **Firebase Functions**. This is a CRITICAL component.

**Core Architectural Principle:** The client-side applications (Web and Mobile) **MUST NOT** interact with the Google Gemini API directly. All AI-related API calls are proxied through the Firebase Functions backend to protect the API key.

## 2. Environment Setup

The repository is cloned into the `/app` directory.

### 2.1. Firebase Backend (`/functions`)

This is the most critical part of the setup.

1.  **Install Firebase CLI**: If not already installed, run `npm install -g firebase-tools`.
2.  **Authenticate**: Run `firebase login`.
3.  **Install Dependencies**:
    ```bash
    cd /app/functions
    npm install
    ```
4.  **Configure Environment Variables**: The Gemini API key MUST be configured securely. DO NOT commit it to any file.
    ```bash
    # Run this from the root /app directory
    firebase functions:config:set gemini.key="<YOUR_GEMINI_API_KEY>"
    ```

### 2.2. Web Application (`/`)

The web application uses ES modules and an `importmap`. No `npm install` is required for the root directory. It is configured to proxy API calls starting with `/api` to the Firebase Functions emulator during local development.

### 2.3. Native Mobile Application (`/mobile`)

The native app requires React Native and Firebase dependencies.

1.  **Install Dependencies**:
    ```bash
    cd /app/mobile
    npm install
    ```
2.  **Configure Firebase**:
    *   Place the `google-services.json` file (for Android) in `/app/mobile/android/app/`.
    *   Place the `GoogleService-Info.plist` file (for iOS) in `/app/mobile/ios/AlterEgoNative/`. (Note: The exact path inside `/ios` may vary based on project setup).
3.  **Install iOS Pods**:
    ```bash
    cd /app/mobile/ios
    pod install
    cd ..
    ```

## 3. Running the Application Locally

To run the full stack locally, you must use the Firebase Emulator Suite.

1.  **Start Firebase Emulators**: This will host the Functions backend. Run from the root `/app` directory.
    ```bash
    firebase emulators:start
    ```
    The Functions emulator will typically run on `localhost:5001`.

2.  **Run the Web App**: The web app is served automatically and should connect to the emulated backend.

3.  **Run the Mobile App**: (In a separate terminal, from `/app/mobile`)
    *   Run on Android: `npx react-native run-android`
    *   Run on iOS: `npx react-native run-ios`

## 4. Common Tasks & Workflows

### Task: Modifying the AI Image Generation Logic

1.  **Locate the Backend Function**: All Gemini API logic is now centralized in `/app/functions/src/index.js` within the `transformImage` function.
2.  **Make Changes**: Modify the prompt, model parameters, or error handling within this single file.
3.  **Deploy**: After testing with the emulator, deploy only the functions to production:
    ```bash
    # From the root /app directory
    firebase deploy --only functions
    ```
    This single change will update the AI logic for both the web and mobile clients simultaneously.

### Task: Adding a new artistic style

1.  **Locate the style definitions**:
    *   Web: `src/App.tsx` (the `ALL_STYLES` array)
    *   Mobile: `mobile/src/constants.ts` (the `ALL_STYLES` array)
2.  **Add the new style object** with a `caption` and `description` to **both** files to maintain parity.

## 5. Final Notes

*   Refer to `RELEASE_MANUSCRIPT.md` for a detailed history of architectural decisions. This provides crucial context for *why* the app is built the way it is.
*   Refer to `CONTRIBUTING.md` for general contribution guidelines and commit message conventions.
