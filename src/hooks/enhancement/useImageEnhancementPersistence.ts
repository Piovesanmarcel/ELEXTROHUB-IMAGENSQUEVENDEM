
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EnhancedImage } from "./types";

export const useImageEnhancementPersistence = () => {
  const [isSaving, setIsSaving] = useState(false);

  const saveEnhancedImages = useCallback(async (productId: string, enhancedImages: EnhancedImage[]) => {
    setIsSaving(true);
    
    try {
      console.log(`💾 Salvando ${enhancedImages.length} imagens melhoradas para produto ${productId}`);
      
      // Preparar dados para atualização
      const updateData: Record<string, any> = {
        enhanced_at: new Date().toISOString()
      };

      // Limpar campos existentes primeiro
      for (let i = 1; i <= 10; i++) {
        updateData[`imagem_melhorada_${i}`] = null;
      }

      // Definir novas imagens melhoradas
      enhancedImages.forEach((img, index) => {
        if (index < 10) {
          updateData[`imagem_melhorada_${index + 1}`] = img.enhanced;
        }
      });

      // Atualizar no banco de dados
      const { error } = await (supabase as any)
        .from('produtos')
        .update(updateData)
        .eq('id', productId);

      if (error) {
        console.error('❌ Erro ao salvar imagens melhoradas:', error);
        throw error;
      }

      console.log('✅ Imagens melhoradas salvas com sucesso no banco de dados');
      toast.success(`${enhancedImages.length} imagens melhoradas salvas permanentemente!`);
      
      return true;
    } catch (error) {
      console.error('💥 Erro ao salvar imagens melhoradas:', error);
      toast.error('Erro ao salvar imagens melhoradas no banco de dados');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const loadEnhancedImages = useCallback(async (productId: string): Promise<EnhancedImage[]> => {
    console.log('🔗 loadEnhancedImages CHAMADA - productId:', productId);
    
    try {
      if (!productId) {
        console.log('❌ ProductId está vazio ou undefined');
        return [];
      }

      console.log('🔗 Executando query no Supabase...');
      const startTime = Date.now();
      
      const { data: produto, error } = await (supabase as any)
        .from('produtos')
        .select(`
          id,
          imagem_url,
          imagem_url_2,
          imagem_url_3,
          imagem_url_4,
          imagem_url_5,
          imagem_url_6,
          imagem_url_7,
          imagem_url_8,
          imagem_url_9,
          imagem_url_10,
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
          enhanced_at
        `)
        .eq('id', productId)
        .single();

      const queryTime = Date.now() - startTime;
      console.log('🔗 Query completada em', queryTime, 'ms');
      console.log('🔗 Resposta do Supabase:', { 
        data_exists: !!produto, 
        error_exists: !!error,
        enhanced_at: produto?.enhanced_at,
        product_id: produto?.id 
      });

      if (error) {
        console.error('❌ Erro ao carregar imagens melhoradas:', error);
        return [];
      }

      if (!produto) {
        console.log('❌ Produto não encontrado');
        return [];
      }

      if (!produto?.enhanced_at) {
        console.log('ℹ️ Produto não possui imagens melhoradas salvas (enhanced_at é null)');
        return [];
      }

      console.log('🔗 Construindo array de imagens...');
      // Montar array de imagens melhoradas
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
              hosting_service: 'imgbb',
              enhanced_at: produto.enhanced_at
            }
          });
          console.log(`🔗 Imagem ${i} adicionada:`, enhancedUrl.substring(0, 50) + '...');
        }
      }

      console.log(`✅ ${enhancedImages.length} imagens melhoradas carregadas do banco`);
      return enhancedImages;
    } catch (error) {
      console.error('💥 Erro inesperado em loadEnhancedImages:', error);
      return [];
    }
  }, []);

  const hasEnhancedImages = useCallback(async (productId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('enhanced_at')
        .eq('id', productId)
        .single();

      if (error) return false;
      return !!data?.enhanced_at;
    } catch (error) {
      return false;
    }
  }, []);

  return {
    isSaving,
    saveEnhancedImages,
    loadEnhancedImages,
    hasEnhancedImages
  };
};
