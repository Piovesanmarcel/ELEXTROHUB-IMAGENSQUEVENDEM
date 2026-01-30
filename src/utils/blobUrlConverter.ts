/**
 * Utilitário para converter imagens Base64 para Blob URLs
 * Evita QuotaExceededError no sessionStorage
 */

/**
 * Detecta se uma string é uma imagem Base64
 */
export const isBase64Image = (str: string): boolean => {
  if (!str || typeof str !== 'string') return false;
  return str.startsWith('data:image');
};

/**
 * Converte uma imagem Base64 para Blob URL
 * Blob URLs ocupam muito menos espaço no storage
 */
export const base64ToBlobUrl = (base64Data: string): string => {
  if (!isBase64Image(base64Data)) return base64Data;
  
  try {
    // Extrair o conteúdo base64 e tipo
    const parts = base64Data.split(',');
    if (parts.length < 2) return base64Data;
    
    const base64 = parts[1];
    const contentTypeMatch = parts[0].match(/data:(.*?);/);
    const contentType = contentTypeMatch ? contentTypeMatch[1] : 'image/png';
    
    // Decodificar base64 para bytes
    const byteCharacters = atob(base64);
    const byteArray = new Uint8Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray[i] = byteCharacters.charCodeAt(i);
    }
    
    // Criar Blob e URL
    const blob = new Blob([byteArray], { type: contentType });
    const blobUrl = URL.createObjectURL(blob);
    
    console.log(`🔄 [BLOB-CONVERTER] Base64 → Blob URL: ${blobUrl.substring(0, 50)}...`);
    return blobUrl;
  } catch (error) {
    console.error('❌ [BLOB-CONVERTER] Erro ao converter base64:', error);
    return base64Data; // Retorna original em caso de erro
  }
};

/**
 * Baixa uma imagem de URL HTTPS e converte para Blob URL
 * Útil para converter URLs da Runware API para URLs locais
 */
export const fetchUrlToBlobUrl = async (httpsUrl: string): Promise<string> => {
  if (!httpsUrl || typeof httpsUrl !== 'string') {
    throw new Error('URL inválida');
  }
  
  // Se já é blob URL, retornar direto
  if (httpsUrl.startsWith('blob:')) {
    return httpsUrl;
  }
  
  // Se é base64, usar conversão direta
  if (httpsUrl.startsWith('data:')) {
    return base64ToBlobUrl(httpsUrl);
  }
  
  try {
    console.log(`🌐 [BLOB-CONVERTER] Baixando imagem: ${httpsUrl.substring(0, 60)}...`);
    
    const response = await fetch(httpsUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    console.log(`✅ [BLOB-CONVERTER] URL convertida para blob: ${blobUrl.substring(0, 50)}...`);
    return blobUrl;
  } catch (error) {
    console.error('❌ [BLOB-CONVERTER] Erro ao baixar imagem:', error);
    throw error;
  }
};

/**
 * Converte um array de imagens, transformando Base64 em Blob URLs
 * Mantém URLs normais (http/https/blob) inalteradas
 */
export const convertImagesToBlob = (images: string[]): string[] => {
  if (!images || !Array.isArray(images)) return [];
  
  return images.map(img => {
    if (!img || typeof img !== 'string') return img;
    
    if (isBase64Image(img)) {
      return base64ToBlobUrl(img);
    }
    return img;
  }).filter(Boolean);
};

// Domínios de hospedagem permanente que NÃO devem ser cacheados
const PERMANENT_HOSTING_DOMAINS = [
  'res.cloudinary.com',      // Cloudinary
  'i.ibb.co',                // ImgBB
  'image.pollinations.ai',   // Pollinations
  'pub-',                    // Cloudflare R2 (pub-xxxxx.r2.dev)
  '.r2.dev',                 // Cloudflare R2
];

/**
 * Filtra apenas URLs válidas para persistência no storage
 * Exclui Base64 (muito grandes) e URLs de hospedagem permanente
 */
export const filterStorableUrls = (images: string[]): string[] => {
  if (!images || !Array.isArray(images)) return [];
  
  return images.filter(img => {
    if (!img || typeof img !== 'string') return false;
    
    // ✅ Blob URLs sempre são válidas (temporárias por natureza)
    if (img.startsWith('blob:')) return true;
    
    // ❌ Data URLs base64 NÃO são válidas (muito grandes)
    if (img.startsWith('data:')) return false;
    
    // ⚠️ URLs https/http: verificar se NÃO é de hospedagem permanente
    if (img.startsWith('https://') || img.startsWith('http://')) {
      const isPermanent = PERMANENT_HOSTING_DOMAINS.some(domain => 
        img.includes(domain)
      );
      
      if (isPermanent) {
        console.log(`⚠️ [STORAGE] Ignorando URL permanente: ${img.substring(0, 60)}...`);
        return false;
      }
      
      return true;
    }
    
    return false;
  });
};

/**
 * Salva imagens no sessionStorage de forma segura
 * Converte Base64 para Blob e aplica limite de quantidade
 */
export const safeStorageSet = (
  key: string, 
  images: string[], 
  maxImages: number = 30
): boolean => {
  try {
    // Converter Base64 para Blob URLs
    const blobImages = convertImagesToBlob(images);
    
    // Filtrar apenas URLs válidas para storage
    const storableUrls = filterStorableUrls(blobImages);
    
    // Limitar quantidade
    const trimmedImages = storableUrls.slice(-maxImages);
    
    if (trimmedImages.length === 0) {
      console.log(`⚠️ [STORAGE] Nenhuma URL válida para salvar em ${key}`);
      return false;
    }
    
    sessionStorage.setItem(key, JSON.stringify(trimmedImages));
    console.log(`💾 [STORAGE] Salvas ${trimmedImages.length} URLs em ${key}`);
    return true;
  } catch (error: any) {
    if (error.name === 'QuotaExceededError') {
      console.warn(`⚠️ [STORAGE] Quota excedida para ${key}, limpando caches antigos...`);
      clearOldImageCaches();
      
      // Tentar novamente com menos imagens
      try {
        const minimalImages = images.slice(-10);
        const storableUrls = filterStorableUrls(convertImagesToBlob(minimalImages));
        sessionStorage.setItem(key, JSON.stringify(storableUrls));
        return true;
      } catch {
        console.error(`❌ [STORAGE] Falha ao salvar mesmo após limpeza`);
        return false;
      }
    }
    
    console.error(`❌ [STORAGE] Erro ao salvar ${key}:`, error);
    return false;
  }
};

/**
 * Limpa caches de imagens antigos para liberar espaço
 */
export const clearOldImageCaches = (): void => {
  const imageCachePatterns = [
    'ai_images_',
    'wb:',
    'ad_generator_product_images'
  ];
  
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (!key) continue;
    
    if (imageCachePatterns.some(pattern => key.startsWith(pattern) || key === pattern)) {
      keysToRemove.push(key);
    }
  }
  
  // Remover metade dos caches mais antigos
  const toRemove = keysToRemove.slice(0, Math.ceil(keysToRemove.length / 2));
  toRemove.forEach(key => {
    sessionStorage.removeItem(key);
    console.log(`🧹 [STORAGE] Cache removido: ${key}`);
  });
  
  console.log(`🧹 [STORAGE] ${toRemove.length} caches de imagem removidos`);
};

/**
 * Retorna estatísticas de uso do sessionStorage
 */
export const getStorageUsage = (): { used: string; percentage: number } => {
  let totalSize = 0;
  
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)!;
    const value = sessionStorage.getItem(key)!;
    totalSize += key.length + value.length;
  }
  
  const usedMB = (totalSize / (1024 * 1024)).toFixed(2);
  const percentage = Math.round((totalSize / (5 * 1024 * 1024)) * 100);
  
  return {
    used: `${usedMB} MB`,
    percentage
  };
};
