import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Wand2, Brain, User, Camera, Palette, Sparkles, Image, DollarSign, Key } from 'lucide-react';
import { useGeminiBackgroundGenerator } from '@/hooks/useGeminiBackgroundGenerator';
import { useGeminiApiKeys } from '@/hooks/useGeminiApiKeys';
import { useAIImagesCache } from '@/hooks/useAIImagesCache';
import { useSafeDownload } from '@/hooks/useSafeDownload';
import { useImageResizer } from '@/hooks/useImageResizer';
import { AIGeneratedImagesGrid } from './AIGeneratedImagesGrid';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { useHostedImages } from '@/hooks/useHostedImages';
import { useUnifiedCommandsData } from '@/hooks/useUnifiedCommandsData';
import { generatePromptVariations } from '@/utils/promptVariationGenerator';
import { distributeVariations } from '@/utils/promptDistributor';
import { showCopywritingToastOnce } from '@/utils/toastControl';
import { useImageHosting } from '@/hooks/enhancement/useImageHosting';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { convertImagesToBlob } from '@/utils/blobUrlConverter';

interface GeminiBackgroundGeneratorProps {
  images: string[];
  productName: string;
  productId: string;
  dimensions?: {
    altura?: number | null;
    largura?: number | null;
    profundidade?: number | null;
    peso_bruto?: number | null;
  };
  autoGenerate?: boolean;
  simplifiedView?: boolean;
  onComplete?: (images: string[]) => void;
}

type ImageType = 'white_bg' | 'ambient_1' | 'ambient_2' | 'ambient_3' | 'ambient_4' | 'ambient_5' | 'ambient_6' | 'ambient_7' | 'person_using' | 'kit_1' | 'kit_2' | 'kit_3' | 'kit_4' | 'kit_5' | 'white_bg_4k_1' | 'white_bg_4k_2' | 'product_studio' | 'packaging' | 'mockup' | 'lifestyle';

const promptTemplates = {
  // FASE 1: Templates curtos em inglês (como os da Edge Function)
  ambient_1: `Create a concise prompt (max 150 words) for a commercial product ad.
Include: scene/location appropriate for this product, product positioning, professional lighting, atmosphere.
PRESERVE EXACT PRODUCT from reference - only change BACKGROUND.
NO text, words, letters, or graphic elements.
Format: Direct prompt, no explanations.`,

  ambient_2: `ANALYZE PRODUCT: category, characteristics, target audience, lifestyle context.
CREATE LIFESTYLE SCENE (max 120 words):
- Location and usage context relevant to product type
- People's actions appropriate for this product
- Emotional atmosphere matching target audience
PRESERVE EXACT PRODUCT - only change BACKGROUND.
NO text or writing. Format: Direct prompt.`,

  ambient_3: `ANALYZE: product category, target audience, usage contexts.
CREATE SIMPLE SCENE (max 100 words):
- Simple location appropriate for product
- Product in natural use
- Good lighting, clean atmosphere
PRESERVE EXACT PRODUCT - only change BACKGROUND.
NO text. Format: Direct prompt only.`,

  ambient_4: `Gere um prompt profissional para criação de anúncio visual do produto focado em LIFESTYLE E EXPERIÊNCIA:

Contexto de Uso: [Descreva uma situação real de uso do produto no dia a dia]
Estilo de Vida: [Defina o lifestyle que o produto representa - moderno, luxury, casual, fitness, familiar]
Momento/Ocasião: [Especifique quando o produto é usado - manhã, noite, fim de semana, eventos especiais]
Personalidade da Marca: [Transmita a personalidade - inovador, confiável, divertido, sofisticado]
Elementos Emocionais: [Adicione elementos que despertem emoções positivas e conexão]
Background/Cenário: [Crie um ambiente que conte uma história e valorize a experiência]

Foque em mostrar o produto como parte de um estilo de vida desejável, criando conexão emocional com o público.

IMPORTANTE: NÃO inclua texto, legendas, CTA (call-to-action), botões ou elementos gráficos na imagem. Foque apenas no produto e cenário visual.`,

  ambient_5: `Crie um prompt para anúncio visual do produto com foco em PREMIUM E SOFISTICAÇÃO:

Conceito Premium: [Posicione o produto como referência em qualidade e exclusividade]
Ambiente Luxuoso: [Descreva um cenário elegante e refinado]
Materiais Nobres: [Inclua elementos como madeira, metal, vidro, tecidos finos]
Iluminação Cinematográfica: [Use luz dramática e contrastes elegantes]
Minimalismo Sofisticado: [Aplique conceitos de design clean e moderno]
Detalhes de Qualidade: [Destaque texturas, acabamentos e características premium]

O resultado deve transmitir exclusividade, qualidade superior e status diferenciado.

IMPORTANTE: NÃO inclua texto, legendas, CTA (call-to-action), botões ou elementos gráficos na imagem. Foque apenas no produto e cenário visual.`,

  ambient_6: `Desenvolva um prompt para anúncio visual focado em FUNCIONALIDADE E PRATICIDADE:

Problema/Solução: [Mostre como o produto resolve uma necessidade específica]
Demonstração de Uso: [Evidencie a facilidade e eficiência do produto]
Benefícios Visuais: [Destaque características que facilitam o uso]
Organização e Ordem: [Crie um ambiente organizado que reflita praticidade]
Resultados Tangíveis: [Mostre os resultados obtidos com o uso do produto]
Conveniência: [Emphasize aspectos como economia de tempo, espaço, esforço]

A imagem deve comunicar claramente o valor prático e os benefícios funcionais do produto.

IMPORTANTE: NÃO inclua texto, legendas, CTA (call-to-action), botões ou elementos gráficos na imagem. Foque apenas no produto e cenário visual.`,

  ambient_7: `Crie um prompt para anúncio visual com abordagem CRIATIVA E INOVADORA:

Conceito Disruptivo: [Apresente o produto de forma surpreendente e original]
Visual Impactante: [Use elementos visuais ousados e memoráveis]
Storytelling Visual: [Conte uma história através da composição]
Elementos Artísticos: [Incorpore aspectos criativos e estéticos únicos]
Perspectiva Diferenciada: [Use ângulos, cores ou composições não convencionais]
Energia e Movimento: [Adicione dinamismo e vida à imagem]

O objetivo é criar uma peça visual marcante que se destaque da concorrência e gere impacto.

IMPORTANTE: NÃO inclua texto, legendas, CTA (call-to-action), botões ou elementos gráficos na imagem. Foque apenas no produto e cenário visual.`,

  person_using: `Com base na análise do produto da imagem, crie um prompt profissional para um anúncio visual. A imagem deve focar em:

Local: [Descreva o local onde o produto estará.]
Ação Principal: [Descreva o que as pessoas estão fazendo com o produto ou o que o produto transmite.]
Nova Posição: [Descreva a nova posição do produto para maximizar o apelo visual.]
Cenário/Atmosfera: [Descreva a iluminação, cores e clima geral para reforçar a emoção desejada.]

IMPORTANTE: NÃO inclua texto, legendas, CTA (call-to-action), botões ou elementos gráficos na imagem. Foque apenas no produto e cenário visual.`,

  // NOVOS PROMPTS - Estilo Midjourney/DALL-E
  product_studio: `Create a professional product photography prompt (max 100 words):
- Pure white background, studio lighting setup
- Product centered, occupying 70-80% of frame
- High resolution, commercial photography quality
- Soft shadows, detailed textures, 8K quality
Format: "Professional product photography of [PRODUCT], white background, studio lighting, high resolution, commercial photography, centered composition, soft shadows, 8K, detailed"
PRESERVE EXACT PRODUCT from reference. NO text or graphics.`,

  packaging: `Create a premium packaging photography prompt (max 100 words):
- Product packaging (box, bag, or container) as main subject
- Clean background, detailed texture visible
- Premium, modern, or eco-friendly aesthetic
- Professional lighting highlighting material quality
Format: "Professional packaging photography, [PACKAGING TYPE] of [PRODUCT], [MATERIAL], [STYLE] design, clean background, detailed texture, premium look"
PRESERVE EXACT PRODUCT packaging. NO text or graphics.`,

  mockup: `Create a realistic product mockup prompt (max 100 words):
- Product placed in real environment (kitchen, bedroom, office, living room)
- Modern, minimalist, or rustic interior style
- Natural or cozy lighting atmosphere
- Realistic scene that tells a story
Format: "Product mockup, [PRODUCT] in [ENVIRONMENT], [STYLE] interior design, [LIGHTING] lighting, realistic scene, cozy atmosphere, detailed"
PRESERVE EXACT PRODUCT. NO text or graphics.`,

  lifestyle: `Create a lifestyle photography prompt (max 100 words):
- Person naturally using or interacting with product
- Candid, authentic moment captured
- Natural lighting, real environment
- Casual, elegant, or sporty mood
Format: "Lifestyle photography, [PERSON DESCRIPTION] using [PRODUCT], [SCENARIO], natural lighting, candid moment, [MOOD] atmosphere, realistic, high quality"
PRESERVE EXACT PRODUCT. NO text or graphics.`
};

const imagePrompts = {
  white_bg: 'Gerar foto ultra realista do produto com fundo 100% branco puro. IMPORTANTE: O produto deve estar PERFEITAMENTE CENTRALIZADO na imagem, ocupando aproximadamente 70-80% do espaço total do quadro para criar destaque máximo. Garantir que o produto preencha bem o frame sem ficar pequeno ou perdido no fundo branco. Manter todas as características originais do produto com qualidade fotográfica profissional.',
  kit_1: 'Com base na imagem gerada de fundo 100% branco, crie uma imagem com duas quantidades do produto, organize as imagens do produto na imagem para destacar o produto',
  kit_2: 'Com base na imagem gerada de fundo 100% branco, crie uma imagem com quatro quantidades do produto, organize as imagens do produto na imagem para destacar o produto',
  kit_3: 'Com base na imagem gerada de fundo 100% branco, crie uma imagem com seis quantidades do produto, organize as imagens do produto na imagem para destacar o produto',
  kit_4: 'Com base na imagem gerada de fundo 100% branco, crie uma imagem com oito quantidades do produto, organize as imagens do produto na imagem para destacar o produto',
  kit_5: 'Com base na imagem gerada de fundo 100% branco, crie uma imagem com dez quantidades do produto, organize as imagens do produto na imagem para destacar o produto',
  white_bg_4k_1: 'ULTRA-REALISTIC 4K WHITE BACKGROUND with CHROMATIC FIDELITY: Generate a professional product photograph with PURE WHITE (#FFFFFF) background. The product must be PERFECTLY CENTERED, occupying 75-85% of the frame. Apply studio-quality lighting with soft shadows. Capture EXACT color accuracy and material textures. Resolution: 4K ultra-high definition. NO text, watermarks or graphics.',
  white_bg_4k_2: 'ULTRA-REALISTIC 4K WHITE BACKGROUND with MACRO TEXTURE rendering: Generate a professional product photograph with PURE WHITE (#FFFFFF) background. The product must be PERFECTLY CENTERED, occupying 75-85% of the frame. Capture EVERY micro-detail: textures, stitching, materials, finishes. Apply even diffused lighting without harsh shadows. Resolution: 4K ultra-high definition. NO text, watermarks or graphics.'
};

const imageLabels = {
  white_bg: 'Fundo Branco',
  ambient_1: 'Ambiente 1 - Ultra-realista',
  ambient_2: 'Ambiente 2 - Lifestyle', 
  ambient_3: 'Ambiente 3 - Cenário Completo',
  ambient_4: 'Ambiente 4 - Experiência',
  ambient_5: 'Ambiente 5 - Premium',
  ambient_6: 'Ambiente 6 - Funcional',
  ambient_7: 'Ambiente 7 - Criativo',
  person_using: 'Pessoa Usando',
  kit_1: 'Kit - 2 Produtos',
  kit_2: 'Kit - 4 Produtos',
  kit_3: 'Kit - 6 Produtos',
  kit_4: 'Kit - 8 Produtos',
  kit_5: 'Kit - 10 Produtos',
  white_bg_4k_1: '🎯 Fundo Branco 4K - Fidelidade Cromática',
  white_bg_4k_2: '🎯 Fundo Branco 4K - Textura Macro',
  product_studio: '📷 Studio Profissional',
  packaging: '📦 Embalagem Premium',
  mockup: '🏠 Mockup Realista',
  lifestyle: '👤 Lifestyle'
};

// Ordem fixa para mapeamento de automação (0..9)
const ambientTypeOrder: Record<ImageType, number> = {
  white_bg: 0, // não usado no mapeamento de 10 passos
  ambient_1: 0, // Introdução Captadora
  ambient_2: 1, // Dor x Solução
  ambient_3: 2, // Benefícios
  ambient_4: 3, // Gatilho de Escassez e Urgência
  ambient_5: 4, // Chamada para Ação Forte
  ambient_6: 5, // FAQ Resumidas
  ambient_7: 6, // Tópicos de Conversão
  person_using: 7, // Características
  white_bg_4k_1: 8, // Fundo Branco 4K - Fidelidade Cromática
  white_bg_4k_2: 9, // Fundo Branco 4K - Textura Macro
  kit_1: 0, // não usado
  kit_2: 0, // não usado
  kit_3: 0, // não usado
  kit_4: 0, // não usado
  kit_5: 0, // não usado
  product_studio: 10, // Studio Profissional
  packaging: 11, // Embalagem Premium
  mockup: 12, // Mockup Realista
  lifestyle: 13 // Lifestyle
};

export const GeminiBackgroundGenerator = ({ 
  images, 
  productName, 
  productId,
  dimensions,
  autoGenerate = false,
  simplifiedView = false,
  onComplete
}: GeminiBackgroundGeneratorProps) => {
  console.log('🔧 [DEBUG RENDER] GeminiBackgroundGenerator renderizado!');
  console.log('🔧 [DEBUG RENDER] ProductId:', productId);
  console.log('🔧 [DEBUG RENDER] Images:', images.length);
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedImageIndexes, setSelectedImageIndexes] = useState<number[]>([0, 1]); // Automaticamente duas imagens

  // Função para alternar seleção de imagens para automação
  const toggleAutoSelection = (index: number) => {
    setSelectedImageIndexes(prev => {
      if (prev.includes(index)) {
        // Se já está selecionada, remover (mínimo 1 imagem)
        if (prev.length > 1) {
          return prev.filter(i => i !== index);
        }
        toast.warning('Mínimo de 1 imagem deve estar selecionada');
        return prev;
      } else {
        // Se não está selecionada, adicionar (máximo 2 imagens)
        if (prev.length < 2) {
          return [...prev, index].sort((a, b) => a - b);
        }
        toast.warning('Máximo de 2 imagens podem ser selecionadas para automação');
        return prev;
      }
    });
  };
  const [generatedImages, setGeneratedImages] = useState<{[key: string]: string}>({});
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [currentGenerating, setCurrentGenerating] = useState<string | null>(null);
  
  // Hook para redimensionamento de imagens
  const { resizeImageTo1000x1000 } = useImageResizer();
  
  // Estados para prompts gerados pela IA (organizado por imagem e tipo)
  const [generatedPrompts, setGeneratedPrompts] = useState<{[key: string]: string}>({});
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [currentPromptGenerating, setCurrentPromptGenerating] = useState<string | null>(null);
  
  // Estados para automação de múltiplas imagens
  const [isAutomationRunning, setIsAutomationRunning] = useState(false);
  const [automationProgress, setAutomationProgress] = useState({ current: 0, total: 0, step: '' });
  
  // Estados para geração de fundo branco
  const [selectedImagesForWhiteBg, setSelectedImagesForWhiteBg] = useState<number[]>([]);
  const [whiteBgImages, setWhiteBgImages] = useState<string[]>([]);
  const [isGeneratingWhiteBg, setIsGeneratingWhiteBg] = useState(false);

  // 🧹 RESET: Limpar estados quando o produto mudar (evita contaminação entre produtos)
  useEffect(() => {
    console.log('🧹 [GEMINI] Produto alterado, limpando estados...', productId);
    setGeneratedImages({});
    setWhiteBgImages([]);
    setAnalysisResult(null);
    setGeneratedPrompts({});
    setSelectedImageIndex(0);
    setSelectedImageIndexes([0, 1]);
    setIsAutomationRunning(false);
    setAutomationProgress({ current: 0, total: 0, step: '' });
    setSelectedImagesForWhiteBg([]);
  }, [productId]);

  // Cache de sessão para imagens geradas (convertendo objeto para array)
  const { cachedImages, saveToCache } = useAIImagesCache(productId, 'Gemini Background');

  // Restaurar cache ao montar componente (converter array para objeto)
  useEffect(() => {
    if (cachedImages.length > 0 && Object.keys(generatedImages).length === 0) {
      const restoredImages: {[key: string]: string} = {};
      cachedImages.forEach((url, index) => {
        restoredImages[`cached_${index}`] = url;
      });
      setGeneratedImages(restoredImages);
      console.log(`🔄 [GEMINI] ${cachedImages.length} imagens restauradas do cache`);
    }
  }, [cachedImages]);

  // Salvar no cache sempre que gerar novas imagens (converter objeto para array)
  useEffect(() => {
    const imagesArray = Object.values(generatedImages);
    if (imagesArray.length > 0) {
      saveToCache(imagesArray);
    }
  }, [generatedImages, saveToCache]);

  // Carregar dados unificados do copywriting
  useEffect(() => {
    const loadUnifiedData = async () => {
      if (!productId) return;

      try {
        console.log('🔍 [GEMINI] Buscando dados unificados do copywriting...');
        const unified = await getUnifiedDataForProduct(productId);
        
        if (unified && unified.idealEnvironments.length > 0) {
          setUnifiedData(unified);
          console.log('🎯 [GEMINI] Dados unificados carregados!', {
            idealEnvironments: unified.idealEnvironments.length,
            idealFor: unified.idealFor.length,
            mainKeywords: unified.mainKeywords.length
          });
          
          showCopywritingToastOnce(productId, {
            env: unified.idealEnvironments.length,
            scenarios: unified.idealFor.length,
            keywords: unified.mainKeywords.length
          });
        } else {
          console.log('⚠️ [GEMINI] Nenhum dado unificado encontrado');
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados unificados:', error);
      }
    };

    loadUnifiedData();
  }, [productId]);

  // Usar diretamente as imagens da galeria (prop images)
  const activeImages = images;

  const { generateBackground, isProcessing, progress, lastUsage } = useGeminiBackgroundGenerator();
  const { downloadFile } = useSafeDownload();
  
  // Hook para API Keys do Gemini
  const { apiKeys, selectedKeyId, setSelectedKeyId, isLoading: isLoadingApiKeys } = useGeminiApiKeys();
  
  // Hook para salvar imagens hospedadas com tags padronizadas  
  const { saveHostedImage } = useHostedImages();
  
  // Hook para hospedar imagens no R2
  const { hostEnhancedImage } = useImageHosting();
  
  // Hook para dados unificados do copywriting
  const { getUnifiedDataForProduct } = useUnifiedCommandsData();
  const [unifiedData, setUnifiedData] = useState<any>(null);
  

  // Função para converter imagem para base64
  const convertImageToBase64 = async (imageUrl: string): Promise<string | null> => {
    try {
      console.log('🔄 [CONVERT] ===========================================');
      console.log('🔄 [CONVERT] Iniciando conversão de imagem para base64');
      console.log('🔄 [CONVERT] URL recebida:', imageUrl);
      console.log('🔄 [CONVERT] Tipo da URL:', typeof imageUrl);
      console.log('🔄 [CONVERT] URL válida?:', !!imageUrl);
      console.log('🔄 [CONVERT] Tamanho da URL:', imageUrl?.length);
      
      if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
        console.error('❌ [CONVERT] URL da imagem inválida:', { imageUrl, type: typeof imageUrl });
        throw new Error('URL da imagem não fornecida ou inválida');
      }

      // Verificar se é uma URL válida
      try {
        new URL(imageUrl);
        console.log('✅ [CONVERT] URL é válida como URL object');
      } catch (urlError) {
        console.log('⚠️ [CONVERT] URL não é um URL object válido, mas pode ser data URI:', urlError);
      }

      console.log('🔄 [CONVERT] Criando elemento img...');
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          console.error('❌ [CONVERT] TIMEOUT ao carregar imagem após 30s');
          reject(new Error('Timeout ao carregar imagem'));
        }, 30000);

        img.onload = () => {
          console.log('✅ [CONVERT] Imagem carregada com sucesso!');
          console.log('✅ [CONVERT] Dimensões:', `${img.width}x${img.height}`);
          console.log('✅ [CONVERT] naturalWidth/Height:', `${img.naturalWidth}x${img.naturalHeight}`);
          
          clearTimeout(timeoutId);
          
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              console.error('❌ [CONVERT] Falha ao obter contexto do canvas');
              reject(new Error('Falha ao obter contexto do canvas'));
              return;
            }
            
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            
            console.log('🔄 [CONVERT] Canvas criado:', `${canvas.width}x${canvas.height}`);
            
            ctx.drawImage(img, 0, 0);
            console.log('✅ [CONVERT] Imagem desenhada no canvas');
            
            const dataURL = canvas.toDataURL('image/jpeg', 0.9);
            console.log('✅ [CONVERT] Conversão base64 concluída');
            console.log('✅ [CONVERT] Tamanho do base64:', dataURL.length, 'chars');
            console.log('✅ [CONVERT] Prefixo base64:', dataURL.substring(0, 50));
            
            resolve(dataURL);
          } catch (canvasError) {
            console.error('❌ [CONVERT] Erro no canvas:', canvasError);
            reject(new Error(`Erro no canvas: ${canvasError}`));
          }
        };
        
        img.onerror = (error) => {
          clearTimeout(timeoutId);
          console.error('❌ [CONVERT] ========== ERRO AO CARREGAR IMAGEM ==========');
          console.error('❌ [CONVERT] Event error:', error);
          console.error('❌ [CONVERT] URL que falhou:', imageUrl);
          console.error('❌ [CONVERT] Elemento img:', img);
          console.error('❌ [CONVERT] crossOrigin:', img.crossOrigin);
          console.error('❌ [CONVERT] ================================================');
          reject(new Error(`Failed to load image: ${imageUrl}`));
        };
        
        console.log('🔄 [CONVERT] Definindo src da imagem...');
        img.src = imageUrl;
        console.log('🔄 [CONVERT] SRC definida, aguardando carregamento...');
      });
    } catch (error) {
      console.error('❌ [CONVERT] Erro geral na conversão:', error);
      console.error('❌ [CONVERT] Stack trace:', error instanceof Error ? error.stack : 'N/A');
      return null;
    }
  };

  // 🔧 HELPER: Construir prompts Midjourney/DALL-E fixos (sem IA)
  const buildMidjourneyPrompt = (imageType: ImageType): { prompt_mj: string; prompt_image: string } | null => {
    const productDesc = unifiedData?.seoDescription || unifiedData?.technicalSpecs || productName;
    const keywords = unifiedData?.mainKeywords?.slice(0, 3).join(', ') || 'premium quality, detailed texture';
    const environments = unifiedData?.idealEnvironments || unifiedData?.idealFor || ['modern living room', 'cozy bedroom'];
    const targetAudience = unifiedData?.targetAudience || 'modern consumer';
    
    switch (imageType) {
      case 'product_studio':
        return {
          prompt_mj: `Professional product photography of ${productName}, white background, studio lighting, high resolution, commercial photography, centered composition, soft shadows, 8K, detailed, ${keywords} --ar 1:1`,
          prompt_image: `Professional product photography of ${productName}, pure white background, studio lighting setup, high resolution, commercial photography, centered composition occupying 75% of frame, soft shadows, 8K ultra detailed, ${keywords}, aspect ratio 1:1 square format`
        };
      case 'packaging':
        return {
          prompt_mj: `Professional packaging photography, premium box of ${productName}, cardboard material, modern design, clean background, detailed texture, premium look, ${keywords} --ar 4:5`,
          prompt_image: `Professional packaging photography, premium product box packaging of ${productName}, high quality cardboard material, modern minimalist design, clean white background, detailed texture visible, premium luxury look, ${keywords}, vertical portrait format 4:5 aspect ratio`
        };
      case 'mockup':
        const env = environments[0] || 'modern living room';
        return {
          prompt_mj: `Product mockup, ${productName} in ${env}, modern interior design, natural lighting, realistic scene, cozy atmosphere, detailed --ar 4:5`,
          prompt_image: `Realistic product mockup, ${productName} naturally placed in ${env}, modern minimalist interior design, soft natural window lighting, realistic scene with depth, cozy inviting atmosphere, detailed textures, ${keywords}, vertical portrait format 4:5 aspect ratio`
        };
      case 'lifestyle':
        return {
          prompt_mj: `Lifestyle photography, young adult using ${productName}, modern home setting, natural lighting, candid moment, casual atmosphere, realistic, high quality --ar 4:5`,
          prompt_image: `Lifestyle photography, young adult naturally using or interacting with ${productName}, modern home setting, soft natural lighting from window, candid authentic moment captured, casual relaxed atmosphere, realistic high quality, ${keywords}, vertical portrait format 4:5 aspect ratio`
        };
      default:
        return null;
    }
  };

  // Função para gerar prompt usando Gemini 2.5 Flash Image Preview com retry
  const generatePromptWithAI = async (
    imageType: ImageType, 
    imageIndex: number, 
    customTemplate?: string, 
    maxRetries = 3
  ): Promise<string | null> => {
    console.log(`🎯 [PROMPT_REQUEST] Iniciando geração de prompt`, {
      imageType,
      imageIndex,
      hasCustomTemplate: !!customTemplate
    });
    
    // 🔧 CORREÇÃO: Para os 4 novos tipos, usar templates fixos (sem IA)
    const fixedPromptTypes: ImageType[] = ['product_studio', 'packaging', 'mockup', 'lifestyle'];
    if (fixedPromptTypes.includes(imageType)) {
      console.log(`📝 [PROMPT_REQUEST] Usando template FIXO para ${imageType} (sem IA)`);
      const mjPrompt = buildMidjourneyPrompt(imageType);
      
      if (mjPrompt) {
        const promptKey = `img${imageIndex + 1}_${imageType}`;
        
        // Salvar ambos os prompts
        setGeneratedPrompts(prev => ({
          ...prev,
          [promptKey]: mjPrompt.prompt_mj,
          [`${promptKey}_image`]: mjPrompt.prompt_image
        }));
        
        console.log(`✅ [PROMPT_RESPONSE] Prompt fixo gerado para ${imageType}`, {
          prompt_mj_preview: mjPrompt.prompt_mj.substring(0, 80) + '...',
          prompt_image_preview: mjPrompt.prompt_image.substring(0, 80) + '...'
        });
        
        toast.success(`Prompt Midjourney gerado para ${imageLabels[imageType]}!`);
        return mjPrompt.prompt_image; // Retorna o prompt limpo para geração de imagem
      }
    }
    
    console.log(`🎯 [PROMPT AI] activeImages disponíveis:`, activeImages.length);
    console.log(`🎯 [PROMPT AI] activeImages[${imageIndex}]:`, activeImages[imageIndex] ? 'EXISTE' : 'NÃO EXISTE');
    
    if (!activeImages[imageIndex]) {
      console.error(`❌ [PROMPT AI] Imagem não encontrada no índice ${imageIndex}`);
      toast.error(`Imagem ${imageIndex + 1} não encontrada. Certifique-se de ter pelo menos ${imageIndex + 1} imagem(ns) disponível(is).`);
      return null;
    }

    const imageUrl = activeImages[imageIndex];
    const template = customTemplate || promptTemplates[imageType];
    
    if (!template) {
      console.error(`❌ [PROMPT AI] Template não encontrado para ${imageType}`);
      toast.error('Template não encontrado para este tipo de imagem');
      return null;
    }
    
    if (customTemplate) {
      console.log('🎯 [PROMPT AI] Usando template ENRIQUECIDO com dados unificados');
    }

    setIsGeneratingPrompt(true);
    const promptKey = `img${imageIndex + 1}_${imageType}`;
    setCurrentPromptGenerating(promptKey);

    // 🔧 CORREÇÃO: Normalizar imageData ANTES de enviar para o backend
    let normalizedImageUrl: string;
    try {
      normalizedImageUrl = await normalizeImageDataForBackend(imageUrl);
      console.log(`📤 [PROMPT_REQUEST] ImageData normalizado:`, {
        original: imageUrl.substring(0, 30) + '...',
        normalized: normalizedImageUrl.substring(0, 30) + '...',
        kind: normalizedImageUrl.startsWith('data:') ? 'base64' : normalizedImageUrl.startsWith('http') ? 'http' : 'other'
      });
    } catch (normalizeError) {
      console.error('❌ [PROMPT_REQUEST] Erro ao normalizar imagem:', normalizeError);
      toast.error('Erro ao processar imagem para envio');
      setIsGeneratingPrompt(false);
      setCurrentPromptGenerating(null);
      return null;
    }

    // Função auxiliar com retry
    const attemptPromptGeneration = async (attempt: number): Promise<string | null> => {
      try {
        console.log(`🧠 [PROMPT AI] Tentativa ${attempt}/${maxRetries} - Gerando prompt com Gemini 2.5 Flash para Imagem ${imageIndex + 1} - ${imageLabels[imageType]}`);
        
        // Validar URL da imagem antes de enviar
        if (!normalizedImageUrl || typeof normalizedImageUrl !== 'string') {
          throw new Error(`URL da imagem inválida: ${normalizedImageUrl}`);
        }

        console.log(`🧠 [PROMPT AI] Enviando para Gemini (tentativa ${attempt})...`);
        
        // ✅ FASE 3: simplePrompt curto e direto (max 150 chars + template)
        const simplePrompt = `Analyze product image. ${template}
OUTPUT: Single English paragraph, max 80 words. NO markdown, NO explanations. Include "no text/letters" rule.`;

        const { data, error } = await supabase.functions.invoke('ai-chat-proxy', {
          body: {
            action: 'generate_prompt',
            imageData: normalizedImageUrl, // 🔧 USAR IMAGEM NORMALIZADA
            prompt: simplePrompt,
            dimensions: dimensions,
            apiKeyId: selectedKeyId !== 'default' ? selectedKeyId : undefined,
            targetFunction: 'gemini-background-generator'
          }
        });
        
        console.log(`📥 [PROMPT_RESPONSE] Status:`, {
          attempt,
          success: data?.success,
          hasError: !!error,
          errorMessage: error?.message || data?.error
        });
        
        if (error) {
          console.error(`❌ [PROMPT AI] Erro Supabase na tentativa ${attempt}:`, error);
          // Verificar se é um erro que vale retry
          const shouldRetry = attempt < maxRetries && (
            error.message?.includes('500') ||
            error.message?.includes('Internal') ||
            error.message?.includes('timeout') ||
            error.message?.includes('network') ||
            error.message?.includes('fetch')
          );

          if (shouldRetry) {
            const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
            console.log(`🔄 [PROMPT AI] Erro recuperável, tentando novamente em ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return attemptPromptGeneration(attempt + 1);
          }
          
          throw new Error(error.message || 'Falha ao chamar Edge Function');
        }
        
        console.log(`🧠 [PROMPT AI] Resposta do Gemini (tentativa ${attempt}):`, data?.success ? 'SUCESSO' : 'ERRO', data?.error);

        if (data?.success && (data.generated_image_text || data.generatedPrompt || data.data?.response)) {
          const generatedPrompt = data.generated_image_text || data.generatedPrompt || data.data?.response;
          console.log(`✅ [PROMPT AI] Prompt gerado com sucesso na tentativa ${attempt}!`);
          return generatedPrompt;
        } else if (data?.error) {
          console.error(`❌ [PROMPT AI] Erro da função na tentativa ${attempt}:`, data.error);
          
          // Verificar se é erro Gemini 500 que vale retry  
          const shouldRetry = attempt < maxRetries && (
            data.error?.includes('500') ||
            data.error?.includes('Internal error') ||
            data.error?.includes('INTERNAL')
          );

          if (shouldRetry) {
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`🔄 [PROMPT AI] Erro Gemini recuperável, tentando novamente em ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return attemptPromptGeneration(attempt + 1);
          }
          
          throw new Error(data.error || 'Falha na geração do prompt');
        } else {
          console.error(`❌ [PROMPT AI] Resposta inválida na tentativa ${attempt}:`, data);
          
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`🔄 [PROMPT AI] Resposta inválida, tentando novamente em ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return attemptPromptGeneration(attempt + 1);
          }
          
          throw new Error('Resposta inválida da API Gemini');
        }

      } catch (error) {
        console.error(`💥 [PROMPT AI] Erro inesperado na tentativa ${attempt}:`, error);
        
        // Retry para erros de rede/timeout
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`🔄 [PROMPT AI] Erro inesperado, tentando novamente em ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return attemptPromptGeneration(attempt + 1);
        }
        
        throw error;
      }
    };

    try {
      const generatedPrompt = await attemptPromptGeneration(1);
      
      if (!generatedPrompt) {
        throw new Error('Falha na geração do prompt após todas as tentativas');
      }

      setGeneratedPrompts(prev => {
        const updatedPrompts = {
          ...prev,
          [promptKey]: generatedPrompt
        };
        
        // 🚀 NOVA FUNCIONALIDADE: Enviar prompts dos AMBIENTE 1, 2, 3, 5 para Runware
        const currentImageIndex = selectedImageIndex + 1;
        const runwareTargetAmbients = ['ambient_1', 'ambient_2', 'ambient_3', 'ambient_5'];
        
        if (runwareTargetAmbients.includes(imageType)) {
          // Verificar se todos os 4 ambientes necessários foram gerados para esta imagem
          const allRunwareAmbientsReady = runwareTargetAmbients.every(ambient => 
            updatedPrompts[`img${currentImageIndex}_${ambient}`]
          );
          
          if (allRunwareAmbientsReady) {
            console.log('✅ [GEMINI→RUNWARE] Todos os 4 ambientes prontos! Enviando para Runware...');
            
            // 🚫 REMOVIDO: Envio automático para Runware cancelado
            // Esta funcionalidade estava causando duplicações e problemas
            toast.info('🎯 Ambientes 1, 2, 3, 5 gerados com sucesso!', {
              description: 'Prompts criados. Use manualmente no IA Avançada - Runware se desejar.',
              duration: 5000
            });
          }
        }
        
        return updatedPrompts;
      });

      console.log(`✅ [PROMPT AI] Prompt gerado com sucesso para ${promptKey}!`);
      toast.success(`Prompt gerado para Imagem ${imageIndex + 1} - ${imageLabels[imageType]}!`);
      return generatedPrompt;
    } catch (error) {
      console.error('❌ [PROMPT AI] Erro ao gerar prompt:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao gerar prompt: ${errorMessage}`);
      return null;
    } finally {
      setIsGeneratingPrompt(false);
      setCurrentPromptGenerating(null);
    }
  };

  // 🔧 HELPER: Normalizar imageData para garantir que backend consiga acessar
  const normalizeImageDataForBackend = async (url: string): Promise<string> => {
    // Se já é base64 ou URL http, retornar como está
    if (url.startsWith('data:image/') || url.startsWith('http')) {
      return url;
    }
    
    // Se é blob:, converter para base64
    if (url.startsWith('blob:')) {
      console.log('🔄 [NORMALIZE] Convertendo blob: para base64...');
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            console.log('✅ [NORMALIZE] Blob convertido para base64');
            resolve(result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('❌ [NORMALIZE] Erro ao converter blob:', error);
        return url; // Fallback para URL original
      }
    }
    
    return url;
  };

  // 🔧 HELPER: Aguardar job da fila concluir e retornar resultado
  const waitForJobResult = async (jobId: string, maxWaitMs: number = 360000): Promise<{generatedImage?: string; error?: string}> => {
    console.log(`⏳ [WAIT_JOB] Aguardando job ${jobId} concluir...`);
    const startTime = Date.now();
    const pollIntervalMs = 3000;
    let tries = 0;
    
    while (Date.now() - startTime < maxWaitMs) {
      tries++;
      try {
        const { data, error } = await supabase.functions.invoke('check-queue-status', {
          body: { jobId }
        });
        
        if (error) {
          console.error(`❌ [WAIT_JOB] Erro no polling (tentativa ${tries}):`, error);
          // Continuar tentando em caso de erro temporário
          await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
          continue;
        }
        
        const job = data?.job;
        console.log(`🔄 [WAIT_JOB] Status do job (tentativa ${tries}):`, job?.status);
        
        if (job?.status === 'completed') {
          console.log('✅ [WAIT_JOB] Job concluído!', { hasImage: !!job.result?.generatedImage });
          return { generatedImage: job.result?.generatedImage };
        }
        
        if (job?.status === 'failed') {
          console.error('❌ [WAIT_JOB] Job falhou:', job.errorMessage);
          return { error: job.errorMessage || 'Falha no processamento' };
        }
        
        // Ainda processando, aguardar e tentar novamente
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      } catch (err) {
        console.error(`💥 [WAIT_JOB] Erro inesperado (tentativa ${tries}):`, err);
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      }
    }
    
    console.error('⏰ [WAIT_JOB] Timeout aguardando job');
    return { error: 'Timeout aguardando processamento' };
  };

  const handleGenerateImage = async (imageType: ImageType, imageIndex: number = selectedImageIndex, skipHosting: boolean = false): Promise<string | null> => {
    // Para ambientes com IA, gerar prompt primeiro
    const needsAIPrompt = [
      'ambient_1', 'ambient_2', 'ambient_3', 'ambient_4', 'ambient_5', 'ambient_6', 'ambient_7', 
      'person_using',
      'product_studio', 'packaging', 'mockup', 'lifestyle'
    ].includes(imageType);
    
    let promptToUse: string;
    const promptKey = `img${imageIndex + 1}_${imageType}`;
    
    if (needsAIPrompt) {
      // Primeiro gerar o prompt, depois a imagem
      let aiPrompt = generatedPrompts[promptKey];
      
      if (!aiPrompt) {
        // Se não há prompt gerado, gerar agora
        console.log(`🧠 [GENERATE_IMAGE] Gerando prompt para ${imageLabels[imageType]}...`);
        aiPrompt = await generatePromptWithAI(imageType, imageIndex);
        if (!aiPrompt) {
          console.error(`❌ [GENERATE_IMAGE] Falha ao gerar prompt para ${imageLabels[imageType]}`);
          return null; // Falha na geração do prompt
        }
        console.log(`✅ [GENERATE_IMAGE] Prompt gerado para ${imageLabels[imageType]}`);
      }
      promptToUse = aiPrompt;
    } else {
      // Usar prompt fixo para fundo branco e kits
      promptToUse = imagePrompts[imageType] || 'Prompt não encontrado';
    }

    if (!activeImages[imageIndex]) {
      if (activeImages.length === 0) {
        toast.error(`❌ Nenhuma imagem disponível na galeria.`);
        return null;
      }
      toast.error(`Imagem ${imageIndex + 1} não encontrada na galeria`);
      return null;
    }

    const imageUrl = activeImages[imageIndex];
    const generatingKey = `img${imageIndex + 1}_${imageType}`;
    setCurrentGenerating(generatingKey);

    console.log(`🚀 [GENERATE_IMAGE] Gerando imagem tipo: ${imageType} para Imagem ${imageIndex + 1}`);
    console.log(`📝 [GENERATE_IMAGE] Prompt: ${needsAIPrompt ? 'gerado pela IA' : 'fixo'}`);

    try {
      // 🔧 Normalizar imageData para garantir que backend consiga acessar
      const normalizedImageUrl = await normalizeImageDataForBackend(imageUrl);
      console.log(`📤 [GENERATE_IMAGE] ImageData normalizado: ${normalizedImageUrl.substring(0, 50)}...`);
      
      // Construir productContext para templates contextualizados usando campos corretos do unifiedData
      const productContext = unifiedData ? {
        productName: productName,
        productCategory: unifiedData.targetAudience || (unifiedData.idealFor?.[0]) || 'produto',
        productDescription: unifiedData.seoDescription || unifiedData.technicalSpecs || '',
        idealEnvironments: unifiedData.idealEnvironments || unifiedData.idealFor || [],
        mainKeywords: unifiedData.mainKeywords || unifiedData.longTailKeywords || []
      } : undefined;
      
      // ✅ CHAMADA SÍNCRONA: generateBackground agora retorna imagem diretamente (sem fila)
      const result = await generateBackground(
        normalizedImageUrl, 
        promptToUse, 
        3, 
        undefined, 
        dimensions, 
        undefined, 
        undefined, 
        selectedKeyId !== 'default' ? selectedKeyId : undefined,
        productContext
      );
      
      console.log('📥 [GENERATE_IMAGE] Resultado da geração síncrona:', {
        success: result.success,
        hasGeneratedImage: !!result.generatedImage,
        hasAnalysis: !!result.analysis,
        error: result.error
      });
      
      if (!result.success || !result.generatedImage) {
        console.error('❌ [GENERATE_IMAGE] Falha na geração:', result.error);
        toast.error(result.error || result.analysis || 'Erro ao gerar imagem');
        return null;
      }
      
      const generatedImage = result.generatedImage;
      
      // Durante automação (skipHosting=true): NÃO hospedar, NÃO salvar na tabela
      // Apenas retornar a imagem gerada para a galeria final
      if (!skipHosting) {
        // Salvar imagem na tabela hosted_images com tags padronizadas
        try {
          const processingType = imageType === 'white_bg' ? ['white-background'] : 
                               imageType.startsWith('kit_') ? ['kit-generation'] : 
                               ['background-generation'];
          
          // Salvar imagem SEM hospedar (apenas para exibição na galeria)
          console.log('💾 [GEMINI] Salvando imagem gerada sem hospedagem...');
          
          const fileName = `gemini-${imageType}-${Date.now()}.jpg`;
          
          // ✅ Detectar tag correta baseada no tipo de imagem
          const sourceTag = imageType === 'white_bg' ? 'gemini-white-background' : 'gemini-background';
          
          // 🚀 HOSPEDAGEM AUTOMÁTICA: hospedar imagem no R2 após geração
          console.log('📤 [GEMINI] Iniciando hospedagem automática no R2...');
          try {
            const hostResult = await hostEnhancedImage(generatedImage, fileName);
            
            if (hostResult.hosted && hostResult.url) {
              await saveHostedImage({
                url: hostResult.url,
                filename: fileName,
                original_filename: `gemini-${imageType}-generated-${Date.now()}.jpg`,
                r2_path: hostResult.url,
                file_type: 'image/jpeg',
                file_size: 0,
                width: 1024,
                height: 1024,
                productId: productId,
                aiSource: 'gemini',
                processing: processingType,
                quality: 'original',
                description: `${imageLabels[imageType]} generated by Gemini AI`,
                tags: [`ai-source:${sourceTag}`, `original-source:${sourceTag}`, `source:${sourceTag}-hosted`, 'hosted', `product:${productId}`]
              });
              console.log('✅ [GEMINI] Imagem hospedada e salva com r2_path:', hostResult.url);
            } else {
              console.warn('⚠️ [GEMINI] Falha na hospedagem, salvando sem r2_path');
              await saveHostedImage({
                url: generatedImage,
                filename: fileName,
                original_filename: `gemini-${imageType}-generated-${Date.now()}.jpg`,
                r2_path: '',
                file_type: 'image/jpeg',
                file_size: 0,
                width: 1024,
                height: 1024,
                productId: productId,
                aiSource: 'gemini',
                processing: processingType,
                quality: 'original',
                description: `${imageLabels[imageType]} generated by Gemini AI`,
                tags: [`ai-source:${sourceTag}`, `original-source:${sourceTag}`, 'not-hosted', `product:${productId}`]
              });
            }
          } catch (hostError) {
            console.error('❌ [GEMINI] Erro na hospedagem automática:', hostError);
            // Salvar sem hospedagem em caso de erro
            await saveHostedImage({
              url: generatedImage,
              filename: fileName,
              original_filename: `gemini-${imageType}-generated-${Date.now()}.jpg`,
              r2_path: '',
              file_type: 'image/jpeg',
              file_size: 0,
              width: 1024,
              height: 1024,
              productId: productId,
              aiSource: 'gemini',
              processing: processingType,
              quality: 'original',
              description: `${imageLabels[imageType]} generated by Gemini AI`,
              tags: [`ai-source:${sourceTag}`, `original-source:${sourceTag}`, 'not-hosted', `product:${productId}`]
            });
          }
          
          console.log('✅ [GEMINI] Imagem salva na tabela hosted_images (aguardando hospedagem)');
          toast.success('Imagem gerada e salva com sucesso!');
        } catch (saveError) {
          console.error('❌ [GEMINI] Erro ao salvar imagem na tabela hosted_images:', saveError);
        }
      } else {
        console.log('⏭️ [GEMINI AUTOMAÇÃO] Pulando hospedagem - imagem será enviada para galeria final');
      }
      
      setGeneratedImages(prev => ({
        ...prev,
        [generatingKey]: generatedImage
      }));
      setAnalysisResult(null);
      
      // Durante automação: não mostrar toast nem disparar eventos para galeria
      if (!skipHosting) {
        toast.success(`${imageLabels[imageType]} gerado para Imagem ${imageIndex + 1}!`);
        
        // 🔄 Converter Base64 → Blob URL ANTES de enviar para galeria
        console.log('🔄 [GEMINI] Convertendo imagem para Blob...');
        const resizedBlobUrl = await resizeImageTo1000x1000(generatedImage);
        console.log('✅ [GEMINI] Conversão Blob concluída:', resizedBlobUrl.substring(0, 50));
        
        // ✅ SISTEMA ANTI-DUPLICAÇÃO GEMINI BACKGROUND
        console.log(`📸 [GEMINI BACKGROUND] Enviando 1 imagem para a galeria (índice: ${imageIndex})...`);
        // ➕ sequenceIndex para mapeamento correto no AutoProcessor
        const sequenceIndex = ambientTypeOrder[imageType] ?? 0;
        const imageEvent = new CustomEvent('imageGenerated', {
          detail: {
            source: 'gemini-background',
            images: [resizedBlobUrl], // ✅ Usar Blob URL
            productId: productId,
            timestamp: Date.now(),
            imageIndex: imageIndex,
            sequenceIndex: sequenceIndex,
            totalInSet: 8,
            imageType: imageType,
            batchId: `gemini-bg-${productId}-${imageIndex}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // ID único
            generationRound: Date.now() // Round único de geração
          }
        });
        window.dispatchEvent(imageEvent);
        
        // 🎯 ENVIAR AUTOMATICAMENTE PARA O KIT se for Fundo Branco 4K
        if (imageType === 'white_bg_4k_1' || imageType === 'white_bg_4k_2') {
          console.log(`🤍 [GEMINI→KIT] Enviando ${imageLabels[imageType]} diretamente para o Kit...`);
          
          const kitEvent = new CustomEvent('geminiWhiteBackgroundToKit', {
            detail: {
              source: 'gemini-white-background',
              images: [resizedBlobUrl],
              productId: productId,
              imageType: imageType,
              timestamp: Date.now()
            }
          });
          window.dispatchEvent(kitEvent);
          
          toast.success(`🤍 ${imageLabels[imageType]} enviado para o Kit automaticamente!`);
        }
      } else {
        console.log('⏭️ [GEMINI AUTOMAÇÃO] Pulando eventos de galeria - imagens irão para galeria final');
      }
      
      return generatedImage;
    } catch (error) {
      console.error('💥 [GENERATE_IMAGE] Erro inesperado na geração de fundo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro inesperado: ${errorMessage}`);
      return null;
    } finally {
      setCurrentGenerating(null);
    }
  };

  // 🚀 AUTOMAÇÃO: Listener global para automação do Gemini Background Generator
  useEffect(() => {
    console.log('🔧 [DEBUG GEMINI] useEffect do listener sendo executado');
    console.log('🔧 [DEBUG GEMINI] ProductId atual:', productId);
    console.log('🔧 [DEBUG GEMINI] ActiveImages length:', activeImages.length);
    
    const handleGeminiAutomation = async () => {
      console.log('🧠 [AUTOMAÇÃO GEMINI] ===============================================');
      console.log('🧠 [AUTOMAÇÃO GEMINI] EVENTO automationTriggerGemini RECEBIDO!');
      console.log('🧠 [AUTOMAÇÃO GEMINI] activeImages disponíveis:', activeImages.length);
      console.log('🧠 [AUTOMAÇÃO GEMINI] ===============================================');
      
      if (activeImages.length === 0) {
        console.error('❌ [AUTOMAÇÃO GEMINI] Nenhuma imagem disponível');
        return;
      }
      
      try {
        setIsAutomationRunning(true);
        toast.info('🧠 Iniciando geração automática Gemini Background (7 imagens)...', { duration: 8000 });
        
        // ✅ 7 prompts: 3 originais + 4 novos (Studio, Packaging, Mockup, Lifestyle)
        const imageTypes: ImageType[] = [
          'ambient_1',       // Prompt 1 - Ambiente 1
          'ambient_2',       // Prompt 2 - Ambiente 2
          'white_bg_4k_1',   // Prompt 9 - Fundo Branco 4K
          'product_studio',  // NOVO: Studio Profissional
          'packaging',       // NOVO: Embalagem Premium
          'mockup',          // NOVO: Mockup Realista
          'lifestyle'        // NOVO: Lifestyle
        ];
        
        let successCount = 0;
        const totalSteps = 7;
        const allGeneratedImages: string[] = [];  // Todas para galeria
        let whiteBackgroundImage: string | null = null;  // Apenas para KITs
        
        // 🔧 NOVO: Coletar resultados por tipo (prompts + imagens)
        const resultsByType: Record<string, { prompt_mj?: string; prompt_image?: string; imageUrl?: string }> = {};
        
        setAutomationProgress({ current: 0, total: totalSteps, step: 'Iniciando...' });

        // ✅ PROCESSAR APENAS A PRIMEIRA IMAGEM (índice 0) com os 3 prompts selecionados
        const imageIndex = 0;
        
        console.log(`🖼️ [AUTOMAÇÃO GEMINI] Processando 7 imagens (3 originais + 4 novos)`);
        toast.info(`🖼️ Gerando 7 imagens (Ambiente, Fundo Branco, Studio, Embalagem, Mockup, Lifestyle)...`, { duration: 5000 });

        for (let typeIndex = 0; typeIndex < imageTypes.length; typeIndex++) {
          const imageType = imageTypes[typeIndex];
          const currentStep = typeIndex + 1;
          const promptKey = `img${imageIndex + 1}_${imageType}`;
          
          console.log(`🔄 [QUEUE_ENQUEUE] Iniciando ${currentStep}/${totalSteps}: ${imageLabels[imageType]}`);
          
          setAutomationProgress({
            current: currentStep,
            total: totalSteps,
            step: `${imageLabels[imageType]}`
          });
          
          toast.info(`🧠 Gerando ${currentStep}/${totalSteps}: ${imageLabels[imageType]}...`, { duration: 5000 });
          
          try {
            // ⚡ skipHosting = true: NÃO hospedar durante automação
            const generatedImage = await handleGenerateImage(imageType, imageIndex, true);
            
            if (!generatedImage) {
              console.error(`❌ [QUEUE_DONE] Falha na geração de ${imageLabels[imageType]}`);
              toast.error(`❌ Falha na geração de ${imageLabels[imageType]}. Continuando...`);
              continue;
            }
            
            successCount++;
            
            // ✅ Coletar imagem diretamente do retorno (não do estado)
            allGeneratedImages.push(generatedImage);
            console.log(`📸 [QUEUE_DONE] Imagem ${imageType} coletada (${successCount}/${totalSteps}), hasImage: true`);
            
            // 🔧 NOVO: Coletar prompts gerados para este tipo
            // Os prompts são salvos em generatedPrompts durante handleGenerateImage → generatePromptWithAI
            // Precisamos acessar o estado atualizado após a geração
            const prompt_mj = generatedPrompts[promptKey] || undefined;
            const prompt_image = generatedPrompts[`${promptKey}_image`] || prompt_mj;
            
            resultsByType[imageType] = {
              prompt_mj,
              prompt_image,
              imageUrl: generatedImage
            };
            
            console.log(`📝 [PROMPT_COLLECTED] ${imageType}:`, {
              hasPromptMJ: !!prompt_mj,
              hasPromptImage: !!prompt_image,
              hasImage: true
            });
            
            // ✅ Se for Fundo Branco 4K, guardar separadamente para KITs
            if (imageType === 'white_bg_4k_1') {
              whiteBackgroundImage = generatedImage;
              console.log('🤍 [AUTOMAÇÃO GEMINI] Imagem de fundo branco capturada para KITs');
            }
            
            // Pausa entre as gerações
            if (currentStep < totalSteps) {
              await new Promise(resolve => setTimeout(resolve, 3000));
            }

          } catch (error) {
            console.error(`❌ [QUEUE_DONE] Erro na geração de ${imageLabels[imageType]}:`, error);
            continue;
          }
        }

        console.log(`✅ [AUTOMAÇÃO GEMINI] Total: ${successCount}/${totalSteps} imagens geradas`);
        console.log(`📸 [AUTOMAÇÃO GEMINI] Imagens coletadas para automação: ${allGeneratedImages.length}`);
        console.log(`🤍 [AUTOMAÇÃO GEMINI] Imagem fundo branco para KITs: ${whiteBackgroundImage ? 'SIM' : 'NÃO'}`);
        console.log(`📝 [AUTOMAÇÃO GEMINI] ResultsByType:`, Object.keys(resultsByType));
        toast.success(`🎉 Automação Gemini concluída! ${successCount} imagens geradas!`);
        
        // ✅ Emitir evento de conclusão com resultsByType (prompts + imagens)
        window.dispatchEvent(new CustomEvent('geminiAutomationComplete', {
          detail: { 
            images: allGeneratedImages,                   // Todas para galeria
            whiteBackgroundImage: whiteBackgroundImage,   // Apenas para KITs
            resultsByType: resultsByType,                 // 🔧 NOVO: prompts + imagens por tipo
            generatedPrompts: { ...generatedPrompts }     // 🔧 NOVO: todos os prompts gerados
          }
        }));
        
        if (onComplete) {
          onComplete(allGeneratedImages);
        }
        
      } catch (error) {
        console.error('❌ [AUTOMAÇÃO GEMINI] Erro na automação:', error);
        toast.error('Erro na automação do Gemini Background');
      } finally {
        setIsAutomationRunning(false);
        setAutomationProgress({ current: 0, total: 0, step: '' });
      }
    };

    window.addEventListener('automationTriggerGemini', handleGeminiAutomation);
    
    return () => {
      window.removeEventListener('automationTriggerGemini', handleGeminiAutomation);
    };
  }, [handleGenerateImage, productId, productName, selectedImageIndexes, activeImages, generatedImages, generatedPrompts, onComplete]);

  const handleGenerateAllImages = async () => {
    if (activeImages.length === 0) {
      toast.error('⚠️ Nenhuma imagem melhorada DeepAI disponível! Execute "Melhoria com DeepAI" primeiro para desbloquear este gerador.');
      return;
    }
    
    if (!activeImages[selectedImageIndex]) {
      toast.error('⚠️ Selecione uma imagem melhorada DeepAI primeiro!');
      return;
    }

    // ✅ 7 prompts: 3 originais + 4 novos (Studio, Packaging, Mockup, Lifestyle)
    const imageTypes: ImageType[] = [
      'ambient_1', 'ambient_2', 'white_bg_4k_1',
      'product_studio', 'packaging', 'mockup', 'lifestyle'
    ];
    
    // 🎨 Gerar variações com dados unificados
    let enrichedTemplates: { [key: string]: string } = { ...promptTemplates };
    
    if (unifiedData && unifiedData.idealEnvironments.length > 0) {
      console.log('🎨 [GEMINI] Gerando variações de prompts com dados unificados...');
      
      const variations = generatePromptVariations(
        productName,
        '', // shortDescription não disponível aqui
        unifiedData
      );
      
      const distributed = distributeVariations(variations, {
        totalImages: 7,
        prioritizeHigh: true,
        shuffle: true
      });
      
      console.log('🎨 [GEMINI] Variações distribuídas:', {
        totalVariacoes: variations.length,
        distribuidas: distributed.length,
        ambientesIdeais: unifiedData.idealEnvironments,
        idealPara: unifiedData.idealFor,
        keywords: unifiedData.mainKeywords,
        contextosDistribuidos: distributed.map(v => v.context)
      });
      
      // FASE 2: Enriquecimento simplificado (1 linha, sem emojis/markdown)
      imageTypes.forEach((imageType, index) => {
        if (promptTemplates[imageType]) {
          const variation = distributed[index] || distributed[0];
          
          // Máximo 80 chars de contexto adicional
          enrichedTemplates[imageType] = `${promptTemplates[imageType]}
Context: ${variation.context}. Target: ${unifiedData.targetAudience}. Keywords: ${unifiedData.mainKeywords.slice(0, 3).join(', ')}.`;
        }
      });
      
      toast.info('✅ Templates enriquecidos com copywriting profissional!', { duration: 3000 });
    }
    
    console.log('🚀 [GERAÇÃO COMPLETA] Iniciando geração de 7 imagens...');
    console.log('🚀 [GERAÇÃO COMPLETA] Imagem selecionada:', selectedImageIndex + 1);
    toast.info('🎯 Gerando 7 imagens (Ambiente, Fundo Branco, Studio, Embalagem, Mockup, Lifestyle)...', { duration: 6000 });

    let successCount = 0;
    let failedImages: string[] = [];
    let processedPrompts = 0;
    let processedImages = 0;

    for (let i = 0; i < imageTypes.length; i++) {
      const imageType = imageTypes[i];
      
      console.log(`🔄 [GERAÇÃO COMPLETA] Processando ${i + 1}/7: ${imageLabels[imageType]}`);
      toast.info(`🔄 Gerando ${i + 1}/7: ${imageLabels[imageType]}...`, { duration: 3000 });
      
      try {
        // 🔧 NOVA LÓGICA: Primeiro gerar prompt, depois imagem
        const needsAIPrompt = ['ambient_1', 'ambient_2', 'ambient_3', 'ambient_4', 'ambient_5', 'ambient_6', 'ambient_7', 'person_using', 'product_studio', 'packaging', 'mockup', 'lifestyle'].includes(imageType);
        const promptKey = `img${selectedImageIndex + 1}_${imageType}`;
        
        if (needsAIPrompt && !generatedPrompts[promptKey]) {
          console.log(`🧠 [GERAÇÃO COMPLETA] Gerando prompt para ${imageLabels[imageType]} com template enriquecido...`);
          
          // Usar template enriquecido com dados unificados
          const templateToUse = enrichedTemplates[imageType] || promptTemplates[imageType];
          
          const promptResult = await generatePromptWithAI(imageType, selectedImageIndex, templateToUse);
          
          if (!promptResult) {
            console.error(`❌ [GERAÇÃO COMPLETA] Falha ao gerar prompt para ${imageLabels[imageType]}`);
            failedImages.push(`${imageLabels[imageType]} (prompt)`);
            toast.warning(`⚠️ Falha no prompt de ${imageLabels[imageType]}. Continuando...`);
            continue; // Pula para próxima imagem
          }
          processedPrompts++;
          console.log(`✅ [GERAÇÃO COMPLETA] Prompt gerado para ${imageLabels[imageType]}`);
          
          // Pausa entre prompt e imagem
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Agora gerar a imagem
        console.log(`🖼️ [GERAÇÃO COMPLETA] Gerando imagem para ${imageLabels[imageType]}...`);
        const success = await handleGenerateImage(imageType);
        
        if (!success) {
          failedImages.push(`${imageLabels[imageType]} (imagem)`);
          toast.warning(`⚠️ Falha na imagem de ${imageLabels[imageType]}. Continuando...`);
          console.error(`❌ [GERAÇÃO COMPLETA] Falha na imagem de ${imageLabels[imageType]}, mas continuando`);
        } else {
          successCount++;
          processedImages++;
          console.log(`✅ [GERAÇÃO COMPLETA] Sucesso total para ${imageLabels[imageType]} (${successCount}/${imageTypes.length})`);
          
          // 📡 Send first ambient_1 prompt to Runway (only once)
          if (imageType === 'ambient_1' && generatedPrompts[imageType]) {
            console.log('📡 [GEMINI] Enviando primeiro prompt para Runway:', generatedPrompts[imageType]);
            
            const runwayEvent = new CustomEvent('promptsReadyForRunway', {
              detail: {
                prompts: [generatedPrompts[imageType]],
                source: 'Gemini Background',
                timestamp: Date.now()
              }
            });
            window.dispatchEvent(runwayEvent);
            
            toast.success('✅ Prompt ambiente_1 enviado para Runway AI');
            
            // 🎯 Listen for force collection requests
            const handleForceRequest = () => {
              console.log('🔄 [GEMINI] Recebeu solicitação de força - reenviando prompt...');
              const forceEvent = new CustomEvent('promptsReadyForRunway', {
                detail: {
                  prompts: [generatedPrompts[imageType]],
                  source: 'Gemini Background',
                  timestamp: Date.now()
                }
              });
              window.dispatchEvent(forceEvent);
              console.log('🔄 [GEMINI] Reenvio forçado - prompt ambiente_1 enviado para Runway');
            };

            window.addEventListener('requestPromptsForRunway', handleForceRequest);
            
            // Cleanup listener after 30 seconds
            setTimeout(() => {
              window.removeEventListener('requestPromptsForRunway', handleForceRequest);
            }, 30000);
          }
        }
        
        // Pausa maior entre as gerações completas
        if (i < imageTypes.length - 1) {
          console.log(`⏳ [GERAÇÃO COMPLETA] Pausando 2s antes da próxima...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        console.error(`💥 [GERAÇÃO COMPLETA] Erro crítico na geração de ${imageLabels[imageType]}:`, error);
        failedImages.push(`${imageLabels[imageType]} (erro crítico)`);
        toast.warning(`⚠️ Erro crítico ao gerar ${imageLabels[imageType]}. Continuando...`);
      }
    }

    // Relatório final detalhado
    console.log(`📊 [GERAÇÃO COMPLETA] RELATÓRIO FINAL:`);
    console.log(`📊 [GERAÇÃO COMPLETA] Prompts processados: ${processedPrompts}`);
    console.log(`📊 [GERAÇÃO COMPLETA] Imagens geradas: ${processedImages}`);
    console.log(`📊 [GERAÇÃO COMPLETA] Sucessos totais: ${successCount}/${imageTypes.length}`);
    console.log(`📊 [GERAÇÃO COMPLETA] Falhas: ${failedImages.length > 0 ? failedImages.join(', ') : 'Nenhuma'}`);

    if (successCount === imageTypes.length) {
      toast.success(`🎉 Processo concluído! Todas as ${imageTypes.length} imagens foram geradas com sucesso!`, { duration: 8000 });
    } else if (successCount > 0) {
      toast.success(`🎯 Processo parcial: ${successCount} de ${imageTypes.length} imagens geradas!`, { duration: 6000 });
      if (failedImages.length > 0) {
        toast.warning(`❌ Falharam: ${failedImages.slice(0, 3).join(', ')}${failedImages.length > 3 ? '...' : ''}`, { duration: 8000 });
      }
    } else {
      toast.error(`❌ Processo falhou: Nenhuma imagem foi gerada. Verifique os logs e tente novamente.`, { duration: 8000 });
    }
  };

  // Função para alternar seleção de imagens para fundo branco
  const toggleImageSelection = (index: number) => {
    const images = Object.values(generatedImages);
    setSelectedImagesForWhiteBg(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else if (prev.length < 2) {
        return [...prev, index];
      } else {
        toast.warning('Máximo de 2 imagens podem ser selecionadas');
        return prev;
      }
    });
  };

  // Função para gerar imagens com fundo branco
  const handleGenerateWhiteBgImages = async () => {
    const images = Object.values(generatedImages);
    if (selectedImagesForWhiteBg.length === 0) {
      toast.error('Selecione pelo menos 1 imagem');
      return;
    }

    setIsGeneratingWhiteBg(true);
    const whitePrompt = "Generate ultra-realistic product image with 100% pure white (#FFFFFF), flat, no gradient, no texture, no patterns background. Professional lighting, intense brightness, soft natural shadows, sharp focus on product, vibrant colors, high contrast, highlighting every detail, commercial photography style, high quality";
    
    try {
      console.log('🎨 Gerando imagens com fundo branco para:', selectedImagesForWhiteBg);
      const newWhiteBgImages: string[] = [];

      for (const index of selectedImagesForWhiteBg) {
        const selectedImage = images[index];
        if (!selectedImage) continue;

        console.log(`🎨 Processando imagem ${index + 1} para fundo branco:`, selectedImage);
        
        // Converter imagem para base64
        const imageData = await convertImageToBase64(selectedImage);
        if (!imageData) {
          toast.error(`Erro ao converter imagem ${index + 1}`);
          continue;
        }
        
        const result = await generateBackground(imageData, whitePrompt, 3, undefined, dimensions, undefined, undefined, selectedKeyId !== 'default' ? selectedKeyId : undefined);
        
        if (result.success && result.generatedImage) {
          newWhiteBgImages.push(result.generatedImage);
          console.log(`✅ Fundo branco gerado para imagem ${index + 1}:`, result.generatedImage);
        } else {
          console.error(`❌ Falha na geração fundo branco imagem ${index + 1}:`, result.error);
          toast.error(`Falha na imagem ${index + 1}: ${result.error}`);
        }

        // Delay entre gerações
        if (index !== selectedImagesForWhiteBg[selectedImagesForWhiteBg.length - 1]) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      if (newWhiteBgImages.length > 0) {
        // ✅ Converter Base64 para Blob URLs antes de salvar no estado
        const blobImages = convertImagesToBlob(newWhiteBgImages);
        
        setWhiteBgImages(prev => [...prev, ...blobImages]);
        
        // ✅ Disparar evento com Blob URLs (não base64)
        window.dispatchEvent(new CustomEvent('imageGenerated', {
          detail: {
            source: 'gemini-white-background',
            images: blobImages,
            productId: productId,
            timestamp: Date.now()
          }
        }));
        
        toast.success(`✅ ${blobImages.length} imagem(ns) com fundo branco gerada(s)!`);
        setSelectedImagesForWhiteBg([]);
      } else {
        toast.error('Nenhuma imagem foi gerada com sucesso');
      }

    } catch (error) {
      console.error('❌ Erro ao gerar fundo branco:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsGeneratingWhiteBg(false);
    }
  };

  // Determinar se há imagens disponíveis
  const hasActiveImages = activeImages && activeImages.length > 0;
  const showRequirementMessage = !activeImages || activeImages.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Gerador de Background - Gemini AI + IA Prompts
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6 min-h-[600px]">
        {/* API Key Selector */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <Label className="flex items-center gap-2 mb-2 text-blue-700">
            <Key className="w-4 h-4" />
            API Key do Gemini
          </Label>
          {isLoadingApiKeys ? (
            <div className="flex items-center gap-2 text-blue-600 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Carregando API Keys...
            </div>
          ) : (
            <>
              <Select value={selectedKeyId} onValueChange={setSelectedKeyId}>
                <SelectTrigger className="w-full max-w-xs bg-white">
                  <SelectValue placeholder="Selecione a API Key" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="default">🔑 Key Padrão (Sistema)</SelectItem>
                  {apiKeys.map(key => (
                    <SelectItem key={key.id} value={key.id}>
                      {key.is_exhausted ? '⚠️' : '✅'} {key.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-blue-600 mt-1">
                {apiKeys.length > 0 
                  ? `${apiKeys.filter(k => !k.is_exhausted).length} chave(s) disponível(is)` 
                  : 'Adicione suas chaves em Configurações > API Keys'}
              </p>
            </>
          )}
        </div>
        
        {/* Requirement Message - quando não há imagens */}
        {showRequirementMessage && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 min-h-[160px]">
            <h3 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
              <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-100">
                Imagens necessárias
              </Badge>
              ⚠️ Nenhuma imagem disponível na galeria
            </h3>
            <p className="text-sm text-amber-700 mb-3">
              Adicione imagens à galeria do produto para usar o gerador de backgrounds.
            </p>
            <div className="flex flex-col gap-2">
              <p className="text-xs text-amber-600">
                • Faça upload de imagens na seção "Galeria do Produto"
              </p>
              <p className="text-xs text-amber-600">
                • As imagens da galeria serão usadas para gerar backgrounds
              </p>
            </div>
          </div>
        )}

        {/* Main Content - SEMPRE RENDERIZADO mas desabilitado quando necessário */}
        <div className={`space-y-6 min-h-[440px] ${!hasActiveImages ? 'opacity-50 pointer-events-none' : ''}`}>
          {!hasActiveImages && (
            <div className="absolute inset-0 bg-gray-100/50 rounded-lg flex items-center justify-center z-10">
              <div className="text-center space-y-2">
                <div className="animate-pulse h-4 w-32 bg-gray-300 rounded mx-auto"></div>
                <div className="animate-pulse h-3 w-40 bg-gray-200 rounded mx-auto"></div>
              </div>
            </div>
          )}
          
          {/* Status das Imagens Automáticas */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 relative">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-blue-700">🚀 Automação - Imagens Selecionadas</Label>
              <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                {selectedImageIndexes.length}/2 selecionadas
              </span>
            </div>
            <p className="text-sm text-blue-800 font-medium mt-1">
              {hasActiveImages && selectedImageIndexes.length > 0 ? (
                `✅ Imagens selecionadas: ${selectedImageIndexes.map(i => i + 1).join(' e ')}`
              ) : (
                '⏳ Selecione imagens para automação'
              )}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              🤖 Geração automática: 7 imagens (Ambiente 1, 2, Fundo Branco 4K, Studio, Embalagem, Mockup, Lifestyle)
            </p>
            {hasActiveImages && activeImages.length > 0 && (
              <p className="text-xs text-blue-600 mt-1">
                Usando imagens da galeria do produto
              </p>
            )}
          </div>

          {/* Seleção Manual de Imagem (para uso individual) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Selecionar Imagens para Geração</Label>
              <span className="text-xs text-muted-foreground">
                Clique no badge "AUTO" para alterar seleção
              </span>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {hasActiveImages ? activeImages.map((image, index) => (
                <div
                  key={index}
                  className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                    selectedImageIndexes.includes(index) 
                      ? 'border-green-500 ring-2 ring-green-500/30' 
                      : selectedImageIndex === index
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'border-muted hover:border-muted-foreground/30'
                  }`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img
                    src={image}
                    alt={`${productName} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Botão de Toggle para Seleção Automática */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAutoSelection(index);
                    }}
                    className={`absolute top-1 left-1 px-2 py-1 text-xs font-bold rounded-full transition-all ${
                      selectedImageIndexes.includes(index)
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-400/70 text-white hover:bg-green-500'
                    }`}
                    title={selectedImageIndexes.includes(index) ? 'Clique para remover da automação' : 'Clique para adicionar à automação'}
                  >
                    {selectedImageIndexes.includes(index) ? '✓ AUTO' : '+ AUTO'}
                  </button>
                  
                  {/* Indicador de seleção individual */}
                  {selectedImageIndex === index && !selectedImageIndexes.includes(index) && (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center pointer-events-none">
                      <div className="bg-primary text-primary-foreground rounded-full p-1">
                        ✓
                      </div>
                    </div>
                  )}
                </div>
              )) : (
                [...Array(5)].map((_, index) => (
                  <div key={index} className="aspect-square rounded-lg bg-muted animate-pulse"></div>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Clique no badge "AUTO" para adicionar/remover imagens da geração automática (máx. 2)
            </p>
          </div>

          {/* Progress Bar para Automação de Múltiplas Imagens */}
          {isAutomationRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>🚀 Automação: {automationProgress.step}</span>
                <span>{automationProgress.current}/{automationProgress.total}</span>
              </div>
              <Progress 
                value={(automationProgress.current / automationProgress.total) * 100} 
                className="w-full" 
              />
              <p className="text-xs text-blue-600">
                Gerando 7 imagens (Ambiente 1, 2, Fundo Branco 4K, Studio, Embalagem, Mockup, Lifestyle)
              </p>
            </div>
          )}

          {/* Progress Bar para Prompt */}
          {isGeneratingPrompt && !isAutomationRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Gerando prompt com Gemini...</span>
                <span>🧠</span>
              </div>
              <Progress value={50} className="w-full" />
            </div>
          )}

          {/* Progress Bar para Imagem */}
          {isProcessing && !isAutomationRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Gerando com Gemini AI...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Exibição de Custo Gemini */}
          {lastUsage && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-300">
                Custo da última geração: <strong>R${lastUsage.estimatedCostBRL.toFixed(2)}</strong>
                <span className="text-xs text-green-600 ml-1">(${lastUsage.estimatedCostUSD.toFixed(4)} USD)</span>
              </span>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleGenerateAllImages}
              disabled={!hasActiveImages || isProcessing || isGeneratingPrompt || isAutomationRunning || !activeImages[selectedImageIndex]}
              className="w-full"
              size="lg"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              {isProcessing || isGeneratingPrompt || isAutomationRunning ? 'Processando...' : 'Gerar 7 Imagens (Studio, Embalagem, Mockup, Lifestyle + 3 originais)'}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              ✨ Gera Ambiente 1 (Ultra-realista) + Ambiente 2 (Lifestyle) + Fundo Branco 4K
            </p>
          </div>

          {/* Prompts Gerados - Mostrar os prompts gerados pela IA */}
          {Object.keys(generatedPrompts).length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-blue-700">Prompts Gerados pela IA ({Object.keys(generatedPrompts).length})</Label>
              
              {Object.entries(generatedPrompts).map(([promptKey, prompt]) => {
                // Decodificar a chave: img1_ambient_1 -> Imagem 1 - Ambiente 1
                const [imageNum, imageType] = promptKey.split('_', 2);
                const imageNumber = imageNum.replace('img', '');
                const displayName = `Imagem ${imageNumber} - ${imageLabels[imageType as ImageType] || imageType}`;
                
                return (
                  <div key={promptKey} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-medium text-blue-700">
                        {displayName}
                      </Label>
                    </div>
                    <Textarea
                      value={prompt}
                      readOnly
                      className="min-h-[80px] text-xs bg-blue-50/50 border-blue-200 text-blue-800"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Imagens Geradas */}
          {Object.keys(generatedImages).length > 0 && (
            <div className="space-y-4">
              <Label className="text-sm font-medium">Imagens Geradas ({Object.keys(generatedImages).length})</Label>
              <p className="text-xs text-muted-foreground">
                Clique nas imagens para selecioná-las para gerar fundo branco
              </p>
              
              {/* Grid de Imagens Geradas - Clicáveis para Seleção */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.values(generatedImages).map((image, index) => (
                  <div 
                    key={index}
                    className={`relative cursor-pointer rounded-lg border-2 overflow-hidden transition-all ${
                      selectedImagesForWhiteBg.includes(index) 
                        ? 'border-green-500 ring-2 ring-green-500/20 shadow-lg' 
                        : 'border-muted hover:border-muted-foreground'
                    }`}
                    onClick={() => toggleImageSelection(index)}
                  >
                    <img 
                      src={image} 
                      alt={`Gerada ${index + 1}`} 
                      className="w-full h-32 object-cover"
                    />
                    {selectedImagesForWhiteBg.includes(index) && (
                      <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
                        <div className="bg-green-500 text-white rounded-full p-2">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                      <p className="text-xs text-white text-center">Imagem {index + 1}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botão de Geração de Fundo Branco */}
              {selectedImagesForWhiteBg.length > 0 && (
                <div className="border-t pt-4">
                  <Button
                    onClick={handleGenerateWhiteBgImages}
                    disabled={isGeneratingWhiteBg || isProcessing}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    size="lg"
                  >
                    {isGeneratingWhiteBg ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                        Gerando Fundo Branco...
                      </>
                    ) : (
                      <>
                        <Palette className="h-4 w-4 mr-2" />
                        🎨 Gerar Fundo Branco nas {selectedImagesForWhiteBg.length} Imagens Selecionadas
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Selecionadas: {selectedImagesForWhiteBg.length}/2 imagens
                  </p>
                </div>
              )}

              {/* Galeria AI Padrão */}
              <AIGeneratedImagesGrid
                images={Object.values(generatedImages)}
                aiName="Gemini AI"
                productName={productName}
                productId={productId}
                className="mt-4"
              />
            </div>
          )}

          {/* Imagens com Fundo Branco */}
          {whiteBgImages.length > 0 && (
            <div className="space-y-4 border-t pt-6">
              <Label className="text-sm font-medium text-green-700">
                Imagens com Fundo Branco ({whiteBgImages.length})
              </Label>
              <p className="text-xs text-green-600">
                Imagens otimizadas com fundo branco puro para e-commerce
              </p>
              <AIGeneratedImagesGrid
                images={whiteBgImages}
                aiName="Gemini AI - Fundo Branco"
                productName={productName}
                productId={productId}
              />
            </div>
          )}

          {/* Resultado - Análise */}
          {analysisResult && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-blue-50">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Análise do Gemini AI
                </h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {analysisResult}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};