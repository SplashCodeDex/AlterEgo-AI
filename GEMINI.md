
# Project Overview

This is a web and mobile application called "AlterEgo AI" that allows users to upload a photo and have it reimagined in various artistic styles using the Gemini API. The application is built with a React-based frontend for the web and a React Native-based mobile app for iOS and Android.

## Technologies

*   **Web:** React, Vite, TypeScript, Tailwind CSS
*   **Mobile:** React Native, TypeScript
*   **AI:** Google Gemini API (`@google/genai`)
*   **Styling:** Framer Motion for animations, Lucide for icons

## Architecture

The application is divided into a web app and a mobile app. Both apps share a similar architecture and use the same Gemini API service.

*   **`App.tsx`:** The main component for both the web and mobile apps, responsible for managing the application state, handling user interactions, and rendering the UI.
*   **`services/geminiService.ts`:**  A service that interacts with the Gemini API to generate styled images. It includes a retry mechanism and a fallback prompt for blocked prompts.
*   **`components/`:**  A collection of reusable UI components used throughout the application.
*   **`lib/`:**  A collection of utility functions and custom hooks.
*   **`mobile/`:**  The React Native application for iOS and Android.

# Building and Running

## Prerequisites

*   Node.js
*   A Gemini API key

## Web App

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Create a `.env.local` file in the root of the project and add your Gemini API key:
    ```
    GEMINI_API_KEY=your_api_key
    ```
3.  Run the app:
    ```bash
    npm run dev
    ```

## Mobile App

1.  Navigate to the `mobile` directory:
    ```bash
    cd mobile
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the app on iOS or Android:
    ```bash
    npx react-native run-ios
    npx react-native run-android
    ```

# Development Conventions

*   **Coding Style:** The codebase follows standard TypeScript and React conventions.
*   **State Management:** The application uses React hooks for state management. Custom hooks are used for managing local storage, session storage, favorites, and history.
*   **Styling:** The web app uses Tailwind CSS for styling, with Framer Motion for animations. The mobile app uses React Native's StyleSheet for styling.
*   **API Interaction:** The `geminiService.ts` service encapsulates all interaction with the Gemini API.
*   **Error Handling:** The `geminiService.ts` service includes a retry mechanism and a fallback prompt for blocked prompts.
*   **Watermarking:** The web app adds a watermark to the generated images. The mobile app has a `TODO` to implement this feature using a React Native-compatible library.
