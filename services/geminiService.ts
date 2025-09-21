/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
// All Gemini API calls are now proxied through a secure backend.
// In a dev environment, this endpoint is expected to be proxied
// to the backend service (e.g., Firebase Functions emulator).
const API_ENDPOINT = '/api/transform';

/**
 * Generates a styled image by calling the secure backend service.
 * Watermarking is now applied on the server-side.
 * @param imageDataUrl A data URL string of the source image.
 * @param prompt The prompt to guide the image generation.
 * @param caption The style caption.
 * @returns A promise that resolves to a base64-encoded, watermarked image data URL.
 */
export async function generateStyledImage(imageDataUrl: string, prompt: string, caption: string): Promise<string> {
  try {
    const response = await fetch(API_ENDPOINT, {
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

    if (!response.ok) {
        // Use the error message from the backend if available
        throw new Error(result.error || `Request failed with status ${response.status}`);
    }

    if (!result.success || !result.imageDataUrl) {
      throw new Error(result.error || 'The backend service did not return a valid image.');
    }

    // Watermark is now applied on the server-side. Return the URL directly.
    return result.imageDataUrl;

  } catch (error) {
    console.error('Error calling backend service:', error);
    // Re-throw the error to be handled by the calling component
    throw error;
  }
}