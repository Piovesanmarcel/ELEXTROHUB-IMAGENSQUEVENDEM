import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js to always download models
env.allowLocalModels = false;
env.useBrowserCache = true;

const MAX_IMAGE_DIMENSION = 1024;

function resizeImageIfNeeded(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
      width = MAX_IMAGE_DIMENSION;
    } else {
      width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
      height = MAX_IMAGE_DIMENSION;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    return true;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0);
  return false;
}

export const loadImage = (file: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export const loadImageFromUrl = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

/**
 * Gera uma máscara automaticamente para preservar o produto principal na imagem
 * Retorna uma máscara onde o produto está em PRETO (preservar) e o fundo em BRANCO (alterar)
 */
export const generateProductMask = async (imageElement: HTMLImageElement): Promise<string> => {
  try {
    console.log('🎭 Iniciando geração de máscara automática...');
    
    const segmenter = await pipeline('image-segmentation', 'Xenova/segformer-b0-finetuned-ade-512-512', {
      device: 'webgpu',
    });
    
    // Convert HTMLImageElement to canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');
    
    // Resize image if needed and draw it to canvas
    const wasResized = resizeImageIfNeeded(canvas, ctx, imageElement);
    console.log(`🖼️ Imagem ${wasResized ? 'foi' : 'não foi'} redimensionada. Dimensões finais: ${canvas.width}x${canvas.height}`);
    
    // Get image data as base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    console.log('📸 Imagem convertida para base64');
    
    // Process the image with the segmentation model
    console.log('🧠 Processando com modelo de segmentação...');
    const result = await segmenter(imageData);
    
    console.log('📊 Resultado da segmentação:', result);
    
    if (!result || !Array.isArray(result) || result.length === 0 || !result[0].mask) {
      throw new Error('Resultado de segmentação inválido');
    }
    
    // Create mask canvas
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx = maskCanvas.getContext('2d');
    
    if (!maskCtx) throw new Error('Could not get mask canvas context');
    
    // Fill with white background (área a ser alterada)
    maskCtx.fillStyle = 'white';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    
    // Create image data for the mask
    const maskImageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const data = maskImageData.data;
    
    // Apply mask: produto em PRETO (preservar), fundo em BRANCO (alterar)
    for (let i = 0; i < result[0].mask.data.length; i++) {
      // Inverter a máscara: onde o modelo detectou objeto (1), colocar preto (preservar)
      const isProduct = result[0].mask.data[i] > 0.5; // Threshold para detectar produto
      
      if (isProduct) {
        // Produto detectado = PRETO (preservar)
        data[i * 4] = 0;     // R
        data[i * 4 + 1] = 0; // G
        data[i * 4 + 2] = 0; // B
        data[i * 4 + 3] = 255; // A
      } else {
        // Fundo = BRANCO (alterar)
        data[i * 4] = 255;   // R
        data[i * 4 + 1] = 255; // G
        data[i * 4 + 2] = 255; // B
        data[i * 4 + 3] = 255; // A
      }
    }
    
    maskCtx.putImageData(maskImageData, 0, 0);
    console.log('🎭 Máscara gerada com sucesso');
    
    // Convert mask to base64
    return maskCanvas.toDataURL('image/png', 1.0);
    
  } catch (error) {
    console.error('❌ Erro ao gerar máscara:', error);
    throw error;
  }
};

/**
 * Gera uma máscara simples baseada na remoção de background
 * Mais rápida mas menos precisa que a segmentação completa
 */
export const generateSimpleMask = async (imageElement: HTMLImageElement): Promise<string> => {
  try {
    console.log('🎭 Gerando máscara simples...');
    
    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    resizeImageIfNeeded(canvas, ctx, imageElement);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Create mask canvas
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) throw new Error('Could not get mask canvas context');
    
    // Fill with white background
    maskCtx.fillStyle = 'white';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    
    const maskImageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const maskData = maskImageData.data;
    
    // Simple background detection (white/light backgrounds)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // If pixel is close to white/light background, mark as background (white in mask)
      const brightness = (r + g + b) / 3;
      const isBackground = brightness > 240 && Math.abs(r - g) < 30 && Math.abs(g - b) < 30;
      
      if (!isBackground) {
        // Product pixel = BLACK (preserve)
        maskData[i] = 0;     // R
        maskData[i + 1] = 0; // G
        maskData[i + 2] = 0; // B
        maskData[i + 3] = 255; // A
      }
      // Background pixels remain white (change)
    }
    
    maskCtx.putImageData(maskImageData, 0, 0);
    
    console.log('✅ Máscara simples gerada');
    return maskCanvas.toDataURL('image/png', 1.0);
    
  } catch (error) {
    console.error('❌ Erro ao gerar máscara simples:', error);
    throw error;
  }
};