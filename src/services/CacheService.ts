// Cache Service for Images and Copywriting optimization
export class CacheService {
  private static instance: CacheService;
  private imageCache = new Map<string, HTMLImageElement>();
  private copywritingCache = new Map<string, string>();
  private cacheTTL = 30 * 60 * 1000; // 30 minutes (increased for better performance)
  private cacheTimestamps = new Map<string, number>();

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // Image Caching with preloading and timeout
  async loadImageSecure(src: string, timeout = 10000): Promise<HTMLImageElement> {
    const cacheKey = `img_${src}`;
    
    // Check cache first
    if (this.imageCache.has(cacheKey) && this.isCacheValid(cacheKey)) {
      console.log(`🚀 [CACHE] Image hit: ${src.substring(0, 50)}...`);
      return this.imageCache.get(cacheKey)!;
    }

    console.log(`⏳ [CACHE] Loading image: ${src.substring(0, 50)}...`);
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      let timeoutId: NodeJS.Timeout;

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        img.onload = null;
        img.onerror = null;
      };

      const handleLoad = async () => {
        cleanup();
        try {
          // Use Image.decode() for better performance if available
          if (img.decode) {
            await img.decode();
          }
          
          // Cache the loaded image
          this.imageCache.set(cacheKey, img);
          this.cacheTimestamps.set(cacheKey, Date.now());
          
          console.log(`✅ [CACHE] Image loaded and cached: ${src.substring(0, 50)}...`);
          resolve(img);
        } catch (decodeError) {
          console.warn(`⚠️ [CACHE] Decode failed, using without decode: ${decodeError}`);
          this.imageCache.set(cacheKey, img);
          this.cacheTimestamps.set(cacheKey, Date.now());
          resolve(img);
        }
      };

      const handleError = () => {
        cleanup();
        reject(new Error(`Failed to load image: ${src}`));
      };

      // Set timeout
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Image load timeout: ${src}`));
      }, timeout);

      img.onload = handleLoad;
      img.onerror = handleError;
      
      // Handle CORS issues
      img.crossOrigin = 'anonymous';
      
      // Try blob approach first for better CORS handling
      fetch(src)
        .then(response => response.blob())
        .then(blob => {
          img.src = URL.createObjectURL(blob);
        })
        .catch(() => {
          // Fallback to direct src
          img.src = src;
        });
    });
  }

  // Copywriting caching with batch loading
  getCopywritingText(productId: string, section: string): string | null {
    const cacheKey = `copy_${productId}_${section}`;
    
    if (this.copywritingCache.has(cacheKey) && this.isCacheValid(cacheKey)) {
      console.log(`🚀 [CACHE] Copywriting hit: ${productId}/${section}`);
      return this.copywritingCache.get(cacheKey)!;
    }
    
    return null;
  }

  setCopywritingText(productId: string, section: string, text: string): void {
    const cacheKey = `copy_${productId}_${section}`;
    this.copywritingCache.set(cacheKey, text);
    this.cacheTimestamps.set(cacheKey, Date.now());
    console.log(`💾 [CACHE] Copywriting cached: ${productId}/${section} (${text.length} chars)`);
  }

  // Batch cache all copywriting sections for a product
  setCopywritingBatch(productId: string, sections: Record<string, string>): void {
    Object.entries(sections).forEach(([section, text]) => {
      this.setCopywritingText(productId, section, text);
    });
    console.log(`💾 [CACHE] Batch cached ${Object.keys(sections).length} sections for ${productId}`);
  }

  // Preload images in background
  async preloadImages(urls: string[]): Promise<void> {
    console.log(`🔄 [CACHE] Preloading ${urls.length} images...`);
    
    const promises = urls.map(url => 
      this.loadImageSecure(url, 5000).catch(error => {
        console.warn(`⚠️ [CACHE] Preload failed for: ${url}`, error);
        return null;
      })
    );
    
    await Promise.allSettled(promises);
    console.log(`✅ [CACHE] Preload completed`);
  }

  private isCacheValid(key: string): boolean {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp) return false;
    
    return (Date.now() - timestamp) < this.cacheTTL;
  }

  // Clear expired cache entries
  clearExpiredCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cacheTimestamps.forEach((timestamp, key) => {
      if (now - timestamp > this.cacheTTL) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.imageCache.delete(key);
      this.copywritingCache.delete(key);
      this.cacheTimestamps.delete(key);
    });

    if (keysToDelete.length > 0) {
      console.log(`🧹 [CACHE] Cleared ${keysToDelete.length} expired entries`);
    }
  }

  // Clear all cache
  clearAll(): void {
    this.imageCache.clear();
    this.copywritingCache.clear();
    this.cacheTimestamps.clear();
    console.log(`🧹 [CACHE] All cache cleared`);
  }
}

export const cacheService = CacheService.getInstance();