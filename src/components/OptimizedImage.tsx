import { useState, useEffect, useRef, memo } from 'react';
import { Package } from 'lucide-react';
import { getProxiedUrl } from '@/lib/imageProxy';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  priority?: boolean;
}

export const OptimizedImage = memo(({ 
  src, 
  alt, 
  className = "", 
  fallbackClassName = "",
  priority = false 
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (priority) return; // Skip observer para imagens prioritárias

    const currentImgRef = imgRef.current;
    if (!currentImgRef) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.unobserve(currentImgRef);
          }
        });
      },
      {
        rootMargin: '300px', // Carregar 300px antes de aparecer (mais antecipação)
        threshold: 0.01
      }
    );

    observerRef.current.observe(currentImgRef);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority]);

  // Preload para imagens prioritárias
  const proxiedSrc = getProxiedUrl(src);

  useEffect(() => {
    if (priority && proxiedSrc && !hasError) {
      const img = new Image();
      img.onload = () => setIsLoaded(true);
      img.onerror = () => setHasError(true);
      img.src = proxiedSrc;
    }
  }, [proxiedSrc, priority, hasError]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  if (!isInView && !priority) {
    return (
      <div 
        ref={imgRef}
        className={`${className} bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse flex items-center justify-center`}
      >
        <Package className="h-8 w-8 text-gray-400" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`${fallbackClassName || className} bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center`}>
        <Package className="h-16 w-16 text-purple-400" />
      </div>
    );
  }

  return (
    <div className="relative">
      {!isLoaded && (
        <div className={`absolute inset-0 ${className} bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse flex items-center justify-center`}>
          <Package className="h-8 w-8 text-gray-400" />
        </div>
      )}
      <img
        ref={!priority ? imgRef : undefined}
        src={proxiedSrc}
        alt={alt}
        className={`${className} ${!isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        crossOrigin="anonymous"
      />
    </div>
  );
});

OptimizedImage.displayName = "OptimizedImage";
