/**
 * Image Compression for N8N Webhooks
 * Reduces image size before sending to optimize bandwidth and processing time
 */

export interface CompressionOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'jpeg' | 'webp';
}

export interface CompressedImage {
  base64: string;
  mimeType: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.8,
  format: 'jpeg'
};

/**
 * Compress a base64 image to target dimensions and quality
 */
export const compressBase64Image = async (
  base64Input: string,
  options: Partial<CompressionOptions> = {}
): Promise<CompressedImage> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      try {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        
        if (width > opts.maxWidth || height > opts.maxHeight) {
          const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Enable high quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to compressed format
        const mimeType = opts.format === 'webp' ? 'image/webp' : 'image/jpeg';
        const compressedDataUrl = canvas.toDataURL(mimeType, opts.quality);
        
        // Extract base64 without prefix
        const compressedBase64 = compressedDataUrl.split(',')[1];
        
        // Calculate sizes
        const originalSize = base64Input.length * 0.75; // Approximate bytes
        const compressedSize = compressedBase64.length * 0.75;
        const compressionRatio = originalSize > 0 
          ? Math.round((1 - compressedSize / originalSize) * 100) 
          : 0;

        console.log(`[Compression] ${(originalSize/1024).toFixed(1)}KB → ${(compressedSize/1024).toFixed(1)}KB (${compressionRatio}% reduction)`);

        resolve({
          base64: compressedBase64,
          mimeType,
          originalSize: Math.round(originalSize),
          compressedSize: Math.round(compressedSize),
          compressionRatio,
          width,
          height
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image for compression'));

    // Handle both raw base64 and data URL formats
    if (base64Input.startsWith('data:')) {
      img.src = base64Input;
    } else {
      img.src = `data:image/png;base64,${base64Input}`;
    }
  });
};

/**
 * Compress multiple images in parallel
 */
export const compressMultipleImages = async (
  images: Array<{ base64: string; filename?: string }>,
  options: Partial<CompressionOptions> = {}
): Promise<Array<CompressedImage & { filename?: string }>> => {
  console.log(`[Compression] Compressing ${images.length} images...`);
  
  const results = await Promise.all(
    images.map(async (img) => {
      try {
        const compressed = await compressBase64Image(img.base64, options);
        return { ...compressed, filename: img.filename };
      } catch (err) {
        console.error(`[Compression] Failed to compress image:`, err);
        // Return original on failure
        return {
          base64: img.base64,
          mimeType: 'image/png',
          originalSize: img.base64.length * 0.75,
          compressedSize: img.base64.length * 0.75,
          compressionRatio: 0,
          width: 0,
          height: 0,
          filename: img.filename
        };
      }
    })
  );

  const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalCompressed = results.reduce((sum, r) => sum + r.compressedSize, 0);
  const totalRatio = totalOriginal > 0 
    ? Math.round((1 - totalCompressed / totalOriginal) * 100) 
    : 0;

  console.log(`[Compression] Total: ${(totalOriginal/1024/1024).toFixed(2)}MB → ${(totalCompressed/1024/1024).toFixed(2)}MB (${totalRatio}% reduction)`);

  return results;
};

/**
 * Check if image needs compression based on size threshold
 */
export const needsCompression = (base64: string, thresholdKB: number = 500): boolean => {
  const sizeKB = (base64.length * 0.75) / 1024;
  return sizeKB > thresholdKB;
};

/**
 * Get estimated size of base64 string in KB
 */
export const getBase64SizeKB = (base64: string): number => {
  return Math.round((base64.length * 0.75) / 1024);
};
