import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Helper function to compress and optimize images for Runway
const compressImage = async (file: File, quality: number = 0.75, maxWidth: number = 896): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions keeping aspect ratio
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        const compressedFile = new File([blob!], file.name.replace(/\.[^/.]+$/, '.jpg'), {
          type: 'image/jpeg', // Always convert to JPEG for better compression
          lastModified: Date.now()
        });
        resolve(compressedFile);
      }, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Helper function to upload reference image to Supabase Storage
const uploadReferenceImage = async (file: File): Promise<string> => {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) {
    throw new Error('Usuário não autenticado');
  }

  // Generate unique filename
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const filename = `${userId}/${timestamp}-${randomId}.jpg`;

  console.log(`📤 [RUNWAY STORAGE] Uploading reference image: ${filename}`);
  console.log(`📤 [RUNWAY STORAGE] File size: ${file.size} bytes`);

  const { data, error } = await supabase.storage
    .from('runway-references')
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('❌ [RUNWAY STORAGE] Upload error:', error);
    throw new Error(`Erro ao fazer upload: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('runway-references')
    .getPublicUrl(filename);

  console.log(`✅ [RUNWAY STORAGE] Image uploaded successfully: ${publicUrl}`);
  return publicUrl;
};

export interface RunwayResult {
  success: boolean;
  data?: {
    imageURL: string;
    taskId: string;
    model: string;
    promptText: string;
  };
  error?: string;
}

export const useRunwayGenerator = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isProcessingMultiple, setIsProcessingMultiple] = useState(false);
  const [multiProgress, setMultiProgress] = useState(0);
  const [currentVariation, setCurrentVariation] = useState(0);

  const generateTextToImage = async (
    promptText: string,
    model: 'gen4_image' | 'gen4_image_turbo' | 'gemini_2.5_flash' = 'gen4_image_turbo',
    referenceImageFile: File
  ): Promise<RunwayResult> => {
    if (!promptText.trim()) {
      toast.error('Por favor, insira um prompt válido');
      return { success: false, error: 'Prompt é obrigatório' };
    }

    if (!referenceImageFile) {
      toast.error('Imagem de referência é obrigatória');
      return { success: false, error: 'Imagem de referência é obrigatória' };
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      console.log('🚀 [RUNWAY HOOK] Iniciando geração:', { promptText, model, hasReferenceImage: !!referenceImageFile });
      
      toast.info('Preparando imagem de referência...');
      setProgress(5);

      // Compress and upload reference image to storage
      let referenceImageUrl: string;
      try {
        // Always compress image for optimal processing
        const compressedFile = await compressImage(referenceImageFile, 0.75, 896);
        console.log(`📸 [RUNWAY HOOK] Imagem comprimida: ${referenceImageFile.size} → ${compressedFile.size} bytes`);
        
        setProgress(10);
        toast.info('Fazendo upload da imagem de referência...');
        
        // Upload to Supabase Storage
        referenceImageUrl = await uploadReferenceImage(compressedFile);
        console.log('✅ [RUNWAY HOOK] Imagem de referência uploaded:', referenceImageUrl);
        
      } catch (error) {
        console.error('❌ [RUNWAY HOOK] Erro ao processar/upload imagem:', error);
        toast.error('Erro ao processar imagem de referência');
        throw error;
      }

      setProgress(15);
      toast.info('Criando task de geração...');

      // ✅ CORREÇÃO DEFINITIVA - VALIDAÇÃO E INVOKE ROBUSTO
      console.log('🔐 [RUNWAY] Verificando autenticação...');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ [RUNWAY] Erro de sessão:', sessionError);
        toast.error('Erro de autenticação. Faça login novamente.');
        throw new Error('Erro de autenticação');
      }

      if (!sessionData?.session?.access_token) {
        console.error('❌ [RUNWAY] Usuário não autenticado!');
        toast.error('Usuário não autenticado. Faça login novamente.');
        throw new Error('Usuário não autenticado');
      }

      console.log('✅ [RUNWAY] Usuário autenticado:', sessionData.session.user.id);

      // ✅ PREPARAR PAYLOAD COM VALIDAÇÕES RIGOROSAS
      const createPayload = {
        action: 'create' as const,
        promptText: promptText.trim(),
        model,
        referenceImage: referenceImageUrl
      };

      // ✅ VALIDAÇÕES CRÍTICAS PARA EVITAR BODY VAZIO
      if (!createPayload.promptText) {
        throw new Error('Prompt não pode ser vazio');
      }
      if (!createPayload.referenceImage) {
        throw new Error('URL da imagem não pode ser vazia');
      }
      if (!createPayload.model) {
        throw new Error('Modelo não pode ser vazio');
      }
      // ✅ Validação de comprimento do prompt (limite Runway: 1000 chars)
      if (createPayload.promptText.length > 1000) {
        const originalLength = createPayload.promptText.length;
        createPayload.promptText = createPayload.promptText.substring(0, 997) + "...";
        console.warn(`⚠️ [RUNWAY] Prompt truncado de ${originalLength} → 1000 chars`);
        toast.warning(`Prompt muito longo. Truncado de ${originalLength} para 1000 caracteres.`);
      }

      // ✅ DEBUGGING DETALHADO DO PAYLOAD
      const payloadJson = JSON.stringify(createPayload);
      console.log('📊 [RUNWAY] Payload preparado:', createPayload);
      console.log('📊 [RUNWAY] Payload JSON size:', payloadJson.length, 'bytes');
      console.log('📊 [RUNWAY] Prompt length:', createPayload.promptText.length);
      console.log('📊 [RUNWAY] Reference URL length:', createPayload.referenceImage.length);

      // ✅ TESTAR SERIALIZAÇÃO ANTES DO INVOKE
      try {
        const testParsed = JSON.parse(payloadJson);
        console.log('✅ [RUNWAY] Payload serialization test passed');
        console.log('✅ [RUNWAY] Parsed keys:', Object.keys(testParsed));
      } catch (serError) {
        console.error('❌ [RUNWAY] Payload serialization failed:', serError);
        throw new Error('Erro na serialização do payload');
      }

      // ✅ SIMPLIFICADO: Usar apenas supabase.functions.invoke
      console.log('🎯 [RUNWAY] Chamando edge function runway-test...');
      
      const { data: createData, error: createError } = await supabase.functions.invoke('runway-test', {
        body: createPayload
      });
      
      console.log('📥 [RUNWAY] Resposta recebida:', { 
        hasData: !!createData, 
        hasError: !!createError,
        dataType: typeof createData
      });

      setProgress(20);

      if (createError) {
        console.error('❌ [RUNWAY HOOK] Erro ao criar task:', createError);
        toast.error('Erro ao criar task na Runway API');
        throw new Error(createError.message);
      }

      if (!createData?.success || !createData?.data?.taskId) {
        console.error('❌ [RUNWAY HOOK] Nenhum taskId retornado:', createData);
        toast.error('Erro: TaskId não retornado');
        throw new Error('TaskId não retornado');
      }

      const taskId = createData.data.taskId;
      console.log('📋 [RUNWAY HOOK] Task criada com sucesso:', taskId);
      toast.info('Task criada! Aguardando processamento...');
      setProgress(25);

      // Step 2: Poll for status com timeout reduzido
      const maxAttempts = 20; // 1min40s max (5s * 20)
      let attempts = 0;
      const pollInterval = 5000; // 5 segundos

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        attempts++;

        // Update progress based on time elapsed
        const progressPercent = 25 + Math.min(70, (attempts / maxAttempts) * 70);
        setProgress(progressPercent);

        console.log(`🔍 [RUNWAY HOOK] Verificando status (${attempts}/${maxAttempts})...`);
        toast.info(`Processando... ${Math.round((attempts / maxAttempts) * 100)}%`);

        // Status check simplificado
        const { data: statusData, error: statusError } = await supabase.functions.invoke('runway-test', {
          body: {
            action: 'status',
            taskId
          }
        });
        
        console.log(`📊 [RUNWAY HOOK] Status:`, { 
          hasData: !!statusData, 
          hasError: !!statusError,
          status: statusData?.data?.status 
        });

        if (statusError) {
          console.error('❌ [RUNWAY HOOK] Erro ao verificar status:', statusError);
          continue; // Keep trying
        }

        if (!statusData?.success) {
          if (statusData?.error) {
            console.error('❌ [RUNWAY HOOK] Task falhou:', statusData.error);
            toast.error(`Task falhou: ${statusData.error}`);
            return { success: false, error: statusData.error };
          }
          continue; // Keep trying
        }

        const { status, imageURL } = statusData.data;
        console.log(`📊 [RUNWAY HOOK] Status atual:`, status);

        if (status === 'SUCCEEDED' && imageURL) {
          setProgress(100);
          console.log('✅ [RUNWAY HOOK] Imagem gerada:', imageURL);
          toast.success('✅ Imagem gerada com sucesso!');
          return {
            success: true,
            data: {
              imageURL,
              taskId,
              model,
              promptText
            }
          };
        } else if (status === 'FAILED') {
          console.error('❌ [RUNWAY HOOK] Task falhou');
          toast.error('❌ Falha na geração da imagem');
          return { success: false, error: 'Task falhou na Runway API' };
        }
        
        // Ainda processando
        console.log(`⏳ [RUNWAY HOOK] Status: ${status}, aguardando...`);
      }

      // Timeout após todas as tentativas
      console.error(`❌ [RUNWAY HOOK] Timeout após ${maxAttempts} tentativas (${(maxAttempts * pollInterval) / 1000}s)`);
      toast.error('⏱️ Timeout: A geração está demorando mais que o esperado. Tente novamente.');
      return { success: false, error: `Timeout após ${(maxAttempts * pollInterval) / 1000} segundos` };

    } catch (error) {
      console.error('❌ [RUNWAY HOOK] Erro inesperado:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
        toast.error('A geração demorou muito. Tente novamente.');
      } else if (errorMessage.includes('network') || errorMessage.includes('NetworkError')) {
        toast.error('Erro de conexão. Verifique sua internet.');
      } else {
        toast.error(`Erro ao gerar imagem: ${errorMessage}`);
      }
      
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const generateMultipleVariations = async (
    promptText: string,
    model: 'gen4_image' | 'gen4_image_turbo' | 'gemini_2.5_flash' = 'gen4_image_turbo',
    referenceImageFile: File
  ): Promise<RunwayResult[]> => {
    if (!promptText.trim()) {
      toast.error('Por favor, insira um prompt válido');
      return [{ success: false, error: 'Prompt é obrigatório' }];
    }

    if (!referenceImageFile) {
      toast.error('Imagem de referência é obrigatória');
      return [{ success: false, error: 'Imagem de referência é obrigatória' }];
    }

    setIsProcessingMultiple(true);
    setMultiProgress(0);
    setCurrentVariation(0);

    try {
      toast.info('Preparando para gerar 3 variações...');
      
      // Compress and upload reference image once (reuse for all 3)
      const compressedFile = await compressImage(referenceImageFile, 0.75, 896);
      const referenceImageUrl = await uploadReferenceImage(compressedFile);
      
      const results: RunwayResult[] = [];
      
      for (let i = 0; i < 3; i++) {
        setCurrentVariation(i + 1);
        const baseProgress = (i / 3) * 100;
        setMultiProgress(baseProgress);
        
        toast.info(`Gerando variação ${i + 1}/3...`);
        
        try {
          // Use the same logic as single generation but with shared reference image
          const result = await generateSingleVariation(promptText, model, referenceImageUrl, i + 1);
          results.push(result);
          
          if (result.success) {
            // Dispatch event for each individual image
            const imageGeneratedEvent = new CustomEvent('imageGenerated', {
              detail: {
                source: 'runway',
                images: [result.data!.imageURL],
                productId: 'multi-generation',
                metadata: {
                  model,
                  prompt: promptText,
                  taskId: result.data!.taskId,
                  generatedAt: Date.now(),
                  hasReferenceImage: true,
                  batchId: Date.now().toString(),
                  imageIndex: i + 1,
                  totalVariations: 3
                }
              }
            });
            window.dispatchEvent(imageGeneratedEvent);
          }
          
          // Update progress
          setMultiProgress(baseProgress + 33.33);
          
          // Delay between generations to avoid rate limiting
          if (i < 2) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
        } catch (error) {
          console.error(`❌ [RUNWAY HOOK] Erro na variação ${i + 1}:`, error);
          results.push({ success: false, error: `Erro na variação ${i + 1}` });
        }
      }
      
      setMultiProgress(100);
      toast.success(`${results.filter(r => r.success).length}/3 variações geradas com sucesso!`);
      return results;
      
    } catch (error) {
      console.error('❌ [RUNWAY HOOK] Erro nas múltiplas gerações:', error);
      toast.error('Erro ao gerar variações');
      return [{ success: false, error: 'Erro ao gerar variações' }];
    } finally {
      setIsProcessingMultiple(false);
      setMultiProgress(0);
      setCurrentVariation(0);
    }
  };

  // Helper function for single variation generation (extracted from main function)
  const generateSingleVariation = async (
    promptText: string,
    model: string,
    referenceImageUrl: string,
    variationIndex: number
  ): Promise<RunwayResult> => {
    // Get auth session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData?.session?.access_token) {
      throw new Error('Usuário não autenticado');
    }

    // Prepare payload
    const createPayload = {
      action: 'create' as const,
      promptText: promptText.trim(),
      model,
      referenceImage: referenceImageUrl
    };

    // Invoke function to create task
    const { data: createData, error: createError } = await supabase.functions.invoke('runway-test', {
      body: createPayload,
      headers: { 'Content-Type': 'application/json' }
    });

    if (createError || !createData?.success || !createData?.data?.taskId) {
      throw new Error(`Erro na variação ${variationIndex}`);
    }

    const taskId = createData.data.taskId;
    
    // Poll for completion
    const maxAttempts = 30;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      attempts++;

      const { data: statusData, error: statusError } = await supabase.functions.invoke('runway-test', {
        body: { action: 'status', taskId }
      });

      if (statusError) continue;
      
      if (statusData?.success && statusData?.data?.status === 'SUCCEEDED' && statusData?.data?.imageURL) {
        return {
          success: true,
          data: {
            imageURL: statusData.data.imageURL,
            taskId,
            model,
            promptText
          }
        };
      } else if (statusData?.data?.status === 'FAILED') {
        throw new Error(`Variação ${variationIndex} falhou`);
      }
    }
    
    throw new Error(`Timeout na variação ${variationIndex}`);
  };

  return {
    generateTextToImage,
    generateMultipleVariations,
    isProcessing,
    progress,
    isProcessingMultiple,
    multiProgress,
    currentVariation
  };
};