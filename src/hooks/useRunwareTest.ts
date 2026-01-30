import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RunwareTestResult {
  success: boolean;
  data?: any;
  error?: string;
}

export const useRunwareTest = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Normalize image to Data URI for Edge Function compatibility
  const normalizeImageToDataURI = async (image: string): Promise<string> => {
    if (!image) {
      throw new Error('Image URL is empty or undefined');
    }

    // Already a data URI - return as is
    if (image.startsWith('data:image/')) {
      console.log('🖼️ [Runware] Image already in data URI format');
      return image;
    }

    // Blob URL - convert to data URI in browser
    if (image.startsWith('blob:')) {
      console.log('🔄 [Runware] Converting blob URL to data URI...');
      try {
        const response = await fetch(image);
        const blob = await response.blob();
        
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            console.log(`✅ [Runware] Blob converted to data URI (${(result.length / 1024).toFixed(2)} KB)`);
            resolve(result);
          };
          reader.onerror = () => reject(new Error('Failed to read blob as data URI'));
          reader.readAsDataURL(blob);
        });
      } catch (error: any) {
        console.error('❌ [Runware] Failed to convert blob URL:', error);
        throw new Error(`Blob conversion failed: ${error.message}`);
      }
    }

    // HTTP(S) URL - return as is (Edge Function will handle)
    if (image.startsWith('http://') || image.startsWith('https://')) {
      console.log('🌐 [Runware] HTTP(S) URL detected, passing through');
      return image;
    }

    // Raw base64 - prefix with appropriate data URI scheme
    if (image.startsWith('/9j/') || image.startsWith('iVBORw0KGgo')) {
      const prefix = image.startsWith('/9j/') 
        ? 'data:image/jpeg;base64,' 
        : 'data:image/png;base64,';
      console.log(`🔧 [Runware] Raw base64 detected, adding ${prefix.split(';')[0]} prefix`);
      return prefix + image;
    }

    // Unknown format - pass through and let Edge Function handle/error
    console.warn('⚠️ [Runware] Unknown image format, passing through:', image.substring(0, 50));
    return image;
  };

  // Robust prompt sanitization utility
  const sanitizePromptForAPI = (text: string, maxLength: number = 800): string => {
    if (!text) return '';
    
    // Convert to string and normalize
    let sanitized = String(text);
    
    // Remove emojis and special Unicode characters
    sanitized = sanitized.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
    
    // Normalize to ASCII where possible
    sanitized = sanitized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Remove markdown and formatting
    sanitized = sanitized
      .replace(/\*\*|__|\*|`|>/g, '')
      .replace(/[••·▪►–—\-]{1,}\s*/g, ' ')
      .replace(/\[[^\]]*\]/g, ' ')
      .replace(/IMPORTANTE:.*?$/gmi, ' ');
    
    // Clean whitespace and normalize
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    // Truncate to max length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.slice(0, maxLength - 3) + '...';
    }
    
    return sanitized;
  };

  // Exponential backoff retry utility
  const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        return await fn();
      } catch (error: any) {
        attempt++;
        
        // Don't retry on 4xx client errors (except rate limiting)
        if (error.message.includes('HTTP 4') && !error.message.includes('429')) {
          throw error;
        }
        
        if (attempt >= maxRetries) {
          throw error;
        }
        
        // Exponential backoff: 1s, 2s, 4s, etc.
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ Retry ${attempt}/${maxRetries} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Max retries exceeded');
  };

  const processRunwareAction = async (
    action: string,
    params: Record<string, any>
  ): Promise<RunwareTestResult> => {
    setIsProcessing(true);
    try {
      // Sanitize prompt if present
      const sanitizedParams = { ...params };
      if (sanitizedParams.prompt) {
        sanitizedParams.prompt = sanitizePromptForAPI(sanitizedParams.prompt);
        console.log('🧹 Prompt sanitizado:', { 
          original: params.prompt?.substring(0, 100) + '...',
          sanitized: sanitizedParams.prompt.substring(0, 100) + '...'
        });
      }

      console.log('🚀 Enviando para Runware via Supabase Functions:', { action, params: sanitizedParams });

      const result = await retryWithBackoff(async () => {
        // Timeout de 30s para evitar travamento
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: Runware demorou mais de 30s')), 30000)
        );

        const apiCallPromise = supabase.functions.invoke('runware-test', {
          body: { action, ...sanitizedParams }
        });

        const { data, error } = await Promise.race([apiCallPromise, timeoutPromise]) as any;

        if (error) {
          throw new Error(error.message || 'Erro na chamada da função');
        }

        if (!data) {
          throw new Error('Resposta vazia da função');
        }

        if (data.error) {
          throw new Error(data.error);
        }

        return data;
      }, 2, 2000); // 2 retries com 2s de delay

      console.log('✅ Resposta da Runware (processada):', result);

      // Normalize response structure from edge function
      const payload = result?.data;
      const items = Array.isArray(payload) 
        ? payload 
        : (payload && payload.data ? payload.data : payload);

      if (Array.isArray(items) && items.length > 0) {
        console.log('🎯 Dados extraídos:', items.length, 'itens');
        toast.success('Processamento concluído com sucesso!');
        return { success: true, data: items };
      }

      if (result.success && payload) {
        toast.success('Processamento concluído com sucesso!');
        return { success: true, data: Array.isArray(payload) ? payload : [payload] };
      }

      throw new Error('Resposta inválida da API Runware');

    } catch (error: any) {
      console.error('💥 Erro no hook:', error);
      toast.error(`Erro: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setIsProcessing(false);
    }
  };

  const generateImage = async (
    prompt: string,
    model: string = 'runware:100@1',
    width: number = 1024,
    height: number = 1024,
    cfgScale: number = 2.5,
    steps: number = 30,
    outputFormat: string = 'JPEG',
    guidanceEndStepPercentage: number = 85
  ): Promise<RunwareTestResult> => {
    return processRunwareAction('text-to-image', { 
      prompt, 
      model, 
      width, 
      height, 
      cfgScale, 
      steps,
      outputFormat,
      guidanceEndStepPercentage
    });
  };

  const imageToImage = async (
    prompt: string,
    image: string,
    model: string = 'runware:106@1',
    width: number = 1024,
    height: number = 1024,
    strength: number = 0.3,
    cfgScale: number = 2.5,
    steps: number = 25,
    numberResults: number = 1,
    outputFormat: string = 'JPEG',
    guidanceEndStepPercentage: number = 70,
    negativePrompt?: string
  ): Promise<RunwareTestResult> => {
    // Normalize image before processing
    console.log('🔍 [Image2Image] Normalizing image input...');
    const normalizedImage = await normalizeImageToDataURI(image);
    
    // Standardized parameters for reliability
    const standardizedParams = {
      prompt,
      image: normalizedImage,
      model: model || 'runware:106@1',
      width: Math.min(Math.max(width, 512), 1024), // Constrain dimensions
      height: Math.min(Math.max(height, 512), 1024),
      strength: Math.min(Math.max(strength, 0.1), 0.8), // Safe range
      cfgScale: Math.min(Math.max(cfgScale, 1.0), 7.0), // Safe range
      steps: Math.min(Math.max(steps, 15), 50), // Optimal range
      numberResults,
      outputFormat: outputFormat || 'JPEG',
      scheduler: 'Default', // Standardized scheduler
      guidanceEndStepPercentage: Math.min(Math.max(guidanceEndStepPercentage, 50), 85),
      negativePrompt: negativePrompt || "modified object, deformed product, changed colors, altered shape, different texture, repainted object, stylized product, distorted proportions, wrong lighting, blurry object, altered product, changed appearance, different style, reshaped item, stretched product, compressed object, rotated product, scaled incorrectly, wrong proportions, texture changes, material changes, color shifts, surface alterations, finish modifications, edge distortions, warped object, morphed product, transformed item, redesigned object"
    };

    return processRunwareAction('image-to-image', standardizedParams);
  };

  const upscaleImage = async (
    image: string,
    factor: number = 2,
    model: string = 'runware:503@1',
    outputQuality: number = 85 // ✅ Qualidade 85 por padrão
  ): Promise<RunwareTestResult> => {
    try {
      // Normalize image before upscaling
      console.log('🔍 [Upscale] Normalizing image input...');
      const normalizedImage = await normalizeImageToDataURI(image);
      
      // Tentativa 1: Upscale com modelo, fator e qualidade especificados
      console.log(`📈 Tentando upscale ${factor}x com modelo ${model}, qualidade ${outputQuality}...`);
      const result = await processRunwareAction('upscale-image', { 
        image: normalizedImage, 
        factor,
        model,
        outputFormat: 'JPEG',
        outputQuality // ✅ Passando qualidade
      });
      
      if (result.success) {
        console.log(`✅ Upscale ${factor}x bem-sucedido!`);
        return result;
      }
      
      // ❌ Upscale falhou - retornar erro sem tentar 4x
      console.warn(`⚠️ Upscale ${factor}x falhou:`, result.error);
      return { 
        success: false, 
        error: result.error || `Falha no upscale ${factor}x` 
      };
      
    } catch (error: any) {
      // ❌ Erro na requisição - retornar erro sem tentar 4x
      console.error(`💥 Upscale ${factor}x falhou com erro:`, error.message);
      return { 
        success: false, 
        error: `Upscale ${factor}x falhou: ${error.message}` 
      };
    }
  };

  const removeBackground = async (image: string): Promise<RunwareTestResult> => {
    console.log('🔍 [RemoveBG] Normalizing image input...');
    const normalizedImage = await normalizeImageToDataURI(image);
    return processRunwareAction('remove-background', { image: normalizedImage });
  };

  const enhanceImage = async (image: string): Promise<RunwareTestResult> => {
    console.log('🔍 [Enhance] Normalizing image input...');
    const normalizedImage = await normalizeImageToDataURI(image);
    return processRunwareAction('enhance-image', { image: normalizedImage });
  };

  const inpaintImage = async (
    prompt: string, 
    image: string, 
    mask: string,
    model: string = 'dreamshaper_8', // Usar dreamshaper_8 por padrão
    width: number = 1024,
    height: number = 1024,
    strength: number = 0.7, // Strength 0.7 conforme especificação
    cfgScale: number = 9, // CFG Scale 9 conforme especificação
    steps: number = 30,
    numberResults: number = 1,
    outputFormat: string = 'JPEG',
    guidanceEndStepPercentage?: number,
    negativePrompt?: string // Adicionar suporte a prompt negativo
  ): Promise<RunwareTestResult> => {
    // Normalize image and mask before processing
    console.log('🔍 [Inpaint] Normalizing image and mask inputs...');
    const normalizedImage = await normalizeImageToDataURI(image);
    const normalizedMask = await normalizeImageToDataURI(mask);
    
    return processRunwareAction('inpaint-image', {
      prompt,
      image: normalizedImage,
      mask: normalizedMask,
      model,
      width,
      height,
      strength,
      cfgScale,
      steps,
      numberResults,
      outputFormat,
      guidanceEndStepPercentage,
      negativePrompt: negativePrompt || "object deformation, distortion, color change, lighting change, modified object, deformed product, changed colors, altered shape, different texture, repainted object, stylized product, distorted proportions, reshaped item, stretched product, compressed object, rotated product, scaled incorrectly, wrong proportions, texture changes, material changes, surface alterations, finish modifications, edge distortions, warped object, morphed product, transformed item"
    });
  };

  return {
    isProcessing,
    generateImage,
    imageToImage,
    upscaleImage,
    removeBackground,
    enhanceImage,
    inpaintImage
  };
};