import { useState, useCallback } from 'react';
import { useAsyncGeneration, GenerationType } from './useAsyncGeneration';
import { supabase } from '@/integrations/supabase/client';

interface GeminiCarouselUsage {
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  imagesGenerated: number;
  estimatedCostUSD: number;
  estimatedCostBRL: number;
  costPerImageUSD: number;
  costPerImageBRL: number;
  usdToBrlRate: number;
}

interface GeminiCarouselResult {
  success: boolean;
  images?: string[];
  usage?: GeminiCarouselUsage;
  error?: string;
  jobId?: string;
  queuePosition?: number;
}

export const useGeminiImageCarousel = () => {
  const [lastUsage, setLastUsage] = useState<GeminiCarouselUsage | null>(null);
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);

  // Callback quando a geração for concluída
  const handleComplete = useCallback(async (result: any) => {
    console.log('✅ [GEMINI CAROUSEL] Geração concluída via fila:', result);
    
    if (result?.usage) {
      const usage = result.usage as GeminiCarouselUsage;
      setLastUsage(usage);
      
      console.log(`💰 [GEMINI CAROUSEL] Custo: $${usage.estimatedCostUSD.toFixed(4)} / R$${usage.estimatedCostBRL.toFixed(2)}`);
      
      // Salvar no ai_usage_logs
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await (supabase as any).from('ai_usage_logs').insert({
            user_id: user.id,
            function_name: 'carousel',
            api_provider: 'gemini',
            model_used: usage.model,
            prompt_tokens: usage.promptTokens,
            completion_tokens: usage.completionTokens,
            total_tokens: usage.totalTokens,
            estimated_cost_usd: usage.estimatedCostUSD,
            estimated_cost_brl: usage.estimatedCostBRL,
            usd_to_brl_rate: usage.usdToBrlRate,
            success: true
          });
          console.log('📝 [GEMINI CAROUSEL] Custo salvo no banco de dados');
        }
      } catch (logError) {
        console.error('⚠️ [GEMINI CAROUSEL] Erro ao salvar log de custo:', logError);
      }
    }
  }, [pendingProductId]);

  // Usar o hook de geração assíncrona
  const {
    generate,
    currentJob,
    isProcessing,
    progress,
    reset
  } = useAsyncGeneration({
    onComplete: handleComplete,
    onError: (error) => {
      console.error('❌ [GEMINI CAROUSEL] Erro na fila:', error);
    },
    showToasts: true
  });

  // Função principal que agora usa a fila
  const generateCarouselImages = useCallback(async (
    imageUrl: string, 
    productId?: string
  ): Promise<GeminiCarouselResult> => {
    console.log('🎨 [GEMINI CAROUSEL] Enfileirando geração de 4 imagens carrossel');
    console.log('🎨 [GEMINI CAROUSEL] Image URL:', imageUrl.substring(0, 100));
    
    // Salvar productId para uso no callback
    setPendingProductId(productId || null);
    
    // Enfileirar na fila assíncrona
    const result = await generate<{ images: string[]; usage: GeminiCarouselUsage }>(
      'carousel' as GenerationType,
      { imageUrl }
    );
    
    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Erro ao enfileirar geração'
      };
    }
    
    return {
      success: true,
      jobId: result.jobId,
      queuePosition: result.queuePosition
    };
  }, [generate]);

  // Obter resultado quando o job for concluído
  const getResult = useCallback((): GeminiCarouselResult | null => {
    if (!currentJob) return null;
    
    if (currentJob.status === 'completed' && currentJob.result) {
      return {
        success: true,
        images: currentJob.result.images,
        usage: currentJob.result.usage
      };
    }
    
    if (currentJob.status === 'failed') {
      return {
        success: false,
        error: currentJob.errorMessage || 'Falha no processamento'
      };
    }
    
    return null;
  }, [currentJob]);

  return {
    generateCarouselImages,
    getResult,
    currentJob,
    isProcessing,
    progress,
    lastUsage,
    reset
  };
};
