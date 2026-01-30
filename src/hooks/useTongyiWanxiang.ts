import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAsyncGeneration } from './useAsyncGeneration';

export interface TongyiWanxiangResult {
  success: boolean;
  data?: {
    image_url?: string;
    task_id?: string;
    response?: string;
  };
  error?: string;
  task_id?: string;
  status?: 'processing' | 'completed' | 'failed';
  message?: string;
}

interface TongyiJobResult {
  success: boolean;
  image_url?: string;
  response?: string;
  error?: string;
}

export const useTongyiWanxiang = () => {
  const [lastResult, setLastResult] = useState<TongyiWanxiangResult | null>(null);
  const [pendingRequest, setPendingRequest] = useState<{
    type: 'analyze' | 'edit';
    imageInput: string;
    prompt: string;
  } | null>(null);

  // Callback quando job completa
  const handleComplete = useCallback((result: TongyiJobResult) => {
    console.log('[useTongyiWanxiang] ✅ Job completado:', result);
    
    if (result?.success) {
      setLastResult({
        success: true,
        data: {
          image_url: result.image_url,
          response: result.response
        }
      });
      toast.success('Processamento concluído com sucesso!');
    } else {
      setLastResult({
        success: false,
        error: result?.error || 'Erro desconhecido'
      });
    }
    setPendingRequest(null);
  }, []);

  // Callback de erro
  const handleError = useCallback((error: string) => {
    console.error('[useTongyiWanxiang] ❌ Erro:', error);
    setLastResult({
      success: false,
      error
    });
    setPendingRequest(null);
  }, []);

  // Hook de geração assíncrona
  const {
    generate,
    currentJob,
    isProcessing,
    progress,
    reset: resetAsync
  } = useAsyncGeneration({
    onComplete: handleComplete,
    onError: handleError,
    showToasts: true
  });

  // Analisar imagem usando a fila
  const analyzeImage = useCallback(async (
    imageInput: string,
    prompt: string
  ): Promise<TongyiWanxiangResult> => {
    console.log('🔍 [useTongyiWanxiang] Enfileirando análise de imagem...');
    
    if (!imageInput) {
      toast.error('Imagem é obrigatória para análise');
      return { success: false, error: 'Imagem é obrigatória' };
    }

    if (!prompt) {
      toast.error('Prompt é obrigatório para análise');
      return { success: false, error: 'Prompt é obrigatório' };
    }

    setPendingRequest({ type: 'analyze', imageInput, prompt });
    setLastResult(null);

    // Determinar se é URL ou base64
    const isUrl = imageInput.startsWith('http');
    
    const result = await generate('tongyi', {
      action: 'analyze',
      model: 'qwen-vl-max',
      prompt,
      ...(isUrl ? { imageUrl: imageInput } : { image: imageInput })
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Retorna indicando que foi enfileirado
    return {
      success: true,
      status: 'processing',
      message: `Job enfileirado. Posição: ${result.queuePosition}`
    };
  }, [generate]);

  // Editar imagem usando a fila
  const editImage = useCallback(async (
    imageInput: string,
    prompt: string
  ): Promise<TongyiWanxiangResult> => {
    console.log('✏️ [useTongyiWanxiang] Enfileirando edição de imagem...');
    
    if (!imageInput) {
      toast.error('Imagem é obrigatória para edição');
      return { success: false, error: 'Imagem é obrigatória' };
    }

    if (!prompt) {
      toast.error('Prompt é obrigatório para edição');
      return { success: false, error: 'Prompt é obrigatório' };
    }

    setPendingRequest({ type: 'edit', imageInput, prompt });
    setLastResult(null);

    // Determinar se é URL ou base64
    const isUrl = imageInput.startsWith('http');
    
    const result = await generate('tongyi', {
      action: 'edit',
      model: 'qwen-image-edit',
      prompt,
      ...(isUrl ? { imageUrl: imageInput } : { image: imageInput })
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Retorna indicando que foi enfileirado
    return {
      success: true,
      status: 'processing',
      message: `Job enfileirado. Posição: ${result.queuePosition}`
    };
  }, [generate]);

  // Obter resultado do job atual
  const getResult = useCallback((): TongyiWanxiangResult | null => {
    if (!currentJob) return lastResult;

    if (currentJob.status === 'completed' && currentJob.result) {
      return {
        success: true,
        data: {
          image_url: currentJob.result.image_url,
          response: currentJob.result.response
        }
      };
    }

    if (currentJob.status === 'failed') {
      return {
        success: false,
        error: currentJob.errorMessage || 'Falha no processamento'
      };
    }

    // Ainda processando
    return {
      success: true,
      status: 'processing',
      message: `Status: ${currentJob.status}`
    };
  }, [currentJob, lastResult]);

  // Resetar estado
  const reset = useCallback(() => {
    resetAsync();
    setLastResult(null);
    setPendingRequest(null);
  }, [resetAsync]);

  return {
    analyzeImage,
    editImage,
    getResult,
    reset,
    isProcessing,
    progress,
    currentJob,
    pendingRequest
  };
};
