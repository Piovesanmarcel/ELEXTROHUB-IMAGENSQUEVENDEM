import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BflTestResult {
  success: boolean;
  data?: any;
  model_used?: string;
  error?: string;
  result_url?: string;
  result_base64?: string;
  result_mime?: string;
  task_id?: string;
}

export interface BflGenerationParams {
  prompt: string;
  width: number;
  height: number;
  seed?: number;
  steps?: number;
  guidance?: number;
  input_image?: string;
  mask?: string;
  strength?: number;
  operation?: string;
}

export const useBflTest = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateImage = async (
    model: string,
    params: BflGenerationParams
  ): Promise<BflTestResult> => {
    setIsProcessing(true);
    setProgress(0);

    try {
      console.log('🚀 Iniciando geração BFL:', { model, params });
      toast.info(`Iniciando geração com modelo ${model}...`);
      setProgress(25);

      const requestBody = {
        prompt: params.prompt,
        width: params.width,
        height: params.height,
        steps: params.steps || 28,
        guidance: params.guidance || 7,
        model,
        operation: params.operation || 'text-to-image',
        ...(params.seed && { seed: params.seed }),
        ...(params.input_image && { input_image: params.input_image }),
        ...(params.mask && { mask: params.mask }),
        ...(params.strength && { strength: params.strength })
      };

      console.log('📡 Calling BFL function with body:', JSON.stringify(requestBody, null, 2));
      console.log('🔧 About to call supabase.functions.invoke...');
      
      const { data, error } = await supabase.functions.invoke('bfl-test', {
        body: requestBody
      });
      
      console.log('📥 Function response:', data);
      console.log('❌ Function error:', error);
      
      if (error) {
        console.error('💥 Detailed error info:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
      }
      setProgress(75);

      if (error) {
        console.error('💥 Error details:', error);
        toast.error(`Erro na função: ${error.message}`);
        throw new Error(`Erro na função: ${error.message}`);
      }

      if (!data) {
        console.error('❌ Nenhum dado retornado da função');
        toast.error('Nenhum dado retornado da função BFL.ai');
        throw new Error('Nenhum dado retornado da função');
      }

      setProgress(100);

      if (data.success && data.result_url) {
        toast.success(`Imagem gerada com sucesso usando ${model}!`);
        return data;
      } else {
        toast.error(`Erro da API BFL.ai: ${data.error || 'Erro desconhecido'}`);
        return data;
      }

    } catch (error) {
      console.error(`Error in BFL generation:`, error);
      toast.error(`Erro ao gerar imagem com BFL.ai: ${error.message}`);
      throw error;
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const getResult = async (taskId: string): Promise<BflTestResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('bfl-test', {
        body: {
          action: 'get-result',
          task_id: taskId
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error getting BFL result:', error);
      throw error;
    }
  };

  return {
    generateImage,
    getResult,
    isProcessing,
    progress
  };
};