import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { EnhancedImage } from '@/hooks/enhancement/types';

interface CachedImageData {
  images: EnhancedImage[];
  timestamp: number;
  loading: boolean;
}

interface EnhancedImagesContextType {
  getCachedImages: (productId: string) => CachedImageData | null;
  setCachedImages: (productId: string, images: EnhancedImage[]) => void;
  setLoading: (productId: string, loading: boolean) => void;
  clearCache: () => void;
}

const EnhancedImagesContext = createContext<EnhancedImagesContextType | undefined>(undefined);

const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export const EnhancedImagesProvider = ({ children }: { children: ReactNode }) => {
  const [cache, setCache] = useState<Map<string, CachedImageData>>(new Map());

  const getCachedImages = useCallback((productId: string): CachedImageData | null => {
    const cached = cache.get(productId);
    if (!cached) return null;

    // Verificar se o cache ainda é válido
    const isValid = Date.now() - cached.timestamp < CACHE_TTL;
    if (!isValid) {
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(productId);
        return newCache;
      });
      return null;
    }

    return cached;
  }, [cache]);

  const setCachedImages = useCallback((productId: string, images: EnhancedImage[]) => {
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.set(productId, {
        images,
        timestamp: Date.now(),
        loading: false
      });
      return newCache;
    });
  }, []);

  const setLoading = useCallback((productId: string, loading: boolean) => {
    setCache(prev => {
      const newCache = new Map(prev);
      const existing = newCache.get(productId);
      newCache.set(productId, {
        images: existing?.images || [],
        timestamp: existing?.timestamp || Date.now(),
        loading
      });
      return newCache;
    });
  }, []);

  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  return (
    <EnhancedImagesContext.Provider value={{
      getCachedImages,
      setCachedImages,
      setLoading,
      clearCache
    }}>
      {children}
    </EnhancedImagesContext.Provider>
  );
};

export const useEnhancedImagesContext = () => {
  const context = useContext(EnhancedImagesContext);
  if (context === undefined) {
    throw new Error('useEnhancedImagesContext must be used within an EnhancedImagesProvider');
  }
  return context;
};