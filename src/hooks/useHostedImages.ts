import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Type-safe wrapper for legacy tables
const legacyDb = supabase as any;

export interface HostedImage {
  id: string;
  filename: string;
  original_filename: string;
  url: string;
  r2_path: string;
  file_type: string;
  file_size: number;
  width?: number;
  height?: number;
  description?: string;
  tags: string[];
  uploaded_at: string;
  user_id: string;
  is_public: boolean;
}

export interface HostedImagesBySource {
  [source: string]: HostedImage[];
}

/**
 * Hook simplificado - sem persistência no banco de dados
 * Imagens são apenas temporárias na sessão (Blob URLs)
 * A única exceção são as imagens melhoradas do DeepAI que ficam na tabela produtos
 */
export const useHostedImages = () => {
  const [hostedImages, setHostedImages] = useState<HostedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar imagens melhoradas do DeepAI (única fonte persistida)
  const fetchDeepAIEnhancedImages = useCallback(async (productId?: string): Promise<HostedImage[]> => {
    if (!productId) return [];
    
    try {
      console.log(`🔍 [DeepAI] Buscando imagens melhoradas para produto ${productId}`);
      
      const { data, error } = await legacyDb
        .from('produtos')
        .select(`
          id,
          sku,
          nome,
          imagem_original,
          imagem_melhorada_1,
          imagem_melhorada_2,
          imagem_melhorada_3,
          imagem_melhorada_4,
          imagem_melhorada_5,
          imagem_melhorada_6,
          imagem_melhorada_7,
          imagem_melhorada_8,
          imagem_melhorada_9,
          imagem_melhorada_10,
          enhanced_at,
          usuario_id
        `)
        .eq('id', productId)
        .maybeSingle();
      
      if (error || !data || !data.enhanced_at) {
        console.log('ℹ️ [DeepAI] Nenhuma imagem melhorada encontrada');
        return [];
      }
      
      // Converter imagens melhoradas para formato HostedImage
      const deepAIImages: HostedImage[] = [];
      
      for (let i = 1; i <= 10; i++) {
        const enhancedField = `imagem_melhorada_${i}`;
        const enhancedUrl = data[enhancedField];
        const originalUrl = data.imagem_original;
        
        if (enhancedUrl && typeof enhancedUrl === 'string') {
          deepAIImages.push({
            id: `deepai-${productId}-${i}`,
            url: enhancedUrl,
            r2_path: enhancedUrl,
            filename: `${data.sku || data.nome}_enhanced_${i}.jpg`,
            original_filename: `${data.sku || data.nome}_enhanced_${i}.jpg`,
            file_type: 'image/jpeg',
            file_size: 0,
            width: undefined,
            height: undefined,
            uploaded_at: data.enhanced_at || new Date().toISOString(),
            user_id: data.usuario_id,
            is_public: true,
            description: `Imagem melhorada ${i} - ${data.nome}`,
            tags: [
              `product:${productId}`,
              'source:deepai-enhancement',
              'ai-source:deepai',
              originalUrl ? `original:${originalUrl}` : '',
              'hosted'
            ].filter(Boolean)
          });
        }
      }
      
      console.log(`✅ [DeepAI] ${deepAIImages.length} imagens melhoradas encontradas`);
      return deepAIImages;
      
    } catch (error) {
      console.error('❌ [DeepAI] Erro ao buscar imagens:', error);
      return [];
    }
  }, []);

  const fetchHostedImages = useCallback(async (productId?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Apenas buscar imagens do DeepAI (única fonte persistida)
      const deepAIImages = await fetchDeepAIEnhancedImages(productId);
      setHostedImages(deepAIImages);
      
      console.log(`✅ [useHostedImages] ${deepAIImages.length} imagens DeepAI carregadas`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar imagens';
      setError(message);
      console.error('❌ [useHostedImages] Erro:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchDeepAIEnhancedImages]);

  // Função stub - não salva mais no banco, apenas retorna sucesso
  const saveHostedImage = useCallback(async (imageData: {
    filename: string;
    original_filename: string;
    url: string;
    r2_path: string;
    file_type: string;
    file_size: number;
    width?: number;
    height?: number;
    description?: string;
    tags?: string[];
    aiSource?: string;
    processing?: string[];
    productId?: string;
    quality?: string;
  }) => {
    console.log('⚠️ [useHostedImages] saveHostedImage chamado - persistência desabilitada, apenas retornando sucesso');
    
    // Criar objeto fake para compatibilidade
    const fakeHostedImage: HostedImage = {
      id: `temp-${Date.now()}`,
      url: imageData.url,
      r2_path: imageData.r2_path || '',
      filename: imageData.filename,
      original_filename: imageData.original_filename || '',
      file_type: imageData.file_type,
      file_size: imageData.file_size,
      width: imageData.width,
      height: imageData.height,
      description: imageData.description,
      tags: imageData.tags || [],
      uploaded_at: new Date().toISOString(),
      user_id: 'temp',
      is_public: true
    };
    
    return { success: true, data: fakeHostedImage };
  }, []);

  // Função stub - não deleta mais do banco
  const deleteHostedImage = useCallback(async (id: string) => {
    console.log('⚠️ [useHostedImages] deleteHostedImage chamado - persistência desabilitada');
    setHostedImages(prev => prev.filter(img => img.id !== id));
    return { success: true };
  }, []);

  const getImagesBySource = useCallback((source?: string): HostedImagesBySource => {
    if (!source) {
      return hostedImages.reduce((acc, img) => {
        let imgSource = img.tags.find(tag => tag.startsWith('ai-source:'))?.replace('ai-source:', '');
        if (!imgSource) {
          imgSource = img.tags.find(tag => tag.startsWith('source:'))?.replace('source:', '');
        }
        imgSource = imgSource || 'outros';
        
        if (!acc[imgSource]) {
          acc[imgSource] = [];
        }
        acc[imgSource].push(img);
        return acc;
      }, {} as HostedImagesBySource);
    }
    
    const filtered = hostedImages.filter(img => 
      img.tags.includes(`ai-source:${source}`) ||
      img.tags.includes(`source:${source}`) || 
      img.description?.includes(source)
    );
    
    return { [source]: filtered };
  }, [hostedImages]);

  const getStorageStats = useCallback(() => {
    return {
      totalImages: hostedImages.length,
      totalSize: 0,
      totalSizeGB: 0
    };
  }, [hostedImages]);

  return {
    hostedImages,
    loading,
    error,
    fetchHostedImages,
    saveHostedImage,
    deleteHostedImage,
    getImagesBySource,
    getStorageStats
  };
};
