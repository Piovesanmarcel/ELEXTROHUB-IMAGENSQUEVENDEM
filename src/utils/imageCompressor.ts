/**
 * Image Compressor for AI Processing
 * 
 * Compresses images to optimal size for AI models while maintaining quality.
 * Target: 200-400KB per image with adaptive JPEG compression.
 */

export interface CompressionResult {
  originalUrl: string;
  compressedUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

export interface BatchCompressionResult {
  compressedUrls: string[];
  results: CompressionResult[];
  totalOriginalSize: number;
  totalCompressedSize: number;
  compressionRatio: number;
  processingTime: number;
}

/**
 * Load image with timeout and error handling
 * Adaptive CORS strategy based on URL type
 */
const loadImage = (url: string, timeout = 30000): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Adaptive CORS strategy
    if (url.includes(window.location.hostname)) {
      // Same origin - no crossOrigin needed
      console.log('🔓 Loading same-origin image (no CORS)');
      img.crossOrigin = undefined;
    } else if (url.startsWith('data:') || url.startsWith('blob:')) {
      // Base64 or Blob - no crossOrigin needed
      console.log('🔓 Loading data/blob URL (no CORS)');
      img.crossOrigin = undefined;
    } else {
      // Different origin - use anonymous
      console.log('🌐 Loading cross-origin image (CORS anonymous)');
      img.crossOrigin = 'anonymous';
    }
    
    const timeoutId = setTimeout(() => {
      console.error(`⏱️ Image load timeout after ${timeout}ms:`, url.substring(0, 100));
      reject(new Error(`Image load timeout after ${timeout}ms: ${url.substring(0, 100)}`));
    }, timeout);

    img.onload = () => {
      clearTimeout(timeoutId);
      console.log('✅ Image loaded successfully:', url.substring(0, 100));
      resolve(img);
    };

    img.onerror = (error) => {
      clearTimeout(timeoutId);
      console.error('❌ Image load error:', {
        url: url.substring(0, 100),
        error
      });
      reject(new Error(`Failed to load image: ${url.substring(0, 100)}`));
    };

    console.log('📥 Starting image load:', url.substring(0, 100));
    img.src = url;
  });
};

/**
 * Compress a single image to target size
 */
const compressImage = async (
  imageUrl: string,
  targetWidth = 800,
  targetHeight = 800,
  minQuality = 0.70,
  maxQuality = 0.85,
  targetSizeKB = 300
): Promise<CompressionResult> => {
  const startTime = Date.now();
  
  console.log(`🗜️ Comprimindo imagem: ${imageUrl.substring(0, 50)}...`);
  
  // Get original size (approximate for URLs)
  let originalSize = 0;
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    originalSize = blob.size;
  } catch (error) {
    console.warn('Não foi possível obter tamanho original, estimando...');
    originalSize = imageUrl.length * 0.75; // Estimate for base64
  }

  // Load image
  const img = await loadImage(imageUrl);
  
  // Create canvas with target dimensions
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Calculate scaling to maintain aspect ratio
  const scale = Math.min(targetWidth / img.width, targetHeight / img.height);
  const scaledWidth = Math.round(img.width * scale);
  const scaledHeight = Math.round(img.height * scale);

  canvas.width = scaledWidth;
  canvas.height = scaledHeight;

  // Draw image with high quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

  // Adaptive compression - try to hit target size
  let quality = maxQuality;
  let compressedDataUrl = '';
  let compressedSize = 0;
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
    compressedSize = compressedDataUrl.length * 0.75; // Approximate size in bytes
    
    // If we're within target or at minimum quality, stop
    if (compressedSize <= targetSizeKB * 1024 || quality <= minQuality) {
      break;
    }
    
    // Reduce quality for next attempt
    quality = Math.max(minQuality, quality - 0.1);
    attempts++;
  }

  const processingTime = Date.now() - startTime;
  const compressionRatio = originalSize > 0 ? (1 - compressedSize / originalSize) * 100 : 0;

  console.log(`✅ Compressão concluída em ${processingTime}ms:`, {
    dimensions: `${img.width}x${img.height} → ${scaledWidth}x${scaledHeight}`,
    size: `${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB`,
    ratio: `${compressionRatio.toFixed(1)}%`,
    quality: quality.toFixed(2)
  });

  return {
    originalUrl: imageUrl,
    compressedUrl: compressedDataUrl,
    originalSize: Math.round(originalSize),
    compressedSize: Math.round(compressedSize),
    compressionRatio: Math.round(compressionRatio * 10) / 10
  };
};

/**
 * Compress multiple images in parallel
 */
export const compressImagesForAI = async (
  imageUrls: string[],
  targetWidth = 800,
  targetHeight = 800,
  targetSizeKB = 300
): Promise<BatchCompressionResult> => {
  const startTime = Date.now();
  
  if (imageUrls.length === 0) {
    return {
      compressedUrls: [],
      results: [],
      totalOriginalSize: 0,
      totalCompressedSize: 0,
      compressionRatio: 0,
      processingTime: 0
    };
  }

  console.log(`🚀 Iniciando compressão de ${imageUrls.length} imagens em paralelo...`);

  // Compress all images in parallel
  const results = await Promise.all(
    imageUrls.map(url => compressImage(url, targetWidth, targetHeight, 0.70, 0.85, targetSizeKB))
  );

  const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalCompressedSize = results.reduce((sum, r) => sum + r.compressedSize, 0);
  const compressionRatio = totalOriginalSize > 0 
    ? (1 - totalCompressedSize / totalOriginalSize) * 100 
    : 0;
  const processingTime = Date.now() - startTime;

  console.log(`✅ Compressão em lote concluída em ${(processingTime / 1000).toFixed(2)}s:`, {
    images: imageUrls.length,
    totalOriginal: `${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB`,
    totalCompressed: `${(totalCompressedSize / 1024 / 1024).toFixed(2)}MB`,
    ratio: `${compressionRatio.toFixed(1)}%`,
    avgPerImage: `${(totalCompressedSize / imageUrls.length / 1024).toFixed(1)}KB`
  });

  return {
    compressedUrls: results.map(r => r.compressedUrl),
    results,
    totalOriginalSize: Math.round(totalOriginalSize),
    totalCompressedSize: Math.round(totalCompressedSize),
    compressionRatio: Math.round(compressionRatio * 10) / 10,
    processingTime
  };
};

/**
 * Estimate payload size reduction
 */
export const estimatePayloadReduction = (
  imageCount: number,
  avgImageSizeKB = 3000
): { before: string; after: string; savings: string } => {
  const beforeKB = imageCount * avgImageSizeKB;
  const afterKB = imageCount * 300; // Target 300KB per image
  const savingsKB = beforeKB - afterKB;

  const format = (kb: number) => {
    if (kb > 1024) return `${(kb / 1024).toFixed(1)}MB`;
    return `${kb.toFixed(0)}KB`;
  };

  return {
    before: format(beforeKB),
    after: format(afterKB),
    savings: format(savingsKB)
  };
};
