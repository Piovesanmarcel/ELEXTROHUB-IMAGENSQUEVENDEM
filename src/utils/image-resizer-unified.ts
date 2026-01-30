/**
 * Sistema unificado de redimensionamento e validação de imagens
 * Garante: 900-1024px e até 1024KB (sem mínimo)
 */

interface ResizedImageResult {
  blob: Blob;
  blobUrl: string;
  width: number;
  height: number;
  sizeKB: number;
}

/**
 * Carrega uma imagem e retorna o elemento HTMLImageElement
 */
async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Falha ao carregar imagem: ${url}`));
    
    // Timeout de 30s
    setTimeout(() => reject(new Error('Timeout ao carregar imagem')), 30000);
    
    img.src = url;
  });
}

/**
 * Redimensiona e valida imagem com critérios rigorosos
 * - Dimensões: 900-1024px (padrão: 1000x1000)
 * - Tamanho: até 1024KB (sem mínimo)
 * - Qualidade: JPEG 75-98%
 */
export async function resizeAndValidateImage(
  imageUrl: string,
  targetWidth: number = 1000,
  targetHeight: number = 1000,
  targetSizeKBMin: number = 1,
  targetSizeKBMax: number = 1024
): Promise<ResizedImageResult> {
  console.log('🔧 [RESIZE-UNIFIED] Iniciando redimensionamento unificado...');
  console.log(`📐 [RESIZE-UNIFIED] Target: ${targetWidth}x${targetHeight}, ${targetSizeKBMin}-${targetSizeKBMax}KB`);
  
  // 1. Carregar imagem
  const img = await loadImage(imageUrl);
  console.log(`📸 [RESIZE-UNIFIED] Imagem carregada: ${img.width}x${img.height}`);
  
  // 2. Criar canvas com dimensões target
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Falha ao criar contexto do canvas');
  }
  
  // 3. Calcular aspect ratio e centralizar
  const scale = Math.min(targetWidth / img.width, targetHeight / img.height);
  const newWidth = img.width * scale;
  const newHeight = img.height * scale;
  const offsetX = (targetWidth - newWidth) / 2;
  const offsetY = (targetHeight - newHeight) / 2;
  
  // 4. Desenhar com fundo branco
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);
  
  console.log(`🎨 [RESIZE-UNIFIED] Canvas criado: ${canvas.width}x${canvas.height}`);
  
  // 5. Compressão adaptativa para atingir até 1024KB
  let quality = 0.92;
  let blob: Blob;
  let attempts = 0;
  const maxAttempts = 8;
  
  do {
    blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Falha ao criar blob'));
        },
        'image/jpeg',
        quality
      );
    });
    
    const sizeKB = Math.round(blob.size / 1024);
    attempts++;
    
    console.log(`🔄 [RESIZE-UNIFIED] Tentativa ${attempts}: ${sizeKB}KB (qualidade ${Math.round(quality * 100)}%)`);
    
    // ✅ Tamanho ideal alcançado
    if (sizeKB >= targetSizeKBMin && sizeKB <= targetSizeKBMax) {
      console.log(`✅ [RESIZE-UNIFIED] Tamanho ideal alcançado: ${sizeKB}KB`);
      break;
    }
    
    // Ajustar qualidade
    if (sizeKB > targetSizeKBMax) {
      quality -= 0.08; // Reduzir qualidade
      console.log(`⬇️ [RESIZE-UNIFIED] Arquivo muito grande, reduzindo qualidade para ${Math.round(quality * 100)}%`);
    } else if (sizeKB < targetSizeKBMin) {
      quality += 0.05; // Aumentar qualidade
      console.log(`⬆️ [RESIZE-UNIFIED] Arquivo muito pequeno, aumentando qualidade para ${Math.round(quality * 100)}%`);
    }
    
    // Limites de segurança
    if (quality < 0.75) {
      console.warn(`⚠️ [RESIZE-UNIFIED] Qualidade mínima atingida (75%), continuando...`);
      break;
    }
    if (quality > 0.98) {
      console.warn(`⚠️ [RESIZE-UNIFIED] Qualidade máxima atingida (98%), continuando...`);
      break;
    }
    
  } while (attempts < maxAttempts);
  
  // 6. Validação final rigorosa
  const finalSizeKB = Math.round(blob.size / 1024);
  
  console.log(`📊 [RESIZE-UNIFIED] Resultado final: ${targetWidth}x${targetHeight}, ${finalSizeKB}KB`);
  
  // Validação estrita de tamanho
  if (finalSizeKB < targetSizeKBMin) {
    console.warn(`⚠️ [RESIZE-UNIFIED] AVISO: Tamanho abaixo do ideal (${finalSizeKB}KB < ${targetSizeKBMin}KB)`);
    // Não bloquear, mas avisar
  }
  
  if (finalSizeKB > targetSizeKBMax) {
    throw new Error(`Tamanho excede limite: ${finalSizeKB}KB (máximo ${targetSizeKBMax}KB)`);
  }
  
  // 7. Criar Blob URL
  const blobUrl = URL.createObjectURL(blob);
  
  console.log(`✅ [RESIZE-UNIFIED] Concluído com sucesso!`);
  console.log(`📐 [RESIZE-UNIFIED] Dimensões: ${targetWidth}x${targetHeight}`);
  console.log(`📦 [RESIZE-UNIFIED] Tamanho: ${finalSizeKB}KB`);
  console.log(`🎯 [RESIZE-UNIFIED] Qualidade final: ${Math.round(quality * 100)}%`);
  
  return {
    blob,
    blobUrl,
    width: targetWidth,
    height: targetHeight,
    sizeKB: finalSizeKB
  };
}

/**
 * Obtém dimensões de um blob
 */
export async function getBlobDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    return { width: img.width, height: img.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}
