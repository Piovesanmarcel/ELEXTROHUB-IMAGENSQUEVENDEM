import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Loader2,
  Zap,
  ImageIcon,
  History,
  Package,
} from "lucide-react";
import { useUserJobStatus } from "@/contexts/UserJobStatusContext";
import { useJobLimitCheck } from "@/hooks/useJobLimitCheck";
import { JobLimitAlert } from "@/components/queue/JobLimitAlert";
import { supabase } from "@/integrations/supabase/client";
import type { GeneratedImage } from "@/components/n8n/GeneratedImageGallery";
import { GeneratedImageGallery } from "@/components/n8n/GeneratedImageGallery";
import { ParallelGenerationMonitor } from "@/components/n8n/ParallelGenerationMonitor";
import { GenerationLogsViewer } from "@/components/n8n/GenerationLogsViewer";
import { useBatchResults } from "@/hooks/useBatchResults";
import EbookDownloadButton from "@/components/download/EbookDownloadButton";
import { templateIdTracker } from "@/events/TemplateIdTracker";
import {
  AgentProgressIndicator,
  COMMAND_STEPS,
  COPY_STEPS,
  IMAGE_STEPS,
  FULL_FLOW_STEPS,
  type AgentStep
} from "@/components/generator/AgentProgressIndicator";
import { MagicAgentButton } from "@/components/generator/MagicAgentButton";

// Import extracted components and hooks from generator feature
import {
  type ProductInput,
  type SceneType,
  useWebhookStorage,
  useProductImages,
  useParallelGeneration,
  useGeneratorExecution,
  GeneratorHeader,
  WebhookConfigCard,
  ProductInputCard,
  StepTestCard,
  ProgressTab,
  TratamentoTab,
  ResultadosTab,
  SceneTypeSelector,
} from "@/features/generator";

import { BroadcastDebugPanel } from "@/components/n8n/BroadcastDebugPanel";


export default function GeradorCompletoN8N() {
  // Use extracted hooks for webhook URLs and product images
  const {
    webhookComandoUnificado,
    setWebhookComandoUnificado,
    webhookCopywriting,
    setWebhookCopywriting,
    webhookTratamentoCombinado,
    setWebhookTratamentoCombinado,
  } = useWebhookStorage();

  const {
    productImages,
    removeImage,
    dropzone: { getRootProps, getInputProps, isDragActive },
    isMaxImages,
  } = useProductImages(3);

  // Generated images from n8n
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  // Scene type selection for image generation
  const [selectedSceneTypes, setSelectedSceneTypes] = useState<SceneType[]>(['product_studio']);
  const [generateMode, setGenerateMode] = useState<'single' | 'multiple'>('single');

  // Produto input
  const [product, setProduct] = useState<ProductInput>({
    nome: '',
    descricao_curta: '',
    preco_custo: 0,
    sku: ''
  });

  // Estado para etapa do fluxo mágico
  const [magicStep, setMagicStep] = useState<string>('');

  // User info
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Hook para escutar broadcast de imagens
  const { activeBatchProgress } = useBatchResults();

  // Ref para deduplicação robusta na galeria
  const gallerySeenRef = useRef<Set<string>>(new Set());

  // UI states
  const [showConfig, setShowConfig] = useState(true);
  const [activeTab, setActiveTab] = useState("progresso");

  // Estado para agentes de progresso
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [showAgentProgress, setShowAgentProgress] = useState(false);

  // Estado para compressão de imagens
  const [enableCompression, setEnableCompression] = useState(true);

  // Hooks para limite de jobs
  const { canStartNewJob, activeJobsCount, maxConcurrent } = useUserJobStatus();
  const {
    showLimitAlert,
    closeLimitAlert,
    limitAlertData,
  } = useJobLimitCheck();

  // Use extracted parallel generation hook
  const parallelGeneration = useParallelGeneration({
    webhookTratamentoCombinado,
    productName: product.nome,
    productDescription: product.descricao_curta || '',
    productImages,
    userId,
    enableCompression,
  });

  // Handler for generated images
  const handleImagesGenerated = useCallback((newImages: GeneratedImage[]) => {
    setGeneratedImages(prev => [...prev, ...newImages]);
    if (newImages.length > 0) {
      setActiveTab("imagens");
    }
  }, []);

  // Handler for single image generated
  const handleImageGenerated = useCallback((image: GeneratedImage) => {
    setGeneratedImages(prev => [...prev, image]);
    setActiveTab("imagens");
  }, []);

  // Use extracted generator execution hook
  const generatorExecution = useGeneratorExecution({
    webhookComandoUnificado,
    webhookCopywriting,
    webhookTratamentoCombinado,
    productName: product.nome,
    productDescription: product.descricao_curta || '',
    productImages,
    userId,
    userEmail,
    selectedSceneTypes,
    generateMode,
    enableCompression,
    processarUmSceneTypeComRetry: parallelGeneration.processarUmSceneTypeComRetry,
    updateSceneStatus: parallelGeneration.updateSceneStatus,
    prepareImagesForSending: parallelGeneration.prepareImagesForSending,
  });

  // Fetch user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email || null);
      }
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
      setUserEmail(session?.user?.email || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      generatorExecution.cleanup();
      productImages.forEach(img => URL.revokeObjectURL(img.preview));
      generatedImages.forEach(img => {
        if (img.imageUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(img.imageUrl);
        }
      });
    };
  }, []);

  // Escutar imagens vindas do image-stream
  useEffect(() => {
    const handleImageEvent = (event: CustomEvent) => {
      const { images, source, productName, jobId, templateId, receivedAt } = event.detail || {};

      if (source !== 'n8n-stream') return;

      // ✅ LOG ESTRUTURADO DETALHADO
      console.group(`🖼️ [GERADOR] Evento imageGenerated`);
      console.log('📌 templateId:', templateId);
      console.log('🔑 jobId:', jobId);
      console.log('📦 productName:', productName);
      console.log('📂 source:', source);
      console.log('📊 imageCount:', images?.length);
      console.log('⏰ receivedAt:', receivedAt);
      console.table({ templateId, jobId, source, imageCount: images?.length });
      console.groupEnd();

      if (!images || !Array.isArray(images) || images.length === 0) {
        console.warn('[GeradorCompletoN8N] ⚠️ Evento sem imagens válidas');
        return;
      }

      // Rastrear recebimento no evento
      templateIdTracker.track(
        templateId || 'unknown',
        jobId || 'unknown',
        'event',
        'processed',
        productName
      );

      const newImagesToAdd: GeneratedImage[] = [];

      images.forEach((imageUrl: string, idx: number) => {
        if (!imageUrl) return;

        const imageKey = `${jobId || Date.now()}-${templateId || 'unknown'}-${idx}`;

        if (gallerySeenRef.current.has(imageKey)) {
          // ✅ LOG de duplicata na galeria
          console.warn(`⚠️ [GERADOR] Duplicata na galeria:`, { imageKey, templateId });

          templateIdTracker.track(
            templateId || 'unknown',
            jobId || 'unknown',
            'gallery',
            'duplicate',
            productName
          );
          return;
        }

        let normalizedUrl = imageUrl;
        if (!imageUrl.startsWith('data:') && !imageUrl.startsWith('http') && !imageUrl.startsWith('blob:')) {
          normalizedUrl = `data:image/png;base64,${imageUrl}`;
        }

        let finalUrl = normalizedUrl;
        if (normalizedUrl.startsWith('data:')) {
          try {
            const parts = normalizedUrl.split(',');
            const base64 = parts[1];
            const contentType = parts[0].match(/data:(.*?);/)?.[1] || 'image/png';
            const byteCharacters = atob(base64);
            const byteArray = new Uint8Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteArray[i] = byteCharacters.charCodeAt(i);
            }
            const blob = new Blob([byteArray], { type: contentType });
            finalUrl = URL.createObjectURL(blob);
          } catch (err) {
            finalUrl = normalizedUrl;
          }
        }

        gallerySeenRef.current.add(imageKey);

        // ✅ LOG de imagem adicionada à galeria
        console.log(`✅ [GERADOR] Adicionando à galeria:`, { templateId, imageKey });

        templateIdTracker.track(
          templateId || 'unknown',
          jobId || 'unknown',
          'gallery',
          'displayed',
          productName
        );

        newImagesToAdd.push({
          imageUrl: finalUrl,
          mimeType: 'image/png',
          generatedAt: receivedAt || new Date().toISOString(),
          productName: productName || product.nome || 'Produto',
          sceneType: templateId || 'n8n-stream'
        });
      });

      if (newImagesToAdd.length > 0) {
        setGeneratedImages(prev => [...prev, ...newImagesToAdd]);
        setActiveTab("imagens");
        toast.success(`${newImagesToAdd.length} imagem(ns) recebida(s)!`);

        // ✅ LOG de resumo
        console.log(`📊 [GERADOR] Resumo:`, {
          adicionadas: newImagesToAdd.length,
          templateIds: newImagesToAdd.map(i => i.sceneType),
          stats: templateIdTracker.getStats()
        });
      }
    };

    window.addEventListener('imageGenerated', handleImageEvent as EventListener);
    return () => window.removeEventListener('imageGenerated', handleImageEvent as EventListener);
  }, [product.nome]);

  // Calcular progresso
  const calculateProgress = () => {
    let progress = 0;
    if (generatorExecution.step1.status === "success") progress += 30;
    else if (generatorExecution.step1.status === "running") progress += 15;
    if (generatorExecution.step2.status === "success") progress += 30;
    else if (generatorExecution.step2.status === "running") progress += 15;
    if (generatorExecution.tratamentoCombStatus.status === "success") progress += 40;
    else if (["sending", "retrying"].includes(generatorExecution.tratamentoCombStatus.status)) progress += 20;
    return Math.min(progress, 100);
  };

  // Função para atualizar etapa do agente
  const updateAgentStep = useCallback((stepId: string, status: 'pending' | 'running' | 'completed' | 'error') => {
    setAgentSteps(prev => prev.map(s =>
      s.id === stepId ? { ...s, status } : s
    ));
  }, []);

  // Sincronizar etapas com status da execução
  useEffect(() => {
    const isExecuting = generatorExecution.isExecuting || generatorExecution.isGeneratingImage;
    const step1Status = generatorExecution.step1.status;
    const step2Status = generatorExecution.step2.status;
    const tratamentoStatus = generatorExecution.tratamentoCombStatus.status;

    if (!isExecuting && step1Status === 'idle' && step2Status === 'idle' && tratamentoStatus === 'idle') {
      // Reset quando não há nada executando
      if (agentSteps.length > 0 && agentSteps.every(s => s.status !== 'running')) {
        // Manter se já completou
        return;
      }
      return;
    }

    // Detectar tipo de fluxo e atualizar etapas
    if (step1Status === 'running' && step2Status === 'idle') {
      // Apenas Comando IA
      if (agentSteps.length === 0 || agentSteps[0].id !== 'sending') {
        setAgentSteps(COMMAND_STEPS.map(s => ({ ...s })));
        setShowAgentProgress(true);
      }
      updateAgentStep('sending', 'completed');
      updateAgentStep('analyzing', 'running');
    } else if (step2Status === 'running' && step1Status === 'idle') {
      // Apenas Copywriting
      if (agentSteps.length === 0 || agentSteps[0].id !== 'sending') {
        setAgentSteps(COPY_STEPS.map(s => ({ ...s })));
        setShowAgentProgress(true);
      }
      updateAgentStep('sending', 'completed');
      updateAgentStep('writing', 'running');
    } else if (step1Status === 'running' || (step1Status === 'success' && step2Status === 'running')) {
      // Fluxo completo
      if (agentSteps.length === 0 || agentSteps[0].id !== 'sending_cmd') {
        setAgentSteps(FULL_FLOW_STEPS.map(s => ({ ...s })));
        setShowAgentProgress(true);
      }

      if (step1Status === 'running') {
        updateAgentStep('sending_cmd', 'completed');
        updateAgentStep('analyzing', 'running');
      } else if (step1Status === 'success') {
        updateAgentStep('sending_cmd', 'completed');
        updateAgentStep('analyzing', 'completed');
        updateAgentStep('command_ai', 'completed');

        if (step2Status === 'running') {
          updateAgentStep('copywriting', 'running');
        } else if (step2Status === 'success') {
          updateAgentStep('copywriting', 'completed');
        }
      }
    }

    // Atualizar status do comando IA
    if (step1Status === 'success' && agentSteps.find(s => s.id === 'generating')) {
      updateAgentStep('generating', 'completed');
      updateAgentStep('finalizing', 'completed');
    }

    // Atualizar status do copywriting
    if (step2Status === 'success' && agentSteps.find(s => s.id === 'writing')) {
      updateAgentStep('writing', 'completed');
      updateAgentStep('optimizing', 'completed');
      updateAgentStep('finalizing', 'completed');
    }

    // Atualizar status da geração de imagem
    if (tratamentoStatus === 'sending' || tratamentoStatus === 'retrying') {
      if (agentSteps.find(s => s.id === 'image_gen')) {
        updateAgentStep('image_gen', 'running');
      } else if (agentSteps.find(s => s.id === 'generating')) {
        updateAgentStep('generating', 'running');
      }
    }

    if (tratamentoStatus === 'success') {
      if (agentSteps.find(s => s.id === 'image_gen')) {
        updateAgentStep('image_gen', 'completed');
        updateAgentStep('upscaling', 'completed');
      } else if (agentSteps.find(s => s.id === 'upscaling')) {
        updateAgentStep('upscaling', 'completed');
        updateAgentStep('finalizing', 'completed');
      }
    }

    // Erros
    if (step1Status === 'error') {
      updateAgentStep('analyzing', 'error');
    }
    if (step2Status === 'error') {
      updateAgentStep('writing', 'error');
    }
    if (tratamentoStatus === 'error') {
      if (agentSteps.find(s => s.id === 'image_gen')) {
        updateAgentStep('image_gen', 'error');
      } else if (agentSteps.find(s => s.id === 'generating')) {
        updateAgentStep('generating', 'error');
      }
    }
  }, [
    generatorExecution.isExecuting,
    generatorExecution.isGeneratingImage,
    generatorExecution.step1.status,
    generatorExecution.step2.status,
    generatorExecution.tratamentoCombStatus.status,
    agentSteps,
    updateAgentStep
  ]);

  // Clear generated images
  const clearGeneratedImages = () => {
    setGeneratedImages([]);
    toast.success("Imagens removidas");
  };

  const progress = calculateProgress();
  const canSendTratamento = generatorExecution.step1.result || generatorExecution.step2.result;

  // Verificar se os agentes estão ativos
  const isAgentActive = generatorExecution.isExecuting ||
    generatorExecution.isGeneratingImage ||
    parallelGeneration.isTestingParallel;

  // Wrapper functions to handle callbacks
  const handleTestParallel = useCallback(() => {
    // Inicializar etapas de imagem para teste paralelo
    setAgentSteps(IMAGE_STEPS.map(s => ({ ...s })));
    setShowAgentProgress(true);
    parallelGeneration.setSceneStatuses([]);
    setActiveTab("monitor");
    parallelGeneration.testParallelWebhook(handleImagesGenerated, () => {
      // Marcar todas como completas ao finalizar
      setAgentSteps(prev => prev.map(s => ({ ...s, status: 'completed' as const })));
    });
  }, [parallelGeneration, handleImagesGenerated]);

  const handleRetryScene = useCallback((sceneType: string) => {
    parallelGeneration.retryFailedScene(sceneType, handleImageGenerated);
  }, [parallelGeneration, handleImageGenerated]);

  const handleRetryAllFailed = useCallback(() => {
    parallelGeneration.retryAllFailedScenes(handleImageGenerated);
  }, [parallelGeneration, handleImageGenerated]);

  const handleGenerateImage = useCallback(() => {
    // Inicializar etapas de imagem
    setAgentSteps(IMAGE_STEPS.map(s => ({ ...s })));
    setShowAgentProgress(true);
    parallelGeneration.setSceneStatuses([]);
    if (generateMode === 'multiple' && selectedSceneTypes.length > 1) {
      setActiveTab("monitor");
    }
    generatorExecution.generateImageViaN8N(
      handleImagesGenerated,
      parallelGeneration.setSceneStatuses,
      parallelGeneration.checkCreditsAvailable
    );
  }, [generatorExecution, generateMode, selectedSceneTypes.length, handleImagesGenerated, parallelGeneration]);

  const handleResendTratamento = useCallback(() => {
    setAgentSteps(IMAGE_STEPS.map(s => ({ ...s })));
    setShowAgentProgress(true);
    generatorExecution.resendTratamentoCombinado(handleImagesGenerated);
  }, [generatorExecution, handleImagesGenerated]);

  // Verificar se há conteúdo para download
  const hasDownloadableContent = generatedImages.length > 0 || generatorExecution.step1.result || generatorExecution.step2.result;

  // Contagem de conteúdo para detectar novo conteúdo
  const contentCount = useMemo(() =>
    generatedImages.length + (generatorExecution.step1.result ? 1 : 0) + (generatorExecution.step2.result ? 1 : 0),
    [generatedImages.length, generatorExecution.step1.result, generatorExecution.step2.result]
  );

  // Estado para animação de destaque quando novo conteúdo é gerado
  const [isHighlighted, setIsHighlighted] = useState(false);
  const prevContentCountRef = useRef(contentCount);

  useEffect(() => {
    // Se o contentCount aumentou, ativar animação
    if (contentCount > prevContentCountRef.current && contentCount > 0) {
      setIsHighlighted(true);
      // Remover animação após 3 segundos
      const timer = setTimeout(() => setIsHighlighted(false), 3000);
      return () => clearTimeout(timer);
    }
    prevContentCountRef.current = contentCount;
  }, [contentCount]);

  // Lógica de validação para o botão mágico
  const getMissingFields = useCallback(() => {
    const missing: string[] = [];

    if (productImages.length < 2) {
      missing.push(`Imagens (${productImages.length}/2 mínimo)`);
    }
    if (!product.nome?.trim()) {
      missing.push("Nome do Produto");
    }
    if (!product.descricao_curta?.trim()) {
      missing.push("Descrição Curta");
    }
    if (!product.preco_custo || product.preco_custo <= 0) {
      missing.push("Preço de Custo");
    }
    if (!product.sku?.trim()) {
      missing.push("SKU");
    }

    return missing;
  }, [product, productImages.length]);

  const missingFields = getMissingFields();
  const isMagicValid = missingFields.length === 0 &&
    !!webhookComandoUnificado &&
    !!webhookCopywriting &&
    !!webhookTratamentoCombinado;

  // Handler para executar fluxo mágico
  const handleMagicFlow = useCallback(() => {
    setAgentSteps(FULL_FLOW_STEPS.map(s => ({ ...s })));
    setShowAgentProgress(true);
    setActiveTab("progresso");
    generatorExecution.executeMagicFlow(handleImagesGenerated, setMagicStep);
  }, [generatorExecution, handleImagesGenerated]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <BroadcastDebugPanel /> {/* Debug Panel Flutuante */}
      {/* Header com botão de download */}
      <GeneratorHeader
        userEmail={userEmail}
        hasDownloadableContent={hasDownloadableContent}
        product={{
          nome: product.nome,
          descricao: product.descricao_curta,
          sku: `gerador_${Date.now()}`
        }}
        unifiedData={generatorExecution.step1.result}
        copywritingText={generatorExecution.step2.result || undefined}
        images={generatedImages.map(img => ({
          url: img.imageUrl,
          type: img.sceneType
        }))}
        isHighlighted={isHighlighted}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda - Configuração e Input */}
        <div className="space-y-4">
          {/* Configuração Webhooks */}
          <WebhookConfigCard
            showConfig={showConfig}
            onShowConfigChange={setShowConfig}
            webhookComandoUnificado={webhookComandoUnificado}
            onWebhookComandoUnificadoChange={setWebhookComandoUnificado}
            webhookCopywriting={webhookCopywriting}
            onWebhookCopywritingChange={setWebhookCopywriting}
            webhookTratamentoCombinado={webhookTratamentoCombinado}
            onWebhookTratamentoCombinadoChange={setWebhookTratamentoCombinado}
          />

          {/* Dados do Produto */}
          <ProductInputCard
            product={product}
            onProductChange={setProduct}
            productImages={productImages}
            onRemoveImage={removeImage}
            dropzoneProps={{
              getRootProps,
              getInputProps,
              isDragActive,
            }}
            isMaxImages={isMaxImages}
          />

          {/* Testar Etapas Individualmente */}
          <StepTestCard
            step1Status={generatorExecution.step1}
            onExecuteStep1={generatorExecution.executeStep1}
            webhookComandoUnificadoConfigured={!!webhookComandoUnificado}
            step2Status={generatorExecution.step2}
            onExecuteStep2={generatorExecution.executeStep2}
            webhookCopywritingConfigured={!!webhookCopywriting}
            isTestingParallel={parallelGeneration.isTestingParallel}
            parallelTestProgress={parallelGeneration.parallelTestProgress}
            onTestParallel={handleTestParallel}
            webhookTratamentoConfigured={!!webhookTratamentoCombinado}
            hasProductImages={productImages.length > 0}
            hasProductName={!!product.nome}
            canStartNewJob={canStartNewJob}
            activeJobsCount={activeJobsCount}
            maxConcurrent={maxConcurrent}
            enableCompression={enableCompression}
            onEnableCompressionChange={setEnableCompression}
            productImages={productImages}
            productValid={!!product.nome && !!product.descricao_curta}
          />

          {/* Separador */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">automação completa</span>
            </div>
          </div>

          {/* Botão Mágico - Acionar Agentes de Conversão */}
          <MagicAgentButton
            onClick={handleMagicFlow}
            isExecuting={generatorExecution.isExecuting}
            isValid={isMagicValid}
            missingFields={missingFields}
            currentStep={magicStep || generatorExecution.magicFlowStep}
          />

          {/* Separador */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou execute manualmente</span>
            </div>
          </div>

          {/* Botão Gerar Tudo (manual) */}
          <Button
            className="w-full h-10 text-sm gap-2"
            variant="outline"
            onClick={() => generatorExecution.executeFullFlow()}
            disabled={generatorExecution.isExecuting || (!webhookComandoUnificado && !webhookCopywriting) || !product.nome || !product.descricao_curta}
          >
            {generatorExecution.isExecuting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Executando...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Executar Fluxo Manual
              </>
            )}
          </Button>
        </div>

        {/* Coluna Direita - Progresso e Resultados */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="progresso">Progresso</TabsTrigger>
              <TabsTrigger value="monitor" className="gap-1">
                <Zap className="h-3 w-3" />
                Monitor
              </TabsTrigger>
              <TabsTrigger value="resultados">Resultados</TabsTrigger>
              <TabsTrigger value="imagens" className="gap-1">
                <ImageIcon className="h-3 w-3" />
                Imagens
                {generatedImages.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">{generatedImages.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="logs" className="gap-1">
                <History className="h-3 w-3" />
                Logs
              </TabsTrigger>
              <TabsTrigger value="tratamento">Tratamento</TabsTrigger>
            </TabsList>

            {/* Tab Progresso */}
            <TabsContent value="progresso" className="space-y-4">
              {/* Indicador de Agentes com animação */}
              {showAgentProgress && agentSteps.length > 0 && (
                <AgentProgressIndicator
                  steps={agentSteps}
                  isRunning={isAgentActive}
                />
              )}

              <ProgressTab
                progress={progress}
                step1={generatorExecution.step1}
                step2={generatorExecution.step2}
                tratamentoCombStatus={generatorExecution.tratamentoCombStatus}
                webhookComandoUnificadoConfigured={!!webhookComandoUnificado}
                webhookCopywritingConfigured={!!webhookCopywriting}
                webhookTratamentoConfigured={!!webhookTratamentoCombinado}
              />
            </TabsContent>

            {/* Tab Monitor */}
            <TabsContent value="monitor" className="space-y-4">
              <ParallelGenerationMonitor
                sceneStatuses={parallelGeneration.sceneStatuses}
                isRunning={parallelGeneration.isTestingParallel || generatorExecution.isGeneratingImage}
                onRetryScene={handleRetryScene}
                onRetryAllFailed={handleRetryAllFailed}
              />

              {parallelGeneration.sceneStatuses.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Inicie um teste paralelo para ver o monitor de geração</p>
                    <p className="text-xs mt-1">O dashboard mostra o status de cada cena em tempo real</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab Resultados */}
            <TabsContent value="resultados" className="space-y-4">
              <ResultadosTab
                step1Result={generatorExecution.step1.result}
                step2Result={generatorExecution.step2.result}
                generatedImages={generatedImages}
                productName={product.nome}
                productDescription={product.descricao_curta || ''}
              />
            </TabsContent>

            {/* Tab Imagens Geradas */}
            <TabsContent value="imagens" className="space-y-4">
              <SceneTypeSelector
                generateMode={generateMode}
                onGenerateModeChange={setGenerateMode}
                selectedSceneTypes={selectedSceneTypes}
                onSelectedSceneTypesChange={setSelectedSceneTypes}
                isGeneratingImage={generatorExecution.isGeneratingImage}
                imageGenProgress={generatorExecution.imageGenProgress}
                onGenerateImage={handleGenerateImage}
                webhookConfigured={!!webhookTratamentoCombinado}
                hasProductName={!!product.nome}
                hasProductImages={productImages.length > 0}
              />

              <GeneratedImageGallery
                images={generatedImages}
                isGenerating={generatorExecution.isGeneratingImage}
                onClearImages={clearGeneratedImages}
              />

              {generatedImages.length > 0 && (
                <div className="flex justify-center pt-4">
                  <EbookDownloadButton
                    product={{
                      nome: product.nome,
                      descricao: product.descricao_curta,
                      sku: `gerador_${Date.now()}`
                    }}
                    unifiedData={generatorExecution.step1.result}
                    copywritingText={generatorExecution.step2.result}
                    images={generatedImages.map(img => ({
                      url: img.imageUrl,
                      type: img.sceneType
                    }))}
                    size="lg"
                    className="gap-2"
                  />
                </div>
              )}
            </TabsContent>

            {/* Tab Logs */}
            <TabsContent value="logs" className="space-y-4">
              <GenerationLogsViewer />
            </TabsContent>

            {/* Tab Tratamento */}
            <TabsContent value="tratamento" className="space-y-4">
              <TratamentoTab
                tratamentoCombStatus={generatorExecution.tratamentoCombStatus}
                canSendTratamento={!!canSendTratamento}
                onResend={handleResendTratamento}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modal de limite de jobs */}
      <JobLimitAlert
        open={showLimitAlert}
        onOpenChange={closeLimitAlert}
        data={limitAlertData}
        onViewProgress={() => {
          setActiveTab("monitor");
          closeLimitAlert();
        }}
      />
    </div>
  );
}
