import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FreepikTestResult {
  success: boolean;
  data?: any;
  action_used?: string;
  model_used?: string;
  error?: string;
}

export interface UnifiedDataForFreepik {
  mainKeywords?: string[];
  idealFor?: string[];
  idealEnvironments?: string[];
}

export const useFreepikTest = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateImage = async (
    prompt: string,
    model: string = 'classic-fast',
    image?: string,
    unifiedData?: UnifiedDataForFreepik
  ): Promise<FreepikTestResult> => {
    // Enriquecer prompt com keywords SEO se disponíveis
    let enrichedPrompt = prompt;
    if (unifiedData?.mainKeywords && unifiedData.mainKeywords.length > 0) {
      const keywords = unifiedData.mainKeywords.slice(0, 3).join(', ');
      enrichedPrompt = `${prompt}, ${keywords}, professional quality`;
      console.log('🔑 [FREEPIK] Prompt enriquecido com keywords:', enrichedPrompt);
    }
    
    return processFreepikAction('text-to-image', { prompt: enrichedPrompt, model, image });
  };

  const removeBackground = async (image: string): Promise<FreepikTestResult> => {
    return processFreepikAction('remove-background', { image });
  };

  const relightImage = async (image: string, prompt?: string): Promise<FreepikTestResult> => {
    return processFreepikAction('relight', { image, prompt });
  };

  const upscaleImage = async (image: string, prompt?: string): Promise<FreepikTestResult> => {
    return processFreepikAction('upscale', { image, prompt });
  };

  const processFreepikAction = async (
    action: string,
    params: any
  ): Promise<FreepikTestResult> => {
    setIsProcessing(true);
    setProgress(0);

    try {
      toast.info(`Processando ${action} com Freepik API...`);
      setProgress(25);

      const { data, error } = await supabase.functions.invoke('freepik-test', {
        body: {
          action,
          ...params
        }
      });

      setProgress(75);

      if (error) {
        console.error('Supabase function error:', error);
        toast.error('Erro ao chamar a função Freepik');
        throw new Error(error.message);
      }

      setProgress(100);

      if (data.success) {
        toast.success(`${action} processado com sucesso!`);
        return data;
      } else {
        toast.error(`Erro da API Freepik: ${data.error}`);
        return data;
      }

    } catch (error) {
      console.error(`Error in ${action}:`, error);
      toast.error(`Erro ao processar ${action}`);
      throw error;
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return {
    generateImage,
    removeBackground,
    relightImage,
    upscaleImage,
    isProcessing,
    progress
  };
};