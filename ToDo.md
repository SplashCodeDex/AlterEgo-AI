# ToDo & Project Roadmap: AlterEgo AI

This document outlines the strategic roadmap for AlterEgo AI, tracking planned features, architectural improvements, and innovative ideas. It is designed to be a living document, providing any contributor with a clear understanding of the project's trajectory and current priorities.

For detailed notes on completed architectural milestones, see the `RELEASE_MANUSCRIPT.md`.

**Status Legend:**
*   `[ ]` **Planned**: Feature is approved and waiting for development to begin.
*   `[ S ]` **In Progress**: Actively being developed on a feature branch.
*   `[ X ]` **Completed**: Feature is complete and merged into `main`.
*   `[ - ]` **On Hold**: Development is paused.
*   `[ B ]` **Backlog**: Idea is parked for future consideration.

---

## Vulnerability and Bug Analysis (October 2025)

This section details the findings from the automated analysis performed by the Gemini assistant.

| Vulnerability / Bug | Severity | Status | Area | Notes & Recommendation |
| --- | --- | --- | --- | --- |
| **Compromised `cors` Dependency** | **Critical** | `[ - ]` On Hold | Backend | The `cors` package at version `2.8.5` is known to be compromised with malicious code. User has decided to put this on hold, but it remains a critical security risk. |
| **Unauthenticated Backend Functions** | **Critical** | `[ X ]` Completed | Backend | The core backend functions for image transformation are publicly accessible. Secure the `transformImage` and `transformImageHTTP` functions by implementing authentication checks. |
| **Client-Side Credit Management** | **Critical** | `[ ]` Planned | Frontend & Mobile | The credit system is handled on the client-side, making it easy to bypass. Move all credit management logic to the backend. |
| **`client-zip` "Zip Slip" Vulnerability** | **High** | `[ ]` Planned | Frontend | The `client-zip` package may be vulnerable to "Zip Slip". Update `client-zip` to the latest stable version. |
| **Insecure IAP Validation** | **Medium** | `[ ]` Planned | Backend | The Android IAP validation is insecure, and the iOS validation is a placeholder. Implement server-side receipt validation for both platforms. |
| **Missing Input Validation** | **Medium** | `[ ]` Planned | Backend | The backend does not validate the length/content of the prompt or the size of the uploaded image. Implement size limits for the `imageDataUrl` and `prompt`. |
| **`jimp` Transitive Dependency Vulnerability** | **Medium** | `[ ]` Planned | Backend | The version of `jimp` used has a dependency on a vulnerable version of `jpeg-js`. Update `jimp` to the latest stable version. |
| **Use of Alpha Software** | **Medium** | `[ ]` Planned | Frontend | The project uses an alpha version of `framer-motion`. Use the latest stable version of `framer-motion`. |
| **Missing Permissions Handling** | **Medium** | `[ ]` Planned | Mobile | The mobile app may not be correctly handling camera and photo library permissions. Use `react-native-permissions` to request permissions. |
| **Inconsistent Error Handling** | **Low** | `[ ]` Planned | Frontend | Some functions on the web frontend lack proper error handling. Add `try...catch` blocks and user-friendly error messages. |
| **`react-native/tvos-types.d` Module Resolution Error** | **Medium** | `[ X ]` Completed | Mobile | Workaround: Removed erroneous import from `mobile/index.ts`. This is a workaround for a bug in `react-native@0.81.4`'s `package.json` `exports` field. A proper fix would involve upgrading `react-native` to a version where this bug is resolved. |
| **Invariant Violation: 'TempAndroidProject' not registered** | **Medium** | `[ X ]` Completed | Mobile | Fixed by updating `rootProject.name` in `mobile/android/settings.gradle` to 'AlterEgo-AI' to match `app.json`. |

---

## `Version 2.0` - Native Mobile App (React Native)

This version represents the strategic pivot to a true native mobile application for iOS and Android, built with React Native.

| Feature / Enhancement | Priority | Status | Assigned To | Notes & Implementation Strategy |
| --- | --- | --- | --- | --- |
| **Initialize Project & Migrate Core Logic** | Critical | `[ X ]` Completed | Assistant | Set up React Native project. Migrate platform-agnostic logic (`geminiService`, `types`, etc.). Identify and stub web-specific APIs for native replacement. |
| **Implement Native Storage (`AsyncStorage`)** | High | `[ X ]` Completed | Assistant | Re-implement `useLocalStorageState` and `useHistory` hooks using `@react-native-async-storage/async-storage` for native persistence. |
| **Translate UI Components to React Native** | High | `[ X ]` Completed | Assistant | The entire core user flow (`Idle`, `Image Uploaded`, `Generating`, `Results`, `HistoryModal`, `FavoritesModal`) has been migrated to native components. |
| **Implement Native In-App Purchases & Ads** | High | `[ X ]` Completed | Assistant | Integrated `react-native-iap` for real monetization. Next steps: Implement rewarded ads and server-side receipt validation for security. |
| **Integrate Native Camera & Photo Library** | High | `[ X ]` Completed | Assistant | Replaced web camera stubs with `react-native-image-picker`. The app now uses real device photos. |
| **Re-implement Canvas Utilities Natively** | High | `[ X ]` Completed | Assistant | Rebuilt `addWatermark`, `createAlbumPage`, etc. using `react-native-view-shot` to capture components and `@react-native-camera-roll/camera-roll` to save. |
| **Implement Native Toast Notifications** | High | `[ X ]` Completed | Assistant | Create a native, non-blocking notification system using React Context to replace disruptive system alerts for a smoother UX. |
| **Global State Management** | High | `[ X ]` Completed | Assistant | Migrated from prop-drilling to a centralized state management solution using React Context and `useReducer` to simplify component logic and improve scalability. |
| **Setup App Icons & Splash Screens** | Medium | `[ X ]` Completed | Assistant | Replaced the JS-based splash screen with a true native solution using `react-native-bootsplash` for an instant, polished startup experience. Final native configuration required. |
| **Build & Deploy to TestFlight/Play Console** | Medium | `[ ]` Planned | TBD | Configure the build process for both platforms, sign the applications, and deploy internal test builds. |

---

## `Version 1.3` - Security & Backend Architecture

This version focuses on securing the application by removing the client-side API key and establishing a scalable backend architecture.

| Feature / Enhancement | Priority | Status | Assigned To | Notes & Implementation Strategy |
| --- | --- | --- | --- | --- |
| **Implement Secure Backend API Proxy** | Critical | `[ X ]` Completed | Assistant | Migrated all client-side Gemini API calls to a secure backend proxy using Firebase Functions. This protects the API key from being exposed. |
| **Server-Side Watermarking** | Critical | `[ X ]` Completed | Assistant | Moved all watermarking logic to the backend function. Ensures consistency and prevents users from accessing non-watermarked images. |

---

## `Version 1.2` - User Experience & Performance Enhancements

| Feature / Enhancement | Priority | Status | Assigned To | Notes & Implementation Strategy |
| --- | --- | --- | --- | --- |
| **Accessibility (A11y) Improvements** | High | `[ X ]` Completed | Assistant | Implemented full keyboard navigation, ARIA live regions for toasts, and proper focus management for all modals to ensure WCAG compliance. |
| **Code Splitting & Lazy Loading** | Medium | `[ X ]` Completed | Assistant | Lazy load heavy components like `CameraView` and modals to improve initial page load time and performance. |
| **Memoization (`React.memo`, `useCallback`)** | Medium | `[ X ]` Completed | Assistant | Applied memoization techniques to prevent unnecessary re-renders of complex components like `PhotoCard`, especially when displaying many results. |
| **Custom `useHistory` Hook** | Medium | `[ X ]` Completed | Assistant | Encapsulate all logic for reading from and writing to `sessionStorage` into a dedicated `useHistory` hook, following the new architectural pattern. |

---

## `Version 3.0` - The Platform Evolution

This version focuses on expanding the4 feature set, improving monetization security, and preparing the platform for long-term growth after the initial native launch.

| Feature / Enhancement | Priority | Status | Assigned To | Notes & Implementation Strategy |
| --- | --- | --- | --- | --- |
| **Secure IAP with Server-Side Validation** | Critical | `[ X ]` Completed | Assistant | Implemented a backend endpoint to validate App Store and Google Play receipts. This is critical to prevent fraud and securely grant credits/PRO access. |
| **Video Generation with 'veo-2.0'** | High | `[ ]` Planned | TBD | Integrate the `veo-2.0-generate-001` model. Build a robust polling mechanism for long-running video generation operations with a clear, reassuring loading UI. |
| **Image Generation with 'imagen-4.0'** | High | `[ ]` Planned | TBD | Introduce a new "Image Studio" feature for high-fidelity text-to-image generation using `imagen-4.0-generate-001`, separate from the "AlterEgo" stylization. |
| **User Authentication** | High | `[ ]` Planned | TBD | Implement a simple authentication system (e.g., social login) to sync credits, pro status, and favorites across devices. |
| **Inpainting/Outpainting Feature** | Medium | `[ B ]` Backlog | TBD | Allow users to edit generated images by masking areas and providing a text prompt to add, remove, or change objects within the scene. |
| **Style Marketplace** | Low | `[ B ]` Backlog | TBD | Create a platform where users can create and share their own "style prompts" (e.g., a specific combination of keywords and negative prompts) with the community. |

---

## `Infrastructure & Tooling`

| Task / Improvement | Priority | Status | Assigned To | Notes |
| --- | --- | --- | --- | --- |
| **Setup ESLint & Prettier** | High | `[ ]` Planned | TBD | Enforce a consistent code style and catch common errors early in the development process. |
| **Unit & Integration Testing** | Medium | `[ ]` Planned | TBD | Implement a testing strategy using Vitest/React Testing Library to ensure code quality and stability. |
| **CI/CD Pipeline with GitHub Actions** | Medium | `[ B ]` Backlog | TBD | Automate testing, building, and deployment processes to streamline releases. |
