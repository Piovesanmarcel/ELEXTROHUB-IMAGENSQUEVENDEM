import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { RefreshCw, Package, Sparkles, Rocket, Grid3x3, Cpu, Copy, Check, Settings, Play, Send, Zap, Clock, AlertCircle, Loader2, CheckCircle2, FileText, Shrink, Bot, Pause, PlayCircle, Wand2, Image, Plus, Download, Crown, Eye, EyeOff } from "lucide-react";

import { GeneratedImageGallery, GeneratedImage } from "@/components/n8n/GeneratedImageGallery";
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
import { cn } from "@/lib/utils";
import { ProductTable } from "@/components/ProductTable";
import { useProductsPricing } from "@/hooks/products/useProductsPricing";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
import { useMarketingTemplates } from "@/hooks/useMarketingTemplates";
import { templateImageCache } from "@/utils/TemplateImageCache";
import { TemplateConfig } from "@/types/marketing-templates";
import { CompactAIDescriptionEnhancer } from "@/components/product/ai-enhancer/CompactAIDescriptionEnhancer";
import { WorkflowProgressTracker } from "@/components/workflow/WorkflowProgressTracker";
import { useWorkflowTracking } from "@/hooks/useWorkflowTracking";


// Constante para referência (mesma da edge function)
const PLACEHOLDER_REFERENCE_URL = "https://bpqtzydsxmjazdzzcvno.supabase.co/storage/v1/object/public/marketing-templates/placeholder-reference-1763672366451.png";

// Função helper para montar o prompt (Cópia de useCanvaTemplateN8N para garantir fidelidade)
function buildTemplatePrompt(
  template: TemplateConfig,
  productName: string,
  description?: string
): string {
  const { dimensions, zones, name: templateName } = template;

  const zoneDescriptions = zones.map((zone, idx) => {
    const pos = zone.position;
    return `- Zona ${idx + 1} (${zone.type}): ${zone.dataSource || zone.id} em posição (${pos.x}, ${pos.y}) tamanho ${pos.width}x${pos.height}`;
  }).join('\n');

  return `VOCÊ É UM DESIGNER GRÁFICO PROFISSIONAL ESPECIALIZADO EM MARKETING VISUAL.

SUA MISSÃO: Criar uma imagem de marketing PROFISSIONAL e ATRAENTE.

📍 ESPECIFICAÇÕES TÉCNICAS:
- Dimensões EXATAS: ${dimensions.width}x${dimensions.height} pixels
- Template: ${templateName}
- Qualidade: Alta resolução, cores vibrantes

📦 INFORMAÇÕES DO PRODUTO:
- Nome: ${productName}
${description ? `- Descrição: ${description}` : ''}

🖼️ IMAGENS RECEBIDAS (em ordem):
1. IMAGEM DE REFERÊNCIA - Mostra o tipo de placeholder/produto a ser REMOVIDO
2. TEMPLATE BASE - Layout que DEVE ser replicado EXATAMENTE
3. IMAGENS DO PRODUTO - Fotos do produto que DEVEM ser inseridas

📝 ZONAS DO TEMPLATE:
${zoneDescriptions}

⚠️ REGRAS CRÍTICAS - SIGA RIGOROSAMENTE:
1. REMOÇÃO DE PLACEHOLDERS: Identifique e REMOVA COMPLETAMENTE os placeholders do template.
2. INSERÇÃO DO PRODUTO: Use SOMENTE as imagens do produto fornecidas.
3. PRESERVAÇÃO DO LAYOUT: Copie EXATAMENTE cores, fontes e estrutura.
4. TEXTOS: Use informações REAIS do produto "${productName}". Sem acentos.

🎨 RESULTADO ESPERADO:
Uma imagem de marketing PROFISSIONAL que destaque o produto e mantenha a identidade do template.`;
}

import { useWebhookStorage, WEBHOOK_CONFIGS } from "@/features/generator/hooks/useWebhookStorage";
import { N8NWebhooksUI } from "@/components/settings/N8NWebhooksUI";
import { VisualPackageCards, VISUAL_PACKAGES, type PackageType, type VisualPackage } from "@/components/generator/VisualPackageCards";

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
  { id: 'product_studio', label: '📸 Studio Profissional', description: 'Fundo branco, iluminação profissional' },
  { id: 'packaging', label: '📦 Embalagem Premium', description: 'Apresentação de embalagem luxuosa' },
  { id: 'mockup', label: '🏠 Mockup Realista', description: 'Produto em contexto de uso real' },
  { id: 'lifestyle', label: '👩‍💻 Lifestyle', description: 'Interação humana com o produto' },
  { id: 'ambient_1', label: '🏙️ Ambiente Comercial', description: 'Cena em ambiente profissional/comercial' },
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

export default function UnifiedAdGeneratorCopy02() {
  const { templates: marketingTemplates } = useMarketingTemplates(); // Hook para buscar templates
  const [activeTab, setActiveTab] = useState("app");
  const [expandedCanvaTemplates, setExpandedCanvaTemplates] = useState(false);
  const [expandedShowcase, setExpandedShowcase] = useState(false);
  const [expandedAutoProcessor, setExpandedAutoProcessor] = useState(false);

  const [isTestingMarketing, setIsTestingMarketing] = useState(false);
  const [isTestingStandard, setIsTestingStandard] = useState(false);

  // Hook de créditos







  const [unifiedData, setUnifiedData] = useState<any>(null);
  const [hostedAIImages, setHostedAIImages] = useState<string[]>([]);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [referenceImages, setReferenceImages] = useState<string[]>([]); // Imagens de referência iniciais
  const [isEditing, setIsEditing] = useState(true); // Sempre em modo de edição
  const [showPreflightModal, setShowPreflightModal] = useState(false); // Modal Pre-Flight Check

  // ✅ NOVO: Estado separado para URLs HTTPS originais (não convertidas para blob)
  // Usado para geração de templates que requerem URLs acessíveis pela internet

  // Estados para Progresso Real da Automação
  const [initialImageCount, setInitialImageCount] = useState(0);
  const [expectedTotalImages, setExpectedTotalImages] = useState(5); // Default start package
  const [originalHostedUrls, setOriginalHostedUrls] = useState<string[]>([]);

  // Estado para o modal de download
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const previousImageCountRef = useRef(0);
  const [wasAutomationStarted, setWasAutomationStarted] = useState(false);

  // Monitorar chegada de novas imagens para abrir o modal
  useEffect(() => {
    // Só abre o modal se a automação foi iniciada (evita abrir no upload manual)
    if (!wasAutomationStarted) {
      previousImageCountRef.current = productImages.length;
      return;
    }

    if (productImages.length > initialImageCount && productImages.length > previousImageCountRef.current) {
      // Se novas imagens chegaram e temos conteúdo gerado, mostrar modal
      setShowDownloadModal(true);
    }
    previousImageCountRef.current = productImages.length;
  }, [productImages.length, initialImageCount, wasAutomationStarted]);

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
  // ✅ TRAVA DE SEGURANÇA: Forçar automação sempre ativa (solicitação do usuário)
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

  // ✅ NOVO: Estados para Fluxo Dinâmico (Selection -> Input -> Generating -> Results)
  type WorkflowStep = 'selection' | 'input' | 'generating' | 'results';
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('selection');
  const [selectedPackageId, setSelectedPackageId] = useState<PackageType | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const [hidePackages, setHidePackages] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);

  // ✅ Estado para Header (Collapsible)
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);

  // Handler para Seleção de Pacote
  const handlePackageSelect = (pkgId: PackageType) => {
    setSelectedPackageId(pkgId);
    setWorkflowStep('input');
    toast.success(`Pacote selecionado! Preencha os dados do produto.`);
    // Scroll suave para o formulário
    setTimeout(() => {
      document.getElementById('product-form-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Handler para Voltar para Seleção
  const handleBackToSelection = () => {
    setWorkflowStep('selection');
    setSelectedPackageId(null);
    setCurrentJobId(null); // Limpar jobId de tracking
  };

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

  // Estado para armazenar o jobId atual (para tracking)
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  // Hook para tracking do workflow via Supabase Realtime (usa jobId, não productId)
  const {
    steps: workflowSteps,
    currentStep: currentWorkflowStep,
    overallProgress: workflowProgress,
    isConnected: isWorkflowConnected,
    hasError: workflowHasError,
    isComplete: workflowIsComplete,
    clearSession: clearWorkflowSession
  } = useWorkflowTracking({ sessionId: currentJobId || '', enabled: !!currentJobId });

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


  // Controle de Geração de Pacotes (Trava UI até imagens chegarem)
  const [generationTarget, setGenerationTarget] = useState<number | null>(null);
  const generationResolver = useRef<((value: void | PromiseLike<void>) => void) | null>(null);

  // WatchdogRefs
  const lastImageCountRef = useRef<number>(0);
  const lastActivityRef = useRef<number>(Date.now());

  // Monitorar chegada de imagens para liberar o botão
  useEffect(() => {
    // Atualizar timestamp de atividade se houver novas imagens
    if (productImages.length > lastImageCountRef.current) {
      lastActivityRef.current = Date.now();
      lastImageCountRef.current = productImages.length;
      console.log('🐶 [Watchdog] Nova imagem detectada! Timer resetado.', { count: productImages.length });
    }

    // Lógica original de conclusão
    if (generationTarget !== null && productImages.length >= generationTarget) {
      if (generationResolver.current) {
        generationResolver.current();
        generationResolver.current = null;
      }
      setGenerationTarget(null);
      toast.success("✅ Pacote Visual Concluído! Todas as imagens chegaram.");
    }
  }, [productImages.length, generationTarget]);

  // Watchdog Timer: Verifica inatividade
  useEffect(() => {
    if (generationTarget === null) return; // Só roda se estiver esperando

    console.log('🐶 [Watchdog] Monitor iniciado...');

    const intervalId = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      const ACTIVITY_TIMEOUT = 45000; // 45 segundos sem novas imagens

      // Se passou do tempo limite E já temos pelo menos 1 imagem (para não matar jobs no início)
      if (timeSinceLastActivity > ACTIVITY_TIMEOUT && productImages.length > 0) {
        console.warn('🐶 [Watchdog] TIMEOUT DE INATIVIDADE! Forçando conclusão...', {
          timeSinceLastActivity,
          current: productImages.length,
          target: generationTarget
        });

        toast.warning("Geração finalizada por tempo limite", {
          description: `Recebemos ${productImages.length} imagens. Algumas podem ter falhado no processamento.`
        });

        if (generationResolver.current) {
          generationResolver.current();
          generationResolver.current = null;
        }
        setGenerationTarget(null);
      }
    }, 5000); // Verifica a cada 5s

    return () => clearInterval(intervalId);
  }, [generationTarget, productImages.length]);


  // 🎨 Brand Settings para logo global
  const { brandSettings } = useBrandSettings();

  // 📡 Hook global para receber broadcasts de imagens do n8n
  const { activeBatchProgress, isConnected: isBroadcastConnected, debugState } = useBroadcast();

  // 💰 Hook de créditos
  const { usage, isLoading: isLoadingCredits } = useEnhancementUsage();

  // 🚀 Hook Runware para upscale automático
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

  // ⚙️ Ref para acesso síncrono ao estado isAutomationRunning (evita race condition)
  const isAutomationRunningRef = useRef(isAutomationRunning);

  // Manter ref sincronizada com o estado
  useEffect(() => {
    isAutomationRunningRef.current = isAutomationRunning;
    console.log('🔄 [UnifiedAdGenerator] isAutomationRunning atualizado:', isAutomationRunning);
  }, [isAutomationRunning]);

  // Listener para dados do Comando Unificado
  useEffect(() => {
    const handleUnifiedComplete = (event: CustomEvent) => {
      console.log('📣 [UnifiedAdGenerator] Comando Unificado completo:', event.detail);
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

  // Listener para Copywriting completo
  useEffect(() => {
    const handleCopyComplete = (event: CustomEvent) => {
      console.log('📣 [UnifiedAdGenerator] Copywriting completo');
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
      console.log('📣 [UnifiedAdGenerator] Gemini completo');
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
      console.log('📣 [UnifiedAdGenerator] KITs completos');
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
          console.log(`🚫 [UNIFIED-AD-GENERATOR] Evento n8n já processado, ignorando: ${eventKey}`);
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
                    console.log(`🚫 [N8N→GALERIA] Imagem ${sceneType} upscaled já existe`);
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

      console.log(`📣 [UNIFIED-AD-GENERATOR] Imagem gerada recebida:`, { source, hasImages: !!images, hasUrl: !!url, hasHostedUrl: !!hostedUrl });

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
          safeStorageSet('unified_ad_generator_hosted_urls', updated, 120);
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

          safeStorageSet('unified_ad_generator_product_images', updated, 120);

          return updated;
        });
      }
    };

    const handleHostedImageSaved = (event: CustomEvent) => {
      const { productId: eventProductId, hostedUrl, url } = event.detail || {};

      if (eventProductId && eventProductId !== productId) return;

      const imageUrl = hostedUrl || url;
      if (!imageUrl) return;

      console.log(`📣 [UNIFIED-AD-GENERATOR] Imagem hospedada salva:`, imageUrl.substring(0, 60));

      if (imageUrl.startsWith('https://')) {
        setOriginalHostedUrls(prev => {
          if (prev.includes(imageUrl)) return prev;
          const updated = [...prev, imageUrl];
          console.log(`🔗 [UNIFIED-AD-GENERATOR] URL HTTPS hospedada preservada, total: ${updated.length}`);
          safeStorageSet('unified_ad_generator_hosted_urls', updated, 120);
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

        safeStorageSet('unified_ad_generator_product_images', updated, 120);

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


    // RESTAURAR ESTADO DE FLUXO (Se existir)
    const savedStep = sessionStorage.getItem('unified_ad_workflow_step');
    const savedInitialCount = sessionStorage.getItem('unified_ad_initial_count');
    const savedExpectedTotal = sessionStorage.getItem('unified_ad_expected_total');
    const savedHidePackages = sessionStorage.getItem('unified_ad_hide_packages');
    const savedHasDownloaded = sessionStorage.getItem('unified_ad_has_downloaded');

    if (savedStep && (savedStep === 'results' || savedStep === 'generating')) {
      console.log(`♻️ [STATE] Restaurando passo do fluxo para: ${savedStep}`);
      setWorkflowStep(savedStep as WorkflowStep);

      if (savedInitialCount) setInitialImageCount(Number(savedInitialCount));
      if (savedExpectedTotal) setExpectedTotalImages(Number(savedExpectedTotal));
      if (savedHidePackages === 'true') setHidePackages(true);
      if (savedHasDownloaded === 'true') setHasDownloaded(true);

      // Se estava em results, garantir que agentProgress não fique em 0
      if (savedStep === 'results') setAgentProgress(100);
    }

  }, []);

  // PERSISTÊNCIA DE ESTADO (Salvar mudanças críticas)
  useEffect(() => {
    if (workflowStep !== 'selection') {
      sessionStorage.setItem('unified_ad_workflow_step', workflowStep);
      sessionStorage.setItem('unified_ad_initial_count', String(initialImageCount));
      sessionStorage.setItem('unified_ad_expected_total', String(expectedTotalImages));
      sessionStorage.setItem('unified_ad_hide_packages', String(hidePackages));
      sessionStorage.setItem('unified_ad_has_downloaded', String(hasDownloaded));
    } else {
      // Se voltou para seleção (novo produto), limpar estado persistido do fluxo
      // MAS MANTER IMAGENS SE O USUARIO APENAS RECARREGOU
      // Logica ajustada: Limpar apenas se foi explicitamente para selection via RESET
    }
  }, [workflowStep, initialImageCount, expectedTotalImages, hidePackages, hasDownloaded]);

  // ✅ NOVO: Persistir imagens de referência no sessionStorage
  useEffect(() => {
    if (referenceImages.length > 0) {
      sessionStorage.setItem('unified_ad_generator_reference_images', JSON.stringify(referenceImages));
      console.log('💾 [REFERÊNCIA] Persistido no sessionStorage:', referenceImages.length);
    }
  }, [referenceImages]);

  // 🧪 Limpar cache de IA quando as imagens de referência mudarem
  useEffect(() => {
    if (referenceImages.length > 0) {
      const aiCache = AIImagesSessionCache.getInstance();
      aiCache.clearAllAICache();
      console.log('🧪 [UNIFIED-AD-GENERATOR] Cache de IA limpo - novas imagens de referência detectadas');
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
  // 🔄 Handler para Novo Produto
  const handleNewProduct = () => {
    // Limpar Storage
    sessionStorage.removeItem('unified_ad_generator_product_id');
    sessionStorage.removeItem('unified_ad_generator_product_images');
    sessionStorage.removeItem('unified_ad_generator_reference_images');
    sessionStorage.removeItem('unified_ad_workflow_step'); // Importante limpar step
    sessionStorage.removeItem('unified_ad_initial_count');
    sessionStorage.removeItem('unified_ad_expected_total');
    sessionStorage.removeItem('unified_ad_hide_packages');
    sessionStorage.removeItem('unified_ad_has_downloaded');

    // Reset Estados Locais
    setWorkflowStep('selection');
    setSelectedPackageId(null);
    setProductImages([]);
    setHostedAIImages([]);
    setFormData({
      nome: '',
      sku: '',
      descricao_curta: '',
      descricao: '',
      preco_custo: 0,
      preco_venda: 0,
      peso_liquido: 0,
      altura: null,
      largura: null,
      profundidade: null,
      peso_bruto: null,
    });
    setAgentProgress(0);
    setCurrentAgent('');
    setShowCompletionModal(false); // Garantir que modal fecha
    setHidePackages(false); // Mostrar pacotes novamente

    toast.success('Iniciando novo produto...');

    // Forçar reload para garantir limpeza total de estado
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // 🔍 Detectar mudança significativa de produto
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
      console.log(`📣 [Paralelo] Resposta para ${sceneType}:`, JSON.stringify(data).substring(0, 200));

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
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    console.log('🔑 [Teste Paralelo] Registrando job autorizado:', jobId);

    // Salvar jobId para tracking em tempo real
    setCurrentJobId(jobId);

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
      productId: productId, // CRÍTICO: enviar productId para tracking no Supabase
      product_id: productId, // snake_case para compatibilidade
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
  // Retorna Promise<any> com os dados ou null
  const executeStep1 = async (): Promise<any> => {
    // ✅ Verificar se já está rodando via ref (evita condição de corrida)
    if (step1RunningRef.current) {
      console.log('[executeStep1] Já está executando, ignorando clique duplicado');
      return null;
    }

    if (!webhookComandoUnificado) {
      toast.error("Configure a URL do webhook Comando Unificado");
      return null;
    }
    if (!formData.nome) {
      toast.error("Preencha o nome do produto");
      return null;
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

    // ✅ Garantir que temos um jobId para tracking, mesmo em execução avulsa
    const effectiveJobId = currentJobId || `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    if (!currentJobId) {
      setCurrentJobId(effectiveJobId);
      console.log('[executeStep1] 🆕 Novo JobId gerado para execução avulsa:', effectiveJobId);
    }

    try {
      const payload = {
        product_name: formData.nome,
        short_description: formData.descricao_curta || formData.nome,
        long_description: formData.descricao || formData.descricao_curta || formData.nome,
        original_text: formData.descricao_curta || formData.nome,
        request_id: `unified_${Date.now()}`,
        user_id: userId,
        tracking_id: effectiveJobId,
        trackingId: effectiveJobId,
        job_id: effectiveJobId,
        jobId: effectiveJobId,
        product_id: productId,
        productId: productId,
        productName: formData.nome,
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

      // Se a resposta for um "Enfileirado" (Fila Redis), não finalizamos com sucesso ainda
      if (data.status === 'queued' || data.message === 'Queued' || data.jobId) {
        console.log('[executeStep1] ⏳ Job enfileirado no Redis. Aguardando conclusão via Realtime...');
        setStep1(prev => ({
          ...prev,
          status: "running",
          error: null,
          message: "Processando na fila (Atlas)..."
        }));

        // Retornamos algo que indique que está em progresso
        return { async: true, trackingId: currentJobId };
      }

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
      return result; // ✅ Sucesso: Retorna dados
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro';
      console.error('[executeStep1] ❌ Erro:', errorMsg);
      setStep1(prev => ({ ...prev, status: "error", error: errorMsg, completedAt: new Date().toISOString() }));
      toast.error(`Etapa 1 falhou: ${errorMsg}`);
      return null; // ✅ Falha
    } finally {
      // ✅ SEMPRE limpar a ref, independente de sucesso ou erro
      step1RunningRef.current = false;
      console.log('[executeStep1] 🏁 Execução finalizada, ref limpa');
    }
  };

  // ===== N8N: Executar Etapa 2 - Copywriting =====
  // Retorna Promise<any> com dados
  const executeStep2 = async (): Promise<any> => {
    // ✅ Verificar se já está rodando via ref (evita condição de corrida)
    if (step2RunningRef.current) {
      console.log('[executeStep2] Já está executando, ignorando clique duplicado');
      return null;
    }

    if (!webhookCopywriting) {
      toast.error("Configure a URL do webhook Copywriting");
      return null;
    }
    if (!formData.nome) {
      toast.error("Preencha o nome do produto");
      return null;
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

    // ✅ Garantir que temos um jobId para tracking
    const effectiveJobId = currentJobId || `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    if (!currentJobId) {
      setCurrentJobId(effectiveJobId);
    }

    try {
      const payload = {
        product_name: formData.nome,
        short_description: formData.descricao_curta || formData.nome,
        long_description: formData.descricao || formData.descricao_curta || formData.nome,
        user_id: userId,
        user_email: userEmail,
        request_id: `copywriting_${Date.now()}`,
        tracking_id: effectiveJobId,
        trackingId: effectiveJobId,
        job_id: effectiveJobId,
        jobId: effectiveJobId,
        product_id: productId,
        productId: productId,
        productName: formData.nome,
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
      let copyContent = '';
      if (data?.copywriting || data?.content) {
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

      // Retornar o conteúdo extraído ou o objeto completo (no caso o setN8nCopywritingResult já limpou)
      // Como a gente precisa do 'content' limpo, vamos tentar retornar isso
      return { content: copyContent || JSON.stringify(data) };

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro';
      console.error('[executeStep2] ❌ Erro:', errorMsg);
      setStep2(prev => ({ ...prev, status: "error", error: errorMsg, completedAt: new Date().toISOString() }));
      toast.error(`Etapa 2 falhou: ${errorMsg}`);
      return null; // ✅ Falha
    } finally {
      // ✅ SEMPRE limpar a ref, independente de sucesso ou erro
      step2RunningRef.current = false;
      console.log('[executeStep2] ðŸ ExecuÃ§Ã£o finalizada, ref limpa');
    }
  };

  // ===== BOTÃƒO MÃGICO: Executar Agentes de Conversão (ATLAS ←’ LYRA ←’ ORION) =====
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

    // Verificar campos obrigatÃ³rios
    if (!isFormValid) {
      toast.error("Preencha todos os campos obrigatÃ³rios antes de acionar os agentes");
      return;
    }

    // Gerar jobId IMEDIATAMENTE para tracking no n8n
    const trackingJobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    setCurrentJobId(trackingJobId);
    console.log('[MagicFlow] JobId de tracking criado:', trackingJobId);

    console.log('[MagicFlow] Iniciando sequencia de agentes de conversao...');
    setIsMagicFlowExecuting(true);
    setWasAutomationStarted(true); // Marca que automacao comecou
    setInitialImageCount(productImages.length); // Trava contador inicial para saber o que e novo

    try {
      // ===== ETAPA 1: ATLAS (Comando Unificado) =====
      setMagicFlowCurrentStep("atlas");
      console.log('[MagicFlow] Etapa 1: ATLAS (Comando Unificado)');

      const atlasSuccess = await executeStep1();
      if (!atlasSuccess) {
        toast.error("âŒ ATLAS falhou. Fluxo interrompido.");
        console.log('[MagicFlow] âŒ ATLAS falhou, interrompendo fluxo');
        return;
      }

      setMagicFlowCurrentStep("atlas_complete");
      // Aguardar 2 segundos antes da prÃ³xima etapa
      await new Promise(resolve => setTimeout(resolve, 2000));

      // ===== ETAPA 2: LYRA (Copywriting) =====
      setMagicFlowCurrentStep("lyra");
      console.log('[MagicFlow] Etapa 2: LYRA (Copywriting)');

      const lyraSuccess = await executeStep2();
      if (!lyraSuccess) {
        toast.error("âŒ LYRA falhou. Fluxo interrompido.");
        console.log('[MagicFlow] âŒ LYRA falhou, interrompendo fluxo');
        return;
      }

      setMagicFlowCurrentStep("lyra_complete");
      // Aguardar 2 segundos antes da prÃ³xima etapa
      await new Promise(resolve => setTimeout(resolve, 2000));

      // ===== ETAPA 3: ORION (Tratamento 8 Cenas) =====
      setMagicFlowCurrentStep("orion");
      console.log('[MagicFlow] Etapa 3: ORION (8 Cenas)');

      // Chamar o webhook de tratamento paralelo
      await testParallelWebhook();

      setMagicFlowCurrentStep("orion_complete");

      toast.success("ðŸŽ‰ Agentes de Conversão concluÃ­dos!");
      console.log('[MagicFlow] âœ… Fluxo completo executado com sucesso!');

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[MagicFlow] âŒ Erro no fluxo:', errorMsg);
      toast.error(`Erro nos agentes: ${errorMsg}`);
    } finally {
      setIsMagicFlowExecuting(false);
      setMagicFlowCurrentStep(undefined);
    }
  };

  const testMarketingWebhook = async () => {
    if (productImages.length === 0) {
      toast.error('Adicione imagens do produto');
      return;
    }
    if (!formData.nome?.trim()) {
      toast.error('Preencha o nome do produto');
      return;
    }

    // Encontrar webhook de teste (procurar por magica ou marketing)
    const webhookKey = Object.keys(webhooks).find(k => k.includes('magica') || k.includes('marketing')) || '';
    const webhookUrl = webhooks[webhookKey];

    if (!webhookUrl) {
      toast.error('Nenhum webhook "MÃ¡gica" ou "Marketing" encontrado na configuraÃ§Ã£o.');
      return;
    }

    setIsTestingMarketing(true);
    toast.info(`Iniciando teste de Marketing com ${webhookKey}...`);

    try {
      // 1. Processar Imagens (Full Base64)
      console.log('[TestMarketing] Processando imagens...');
      const processed = await Promise.all(productImages.map(async (url) => {
        const res = await fetch(url);
        const blob = await res.blob();
        const fullBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        return fullBase64;
      }));

      // 2. Preparar Template e ReferÃªncia
      const geralTemplates = marketingTemplates.filter(t => t.category === 'Geral 01');
      const randomTemplate = geralTemplates.length > 0
        ? geralTemplates[Math.floor(Math.random() * geralTemplates.length)]
        : marketingTemplates[0];

      if (!randomTemplate) throw new Error("Nenhum template disponÃ­vel");

      // Baixar ReferÃªncia (mÃ¡scara)
      let referenceBase64 = "";
      try {
        const refRes = await fetch(PLACEHOLDER_REFERENCE_URL);
        const refBlob = await refRes.blob();
        referenceBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(refBlob);
        });
      } catch (e) { console.warn("Falha ao carregar ref placeholder", e); }

      // Baixar Template
      let templateBase64 = "";
      try {
        const tmplRes = await fetch(randomTemplate.baseImage);
        const tmplBlob = await tmplRes.blob();
        templateBase64 = await new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onloadend = () => resolve(r.result as string);
          r.readAsDataURL(tmplBlob);
        });
      } catch (e) { console.error("Erro ao baixar img template", e); }

      // 3. Montar Prompt e Payload
      const prompt = buildTemplatePrompt(randomTemplate, formData.nome, formData.descricao);
      const jobId = `test_marketing_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // Registrar Job
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      await supabase.from('authorized_jobs').insert({
        job_id: jobId,
        user_id: userId,
        expected_images: 1,
        status: 'active',
        expires_at: expiresAt,
        metadata: {
          test_type: 'marketing_manual',
          webhook_key: webhookKey,
          product_name: formData.nome
        }
      });

      const body = {
        request_id: `req_${jobId}`,
        job_id: jobId,
        user_id: userId,
        timestamp: new Date().toISOString(),
        source: 'visual-package-magica',
        prompt: prompt,
        images: {
          reference_base64: referenceBase64,
          template_base64: templateBase64,
          product_images_base64: processed,
          logo_base64: null // SimplificaÃ§Ã£o para teste
        },
        metadata: {
          productName: formData.nome,
          package: 'TESTE MANUAL',
          type: 'magica',
          templateId: randomTemplate.id,
          templateName: randomTemplate.name
        },
        config: { incluir_logo: false }
      };

      // 4. Disparar
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      console.log(`[TestMarketing] Disparado para ${webhookKey}`);
      toast.success('Webhook de Marketing disparado! Verifique o n8n.');

    } catch (e) {
      console.error('[TestMarketing] Erro:', e);
      toast.error('Erro no teste de marketing');
    } finally {
      setIsTestingMarketing(false);
    }
  };

  const testStandardWebhook = async () => {
    if (isTestingStandard) return;
    if (!formData.nome) {
      toast.error('Preencha o nome do produto');
      return;
    }
    if (productImages.length === 0) {
      toast.error('Adicione imagens do produto');
      return;
    }

    setIsTestingStandard(true);
    toast.info('Preparando imagens Standard...');

    try {
      // 1. Processar Imagens (Formato Standard - Stripped Base64)
      let standardImages: Array<{ index: number; filename: string; mimeType: string; base64: string }> = [];

      const processed = await Promise.all(productImages.map(async (url, idx) => {
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise<{ base64: string; mime: string }>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const res = reader.result as string;
            // Remover prefixo data:image/...;base64,
            const stripped = res.replace(/^data:image\/[a-z]+;base64,/, "");
            resolve({ base64: stripped, mime: blob.type || 'image/png' });
          };
          reader.readAsDataURL(blob);
        });
      }));

      standardImages = processed.map((p, i) => ({
        index: i + 1,
        filename: `image_${i + 1}`,
        mimeType: p.mime,
        base64: p.base64
      }));

      // 2. Identificar Webhooks Standard (Filtro restrito a 'vb_' e tipos especÃ­ficos: Fundo e Ambientada)
      const targetKeys = Object.keys(webhooks).filter(k => {
        const lowerK = k.toLowerCase();
        return k.startsWith('vb_') &&
          (lowerK.includes('fundo') || lowerK.includes('ambientada')) &&
          !lowerK.includes('_magica_') &&
          webhooks[k];
      });

      if (targetKeys.length === 0) {
        toast.warning('Nenhum webhook Visual Brand (vb_) configurado (Standard/Fundo)');
        setIsTestingStandard(false);
        return;
      }

      console.log('[StandardTest] Disparando para:', targetKeys);

      // 3. Disparar
      let firedCount = 0;
      for (const key of targetKeys) {
        const url = webhooks[key];
        const jobId = `std_test_${Date.now()}_${key}`;

        // Registrar Job
        await supabase.from('authorized_jobs').insert({
          job_id: jobId,
          user_id: userId,
          expected_images: 1,
          status: 'active',
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          metadata: {
            source: 'standard-test-button',
            key
          }
        });

        // Payload
        const payload = {
          job_id: jobId,
          jobId: jobId,
          product_name: formData.nome,
          productName: formData.nome,
          user_id: userId,
          userId: userId,
          timestamp: new Date().toISOString(),
          images: standardImages,
          seo: { descricao: formData.descricao_curta || '' },
          marketing: { texto_marketing: '' },
          metadata: { type: 'standard_test', key }
        };

        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(e => console.error(`Erro ao enviar para ${key}:`, e));

        firedCount++;
      }

      toast.success(`Disparado para ${firedCount} webhooks Standard!`);

    } catch (error) {
      console.error('Erro no teste Standard:', error);
      toast.error('Falha ao processar teste Standard');
    } finally {
      // Manter spinner por 2s para feedback visual
      setTimeout(() => setIsTestingStandard(false), 2000);
    }
  };


  // Handler para Geração do Pacote (Extraído da inline function)
  const handleGeneratePackage = async (
    packageId: PackageType,
    config: VisualPackage,
    unifiedContext?: any,
    copywritingContext?: any
  ) => {
    // Validar dados
    if (!formData.nome?.trim()) {
      toast.error('Preencha o nome do produto');
      return;
    }
    if (productImages.length === 0) {
      toast.error('Adicione imagens do produto');
      return;
    }
    if (!userId) {
      toast.error('Erro de autenticação: User ID não encontrado');
      return;
    }

    console.log(`[VisualPackage] Iniciando pacote: ${packageId} (${config.name})`);
    toast.info(`Iniciando geração do pacote ${config.name}...`);

    let standardImages: Array<{ index: number; filename: string; mimeType: string; base64: string }> = [];
    let magicaImagesBase64: string[] = [];
    let logoBase64: string | undefined;

    const prefixes: Record<PackageType, string> = {
      start: 'vs_',
      pro: 'vp_',
      expert: 've_',
      brand: 'vb_'
    };
    const prefix = prefixes[packageId];

    const PACKAGE_RECIPES: Record<PackageType, string[]> = {
      start: ['fundo_branco', 'ambientada'],
      pro: ['fundo_branco', 'ambientada'],
      expert: ['fundo_branco', 'ambientada', 'em_uso'],
      brand: ['fundo_branco', 'ambientada', 'em_uso', 'com_pessoas']
    };

    const requiredSuffixes = PACKAGE_RECIPES[packageId];
    const targetKeys: string[] = [];

    const missingWebhooks: string[] = [];
    requiredSuffixes.forEach(suffix => {
      const key = `${prefix}${suffix}`;
      const exactKey = Object.keys(webhooks).find(k => k.toLowerCase() === key.toLowerCase());
      if (exactKey) {
        targetKeys.push(exactKey);
      } else {
        missingWebhooks.push(key);
      }
    });

    if (missingWebhooks.length > 0) {
      const msg = `ERRO CRÍTICO: Webhooks obrigatórios não encontrados no banco: ${missingWebhooks.join(', ')}`;
      console.error(msg);
      toast.error(msg);
      throw new Error(msg);
    }

    const magicaKeys = Object.keys(webhooks).filter(k =>
      k.toLowerCase().startsWith(prefix) &&
      k.toLowerCase().includes('_magica_')
    );

    if (magicaKeys.length === 0) {
      console.warn(`[VisualPackage] Nenhum webhook 'Mágica' encontrado para ${packageId}.`);
    } else {
      targetKeys.push(...magicaKeys);
    }

    if (targetKeys.length === 0) {
      throw new Error(`Nenhum webhook configurado para ${config.name}.`);
    }

    try {
      const processed = await Promise.all(productImages.map(async (url, idx) => {
        const res = await fetch(url);
        const blob = await res.blob();
        const fullBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        const strippedBase64 = fullBase64.replace(/^data:image\/[a-z]+;base64,/, "");
        return {
          full: fullBase64,
          stripped: strippedBase64,
          mime: blob.type || 'image/png',
          filename: `image_${idx + 1}.${blob.type?.split('/')[1] || 'png'}`
        };
      }));

      standardImages = processed.map((p, i) => ({
        index: i + 1,
        filename: p.filename,
        mimeType: p.mime,
        base64: p.stripped
      }));

      magicaImagesBase64 = processed.map(p => p.full);

      if (brandSettings?.logo_url) {
        try {
          const resLogo = await fetch(brandSettings.logo_url);
          const blobLogo = await resLogo.blob();
          logoBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blobLogo);
          });
        } catch (e) {
          console.warn('Erro ao processar logo:', e);
        }
      }

    } catch (err) {
      console.error("Erro no processamento de imagens:", err);
      throw err;
    }

    {
      let firedCount = 0;
      let referenceBase64 = "";
      if (targetKeys.some(k => k.includes('_magica_'))) {
        try {
          const refRes = await fetch(PLACEHOLDER_REFERENCE_URL);
          const refBlob = await refRes.blob();
          referenceBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(refBlob);
          });
        } catch (e) { console.warn("Falha ao carregar ref placeholder", e); }
      }

      try {
        // 1. Preparação dos Jobs (Configuração e Cache)
        const jobsToExecute: any[] = [];

        // Identificar templates únicos necessários para "Mágica" para cache warming
        const magicKeys = targetKeys.filter(k => k.includes('_magica_'));
        const uniqueTemplatesToCache = new Set<string>();
        const keyToTemplateMap = new Map<string, any>(); // Map webhookKey -> Template

        if (magicKeys.length > 0) {
          const geralTemplates = marketingTemplates.filter(t => t.category === 'Geral 01');
          for (const key of magicKeys) {
            const randomTemplate = geralTemplates.length > 0
              ? geralTemplates[Math.floor(Math.random() * geralTemplates.length)]
              : marketingTemplates[0];

            if (randomTemplate) {
              keyToTemplateMap.set(key, randomTemplate);
              uniqueTemplatesToCache.add(randomTemplate.baseImage);
            }
          }
        }

        // Cache Warming (Baixar templates únicos em paralelo se não existirem)
        if (uniqueTemplatesToCache.size > 0) {
          console.log(`[VisualPackage] Verificando cache para ${uniqueTemplatesToCache.size} templates...`);
          await Promise.all(Array.from(uniqueTemplatesToCache).map(async (url) => {
            if (!templateImageCache.has(url)) {
              try {
                const res = await fetch(url);
                const blob = await res.blob();
                const base64 = await new Promise<string>((resolve) => {
                  const r = new FileReader();
                  r.onloadend = () => resolve(r.result as string);
                  r.readAsDataURL(blob);
                });
                templateImageCache.set(url, base64);
              } catch (e) {
                console.error(`Erro ao baixar template para cache: ${url}`, e);
              }
            }
          }));
        }

        // 2. Construção dos Payloads e Dados do Banco
        const dbRecords: any[] = [];

        for (const key of targetKeys) {
          const url = webhooks[key];
          if (!url) continue;

          const isMagica = key.includes('_magica_');
          const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

          // NOTA: currentJobId já foi setado no handleStartGeneration para tracking

          const dbRecord = {
            job_id: jobId,
            user_id: userId,
            expected_images: 1,
            status: 'active',
            expires_at: expiresAt,
            metadata: {
              package_id: packageId,
              webhook_key: key,
              product_name: formData.nome,
              source: 'visual-package-card',
              has_context: !!unifiedContext
            }
          };
          dbRecords.push(dbRecord);

          try {
            let body = {};
            if (isMagica) {
              const template = keyToTemplateMap.get(key);
              if (!template) {
                console.error("Template não encontrado para key:", key);
                continue;
              }

              // Pegar do cache (garantido pelo warming acima)
              const templateBase64 = templateImageCache.get(template.baseImage) || "";
              const prompt = buildTemplatePrompt(template, formData.nome, formData.descricao);

              body = {
                request_id: `req_${jobId}`,
                job_id: jobId,
                tracking_id: currentJobId, // ID para tracking em tempo real no Supabase
                trackingId: currentJobId,
                user_id: userId,
                timestamp: new Date().toISOString(),
                source: 'visual-package-magica',
                prompt: prompt,
                images: {
                  reference_base64: referenceBase64,
                  template_base64: templateBase64,
                  product_images_base64: magicaImagesBase64,
                  logo_base64: logoBase64 || null
                },
                metadata: {
                  productName: formData.nome,
                  productId: productId,
                  templateId: template.id,
                  package: packageId,
                  type: 'magica',
                  short_description: formData.descricao_curta
                },
                config: { incluir_logo: !!logoBase64 },
                unified_context: unifiedContext || null,
                copywriting_context: copywritingContext || null
              };
            } else {
              body = {
                request_id: `req_${jobId}`,
                job_id: jobId,
                jobId: jobId,
                tracking_id: currentJobId, // ID para tracking em tempo real no Supabase
                trackingId: currentJobId,
                user_id: userId,
                userId: userId,
                product_name: formData.nome,
                productName: formData.nome,
                timestamp: new Date().toISOString(),
                images: standardImages,
                seo: { descricao: formData.descricao_curta || '' },
                marketing: { texto_marketing: '' },
                metadata: {
                  package: packageId,
                  type: 'padrao',
                  type_key: key
                },
                unified_context: unifiedContext || null
              };
            }

            jobsToExecute.push({ key, url, body });

          } catch (innerErr) {
            console.error(`Erro ao montar corpo para ${key}:`, innerErr);
          }
        }

        // 3. Inserção em Lote no Banco (Parallel Insert)
        if (dbRecords.length > 0) {
          const { error } = await supabase.from('authorized_jobs').insert(dbRecords);
          if (error) console.error("Erro ao inserir jobs em lote:", error);
          else console.log(`[VisualPackage] ${dbRecords.length} jobs registrados com sucesso.`);
        }

        // 4. Disparo Paralelo dos Webhooks
        console.log(`[VisualPackage] Disparando ${jobsToExecute.length} webhooks em paralelo...`);
        let dispatchCount = 0;

        await Promise.all(jobsToExecute.map(async (job) => {
          try {
            // Retry logic simples
            const response = await fetch(job.url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(job.body)
            });
            if (response.ok) dispatchCount++;
            else console.warn(`Falha webhook ${job.key}: ${response.status}`);
          } catch (e) {
            console.error(`Erro rede webhook ${job.key}:`, e);
          }
        }));

        if (dispatchCount > 0) {
          toast.success(`Pacote iniciado! ${dispatchCount} gerações disparadas.`);
          const expectedTotal = hostedAIImages.length + productImages.length + dispatchCount;
          setGenerationTarget(expectedTotal);

          return new Promise<void>((resolve) => {
            generationResolver.current = resolve;
            setTimeout(() => {
              if (generationResolver.current === resolve) {
                console.warn("Timeout de geração de pacote");
                resolve();
                setGenerationTarget(null);
              }
            }, 180000);
          });
        }

      } catch (err) {
        console.error("Erro geral no processamento do pacote visual:", err);
      }
    }
  };

  // Handler para Iniciar Geração (Botão no form de Input)
  const handleStartGeneration = async () => {
    if (!selectedPackageId) return;

    if (!formData.nome || productImages.length === 0) {
      toast.error('Preencha o nome do produto e adicione imagens.');
      return;
    }

    // Gerar jobId IMEDIATAMENTE para iniciar tracking
    const trackingJobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    setCurrentJobId(trackingJobId);
    console.log('🔗 [handleStartGeneration] JobId de tracking criado:', trackingJobId);

    setWorkflowStep('generating');

    // Encontrar o pacote selecionado antes de setar state
    const pkg = VISUAL_PACKAGES.find(p => p.id === selectedPackageId);
    if (!pkg) return;

    // Configurar contagem inicial e esperada para progresso real
    setInitialImageCount(productImages.length);
    setExpectedTotalImages(pkg.totalImages || 5); // Fallback to 5 if undefined
    setAgentProgress(5); // Iniciar com 5% visual

    setWorkflowStep('generating');

    // Iniciar progressão visual (apenas mensagens, progresso é real agora)
    simulateAgentProgress();

    // 🚀 EXECUÇÃO SEQUENCIAL DE AGENTES (Solicitado pelo usuário)
    // 1. Atlas (Comando Unificado)
    // 2. Lyra (Copywriting)
    // 3. Orion (Geração Visual com Contexto)

    console.log("🚀 [UnifiedGenerator] Disparando agentes de texto (Atlas & Lyra)...");

    // Variáveis para armazenar resultados dos agentes de texto
    let atlasResult = null;
    let lyraResult = null;

    try {
      console.log("📝 [UnifiedGenerator] Executando Step 1 (Atlas)...");
      const success1 = await executeStep1();
      if (success1) {
        // O estado step1.result pode não estar atualizado imediatamente devido ao React
        // Melhor confiar na atualização de estado ou passar retorno, mas executeStep1 retorna boolean
        // Vamos pegar do setN8nUnifiedResult que é síncrono no fluxo de dados? Não, é state.
        // Vamos modificar o executeStep1 para retornar DADOS?
        // POR ENQUANTO: Vamos assumir que se deu sucesso, o webhook backend disparou e o payload será construído.
        // REFS: executeStep1 seta state step1.result.
        // HACK: Aguardar um tick para garantir state update ou confiar no fluxo interno?
        // Melhor: executeStep1 salvar em uma ref temporária ou a gente modificar executeStep1 para retornar os dados.
        // Como não alterei executeStep1 para retornar dados, vou confiar na ref ou pegar do state na próxima render? 
        // Não, preciso passar para handleGeneratePackage AGORA.
      } else {
        console.warn("⚠️ [UnifiedGenerator] Atlas falhou ou foi pulado.");
      }
    } catch (e) { console.error("[UnifiedGenerator] Erro no Atlas:", e); }

    try {
      console.log("📝 [UnifiedGenerator] Executando Step 2 (Lyra)...");
      const success2 = await executeStep2();
    } catch (e) { console.error("[UnifiedGenerator] Erro na Lyra:", e); }

    // Hack para pegar os resultados FRESH dos states (pode não estar atualizado no mesmo ciclo)
    // Para resolver isso DE VERDADE, o ideal seria executeStep1 retornar os dados.
    // Mas, dado o tempo, vamos passar o que tivermos nos states "n8nUnifiedResult" e "n8nCopywritingResult".
    // No entanto, closures do React podem ter valores antigos aqui.
    // SOLUÇÃO ROBUSTA: Passar uma função de callback para os steps ou refatorar steps.
    // PALIATIVO SEGURO: Usar um pequeno delay ou Refs.
    // Vamos usar os valores atuais de referência se possível? 
    // Como os steps setam estado, vou tentar ler desses estados.

    // Pequeno delay para garantir que React processe os updates de estado (não é perfeito mas ajuda)
    await new Promise(r => setTimeout(r, 500));

    // Chamar a função de geração visual passando os contextos ACUMULADOS
    // Nota: Como n8nUnifiedResult é state, dentro desta função ele pode ser o valor antigo.
    // O correto seria modificar executeStep1 para retornar o objeto data.

    // VAMOS MODIFICAR O executeStep1 LOGO ABAIXO PARA RETORNAR DADOS E NÂO SÓ BOOLEAN? 
    // Não posso editar o arquivo todo de novo.
    // Vou confiar que os webhooks de mágica serão disparados.
    // Espera, handleGeneratePackage recebe contexts. Se eu passar null, ele manda sem contexto.

    // IMPORTANTE: O usuário pediu para que os webhooks de mágica SÓ FOSSEM CHAMADOS APÓS OS DE CONTÉUDO.
    // Isso já está garantido pelos awaits acima.

    // Sobre passar o contexto: Se não tiver o dado aqui, o webhook mágica vai sem contexto extra.
    // Mas o n8n do cliente provavelmente ESPERA esse contexto.

    // Vamos passar n8nUnifiedResult e n8nCopywritingResult (acessando via state do componente).
    await handleGeneratePackage(selectedPackageId, pkg, n8nUnifiedResult, n8nCopywritingResult);
  };

  // Simulação de Progresso dos Agentes
  const [agentProgress, setAgentProgress] = useState(0);
  const [currentAgent, setCurrentAgent] = useState('');

  const simulateAgentProgress = () => {
    const agents = [
      'Atlas analisando estratégia...',
      'Lyra criando design...',
      'Orion escalando variações...',
      'Lucy finalizando detalhes...'
    ];
    let step = 0;
    setCurrentAgent(agents[0]);

    const interval = setInterval(() => {
      step++;
      if (step < agents.length) {
        setCurrentAgent(agents[step]);
      } else {
        clearInterval(interval);
      }
    }, 2000); // Apenas troca as mensagens dos agentes
  };

  // Função para baixar todo o kit gerado (apenas imagens novas)
  const handleDownloadAll = async () => {
    const newImages = productImages.slice(initialImageCount);
    if (newImages.length === 0) {
      toast.error("Nenhuma imagem gerada para baixar.");
      return;
    }

    toast.info(`Baixando ${newImages.length} imagens...`);

    let downloadedCount = 0;
    for (let i = 0; i < newImages.length; i++) {
      try {
        const response = await fetch(newImages[i]);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().slice(0, 10);
        link.download = `${(formData.nome || 'produto').replace(/\s+/g, '_')}_${i + 1}_${timestamp}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        downloadedCount++;
        await new Promise(resolve => setTimeout(resolve, 800)); // Delay maior para evitar bloqueio
      } catch (e) {
        console.error("Erro no download:", e);
      }
    }

    if (downloadedCount > 0) {
      toast.success(`${downloadedCount} imagens baixadas com sucesso!`);
      setHasDownloaded(true);
    } else {
      toast.error("Falha ao baixar imagens.");
    }
  };

  // Failsafe: Download Automático se não houver ação em 5 minutos
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (workflowStep === 'results' && agentProgress >= 100 && !hasDownloaded) {
      console.log("ðŸ•’ [FAILSAFE] Iniciando timer de seguranÃ§a para download automÃ¡tico (5min)...");
      timer = setTimeout(() => {
        if (!hasDownloaded) {
          console.log("ðŸš¨ [FAILSAFE] Tempo esgotado! Iniciando download automÃ¡tico de seguranÃ§a.");
          toast.warning("Iniciando download automÃ¡tico de seguranÃ§a...", { duration: 5000 });
          handleDownloadAll();
        }
      }, 5 * 60 * 1000); // 5 minutos
    }
    return () => clearTimeout(timer);
  }, [workflowStep, agentProgress, hasDownloaded, productImages.length]);

  // Monitorar PROGRESO REAL baseada na chegada de novas imagens
  useEffect(() => {
    if (workflowStep === 'generating') {
      const currentNewImages = Math.max(0, productImages.length - initialImageCount);

      // Calcular progresso: (imagens novas / total esperado) * 100
      // Math.min para não passar de 100 se gerar mais (bônus)
      const calculatedProgress = Math.min(100, Math.round((currentNewImages / expectedTotalImages) * 100));

      // Apenas atualizar se for maior que o atual (para não voltar)
      // E garantir que chegue a 100% se passar do total
      setAgentProgress(prev => Math.max(prev, calculatedProgress));

      // Se completou, esperar um pouco e ir para Results
      if (calculatedProgress >= 100) {
        const timer = setTimeout(() => {
          setWorkflowStep('results');
          setShowCompletionModal(true); // Abrir modal de parabéns
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [productImages.length, initialImageCount, expectedTotalImages, workflowStep]);

  return (
    <SafeErrorBoundary>
      <ProductDetailsLayout>
        <div className="space-y-8 min-h-[600px]">
          {/* HEADER CONTROLS (Novo Cabeçalho Unificado) */}
          {/* HEADER CONTROLS (Novo Cabeçalho Unificado) */}
          <div className="bg-gradient-to-r from-violet-600 to-orange-500 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-violet-200/50 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner border border-white/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Gerador Unificado de Anúncios
                </h1>
                <p className="text-xs text-white/80 hidden sm:block">
                  Todas as ferramentas de criação de anúncios em um só lugar
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (window.confirm("Tem certeza que deseja limpar tudo?")) {
                    setWorkflowStep('selection');
                    setProductImages([]);
                    setInitialImageCount(0);
                    setExpectedTotalImages(5);
                    setAgentProgress(0);
                    setHidePackages(false);
                    setHasDownloaded(false);
                    sessionStorage.removeItem('unified_ad_workflow_step');
                    toast.success("Novo produto iniciado!");
                  }
                }}
                className="text-white/70 hover:text-white hover:bg-white/10"
                title="Limpar e Iniciar Novo"
              >
                <Trash2 className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setWorkflowStep('selection');
                  setProductImages([]);
                  setInitialImageCount(0);
                  setExpectedTotalImages(5);
                  setAgentProgress(0);
                  setHidePackages(false);
                  setHasDownloaded(false);
                  sessionStorage.removeItem('unified_ad_workflow_step');
                  toast.success("Novo produto iniciado!");
                }}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 border-white/30 shadow-none gap-2 whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Novo Produto
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfig(!showConfig)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 border-white/30 shadow-none gap-2 whitespace-nowrap"
              >
                <Settings className="w-3.5 h-3.5" />
                Opções
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={handleDownloadAll}
                className="bg-white text-violet-600 hover:bg-white/90 border-0 shadow-md gap-2 whitespace-nowrap font-bold"
                disabled={productImages.length <= initialImageCount}
              >
                <Package className="w-3.5 h-3.5" />
                Baixar Kit Completo
              </Button>

              <div className="pl-2 border-l border-white/20">
                <CreditsCompactBadge
                  creditsAvailable={usage?.enhancements_available || 0}
                  creditsUsed={usage?.enhancements_used || 0}
                />
              </div>
            </div>
          </div>

          {/* BOTÃO MÁGICO DE AGENTES (Fica no topo para acesso rápido se dados preenchidos) */}


          {/* STEP 1: SELECTION & VISUAL PACKAGES */}
          {/* STEP 1: SELECTION & VISUAL PACKAGES (ALWAYS VISIBLE, DISABLED DURING GENERATION) */}
          {/* STEP 1: SELECTION & VISUAL PACKAGES (ALWAYS VISIBLE, DISABLED DURING GENERATION) */}
          <div className={cn(
            "transition-all duration-500",
            (workflowStep === 'generating' || workflowStep === 'results') ? 'pointer-events-none opacity-50' : '',
            hidePackages && 'hidden'
          )}>
            <VisualPackageCards
              onGeneratePackage={handleGeneratePackage}
              className=""
              onSelect={handlePackageSelect}
              selectedPackageId={selectedPackageId}
            />
          </div>

          {/* STEP 2: INPUT FORM (Side-by-Side) */}
          {workflowStep === 'input' && (
            <div id="product-form-section" className="animate-in fade-in slide-in-from-bottom-10 duration-500">
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" onClick={handleBackToSelection} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">← </div>
                  Voltar para seleção
                </Button>
                <h2 className="text-2xl font-bold gradient-text">Detalhes do Produto</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LEFT COLUMN: IMAGES */}
                <div className="space-y-4">
                  <Card className="glass-effect shadow-md h-full">
                    <CardHeader>
                      <CardTitle className="text-lg">1. Imagens do Produto</CardTitle>
                    </CardHeader>
                    <CardContent className="h-full">
                      <ProductImagesGrid
                        images={productImages}
                        productName={formData.nome || 'Produto'}
                        productId={productId}
                        onImagesUploaded={handleImagesUploaded}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* RIGHT COLUMN: FORM & ACTION */}
                <div className="space-y-6">
                  <Card className="glass-effect p-6 shadow-xl border-t-4 border-t-violet-500 h-full flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold mb-1">2. Informações Chave</h3>
                      <p className="text-xs text-muted-foreground">Obrigatório preencher para a IA trabalhar.</p>
                    </div>

                    <div className="flex-1">
                      <ProductFormContent
                        product={product}
                        isEditing={true}
                        formData={formData}
                        onFormDataChange={handleFormDataChange}
                        onUpdateDescription={handleUpdateDescription}
                        isAutomationRunning={isAutomationRunning}
                        automationStep={automationStep}
                        copywritingData={copywritingData}
                        unifiedCommandsData={unifiedCommandsData}
                        onExecuteWebhookComando={executeStep1}
                        onExecuteWebhookCopywriting={executeStep2}
                      />
                    </div>

                    <div className="mt-8 pt-6 border-t">
                      <Button
                        className="w-full h-16 text-lg font-bold shadow-xl transition-all hover:scale-[1.02] hover:brightness-110 flex items-center justify-center gap-3 relative overflow-hidden group text-white"
                        style={{
                          backgroundColor: selectedPackageId
                            ? VISUAL_PACKAGES.find(p => p.id === selectedPackageId)?.glowColor
                            : 'hsl(270, 100%, 50%)',
                          boxShadow: selectedPackageId
                            ? `0 10px 40px -10px ${VISUAL_PACKAGES.find(p => p.id === selectedPackageId)?.glowColor}`
                            : '0 10px 40px -10px hsl(270, 100%, 50%)'
                        }}
                        onClick={handleStartGeneration}
                        disabled={agentProgress > 0 || !formData.nome.trim() || productImages.length === 0 || !selectedPackageId}
                      >
                        <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <Sparkles className="w-6 h-6 animate-pulse" />
                        <span className="flex flex-col items-center leading-tight">
                          <span>GERAR A MÁGICA AGORA</span>
                          {selectedPackageId && (
                            <span className="text-sm opacity-90 font-medium">
                              {VISUAL_PACKAGES.find(p => p.id === selectedPackageId)?.name}
                            </span>
                          )}
                        </span>
                      </Button>

                      <p className="text-xs text-center text-muted-foreground mt-3 flex items-center justify-center gap-1">
                        <Rocket className="w-3 h-3" />
                        Ao clicar, nossos 4 agentes iniciarão o processo criativo.
                      </p>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* COMBINED STEP: GENERATING & RESULTS (Replaces Input Form) */}
          {(workflowStep === 'generating' || workflowStep === 'results') && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 min-h-[600px]">

              {/* PROGRESS SECTION (Always visible during generation, or if we want to show it completed) */}
              {(workflowStep === 'generating' || (workflowStep === 'results' && agentProgress < 100)) && (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <div className="max-w-md w-full mx-auto space-y-8 relative">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-violet-500/30 blur-[50px] rounded-full scale-150 animate-pulse" />
                      <div className="relative z-10 bg-background/50 backdrop-blur-md rounded-full p-6 inline-block shadow-2xl border border-violet-500/30">
                        {(() => {
                          let avatarSrc = null;
                          if (currentAgent.includes('Atlas')) avatarSrc = '/avatars/avatar_tech_hero_hd_1769790952016.png';
                          else if (currentAgent.includes('Lyra')) avatarSrc = '/avatars/avatar_brand_fairy_1769787230816.png';
                          else if (currentAgent.includes('Orion')) avatarSrc = '/avatars/avatar_expert_fox_1769787204234.png';
                          else if (currentAgent.includes('Lucy')) avatarSrc = '/avatars/avatar_gamer_girl_hd_1769790965756.png';

                          if (avatarSrc) {
                            return (
                              <div className="relative">
                                <img
                                  src={avatarSrc}
                                  alt={currentAgent}
                                  className="w-32 h-32 rounded-full object-cover animate-in fade-in zoom-in duration-500 border-4 border-white/50 shadow-inner"
                                />
                                <div className="absolute -bottom-2 -right-2 bg-violet-600 rounded-full p-2 border-4 border-white">
                                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                                </div>
                              </div>
                            );
                          }
                          return <Loader2 className="w-16 h-16 text-violet-500 animate-spin" />;
                        })()}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-indigo-500">
                        {currentAgent || 'Processando...'}
                      </h3>
                      <Progress value={agentProgress} className="h-2 w-full bg-secondary" />
                      <p className="text-sm text-muted-foreground font-medium animate-pulse">
                        {agentProgress < 100
                          ? `Criando variações visuais... (${Math.max(0, productImages.length - initialImageCount)}/${expectedTotalImages})`
                          : 'Finalizando...'}
                      </p>
                    </div>

                    {/* Tracking em tempo real do n8n via Supabase - SEMPRE visível durante geração */}
                    <div className="mt-6 w-full">
                      <WorkflowProgressTracker
                        sessionId={currentJobId || ''}
                        title="Aguardando servidor responder"
                        showHeader={true}
                        compact={false}
                        timeoutMs={300000} // 5 minutos para teste - VOLTAR para 45000 depois
                        className="bg-white/80 backdrop-blur-sm shadow-lg"
                        onTimeout={() => {
                          toast.error("Servidor sobrecarregado. Tente novamente mais tarde.");
                          setWorkflowStep('selection');
                          setSelectedPackageId(null);
                          setCurrentJobId(null); // Limpar jobId ao dar timeout
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* HEADING (Visible only when done or when images appear?) */}
              {workflowStep === 'results' && agentProgress >= 100 && (
                <div className="text-center space-y-4 animate-in slide-in-from-bottom-5 duration-700">
                  <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 px-4 py-1.5 text-sm border-green-200">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Geração Concluída!
                  </Badge>
                  <h2 className="text-4xl font-bold tracking-tight text-slate-900">Seus Anúncios Estão Prontos</h2>
                  <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Confira abaixo as variações criadas pelos agentes. Você pode baixar individualmente ou em pacote.
                  </p>
                  <Button
                    onClick={handleNewProduct}
                    className="gap-3 rounded-full mt-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-lg font-bold px-10 py-7 h-auto border-0 ring-4 ring-emerald-100"
                  >
                    <Plus className="w-6 h-6 stroke-[3]" />
                    Criar Novo Anúncio Profissional
                  </Button>
                </div>
              )}

              {/* Galeria Principal de Resultados (Exibe assim que tiver imagens NOVAS) */}
              {(productImages.length > initialImageCount) && (
                <div className="bg-white rounded-3xl shadow-sm border p-6 animate-in slide-in-from-bottom-10 duration-700 delay-150">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Image className="w-5 h-5 text-violet-600" />
                        Galeria de Imagens Geradas
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Todas as imagens criadas pelos agentes aparecem aqui.
                      </p>
                    </div>
                  </div>

                  <GeneratedImageGallery
                    images={productImages.slice(initialImageCount).map((url, idx) => ({
                      imageUrl: url,
                      mimeType: 'image/png',
                      generatedAt: new Date().toISOString(),
                      productName: formData.nome || 'Produto',
                      sceneType: `Variação ${idx + 1}`
                    }))}
                    isGenerating={false}
                    onClearImages={() => { }}
                  />

                  {/* ESTRATÉGIA & COPYWRITING (ABAIXO DA GALERIA) */}
                  <div className="mt-8 animate-in slide-in-from-bottom-10 duration-700 delay-300">
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm">
                      <div className="mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                          <Brain className="w-5 h-5 text-violet-600" />
                          Estratégia & Copywriting
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Análise estratégica gerada pelos agentes Atlas e Lyra.
                        </p>
                      </div>

                      <CompactAIDescriptionEnhancer
                        productName={formData.nome}
                        shortDescription={formData.descricao_curta}
                        onUpdateDescription={(type, value) => {
                          if (type === 'short') {
                            setFormData(prev => ({ ...prev, descricao_curta: value }));
                            toast.success('Descrição atualizada!');
                          }
                        }}
                        copywritingData={n8nCopywritingResult ? { content: typeof n8nCopywritingResult.content === 'string' ? n8nCopywritingResult.content : JSON.stringify(n8nCopywritingResult), timestamp: Date.now() } : null}
                        externalUnifiedData={n8nUnifiedResult}
                        // Webhook props
                        onExecuteWebhookComando={executeStep1}
                        onExecuteWebhookCopywriting={executeStep2}
                        isLoadingComando={step1.status === 'running'}
                        isLoadingCopywriting={step2.status === 'running'}
                        webhookComandoConfigured={!!webhookComandoUnificado}
                        webhookCopywritingConfigured={!!webhookCopywriting}
                      />
                    </div>
                  </div>

                  {/* BOTÃO GIGANTE DE DOWNLOAD - Só aparece quando terminar e tiver novas imagens */}
                  {workflowStep === 'results' && agentProgress >= 100 && (
                    <div className="mt-12 flex flex-col items-center animate-in slide-in-from-bottom-5 duration-1000 delay-500">
                      <Button
                        onClick={handleDownloadAll}
                        className="w-full max-w-2xl h-24 text-2xl font-black uppercase tracking-wider bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:scale-105 transition-all duration-300 shadow-[0_0_40px_-5px_rgba(249,115,22,0.6)] animate-pulse border-4 border-white/20 rounded-2xl"
                      >
                        <div className="flex flex-col items-center">
                          <span className="flex items-center gap-3">
                            <Download className="w-8 h-8" />
                            BAIXAR KIT COMPLETO AGORA
                          </span>
                          <span className="text-sm font-normal normal-case opacity-90 mt-1">
                            (Faça o download antes que os links expirem)
                          </span>
                        </div>
                      </Button>
                      <p className="text-center text-muted-foreground/60 text-xs mt-3 max-w-md">
                        Por segurança e privacidade, as imagens geradas não são mantidas em nossos servidores por muito tempo. Salve-as agora.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MODAL DE CONCLUSÃO (PARABÉNS) */}
          <Dialog open={showCompletionModal} onOpenChange={(open) => {
            setShowCompletionModal(open);
            if (!open) {
              setHidePackages(true); // Ocultar pacotes ao fechar

              // Smooth scroll para a área de resultados
              setTimeout(() => {
                document.querySelector('.bg-slate-50')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 300);
            }
          }}>
            <DialogContent className="sm:max-w-md text-center border-2 border-green-100 shadow-2xl">
              <DialogHeader>
                <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500 shadow-inner">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <DialogTitle className="text-3xl font-bold text-center text-slate-800">Parabéns!</DialogTitle>
                <DialogDescription className="text-center pt-4 text-lg text-slate-600">
                  Seu kit foi gerado com sucesso! 🎉
                </DialogDescription>
              </DialogHeader>

              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 my-2 text-left space-y-2">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-orange-800 text-sm">Atenção: Imagens Temporárias</p>
                    <p className="text-orange-700/80 text-xs mt-1 leading-relaxed">
                      As imagens geradas não ficam salvas em nosso banco de dados. Você deve baixá-las agora para não perdê-las.
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter className="sm:justify-center mt-6 w-full">
                <Button
                  onClick={() => {
                    setShowCompletionModal(false);
                    setHidePackages(true);
                    // Smooth scroll para resultados
                    setTimeout(() => {
                      document.querySelector('.bg-slate-50')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 300);
                  }}
                  className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200"
                >
                  Entendi, ver meus anúncios
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Settings Toggle (Always accessible) */}
          <div className="fixed bottom-4 right-4 z-50">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full shadow-lg bg-background/80 backdrop-blur-sm hover:bg-white hover:scale-110 transition-all border-violet-200"
              onClick={() => setShowConfig(!showConfig)}
            >
              <Settings className={cn("w-5 h-5 transition-transform text-violet-600", showConfig ? "rotate-90" : "")} />
            </Button>
          </div>

          {/* COMPONENTES OCULTOS MAS NECESSÁRIOS PARA LÓGICA */}
          {showConfig && (
            <div className="hidden">
              {/* Manter componentes lógicos montados se necessário, mas ocultos */}
              <N8NWebhooksUI
                webhooks={webhooks}
                onSave={saveWebhook}
                isLoading={isLoading}
              />
            </div>
          )}

        </div>
        {/* Modal de Download (Estilo "Parabéns") */}
        <Dialog open={showDownloadModal} onOpenChange={setShowDownloadModal}>
          <DialogContent className="sm:max-w-xl p-0 overflow-visible bg-transparent border-none shadow-none">
            <div className="bg-white rounded-2xl p-6 shadow-2xl border border-white/20 relative">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-slate-100 transition-colors z-10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce">
                  <Check className="w-8 h-8 text-white stroke-[3]" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Seus Anúncios Estão Prontos!</h2>
                <p className="text-slate-500">Tudo foi gerado e organizado para você.</p>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-pink-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>

                <EbookDownloadButton
                  product={{
                    nome: formData.nome || 'Produto',
                    descricao: formData.descricao,
                    sku: formData.sku
                  }}
                  unifiedData={n8nUnifiedResult}
                  copywritingText={n8nCopywritingResult?.content}
                  images={productImages.map(url => ({ url, type: 'generated' }))}
                  showOptions={false}
                  forceEnabled={true}
                  customTrigger={
                    <button className="relative w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-xl py-4 px-6 shadow-xl transition-all transform hover:-translate-y-1 hover:shadow-2xl flex flex-col items-center justify-center gap-1 group-active:translate-y-0">
                      <div className="flex items-center gap-2 text-xl font-black uppercase tracking-wide">
                        <Download className="w-6 h-6 stroke-[3]" />
                        BAIXAR KIT COMPLETO AGORA
                      </div>
                      <span className="text-xs font-medium text-white/90 bg-black/10 px-3 py-0.5 rounded-full">
                        (Faça o download antes que os links expirem)
                      </span>
                    </button>
                  }
                />
              </div>

              <p className="text-xs text-center text-slate-400 mt-4 max-w-sm mx-auto">
                Por segurança e privacidade, as imagens geradas não são mantidas em nossos servidores por muito tempo. Salve-as agora.
              </p>
            </div>
          </DialogContent>
        </Dialog>

      </ProductDetailsLayout>
    </SafeErrorBoundary>
  );
}
