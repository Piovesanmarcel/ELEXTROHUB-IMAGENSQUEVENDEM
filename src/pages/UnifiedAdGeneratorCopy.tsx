import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { RefreshCw, Package, Sparkles, Rocket, Grid3x3, Cpu, Copy, Check, Settings, Play, Send, Zap, Clock, AlertCircle, Loader2, CheckCircle2, FileText, Shrink, Bot, Pause, PlayCircle, Wand2 } from "lucide-react";
import { MagicAgentButton } from "@/components/generator/MagicAgentButton";
import { ProductShowcaseGenerator } from "@/components/product/ProductShowcaseGenerator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Brain, ChevronDown, ChevronUp } from "lucide-react";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { useBroadcast } from "@/contexts/BroadcastContext";
import { MidjourneyPromptsSection } from "@/components/product/MidjourneyPromptsSection";
import { ProductImagesGrid } from "@/components/product/ProductImagesGrid";
import { GeminiBackgroundGenerator } from "@/components/product/GeminiBackgroundGenerator";
import { CloudinaryProductTransform } from "@/components/product/CloudinaryProductTransform";
import { ProductFormContent } from "@/components/product/ProductFormContent";
import { CopywritingGenerator } from "@/components/product/CopywritingGenerator";
import { PremiumAdsExportButton } from "@/components/product/PremiumAdsExportButton";
import { ProductDetailsLayout } from "@/components/product/ProductDetailsLayout";
import { CanvaStyleTemplateGenerator } from "@/components/product/CanvaStyleTemplateGenerator";
import { SafeErrorBoundary } from "@/components/SafeErrorBoundary";
import PricingControls from "@/components/pricing/PricingControls";
import { ProductTable } from "@/components/ProductTable";
import { useProductsPricing } from "@/hooks/products/useProductsPricing";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { useAdGeneratorAutomation } from "@/hooks/useAdGeneratorAutomation";
import { AutomationProgressIndicator } from "@/components/product/AutomationProgressIndicator";
import { ValidationIndicator } from "@/components/product/ValidationIndicator";
import { useEnhancementUsage } from "@/hooks/useEnhancementUsage";
import { CreditsCompactBadge } from "@/components/dashboard/CreditsCompactBadge";
import { AIImageAutoProcessor } from "@/components/product/ai-automation/AIImageAutoProcessor";
import { convertImagesToBlob, safeStorageSet, filterStorableUrls, base64ToBlobUrl, fetchUrlToBlobUrl } from "@/utils/blobUrlConverter";
import { PreflightCheckModal } from "@/components/product/PreflightCheckModal";
import { AIImagesSessionCache } from "@/services/AIImagesSessionCache";
import { clearAllImageCaches, filterBlockedUrls } from "@/utils/clearAllImageCaches";
import { Trash2 } from "lucide-react";
// Removido: ParallelGenerationMonitor e GeneratedImageGallery - imagens vão direto para Galeria Principal
import { supabase } from "@/integrations/supabase/client";
import { compressMultipleImages, needsCompression } from "@/lib/imageCompression";
import { useRunwareTest } from "@/hooks/useRunwareTest";
import { useAutomationSettings } from "@/hooks/useAutomationSettings";
import EbookDownloadButton from "@/components/download/EbookDownloadButton";
import { useWebhookStorage } from "@/features/generator/hooks/useWebhookStorage";
import { N8NWebhooksUI } from "@/components/settings/N8NWebhooksUI";
import { VisualPackageCards, type PackageType, type VisualPackage } from "@/components/generator/VisualPackageCards";
import { useWebhookProxy, type WebhookType, type VisualPackageType } from "@/hooks/useWebhookProxy";

// ===== N8N Interfaces & Constants =====
interface StepStatus {
  status: "idle" | "running" | "success" | "error";
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  result: any | null;
  responseTime?: number;
}

const MAX_SCENE_RETRY_ATTEMPTS = 3;
const SCENE_RETRY_DELAYS = [1000, 2000, 4000];

const SCENE_TYPES = [
  { id: 'product_studio', label: '📷 Studio Profissional', description: 'Fundo branco, iluminação profissional' },
  { id: 'packaging', label: '📦 Embalagem Premium', description: 'Apresentação de embalagem luxuosa' },
  { id: 'mockup', label: '🏠 Mockup Realista', description: 'Produto em contexto de uso real' },
  { id: 'lifestyle', label: '👤 Lifestyle', description: 'Interação humana com o produto' },
  { id: 'ambient_1', label: '🌆 Ambiente Comercial', description: 'Cena em ambiente profissional/comercial' },
  { id: 'ambient_2', label: '🏡 Ambiente Residencial', description: 'Produto em ambiente doméstico' },
  { id: 'ambient_3', label: '✨ Ambiente Minimalista', description: 'Clean, minimalista e elegante' },
  { id: 'person_using', label: '👋 Pessoa Usando', description: 'Demonstração de uso do produto' },
] as const;

type SceneType = typeof SCENE_TYPES[number]['id'];

// Helper component for status icons
const StatusIcon = ({ status }: { status: "idle" | "running" | "success" | "error" }) => {
  switch (status) {
    case "running":
      return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
    case "success":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "error":
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    default:
      return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />;
  }
};

export default function UnifiedAdGeneratorCopy() {
  const [expandedCanvaTemplates, setExpandedCanvaTemplates] = useState(false);
  const [expandedShowcase, setExpandedShowcase] = useState(false);
  const [expandedAutoProcessor, setExpandedAutoProcessor] = useState(false);
  const [unifiedData, setUnifiedData] = useState<any>(null);
  const [hostedAIImages, setHostedAIImages] = useState<string[]>([]);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [referenceImages, setReferenceImages] = useState<string[]>([]); // Imagens de referência iniciais
  const [isEditing, setIsEditing] = useState(true); // Sempre em modo de edição
  const [showPreflightModal, setShowPreflightModal] = useState(false); // Modal Pre-Flight Check

  // ✅ NOVO: Estado separado para URLs HTTPS originais (não convertidas para blob)
  // Usado para geração de templates que requerem URLs acessíveis pela internet
  const [originalHostedUrls, setOriginalHostedUrls] = useState<string[]>([]);

  // ===== N8N WEBHOOKS STATES (Substituído pelo Hook useWebhookStorage) =====
  // Removido useState locais para usar o hook centralizado

  // ===== N8N STEP STATUSES =====
  const [step1, setStep1] = useState<StepStatus>({
    status: "idle", startedAt: null, completedAt: null, error: null, result: null
  });
  const [step2, setStep2] = useState<StepStatus>({
    status: "idle", startedAt: null, completedAt: null, error: null, result: null
  });

  // ✅ NOVO: Estados separados para resultados N8N (não afetam "Automação Completa")
  const [n8nUnifiedResult, setN8nUnifiedResult] = useState<any>(null);
  const [n8nCopywritingResult, setN8nCopywritingResult] = useState<any>(null);
  const [wasAutomationStarted, setWasAutomationStarted] = useState(false);

  // ===== N8N PARALLEL GENERATION =====
  // Removido: sceneStatuses, generatedImages, isGeneratingImages
  // Imagens do n8n agora vão direto para Galeria Principal via hostedImageSaved
  const [isTestingParallel, setIsTestingParallel] = useState(false);
  const [parallelTestProgress, setParallelTestProgress] = useState({ current: 0, total: 0, completed: 0, failed: 0 });
  const [enableCompression, setEnableCompression] = useState(true);
  const [showN8NConfig, setShowN8NConfig] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // ✅ Hooks de Webhook e Estados de Disparo Unificado
  const {
    webhooks,
    saveWebhook,
    webhookComandoUnificado, setWebhookComandoUnificado,
    webhookCopywriting, setWebhookCopywriting,
    webhookTratamentoCombinado, setWebhookTratamentoCombinado,
    isLoading
  } = useWebhookStorage();


  // ✅ NOVO: Estado para indicador visual de upscale em progresso
  const [upscaleProgress, setUpscaleProgress] = useState<{
    isProcessing: boolean;
    currentImage: number;
    totalImages: number;
    sceneType: string;
  }>({
    isProcessing: false,
    currentImage: 0,
    totalImages: 0,
    sceneType: ''
  });

  // ✅ Refs para controlar execução independente (não causam re-render)
  const step1RunningRef = useRef(false);
  const step2RunningRef = useRef(false);

  // ✅ Hook para controle de automação (kill switch)
  // const { isPaused, loading: automationSettingsLoading, updating: automationSettingsUpdating, togglePaused } = useAutomationSettings();
  // ✅ TRAVA DE SEGURANÇA: Forçar automação sempre ativa
  const isPaused = false;
  const automationSettingsLoading = false;
  const automationSettingsUpdating = false;
  const togglePaused = () => toast.info("A automação está configurada para ficar sempre ativa.");

  // ✅ NOVO: Ref para deduplicação de eventos n8n (evitar loop infinito)
  const processedN8NImagesRef = useRef<Set<string>>(new Set());

  // ✅ Estado para Configurações Avançadas (Toggle)
  const [showConfig, setShowConfig] = useState(false);

  // ✅ Estados para o Botão Mágico "Acionar Agentes de Conversão"
  const [isMagicFlowExecuting, setIsMagicFlowExecuting] = useState(false);
  const [magicFlowCurrentStep, setMagicFlowCurrentStep] = useState<string | undefined>(undefined);

  // ✅ Hook para proxy seguro de webhooks (URLs protegidas no servidor)
  const { fireWebhook, fireVisualPackageAll, isLoading: webhookProxyLoading } = useWebhookProxy({
    showToasts: false, // Gerenciamos toasts manualmente para múltiplos webhooks
    onSuccess: (response) => {
      console.log('[WebhookProxy] Sucesso:', response);
    },
    onError: (error, code) => {
      console.error('[WebhookProxy] Erro:', error, code);
    }
  });

  // ⚠️ Aviso ao sair da página se houver imagens não baixadas
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Verificar se há imagens geradas que podem ser perdidas
      const hasGeneratedImages = productImages.length > 0 ||
        hostedAIImages.length > 0 ||
        originalHostedUrls.length > 0;

      if (hasGeneratedImages) {
        const message = '⚠️ Você tem imagens geradas que podem ser perdidas! Baixe-as antes de sair.';
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [productImages.length, hostedAIImages.length, originalHostedUrls.length]);

  // ID único para o produto temporário - PERSISTIDO na sessão
  const [productId] = useState(() => {
    const existingId = sessionStorage.getItem('unified_ad_generator_product_id');
    if (existingId) {
      console.log('🔄 [UNIFIED-AD-GENERATOR] Reutilizando productId da sessão:', existingId);
      return existingId;
    }
    const newId = `unified-ad-gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('unified_ad_generator_product_id', newId);
    console.log('✨ [UNIFIED-AD-GENERATOR] Novo productId criado:', newId);
    return newId;
  });

  // Dados do formulário (vazios inicialmente)
  const [formData, setFormData] = useState({
    nome: '',
    sku: '',
    descricao_curta: '',
    descricao: '',
    preco_custo: 0,
    preco_venda: 0,
    peso_liquido: 0,
    altura: null as number | null,
    largura: null as number | null,
    profundidade: null as number | null,
    peso_bruto: null as number | null,
  });

  // Produto mock para componentes que precisam de objeto produto
  const product: any = {
    id: productId,
    nome: formData.nome,
    sku: formData.sku || 'UNIFIED-AD-GEN',
    descricao_curta: formData.descricao_curta,
    descricao: formData.descricao,
    preco_custo: formData.preco_custo,
    preco_venda: formData.preco_venda,
    preco: formData.preco_venda,
    peso_liquido: formData.peso_liquido,
    altura: formData.altura,
    largura: formData.largura,
    profundidade: formData.profundidade,
    peso_bruto: formData.peso_bruto,
    imagens: productImages,
    estoque: 100,
    imagem_url: productImages[0] || null,
    imagem_url_2: productImages[1] || null,
    imagem_url_3: productImages[2] || null,
    imagem_url_4: productImages[3] || null,
    imagem_url_5: productImages[4] || null,
    imagem_url_6: productImages[5] || null,
    imagem_url_7: productImages[6] || null,
    imagem_url_8: productImages[7] || null,
    imagem_url_9: productImages[8] || null,
    imagem_url_10: productImages[9] || null,
    categoria: null,
    marca: null,
    gtin: null,
    unidade: 'UN',
    situacao: 'Ativo',
    usuario_id: null,
    bling_id: null,
    atualizado_em: null,
  };

  const {
    profitMargin,
    setProfitMargin,
    taxRate,
    setTaxRate,
    storeCommission,
    setStoreCommission,
    selectedPricing,
    setSelectedPricing
  } = useProductsPricing();

  // 🏷️ Brand Settings para logo global
  const { brandSettings } = useBrandSettings();

  // 📡 Hook global para receber broadcasts de imagens do n8n
  const { activeBatchProgress, isConnected: isBroadcastConnected, debugState } = useBroadcast();

  // 💰 Hook de créditos
  const { usage, isLoading: isLoadingCredits } = useEnhancementUsage();

  // 📈 Hook Runware para upscale automático
  const { upscaleImage } = useRunwareTest();

  // Callback para atualizar galeria ao finalizar automação
  const handleGalleryUpdate = useCallback((newImages: string[]) => {
    console.log('🖼️ [UnifiedAdGenerator] Galeria substituída com', newImages.length, 'imagens');
    setProductImages(newImages);
  }, []);

  // 🚀 Hook de automação
  const {
    isFormValid,
    missingFields,
    isAutomationRunning,
    isStarting,
    isAutomationComplete,
    automationStep,
    steps,
    unifiedCommandsData,
    copywritingData,
    geminiImages,
    kitImages,
    longTailTitles,
    midjourneyPrompts,
    startAutomation,
    startAIOnlyTest,
    handleUnifiedCommandsComplete,
    handleCopywritingComplete,
    handleGeminiComplete,
    handleKitsComplete,
    updateStepStatus,
    setAutomationStep,
    setLongTailTitles,
  } = useAdGeneratorAutomation(productImages, formData, handleGalleryUpdate, productId);

  // Handler para mudanças no formulário
  const handleFormDataChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Handler para atualizar descrição
  const handleUpdateDescription = useCallback((newDescription: string) => {
    setFormData(prev => ({
      ...prev,
      descricao: newDescription
    }));
    toast.success('Descrição atualizada!');
  }, []);

  // Handler para imagens uploadadas
  const handleImagesUploaded = useCallback((newImages: string[]) => {
    setProductImages(newImages);

    // ✅ MELHORADO: Garantir que sempre temos até 2 imagens de referência
    if (referenceImages.length < 2 && newImages.length >= 1) {
      if (referenceImages.length === 0) {
        const refs = newImages.slice(0, Math.min(2, newImages.length));
        setReferenceImages(refs);
        console.log('📌 [REFERÊNCIA] Imagens de referência salvas:', refs.length);
      }
      else if (referenceImages.length === 1 && newImages.length >= 2) {
        const secondRef = newImages.find(img => img !== referenceImages[0]);
        if (secondRef) {
          setReferenceImages(prev => [...prev, secondRef]);
          console.log('📌 [REFERÊNCIA] Segunda imagem de referência adicionada');
        }
      }
    }
  }, [referenceImages]);

  // 🔧 Ref para acesso síncrono ao estado isAutomationRunning (evita race condition)
  const isAutomationRunningRef = useRef(isAutomationRunning);

  // Manter ref sincronizada com o estado
  useEffect(() => {
    isAutomationRunningRef.current = isAutomationRunning;
    console.log('🔄 [UnifiedAdGenerator] isAutomationRunning atualizado:', isAutomationRunning);
  }, [isAutomationRunning]);

  // Listener para dados do Comando Unificado
  useEffect(() => {
    const handleUnifiedComplete = (event: CustomEvent) => {
      console.log('📥 [UnifiedAdGenerator] Comando Unificado completo:', event.detail);
      console.log('🔍 [UnifiedAdGenerator] isAutomationRunning (ref):', isAutomationRunningRef.current);
      setUnifiedData(event.detail);
      if (isAutomationRunningRef.current) {
        console.log('✅ [UnifiedAdGenerator] Chamando handleUnifiedCommandsComplete...');
        handleUnifiedCommandsComplete(event.detail);
      }
    };

    window.addEventListener('unifiedCommandsComplete', handleUnifiedComplete as EventListener);
    return () => {
      window.removeEventListener('unifiedCommandsComplete', handleUnifiedComplete as EventListener);
    };
  }, [handleUnifiedCommandsComplete]);

  // Listener para Copywriting completo
  useEffect(() => {
    const handleCopyComplete = (event: CustomEvent) => {
      console.log('📥 [UnifiedAdGenerator] Copywriting completo');
      console.log('🔍 [UnifiedAdGenerator] isAutomationRunning (ref):', isAutomationRunningRef.current);
      if (isAutomationRunningRef.current) {
        console.log('✅ [UnifiedAdGenerator] Chamando handleCopywritingComplete...');
        handleCopywritingComplete(event.detail?.content || '');
      }
    };

    window.addEventListener('copywritingComplete', handleCopyComplete as EventListener);
    return () => {
      window.removeEventListener('copywritingComplete', handleCopyComplete as EventListener);
    };
  }, [handleCopywritingComplete]);

  // Listener para Gemini completo
  useEffect(() => {
    const handleGeminiComplete2 = (event: CustomEvent) => {
      console.log('📥 [UnifiedAdGenerator] Gemini completo');
      console.log('🔍 [UnifiedAdGenerator] isAutomationRunning (ref):', isAutomationRunningRef.current);
      if (isAutomationRunningRef.current) {
        const images = event.detail?.images || [];
        const whiteBackgroundImage = event.detail?.whiteBackgroundImage;
        console.log('✅ [UnifiedAdGenerator] Chamando handleGeminiComplete com', images.length, 'imagens e fundo branco:', whiteBackgroundImage ? 'SIM' : 'NÃO');
        handleGeminiComplete(images, whiteBackgroundImage);
      }
    };

    window.addEventListener('geminiAutomationComplete', handleGeminiComplete2 as EventListener);
    return () => {
      window.removeEventListener('geminiAutomationComplete', handleGeminiComplete2 as EventListener);
    };
  }, [handleGeminiComplete]);

  // Listener para KITs completo
  useEffect(() => {
    const handleKitsComplete2 = (event: CustomEvent) => {
      console.log('📥 [UnifiedAdGenerator] KITs completos');
      console.log('🔍 [UnifiedAdGenerator] isAutomationRunning (ref):', isAutomationRunningRef.current);
      if (isAutomationRunningRef.current) {
        console.log('✅ [UnifiedAdGenerator] Chamando handleKitsComplete...');
        const kits = event.detail?.kits || [];
        const kitImageUrls = kits.map((kit: { url: string }) => kit.url);
        handleKitsComplete(kitImageUrls);
      }
    };

    window.addEventListener('kitsAutomationComplete', handleKitsComplete2 as EventListener);
    return () => {
      window.removeEventListener('kitsAutomationComplete', handleKitsComplete2 as EventListener);
    };
  }, [handleKitsComplete]);

  // Listener para títulos Long Tail do Copywriting
  useEffect(() => {
    const handleLongTailTitles = (event: CustomEvent) => {
      const titles = event.detail?.titles || [];
      console.log('📝 [UnifiedAdGenerator] Títulos Long Tail recebidos:', titles.length);
      setLongTailTitles(titles);
    };

    window.addEventListener('copywritingLongTailTitles', handleLongTailTitles as EventListener);
    return () => {
      window.removeEventListener('copywritingLongTailTitles', handleLongTailTitles as EventListener);
    };
  }, [setLongTailTitles]);

  // ✅ NOVO: Listener para absorver imagens geradas na galeria principal
  // Inclui suporte para broadcasts n8n via useBatchResults
  useEffect(() => {
    const handleImageGenerated = async (event: CustomEvent) => {
      const {
        productId: eventProductId,
        images,
        source,
        url,
        hostedUrl,
        templateId,
        jobId,
        aiOrigin,
        productName: eventProductName
      } = event.detail || {};

      // ✅ Processar broadcasts do n8n-stream e sincronizar com Galeria do Produto
      if (aiOrigin === 'n8n-broadcast' || source === 'n8n-stream') {
        // ✅ DEDUPLICAÇÃO: Evitar processar o mesmo evento múltiplas vezes
        const eventKey = `${jobId}-${templateId}-${event.detail?.receivedAt || Date.now()}`;

        if (processedN8NImagesRef.current.has(eventKey)) {
          console.log(`⏭️ [UNIFIED-AD-GENERATOR] Evento n8n já processado, ignorando: ${eventKey}`);
          return;
        }

        processedN8NImagesRef.current.add(eventKey);
        console.log(`✅ [UNIFIED-AD-GENERATOR] Evento n8n ÚNICO aceito: ${eventKey} (total: ${processedN8NImagesRef.current.size})`);

        // Limpar eventos antigos (manter últimos 30)
        if (processedN8NImagesRef.current.size > 30) {
          const oldest = [...processedN8NImagesRef.current][0];
          processedN8NImagesRef.current.delete(oldest);
        }

        console.log('🎉 [UNIFIED-AD-GENERATOR] Broadcast n8n recebido!', {
          templateId,
          jobId,
          hasImages: !!images,
          productName: eventProductName
        });

        if (images && images.length > 0) {
          // ✅ Iniciar indicador de progresso
          setUpscaleProgress({
            isProcessing: true,
            currentImage: 0,
            totalImages: images.length,
            sceneType: ''
          });

          // Mapear templateId para sceneType
          const sceneMapping: Record<string, string> = {
            'template_01': 'product_studio',
            'template_02': 'packaging',
            'template_03': 'mockup',
            'template_04': 'lifestyle',
            'template_05': 'ambient_1',
            'template_06': 'ambient_2',
            'template_07': 'ambient_3',
            'template_08': 'person_using'
          };

          // ✅ Processar cada imagem com upscale 2x via Runware antes de adicionar à galeria
          for (let i = 0; i < images.length; i++) {
            const imageData = images[i];
            const imageUrl = imageData.startsWith('data:')
              ? imageData
              : `data:image/png;base64,${imageData}`;

            const sceneType = sceneMapping[templateId] || templateId || 'n8n-generated';

            // ✅ Atualizar progresso atual
            setUpscaleProgress(prev => ({
              ...prev,
              currentImage: i + 1,
              sceneType: sceneType
            }));

            // ✅ NOVO: Fazer upscale 2x com Runware antes de adicionar à galeria
            console.log(`📈 [N8N→UPSCALE] Aplicando upscale 2x com runware:503@1 para ${sceneType}...`);

            try {
              const upscaleResult = await upscaleImage(imageUrl, 2, 'runware:503@1');

              if (upscaleResult.success && upscaleResult.data?.[0]?.imageURL) {
                const upscaledHttpsUrl = upscaleResult.data[0].imageURL;
                console.log(`✅ [UPSCALE] Imagem ${sceneType} upscaled: ${upscaledHttpsUrl.substring(0, 60)}...`);

                // Converter URL HTTPS para blob URL local
                const blobUrl = await fetchUrlToBlobUrl(upscaledHttpsUrl);

                setProductImages(prev => {
                  if (prev.includes(blobUrl)) {
                    console.log(`⏭️ [N8N→GALERIA] Imagem ${sceneType} upscaled já existe`);
                    return prev;
                  }
                  console.log(`✅ [N8N→GALERIA] Imagem ${sceneType} upscaled adicionada (${upscaleResult.data[0].cost || 'N/A'} créditos)`);
                  return [...prev, blobUrl];
                });
              } else {
                // Fallback: usar imagem original se upscale falhar
                console.warn(`⚠️ [UPSCALE] Falhou para ${sceneType}, usando original`);
                const blobUrl = base64ToBlobUrl(imageUrl);
                setProductImages(prev => {
                  if (prev.includes(blobUrl)) return prev;
                  console.log(`✅ [N8N→GALERIA] Imagem ${sceneType} original adicionada (sem upscale)`);
                  return [...prev, blobUrl];
                });
              }
            } catch (upscaleError) {
              console.error(`❌ [UPSCALE] Erro para ${sceneType}:`, upscaleError);
              // Fallback para imagem original
              const blobUrl = base64ToBlobUrl(imageUrl);
              setProductImages(prev => {
                if (prev.includes(blobUrl)) return prev;
                console.log(`✅ [N8N→GALERIA] Imagem ${sceneType} original adicionada (erro upscale)`);
                return [...prev, blobUrl];
              });
            }
          }

          // ✅ Finalizar indicador de progresso
          setUpscaleProgress({
            isProcessing: false,
            currentImage: 0,
            totalImages: 0,
            sceneType: ''
          });
        }
        return;
      }

      // Fluxo normal para outras fontes
      if (eventProductId && eventProductId !== productId) return;

      console.log(`📥 [UNIFIED-AD-GENERATOR] Imagem gerada recebida:`, { source, hasImages: !!images, hasUrl: !!url, hasHostedUrl: !!hostedUrl });

      const rawUrls: string[] = [];
      const httpsUrls: string[] = [];

      if (hostedUrl) {
        rawUrls.push(hostedUrl);
        if (hostedUrl.startsWith('https://')) {
          httpsUrls.push(hostedUrl);
        }
      } else if (url) {
        rawUrls.push(url);
        if (url.startsWith('https://')) {
          httpsUrls.push(url);
        }
      }

      if (images && Array.isArray(images)) {
        images.forEach((img: string | { url?: string; hostedUrl?: string }) => {
          if (typeof img === 'string') {
            rawUrls.push(img);
            if (img.startsWith('https://')) {
              httpsUrls.push(img);
            }
          } else if (img.hostedUrl) {
            rawUrls.push(img.hostedUrl);
            if (img.hostedUrl.startsWith('https://')) {
              httpsUrls.push(img.hostedUrl);
            }
          } else if (img.url) {
            rawUrls.push(img.url);
            if (img.url.startsWith('https://')) {
              httpsUrls.push(img.url);
            }
          }
        });
      }

      if (httpsUrls.length > 0) {
        setOriginalHostedUrls(prev => {
          const uniqueNew = httpsUrls.filter(u => !prev.includes(u));
          if (uniqueNew.length === 0) return prev;
          const updated = [...prev, ...uniqueNew];
          console.log(`🔗 [UNIFIED-AD-GENERATOR] URLs HTTPS preservadas: ${uniqueNew.length} novas, total: ${updated.length}`);
          safeStorageSet('unified_ad_generator_hosted_urls', updated, 30);
          return updated;
        });
      }

      if (rawUrls.length > 0) {
        const blobUrls = convertImagesToBlob(rawUrls);

        setProductImages(prev => {
          const uniqueNew = blobUrls.filter(u => !prev.includes(u));
          if (uniqueNew.length === 0) return prev;

          const updated = [...prev, ...uniqueNew];
          console.log(`✅ [UNIFIED-AD-GENERATOR] Adicionadas ${uniqueNew.length} imagens à galeria, total: ${updated.length}`);

          safeStorageSet('unified_ad_generator_product_images', updated, 30);

          return updated;
        });
      }
    };

    const handleHostedImageSaved = (event: CustomEvent) => {
      const { productId: eventProductId, hostedUrl, url } = event.detail || {};

      if (eventProductId && eventProductId !== productId) return;

      const imageUrl = hostedUrl || url;
      if (!imageUrl) return;

      console.log(`📥 [UNIFIED-AD-GENERATOR] Imagem hospedada salva:`, imageUrl.substring(0, 60));

      if (imageUrl.startsWith('https://')) {
        setOriginalHostedUrls(prev => {
          if (prev.includes(imageUrl)) return prev;
          const updated = [...prev, imageUrl];
          console.log(`🔗 [UNIFIED-AD-GENERATOR] URL HTTPS hospedada preservada, total: ${updated.length}`);
          safeStorageSet('unified_ad_generator_hosted_urls', updated, 30);
          return updated;
        });
      }

      setProductImages(prev => {
        if (prev.includes(imageUrl)) return prev;

        const blobUrls = convertImagesToBlob([imageUrl]);
        const safeUrl = blobUrls[0] || imageUrl;

        if (prev.includes(safeUrl)) return prev;

        const updated = [...prev, safeUrl];
        console.log(`✅ [UNIFIED-AD-GENERATOR] Imagem hospedada adicionada, total: ${updated.length}`);

        safeStorageSet('unified_ad_generator_product_images', updated, 30);

        return updated;
      });
    };

    window.addEventListener('imageGenerated', handleImageGenerated as EventListener);
    window.addEventListener('hostedImageSaved', handleHostedImageSaved as EventListener);

    return () => {
      window.removeEventListener('imageGenerated', handleImageGenerated as EventListener);
      window.removeEventListener('hostedImageSaved', handleHostedImageSaved as EventListener);
    };
  }, [productId]);

  // ✅ NOVO: Restaurar imagens do sessionStorage ao carregar
  useEffect(() => {
    const savedImages = sessionStorage.getItem('unified_ad_generator_product_images');
    const savedRefs = sessionStorage.getItem('unified_ad_generator_reference_images');
    const savedHostedUrls = sessionStorage.getItem('unified_ad_generator_hosted_urls');

    if (savedHostedUrls) {
      try {
        const parsedHosted = JSON.parse(savedHostedUrls);
        if (Array.isArray(parsedHosted) && parsedHosted.length > 0) {
          const validHosted = parsedHosted.filter((u: string) =>
            typeof u === 'string' && u.startsWith('https://')
          );
          if (validHosted.length > 0) {
            console.log(`🔗 [UNIFIED-AD-GENERATOR] Restaurando ${validHosted.length} URLs HTTPS hospedadas`);
            setOriginalHostedUrls(validHosted);
          }
        }
      } catch (e) {
        console.error('Erro ao restaurar URLs hospedadas:', e);
      }
    }

    if (savedImages) {
      try {
        const parsed = JSON.parse(savedImages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validImages = filterBlockedUrls(parsed);

          if (validImages.length === 0) {
            console.log('⚠️ [UNIFIED-AD-GENERATOR] Todas as imagens eram de domínios bloqueados, limpando cache...');
            sessionStorage.removeItem('unified_ad_generator_product_images');
            return;
          }

          console.log(`🔄 [UNIFIED-AD-GENERATOR] Restaurando ${validImages.length} de ${parsed.length} imagens (${parsed.length - validImages.length} bloqueadas)`);
          setProductImages(validImages);

          if (validImages.length !== parsed.length) {
            safeStorageSet('unified_ad_generator_product_images', validImages, 30);
          }

          if (savedRefs) {
            const parsedRefs = JSON.parse(savedRefs);
            if (Array.isArray(parsedRefs) && parsedRefs.length > 0) {
              const validRefs = filterBlockedUrls(parsedRefs);
              if (validRefs.length > 0) {
                setReferenceImages(validRefs);
                console.log('📌 [REFERÊNCIA] Restaurado do sessionStorage:', validRefs.length);
              }
            }
          } else if (validImages.length >= 1) {
            const refs = validImages.slice(0, Math.min(2, validImages.length));
            setReferenceImages(refs);
            console.log('📌 [REFERÊNCIA] Fallback - usando primeiras imagens:', refs.length);
          }
        }
      } catch (e) {
        console.error('Erro ao restaurar imagens:', e);
      }
    }
  }, []);

  // ✅ NOVO: Persistir imagens de referência no sessionStorage
  useEffect(() => {
    if (referenceImages.length > 0) {
      sessionStorage.setItem('unified_ad_generator_reference_images', JSON.stringify(referenceImages));
      console.log('💾 [REFERÊNCIA] Persistido no sessionStorage:', referenceImages.length);
    }
  }, [referenceImages]);

  // 🧹 Limpar cache de IA quando as imagens de referência mudarem
  useEffect(() => {
    if (referenceImages.length > 0) {
      const aiCache = AIImagesSessionCache.getInstance();
      aiCache.clearAllAICache();
      console.log('🧹 [UNIFIED-AD-GENERATOR] Cache de IA limpo - novas imagens de referência detectadas');
    }
  }, [referenceImages]);

  // 🎉 Listener para automationComplete
  useEffect(() => {
    const handleAutomationComplete = async (event: CustomEvent) => {
      try {
        const eventProductId = event.detail?.productId;
        const success = event.detail?.success;
        const whiteBackgroundImage = event.detail?.whiteBackgroundImage;
        const circleImages = event.detail?.circleImages || event.detail?.ambientImages || [];

        console.log('🎉 [UnifiedAdGenerator] Automação completa recebida!', {
          productId: eventProductId,
          success,
          whiteBackgroundImage: whiteBackgroundImage?.substring(0, 50),
          circleImagesCount: circleImages.length
        });

        if (eventProductId === productId && success) {
          console.log('🚀 [UnifiedAdGenerator] Disparando geração automática de Showcases com URLs Blob...');

          setExpandedShowcase(true);

          window.dispatchEvent(new CustomEvent('startShowcaseGeneration', {
            detail: {
              productId,
              autoGenerate: true,
              mainImageUrl: whiteBackgroundImage,
              circleImages: circleImages
            }
          }));
        }
      } catch (error) {
        console.error('❌ [UnifiedAdGenerator] Erro ao processar automationComplete:', error);
        toast.error('Erro ao processar automação, mas os dados foram salvos');
      }
    };

    window.addEventListener('automationComplete', handleAutomationComplete as EventListener);

    return () => {
      window.removeEventListener('automationComplete', handleAutomationComplete as EventListener);
    };
  }, [productId]);

  // 🔄 Handler para Novo Produto
  const handleNewProduct = useCallback(() => {
    sessionStorage.removeItem('unified_ad_generator_product_id');
    sessionStorage.removeItem('unified_ad_generator_product_images');
    sessionStorage.removeItem('unified_ad_generator_reference_images');
    sessionStorage.removeItem('unified_ad_generator_last_product_name');

    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith('ai_images_') || key.startsWith('unified_ad_generator_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));

    console.log('🧹 [UNIFIED-AD-GENERATOR] Cache limpo para novo produto');
    toast.success('Cache limpo! Recarregando para novo produto...');

    window.location.reload();
  }, []);

  // 🔔 Detectar mudança significativa de produto
  useEffect(() => {
    const savedName = sessionStorage.getItem('unified_ad_generator_last_product_name');

    if (savedName && formData.nome && savedName !== formData.nome) {
      const similarity = savedName.toLowerCase().split(' ').filter(
        word => formData.nome.toLowerCase().includes(word)
      ).length / savedName.split(' ').length;

      if (similarity < 0.3) {
        toast.warning('Produto diferente detectado!', {
          description: 'Clique em "Novo Produto" para limpar o cache anterior',
          duration: 6000
        });
      }
    }

    if (formData.nome) {
      sessionStorage.setItem('unified_ad_generator_last_product_name', formData.nome);
    }
  }, [formData.nome]);

  // ===== N8N: Fetch user for webhooks =====
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

  // ===== N8N: Salvar webhook URLs no localStorage =====
  useEffect(() => {
    if (webhookComandoUnificado) localStorage.setItem('n8n_unified_webhook_url', webhookComandoUnificado);
  }, [webhookComandoUnificado]);

  useEffect(() => {
    if (webhookCopywriting) localStorage.setItem('copywriting_n8n_webhook_url', webhookCopywriting);
  }, [webhookCopywriting]);

  useEffect(() => {
    if (webhookTratamentoCombinado) localStorage.setItem('gerador_webhook_tratamento_combinado', webhookTratamentoCombinado);
  }, [webhookTratamentoCombinado]);

  // Removido: updateSceneStatus - não mais necessário pois imagens vão direto para Galeria Principal

  // ===== N8N: Processar UM sceneType individual =====
  const processarUmSceneType = async (
    basePayload: any,
    sceneType: SceneType
  ): Promise<{ sceneType: SceneType; success: boolean; imageUrl?: string; mimeType?: string; error?: string; responseData?: any }> => {
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
        return { sceneType, success: true, imageUrl, mimeType, responseData: data };
      } else {
        return { sceneType, success: false, error: 'Resposta sem imagem', responseData: data };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error(`❌ [Paralelo] Erro em ${sceneType}:`, errorMessage);
      return { sceneType, success: false, error: errorMessage };
    }
  };

  // ===== N8N: Processar UM sceneType COM RETRY AUTOMÁTICO =====
  // Simplificado: sem callback de status pois não temos mais ParallelGenerationMonitor
  const processarUmSceneTypeComRetry = async (
    basePayload: any,
    sceneType: SceneType
  ): Promise<{ sceneType: SceneType; success: boolean; imageUrl?: string; mimeType?: string; error?: string; attempts: number; duration?: number }> => {
    const sceneLabel = SCENE_TYPES.find(s => s.id === sceneType)?.label || sceneType;
    const startTime = Date.now();
    let lastError = '';

    for (let attempt = 1; attempt <= MAX_SCENE_RETRY_ATTEMPTS; attempt++) {
      console.log(`🔄 [Retry] ${sceneType} - Tentativa ${attempt}/${MAX_SCENE_RETRY_ATTEMPTS}`);

      const result = await processarUmSceneType(basePayload, sceneType);

      if (result.success && result.imageUrl) {
        const duration = Date.now() - startTime;
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

      if (attempt < MAX_SCENE_RETRY_ATTEMPTS) {
        const delay = SCENE_RETRY_DELAYS[attempt - 1] || 4000;
        console.log(`⏳ [Retry] ${sceneType} - Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return { sceneType, success: false, error: lastError, attempts: MAX_SCENE_RETRY_ATTEMPTS, duration: Date.now() - startTime };
  };

  // ===== N8N: Testar 8 cenas paralelas e enviar direto para Galeria Principal =====
  const testParallelWebhook = async () => {
    if (!webhookTratamentoCombinado) {
      toast.error("Configure a URL do webhook Tratamento Combinado");
      return;
    }
    if (productImages.length === 0) {
      toast.error("Adicione pelo menos uma imagem de referência");
      return;
    }
    if (!formData.nome) {
      toast.error("Preencha o nome do produto");
      return;
    }

    setIsTestingParallel(true);
    const allSceneTypes = SCENE_TYPES.map(s => s.id);
    setParallelTestProgress({ current: 0, total: allSceneTypes.length, completed: 0, failed: 0 });

    console.log(`🧪 [Teste Paralelo] Iniciando ${allSceneTypes.length} requisições com retry automático...`);
    toast.info(`🧪 Testando ${allSceneTypes.length} requisições com retry automático...`);

    // Preparar imagens com base64 das URLs
    let imagesToSend: Array<{ index: number; filename: string; mimeType: string; base64: string }> = [];

    // Converter URLs de productImages para base64
    for (let i = 0; i < Math.min(productImages.length, 3); i++) {
      try {
        const response = await fetch(productImages[i]);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1] || '');
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        imagesToSend.push({
          index: i + 1,
          filename: `image_${i + 1}.png`,
          mimeType: blob.type || 'image/png',
          base64
        });
      } catch (err) {
        console.error(`Erro ao converter imagem ${i}:`, err);
      }
    }

    if (imagesToSend.length === 0) {
      toast.error("Não foi possível processar as imagens");
      setIsTestingParallel(false);
      return;
    }

    if (enableCompression) {
      const needsComp = imagesToSend.some(img => needsCompression(img.base64, 500));
      if (needsComp) {
        console.log('🗜️ [Compressão] Comprimindo imagens antes do envio...');
        toast.info('Comprimindo imagens...');
        const compressed = await compressMultipleImages(
          imagesToSend.map(img => ({ base64: img.base64, filename: img.filename })),
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

    // Gerar jobId único e registrar na tabela de autorização
    const jobId = `parallel_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    console.log('🔐 [Teste Paralelo] Registrando job autorizado:', jobId);

    // CRÍTICO: Obter userId de forma confiável (não depender do state)
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const effectiveUserId = currentUser?.id || userId;

    if (!effectiveUserId) {
      console.error('❌ [Teste Paralelo] Usuário não autenticado!');
      toast.error('Sessão expirada. Faça login novamente.');
      setIsTestingParallel(false);
      return;
    }

    console.log('👤 [Teste Paralelo] UserId efetivo:', effectiveUserId.substring(0, 8) + '...');

    // CRÍTICO: Registrar job com expiração estendida (60 minutos)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 60 min

    const { error: authError } = await supabase
      .from('authorized_jobs')
      .insert({
        job_id: jobId,
        user_id: effectiveUserId,
        expected_images: allSceneTypes.length,
        status: 'active',
        expires_at: expiresAt, // Expiração explícita de 60 min
        metadata: {
          product_name: formData.nome,
          scene_types: allSceneTypes,
          source: 'parallel-test-webhook',
          started_at: new Date().toISOString()
        }
      });

    if (authError) {
      console.error('❌ [Teste Paralelo] Erro ao registrar job:', authError);
      toast.error('Erro ao registrar job autorizado. Tente novamente.');
      setIsTestingParallel(false);
      return;
    }

    console.log('✅ [Teste Paralelo] Job registrado:', { jobId, effectiveUserId: effectiveUserId.substring(0, 8), expiresAt });

    const basePayload = {
      request_id: `parallel_test_${Date.now()}`,
      job_id: jobId, // CRÍTICO: enviar jobId para o n8n (snake_case para compatibilidade)
      jobId: jobId,  // CRÍTICO: também camelCase para garantir
      product_name: formData.nome,
      productName: formData.nome,
      user_id: effectiveUserId, // Usar effectiveUserId (confiável)
      userId: effectiveUserId,
      timestamp: new Date().toISOString(),
      images: imagesToSend,
      seo: {
        descricao: formData.descricao_curta || '',
        especificacoes: ''
      },
      marketing: {
        texto_marketing: ''
      }
    };

    try {
      const promises = allSceneTypes.map(sceneType =>
        processarUmSceneTypeComRetry(basePayload, sceneType)
      );

      const results = await Promise.allSettled(promises);

      let successCount = 0;
      let failedCount = 0;

      // Processar resultados e enviar para Galeria Principal
      for (let index = 0; index < results.length; index++) {
        const result = results[index];
        const sceneType = allSceneTypes[index];
        const sceneLabel = SCENE_TYPES.find(s => s.id === sceneType)?.label || sceneType;

        if (result.status === 'fulfilled' && result.value.success && result.value.imageUrl) {
          successCount++;

          // ✅ Hospedar e enviar direto para Galeria Principal
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && productId) {
              const { uploadBlobToStorage } = await import('@/utils/uploadBlobToStorage');
              const httpsUrl = await uploadBlobToStorage(result.value.imageUrl, user.id, `n8n-scene-${sceneType}`);

              let roleHint = 'other';
              if (sceneType === 'product_studio') roleHint = 'white';
              else if (sceneType.includes('ambient') || sceneType === 'lifestyle') roleHint = 'ambient';

              window.dispatchEvent(new CustomEvent('hostedImageSaved', {
                detail: {
                  url: httpsUrl,
                  hostedUrl: httpsUrl,
                  productId,
                  source: `n8n-8scenes-${sceneType}-${roleHint}`,
                  tags: [`scene:${sceneType}`, 'n8n-8scenes', 'auto-generated', `role:${roleHint}`]
                }
              }));

              console.log(`✅ [Teste Paralelo] ${sceneLabel} → Galeria Principal`);
            }
          } catch (uploadErr) {
            console.warn(`⚠️ Falha ao hospedar ${sceneType}:`, uploadErr);
          }

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
      }

      if (successCount === allSceneTypes.length) {
        toast.success(`🎉 Teste Paralelo: ${successCount}/${allSceneTypes.length} imagens enviadas para Galeria Principal!`);
      } else if (successCount > 0) {
        toast.warning(`🧪 Teste Paralelo: ${successCount} sucesso, ${failedCount} falhas após retries`);
      } else {
        toast.error(`❌ Teste Paralelo: Todas as ${failedCount} requisições falharam após retries`);
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('[Teste Paralelo] Erro geral:', errorMsg);
      toast.error(`Erro no teste paralelo: ${errorMsg}`);
    } finally {
      setIsTestingParallel(false);
    }
  };

  // Removido: retryFailedScene e retryAllFailedScenes
  // Não mais necessário pois não temos mais ParallelGenerationMonitor

  // ===== N8N: Executar Etapa 1 - Comando Unificado =====
  // Retorna Promise<boolean> para indicar sucesso/falha ao Magic Flow
  const executeStep1 = async (): Promise<boolean> => {
    // ✅ Verificar se já está rodando via ref (evita condição de corrida)
    if (step1RunningRef.current) {
      console.log('[executeStep1] Já está executando, ignorando clique duplicado');
      return false;
    }

    if (!webhookComandoUnificado) {
      toast.error("Configure a URL do webhook Comando Unificado");
      return false;
    }
    if (!formData.nome) {
      toast.error("Preencha o nome do produto");
      return false;
    }

    // ✅ Marcar como rodando ANTES de qualquer operação async
    step1RunningRef.current = true;
    console.log('[executeStep1] 🚀 Iniciando execução independente', {
      step1Ref: step1RunningRef.current,
      step2Ref: step2RunningRef.current,
      webhook: webhookComandoUnificado.substring(0, 50) + '...'
    });

    const startTime = Date.now();
    setStep1(prev => ({ ...prev, status: "running", startedAt: new Date().toISOString(), error: null }));

    try {
      const payload = {
        product_name: formData.nome,
        short_description: formData.descricao_curta || formData.nome,
        long_description: formData.descricao || formData.descricao_curta || formData.nome,
        original_text: formData.descricao_curta || formData.nome,
        request_id: `unified_${Date.now()}`,
        user_id: userId,
        seo: {
          especificacoes: formData.descricao_curta || '',
          descricao: formData.descricao_curta || ''
        },
        marketing: {
          texto_marketing: formData.descricao_curta || ''
        }
      };

      console.log('[executeStep1] Chamando n8n-proxy com webhook:', webhookComandoUnificado);

      const { data: proxyResponse, error: proxyError } = await supabase.functions.invoke('n8n-proxy', {
        body: {
          webhookUrl: webhookComandoUnificado,
          payload: payload
        }
      });

      if (proxyError) {
        console.error('[executeStep1] Erro do proxy:', proxyError);
        throw new Error(proxyError.message || 'Erro ao chamar proxy n8n');
      }

      console.log('[executeStep1] Resposta do proxy:', proxyResponse);
      const data = proxyResponse;
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

      // ✅ NOVO: Salvar resultado localmente (não afeta "Automação Completa")
      setN8nUnifiedResult(result);

      // Propagar para o hook de automação APENAS se a automação estiver rodando
      if (isAutomationRunningRef.current) {
        handleUnifiedCommandsComplete(result);
      }

      console.log('[executeStep1] ✅ Concluído com sucesso em', Date.now() - startTime, 'ms');
      toast.success("Etapa 1: Comando Unificado concluído!");
      return true; // ✅ Sucesso
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro';
      console.error('[executeStep1] ❌ Erro:', errorMsg);
      setStep1(prev => ({ ...prev, status: "error", error: errorMsg, completedAt: new Date().toISOString() }));
      toast.error(`Etapa 1 falhou: ${errorMsg}`);
      return false; // ✅ Falha
    } finally {
      // ✅ SEMPRE limpar a ref, independente de sucesso ou erro
      step1RunningRef.current = false;
      console.log('[executeStep1] 🏁 Execução finalizada, ref limpa');
    }
  };

  // ===== N8N: Executar Etapa 2 - Copywriting =====
  // Retorna Promise<boolean> para indicar sucesso/falha ao Magic Flow
  const executeStep2 = async (): Promise<boolean> => {
    // ✅ Verificar se já está rodando via ref (evita condição de corrida)
    if (step2RunningRef.current) {
      console.log('[executeStep2] Já está executando, ignorando clique duplicado');
      return false;
    }

    if (!webhookCopywriting) {
      toast.error("Configure a URL do webhook Copywriting");
      return false;
    }
    if (!formData.nome) {
      toast.error("Preencha o nome do produto");
      return false;
    }

    // ✅ Marcar como rodando ANTES de qualquer operação async
    step2RunningRef.current = true;
    console.log('[executeStep2] 🚀 Iniciando execução independente', {
      step1Ref: step1RunningRef.current,
      step2Ref: step2RunningRef.current,
      webhook: webhookCopywriting.substring(0, 50) + '...'
    });

    const startTime = Date.now();
    setStep2(prev => ({ ...prev, status: "running", startedAt: new Date().toISOString(), error: null }));

    try {
      const payload = {
        product_name: formData.nome,
        short_description: formData.descricao_curta || formData.nome,
        long_description: formData.descricao || formData.descricao_curta || formData.nome,
        user_id: userId,
        user_email: userEmail,
        request_id: `copywriting_${Date.now()}`,
        seo: {
          especificacoes: formData.descricao_curta || '',
          descricao: formData.descricao_curta || ''
        },
        marketing: {
          texto_marketing: formData.descricao_curta || ''
        }
      };

      console.log('[executeStep2] Chamando n8n-proxy com webhook:', webhookCopywriting);

      const { data: proxyResponse, error: proxyError } = await supabase.functions.invoke('n8n-proxy', {
        body: {
          webhookUrl: webhookCopywriting,
          payload: payload
        }
      });

      if (proxyError) {
        console.error('[executeStep2] Erro do proxy:', proxyError);
        throw new Error(proxyError.message || 'Erro ao chamar proxy n8n');
      }

      console.log('[executeStep2] Resposta do proxy:', proxyResponse);
      const data = proxyResponse;

      setStep2({
        status: "success",
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        error: null,
        result: data,
        responseTime: Date.now() - startTime
      });

      // Propagar resultados para o bloco de Copywriting
      if (data?.copywriting || data?.content) {
        let copyContent = '';

        try {
          // Caso 1: copywriting é string JSON - precisa parsear
          if (typeof data.copywriting === 'string') {
            const parsed = JSON.parse(data.copywriting);
            // Extrair o texto do formato Gemini {content: {parts: [{text: "..."}]}}
            if (parsed?.content?.parts?.[0]?.text) {
              copyContent = parsed.content.parts[0].text;
            } else if (parsed?.improvedText) {
              copyContent = parsed.improvedText;
            } else if (typeof parsed === 'string') {
              copyContent = parsed;
            } else {
              copyContent = JSON.stringify(parsed);
            }
          }
          // Caso 2: copywriting é objeto
          else if (data.copywriting?.improvedText) {
            copyContent = data.copywriting.improvedText;
          }
          // Caso 3: content direto
          else if (data.content) {
            copyContent = typeof data.content === 'string'
              ? data.content
              : data.content?.parts?.[0]?.text || JSON.stringify(data.content);
          }
          // Fallback
          else {
            copyContent = JSON.stringify(data);
          }
        } catch (parseError) {
          console.warn('[executeStep2] Erro ao parsear copywriting:', parseError);
          copyContent = typeof data.copywriting === 'string'
            ? data.copywriting
            : JSON.stringify(data);
        }

        console.log('[executeStep2] Copywriting extraído:', copyContent.substring(0, 200) + '...');

        // ✅ NOVO: Salvar resultado localmente (não afeta "Automação Completa")
        setN8nCopywritingResult({ content: copyContent, timestamp: Date.now() });

        // Propagar para o hook de automação APENAS se a automação estiver rodando
        if (isAutomationRunningRef.current) {
          handleCopywritingComplete(copyContent);
        }
      }

      console.log('[executeStep2] ✅ Concluído com sucesso em', Date.now() - startTime, 'ms');
      toast.success("Etapa 2: Copywriting concluído!");
      return true; // ✅ Sucesso
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro';
      console.error('[executeStep2] ❌ Erro:', errorMsg);
      setStep2(prev => ({ ...prev, status: "error", error: errorMsg, completedAt: new Date().toISOString() }));
      toast.error(`Etapa 2 falhou: ${errorMsg}`);
      return false; // ✅ Falha
    } finally {
      // ✅ SEMPRE limpar a ref, independente de sucesso ou erro
      step2RunningRef.current = false;
      console.log('[executeStep2] 🏁 Execução finalizada, ref limpa');
    }
  };

  // ===== BOTÃO MÁGICO: Executar Agentes de Conversão (ATLAS → LYRA → ORION) =====
  const handleMagicFlow = async () => {
    // Verificar webhooks configurados
    if (!webhookComandoUnificado) {
      toast.error("Configure a URL do webhook Comando Unificado (ATLAS)");
      return;
    }
    if (!webhookCopywriting) {
      toast.error("Configure a URL do webhook Copywriting (LYRA)");
      return;
    }
    if (!webhookTratamentoCombinado) {
      toast.error("Configure a URL do webhook Tratamento (ORION)");
      return;
    }

    // Verificar campos obrigatórios
    if (!isFormValid) {
      toast.error("Preencha todos os campos obrigatórios antes de acionar os agentes");
      return;
    }

    console.log('🚀 [MagicFlow] Iniciando sequência de agentes de conversão...');
    setIsMagicFlowExecuting(true);

    try {
      // ===== ETAPA 1: ATLAS (Comando Unificado) =====
      setMagicFlowCurrentStep("atlas");
      console.log('[MagicFlow] Etapa 1: ATLAS (Comando Unificado)');

      const atlasSuccess = await executeStep1();
      if (!atlasSuccess) {
        toast.error("❌ ATLAS falhou. Fluxo interrompido.");
        console.log('[MagicFlow] ❌ ATLAS falhou, interrompendo fluxo');
        return;
      }

      setMagicFlowCurrentStep("atlas_complete");
      // Aguardar 2 segundos antes da próxima etapa
      await new Promise(resolve => setTimeout(resolve, 2000));

      // ===== ETAPA 2: LYRA (Copywriting) =====
      setMagicFlowCurrentStep("lyra");
      console.log('[MagicFlow] Etapa 2: LYRA (Copywriting)');

      const lyraSuccess = await executeStep2();
      if (!lyraSuccess) {
        toast.error("❌ LYRA falhou. Fluxo interrompido.");
        console.log('[MagicFlow] ❌ LYRA falhou, interrompendo fluxo');
        return;
      }

      setMagicFlowCurrentStep("lyra_complete");
      // Aguardar 2 segundos antes da próxima etapa
      await new Promise(resolve => setTimeout(resolve, 2000));

      // ===== ETAPA 3: ORION (Tratamento 8 Cenas) =====
      setMagicFlowCurrentStep("orion");
      console.log('[MagicFlow] Etapa 3: ORION (8 Cenas)');

      // Chamar o webhook de tratamento paralelo
      await testParallelWebhook();

      setMagicFlowCurrentStep("orion_complete");

      toast.success("🎉 Agentes de Conversão concluídos!");
      console.log('[MagicFlow] ✅ Fluxo completo executado com sucesso!');

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[MagicFlow] ❌ Erro no fluxo:', errorMsg);
      toast.error(`Erro nos agentes: ${errorMsg}`);
    } finally {
      setIsMagicFlowExecuting(false);
      setMagicFlowCurrentStep(undefined);
    }
  };



  return (
    <SafeErrorBoundary>
      <ProductDetailsLayout>
        {/* Header - Magic Studio */}
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 p-[1px]">
          <div className="relative rounded-2xl bg-background/95 backdrop-blur-xl p-6">
            <div className="flex items-center justify-between">
              {/* Logo e Título */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-pink-500 rounded-xl blur-lg opacity-50 animate-pulse" />
                  <div className="relative p-3 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 shadow-xl">
                    <Wand2 className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                    Magic Studio Completo
                  </h1>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-blue-500">🧠 ATLAS</span>
                      <span className="text-[10px] text-muted-foreground">Estrategista</span>
                    </div>
                    <span className="text-muted-foreground/40">•</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-violet-500">✍️ LYRA</span>
                      <span className="text-[10px] text-muted-foreground">Persuasora</span>
                    </div>
                    <span className="text-muted-foreground/40">•</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-orange-500">📸 ORION</span>
                      <span className="text-[10px] text-muted-foreground">Artista Visual</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-2">
                {/* Novo Produto */}
                <Button
                  onClick={handleNewProduct}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-violet-600 hover:bg-violet-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Novo
                </Button>

                {/* Download Kit */}
                <EbookDownloadButton
                  product={{
                    nome: formData.nome || 'Produto',
                    descricao: formData.descricao || formData.descricao_curta || null,
                    sku: formData.sku || `gerador_${productId}`
                  }}
                  unifiedData={n8nUnifiedResult || unifiedData || null}
                  copywritingText={n8nCopywritingResult?.content || copywritingData || undefined}
                  images={[
                    ...productImages.map(url => ({ url, type: 'produto' })),
                    ...hostedAIImages.map(url => ({ url, type: 'ai-gerada' }))
                  ]}
                  forceEnabled={productImages.length > 0 || hostedAIImages.length > 0 || !!n8nUnifiedResult || !!n8nCopywritingResult || !!unifiedData || !!copywritingData}
                  variant="outline"
                  size="sm"
                  showOptions={false}
                />

                {/* Créditos */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-violet-200">
                  <Zap className="h-4 w-4 text-violet-500" />
                  <span className="text-sm font-semibold text-violet-700">
                    {usage?.enhancements_available || 0}
                  </span>
                  <span className="text-xs text-muted-foreground">créditos</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Indicador de Validação */}
        <ValidationIndicator
          isValid={isFormValid}
          missingFields={missingFields}
          imageCount={productImages.length}
        />

        {/* ===== PACOTES DE GERAÇÃO VISUAL ===== */}
        <Card className="glass-effect shadow-lg border-0 bg-gradient-to-br from-white/90 to-violet-50/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <VisualPackageCards
              onGeneratePackage={async (packageId: PackageType, config: VisualPackage) => {
                // Validar se tem dados do produto
                if (!formData.nome?.trim()) {
                  toast.error('Preencha o nome do produto antes de gerar imagens');
                  throw new Error('Nome do produto obrigatório');
                }

                if (productImages.length === 0) {
                  toast.error('Adicione pelo menos uma imagem do produto');
                  throw new Error('Imagem do produto obrigatória');
                }

                console.log(`[VisualPackage] Gerando pacote: ${packageId}`, config);

                // Mapear PackageType para VisualPackageType
                const packageTypeMap: Record<PackageType, VisualPackageType> = {
                  'start': 'visual_start',
                  'pro': 'visual_pro',
                  'expert': 'visual_expert',
                  'brand': 'visual_brand'
                };

                const visualPackageType = packageTypeMap[packageId];

                // Calcular total de imagens
                const totalImages = config.images.fundoBranco + config.images.ambientada +
                  config.images.emUso + config.images.comPessoas + config.images.magicas;

                // ✅ Disparar TODOS os webhooks do pacote em paralelo via proxy seguro
                console.log(`[VisualPackage] Disparando ${totalImages} webhooks via proxy seguro: ${visualPackageType}`);

                const result = await fireVisualPackageAll(
                  visualPackageType,
                  {
                    name: formData.nome,
                    id: productId,
                    sku: formData.sku || `pkg_${Date.now()}`,
                    description: formData.descricao || formData.descricao_curta || '',
                    images: productImages,
                  },
                  (completed, total, webhookType) => {
                    console.log(`[VisualPackage] Progresso: ${completed}/${total} - ${webhookType}`);
                  }
                );

                // Mostrar resultado final
                if (result.failed > 0) {
                  // Pegar o primeiro erro para mostrar detalhes
                  const firstError = result.errors && result.errors.length > 0 ? result.errors[0] : 'Erro desconhecido';
                  const errorMsg = `⚠️ ${result.success}/${result.success + result.failed} sucesso. Erro: ${firstError}`;
                  toast.warning(errorMsg, { duration: 6000 });

                  // Se nenhum funcionou, lançar erro para o card mostrar falha
                  if (result.success === 0) {
                    // Se for timeout, dar dica específica
                    if (firstError.includes('Timeout') || firstError.includes('504')) {
                      throw new Error(`Timeout: O n8n demorou mais que o permitido.\nErro: ${firstError}`);
                    }
                    throw new Error(`Falha nos webhooks: ${firstError}`);
                  }
                } else {
                  toast.success(`✅ ${result.success} webhooks executados com sucesso!`);
                }

                console.log(`[VisualPackage] Pacote ${packageId} completo: ${result.success} sucesso, ${result.failed} falhas`);
              }}
              disabled={!isFormValid || productImages.length === 0 || webhookProxyLoading}
            />
          </CardContent>
        </Card>

        {/* ✅ Toggle Kill Switch para Automação n8n - OCULTO (automação sempre ativa) */}
        {/*
        <div className={`flex items-center justify-between p-4 rounded-lg border ${isPaused ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} transition-colors`}>
          <div className="flex items-center gap-3">
            {isPaused ? (
              <Pause className="h-5 w-5 text-red-600" />
            ) : (
              <PlayCircle className="h-5 w-5 text-green-600" />
            )}
            <div>
              <p className={`font-medium ${isPaused ? 'text-red-900' : 'text-green-900'}`}>
                {isPaused ? '⏸️ Automação n8n Pausada' : '▶️ Automação n8n Ativa'}
              </p>
              <p className={`text-sm ${isPaused ? 'text-red-700' : 'text-green-700'}`}>
                {isPaused
                  ? 'Callbacks do n8n estão sendo bloqueados'
                  : 'Callbacks do n8n são processados normalmente'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {isPaused ? 'Pausado' : 'Ativo'}
            </span>
            <Switch
              checked={!isPaused}
              onCheckedChange={togglePaused}
              disabled={automationSettingsLoading || automationSettingsUpdating}
              className={isPaused ? 'data-[state=unchecked]:bg-red-400' : ''}
            />
          </div>
        </div>
        */}

        {/* ✅ Indicador Visual de Upscale em Progresso */}
        {upscaleProgress.isProcessing && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg animate-pulse">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <div className="flex-1">
              <p className="font-medium text-blue-900">
                📈 Aplicando upscale 2x...
              </p>
              <p className="text-sm text-blue-700">
                Processando imagem {upscaleProgress.currentImage} de {upscaleProgress.totalImages}
                {upscaleProgress.sceneType && ` (${upscaleProgress.sceneType})`}
              </p>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              runware:503@1
            </Badge>
          </div>
        )}

        {/* Galeria de Imagens do Produto */}
        <SafeErrorBoundary>
          <ProductImagesGrid
            images={productImages}
            productName={formData.nome || 'Novo Produto'}
            productId={productId}
            onImagesUploaded={handleImagesUploaded}
            longTailTitles={longTailTitles}
            isAutomationComplete={isAutomationComplete}
            referenceImageUrls={referenceImages}
          />
        </SafeErrorBoundary>

        {/* Bloco Informações do Produto */}
        <SafeErrorBoundary>
          <Card className="glass-effect shadow-lg border-0 bg-gradient-to-br from-white/90 to-blue-50/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-100/50 to-purple-100/50 border-b border-blue-200/30">
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Informações do Produto
                </span>
              </CardTitle>
            </CardHeader>
            <ProductFormContent
              product={product}
              isEditing={isEditing}
              formData={formData}
              onFormDataChange={handleFormDataChange}
              onUpdateDescription={handleUpdateDescription}
              isAutomationRunning={isAutomationRunning}
              automationStep={automationStep}
              copywritingData={n8nCopywritingResult || copywritingData}
              unifiedCommandsData={n8nUnifiedResult || unifiedCommandsData}
              onExecuteWebhookComando={executeStep1}
              onExecuteWebhookCopywriting={executeStep2}
              isLoadingComando={step1.status === "running"}
              isLoadingCopywriting={step2.status === "running"}
              webhookComandoConfigured={!!webhookComandoUnificado}
              webhookCopywritingConfigured={!!webhookCopywriting}
            />
          </Card>
        </SafeErrorBoundary>

        {/* ===== TOGGLE DE CONFIGURAÇÕES AVANÇADAS ===== */}
        <div className="flex justify-end mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
            className="text-muted-foreground hover:text-primary gap-2 text-xs"
          >
            {showConfig ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Ocultar Configurações
              </>
            ) : (
              <>
                <Settings className="h-4 w-4" />
                Configurações Avançadas
              </>
            )}
          </Button>
        </div>

        {/* ===== BLOCOS DE CONFIGURAÇÃO (Container Colapsável) ===== */}
        {showConfig && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* ===== BLOCO N8N: Configuração de Webhooks e Testes ===== */}
            <SafeErrorBoundary>
              <Card className="glass-effect shadow-lg border-0 bg-gradient-to-br from-white/90 to-cyan-50/80 backdrop-blur-sm">
                <Collapsible open={showN8NConfig} onOpenChange={setShowN8NConfig}>
                  <CardHeader className="bg-gradient-to-r from-cyan-100/50 to-blue-100/50 border-b border-cyan-200/30">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg">
                            <Settings className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                              Configuração de Webhooks N8N
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              Configure URLs para testes manuais via n8n
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {webhookTratamentoCombinado && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              Conectado
                            </Badge>
                          )}
                          <ChevronDown className={`h-4 w-4 transition-transform ${showN8NConfig ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                  </CardHeader>

                  <CollapsibleContent>
                    <CardContent className="pt-6 space-y-6">
                      {/* ✅ COMPONENTE COMPLETO DE WEBHOOKS (FILAS REDIS + OUTROS) */}
                      <div className="mb-6">
                        <N8NWebhooksUI
                          webhooks={webhooks}
                          onSave={saveWebhook}
                          variant="full"
                          isLoading={isLoading}
                        />
                      </div>

                      {/* Testar Etapas Individualmente */}
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          Testar Etapas Individualmente
                        </h4>

                        <div className="grid grid-cols-3 gap-3">
                          {/* Etapa 1: Comando */}
                          <div className={`p-3 rounded-lg border-2 space-y-2 ${step1.status === 'success' ? 'border-green-500 bg-green-50' :
                            step1.status === 'error' ? 'border-red-500 bg-red-50' :
                              step1.status === 'running' ? 'border-blue-500 bg-blue-50' :
                                'border-muted'
                            }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                                <span className="font-medium text-xs">1. Comando</span>
                              </div>
                              <StatusIcon status={step1.status} />
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full h-8 text-xs"
                              onClick={executeStep1}
                              disabled={step1.status === "running" || !webhookComandoUnificado || !formData.nome}
                            >
                              {step1.status === "running" ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <Play className="h-3 w-3 mr-1" />
                              )}
                              Executar
                            </Button>
                            {step1.responseTime && (
                              <p className="text-[10px] text-muted-foreground text-center">{(step1.responseTime / 1000).toFixed(1)}s</p>
                            )}
                          </div>

                          {/* Etapa 2: Copywriting */}
                          <div className={`p-3 rounded-lg border-2 space-y-2 ${step2.status === 'success' ? 'border-green-500 bg-green-50' :
                            step2.status === 'error' ? 'border-red-500 bg-red-50' :
                              step2.status === 'running' ? 'border-blue-500 bg-blue-50' :
                                'border-muted'
                            }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5 text-blue-600" />
                                <span className="font-medium text-xs">2. Copywriting</span>
                              </div>
                              <StatusIcon status={step2.status} />
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full h-8 text-xs"
                              onClick={executeStep2}
                              disabled={step2.status === "running" || !webhookCopywriting || !formData.nome}
                            >
                              {step2.status === "running" ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <Play className="h-3 w-3 mr-1" />
                              )}
                              Executar
                            </Button>
                            {step2.responseTime && (
                              <p className="text-[10px] text-muted-foreground text-center">{(step2.responseTime / 1000).toFixed(1)}s</p>
                            )}
                          </div>

                          {/* Etapa 3: Gerar 8 Cenas */}
                          <div className={`p-3 rounded-lg border-2 space-y-2 ${isTestingParallel ? 'border-blue-500 bg-blue-50' :
                            parallelTestProgress.completed === 8 ? 'border-green-500 bg-green-50' :
                              parallelTestProgress.failed > 0 && !isTestingParallel ? 'border-orange-500 bg-orange-50' :
                                'border-muted'
                            }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Zap className="h-3.5 w-3.5 text-green-600" />
                                <span className="font-medium text-xs">3. Gerar 8 Cenas</span>
                              </div>
                              {isTestingParallel ? (
                                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                              ) : parallelTestProgress.completed === 8 ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : parallelTestProgress.failed > 0 ? (
                                <AlertCircle className="h-4 w-4 text-orange-500" />
                              ) : (
                                <Clock className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full h-8 text-xs"
                              onClick={testParallelWebhook}
                              disabled={isTestingParallel || !webhookTratamentoCombinado || productImages.length === 0 || !formData.nome}
                            >
                              {isTestingParallel ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <Send className="h-3 w-3 mr-1" />
                              )}
                              Enviar
                            </Button>
                            {isTestingParallel && (
                              <p className="text-[10px] text-muted-foreground text-center">
                                {parallelTestProgress.completed + parallelTestProgress.failed}/{parallelTestProgress.total}
                              </p>
                            )}
                            {!isTestingParallel && parallelTestProgress.completed > 0 && (
                              <p className="text-[10px] text-muted-foreground text-center">
                                ✓ {parallelTestProgress.completed} | ✗ {parallelTestProgress.failed}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Toggle compressão */}
                        <div className="flex items-center justify-between p-2 mt-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2">
                            <Shrink className="h-4 w-4 text-blue-600" />
                            <span className="text-sm">Comprimir imagens antes de enviar</span>
                          </div>
                          <Switch
                            checked={enableCompression}
                            onCheckedChange={setEnableCompression}
                          />
                        </div>

                        {/* 📡 Indicador de Conexão Broadcast */}
                        <div className={`flex items-center justify-between p-2 mt-2 rounded-lg ${isBroadcastConnected ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                          }`}>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${isBroadcastConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            <span className="text-xs font-medium">
                              {isBroadcastConnected ? '🔌 Conectado ao Broadcast' : '❌ Desconectado'}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {debugState?.messagesReceived || 0} msgs
                          </span>
                        </div>

                        {/* Indicador de Progresso do Batch */}
                        {activeBatchProgress && (
                          <div className="p-2 mt-2 rounded-lg bg-blue-50 border border-blue-200">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-blue-700">
                                📥 Recebendo: {activeBatchProgress.productName}
                              </span>
                              <span className="text-[10px] text-blue-600">
                                {activeBatchProgress.current}/{activeBatchProgress.total}
                              </span>
                            </div>
                            <Progress value={(activeBatchProgress.current / activeBatchProgress.total) * 100} className="h-1" />
                          </div>
                        )}

                        {/* Indicador de Upscale em Progresso */}
                        {upscaleProgress.isProcessing && (
                          <div className="p-2 mt-2 rounded-lg bg-amber-50 border border-amber-200">
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-3 w-3 animate-spin text-amber-600" />
                              <span className="text-xs text-amber-700">
                                📈 Upscale {upscaleProgress.currentImage}/{upscaleProgress.totalImages}: {upscaleProgress.sceneType}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ✅ Imagens do N8N vão direto para a Galeria Principal (ProductImagesGrid) */}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            </SafeErrorBoundary>

            {/* ✅ BOTÃO MÁGICO "Acionar Agentes de Conversão" - SEMPRE VISÍVEL */}
            <div className="hidden">
              <Card className="glass-effect shadow-lg border-2 border-primary/30 bg-gradient-to-br from-violet-50/90 to-purple-50/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="text-center">
                      <h3 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                        ⚡ Agentes de Conversão
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        ATLAS (Análise) → LYRA (Copy) → ORION (Imagens 8 Cenas)
                      </p>
                    </div>

                    {/* MagicAgentButton */}
                    <div className="w-full max-w-md">
                      <MagicAgentButton
                        onClick={handleMagicFlow}
                        isExecuting={isMagicFlowExecuting}
                        isValid={isFormValid && !!webhookComandoUnificado && !!webhookCopywriting && !!webhookTratamentoCombinado}
                        missingFields={[
                          ...missingFields,
                          ...(!webhookComandoUnificado ? ['Webhook Comando (ATLAS)'] : []),
                          ...(!webhookCopywriting ? ['Webhook Copy (LYRA)'] : []),
                          ...(!webhookTratamentoCombinado ? ['Webhook Tratamento (ORION)'] : [])
                        ]}
                        currentStep={magicFlowCurrentStep}
                      />
                    </div>

                    {/* Botões secundários */}
                    <div className="flex gap-3 flex-wrap justify-center mt-2">
                      <Button
                        onClick={() => setShowPreflightModal(true)}
                        disabled={!isFormValid || isStarting || isMagicFlowExecuting}
                        size="sm"
                        variant="outline"
                        className="border-primary/50 text-primary hover:bg-primary/10"
                      >
                        <Rocket className="h-4 w-4 mr-2" />
                        Automação Gemini (KITs)
                      </Button>

                      <Button
                        onClick={startAIOnlyTest}
                        disabled={!isFormValid || isStarting || isMagicFlowExecuting}
                        size="sm"
                        variant="outline"
                        className="border-amber-500/50 text-amber-700 hover:bg-amber-50"
                      >
                        <Brain className="h-4 w-4 mr-2" />
                        🧪 Testar AI Only
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground text-center max-w-md">
                      <span className="text-primary font-medium">⚡ Acionar Agentes:</span> Executa os 3 agentes N8N em sequência.
                      <span className="text-amber-600 font-medium ml-1">🧪 AI Only:</span> Apenas textos sem imagens.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>



            {/* Modal Pre-Flight Check */}
            <PreflightCheckModal
              isOpen={showPreflightModal}
              onClose={() => setShowPreflightModal(false)}
              onProceed={() => {
                setWasAutomationStarted(true);
                startAutomation();
              }}
              productId={productId}
              images={productImages}
            />

            {/* Indicador de Progresso da Automação - Só aparece se automação foi iniciada */}
            {(wasAutomationStarted || isAutomationRunning || isAutomationComplete) && (
              <AutomationProgressIndicator steps={steps} isRunning={isAutomationRunning} />
            )}

            {/* Seção de Prompts Midjourney/DALL-E */}
            {Object.keys(midjourneyPrompts).length > 0 && (
              <MidjourneyPromptsSection prompts={midjourneyPrompts} />
            )}

            {/* Gerador de Copywriting - OCULTADO por solicitação do usuário */}
            {/* 
        {!isAutomationRunning && !copywritingData && (
          <SafeErrorBoundary>
            <CopywritingGenerator
              productId={productId}
              productName={formData.nome}
              productSku={formData.sku || 'UNIFIED-AD-GEN'}
              images={productImages}
              shortDescription={formData.descricao_curta || ''}
              autoGenerate={automationStep === 'copywriting'}
              onComplete={handleCopywritingComplete}
            />
          </SafeErrorBoundary>
        )}

        {isAutomationRunning && automationStep === 'copywriting' && (
          <SafeErrorBoundary>
            <CopywritingGenerator
              productId={productId}
              productName={formData.nome}
              productSku={formData.sku || 'UNIFIED-AD-GEN'}
              images={productImages}
              shortDescription={formData.descricao_curta || ''}
              autoGenerate={true}
              onComplete={handleCopywritingComplete}
              simplifiedView={true}
            />
          </SafeErrorBoundary>
        )}
        */}

            {/* Gerador de Background - Gemini AI - OCULTADO (usando n8n) */}
            {isAutomationRunning && automationStep === 'gemini' && (
              <div className="hidden">
                <GeminiBackgroundGenerator
                  images={productImages}
                  productName={formData.nome}
                  productId={productId}
                  dimensions={{
                    altura: formData.altura,
                    largura: formData.largura,
                    profundidade: formData.profundidade,
                    peso_bruto: formData.peso_bruto
                  }}
                  autoGenerate={true}
                  simplifiedView={true}
                  onComplete={handleGeminiComplete}
                />
              </div>
            )}

            {/* Templates de Marketing Estilo Canva */}
            <SafeErrorBoundary>
              <Collapsible open={expandedCanvaTemplates} onOpenChange={setExpandedCanvaTemplates}>
                <Card className="glass-effect shadow-lg border-0 bg-gradient-to-br from-white/90 to-green-50/80 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-green-100/50 to-teal-100/50 border-b border-green-200/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 shadow-lg">
                          <Brain className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                            Templates de Marketing Estilo Canva
                          </CardTitle>
                          {!expandedCanvaTemplates && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Gere imagens profissionais automaticamente com seus dados de IA
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                          Auto-Generate
                        </Badge>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {expandedCanvaTemplates ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </div>
                  </CardHeader>

                  <CollapsibleContent forceMount className={!expandedCanvaTemplates ? "hidden" : ""}>
                    <CardContent className="pt-6 space-y-6">
                      <CanvaStyleTemplateGenerator
                        productId={productId}
                        productName={formData.nome || 'Novo Produto'}
                        aiImages={originalHostedUrls.length > 0 ? originalHostedUrls : (hostedAIImages.length > 0 ? hostedAIImages : productImages)}
                        unifiedData={unifiedData}
                        logoUrl={brandSettings?.logo_url || undefined}
                      />
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </SafeErrorBoundary>

            {/* Gerador de Showcases de Produto */}
            <SafeErrorBoundary>
              <div className="hidden">
                <Collapsible open={expandedShowcase} onOpenChange={setExpandedShowcase}>
                  <Card className="glass-effect shadow-lg border-0 bg-gradient-to-br from-white/90 to-orange-50/80 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-orange-100/50 to-yellow-100/50 border-b border-orange-200/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-500 shadow-lg">
                            <Grid3x3 className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
                              Showcases de Produto
                            </CardTitle>
                            {!expandedShowcase && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Composições visuais profissionais com imagens em círculos
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                            Auto-Generate
                          </Badge>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                              {expandedShowcase ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                      </div>
                    </CardHeader>

                    <CollapsibleContent forceMount className={!expandedShowcase ? "hidden" : ""}>
                      <CardContent className="pt-6">
                        <ProductShowcaseGenerator
                          productId={productId}
                          productName={formData.nome || 'Novo Produto'}
                          productImages={productImages}
                          onImagesGenerated={() => { }}
                        />
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </div>
            </SafeErrorBoundary>

            {/* Sistema de Automação IA */}
            <SafeErrorBoundary>
              <div className="hidden">
                <AIImageAutoProcessor
                  productId={productId}
                  productName={formData.nome || 'Novo Produto'}
                  isExpanded={expandedAutoProcessor}
                  onToggleExpanded={() => setExpandedAutoProcessor(prev => !prev)}
                />
              </div>
            </SafeErrorBoundary>

            {/* Gerador Automático de KITs */}
            {isAutomationRunning && automationStep === 'kits' && (
              <div className="hidden">
                <CloudinaryProductTransform
                  productId={productId}
                  productSku={formData.sku || 'UNIFIED-AD-GEN'}
                  productName={formData.nome || 'Novo Produto'}
                  images={productImages}
                  autoGenerate={true}
                  onComplete={() => { }}
                />
              </div>
            )}

            {/* Planilha de 20 Anúncios Premium */}
            <SafeErrorBoundary>
              <div className="flex justify-center my-4">
                <PremiumAdsExportButton product={product} />
              </div>
            </SafeErrorBoundary>

            {/* Tabela de Preços */}
            {selectedPricing !== 'none' && formData.preco_custo > 0 && (
              <SafeErrorBoundary>
                <ProductTable
                  products={[{
                    ...product,
                    preco_custo: formData.preco_custo,
                    peso_liquido: formData.peso_liquido
                  }]}
                  onEditProduct={() => { }}
                  onViewProduct={() => { }}
                  updateSingleProduct={() => { }}
                  profitMargin={profitMargin}
                  taxRate={taxRate}
                  selectedPricing={selectedPricing}
                  storeCommission={storeCommission}
                />
              </SafeErrorBoundary>
            )}

            {/* Configurações de Precificação */}
            <SafeErrorBoundary>
              <PricingControls
                profitMargin={profitMargin}
                taxRate={taxRate}
                onProfitMarginChange={setProfitMargin}
                onTaxRateChange={setTaxRate}
                selectedPricing={selectedPricing}
                onPricingChange={setSelectedPricing}
                storeCommission={storeCommission}
                onStoreCommissionChange={setStoreCommission}
              />
            </SafeErrorBoundary>

            {/* Fim do Container de Configurações */}
          </div>
        )}

      </ProductDetailsLayout>
    </SafeErrorBoundary>
  );
}
