/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * Adds a subtle watermark to an image.
 * @param imageDataUrl The data URL of the image to watermark.
 * @returns A promise that resolves with the data URL of the watermarked image.
 */
export function addWatermark(imageDataUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }

            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0);

            // Watermark settings
            const fontSize = Math.max(12, Math.floor(img.width / 50));
            ctx.font = `bold ${fontSize}px Sora, sans-serif`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            
            // Add a subtle shadow for better visibility
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 5;

            ctx.fillText('AlterEgo AI', canvas.width - 15, canvas.height - 15);

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (err) => {
            reject(err);
        };
        img.crossOrigin = 'anonymous';
        img.src = imageDataUrl;
    });
}
