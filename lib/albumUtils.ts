/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// A simple helper to load an image and handle cross-origin issues
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.crossOrigin = 'anonymous';
        img.src = src;
    });
}

/**
 * Resizes an image from a data URL to a maximum dimension.
 * @param dataUrl The data URL of the image.
 * @param maxDimension The maximum width or height.
 * @returns A promise that resolves to the data URL of the resized image.
 */
export function resizeImage(dataUrl: string, maxDimension: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      let { width, height } = img;
      if (width > height) {
        if (width > maxDimension) {
          height = Math.round(height * (maxDimension / width));
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round(width * (maxDimension / height));
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Creates a comparison image showing the original and generated images side-by-side.
 * @param originalUrl Data URL for the original image.
 * @param generatedUrl Data URL for the generated image.
 * @param caption The caption for the generated image.
 * @returns A promise that resolves to a data URL of the comparison image.
 */
export async function createComparisonImage(originalUrl: string, generatedUrl: string, caption: string): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    const [originalImg, generatedImg] = await Promise.all([
        loadImage(originalUrl),
        loadImage(generatedUrl),
    ]);

    const imgWidth = 512;
    const imgHeight = (imgWidth / originalImg.width) * originalImg.height;
    const padding = 40;
    const labelHeight = 80;

    canvas.width = imgWidth * 2 + padding * 3;
    canvas.height = imgHeight + padding * 2 + labelHeight;

    ctx.fillStyle = '#18181B'; // zinc-900
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = '32px Inter, sans-serif';
    ctx.fillStyle = '#E5E5E5';
    ctx.textAlign = 'center';

    ctx.fillText('Original', padding + imgWidth / 2, padding + 35);
    ctx.drawImage(originalImg, padding, padding + labelHeight, imgWidth, imgHeight);

    ctx.fillText(caption, padding * 2 + imgWidth + imgWidth / 2, padding + 35);
    ctx.drawImage(generatedImg, padding * 2 + imgWidth, padding + labelHeight, imgWidth, imgHeight);

    return canvas.toDataURL('image/jpeg', 0.9);
}


/**
 * Creates a collage-style album page from multiple generated images.
 * @param imageData A record of captions to image data URLs.
 * @returns A promise that resolves to a data URL of the album image.
 */
export async function createAlbumPage(imageData: Record<string, string>): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    const images = await Promise.all(
        Object.entries(imageData).map(async ([caption, url]) => ({
            caption,
            img: await loadImage(url),
        }))
    );
    
    const numImages = images.length;
    if (numImages === 0) return '';
    
    const cols = numImages > 4 ? 3 : 2;
    const rows = Math.ceil(numImages / cols);
    const imgSize = 400;
    const padding = 50;
    const header = 150;
    const captionHeight = 60;
    const cardHeight = imgSize + captionHeight;

    canvas.width = cols * imgSize + (cols + 1) * padding;
    canvas.height = rows * cardHeight + (rows + 1) * padding + header;

    ctx.fillStyle = '#18181B';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = 'bold 48px Sora, sans-serif';
    ctx.fillText('AlterEgo AI Album', canvas.width / 2, 100);

    images.forEach(({ img, caption }, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = padding + col * (imgSize + padding);
        const y = padding + header + row * (cardHeight + padding);
        
        ctx.drawImage(img, x, y, imgSize, imgSize);
        
        ctx.font = '24px Inter, sans-serif';
        ctx.fillText(caption, x + imgSize / 2, y + imgSize + 40);
    });

    return canvas.toDataURL('image/jpeg', 0.9);
}
