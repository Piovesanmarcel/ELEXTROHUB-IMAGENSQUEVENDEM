import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generatePromptVariations, getRandomVariation, PromptVariation } from '@/utils/promptVariationGenerator';
import { UnifiedResultsData } from '@/hooks/useUnifiedCommandsData';
import { imageToBase64 } from '@/utils/imageToBase64Utils';

export interface GeminiUsageData {
  model: string;
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
  estimatedCostUSD: number;
  estimatedCostBRL: number;
  usdToBrlRate: number;
  timestamp: string;
}

export interface GeminiBackgroundResult {
  success: boolean;
  generatedImage?: string;
  generatedPrompt?: string;
  error?: string;
  metadata?: any;
  analysis?: string;
  suggestion?: string;
  usage?: GeminiUsageData;
}

export interface UnifiedDataForGemini {
  idealFor?: string[];
  idealEnvironments?: string[];
  mainKeywords?: string[];
}

export interface ProductDimensions {
  altura?: number | null;
  largura?: number | null;
  profundidade?: number | null;
  peso_bruto?: number | null;
}

// Contexto do produto para prompts contextualizados
export interface ProductContextForGemini {
  productName?: string;
  productCategory?: string;
  productDescription?: string;
  idealEnvironments?: string[];
  mainKeywords?: string[];
}

export const useGeminiBackgroundGenerator = () => {
  const [lastUsage, setLastUsage] = useState<GeminiUsageData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Função principal que agora chama diretamente a Edge Function (SEM fila)
  const generateBackground = useCallback(async (
    imageData: string | string[],
    prompt: string,
    maxRetries: number = 3,
    unifiedData?: UnifiedDataForGemini | UnifiedResultsData,
    dimensions?: ProductDimensions,
    operationType?: string,
    productId?: string,
    apiKeyId?: string,
    productContext?: ProductContextForGemini
  ): Promise<GeminiBackgroundResult> => {
    console.log('🚀 [GEMINI BG] Iniciando geração direta (síncrona)...');
    
    setIsProcessing(true);
    setProgress(10);
    
    try {
      // DEBUG: Log completo do contexto recebido
      const fullUnifiedData = unifiedData as UnifiedResultsData | undefined;
      const hasRichData = !!(
        fullUnifiedData?.hasUnifiedData ||
        fullUnifiedData?.idealEnvironments?.length ||
        fullUnifiedData?.idealFor?.length ||
        fullUnifiedData?.mainKeywords?.length
      );
      
      console.log('📊 [GEMINI BG] Dados do Copywriting recebidos:', {
        hasData: fullUnifiedData?.hasUnifiedData || false,
        idealEnvironments: fullUnifiedData?.idealEnvironments?.length || 0,
        idealFor: fullUnifiedData?.idealFor?.length || 0,
        mainKeywords: fullUnifiedData?.mainKeywords?.length || 0,
        longTailKeywords: fullUnifiedData?.longTailKeywords?.length || 0,
        targetAudience: !!fullUnifiedData?.targetAudience
      });
      
      setProgress(20);
      
      // Enriquecer prompt com sistema de variações se tiver dados ricos
      let enrichedPrompt = prompt;
      let selectedVariation: PromptVariation | null = null;
      
      if (hasRichData && fullUnifiedData) {
        // Usar o sistema de variações completo
        const variations = generatePromptVariations(
          productContext?.productName || 'product',
          productContext?.productDescription || '',
          fullUnifiedData
        );
        
        if (variations.length > 0) {
          selectedVariation = getRandomVariation(variations);
          if (selectedVariation) {
            enrichedPrompt = selectedVariation.prompt;
            console.log('🎨 [GEMINI BG] Usando variação do Copywriting:', {
              context: selectedVariation.context,
              source: selectedVariation.source,
              priority: selectedVariation.priority
            });
          }
        }
      } else if (unifiedData) {
        // Fallback para enriquecimento simples
        const contextParts: string[] = [];
        
        if (unifiedData.idealEnvironments && unifiedData.idealEnvironments.length > 0) {
          const randomEnv = unifiedData.idealEnvironments[Math.floor(Math.random() * unifiedData.idealEnvironments.length)];
          contextParts.push(`in ${randomEnv}`);
          console.log('🎯 [GEMINI BG] Ambiente ideal aplicado:', randomEnv);
        }
        
        if (unifiedData.mainKeywords && unifiedData.mainKeywords.length > 0) {
          const randomKeyword = unifiedData.mainKeywords[Math.floor(Math.random() * unifiedData.mainKeywords.length)];
          contextParts.push(`emphasizing ${randomKeyword}`);
          console.log('🔑 [GEMINI BG] Keyword aplicada:', randomKeyword);
        }
        
        if (contextParts.length > 0) {
          enrichedPrompt = `${prompt}, ${contextParts.join(', ')}`;
          console.log('✨ [GEMINI BG] Prompt enriquecido (simples):', enrichedPrompt);
        }
      }
      
      console.log('📝 [GEMINI BG] Contexto será enviado via productContext (sem poluir prompt)');
      
      setProgress(30);
      
      // Converter imagens para base64 antes de enviar
      let processedImageData: string | string[];
      
      if (Array.isArray(imageData)) {
        console.log('🔄 [GEMINI BG] Convertendo', imageData.length, 'imagens para base64...');
        const base64Results = await Promise.all(
          imageData.map(async (img) => {
            try {
              return await imageToBase64(img);
            } catch (error) {
              console.error('❌ Erro ao converter imagem para base64:', error);
              return img; // Fallback para URL original
            }
          })
        );
        processedImageData = base64Results;
        console.log('✅ [GEMINI BG] Imagens convertidas para base64');
      } else {
        console.log('🔄 [GEMINI BG] Convertendo imagem para base64...');
        try {
          processedImageData = await imageToBase64(imageData);
          console.log('✅ [GEMINI BG] Imagem convertida para base64');
        } catch (error) {
          console.error('❌ Erro ao converter imagem para base64:', error);
          processedImageData = imageData; // Fallback para URL original
        }
      }
      
      setProgress(50);
      
      // 🚀 CHAMADA DIRETA (síncrona) para a Edge Function
      console.log('📡 [GEMINI BG] Chamando Edge Function diretamente...');
      
      const { data, error } = await supabase.functions.invoke('gemini-background-generator', {
        body: {
          imageData: processedImageData,
          prompt: enrichedPrompt.trim(),
          action: 'generate_background',
          dimensions,
          apiKeyId: apiKeyId || null,
          productContext: productContext || null
        }
      });
      
      setProgress(90);
      
      if (error) {
        console.error('❌ [GEMINI BG] Erro na Edge Function:', error);
        setIsProcessing(false);
        setProgress(0);
        return {
          success: false,
          error: error.message || 'Erro ao chamar a API'
        };
      }
      
      console.log('✅ [GEMINI BG] Resposta recebida:', {
        success: data?.success,
        hasImage: !!data?.generatedImage,
        hasAnalysis: !!data?.analysis
      });
      
      // Processar resposta de uso
      if (data?.usage) {
        const usage = data.usage as GeminiUsageData;
        setLastUsage(usage);
        
        console.log(`💰 [GEMINI BG] Custo: $${usage.estimatedCostUSD.toFixed(4)} / R$${usage.estimatedCostBRL.toFixed(2)}`);
        
        // Salvar no ai_usage_logs
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await (supabase as any).from('ai_usage_logs').insert({
              user_id: user.id,
              function_name: operationType || 'background',
              api_provider: 'gemini',
              model_used: usage.model,
              prompt_tokens: usage.promptTokens,
              completion_tokens: usage.candidatesTokens,
              total_tokens: usage.totalTokens,
              estimated_cost_usd: usage.estimatedCostUSD,
              estimated_cost_brl: usage.estimatedCostBRL,
              usd_to_brl_rate: usage.usdToBrlRate,
              success: true
            });
            console.log('📝 [GEMINI BG] Custo salvo no banco de dados');
          }
        } catch (logError) {
          console.error('⚠️ [GEMINI BG] Erro ao salvar log de custo:', logError);
        }
      }
      
      setIsProcessing(false);
      setProgress(100);
      
      // Retornar resultado
      if (data?.success && data?.generatedImage) {
        return {
          success: true,
          generatedImage: data.generatedImage,
          generatedPrompt: data.promptUsed,
          metadata: data.metadata,
          usage: data.usage
        };
      } else if (data?.analysis) {
        return {
          success: false,
          analysis: data.analysis,
          suggestion: data.suggestion,
          error: data.error || 'Gemini retornou análise ao invés de imagem'
        };
      } else {
        return {
          success: false,
          error: data?.error || 'Erro desconhecido na geração'
        };
      }
      
    } catch (error) {
      console.error('❌ [GEMINI BG] Erro geral:', error);
      setIsProcessing(false);
      setProgress(0);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao gerar fundo'
      };
    }
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setIsProcessing(false);
    setProgress(0);
    setLastUsage(null);
  }, []);

  return {
    generateBackground,
    isProcessing,
    progress,
    lastUsage,
    reset
  };
};
