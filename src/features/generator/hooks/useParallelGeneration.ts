import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  SCENE_TYPES, 
  type SceneType,
  type ProductImage
} from '../types';
import { MAX_SCENE_RETRY_ATTEMPTS, SCENE_RETRY_DELAYS } from '../constants';
import type { SceneTypeStatus } from '@/components/n8n/ParallelGenerationMonitor';
import type { GeneratedImage } from '@/components/n8n/GeneratedImageGallery';
import { useN8NGenerationLogs } from '@/hooks/useN8NGenerationLogs';
import { useImageCache } from '@/hooks/useImageCache';
import { compressMultipleImages, needsCompression } from '@/lib/imageCompression';
import { useEnhancementUsage } from '@/hooks/useEnhancementUsage';
import { useCreditReservation } from '@/hooks/useCreditReservation';

interface UseParallelGenerationProps {
  webhookTratamentoCombinado: string;
  productName: string;
  productDescription: string;
  productImages: ProductImage[];
  userId: string | null;
  enableCompression: boolean;
}

interface ParallelGenerationResult {
  sceneType: SceneType;
  success: boolean;
  imageUrl?: string;
  mimeType?: string;
  error?: string;
  attempts: number;
  duration?: number;
  responseData?: any;
}

export function useParallelGeneration({
  webhookTratamentoCombinado,
  productName,
  productDescription,
  productImages,
  userId,
  enableCompression,
}: UseParallelGenerationProps) {
  // Estados
  const [isTestingParallel, setIsTestingParallel] = useState(false);
  const [parallelTestProgress, setParallelTestProgress] = useState({ current: 0, total: 8, completed: 0, failed: 0 });
  const [sceneStatuses, setSceneStatuses] = useState<SceneTypeStatus[]>([]);

  // Hooks
  const { saveLog } = useN8NGenerationLogs();
  const { cacheImage } = useImageCache();
  const { usage, isLoading: isLoadingCredits, refetchUsage } = useEnhancementUsage();
  const { reserveCredit, confirmReservation, refundReservation } = useCreditReservation();

  // Atualizar status de uma cena específica
  const updateSceneStatus = useCallback((newStatus: SceneTypeStatus) => {
    setSceneStatuses(prev => {
      const existingIndex = prev.findIndex(s => s.sceneType === newStatus.sceneType);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newStatus;
        return updated;
      }
      return [...prev, newStatus];
    });
  }, []);

  // Processar UM sceneType individual
  const processarUmSceneType = async (
    basePayload: any, 
    sceneType: SceneType
  ): Promise<ParallelGenerationResult> => {
    console.log(`🎬 [Paralelo] Processando sceneType: ${sceneType}`);
    
    try {
      const { data: proxyResponse, error: proxyError } = await supabase.functions.invoke('n8n-proxy', {
        body: {
          webhookUrl: webhookTratamentoCombinado,
          payload: {
            ...basePayload,
            sceneType,
            action: "tratamento_com_imagem"
          }
        }
      });

      if (proxyError) {
        throw new Error(proxyError.message || 'Erro ao chamar proxy n8n');
      }

      const data = proxyResponse;
      console.log(`📥 [Paralelo] Resposta para ${sceneType}:`, JSON.stringify(data).substring(0, 200));

      // Extrair imagem da resposta
      let imageUrl: string | undefined;
      let mimeType: string = 'image/png';

      if (data?.imageUrl) {
        imageUrl = data.imageUrl;
        mimeType = data.mimeType || 'image/png';
      } else if (data?.base64) {
        imageUrl = `data:${data.mimeType || 'image/png'};base64,${data.base64}`;
        mimeType = data.mimeType || 'image/png';
      } else if (data?.result?.imageUrl) {
        imageUrl = data.result.imageUrl;
        mimeType = data.result.mimeType || 'image/png';
      } else if (data?.imagem) {
        imageUrl = data.imagem;
        mimeType = data.tipoMime || 'image/png';
      }

      if (imageUrl) {
        return { sceneType, success: true, imageUrl, mimeType, responseData: data, attempts: 1 };
      } else {
        return { sceneType, success: false, error: 'Resposta sem imagem', responseData: data, attempts: 1 };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error(`❌ [Paralelo] Erro em ${sceneType}:`, errorMessage);
      return { sceneType, success: false, error: errorMessage, attempts: 1 };
    }
  };

  // Processar UM sceneType COM RETRY AUTOMÁTICO E PRÉ-RESERVA DE CRÉDITO
  const processarUmSceneTypeComRetry = async (
    basePayload: any, 
    sceneType: SceneType,
    onStatusUpdate?: (status: SceneTypeStatus) => void,
    reservationId?: string // Reserva já criada externamente
  ): Promise<ParallelGenerationResult> => {
    const sceneLabel = SCENE_TYPES.find(s => s.id === sceneType)?.label || sceneType;
    const startTime = Date.now();
    let lastError = '';
    let localReservationId = reservationId;
    
    // Se não tiver reserva, criar uma ANTES de processar
    if (!localReservationId) {
      console.log(`💳 [Pré-Reserva] Reservando crédito para ${sceneType}...`);
      const reservation = await reserveCredit(1, 'image_generation', sceneType);
      
      if (!reservation.success || !reservation.reservationId) {
        console.error(`❌ [Pré-Reserva] Falha ao reservar crédito para ${sceneType}: ${reservation.error}`);
        
        if (onStatusUpdate) {
          onStatusUpdate({
            sceneType,
            label: sceneLabel,
            status: 'error',
            attempts: 0,
            maxAttempts: MAX_SCENE_RETRY_ATTEMPTS,
            error: reservation.error || 'Créditos insuficientes',
            startedAt: startTime,
            completedAt: Date.now(),
            duration: Date.now() - startTime
          });
        }
        
        return { 
          sceneType, 
          success: false, 
          error: reservation.error || 'Créditos insuficientes', 
          attempts: 0 
        };
      }
      
      localReservationId = reservation.reservationId;
      console.log(`✅ [Pré-Reserva] Crédito reservado: ${localReservationId}`);
    }
    
    for (let attempt = 1; attempt <= MAX_SCENE_RETRY_ATTEMPTS; attempt++) {
      // Atualizar status para processing/retrying
      if (onStatusUpdate) {
        onStatusUpdate({
          sceneType,
          label: sceneLabel,
          status: attempt === 1 ? 'processing' : 'retrying',
          attempts: attempt,
          maxAttempts: MAX_SCENE_RETRY_ATTEMPTS,
          startedAt: startTime
        });
      }
      
      console.log(`🔄 [Retry] ${sceneType} - Tentativa ${attempt}/${MAX_SCENE_RETRY_ATTEMPTS}`);
      
      const result = await processarUmSceneType(basePayload, sceneType);
      
      if (result.success && result.imageUrl) {
        const duration = Date.now() - startTime;
        
        // CONFIRMAR a reserva (crédito já foi debitado na reserva)
        const confirmed = await confirmReservation(localReservationId!);
        if (confirmed) {
          console.log(`✅ [Confirmação] Reserva ${localReservationId} confirmada para ${sceneType}`);
        } else {
          console.warn(`⚠️ [Confirmação] Falha ao confirmar reserva ${localReservationId}`);
        }
        
        // Cachear a imagem gerada
        cacheImage(productName, sceneType, result.imageUrl, result.mimeType);
        
        // Salvar log de sucesso
        if (userId) {
          saveLog({
            user_id: userId,
            product_name: productName,
            webhook_url: webhookTratamentoCombinado,
            scene_type: sceneType,
            status: 'success',
            attempts: attempt,
            image_url: result.imageUrl,
            duration_ms: duration,
            request_payload: basePayload,
            response_data: result.responseData,
            n8n_node_config: { 
              webhook_url: webhookTratamentoCombinado,
              retry_attempts: attempt,
              reservation_id: localReservationId
            }
          });
        }
        
        if (onStatusUpdate) {
          onStatusUpdate({
            sceneType,
            label: sceneLabel,
            status: 'success',
            attempts: attempt,
            maxAttempts: MAX_SCENE_RETRY_ATTEMPTS,
            imageUrl: result.imageUrl,
            startedAt: startTime,
            completedAt: Date.now(),
            duration
          });
        }
        
        return { 
          sceneType, 
          success: true, 
          imageUrl: result.imageUrl, 
          mimeType: result.mimeType, 
          attempts: attempt,
          duration 
        };
      }
      
      lastError = result.error || 'Erro desconhecido';
      
      // Delay exponencial entre tentativas
      if (attempt < MAX_SCENE_RETRY_ATTEMPTS) {
        const delay = SCENE_RETRY_DELAYS[attempt - 1] || 4000;
        console.log(`⏳ [Retry] ${sceneType} - Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    const duration = Date.now() - startTime;
    
    // ESTORNAR a reserva em caso de falha total
    console.log(`↩️ [Estorno] Estornando reserva ${localReservationId} após falha em ${sceneType}...`);
    const refunded = await refundReservation(localReservationId!);
    if (refunded) {
      console.log(`✅ [Estorno] Crédito devolvido para ${sceneType}`);
    } else {
      console.warn(`⚠️ [Estorno] Falha ao estornar reserva ${localReservationId}`);
    }
    
    // Salvar log de erro
    if (userId) {
      saveLog({
        user_id: userId,
        product_name: productName,
        webhook_url: webhookTratamentoCombinado,
        scene_type: sceneType,
        status: 'error',
        attempts: MAX_SCENE_RETRY_ATTEMPTS,
        error_message: lastError,
        duration_ms: duration,
        request_payload: basePayload,
        n8n_node_config: { 
          webhook_url: webhookTratamentoCombinado,
          retry_attempts: MAX_SCENE_RETRY_ATTEMPTS,
          reservation_id: localReservationId,
          refunded: refunded
        }
      });
    }
    
    if (onStatusUpdate) {
      onStatusUpdate({
        sceneType,
        label: sceneLabel,
        status: 'error',
        attempts: MAX_SCENE_RETRY_ATTEMPTS,
        maxAttempts: MAX_SCENE_RETRY_ATTEMPTS,
        error: lastError,
        startedAt: startTime,
        completedAt: Date.now(),
        duration
      });
    }
    
    return { sceneType, success: false, error: lastError, attempts: MAX_SCENE_RETRY_ATTEMPTS, duration };
  };

  // Preparar imagens para envio (com compressão opcional)
  const prepareImagesForSending = async () => {
    let imagesToSend = productImages.map((img, index) => ({
      index: index + 1,
      filename: img.file.name,
      mimeType: img.file.type,
      base64: img.base64
    }));

    if (enableCompression) {
      const needsComp = productImages.some(img => needsCompression(img.base64, 500));
      if (needsComp) {
        console.log('🗜️ [Compressão] Comprimindo imagens antes do envio...');
        toast.info('Comprimindo imagens...');
        const compressed = await compressMultipleImages(
          productImages.map(img => ({ base64: img.base64, filename: img.file.name })),
          { maxWidth: 1024, maxHeight: 1024, quality: 0.8, format: 'jpeg' }
        );
        imagesToSend = compressed.map((c, index) => ({
          index: index + 1,
          filename: c.filename || `image_${index + 1}.jpg`,
          mimeType: c.mimeType,
          base64: c.base64
        }));
      }
    }

    return imagesToSend;
  };

  // Verificar créditos antes de gerar
  const checkCreditsAvailable = useCallback((scenesCount: number): boolean => {
    if (isLoadingCredits) {
      toast.error("Aguarde, carregando informações de créditos...");
      return false;
    }
    
    const creditsAvailable = usage?.enhancements_available ?? 0;
    
    if (creditsAvailable < scenesCount) {
      toast.error(
        `Créditos insuficientes! Você tem ${creditsAvailable} créditos, mas precisa de ${scenesCount}.`,
        {
          duration: 8000,
          action: {
            label: "Comprar créditos",
            onClick: () => window.location.href = "/pricing"
          }
        }
      );
      return false;
    }
    
    return true;
  }, [usage, isLoadingCredits]);

  // Teste Paralelo (8 cenas) com retry
  const testParallelWebhook = async (
    onImagesGenerated: (images: GeneratedImage[]) => void,
    onComplete: () => void
  ) => {
    if (!webhookTratamentoCombinado) {
      toast.error("Configure a URL do webhook Tratamento Combinado");
      return;
    }
    if (productImages.length === 0) {
      toast.error("Adicione pelo menos uma imagem de referência");
      return;
    }
    if (!productName) {
      toast.error("Preencha o nome do produto");
      return;
    }

    const allSceneTypes = SCENE_TYPES.map(s => s.id);
    
    // Verificar créditos antes de iniciar
    if (!checkCreditsAvailable(allSceneTypes.length)) {
      return;
    }

    setIsTestingParallel(true);
    setParallelTestProgress({ current: 0, total: allSceneTypes.length, completed: 0, failed: 0 });

    // Inicializar status de todas as cenas
    const initialStatuses: SceneTypeStatus[] = allSceneTypes.map(sceneType => ({
      sceneType,
      label: SCENE_TYPES.find(s => s.id === sceneType)?.label || sceneType,
      status: 'pending',
      attempts: 0,
      maxAttempts: MAX_SCENE_RETRY_ATTEMPTS
    }));
    setSceneStatuses(initialStatuses);

    console.log(`🧪 [Teste Paralelo] Iniciando ${allSceneTypes.length} requisições com retry automático...`);
    toast.info(`🧪 Testando ${allSceneTypes.length} requisições com retry automático...`);

    // Preparar imagens
    const imagesToSend = await prepareImagesForSending();

    // Criar payload base
    const basePayload = {
      request_id: `parallel_test_${Date.now()}`,
      product_name: productName,
      user_id: userId,
      timestamp: new Date().toISOString(),
      images: imagesToSend,
      seo: {
        descricao: productDescription || '',
        especificacoes: ''
      },
      marketing: {
        texto_marketing: ''
      }
    };

    try {
      // Executar todas em paralelo COM RETRY
      const promises = allSceneTypes.map(sceneType => 
        processarUmSceneTypeComRetry(basePayload, sceneType, updateSceneStatus)
      );

      const results = await Promise.allSettled(promises);

      // Processar resultados
      let successCount = 0;
      let failedCount = 0;
      const newImages: GeneratedImage[] = [];

      results.forEach((result, index) => {
        const sceneType = allSceneTypes[index];
        const sceneLabel = SCENE_TYPES.find(s => s.id === sceneType)?.label || sceneType;

        if (result.status === 'fulfilled' && result.value.success && result.value.imageUrl) {
          successCount++;
          newImages.push({
            imageUrl: result.value.imageUrl,
            mimeType: result.value.mimeType || 'image/png',
            generatedAt: new Date().toISOString(),
            productName: productName,
            sceneType: sceneType
          });
          console.log(`✅ [Teste Paralelo] ${sceneLabel} - Sucesso após ${result.value.attempts} tentativa(s)!`);
        } else {
          failedCount++;
          const errorMsg = result.status === 'fulfilled' ? result.value.error : 'Promise rejeitada';
          console.error(`❌ [Teste Paralelo] ${sceneLabel} - Falhou após ${MAX_SCENE_RETRY_ATTEMPTS} tentativas: ${errorMsg}`);
        }

        setParallelTestProgress(prev => ({
          ...prev,
          current: index + 1,
          completed: successCount,
          failed: failedCount
        }));
      });

      // Callback com novas imagens
      if (newImages.length > 0) {
        onImagesGenerated(newImages);
      }

      // Toast com resultado
      if (successCount === allSceneTypes.length) {
        toast.success(`🎉 Teste Paralelo: ${successCount}/${allSceneTypes.length} imagens geradas com sucesso!`);
      } else if (successCount > 0) {
        toast.warning(`🧪 Teste Paralelo: ${successCount} sucesso, ${failedCount} falhas após retries`);
      } else {
        toast.error(`❌ Teste Paralelo: Todas as ${failedCount} requisições falharam após retries`);
      }

      // Atualizar créditos após todas as gerações
      await refetchUsage();

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('[Teste Paralelo] Erro geral:', errorMsg);
      toast.error(`Erro no teste paralelo: ${errorMsg}`);
    } finally {
      setIsTestingParallel(false);
      onComplete();
    }
  };

  // Retry de uma cena específica que falhou
  const retryFailedScene = async (
    sceneType: string,
    onImageGenerated: (image: GeneratedImage) => void
  ) => {
    const imagesToSend = await prepareImagesForSending();
    
    const basePayload = {
      request_id: `retry_${Date.now()}_${sceneType}`,
      product_name: productName,
      user_id: userId,
      timestamp: new Date().toISOString(),
      images: imagesToSend,
      seo: { descricao: productDescription || '', especificacoes: '' },
      marketing: { texto_marketing: '' }
    };

    const result = await processarUmSceneTypeComRetry(basePayload, sceneType as SceneType, updateSceneStatus);
    
    if (result.success && result.imageUrl) {
      onImageGenerated({
        imageUrl: result.imageUrl,
        mimeType: result.mimeType || 'image/png',
        generatedAt: new Date().toISOString(),
        productName: productName,
        sceneType: sceneType
      });
      toast.success(`${SCENE_TYPES.find(s => s.id === sceneType)?.label} gerada com sucesso!`);
    }
  };

  // Retry de todas as cenas que falharam
  const retryAllFailedScenes = async (onImageGenerated: (image: GeneratedImage) => void) => {
    const failedScenes = sceneStatuses.filter(s => s.status === 'error').map(s => s.sceneType);
    if (failedScenes.length === 0) return;

    toast.info(`Reenviando ${failedScenes.length} cenas que falharam...`);
    
    for (const sceneType of failedScenes) {
      await retryFailedScene(sceneType, onImageGenerated);
    }
  };

  return {
    // Estados
    isTestingParallel,
    parallelTestProgress,
    sceneStatuses,
    setSceneStatuses,
    
    // Créditos
    creditsAvailable: usage?.enhancements_available ?? 0,
    isLoadingCredits,
    checkCreditsAvailable,
    refetchCredits: refetchUsage,
    
    // Funções
    testParallelWebhook,
    retryFailedScene,
    retryAllFailedScenes,
    updateSceneStatus,
    processarUmSceneTypeComRetry,
    prepareImagesForSending,
  };
}
