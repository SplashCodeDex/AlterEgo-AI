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
const ai = new GoogleGenAI({apiKey: functions.config().gemini.key});

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
 * A secure, callable Cloud Function to transform an image using the Gemini API and apply a watermark.
 */
exports.transformImage = functions.runWith({
    timeoutSeconds: 120,
    memory: '1GB'
  }).https.onCall(async (data, context) => {
    const { imageDataUrl, prompt } = data;

    if (!imageDataUrl || !prompt) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing "imageDataUrl" or "prompt".');
    }

    const match = imageDataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!match) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid imageDataUrl format.');
    }

    const [, mimeType, base64Data] = match;

    try {
        const imagePart = { inlineData: { data: base64Data, mimeType } };
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, textPart] },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });
        
        const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

        if (!imagePartFromResponse?.inlineData) {
            console.error("No image part in Gemini response:", JSON.stringify(response));
            throw new functions.https.HttpsError('internal', 'The AI model did not return an image. The prompt may have been blocked.');
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
        throw new functions.https.HttpsError('internal', 'An error occurred while generating the image.', error.message);
    }
});


/**
 * Validates an in-app purchase receipt with Google/Apple servers.
 */
exports.validatePurchase = functions.https.onCall(async (data, context) => {
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
 * HTTP endpoint for web client (matches firebase.json routing)
 */
exports.transformImageHTTP = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const { imageDataUrl, prompt, caption } = req.body;

      if (!imageDataUrl || !prompt) {
        res.status(400).json({ error: 'Missing "imageDataUrl" or "prompt".' });
        return;
      }

      // Call the existing callable function logic
      const result = await exports.transformImage({ imageDataUrl, prompt, caption }, {});

      res.json(result);
    } catch (error) {
      console.error('HTTP endpoint error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });
});