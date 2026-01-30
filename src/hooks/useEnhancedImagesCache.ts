import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedImage } from '@/hooks/enhancement/types';
import { useEnhancedImagesContext } from '@/contexts/EnhancedImagesContext';
import { validateImageUrl } from '@/utils/imageUrlValidator';

export const useEnhancedImagesCache = (productId: string) => {
  const { getCachedImages, setCachedImages, setLoading } = useEnhancedImagesContext();
  const [localImages, setLocalImages] = useState<EnhancedImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEnhancedImages = useCallback(async (forceRefresh = false) => {
    if (!productId) {
      setIsLoading(false);
      return;
    }

    // Verificar cache primeiro (se não for refresh forçado)
    if (!forceRefresh) {
      const cached = getCachedImages(productId);
      if (cached && !cached.loading) {
        console.log('📦 Usando imagens do cache para produto:', productId);
        setLocalImages(cached.images);
        setIsLoading(false);
        return;
      }
      
      if (cached?.loading) {
        console.log('⏳ Aguardando carregamento em progresso...');
        return;
      }
    }

    try {
      setIsLoading(true);
      setLoading(productId, true);
      setError(null);
      
      console.log('🚀 [CACHE] Carregando imagens otimizadas para produto:', productId);
      const startTime = Date.now();

      // Query otimizada - primeiro verificar se tem enhanced_at
      const { data: hasEnhanced, error: checkError } = await supabase
        .from('produtos')
        .select('enhanced_at')
        .eq('id', productId)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (!hasEnhanced?.enhanced_at) {
        console.log('ℹ️ [CACHE] Produto sem imagens melhoradas');
        setCachedImages(productId, []);
        setLocalImages([]);
        setIsLoading(false);
        return;
      }

      // Query apenas campos necessários para construir as imagens
      const { data: produto, error } = await (supabase as any)
        .from('produtos')
        .select(`
          id,
          imagem_url, imagem_url_2, imagem_url_3, imagem_url_4, imagem_url_5,
          imagem_url_6, imagem_url_7, imagem_url_8, imagem_url_9, imagem_url_10,
          imagem_melhorada_1, imagem_melhorada_2, imagem_melhorada_3, imagem_melhorada_4, imagem_melhorada_5,
          imagem_melhorada_6, imagem_melhorada_7, imagem_melhorada_8, imagem_melhorada_9, imagem_melhorada_10,
          enhanced_at
        `)
        .eq('id', productId)
        .single();

      const queryTime = Date.now() - startTime;
      console.log('⚡ [CACHE] Query otimizada completada em', queryTime, 'ms');

      if (error) {
        throw error;
      }

      // Construir array de imagens otimizado
      const enhancedImages: EnhancedImage[] = [];
      
      for (let i = 1; i <= 10; i++) {
        const originalField = i === 1 ? 'imagem_url' : `imagem_url_${i}`;
        const enhancedField = `imagem_melhorada_${i}`;
        
        const originalUrl = produto[originalField];
        const enhancedUrl = produto[enhancedField];
        
        if (originalUrl && enhancedUrl) {
          enhancedImages.push({
            id: `${productId}-${i}`,
            original: originalUrl,
            enhanced: enhancedUrl,
            metadata: {
              hosted: true,
              hosting_service: enhancedUrl.includes('.r2.dev') || enhancedUrl.includes('r2.cloudflarestorage.com')
                ? 'cloudflare-r2'
                : enhancedUrl.includes('i.ibb.co') || enhancedUrl.includes('imgbb.com')
                  ? 'imgbb'
                  : 'unknown',
              enhanced_at: produto.enhanced_at
            }
          });
        }
      }

      // Validar URLs de imagens melhoradas (ImgBB pode expirar)
      console.log(`🔍 [CACHE] Validando ${enhancedImages.length} URLs de imagens...`);
      const validatedImages: EnhancedImage[] = [];
      
      for (const img of enhancedImages) {
        const isValid = await validateImageUrl(img.enhanced, 3000);
        if (isValid) {
          validatedImages.push(img);
        } else {
          console.warn(`⚠️ [CACHE] Imagem expirada/inválida: ${img.enhanced.substring(0, 50)}...`);
        }
      }
      
      const invalidCount = enhancedImages.length - validatedImages.length;
      if (invalidCount > 0) {
        console.warn(`⚠️ [CACHE] ${invalidCount} imagens DeepAI expiradas do ImgBB`);
      }

      console.log(`✅ [CACHE] ${validatedImages.length} imagens válidas carregadas e cacheadas`);
      
      // Salvar no cache e atualizar estado local
      setCachedImages(productId, validatedImages);
      setLocalImages(validatedImages);
      
    } catch (error) {
      console.error('❌ [CACHE] Erro ao carregar imagens:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      setCachedImages(productId, []);
      setLocalImages([]);
    } finally {
      setIsLoading(false);
      setLoading(productId, false);
    }
  }, [productId, getCachedImages, setCachedImages, setLoading]);

  useEffect(() => {
    loadEnhancedImages();
  }, [loadEnhancedImages]);

  return {
    enhancedImages: localImages,
    isLoading,
    error,
    refetch: () => loadEnhancedImages(true)
  };
};