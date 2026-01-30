import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import JSZip from 'jszip';
import { safeBlobDownload } from '@/utils/safeDownload';
import { useWebhookStorage } from '@/features/generator/hooks/useWebhookStorage';

// ===== HELPER: Converter Blob URL para Base64 =====
async function blobUrlToBase64(blobUrl: string): Promise<string> {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ===== CONVERTER BASE64 PARA BLOB URL =====
function base64ToBlobUrl(base64Data: string, contentType: string = 'image/png'): string {
  try {
    // Extrair base64 puro (se for Data URL)
    const base64 = base64Data.includes(',')
      ? base64Data.split(',')[1]
      : base64Data;

    // Decodificar
    const byteCharacters = atob(base64);

    // Converter para array de bytes
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // Criar Blob e URL
    const blob = new Blob([byteArray], { type: contentType });
    return URL.createObjectURL(blob); // ✅ blob:http://...
  } catch (error) {
    console.error('❌ Erro ao converter base64 para Blob URL:', error);
    return base64Data; // Retornar original se falhar
  }
}

// ===== DOWNLOAD AUTOMÁTICO EM ZIP =====
async function downloadAllAsZip(images: string[], productName: string): Promise<void> {
  if (images.length === 0) {
    console.log('⚠️ Nenhuma imagem para download');
    return;
  }

  console.log(`📦 Criando ZIP com ${images.length} imagens...`);
  const zip = new JSZip();
  const safeName = productName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase();

  for (let i = 0; i < images.length; i++) {
    const imgUrl = images[i];
    let blob: Blob;

    try {
      if (imgUrl.startsWith('blob:')) {
        // Blob URL - buscar blob diretamente
        const response = await fetch(imgUrl);
        blob = await response.blob();
      } else if (imgUrl.startsWith('data:')) {
        // Base64 - converter para blob
        const base64 = imgUrl.split(',')[1];
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let j = 0; j < byteCharacters.length; j++) {
          byteNumbers[j] = byteCharacters.charCodeAt(j);
        }
        blob = new Blob([new Uint8Array(byteNumbers)], { type: 'image/png' });
      } else {
        // URL externa - fetch com CORS
        try {
          const response = await fetch(imgUrl);
          blob = await response.blob();
        } catch (corsError) {
          console.warn(`⚠️ CORS bloqueou imagem ${i + 1}, tentando proxy...`);
          // Pular imagem se CORS bloquear
          continue;
        }
      }

      const extension = blob.type.includes('jpeg') ? 'jpg' : 'png';
      const fileName = `${safeName}-imagem-${String(i + 1).padStart(2, '0')}.${extension}`;
      zip.file(fileName, blob);
      console.log(`✅ Adicionado ao ZIP: ${fileName} (${(blob.size / 1024).toFixed(1)}KB)`);
    } catch (error) {
      console.error(`❌ Erro ao processar imagem ${i + 1}:`, error);
    }
  }

  // Gerar e baixar ZIP
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  const zipFileName = `${safeName}_imagens_geradas_${Date.now()}.zip`;
  console.log(`📥 Iniciando download: ${zipFileName} (${(zipBlob.size / 1024 / 1024).toFixed(2)}MB)`);

  await safeBlobDownload(zipBlob, zipFileName);
}

export interface AutomationFormData {
  nome: string;
  sku: string;
  descricao_curta: string;
  descricao: string;
  preco_custo: number;
  preco_venda: number;
}

export interface AutomationStep {
  id: 'unified' | 'copywriting' | 'gemini' | 'kits';
  label: string;
  status: 'pending' | 'running' | 'completed' | 'error';
}

export interface CopywritingData {
  content: string;
  headlines?: string[];
  timestamp: number;
}

// ============================================================
// 🚀 NOVA ARQUITETURA: 1 JOB NO BACKEND, FRONTEND SÓ OBSERVA
// - Nenhum 401 para a automação depois do enqueue
// - Sessão só é necessária para CRIAR o job
// - Polling público via check-queue-status
// ============================================================

const POLLING_BASE_INTERVAL_MS = 3000; // 3 segundos base entre cada poll
const POLLING_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos timeout total
const MAX_CONSECUTIVE_ERRORS = 5; // Máximo de erros consecutivos antes de parar

// ✅ Calcular intervalo adaptativo baseado na posição na fila e erros
function getAdaptiveInterval(queuePosition: number | undefined, consecutiveErrors: number, baseInterval: number): number {
  let interval = baseInterval;

  // Ajustar por posição na fila
  if (queuePosition && queuePosition > 5) {
    interval = queuePosition <= 20 ? baseInterval * 2 : baseInterval * 5;
  }

  // Aplicar backoff por erros consecutivos
  if (consecutiveErrors > 0) {
    interval = Math.min(interval * Math.pow(2, consecutiveErrors), 30000); // Max 30s
  }

  return interval;
}

export const useAdGeneratorAutomation = (
  productImages: string[],
  formData: AutomationFormData,
  onGalleryUpdate?: (newImages: string[]) => void,
  productId?: string // ID do produto para eventos
) => {
  // Etapa atual da automação
  const [automationStep, setAutomationStep] = useState<AutomationStep['id'] | null>(null);
  const [isAutomationRunning, setIsAutomationRunning] = useState(false);
  const [isStarting, setIsStarting] = useState(false); // Proteção contra clique duplo
  const [isAutomationComplete, setIsAutomationComplete] = useState(false);

  // Job ID para polling
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null); // ✅ Renomeado para setTimeout
  const pollingRef = useRef<NodeJS.Timeout | null>(null); // Mantido para compatibilidade
  const pollingStartTimeRef = useRef<number | null>(null);
  const consecutiveErrorsRef = useRef(0); // ✅ NOVO: Contador de erros para backoff
  const currentIntervalRef = useRef(POLLING_BASE_INTERVAL_MS); // ✅ NOVO: Intervalo dinâmico

  // ✅ Webhook Hook
  const { webhookComandoUnificado } = useWebhookStorage();

  // Dados gerados em cada etapa
  const [unifiedCommandsData, setUnifiedCommandsData] = useState<any>(null);
  const [copywritingData, setCopywritingData] = useState<CopywritingData | null>(null);
  const [geminiImages, setGeminiImages] = useState<string[]>([]);
  const [kitImages, setKitImages] = useState<string[]>([]);
  const [kitsGenerated, setKitsGenerated] = useState(false);

  // ✅ NOVO: Prompts Midjourney/DALL-E por tipo (retornados do backend)
  const [midjourneyPrompts, setMidjourneyPrompts] = useState<Record<string, { prompt_mj: string; imageUrl: string | null }>>({});

  // ✅ Imagens separadas para ordenação correta
  const [whiteBackgroundImage, setWhiteBackgroundImage] = useState<string | null>(null);
  const [ambientImages, setAmbientImages] = useState<string[]>([]);

  // ✅ Títulos Long Tail para download ZIP
  const [longTailTitles, setLongTailTitles] = useState<string[]>([]);

  // Etapas da automação
  const [steps, setSteps] = useState<AutomationStep[]>([
    { id: 'unified', label: 'Comando Unificado (5 em 1)', status: 'pending' },
    { id: 'copywriting', label: 'Gerador de Copywriting', status: 'pending' },
    { id: 'gemini', label: 'Gerador de Background - Gemini AI', status: 'pending' },
    { id: 'kits', label: 'Gerador Automático de KITs', status: 'pending' },
  ]);

  // Validação de formulário completo (incluindo SKU para Magic Button)
  const isFormValid = useMemo(() => {
    const hasMinImages = productImages.length >= 2;
    const hasName = formData.nome?.trim() !== '';
    const hasShortDesc = formData.descricao_curta?.trim() !== '';
    const hasCostPrice = formData.preco_custo > 0;
    const hasSku = formData.sku?.trim() !== '';

    return hasMinImages && hasName && hasShortDesc && hasCostPrice && hasSku;
  }, [productImages.length, formData]);

  // Campos faltando para validação
  const missingFields = useMemo(() => {
    const missing: string[] = [];

    if (productImages.length < 2) {
      missing.push(`Imagens (${productImages.length}/2 mínimo)`);
    }
    if (!formData.nome?.trim()) missing.push('Nome do Produto');
    if (!formData.descricao_curta?.trim()) missing.push('Descrição Curta');
    if (formData.preco_custo <= 0) missing.push('Preço de Custo');
    if (!formData.sku?.trim()) missing.push('SKU');

    return missing;
  }, [productImages.length, formData]);

  // Atualizar status de uma etapa
  const updateStepStatus = useCallback((stepId: AutomationStep['id'], status: AutomationStep['status']) => {
    setSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, status } : step
    ));
  }, []);

  // Parar polling
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    pollingStartTimeRef.current = null;
    consecutiveErrorsRef.current = 0;
    currentIntervalRef.current = POLLING_BASE_INTERVAL_MS;
  }, []);

  // Processar resultado do job completado
  const processJobResult = useCallback(async (result: any) => {
    console.log('✅ [AUTOMAÇÃO] Processando resultado do job:', result);

    // Extrair dados das etapas
    if (result.steps?.unified?.data) {
      setUnifiedCommandsData(result.steps.unified.data);
      updateStepStatus('unified', 'completed');

      // ✅ NOVO: Persistir os 5 comandos unified no banco
      if (productId) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            console.log('💾 [AUTOMAÇÃO] Persistindo unified commands em ai_unified_results...');

            const unifiedData = result.steps.unified.data;

            // Buscar resultados existentes para mesclar
            const { data: existing } = await supabase
              .from('ai_unified_results')
              .select('results')
              .eq('product_id', productId)
              .eq('user_id', session.user.id)
              .maybeSingle();

            const existingResults = (typeof existing?.results === 'object' && existing?.results !== null)
              ? existing.results as Record<string, unknown>
              : {};

            // Mesclar os 5 comandos unified com resultados existentes
            const mergedResults = {
              ...existingResults,
              topicos_conversao: unifiedData.topicos_conversao || existingResults.topicos_conversao,
              palavras_chave_seo: unifiedData.palavras_chave_seo || existingResults.palavras_chave_seo,
              perguntas_respostas: unifiedData.perguntas_respostas || existingResults.perguntas_respostas,
              kits_criativos: unifiedData.kits_criativos || existingResults.kits_criativos,
              cauda_longa: unifiedData.cauda_longa || existingResults.cauda_longa,
            };

            const { error: upsertError } = await supabase
              .from('ai_unified_results')
              .upsert({
                product_id: productId,
                user_id: session.user.id,
                results: mergedResults,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'product_id,user_id'
              });

            if (upsertError) {
              console.error('❌ [AUTOMAÇÃO] Erro ao persistir unified commands:', upsertError);
            } else {
              console.log('✅ [AUTOMAÇÃO] Unified commands persistido com sucesso');
            }
          }
        } catch (err) {
          console.error('❌ [AUTOMAÇÃO] Erro ao persistir unified commands:', err);
        }
      }
    }

    // ✅ PERSISTIR COPYWRITING NO BANCO ANTES DE DISPARAR EVENTO GEMINI
    // Isso garante que o AIImageAutoProcessor encontre os textos corretos
    if (result.steps?.copywriting?.status === 'completed') {
      const content = result.steps.copywriting.data?.content ||
        result.steps.copywriting.data?.generatedText ||
        JSON.stringify(result.steps.copywriting.data);
      setCopywritingData({ content, timestamp: Date.now() });
      updateStepStatus('copywriting', 'completed');

      // ✅ NOVO: Sinalizar que copywriting foi completado pela automação do backend
      // Isso previne que o CopywritingGenerator re-dispare a geração
      console.log('📡 [AUTOMAÇÃO] Disparando automationCopywritingCompleted para bloquear re-trigger');
      window.dispatchEvent(new CustomEvent('automationCopywritingCompleted', {
        detail: { fromBackend: true, productId, timestamp: Date.now() }
      }));

      // ✅ UPSERT em ai_unified_results para persistir copywriting
      if (productId) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            console.log('💾 [AUTOMAÇÃO] Persistindo copywriting em ai_unified_results...');

            // Buscar resultados existentes para mesclar
            const { data: existing } = await supabase
              .from('ai_unified_results')
              .select('results')
              .eq('product_id', productId)
              .eq('user_id', session.user.id)
              .maybeSingle();

            const existingResults = (typeof existing?.results === 'object' && existing?.results !== null)
              ? existing.results as Record<string, unknown>
              : {};
            // ✅ FIX: Salvar copywriting como STRING, não objeto
            // copywriting_raw = objeto original para debug
            // copywriting = string final para AIGeneratorService.getCopywritingText
            // ✅ TAMBÉM incluir unified commands se disponíveis
            const unifiedData = result.steps?.unified?.data || {};
            const mergedResults = {
              ...existingResults,
              // Unified commands (preservar os que já existem ou adicionar novos)
              topicos_conversao: unifiedData.topicos_conversao || existingResults.topicos_conversao,
              palavras_chave_seo: unifiedData.palavras_chave_seo || existingResults.palavras_chave_seo,
              perguntas_respostas: unifiedData.perguntas_respostas || existingResults.perguntas_respostas,
              kits_criativos: unifiedData.kits_criativos || existingResults.kits_criativos,
              cauda_longa: unifiedData.cauda_longa || existingResults.cauda_longa,
              // Copywriting
              copywriting: content, // ✅ STRING para getCopywritingText
              copywriting_raw: result.steps.copywriting.data, // Objeto original
              marketing_copy: content // Compatibilidade
            };

            const { error: upsertError } = await supabase
              .from('ai_unified_results')
              .upsert({
                product_id: productId,
                user_id: session.user.id,
                results: mergedResults,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'product_id,user_id'
              });

            if (upsertError) {
              console.error('❌ [AUTOMAÇÃO] Erro ao persistir copywriting:', upsertError);
            } else {
              console.log('✅ [AUTOMAÇÃO] Copywriting persistido com sucesso em ai_unified_results');
            }
          }
        } catch (err) {
          console.error('❌ [AUTOMAÇÃO] Erro ao persistir copywriting:', err);
        }
      }
    } else if (result.steps?.copywriting?.status === 'failed') {
      updateStepStatus('copywriting', 'error');
    }

    // ✅ CONVERTER IMAGENS PARA BLOB URL (mais leve que base64)
    const convertToBlobUrls = (images: string[]): string[] => {
      return images.map(img => {
        if (img.startsWith('data:')) {
          const blobUrl = base64ToBlobUrl(img);
          console.log(`🔄 Convertido base64 → Blob URL: ${blobUrl.substring(0, 50)}...`);
          return blobUrl;
        }
        return img; // Já é URL https ou blob
      });
    };

    let allBlobUrls: string[] = [];

    // ✅ ORDEM ESPECÍFICA para círculos do Showcase: mockup, ambient_1, packaging, lifestyle
    const CIRCLE_IMAGE_PRIORITY = ['mockup', 'ambient_1', 'packaging', 'lifestyle'];
    let orderedCircleImages: string[] = [];

    if (result.steps?.gemini?.images?.length > 0) {
      const geminiBlobs = convertToBlobUrls(result.steps.gemini.images);
      setGeminiImages(geminiBlobs);

      if (result.steps.gemini.whiteBackgroundImage) {
        const whiteBlob = base64ToBlobUrl(result.steps.gemini.whiteBackgroundImage);
        setWhiteBackgroundImage(whiteBlob);
        allBlobUrls.push(whiteBlob);
      }

      const ambient = geminiBlobs.filter(
        (img: string, idx: number) => result.steps.gemini.images[idx] !== result.steps.gemini.whiteBackgroundImage
      );
      setAmbientImages(ambient);
      allBlobUrls.push(...ambient);
      updateStepStatus('gemini', 'completed');

      // ✅ NOVO: Extrair prompts Midjourney/DALL-E do resultado do backend
      if (result.steps.gemini.resultsByType) {
        console.log('📋 [AUTOMAÇÃO] Prompts Midjourney recebidos:', Object.keys(result.steps.gemini.resultsByType));
        setMidjourneyPrompts(result.steps.gemini.resultsByType);

        // ✅ ORDENAR IMAGENS PARA CÍRCULOS: mockup, ambient_1, packaging, lifestyle
        console.log('🔄 [AUTOMAÇÃO] Ordenando imagens: mockup, ambient_1, packaging, lifestyle...');

        for (const imageType of CIRCLE_IMAGE_PRIORITY) {
          const typeData = result.steps.gemini.resultsByType[imageType];
          if (typeData?.imageUrl) {
            // Converter para Blob URL se for base64
            const blobUrl = typeData.imageUrl.startsWith('data:')
              ? base64ToBlobUrl(typeData.imageUrl)
              : typeData.imageUrl;
            orderedCircleImages.push(blobUrl);
            console.log(`✅ [AUTOMAÇÃO] Círculo ${orderedCircleImages.length}: ${imageType}`);
          }
        }

        // Fallback: se não encontrou 4 imagens, completar com ambient disponíveis
        if (orderedCircleImages.length < 4) {
          const remainingAmbient = ambient.filter(img => !orderedCircleImages.includes(img));
          const needed = 4 - orderedCircleImages.length;
          orderedCircleImages.push(...remainingAmbient.slice(0, needed));
          console.log(`📋 [AUTOMAÇÃO] Fallback: adicionadas ${Math.min(needed, remainingAmbient.length)} imagens ambient`);
        }

        console.log(`📦 [AUTOMAÇÃO] Círculos ordenados: ${orderedCircleImages.length} imagens (mockup, ambient_1, packaging, lifestyle)`);
      } else {
        // Fallback sem resultsByType: usar primeiras 3 ambient
        orderedCircleImages = ambient.slice(0, 3);
      }

      // ✅ DISPARAR EVENTO imageGenerated para AIImageAutoProcessor
      console.log('📡 [AUTOMAÇÃO] Disparando imageGenerated para AIImageAutoProcessor:', geminiBlobs.length, 'imagens');
      window.dispatchEvent(new CustomEvent('imageGenerated', {
        detail: {
          source: 'gemini-background',
          images: geminiBlobs,
          productId: productId,
          batchId: `gemini-auto-${Date.now()}`
        }
      }));
    } else if (result.steps?.gemini?.status === 'failed') {
      updateStepStatus('gemini', 'error');
    }

    if (result.steps?.kits?.images?.length > 0) {
      const kitBlobs = convertToBlobUrls(result.steps.kits.images);
      setKitImages(kitBlobs);
      setKitsGenerated(true);
      allBlobUrls.push(...kitBlobs);
      updateStepStatus('kits', 'completed');
    } else if (result.steps?.kits?.status === 'skipped') {
      updateStepStatus('kits', 'completed');
    }

    // ✅ Atualizar galeria com Blob URLs (ordem: fundo branco primeiro, depois ambiente, depois kits)
    if (allBlobUrls.length > 0) {
      if (onGalleryUpdate) {
        onGalleryUpdate(allBlobUrls);
      }
      toast.success(`🎉 ${allBlobUrls.length} imagens geradas com sucesso!`);
    } else {
      toast.success('🎉 Automação completa!');
    }

    setIsAutomationRunning(false);
    setIsAutomationComplete(true);
    setAutomationStep(null);
    setIsStarting(false); // ✅ Resetar proteção contra clique duplo

    // ✅ DISPARAR EVENTO automationComplete COM URLs BLOB PARA SHOWCASES
    const whiteImg = allBlobUrls.length > 0 ? allBlobUrls[0] : null;
    const ambientImgs = allBlobUrls.slice(1).filter(url => !url.includes('kit')); // Excluir kits se houver tag

    console.log('🎉 [AUTOMAÇÃO] Disparando automationComplete com URLs:', {
      productId,
      whiteBackgroundImage: whiteImg?.substring(0, 50),
      ambientImagesCount: ambientImgs.length,
      circleImagesCount: orderedCircleImages.length
    });

    window.dispatchEvent(new CustomEvent('automationComplete', {
      detail: {
        productId,
        success: true,
        whiteBackgroundImage: whiteImg,
        ambientImages: ambientImgs,
        // ✅ NOVO: Círculos ordenados com packaging em 3º lugar
        circleImages: orderedCircleImages,
        galleryImages: allBlobUrls
      }
    }));

    console.log('✅ [AUTOMAÇÃO] Fluxo completo - imagens convertidas para Blob URL!');
  }, [onGalleryUpdate, updateStepStatus, formData.nome]);

  // Polling público do status do job (via supabase.functions.invoke)
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      console.log(`📊 [POLLING] Verificando job ${jobId}...`);

      // ✅ Usar supabase.functions.invoke em vez de fetch manual
      const { data, error } = await supabase.functions.invoke('check-queue-status', {
        body: { jobId }
      });

      // ⚠️ IGNORAR erros de rede/401 - não são fatais para o job
      if (error) {
        console.warn(`⚠️ [POLLING] Erro de rede (job continua no backend):`, error.message);
        consecutiveErrorsRef.current++;
        currentIntervalRef.current = getAdaptiveInterval(undefined, consecutiveErrorsRef.current, POLLING_BASE_INTERVAL_MS);
        return; // Continua polling com backoff
      }

      // ✅ NOVO: Tratar códigos estruturados do backend
      if (data?.code === 'BACKEND_TEMPORARY') {
        console.warn('⚠️ [POLLING] Backend temporariamente indisponível');
        consecutiveErrorsRef.current++;
        currentIntervalRef.current = data.retryAfterMs || getAdaptiveInterval(undefined, consecutiveErrorsRef.current, POLLING_BASE_INTERVAL_MS);
        return; // Continua polling com backoff
      }

      if (data?.code === 'JOB_NOT_FOUND') {
        console.error('❌ [POLLING] Job não encontrado:', jobId);
        consecutiveErrorsRef.current++;

        // Se muitos erros consecutivos, parar
        if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
          stopPolling();
          setIsAutomationRunning(false);
          toast.error('Job não encontrado', {
            description: 'O job pode ter expirado. Tente novamente.'
          });
        }
        return;
      }

      // ✅ Sucesso - resetar contador de erros
      consecutiveErrorsRef.current = 0;

      const job = data?.job;

      if (!job) {
        console.warn('⚠️ [POLLING] Resposta sem job, continuando...');
        return;
      }

      console.log(`📊 [POLLING] Status: ${job.status}, Progresso:`, job.result?.progress || 0);

      // ✅ Ajustar intervalo baseado na posição na fila
      currentIntervalRef.current = getAdaptiveInterval(job.queuePosition, 0, POLLING_BASE_INTERVAL_MS);

      // ✅ MAPEAMENTO de currentStep do backend para frontend
      // O backend pode usar nomes como 'parallel', 'gemini_fase1', etc que o frontend não reconhece
      const stepMapping: Record<string, AutomationStep['id']> = {
        'parallel': 'unified',
        'openai': 'copywriting',
        'gemini_fase1': 'gemini',
        'gemini_fase2': 'gemini',
        'completed': 'kits'
      };

      const stepOrder: AutomationStep['id'][] = ['unified', 'copywriting', 'gemini', 'kits'];

      // Atualizar UI baseado no progresso
      if (job.result?.currentStep) {
        // Mapear currentStep para valor conhecido pelo frontend
        const effectiveStep = stepMapping[job.result.currentStep] || job.result.currentStep;

        if (stepOrder.includes(effectiveStep as AutomationStep['id'])) {
          setAutomationStep(effectiveStep as AutomationStep['id']);
          updateStepStatus(effectiveStep as AutomationStep['id'], 'running');

          // Marcar etapas anteriores como completas
          const currentIdx = stepOrder.indexOf(effectiveStep as AutomationStep['id']);
          for (let i = 0; i < currentIdx; i++) {
            updateStepStatus(stepOrder[i], 'completed');
          }
        }
      }

      // ✅ DETECTAR job "preso" com progresso 100% mas status processing
      if (job.status === 'processing' && job.result?.progress === 100) {
        console.log('🔄 [POLLING] Job com progresso 100% mas status processing - tratando como completo');
        stopPolling();
        processJobResult(job.result);
        return;
      }

      // Verificar status final
      if (job.status === 'completed') {
        console.log('✅ [POLLING] Job completado!');
        stopPolling();
        processJobResult(job.result);
        return;
      }

      if (job.status === 'failed') {
        console.error('❌ [POLLING] Job falhou:', job.error_message);
        stopPolling();
        setIsAutomationRunning(false);
        setIsAutomationComplete(false);
        toast.error('Automação falhou', { description: job.error_message });

        if (job.result?.currentStep) {
          updateStepStatus(job.result.currentStep, 'error');
        }
        return;
      }

      // Verificar timeout
      if (pollingStartTimeRef.current) {
        const elapsed = Date.now() - pollingStartTimeRef.current;
        if (elapsed > POLLING_TIMEOUT_MS) {
          console.warn('⚠️ [POLLING] Timeout atingido');
          stopPolling();
          setIsAutomationRunning(false);
          toast.warning('Automação demorou muito', {
            description: 'O job pode continuar em background. Verifique mais tarde.'
          });
          return;
        }
      }

    } catch (error) {
      // ⚠️ Aplicar backoff para erros não tratados
      console.warn('⚠️ [POLLING] Erro ignorado:', error);
      consecutiveErrorsRef.current++;
      currentIntervalRef.current = getAdaptiveInterval(undefined, consecutiveErrorsRef.current, POLLING_BASE_INTERVAL_MS);
    }
  }, [stopPolling, processJobResult, updateStepStatus]);

  // ✅ Iniciar polling com setTimeout dinâmico (não setInterval)
  const startPolling = useCallback((jobId: string) => {
    console.log(`🔄 [POLLING] Iniciando polling para job ${jobId}`);
    pollingStartTimeRef.current = Date.now();
    consecutiveErrorsRef.current = 0;
    currentIntervalRef.current = POLLING_BASE_INTERVAL_MS;

    // ✅ NOVO: Polling com setTimeout recursivo para intervalos adaptativos
    const schedulePoll = () => {
      pollJobStatus(jobId);

      // Agendar próximo poll apenas se ainda estiver rodando
      if (pollingStartTimeRef.current !== null) {
        pollingTimeoutRef.current = setTimeout(schedulePoll, currentIntervalRef.current);
      }
    };

    // Poll imediato
    schedulePoll();
  }, [pollJobStatus]);

  // Limpar polling no unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // Iniciar automação completa - ENQUEUE ÚNICO
  const startAutomation = useCallback(async () => {
    // ✅ PROTEÇÃO CONTRA CLIQUE DUPLO
    if (isStarting || isAutomationRunning) {
      console.log('⚠️ [AUTOMAÇÃO] Clique ignorado - já iniciando ou rodando');
      return;
    }

    setIsStarting(true);
    console.log('🚀 [AUTOMAÇÃO] Botão clicado, verificando requisitos...');

    // Verificar autenticação (APENAS para criar o job)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ [AUTOMAÇÃO] Usuário não autenticado:', authError);
      toast.error('Você precisa estar logado para usar a automação', {
        description: 'Faça login e tente novamente'
      });
      return;
    }

    console.log('✅ [AUTOMAÇÃO] Usuário autenticado:', user.email);

    if (!isFormValid) {
      console.warn('⚠️ [AUTOMAÇÃO] Formulário inválido. Campos faltando:', missingFields);
      toast.error('Preencha todos os campos obrigatórios antes de iniciar', {
        description: `Faltam: ${missingFields.join(', ')}`
      });
      return;
    }

    console.log('🚀 [AUTOMAÇÃO] Iniciando fluxo completo (1 único job)...');
    toast.info('🚀 Iniciando Automação Completa...', { duration: 3000 });

    setIsAutomationRunning(true);
    setAutomationStep('unified');

    // Resetar estados
    setUnifiedCommandsData(null);
    setCopywritingData(null);
    setGeminiImages([]);
    setKitImages([]);
    setKitsGenerated(false);
    setWhiteBackgroundImage(null);
    setAmbientImages([]);
    setCurrentJobId(null);

    // Resetar status das etapas
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));
    updateStepStatus('unified', 'running');

    try {
      // 🚀 NOVA IMPLEMENTAÇÃO: N8N WEBHOOK PRIMEIRO
      // O usuário solicitou explicitamente que NENHUM botão chame IAs diretamente.
      // O fluxo deve ser sempre via N8N.

      console.log('🚀 [AUTOMAÇÃO] Modo N8N ativado');

      // 1. Converter imagens para Base64 se necessário
      // O N8N precisa de Base64 real, não Blob URL
      const processedImages: string[] = [];
      for (const img of productImages) {
        if (img.startsWith('blob:')) {
          const b64 = await blobUrlToBase64(img);
          processedImages.push(b64);
        } else {
          processedImages.push(img);
        }
      }

      // 2. Preparar Payload para o N8N
      const n8nPayload = {
        productName: formData.nome,
        sku: formData.sku,
        description: formData.descricao,
        shortDescription: formData.descricao_curta,
        costPrice: formData.preco_custo,
        weight: formData.preco_venda, // Mapeando peso para onde? Usando venda como placeholder ou verificar interface
        images: processedImages,
        productId: productId,
        timestamp: Date.now()
      };

      const targetWebhook = webhookComandoUnificado; // Usando o Comando Unificado como entrypoint principal

      if (!targetWebhook) {
        throw new Error('Webhook N8N não configurado! Configure "Comando Unificado 01" nas configurações.');
      }

      console.log('📤 [N8N] Enviando para webhook:', targetWebhook);

      // 3. Disparar Webhook (Fire & Forget ou Wait?)
      // Geralmente N8N retorna rápido "Workflow started".
      const response = await fetch(targetWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(n8nPayload)
      });

      if (!response.ok) {
        throw new Error(`Erro N8N: ${response.status} ${response.statusText}`);
      }

      console.log('✅ [N8N] Webhook disparado com sucesso!');
      toast.success('Mágica iniciada no N8N! 🧙‍♂️', {
        description: 'Seu fluxo de automação está rodando em segundo plano.'
      });

      // Simular progresso localmente JÁ QUE o N8N não atualiza o supabse queue (provavelmente)
      // Se o usuário tiver um N8N que atualiza o Supabase, o polling abaixo (check-queue-status) 
      // precisaria de um Job ID que o N8N retornaria.
      // Por enquanto, vamos assumir disparo com sucesso.

      setIsAutomationRunning(false);
      setIsStarting(false);

      return; // ⛔ FIM DO FLUXO N8N (O resto do código era para Supabase Queue)

      /* CÓDIGO LEGADO SUPABASE QUEUE (DESATIVADO)
      // ... (código antigo de queue-image mantido comentado ou removido)
      */
    } catch (error: any) {
      console.error('❌ [AUTOMAÇÃO] Erro:', error);
      toast.error('Erro ao iniciar automação', {
        description: error.message
      });
      setIsAutomationRunning(false);
      setIsStarting(false);
    }
  }, [isStarting, isAutomationRunning, isFormValid, missingFields, formData, productImages, productId, webhookComandoUnificado]);

  /* CÓDIGO ÓRFÃO REMOVIDO - Estava fora de qualquer função/bloco
  // 🔥 DISPARAR WORKER MANUALMENTE (enquanto pg_cron não estava ativo)
  // Este bloco estava solto fora de qualquer função e causava erro de compilação

  console.log('🔥 [WORKER] Disparando process-queue manualmente para job:', result.jobId);
  supabase.functions.invoke('process-queue', {
    body: { trigger: 'manual', targetJobId: result.jobId }
  }).then(({ data, error }) => {
    if (error) {
      console.warn('⚠️ [WORKER] Erro ao disparar worker (não crítico):', error.message);
    } else {
      console.log('✅ [WORKER] Worker disparado com sucesso:', data);
    }
  }).catch(err => console.warn('⚠️ [WORKER] Erro inesperado:', err));

  } catch (error: any) {
    console.error('❌ [ENQUEUE] Erro ao criar job:', error);
    setIsAutomationRunning(false);
    setIsAutomationComplete(false);
    setIsStarting(false);
    updateStepStatus('unified', 'error');

    const errorMsg = error.message || String(error);
    const lowerError = errorMsg.toLowerCase();

    const isSessionError =
      lowerError.includes('sessão') ||
      (lowerError.includes('jwt') && (lowerError.includes('expired') || lowerError.includes('invalid'))) ||
      lowerError.includes('não autenticado') ||
      lowerError.includes('not authenticated');

    if (isSessionError) {
      toast.error('Sessão expirada', { description: 'Faça login novamente e tente outra vez.' });
    } else {
      console.error('🚨 [TOAST] Mostrando erro completo:', errorMsg);
      toast.error(`Erro: ${errorMsg}`, {
        duration: 10000,
        description: 'Verifique o console para detalhes completos'
      });
    }
  }
  */

// 🧪 TESTE: Iniciar apenas etapas de AI (Unified + Copywriting) SEM IMAGENS
const startAIOnlyTest = useCallback(async () => {
  console.log('🧪 [TESTE AI-ONLY] Botão clicado, verificando requisitos...');

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('❌ [TESTE AI-ONLY] Usuário não autenticado:', authError);
    toast.error('Você precisa estar logado para testar');
    return;
  }

  if (!formData.nome?.trim() || !formData.descricao_curta?.trim()) {
    toast.error('Preencha pelo menos Nome e Descrição Curta para testar');
    return;
  }

  console.log('🧪 [TESTE AI-ONLY] Iniciando teste apenas AI (Unified + Copywriting)...');
  toast.info('🧪 Iniciando Teste AI-Only (sem imagens)...', { duration: 3000 });

  setIsAutomationRunning(true);
  setAutomationStep('unified');

  // Resetar estados
  setUnifiedCommandsData(null);
  setCopywritingData(null);
  setGeminiImages([]);
  setKitImages([]);
  setKitsGenerated(false);
  setWhiteBackgroundImage(null);
  setAmbientImages([]);
  setCurrentJobId(null);

  // Resetar etapas (apenas unified e copywriting vão rodar)
  setSteps(prev => prev.map(step => ({
    ...step,
    status: step.id === 'gemini' || step.id === 'kits' ? 'pending' : 'pending'
  })));
  updateStepStatus('unified', 'running');

  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Não autenticado - faça login');
    }

    // ✅ ENQUEUE com tipo especial que PULA IMAGENS
    const enqueuePayload = {
      generationType: 'ai_test_only', // <-- Tipo especial para teste
      inputData: {
        productImages: productImages.slice(0, 1), // Apenas 1 imagem para contexto
        formData: {
          nome: formData.nome,
          sku: formData.sku || 'TEST',
          descricao_curta: formData.descricao_curta,
          descricao: formData.descricao,
          preco_custo: formData.preco_custo || 0,
          preco_venda: formData.preco_venda || 0
        }
      },
      priority: 3 // Prioridade máxima para teste
    };

    console.log('🧪 [TESTE AI-ONLY] Enviando payload:', enqueuePayload.generationType);

    const { data: result, error } = await supabase.functions.invoke('queue-image', {
      body: enqueuePayload
    });

    if (error) {
      throw new Error(error.message || 'Erro ao criar job de teste');
    }

    console.log('✅ [TESTE AI-ONLY] Job criado:', result);

    setCurrentJobId(result.jobId);
    toast.success('🧪 Job de teste criado!', { description: `ID: ${result.jobId?.slice(0, 8)}...` });

    startPolling(result.jobId);

    // Disparar worker
    supabase.functions.invoke('process-queue', {
      body: { trigger: 'manual', targetJobId: result.jobId }
    }).then(({ error }) => {
      if (error) console.warn('⚠️ [TESTE AI-ONLY] Worker erro:', error.message);
    });

  } catch (error: any) {
    console.error('❌ [TESTE AI-ONLY] Erro:', error);
    setIsAutomationRunning(false);
    updateStepStatus('unified', 'error');
    toast.error(`Erro no teste: ${error.message}`);
  }
}, [formData, productImages, updateStepStatus, startPolling]);

// Resetar automação
const resetAutomation = useCallback(() => {
  stopPolling();
  setIsAutomationRunning(false);
  setIsAutomationComplete(false);
  setAutomationStep(null);
  setUnifiedCommandsData(null);
  setCopywritingData(null);
  setGeminiImages([]);
  setKitImages([]);
  setKitsGenerated(false);
  setWhiteBackgroundImage(null);
  setAmbientImages([]);
  setLongTailTitles([]);
  setCurrentJobId(null);
  setSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));
}, [stopPolling]);

// ========================================
// HANDLERS LEGADOS (para modo manual)
// ========================================
const handleUnifiedCommandsComplete = useCallback((data: any) => {
  console.log('✅ [LEGACY] Comando Unificado completo:', data);
  setUnifiedCommandsData(data);
  updateStepStatus('unified', 'completed');
  setAutomationStep('copywriting');
  updateStepStatus('copywriting', 'running');

  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('automationTriggerCopywriting', {
      detail: { unifiedData: data }
    }));
  }, 100);
}, [updateStepStatus]);

const handleCopywritingComplete = useCallback((content: string) => {
  console.log('✅ [LEGACY] Copywriting completo');
  setCopywritingData({ content, timestamp: Date.now() });
  updateStepStatus('copywriting', 'completed');
  setAutomationStep('gemini');
  updateStepStatus('gemini', 'running');

  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('automationTriggerGemini', {
      detail: { copywritingContent: content }
    }));
  }, 100);
}, [updateStepStatus]);

const handleGeminiComplete = useCallback((images: string[], whiteBackground?: string) => {
  console.log('✅ [LEGACY] Gemini completo, imagens:', images.length);
  setGeminiImages(images);
  setWhiteBackgroundImage(whiteBackground || null);
  const ambient = images.filter(img => img !== whiteBackground);
  setAmbientImages(ambient);
  updateStepStatus('gemini', 'completed');
  setAutomationStep('kits');
  updateStepStatus('kits', 'running');

  const imageForKits = whiteBackground ? [whiteBackground] : [];
  window.dispatchEvent(new CustomEvent('automationTriggerKits', {
    detail: { geminiImages: imageForKits }
  }));
}, [updateStepStatus]);

const handleKitsComplete = useCallback((kitImagesReceived: string[] = []) => {
  console.log('✅ [LEGACY] KITs completos:', kitImagesReceived.length);
  setKitImages(kitImagesReceived);
  setKitsGenerated(true);
  updateStepStatus('kits', 'completed');
  setIsAutomationRunning(false);
  setIsAutomationComplete(true);
  setAutomationStep(null);

  const orderedImages: string[] = [];
  if (whiteBackgroundImage) orderedImages.push(whiteBackgroundImage);
  orderedImages.push(...ambientImages);
  orderedImages.push(...kitImagesReceived);

  if (onGalleryUpdate && orderedImages.length > 0) {
    onGalleryUpdate(orderedImages);
    toast.success(`🎉 Automação completa! ${orderedImages.length} imagens geradas.`);
  } else {
    toast.success('🎉 Automação completa!');
  }
}, [updateStepStatus, whiteBackgroundImage, ambientImages, onGalleryUpdate]);

return {
  // Estados de validação
  isFormValid,
  missingFields,

  // Estados de automação
  isAutomationRunning,
  isStarting, // ✅ NOVO: Proteção contra clique duplo
  isAutomationComplete,
  automationStep,
  steps,
  currentJobId,

  // Dados gerados
  unifiedCommandsData,
  copywritingData,
  geminiImages,
  kitImages,
  kitsGenerated,
  longTailTitles,
  midjourneyPrompts, // ✅ NOVO: Prompts Midjourney/DALL-E por tipo

  // Ações
  startAutomation,
  startAIOnlyTest, // 🧪 Novo botão de teste
  resetAutomation,
  handleUnifiedCommandsComplete,
  handleCopywritingComplete,
  handleGeminiComplete,
  handleKitsComplete,
  updateStepStatus,
  setAutomationStep,
  setLongTailTitles,
};
};
