# Contributing to AlterEgo AI

First off, thank you for considering contributing to AlterEgo AI! We're excited to see what you build. This is an ambitious project, and we welcome all contributions that align with our goal of pushing the boundaries of creative AI applications.

This document provides guidelines for contributing to the project to ensure a smooth and collaborative development process.

## Code of Conduct

This project and everyone participating in it is governed by a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior. (Note: A formal Code of Conduct file will be added later). For now, the key is to be respectful and constructive.

## How Can I Contribute?

### Reporting Bugs

If you find a bug, please ensure the bug was not already reported by searching on GitHub under [Issues](<Your-Future-Repo-Link/issues>). If you're unable to find an open issue addressing the problem, open a new one. Be sure to include a **title and clear description**, as much relevant information as possible, and a **code sample or an executable test case** demonstrating the expected behavior that is not occurring.

### Suggesting Enhancements

We are always looking for ways to improve! If you have an idea for an enhancement, please open an issue with the "enhancement" label. Provide a clear and detailed explanation of the feature, its potential benefits, and any implementation ideas you might have. Check the `ToDo.md` file for our existing roadmap to see if your idea is already planned.

### Pull Requests

We welcome pull requests! Please follow these steps to make your contribution:

1.  **Fork the repository** and create your branch from `main`.
2.  **Create a new Git branch** for your feature or fix. A good branch name is descriptive, e.g., `feat/add-new-style-pack` or `fix/camera-permission-error`.
3.  **Make your changes.** Ensure your code adheres to the project's architectural and style guidelines.
4.  **Update documentation.** If you are adding a new feature or changing an existing one, update the `README.md` and any other relevant documentation. For significant architectural changes, add an entry to the `RELEASE_MANUSCRIPT.md`.
5.  **Ensure your code lints.** (We will add a linter soon).
6.  **Open a pull request.** Provide a clear description of the changes you've made and reference any related issues.

## Architectural Guidelines

To maintain code quality and scalability, we follow these architectural principles.

### 1. Component-Based Structure

*   Keep components small, focused, and reusable.
*   UI components reside in the `src/components/` directory.
*   Complex, multi-component features can have their own subdirectory within `components`.

### 2. Separation of Concerns

*   **API Logic:** All interactions with external APIs (like the Gemini API) **must** be isolated in the `src/services/` directory. Components should not make direct API calls.
*   **Utility Functions:** Pure, reusable functions (e.g., image manipulation, data transformation) should be placed in the `src/lib/` directory.
*   **Custom Hooks:** Business logic and state management should be encapsulated in custom hooks within `src/lib/hooks.ts` or a `src/hooks/` directory. This is the preferred way to manage complex or shared state.

### 3. State Management with Custom Hooks

*   **Persistent State:** For any state that needs to persist across browser sessions (e.g., user settings, credits), **always** use the `useLocalStorageState` custom hook. Do not interact with `localStorage` directly from within a component.
*   **Domain-Specific Logic:** For state related to a specific feature (e.g., favorites, history), create a dedicated custom hook (like `useFavorites`) to encapsulate all related logic. This keeps components clean and declarative.

### 4. Styling

*   We use **TailwindCSS** for styling. Avoid writing custom CSS in `<style>` tags or inline style attributes whenever possible.
*   Use `clsx` and the `cn` utility from `lib/utils.ts` to conditionally apply classes.

## Git Commit Guidelines

We follow a conventional commit format. This helps keep the commit history clean and enables automated changelog generation in the future.

*   **`feat`**: A new feature.
*   **`fix`**: A bug fix.
*   **`docs`**: Documentation only changes.
*   **`style`**: Changes that do not affect the meaning of the code (white-space, formatting, etc).
*   **`refactor`**: A code change that neither fixes a bug nor adds a feature.
*   **`chore`**: Changes to the build process or auxiliary tools.

Example: `feat: Add support for video generation`
Example: `fix: Correctly handle image upload errors`

Thank you for your contribution!
