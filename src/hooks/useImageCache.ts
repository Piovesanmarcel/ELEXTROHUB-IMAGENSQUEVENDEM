import { useState, useCallback, useEffect } from 'react';

interface CachedImage {
  imageUrl: string;
  mimeType: string;
  productName: string;
  sceneType: string;
  cachedAt: number;
  expiresAt: number;
}

interface ImageCacheStore {
  [key: string]: CachedImage;
}

const CACHE_KEY = 'n8n_image_cache';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 horas

export const useImageCache = () => {
  const [cacheStats, setCacheStats] = useState({ hits: 0, misses: 0, size: 0 });

  // Carregar cache do localStorage
  const getCache = useCallback((): ImageCacheStore => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  }, []);

  // Salvar cache no localStorage
  const saveCache = useCallback((cache: ImageCacheStore) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (err) {
      console.warn('[ImageCache] Erro ao salvar cache:', err);
    }
  }, []);

  // Gerar chave única para produto+sceneType
  const getCacheKey = useCallback((productName: string, sceneType: string): string => {
    return `${productName.toLowerCase().replace(/\s+/g, '_')}_${sceneType}`;
  }, []);

  // Verificar se existe no cache
  const hasCached = useCallback((productName: string, sceneType: string): boolean => {
    const cache = getCache();
    const key = getCacheKey(productName, sceneType);
    const item = cache[key];
    
    if (!item) {
      setCacheStats(prev => ({ ...prev, misses: prev.misses + 1 }));
      return false;
    }

    // Verificar expiração
    if (Date.now() > item.expiresAt) {
      delete cache[key];
      saveCache(cache);
      setCacheStats(prev => ({ ...prev, misses: prev.misses + 1 }));
      return false;
    }

    setCacheStats(prev => ({ ...prev, hits: prev.hits + 1 }));
    return true;
  }, [getCache, getCacheKey, saveCache]);

  // Obter imagem do cache
  const getCachedImage = useCallback((productName: string, sceneType: string): CachedImage | null => {
    const cache = getCache();
    const key = getCacheKey(productName, sceneType);
    const item = cache[key];

    if (!item || Date.now() > item.expiresAt) {
      return null;
    }

    return item;
  }, [getCache, getCacheKey]);

  // Salvar imagem no cache
  const cacheImage = useCallback((
    productName: string,
    sceneType: string,
    imageUrl: string,
    mimeType: string = 'image/png'
  ): void => {
    const cache = getCache();
    const key = getCacheKey(productName, sceneType);
    const now = Date.now();

    cache[key] = {
      imageUrl,
      mimeType,
      productName,
      sceneType,
      cachedAt: now,
      expiresAt: now + CACHE_DURATION_MS
    };

    saveCache(cache);
    console.log(`[ImageCache] Imagem cacheada: ${key}`);
  }, [getCache, getCacheKey, saveCache]);

  // Limpar cache expirado
  const cleanExpiredCache = useCallback((): number => {
    const cache = getCache();
    const now = Date.now();
    let removed = 0;

    Object.keys(cache).forEach(key => {
      if (cache[key].expiresAt < now) {
        delete cache[key];
        removed++;
      }
    });

    if (removed > 0) {
      saveCache(cache);
      console.log(`[ImageCache] ${removed} itens expirados removidos`);
    }

    return removed;
  }, [getCache, saveCache]);

  // Limpar todo o cache
  const clearCache = useCallback((): void => {
    localStorage.removeItem(CACHE_KEY);
    console.log('[ImageCache] Cache limpo');
  }, []);

  // Obter estatísticas do cache
  const getCacheSize = useCallback((): number => {
    const cache = getCache();
    return Object.keys(cache).length;
  }, [getCache]);

  // Listar todos os itens no cache
  const listCachedItems = useCallback((): CachedImage[] => {
    const cache = getCache();
    return Object.values(cache).filter(item => item.expiresAt > Date.now());
  }, [getCache]);

  // Limpar cache expirado ao montar
  useEffect(() => {
    cleanExpiredCache();
    setCacheStats(prev => ({ ...prev, size: getCacheSize() }));
  }, [cleanExpiredCache, getCacheSize]);

  return {
    cacheStats,
    hasCached,
    getCachedImage,
    cacheImage,
    cleanExpiredCache,
    clearCache,
    getCacheSize,
    listCachedItems
  };
};
