import { useState, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Hook simplificado - SEM fix-cors-image via R2
 * Apenas retorna a URL original
 */
export const useImageCorsHandler = (productId: string) => {
  const [isFixing, setIsFixing] = useState(false);

  const fixCorsImage = useCallback(async (imageUrl: string, imageIndex: number) => {
    if (!imageUrl || isFixing) return null;
    
    setIsFixing(true);
    console.log(`⚠️ [CORS] R2 removido - usando URL direta: ${imageUrl.substring(0, 80)}...`);
    
    try {
      // Sem R2, apenas retorna a URL original
      console.log(`✅ [CORS] Retornando URL original (sem rehosting)`);
      toast.info(`Usando imagem diretamente (sem rehosting)`);
      
      return imageUrl;

    } catch (error) {
      console.error(`❌ Erro:`, error);
      toast.error(`Erro ao processar imagem ${imageIndex + 1}`);
      return null;
    } finally {
      setIsFixing(false);
    }
  }, [productId, isFixing]);

  return { fixCorsImage, isFixing };
};
