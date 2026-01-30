import { useEffect, useRef } from 'react';

/**
 * Hook para pré-carregar imagens antes de serem necessárias
 * Usa prefetch para carregar em background sem bloquear a UI
 */
export const useImagePrefetch = (
  imageUrls: string[], 
  prefetchCount: number = 8
) => {
  const prefetchedUrls = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!imageUrls?.length) return;

    // Pegar as primeiras N imagens que ainda não foram prefetched
    const urlsToPrefetch = imageUrls
      .filter(url => url && !prefetchedUrls.current.has(url))
      .slice(0, prefetchCount);

    urlsToPrefetch.forEach(url => {
      // Marcar como prefetched
      prefetchedUrls.current.add(url);

      // Criar link de prefetch
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'image';
      link.href = url;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    // Cleanup: remover links após 30 segundos para não acumular
    const cleanup = setTimeout(() => {
      const links = document.querySelectorAll('link[rel="prefetch"][as="image"]');
      links.forEach(link => link.remove());
    }, 30000);

    return () => clearTimeout(cleanup);
  }, [imageUrls, prefetchCount]);

  // Método para forçar prefetch de URLs específicas
  const prefetchImages = (urls: string[]) => {
    urls.forEach(url => {
      if (!url || prefetchedUrls.current.has(url)) return;
      
      prefetchedUrls.current.add(url);
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
    });
  };

  return { prefetchImages };
};
