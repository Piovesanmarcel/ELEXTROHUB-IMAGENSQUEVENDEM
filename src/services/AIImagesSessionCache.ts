import { convertImagesToBlob, filterStorableUrls, clearOldImageCaches } from '@/utils/blobUrlConverter';

// Gerenciamento de cache de imagens IA em sessão (temporário)
export class AIImagesSessionCache {
  private static instance: AIImagesSessionCache;
  private readonly SESSION_TTL = 60 * 60 * 1000; // 1 hora
  private readonly MAX_IMAGES_PER_CACHE = 25; // Limite de imagens por cache
  
  static getInstance(): AIImagesSessionCache {
    if (!this.instance) {
      this.instance = new AIImagesSessionCache();
    }
    return this.instance;
  }

  // Salvar imagens geradas de um produto específico por IA
  // ✅ Converte Base64 para Blob URLs e filtra antes de salvar
  saveImages(productId: string, aiName: string, images: string[]): void {
    const cacheKey = this.getCacheKey(productId, aiName);
    
    // ✅ Converter Base64 para Blob URLs
    const blobImages = convertImagesToBlob(images);
    
    // ✅ Filtrar apenas URLs válidas (não base64)
    const storableUrls = filterStorableUrls(blobImages);
    
    if (storableUrls.length === 0) {
      console.log(`⚠️ [SESSION-CACHE] Nenhuma URL válida para salvar de ${aiName}`);
      return;
    }
    
    // ✅ Limitar quantidade de imagens
    const trimmedImages = storableUrls.slice(-this.MAX_IMAGES_PER_CACHE);
    
    const cacheData = {
      images: trimmedImages,
      timestamp: Date.now(),
      aiName,
      productId
    };
    
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`💾 [SESSION-CACHE] Salvando ${trimmedImages.length} URLs de ${aiName} para produto ${productId}`);
    } catch (error: any) {
      if (error.name === 'QuotaExceededError') {
        console.warn('⚠️ [SESSION-CACHE] Quota excedida, limpando caches antigos...');
        clearOldImageCaches();
        this.clearOldestCache();
        
        // Tentar novamente com menos imagens
        try {
          const minimalImages = trimmedImages.slice(-10);
          cacheData.images = minimalImages;
          sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch {
          console.error('❌ [SESSION-CACHE] Falha ao salvar mesmo após limpeza');
        }
      } else {
        console.warn('⚠️ [SESSION-CACHE] Erro ao salvar:', error);
      }
    }
  }

  // Recuperar imagens salvas
  loadImages(productId: string, aiName: string): string[] | null {
    const cacheKey = this.getCacheKey(productId, aiName);
    
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (!cached) return null;
      
      const cacheData = JSON.parse(cached);
      
      // Verificar TTL (1 hora)
      if (Date.now() - cacheData.timestamp > this.SESSION_TTL) {
        console.log(`⏰ [SESSION-CACHE] Cache expirado para ${aiName}/${productId}`);
        sessionStorage.removeItem(cacheKey);
        return null;
      }
      
      console.log(`🚀 [SESSION-CACHE] ${cacheData.images.length} imagens de ${aiName} recuperadas`);
      return cacheData.images;
      
    } catch (error) {
      console.error('❌ [SESSION-CACHE] Erro ao recuperar cache:', error);
      return null;
    }
  }

  // Limpar cache de um produto/IA específico
  clearCache(productId: string, aiName: string): void {
    const cacheKey = this.getCacheKey(productId, aiName);
    sessionStorage.removeItem(cacheKey);
    console.log(`🧹 [SESSION-CACHE] Cache limpo: ${aiName}/${productId}`);
  }

  // Limpar todo o cache de IA
  clearAllAICache(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('ai_images_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
    console.log(`🧹 [SESSION-CACHE] ${keysToRemove.length} caches de IA limpos`);
  }

  private getCacheKey(productId: string, aiName: string): string {
    const sanitizedName = aiName.toLowerCase().replace(/\s+/g, '_');
    return `ai_images_${productId}_${sanitizedName}`;
  }

  private clearOldestCache(): void {
    // Limpar o cache mais antigo quando sessionStorage ficar cheio
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('ai_images_')) {
        try {
          const data = JSON.parse(sessionStorage.getItem(key)!);
          if (data.timestamp < oldestTimestamp) {
            oldestTimestamp = data.timestamp;
            oldestKey = key;
          }
        } catch {}
      }
    }
    
    if (oldestKey) {
      sessionStorage.removeItem(oldestKey);
      console.log('🧹 [SESSION-CACHE] Cache mais antigo removido:', oldestKey);
    }
  }

  // Monitoramento de uso de sessionStorage
  getStorageUsage(): { used: string; total: string; percentage: number } {
    let totalSize = 0;
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)!;
      const value = sessionStorage.getItem(key)!;
      totalSize += key.length + value.length;
    }
    
    const usedMB = (totalSize / (1024 * 1024)).toFixed(2);
    const totalMB = '5-10'; // Limite típico do navegador
    const percentage = (totalSize / (5 * 1024 * 1024)) * 100;
    
    return {
      used: `${usedMB} MB`,
      total: `${totalMB} MB`,
      percentage: Math.round(percentage)
    };
  }
}

export const aiImagesCache = AIImagesSessionCache.getInstance();
