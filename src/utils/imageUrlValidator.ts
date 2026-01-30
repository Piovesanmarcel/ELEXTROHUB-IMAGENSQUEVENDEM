/**
 * Utilitário para validar URLs de imagens
 * Verifica se as imagens estão acessíveis (especialmente para ImgBB que expira)
 */

export interface ImageValidationResult {
  url: string;
  isValid: boolean;
  error?: string;
}

/**
 * Valida se uma URL de imagem está acessível
 * @param url URL da imagem
 * @param timeoutMs Timeout em ms (padrão 5000)
 * @returns Promise<boolean> true se acessível
 */
export const validateImageUrl = async (url: string, timeoutMs = 5000): Promise<boolean> => {
  if (!url || typeof url !== 'string') return false;

  // Base64 sempre é válido
  if (url.startsWith('data:image/')) return true;

  // URLs não HTTP(S) são inválidas
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;

  // Fallback robusto: validar carregando como <img> (funciona mesmo quando HEAD/CORS bloqueia)
  const validateViaImg = () =>
    new Promise<boolean>((resolve) => {
      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.crossOrigin = 'anonymous';

      const timeout = setTimeout(() => {
        img.src = '';
        resolve(false);
      }, timeoutMs);

      img.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };

      img.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };

      img.src = url;
    });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Tenta validar via HEAD (rápido quando disponível)
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Muitos CDNs bloqueiam HEAD (ex.: DeepAI). Nesses casos, não marque como inválido — use <img>.
    if (!response.ok) return await validateViaImg();

    const contentType = response.headers.get('content-type') || '';
    // Se o servidor envia content-type, validar que é imagem
    if (contentType && !contentType.startsWith('image/')) return await validateViaImg();

    return true;
  } catch {
    return await validateViaImg();
  }
};

/**
 * Valida múltiplas URLs de imagem em paralelo
 * @param urls Array de URLs
 * @returns Promise<ImageValidationResult[]>
 */
export const validateImageUrls = async (urls: string[]): Promise<ImageValidationResult[]> => {
  const results = await Promise.all(
    urls.map(async (url) => {
      const isValid = await validateImageUrl(url);
      return { url, isValid };
    })
  );
  return results;
};

/**
 * Filtra apenas URLs de imagem válidas
 * @param urls Array de URLs
 * @returns Promise<string[]> apenas URLs válidas
 */
export const filterValidImageUrls = async (urls: string[]): Promise<string[]> => {
  const results = await validateImageUrls(urls);
  const validUrls = results.filter(r => r.isValid).map(r => r.url);
  
  const invalidCount = urls.length - validUrls.length;
  if (invalidCount > 0) {
    console.warn(`⚠️ [ImageValidator] ${invalidCount} imagens inválidas/expiradas filtradas`);
  }
  
  return validUrls;
};

/**
 * Verifica se uma URL é do ImgBB (serviço que expira imagens)
 */
export const isImgBBUrl = (url: string): boolean => {
  return url.includes('i.ibb.co') || url.includes('imgbb.com');
};

/**
 * Verifica se uma URL é do Cloudflare R2 (storage permanente)
 */
export const isR2Url = (url: string): boolean => {
  return url.includes('.r2.dev') || url.includes('r2.cloudflarestorage.com');
};
