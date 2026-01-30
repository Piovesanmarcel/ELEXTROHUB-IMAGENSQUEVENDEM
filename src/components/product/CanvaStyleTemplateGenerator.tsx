import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Download, Wand2, Sparkles, Cloud, Images, StopCircle, CheckCircle2, XCircle, GripVertical, ChevronUp, ChevronDown, AlertTriangle, Key, Zap, CheckSquare, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { safeBlobDownload } from '@/utils/safeDownload';
import { useMarketingTemplates } from '@/hooks/useMarketingTemplates';
import { supabase } from '@/integrations/supabase/client';
import { GalleryImageSelector } from './GalleryImageSelector';
import { compressImagesForAI } from '@/utils/imageCompressor';
import { useRunwareTest } from '@/hooks/useRunwareTest';
import { useGeminiApiKeys } from '@/hooks/useGeminiApiKeys';
import { processImagesToHttps } from '@/utils/uploadBlobToStorage';
import { useCanvaTemplateN8N } from '@/hooks/useCanvaTemplateN8N';
import { N8NWebhookConfig } from '@/components/n8n/N8NWebhookConfig';

const supabaseClient = supabase;

// ⚡ Configurações de paralelização SEGURA (respeitando rate limits do Gemini)
const MAX_CONCURRENT_GENERATIONS = 2;  // Máximo 2 simultâneas (free tier safe)
const STAGGER_DELAY_MS = 6000;         // 6s entre cada início
const RETRY_BACKOFF_BASE = 8000;       // 8s base para retry de 429
const MAX_RETRIES_429 = 3;             // Máximo de retries para erro 429

// Tipo para estado de progresso batch
interface BatchProgressState {
  isRunning: boolean;
  current: number;
  total: number;
  currentName: string;
  phase: 'idle' | 'generating' | 'hosting' | 'waiting';
  successCount: number;
  failCount: number;
  startTime: number;
  estimatedRemaining: number | null;
}

// Funções utilitárias para tempo estimado
const calculateEstimatedTime = (startTime: number, completed: number, total: number): number | null => {
  if (completed === 0) return null;
  const elapsed = Date.now() - startTime;
  const avgPerItem = elapsed / completed;
  const remaining = (total - completed) * avgPerItem;
  return remaining;
};

const formatTime = (ms: number | null): string => {
  if (ms === null) return '--:--';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSecs = seconds % 60;
  return `${minutes}:${remainingSecs.toString().padStart(2, '0')}`;
};

interface CanvaStyleTemplateGeneratorProps {
  productId: string;
  productName: string;
  aiImages: string[];
  unifiedData: any;
  logoUrl?: string;
}

export const CanvaStyleTemplateGenerator = ({
  productId,
  productName,
  aiImages,
  unifiedData,
  logoUrl
}: CanvaStyleTemplateGeneratorProps) => {
  const [generatedImages, setGeneratedImages] = useState<Map<string, string>>(new Map());
  const [generatingTemplates, setGeneratingTemplates] = useState<Set<string>>(new Set());
  const [savingImages, setSavingImages] = useState<Set<string>>(new Set());
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>([]);
  const [galleryDialogOpen, setGalleryDialogOpen] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Geral 01');
  const [promptMode, setPromptMode] = useState<'complete' | 'reduced' | 'minimal'>('complete');
  
  // 🚀 Performance: Estados para lazy loading
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  
  // 🆕 Estado para seleção de templates
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());

  // 🆕 Estados para progresso em batch e cancelamento
  const [batchProgress, setBatchProgress] = useState<BatchProgressState>({
    isRunning: false,
    current: 0,
    total: 0,
    currentName: '',
    phase: 'idle',
    successCount: 0,
    failCount: 0,
    startTime: 0,
    estimatedRemaining: null,
  });
  const cancelRef = useRef(false);
  
  // ⚡ Estado e ref para controle de concorrência paralela
  const [activeGenerations, setActiveGenerations] = useState(0);
  const activeGenerationsRef = useRef(0);
  
  // 🚨 Estado para modal de limite diário atingido
  const [showQuotaLimitModal, setShowQuotaLimitModal] = useState(false);

  // 🔑 Hook para gerenciar múltiplas API keys
  const { 
    apiKeys, 
    selectedKeyId, 
    setSelectedKeyId, 
    getAvailableKeys, 
    markKeyAsExhausted 
  } = useGeminiApiKeys();

  // 🆕 Hook e estado para integração n8n
  const { 
    webhookUrl,
    setWebhookUrl,
    generateTemplate: generateN8N, 
    jobStatus: n8nJobStatus,
    isLoadingUser,
    userId: n8nUserId
  } = useCanvaTemplateN8N();
  const [testingN8NTemplate, setTestingN8NTemplate] = useState<string | null>(null);

  // Debug log para estado de autenticação
  useEffect(() => {
    console.log('🔍 [CanvaStyleTemplateGenerator] Estado auth:', {
      isLoadingUser,
      userId: n8nUserId ? `${n8nUserId.substring(0, 8)}...` : 'null',
      webhookUrl: webhookUrl ? '✅ configurado' : '❌ não configurado',
      aiImages: aiImages.length,
    });
  }, [isLoadingUser, n8nUserId, webhookUrl, aiImages.length]);


  // Função de cancelamento
  const handleCancelBatch = () => {
    cancelRef.current = true;
    toast.warning('⚠️ Cancelando operação... Aguarde a tarefa atual terminar.');
  };

  // 🆕 Função para testar geração via n8n
  const handleTestN8N = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) {
      toast.error('Template não encontrado');
      return;
    }
    
    if (!webhookUrl) {
      toast.error('Configure a URL do webhook n8n acima antes de testar.');
      return;
    }

    // Prioridade: galeria selecionada > imagens AI
    const imagesToUse = selectedGalleryImages.length > 0 
      ? selectedGalleryImages 
      : aiImages;
    
    if (imagesToUse.length === 0) {
      toast.error('Nenhuma imagem disponível. Faça upload de imagens acima ou selecione da galeria.');
      return;
    }

    setTestingN8NTemplate(templateId);
    
    try {
      const result = await generateN8N(
        template,
        {
          name: productName,
          description: unifiedData?.description || '',
          benefits: unifiedData?.benefits || [],
          callToAction: unifiedData?.callToAction || 'Compre Agora',
        },
        imagesToUse.slice(0, 5),
        {
          quality: 'HD',
          promptMode: promptMode,
          incluir_logo: !!logoUrl,
          logo_url: logoUrl,
        }
      );
      
      if (result.success && result.imageUrl) {
        let finalUrl = result.imageUrl;
        
        // ✅ Aplicar upscale 2x com Runware antes de salvar na galeria
        console.log('📈 [N8N-Canva→UPSCALE] Aplicando upscale 2x na imagem...');
        toast.info('🔍 Fazendo upscale 2x da imagem...');
        
        try {
          const upscaleResult = await upscaleImage(result.imageUrl, 2, 'runware:503@1', 85);
          
          if (upscaleResult?.success && upscaleResult?.data?.[0]?.imageURL) {
            const upscaledUrl = upscaleResult.data[0].imageURL;
            console.log('✅ [N8N-Canva→UPSCALE] Upscale 2x concluído:', upscaledUrl);
            toast.success('✅ Upscale 2x aplicado com sucesso!');
            
            // ✅ NOVO: Converter para 1024x1024 mantendo qualidade
            console.log('📐 [N8N-Canva→RESIZE] Convertendo para 1024x1024...');
            toast.info('📐 Convertendo para 1024x1024...');
            
            const { resizeAndValidateImage } = await import('@/utils/image-resizer-unified');
            const resized = await resizeAndValidateImage(upscaledUrl, 1024, 1024);
            finalUrl = resized.blobUrl;
            
            console.log(`✅ [N8N-Canva→RESIZE] Concluído: ${resized.width}x${resized.height}, ${resized.sizeKB}KB`);
            toast.success(`✅ Imagem 1024x1024 (${resized.sizeKB}KB)`);
          } else {
            console.warn('⚠️ [N8N-Canva→UPSCALE] Resultado inesperado, usando original:', upscaleResult);
          }
        } catch (upscaleError) {
          console.warn('⚠️ [N8N-Canva→UPSCALE] Falha no upscale/resize, usando imagem original:', upscaleError);
        }
        
        // Disparar evento para sincronizar com galeria do produto (com imagem upscalada e redimensionada)
        window.dispatchEvent(new CustomEvent('hostedImageSaved', {
          detail: {
            url: finalUrl,
            hostedUrl: finalUrl,
            imageId: `n8n-template-${templateId}-${Date.now()}`,
            productId,
            source: 'n8n-canva-template',
            tags: [`template:${template.name}`, 'n8n-generated', 'upscaled-2x', '1024x1024']
          }
        }));
        
        toast.success(`✅ Imagem do n8n salva na galeria do produto!`);
      }
    } finally {
      setTestingN8NTemplate(null);
    }
  };

  // Carregar templates dinâmicos do banco (APENAS)
  const { templates, isLoading: isLoadingDb, reorderTemplates } = useMarketingTemplates();
  
  // 🆕 Estados para Drag & Drop
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  // 🆕 Handlers para Drag & Drop
  const handleDragStart = (e: React.DragEvent, templateId: string) => {
    setDraggedId(templateId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', templateId);
  };

  const handleDragOver = (e: React.DragEvent, templateId: string) => {
    e.preventDefault();
    if (templateId !== draggedId) {
      setDragOverId(templateId);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    
    setIsReordering(true);
    
    // Reordenar array local
    const newOrder = [...filteredTemplates];
    const dragIndex = newOrder.findIndex(t => t.id === draggedId);
    const dropIndex = newOrder.findIndex(t => t.id === targetId);
    
    const [removed] = newOrder.splice(dragIndex, 1);
    newOrder.splice(dropIndex, 0, removed);
    
    // Salvar nova ordem no banco
    await reorderTemplates(newOrder.map(t => t.id));
    
    setDraggedId(null);
    setDragOverId(null);
    setIsReordering(false);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  // 🆕 Mover template com botões de setas
  const moveTemplate = async (templateId: string, direction: 'up' | 'down') => {
    const currentIndex = filteredTemplates.findIndex(t => t.id === templateId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === filteredTemplates.length - 1)
    ) {
      return; // Já está no limite
    }
    
    setIsReordering(true);
    
    const newOrder = [...filteredTemplates];
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Trocar posições
    [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
    
    await reorderTemplates(newOrder.map(t => t.id));
    setIsReordering(false);
  };
  
  // Filtrar templates pela categoria selecionada
  const filteredTemplates = templates.filter(t => 
    (t.category || 'Geral 01') === selectedCategory
  );
  
  // 🆕 Limpar seleção ao trocar de categoria
  useEffect(() => {
    setSelectedTemplates(new Set());
  }, [selectedCategory]);
  
  // 🆕 Funções de seleção de templates
  const toggleTemplateSelection = (templateId: string) => {
    setSelectedTemplates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(templateId)) {
        newSet.delete(templateId);
      } else {
        newSet.add(templateId);
      }
      return newSet;
    });
  };
  
  const selectAllTemplates = () => {
    setSelectedTemplates(new Set(filteredTemplates.map(t => t.id)));
  };
  
  const deselectAllTemplates = () => {
    setSelectedTemplates(new Set());
  };
  
  const toggleSelectAll = () => {
    if (selectedTemplates.size === filteredTemplates.length) {
      deselectAllTemplates();
    } else {
      selectAllTemplates();
    }
  };
  
  // Hook de upscale
  const { upscaleImage, isProcessing: isUpscaling } = useRunwareTest();

  const handleGenerateTemplate = async (templateId: string, retryCount = 0): Promise<{ success: boolean; imageUrl?: string }> => {
    const startTime = Date.now();
    const maxRetries = 2;
    
    console.log(`🎨 [${new Date().toISOString()}] Iniciando geração de template:`, templateId, `(tentativa ${retryCount + 1}/${maxRetries + 1})`);
    console.log('📸 Imagens AI disponíveis:', aiImages.length);
    console.log('📝 Dados unificados:', unifiedData ? 'Disponível' : 'Não disponível');
    console.log('🖼️ Imagens da galeria selecionadas:', selectedGalleryImages.length);

    if (!aiImages.length && selectedGalleryImages.length === 0) {
      console.log('❌ Verificação de imagens falhou:');
      console.log('  - aiImages disponíveis:', aiImages.length);
      console.log('  - selectedGalleryImages:', selectedGalleryImages.length);
      console.log('  - aiImages:', aiImages.slice(0, 3));
      toast.error('Nenhuma imagem AI disponível. Gere imagens AI primeiro ou selecione imagens da galeria.');
      return { success: false };
    }

    setGeneratingTemplates(prev => new Set(prev).add(templateId));

    try {
      // STEP 1: Obter usuário autenticado para upload
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return { success: false };
      }

      // STEP 2: Preparar imagens - fazer upload de blob/data para Storage
      // Isso garante que apenas URLs https sejam enviadas para a fila
      const imagesToUse = selectedGalleryImages.length > 0 ? selectedGalleryImages : aiImages;
      const imagesToSend = imagesToUse.slice(0, 3); // Limit to 3 images for AI
      
      console.log(`📸 Preparando ${imagesToSend.length} imagens para envio...`);
      
      // Verificar se há imagens locais (blob/data) que precisam de upload
      const hasLocalImages = imagesToSend.some(url => 
        typeof url === 'string' && (url.startsWith('blob:') || url.startsWith('data:'))
      );
      
      let processedImages: string[];
      
      if (hasLocalImages) {
        console.log('📤 Imagens locais detectadas - fazendo upload para Storage...');
        toast.info('Fazendo upload das imagens...', { duration: 3000 });
        
        try {
          processedImages = await processImagesToHttps(imagesToSend, user.id);
          console.log(`✅ Upload concluído: ${processedImages.length} imagens em URLs https`);
        } catch (uploadError) {
          console.error('❌ Erro no upload de imagens:', uploadError);
          toast.error('Erro ao fazer upload das imagens. Tente novamente.');
          return { success: false };
        }
      } else {
        // Apenas URLs https - usar diretamente
        processedImages = imagesToSend.filter(url => 
          typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))
        );
      }
      
      console.log(`📸 Imagens processadas: ${processedImages.length}/${imagesToSend.length}`);
      
      // Se não houver imagens válidas, mostrar erro
      if (processedImages.length === 0) {
        toast.error('Nenhuma imagem válida encontrada. Faça upload de imagens primeiro.');
        return { success: false };
      }

      // STEP 3: Enfileirar job via queue-image (APENAS URLs https agora)
      console.log('🤖 Enfileirando geração via queue-image...');
      console.log(`📸 Enviando ${processedImages.length} imagens https para processamento`);
      
      const aiStartTime = Date.now();
      
      // Enfileirar o job - agora APENAS com URLs https
      const { data: queueData, error: queueError } = await supabaseClient.functions.invoke('queue-image', {
        body: {
          generationType: 'marketing',
          inputData: {
            templateId,
            productData: {
              productName,
              aiImages: processedImages,  // APENAS URLs https
              unifiedData,
              logoUrl,
              selectedGalleryImages: selectedGalleryImages.length > 0 ? processedImages : undefined
            },
            apiKeyId: selectedKeyId,
            promptMode: promptMode
          }
        }
      });

      if (queueError || !queueData?.success) {
        const errorMsg = queueError?.message || queueData?.error || 'Erro ao enfileirar';
        console.error('❌ Erro ao enfileirar:', errorMsg);
        throw new Error(errorMsg);
      }

      const jobId = queueData.jobId;
      console.log(`✅ Job enfileirado: ${jobId}`);
      toast.info(`⏳ Aguardando processamento...`, { duration: 10000 });

      // STEP 3: Polling para verificar status
      let attempts = 0;
      const maxAttempts = 90; // 90 x 2s = 3 minutos
      const pollInterval = 2000;

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        const { data: statusData, error: statusError } = await supabaseClient.functions.invoke('check-queue-status', {
          body: { jobId }
        });

        if (statusError) {
          console.warn(`⚠️ Erro ao verificar status (tentativa ${attempts + 1}):`, statusError.message);
          attempts++;
          continue;
        }

        const job = statusData?.job;
        
        if (job?.status === 'completed') {
          const aiTime = ((Date.now() - aiStartTime) / 1000).toFixed(2);
          const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⏱️ Tempo de IA: ${aiTime}s | Tempo total: ${totalTime}s`);
          
          // Verificar se há resultado válido
          const result = job.result;
          if (!result?.imageUrl) {
            throw new Error('Resultado sem imagem');
          }

          // Converter base64 para blob URL
          const base64Data = result.imageUrl.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/png' });
          const generatedUrl = URL.createObjectURL(blob);
          
          setGeneratedImages(prev => {
            const newMap = new Map(prev);
            newMap.set(templateId, generatedUrl);
            return newMap;
          });

          toast.success(`🤖 Imagem gerada com sucesso! (${aiTime}s)`, { duration: 5000 });
          return { success: true, imageUrl: generatedUrl };
        }
        
        if (job?.status === 'failed') {
          const errorMsg = job.errorMessage || 'Geração falhou';
          
          // Detectar erro de cota
          const isQuotaError = 
            errorMsg.includes('exceeded your current quota') ||
            errorMsg.includes('Quota exceeded') ||
            errorMsg.includes('RESOURCE_EXHAUSTED') ||
            errorMsg.includes('DAILY_QUOTA_EXCEEDED');
          
          if (isQuotaError) {
            console.error('⚠️ LIMITE DIÁRIO ATINGIDO');
            if (selectedKeyId !== 'default') {
              await markKeyAsExhausted(selectedKeyId);
            }
            setShowQuotaLimitModal(true);
            return { success: false };
          }
          
          throw new Error(errorMsg);
        }

        // Log progresso a cada 10 tentativas
        if (attempts % 10 === 0 && job?.queuePosition) {
          console.log(`⏳ Posição na fila: ${job.queuePosition}`);
        }
        
        attempts++;
      }

      // Timeout - job ainda processando
      throw new Error('Timeout: geração demorou mais de 3 minutos');
    } catch (error) {
      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.error(`❌ [${elapsedTime}s] Erro ao gerar template:`, error);
      
      // Retry logic com exponential backoff
      if (retryCount < maxRetries) {
        const waitTime = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s...
        console.log(`🔄 Tentando novamente em ${waitTime / 1000}s...`);
        toast.warning(`Tentativa falhou, tentando novamente em ${waitTime / 1000}s... (${retryCount + 1}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return handleGenerateTemplate(templateId, retryCount + 1);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ Todas as tentativas falharam:', errorMessage);
      toast.error(`Erro após ${maxRetries + 1} tentativas: ${errorMessage}`);
      return { success: false };
    } finally {
      setIsCompressing(false);
      setGeneratingTemplates(prev => {
        const newSet = new Set(prev);
        newSet.delete(templateId);
        return newSet;
      });
    }
  };

  const handleDownload = async (templateId: string) => {
    const url = generatedImages.get(templateId);
    if (!url) return;

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      await safeBlobDownload(blob, `${productName}-${templateId}.png`);
      toast.success('Download iniciado!');
    } catch (error) {
      console.error('Erro ao baixar:', error);
      toast.error('Erro ao baixar imagem');
    }
  };

  const handleSaveToGallery = async (templateId: string, directUrl?: string) => {
    let url = directUrl || generatedImages.get(templateId);
    if (!url) {
      console.warn(`⚠️ [handleSaveToGallery] Nenhuma URL disponível para template ${templateId}`);
      return;
    }

    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    setSavingImages(prev => new Set(prev).add(templateId));

    try {
      // ========== PASSO 1: UPSCALE 2X COM FALLBACK ROBUSTO ==========
      console.log('🔍 [UPSCALE] Iniciando upscale 2x com runware:503@1, qualidade 85...');
      toast.info('🔍 Fazendo upscale 2x da imagem...', { duration: 5000 });
      
      const upscaleStartTime = Date.now();
      const originalUrl = url; // ✅ Guardar URL original para fallback
      
      try {
        // ✅ Upscale 2x com runware:503@1 e outputQuality: 85
        const upscaleResult = await upscaleImage(url, 2, 'runware:503@1', 85);
        
        if (upscaleResult.success && upscaleResult.data?.[0]?.imageURL) {
          console.log(`✅ Upscale 2x concluído em ${((Date.now() - upscaleStartTime) / 1000).toFixed(2)}s`);
          toast.success(`✅ Upscale 2x concluído!`);
          url = upscaleResult.data[0].imageURL;
        } else {
          // ❌ FALLBACK: Usar imagem original se resultado inválido
          console.warn('⚠️ Upscale falhou (resultado inválido), usando imagem original');
          toast.warning('Upscale falhou, usando imagem original');
          url = originalUrl;
        }
      } catch (upscaleError) {
        // ❌ FALLBACK: Usar imagem original em caso de erro da API
        console.error('❌ Erro no upscale:', upscaleError);
        toast.warning('Erro no upscale, usando imagem original');
        url = originalUrl;
      }

      // ========== PASSO 2: CONVERTER PARA BASE64 ==========
      const response = await fetch(url);
      const blob = await response.blob();
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      const imageBase64 = await base64Promise;

      // ========== PASSO 3: SALVAR NA GALERIA (sem R2) ==========
      console.log('☁️ [GALERIA] Salvando imagem na galeria (sem R2)...');
      toast.info('☁️ Salvando imagem na galeria...', { duration: 3000 });
      
      // Disparar evento para galeria atualizar (sem R2)
      window.dispatchEvent(new CustomEvent('hostedImageSaved', {
        detail: {
          url: url,
          hostedUrl: url,
          imageId: `template-${templateId}-${Date.now()}`,
          productId,
          source: 'canva-template',
          tags: [`template:${template.name}`]
        }
      }));

      toast.success('✅ Imagem salva na galeria!');
      console.log('📢 Evento hostedImageSaved disparado');
    } catch (error) {
      console.error('Erro ao salvar na galeria:', error);
      toast.error(`Erro ao salvar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setSavingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(templateId);
        return newSet;
      });
    }
  };

  const handleGenerateAll = async () => {
    // 🆕 Usar apenas templates selecionados
    const templatesToGenerate = filteredTemplates.filter(t => selectedTemplates.has(t.id));
    
    if (templatesToGenerate.length === 0) {
      toast.warning('Selecione pelo menos um template para gerar');
      return;
    }
    
    console.log(`🚀 Iniciando geração em lote: ${templatesToGenerate.length} templates selecionados`);
    
    // Reset cancelamento e iniciar progresso
    cancelRef.current = false;
    setBatchProgress({
      isRunning: true,
      current: 0,
      total: templatesToGenerate.length,
      currentName: '',
      phase: 'generating',
      successCount: 0,
      failCount: 0,
      startTime: Date.now(),
      estimatedRemaining: null,
    });
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < templatesToGenerate.length; i++) {
      // Verificar cancelamento
      if (cancelRef.current) {
        toast.warning(`⚠️ Operação cancelada após ${i} templates.`);
        break;
      }
      
      const template = templatesToGenerate[i];
      console.log(`📊 Progresso: ${i + 1}/${templatesToGenerate.length} - Template: ${template.name}`);
      
      // Atualizar progresso
      setBatchProgress(prev => ({
        ...prev,
        current: i + 1,
        currentName: template.name,
        phase: 'generating',
        estimatedRemaining: calculateEstimatedTime(prev.startTime, i, templatesToGenerate.length),
      }));
      
      const result = await handleGenerateTemplate(template.id);
      
      if (result.success) {
        successCount++;
        
        // Auto-hospedagem
        setBatchProgress(prev => ({ ...prev, phase: 'hosting', currentName: `Hospedando: ${template.name}` }));
        
        try {
          await handleSaveToGallery(template.id, result.imageUrl);
          console.log(`✅ [AUTO-HOSPEDAGEM] Sucesso: ${template.name}`);
        } catch (error) {
          console.error(`❌ [AUTO-HOSPEDAGEM] Erro ao hospedar ${template.name}:`, error);
        }
      } else {
        failCount++;
      }
      
      // Atualizar contadores
      setBatchProgress(prev => ({
        ...prev,
        successCount,
        failCount,
      }));
      
      // Rate limiting
      if (i < templatesToGenerate.length - 1 && !cancelRef.current) {
        setBatchProgress(prev => ({ ...prev, phase: 'waiting', currentName: 'Aguardando próximo...' }));
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    // Finalizar
    setBatchProgress(prev => ({
      ...prev,
      isRunning: false,
      phase: 'idle',
    }));
    
    console.log(`✅ Geração em lote finalizada: ${successCount} sucesso, ${failCount} falhas`);
    toast.success(`${cancelRef.current ? 'Cancelado' : 'Concluído'}! ${successCount} gerados, ${failCount} falhas`);
  };

  const handleHostAll = async () => {
    const imagesToHost = Array.from(generatedImages.keys()).filter(id => generatedImages.get(id));
    console.log(`☁️ Hospedando ${imagesToHost.length} imagens COM UPSCALE 2X...`);
    toast.info(`🔍 Hospedando ${imagesToHost.length} imagens com upscale 2x...`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < imagesToHost.length; i++) {
      const templateId = imagesToHost[i];
      const template = filteredTemplates.find(t => t.id === templateId);
      
      console.log(`📊 Hospedando ${i + 1}/${imagesToHost.length}: ${template?.name || templateId}`);
      toast.info(`Hospedando ${i + 1} de ${imagesToHost.length}...`, {
        duration: 3000,
      });
      
      try {
        await handleSaveToGallery(templateId);
        successCount++;
      } catch (error) {
        console.error(`❌ Erro ao hospedar ${templateId}:`, error);
        failCount++;
      }
      
      // Small delay between uploads
      if (i < imagesToHost.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`✅ Hospedagem finalizada: ${successCount} sucesso, ${failCount} falhas`);
    toast.success(`Concluído! ${successCount} hospedadas, ${failCount} falhas`);
  };

  // ⚡ Helper: Aguardar slot disponível (semáforo)
  const waitForGenerationSlot = async (): Promise<void> => {
    while (activeGenerationsRef.current >= MAX_CONCURRENT_GENERATIONS) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (cancelRef.current) throw new Error('Cancelled');
    }
    activeGenerationsRef.current++;
    setActiveGenerations(activeGenerationsRef.current);
  };

  // ⚡ Helper: Liberar slot
  const releaseGenerationSlot = () => {
    activeGenerationsRef.current = Math.max(0, activeGenerationsRef.current - 1);
    setActiveGenerations(activeGenerationsRef.current);
  };

  // ⚡ Wrapper com retry inteligente para erro 429
  const generateWithRetry = async (
    templateId: string, 
    templateName: string,
    attempt = 0
  ): Promise<{ success: boolean; imageUrl?: string }> => {
    try {
      return await handleGenerateTemplate(templateId);
    } catch (error: any) {
      const errorMsg = error?.message?.toLowerCase() || '';
      const isRateLimited = errorMsg.includes('429') || 
                            errorMsg.includes('resource_exhausted') ||
                            errorMsg.includes('rate');
      
      if (isRateLimited && attempt < MAX_RETRIES_429) {
        const backoff = Math.pow(2, attempt) * RETRY_BACKOFF_BASE;
        console.log(`⏳ [429 RETRY] Rate limit detectado para ${templateName}, aguardando ${backoff/1000}s...`);
        toast.warning(`Rate limit detectado, aguardando ${backoff/1000}s...`, { duration: backoff });
        await new Promise(r => setTimeout(r, backoff));
        return generateWithRetry(templateId, templateName, attempt + 1);
      }
      console.error(`❌ Falha após ${attempt + 1} tentativas:`, templateName);
      return { success: false };
    }
  };

  // 🆕 NOVA FUNÇÃO: Gerar Todos + Hospedar com PARALELIZAÇÃO SEGURA
  const handleGenerateAllWithHosting = async () => {
    // 🆕 Usar apenas templates selecionados
    const templatesToGenerate = filteredTemplates.filter(t => selectedTemplates.has(t.id));
    
    if (templatesToGenerate.length === 0) {
      toast.warning('Selecione pelo menos um template para gerar');
      return;
    }
    
    console.log(`🚀 [PARALELO SEGURO] Iniciando: ${templatesToGenerate.length} templates selecionados (max ${MAX_CONCURRENT_GENERATIONS} simultâneas, ${STAGGER_DELAY_MS/1000}s stagger)`);
    
    // Reset estados
    cancelRef.current = false;
    activeGenerationsRef.current = 0;
    setActiveGenerations(0);
    
    setBatchProgress({
      isRunning: true,
      current: 0,
      total: templatesToGenerate.length,
      currentName: 'Iniciando geração paralela (modo seguro)...',
      phase: 'generating',
      successCount: 0,
      failCount: 0,
      startTime: Date.now(),
      estimatedRemaining: null,
    });
    
    let successCount = 0;
    let failCount = 0;
    let completedCount = 0;
    const hostingPromises: Promise<void>[] = [];
    
    // Criar promessas com stagger SEGURO (6s entre cada)
    const generationPromises = templatesToGenerate.map((template, index) => {
      return (async () => {
        // Verificar cancelamento antes de iniciar
        if (cancelRef.current) return { template, result: { success: false } };
        
        // Delay escalonado: 0s, 6s, 12s, 18s...
        await new Promise(r => setTimeout(r, index * STAGGER_DELAY_MS));
        
        // Verificar cancelamento após delay
        if (cancelRef.current) return { template, result: { success: false } };
        
        // Aguardar slot disponível (max 2 simultâneas)
        try {
          await waitForGenerationSlot();
        } catch {
          return { template, result: { success: false } };
        }
        
        // Atualizar UI
        setBatchProgress(prev => ({
          ...prev,
          currentName: `Gerando: ${template.name} (${activeGenerationsRef.current}/${MAX_CONCURRENT_GENERATIONS} ativas)`,
        }));
        
        try {
          const result = await generateWithRetry(template.id, template.name);
          
          // Contabilizar resultado
          completedCount++;
          if (result.success && result.imageUrl) {
            successCount++;
            
            // Disparar hospedagem em paralelo (não bloqueia)
            hostingPromises.push(
              handleSaveToGallery(template.id, result.imageUrl)
                .then(() => console.log(`✅ [HOSPEDAGEM] ${template.name}`))
                .catch(err => console.error(`❌ [HOSPEDAGEM] ${template.name}:`, err))
            );
          } else {
            failCount++;
          }
          
          // Atualizar progresso
          setBatchProgress(prev => ({
            ...prev,
            current: completedCount,
            successCount,
            failCount,
            estimatedRemaining: calculateEstimatedTime(prev.startTime, completedCount, templatesToGenerate.length),
          }));
          
          return { template, result };
        } finally {
          releaseGenerationSlot();
        }
      })();
    });
    
    // Aguardar todas as gerações
    await Promise.all(generationPromises);
    
    // Aguardar hospedagens pendentes
    if (hostingPromises.length > 0 && !cancelRef.current) {
      console.log(`⏳ Finalizando ${hostingPromises.length} hospedagens...`);
      setBatchProgress(prev => ({ 
        ...prev, 
        phase: 'hosting', 
        currentName: `Finalizando ${hostingPromises.length} hospedagens...` 
      }));
      await Promise.all(hostingPromises);
    }
    
    // Finalizar
    setBatchProgress(prev => ({
      ...prev,
      isRunning: false,
      phase: 'idle',
    }));
    
    const message = cancelRef.current 
      ? `⚠️ Cancelado! ${successCount} gerados, ${failCount} falhas`
      : `✅ Concluído! ${successCount} gerados e hospedados, ${failCount} falhas`;
    console.log(`✅ [PARALELO SEGURO] ${message}`);
    toast.success(message);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Templates de Marketing Estilo Canva</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Gere imagens profissionais automaticamente com seus dados
          </p>
          <div className="flex items-center gap-2 mt-2">
            {filteredTemplates.length > 0 && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                <Sparkles className="w-3 h-3 mr-1" />
                {filteredTemplates.length} Templates IA do Banco
              </Badge>
            )}
            {selectedGalleryImages.length > 0 && (
              <Badge variant="default" className="bg-green-500">
                <Images className="w-3 h-3 mr-1" />
                {selectedGalleryImages.length} Imagens Selecionadas
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setGalleryDialogOpen(true)}
            className={selectedGalleryImages.length > 0 ? "border-green-400 bg-green-50 hover:bg-green-100" : ""}
          >
            <Images className="w-4 h-4 mr-2" />
            Selecionar Imagens
            {selectedGalleryImages.length > 0 && (
              <Badge variant="default" className="bg-green-500 ml-2 text-xs">
                {selectedGalleryImages.length}
              </Badge>
            )}
          </Button>
          {/* Botões de hospedagem ocultados - R2 removido */}
        </div>
      </div>

      {/* 🔑 Seletor de API Key */}
      <div className="mb-6 flex flex-wrap gap-6">
        <div>
          <Label htmlFor="api-key-select" className="text-base font-semibold mb-2 block flex items-center gap-2">
            <Key className="w-4 h-4" />
            API Key de Geração
          </Label>
          <Select value={selectedKeyId} onValueChange={setSelectedKeyId}>
            <SelectTrigger id="api-key-select" className="w-full max-w-xs">
              <SelectValue placeholder="Selecione a API Key" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">
                🔑 Key Padrão (Sistema)
              </SelectItem>
              {apiKeys.map(key => (
                <SelectItem key={key.id} value={key.id}>
                  {key.is_exhausted ? '⚠️' : '✅'} {key.name}
                  {key.is_exhausted && ' (Exausta)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            {apiKeys.length === 0 
              ? 'Usando key do sistema. Adicione suas keys nas configurações.'
              : `${getAvailableKeys().length} key(s) disponível(is)`
            }
          </p>
        </div>

        <div>
          <Label htmlFor="category-select" className="text-base font-semibold mb-2 block">
            Categoria de Templates
          </Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger id="category-select" className="w-full max-w-xs">
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Geral 01">Geral 01</SelectItem>
              <SelectItem value="Geral 02">Geral 02</SelectItem>
              <SelectItem value="Brinquedos">Brinquedos</SelectItem>
              <SelectItem value="Cafeteiras">Cafeteiras</SelectItem>
              <SelectItem value="Utilidades">Utilidades</SelectItem>
              <SelectItem value="Pet Shop">Pet Shop</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground mt-2">
            {filteredTemplates.length} template(s) disponível(is) nesta categoria
          </p>
        </div>

        {/* 🆕 Seletor de Modo de Prompt */}
        <div>
          <Label htmlFor="prompt-mode-select" className="text-base font-semibold mb-2 block flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Modo de Prompt
          </Label>
          <Select value={promptMode} onValueChange={(v) => setPromptMode(v as 'complete' | 'reduced' | 'minimal')}>
            <SelectTrigger id="prompt-mode-select" className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="complete">
                🎯 Completo Fiel
              </SelectItem>
              <SelectItem value="reduced">
                ⚡ Prompt Reduzido
              </SelectItem>
              <SelectItem value="minimal">
                🔥 Minimalista
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            {promptMode === 'complete' 
              ? 'Inclui posição, cores e estilos exatos' 
              : promptMode === 'reduced'
              ? 'IA interpreta visualmente (menos tokens)'
              : 'Ultra-compacto (economia máxima)'}
          </p>
        </div>
      </div>

      {/* 🆕 Configuração n8n Inline */}
      <N8NWebhookConfig 
        webhookUrl={webhookUrl} 
        onWebhookUrlChange={setWebhookUrl} 
      />


      {isLoadingDb && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
          <p className="text-sm text-muted-foreground mt-2">Carregando templates do banco...</p>
        </div>
      )}

      {/* 🆕 BARRA DE PROGRESSO BATCH */}
      {batchProgress.isRunning && (
        <Card className="border-purple-400 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                <span className="font-medium text-sm">
                  {batchProgress.phase === 'generating' && 'Gerando: '}
                  {batchProgress.phase === 'hosting' && 'Hospedando: '}
                  {batchProgress.phase === 'waiting' && '⏸️ '}
                  {batchProgress.currentName}
                </span>
                {activeGenerations > 0 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {activeGenerations}/{MAX_CONCURRENT_GENERATIONS} ativas
                  </Badge>
                )}
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleCancelBatch}
                className="gap-1"
              >
                <StopCircle className="w-4 h-4" />
                Cancelar
              </Button>
            </div>
            
            <Progress 
              value={(batchProgress.current / batchProgress.total) * 100} 
              className="h-3"
            />
            
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {batchProgress.current} de {batchProgress.total} 
                {' '}({Math.round((batchProgress.current / batchProgress.total) * 100)}%)
              </span>
              <span className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  {batchProgress.successCount}
                </span>
                <span className="flex items-center gap-1 text-red-600">
                  <XCircle className="w-4 h-4" />
                  {batchProgress.failCount}
                </span>
                <span>⏱️ ~{formatTime(batchProgress.estimatedRemaining)}</span>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 🆕 Barra de Seleção de Templates */}
      {filteredTemplates.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleSelectAll}
              className="gap-2"
            >
              {selectedTemplates.size === filteredTemplates.length ? (
                <>
                  <Square className="w-4 h-4" />
                  Desmarcar Todos
                </>
              ) : (
                <>
                  <CheckSquare className="w-4 h-4" />
                  Selecionar Todos
                </>
              )}
            </Button>
            <Badge variant="secondary" className="text-sm">
              {selectedTemplates.size} de {filteredTemplates.length} selecionados
            </Badge>
          </div>
          
          <Button
            onClick={handleGenerateAllWithHosting}
            disabled={selectedTemplates.size === 0 || batchProgress.isRunning}
            className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            {batchProgress.isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Auto-Gerar Selecionados ({selectedTemplates.size})
              </>
            )}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {filteredTemplates.map((template, index) => {
          const isGenerating = generatingTemplates.has(template.id);
          const isSaving = savingImages.has(template.id);
          const generatedUrl = generatedImages.get(template.id);
          const isImageLoaded = loadedImages.has(template.id);
          const isDragging = draggedId === template.id;
          const isDragOver = dragOverId === template.id;
          const isSelected = selectedTemplates.has(template.id);
          const isN8NGenerating = testingN8NTemplate === template.id;

          return (
            <Card 
              key={template.id} 
              draggable={!isReordering && !isGenerating}
              onDragStart={(e) => handleDragStart(e, template.id)}
              onDragOver={(e) => handleDragOver(e, template.id)}
              onDrop={(e) => handleDrop(e, template.id)}
              onDragEnd={handleDragEnd}
              className={cn(
                "overflow-hidden border-purple-300 bg-gradient-to-br from-purple-50/50 to-transparent transition-all cursor-move",
                isDragging && "opacity-50 scale-95",
                isDragOver && "ring-2 ring-purple-500 ring-offset-2",
                isReordering && "pointer-events-none opacity-70",
                isN8NGenerating && "animate-snake-border",
                isSelected && "ring-2 ring-primary ring-offset-2 border-primary"
              )}
            >
              <div className="aspect-square bg-muted relative overflow-hidden">
                {/* 🆕 Checkbox de Seleção */}
                <div className="absolute top-2 right-2 z-20">
                  <div 
                    className={cn(
                      "w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-all",
                      isSelected 
                        ? "bg-primary border-primary text-primary-foreground" 
                        : "bg-background/80 border-muted-foreground/50 hover:border-primary"
                    )}
                    onClick={(e) => { e.stopPropagation(); toggleTemplateSelection(template.id); }}
                  >
                    {isSelected && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                </div>

                {/* Indicador de Drag & Botões de Setas */}
                <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                  <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-md p-1">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={(e) => { e.stopPropagation(); moveTemplate(template.id, 'up'); }}
                      disabled={index === 0 || isReordering}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={(e) => { e.stopPropagation(); moveTemplate(template.id, 'down'); }}
                      disabled={index === filteredTemplates.length - 1 || isReordering}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* 🚀 Skeleton placeholder durante carregamento */}
                {!isImageLoaded && !generatedUrl && template.baseImage && (
                  <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-pulse" />
                )}
                
                {generatedUrl ? (
                  <img 
                    src={generatedUrl} 
                    alt={template.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : template.baseImage ? (
                  <img 
                    src={template.baseImage} 
                    alt={template.name}
                    loading="lazy"
                    onLoad={() => setLoadedImages(prev => new Set(prev).add(template.id))}
                    className={`w-full h-full object-cover opacity-50 transition-opacity duration-300 ${
                      isImageLoaded ? 'opacity-50' : 'opacity-0'
                    }`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Wand2 className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                
                {isGenerating && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}

              </div>

              <div className="p-3 space-y-3">
                <div className="flex items-center justify-end">
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                </div>

                {/* Botão Premium n8n */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleTestN8N(template.id)}
                    disabled={isGenerating || isCompressing || testingN8NTemplate === template.id || !webhookUrl || isLoadingUser}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
                  >
                    {isLoadingUser ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Auth...
                      </>
                    ) : testingN8NTemplate === template.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Gerar Marketing Premium
                      </>
                    )}
                  </Button>
                </div>

                {generatedUrl && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSaveToGallery(template.id)}
                      disabled={isSaving || isUpscaling}
                      className="flex-1"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {isUpscaling ? 'Upscale...' : 'Hospedando...'}
                        </>
                      ) : (
                        <>
                          <Cloud className="w-4 h-4 mr-2" />
                          Hospedar
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(template.id)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>


      <GalleryImageSelector
        open={galleryDialogOpen}
        onOpenChange={setGalleryDialogOpen}
        onConfirm={setSelectedGalleryImages}
        productId={productId}
        maxSelection={10}
        availableImages={aiImages}
      />

      {/* 🚨 Modal de Limite Diário Atingido */}
      {showQuotaLimitModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center animate-in fade-in zoom-in duration-300 border border-border">
            {/* Ícone Grande */}
            <div className="mx-auto w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-10 h-10 text-amber-600 dark:text-amber-500" />
            </div>
            
            {/* Título Grande */}
            <h2 className="text-2xl font-bold text-foreground mb-4">
              ⚠️ Limite Diário Atingido
            </h2>
            
            {/* Mensagem Explicativa */}
            <p className="text-lg text-muted-foreground mb-6">
              O limite diário de geração de imagens com IA foi atingido para a API key atual.
            </p>
            
            {/* 🔑 Opção de trocar de key */}
            {getAvailableKeys().length > 0 ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800 dark:text-green-300 mb-3">
                  ✅ Você tem outras API keys disponíveis! Selecione uma para continuar:
                </p>
                <Select 
                  value={selectedKeyId} 
                  onValueChange={(value) => {
                    setSelectedKeyId(value);
                    setShowQuotaLimitModal(false);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione outra API Key" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedKeyId !== 'default' && (
                      <SelectItem value="default">
                        🔑 Key Padrão (Sistema)
                      </SelectItem>
                    )}
                    {getAvailableKeys()
                      .filter(key => key.id !== selectedKeyId)
                      .map(key => (
                        <SelectItem key={key.id} value={key.id}>
                          ✅ {key.name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                {/* Informação quando não há outras keys */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-6">
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    🕐 O limite é resetado diariamente às 00:00 (horário do servidor).
                    <br />
                    <span className="font-semibold">
                      💡 Dica: Adicione mais API keys nas configurações para ter backups!
                    </span>
                  </p>
                </div>
              </>
            )}
            
            {/* Botão de Fechar */}
            <Button 
              onClick={() => setShowQuotaLimitModal(false)}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 text-lg"
            >
              {getAvailableKeys().length > 0 ? 'Fechar' : 'Entendi'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
