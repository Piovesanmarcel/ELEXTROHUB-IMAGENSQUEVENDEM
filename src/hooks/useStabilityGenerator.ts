import { useState, useCallback } from 'react';
import { useAsyncGeneration, GenerationType } from './useAsyncGeneration';
import { toast } from 'sonner';

export interface StabilityGenerateParams {
  image: string;
  background_prompt: string;
  foreground_prompt?: string;
  negative_prompt?: string;
  preserve_original_subject?: number;
  original_background_depth?: number;
  keep_original_background?: boolean;
  light_source_direction?: string;
  light_source_strength?: number;
  seed?: number;
  output_format?: string;
}

export interface StabilityGenerateResult {
  success: boolean;
  image?: string;
  error?: string;
  errorCode?: string;
  model_used?: string;
  credits_used?: number;
  retried?: boolean;
  autoSwitchedModel?: boolean;
  jobId?: string;
  queuePosition?: number;
}

export const useStabilityGenerator = () => {
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [currentModel] = useState<string>('replace-background-relight');

  // Callback quando a geração for concluída
  const handleComplete = useCallback((result: any) => {
    console.log('✅ [STABILITY] Geração concluída via fila:', result);
    
    if (result?.image) {
      setGeneratedImages(prev => [result.image, ...prev]);
      
      toast.success('✨ Fundo substituído com sucesso!', {
        description: `Modelo: ${result.model_used || 'Replace Background'} | Créditos: ${result.credits_used || 4}`
      });
    }
  }, []);

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
      console.error('❌ [STABILITY] Erro na fila:', error);
      toast.error('Erro ao gerar imagem', { description: error });
    },
    showToasts: true
  });

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Função principal que agora usa a fila
  const generateImageToImage = useCallback(async (
    params: StabilityGenerateParams,
    isRetry: boolean = false
  ): Promise<StabilityGenerateResult> => {
    console.log('🎨 [STABILITY] Enfileirando substituição de fundo...');
    toast.info('Adicionando à fila de geração...');

    let imageData = params.image;
    
    // Processar URL local (blob)
    if (imageData && imageData.startsWith('blob:')) {
      console.log('🖼️ Converting blob to base64...');
      try {
        const response = await fetch(imageData);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        imageData = `data:image/jpeg;base64,${btoa(binary)}`;
      } catch (conversionError) {
        console.error('❌ Erro ao converter blob:', conversionError);
        return {
          success: false,
          error: 'Erro ao processar imagem'
        };
      }
    }
    
    // Enfileirar na fila assíncrona
    const result = await generate<{ image: string; model_used: string; credits_used: number }>(
      'stability' as GenerationType,
      {
        image: imageData,
        background_prompt: params.background_prompt,
        foreground_prompt: params.foreground_prompt,
        negative_prompt: params.negative_prompt,
        preserve_original_subject: params.preserve_original_subject || 0.7,
        original_background_depth: params.original_background_depth || 0.5,
        keep_original_background: params.keep_original_background || false,
        light_source_direction: params.light_source_direction,
        light_source_strength: params.light_source_strength || 0.3,
        seed: params.seed,
        output_format: params.output_format || 'webp'
      }
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

  // Gerar múltiplas variações (enfileira várias)
  const generateMultipleVariations = useCallback(async (
    baseParams: StabilityGenerateParams,
    variations: number = 3
  ): Promise<StabilityGenerateResult[]> => {
    console.log(`[STABILITY] Enfileirando ${variations} variações...`);
    toast.loading(`Adicionando ${variations} variações à fila...`, { id: 'batch-stability' });

    const results: StabilityGenerateResult[] = [];
    
    for (let i = 0; i < variations; i++) {
      const result = await generateImageToImage(baseParams);
      results.push(result);
      
      // Pequeno delay entre enfileiramentos
      if (i < variations - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const successful = results.filter(r => r.success).length;
    toast.success(`✅ ${successful}/${variations} jobs adicionados à fila!`, { id: 'batch-stability' });

    return results;
  }, [generateImageToImage]);

  // Obter resultado quando o job for concluído
  const getResult = useCallback((): StabilityGenerateResult | null => {
    if (!currentJob) return null;
    
    if (currentJob.status === 'completed' && currentJob.result) {
      return {
        success: true,
        image: currentJob.result.image,
        model_used: currentJob.result.model_used,
        credits_used: currentJob.result.credits_used
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

  const clearGeneratedImages = useCallback(() => {
    setGeneratedImages([]);
  }, []);

  return {
    isProcessing,
    progress,
    currentModel,
    generatedImages,
    currentJob,
    generateImageToImage,
    generateMultipleVariations,
    getResult,
    clearGeneratedImages,
    fileToBase64,
    reset
  };
};
