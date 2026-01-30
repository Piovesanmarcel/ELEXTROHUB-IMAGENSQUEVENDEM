// Utility for image processing and resizing for Stability AI models

export interface ImageDimensions {
  width: number;
  height: number;
}

// Valid SDXL dimensions
const VALID_SDXL_DIMENSIONS: ImageDimensions[] = [
  { width: 1024, height: 1024 },
  { width: 1152, height: 896 },
  { width: 1216, height: 832 },
  { width: 1344, height: 768 },
  { width: 1536, height: 640 },
  { width: 640, height: 1536 },
  { width: 768, height: 1344 },
  { width: 832, height: 1216 },
  { width: 896, height: 1152 }
];

/**
 * Find the nearest valid SDXL dimension based on aspect ratio
 */
export function getNearestSDXLDimension(width: number, height: number): ImageDimensions {
  const aspectRatio = width / height;
  
  let bestMatch = VALID_SDXL_DIMENSIONS[0];
  let minDiff = Math.abs((bestMatch.width / bestMatch.height) - aspectRatio);
  
  for (const dim of VALID_SDXL_DIMENSIONS) {
    const diff = Math.abs((dim.width / dim.height) - aspectRatio);
    if (diff < minDiff) {
      minDiff = diff;
      bestMatch = dim;
    }
  }
  
  return bestMatch;
}

/**
 * Get image dimensions from a blob or base64 string
 */
export async function getImageDimensions(source: Blob | string): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      if (typeof source === 'string') {
        // Clean up object URL if created
        URL.revokeObjectURL(img.src);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    
    if (typeof source === 'string') {
      img.src = source;
    } else {
      img.src = URL.createObjectURL(source);
    }
  });
}

/**
 * Resize image to target dimensions using canvas
 */
export async function resizeImage(
  source: Blob | string,
  targetWidth: number,
  targetHeight: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Use high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw resized image
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      
      // Convert to base64
      const base64 = canvas.toDataURL('image/png', 0.95);
      
      // Clean up
      if (typeof source === 'string') {
        URL.revokeObjectURL(img.src);
      }
      
      resolve(base64);
    };
    
    img.onerror = () => reject(new Error('Failed to load image for resizing'));
    
    if (typeof source === 'string') {
      img.src = source;
    } else {
      img.src = URL.createObjectURL(source);
    }
  });
}

/**
 * Prepare image for SDXL model - resize to valid dimensions if needed
 */
export async function prepareImageForSDXL(source: Blob | string): Promise<{
  base64: string;
  originalDimensions: ImageDimensions;
  finalDimensions: ImageDimensions;
  wasResized: boolean;
}> {
  console.log('📐 [ImageUtils] Preparando imagem para SDXL...');
  
  const originalDimensions = await getImageDimensions(source);
  console.log(`📐 [ImageUtils] Dimensões originais: ${originalDimensions.width}x${originalDimensions.height}`);
  
  const validDimensions = getNearestSDXLDimension(originalDimensions.width, originalDimensions.height);
  console.log(`📐 [ImageUtils] Dimensões válidas mais próximas: ${validDimensions.width}x${validDimensions.height}`);
  
  const needsResize = 
    originalDimensions.width !== validDimensions.width || 
    originalDimensions.height !== validDimensions.height;
  
  let base64: string;
  
  if (needsResize) {
    console.log(`🔄 [ImageUtils] Redimensionando imagem...`);
    base64 = await resizeImage(source, validDimensions.width, validDimensions.height);
    console.log(`✅ [ImageUtils] Imagem redimensionada com sucesso`);
  } else {
    console.log(`✅ [ImageUtils] Dimensões já são válidas, sem necessidade de redimensionar`);
    if (typeof source === 'string') {
      base64 = source;
    } else {
      // Convert blob to base64
      const reader = new FileReader();
      base64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(source);
      });
    }
  }
  
  return {
    base64,
    originalDimensions,
    finalDimensions: validDimensions,
    wasResized: needsResize
  };
}

/**
 * Validate if image dimensions are valid for SDXL
 */
export function isValidSDXLDimension(width: number, height: number): boolean {
  return VALID_SDXL_DIMENSIONS.some(
    dim => dim.width === width && dim.height === height
  );
}
