import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EnhancementType } from "@/components/enhancement/EnhancementOptions";
import { EnhancedImage, ProcessImageResult } from "./types";
import { needsProxy, getProxiedUrl } from "@/lib/imageProxy";

const RETRY_CONFIG = {
  maxRetries: 2,
  baseDelay: 3000,
  timeoutMs: 120000
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const processWithDeepAI = async (
  imageUrl: string,
  enhancementType: EnhancementType,
  imageIndex: number,
  totalImages: number
): Promise<{ success: boolean; data?: any; error?: string }> => {
  console.log(`📡 ENVIANDO PARA DEEPAI - ANÁLISE COMPLETA:`);
  console.log(`🔍 URL da imagem:`, imageUrl);
  console.log(`🔍 Tipo de melhoria:`, enhancementType);
  
  // Se a URL precisa de proxy (ObaOba Mix), usar a URL do proxy
  const finalImageUrl = needsProxy(imageUrl) ? getProxiedUrl(imageUrl) : imageUrl;
  if (needsProxy(imageUrl)) {
    console.log('🔄 URL ObaOba Mix detectada, usando proxy URL:', finalImageUrl.substring(0, 80) + '...');
  }
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`🔄 Tentativa ${attempt}/${RETRY_CONFIG.maxRetries} - DeepAI para imagem ${imageIndex + 1}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`⏰ Timeout DeepAI na tentativa ${attempt}`);
        controller.abort();
      }, RETRY_CONFIG.timeoutMs);

      try {
        // Usar supabase.functions.invoke para segurança
        console.log(`📡 Usando supabase.functions.invoke para photoroon-enhance`);
        
        const { data, error: invokeError } = await supabase.functions.invoke('photoroon-enhance', {
          body: {
            imageUrl: finalImageUrl,
            enhancement_type: enhancementType
          }
        });

        clearTimeout(timeoutId);

        console.log(`📥 RESPOSTA DEEPAI RECEBIDA:`);
        
        if (invokeError) {
          console.error('❌ ERRO DeepAI:', invokeError);
          throw new Error(invokeError.message);
        }
        
        console.log(`📊 Data:`, data);
        
        // Verificar se há erro retornado pela função
        if (data.error) {
          console.error('❌ ERRO DA EDGE FUNCTION:', data.error);
          throw new Error(`Erro da Edge Function: ${data.error}`);
        }

        if (data && data.success === true && data.enhanced_url) {
          console.log(`✅ DeepAI processou imagem ${imageIndex + 1} com sucesso!`);
          return { success: true, data };
        }

        return { success: false, error: data?.error || data?.message || 'Resposta inválida da API DeepAI' };

      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          console.log(`⏰ Timeout DeepAI na tentativa ${attempt}`);
          lastError = new Error(`Timeout na comunicação com DeepAI (tentativa ${attempt}/${RETRY_CONFIG.maxRetries})`);
        } else {
          console.error(`❌ Erro DeepAI na tentativa ${attempt}:`, fetchError);
          lastError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
        }
        
        if (attempt < RETRY_CONFIG.maxRetries) {
          console.log(`⏳ Aguardando ${RETRY_CONFIG.baseDelay}ms antes da próxima tentativa...`);
          await sleep(RETRY_CONFIG.baseDelay);
          continue;
        }
      }
    } catch (error) {
      console.error(`💥 Erro inesperado na tentativa ${attempt}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < RETRY_CONFIG.maxRetries) {
        console.log(`⏳ Aguardando ${RETRY_CONFIG.baseDelay}ms antes da próxima tentativa...`);
        await sleep(RETRY_CONFIG.baseDelay);
        continue;
      }
    }
  }

  return { 
    success: false, 
    error: lastError?.message || 'Erro desconhecido após múltiplas tentativas' 
  };
};
