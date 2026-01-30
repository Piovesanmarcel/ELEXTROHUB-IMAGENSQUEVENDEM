import { useState, useEffect } from 'react';
import { aiImagesCache } from '@/services/AIImagesSessionCache';

export const useAIImagesCache = (productId: string, aiName: string) => {
  const [cachedImages, setCachedImages] = useState<string[]>([]);

  // Carregar imagens do cache ao montar o componente
  useEffect(() => {
    if (!productId || !aiName) return;
    
    const loaded = aiImagesCache.loadImages(productId, aiName);
    if (loaded && loaded.length > 0) {
      setCachedImages(loaded);
      console.log(`🔄 [HOOK] ${loaded.length} imagens restauradas do cache para ${aiName}`);
    }
  }, [productId, aiName]);

  // Salvar imagens no cache sempre que mudar
  const saveToCache = (images: string[]) => {
    if (images.length > 0) {
      aiImagesCache.saveImages(productId, aiName, images);
      setCachedImages(images);
    }
  };

  // Limpar cache
  const clearCache = () => {
    aiImagesCache.clearCache(productId, aiName);
    setCachedImages([]);
  };

  return {
    cachedImages,
    saveToCache,
    clearCache
  };
};
