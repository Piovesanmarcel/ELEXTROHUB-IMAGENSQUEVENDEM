/**
 * Normaliza os dados do evento imageGenerated para garantir consistência
 * Aceita tanto images[] quanto imageUrl e converte para images[]
 */

export interface NormalizedImageEvent {
  source: string;
  images: string[];
  productId: string;
  batchId?: string;
  aiOrigin?: string;
  originalSource?: string;
  generatorType?: string;
  processingOrder?: number;
}

export interface RawImageEventDetail {
  source?: string;
  images?: string[];
  imageUrl?: string;
  productId?: string;
  batchId?: string;
  aiOrigin?: string;
  originalSource?: string;
  generatorType?: string;
  processingOrder?: number;
  [key: string]: any;
}

/**
 * Normaliza o detail de um evento imageGenerated
 * @param detail - O event.detail do CustomEvent
 * @returns Objeto normalizado com images[] garantido ou null se inválido
 */
export function normalizeImageGenerated(detail: RawImageEventDetail): NormalizedImageEvent | null {
  if (!detail) {
    console.warn('⚠️ [NORMALIZE] Event detail vazio');
    return null;
  }

  const { source, images, imageUrl, productId, batchId, aiOrigin, originalSource, generatorType, processingOrder } = detail;

  // Validar source e productId
  if (!source || !productId) {
    console.warn('⚠️ [NORMALIZE] Evento sem source ou productId:', { source, productId });
    return null;
  }

  // Normalizar images: aceitar images[] OU imageUrl
  let normalizedImages: string[] = [];
  
  if (images && Array.isArray(images) && images.length > 0) {
    normalizedImages = images.filter(url => typeof url === 'string' && url.length > 10);
  } else if (imageUrl && typeof imageUrl === 'string' && imageUrl.length > 10) {
    normalizedImages = [imageUrl];
  }

  if (normalizedImages.length === 0) {
    console.warn('⚠️ [NORMALIZE] Evento sem imagens válidas:', { source, hasImages: !!images, hasImageUrl: !!imageUrl });
    return null;
  }

  console.log(`✅ [NORMALIZE] Evento normalizado: source=${source}, images=${normalizedImages.length}`);

  return {
    source,
    images: normalizedImages,
    productId,
    batchId,
    aiOrigin,
    originalSource,
    generatorType,
    processingOrder
  };
}

/**
 * Cria um CustomEvent de imageGenerated padronizado
 */
export function createImageGeneratedEvent(data: NormalizedImageEvent): CustomEvent {
  return new CustomEvent('imageGenerated', {
    detail: {
      ...data,
      timestamp: Date.now()
    }
  });
}
