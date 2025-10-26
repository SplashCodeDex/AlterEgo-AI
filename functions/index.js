/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
const functions = require("firebase-functions");
const { GoogleGenAI, Modality } = require("@google/genai");
const Jimp = require("jimp");
const { GoogleAuth } = require("google-auth-library");
const cors = require("cors");

// Initialize Firebase Admin SDK
const admin = require("firebase-admin");
admin.initializeApp();

// Initialize the Google GenAI client with the API key stored in Firebase config
// Fallback to process.env for local development
const geminiApiKey = functions.config().gemini?.key || process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
    console.error("Gemini API key is not configured. Please set gemini.key in Firebase config or GEMINI_API_KEY in environment variables.");
}
const ai = new GoogleGenAI({apiKey: geminiApiKey});

/**
 * Applies a watermark to an image buffer.
 * @param {Buffer} imageBuffer The buffer of the image to watermark.
 * @return {Promise<string>} A promise that resolves with the base64 data URL of the watermarked image.
 */
async function applyWatermark(imageBuffer) {
    const image = await Jimp.read(imageBuffer);
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE); // Using a larger font for clarity
    
    const text = "AlterEgo AI";
    const textWidth = Jimp.measureText(font, text);
    const textHeight = Jimp.measureTextHeight(font, text);
    
    // Position watermark at the bottom right with padding
    const x = image.bitmap.width - textWidth - 20;
    const y = image.bitmap.height - textHeight - 20;

    image.print(font, x, y, text);
    
    return image.getBase64Async(Jimp.MIME_PNG);
}


/**
 * The core logic for transforming an image using the Gemini API and applying a watermark.
 * This is a regular async function, not a Cloud Function trigger.
 * @param {string} imageDataUrl The base64 data URL of the image to transform.
 * @param {string} prompt The text prompt to guide the transformation.
 * @return {Promise<{success: boolean, imageDataUrl: string}>} A promise that resolves with the result.
 */
async function _transformImageLogic(imageDataUrl, prompt) {
    if (!imageDataUrl || !prompt) {
        throw new Error('Missing "imageDataUrl" or "prompt".');
    }

    const match = imageDataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!match) {
        throw new Error('Invalid imageDataUrl format.');
    }

    const [, mimeType, base64Data] = match;

    try {
        const imagePart = { inlineData: { data: base64Data, mimeType } };
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: { parts: [imagePart, {text: prompt}] },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });
        
        const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

        if (!imagePartFromResponse?.inlineData) {
            console.error("No image part in Gemini response:", JSON.stringify(response));
             throw new Error('The AI model did not return an image. The prompt may have been blocked.');
        }
        
        const resultBase64Data = imagePartFromResponse.inlineData.data;
        const imageBuffer = Buffer.from(resultBase64Data, 'base64');
        
        // Apply watermark before sending to client
        const watermarkedImageDataUrl = await applyWatermark(imageBuffer);

        return {
            success: true,
            imageDataUrl: watermarkedImageDataUrl,
        };

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        // Re-throw the error to be caught by the calling Cloud Function
        throw error;
    }
}


/**
 * A secure, callable Cloud Function to transform an image.
 * This is for the mobile client.
 */
exports.transformImage = functions.runWith({
    timeoutSeconds: 120,
    memory: '1GB',
    enforceAppCheck: true, // Enforce App Check
  }).https.onCall(async (data, context) => {
    // App Check validation is handled automatically by the 'enforceAppCheck' option.
    // The authentication check below is now redundant if you only want to allow authenticated users *from your app*.
    // If you want to allow *any* authenticated Firebase user (not just from your app), you can keep it.
    // For this use case (protecting a public API), we will remove it and rely on App Check.
    /*
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    */
    try {
        return await _transformImageLogic(data.imageDataUrl, data.prompt);
    } catch (error) {
        // Log the error and throw a specific HttpsError for the client
        console.error("Error in transformImage (onCall):", error);
        throw new functions.https.HttpsError('internal', error.message, error.details);
    }
});


/**
 * Validates an in-app purchase receipt with Google/Apple servers.
 */
exports.validatePurchase = functions.runWith({ enforceAppCheck: true }).https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const { receipt, token, productId, platform } = data;

    if (platform === 'android') {
        if (!token || !productId) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing purchase token or product ID for Android validation.');
        }

        try {
            const auth = new GoogleAuth({
                scopes: 'https://www.googleapis.com/auth/androidpublisher',
            });
            const authClient = await auth.getClient();
            const packageName = 'com.alterego.native'; // Replace with your actual package name

            const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/products/${productId}/tokens/${token}`;
            
            const res = await authClient.request({ url });

            // If purchaseState is 0, it's pending. If 1, it's purchased. If 2, it's cancelled.
            if (res.data && res.data.purchaseState === 1) {
                return { success: true, message: 'Purchase validated successfully.' };
            } else {
                throw new Error('Purchase not valid or has been consumed.');
            }
        } catch (error) {
            console.error('Android receipt validation error:', error.response?.data?.error || error.message);
            throw new functions.https.HttpsError('internal', 'Failed to validate Android purchase.');
        }
    } else if (platform === 'ios') {
        // iOS validation is more complex and uses a different endpoint.
        // This is a placeholder for the logic.
        if (!receipt) {
             throw new functions.https.HttpsError('invalid-argument', 'Missing receipt for iOS validation.');
        }
        // In a real app, you would post to Apple's verifyReceipt endpoint here.
        console.log("iOS validation placeholder. In production, validate receipt with Apple.");
        return { success: true, message: 'iOS purchase validated (placeholder).' };
    }

    throw new functions.https.HttpsError('invalid-argument', 'Unsupported platform for validation.');
});

// CORS configuration for HTTP endpoints
const corsHandler = cors({
  origin: true, // Allow all origins in development
  credentials: true
});

/**
 * HTTP endpoint for the web client.
 */
exports.transformImageHTTP = functions.https.onRequest((req, res) => {
    // Handle CORS preflight requests
    corsHandler(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        const clientApiKey = req.headers['x-api-key'];
        const storedApiKey = functions.config().api.key;

        if (!clientApiKey || clientApiKey !== storedApiKey) {
            console.warn('Unauthorized access attempt: Invalid or missing API key.');
            return res.status(403).send('Unauthorized');
        }

        try {
            const { imageDataUrl, prompt } = req.body;

            // Use the shared logic
            const result = await _transformImageLogic(imageDataUrl, prompt);

            return res.status(200).json(result);

        } catch (error) {
            console.error('Error in transformImageHTTP (onRequest):', error);
            // Check if the error is a known type to provide a more specific status code
            if (error.message.includes('Missing') || error.message.includes('Invalid')) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: 'An internal error occurred.' });
        }
    });
});