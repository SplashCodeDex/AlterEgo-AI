/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import functions from '@react-native-firebase/functions';
import type { FirebaseFunctionsTypes } from '@react-native-firebase/functions';

// Interface for the expected response from the Firebase Function
interface TransformResult {
    success: boolean;
    imageDataUrl: string;
}

// Custom Error for the client
export class GenerationError extends Error {
    constructor(message: string, public code: functions.HttpsErrorCode) {
        super(message);
        this.name = 'GenerationError';
    }
}

/**
 * Generates a styled image by calling the secure 'transformImage' Firebase Function.
 * This function does NOT handle watermarking; that is done in the AppContext.
 * @param imageDataUrl A data URL string of the source image.
 * @param prompt The prompt to guide the image generation.
 * @param caption The style caption.
 * @returns A promise that resolves to a base64-encoded image data URL from the backend.
 * @throws {GenerationError} If the Firebase Function call fails.
 */
export async function generateStyledImage(imageDataUrl: string, prompt: string, caption: string): Promise<string> {
  try {
    // Get a reference to the callable function
    const transformImage = functions().httpsCallable('transformImage');
    
    // Call the function with the payload
    const result: FirebaseFunctionsTypes.HttpsCallableResult = await transformImage({
      imageDataUrl,
      prompt,
      caption
    });

    const data = result.data as TransformResult;

    if (!data.success || !data.imageDataUrl) {
      // This case should ideally not be hit if the backend always throws an error on failure
      throw new GenerationError('The backend function returned an unsuccessful response.', 'unknown');
    }

    return data.imageDataUrl;
  } catch (error: any) {
    console.error('Firebase Functions call failed:', error);
    // Re-throw a more specific error to be caught by the UI layer
    const code = error.code || 'internal';
    const message = error.message || 'An unexpected error occurred during image generation.';
    throw new GenerationError(message, code as functions.HttpsErrorCode);
  }
}
