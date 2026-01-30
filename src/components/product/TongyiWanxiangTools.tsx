import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, ChevronDown, ChevronUp, Image, CheckCircle, DollarSign } from "lucide-react";
import { ZoomableImageModal } from "@/components/enhancement/ZoomableImageModal";
import { DeepAIImageSelector } from "./DeepAIImageSelector";
import { AIGeneratedImagesGrid } from "./AIGeneratedImagesGrid";
import { useImageEnhancementPersistence } from "@/hooks/enhancement/useImageEnhancementPersistence";
import { TongyiWanxiangPrompts } from "./TongyiWanxiangPrompts";
import { TongyiWanxiangGeneration } from "./TongyiWanxiangGeneration";
import { useTongyiAutomation } from "@/hooks/useTongyiAutomation";
import { useTongyiWanxiang } from "@/hooks/useTongyiWanxiang";
import { useGeminiImageCarousel } from "@/hooks/useGeminiImageCarousel";
import { convertUrlToBase64, tongyiPromptStructures } from "@/utils/tongyiHelpers";
import { resizeAndValidateImage } from "@/utils/image-resizer-unified";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useHostedImages } from '@/hooks/useHostedImages';
import { useAIImagesCache } from '@/hooks/useAIImagesCache';
import { useUnifiedCommandsData } from '@/hooks/useUnifiedCommandsData';
import { useImageResizer } from '@/hooks/useImageResizer';
import { validateImageUrl } from '@/utils/imageUrlValidator';

const ImageSelector = ({ 
  imageUrl, 
  productName, 
  index, 
  isSelected, 
  onSelect 
}: {
  imageUrl: string;
  productName: string;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-105 ${
        isSelected
          ? 'border-orange-500 shadow-lg'
          : 'border-gray-200 hover:border-orange-300'
      }`}
      onClick={onSelect}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
          <div className="text-gray-400 text-xs">Carregando...</div>
        </div>
      )}
      {hasError && (
        <div className="absolute inset-0 bg-red-100 flex items-center justify-center">
          <div className="text-red-500 text-xs text-center p-2">Erro ao carregar imagem</div>
        </div>
      )}
      
      <img
        src={imageUrl}
        alt={`${productName} ${index + 1}`}
        className={`w-full h-24 object-cover transition-opacity ${
          isLoading || hasError ? 'opacity-0' : 'opacity-100'
        }`}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onLoad={() => {
          setIsLoading(false);
          setHasError(false);
        }}
        onError={() => {
          console.error('❌ [TongyiWanxiang] Falha ao carregar imagem:', imageUrl);
          setIsLoading(false);
          setHasError(true);
        }}
      />
      {isSelected && (
        <div className="absolute top-2 right-2 bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
          ✓
        </div>
      )}
    </div>
  );
};

interface TongyiWanxiangToolsProps {
  productId: string;
  productName: string;
  productSku: string;
  images: string[];
  onImagesUpdated: () => void;
  shortDescription?: string;
}

export const TongyiWanxiangTools = ({ 
  productId, 
  productName, 
  productSku, 
  images, 
  onImagesUpdated,
  shortDescription = ''
}: TongyiWanxiangToolsProps) => {
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [availableImages, setAvailableImages] = useState<string[]>(images);
  
  // 🎯 SELETOR DE IA: Tongyi (Qwen) ou Gemini
  const [selectedAI, setSelectedAI] = useState<'tongyi' | 'gemini'>('gemini');
  
  // ✅ CORRIGIDO: Usando Qwen-VL-Max e Qwen-Image-Edit via hook
  const { analyzeImage, editImage, isProcessing: tongyiProcessing } = useTongyiWanxiang();
  
  // 🆕 Hook para Gemini Carousel
  const { generateCarouselImages, isProcessing: geminiProcessing, lastUsage: geminiLastUsage } = useGeminiImageCarousel();
  
  const { loadEnhancedImages } = useImageEnhancementPersistence();
  const { getUnifiedDataForProduct } = useUnifiedCommandsData();
  
  // Hook para salvar imagens hospedadas com tags padronizadas
  const { saveHostedImage } = useHostedImages();
  
  // Cache de sessão para imagens geradas
  const { cachedImages, saveToCache } = useAIImagesCache(productId, 'Tongyi Wanxiang');
  
  // Hook para redimensionamento de imagens
  const { resizeImageTo1000x1000 } = useImageResizer();

  // Estados para análise e geração de prompts
  const [selectedImagesForAnalysis, setSelectedImagesForAnalysis] = useState<string[]>([]);
  const [generatedPrompts, setGeneratedPrompts] = useState<string[]>([]);
  // 🚫 REMOVIDO: geminiExtraPrompts - funcionalidade cancelada
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);

  // Estados para geração de prompts específicos com 6 estruturas
  const [generatedSpecificPrompts, setGeneratedSpecificPrompts] = useState<string[]>([]);
  const [isGeneratingSpecificPrompts, setIsGeneratingSpecificPrompts] = useState(false);
  
  // Estados para edição de imagem
  const [selectedBaseImages, setSelectedBaseImages] = useState<string[]>([]);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  // Restaurar cache ao montar componente
  useEffect(() => {
    if (cachedImages.length > 0 && generatedImages.length === 0) {
      setGeneratedImages(cachedImages);
      console.log(`🔄 [TONGYI] ${cachedImages.length} imagens restauradas do cache`);
    }
  }, [cachedImages]);

  // Salvar no cache sempre que gerar novas imagens
  useEffect(() => {
    if (generatedImages.length > 0) {
      saveToCache(generatedImages);
    }
  }, [generatedImages, saveToCache]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string>('');
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [individualGenerationStates, setIndividualGenerationStates] = useState<Record<number | string, boolean>>({});
  const [currentGenerationProgress, setCurrentGenerationProgress] = useState({ current: 0, total: 0, prompt: '' });
  const [generationQueue, setGenerationQueue] = useState<number[]>([]);
  const [isSequentialGeneration, setIsSequentialGeneration] = useState(false);
  
  // 🆕 Estados para Gemini Carousel
  const [geminiCarouselImages, setGeminiCarouselImages] = useState<string[]>([]);

  // Carregar imagens melhoradas do DeepAI na inicialização com validação
  useEffect(() => {
    const loadImages = async () => {
      try {
        const enhancedImages = await loadEnhancedImages(productId);
        const enhancedUrls = enhancedImages.map(img => img.enhanced).filter(Boolean);
        
        if (enhancedImages && enhancedImages.length > 0) {
          // Validar URLs de imagens melhoradas (ImgBB pode expirar)
          console.log(`🔍 [TongyiWanxiang] Validando ${enhancedUrls.length} imagens DeepAI...`);
          const validEnhancedUrls: string[] = [];
          
          for (const url of enhancedUrls) {
            const isValid = await validateImageUrl(url, 3000);
            if (isValid) {
              validEnhancedUrls.push(url);
            } else {
              console.warn(`⚠️ [TongyiWanxiang] Imagem expirada: ${url.substring(0, 50)}...`);
            }
          }
          
          const invalidCount = enhancedUrls.length - validEnhancedUrls.length;
          if (invalidCount > 0) {
            console.warn(`⚠️ [TongyiWanxiang] ${invalidCount} imagens DeepAI expiradas/inválidas`);
          }
          
          console.log(`✅ [TongyiWanxiang] ${validEnhancedUrls.length} imagens válidas carregadas`);
          setAvailableImages([...images, ...validEnhancedUrls]);
        } else {
          setAvailableImages(images);
        }
      } catch (error) {
        console.error('❌ TongyiWanxiang: Erro ao carregar imagens melhoradas:', error);
        setAvailableImages(images);
      }
    };

    if (productId) {
      loadImages();
    }
  }, [productId, images, loadEnhancedImages]);

  const toggleTool = (tool: string) => {
    setExpandedTool(expandedTool === tool ? null : tool);
  };

  // Gerar 5 prompts ultra realistas para cenários diferentes
  const generateUltraRealisticPrompts = async (imagesForAnalysis?: string[], autoGenerateImages = false) => {
    const imagesToUse = imagesForAnalysis || selectedImagesForAnalysis;
    
    if (imagesToUse.length === 0) {
      toast.error('Selecione pelo menos uma imagem para análise');
      return false;
    }

    setIsGeneratingPrompts(true);
    
    toast.info('⏳ Análise iniciada com dados unificados. Pode levar até 2 minutos...', {
      duration: 8000
    });

    try {
      // 🎯 BUSCAR DADOS UNIFICADOS
      const unifiedData = await getUnifiedDataForProduct(productId);
      
      let contextualInfo = '';
      if (unifiedData.hasUnifiedData) {
        console.log('🎨 [TONGYI] Dados unificados encontrados:', {
          idealFor: unifiedData.idealFor?.length || 0,
          environments: unifiedData.idealEnvironments?.length || 0,
          keywords: unifiedData.mainKeywords?.length || 0
        });
        
        const parts: string[] = [];
        if (unifiedData.idealFor && unifiedData.idealFor.length > 0) {
          parts.push(`IDEAL PARA: ${unifiedData.idealFor.join(', ')}`);
        }
        if (unifiedData.idealEnvironments && unifiedData.idealEnvironments.length > 0) {
          parts.push(`AMBIENTES IDEAIS: ${unifiedData.idealEnvironments.join(', ')}`);
        }
        if (unifiedData.mainKeywords && unifiedData.mainKeywords.length > 0) {
          parts.push(`KEYWORDS SEO: ${unifiedData.mainKeywords.slice(0, 5).join(', ')}`);
        }
        
        if (parts.length > 0) {
          contextualInfo = `\n\nDADOS DO PRODUTO:\n${parts.join('\n')}\n\nUse esses dados para enriquecer os cenários com contextos reais do produto.`;
          console.log('✨ [TONGYI] Info contextual adicionada ao prompt');
        }
      } else {
        console.log('⚠️ [TONGYI] Nenhum dado unificado encontrado, usando prompts genéricos');
      }
      
      const promptTemplate = `Analise esta imagem de produto e crie EXATAMENTE 5 prompts para geração de imagem seguindo estas diretrizes, MAS QUE OS CENÁRIOS SEJAM DIFERENTES PARA ANÚNCIO:${contextualInfo}

ESTRUTURA OBRIGATÓRIA para cada prompt:
"[PRODUTO] em [LOCAL/CENÁRIO], [AÇÃO PRINCIPAL], [POSIÇÃO/ÂNGULO], [AMBIENTE/ILUMINAÇÃO], fotografia profissional, alta qualidade, realista"

CENÁRIOS OBRIGATÓRIOS (1 prompt para cada):
1. FAMILIAR: Produto em ambiente doméstico com família/crianças interagindo
2. PROFISSIONAL: Produto em contexto de trabalho/escritório com adultos
3. LAZER: Produto em situação de diversão/entretenimento/hobby
4. EDUCATIVO: Produto sendo usado para aprendizado/desenvolvimento
5. LIFESTYLE: Produto em cenário aspiracional/moderno/trendy

REGRAS CRÍTICAS:
- Mantenha TODAS as características visuais originais do produto (cor, forma, tamanho, textura)
- Use cenários realistas e naturais (não fantásticos)
- Cada prompt deve ter entre 50-80 palavras
- Foque na funcionalidade e benefícios do produto
- NÃO inclua texto, legendas, logos ou elementos gráficos na imagem
- Separe cada prompt com "---"

IMPORTANTE: Retorne EXATAMENTE 5 prompts seguindo a estrutura acima, mas que sejam cenários diferentes.`;

      console.log(`🧠 [QWEN VL] Enviando para análise com Qwen-VL-Max...`);
      
      // ✅ CORRIGIDO: Usando Qwen-VL-Max via hook com URL direta (sem CORS)
      const result = await analyzeImage(imagesToUse[0], promptTemplate);
      
      console.log(`🧠 [QWEN VL] Resposta do Qwen-VL-Max:`, result.success ? 'SUCESSO' : 'ERRO', result.error);

      if (result.success && result.data?.response) {
        const response = result.data.response;
        console.log('📝 [DEBUG] Resposta completa do Qwen-VL-Max:', response);
        
        // Extrair prompts da resposta
        const promptsText = response.replace(/```/g, '').trim();
        const prompts = promptsText.split('---').map(p => p.trim()).filter(p => p.length > 0);
        
        console.log('📝 [DEBUG] Prompts extraídos:', prompts);

        if (prompts.length === 5) {
          setGeneratedPrompts(prompts);
          toast.success(`🎉 ${prompts.length} prompts ultra realistas gerados com sucesso!`, {
            duration: 5000
          });
          
          // Auto-gerar imagens se solicitado
          if (autoGenerateImages) {
            console.log('🎯 [DEBUG] Auto-geração ativada, iniciando geração de imagens...');
            
            // Aguardar um momento para UI atualizar
            setTimeout(async () => {
              await generateAllImagesSequentiallyWithImages(imagesToUse);
            }, 2000);
          }
          
          return true;
        } else {
          console.log('⚠️ [DEBUG] Número incorreto de prompts gerados:', prompts.length);
          toast.warning(`⚠️ Gerados ${prompts.length} prompts (esperado: 5). Usando o que foi gerado.`);
          
          if (prompts.length > 0) {
            setGeneratedPrompts(prompts);
            return true;
          }
        }
        } else {
          toast.error(`Falha na análise com Qwen-VL-Max: ${result.error || 'Erro desconhecido'}`);
          return false;
        }
    } catch (error) {
      console.error('Erro ao gerar prompts:', error);
      toast.error('Erro ao gerar prompts ultra realistas');
      return false;
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  // Wrapper para usar como evento de clique
  const handleGeneratePromptsClick = () => {
    generateUltraRealisticPrompts(undefined, false);
  };

  // Gerar todos os cenários sequencialmente (um por vez) - versão com imagens passadas como parâmetro
  const generateAllImagesSequentiallyWithImages = async (imagesToUse: string[]) => {
    console.log('🔍 [DEBUG] generateAllImagesSequentiallyWithImages chamado');
    console.log('🔍 [DEBUG] imagesToUse:', imagesToUse);
    console.log('🔍 [DEBUG] generatedPrompts.length:', generatedPrompts.length);

    if (imagesToUse.length === 0 || generatedPrompts.length === 0) {
      toast.error('Selecione imagens base e gere prompts primeiro');
      return;
    }

    // Usar versão interna
    await generateAllImagesSequentiallyInternal(imagesToUse);
  };

  // Gerar todos os cenários sequencialmente (un por vez) - versão original para o botão manual
  const generateAllImagesSequentially = async () => {
    console.log('🔍🔍 [TONGYI] generateAllImagesSequentially chamado');
    console.log('🔍🔍 [TONGYI] selectedBaseImages:', selectedBaseImages);
    console.log('🔍🔍 [TONGYI] generatedPrompts.length:', generatedPrompts.length);
    console.log('🔍🔍 [TONGYI] generatedSpecificPrompts.length:', generatedSpecificPrompts.length);

    if (selectedBaseImages.length === 0) {
      toast.error('Selecione pelo menos uma imagem base primeiro');
      return;
    }

    if (generatedPrompts.length === 0 && generatedSpecificPrompts.length === 0) {
      toast.error('Gere os prompts primeiro na aba "Análise e Prompts"');
      return;
    }

    // Definir quais prompts usar: priorizar generatedPrompts, senão usar generatedSpecificPrompts
    const promptsToUse = generatedPrompts.length > 0 ? generatedPrompts : generatedSpecificPrompts;
    
    console.log('🔄🔄 [TONGYI] Usando prompts:', promptsToUse.length > 0 ? 'generatedPrompts' : 'generatedSpecificPrompts');
    console.log('🔄🔄 [TONGYI] Total de prompts a usar:', promptsToUse.length);

    // Usar lógica interna que já usa os prompts corretos
    await generateAllImagesSequentiallyInternal(selectedBaseImages);
  };

  // Lógica interna compartilhada para geração sequencial
  const generateAllImagesSequentiallyInternal = async (imagesToUse: string[]) => {
    setIsSequentialGeneration(true);
    setGenerationQueue(generatedPrompts.map((_, index) => index));
    
    toast.info(`🔄 Iniciando geração sequencial de ${generatedPrompts.length} cenários...`, {
      duration: 8000
    });

    try {
      for (let i = 0; i < generatedPrompts.length; i++) {
        // Atualizar progresso
        setCurrentGenerationProgress({ 
          current: i, 
          total: generatedPrompts.length, 
          prompt: generatedPrompts[i].substring(0, 50) + '...' 
        });

        toast.info(`🎨 Gerando ${i + 1}/${generatedPrompts.length}: ${generatedPrompts[i].substring(0, 30)}...`, {
          duration: 5000
        });

        // Gerar o cenário atual com as imagens fornecidas
        await generateImageWithPromptAndImages(i, imagesToUse);
        
        // Pausa mais longa entre gerações para evitar sobrecarga da API
        if (i < generatedPrompts.length - 1) {
          console.log(`⏸️ Aguardando 10 segundos antes do próximo cenário...`);
          toast.info(`⏸️ Aguardando 10s antes do Cenário ${i + 2}...`, { duration: 3000 });
          await new Promise(resolve => setTimeout(resolve, 10000)); // 10 segundos entre gerações
        }
      }
      
      toast.success(`🎉 Geração sequencial concluída! ${generatedPrompts.length} cenários processados.`);
      
    } catch (error) {
      console.error('Erro na geração sequencial:', error);
      toast.error('Erro durante a geração sequencial');
    } finally {
      setIsSequentialGeneration(false);
      setGenerationQueue([]);
      setCurrentGenerationProgress({ current: 0, total: 0, prompt: '' });
    }
  };

  // Gerar imagem com Gemini 2.5 Flash usando o prompt selecionado e imagens fornecidas
  const generateImageWithPromptAndImages = async (promptIndex: number, imagesToUse: string[]) => {
    console.log(`🔍 [DEBUG] generateImageWithPromptAndImages chamado para índice ${promptIndex}`);
    console.log('🔍 [DEBUG] imagesToUse.length:', imagesToUse.length);
    console.log('🔍 [DEBUG] imagesToUse:', imagesToUse);
    
    if (imagesToUse.length === 0) {
      console.error('❌ [DEBUG] Nenhuma imagem fornecida para geração individual');
      toast.error('Selecione pelo menos uma imagem base primeiro');
      return;
    }
    
    if (!generatedPrompts[promptIndex]) {
      console.error('❌ [DEBUG] Prompt não encontrado no índice:', promptIndex);
      toast.error('Prompt não encontrado');
      return;
    }

    // Definir estado individual de processamento
    setIndividualGenerationStates(prev => ({ ...prev, [promptIndex]: true }));

    // Mostrar toast informativo sobre o tempo de espera
    toast.info(`⏳ Gerando Cenário ${promptIndex + 1}. Pode levar até 5 minutos...`, {
      duration: 8000
    });

    try {
      console.log(`🎨 [DEBUG] Gerando imagem para cenário ${promptIndex + 1}...`);
      console.log(`📝 [DEBUG] Prompt sendo usado:`, generatedPrompts[promptIndex]);
      console.log(`📸 [DEBUG] Imagens fornecidas:`, imagesToUse);
      
      const prompt = generatedPrompts[promptIndex];
      // Adicionar instrução de originalidade
      const enhancedPrompt = `Mantenha a originalidade, identidade visual e características essenciais do produto. ${prompt}. IMPORTANTE: Preserve todos os elementos visuais principais do produto original, mantendo sua forma, textura e características distintivas.`;
      
      const results = [];
      
      for (const baseImageUrl of imagesToUse) {
        console.log(`🔄 [DEBUG] Processando imagem:`, baseImageUrl);
        
        // Processar imagem (converter para base64 ou usar URL diretamente)
        console.log('🔄 [DEBUG] Processando imagem base...');
        
        // ✅ CORRIGIDO: Usando Qwen-Image-Edit via hook com URL direta (sem CORS)
        const result = await editImage(baseImageUrl, enhancedPrompt);
        
        console.log(`📥 [DEBUG] Resultado da edição com Qwen-Image-Edit:`, result);
        
        if (result.success && result.data?.image_url) {
          results.push(result.data.image_url);
          console.log(`✅ [DEBUG] Imagem gerada com sucesso:`, result.data.image_url);
          
          // Salvar imagem SEM hospedar (apenas para exibição na galeria)
          try {
            console.log('💾 [TONGYI] Salvando imagem gerada sem hospedagem...');
            
            const fileName = `tongyi-scenario-${promptIndex + 1}-${Date.now()}.jpg`;
            
            await saveHostedImage({
              url: result.data.image_url, // URL ORIGINAL do Tongyi
              filename: fileName,
              original_filename: `tongyi-wanxiang-generated-${Date.now()}.jpg`,
              r2_path: '', // Vazio = não hospedado ainda
              file_type: 'image/jpeg',
              file_size: 0,
              width: 1024,
              height: 1024,
              productId: productId,
              aiSource: 'tongyi-wanxiang',
              processing: ['image-edit', 'scenario-generation'],
              quality: 'original',
              description: `Scenario ${promptIndex + 1} generated by Tongyi Wanxiang`,
              tags: ['ai-source:tongyi-wanxiang', 'original-source:tongyi-wanxiang', 'not-hosted']
            });
            
            console.log('✅ [TONGYI] Imagem salva na tabela hosted_images (aguardando hospedagem)');
            toast.success('Imagem gerada e salva com sucesso!');
          } catch (saveError) {
            console.error('❌ [TONGYI] Erro ao salvar imagem:', saveError);
            toast.error('Erro ao salvar imagem');
          }
        } else {
          console.error(`❌ [DEBUG] Falha na geração:`, result.error);
        }
        
        // Aguardar entre processamentos para evitar sobrecarga da API
        if (imagesToUse.indexOf(baseImageUrl) < imagesToUse.length - 1) {
          console.log(`⏸️ Pausa de 3 segundos entre processamentos...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      if (results.length > 0) {
        setGeneratedImages(prev => [...prev, ...results]);
        console.log(`🎉 [DEBUG] Total de ${results.length} imagens adicionadas`);
        toast.success(`✅ Cenário ${promptIndex + 1} concluído! ${results.length} imagem(ns) gerada(s)`);
        if (results.length > 0) {
          // 🔄 Converter Base64 → Blob URL ANTES de enviar para galeria
          console.log(`🔄 [TONGYI] Convertendo ${results.length} imagens para Blob...`);
          const blobUrls = await Promise.all(
            results.map(img => resizeImageTo1000x1000(img))
          );
          console.log('✅ [TONGYI] Conversão Blob concluída para todas as imagens');
          
          // ✅ SISTEMA ANTI-DUPLICAÇÃO TONGYI  
          const scenarioId = `tongyi-${productId}-scenario-${promptIndex + 1}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          console.log(`📸 [TONGYI] Enviando ${blobUrls.length} imagem(ns) do cenário ${promptIndex + 1} (ID: ${scenarioId}) para processamento...`);
          const imageEvent = new CustomEvent('imageGenerated', {
            detail: {
              source: 'tongyi',
              images: blobUrls, // ✅ Usar Blob URLs
              productId: productId,
              timestamp: Date.now(),
              scenarioIndex: promptIndex + 1,
              scenarioId: scenarioId,
              generationRound: Date.now(), // Round único de geração
              batchId: scenarioId // ID único do batch
            }
          });
          window.dispatchEvent(imageEvent);
        }
        
      } else {
        toast.error(`❌ Nenhuma imagem gerada para o Cenário ${promptIndex + 1}`);
      }
    } catch (error) {
      console.error('❌ [DEBUG] Erro geral na geração:', error);
      toast.error(`Erro ao gerar Cenário ${promptIndex + 1}`);
    } finally {
      // Remover estado individual de processamento  
      setIndividualGenerationStates(prev => {
        const newState = { ...prev };
        delete newState[promptIndex];
        return newState;
      });
    }
  };

  // Gerar imagem com Gemini 2.5 Flash usando o prompt selecionado
  const generateImageWithPrompt = async (promptIndex: number) => {
    console.log(`🔍 [DEBUG] generateImageWithPrompt chamado para índice ${promptIndex}`);
    console.log('🔍 [DEBUG] selectedBaseImages.length:', selectedBaseImages.length);
    console.log('🔍 [DEBUG] selectedBaseImages:', selectedBaseImages);
    
    if (selectedBaseImages.length === 0) {
      console.error('❌ [DEBUG] Nenhuma imagem base selecionada para geração individual');
      toast.error('Selecione pelo menos uma imagem base primeiro');
      return;
    }
    
    // Usar a função com imagens
    await generateImageWithPromptAndImages(promptIndex, selectedBaseImages);
  };

  // 🆕 Função para gerar carrossel com Gemini Nano Banana
  const handleGenerateGeminiCarousel = async () => {
    if (selectedBaseImages.length === 0) {
      toast.error('Selecione pelo menos uma imagem base primeiro');
      return;
    }
    
    toast.info('🍌 Gerando 4 imagens carrossel com Gemini...', { duration: 5000 });
    
    try {
      const result = await generateCarouselImages(selectedBaseImages[0]);
      
      if (result.success && result.images) {
        console.log(`✅ [GEMINI CAROUSEL] ${result.images.length} imagens recebidas (base64)`);
        
        // Salvar no estado
        setGeminiCarouselImages(result.images);
        
        toast.success(`🎉 ${result.images.length} imagens carrossel geradas! Processando...`);
        
        // Converter base64 para Blob URLs redimensionadas
        const processedImages = [];
        
        for (let i = 0; i < result.images.length; i++) {
          const base64Image = result.images[i];
          console.log(`🔄 [GEMINI CAROUSEL] Processando imagem ${i + 1}/${result.images.length}`);
          
          try {
            // Redimensionar para 1000x1000
            const resized = await resizeAndValidateImage(
              base64Image,
              1000, // targetWidth
              1000, // targetHeight
              1,    // targetSizeKBMin
              1024  // targetSizeKBMax
            );
            
            processedImages.push(resized.blobUrl);
            console.log(`✅ [GEMINI CAROUSEL] Imagem ${i + 1} processada: ${resized.width}x${resized.height}, ${resized.sizeKB}KB`);
          } catch (err) {
            console.error(`❌ [GEMINI CAROUSEL] Erro ao processar imagem ${i + 1}:`, err);
            // Usar imagem original se falhar o redimensionamento
            processedImages.push(base64Image);
          }
        }
        
        // Atualizar estado com imagens processadas
        setGeneratedImages(prev => [...prev, ...processedImages]);
        
        // Enviar para galeria
        const scenarioId = `gemini-carousel-${productId}-${Date.now()}`;
        const imageEvent = new CustomEvent('imageGenerated', {
          detail: {
            source: 'gemini-carousel',
            images: processedImages,
            productId: productId,
            timestamp: Date.now(),
            scenarioId: scenarioId,
            generationRound: Date.now(),
            batchId: scenarioId,
            metadata: {
              model: 'google/gemini-2.5-flash-image-preview',
              originalCount: result.images.length,
              processedCount: processedImages.length
            }
          }
        });
        window.dispatchEvent(imageEvent);
        
        toast.success(`✅ ${processedImages.length} imagens prontas para salvar!`, { duration: 5000 });
        
      } else {
        toast.error(result.error || 'Erro ao gerar imagens');
      }
      
    } catch (error: any) {
      console.error('❌ [GEMINI CAROUSEL] Erro:', error);
      toast.error(error.message || 'Erro ao gerar imagens carrossel');
    }
  };

  // Hook de automação
  const { handlePremiumTongyiAutomation } = useTongyiAutomation(
    availableImages,
    generateUltraRealisticPrompts,
    setExpandedTool,
    setSelectedImagesForAnalysis,
    setSelectedBaseImages
  );

  // Listener para automação premium
  useEffect(() => {
    const handleTongyiAutomation = (event: CustomEvent) => {
      console.log('🎯 TongyiWanxiang: Recebido evento de automação:', event.detail);
      if (event.detail?.productId === productId) {
        console.log('✅ TongyiWanxiang: Produto correto, iniciando automação...');
        setTimeout(() => {
          handlePremiumTongyiAutomation();
        }, 5000);
      }
    };

    // 🚫 REMOVIDO: Listener para prompts do Gemini cancelado
    // Esta funcionalidade estava causando problemas e foi desabilitada

    window.addEventListener('triggerTongyiAutomation', handleTongyiAutomation as EventListener);
    
    return () => {
      window.removeEventListener('triggerTongyiAutomation', handleTongyiAutomation as EventListener);
    };
  }, [productId, handlePremiumTongyiAutomation, selectedBaseImages]);

  // ✅ Enviar imagens do Tongyi Wanxiang para a Galeria de IA
  useEffect(() => {
    if (!generatedImages || generatedImages.length === 0) return;

    const batchId = `tongyi-wanxiang-${productId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    
    console.log('🧠 [TONGYI→GALERIA] Despachando imagens do Tongyi Wanxiang para a galeria:', {
      total: generatedImages.length,
      batchId,
      productId
    });

    window.dispatchEvent(
      new CustomEvent('imageGenerated', {
        detail: {
          source: 'tongyi-wanxiang',
          images: generatedImages,
          productId,
          timestamp: Date.now(),
          batchComplete: true,
          batchId,
          metadata: {
            prompts: generatedPrompts,
            selectedBaseImages,
            models: ['Qwen-VL-Max', 'Qwen-Image-Edit']
          }
        },
      })
    );
  }, [generatedImages, productId, generatedPrompts, selectedBaseImages]);

  // Visualizar imagem em modal
  const viewImage = (imageUrl: string) => {
    setModalImageUrl(imageUrl);
    setShowImageModal(true);
  };

  const hasGeneratedImages = generatedImages.length > 0;

  if (availableImages.length === 0) {
    return (
      <Card className="glass-effect">
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            <Image className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Nenhuma imagem disponível para processamento</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass-effect border-2 border-orange-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Brain className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg">IA Avançada - Geração de Imagens</CardTitle>
              <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 text-xs">
                Premium AI
              </Badge>
              {hasGeneratedImages && (
                <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {generatedImages.length} Imagens
                </Badge>
              )}
              {availableImages.length !== images.length && (
                <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 text-xs">
                  +{availableImages.length - images.length} DeepAI
                </Badge>
              )}
              
              {/* 🆕 Seletor de IA */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs font-medium text-muted-foreground">Selecione:</span>
                <Select value={selectedAI} onValueChange={(value: 'tongyi' | 'gemini') => setSelectedAI(value)}>
                  <SelectTrigger className="w-[180px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini">
                      <div className="flex items-center gap-2">
                        <span>🍌</span>
                        <span>Gemini Nano Banana</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="tongyi">
                      <div className="flex items-center gap-2">
                        <span>🎨</span>
                        <span>Tongyi (Qwen)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toggleTool('tongyi')}
              className="text-orange-600 border-orange-300 hover:bg-orange-50 ml-2"
            >
              {expandedTool === 'tongyi' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          {expandedTool !== 'tongyi' && (
            <p className="text-sm text-orange-600 mt-2">
              {selectedAI === 'gemini' 
                ? '🍌 Geração simplificada: 1 imagem → 4 imagens carrossel em 30-60s'
                : '🧠 Análise inteligente + Geração de 5 cenários ultra realistas'
              }
            </p>
          )}
        </CardHeader>
        
        {expandedTool === 'tongyi' && (
          <CardContent className="pt-0">
            <Tabs defaultValue="analysis" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="analysis">1. Análise e Prompts</TabsTrigger>
                <TabsTrigger value="generation">2. Geração de Imagens</TabsTrigger>
              </TabsList>
              
              <TabsContent value="analysis" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3 text-orange-700">
                    🔍 Análise de Imagem com Gemini 2.5 Flash Image Preview
                  </h4>
                  
                  <div className="mb-4">
                    <h5 className="font-medium mb-2">Selecione as imagens para análise:</h5>
                    {availableImages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma imagem disponível</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {availableImages.map((imageUrl, index) => (
                          <ImageSelector
                            key={`analysis-${imageUrl}-${index}`}
                            imageUrl={imageUrl}
                            productName={productName}
                            index={index}
                            isSelected={selectedImagesForAnalysis.includes(imageUrl)}
                            onSelect={() => {
                              setSelectedImagesForAnalysis(prev => 
                                prev.includes(imageUrl)
                                  ? prev.filter(img => img !== imageUrl)
                                  : [...prev, imageUrl]
                              );
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <TongyiWanxiangPrompts
                    generatedPrompts={generatedPrompts}
                    isGeneratingPrompts={isGeneratingPrompts}
                    onGeneratePromptsClick={handleGeneratePromptsClick}
                    selectedImagesForAnalysis={selectedImagesForAnalysis}
                  />
                </div>
              </TabsContent>

              <TabsContent value="generation" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3 text-orange-700">
                    ✨ Geração de Imagens com Gemini 2.5 Flash Image Preview
                  </h4>
                  
                  <div className="mb-4">
                    <h5 className="font-medium mb-2">Selecione as imagens base para geração:</h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {availableImages.map((imageUrl, index) => (
                        <ImageSelector
                          key={`base-${imageUrl}-${index}`}
                          imageUrl={imageUrl}
                          productName={productName}
                          index={index}
                          isSelected={selectedBaseImages.includes(imageUrl)}
                          onSelect={() => {
                            setSelectedBaseImages(prev => 
                              prev.includes(imageUrl)
                                ? prev.filter(img => img !== imageUrl)
                                : [...prev, imageUrl]
                            );
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <TongyiWanxiangGeneration
                    generatedPrompts={generatedPrompts}
                    isSequentialGeneration={isSequentialGeneration}
                    selectedBaseImages={selectedBaseImages}
                    individualGenerationStates={individualGenerationStates}
                    isGeneratingAll={isGeneratingAll}
                    currentGenerationProgress={currentGenerationProgress}
                    onGenerateAllImagesSequentially={generateAllImagesSequentially}
                    onGenerateImageWithPrompt={generateImageWithPrompt}
                    selectedAI={selectedAI}
                    onGenerateGeminiCarousel={handleGenerateGeminiCarousel}
                    isGeneratingGeminiCarousel={geminiProcessing}
                  />

                  {/* Exibição de Custo Gemini Carousel */}
                  {geminiLastUsage && (
                    <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 mt-4">
                      <DollarSign className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-purple-700 dark:text-purple-300">
                        Custo do carrossel: <strong>R${geminiLastUsage.estimatedCostBRL.toFixed(2)}</strong>
                        <span className="text-xs text-purple-600 ml-1">({geminiLastUsage.imagesGenerated} imagens)</span>
                      </span>
                    </div>
                  )}
                  
                  {generatedImages.length > 0 && (
                    <AIGeneratedImagesGrid
                      images={generatedImages}
                      aiName="Tongyi Wanxiang"
                      productName={productName}
                      productId={productId}
                      className="mt-6"
                    />
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>
      
      {/* Modal para visualizar imagens */}
      <ZoomableImageModal
        isOpen={showImageModal}
        imageUrl={modalImageUrl}
        alt={`${productName} - Imagem gerada`}
        onClose={() => setShowImageModal(false)}
      />
    </>
  );
};