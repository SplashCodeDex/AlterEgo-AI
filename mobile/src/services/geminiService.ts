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
    error?: string;
}

/**
 * Generates a styled image by calling the secure 'transformImage' Firebase Function.
 * This function does NOT handle watermarking; that is done in the AppContext.
 * @param imageDataUrl A data URL string of the source image.
 * @param prompt The prompt to guide the image generation.
 * @param caption The style caption.
 * @returns A promise that resolves to a base64-encoded image data URL from the backend.
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
      throw new Error(data.error || 'The backend function returned an unsuccessful response.');
    }

    return data.imageDataUrl;
  } catch (error) {
    console.error('Firebase Functions call failed:', error);
    // Re-throw the error so it can be caught by the UI layer (e.g., AppContext)
    // and displayed to the user.
    throw error;
  }
}
