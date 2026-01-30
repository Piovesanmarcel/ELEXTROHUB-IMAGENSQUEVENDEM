import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FluxAIResult {
  success: boolean;
  action?: string;
  result?: any;
  error?: string;
}

export const useFluxAIGenerator = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const processFluxAI = async (
    action: string,
    params: {
      imageData?: string;
      imageUrl?: string;
      prompt?: string;
      description?: string;
    }
  ): Promise<FluxAIResult> => {
    setIsProcessing(true);
    setProgress(0);

    try {
      console.log('🚀 Starting FluxAI request:', action, params);
      toast.info(`Processando ${action}...`);
      setProgress(25);

      // Usar supabase.functions.invoke para segurança
      const { data, error } = await supabase.functions.invoke('fluxai-generator', {
        body: {
          action,
          ...params
        }
      });

      if (error) {
        console.error('❌ Function error:', error);
        toast.error(`Erro ao chamar a função FluxAI: ${error.message}`);
        throw new Error(error.message);
      }

      console.log('📡 Function response:', { data });

      setProgress(100);

      if (data.success) {
        toast.success(`${action} processado com sucesso!`);
        return data;
      } else {
        toast.error(`Erro da API FluxAI: ${data.error}`);
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

  const imageToImage = async (imageFile: File, prompt: string): Promise<FluxAIResult> => {
    const imageData = await fileToBase64(imageFile);
    return processFluxAI('image-to-image', { imageData, prompt });
  };

  const fluxKontext = async (imageFile: File, prompt: string): Promise<FluxAIResult> => {
    const imageData = await fileToBase64(imageFile);
    return processFluxAI('flux-kontext', { imageData, prompt });
  };

  const generatePrompt = async (description: string, imageFile?: File): Promise<FluxAIResult> => {
    const params: any = { description };
    if (imageFile) {
      params.imageData = await fileToBase64(imageFile);
    }
    return processFluxAI('prompt-generation', params);
  };

  const enhanceImage = async (imageFile: File): Promise<FluxAIResult> => {
    const imageData = await fileToBase64(imageFile);
    return processFluxAI('image-enhancement', { imageData });
  };

  const removeBackground = async (imageFile: File): Promise<FluxAIResult> => {
    const imageData = await fileToBase64(imageFile);
    return processFluxAI('background-removal-4x', { imageData });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  return {
    imageToImage,
    fluxKontext,
    generatePrompt,
    enhanceImage,
    removeBackground,
    isProcessing,
    progress
  };
};
