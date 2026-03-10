import type { TreeImage } from 'src/models/TreeImage';

/**
 * Convert HTTP image URL to base64 data URL for offline support
 * With 5 second timeout per image
 */
export async function convertImageUrlToBase64(url: string): Promise<string> {
  // Already base64? Return as-is
  if (url.startsWith('data:')) {
    return url;
  }

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Image conversion timeout')), 5000);
    });

    const conversionPromise = (async () => {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`[ImageCache] Failed to fetch image: ${url}`);
        return url; // Return original URL if fetch fails
      }

      const blob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    })();

    return await Promise.race([conversionPromise, timeoutPromise]);
  } catch (error) {
    console.warn(`[ImageCache] Error converting image to base64: ${url}`, error);
    return url; // Return original URL if conversion fails
  }
}

/**
 * Convert all HTTP image URLs in TreeImage array to base64
 * Processes images in parallel (max 5 at a time)
 */
export async function convertTreeImagesToBase64(images: TreeImage[]): Promise<TreeImage[]> {
  if (images.length === 0) return [];

  const batchSize = 5;
  const converted: TreeImage[] = [];

  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);
    const convertedBatch = await Promise.all(
      batch.map(async (image) => {
        const base64Url = await convertImageUrlToBase64(image.imageurl);
        return {
          ...image,
          imageurl: base64Url,
        };
      })
    );
    converted.push(...convertedBatch);
  }

  return converted;
}
