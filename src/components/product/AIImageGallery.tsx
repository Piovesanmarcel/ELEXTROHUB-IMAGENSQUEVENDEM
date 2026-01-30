import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Images, 
  Download,
  Eye, 
  Upload, 
  CheckCircle,
  Loader2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Wand2,
  Camera,
  Palette,
  Cloud,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  ArrowLeftRight,
  Scissors,
  ArrowUpCircle,
  Square,
  ShoppingBag,
  Brain,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useRunwareTest } from '@/hooks/useRunwareTest';
import { useHostedImages } from '@/hooks/useHostedImages';
import { useImageResizer } from '@/hooks/useImageResizer';
import { supabase } from '@/integrations/supabase/client';
import { resizeAndValidateImage } from '@/utils/image-resizer-unified';
import { aiImagesCache } from '@/services/AIImagesSessionCache';
import ManualImageUploader from './ManualImageUploader';

// ✅ FUNÇÃO AUXILIAR: Carregar elemento de imagem
const loadImageElement = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Falha ao carregar: ${url}`));
    img.src = url;
  });
};

// ✅ FUNÇÃO AUXILIAR: Ler dimensões reais do blob
const getBlobDimensions = async (blob: Blob): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Falha ao ler dimensões do blob'));
    };
    
    img.src = url;
  });
};

interface ImageEntry {
  id: string;
  url: string;
  source: string;
  timestamp: number;
  hosted?: boolean;
  hostedUrl?: string;
  originalSource?: string;
  tags?: string[];
  width?: number;
  height?: number;
  fileSize?: number;
}

interface AIImageGalleryProps {
  productId: string;
  productName: string;
}

const SOURCE_CONFIGS = {
  'deepai': {
    name: 'Melhoria com DeepAI',
    icon: Sparkles,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    bgColor: 'bg-purple-50'
  },
  'runware': {
    name: 'IA Avançada - Runware',
    icon: Wand2,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    bgColor: 'bg-blue-50'
  },
  // 'tongyi': { // DESATIVADO TEMPORARIAMENTE
  //   name: 'IA Avançada - Tongyi Wanxiang',
  //   icon: Camera,
  //   color: 'bg-green-100 text-green-800 border-green-200',
  //   bgColor: 'bg-green-50'
  // },
  'gemini-white-background': {
    name: 'Gemini - Fundo Branco',
    icon: Cloud,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    bgColor: 'bg-gray-50'
  },
  'gemini-background': {
    name: 'Gerador de fundo - Gemini AI',
    icon: Palette,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    bgColor: 'bg-orange-50'
  },
  'bfl': {
    name: 'Gerador BFL.ai',
    icon: Images,
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    bgColor: 'bg-indigo-50'
  },
  'stability': {
    name: '🎨 Gerador StabilityAI',
    icon: Palette,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    bgColor: 'bg-purple-50'
  },
  'Fundo': {
    name: 'Gemini AI - Remoção de Fundo',
    icon: Scissors,
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    bgColor: 'bg-emerald-50'
  },
  'Scale': {
    name: 'Gemini AI - Upscale',
    icon: ArrowUpCircle,
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    bgColor: 'bg-teal-50'
  },
  'bfl-white-bg': {
    name: 'BFL.ai - Fundo Branco',
    icon: Square,
    color: 'bg-slate-100 text-slate-800 border-slate-200',
    bgColor: 'bg-slate-50'
  },
  'cloudinary-kit': {
    name: 'Gerador Automático de KITs',
    icon: ShoppingBag,
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    bgColor: 'bg-pink-50'
  },
  'tongyi-wanxiang': {
    name: 'Tongyi Wanxiang (Qwen)',
    icon: Brain,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    bgColor: 'bg-orange-50'
  },
  'runware-upscale': {
    name: 'IA Avançada - Runware',
    icon: Zap,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    bgColor: 'bg-yellow-50'
  },
  'runway': {
    name: 'Runway AI - Gen4',
    icon: Camera,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    bgColor: 'bg-orange-50'
  },
  'showcase': {
    name: 'Showcases de Produto',
    icon: Grid3X3,
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    bgColor: 'bg-emerald-50'
  },
  'gemini-carousel': {
    name: '🍌 Carrossel Gemini (4 Imagens)',
    icon: Camera,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    bgColor: 'bg-yellow-50'
  },
  // Marketing Gatilhos por IA específica
  'marketing-gatilhos-gemini': {
    name: 'Marketing Gatilhos - Gemini AI',
    icon: Brain,
    color: 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 border-purple-200',
    bgColor: 'bg-gradient-to-r from-purple-50 to-indigo-50'
  },
  'marketing-gatilhos-runware': {
    name: 'Marketing Gatilhos - Runware',
    icon: Zap,
    color: 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-200',
    bgColor: 'bg-gradient-to-r from-blue-50 to-cyan-50'
  },
  'marketing-gatilhos-bfl': {
    name: 'Marketing Gatilhos - BFL.ai',
    icon: Images,
    color: 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 border-indigo-200',
    bgColor: 'bg-gradient-to-r from-indigo-50 to-purple-50'
  },
  // Processed images from automation
  'intro-processed': {
    name: 'Introdução Captadora (Processadas)',
    icon: Brain,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    bgColor: 'bg-blue-50'
  },
  'authority-processed': {
    name: 'Dor x Solução (Processadas)',
    icon: Brain,
    color: 'bg-red-100 text-red-800 border-red-200',
    bgColor: 'bg-red-50'
  },
  'benefits-processed': {
    name: 'Benefícios (Processadas)',
    icon: Brain,
    color: 'bg-green-100 text-green-800 border-green-200',
    bgColor: 'bg-green-50'
  },
  'urgency-processed': {
    name: 'Gatilho de Escassez (Processadas)',
    icon: Brain,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    bgColor: 'bg-orange-50'
  },
  'cta-processed': {
    name: 'Chamada para Ação (Processadas)',
    icon: Brain,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    bgColor: 'bg-purple-50'
  },
  'faq-processed': {
    name: 'FAQ Resumidas (Processadas)',
    icon: Brain,
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    bgColor: 'bg-indigo-50'
  },
  'conversion-processed': {
    name: 'Tópicos de Conversão (Processadas)',
    icon: Brain,
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    bgColor: 'bg-emerald-50'
  },
  'features-processed': {
    name: 'Características (Processadas)',
    icon: Brain,
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    bgColor: 'bg-cyan-50'
  },
  // Bucket para capturar outras fontes não reconhecidas
  'outros': {
    name: 'Outros Processados',
    icon: Brain,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    bgColor: 'bg-gray-50'
  },
  // ✅ n8n Workflow Generator
  'n8n': {
    name: 'Gerador n8n Workflow',
    icon: Zap,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    bgColor: 'bg-orange-50'
  }
} as const;

// ⚡ FONTES QUE PRECISAM DE UPSCALE 4X (apenas 4 blocos)
const UPSCALE_SOURCES = [
  'gemini-white-background', // Gemini - Fundo Branco
  'gemini-background',    // Gerador de fundo - Gemini AI
  'bfl',                  // Gerador BFL.ai
  'bfl-white-bg'          // BFL.ai - Fundo Branco
];

// ☁️ FONTES COM HOSPEDAGEM DIRETA (sem upscale) - Todos os outros blocos
const DIRECT_HOST_SOURCES = [
  'runware',              // IA Avançada - Runware (hospedagem direta)
  'deepai',
  'stability',
  'Fundo',
  'Scale',
  'cloudinary-kit',
  'tongyi-wanxiang',
  'runway',
  'showcase',
  'gemini-carousel',
  'runware-upscale', // Hospedagem direta sem upscale
  // Marketing Gatilhos (já são imagens finais processadas)
  'marketing-gatilhos-gemini',
  'marketing-gatilhos-runware',
  'marketing-gatilhos-bfl',
  // Imagens processadas do sistema de automação (já finais)
  'intro-processed',
  'authority-processed',
  'benefits-processed',
  'urgency-processed',
  'cta-processed',
  'faq-processed',
  'conversion-processed',
  'features-processed',
  'outros',
  'n8n' // ✅ n8n Workflow Generator - hospedagem direta
];

// Função auxiliar para carregar metadados de uma imagem
const getImageMetadata = async (url: string): Promise<{ width: number; height: number; fileSize: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = async () => {
      try {
        const width = img.width;
        const height = img.height;
        
        // Tentar obter tamanho do arquivo
        const response = await fetch(url);
        const blob = await response.blob();
        const fileSize = blob.size;
        
        resolve({ width, height, fileSize });
      } catch (error) {
        // Fallback: retornar só dimensões
        resolve({ width: img.width, height: img.height, fileSize: 0 });
      }
    };
    
    img.onerror = () => {
      // Fallback em caso de erro total
      resolve({ width: 0, height: 0, fileSize: 0 });
    };
    
    img.src = url;
  });
};

// Função para formatar tamanho de arquivo
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))}${sizes[i]}`;
};

export const AIImageGallery = ({ productId, productName }: AIImageGalleryProps) => {
  const [allImages, setAllImages] = useState<ImageEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isHosting, setIsHosting] = useState(false);
  const [hostingProgress, setHostingProgress] = useState(0);
  const [hostedImages, setHostedImages] = useState<Set<string>>(new Set());
  
  // Estados para batch upscale
  const [isBatchUpscaling, setIsBatchUpscaling] = useState(false);
  const [upscaleProgress, setUpscaleProgress] = useState(0);
  const [upscaledCount, setUpscaledCount] = useState(0);
  const [upscaleErrors, setUpscaleErrors] = useState(0);
  
  // Estados para processamento por bloco
  const [processingBlock, setProcessingBlock] = useState<string | null>(null);
  const [blockProgress, setBlockProgress] = useState(0);
  const [blockProcessedCount, setBlockProcessedCount] = useState(0);
  
  // Hook para Runware
  const { upscaleImage } = useRunwareTest();
  
  // Hook para hospedagem de imagens
  const { saveHostedImage } = useHostedImages();
  
  // Hook para redimensionamento
  const { resizeImageTo1000x1000, isResizing } = useImageResizer();
  
  // Estados para o carousel
  const [viewMode, setViewMode] = useState<'grid' | 'carousel'>('grid');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);

  // ✅ SISTEMA ANTI-DUPLICAÇÃO - Controle de batches processados
  const [processedBatchIds, setProcessedBatchIds] = useState<Set<string>>(new Set());

  // 💾 CARREGAR IMAGENS DO CACHE AO MONTAR O COMPONENTE
  useEffect(() => {
    console.log('🔄 [CACHE-LOAD] Tentando carregar imagens do cache...');
    
    // Carregar imagens de cada fonte possível
    const allSources = Object.keys(SOURCE_CONFIGS);
    const loadedImages: ImageEntry[] = [];
    
    allSources.forEach(source => {
      const cached = aiImagesCache.loadImages(productId, source);
      if (cached && cached.length > 0) {
        console.log(`✅ [CACHE-LOAD] ${cached.length} imagens restauradas de ${source}`);
        
        // Converter URLs do cache para ImageEntry
        cached.forEach((url, index) => {
          loadedImages.push({
            id: `${source}-cached-${Date.now()}-${index}`,
            url: url,
            source: source,
            timestamp: Date.now(),
            hosted: false,
            tags: ['cache:restored']
          });
        });
      }
    });
    
    if (loadedImages.length > 0) {
      setAllImages(prev => {
        const existingUrls = new Set(prev.map(img => img.url));
        const uniqueLoaded = loadedImages.filter(img => !existingUrls.has(img.url));
        
        if (uniqueLoaded.length > 0) {
          toast.success(`🔄 ${uniqueLoaded.length} imagens restauradas do cache!`);
          return [...prev, ...uniqueLoaded];
        }
        return prev;
      });
    } else {
      console.log('ℹ️ [CACHE-LOAD] Nenhuma imagem em cache para restaurar');
    }
  }, [productId]);

  // 🔄 FUNÇÃO PARA ATUALIZAR/RECARREGAR A GALERIA
  const refreshGallery = useCallback(async () => {
    toast.info('🔄 Atualizando galeria...');
    
    try {
      // ⚡ Buscar imagens recentes do banco com query otimizada
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      const { data: recentImages, error } = await (supabase as any)
        .from('hosted_images')
        .select('id,url,tags,description,original_filename,r2_path,uploaded_at,user_id')
        .eq('user_id', user.id)
        .contains('tags', [`product:${productId}`])
        .order('uploaded_at', { ascending: false })
        .limit(200);
      
      if (error) throw error;
      
      if (recentImages && recentImages.length > 0) {
        console.log(`🔄 [REFRESH] Encontradas ${recentImages.length} imagens no banco`);
        
        // Função auxiliar para extrair source das tags
        const extractSourceFromTags = (tags: string[]): string | null => {
          if (!tags) return null;
          
          const aiSourceTag = tags.find(tag => tag.startsWith('ai-source:'));
          if (aiSourceTag) {
            return aiSourceTag.replace('ai-source:', '');
          }
          
          const originalSourceTag = tags.find(tag => tag.startsWith('original-source:'));
          if (originalSourceTag) {
            return originalSourceTag.replace('original-source:', '');
          }
          
          return null;
        };
        
        // Converter para formato ImageEntry
        const newEntries: ImageEntry[] = recentImages.map(img => ({
          id: img.id,
          url: img.url,
          source: extractSourceFromTags(img.tags) || 'outros',
          timestamp: new Date(img.uploaded_at).getTime(),
          hosted: img.r2_path ? true : false,
          hostedUrl: img.r2_path ? img.url : undefined,
          tags: img.tags || []
        }));
        
        // Atualizar estado com imagens do banco
        setAllImages(prev => {
          const existingUrls = new Set(prev.map(img => img.url));
          const uniqueNewImages = newEntries.filter(img => !existingUrls.has(img.url));
          
          if (uniqueNewImages.length > 0) {
            console.log(`✅ [REFRESH] Adicionando ${uniqueNewImages.length} novas imagens`);
            toast.success(`✅ ${uniqueNewImages.length} novas imagens carregadas!`);
            return [...prev, ...uniqueNewImages];
          } else {
            toast.info('ℹ️ Galeria já está atualizada');
            return prev;
          }
        });
      } else {
        toast.info('ℹ️ Nenhuma imagem nova encontrada');
      }
    } catch (error) {
      console.error('❌ [REFRESH] Erro:', error);
      toast.error('Erro ao atualizar galeria');
    }
  }, [productId]);

  // 🤍 FUNÇÃO PARA FILTRAR E COMPARTILHAR IMAGENS DE FUNDO BRANCO
  const getWhiteBackgroundImages = useCallback(() => {
    const whiteBackgroundSources = ['bfl-white-bg', 'gemini-white-background', 'Fundo', 'Scale', 'runware', 'runware-upscale', 'cloudinary-kit', 'tongyi-wanxiang'];
    return allImages.filter(img => whiteBackgroundSources.includes(img.source));
  }, [allImages]);

  // 🚀 DISPARAR EVENTO PARA KIT GENERATOR COM IMAGENS DE FUNDO BRANCO
  const dispatchWhiteBackgroundToKit = useCallback((newImages: ImageEntry[]) => {
    if (newImages.length > 0) {
      const imageUrls = newImages.map(img => img.url);
      console.log('🤍 [GALERIA → KIT] Enviando imagens de fundo branco para KIT Generator:', imageUrls);
      
      const event = new CustomEvent('whiteBackgroundGalleryToKit', {
        detail: {
          source: 'gallery-white-background',
          images: imageUrls,
          productId: productId,
          batchId: `gallery-white-bg-${Date.now()}`
        }
      });
      
      window.dispatchEvent(event);
      
      const sourceNames = [...new Set(newImages.map(img => 
        SOURCE_CONFIGS[img.source as keyof typeof SOURCE_CONFIGS]?.name || img.source
      ))].join(', ');
      
      toast.success(`🤍 ${newImages.length} imagens de fundo branco enviadas ao Gerador de KITs! (${sourceNames})`);
    }
  }, [productId]);

  // 📨 LISTENER PARA RESPONDER SOLICITAÇÕES DE SNAPSHOT DE IMAGENS WHITE-BACKGROUND
  useEffect(() => {
    const handleSnapshotRequest = (event: Event) => {
      try {
        const customEvent = event as CustomEvent;
        const { productId: reqId } = customEvent.detail || {};
        
        if (reqId !== productId) return;
        
        const whiteBackgroundImages = getWhiteBackgroundImages();
        console.log('📨 [GALERIA] Snapshot white-bg solicitado:', {
          productId: reqId,
          count: whiteBackgroundImages.length,
          sources: whiteBackgroundImages.map(img => img.source)
        });
        
        if (whiteBackgroundImages.length > 0) {
          dispatchWhiteBackgroundToKit(whiteBackgroundImages);
        }
      } catch (err) {
        console.error('❌ [GALERIA] Erro ao responder snapshot de white-bg:', err);
      }
    };

    window.addEventListener('requestWhiteBackgroundFromGallery', handleSnapshotRequest);
    return () => window.removeEventListener('requestWhiteBackgroundFromGallery', handleSnapshotRequest);
  }, [productId, getWhiteBackgroundImages, dispatchWhiteBackgroundToKit]);

  // Escutar eventos de todas as fontes de IA
  useEffect(() => {
    const handleImageGenerated = (event: CustomEvent) => {
      const { 
        source, 
        images, 
        productId: eventProductId, 
        batchId, 
        generationRound,
        aiOrigin,
        processingOrder,
        originalSource: eventOriginalSource
      } = event.detail;
      
      if (eventProductId === productId && images && Array.isArray(images) && images.length > 0) {
        // ✅ CONTROLE ANTI-DUPLICAÇÃO MELHORADO: Usar batchId estável
        const uniqueBatchId = batchId || `gallery-${source}-${eventProductId}-${generationRound || Date.now()}`;
        
        // ✅ ANTI-DUPLICAÇÃO POR BATCH ID (sem Date.now() para evitar chaves únicas)
        if (batchId && processedBatchIds.has(batchId)) {
          console.log(`🚫 [GALERIA ANTI-DUP] Batch ${batchId} já processado, ignorando...`);
          return;
        }
        
        // Marcar batch como processado
        if (batchId) {
          setProcessedBatchIds(prev => new Set(prev.add(batchId)));
        }
        
        console.log(`✅ [GALERIA] Processando novo batch ${uniqueBatchId}: ${images.length} imagens de ${source}`);
        console.log(`🏷️ [GALERIA] Tags do evento: aiOrigin=${aiOrigin}, processingOrder=${processingOrder}, originalSource=${eventOriginalSource}`);
        
        // Carregar metadados das imagens de forma assíncrona
        const newEntriesPromises = images.map(async (url: string, index: number) => {
          // 🔥 OTIMIZAÇÃO: Converter Data URI para Blob URL (reduz uso de memória)
          let processedUrl = url;
          if (url.startsWith('data:')) {
            try {
              console.log(`🔄 [GALERIA] Convertendo Data URI para Blob URL (${url.length} bytes)`);
              const response = await fetch(url);
              const blob = await response.blob();
              processedUrl = URL.createObjectURL(blob);
              console.log(`✅ [GALERIA] Data URI convertido: ${url.length} bytes → ${processedUrl.length} bytes`);
            } catch (error) {
              console.warn('⚠️ [GALERIA] Falha ao converter Data URI, usando original:', error);
              processedUrl = url;
            }
          }
          
          // Criar tags baseadas nos dados do evento
          const tags: string[] = [];
          
          if (aiOrigin) {
            tags.push(`ai-origin:${aiOrigin}`);
          }
          
          if (eventOriginalSource) {
            tags.push(`original-source:${eventOriginalSource}`);
          }
          
          if (processingOrder !== undefined) {
            tags.push(`processing-order:${processingOrder + index}`);
          }
          
          // Tag para identificar imagens de marketing processadas
          if (source.includes('processed') || source.includes('marketing-gatilhos')) {
            tags.push('marketing:ready');
          }
          
          // Carregar metadados da imagem usando URL processado
          let metadata = { width: 0, height: 0, fileSize: 0 };
          try {
            metadata = await getImageMetadata(processedUrl);
          } catch (error) {
            console.warn('⚠️ Não foi possível obter metadados da imagem:', error);
          }
          
          return {
            id: `${source}-${Date.now()}-${Math.random()}`,
            url: processedUrl, // ✅ Usar URL processado (Blob URL ou URL original)
            source,
            timestamp: Date.now(),
            hosted: false,
            tags: tags,
            originalSource: aiOrigin || eventOriginalSource,
            width: metadata.width,
            height: metadata.height,
            fileSize: metadata.fileSize
          };
        });
        
        Promise.all(newEntriesPromises).then(newEntries => {
        
        setAllImages(prev => {
          // Filtrar duplicatas baseadas na URL
          const existingUrls = new Set(prev.map(img => img.url));
          const uniqueEntries = newEntries.filter(entry => !existingUrls.has(entry.url));
          
          if (uniqueEntries.length > 0) {
            const sourceName = SOURCE_CONFIGS[source as keyof typeof SOURCE_CONFIGS]?.name || source;
            toast.success(`📸 ${uniqueEntries.length} imagens adicionadas à galeria de ${sourceName}!`);
            
            // 🤍 VERIFICAR SE SÃO IMAGENS DE FUNDO BRANCO E ENVIAR PARA KIT GENERATOR
            const whiteBackgroundSources = ['bfl-white-bg', 'gemini-white-background', 'Fundo', 'Scale', 'runware', 'runware-upscale', 'cloudinary-kit', 'tongyi-wanxiang'];
            const whiteBackgroundImages = uniqueEntries.filter(entry => whiteBackgroundSources.includes(entry.source));
            
            if (whiteBackgroundImages.length > 0) {
              console.log('🤍 [GALERIA] Detectadas imagens de fundo branco:', {
                count: whiteBackgroundImages.length,
                sources: whiteBackgroundImages.map(img => img.source),
                urls: whiteBackgroundImages.map(img => img.url)
              });
              // Dispatch imediatamente para o KIT Generator e Showcases
              setTimeout(() => dispatchWhiteBackgroundToKit(whiteBackgroundImages), 100);
            }
            
            // 💾 SALVAR NO CACHE DE SESSÃO (1 hora)
            const imageUrls = uniqueEntries.map(entry => entry.url);
            aiImagesCache.saveImages(productId, source, imageUrls);
            console.log(`💾 [CACHE-SAVE] ${imageUrls.length} imagens salvas no cache para ${source}`);
            
            return [...prev, ...uniqueEntries];
          }
          
          return prev;
        });
        });
      }
    };

    // Escutar eventos de imagens melhoradas (DeepAI)
    const handleDeepAIImages = (event: CustomEvent) => {
      const { source, images, productId: eventProductId } = event.detail;
      if (eventProductId === productId && source === 'deepai') {
        handleImageGenerated(event);
      }
    };

    // Escutar eventos de fundo branco (Gemini)
    const handleGeminiWhiteBackground = (event: CustomEvent) => {
      const { source, images, productId: eventProductId } = event.detail;
      if (eventProductId === productId && source === 'gemini-white-background') {
        handleImageGenerated(event);
      }
    };

    // Registrar todos os listeners
    window.addEventListener('imageGenerated', handleImageGenerated as EventListener);
    window.addEventListener('deepaiImagesToKit', handleDeepAIImages as EventListener);
    window.addEventListener('geminiWhiteBackgroundToKit', handleGeminiWhiteBackground as EventListener);
    
    return () => {
      window.removeEventListener('imageGenerated', handleImageGenerated as EventListener);
      window.removeEventListener('deepaiImagesToKit', handleDeepAIImages as EventListener);
      window.removeEventListener('geminiWhiteBackgroundToKit', handleGeminiWhiteBackground as EventListener);
    };
  }, [productId]);

  const handlePreview = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsPreviewOpen(true);
  };

  const handleDownloadAll = async () => {
    if (allImages.length === 0) {
      toast.error('Nenhuma imagem disponível para download');
      return;
    }

    toast.info(`📥 Iniciando download de ${allImages.length} imagens...`);
    
    for (const image of allImages) {
      try {
        const response = await fetch(image.url);
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${productName}-${image.source}-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        
        // Pequena pausa entre downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Erro ao baixar imagem de ${image.source}:`, error);
      }
    }
    
    toast.success('✅ Download de todas as imagens concluído!');
  };

  // Função para hospedar uma imagem individual COM ROBUSTEZ E FALLBACK
  const hostSingleImage = async (
    imageUrl: string, 
    imageIndex: number,
    processingOrder?: number,
    originalSource?: string,
    skipDatabaseSave: boolean = false,
    customProcessing?: string[],
    customQuality?: string,
    customType?: string
  ): Promise<{ success: boolean; url?: string; hosted: boolean }> => {
    const logPrefix = `☁️ [HOST-${imageIndex}]`;
    
    try {
      console.log(`${logPrefix} INICIANDO hospedagem da imagem...`);
      console.log(`${logPrefix} URL original:`, imageUrl);
      console.log(`${logPrefix} Origem:`, originalSource);
      
      // Nome otimizado para imagens upscaled
      const timestamp = Date.now().toString().slice(-6);
      const hash = Math.random().toString(36).substring(2, 5);
      const fileName = `up-${timestamp}-${hash}.jpg`;
      
      console.log(`${logPrefix} Nome do arquivo: ${fileName}`);
      
      // Tentativas com retry robusto
      const maxRetries = 3;
      let lastError: any = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`${logPrefix} Tentativa ${attempt}/${maxRetries} de upload...`);
          
          // ℹ️ MEDIÇÃO (apenas informativa, sem rejeição)
          if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const dimensions = await getBlobDimensions(blob);
            const sizeKB = Math.round(blob.size / 1024);
            const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);
            
            console.log(`📊 ${logPrefix} INFORMAÇÃO: ${dimensions.width}x${dimensions.height}, ${sizeKB}KB (${sizeMB}MB)`);
            console.log(`✅ ${logPrefix} SEM LIMITES - Prosseguindo com hospedagem direta...`);
          }
          
          // 🚀 SEM R2 - Usar URL direta (sem hospedagem)
          console.log(`${logPrefix} ✅ Usando URL direta (sem hospedagem R2)...`);
          const result = { success: true, url: imageUrl, path: '' };
          
          if (result.success && result.url) {
            console.log(`${logPrefix} ✅ SUCESSO no upload - URL: ${result.url}`);
            
            // Preparar origem limpa e tags de marketing (quando aplicável)
            const isMarketingBlock = originalSource?.startsWith('marketing-gatilhos-');
            const marketingTag = isMarketingBlock ? originalSource : undefined;
            const cleanOrigin = isMarketingBlock ? originalSource!.replace('marketing-gatilhos-', '') : (originalSource || undefined);
            
            // Salvar na tabela hosted_images com tags padronizadas
            try {
              // ✅ ETAPA 2: Buscar source PRIMEIRO do banco, depois estado local, depois originalSource
              let extractedSource = originalSource || 'runware-upscale';
              
              // Tentar buscar do banco primeiro
              try {
              const { data: dbImage } = await (supabase as any)
                .from('hosted_images')
                  .select('tags')
                  .eq('url', imageUrl)
                  .eq('r2_path', '') // Apenas não-hospedadas
                  .maybeSingle();
                
                if (dbImage?.tags) {
                  const dbSourceTag = dbImage.tags.find((t: string) => t.startsWith('ai-source:') || t.startsWith('source:'));
                  if (dbSourceTag) {
                    extractedSource = dbSourceTag.replace('ai-source:', '').replace('source:', '');
                    console.log(`${logPrefix} ✅ Source extraído do banco:`, extractedSource);
                  }
                }
              } catch (dbError) {
                console.warn(`${logPrefix} Não foi possível buscar do banco:`, dbError);
              }
              
              // Fallback: buscar do estado local (allImages)
              if (!extractedSource || extractedSource === 'runware-upscale') {
                const localSourceTag = allImages.find(img => img.url === imageUrl)?.tags?.find(t => t.startsWith('ai-source:') || t.startsWith('source:'));
                if (localSourceTag) {
                  extractedSource = localSourceTag.replace('ai-source:', '').replace('source:', '');
                  console.log(`${logPrefix} ✅ Source extraído do estado local:`, extractedSource);
                }
              }
              
              // Adicionar sufixo -hosted (exceto cloudinary-kit que já é consistente)
              const hostedSource = extractedSource === 'cloudinary-kit' 
                ? 'cloudinary-kit-hosted' 
                : extractedSource.endsWith('-hosted') 
                  ? extractedSource 
                  : `${extractedSource}-hosted`;
              
              // ✅ OBTER DIMENSÕES REAIS DO BLOB ANTES DE SALVAR
              let realWidth = 1000;
              let realHeight = 1000;
              let realFileSize = 0;
              
              try {
                // Baixar a imagem para obter blob e dimensões reais
                const response = await fetch(result.url);
                const blob = await response.blob();
                const dimensions = await getBlobDimensions(blob);
                
                realWidth = dimensions.width;
                realHeight = dimensions.height;
                realFileSize = blob.size;
                
                // ✅ FASE 5: LOG DETALHADO após hospedagem
                console.log(`📐 ${logPrefix} DIMENSÕES HOSPEDADAS CONFIRMADAS: ${realWidth}x${realHeight}, ${Math.round(realFileSize / 1024)}KB`);
              } catch (metadataError) {
                console.warn(`${logPrefix} ⚠️ Não foi possível obter metadados reais, usando valores padrão:`, metadataError);
              }
              
              // 💾 SALVAR NO BANCO apenas se não for skip
              if (!skipDatabaseSave) {
                await saveHostedImage({
                  url: result.url,
                  filename: fileName,
                  original_filename: fileName,
                  r2_path: result.path || fileName,
                  file_type: 'image/jpeg',
                  file_size: realFileSize, // ✅ Tamanho real
                  width: realWidth, // ✅ Dimensão real
                  height: realHeight, // ✅ Dimensão real
                  productId: productId,
                  aiSource: cleanOrigin || extractedSource,
                  processing: customProcessing || ['upscaled', 'resized'],
                  quality: customQuality || 'high',
                  description: `${customType === 'standard' ? 'Fallback image (no upscale)' : 'Upscaled 4x and resized image'} for product ${productName}`,
                  tags: [
                    `source:${hostedSource}`, // ← Ex: source:bfl-hosted
                    `product:${productId}`,
                    `original-source:${extractedSource}`, // ← Ex: original-source:bfl
                    `ai-source:${extractedSource}`, // ← Manter para compatibilidade
                    originalSource === 'cloudinary-kit' ? 'type:kit-image' : (customType ? `type:${customType}` : 'type:upscaled-4x'),
                    'size:1000x1000',
                    'marketing:ready',
                    `upload-attempt:${attempt}`,
                    ...(processingOrder ? [`processing-order:${processingOrder}`] : []),
                    ...(cleanOrigin ? [`original-source:${cleanOrigin}`] : []),
                    ...(marketingTag ? [marketingTag] : []),
                    ...(customType === 'standard' ? ['upscale-failed'] : [])
                  ]
                });
                
                console.log(`${logPrefix} 💾 Imagem salva na galeria hospedada`);
                
                // Dispatch event to notify HostedImagesGallery
                window.dispatchEvent(new CustomEvent('hostedImageSaved'));
              } else {
                console.log(`${logPrefix} ⏭️ Salvamento no banco PULADO (será feito manualmente)`);
              }
              
              return {
                success: true,
                url: result.url,
                hosted: true
              };
              
            } catch (saveError) {
              console.error(`${logPrefix} ❌ Erro ao salvar na galeria:`, saveError);
              toast.warning(`Imagem ${imageIndex}: Hospedada mas não salva na galeria`);
              
              return {
                success: true,
                url: result.url,
                hosted: true
              };
            }
          } else {
            // Sem R2, o result sempre é sucesso usando URL direta
            console.log(`${logPrefix} ✅ URL direta pronta`);
          }
        } catch (uploadError) {
          lastError = uploadError;
          console.error(`${logPrefix} ❌ Erro na tentativa ${attempt}:`, uploadError);
          
          if (attempt < maxRetries) {
            const delay = attempt * 3000;
            console.log(`${logPrefix} ⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      // Se chegou aqui, todas as tentativas falharam - usar fallback
      console.error(`${logPrefix} ❌ TODAS as tentativas de hospedagem falharam. Usando fallback.`);
      console.error(`${logPrefix} Último erro:`, lastError);
      
      toast.warning(`Imagem ${imageIndex}: Hospedagem falhou - usando URL original como fallback`);
      
      return {
        success: true,
        url: imageUrl, // Usar URL original como fallback
        hosted: false
      };
      
    } catch (error) {
      console.error(`${logPrefix} 💥 ERRO CRÍTICO:`, error);
      toast.error(`Imagem ${imageIndex}: Erro crítico - usando fallback`);
      
      return {
        success: true,
        url: imageUrl,
        hosted: false
      };
    }
  };

  // ☁️ HOSPEDAGEM DIRETA PARA RUNWARE (SEM UPSCALE AUTOMÁTICO)
  const handleDirectHostToR2 = async () => {
    console.log('☁️ [RUNWARE DIRECT] Iniciando hospedagem direta (SEM upscale)...');
    setIsHosting(true);
    setHostingProgress(0);
    
    try {
      // Filtrar apenas imagens runware não hospedadas
      const imagesToHost = allImages.filter(img => 
        img.source === 'runware' && 
        !img.hosted
      );
      
      if (imagesToHost.length === 0) {
        toast.info('✅ Todas as imagens Runware já estão hospedadas!');
        setIsHosting(false);
        return;
      }
      
      console.log(`📊 [RUNWARE DIRECT] ${imagesToHost.length} imagens para processar`);
      
      let successCount = 0;
      
      for (let i = 0; i < imagesToHost.length; i++) {
        const image = imagesToHost[i];
        const progress = Math.round(((i + 1) / imagesToHost.length) * 100);
        setHostingProgress(progress);
        
        try {
          console.log(`☁️ [RUNWARE DIRECT] Processando imagem ${i + 1}/${imagesToHost.length}...`);
          
          // SEM R2 - usar URL direta
          const result = { success: true, url: image.url, path: '' };
          
          if (result.success && result.url) {
            console.log(`✅ [RUNWARE DIRECT] Imagem ${i + 1} processada:`, result.url);
            
            // Salvar no banco com tags corretas
            await saveHostedImage({
              url: result.url,
              filename: `runware-${productId}-${Date.now()}-${i}.jpg`,
              original_filename: `runware-${i + 1}`,
              r2_path: '',
              file_type: 'image/jpeg',
              file_size: 0,
              width: 1024,
              height: 1024,
              productId: productId,
              aiSource: 'runware',
              tags: ['source:runware-direct']
            });
            
            // Atualizar estado local
            setAllImages(prev => prev.map(img => 
              img.id === image.id 
                ? { ...img, hosted: true, hostedUrl: result.url }
                : img
            ));
            
            successCount++;
          }
        } catch (error) {
          console.error(`❌ [RUNWARE DIRECT] Erro na imagem ${i + 1}:`, error);
        }
        
        // Pequena pausa entre processamentos
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      toast.success(`🎉 ${successCount}/${imagesToHost.length} imagens Runware hospedadas!`);
      
      // Disparar evento para atualizar galeria de showcases
      window.dispatchEvent(new CustomEvent('imageGenerated', {
        detail: {
          source: 'runware-hosted',
          productId,
          images: [],
          timestamp: Date.now()
        }
      }));
      
    } catch (error) {
      console.error('❌ [RUNWARE DIRECT] Erro:', error);
      toast.error('Erro na hospedagem direta do Runware');
    } finally {
      setIsHosting(false);
      setHostingProgress(0);
    }
  };

  // ☁️ HOSPEDAGEM PARA IMAGENS JÁ UPSCALADAS (mantida para compatibilidade)
  const handleHostToR2 = async () => {
    // Filtrar APENAS imagens que passaram por Upscale 4x
    const imagesToHost = allImages.filter(img => img.source === 'runware-upscale');
    
    if (imagesToHost.length === 0) {
      toast.error('Nenhuma imagem Runware upscalada disponível para hospedar');
      return;
    }

    setIsHosting(true);
    setHostingProgress(0);
    
    toast.info(`☁️ Iniciando hospedagem de ${imagesToHost.length} imagens upscaladas no R2...`);
    
    const hostedCount = new Set<string>();
    
    try {
      for (let i = 0; i < imagesToHost.length; i++) {
        const image = imagesToHost[i];
        
        if (hostedImages.has(image.url)) {
          console.log(`📌 Imagem upscaled já hospedada: ${image.source}`);
          hostedCount.add(image.url);
          setHostingProgress(Math.round(((i + 1) / imagesToHost.length) * 100));
          continue;
        }
        
        const success = await hostSingleImage(image.url, i + 1, i + 1, image.source);
        if (success) {
          hostedCount.add(image.url);
          
          // Atualizar estado da imagem
          setAllImages(prevImages => prevImages.map(img => 
            img.id === image.id 
              ? { ...img, hosted: true } 
              : img
          ));
        }
        
        setHostingProgress(Math.round(((i + 1) / imagesToHost.length) * 100));
        
        // Pequena pausa entre uploads
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setHostedImages(hostedCount);
      
      if (hostedCount.size > 0) {
        toast.success(`✅ ${hostedCount.size} imagens Upscale 4x hospedadas com sucesso no R2!`);
        toast.info('🎯 Suas imagens estão prontas para anúncios e podem ser visualizadas na galeria de hospedadas');
      } else {
        toast.error('❌ Nenhuma imagem foi hospedada com sucesso');
      }
      
    } catch (error) {
      console.error('❌ Erro geral na hospedagem de imagens:', error);
      toast.error('Erro na hospedagem das imagens');
    } finally {
      setIsHosting(false);
      setHostingProgress(0);
    }
  };

  // Função para processar upscale e hospedagem por bloco específico
  const handleBlockUpscaleAndHost = async (sourceKey: string) => {
    // Selecionar imagens do bloco VISÍVEL (inclui categorias sintéticas como "marketing-gatilhos-*")
    const visibleBlockImages = (imagesBySource?.[sourceKey] || []) as ImageEntry[];

    // Fallback: para fontes originais, filtrar diretamente de allImages
    const directSourceImages = allImages.filter(img =>
      img.source === sourceKey &&
      img.url &&
      img.url.trim() !== ''
    );

    const blockImages = (visibleBlockImages.length > 0 ? visibleBlockImages : directSourceImages);

    if (blockImages.length === 0) {
      toast.error(`Nenhuma imagem disponível no bloco ${SOURCE_CONFIGS[sourceKey as keyof typeof SOURCE_CONFIGS]?.name || sourceKey}`);
      return;
    }

    setProcessingBlock(sourceKey);
    setBlockProgress(0);
    setBlockProcessedCount(0);

    const blockName = SOURCE_CONFIGS[sourceKey as keyof typeof SOURCE_CONFIGS]?.name || sourceKey;
    toast.info(`🚀 Iniciando processamento do bloco: ${blockName} (${blockImages.length} imagens)`);
    
    const batchId = `block-${sourceKey}-${Date.now()}`;
    let successCount = 0;
    let errorCount = 0;
    
    // Array para hospedagem paralela posterior
    const imagesToHost: Array<{ url: string; index: number; sourceKey: string; upscaleTime: number; isFallback?: boolean }> = [];

    try {
      for (let i = 0; i < blockImages.length; i++) {
        const image = blockImages[i];
        
        try {
          console.log(`🎯 [BLOCO ${sourceKey}] Processando imagem ${i + 1}/${blockImages.length}...`);
          
          // Atualizar progresso: iniciando
          const initialProgress = (i / blockImages.length) * 100;
          setBlockProgress(Math.round(initialProgress));
          setBlockProcessedCount(i);
          
          // ETAPA 1: Upscale 2x via Runware (com fallback automático para 4x)
          const startTime = Date.now();
          toast.info(`⚡ ${blockName} - Imagem ${i + 1}: Tentando Upscale 2x...`, { duration: 2000 });
          console.log(`⏱️ [BLOCO ${sourceKey}] Iniciando upscale da imagem ${i + 1}...`);
          
          const upscaleResult = await upscaleImage(image.url, 2);
          const upscaleTime = Date.now() - startTime;
          console.log(`⏱️ [BLOCO ${sourceKey}] Upscale da imagem ${i + 1} levou ${upscaleTime}ms`);
          
          // Atualizar progresso: upscale concluído (33% da tarefa)
          const upscaleProgress = ((i + 0.33) / blockImages.length) * 100;
          setBlockProgress(Math.round(upscaleProgress));
          
          if (upscaleResult.success && upscaleResult.data && Array.isArray(upscaleResult.data) && upscaleResult.data.length > 0) {
            const upscaledUrl = upscaleResult.data[0]?.imageURL;
            
            if (upscaledUrl && typeof upscaledUrl === 'string') {
              // ✅ FASE 5: LOG após upscale
              console.log(`📐 [BLOCO ${sourceKey}] URL recebida do Runware: ${upscaledUrl.substring(0, 100)}...`);
              
              try {
                const upscaledImg = await loadImageElement(upscaledUrl);
                console.log(`📐 [BLOCO ${sourceKey}] DIMENSÕES REAIS DO UPSCALE: ${upscaledImg.width}x${upscaledImg.height}`);
              } catch (dimError) {
                console.warn(`⚠️ [BLOCO ${sourceKey}] Não foi possível obter dimensões do upscale:`, dimError);
              }
              
              // ETAPA 2: Redimensionamento para 1000x1000 com VALIDAÇÃO RIGOROSA
              console.log(`📐 [BLOCO ${sourceKey}] Redimensionando imagem ${i + 1}...`);
              toast.info(`📐 ${blockName} - Imagem ${i + 1}: Redimensionando...`, { duration: 2000 });
              
              let finalImageUrl: string;
              try {
                const resizeStart = Date.now();
                
                // ✅ FASE 4: Usar função unificada de redimensionamento
                const { blob, blobUrl, width, height, sizeKB } = await resizeAndValidateImage(
                  upscaledUrl, 
                  1000, 
                  1000, 
                  1, 
                  1024
                );
                
                const resizeTime = Date.now() - resizeStart;
                console.log(`✅ [BLOCO ${sourceKey}] Imagem ${i + 1} redimensionada em ${resizeTime}ms`);
                console.log(`📐 [BLOCO ${sourceKey}] Dimensões: ${width}x${height}, Tamanho: ${sizeKB}KB`);
                
                // ✅ FASE 5: LOG DETALHADO após redimensionamento
                console.log(`📐 [BLOCO ${sourceKey}] DIMENSÕES APÓS REDIMENSIONAMENTO CONFIRMADAS: ${width}x${height}, ${sizeKB}KB`);
                
                // Converter blob para Base64 imediatamente
                console.log(`🔄 [BLOCO ${sourceKey}] Convertendo blob para Base64...`);
                const convertStart = Date.now();
                
                finalImageUrl = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
                });
                
                // Liberar memória do blob URL temporário
                URL.revokeObjectURL(blobUrl);
                
                const convertTime = Date.now() - convertStart;
                console.log(`✅ [BLOCO ${sourceKey}] Blob convertido para Base64 em ${convertTime}ms`);
                toast.success(`✅ Imagem ${i + 1}: ${sizeKB}KB | ${width}x${height}px | JPEG otimizado`, { duration: 3000 });
                
                // Atualizar progresso: conversão concluída (66% da tarefa)
                const resizeProgress = ((i + 0.66) / blockImages.length) * 100;
                setBlockProgress(Math.round(resizeProgress));
              } catch (resizeError) {
                console.error(`❌ [BLOCO ${sourceKey}] Falha no redimensionamento/conversão:`, resizeError);
                toast.error(`❌ ${blockName} - Imagem ${i + 1}: Falha no processamento`);
                errorCount++;
                continue;
              }
              
      // ETAPA 3: Hospedagem no R2 com preservação de tags (processado em paralelo depois)
      imagesToHost.push({
        url: finalImageUrl,
        index: i + 1,
        sourceKey,
        upscaleTime
      });
              
              successCount++;
            } else {
              console.error(`❌ [BLOCO ${sourceKey}] URL não encontrada`);
              errorCount++;
            }
          } else {
            // ❌ UPSCALE FALHOU (2x e 4x) → FALLBACK: Hospedar imagem original
            console.warn(`⚠️ [BLOCO ${sourceKey}] Upscale falhou para imagem ${i + 1}, hospedando imagem ORIGINAL...`);
            console.error(`❌ [BLOCO ${sourceKey}] Erro do upscale:`, upscaleResult.error);
            toast.warning(`⚠️ Imagem ${i + 1}: Upscale falhou, hospedando original`, { duration: 4000 });
            
            try {
              // ETAPA 1: Redimensionar imagem original para 1000x1000
              console.log(`📐 [BLOCO ${sourceKey}] Redimensionando imagem ORIGINAL ${i + 1}...`);
              const resizeStart = Date.now();
              
              const { blob, blobUrl, width, height, sizeKB } = await resizeAndValidateImage(
                image.url,  // URL ORIGINAL (não upscaled)
                1000, 
                1000, 
                1,    // Sem mínimo de tamanho
                1024  // Máximo 1024KB
              );
              
              const resizeTime = Date.now() - resizeStart;
              console.log(`✅ [BLOCO ${sourceKey}] Imagem ORIGINAL ${i + 1} redimensionada em ${resizeTime}ms`);
              console.log(`📐 [BLOCO ${sourceKey}] Dimensões: ${width}x${height}, Tamanho: ${sizeKB}KB`);
              
              // ETAPA 2: Converter para Base64
              const finalImageUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
              
              URL.revokeObjectURL(blobUrl); // Liberar memória
              
              console.log(`✅ [BLOCO ${sourceKey}] Imagem ORIGINAL ${i + 1} convertida para Base64`);
              toast.success(`✅ Imagem ${i + 1}: ${sizeKB}KB | ${width}x${height}px | ORIGINAL (sem upscale)`, { duration: 3000 });
              
              // ETAPA 3: Adicionar à fila de hospedagem (COM TAG ESPECIAL)
              imagesToHost.push({
                url: finalImageUrl,
                index: i + 1,
                sourceKey,
                upscaleTime: 0,  // Não houve upscale
                isFallback: true // ✅ FLAG para identificar fallback
              });
              
              successCount++;
              
              // Atualizar progresso: fallback concluído (66% da tarefa)
              const fallbackProgress = ((i + 0.66) / blockImages.length) * 100;
              setBlockProgress(Math.round(fallbackProgress));
              
            } catch (fallbackError) {
              console.error(`❌ [BLOCO ${sourceKey}] ERRO CRÍTICO no fallback da imagem ${i + 1}:`, fallbackError);
              toast.error(`❌ Imagem ${i + 1}: Falha total (upscale + fallback)`, { duration: 5000 });
              errorCount++;
            }
          }
          
        } catch (error) {
          console.error(`❌ [BLOCO ${sourceKey}] Erro na imagem ${i + 1}:`, error);
          toast.error(`❌ ${blockName} - Imagem ${i + 1}: Erro no processamento`);
          errorCount++;
        }
        
      }
      
      // ========== HOSPEDAGEM PARALELA (3 simultâneas) ==========
      console.log(`☁️ [BLOCO ${sourceKey}] Iniciando hospedagem paralela de ${imagesToHost.length} imagens...`);
      toast.info(`☁️ ${blockName}: Hospedando ${imagesToHost.length} imagens em paralelo (3 simultâneas)...`, { duration: 3000 });
      
      const PARALLEL_LIMIT = 3;
      let hostedCount = 0;
      
      for (let batchStart = 0; batchStart < imagesToHost.length; batchStart += PARALLEL_LIMIT) {
        const batch = imagesToHost.slice(batchStart, batchStart + PARALLEL_LIMIT);
        console.log(`☁️ [BLOCO ${sourceKey}] Hospedando lote ${Math.floor(batchStart / PARALLEL_LIMIT) + 1}/${Math.ceil(imagesToHost.length / PARALLEL_LIMIT)}: ${batch.length} imagens`);
        
        const hostPromises = batch.map(async (item) => {
          const hostStart = Date.now();
          const logPrefix = `☁️ [HOST-${item.index}]`;
          
          // ✅ PREPARAR TAGS ESPECIAIS para imagens fallback (sem upscale)
          const isFallbackImage = item.isFallback === true;
          const qualityTag = isFallbackImage ? 'standard' : 'upscaled-4x';
          const processingTags = isFallbackImage 
            ? ['fallback-no-upscale', 'resized-1000x1000'] 
            : ['upscaled-4x', 'resized-1000x1000'];
          const typeTag = isFallbackImage ? 'standard' : 'upscaled-4x';
          
          console.log(`${logPrefix} Tags de qualidade:`, { isFallback: isFallbackImage, quality: qualityTag, processing: processingTags, type: typeTag });
          
          try {
            const hostResult = await hostSingleImage(
              item.url,
              item.index,
              item.index,
              item.sourceKey,
              false, // skipDatabaseSave
              processingTags, // customProcessing
              qualityTag, // customQuality
              typeTag // customType
            );
            const hostTime = Date.now() - hostStart;
            
            if (hostResult.success && hostResult.hosted) {
              hostedCount++;
              
              // Atualizar progresso incremental
              const progressPercent = Math.round((hostedCount / imagesToHost.length) * 100);
              setBlockProgress(progressPercent);
              setBlockProcessedCount(hostedCount);
              
              // Disparar evento
              const imageGeneratedEvent = new CustomEvent('imageGenerated', {
                detail: {
                  source: 'runware-upscale',
                  images: [hostResult.url || item.url],
                  productId,
                  batchId,
                  isResized: true,
                  isHosted: hostResult.hosted,
                  originalSource: item.sourceKey,
                  aiOrigin: item.sourceKey,
                  processedAt: Date.now(),
                  processingOrder: item.index
                }
              });
              window.dispatchEvent(imageGeneratedEvent);
              
              const totalTime = Date.now() - (item.upscaleTime ? Date.now() - item.upscaleTime : Date.now());
              console.log(`✅ [BLOCO ${sourceKey}] Imagem ${item.index} COMPLETA (hospedagem: ${hostTime}ms)`);
              toast.success(`✅ ${blockName} - Imagem ${item.index}: Hospedada! (${Math.round(hostTime/1000)}s)`, { duration: 2000 });
              
              return { success: true, index: item.index };
            } else {
              console.warn(`⚠️ [BLOCO ${sourceKey}] Imagem ${item.index} usando fallback após ${hostTime}ms`);
              errorCount++;
              return { success: false, index: item.index, reason: 'fallback' };
            }
          } catch (error) {
            console.error(`❌ [BLOCO ${sourceKey}] Erro na hospedagem da imagem ${item.index}:`, error);
            errorCount++;
            return { success: false, index: item.index, error };
          }
        });
        
        // Aguardar lote atual terminar antes do próximo
        await Promise.allSettled(hostPromises);
      }
      
      // Toast final com resumo  
      const successRate = Math.round((hostedCount / imagesToHost.length) * 100);
      
      if (hostedCount > 0) {
        toast.success(
          `🎉 Bloco ${blockName} CONCLUÍDO!
          ✅ ${hostedCount}/${imagesToHost.length} imagens hospedadas (${successRate}%)
          ${errorCount > 0 ? `❌ ${errorCount} falharam` : ''}`,
          { duration: 8000 }
        );
      } else {
        toast.error(`❌ Bloco ${blockName}: Nenhuma imagem processada com sucesso`, { duration: 6000 });
      }
      
    } catch (error) {
      console.error(`❌ [BLOCO ${sourceKey}] Erro geral:`, error);
      toast.error(`Erro no processamento do bloco ${blockName}`);
    } finally {
      setProcessingBlock(null);
      setBlockProgress(0);
      setBlockProcessedCount(0);
    }
  };

  // ⚡ FUNÇÃO OTIMIZADA: Hospedar diretamente (SEM upscale) com processamento em BATCH PARALELO
  const handleDirectHostBlock = async (sourceKey: string) => {
    const blockImages = imagesBySource[sourceKey] || [];
    
    if (blockImages.length === 0) {
      toast.error('Nenhuma imagem disponível para hospedagem');
      return;
    }

    const blockName = SOURCE_CONFIGS[sourceKey as keyof typeof SOURCE_CONFIGS]?.name || sourceKey;
    
    setProcessingBlock(sourceKey);
    setBlockProgress(0);
    setBlockProcessedCount(0);

    // Sources que JÁ estão em 1200x1200 e não precisam de redimensionamento
    const DIRECT_UPLOAD_SOURCES = [
      'marketing-gatilhos-gemini',
      'marketing-gatilhos-runware',
      'marketing-gatilhos-bfl',
      'showcase',
      'cloudinary-kit'
    ];

    console.log(`⚡ [${sourceKey}] HOSPEDAGEM DIRETA (sem upscale) - ${blockImages.length} imagens`);
    toast.info(`⚡ ${blockName}: Hospedagem direta (${blockImages.length} imagens)`, { duration: 3000 });
    
    const batchId = `direct-host-${sourceKey}-${Date.now()}`;
    let successCount = 0;
    let errorCount = 0;
    const BATCH_SIZE = 3; // ✅ OTIMIZADO: 3 uploads simultâneos

    try {
      // Processar imagens em batches paralelos
      for (let batchStart = 0; batchStart < blockImages.length; batchStart += BATCH_SIZE) {
        const batch = blockImages.slice(batchStart, batchStart + BATCH_SIZE);
        
        console.log(`📦 [${sourceKey}] Batch ${Math.floor(batchStart / BATCH_SIZE) + 1}/${Math.ceil(blockImages.length / BATCH_SIZE)}: ${batch.length} uploads SIMULTÂNEOS iniciados`);
        
        // 🔥 Atualizar progresso IMEDIATAMENTE ao iniciar o batch
        const currentProgress = Math.round((batchStart / blockImages.length) * 100);
        setBlockProgress(currentProgress);
        
        // Processar batch em paralelo
        const batchPromises = batch.map(async (image, batchIndex) => {
          const globalIndex = batchStart + batchIndex;
          const imageNum = globalIndex + 1;
          
          try {
            // ✅ ATUALIZAR PROGRESSO INDIVIDUAL EM TEMPO REAL
            const currentProgress = Math.round(((globalIndex + 1) / blockImages.length) * 100);
            setBlockProgress(currentProgress);
            setBlockProcessedCount(globalIndex + 1);
            
            toast.info(`⚡ ${blockName} - Processando imagem ${imageNum}/${blockImages.length}...`, { duration: 1500 });
            
            const startTime = Date.now();
            
            let finalImageUrl: string;
            let resizeTime = 0;
            
            // 🔥 NOVA LÓGICA: Pular resize para sources diretos
            if (!DIRECT_UPLOAD_SOURCES.includes(image.source)) {
              // ETAPA 1: Redimensionamento para 1000x1000
              console.log(`📐 [${sourceKey}] Redimensionando imagem ${imageNum}/${blockImages.length}...`);
              
              try {
                const resizeStart = Date.now();
                finalImageUrl = await resizeImageTo1000x1000(image.url);
                resizeTime = Date.now() - resizeStart;
                console.log(`✅ [${sourceKey}] Imagem ${imageNum} redimensionada em ${resizeTime}ms`);
              } catch (resizeError) {
                console.error(`❌ [${sourceKey}] Falha no redimensionamento da imagem ${imageNum}:`, resizeError);
                return { success: false, imageNum };
              }
            } else {
              console.log(`⚡ [${sourceKey}] PULAR RESIZE - Source '${image.source}' já está em 1200x1200`);
              finalImageUrl = image.url;
            }
            
            // ✅ VALIDAÇÕES LEVES (NÃO-BLOQUEANTES)
            if (finalImageUrl.startsWith('blob:')) {
              try {
                const response = await fetch(finalImageUrl);
                const blob = await response.blob();
                const blobSizeKB = Math.round(blob.size / 1024);
                
                if (blobSizeKB < 300) {
                  console.warn(`⚠️ [${sourceKey}] Imagem ${imageNum} muito pequena (${blobSizeKB}KB)`);
                  toast.warning(`⚠️ Imagem ${imageNum}: ${blobSizeKB}KB (pode ter qualidade baixa)`, { duration: 2000 });
                }
              } catch (validationError) {
                console.warn(`⚠️ [${sourceKey}] Erro na validação da imagem ${imageNum}:`, validationError);
              }
            }
            
            // ETAPA 2: Hospedagem no R2 (sem delay artificial - upload paralelo real)
            console.log(`☁️ [${sourceKey}] Hospedando imagem ${imageNum} no R2...`);
            
            const uploadStart = Date.now();
            const hostResult = await hostSingleImage(
              finalImageUrl, 
              imageNum,
              imageNum,
              sourceKey,
              true  // skipDatabaseSave = true (salvamento será feito manualmente logo após)
            );
            const uploadTime = Date.now() - uploadStart;
            
            if (hostResult.success && hostResult.hosted) {
              const totalTime = Date.now() - startTime;
              console.log(`✅ [${sourceKey}] Imagem ${imageNum} COMPLETA em ${totalTime}ms (resize: ${Date.now() - startTime - uploadTime}ms, upload: ${uploadTime}ms)`);
              
              // 💾 SALVAR NO BANCO DE DADOS
              try {
                // Obter dimensões reais da imagem hospedada
                const response = await fetch(hostResult.url || finalImageUrl);
                const blob = await response.blob();
                const dimensions = await getBlobDimensions(blob);
                
                await saveHostedImage({
                  url: hostResult.url || finalImageUrl,
                  filename: `direct-${Date.now()}-${imageNum}.jpg`,
                  original_filename: image.url,
                  r2_path: hostResult.url?.split('/').pop() || '',
                  file_type: 'image/jpeg',
                  file_size: blob.size,
                  width: dimensions.width,
                  height: dimensions.height,
                  productId: productId,
                  aiSource: sourceKey,
                  processing: ['hosted-direct'],
                  quality: 'high',
                  description: `Direct hosted image from ${blockName}`,
                  tags: [
                    `source:${sourceKey}-hosted`,
                    `product:${productId}`,
                    `original-source:${sourceKey}`,
                    `ai-source:${sourceKey}`,
                    'type:direct-hosted',
                    `processing-order:${imageNum}`
                  ]
                });
                
                console.log(`💾 [${sourceKey}] Imagem ${imageNum} salva no banco com sucesso`);
                
                // Notificar galeria
                window.dispatchEvent(new CustomEvent('hostedImageSaved'));
                
              } catch (saveError) {
                console.error(`❌ [${sourceKey}] Erro ao salvar imagem ${imageNum} no banco:`, saveError);
                toast.warning(`⚠️ Imagem ${imageNum} hospedada, mas não salva na galeria`, { duration: 3000 });
              }
              
              // Disparar evento
              const imageGeneratedEvent = new CustomEvent('imageGenerated', {
                detail: {
                  source: `${sourceKey}-hosted`,
                  images: [hostResult.url || finalImageUrl],
                  productId,
                  batchId,
                  isResized: true,
                  isHosted: hostResult.hosted,
                  originalSource: sourceKey,
                  aiOrigin: sourceKey,
                  processedAt: Date.now(),
                  processingOrder: imageNum
                }
              });
              
              window.dispatchEvent(imageGeneratedEvent);
              
              return { success: true, imageNum };
            } else {
              console.warn(`⚠️ [${sourceKey}] Imagem ${imageNum} falhou na hospedagem`);
              return { success: false, imageNum };
            }
            
        } catch (error) {
          console.error(`❌ [${sourceKey}] Erro na imagem ${imageNum}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          toast.error(`❌ ${blockName} - Imagem ${imageNum}: ${errorMessage}`, { duration: 4000 });
          return { success: false, imageNum, error: errorMessage };
        }
        });
        
        // Aguardar conclusão do batch
        const batchResults = await Promise.all(batchPromises);
        
        // Contar sucessos/erros
        batchResults.forEach(result => {
          if (result.success) {
            successCount++;
            toast.success(`✅ ${blockName} - Imagem ${result.imageNum}: COMPLETA!`, { duration: 2000 });
          } else {
            errorCount++;
            toast.error(`❌ ${blockName} - Imagem ${result.imageNum}: Falhou`, { duration: 2000 });
          }
        });
        
        // Atualizar progresso
        const processedSoFar = batchStart + batch.length;
        setBlockProgress(Math.round((processedSoFar / blockImages.length) * 100));
        setBlockProcessedCount(successCount);
        
      console.log(`📊 [${sourceKey}] Batch completo: ${successCount} sucesso, ${errorCount} erros`);
      
      // ✅ DELAY ENTRE BATCHES PARA EVITAR SOBRECARGA
      if (batchStart + BATCH_SIZE < blockImages.length) {
        console.log(`⏳ [${sourceKey}] Aguardando 2s antes do próximo batch...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
      
      // ✅ RELATÓRIO FINAL DETALHADO
      const successRate = Math.round((successCount / blockImages.length) * 100);
      
      console.log(`✅ [${sourceKey}] === RESUMO FINAL ===`);
      console.log(`   Total: ${blockImages.length}`);
      console.log(`   Sucesso: ${successCount}`);
      console.log(`   Erros: ${errorCount}`);
      console.log(`   Taxa de sucesso: ${successRate}%`);
      
      setBlockProgress(100);
      setBlockProcessedCount(blockImages.length);
      
      if (errorCount === 0) {
        toast.success(
          `🎉 ${blockName} - TODAS as ${blockImages.length} imagens foram hospedadas com sucesso!`,
          { duration: 5000 }
        );
      } else {
        toast.info(
          `📊 ${blockName} - RELATÓRIO FINAL:\n\nTotal: ${blockImages.length}\n✅ Sucesso: ${successCount} (${successRate}%)\n❌ Falhas: ${errorCount}\n\n${errorCount > 0 ? '🔍 Verifique o console para detalhes dos erros' : ''}`,
          { duration: 10000 }
        );
      }
      
      // ✅ DISPARAR EVENTO GLOBAL para forçar atualização da galeria
      console.log(`✅ [BLOCO ${sourceKey}] Disparando evento hostedImageSaved...`);
      window.dispatchEvent(new CustomEvent('hostedImageSaved', {
        detail: {
          source: sourceKey,
          hostedSource: `${sourceKey}-hosted`,
          totalHosted: successCount,
          productId
        }
      }));
      
      // ✅ AGUARDAR 500ms antes de continuar (para dar tempo do evento processar)
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ [${sourceKey}] Erro geral:`, error);
      toast.error(`Erro na hospedagem do bloco ${blockName}`);
    } finally {
      setProcessingBlock(null);
      setBlockProgress(0);
      setBlockProcessedCount(0);
    }
  };

  // Função para processar upscale em lote
  const handleBatchUpscale = async () => {
    // Filtrar imagens que ainda não passaram por upscale
    const imagesToUpscale = allImages.filter(img => 
      img.source !== 'runware-upscale' && // Não upscalar imagens já upscaled 
      img.url && 
      img.url.trim() !== ''
    );

    if (imagesToUpscale.length === 0) {
      toast.error('Nenhuma imagem disponível para upscale ou todas já foram processadas');
      return;
    }

    setIsBatchUpscaling(true);
    setUpscaleProgress(0);
    setUpscaledCount(0);
    setUpscaleErrors(0);

    toast.info(`🚀 Iniciando upscale 4x de ${imagesToUpscale.length} imagens via Runware...`);
    
    const batchId = `batch-upscale-${Date.now()}`;
    let successCount = 0;
    let errorCount = 0;

    try {
      for (let i = 0; i < imagesToUpscale.length; i++) {
        const image = imagesToUpscale[i];
        
        try {
          console.log(`🚀 [BATCH UPSCALE] Processando imagem ${i + 1}/${imagesToUpscale.length} de ${image.source}...`);
          console.log('🚀 [UPSCALE] Enviando para edge function:', {
            imageUrl: image.url.substring(0, 50) + '...',
            isBlob: image.url.startsWith('blob:')
          });
          
          const result = await upscaleImage(image.url, 4);
          
          if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
            console.log(`✅ [BATCH UPSCALE] Imagem ${i + 1} processada com sucesso:`, result.data);
            
            // Extrair URL da imagem do resultado
            const imageUrl = result.data[0]?.imageURL;
            
            if (imageUrl && typeof imageUrl === 'string') {
              console.log(`🖼️ [BATCH UPSCALE] URL extraída:`, imageUrl);
              
              // 🎯 ETAPA 1: Redimensionamento INFALÍVEL (>=1200x1200)
              let finalImageUrl = imageUrl;
              let isResized = false;
              let resizeAttempts = 0;
              
              console.log(`📐 [RESIZE] Iniciando redimensionamento INFALÍVEL da imagem ${i + 1}...`);
              
              try {
                finalImageUrl = await resizeImageTo1000x1000(imageUrl);
                isResized = true;
                console.log(`✅ [RESIZE] Imagem ${i + 1} redimensionada com SUCESSO (>=900x900)`);
                toast.info(`📐 Imagem ${i + 1} redimensionada para 1000x1000px`, { duration: 1500 });
              } catch (resizeError) {
                console.error(`❌ [RESIZE] FALHA CRÍTICA no redimensionamento da imagem ${i + 1}:`, resizeError);
                toast.error(`❌ Imagem ${i + 1}: Falha crítica no redimensionamento - pulando para próxima`);
                errorCount++;
                continue; // Pular esta imagem se não conseguir redimensionar
              }
              
              // 🚀 ETAPA 2: Hospedagem ROBUSTA com retry automático
              let isHosted = false;
              let hostAttempts = 0;
              const maxHostAttempts = 2;
              
              console.log(`☁️ [HOST] Iniciando hospedagem ROBUSTA da imagem ${i + 1}...`);
              
              for (hostAttempts = 1; hostAttempts <= maxHostAttempts; hostAttempts++) {
                try {
                  console.log(`☁️ [HOST] Tentativa ${hostAttempts}/${maxHostAttempts} para imagem ${i + 1}...`);
                  toast.info(`☁️ Hospedando imagem ${i + 1} (tentativa ${hostAttempts})...`, { duration: 1500 });
                  
                  const hostResult = await hostSingleImage(finalImageUrl, i + 1, i + 1, image.source);
                  
                  if (hostResult.success) {
                    isHosted = hostResult.hosted;
                    if (hostResult.hosted) {
                      console.log(`✅ [HOST] Imagem ${i + 1} hospedada com SUCESSO na tentativa ${hostAttempts}!`);
                      toast.success(`✅ Imagem ${i + 1} hospedada no R2!`, { duration: 2000 });
                    } else {
                      console.log(`⚠️ [HOST] Imagem ${i + 1} usando fallback URL na tentativa ${hostAttempts}`);
                      toast.warning(`⚠️ Imagem ${i + 1} usando URL original (fallback)`, { duration: 2000 });
                    }
                    break; // Sucesso (hosted ou fallback), sair do loop
                  } else {
                    console.warn(`⚠️ [HOST] Tentativa ${hostAttempts}/${maxHostAttempts} falhou para imagem ${i + 1}`);
                    if (hostAttempts < maxHostAttempts) {
                      await new Promise(resolve => setTimeout(resolve, 3000)); // Pausa maior entre tentativas
                    }
                  }
                } catch (hostError) {
                  console.error(`❌ [HOST] Erro na tentativa ${hostAttempts}/${maxHostAttempts} para imagem ${i + 1}:`, hostError);
                  if (hostAttempts < maxHostAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                  }
                }
              }
              
              // ✅ SUCESSO: Imagem redimensionada E (hospedada OU fallback funcionando)
              const allStepsSuccessful = isResized && (isHosted || finalImageUrl);
              
              if (!isHosted) {
                console.error(`❌ [HOST] FALHA FINAL na hospedagem da imagem ${i + 1} após ${maxHostAttempts} tentativas`);
                toast.error(`❌ Imagem ${i + 1}: Falha na hospedagem após ${maxHostAttempts} tentativas`);
              }
              
              // Disparar evento APENAS se TODAS as etapas foram bem-sucedidas
              if (allStepsSuccessful) {
                const imageGeneratedEvent = new CustomEvent('imageGenerated', {
                  detail: {
                    source: 'runware-upscale',
                    images: [finalImageUrl],
                    productId,
                    batchId,
                    isResized,
                    isHosted,
                    originalSource: image.source,
                    processedAt: Date.now(),
                    processingOrder: i + 1 // Manter ordem de processamento
                  }
                });
                
                window.dispatchEvent(imageGeneratedEvent);
                successCount++; // SÓ contar como sucesso se TUDO funcionou
                
                toast.success(`✅ Imagem ${i + 1}/${imagesToUpscale.length}: Upscale → Resize → Host → COMPLETA!`, {
                  duration: 3000
                });
              } else {
                errorCount++; // Contar como erro se alguma etapa falhou
                toast.error(`❌ Imagem ${i + 1}/${imagesToUpscale.length}: Processo INCOMPLETO - verifique logs`);
              }
            
          } else {
            console.error(`❌ [BATCH UPSCALE] URL da imagem não encontrada:`, result);
            errorCount++;
          }
          
        } else {
          console.error(`❌ [BATCH UPSCALE] Falha na imagem ${i + 1}:`, result.error);
          errorCount++;
        }
          
        } catch (error) {
          console.error(`❌ [BATCH UPSCALE] Erro na imagem ${i + 1}:`, error);
          errorCount++;
        }
        
        // Atualizar contadores e progresso
        setUpscaledCount(successCount);
        setUpscaleErrors(errorCount);
        setUpscaleProgress(Math.round(((i + 1) / imagesToUpscale.length) * 100));
        
        // Delay entre processamentos para evitar sobrecarga
        if (i < imagesToUpscale.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Toast final com resumo DETALHADO e PRECISO
      const totalProcessed = imagesToUpscale.length;
      const successRate = Math.round((successCount / totalProcessed) * 100);
      
      if (successCount > 0) {
        toast.success(
          `🎉 Batch Upscale 4x CONCLUÍDO! 
          ✅ ${successCount}/${totalProcessed} imagens processadas COMPLETAMENTE (${successRate}%)
          📐 TODAS redimensionadas (>=1200x1200)
          ☁️ TODAS hospedadas no R2
          ${errorCount > 0 ? `❌ ${errorCount} falharam (verifique logs)` : ''}`,
          { duration: 10000 }
        );
        
        // Toast adicional com instruções
        setTimeout(() => {
          toast.info('🎯 Suas imagens estão prontas na Galeria de Hospedadas, ordenadas por data de geração da IA!', {
            duration: 5000
          });
        }, 2000);
      } else {
        toast.error(`❌ FALHA COMPLETA: Nenhuma das ${totalProcessed} imagens foi processada com sucesso. Verifique logs para detalhes.`, {
          duration: 8000
        });
      }
      
    } catch (error) {
      console.error('❌ [BATCH UPSCALE] Erro geral:', error);
      toast.error('Erro no processamento em lote das imagens');
    } finally {
      setIsBatchUpscaling(false);
      setUpscaleProgress(0);
      setUpscaledCount(0);
      setUpscaleErrors(0);
    }
  };

  // Separar imagens processadas por IA de origem usando tags ai-origin
  const separateProcessedImagesByAI = useCallback((): Record<string, ImageEntry[]> => {
    const processedSources = [
      'conversion-processed', 'features-processed', 'intro-processed', 'benefits-processed',
      'authority-processed', 'urgency-processed', 'cta-processed', 'faq-processed'
    ];
    
    const separatedByAI: Record<string, ImageEntry[]> = {
      'marketing-gatilhos-gemini': [],
      'marketing-gatilhos-runware': [],
      'marketing-gatilhos-bfl': []
    };
    
    processedSources.forEach(sourceType => {
      const sourceImages = allImages.filter(img => img.source === sourceType);
      
      sourceImages.forEach((img, imgIndex) => {
        // Buscar tag ai-origin da imagem processada
        let aiOrigin = img.tags?.find(tag => tag.startsWith('ai-origin:'))?.replace('ai-origin:', '');
        
        // Fallback: buscar original-source se ai-origin não existir
        if (!aiOrigin) {
          const originalSource = img.tags?.find(tag => tag.startsWith('original-source:'))?.replace('original-source:', '');
          if (originalSource?.includes('gemini')) {
            aiOrigin = 'gemini';
          } else if (originalSource?.includes('runware')) {
            aiOrigin = 'runware';
          } else if (originalSource?.includes('bfl')) {
            aiOrigin = 'bfl';
          } else {
            // Fallback final: usar originalSource da imagem ou padrão
            aiOrigin = img.originalSource || 'gemini';
          }
        }
        
        console.log(`🔍 [SEPARAÇÃO] ${sourceType} #${imgIndex + 1}/${sourceImages.length} - AI Origin:`, aiOrigin, 'tags:', img.tags);
        
        // Mapear para categoria correta baseada na IA de origem
        const targetCategory = `marketing-gatilhos-${aiOrigin}`;
        
        // Verificar se a categoria existe (para evitar erros com IAs não mapeadas)
        if (separatedByAI[targetCategory]) {
          separatedByAI[targetCategory].push({
            ...img,
            id: `marketing-${aiOrigin}-${sourceType}-${imgIndex}-${img.id}`,
            source: targetCategory,
            originalSource: aiOrigin
          });
        } else {
          console.warn(`⚠️ [SEPARAÇÃO] Categoria não encontrada para IA:`, aiOrigin, '- usando gemini como fallback');
          separatedByAI['marketing-gatilhos-gemini'].push({
            ...img,
            id: `marketing-gemini-${sourceType}-${imgIndex}-${img.id}`,
            source: 'marketing-gatilhos-gemini',
            originalSource: 'gemini'
          });
        }
      });
    });
    
    console.log('🎯 [SEPARAÇÃO] Imagens separadas por IA:', separatedByAI);
    return separatedByAI;
  }, [allImages]);

  // Agrupar imagens por fonte
  const imagesBySource = Object.keys(SOURCE_CONFIGS).reduce((acc, source) => {
    acc[source] = allImages.filter(img => img.source === source);
    return acc;
  }, {} as Record<string, ImageEntry[]>);

  // Separar imagens processadas por IA específica e ocultar individuais
  const separatedProcessedImages = separateProcessedImagesByAI();
  const hasProcessedImages = Object.values(separatedProcessedImages).some(images => images.length > 0);
  
  if (hasProcessedImages) {
    // Adicionar imagens separadas por IA
    Object.entries(separatedProcessedImages).forEach(([aiCategory, images]) => {
      if (images.length > 0) {
        imagesBySource[aiCategory] = images;
      }
    });
    
    // Ocultar cards individuais processados quando há imagens separadas
    const processedSources = [
      'conversion-processed', 'features-processed', 'intro-processed', 'benefits-processed',
      'authority-processed', 'urgency-processed', 'cta-processed', 'faq-processed'
    ];
    processedSources.forEach(source => {
      imagesBySource[source] = [];
    });
  }

  // Para o carousel - fontes ativas com imagens
  const activeSources = Object.entries(SOURCE_CONFIGS).filter(([sourceKey]) => 
    (imagesBySource[sourceKey] || []).length > 0
  );

  // Funções de navegação do carousel
  const nextImage = useCallback(() => {
    if (activeSources.length === 0) return;
    
    const currentSourceImages = imagesBySource[activeSources[currentSourceIndex][0]] || [];
    
    if (currentImageIndex < currentSourceImages.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    } else if (currentSourceIndex < activeSources.length - 1) {
      setCurrentSourceIndex(prev => prev + 1);
      setCurrentImageIndex(0);
    } else {
      // Volta para o início
      setCurrentSourceIndex(0);
      setCurrentImageIndex(0);
    }
  }, [currentImageIndex, currentSourceIndex, activeSources, imagesBySource]);

  const prevImage = useCallback(() => {
    if (activeSources.length === 0) return;
    
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    } else if (currentSourceIndex > 0) {
      setCurrentSourceIndex(prev => prev - 1);
      const prevSourceImages = imagesBySource[activeSources[currentSourceIndex - 1][0]] || [];
      setCurrentImageIndex(prevSourceImages.length - 1);
    } else {
      // Volta para o final
      setCurrentSourceIndex(activeSources.length - 1);
      const lastSourceImages = imagesBySource[activeSources[activeSources.length - 1][0]] || [];
      setCurrentImageIndex(lastSourceImages.length - 1);
    }
  }, [currentImageIndex, currentSourceIndex, activeSources, imagesBySource]);

  // Suporte a teclado
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (viewMode === 'carousel' && isExpanded) {
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          nextImage();
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault();
          prevImage();
        } else if (event.key === 'Escape') {
          setViewMode('grid');
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [viewMode, isExpanded, nextImage, prevImage]);

  const totalImages = allImages.length;
  const totalHosted = hostedImages.size;
  
  // Calcular estatísticas específicas para imagens upscaled
  const upscaledImages = allImages.filter(img => img.source === 'runware-upscale');
  const totalUpscaled = upscaledImages.length;
  const upscaledHosted = upscaledImages.filter(img => hostedImages.has(img.url)).length;
  const upscaledPending = totalUpscaled - upscaledHosted;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Images className="h-5 w-5 text-primary" />
              Galeria de Imagens IA
            </CardTitle>
            <CardDescription>
              Todas as imagens geradas pelos blocos de IA organizadas por fonte ({totalImages} imagens)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                aiImagesCache.clearAllAICache();
                setAllImages([]);
                toast.success('🧹 Cache de imagens limpo!');
              }}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Limpar Cache
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Upload Manual de Imagens */}
          <ManualImageUploader 
            productId={productId}
            productName={productName}
            onImagesUploaded={refreshGallery}
          />

          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-muted rounded-lg p-3">
              <div className="text-2xl font-bold text-primary">{totalImages}</div>
              <div className="text-xs text-muted-foreground">Total de Imagens</div>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="text-2xl font-bold text-green-600">{totalHosted}</div>
              <div className="text-xs text-muted-foreground">Hospedadas no R2</div>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-600">
                {Object.keys(SOURCE_CONFIGS).filter(source => imagesBySource[source]?.length > 0).length}
              </div>
              <div className="text-xs text-muted-foreground">Fontes Ativas</div>
            </div>
          </div>

          {/* Progress da hospedagem */}
          {isHosting && (
            <div className="space-y-2 bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Hospedando imagens no R2...</span>
                <span>{hostingProgress}%</span>
              </div>
              <Progress value={hostingProgress} className="w-full" />
            </div>
          )}

          {/* Progress do batch upscale */}
          {isBatchUpscaling && (
            <div className="space-y-2 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex justify-between text-sm font-medium">
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  Processando upscale 4x via Runware...
                </span>
                <span>{upscaleProgress}%</span>
              </div>
              <Progress value={upscaleProgress} className="w-full" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>✅ Processadas: {upscaledCount}</span>
                {upscaleErrors > 0 && <span className="text-red-600">❌ Falhas: {upscaleErrors}</span>}
              </div>
            </div>
          )}

          {/* Progress do processamento por bloco */}
          {processingBlock && (
            <div className="space-y-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex justify-between text-sm font-medium">
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  Processando bloco: {SOURCE_CONFIGS[processingBlock as keyof typeof SOURCE_CONFIGS]?.name || processingBlock}
                </span>
                <span>{blockProgress}%</span>
              </div>
              <Progress value={blockProgress} className="w-full" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>✅ Concluídas: {blockProcessedCount}</span>
                <span>
                  {DIRECT_HOST_SOURCES.includes(processingBlock) 
                    ? '⚡ Resize → Host (SEM upscale)' 
                    : '⚡ Upscale 4x → Resize → Host'}
                </span>
              </div>
            </div>
          )}

          {/* Controles de visualização */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={refreshGallery}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Atualizar Galeria
              </Button>
              
              <Button 
                onClick={handleDownloadAll}
                disabled={totalImages === 0}
                variant="outline"
                size="sm"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Todas ({totalImages})
              </Button>

              <Button 
                onClick={handleDirectHostToR2}
                disabled={isHosting || totalImages === 0}
                size="sm"
                variant="outline"
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                {isHosting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Hospedando... ({hostingProgress}%)
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    ☁️ Hospedar Runware Direto ({allImages.filter(img => img.source === 'runware' && !img.hosted).length} pendentes)
                  </>
                )}
              </Button>

              <Button 
                onClick={handleBatchUpscale}
                disabled={isBatchUpscaling || totalImages === 0}
                variant="default"
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                {isBatchUpscaling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Upscaling... ({upscaledCount}/{allImages.filter(img => img.source !== 'runware-upscale').length})
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    🚀 Upscale 4x em Lote
                  </>
                )}
              </Button>
            </div>

            {/* Toggle de modo de visualização */}
            {totalImages > 0 && (
              <div className="flex gap-1 bg-muted p-1 rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 px-3"
                >
                  <Grid3X3 className="h-4 w-4 mr-1" />
                  Grade
                </Button>
                <Button
                  variant={viewMode === 'carousel' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('carousel')}
                  className="h-8 px-3"
                >
                  <ArrowLeftRight className="h-4 w-4 mr-1" />
                  Carousel
                </Button>
              </div>
            )}
          </div>

          {/* Galeria - Grade ou Carousel */}
          {totalImages > 0 ? (
            viewMode === 'grid' ? (
              // Visualização em grade (original)
              <div className="space-y-6">
                {Object.entries(SOURCE_CONFIGS).map(([sourceKey, config]) => {
                  const images = imagesBySource[sourceKey] || [];
                  if (images.length === 0) return null;

                  const IconComponent = config.icon;
                  
                  return (
                    <div key={sourceKey} className={`${config.bgColor} p-4 rounded-lg border-2`}>
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-5 w-5" />
                            <h3 className="font-bold text-base">{config.name}</h3>
                            <Badge variant="secondary" className={`${config.color} font-semibold`}>
                              {images.length} imagens
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Última: {new Date(Math.max(...images.map(img => img.timestamp))).toLocaleString()}
                          </div>
                        </div>
                        
                        {/* Botão de processamento por bloco */}
                        {sourceKey !== 'runware-upscale' && (
                          <Button
                            onClick={() => {
                              if (DIRECT_HOST_SOURCES.includes(sourceKey)) {
                                handleDirectHostBlock(sourceKey);
                              } else {
                                handleBlockUpscaleAndHost(sourceKey);
                              }
                            }}
                            disabled={processingBlock !== null || isBatchUpscaling}
                            size="sm"
                            className={`w-full ${
                              DIRECT_HOST_SOURCES.includes(sourceKey)
                                ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700' 
                                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                            } text-white`}
                          >
                            {processingBlock === sourceKey ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {DIRECT_HOST_SOURCES.includes(sourceKey) ? 'Hospedando...' : 'Processando...'} ({blockProgress}%)
                              </>
                            ) : (
                              <>
                                {DIRECT_HOST_SOURCES.includes(sourceKey) ? (
                                  <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    ☁️ Hospedar Diretamente ({images.length} imagens)
                                  </>
                                ) : (
                                  <>
                                    <Zap className="mr-2 h-4 w-4" />
                                    🚀 Upscale e Hospedar este Bloco ({images.length} imagens)
                                  </>
                                )}
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {images.sort((a, b) => b.timestamp - a.timestamp).map((image, index) => (
                          <div key={image.id} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden bg-white border-2 border-gray-200">
                              <img 
                                src={image.url} 
                                alt={`${config.name} - ${new Date(image.timestamp).toLocaleString()}`}
                                className="w-full h-full object-contain cursor-pointer transition-all duration-300 hover:scale-110"
                                onClick={() => handlePreview(image.url)}
                              />
                            </div>
                            
                            {/* Número da imagem */}
                            <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                              #{index + 1}
                            </div>
                            
                            {/* Dimensões e tamanho */}
                            {(image.width || image.fileSize) ? (
                              <div className="absolute top-1 left-1/2 transform -translate-x-1/2 bg-blue-600/90 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">
                                {image.width && image.height && `${image.width}x${image.height}`}
                                {image.width && image.fileSize && image.fileSize > 0 && ' • '}
                                {image.fileSize && image.fileSize > 0 && formatFileSize(image.fileSize)}
                              </div>
                            ) : null}
                            
                            {/* Indicador de hospedagem */}
                            {hostedImages.has(image.url) && (
                              <div className="absolute top-1 right-1">
                                <CheckCircle className="h-4 w-4 text-green-500 bg-white rounded-full" />
                              </div>
                            )}
                            
                            {/* Overlay de hover */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <Button variant="secondary" size="sm" onClick={() => handlePreview(image.url)}>
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            {/* Data/hora na parte inferior */}
                            <div className="absolute bottom-1 left-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded text-center">
                              {new Date(image.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Visualização em carousel
              <div className="relative">
                {activeSources.length > 0 && (() => {
                  const [currentSourceKey, currentSourceConfig] = activeSources[currentSourceIndex];
                  const currentImages = imagesBySource[currentSourceKey] || [];
                  const currentImage = currentImages[currentImageIndex];
                  
                  if (!currentImage) return null;
                  
                  const IconComponent = currentSourceConfig.icon;
                  const totalInCarousel = activeSources.reduce((total, [sourceKey]) => 
                    total + (imagesBySource[sourceKey]?.length || 0), 0
                  );
                  const currentPosition = activeSources.slice(0, currentSourceIndex).reduce((pos, [sourceKey]) => 
                    pos + (imagesBySource[sourceKey]?.length || 0), 0
                  ) + currentImageIndex + 1;

                  return (
                    <div className="space-y-4">
                      {/* Header do carousel */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <IconComponent className="h-5 w-5" />
                          <h3 className="font-bold text-base">{currentSourceConfig.name}</h3>
                          <Badge variant="secondary" className={`${currentSourceConfig.color} font-semibold`}>
                            {currentImageIndex + 1} de {currentImages.length}
                          </Badge>
                          {/* Informações da imagem */}
                          {currentImage.width && (
                            <Badge variant="outline" className="bg-blue-50">
                              📐 {currentImage.width}x{currentImage.height}
                              {currentImage.fileSize && currentImage.fileSize > 0 && ` • ${formatFileSize(currentImage.fileSize)}`}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {currentPosition} / {totalInCarousel} total
                        </div>
                      </div>

                      {/* Controles de navegação */}
                      <div className="flex items-center justify-center gap-4 mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={prevImage}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        <div className="text-sm font-medium bg-muted px-3 py-1 rounded">
                          {currentPosition} / {totalInCarousel}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={nextImage}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Imagem principal do carousel */}
                      <div className={`${currentSourceConfig.bgColor} p-6 rounded-lg border-2`}>
                        <div className="flex justify-center">
                          <div className="relative max-w-2xl">
                            <div className="aspect-square rounded-lg overflow-hidden bg-white border-2 border-gray-200">
                              <img 
                                src={currentImage.url}
                                alt={`${currentSourceConfig.name} - Imagem ${currentImageIndex + 1}`}
                                className="w-full h-full object-contain cursor-pointer transition-all duration-300 hover:scale-105"
                                onClick={() => handlePreview(currentImage.url)}
                              />
                            </div>
                            
                            {/* Indicadores */}
                            <div className="absolute top-2 left-2 bg-black/70 text-white text-sm px-2 py-1 rounded">
                              #{currentImageIndex + 1}
                            </div>
                            
                            {hostedImages.has(currentImage.url) && (
                              <div className="absolute top-2 right-2">
                                <CheckCircle className="h-5 w-5 text-green-500 bg-white rounded-full" />
                              </div>
                            )}
                            
                            <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-sm px-2 py-1 rounded text-center">
                              {new Date(currentImage.timestamp).toLocaleString()}
                            </div>
                            
                            {/* Botões de navegação sobrepostos */}
                            <Button
                              variant="secondary"
                              size="sm"
                              className="absolute left-2 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 bg-white/90 hover:bg-white"
                              onClick={prevImage}
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </Button>
                            
                            <Button
                              variant="secondary"
                              size="sm"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 bg-white/90 hover:bg-white"
                              onClick={nextImage}
                            >
                              <ChevronRight className="h-5 w-5" />
                            </Button>
                            
                            {/* Botão de preview central */}
                            <Button
                              variant="secondary"
                              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 hover:bg-white"
                              onClick={() => handlePreview(currentImage.url)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver em Tela Cheia
                            </Button>
                          </div>
                        </div>

                        {/* Indicadores de posição por fonte */}
                        <div className="mt-4 space-y-2">
                          {activeSources.map(([sourceKey, sourceConfig], sourceIdx) => {
                            const sourceImages = imagesBySource[sourceKey] || [];
                            const isCurrentSource = sourceIdx === currentSourceIndex;
                            
                            return (
                              <div key={sourceKey} className="flex items-center gap-2">
                                <sourceConfig.icon className="h-4 w-4" />
                                <span className="text-sm font-medium min-w-0 flex-1 truncate">
                                  {sourceConfig.name}
                                </span>
                                <div className="flex gap-1">
                                  {sourceImages.map((_, imgIdx) => (
                                    <button
                                      key={imgIdx}
                                      className={`w-2 h-2 rounded-full transition-colors ${
                                        isCurrentSource && imgIdx === currentImageIndex
                                          ? 'bg-primary'
                                          : isCurrentSource
                                          ? 'bg-primary/30'
                                          : 'bg-gray-300'
                                      }`}
                                      onClick={() => {
                                        setCurrentSourceIndex(sourceIdx);
                                        setCurrentImageIndex(imgIdx);
                                      }}
                                    />
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Dica de navegação */}
                      <div className="text-center text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                        💡 Use as setas do teclado ← → para navegar | ESC para voltar à grade
                      </div>
                    </div>
                  );
                })()}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground border-2 border-dashed rounded-lg">
              <Images className="h-16 w-16 mb-4" />
              <p className="text-sm text-center">
                Nenhuma imagem gerada ainda.
                <br />
                As imagens aparecerão aqui automaticamente quando forem geradas pelos blocos de IA.
              </p>
            </div>
          )}
        </CardContent>
      )}

      {/* Modal de preview */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>Preview da Imagem</DialogTitle>
            <DialogDescription>
              Imagem gerada pelos blocos de IA
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <img 
              src={selectedImage} 
              alt="Preview da imagem"
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};