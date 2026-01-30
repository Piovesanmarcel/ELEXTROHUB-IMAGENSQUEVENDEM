import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  type StepStatus,
  type ImageWebhookStatus,
  type ProductImage,
  type SceneType,
  SCENE_TYPES,
} from '../types';
import { MAX_RETRY_ATTEMPTS, RETRY_DELAYS, MAX_SCENE_RETRY_ATTEMPTS } from '../constants';
import {
  extractTextFromResponse,
  extractSection,
  extractFullSection,
  extractCopywritingSection,
  extractListItems,
  cleanText,
  buildMarketingText,
} from '../utils/textExtraction';
import type { UnifiedAIResponse } from '@/components/product/ai-enhancer/types';
import type { GeneratedImage } from '@/components/n8n/GeneratedImageGallery';
import type { SceneTypeStatus } from '@/components/n8n/ParallelGenerationMonitor';

interface UseGeneratorExecutionProps {
  webhookComandoUnificado: string;
  webhookCopywriting: string;
  webhookTratamentoCombinado: string;
  productName: string;
  productDescription: string;
  productImages: ProductImage[];
  userId: string | null;
  userEmail: string | null;
  selectedSceneTypes: SceneType[];
  generateMode: 'single' | 'multiple';
  enableCompression: boolean;
  processarUmSceneTypeComRetry: (
    basePayload: any,
    sceneType: SceneType,
    onStatusUpdate?: (status: SceneTypeStatus) => void
  ) => Promise<{ sceneType: SceneType; success: boolean; imageUrl?: string; mimeType?: string; error?: string; attempts: number; duration?: number }>;
  updateSceneStatus: (status: SceneTypeStatus) => void;
  prepareImagesForSending: () => Promise<{ index: number; filename: string; mimeType: string; base64: string }[]>;
}

// Initial step status
const initialStepStatus: StepStatus = {
  status: "idle",
  startedAt: null,
  completedAt: null,
  error: null,
  result: null
};

// Initial webhook status
const initialWebhookStatus: ImageWebhookStatus = {
  status: "idle",
  attemptedAt: null,
  httpStatus: null,
  responseText: null,
  errorMessage: null,
  payload: null,
  currentAttempt: 0,
  maxAttempts: MAX_RETRY_ATTEMPTS,
  nextRetryAt: null
};

export function useGeneratorExecution({
  webhookComandoUnificado,
  webhookCopywriting,
  webhookTratamentoCombinado,
  productName,
  productDescription,
  productImages,
  userId,
  userEmail,
  selectedSceneTypes,
  generateMode,
  enableCompression,
  processarUmSceneTypeComRetry,
  updateSceneStatus,
  prepareImagesForSending,
}: UseGeneratorExecutionProps) {
  // Estados
  const [step1, setStep1] = useState<StepStatus>(initialStepStatus);
  const [step2, setStep2] = useState<StepStatus>(initialStepStatus);
  const [tratamentoCombStatus, setTratamentoCombStatus] = useState<ImageWebhookStatus>(initialWebhookStatus);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageGenProgress, setImageGenProgress] = useState({ total: 0, completed: 0, failed: 0 });

  // Ref para retry timeout
  const retryTratamentoCombRef = useRef<NodeJS.Timeout | null>(null);

  // Consolidar dados de ambas as etapas
  const consolidateData = useCallback((comandoResult: UnifiedAIResponse | null, copywritingResult: string | null) => {
    let seoDescricao = '';
    let especificacoes: string[] = [];
    let beneficios: string[] = [];
    let publicoAlvo: string[] = [];

    if (comandoResult?.topicos_conversao?.improvedText) {
      const text = comandoResult.topicos_conversao.improvedText;
      seoDescricao = extractFullSection(text, '🔍');
      especificacoes = extractSection(text, '📋');
      beneficios = extractSection(text, '✨').slice(0, 6);
      publicoAlvo = extractSection(text, '💡').slice(0, 6);
    }

    let copyPersuasivo = '';
    let ambientesUso: string[] = [];

    if (copywritingResult) {
      const secao2 = extractCopywritingSection(copywritingResult, 2);
      copyPersuasivo = secao2.split('\n').slice(0, 5).join(' ').trim();

      const secao9 = extractCopywritingSection(copywritingResult, 9);
      ambientesUso = extractListItems(secao9).slice(0, 10);
    }

    return {
      request_id: `combined_${Date.now()}`,
      product_name: productName,
      user_id: userId,
      timestamp: new Date().toISOString(),
      action: "consolidate",

      seo: {
        descricao: cleanText(seoDescricao),
        especificacoes: especificacoes.map(e => cleanText(e)).join(', ')
      },

      marketing: {
        texto_marketing: buildMarketingText(copyPersuasivo, beneficios, publicoAlvo, ambientesUso)
      },

      images: productImages.map((img, index) => ({
        index: index + 1,
        filename: img.file.name,
        mimeType: img.file.type,
        base64: img.base64
      }))
    };
  }, [productName, userId, productImages]);

  // Executar apenas Etapa 1: Comando Unificado
  const executeStep1 = async () => {
    if (!webhookComandoUnificado) {
      toast.error("Configure a URL do webhook Comando Unificado");
      return;
    }
    if (!productName || !productDescription) {
      toast.error("Preencha o nome e descrição do produto");
      return;
    }

    const startTime = Date.now();
    setStep1(prev => ({ ...prev, status: "running", startedAt: new Date().toISOString(), error: null }));

    try {
      const payload = {
        product_name: productName,
        short_description: productDescription,
        long_description: productDescription,
        original_text: productDescription,
        request_id: `unified_${Date.now()}`,
        user_id: userId,
        images: productImages.map(img => ({
          mimeType: img.file.type,
          base64: img.base64.replace(/^data:image\/\w+;base64,/, '')
        })),
        seo: {
          especificacoes: productDescription,
          descricao: productDescription
        },
        marketing: {
          texto_marketing: productDescription
        }
      };

      const { data, error: functionError } = await supabase.functions.invoke("n8n-proxy", {
        body: {
          webhookUrl: webhookComandoUnificado,
          payload: payload
        }
      });

      if (functionError) throw new Error(`Erro na função: ${functionError.message}`);
      if (!data) throw new Error("Resposta vazia do n8n");
      const result = {
        topicos_conversao: data.topicos_conversao || null,
        palavras_chave_seo: data.palavras_chave_seo || null,
        perguntas_respostas: data.perguntas_respostas || null,
        kits_criativos: data.kits_criativos || null,
        cauda_longa: data.cauda_longa || null,
        copywriting: data.copywriting || null,
        usedAPI: data.usedAPI || 'openai',
        apiInfo: data.apiInfo || 'OpenAI via n8n'
      };

      setStep1({
        status: "success",
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        error: null,
        result,
        responseTime: Date.now() - startTime
      });
      toast.success("Etapa 1: Comando Unificado concluído!");
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro';
      setStep1(prev => ({ ...prev, status: "error", error: errorMsg, completedAt: new Date().toISOString() }));
      toast.error(`Etapa 1 falhou: ${errorMsg}`);
      return null;
    }
  };

  // Executar apenas Etapa 2: Copywriting
  const executeStep2 = async () => {
    if (!webhookCopywriting) {
      toast.error("Configure a URL do webhook Copywriting");
      return;
    }
    if (!productName || !productDescription) {
      toast.error("Preencha o nome e descrição do produto");
      return;
    }

    const startTime = Date.now();
    setStep2(prev => ({ ...prev, status: "running", startedAt: new Date().toISOString(), error: null }));

    try {
      const payload = {
        product_name: productName,
        short_description: productDescription,
        long_description: productDescription,
        user_id: userId,
        user_email: userEmail,
        request_id: `copywriting_${Date.now()}`,
        seo: {
          especificacoes: productDescription,
          descricao: productDescription
        },
        marketing: {
          texto_marketing: productDescription
        }
      };

      const { data, error: functionError } = await supabase.functions.invoke("n8n-proxy", {
        body: {
          webhookUrl: webhookCopywriting,
          payload: payload
        }
      });

      if (functionError) throw new Error(`Erro na função: ${functionError.message}`);
      const result = extractTextFromResponse(data);

      if (!result) {
        throw new Error("Não foi possível extrair texto da resposta");
      }

      setStep2({
        status: "success",
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        error: null,
        result,
        responseTime: Date.now() - startTime
      });
      toast.success("Etapa 2: Copywriting concluído!");
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro';
      setStep2(prev => ({ ...prev, status: "error", error: errorMsg, completedAt: new Date().toISOString() }));
      toast.error(`Etapa 2 falhou: ${errorMsg}`);
      return null;
    }
  };

  // Enviar para webhook Tratamento Combinado
  const sendToTratamentoCombinado = useCallback(async (
    payload: any,
    attempt: number = 1,
    onImagesGenerated?: (images: GeneratedImage[]) => void
  ) => {
    if (retryTratamentoCombRef.current) {
      clearTimeout(retryTratamentoCombRef.current);
      retryTratamentoCombRef.current = null;
    }

    if (!webhookTratamentoCombinado) {
      setTratamentoCombStatus(prev => ({
        ...prev,
        status: "error",
        errorMessage: "URL do webhook de tratamento não configurada"
      }));
      return;
    }

    // Modo paralelo: múltiplos sceneTypes
    if (generateMode === 'multiple' && selectedSceneTypes.length > 1) {
      console.log(`🚀 [Paralelo] Iniciando ${selectedSceneTypes.length} requisições paralelas...`);

      setTratamentoCombStatus(prev => ({
        ...prev,
        status: "sending",
        attemptedAt: new Date().toISOString(),
        payload,
        currentAttempt: 1,
        nextRetryAt: null
      }));

      toast.info(`Gerando ${selectedSceneTypes.length} imagens em paralelo...`);

      const imagesToSend = await prepareImagesForSending();
      const processedPayload = { ...payload, images: imagesToSend };

      const promises = selectedSceneTypes.map(sceneType => {
        const payloadWithScene = {
          ...processedPayload,
          request_id: `parallel_${Date.now()}_${sceneType}`,
          sceneType
        };
        return processarUmSceneTypeComRetry(payloadWithScene, sceneType, updateSceneStatus);
      });

      const results = await Promise.allSettled(promises);

      let successCount = 0;
      let failedCount = 0;
      const newImages: GeneratedImage[] = [];

      results.forEach((result, index) => {
        const sceneType = selectedSceneTypes[index];
        if (result.status === 'fulfilled' && result.value.success && result.value.imageUrl) {
          successCount++;
          newImages.push({
            imageUrl: result.value.imageUrl,
            mimeType: result.value.mimeType || 'image/png',
            generatedAt: new Date().toISOString(),
            productName: productName,
            sceneType: sceneType
          });
        } else {
          failedCount++;
        }
      });

      if (newImages.length > 0 && onImagesGenerated) {
        onImagesGenerated(newImages);
      }

      if (successCount === selectedSceneTypes.length) {
        setTratamentoCombStatus(prev => ({
          ...prev,
          status: "success",
          httpStatus: 200,
          responseText: `${successCount} imagens geradas com sucesso`,
          currentAttempt: 1,
          nextRetryAt: null
        }));
        toast.success(`🎉 ${successCount} imagens geradas com sucesso!`);
      } else if (successCount > 0) {
        setTratamentoCombStatus(prev => ({
          ...prev,
          status: "success",
          httpStatus: 200,
          responseText: `${successCount}/${selectedSceneTypes.length} imagens geradas`,
          currentAttempt: 1,
          nextRetryAt: null
        }));
        toast.warning(`${successCount} imagens geradas, ${failedCount} falharam`);
      } else {
        setTratamentoCombStatus(prev => ({
          ...prev,
          status: "error",
          errorMessage: `Todas as ${failedCount} requisições falharam`,
          currentAttempt: 1,
          nextRetryAt: null
        }));
        toast.error(`Todas as ${failedCount} requisições falharam`);
      }

      return;
    }

    // Modo single: um sceneType apenas
    setTratamentoCombStatus(prev => ({
      ...prev,
      status: attempt === 1 ? "sending" : "retrying",
      attemptedAt: new Date().toISOString(),
      payload,
      currentAttempt: attempt,
      nextRetryAt: null
    }));

    try {
      const { data: proxyResponse, error: proxyError } = await supabase.functions.invoke('n8n-proxy', {
        body: {
          webhookUrl: webhookTratamentoCombinado,
          payload: {
            ...payload,
            sceneType: selectedSceneTypes[0],
            action: "tratamento_com_imagem"
          }
        }
      });

      if (proxyError) {
        throw new Error(proxyError.message || 'Erro ao chamar proxy n8n');
      }

      const data = proxyResponse;

      setTratamentoCombStatus(prev => ({
        ...prev,
        status: "success",
        httpStatus: 200,
        responseText: JSON.stringify(data),
        currentAttempt: attempt,
        nextRetryAt: null
      }));

      // Processar imagem
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

      if (imageUrl && onImagesGenerated) {
        onImagesGenerated([{
          imageUrl,
          mimeType,
          generatedAt: new Date().toISOString(),
          productName: productName,
          sceneType: selectedSceneTypes[0]
        }]);
        toast.success("Imagem gerada e adicionada à galeria!");
      } else {
        toast.success(`Tratamento combinado enviado! (Tentativa ${attempt})`);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';

      if (attempt < MAX_RETRY_ATTEMPTS) {
        const delay = RETRY_DELAYS[attempt - 1] || 30000;
        const nextRetryTime = new Date(Date.now() + delay).toISOString();

        setTratamentoCombStatus(prev => ({
          ...prev,
          status: "retrying",
          errorMessage: `${errorMessage} - Tentativa ${attempt}/${MAX_RETRY_ATTEMPTS}`,
          currentAttempt: attempt,
          nextRetryAt: nextRetryTime
        }));

        retryTratamentoCombRef.current = setTimeout(() => {
          sendToTratamentoCombinado(payload, attempt + 1, onImagesGenerated);
        }, delay);

        toast.warning(`Tratamento: tentativa ${attempt} falhou. Reenviando em ${delay / 1000}s...`);
      } else {
        setTratamentoCombStatus(prev => ({
          ...prev,
          status: "error",
          errorMessage: `Falhou após ${MAX_RETRY_ATTEMPTS} tentativas: ${errorMessage}`,
          currentAttempt: attempt,
          nextRetryAt: null
        }));
        toast.error(`Tratamento falhou após ${MAX_RETRY_ATTEMPTS} tentativas`);
      }
    }
  }, [webhookTratamentoCombinado, productName, generateMode, selectedSceneTypes, processarUmSceneTypeComRetry, updateSceneStatus, prepareImagesForSending]);

  // Reenviar manualmente Tratamento Combinado
  const resendTratamentoCombinado = (onImagesGenerated?: (images: GeneratedImage[]) => void) => {
    if (retryTratamentoCombRef.current) {
      clearTimeout(retryTratamentoCombRef.current);
      retryTratamentoCombRef.current = null;
    }

    if (tratamentoCombStatus.payload) {
      sendToTratamentoCombinado(tratamentoCombStatus.payload, 1, onImagesGenerated);
    } else if (step1.result || step2.result) {
      const payload = consolidateData(step1.result, step2.result);
      sendToTratamentoCombinado(payload, 1, onImagesGenerated);
    }
  };

  // Executar Etapa 3: Enviar Tratamento Combinado
  const executeTratamentoCombinado = async (onImagesGenerated?: (images: GeneratedImage[]) => void) => {
    if (!webhookTratamentoCombinado) {
      toast.error("Configure a URL do webhook de tratamento");
      return;
    }
    if (!step1.result && !step2.result) {
      toast.error("Execute pelo menos uma das etapas primeiro");
      return;
    }

    const payload = consolidateData(step1.result, step2.result);
    await sendToTratamentoCombinado(payload, 1, onImagesGenerated);
  };

  // Executar fluxo completo
  const executeFullFlow = async (onImagesGenerated?: (images: GeneratedImage[]) => void) => {
    if (!webhookComandoUnificado && !webhookCopywriting) {
      toast.error("Configure pelo menos uma URL de webhook");
      return;
    }

    if (!productName || !productDescription) {
      toast.error("Preencha o nome e descrição do produto");
      return;
    }

    setIsExecuting(true);

    // Reset states
    setStep1(initialStepStatus);
    setStep2(initialStepStatus);
    setTratamentoCombStatus(initialWebhookStatus);

    let comandoResult: UnifiedAIResponse | null = null;
    let copywritingResult: string | null = null;

    // ETAPA 1: Comando Unificado
    if (webhookComandoUnificado) {
      comandoResult = await executeStep1() as UnifiedAIResponse | null;
    }

    // ETAPA 2: Copywriting
    if (webhookCopywriting) {
      copywritingResult = await executeStep2() as string | null;
    }

    // ETAPA 3: Tratamento Combinado
    if (webhookTratamentoCombinado && (comandoResult || copywritingResult)) {
      const combinedPayload = consolidateData(comandoResult, copywritingResult);
      await sendToTratamentoCombinado(combinedPayload, 1, onImagesGenerated);
    }

    setIsExecuting(false);
  };

  // Função de delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Estado para etapa atual do fluxo mágico
  const [magicFlowStep, setMagicFlowStep] = useState<string>('');

  // Executar fluxo mágico com delays entre etapas
  const executeMagicFlow = async (
    onImagesGenerated?: (images: GeneratedImage[]) => void,
    onStepChange?: (step: string) => void
  ) => {
    if (!webhookComandoUnificado) {
      toast.error("Configure a URL do webhook Comando Unificado");
      return;
    }
    if (!webhookCopywriting) {
      toast.error("Configure a URL do webhook Copywriting");
      return;
    }
    if (!webhookTratamentoCombinado) {
      toast.error("Configure a URL do webhook Tratamento Combinado");
      return;
    }

    setIsExecuting(true);

    // Reset states
    setStep1(initialStepStatus);
    setStep2(initialStepStatus);
    setTratamentoCombStatus(initialWebhookStatus);

    let comandoResult: UnifiedAIResponse | null = null;
    let copywritingResult: string | null = null;

    try {
      // ETAPA 1: ATLAS - Comando Unificado
      const step1Msg = "🔵 ATLAS analisando produto...";
      setMagicFlowStep(step1Msg);
      onStepChange?.(step1Msg);
      toast.info(step1Msg);

      comandoResult = await executeStep1() as UnifiedAIResponse | null;

      if (!comandoResult) {
        throw new Error("Falha na etapa ATLAS");
      }

      // DELAY 2 segundos
      await delay(2000);

      // ETAPA 2: LYRA - Copywriting
      const step2Msg = "🟣 LYRA gerando copy persuasivo...";
      setMagicFlowStep(step2Msg);
      onStepChange?.(step2Msg);
      toast.info(step2Msg);

      copywritingResult = await executeStep2() as string | null;

      if (!copywritingResult) {
        throw new Error("Falha na etapa LYRA");
      }

      // DELAY 2 segundos
      await delay(2000);

      // ETAPA 3: ORION - Tratamento (8 Cenas)
      const step3Msg = "🟠 ORION criando imagens profissionais...";
      setMagicFlowStep(step3Msg);
      onStepChange?.(step3Msg);
      toast.info(step3Msg);

      const combinedPayload = consolidateData(comandoResult, copywritingResult);
      await sendToTratamentoCombinado(combinedPayload, 1, onImagesGenerated);

      toast.success("✨ Fluxo mágico concluído com sucesso!");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Fluxo mágico falhou: ${errorMsg}`);
    } finally {
      setIsExecuting(false);
      setMagicFlowStep('');
      onStepChange?.('');
    }
  };

  // Gerar imagem via n8n
  const generateImageViaN8N = async (
    onImagesGenerated: (images: GeneratedImage[]) => void,
    setSceneStatuses: (statuses: SceneTypeStatus[]) => void,
    checkCreditsAvailable?: (scenesCount: number) => boolean
  ) => {
    if (!webhookTratamentoCombinado) {
      toast.error("Configure a URL do webhook de tratamento combinado");
      return;
    }
    if (!productName) {
      toast.error("Preencha o nome do produto");
      return;
    }
    if (productImages.length === 0) {
      toast.error("Adicione pelo menos uma imagem de referência");
      return;
    }
    if (selectedSceneTypes.length === 0) {
      toast.error("Selecione pelo menos um tipo de cena");
      return;
    }

    // Verificar créditos antes de iniciar
    const scenesCount = generateMode === 'multiple' ? selectedSceneTypes.length : 1;
    if (checkCreditsAvailable && !checkCreditsAvailable(scenesCount)) {
      return;
    }

    // Warn if using test webhook
    if (webhookTratamentoCombinado.includes('/webhook-test/')) {
      toast.warning("URL contém '/webhook-test/' - funciona apenas com workflow aberto no editor.");
    }

    // Feedback imediato
    const sceneCount = generateMode === 'multiple' ? selectedSceneTypes.length : 1;
    toast.success(`🚀 Geração iniciada!`, {
      description: sceneCount > 1 ? `Preparando ${sceneCount} imagens...` : 'Preparando sua imagem...',
      duration: 3000
    });

    setIsGeneratingImage(true);
    setImageGenProgress({ total: 0, completed: 0, failed: 0 });

    try {
      // Build base payload
      const basePayload = {
        product_name: productName,
        user_id: userId,
        timestamp: new Date().toISOString(),
        action: "generate_image",
        seo: {
          descricao: productDescription || '',
          especificacoes: ''
        },
        marketing: {
          texto_marketing: productDescription || ''
        },
        images: productImages.map((img, index) => ({
          index: index + 1,
          filename: img.file.name,
          mimeType: img.file.type,
          base64: img.base64
        }))
      };

      // Multiple mode
      if (generateMode === 'multiple' && selectedSceneTypes.length >= 1) {
        const total = selectedSceneTypes.length;
        setImageGenProgress({ total, completed: 0, failed: 0 });

        // Inicializar status de todas as cenas
        const initialStatuses: SceneTypeStatus[] = selectedSceneTypes.map(sceneType => ({
          sceneType,
          label: SCENE_TYPES.find(s => s.id === sceneType)?.label || sceneType,
          status: 'pending',
          attempts: 0,
          maxAttempts: MAX_SCENE_RETRY_ATTEMPTS
        }));
        setSceneStatuses(initialStatuses);

        toast.info(`Gerando ${total} imagens com retry automático...`);

        // Compressão opcional
        let processedPayload = { ...basePayload };
        if (enableCompression) {
          const imagesToSend = await prepareImagesForSending();
          processedPayload.images = imagesToSend;
        }

        // Executar com retry automático
        const promises = selectedSceneTypes.map(sceneType => {
          const payloadWithScene = {
            ...processedPayload,
            request_id: `image_gen_${Date.now()}_${sceneType}`,
            sceneType
          };
          return processarUmSceneTypeComRetry(payloadWithScene, sceneType, updateSceneStatus);
        });

        const results = await Promise.allSettled(promises);

        let successCount = 0;
        let failedCount = 0;
        const newImages: GeneratedImage[] = [];

        results.forEach((result, index) => {
          const sceneType = selectedSceneTypes[index];
          if (result.status === 'fulfilled' && result.value.success && result.value.imageUrl) {
            successCount++;
            newImages.push({
              imageUrl: result.value.imageUrl,
              mimeType: result.value.mimeType || 'image/png',
              generatedAt: new Date().toISOString(),
              productName: productName,
              sceneType: sceneType
            });
          } else {
            failedCount++;
          }

          setImageGenProgress({ total, completed: successCount, failed: failedCount });
        });

        if (newImages.length > 0) {
          onImagesGenerated(newImages);
        }

        if (successCount === total) {
          toast.success(`🎉 ${successCount} imagens geradas com sucesso!`);
        } else if (successCount > 0) {
          toast.warning(`${successCount}/${total} imagens geradas, ${failedCount} falharam após retries`);
        } else {
          toast.error(`Todas as ${failedCount} requisições falharam após retries`);
        }

        return;
      }

      // Single mode
      const payload = {
        ...basePayload,
        request_id: `image_gen_${Date.now()}`,
        sceneType: selectedSceneTypes[0]
      };

      const { data: proxyResponse, error: proxyError } = await supabase.functions.invoke('n8n-proxy', {
        body: {
          webhookUrl: webhookTratamentoCombinado,
          payload
        }
      });

      if (proxyError) {
        throw new Error(proxyError.message || 'Erro ao chamar proxy n8n');
      }

      const data = proxyResponse;

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
        onImagesGenerated([{
          imageUrl,
          mimeType,
          generatedAt: new Date().toISOString(),
          productName: productName,
          sceneType: selectedSceneTypes[0]
        }]);
        toast.success("Imagem gerada com sucesso!");
      } else {
        throw new Error("Resposta não contém imageUrl");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Erro ao gerar imagem:', errorMsg);
      toast.error(`Erro ao gerar imagem: ${errorMsg}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Calcular progresso
  const calculateProgress = useCallback(() => {
    let progress = 0;
    if (step1.status === "success") progress += 30;
    else if (step1.status === "running") progress += 15;
    if (step2.status === "success") progress += 30;
    else if (step2.status === "running") progress += 15;
    if (tratamentoCombStatus.status === "success") progress += 40;
    else if (tratamentoCombStatus.status === "sending" || tratamentoCombStatus.status === "retrying") progress += 20;
    return Math.min(progress, 100);
  }, [step1.status, step2.status, tratamentoCombStatus.status]);

  // Cleanup
  const cleanup = useCallback(() => {
    if (retryTratamentoCombRef.current) {
      clearTimeout(retryTratamentoCombRef.current);
      retryTratamentoCombRef.current = null;
    }
  }, []);

  return {
    // Estados
    step1,
    step2,
    tratamentoCombStatus,
    isExecuting,
    isGeneratingImage,
    imageGenProgress,
    magicFlowStep,

    // Funções
    executeStep1,
    executeStep2,
    executeTratamentoCombinado,
    executeFullFlow,
    executeMagicFlow,
    generateImageViaN8N,
    resendTratamentoCombinado,
    consolidateData,
    calculateProgress,
    cleanup,

    // Setters (para uso externo)
    setStep1,
    setStep2,
    setTratamentoCombStatus,
  };
}
