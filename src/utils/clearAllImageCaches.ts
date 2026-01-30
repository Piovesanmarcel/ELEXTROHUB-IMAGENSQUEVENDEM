/**
 * Utilitário para limpar todos os caches de imagens do sessionStorage
 */

// Prefixos e chaves conhecidas de cache de imagens
const IMAGE_CACHE_KEYS = [
  'ad_generator_product_images',
  'ad_generator_reference_images',
  'ad_generator_product_id',
  'ad_generator_last_product_name',
];

const IMAGE_CACHE_PREFIXES = [
  'wb:',
  'ai_images_',
];

/**
 * Limpa todos os caches de imagens do sessionStorage
 * Retorna o número de itens removidos
 */
export const clearAllImageCaches = (): number => {
  let removedCount = 0;
  const keysToRemove: string[] = [];

  // Coletar todas as chaves que precisam ser removidas
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (!key) continue;

    // Verificar chaves exatas
    if (IMAGE_CACHE_KEYS.includes(key)) {
      keysToRemove.push(key);
      continue;
    }

    // Verificar prefixos
    if (IMAGE_CACHE_PREFIXES.some(prefix => key.startsWith(prefix))) {
      keysToRemove.push(key);
    }
  }

  // Remover todas as chaves coletadas
  keysToRemove.forEach(key => {
    sessionStorage.removeItem(key);
    console.log(`🧹 [CACHE-CLEAR] Removido: ${key}`);
    removedCount++;
  });

  console.log(`🧹 [CACHE-CLEAR] Total de ${removedCount} caches de imagem removidos`);
  return removedCount;
};

/**
 * Domínios bloqueados que causam erro CORS
 * URLs desses domínios não devem ser restauradas do cache
 */
export const BLOCKED_IMAGE_DOMAINS = [
  'res.cloudinary.com',
  'cloudinary.com',
  'images.unsplash.com',
  'm.media-amazon.com',
  'alicdn.com',
  'shopee.com.br',
  'ae01.alicdn.com',
  'img.alicdn.com',
];

/**
 * Filtra URLs válidas, removendo domínios bloqueados
 */
export const filterBlockedUrls = (urls: string[]): string[] => {
  if (!urls || !Array.isArray(urls)) return [];
  
  return urls.filter(url => {
    if (!url || typeof url !== 'string') return false;
    
    // Verificar se URL contém algum domínio bloqueado
    const isBlocked = BLOCKED_IMAGE_DOMAINS.some(domain => url.includes(domain));
    
    if (isBlocked) {
      console.log(`⛔ [CACHE-FILTER] URL bloqueada: ${url.substring(0, 60)}...`);
    }
    
    return !isBlocked;
  });
};
