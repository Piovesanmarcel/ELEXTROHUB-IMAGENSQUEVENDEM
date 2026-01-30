import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Grid3x3, Loader2, Sparkles, Eye, Brain } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';
import { ImageSelector } from '@/components/enhancement/ImageSelector';
import { ShowcaseEditorPanel, TextElement, ImagePosition } from './showcase/ShowcaseEditorPanel';
import { ShowcasePreview } from './showcase/ShowcasePreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShowcaseEditGallery } from './showcase/ShowcaseEditGallery';
import { ShowcaseFullEditor } from './showcase/ShowcaseFullEditor';
import { DraftShowcase } from './showcase/types';
import { useUnifiedCommandsData } from '@/hooks/useUnifiedCommandsData';
import { useImageResizer } from '@/hooks/useImageResizer';
import { Badge } from '@/components/ui/badge';
import { aiImagesCache } from '@/services/AIImagesSessionCache';

interface ProductShowcaseGeneratorProps {
  productId: string;
  productName: string;
  productImages: string[];
  onImagesGenerated: () => void;
}

// Lista de fontes de IA válidas para showcases (exclui kit e outras fontes não-IA)
const VALID_AI_SOURCES = [
  'runware',
  'runware-hosted',
  'gemini',
  'gemini-hosted',
  'gemini-background',
  'gemini-background-hosted',
  'gemini-white-background',
  'gemini-white-background-hosted',
  'bfl',
  'bfl-hosted',
  'tongyi',
  'tongyi-hosted',
  'marketing-gatilhos-cta',
  'marketing-gatilhos-cta-hosted',
  'marketing-gatilhos-benefits',
  'marketing-gatilhos-benefits-hosted',
  'marketing-gatilhos-urgency',
  'marketing-gatilhos-urgency-hosted'
] as const;

export const ProductShowcaseGenerator: React.FC<ProductShowcaseGeneratorProps> = ({
  productId,
  productName,
  productImages,
  onImagesGenerated,
}) => {
  const galleryRootRef = useRef<HTMLDivElement>(null);
  const isGeneratingRef = useRef(false);
  const lastGenerationTimestamp = useRef<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // 🎯 SEPARAÇÃO DE IMAGENS: Fundo branco vs Outras IA
  const [whiteBackgroundImages, setWhiteBackgroundImages] = useState<string[]>([]);
  const [selectedMainImage, setSelectedMainImage] = useState<string | null>(null); // Apenas 1 imagem de fundo branco
  const [circleImages, setCircleImages] = useState<string[]>([]); // Outras imagens IA
  const [selectedCircleImages, setSelectedCircleImages] = useState<string[]>([]); // Exatamente 3 para círculos
  const [isLoading, setIsLoading] = useState(true);
  
  // Editor states
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [imagePositions, setImagePositions] = useState<ImagePosition[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Draft showcases states
  const [draftShowcases, setDraftShowcases] = useState<DraftShowcase[]>([]);
  const [editingShowcaseId, setEditingShowcaseId] = useState<string | null>(null);
  
  // Unified Commands Data integration
  const { getUnifiedDataForProduct } = useUnifiedCommandsData();
  const { resizeImageTo1000x1000 } = useImageResizer();
  const [unifiedDataInfo, setUnifiedDataInfo] = useState<{
    hasData: boolean;
    idealForCount: number;
    environmentsCount: number;
    keywordsCount: number;
    idealEnvironments?: string[];
  }>({ hasData: false, idealForCount: 0, environmentsCount: 0, keywordsCount: 0, idealEnvironments: [] });

  // 🏳️ Tags que identificam imagens de FUNDO BRANCO
  const WHITE_BG_TAGS = [
    'bfl-white-bg',
    'gemini-white-background',
    'gemini-white-background-hosted',
    'white-background',
    'fundo-branco'
  ];

  // 🗄️ Buscar imagens de FUNDO BRANCO (para imagem principal)
  const fetchWhiteBackgroundImages = async (productId: string): Promise<string[]> => {
    try {
      console.log('🏳️ [SHOWCASES] Buscando imagens de FUNDO BRANCO...');
      
      const { data, error } = await supabase
        .from('hosted_images')
        .select('url, tags')
        .contains('tags', [`product:${productId}`])
        .not('url', 'like', 'data:image%')
        .limit(50)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('❌ [SHOWCASES] Erro ao buscar imagens fundo branco:', error);
        return [];
      }

      if (!data || data.length === 0) return [];

      // Filtrar apenas imagens com tags de fundo branco
      const filtered = data.filter(img => {
        if (!img.tags || !Array.isArray(img.tags)) return false;
        
        return img.tags.some(tag => 
          WHITE_BG_TAGS.some(whiteBgTag => 
            tag.includes(whiteBgTag) || 
            tag.includes('source:bfl-white-bg') ||
            tag.includes('ai-source:bfl-white-bg') ||
            tag.includes('original-source:bfl-white-bg')
          )
        );
      });

      console.log(`🏳️ [SHOWCASES] ${filtered.length} imagens de FUNDO BRANCO encontradas`);
      return filtered.map(img => img.url);
    } catch (error) {
      console.error('❌ [SHOWCASES] Erro:', error);
      return [];
    }
  };

  // 🎨 Buscar OUTRAS imagens de IA (para círculos)
  const fetchOtherAIImages = async (productId: string): Promise<string[]> => {
    try {
      console.log('🎨 [SHOWCASES] Buscando outras imagens de IA (para círculos)...');
      
      const { data, error } = await supabase
        .from('hosted_images')
        .select('url, tags')
        .contains('tags', [`product:${productId}`])
        .not('url', 'like', 'data:image%')
        .limit(50)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('❌ [SHOWCASES] Erro ao buscar do banco:', error);
        return [];
      }

      if (!data || data.length === 0) {
        console.log('⚠️ [SHOWCASES] Nenhuma imagem hospedada encontrada no banco');
        return [];
      }

      console.log('📊 [SHOWCASES] Total de imagens hospedadas no banco:', data.length);

      // Filtrar por fonte válida de IA MAS excluir imagens de fundo branco
      const filtered = data.filter(img => {
        if (!img.tags || !Array.isArray(img.tags)) return false;
        
        // EXCLUIR imagens de fundo branco (essas vão para a seleção principal)
        const isWhiteBg = img.tags.some(tag => 
          WHITE_BG_TAGS.some(whiteBgTag => 
            tag.includes(whiteBgTag) || 
            tag.includes('source:bfl-white-bg') ||
            tag.includes('ai-source:bfl-white-bg') ||
            tag.includes('original-source:bfl-white-bg')
          )
        );
        if (isWhiteBg) return false;
        
        // Buscar qualquer tag source: ou ai-source: ou original-source:
        const sourceTag = img.tags.find(tag => 
          tag.startsWith('source:') || 
          tag.startsWith('ai-source:') || 
          tag.startsWith('original-source:')
        );
        
        if (!sourceTag) return false;
        
        // Extrair nome da fonte
        const sourceName = sourceTag
          .replace('source:', '')
          .replace('ai-source:', '')
          .replace('original-source:', '')
          .replace('-hosted', '');
        
        // Verificar se é uma fonte válida de IA
        return VALID_AI_SOURCES.some(validSource => 
          validSource.includes(sourceName) || sourceName.includes('runware') || 
          sourceName.includes('gemini') || sourceName.includes('bfl') || 
          sourceName.includes('tongyi')
        );
      });

      const urls = filtered.map(img => img.url);
      
      console.log(`🎨 [SHOWCASES] ${urls.length} imagens IA (não-brancas) encontradas`);
      
      return urls;
    } catch (error) {
      console.error('❌ [SHOWCASES] Erro:', error);
      return [];
    }
  };

  // 🗄️ CARREGAR IMAGENS HOSPEDADAS DE IAs DO BANCO NO MOUNT
  useEffect(() => {
    const loadHostedImages = async () => {
      console.log('🗄️ [SHOWCASES] Carregando imagens hospedadas de IAs...');
      setIsLoading(true);
      
      // Verificar dados do Comando Unificado
      if (productId) {
        const data = await getUnifiedDataForProduct(productId);
        setUnifiedDataInfo({
          hasData: data.hasUnifiedData,
          idealForCount: data.idealFor?.length || 0,
          environmentsCount: data.idealEnvironments?.length || 0,
          keywordsCount: data.mainKeywords?.length || 0,
          idealEnvironments: data.idealEnvironments || []
        });
        
        if (data.hasUnifiedData) {
          console.log('🎯 [SHOWCASES] Dados do Comando Unificado detectados:', {
            idealFor: data.idealFor?.length,
            environments: data.idealEnvironments?.length,
            keywords: data.mainKeywords?.length,
            environmentsList: data.idealEnvironments
          });
        }
      }
      
      // Buscar imagens separadas: FUNDO BRANCO e OUTRAS
      const [whiteBgImgs, otherImgs] = await Promise.all([
        fetchWhiteBackgroundImages(productId),
        fetchOtherAIImages(productId)
      ]);
      
      setWhiteBackgroundImages(whiteBgImgs);
      setCircleImages(otherImgs);
      
      if (whiteBgImgs.length > 0 || otherImgs.length > 0) {
        console.log(`✨ ${whiteBgImgs.length} imagens de fundo branco + ${otherImgs.length} outras imagens IA carregadas!`);
      }
      // Toast removido - não exibir mensagem ao atualizar página
      
      setIsLoading(false);
    };
    
    loadHostedImages();
  }, [productId]);

  // 🚫 LISTENER REMOVIDO: whiteBackgroundGalleryToKit
  // Agora usamos busca direta no banco de imagens hospedadas

  // 🚫 LISTENER REMOVIDO: geminiWhiteBackgroundToKit
  // Agora usamos busca direta no banco de imagens hospedadas

  // 🔒 Aviso ao sair se houver rascunhos não salvos
  useEffect(() => {
    const hasUnsaved = draftShowcases.some(s => !s.saved);
    if (!hasUnsaved) return;

    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
    };
  }, [draftShowcases]);

  // 🎨 LISTENER PARA RECARREGAR QUANDO NOVAS IMAGENS HOSPEDADAS SÃO CRIADAS
  useEffect(() => {
    const handleImageGenerated = async (event: Event) => {
      try {
        const customEvent = event as CustomEvent;
        const { source, productId: eventProductId, images: newImages } = customEvent.detail || {};
        
        // ✅ FILTRO: Aceitar apenas fontes de IA válidas
        if (!VALID_AI_SOURCES.includes(source)) {
          if (source === 'cloudinary-kit') {
            console.log('🚫 [SHOWCASES] Imagens do Cloudinary Kit ignoradas (não são para showcase)');
          } else {
            console.log(`🚫 [SHOWCASES] Fonte rejeitada (não é IA): ${source}`);
          }
          return;
        }
        
        if (eventProductId === productId && newImages && Array.isArray(newImages)) {
          console.log('🎨 [SHOWCASES] Novas imagens IA detectadas, aguardando hospedagem...');
          
          // Aguardar 2s para dar tempo da hospedagem ocorrer
          setTimeout(async () => {
            console.log('🔄 [SHOWCASES] Recarregando imagens hospedadas do banco...');
            const [whiteBgImgs, otherImgs] = await Promise.all([
              fetchWhiteBackgroundImages(productId),
              fetchOtherAIImages(productId)
            ]);
            
            setWhiteBackgroundImages(whiteBgImgs);
            setCircleImages(otherImgs);
            toast.success(`✨ Imagens recarregadas de ${source}!`);
          }, 2000);
        }
      } catch (error) {
        console.error('❌ [SHOWCASES] Erro ao processar evento:', error);
      }
    };

    window.addEventListener('imageGenerated', handleImageGenerated);
    return () => window.removeEventListener('imageGenerated', handleImageGenerated);
  }, [productId]);

  // 🤖 LISTENER PARA AUTO-GERAÇÃO VIA AUTOMAÇÃO COMPLETA (ACEITA URLS DO EVENTO)
  useEffect(() => {
    const handleAutoGenerate = async (event: Event) => {
      try {
        const now = Date.now();
        const DEBOUNCE_MS = 3000; // 3 segundos de debounce
        
        // ✅ Evitar múltiplas gerações simultâneas (debounce)
        if (isGeneratingRef.current || (now - lastGenerationTimestamp.current) < DEBOUNCE_MS) {
          console.log('⏸️ [SHOWCASES] Ignorando evento duplicado (debounce ativo ou já gerando)');
          return;
        }
        
        const customEvent = event as CustomEvent;
        const { 
          productId: eventProductId, 
          autoGenerate,
          mainImageUrl,      // ✅ URL Blob do fundo branco
          circleImages: eventCircleImages  // ✅ URLs Blob das imagens ambiente
        } = customEvent.detail || {};
        
        if (eventProductId !== productId || !autoGenerate) {
          return;
        }
        
        // ✅ Marcar como gerando e atualizar timestamp
        isGeneratingRef.current = true;
        lastGenerationTimestamp.current = now;
        
        console.log('🤖 [SHOWCASES] ===============================================');
        console.log('🤖 [SHOWCASES] AUTO-GERAÇÃO iniciada pela automação completa!');
        console.log('🤖 [SHOWCASES] ProductId:', eventProductId);
        console.log('🤖 [SHOWCASES] mainImageUrl:', mainImageUrl?.substring(0, 60));
        console.log('🤖 [SHOWCASES] circleImages:', eventCircleImages?.length || 0);
        console.log('🤖 [SHOWCASES] ===============================================');
        
        toast.info('🎨 Iniciando geração automática de Showcases...', { duration: 3000 });
        
        let autoMainImage: string | null = null;
        let autoCircleImages: string[] = [];
        
        // ✅ PRIORIDADE 1: Usar URLs do evento (automação sem banco) - ACEITA 1+ imagens
        if (mainImageUrl && eventCircleImages?.length >= 1) {
          console.log('✅ [SHOWCASES] Usando URLs do evento (modo sem banco)');
          autoMainImage = mainImageUrl;
          
          // ✅ PREENCHER até 3 imagens reutilizando as disponíveis
          const filledCircles = [...eventCircleImages];
          while (filledCircles.length < 3) {
            filledCircles.push(eventCircleImages[filledCircles.length % eventCircleImages.length]);
          }
          autoCircleImages = filledCircles.slice(0, 3);
          console.log(`✅ [SHOWCASES] Círculos preenchidos: ${autoCircleImages.length} (originais: ${eventCircleImages.length})`);
          
          // Atualizar estados para refletir na UI
          setWhiteBackgroundImages([mainImageUrl]);
          setCircleImages(eventCircleImages);
        } else {
          // ❌ FALLBACK 1: Tentar cache de sessão antes do banco
          console.log('⚠️ [SHOWCASES] URLs não recebidas, tentando cache de sessão...');
          
          // Buscar do cache de sessão
          const sessionSources = ['gemini-background', 'runware', 'bfl', 'bfl-white-bg', 'intro-processed', 'benefits-processed'];
          let sessionCircleImages: string[] = [];
          let sessionMainImage: string | null = null;
          
          for (const source of sessionSources) {
            const cached = aiImagesCache.loadImages(productId, source);
            if (cached && cached.length > 0) {
              if (source === 'bfl-white-bg' && !sessionMainImage) {
                sessionMainImage = cached[0];
                console.log(`✅ [SHOWCASES] Imagem fundo branco encontrada no cache: ${source}`);
              } else if (sessionCircleImages.length < 3) {
                sessionCircleImages.push(...cached.slice(0, 3 - sessionCircleImages.length));
                console.log(`✅ [SHOWCASES] ${cached.length} imagens adicionadas do cache: ${source}`);
              }
            }
          }
          
          // Se encontrou no cache, usar
          if (sessionMainImage && sessionCircleImages.length >= 1) {
            console.log(`✅ [SHOWCASES] Usando imagens do cache de sessão`);
            autoMainImage = sessionMainImage;
            const filledFromCache = [...sessionCircleImages];
            while (filledFromCache.length < 3) {
              filledFromCache.push(sessionCircleImages[filledFromCache.length % sessionCircleImages.length]);
            }
            autoCircleImages = filledFromCache.slice(0, 3);
            
            setWhiteBackgroundImages([sessionMainImage]);
            setCircleImages(sessionCircleImages);
          } else {
            // ❌ FALLBACK 2: Usar productImages (prop) se disponível
            if (productImages && productImages.length >= 2) {
              console.log(`⚠️ [SHOWCASES] Usando productImages como fallback: ${productImages.length} imagens`);
              autoMainImage = productImages[0]; // Primeira como principal
              const otherImages = productImages.slice(1);
              const filledFromProps = [...otherImages];
              while (filledFromProps.length < 3) {
                filledFromProps.push(otherImages[filledFromProps.length % otherImages.length]);
              }
              autoCircleImages = filledFromProps.slice(0, 3);
              
              setWhiteBackgroundImages([productImages[0]]);
              setCircleImages(otherImages);
            } else {
              // ❌ FALLBACK 3: Buscar do banco (caso antigo)
              console.log('⚠️ [SHOWCASES] Tentando fallback do banco...');
              
              const [whiteBgImgs, otherImgs] = await Promise.all([
                fetchWhiteBackgroundImages(productId),
                fetchOtherAIImages(productId)
              ]);
              
              console.log(`📊 [SHOWCASES] Fallback banco: ${whiteBgImgs.length} fundo branco, ${otherImgs.length} outras IA`);
              
              setWhiteBackgroundImages(whiteBgImgs);
              setCircleImages(otherImgs);
              
              if (whiteBgImgs.length === 0) {
                console.warn('⚠️ [SHOWCASES] Sem imagem de fundo branco para gerar showcases');
                toast.warning('Nenhuma imagem de fundo branco encontrada para Showcases');
                return;
              }
              
              if (otherImgs.length < 1) {
                console.warn('⚠️ [SHOWCASES] Nenhuma imagem de ambiente para círculos');
                toast.warning('Nenhuma imagem de ambiente encontrada para os círculos do Showcase');
                return;
              }
              
              autoMainImage = whiteBgImgs[0];
              const filledFromDb = [...otherImgs];
              while (filledFromDb.length < 3) {
                filledFromDb.push(otherImgs[filledFromDb.length % otherImgs.length]);
              }
              autoCircleImages = filledFromDb.slice(0, 3);
            }
          }
        }
        
        // Verificar se temos imagem principal
        if (!autoMainImage) {
          toast.warning('Nenhuma imagem principal disponível para Showcases');
          return;
        }
        
        console.log('🎯 [SHOWCASES] Imagens selecionadas:');
        console.log('   - Principal:', autoMainImage?.substring(0, 60));
        console.log('   - Círculos:', autoCircleImages.length, 'imagens');
        
        setSelectedMainImage(autoMainImage);
        setSelectedCircleImages(autoCircleImages);
        
        // Aguardar para state atualizar e iniciar geração
        setTimeout(async () => {
          try {
            console.log('🚀 [SHOWCASES] Iniciando generateShowcases automaticamente...');
            
            setIsGenerating(true);
            setProgress(0);
            
            const drafts: DraftShowcase[] = [];
            let successCount = 0;
            
            const mainImage = autoMainImage!;
            const circleImagesForLayout = autoCircleImages;
            
            // APENAS 2 layouts: Círculos Esquerda e Círculos Direita
            const layouts = [
              { name: 'lateral-esquerda', type: 'composition', circles: 3 },
              { name: 'lateral-direita', type: 'composition', circles: 3 },
            ];
            
            console.log('🎨 [AUTO-SHOWCASES] Gerando 3 layouts...');
            
            for (let i = 0; i < layouts.length; i++) {
              const layout = layouts[i];
              setProgress(((i + 1) / layouts.length) * 100);
              
              try {
                const canvas = await renderLayout(
                  layout.name,
                  mainImage,
                  circleImagesForLayout.slice(0, layout.circles)
                );
                
                // ✅ NOVO: Salvar diretamente na galeria (sem esperar clique)
                const blob = await new Promise<Blob>((resolve, reject) => {
                  canvas.toBlob((b) => {
                    if (b) resolve(b);
                    else reject(new Error('Failed to create blob'));
                  }, 'image/png', 1.0);
                });
                
                await saveToGallery(blob, layout.name);
                console.log(`✅ [AUTO-SHOWCASES] Layout ${layout.name} salvo na galeria`);
                
                successCount++;
              } catch (error) {
                console.error(`❌ [AUTO-SHOWCASES] Erro no layout ${layout.name}:`, error);
              }
            }
            
            // Limpar drafts - showcases já foram salvos na galeria
            setDraftShowcases([]);
            
            if (successCount > 0) {
              toast.success(`✅ ${successCount} Showcases gerados automaticamente!`, { duration: 5000 });
              console.log(`🎉 [AUTO-SHOWCASES] ${successCount} showcases gerados com sucesso!`);
            } else {
              toast.warning('Nenhum Showcase gerado, mas a galeria está intacta');
            }
          } catch (error) {
            console.error('💥 [AUTO-SHOWCASES] Erro crítico capturado:', error);
            toast.error('Erro ao gerar Showcases, mas a galeria está intacta');
          } finally {
            setIsGenerating(false);
            setProgress(0);
            isGeneratingRef.current = false; // ✅ Reset debounce após geração
          }
        }, 500);
        
      } catch (error) {
        console.error('❌ [SHOWCASES] Erro no auto-generate:', error);
        isGeneratingRef.current = false; // Reset debounce on error
      }
    };
    
    window.addEventListener('startShowcaseGeneration', handleAutoGenerate);
    return () => window.removeEventListener('startShowcaseGeneration', handleAutoGenerate);
  }, [productId]);

  const generateShowcases = async () => {
    // 🎯 GARANTIA: Verificar imagem principal de fundo branco
    if (!selectedMainImage) {
      toast.error('🏳️ Selecione uma imagem de FUNDO BRANCO como principal!', {
        duration: 5000
      });
      return;
    }

    // 🎯 GARANTIA: Verificar 3 imagens para círculos
    if (selectedCircleImages.length < 3) {
      toast.error('🔵 Selecione pelo menos 3 imagens para os círculos!', {
        duration: 5000
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    const drafts: DraftShowcase[] = [];
    let successCount = 0;
    let failureCount = 0;
    const errors: { layout: string; error: Error }[] = [];

    try {
      // 🎯 GARANTIA FIEL: Fundo branco como principal, outras para círculos
      const mainImage = selectedMainImage;
      const circleImagesForLayout = selectedCircleImages.slice(0, 3);
      console.log('🏳️ [SHOWCASE] Imagem principal (FUNDO BRANCO):', mainImage?.substring(0, 50));
      console.log('🔵 [SHOWCASE] Imagens para círculos:', circleImagesForLayout.length);
      circleImagesForLayout.forEach((img, idx) => {
        console.log(`   Círculo ${idx + 1}:`, img?.substring(0, 50));
      });

      // APENAS 2 layouts: Círculos Esquerda e Círculos Direita
      const layouts = [
        { name: 'lateral-esquerda', type: 'composition', circles: 3 },
        { name: 'lateral-direita', type: 'composition', circles: 3 },
      ];

      console.log('\n=== 🎨 INICIANDO GERAÇÃO DE 3 SHOWCASES ===');
      
      for (let i = 0; i < layouts.length; i++) {
        const layout = layouts[i];
        console.log(`\n🎨 [SHOWCASE ${i+1}/3] Gerando layout: ${layout.name}`);
        setProgress(((i + 1) / layouts.length) * 100);
        
        try {
          let canvas;
          // Todos os 3 layouts são composições com círculos
          console.log(`   📸 Tipo: Composição com ${layout.circles} círculos`);
          console.log(`   📸 Imagem principal (FUNDO BRANCO): ${mainImage.substring(0, 50)}...`);
          canvas = await renderLayout(
            layout.name,
            mainImage,
            circleImagesForLayout.slice(0, layout.circles)
          );
          console.log(`   ✅ Canvas gerado: ${canvas.width}x${canvas.height}px`);

          // Convert canvas to base64 preview
          const preview = canvas.toDataURL('image/png', 1.0);

          // Store as draft
          drafts.push({
            id: `draft-${Date.now()}-${i}`,
            layoutName: layout.name,
            originalCanvas: canvas,
            preview,
            textElements: [],
            imagePositions: [],
            saved: false,
          });
          
          successCount++;
          console.log(`   ✅ SUCESSO - Showcase ${i+1} adicionado aos rascunhos`);
        } catch (error) {
          failureCount++;
          const err = error as Error;
          errors.push({ layout: layout.name, error: err });
          console.error(`   ❌ FALHA no showcase ${i+1} (${layout.name}):`, err.message);
          console.error(`   Detalhes:`, error);
          // Continuar para o próximo showcase ao invés de parar tudo
        }
      }

      console.log('\n=== 📊 RELATÓRIO DE SHOWCASES ===');
      console.log(`📊 Total: ${layouts.length} layouts`);
      console.log(`✅ Sucesso: ${successCount} (${Math.round(successCount/layouts.length*100)}%)`);
      console.log(`❌ Falhas: ${failureCount}`);
      if (errors.length > 0) {
        console.log('🔍 Detalhes das falhas:');
        errors.forEach(({ layout, error }) => {
          console.error(`   - ${layout}: ${error.message}`);
        });
      }
      console.log('===============================\n');

      setDraftShowcases(drafts);
      
      if (successCount === layouts.length) {
        toast.success('✅ 3 showcases gerados com sucesso! Edite-os antes de salvar.');
      } else if (successCount > 0) {
        toast.success(
          `📊 ${successCount} showcases gerados, ${failureCount} falharam`,
          { 
            duration: 8000,
            description: 'Verifique o console para detalhes dos erros'
          }
        );
      } else {
        toast.error('❌ Falha ao gerar showcases. Verifique o console.');
      }
      
      console.log(`✅ [SHOWCASES] Geração completa. ${successCount} showcases prontos para edição.`);
    } catch (error) {
      console.error('💥 Erro crítico ao gerar showcases:', error);
      toast.error('Erro crítico ao gerar showcases');
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const renderLayout = async (
    layoutName: string,
    mainImage: string | null,
    circleImages: string[]
  ): Promise<HTMLCanvasElement> => {
    // 🛡️ Validar imagem principal
    if (!mainImage) {
      throw new Error('Imagem principal não fornecida para renderLayout');
    }
    
    // 🛡️ Verificar se Blob URL ainda é válida
    if (mainImage.startsWith('blob:')) {
      try {
        const response = await fetch(mainImage);
        if (!response.ok) {
          throw new Error('Blob URL expirada ou inválida');
        }
      } catch (e) {
        console.error('❌ [SHOWCASE] Blob URL inválida:', mainImage.substring(0, 50));
        throw new Error('Imagem principal expirada. Recarregue a página.');
      }
    }
    
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.width = '1200px';
    container.style.height = '1200px';
    document.body.appendChild(container);

    const root = document.createElement('div');
    root.style.width = '1200px';
    root.style.height = '1200px';
    root.style.backgroundColor = '#ffffff';
    root.style.position = 'relative';
    root.style.overflow = 'hidden';
    container.appendChild(root);
    
    // Render custom text elements
    textElements.forEach((textEl) => {
      const textDiv = document.createElement('div');
      textDiv.style.position = 'absolute';
      textDiv.style.left = `${textEl.x}px`;
      textDiv.style.top = `${textEl.y}px`;
      textDiv.style.fontSize = `${textEl.fontSize}px`;
      textDiv.style.fontFamily = textEl.fontFamily;
      textDiv.style.color = textEl.color;
      textDiv.style.fontWeight = textEl.fontWeight;
      textDiv.style.whiteSpace = 'nowrap';
      textDiv.style.padding = '8px 12px';
      textDiv.style.borderRadius = '4px';
      
      // Apply background color with opacity
      const bgOpacity = Math.round(textEl.backgroundOpacity * 255).toString(16).padStart(2, '0');
      textDiv.style.backgroundColor = `${textEl.backgroundColor}${bgOpacity}`;
      
      textDiv.textContent = textEl.text;
      root.appendChild(textDiv);
    });

    // Carregar imagem principal apenas para composições
    const mainImg = mainImage ? await loadImage(mainImage) : null;
    
    // Renderizar layout específico (3 layouts simplificados)
    switch (layoutName) {
      case 'trio-inferior':
        renderTrioInferior(root, mainImg!, circleImages);
        break;
      case 'lateral-direita':
        renderLateralDireita(root, mainImg!, circleImages);
        break;
      case 'lateral-esquerda':
        renderLateralEsquerda(root, mainImg!, circleImages);
        break;
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const canvas = await html2canvas(root, {
      width: 1200,
      height: 1200,
      scale: 1,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    document.body.removeChild(container);
    return canvas;
  };

  const loadImage = (src: string, retries = 2): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const attemptLoad = (attemptsLeft: number) => {
        img.onload = () => {
          console.log(`✅ [IMG-LOAD] Sucesso: ${src.substring(0, 50)}...`);
          resolve(img);
        };
        
        img.onerror = (error) => {
          console.error(`❌ [IMG-LOAD] Tentativa falhou (${attemptsLeft} restantes): ${src.substring(0, 50)}...`, error);
          console.error(`   Tipo: ${typeof src} | Tamanho: ${src.length} caracteres`);
          
          if (attemptsLeft > 0) {
            console.log(`🔄 [IMG-LOAD] Tentando novamente em 1s...`);
            setTimeout(() => attemptLoad(attemptsLeft - 1), 1000);
          } else {
            reject(new Error(`Falha após ${retries + 1} tentativas: ${src.substring(0, 100)}...`));
          }
        };
        
        img.src = src;
      };
      
      attemptLoad(retries);
    });
  };

  // 🔧 Função utilitária para criar círculos perfeitos (sem glitches no html2canvas)
  const createCircle = async (
    imageUrl: string, 
    size: number, 
    top: number, 
    left: number
  ): Promise<HTMLDivElement> => {
    const circle = document.createElement('div');
    circle.style.position = 'absolute';
    circle.style.top = `${top}px`;
    circle.style.left = `${left}px`;
    circle.style.width = `${size}px`;
    circle.style.height = `${size}px`;
    circle.style.borderRadius = '50%';
    circle.style.overflow = 'hidden';
    circle.style.clipPath = 'circle(50% at 50% 50%)'; // Garante corte perfeito
    circle.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'; // Sombra leve
    
    const img = await loadImage(imageUrl);
    const imgEl = document.createElement('img');
    imgEl.src = img.src;
    imgEl.style.position = 'absolute';
    imgEl.style.top = '0';
    imgEl.style.left = '0';
    imgEl.style.width = '100%';
    imgEl.style.height = '100%';
    imgEl.style.objectFit = 'cover';
    
    circle.appendChild(imgEl);
    return circle;
  };

  // 🔧 Função utilitária para criar quadrados arredondados (sem glitches no html2canvas)
  const createRoundedSquare = async (
    imageUrl: string, 
    size: number, 
    top: number, 
    left: number
  ): Promise<HTMLDivElement> => {
    const square = document.createElement('div');
    square.style.position = 'absolute';
    square.style.top = `${top}px`;
    square.style.left = `${left}px`;
    square.style.width = `${size}px`;
    square.style.height = `${size}px`;
    square.style.borderRadius = '16px';
    square.style.overflow = 'hidden';
    square.style.clipPath = 'inset(0 round 16px)'; // Garante corte perfeito
    square.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'; // Sombra leve
    
    const img = await loadImage(imageUrl);
    const imgEl = document.createElement('img');
    imgEl.src = img.src;
    imgEl.style.position = 'absolute';
    imgEl.style.top = '0';
    imgEl.style.left = '0';
    imgEl.style.width = '100%';
    imgEl.style.height = '100%';
    imgEl.style.objectFit = 'cover';
    
    square.appendChild(imgEl);
    return square;
  };

  // 🔧 Função utilitária para criar imagens de collage (preenchem completamente sem margem)
  const createCollageImage = async (
    imageUrl: string, 
    width: number,
    height: number,
    top: number, 
    left: number
  ): Promise<HTMLDivElement> => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = `${top}px`;
    container.style.left = `${left}px`;
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    container.style.overflow = 'hidden';
    container.style.backgroundColor = '#f5f5f5';
    container.style.borderRadius = '12px';
    container.style.boxShadow = 'inset 0 0 10px rgba(0,0,0,0.1)';
    
    const img = await loadImage(imageUrl);
    const imgEl = document.createElement('img');
    imgEl.src = img.src;
    imgEl.style.position = 'absolute';
    imgEl.style.top = '0';
    imgEl.style.left = '0';
    imgEl.style.width = '100%';
    imgEl.style.height = '100%';
    imgEl.style.objectFit = 'contain';
    
    container.appendChild(imgEl);
    return container;
  };

  const renderTrioInferior = async (root: HTMLElement, mainImg: HTMLImageElement, circleImages: string[]) => {
    // Produto principal centralizado 1000x1000
    const mainImgEl = document.createElement('img');
    mainImgEl.src = mainImg.src;
    mainImgEl.style.position = 'absolute';
    mainImgEl.style.top = '100px';
    mainImgEl.style.left = '100px';
    mainImgEl.style.width = '1000px';
    mainImgEl.style.height = '1000px';
    mainImgEl.style.objectFit = 'cover';
    mainImgEl.style.zIndex = '1';
    root.appendChild(mainImgEl);

    // 3 círculos na parte inferior
    const circleSize = 300;
    const spacing = 50;
    const startX = (1200 - (circleSize * 3 + spacing * 2)) / 2;
    const topPosition = 800; // 1200 - 100 (bottom) - 300 (circleSize)

    for (let i = 0; i < 3; i++) {
      const circle = await createCircle(
        circleImages[i],
        circleSize,
        topPosition,
        startX + i * (circleSize + spacing)
      );
      circle.style.zIndex = '2';
      root.appendChild(circle);
    }
  };

  const renderLateralDireita = async (root: HTMLElement, mainImg: HTMLImageElement, circleImages: string[]) => {
    // Produto principal centralizado 1000x1000
    const mainImgEl = document.createElement('img');
    mainImgEl.src = mainImg.src;
    mainImgEl.style.position = 'absolute';
    mainImgEl.style.top = '100px';
    mainImgEl.style.left = '100px';
    mainImgEl.style.width = '1000px';
    mainImgEl.style.height = '1000px';
    mainImgEl.style.objectFit = 'cover';
    mainImgEl.style.zIndex = '1';
    root.appendChild(mainImgEl);

    // 3 círculos empilhados à direita
    const circleSize = 280;
    const spacing = 40;
    const startY = (1200 - (circleSize * 3 + spacing * 2)) / 2;
    const leftPosition = 820; // 1200 - 100 (right) - 280 (circleSize)

    for (let i = 0; i < 3; i++) {
      const circle = await createCircle(
        circleImages[i],
        circleSize,
        startY + i * (circleSize + spacing),
        leftPosition
      );
      circle.style.zIndex = '2';
      root.appendChild(circle);
    }
  };

  const renderLateralEsquerda = async (root: HTMLElement, mainImg: HTMLImageElement, circleImages: string[]) => {
    // Produto principal centralizado 1000x1000
    const mainImgEl = document.createElement('img');
    mainImgEl.src = mainImg.src;
    mainImgEl.style.position = 'absolute';
    mainImgEl.style.top = '100px';
    mainImgEl.style.left = '100px';
    mainImgEl.style.width = '1000px';
    mainImgEl.style.height = '1000px';
    mainImgEl.style.objectFit = 'cover';
    mainImgEl.style.zIndex = '1';
    root.appendChild(mainImgEl);

    // 3 círculos empilhados à esquerda
    const circleSize = 280;
    const spacing = 40;
    const startY = (1200 - (circleSize * 3 + spacing * 2)) / 2;
    const leftPosition = 100;

    for (let i = 0; i < 3; i++) {
      const circle = await createCircle(
        circleImages[i],
        circleSize,
        startY + i * (circleSize + spacing),
        leftPosition
      );
      circle.style.zIndex = '2';
      root.appendChild(circle);
    }
  };

  const renderQuatroCantos = async (root: HTMLElement, mainImg: HTMLImageElement, circleImages: string[]) => {
    // Produto principal centralizado 1000x1000
    const mainImgEl = document.createElement('img');
    mainImgEl.src = mainImg.src;
    mainImgEl.style.position = 'absolute';
    mainImgEl.style.top = '100px';
    mainImgEl.style.left = '100px';
    mainImgEl.style.width = '1000px';
    mainImgEl.style.height = '1000px';
    mainImgEl.style.objectFit = 'cover';
    mainImgEl.style.zIndex = '1';
    root.appendChild(mainImgEl);

    // 4 círculos nos cantos (usando absolute positioning)
    const circleSize = 250;
    const positions = [
      { top: 80, left: 80 },      // superior esquerdo
      { top: 80, left: 870 },     // superior direito (1200 - 80 - 250)
      { top: 870, left: 80 },     // inferior esquerdo (1200 - 80 - 250)
      { top: 870, left: 870 },    // inferior direito
    ];

    for (let i = 0; i < 4; i++) {
      const circle = await createCircle(
        circleImages[i],
        circleSize,
        positions[i].top,
        positions[i].left
      );
      circle.style.zIndex = '2';
      root.appendChild(circle);
    }
  };

  const renderCircularCompleto = async (root: HTMLElement, mainImg: HTMLImageElement, circleImages: string[]) => {
    // Produto principal centralizado 1000x1000
    const mainImgEl = document.createElement('img');
    mainImgEl.src = mainImg.src;
    mainImgEl.style.position = 'absolute';
    mainImgEl.style.top = '100px';
    mainImgEl.style.left = '100px';
    mainImgEl.style.width = '1000px';
    mainImgEl.style.height = '1000px';
    mainImgEl.style.objectFit = 'cover';
    mainImgEl.style.zIndex = '1';
    root.appendChild(mainImgEl);

    // 4 círculos ao redor (usando absolute positioning)
    const circleSize = 280;
    const positions = [
      { top: 50, left: 460 },     // topo (centralizado: 600 - 280/2)
      { top: 460, left: 870 },    // direita (1200 - 50 - 280)
      { top: 870, left: 460 },    // embaixo (1200 - 50 - 280)
      { top: 460, left: 50 },     // esquerda
    ];

    for (let i = 0; i < 4; i++) {
      const circle = await createCircle(
        circleImages[i],
        circleSize,
        positions[i].top,
        positions[i].left
      );
      circle.style.zIndex = '2';
      root.appendChild(circle);
    }
  };

  const renderDiagonal = async (root: HTMLElement, mainImg: HTMLImageElement, circleImages: string[]) => {
    // Produto principal centralizado 1000x1000
    const mainImgEl = document.createElement('img');
    mainImgEl.src = mainImg.src;
    mainImgEl.style.position = 'absolute';
    mainImgEl.style.top = '100px';
    mainImgEl.style.left = '100px';
    mainImgEl.style.width = '1000px';
    mainImgEl.style.height = '1000px';
    mainImgEl.style.objectFit = 'cover';
    mainImgEl.style.zIndex = '1';
    root.appendChild(mainImgEl);

    // 3 círculos em diagonal na frente
    const circleSize = 260;
    const positions = [
      { top: 100, left: 820 },
      { top: 470, left: 720 },
      { top: 840, left: 620 },
    ];

    for (let i = 0; i < 3; i++) {
      const circle = await createCircle(
        circleImages[i],
        circleSize,
        positions[i].top,
        positions[i].left
      );
      circle.style.zIndex = '2';
      root.appendChild(circle);
    }
  };

  // =============== LAYOUTS COM QUADRADOS ARREDONDADOS ===============

  const renderTrioInferiorSquare = async (root: HTMLElement, mainImg: HTMLImageElement, circleImages: string[]) => {
    // Produto principal centralizado 1000x1000
    const mainImgEl = document.createElement('img');
    mainImgEl.src = mainImg.src;
    mainImgEl.style.position = 'absolute';
    mainImgEl.style.top = '100px';
    mainImgEl.style.left = '100px';
    mainImgEl.style.width = '1000px';
    mainImgEl.style.height = '1000px';
    mainImgEl.style.objectFit = 'cover';
    mainImgEl.style.zIndex = '1';
    root.appendChild(mainImgEl);

    // 3 quadrados na parte inferior
    const squareSize = 300;
    const spacing = 50;
    const startX = (1200 - (squareSize * 3 + spacing * 2)) / 2;
    const topPosition = 800;

    for (let i = 0; i < 3; i++) {
      const square = await createRoundedSquare(
        circleImages[i],
        squareSize,
        topPosition,
        startX + i * (squareSize + spacing)
      );
      square.style.zIndex = '2';
      root.appendChild(square);
    }
  };

  const renderLateralDireitaSquare = async (root: HTMLElement, mainImg: HTMLImageElement, circleImages: string[]) => {
    // Produto principal centralizado 1000x1000
    const mainImgEl = document.createElement('img');
    mainImgEl.src = mainImg.src;
    mainImgEl.style.position = 'absolute';
    mainImgEl.style.top = '100px';
    mainImgEl.style.left = '100px';
    mainImgEl.style.width = '1000px';
    mainImgEl.style.height = '1000px';
    mainImgEl.style.objectFit = 'cover';
    mainImgEl.style.zIndex = '1';
    root.appendChild(mainImgEl);

    // 3 quadrados empilhados à direita
    const squareSize = 280;
    const spacing = 40;
    const startY = (1200 - (squareSize * 3 + spacing * 2)) / 2;
    const leftPosition = 820;

    for (let i = 0; i < 3; i++) {
      const square = await createRoundedSquare(
        circleImages[i],
        squareSize,
        startY + i * (squareSize + spacing),
        leftPosition
      );
      square.style.zIndex = '2';
      root.appendChild(square);
    }
  };

  const renderLateralEsquerdaSquare = async (root: HTMLElement, mainImg: HTMLImageElement, circleImages: string[]) => {
    // Produto principal centralizado 1000x1000
    const mainImgEl = document.createElement('img');
    mainImgEl.src = mainImg.src;
    mainImgEl.style.position = 'absolute';
    mainImgEl.style.top = '100px';
    mainImgEl.style.left = '100px';
    mainImgEl.style.width = '1000px';
    mainImgEl.style.height = '1000px';
    mainImgEl.style.objectFit = 'cover';
    mainImgEl.style.zIndex = '1';
    root.appendChild(mainImgEl);

    // 3 quadrados empilhados à esquerda
    const squareSize = 280;
    const spacing = 40;
    const startY = (1200 - (squareSize * 3 + spacing * 2)) / 2;
    const leftPosition = 100;

    for (let i = 0; i < 3; i++) {
      const square = await createRoundedSquare(
        circleImages[i],
        squareSize,
        startY + i * (squareSize + spacing),
        leftPosition
      );
      square.style.zIndex = '2';
      root.appendChild(square);
    }
  };

  const renderQuatroCantoSquare = async (root: HTMLElement, mainImg: HTMLImageElement, circleImages: string[]) => {
    // Produto principal centralizado 1000x1000
    const mainImgEl = document.createElement('img');
    mainImgEl.src = mainImg.src;
    mainImgEl.style.position = 'absolute';
    mainImgEl.style.top = '100px';
    mainImgEl.style.left = '100px';
    mainImgEl.style.width = '1000px';
    mainImgEl.style.height = '1000px';
    mainImgEl.style.objectFit = 'cover';
    mainImgEl.style.zIndex = '1';
    root.appendChild(mainImgEl);

    // 4 quadrados nos cantos
    const squareSize = 250;
    const positions = [
      { top: 80, left: 80 },
      { top: 80, left: 870 },
      { top: 870, left: 80 },
      { top: 870, left: 870 },
    ];

    for (let i = 0; i < 4; i++) {
      const square = await createRoundedSquare(
        circleImages[i],
        squareSize,
        positions[i].top,
        positions[i].left
      );
      square.style.zIndex = '2';
      root.appendChild(square);
    }
  };

  const renderCircularCompletoSquare = async (root: HTMLElement, mainImg: HTMLImageElement, circleImages: string[]) => {
    // Produto principal centralizado 1000x1000
    const mainImgEl = document.createElement('img');
    mainImgEl.src = mainImg.src;
    mainImgEl.style.position = 'absolute';
    mainImgEl.style.top = '100px';
    mainImgEl.style.left = '100px';
    mainImgEl.style.width = '1000px';
    mainImgEl.style.height = '1000px';
    mainImgEl.style.objectFit = 'cover';
    mainImgEl.style.zIndex = '1';
    root.appendChild(mainImgEl);

    // 4 quadrados ao redor
    const squareSize = 280;
    const positions = [
      { top: 50, left: 460 },
      { top: 460, left: 870 },
      { top: 870, left: 460 },
      { top: 460, left: 50 },
    ];

    for (let i = 0; i < 4; i++) {
      const square = await createRoundedSquare(
        circleImages[i],
        squareSize,
        positions[i].top,
        positions[i].left
      );
      square.style.zIndex = '2';
      root.appendChild(square);
    }
  };

  const renderDiagonalSquare = async (root: HTMLElement, mainImg: HTMLImageElement, circleImages: string[]) => {
    // Produto principal centralizado 1000x1000
    const mainImgEl = document.createElement('img');
    mainImgEl.src = mainImg.src;
    mainImgEl.style.position = 'absolute';
    mainImgEl.style.top = '100px';
    mainImgEl.style.left = '100px';
    mainImgEl.style.width = '1000px';
    mainImgEl.style.height = '1000px';
    mainImgEl.style.objectFit = 'cover';
    mainImgEl.style.zIndex = '1';
    root.appendChild(mainImgEl);

    // 3 quadrados em diagonal na frente
    const squareSize = 260;
    const positions = [
      { top: 100, left: 820 },
      { top: 470, left: 720 },
      { top: 840, left: 620 },
    ];

    for (let i = 0; i < 3; i++) {
      const square = await createRoundedSquare(
        circleImages[i],
        squareSize,
        positions[i].top,
        positions[i].left
      );
      square.style.zIndex = '2';
      root.appendChild(square);
    }
  };

  // ==================== FUNÇÕES DE COLLAGE (6 IMAGENS DE IA) ====================

  // Collage 1: Grid 3x2 (2 linhas, 3 colunas) - Quadrados
  const renderCollageGrid2x3 = async (root: HTMLElement, images: string[]) => {
    const squareSize = 400;
    const marginTop = 200;
    
    for (let i = 0; i < 6; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const img = await createCollageImage(
        images[i],
        squareSize,
        squareSize,
        marginTop + (row * squareSize),
        col * squareSize
      );
      root.appendChild(img);
    }
  };

  // Collage 2: Grid 3x2 Uniforme - Quadrados
  const renderCollageMosaic = async (root: HTMLElement, images: string[]) => {
    const squareSize = 400;
    const marginTop = 200;
    
    for (let i = 0; i < 6; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const img = await createCollageImage(
        images[i],
        squareSize,
        squareSize,
        marginTop + (row * squareSize),
        col * squareSize
      );
      root.appendChild(img);
    }
  };

  // Collage 3: Grid 3x2 Uniforme - Quadrados
  const renderCollageVertical = async (root: HTMLElement, images: string[]) => {
    const squareSize = 400;
    const marginTop = 200;
    
    for (let i = 0; i < 6; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const img = await createCollageImage(
        images[i],
        squareSize,
        squareSize,
        marginTop + (row * squareSize),
        col * squareSize
      );
      root.appendChild(img);
    }
  };

  // Collage 4: Grid 3x2 Uniforme - Quadrados
  const renderCollageDiagonalSplit = async (root: HTMLElement, images: string[]) => {
    const squareSize = 400;
    const marginTop = 200;
    
    for (let i = 0; i < 6; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const img = await createCollageImage(
        images[i],
        squareSize,
        squareSize,
        marginTop + (row * squareSize),
        col * squareSize
      );
      root.appendChild(img);
    }
  };

  // Collage 5: Grid 3x2 Uniforme - Quadrados
  const renderCollageRandomMix = async (root: HTMLElement, images: string[]) => {
    const squareSize = 400;
    const marginTop = 200;
    
    for (let i = 0; i < 6; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const img = await createCollageImage(
        images[i],
        squareSize,
        squareSize,
        marginTop + (row * squareSize),
        col * squareSize
      );
      root.appendChild(img);
    }
  };

  // ==================== FIM DAS FUNÇÕES DE COLLAGE ====================

  const saveToGallery = async (blob: Blob, layoutName: string) => {
    // Converter blob para base64
    const reader = new FileReader();
    return new Promise<void>((resolve) => {
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          
          let imageToSave = base64;
          
          // 🔄 Tentar resize, mas não falhar se der erro
          try {
            console.log('🔄 [SHOWCASE] Convertendo imagem para Blob...');
            const resizedBlobUrl = await resizeImageTo1000x1000(base64);
            imageToSave = resizedBlobUrl;
            console.log('✅ [SHOWCASE] Conversão Blob concluída:', resizedBlobUrl.substring(0, 50));
          } catch (resizeError) {
            console.warn('⚠️ [SHOWCASE] Resize falhou, usando original:', resizeError);
            // Continuar com base64 original
          }
          
          // ✅ SALVAR NO CACHE DA SESSÃO PRIMEIRO (independente da galeria estar montada)
          const existingCache = aiImagesCache.loadImages(productId, 'showcase') || [];
          aiImagesCache.saveImages(productId, 'showcase', [...existingCache, imageToSave]);
          console.log('💾 [SHOWCASE] Imagem salva no cache da sessão');
          
          // Disparar evento para adicionar à galeria de sessão
          const event = new CustomEvent('imageGenerated', {
            detail: {
              source: 'showcase',
              images: [imageToSave],
              productId: productId,
              batchId: `showcase-${layoutName}-${Date.now()}`,
            }
          });
          
          window.dispatchEvent(event);

          // 🔄 PERSISTIR NO BANCO (hosted_images) - usar import dinâmico
          try {
            const { hostAndSaveGeneratedImage } = await import('@/services/hostAndSaveGeneratedImage');
            console.log('📤 [SHOWCASE] Iniciando hospedagem da imagem...');
            
            const hostResult = await hostAndSaveGeneratedImage({
              imageUrl: imageToSave,
              productId: productId,
              productName: productName,
              source: 'showcase',
              templateName: `showcase-${layoutName}`,
              tags: ['showcase', `layout:${layoutName}`]
            });

            if (hostResult.success) {
              console.log('✅ [SHOWCASE] Imagem hospedada com sucesso:', hostResult.hostedUrl);
            } else {
              console.warn('⚠️ [SHOWCASE] Falha ao hospedar imagem:', hostResult.error);
            }
          } catch (hostError) {
            console.error('❌ [SHOWCASE] Erro ao hospedar imagem:', hostError);
            // Não bloquear - a imagem já está na sessão
          }
          
          resolve();
        } catch (error) {
          console.error('❌ [SHOWCASE] Erro em saveToGallery:', error);
          resolve(); // Não rejeitar para não quebrar o fluxo
        }
      };
      reader.onerror = () => {
        console.error('❌ [SHOWCASE] Erro ao ler blob');
        resolve(); // Não rejeitar para não quebrar o fluxo
      };
      reader.readAsDataURL(blob);
    });
  };

  // 🎯 GARANTIA: Precisa de 1 imagem fundo branco + 3 imagens para círculos
  const canGenerate = !isLoading && !!selectedMainImage && selectedCircleImages.length >= 3;

  const handleAddText = () => {
    const newText: TextElement = {
      id: `text-${Date.now()}`,
      text: 'Novo Texto',
      x: 100,
      y: 100,
      fontSize: 48,
      fontFamily: 'Arial',
      color: '#000000',
      fontWeight: 'bold',
      backgroundColor: '#ffffff',
      backgroundOpacity: 0,
    };
    setTextElements([...textElements, newText]);
    setSelectedTextId(newText.id);
  };

  const handleUpdateText = (id: string, updates: Partial<TextElement>) => {
    setTextElements(textElements.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleDeleteText = (id: string) => {
    setTextElements(textElements.filter(t => t.id !== id));
    if (selectedTextId === id) {
      setSelectedTextId(null);
    }
  };

  const handleUpdateTextPosition = (id: string, x: number, y: number) => {
    handleUpdateText(id, { x, y });
  };

  const handleUpdateImagePosition = (index: number, x: number, y: number) => {
    setImagePositions(prev => {
      const existing = prev.find(p => p.imageIndex === index);
      if (existing) {
        return prev.map(p => p.imageIndex === index ? { ...p, x, y } : p);
      }
      return [...prev, { imageIndex: index, x, y, width: 150, height: 150 }];
    });
  };

  // Draft showcase handlers
  const handleEditShowcase = (id: string) => {
    setEditingShowcaseId(id);
  };

  const handleSaveShowcase = async (
    id: string,
    textElements: TextElement[],
    imagePositions: ImagePosition[],
    e?: React.MouseEvent
  ) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log('🔒 [SHOWCASE-SAVE] Iniciando salvamento individual sem reload...');
    console.log('🔒 [SHOWCASE-SAVE] Event:', e);
    console.log('🔒 [SHOWCASE-SAVE] PreventDefault aplicado:', e?.defaultPrevented);
    
    const showcase = draftShowcases.find(s => s.id === id);
    if (!showcase) return;

    try {
      // Render canvas with edits
      const canvas = await renderCanvasWithEdits(
        showcase.originalCanvas,
        textElements,
        imagePositions
      );

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png', 1.0);
      });

      await saveToGallery(blob, `showcase-${showcase.layoutName}`);

      // Mark as saved
      setDraftShowcases(prev =>
        prev.map(s => s.id === id ? { ...s, saved: true, textElements, imagePositions } : s)
      );

      toast.success(`✅ Showcase "${showcase.layoutName}" salvo na galeria!`);
      setEditingShowcaseId(null);
    } catch (error) {
      console.error('Erro ao salvar showcase:', error);
      toast.error('Erro ao salvar showcase');
    }
  };

  const handleSaveAll = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log('🔒 [SHOWCASE-SAVE-ALL] Iniciando salvamento em lote sem reload...');
    console.log('🔒 [SHOWCASE-SAVE-ALL] Event:', e);
    console.log('🔒 [SHOWCASE-SAVE-ALL] PreventDefault aplicado:', e?.defaultPrevented);
    
    const unsaved = draftShowcases.filter(s => !s.saved);
    if (unsaved.length === 0) {
      toast.info('Todos os showcases já foram salvos!');
      return;
    }

    try {
      for (const showcase of unsaved) {
        const canvas = await renderCanvasWithEdits(
          showcase.originalCanvas,
          showcase.textElements,
          showcase.imagePositions
        );

        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), 'image/png', 1.0);
        });

        await saveToGallery(blob, `showcase-${showcase.layoutName}`);
      }

      setDraftShowcases(prev => prev.map(s => ({ ...s, saved: true })));
      toast.success(`✅ ${unsaved.length} showcases salvos na galeria!`);
      // onImagesGenerated(); // Removido para evitar recarregamento/reativações no ProductDetails
      
      // Clear drafts after saving
      // Removido o auto-clear para evitar sensação de "reload" e perda do trabalho
    } catch (error) {
      console.error('Erro ao salvar todos os showcases:', error);
      toast.error('Erro ao salvar showcases');
    }
  };

  const handleDiscardAll = () => {
    setDraftShowcases([]);
    toast.info('Showcases descartados');
  };

  const renderCanvasWithEdits = async (
    originalCanvas: HTMLCanvasElement,
    textElements: TextElement[],
    imagePositions: ImagePosition[]
  ): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d')!;

    // Draw original canvas
    ctx.drawImage(originalCanvas, 0, 0);

    // Draw text elements
    for (const textEl of textElements) {
      // Measure text for background
      ctx.font = `${textEl.fontWeight} ${textEl.fontSize}px ${textEl.fontFamily}`;
      const textMetrics = ctx.measureText(textEl.text);
      const textWidth = textMetrics.width;
      const textHeight = textEl.fontSize;
      
      // Draw background with opacity
      if (textEl.backgroundOpacity > 0) {
        const bgOpacity = Math.round(textEl.backgroundOpacity * 255).toString(16).padStart(2, '0');
        ctx.fillStyle = `${textEl.backgroundColor}${bgOpacity}`;
        ctx.fillRect(
          textEl.x - 12,
          textEl.y - 8,
          textWidth + 24,
          textHeight + 16
        );
      }
      
      // Draw text
      ctx.fillStyle = textEl.color;
      ctx.fillText(textEl.text, textEl.x, textEl.y + textEl.fontSize);
    }

    return canvas;
  };

  // Show full editor if editing
  const editingShowcase = editingShowcaseId
    ? draftShowcases.find(s => s.id === editingShowcaseId)
    : null;

  if (editingShowcase) {
    return (
      <ShowcaseFullEditor
        showcase={editingShowcase}
        onSave={handleSaveShowcase}
        onClose={() => setEditingShowcaseId(null)}
      />
    );
  }

  // Show gallery if there are drafts
  if (draftShowcases.length > 0) {
    return (
      <Card className="p-6">
        <ShowcaseEditGallery
          draftShowcases={draftShowcases}
          onEditShowcase={handleEditShowcase}
          onSaveAll={handleSaveAll}
          onDiscardAll={handleDiscardAll}
        />
      </Card>
    );
  }

  // Default configuration view
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Grid3x3 className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold">Showcases de Produto</h3>
              <p className="text-sm text-muted-foreground">
                Gere 15 showcases personalizados (10 composições + 5 collages de IA)
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="editor">Editor & Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            {/* Debug: Mostrar contagem de imagens */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900">
                📊 Imagens carregadas: <span className="font-bold">{whiteBackgroundImages.length} fundo branco</span> + <span className="font-bold">{circleImages.length} outras IA</span>
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Produto ID: <code className="bg-white px-1 py-0.5 rounded">{productId}</code>
              </p>
              
              <Button 
                onClick={async () => {
                  setIsLoading(true);
                  const [whiteBgImgs, otherImgs] = await Promise.all([
                    fetchWhiteBackgroundImages(productId),
                    fetchOtherAIImages(productId)
                  ]);
                  setWhiteBackgroundImages(whiteBgImgs);
                  setCircleImages(otherImgs);
                  setIsLoading(false);
                  toast.info(`🔄 Recarregado: ${whiteBgImgs.length} fundo branco + ${otherImgs.length} outras IA`);
                }}
                size="sm"
                variant="outline"
                className="mt-3"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  '🔄 Recarregar Imagens do Banco'
                )}
              </Button>
            </div>

            {/* 🏳️ SELEÇÃO 1: Imagem Principal (FUNDO BRANCO) - OBRIGATÓRIA */}
            <div className="space-y-3 p-4 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-300 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏳️</span>
                <h4 className="text-sm font-bold text-gray-900">IMAGEM PRINCIPAL (Fundo Branco) - Obrigatória</h4>
                <Badge variant={selectedMainImage ? "default" : "destructive"}>
                  {selectedMainImage ? "1 selecionada" : "Nenhuma selecionada"}
                </Badge>
              </div>
              <p className="text-xs text-gray-600">
                Selecione <strong>1 imagem de fundo branco</strong> que será usada como imagem principal em todos os showcases.
              </p>
              
              {whiteBackgroundImages.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {whiteBackgroundImages.map((url, idx) => (
                    <div 
                      key={idx}
                      className={`aspect-square rounded-lg overflow-hidden border-3 cursor-pointer transition-all ${
                        selectedMainImage === url 
                          ? 'border-green-500 ring-2 ring-green-300 scale-105' 
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                      onClick={() => setSelectedMainImage(selectedMainImage === url ? null : url)}
                    >
                      <img 
                        src={url} 
                        alt={`Fundo Branco ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {selectedMainImage === url && (
                        <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                          <span className="text-2xl">✓</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-orange-600 bg-orange-50 p-3 rounded">
                  ⚠️ Nenhuma imagem de fundo branco encontrada. Gere imagens com BFL White Background primeiro!
                </p>
              )}
            </div>

            {/* 🔵 SELEÇÃO 2: Imagens para Círculos (Outras IA) - Mínimo 3 */}
            <div className="space-y-3 p-4 bg-gradient-to-r from-blue-50 to-white border-2 border-blue-300 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔵</span>
                <h4 className="text-sm font-bold text-blue-900">IMAGENS PARA CÍRCULOS (Outras IA) - Mínimo 3</h4>
                <Badge variant={selectedCircleImages.length >= 3 ? "default" : "destructive"}>
                  {selectedCircleImages.length} selecionada(s)
                </Badge>
              </div>
              <p className="text-xs text-blue-700">
                Selecione <strong>pelo menos 3 imagens</strong> que aparecerão nos círculos ao redor da imagem principal.
              </p>
              
              {circleImages.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {circleImages.map((url, idx) => {
                    const isSelected = selectedCircleImages.includes(url);
                    const selectionIndex = selectedCircleImages.indexOf(url);
                    
                    return (
                      <div 
                        key={idx}
                        className={`aspect-square rounded-lg overflow-hidden border-3 cursor-pointer transition-all relative ${
                          isSelected 
                            ? 'border-blue-500 ring-2 ring-blue-300 scale-105' 
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedCircleImages(selectedCircleImages.filter(u => u !== url));
                          } else {
                            setSelectedCircleImages([...selectedCircleImages, url]);
                          }
                        }}
                      >
                        <img 
                          src={url} 
                          alt={`IA ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                            {selectionIndex + 1}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-orange-600 bg-orange-50 p-3 rounded">
                  ⚠️ Nenhuma imagem de IA encontrada. Gere imagens com Runware, Gemini ou BFL primeiro!
                </p>
              )}
            </div>

            {/* Botão de Gerar */}
            <div className="flex items-center gap-4">
              <Button
                onClick={generateShowcases}
                disabled={!canGenerate || isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando... {Math.round(progress)}%
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Gerar 3 Showcases
                  </>
                )}
              </Button>
            </div>

            {!canGenerate && !isLoading && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  {!selectedMainImage && '🏳️ Selecione 1 imagem de FUNDO BRANCO como principal'}
                  {!selectedMainImage && selectedCircleImages.length < 3 && ' e '}
                  {selectedCircleImages.length < 3 && `🔵 Selecione pelo menos 3 imagens para os círculos (faltam ${3 - selectedCircleImages.length})`}
                </p>
              </div>
            )}
            
            {(whiteBackgroundImages.length > 0 || circleImages.length > 0) && (
              <div className="space-y-2">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>✨ Total: {whiteBackgroundImages.length + circleImages.length} imagens IA disponíveis</strong> ({whiteBackgroundImages.length} fundo branco + {circleImages.length} outras)
                  </p>
                </div>
                
                {unifiedDataInfo.hasData && (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-green-500 shadow-sm">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-base font-bold text-green-900">
                            🎯 Sistema de Variações de Prompts Ativo
                          </p>
                          <span className="px-2 py-1 bg-green-200 text-green-800 text-xs font-semibold rounded">
                            Copywriting Profissional
                          </span>
                        </div>
                        <p className="text-sm text-green-800 mb-3 leading-relaxed">
                          Dados do <strong>Comando Unificado</strong> e <strong>Copywriting Profissional</strong> detectados! 
                          Cada IA gerará imagens com <span className="font-semibold">contextos únicos</span> baseados em:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                          {unifiedDataInfo.idealForCount > 0 && (
                            <div className="flex items-center gap-2 p-2 bg-white rounded border border-green-200">
                              <span className="text-lg">🎯</span>
                              <div>
                                <div className="text-xs text-gray-600">IDEAL PARA</div>
                                <div className="font-bold text-green-700">{unifiedDataInfo.idealForCount} cenários</div>
                              </div>
                            </div>
                          )}
                          {unifiedDataInfo.environmentsCount > 0 && (
                            <div className="flex items-center gap-2 p-2 bg-white rounded border border-blue-200">
                              <span className="text-lg">🏠</span>
                              <div>
                                <div className="text-xs text-gray-600">AMBIENTES IDEAIS</div>
                                <div className="font-bold text-blue-700">{unifiedDataInfo.environmentsCount} contextos</div>
                              </div>
                            </div>
                          )}
                          {unifiedDataInfo.keywordsCount > 0 && (
                            <div className="flex items-center gap-2 p-2 bg-white rounded border border-purple-200">
                              <span className="text-lg">🔑</span>
                              <div>
                                <div className="text-xs text-gray-600">KEYWORDS SEO</div>
                                <div className="font-bold text-purple-700">{unifiedDataInfo.keywordsCount} termos</div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {unifiedDataInfo.idealEnvironments && unifiedDataInfo.idealEnvironments.length > 0 && (
                          <div className="bg-white p-3 rounded border border-blue-200 mb-3">
                            <p className="text-xs font-semibold text-blue-800 mb-2">
                              🏢 Ambientes que serão usados nas gerações:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {unifiedDataInfo.idealEnvironments.map((env, idx) => (
                                <span 
                                  key={idx}
                                  className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded border border-blue-200"
                                >
                                  {env}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="bg-white p-3 rounded border border-green-200">
                          <p className="text-xs text-green-700 font-medium">
                            ✨ <strong>Resultado:</strong> Máxima diversidade visual mantendo consistência do produto
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            → Todos os 7 geradores (Runware, BFL, Runway, Gemini, Stability, Tongyi, Freepik) 
                            receberão contextos diferentes automaticamente
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {isLoading && (
              <p className="text-sm text-muted-foreground">
                🔄 Carregando imagens da galeria AI...
              </p>
            )}
          </TabsContent>

          <TabsContent value="editor" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-1">
                <ShowcaseEditorPanel
                  textElements={textElements}
                  onAddText={handleAddText}
                  onUpdateText={handleUpdateText}
                  onDeleteText={handleDeleteText}
                  selectedTextId={selectedTextId}
                  onSelectText={setSelectedTextId}
                />
              </div>
              
              <div className="lg:col-span-2">
                <ShowcasePreview
                  width={1200}
                  height={1200}
                  mainImage={selectedMainImage || null}
                  aiImages={selectedCircleImages.slice(0, 3)}
                  textElements={textElements}
                  imagePositions={imagePositions}
                  onUpdateTextPosition={handleUpdateTextPosition}
                  onUpdateImagePosition={handleUpdateImagePosition}
                  selectedTextId={selectedTextId}
                  onSelectText={setSelectedTextId}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              💡 Use o editor para adicionar texto e reposicionar imagens. As personalizações serão aplicadas em todos os showcases gerados.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};
