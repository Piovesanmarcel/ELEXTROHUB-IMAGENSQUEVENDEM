/**
 * WhiteBackgroundBridge - Sistema Global de Cache para Imagens White-Background
 * 
 * Este módulo intercepta e armazena todas as imagens white-background geradas,
 * garantindo que elas estejam disponíveis mesmo quando a Galeria IA não estiver montada.
 */

import { convertImagesToBlob, filterStorableUrls, clearOldImageCaches } from '@/utils/blobUrlConverter';

// Fontes de imagens white-background que devemos cachear
const WHITE_BACKGROUND_SOURCES = [
  'bfl-white-bg',
  'gemini-white-background',
  'Fundo',
  'Scale',
  'runware',
  'runware-upscale',
  'cloudinary-kit',
  'tongyi-wanxiang'
] as const;

// Cache global em memória (por productId)
const imageCache = new Map<string, string[]>();

// Chave para sessionStorage
const getStorageKey = (productId: string) => `wb:${productId}`;

/**
 * Carrega imagens do cache (memória + sessionStorage)
 */
const loadFromCache = (productId: string): string[] => {
  // 1. Tentar cache em memória primeiro
  if (imageCache.has(productId)) {
    const cached = imageCache.get(productId)!;
    console.log(`💾 [WB-BRIDGE] Cache em memória: ${cached.length} imagens para ${productId}`);
    return cached;
  }

  // 2. Tentar sessionStorage como fallback
  try {
    const stored = sessionStorage.getItem(getStorageKey(productId));
    if (stored) {
      const images = JSON.parse(stored) as string[];
      console.log(`💾 [WB-BRIDGE] SessionStorage: ${images.length} imagens para ${productId}`);
      imageCache.set(productId, images); // Sincronizar com memória
      return images;
    }
  } catch (error) {
    console.error('❌ [WB-BRIDGE] Erro ao ler sessionStorage:', error);
  }

  return [];
};

/**
 * Salva imagens no cache (memória + sessionStorage)
 * ✅ Converte Base64 para Blob URLs antes de salvar
 */
const saveToCache = (productId: string, images: string[]) => {
  // ✅ Converter Base64 para Blob URLs
  const blobImages = convertImagesToBlob(images);
  
  // Remover duplicatas
  const uniqueImages = [...new Set(blobImages)];
  
  // Salvar em memória (pode conter Blob URLs)
  imageCache.set(productId, uniqueImages);
  
  // ✅ Filtrar apenas URLs válidas para sessionStorage (não base64)
  const storableUrls = filterStorableUrls(uniqueImages);
  
  if (storableUrls.length === 0) {
    console.log(`⚠️ [WB-BRIDGE] Nenhuma URL válida para persistir, mantendo apenas em memória`);
    return;
  }
  
  // Salvar em sessionStorage (persistência entre navegações)
  try {
    sessionStorage.setItem(getStorageKey(productId), JSON.stringify(storableUrls));
    console.log(`💾 [WB-BRIDGE] Salvou ${storableUrls.length} URLs no cache para ${productId}`);
  } catch (error: any) {
    if (error.name === 'QuotaExceededError') {
      console.warn('⚠️ [WB-BRIDGE] Quota excedida, limpando caches antigos...');
      clearOldImageCaches();
      // Tentar novamente com menos imagens
      try {
        const minimalUrls = storableUrls.slice(-10);
        sessionStorage.setItem(getStorageKey(productId), JSON.stringify(minimalUrls));
      } catch {
        console.error('❌ [WB-BRIDGE] Falha ao salvar mesmo após limpeza');
      }
    } else {
      console.error('❌ [WB-BRIDGE] Erro ao salvar no sessionStorage:', error);
    }
  }
};

/**
 * Adiciona novas imagens ao cache existente
 */
const addToCache = (productId: string, newImages: string[]) => {
  const existing = loadFromCache(productId);
  const combined = [...existing, ...newImages];
  saveToCache(productId, combined);
};

/**
 * Handler para o evento "imageGenerated" - detecta e cacheia white-background
 */
const handleImageGenerated = (event: Event) => {
  const customEvent = event as CustomEvent;
  const { source, images, productId } = customEvent.detail || {};

  // Verificar se é uma fonte white-background
  if (!source || !WHITE_BACKGROUND_SOURCES.includes(source)) {
    return;
  }

  if (!productId || !images || !Array.isArray(images) || images.length === 0) {
    return;
  }

  console.log(`🤍 [WB-BRIDGE] Detectadas ${images.length} imagens white-background de '${source}' para ${productId}`);
  addToCache(productId, images);
};

/**
 * Handler para o evento "geminiWhiteBackgroundToKit" - copia diretamente para o cache
 */
const handleGeminiWhiteBackground = (event: Event) => {
  const customEvent = event as CustomEvent;
  const { productId, images } = customEvent.detail || {};

  if (!productId || !images || !Array.isArray(images) || images.length === 0) {
    return;
  }

  console.log(`🤍 [WB-BRIDGE] Detectadas ${images.length} imagens Gemini white-background para ${productId}`);
  addToCache(productId, images);
};

/**
 * Handler para "requestWhiteBackgroundFromGallery" - responde com o cache
 */
const handleSnapshotRequest = (event: Event) => {
  const customEvent = event as CustomEvent;
  const { productId } = customEvent.detail || {};

  if (!productId) {
    console.warn('⚠️ [WB-BRIDGE] Snapshot solicitado sem productId');
    return;
  }

  console.log(`📨 [WB-BRIDGE] Snapshot solicitado para ${productId}`);

  // Carregar do cache
  const images = loadFromCache(productId);

  if (images.length === 0) {
    console.log(`⚠️ [WB-BRIDGE] Nenhuma imagem white-background em cache para ${productId}`);
    return;
  }

  // Disparar evento de resposta
  console.log(`📤 [WB-BRIDGE] Enviando ${images.length} imagens white-background para ${productId}`);
  
  window.dispatchEvent(new CustomEvent('whiteBackgroundGalleryToKit', {
    detail: {
      source: 'gallery-white-background',
      images,
      productId
    }
  }));
};

// ============= INICIALIZAÇÃO DO BRIDGE =============

console.log('🌉 [WB-BRIDGE] Inicializando WhiteBackgroundBridge...');

// Registrar listeners globais
window.addEventListener('imageGenerated', handleImageGenerated);
window.addEventListener('geminiWhiteBackgroundToKit', handleGeminiWhiteBackground);
window.addEventListener('requestWhiteBackgroundFromGallery', handleSnapshotRequest);

console.log('✅ [WB-BRIDGE] WhiteBackgroundBridge ativo e pronto!');

// Exportar funções para uso direto (opcional)
export const WhiteBackgroundBridge = {
  loadFromCache,
  saveToCache,
  addToCache,
  getStorageKey
};
