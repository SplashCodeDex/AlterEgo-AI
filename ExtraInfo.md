The "Root Cause Analysis" provided contains an inaccuracy based on recent information about the Gemini API. The Gemini 2.5 Flash model can generate images, and the problem is elsewhere in the request.
The issue with the analysis
Incorrect model capability: Google updated the Gemini 2.5 Flash model to include image generation and editing. The analysis's premise that a text-and-vision-only model is being used for image generation is incorrect.
Response modality mismatch: The error is likely a mismatch between the requested output and the request parameters. The analysis correctly notes that the response has no image data, but the reason is incorrect.
The correct root cause
The problem is the inclusion of Modality.TEXT in the responseModalities configuration for an image generation request.
Mixed modality output: When responseModalities is set to [Modality.IMAGE, Modality.TEXT], the API expects a multimodal response.
Model behavior: Although the Gemini 2.5 Flash model can generate images from text, it was not designed to generate both images and text simultaneously in the same generateContent call. When asked to do so, it will generate the image internally but not return it, leading to the error.
How to fix the problem
Use a separate API call for each modality.
For image generation requests, set responseModalities to only include Modality.IMAGE.
javascript
const imageResponse = await ai.models.generateContent({
model: 'gemini-2.5-flash',
contents: imageGenerationContents, // Your image generation prompt
config: { responseModalities: [Modality.IMAGE] },
});
Use code with caution.