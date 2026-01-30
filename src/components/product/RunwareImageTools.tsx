import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDropzone } from 'react-dropzone';
import { Sparkles, ChevronDown, ChevronUp, Image, ArrowUp, Eraser, Upload, Loader2, ZoomIn, CheckCircle } from "lucide-react";
import { useRunwareTest } from "@/hooks/useRunwareTest";
import { useGeminiBackgroundGenerator } from "@/hooks/useGeminiBackgroundGenerator";
import { ZoomableImageModal } from "@/components/enhancement/ZoomableImageModal";
import { DeepAIImageSelector } from "./DeepAIImageSelector";
import { RunwarePromptGenerator } from "./RunwarePromptGenerator";
import { MultiPromptImageGenerator } from "./MultiPromptImageGenerator";
import { useSpecialistCommands } from "./ai-enhancer/hooks/useSpecialistCommands";
import { useImageEnhancementPersistence } from "@/hooks/enhancement/useImageEnhancementPersistence";
import { useImageResizer } from "@/hooks/useImageResizer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedCommandsData } from "@/hooks/useUnifiedCommandsData";
import { generatePromptVariations } from "@/utils/promptVariationGenerator";
import { distributeVariations } from "@/utils/promptDistributor";

interface RunwareImageToolsProps {
  productId: string;
  productName: string;
  productSku: string;
  images: string[];
  onImagesUpdated: () => void;
  shortDescription?: string;
  altura?: number | null;
  largura?: number | null;
  profundidade?: number | null;
  peso_bruto?: number | null;
}

// Função para adicionar nome do produto nos templates
const addProductContext = (template: string, productName?: string) => {
  if (!productName) return template;
  return `PRODUTO ESPECÍFICO: ${productName}\n\n${template}\n\nIMPORTANTE: Todos os prompts e imagens devem ser específicos para "${productName}" e manter suas características visuais originais.`;
};

// Estrutura de prompts igual ao Gemini AI
const promptTemplates = {
  ambient_1: `Gere um prompt para criação de um anúncio visual do produto da imagem, seguindo esta estrutura detalhada:

🚫 REGRAS CRÍTICAS:
- NÃO incluir pessoas, humanos, mãos, partes do corpo ou figuras humanas no cenário
- NÃO incluir texto, legendas, CTA, botões ou elementos gráficos sobre a imagem
- O cenário deve ser VAZIO, focado exclusivamente no produto
- Use iluminação, composição e elementos decorativos para criar atmosfera

🌍 FORMATO DE SAÍDA OBRIGATÓRIO:
- Prompt FINAL em INGLÊS PROFISSIONAL
- Use terminologia fotográfica técnica (studio lighting, bokeh, composition, depth of field, etc.)

Analise o produto na imagem anexa e crie um prompt profissional ultra-realista incluindo obrigatoriamente:

Local/Cenário: [Descreva um ambiente específico SEM PESSOAS onde o produto estará - casa, escritório, estúdio, loja, etc.]
Composição Visual: [Detalhe o posicionamento e ângulo do produto para destaque máximo]
Iluminação: [Especifique o tipo de iluminação - natural, artificial, suave, dramática]
Cores Dominantes: [Defina a paleta de cores que complementa o produto]
Elementos Complementares: [Adicione objetos ou texturas que valorizem o produto sem competir - SEM PESSOAS]
Atmosfera Geral: [Descreva o mood/clima da imagem - elegante, moderno, aconchegante, profissional]

O prompt final deve gerar uma imagem ultra-realista otimizada para e-commerce que impulse conversões.
Manter todas as características originais do produto.`,

  ambient_2: `Gere um prompt para criação de um anúncio visual do produto da imagem, seguindo esta estrutura do prompt + imagem, e o prompt deve incluir.

🚫 REGRAS CRÍTICAS:
- NÃO incluir pessoas, humanos, mãos, partes do corpo ou figuras humanas no cenário
- NÃO incluir texto, legendas, CTA, botões ou elementos gráficos
- O cenário deve ser VAZIO, focado exclusivamente no produto
- Use iluminação, composição e elementos decorativos para criar atmosfera

🌍 FORMATO DE SAÍDA OBRIGATÓRIO:
- Prompt FINAL em INGLÊS PROFISSIONAL
- Use terminologia fotográfica técnica (studio lighting, bokeh, composition, natural light, etc.)

Pense no [Cenário Desejado]:
Local: [Descreva o local SEM PESSOAS onde o produto estará.]
Ação Principal: [Descreva o que o produto está transmitindo - SEM mencionar pessoas ou uso humano]
Nova Posição do Produto: [Descreva como o produto deve estar organizado ou exposto no local.]
Ambiente/Atmosfera: [Descreva a iluminação, cores, objetos ao redor e o clima geral do cenário - SEM PESSOAS.]
Dicas Importantes para Você:
Seja Específico: Quanto mais detalhes você der em cada item da estrutura (Local, Posição, Ambiente), melhores serão os prompts gerados.
Pense no Público-Alvo: Quem você quer atingir com a imagem? Isso ajuda a definir o cenário.
Pense no Benefício: Que benefício o produto traz? (diversão, aprendizado, criatividade). Isso ajuda a descrever a atmosfera.
Manter todas as características do produto original.`,

  ambient_3: `Gere um prompt para criação de um anúncio visual do produto da imagem, preenchendo a estrutura abaixo:

🚫 REGRAS CRÍTICAS:
- NÃO incluir pessoas, humanos, mãos, partes do corpo ou figuras humanas no cenário
- NÃO incluir texto, legendas, CTA, botões ou elementos gráficos
- O cenário deve ser VAZIO, focado exclusivamente no produto
- Use iluminação, composição e elementos decorativos para criar atmosfera

🌍 FORMATO DE SAÍDA OBRIGATÓRIO:
- Prompt FINAL em INGLÊS PROFISSIONAL
- Use terminologia fotográfica técnica (professional lighting, clean composition, product focus, etc.)

Cenário Desejado (Local): descreva onde o produto estará SEM PESSOAS (casa, escola, estúdio, etc.).

Ação Principal: descreva o que o produto transmite (ex.: criatividade, diversão, aprendizado) - SEM mencionar pessoas usando.

Nova Posição do Produto: detalhe como o produto deve estar organizado, exposto ou interagindo com o cenário.

Ambiente/Atmosfera: defina iluminação, cores, estilo, objetos complementares e o clima geral da cena - SEM PESSOAS.

Público-Alvo: quem deve se conectar com essa imagem (pais, crianças, famílias, educadores) - mas SEM mostrar pessoas na imagem.

Benefício do Produto: destaque o valor emocional (diversão, criatividade, aprendizado, vínculo) através da atmosfera e composição.`,

  ambient_4: `Gere um prompt profissional para criação de anúncio visual do produto focado em LIFESTYLE E EXPERIÊNCIA:

🚫 REGRAS CRÍTICAS:
- NÃO incluir pessoas, humanos, mãos, partes do corpo ou figuras humanas no cenário
- NÃO incluir texto, legendas, CTA, botões ou elementos gráficos
- O cenário deve ser VAZIO, focado exclusivamente no produto
- Use iluminação, composição e elementos decorativos para criar atmosfera

🌍 FORMATO DE SAÍDA OBRIGATÓRIO:
- Prompt FINAL em INGLÊS PROFISSIONAL
- Use terminologia fotográfica técnica (ambient lighting, lifestyle setting, premium feel, etc.)

Contexto de Uso: [Descreva o ambiente onde o produto está - SEM mostrar pessoas usando]
Estilo de Vida: [Defina o lifestyle que o produto representa - moderno, luxury, casual, fitness, familiar]
Momento/Ocasião: [Especifique a atmosfera do momento - manhã, noite, fim de semana, eventos especiais]
Personalidade da Marca: [Transmita a personalidade - inovador, confiável, divertido, sofisticado]
Elementos Emocionais: [Adicione elementos decorativos que despertem emoções positivas - SEM PESSOAS]
Background/Cenário: [Crie um ambiente vazio que conte uma história e valorize a experiência]

Foque em mostrar o produto como parte de um estilo de vida desejável, criando conexão emocional através da atmosfera e composição.`,

  ambient_5: `Crie um prompt para anúncio visual do produto com foco em PREMIUM E SOFISTICAÇÃO:

🚫 REGRAS CRÍTICAS:
- NÃO incluir pessoas, humanos, mãos, partes do corpo ou figuras humanas no cenário
- NÃO incluir texto, legendas, CTA, botões ou elementos gráficos
- O cenário deve ser VAZIO, focado exclusivamente no produto
- Use iluminação, composição e elementos decorativos para criar atmosfera

🌍 FORMATO DE SAÍDA OBRIGATÓRIO:
- Prompt FINAL em INGLÊS PROFISSIONAL
- Use terminologia fotográfica técnica (cinematic lighting, luxury materials, sophisticated composition, etc.)

Conceito Premium: [Posicione o produto como referência em qualidade e exclusividade]
Ambiente Luxuoso: [Descreva um cenário elegante e refinado - SEM PESSOAS]
Materiais Nobres: [Inclua elementos como madeira, metal, vidro, tecidos finos no cenário]
Iluminação Cinematográfica: [Use luz dramática e contrastes elegantes]
Minimalismo Sofisticado: [Aplique conceitos de design clean e moderno]
Detalhes de Qualidade: [Destaque texturas, acabamentos e características premium]

O resultado deve transmitir exclusividade, qualidade superior e status diferenciado através da composição e atmosfera.`,

  ambient_6: `Desenvolva um prompt para anúncio visual focado em FUNCIONALIDADE E PRATICIDADE:

🚫 REGRAS CRÍTICAS:
- NÃO incluir pessoas, humanos, mãos, partes do corpo ou figuras humanas no cenário
- NÃO incluir texto, legendas, CTA, botões ou elementos gráficos
- O cenário deve ser VAZIO, focado exclusivamente no produto
- Use iluminação, composição e elementos decorativos para criar atmosfera

🌍 FORMATO DE SAÍDA OBRIGATÓRIO:
- Prompt FINAL em INGLÊS PROFISSIONAL
- Use terminologia fotográfica técnica (functional setting, clear lighting, practical composition, etc.)

Problema/Solução: [Mostre como o produto resolve uma necessidade específica - através da apresentação visual]
Contexto Funcional: [Ambiente real SEM PESSOAS onde o produto demonstra sua utilidade]
Usabilidade: [Destaque visualmente a facilidade através do design e posicionamento]
Benefícios Práticos: [Evidencie vantagens através da composição e contexto]
Demonstração Visual: [Mostre o produto de forma natural no ambiente - SEM PESSOAS]
Confiabilidade: [Transmita solidez, durabilidade e eficácia através da iluminação e atmosfera]

Enfatize como o produto torna a vida mais fácil através da apresentação visual profissional.`,

  ambient_7: `Crie um prompt para anúncio visual com abordagem CRIATIVA E INOVADORA:

🚫 REGRAS CRÍTICAS:
- NÃO incluir pessoas, humanos, mãos, partes do corpo ou figuras humanas no cenário
- NÃO incluir texto, legendas, CTA, botões ou elementos gráficos
- O cenário deve ser VAZIO, focado exclusivamente no produto
- Use iluminação, composição e elementos decorativos para criar atmosfera

🌍 FORMATO DE SAÍDA OBRIGATÓRIO:
- Prompt FINAL em INGLÊS PROFISSIONAL
- Use terminologia fotográfica técnica (creative composition, innovative lighting, artistic arrangement, etc.)

Conceito Criativo: [Desenvolva uma ideia única e memorável - SEM PESSOAS]
Elementos Visuais Únicos: [Inclua composições, ângulos ou efeitos diferenciados]
Storytelling Visual: [Conte uma história através da imagem usando elementos decorativos e atmosfera]
Impacto Emocional: [Crie conexão através de elementos surpreendentes no cenário - SEM PESSOAS]
Inovação Estética: [Aplique tendências visuais contemporâneas]
Diferenciação: [Destaque o que torna o produto especial através da composição]

Objetivo é criar uma imagem marcante que se destaque da concorrência através da atmosfera e fotografia profissional.`
};

const ambientLabels = {
  ambient_1: 'Ambiente 1 - Ultra-realista',
  ambient_2: 'Ambiente 2 - Lifestyle',
  ambient_3: 'Ambiente 3 - Cenário Completo', 
  ambient_4: 'Ambiente 4 - Experiência',
  ambient_5: 'Ambiente 5 - Premium',
  ambient_6: 'Ambiente 6 - Funcional',
  ambient_7: 'Ambiente 7 - Criativo'
};

export const RunwareImageTools = ({ 
  productId, 
  productName, 
  productSku, 
  images, 
  onImagesUpdated,
  shortDescription = '',
  altura,
  largura,
  profundidade,
  peso_bruto
}: RunwareImageToolsProps) => {
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [selectedAI, setSelectedAI] = useState<'runware' | 'gemini'>('runware');
  
  const {
    isProcessing: isProcessingRunware,
    imageToImage,
    upscaleImage,
    removeBackground,
    enhanceImage
  } = useRunwareTest();

  const {
    generateBackground: geminiGenerateBackground,
    isProcessing: isProcessingGemini,
    progress: geminiProgress
  } = useGeminiBackgroundGenerator();

  const isProcessing = isProcessingRunware || isProcessingGemini;
  const { resizeImageTo1000x1000 } = useImageResizer();

  // Estados para Image to Image - Parâmetros para MÁXIMA PRESERVAÇÃO DO PRODUTO
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('runware:106@1'); // MODELO ESPECÍFICO PARA PRESERVAÇÃO
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [strength, setStrength] = useState(0.15); // MUITO BAIXO para preservação TOTAL do produto
  const [cfgScale, setCfgScale] = useState(1.5); // MUITO BAIXO para preservação máxima
  const [steps, setSteps] = useState(20); // REDUZIDOS para evitar over-processing
  const [guidanceEndStepPercentage, setGuidanceEndStepPercentage] = useState(50); // MUITO BAIXO para preservação total
  const [outputFormat, setOutputFormat] = useState('JPEG');
  const [numberResults, setNumberResults] = useState(1);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedBaseImages, setSelectedBaseImages] = useState<string[]>([]);
  const [enhancedImages, setEnhancedImages] = useState<any[]>([]);
  
  // Estados para seleção manual e geração de fundo branco (OBRIGATÓRIO usar DeepAI)
  const [selectedImagesForWhiteBg, setSelectedImagesForWhiteBg] = useState<string[]>([]);
  const [whiteBgImages, setWhiteBgImages] = useState<string[]>([]);
  const [isGeneratingWhiteBg, setIsGeneratingWhiteBg] = useState(false);
  
  // Estados para geração de prompts individuais por imagem
  const [currentProcessingImage, setCurrentProcessingImage] = useState<string | null>(null);
  const [generatedPromptsPerImage, setGeneratedPromptsPerImage] = useState<{[imageUrl: string]: string[]}>({});
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [promptsToApply, setPromptsToApply] = useState<string[]>([]); // Prompts para aplicar no MultiPromptImageGenerator
  const [allGeneratedPrompts, setAllGeneratedPrompts] = useState<string[]>([]); // Todos os prompts coletados
  // 🚫 REMOVIDO: geminiExtraPrompts - funcionalidade cancelada

  // ✅ CONTROLE ANTI-DUPLICAÇÃO: Rastrear referências brutas já enviadas
  const [sentRawRefs, setSentRawRefs] = useState<Set<string>>(new Set());
  const [sentWhiteBgRefs, setSentWhiteBgRefs] = useState<Set<string>>(new Set());

  // ✅ Enviar imagens geradas para a Galeria de IA
  useEffect(() => {
    const sendImagesToGallery = async () => {
      if (!generatedImages || generatedImages.length === 0) return;

      // Filtrar URLs válidas
      const validImages = generatedImages.filter(
        (url) => typeof url === 'string' && /^(https?:\/\/|\/|data:image\/)/i.test(url)
      );
      if (validImages.length === 0) return;

      // ✅ ANTI-DUPLICAÇÃO: Filtrar apenas imagens NOVAS não enviadas
      const newImages = validImages.filter(url => !sentRawRefs.has(url));
      if (newImages.length === 0) {
        console.log('🚫 [RUNWARE] Nenhuma imagem nova para enviar (todas já foram enviadas)');
        return;
      }

      // Marcar como enviadas ANTES de processar
      setSentRawRefs(prev => new Set([...prev, ...newImages]));

      // 🔄 Converter Base64 → Blob URL ANTES de enviar para galeria
      console.log(`🔄 [RUNWARE] Convertendo ${newImages.length} imagens novas para Blob...`);
      const blobUrls = await Promise.all(
        newImages.map(img => resizeImageTo1000x1000(img))
      );
      console.log('✅ [RUNWARE] Conversão Blob concluída para todas as imagens');

      const batchId = `runware-${productId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      console.log('📤 [RUNWARE→GALERIA] Despachando imagens para a galeria:', {
        total: blobUrls.length,
        existentes: validImages.length - newImages.length,
        novas: newImages.length,
        batchId,
      });

      window.dispatchEvent(
        new CustomEvent('imageGenerated', {
          detail: {
            source: 'runware',
            images: blobUrls, // ✅ Usar Blob URLs
            productId,
            timestamp: Date.now(),
            batchComplete: true,
            batchId,
          },
        })
      );
    };

    sendImagesToGallery();
  }, [generatedImages, productId, resizeImageTo1000x1000]);

  // ✅ Enviar imagens de FUNDO BRANCO para a Galeria de IA
  useEffect(() => {
    const sendWhiteBgToGallery = async () => {
      if (!whiteBgImages || whiteBgImages.length === 0) return;

      // Filtrar URLs válidas
      const validImages = whiteBgImages.filter(
        (url) => typeof url === 'string' && /^(https?:\/\/|\/|data:image\/)/i.test(url)
      );
      if (validImages.length === 0) return;

      // ✅ ANTI-DUPLICAÇÃO: Filtrar apenas imagens NOVAS não enviadas
      const newImages = validImages.filter(url => !sentWhiteBgRefs.has(url));
      if (newImages.length === 0) {
        console.log('🚫 [RUNWARE-WHITE-BG] Nenhuma imagem nova para enviar (todas já foram enviadas)');
        return;
      }

      // Marcar como enviadas ANTES de processar
      setSentWhiteBgRefs(prev => new Set([...prev, ...newImages]));

      // 🔄 Converter Base64 → Blob URL ANTES de enviar para galeria
      console.log(`🔄 [RUNWARE-WHITE-BG] Convertendo ${newImages.length} imagens novas para Blob...`);
      const blobUrls = await Promise.all(
        newImages.map(img => resizeImageTo1000x1000(img))
      );
      console.log('✅ [RUNWARE-WHITE-BG] Conversão Blob concluída para todas as imagens');

      const batchId = `runware-white-bg-${productId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      console.log('🤍 [RUNWARE-WHITE-BG→GALERIA] Despachando imagens de fundo branco para a galeria:', {
        total: blobUrls.length,
        existentes: validImages.length - newImages.length,
        novas: newImages.length,
        batchId,
      });

      window.dispatchEvent(
        new CustomEvent('imageGenerated', {
          detail: {
            source: 'runware',
            images: blobUrls, // ✅ Usar Blob URLs
            productId,
            timestamp: Date.now(),
            batchComplete: true,
            batchId,
          },
        })
      );
    };

    sendWhiteBgToGallery();
  }, [whiteBgImages, productId, resizeImageTo1000x1000]);

  // Estados para processamento de imagem
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [upscaleFactor, setUpscaleFactor] = useState(4);
  const [showImageModal, setShowImageModal] = useState(false);
  const [apiCost, setApiCost] = useState<number | null>(null);

  // Hook para as 7 funções especializadas
  const { isLoadingGemini, isLoadingOpenAI, generateSpecialistCommands } = useSpecialistCommands();
  
  // Hook para dados unificados do copywriting
  const { getUnifiedDataForProduct } = useUnifiedCommandsData();
  
  // Função para alternar seleção de imagens para fundo branco (máximo 2)
  const toggleImageSelection = useCallback((imageUrl: string) => {
    setSelectedImagesForWhiteBg(prev => {
      if (prev.includes(imageUrl)) {
        return prev.filter(url => url !== imageUrl);
      } else if (prev.length < 2) {
        return [...prev, imageUrl];
      } else {
        toast.error('Máximo 2 imagens podem ser selecionadas');
        return prev;
      }
    });
  }, []);
  
  // Função para gerar fundo branco nas 2 imagens selecionadas
  const handleGenerateWhiteBgImages = useCallback(async () => {
    if (selectedImagesForWhiteBg.length !== 2) {
      toast.error('Selecione exatamente 2 imagens');
      return;
    }
    
    setIsGeneratingWhiteBg(true);
    const newWhiteBgImages: string[] = [];
    
    try {
      const fixedPrompt = `CRITICAL INSTRUCTION — PURE WHITE BACKGROUND ONLY (#FFFFFF, RGB 255,255,255)

Using the provided reference image as the ONLY visual reference,
RECREATE the product in its ORIGINAL design and identity,
but NOT by copying the low-resolution pixels of the reference image.

The goal is to faithfully reconstruct the product at MAXIMUM QUALITY,
preserving its original shape, proportions, colors, materials, textures,
logos, labels and finishes, while enhancing clarity, sharpness,
micro-details and realism beyond the source image.

Do NOT redesign, reinterpret or stylize the product.
This is a high-resolution reconstruction, not a modification.

COMPOSITION:
The product must be PERFECTLY CENTERED and LARGE,
occupying approximately 85–90% of the image area,
fully visible, no cropping, dominant in the frame,
optimized for marketplace listings.

BACKGROUND:
100% pure white seamless background (#FFFFFF),
no environment, no scene, no context, no surface,
no horizon line, no gradients.

LIGHTING & SHADOW:
Professional studio lighting with physically accurate light behavior,
even and controlled illumination.
Add ONLY a soft, subtle, natural shadow beneath the product
to anchor it to the white background.
No dramatic, hard or artistic shadows.

DETAIL & QUALITY:
Ultra-realistic professional product photography,
true 4K or higher resolution,
razor-sharp focus across the entire product,
accurate color reproduction (color-matched to the real product),
high dynamic range (HDR),
global illumination,
realistic material response.

Capture and enhance ALL authentic micro-details:
textures, stitching, grain, surface imperfections,
material finishes and edges,
with surgical precision — without inventing details.

STYLE:
Clean, neutral, premium e-commerce look.
Looks like a high-end DSLR studio photograph
made specifically for Amazon and major marketplaces.
No artistic interpretation.`;
      
      if (selectedAI === 'gemini') {
        // Usar Gemini Background Generator
        for (let i = 0; i < selectedImagesForWhiteBg.length; i++) {
          const imageUrl = selectedImagesForWhiteBg[i];
          console.log(`✨ [GEMINI] Processando imagem ${i + 1}/2 para fundo branco:`, imageUrl.substring(0, 60) + "...");
          
          const result = await geminiGenerateBackground(imageUrl, fixedPrompt);
          
          if (result.success && result.generatedImage) {
            newWhiteBgImages.push(result.generatedImage);
            console.log(`✅ [GEMINI] Imagem ${i + 1} com fundo branco gerada:`, result.generatedImage.substring(0, 60) + "...");
            toast.success(`Imagem ${i + 1} com fundo branco processada (Gemini)!`);
          } else {
            console.error(`❌ [GEMINI] Falha ao gerar fundo branco para imagem ${i + 1}:`, result);
            toast.error(`Falha ao processar imagem ${i + 1} com Gemini`);
          }
        }
      } else {
        // Usar Runware API (original)
        const negativePrompt = "NO redesign, NO shape change, NO color shift, NO exaggeration, NO stylization, NO CGI look, NO cartoon or illustration, NO artificial textures, NO invented details, NO background elements, NO props, NO text, NO watermark, NO reflections artifacts, NO blur, NO noise, NO vignette, NO dramatic shadows, NO environment";
        
        for (let i = 0; i < selectedImagesForWhiteBg.length; i++) {
          const imageUrl = selectedImagesForWhiteBg[i];
          console.log(`🎨 [RUNWARE] Processando imagem ${i + 1}/2 para fundo branco:`, {
            imageUrl: imageUrl.substring(0, 60) + "...",
            prompt: fixedPrompt,
            negativePrompt: negativePrompt
          });
          
          const result = await imageToImage(
            fixedPrompt,
            imageUrl,
            'runware:106@1',
            1024,
            1024,
            0.1,
            1.1,
            32,
            1,
            'PNG',
            28,
            negativePrompt
          );
          
          console.log(`📊 Resultado completo para imagem ${i + 1}:`, result);
          
          if (result.success && result.data && result.data.length > 0) {
            const enhancedUrl = result.data[0].imageURL || result.data[0];
            newWhiteBgImages.push(enhancedUrl);
            console.log(`✅ [RUNWARE] Imagem ${i + 1} com fundo branco gerada:`, enhancedUrl.substring(0, 60) + "...");
            toast.success(`Imagem ${i + 1} com fundo branco processada (Runware)!`);
          } else {
            console.error(`❌ [RUNWARE] Falha ao gerar fundo branco para imagem ${i + 1}:`, result);
            toast.error(`Falha ao processar imagem ${i + 1} com Runware`);
          }
        }
      }
      
      if (newWhiteBgImages.length > 0) {
        setWhiteBgImages(newWhiteBgImages);
        console.log(`🎉 SUCESSO: ${newWhiteBgImages.length} imagens com fundo branco geradas via ${selectedAI.toUpperCase()}!`);
        toast.success(`${newWhiteBgImages.length} imagens com fundo branco geradas via ${selectedAI === 'gemini' ? 'Gemini' : 'Runware'}!`);
      } else {
        console.warn('⚠️ Nenhuma imagem foi processada com sucesso');
        toast.error('Nenhuma imagem foi processada com sucesso');
      }
      
    } catch (error) {
      console.error('❌ Erro ao gerar imagens com fundo branco:', error);
      toast.error('Erro ao gerar imagens com fundo branco');
    } finally {
      setIsGeneratingWhiteBg(false);
    }
  }, [selectedImagesForWhiteBg, selectedAI, imageToImage, geminiGenerateBackground]);

  // Estados para geração de prompts específicos com Gemini
  const [isGeneratingGeminiPrompts, setIsGeneratingGeminiPrompts] = useState(false);
  const [generatedGeminiPrompts, setGeneratedGeminiPrompts] = useState<string[]>([]);

  // RUNWARE IA AVANÇADA - 5 MODELOS DE PROMPT ESPECÍFICOS + 1 COMBINADO
  const runwarePromptModels = {
    // MODELO 1: ANÚNCIO VISUAL PROFISSIONAL
    model1: `Gere um prompt para criação de um anúncio visual do produto da imagem, seguindo esta estrutura detalhada:

Analise o produto na imagem anexa e crie um prompt profissional ultra-realista incluindo obrigatoriamente:

Local/Cenário: [Descreva um ambiente específico onde o produto estará - casa, escritório, estúdio, loja, etc.]
Composição Visual: [Detalhe o posicionamento e ângulo do produto para destaque máximo]
Iluminação: [Especifique o tipo de iluminação - natural, artificial, suave, dramática]
Cores Dominantes: [Defina a paleta de cores que complementa o produto]
Elementos Complementares: [Adicione objetos ou texturas que valorizem o produto sem competir]
Atmosfera Geral: [Descreva o mood/clima da imagem - elegante, moderno, aconchegante, profissional]

O prompt final deve gerar uma imagem ultra-realista otimizada para e-commerce que impulse conversões.
Manter todas as características originais do produto.

IMPORTANTE: NÃO inclua texto, legendas, CTA (call-to-action), botões ou elementos gráficos na imagem. Foque apenas no produto e cenário visual.`,

    // MODELO 2: CENÁRIO DESEJADO
    model2: `Pense no [Cenário Desejado]:
Local: [Descreva o local onde o produto estará.]
Ação Principal: [Descreva o que as pessoas estão fazendo com o produto ou o que o produto está transmitindo.]
Nova Posição do Produto: [Descreva como o produto deve estar organizado ou exposto no local.]
Ambiente/Atmosfera: [Descreva a iluminação, cores, objetos ao redor e o clima geral do cenário.]

Dicas Importantes:
- Seja Específico: Quanto mais detalhes você der em cada item da estrutura (Local, Ação, Posição, Ambiente), melhores serão os prompts gerados.
- Pense no Público-Alvo: Quem você quer atingir com a imagem?
- Pense no Benefício: Que benefício o produto traz? (diversão, aprendizado, criatividade, união familiar).
- Manter todas as características do produto original

IMPORTANTE: NÃO inclua texto, legendas, CTA (call-to-action), botões ou elementos gráficos na imagem.`,

    // MODELO 3: CENÁRIO EDUCATIVO/FAMILIAR
    model3: `Analise o produto na imagem e crie um prompt seguindo esta estrutura educativa/familiar:

Cenário Desejado (Local): descreva onde o produto estará (casa, escola, estúdio, etc.).
Ação Principal: descreva o que as pessoas estão fazendo com o produto ou o que ele transmite (ex.: criatividade, diversão, aprendizado, união familiar).
Nova Posição do Produto: detalhe como o produto deve estar organizado, exposto ou interagindo com o cenário.
Ambiente/Atmosfera: defina iluminação, cores, estilo, objetos complementares e o clima geral da cena.
Público-Alvo: quem deve se conectar com essa imagem (pais, crianças, famílias, educadores).
Benefício do Produto: destaque o valor emocional (diversão, criatividade, aprendizado, vínculo).

Gere um prompt comercial completo e direto para criação da imagem, mantendo todas as características originais do produto.

IMPORTANTE: NÃO inclua texto, legendas, CTA (call-to-action), botões ou elementos gráficos na imagem. Foque apenas no produto e cenário visual.`,

    // MODELO 4: PROBLEMA/SOLUÇÃO
    model4: `Analise o produto na imagem e crie um prompt focado em problema/solução:

Problema/Solução: Mostre como o produto resolve uma necessidade específica
Demonstração de Uso: Evidencie a facilidade e eficiência do produto
Benefícios Visuais: Destaque características que facilitam o uso
Organização e Ordem: Crie um ambiente organizado que reflita praticidade
Resultados Tangíveis: Mostre os resultados obtidos com o uso do produto
Conveniência: Enfatize aspectos como economia de tempo, espaço, esforço

A imagem debe comunicar claramente o valor prático e os benefícios funcionais do produto.
Gere um prompt comercial completo e direto para criação da imagem, mantendo todas as características originais do produto.

IMPORTANTE: NÃO inclua texto, legendas, CTA (call-to-action), botões ou elementos gráficos na imagem. Foque apenas no produto e cenário visual.`,

    // MODELO 5: ESTILO DE VIDA
    model5: `Analise o produto na imagem e crie um prompt focado em estilo de vida:

Contexto de Uso: Descreva uma situação real de uso do produto no dia a dia
Estilo de Vida: Defina o lifestyle que o produto representa - moderno, luxury, casual, fitness, familiar
Momento/Ocasião: Especifique quando o produto é usado - manhã, noite, fim de semana, eventos especiais
Personalidade da Marca: Transmita a personalidade - inovador, confiável, divertido, sofisticado
Elementos Emocionais: Adicione elementos que despertem emoções positivas e conexão
Background/Cenário: Crie um ambiente que conte uma história e valorize a experiência

Foque em mostrar o produto como parte de um estilo de vida desejável, criando conexão emocional com o público.
Gere um prompt comercial completo e direto para criação da imagem, mantendo todas as características originais do produto.

IMPORTANTE: NÃO inclua texto, legendas, CTA (call-to-action), botões ou elementos gráficos na imagem. Foque apenas no produto e cenário visual.`,

    // MODELO 6: HÍBRIDO OTIMIZADO (inspirado nos 5 modelos, prompt único e coeso)
    model6: `Crie um único prompt coeso e comercial inspirado nos 5 modelos Runware, SEM listas ou enumerações. Escreva um texto corrido que una:
- o profissionalismo de anúncio visual (composição e enquadramento),
- um cenário desejado convincente (local, ação e atmosfera),
- o valor educativo/familiar quando pertinente,
- benefícios práticos claros (uso e resultado),
- e um estilo de vida aspiracional (personalidade de marca).

Descreva ambiente específico, composição, iluminação fotográfica profissional e elementos complementares discretos. Mantenha 100% das características originais do produto.

NÃO mencione os modelos e NÃO use tópicos. Gere apenas o prompt final direto, detalhado e focado na geração de uma imagem publicitária de alta qualidade.

IMPORTANTE: NÃO inclua texto, legendas, CTA (call-to-action), botões ou elementos gráficos na imagem. Foque apenas no produto e cenário visual.`
  };

  // Nomes dos modelos para exibição na interface
  const runwareModelNames = [
    "Anúncio Visual Profissional",
    "Cenário Desejado", 
    "Educativo/Familiar",
    "Problema/Solução",
    "Estilo de Vida",
    "Combinado (5 Modelos)"
  ];

  // Função para gerar prompts com Gemini usando as 6 estruturas
  const generateGeminiPrompts = async () => {
    if (selectedBaseImages.length === 0) {
      toast.error('⚠️ Selecione pelo menos 1 imagem melhorada DeepAI primeiro! Imagens originais não são permitidas.');
      return;
    }
    if (!productName || !productName.trim()) {
      toast.error('Nome do produto ausente. Abra um produto com nome válido.');
      return;
    }

    setIsGeneratingGeminiPrompts(true);

    try {
      // 🎯 Buscar dados unificados do copywriting
      console.log('🔍 [RUNWARE] Buscando dados unificados para o produto:', productId);
      const unifiedData = await getUnifiedDataForProduct(productId);
      
      if (unifiedData && unifiedData.idealEnvironments.length > 0) {
        console.log('🎯 [RUNWARE] Dados unificados encontrados!', {
          idealEnvironments: unifiedData.idealEnvironments.length,
          idealFor: unifiedData.idealFor.length,
          mainKeywords: unifiedData.mainKeywords.length,
          longTailKeywords: unifiedData.longTailKeywords.length
        });
      } else {
        console.log('⚠️ [RUNWARE] Nenhum dado unificado encontrado, usando templates padrão');
      }

      toast.loading('🤖 Gerando prompts dos 6 Modelos Runware via Gemini Vision...', { 
        id: 'gemini-generation',
        description: 'Analisando imagem e aplicando estruturas específicas'
      });

      // Converter primeira imagem selecionada para base64 para envio ao Gemini
      const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]); // Remove o prefixo data:image/...;base64,
            };
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error('Erro ao converter imagem para base64:', error);
          throw error;
        }
      };

      const imageInput = selectedBaseImages[0];

      // 🎨 Gerar variações com dados unificados
      let enrichedPrompts: string[] = [];
      
      if (unifiedData && unifiedData.idealEnvironments.length > 0) {
        console.log('🎨 [RUNWARE] Gerando variações de prompts com dados unificados...');
        
        const variations = generatePromptVariations(
          productName,
          shortDescription,
          unifiedData
        );
        
        const distributed = distributeVariations(variations, {
          totalImages: 6,
          prioritizeHigh: true,
          shuffle: true
        });
        
        console.log('🎨 [RUNWARE] Variações distribuídas:', {
          totalVariacoes: variations.length,
          distribuidas: distributed.length,
          contextosUnicos: [...new Set(distributed.map(v => v.context))].length
        });
        
        // Enriquecer cada template com dados da variação
        enrichedPrompts = Object.entries(runwarePromptModels).map(([modelKey, modelStructure], index) => {
          const variation = distributed[index] || distributed[0];
          
          return `${modelStructure}

🎯 CONTEXTO ESPECÍFICO DO COPYWRITING PROFISSIONAL:
Ambiente Ideal: ${variation.context}
Keywords Principais: ${unifiedData.mainKeywords.slice(0, 3).join(', ')}
Público-Alvo: ${unifiedData.targetAudience}

IMPORTANTE: Integre estes elementos do copywriting ao prompt de forma natural e profissional.`;
        });
        
        toast.info('✅ Prompts enriquecidos com dados do copywriting!', { duration: 3000 });
      } else {
        // Usar templates padrão sem enriquecimento
        enrichedPrompts = Object.values(runwarePromptModels);
      }

      // Gerar prompts usando as estruturas enriquecidas via API Gemini
      const modelPromises = enrichedPrompts.map(async (modelStructure, index) => {
        try {
          console.log(`🚀 Iniciando geração do modelo ${index + 1}: ${runwareModelNames[index]}`);
          console.log(`📝 Estrutura do prompt:`, modelStructure.substring(0, 200) + '...');
          
          // Adicionar contexto do produto ao prompt
          const promptWithProduct = addProductContext(modelStructure, productName);
          
          const { data, error } = await supabase.functions.invoke('ai-chat-proxy', {
            body: {
              imageData: imageInput,
              prompt: promptWithProduct,
              action: 'generate_prompt',
              targetFunction: 'gemini-background-generator'
            }
          });

          if (error) {
            console.error(`❌ Erro da API no modelo ${index + 1}:`, error);
            throw error;
          }

          console.log(`📥 Resposta recebida do modelo ${index + 1}:`, data);

          toast.success(`✅ ${runwareModelNames[index]} concluído!`, { 
            id: `gemini-prompt-${index + 1}`,
            description: `${runwareModelNames[index]} gerado via Gemini Vision`
          });

          const content = (data && (data.generated_image_text || data.generatedPrompt || data.content || data.response || data.text)) as string | undefined;
          
          if (!content) {
            console.warn(`⚠️ Conteúdo vazio no modelo ${index + 1}. Data completa:`, data);
            throw new Error(`Resposta vazia da API para ${runwareModelNames[index]}`);
          }

          console.log(`✅ Prompt gerado com sucesso para modelo ${index + 1}:`, content.substring(0, 100) + '...');
          return content;

        } catch (error) {
          console.error(`💥 Erro detalhado no modelo ${runwareModelNames[index]} (${index + 1}):`, {
            error: error,
            message: error instanceof Error ? error.message : 'Erro desconhecido',
            modelIndex: index
          });
          
          toast.error(`❌ Falha no ${runwareModelNames[index]}`, { 
            id: `gemini-prompt-error-${index + 1}`,
            description: error instanceof Error ? error.message : 'Erro na API'
          });
          
          // Retornar um prompt básico em caso de erro
          return `Prompt básico para ${productName} seguindo o modelo ${runwareModelNames[index]} - erro na geração via API.`;
        }
      });

      // Aguardar todos os prompts serem gerados
      const generatedPrompts = await Promise.allSettled(modelPromises);
      
      // Extrair os resultados
      const sixPrompts = generatedPrompts.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return `Erro na geração do ${runwareModelNames[index]}`;
        }
      });

      setGeneratedGeminiPrompts(sixPrompts);
      setPromptsToApply(sixPrompts);

      toast.success(`🎉 ${sixPrompts.length} prompts gerados via Gemini!`, {
        id: 'gemini-generation',
        description: 'Prompts analisados por IA e copiados para Geração Múltipla'
      });

    } catch (error) {
      console.error('Erro na geração de prompts Gemini:', error);
      toast.error('❌ Erro na geração de prompts via Gemini', { id: 'gemini-generation' });
    } finally {
      setIsGeneratingGeminiPrompts(false);
    }
  };

  // Hook para verificar imagens melhoradas
  const { loadEnhancedImages } = useImageEnhancementPersistence();

  // Força re-render quando generatedImages muda
  useEffect(() => {
    console.log(`🔄 [DEBUG useEffect] generatedImages mudou:`, generatedImages);
    console.log(`🔄 [DEBUG useEffect] Quantidade de imagens:`, generatedImages.length);
  }, [generatedImages]);

  // Effect para automatizar processo quando evento for disparado
  useEffect(() => {
    const handlePremiumAdGeneration = async (event: CustomEvent) => {
      console.log('🚀 Evento de geração premium recebido:', event.detail);
      
      try {
        // 1. Carregar imagens melhoradas
        const enhanced = await loadEnhancedImages(productId);
        console.log('📸 Imagens melhoradas carregadas:', enhanced);
        
        if (enhanced.length === 0) {
          toast.error("Nenhuma imagem melhorada encontrada para este produto");
          return;
        }

        // 2. Selecionar automaticamente as duas primeiras imagens
        const firstTwoImages = enhanced.slice(0, 2).map(img => img.enhanced);
        setSelectedBaseImages(firstTwoImages);
        console.log('✅ [AUTOMAÇÃO RUNWARE] Duas primeiras imagens selecionadas automaticamente:', firstTwoImages.length);
        console.log('✅ [AUTOMAÇÃO RUNWARE] URLs das imagens selecionadas:', firstTwoImages.map((url, i) => `${i+1}: ${url.substring(0, 50)}...`));
        
        toast.success(`🖼️ Selecionadas automaticamente: ${firstTwoImages.length} imagens para processamento`);

        // 3. Expandir a seção Runware
        setExpandedTool('runware');
        toast.info("🔧 Expandindo seção IA Avançada - Runware...");

        // 4. Gerar prompts automaticamente usando Gemini/OpenAI
        toast.info("🧠 Gerando prompts inteligentes com IA...", { duration: 8000 });
        
        // Usando Promise para aguardar o retorno
        const prompts = await new Promise<string[]>((resolve) => {
          generateSpecialistCommands(
            productName,
            shortDescription,
            'gemini' as const, // Usar Gemini por padrão
            (data) => {
              console.log('🎯 Dados recebidos das funções especializadas:', data);
              
              // Extrair prompts do retorno
              const extractedPrompts: string[] = [];
              if (data?.results) {
                Object.values(data.results).forEach((result: any) => {
                  if (result?.data?.content) {
                    // Melhorar os prompts para evitar ambientes escuros e cenários ruins
                    const improvedPrompt = `${result.data.content}. IMPORTANTE: Use ambientes extremamente bem iluminados com luz natural abundante, evite completamente qualquer área escura ou sombria, prefira fundos limpos e modernos com excelente iluminação, configuração de iluminação profissional quente, atmosfera vibrante e atraente, sem cantos escuros ou áreas mal iluminadas, garanta visibilidade excelente e apresentação comercial premium, luz do dia brilhante, ambiente moderno e contemporâneo, iluminação perfeita para fotografia comercial, sem sombras duras, luz difusa e suave`;
                    extractedPrompts.push(improvedPrompt);
                  }
                });
              }
              
              resolve(extractedPrompts.length > 0 ? extractedPrompts : [
                "configuração de estúdio profissional com iluminação natural brilhante abundante, fundo moderno e limpo, ambiente premium extremamente bem iluminado, sem áreas escuras, iluminação comercial quente e perfeita, luz do dia radiante",
                "ambiente minimalista elegante com excelente iluminação natural, superfícies limpas e brilhantes, ambiente de luz do dia vibrante, configuração premium bem iluminada, sem sombras ou pontos escuros, modernidade e sofisticação",
                "configuração de exibição luxuosa com iluminação brilhante sofisticada, materiais premium em espaço extremamente bem iluminado, visibilidade excelente, iluminação profissional quente e radiante, apresentação vibrante e moderna"
              ]);
            }
          );
        });
        
        if (prompts.length > 0) {
          console.log('🎯 Prompts gerados:', prompts);
          setAllGeneratedPrompts(prompts);
          
          // 5. Processar automaticamente cada prompt
          await processAllPromptsAutomatically(firstTwoImages, prompts);
          
          console.log('✅ [AUTOMAÇÃO RUNWARE] Runware finalizado com sucesso!');
          
        } else {
          toast.error("Falha ao gerar prompts automáticos");
        }
        
      } catch (error) {
        console.error('❌ [AUTOMAÇÃO RUNWARE] Erro na geração automática:', error);
        toast.error("Erro na geração automática de anúncios");
      }
    };

    // 🚫 REMOVIDO: Listener para prompts do Gemini cancelado
    // Esta funcionalidade estava causando duplicações e problemas
    
    // 🚫 AUTOMAÇÃO REMOVIDA: Listener para geração premium desabilitado
    console.log('🚫 [AUTOMAÇÃO REMOVIDA] Listener triggerPremiumAdGeneration foi desabilitado');
    // window.addEventListener('triggerPremiumAdGeneration', handlePremiumAdGeneration as EventListener);
    
    return () => {
      console.log('🚫 [AUTOMAÇÃO REMOVIDA] Cleanup de listener premium removido');
      // window.removeEventListener('triggerPremiumAdGeneration', handlePremiumAdGeneration as EventListener);
    };
  }, [productId, productName, shortDescription, loadEnhancedImages, generateSpecialistCommands]);

  // Função para processar todos os prompts automaticamente - ✅ CORRIGIDA PARA GERAR EXATAMENTE 6 IMAGENS
  const processAllPromptsAutomatically = async (baseImages: string[], prompts: string[]) => {
    console.log('🚀 [RUNWARE CORRIGIDO] Iniciando processamento automático LIMITADO a 6 imagens');
    console.log('🚀 [RUNWARE CORRIGIDO] Base images:', baseImages.length);
    console.log('🚀 [RUNWARE CORRIGIDO] Prompts:', prompts.length);
    
    const allResults: string[] = [];
    
    // ✅ LIMITE RIGOROSO: Máximo 6 prompts (cada um gera 1 imagem)
    const limitedPrompts = prompts.slice(0, 6);
    const baseImageToUse = baseImages[0]; // Usar sempre a primeira imagem base para evitar duplicação
    
    console.log(`🔒 [RUNWARE CORRIGIDO] LIMITE APLICADO: ${limitedPrompts.length} prompts com 1 imagem base = ${limitedPrompts.length} imagens totais`);
    
    for (let i = 0; i < limitedPrompts.length; i++) {
      const currentPrompt = limitedPrompts[i];
      toast.info(`🎨 Processando prompt ${i + 1}/${limitedPrompts.length}: "${currentPrompt.substring(0, 50)}..."`);
      
      try {
        // ✅ CORREÇÃO CRÍTICA: Usar apenas UMA imagem base para evitar duplicação
        console.log(`🎯 [RUNWARE CORRIGIDO] Gerando imagem ${i + 1}/${limitedPrompts.length} com imagem base única`);
        
        const enhancedPrompt = `Place the uploaded product exactly as shown in the input image on ${currentPrompt}. Show realistic background elements with proper lighting and shadows. Make the lighting warm and photographic with light grain and ambient shadows.

🔒 CRITICAL PRESERVATION INSTRUCTIONS:
- Preserve the original object exactly as shown in the input image. Do not modify its shape, proportions, textures, color, lighting or edges.
- Use the uploaded image as the exact base. The product must remain visually identical — do not repaint or stylize the object.
- The product must remain 100% unchanged — only generate a new realistic background context around it.
- DO NOT modify the product in any way. Preserve the exact appearance of the product — including shape, color, material, and lighting. The object must remain fully intact and untouched.

Style: photo-realistic with centered subject and contextual background.`;

        const result = await imageToImage(
          enhancedPrompt,
          baseImageToUse, // ✅ SEMPRE A MESMA IMAGEM BASE
          'runware:106@1',
          1024,
          1024,
          0.15, // Preservação máxima
          1.5,  // CFG baixo
          20,   // Steps reduzidos
          1,    // Uma imagem por vez
          'JPEG',
          50,   // Guidance baixo
          "modified object, deformed product, changed colors, altered shape, different texture, repainted object, stylized product, distorted proportions, wrong lighting, blurry object, altered product, changed appearance, different style"
        );

        if (result.success && result.data) {
          if (Array.isArray(result.data)) {
            const imageUrls = result.data.map(item => extractImageUrl(item)).filter(Boolean);
            allResults.push(...imageUrls);
          } else {
            const imageUrl = extractImageUrl(result.data);
            if (imageUrl) allResults.push(imageUrl);
          }
          
          console.log(`✅ [RUNWARE CORRIGIDO] Imagem ${i + 1} gerada com sucesso. Total: ${allResults.length}`);
        }
        
        // Pequena pausa entre prompts para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Erro ao processar prompt ${i + 1}:`, error);
      }
    }
    
    console.log(`✅ Processamento automático concluído! ${allResults.length} imagens geradas`);
    setGeneratedImages(allResults);
    
    if (allResults.length > 0) {
      // 🔄 Converter Base64 → Blob URL ANTES de enviar para galeria
      console.log(`🔄 [RUNWARE] Convertendo ${allResults.length} imagens para Blob...`);
      const blobUrls = await Promise.all(
        allResults.map(img => resizeImageTo1000x1000(img))
      );
      console.log('✅ [RUNWARE] Conversão Blob concluída para todas as imagens');
      
      toast.success(`🎉 Runware concluído! ${blobUrls.length} anúncios premium criados!`);
      
    // ✅ SISTEMA ANTI-DUPLICAÇÃO RUNWARE
    const imageEvent = new CustomEvent('imageGenerated', {
      detail: {
        source: 'runware',
        images: blobUrls, // ✅ Usar Blob URLs
        productId: productId,
        timestamp: Date.now(),
        batchComplete: true,
        batchId: `runware-${productId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // ID único do lote
        generationRound: Date.now() // Round único de geração
      }
    });
      window.dispatchEvent(imageEvent);
      
      // 🚀 FUNCIONALIDADE TONGYI DESATIVADA TEMPORARIAMENTE
      // console.log('🚀 [NOVA ORDEM] Runware finalizado, aguardando 5s para Tongyi (FINAL)...');
      // toast.info('🎯 Runware concluído! Aguardando 5s para iniciar Tongyi (etapa final)...', { duration: 5000 });
      
      // // Aguardar 5 segundos antes de disparar o próximo
      // setTimeout(() => {
      //   const tongyiEvent = new CustomEvent('triggerTongyiAutomation', {
      //     detail: {
      //       productId: productId,
      //       source: 'runware-completed',
      //       timestamp: Date.now()
      //     }
      //   });
      //   
      //   console.log('🚀 [NOVA ORDEM] Disparando evento triggerTongyiAutomation (FINAL):', tongyiEvent.detail);
      //   window.dispatchEvent(tongyiEvent);
      //   console.log('✅ [NOVA ORDEM] Sequência completa: Gemini → BFL → Runware → Tongyi ativada!');
      // }, 5000);
      
    } else {
      toast.error("❌ Nenhuma imagem foi gerada automaticamente");
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log('📁 Arquivos para processamento:', acceptedFiles);
    const file = acceptedFiles[0];
    if (file) {
      console.log('📄 Arquivo para processamento:', { 
        name: file.name, 
        size: file.size, 
        type: file.type 
      });
      
      const reader = new FileReader();
      reader.onload = () => {
        console.log('✅ Arquivo para processamento carregado');
        const base64 = (reader.result as string).split(',')[1];
        setUploadedImage(base64);
        setProcessedImage(null);
        setApiCost(null);
        toast.success(`Imagem "${file.name}" carregada para processamento!`);
      };
      reader.onerror = (error) => {
        console.error('❌ Erro ao ler arquivo para processamento:', error);
        toast.error('Erro ao carregar a imagem para processamento.');
      };
      reader.readAsDataURL(file);
    } else {
      console.log('❌ Nenhum arquivo para processamento');
      toast.error('Nenhuma imagem foi selecionada para processamento');
    }
  }, []);

  const validateImageUrl = (url: string): boolean => {
    // Aceitar URLs completas (http/https) ou URLs relativas (começando com /)
    const absoluteUrlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|webp)(\?.*)?$/i;
    const relativeUrlPattern = /^\/.*\.(jpg|jpeg|png|webp)(\?.*)?$/i;
    return absoluteUrlPattern.test(url) || relativeUrlPattern.test(url);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    multiple: false,
    onDropAccepted: (files) => {
      console.log('🟢 Arquivos aceitos para processamento:', files);
    },
    onDropRejected: (rejections) => {
      console.log('🔴 Arquivos rejeitados para processamento:', rejections);
      toast.error('Formato de arquivo não suportado. Use PNG, JPG, JPEG ou WEBP.');
    }
  });

  const extractImageUrl = (data: any): string | null => {
    console.log('🔍 [EXTRACT URL] Iniciando extração de URL da resposta completa:', JSON.stringify(data, null, 2));
    
    try {
      // Caso específico para estrutura da Runware API REST: { taskType, imageUUID, imageURL, ... }
      if (data?.imageURL && typeof data.imageURL === 'string' && data.imageURL.startsWith('http')) {
        console.log('✅ [EXTRACT URL] URL válida encontrada diretamente em data.imageURL:', data.imageURL);
        return data.imageURL;
      }
      
      // Caso 1: Se data tem propriedade 'data' (resposta da API)
      if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
        console.log('📦 [EXTRACT URL] Detectado array data.data, pegando primeiro item:', data.data[0]);
        const firstItem = data.data[0];
        
        if (firstItem?.imageURL && typeof firstItem.imageURL === 'string' && firstItem.imageURL.startsWith('http')) {
          console.log('✅ [EXTRACT URL] URL válida encontrada em data.data[0].imageURL:', firstItem.imageURL);
          return firstItem.imageURL;
        }
      }
      
      // Caso 2: Se data é um array direto
      if (Array.isArray(data) && data.length > 0) {
        console.log('📦 [EXTRACT URL] Data é um array direto, pegando primeiro item:', data[0]);
        const firstItem = data[0];
        
        if (firstItem?.imageURL && typeof firstItem.imageURL === 'string' && firstItem.imageURL.startsWith('http')) {
          console.log('✅ [EXTRACT URL] URL válida encontrada em data[0].imageURL:', firstItem.imageURL);
          return firstItem.imageURL;
        }
      }
      
      // Caso 4: Verificar outros campos possíveis
      const possibleFields = ['outputURL', 'url', 'image_url', 'result_url'];
      
      for (const field of possibleFields) {
        if (data?.[field] && typeof data[field] === 'string' && data[field].startsWith('http')) {
          console.log(`✅ [EXTRACT URL] URL válida encontrada no campo '${field}':`, data[field]);
          return data[field];
        }
      }
      
      console.log('❌ [EXTRACT URL] Nenhuma URL válida encontrada nos dados');
      return null;
      
    } catch (error) {
      console.error('❌ [EXTRACT URL] Erro ao extrair URL:', error);
      return null;
    }
  };

  const extractCost = (data: any): number | null => {
    console.log('💰 [EXTRACT COST] Iniciando extração de custo da resposta:', JSON.stringify(data, null, 2));
    
    try {
      // Caso 1: Se data tem propriedade 'data' (resposta da API)
      if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
        const firstItem = data.data[0];
        if (typeof firstItem?.cost === 'number') {
          console.log('✅ [EXTRACT COST] Custo encontrado em data.data[0].cost:', firstItem.cost);
          return firstItem.cost;
        }
      }
      
      // Caso 2: Se data é um array direto
      if (Array.isArray(data) && data.length > 0) {
        const firstItem = data[0];
        if (typeof firstItem?.cost === 'number') {
          console.log('✅ [EXTRACT COST] Custo encontrado em data[0].cost:', firstItem.cost);
          return firstItem.cost;
        }
      }
      
      // Caso 3: Se cost está direto no data
      if (typeof data?.cost === 'number') {
        console.log('✅ [EXTRACT COST] Custo encontrado diretamente em data.cost:', data.cost);
        return data.cost;
      }
      
      console.log('❌ [EXTRACT COST] Nenhum custo encontrado nos dados');
      return null;
      
    } catch (error) {
      console.error('❌ [EXTRACT COST] Erro ao extrair custo:', error);
      return null;
    }
  };

  const handleImageToImage = async () => {
    console.log('🚀 [DEBUG] handleImageToImage iniciado');
    console.log('📊 Estado atual:');
    console.log('  - enhancedImages:', enhancedImages.length);
    console.log('  - selectedBaseImages:', selectedBaseImages.length, selectedBaseImages);
    console.log('  - prompt:', prompt.trim());
    console.log('  - selectedAI:', selectedAI);
    
    if (!prompt.trim()) {
      toast.error('Digite um prompt para transformar a imagem');
      return;
    }
    if (selectedBaseImages.length === 0) {
      toast.error('⚠️ Selecione pelo menos 1 imagem melhorada DeepAI! Imagens originais não são permitidas.');
      return;
    }
    
    // Validar todas as URLs selecionadas
    const invalidUrls = selectedBaseImages.filter(url => !validateImageUrl(url));
    if (invalidUrls.length > 0) {
      toast.error('Uma ou mais URLs de imagem são inválidas');
      return;
    }

    try {
      const allResults = [];
      
      if (selectedAI === 'gemini') {
        // Usar Gemini Background Generator
        console.log('✨ [GEMINI] Processando com Gemini Background Generator');
        
        for (const baseImageUrl of selectedBaseImages) {
          console.log(`✨ [GEMINI] Processando imagem: ${baseImageUrl.substring(0, 60)}...`);
          
          const result = await geminiGenerateBackground(baseImageUrl, prompt);
          
          if (result.success && result.generatedImage) {
            allResults.push(result.generatedImage);
            console.log(`✅ [GEMINI] Imagem gerada com sucesso:`, result.generatedImage.substring(0, 60) + "...");
          } else {
            console.error(`❌ [GEMINI] Falha ao gerar imagem:`, result);
          }
        }
      } else {
        // Usar Runware API (original)
        console.log('🔍 [RUNWARE] Verificando dados antes de enviar:');
        console.log('📋 Imagens base selecionadas:', selectedBaseImages);
        console.log('📝 Prompt original:', prompt);
        console.log('🎯 Modelo selecionado:', 'runware:106@1');
        console.log('⚙️ Parâmetros:', { width, height, strength, cfgScale, steps, numberResults, outputFormat, guidanceEndStepPercentage });
        
        const enhancedPrompt = `Place the uploaded product exactly as shown in the input image on ${prompt}. Show realistic background elements with proper lighting and shadows. Make the lighting warm and photographic with light grain and ambient shadows. 

🔒 CRITICAL PRESERVATION INSTRUCTIONS:
- Preserve the original object exactly as shown in the input image. Do not modify its shape, proportions, textures, color, lighting or edges.
- Use the uploaded image as the exact base. The product must remain visually identical — do not repaint or stylize the object.
- The product must remain 100% unchanged — only generate a new realistic background context around it.
- DO NOT modify the product in any way. Preserve the exact appearance of the product — including shape, color, material, and lighting. The object must remain fully intact and untouched.

Style: photo-realistic with centered subject and contextual background.`;
        
        for (const baseImageUrl of selectedBaseImages) {
          console.log(`📸 [RUNWARE] Processando imagem: ${baseImageUrl}`);
          
          const result = await imageToImage(
            enhancedPrompt, 
            baseImageUrl, 
            'runware:106@1',
            width, 
            height, 
            0.15,
            1.5,
            20,
            numberResults, 
            outputFormat, 
            50,
            "modified object, deformed product, changed colors, altered shape, different texture, repainted object, stylized product, distorted proportions, wrong lighting, blurry object, altered product, changed appearance, different style"
          );
          
          if (result.success && result.data) {
            if (Array.isArray(result.data)) {
              const imageUrls = result.data.map(item => extractImageUrl(item)).filter(Boolean);
              allResults.push(...imageUrls);
            } else {
              const imageUrl = extractImageUrl(result.data);
              if (imageUrl) allResults.push(imageUrl);
            }
          }
        }
      }
      
      console.log(`🎯 [DEBUG] Total de URLs coletadas via ${selectedAI.toUpperCase()}:`, allResults.length);
      
      setGeneratedImages(allResults);
      
      if (allResults.length > 0) {
        const aiName = selectedAI === 'gemini' ? 'Gemini' : 'Runware';
        toast.success(`${allResults.length} imagens geradas com sucesso via ${aiName}!`);
      } else {
        toast.error('Nenhuma imagem válida foi gerada. Verifique os logs para mais detalhes.');
      }
    } catch (error) {
      console.error('Erro ao transformar imagens:', error);
      toast.error('Erro ao transformar imagens');
    }
  };

  const handleUpscaleImage = async () => {
    if (!uploadedImage) {
      toast.error('Faça upload de uma imagem primeiro');
      return;
    }

    try {
      console.log('🔍 Iniciando upscale da imagem...');
      const result = await upscaleImage(uploadedImage, upscaleFactor);
      console.log('📥 Resultado completo do upscale:', JSON.stringify(result, null, 2));
      
      if (result.success && result.data) {
        const imageUrl = extractImageUrl(result.data);
        const cost = extractCost(result.data);
        console.log('🖼️ URL extraída para upscale:', imageUrl);
        console.log('💰 Custo extraído para upscale:', cost);
        
        if (imageUrl && imageUrl.startsWith('http')) {
          setProcessedImage(imageUrl);
          setApiCost(cost);
          console.log('✅ Imagem processada definida com sucesso:', imageUrl);
          const costMessage = cost ? ` (Custo: $${cost.toFixed(4)})` : '';
          toast.success(`Imagem ampliada com sucesso!${costMessage}`);
        } else {
          console.error('❌ URL inválida ou não encontrada:', imageUrl);
          toast.error('Erro: URL da imagem inválida ou não encontrada');
        }
      } else {
        console.error('❌ Resultado do upscale não bem-sucedido:', result);
        toast.error(result.error || 'Erro ao processar imagem');
      }
    } catch (error) {
      console.error('❌ Erro ao fazer upscale:', error);
      toast.error('Erro ao processar imagem');
    }
  };

  const handleRemoveBackground = async () => {
    if (!uploadedImage) {
      toast.error('Faça upload de uma imagem primeiro');
      return;
    }

    try {
      console.log('🗑️ [REMOVE BACKGROUND] Iniciando remoção de fundo...');
      console.log('🗑️ [REMOVE BACKGROUND] Imagem base64:', uploadedImage.substring(0, 100) + '...');
      
      const result = await removeBackground(uploadedImage);
      console.log('📥 [REMOVE BACKGROUND] Resultado COMPLETO da API:', JSON.stringify(result, null, 2));
      
      if (result.success && result.data) {
        console.log('📊 [REMOVE BACKGROUND] Data recebido:', JSON.stringify(result.data, null, 2));
        
        // Extrair URL e custo usando funções robustas
        const imageUrl = extractImageUrl(result.data);
        const cost = extractCost(result.data);
        console.log('🔍 [REMOVE BACKGROUND] URL extraída pela função:', imageUrl);
        console.log('💰 [REMOVE BACKGROUND] Custo extraído:', cost);
        
        if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
          console.log('✅ [REMOVE BACKGROUND] Definindo processedImage com URL válida:', imageUrl);
          setProcessedImage(imageUrl);
          setApiCost(cost);
          const costMessage = cost ? ` (Custo: $${cost.toFixed(4)})` : '';
          toast.success(`✅ Fundo removido com sucesso!${costMessage}`);
        } else {
          console.error('❌ [REMOVE BACKGROUND] URL inválida ou não encontrada:', {
            imageUrl,
            type: typeof imageUrl,
            startsWithHttp: imageUrl?.startsWith('http'),
            resultData: result.data
          });
          toast.error('❌ Erro: URL da imagem inválida ou não encontrada');
        }
      } else {
        console.error('❌ [REMOVE BACKGROUND] Resultado não bem-sucedido:', {
          success: result.success,
          data: result.data,
          error: result.error
        });
        toast.error(result.error || '❌ Erro ao processar imagem');
      }
    } catch (error) {
      console.error('❌ [REMOVE BACKGROUND] Erro na execução:', error);
      toast.error('❌ Erro ao processar imagem');
    }
  };

  const handleEnhanceImage = async () => {
    if (!uploadedImage) {
      toast.error('Faça upload de uma imagem primeiro');
      return;
    }

    try {
      console.log('🔍 Iniciando melhoria da imagem...');
      const result = await enhanceImage(uploadedImage);
      console.log('📥 Resultado completo da melhoria:', JSON.stringify(result, null, 2));
      
      if (result.success && result.data) {
        const imageUrl = extractImageUrl(result.data);
        const cost = extractCost(result.data);
        console.log('🖼️ URL extraída para melhoria:', imageUrl);
        console.log('💰 Custo extraído para melhoria:', cost);
        
        if (imageUrl && imageUrl.startsWith('http')) {
          setProcessedImage(imageUrl);
          setApiCost(cost);
          console.log('✅ Imagem processada definida com sucesso:', imageUrl);
          const costMessage = cost ? ` (Custo: $${cost.toFixed(4)})` : '';
          toast.success(`Imagem melhorada com sucesso!${costMessage}`);
        } else {
          console.error('❌ URL inválida ou não encontrada:', imageUrl);
          toast.error('Erro: URL da imagem inválida ou não encontrada');
        }
      } else {
        console.error('❌ Resultado da melhoria não bem-sucedido:', result);
        toast.error(result.error || 'Erro ao processar imagem');
      }
    } catch (error) {
      console.error('❌ Erro ao melhorar imagem:', error);
      toast.error('Erro ao processar imagem');
    }
  };

  // Função para analisar e descrever dimensões do produto
  const analyzeDimensions = (
    altura: number | null | undefined,
    largura: number | null | undefined,
    profundidade: number | null | undefined,
    peso: number | null | undefined
  ): string => {
    if (!altura && !largura && !profundidade && !peso) {
      return '';
    }

    const parts: string[] = [];
    
    // Análise de proporções
    if (altura && largura && profundidade) {
      const maxDim = Math.max(altura, largura, profundidade);
      const minDim = Math.min(altura, largura, profundidade);
      
      if (altura > largura && altura > profundidade) {
        parts.push('Product is TALL and VERTICAL in orientation');
      } else if (largura > altura && largura > profundidade) {
        parts.push('Product is WIDE and HORIZONTAL in orientation');
      } else if (profundidade > altura && profundidade > largura) {
        parts.push('Product has significant DEPTH dimension');
      }
      
      const ratio = maxDim / minDim;
      if (ratio > 3) {
        parts.push('with ELONGATED proportions');
      } else if (ratio < 1.5) {
        parts.push('with COMPACT and BALANCED proportions');
      }
      
      parts.push(`(approximate dimensions: ${altura}cm H x ${largura}cm W x ${profundidade}cm D)`);
    } else if (altura || largura || profundidade) {
      const dims: string[] = [];
      if (altura) dims.push(`Height: ${altura}cm`);
      if (largura) dims.push(`Width: ${largura}cm`);
      if (profundidade) dims.push(`Depth: ${profundidade}cm`);
      parts.push(`Product dimensions: ${dims.join(', ')}`);
    }
    
    // Análise de peso
    if (peso) {
      if (peso < 0.5) {
        parts.push('LIGHTWEIGHT product (under 500g)');
      } else if (peso < 2) {
        parts.push('MEDIUM-WEIGHT product (0.5-2kg)');
      } else {
        parts.push('SUBSTANTIAL-WEIGHT product (over 2kg)');
      }
    }
    
    return parts.length > 0 
      ? `CRITICAL PRODUCT DIMENSIONS: ${parts.join(', ')}. The AI MUST respect these physical proportions when generating the image to ensure realistic representation.`
      : '';
  };

  // Funções para geração de prompts por imagem
  const generatePromptsForSingleImage = async (
    imageUrl: string, 
    imageIndex: number,
    apiType: 'gemini' | 'openai'
  ): Promise<string[]> => {
    console.log(`🎨 Gerando prompts para imagem ${imageIndex + 1}/${selectedBaseImages.length} com ${apiType.toUpperCase()}`);
    
    // 📏 Gerar descrição de dimensões
    console.log(`📏 [DIMENSÕES] Produto "${productName}":`, {
      altura: altura || 'não informada',
      largura: largura || 'não informada',
      profundidade: profundidade || 'não informada',
      peso_bruto: peso_bruto || 'não informado'
    });
    const dimensionsDescription = analyzeDimensions(altura, largura, profundidade, peso_bruto);
    console.log(`📏 Descrição de dimensões gerada:`, dimensionsDescription);
    
    return new Promise((resolve) => {
        generateSpecialistCommands(
          productName,
          shortDescription,
          apiType as 'gemini' | 'openai',
          (data) => {
            // ENGENHEIRO DE PROMPTS ULTRA-AVANÇADO - AMBIENTES BRILHANTES E MODERNOS
            const generateHighImpactCreatives = (): string[] => {
              
              // AMBIENTES PROFISSIONAIS ULTRA-MODERNOS - ILUMINAÇÃO BRILHANTE - SEM PESSOAS
              const ambientesModernos = [
                // 1. LUXO PREMIUM BRILHANTE - Iluminação profissional clara
                {
                  ambiente: "ultra-modern luxury kitchen with pristine white marble countertops, polished gold fixtures, bright studio lighting, floor-to-ceiling windows with daylight, clean minimalist design",
                  iluminacao: "bright professional studio lighting, soft box lighting, well-lit environment, no dark shadows",
                  estilo: "bright luxury commercial photography, well-illuminated, crisp and clean",
                  restricoes: "NO PEOPLE, NO DARK AREAS, bright and well-lit"
                },
                
                // 2. NATUREZA BRILHANTE - Luz natural abundante  
                {
                  ambiente: "bright outdoor terrace with natural light, white wooden deck, vibrant green plants, well-lit natural setting, clear blue sky background",
                  iluminacao: "abundant natural daylight, bright golden hour lighting, no shadows, well-lit outdoor environment", 
                  estilo: "bright natural lifestyle photography, vibrant and luminous",
                  restricoes: "NO PEOPLE, bright outdoor lighting, no dark corners"
                },
                
                // 3. MODERNO BRILHANTE - Ambiente tecnológico iluminado
                {
                  ambiente: "bright modern tech workspace with white surfaces, glass elements, LED strip lighting, clean minimalist design, well-lit contemporary setting",
                  iluminacao: "bright LED lighting, professional illumination, clean white light, no dark shadows",
                  estilo: "bright tech photography, modern and clean, well-lit workspace",
                  restricoes: "NO PEOPLE, bright environment only, no dark areas"
                },
                
                // 4. ESTÚDIO CRIATIVO BRILHANTE - Ambiente artístico bem iluminado
                {
                  ambiente: "bright creative studio with white walls, natural light from large windows, modern furniture, artistic elements, well-lit professional space",
                  iluminacao: "abundant natural light combined with soft studio lighting, bright and airy atmosphere",
                  estilo: "bright creative photography, artistic but well-lit, professional studio aesthetic",
                  restricoes: "NO PEOPLE, bright creative space, excellent lighting"
                },
                
                // 5. MINIMALISMO BRILHANTE - Design clean e luminoso
                {
                  ambiente: "bright minimalist space with white surfaces, clean geometric lines, natural materials, excellent lighting, spacious modern design",
                  iluminacao: "soft natural lighting combined with architectural lighting, bright and serene",
                  estilo: "bright minimalist photography, clean and luminous, architectural excellence",
                  restricoes: "NO PEOPLE, bright minimalist design, well-lit spaces only"
                },
                
                // 6. LIFESTYLE PREMIUM BRILHANTE - Ambiente lifestyle luminoso
                {
                  ambiente: "bright premium lifestyle setting with elegant furniture, natural textures, excellent lighting, sophisticated modern design, spacious environment",
                  iluminacao: "premium lifestyle lighting, bright and welcoming, professional illumination",
                  estilo: "bright lifestyle photography, sophisticated and well-lit, premium quality",
                  restricoes: "NO PEOPLE, bright premium environment, excellent visibility"
                }
              ];

              // ELEMENTOS VISUAIS DE ALTO IMPACTO
              const elementosVisuais = [
                "with cinematic depth of field and bokeh effects",
                "featuring excellent lighting and perfect bright composition", 
                "with stunning visual storytelling and emotional connection",
                "showcasing premium material textures and fine details",
                "with professional color grading and commercial appeal",
                "featuring dynamic movement and energy"
              ];

              // INTELIGÊNCIA CONTEXTUAL BASEADA NO PRODUTO
              const analyzeProductContext = (productName: string): string => {
                const name = productName.toLowerCase();
                
                if (name.includes('mop') || name.includes('limpeza') || name.includes('cleaning')) {
                  return "Fundo de cozinha gourmet moderna com superfícies brilhantes e clean, iluminação de estúdio profissional destacando brilho e limpeza. Produto em primeiro plano sobre bancada bem iluminada, transmitindo sensação premium e profissional com excelente visibilidade";
                }
                
                if (name.includes('cozinha') || name.includes('kitchen') || name.includes('utensilio') || name.includes('panela')) {
                  return "Ambiente gourmet com mármore branco, iluminação natural suave, detalhes em dourado, estética clean e moderna";
                }
                
                if (name.includes('decoracao') || name.includes('casa') || name.includes('home') || name.includes('vaso')) {
                  return "Sala moderna minimalista com luz natural abundante, plantas verdes, móveis escandinavos, tons neutros e aconchegantes";
                }
                
                if (name.includes('tech') || name.includes('eletrônico') || name.includes('digital') || name.includes('computador')) {
                  return "Workspace futurista com LED azul, superfícies reflexivas, design tech moderno, iluminação neon sutil";
                }
                
                if (name.includes('fitness') || name.includes('sport') || name.includes('exercicio') || name.includes('academia')) {
                  return "Estúdio fitness moderno com espelhos, iluminação LED branca, equipamentos premium, atmosfera motivacional";
                }
                
                if (name.includes('roupa') || name.includes('fashion') || name.includes('moda') || name.includes('sapato')) {
                  return "Boutique elegante com iluminação quente, displays minimalistas, texturas luxuosas, ambiente sofisticado";
                }
                
                if (name.includes('bebe') || name.includes('infantil') || name.includes('criança') || name.includes('kids')) {
                  return "Quarto infantil moderno com cores suaves, brinquedos organizados, iluminação natural delicada, ambiente acolhedor";
                }
                
                // Contexto genérico premium para produtos não identificados
                return "Ambiente lifestyle premium com iluminação profissional, superfícies elegantes, design contemporâneo e atmosfera sofisticada";
              };

              // Selecionar 3 ambientes totalmente diferentes
              const ambientesSelecionados = [
                ambientesModernos[0], // Luxo Premium
                ambientesModernos[2], // Tech Moderno  
                ambientesModernos[4]  // Minimalismo Brilhante
              ];

              // Gerar contexto inteligente baseado no produto
              const contextoInteligente = analyzeProductContext(productName);

              // Gerar os 3 prompts com máxima diferenciação e contexto inteligente
              const prompts = ambientesSelecionados.map((ambiente, index) => {
                const elemento = elementosVisuais[index * 2 % elementosVisuais.length]; // Distribuir elementos diferentes
                
                // Para o primeiro prompt, usar o contexto inteligente analisado
                if (index === 0) {
                  return `ULTRA REALISTIC HIGH-IMPACT COMMERCIAL PHOTOGRAPHY: "${productName}" displayed in an aspirational home environment within ${contextoInteligente}. ${dimensionsDescription ? dimensionsDescription + ' ' : ''}${ambiente.iluminacao}. ${ambiente.estilo} ${elemento}. HYPER-DETAILED: 8K resolution, professional advertising quality, award-winning commercial photography, stunning visual impact. ${ambiente.restricoes}. ABSOLUTE PRESERVATION: Product "${productName}" appearance must remain untouched - exact same shape, color, materials, design, AND PROPORTIONS as original. Environment transformation only. Ultra-realistic, high-resolution, commercial excellence.`;
                }
                
                // Para os outros prompts, usar ambientes diferentes
                return `ULTRA REALISTIC HIGH-IMPACT COMMERCIAL PHOTOGRAPHY: "${productName}" showcased in a modern lifestyle setting in ${ambiente.ambiente}. ${dimensionsDescription ? dimensionsDescription + ' ' : ''}${ambiente.iluminacao}. ${ambiente.estilo} ${elemento}. HYPER-DETAILED: 8K resolution, professional advertising quality, award-winning commercial photography, stunning visual impact. ${ambiente.restricoes}. CRITICAL PRESERVATION: Product "${productName}" must remain 100% identical to original image INCLUDING EXACT PHYSICAL PROPORTIONS - zero modifications to shape, color, design, dimensions, or appearance. Only the background environment changes. Professional studio quality, photorealistic perfection, commercial standard excellence.`;
              });

              // Retornar os 3 prompts únicos e diferenciados
              const promptsFinais = prompts;

              return promptsFinais;
            };

            const promptsGerados = generateHighImpactCreatives();
            
            // Garantir que sempre retorne exatamente 3 prompts
            const tresPompts = promptsGerados.slice(0, 3);
            
            console.log(`✅ EXATOS 3 PROMPTS DE ALTO IMPACTO gerados para imagem ${imageIndex + 1}:`, tresPompts);
            resolve(tresPompts);
          }
        );
      });
    };

  const handleGeneratePromptsForAllImages = async (apiType: 'gemini' | 'openai') => {
    if (selectedBaseImages.length === 0) {
      toast.error('⚠️ Selecione pelo menos 1 imagem melhorada DeepAI! Imagens originais não são permitidas.');
      return;
    }

    setIsGeneratingPrompts(true);
    setGeneratedPromptsPerImage({});
    setAllGeneratedPrompts([]);

    try {
      console.log(`🚀 Iniciando geração de prompts para ${selectedBaseImages.length} imagens com ${apiType.toUpperCase()}`);
      
      const todosOsPrompts: string[] = []; // Array para coletar TODOS os prompts
      
      // Processar CADA imagem selecionada para gerar seus 3 prompts específicos
      for (let i = 0; i < selectedBaseImages.length; i++) {
        const imageUrl = selectedBaseImages[i];
        setCurrentProcessingImage(imageUrl);
        
        toast.loading(`Processando imagem ${i + 1}/${selectedBaseImages.length} com ${apiType.toUpperCase()}...`, {
          id: 'prompt-generation'
        });

        console.log(`📸 Processando imagem ${i + 1}/${selectedBaseImages.length}: ${imageUrl.substring(0, 50)}...`);
        
        // Gerar EXATOS 3 prompts específicos para esta imagem
        const promptsDaImagem = await generatePromptsForSingleImage(imageUrl, i, apiType);
        
        console.log(`✅ Exatos 3 prompts gerados para imagem ${i + 1}:`, promptsDaImagem);
        
        // Atualizar estado com os prompts gerados para esta imagem
        setGeneratedPromptsPerImage(prev => ({
          ...prev,
          [imageUrl]: promptsDaImagem
        }));

        // Adicionar os 3 prompts desta imagem ao array geral
        todosOsPrompts.push(...promptsDaImagem);
        
        console.log(`📊 Total de prompts acumulados: ${todosOsPrompts.length}`);
      }

      // Definir todos os prompts coletados (3 x número de imagens)
      setAllGeneratedPrompts(todosOsPrompts);
      
      // Copiar TODOS os prompts gerados para aplicação no MultiPromptImageGenerator
      setPromptsToApply(todosOsPrompts);
      
      console.log(`🔗🔗 [RUNWARE] Prompts copiados para MultiPromptImageGenerator:`, todosOsPrompts.length);
      console.log(`🔗🔗 [RUNWARE] Detalhes dos prompts copiados:`, todosOsPrompts.map((p, i) => `${i+1}: ${p.substring(0, 100)}...`));
      
      // 🚀 Disparar evento para Runway AI com os primeiros 2 prompts
      if (todosOsPrompts.length >= 2) {
        const firstTwoPrompts = todosOsPrompts.slice(0, 2);
        const runwayEvent = new CustomEvent('promptsReadyForRunway', {
          detail: {
            prompts: firstTwoPrompts,
            source: 'IA Avançada - Runware',
            productId: productId,
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(runwayEvent);
        console.log('📤 [RUNWARE→RUNWAY] Enviando 2 primeiros prompts para Runway AI:', firstTwoPrompts);
        toast.success(`✅ 2 prompts Runware enviados para Runway AI`);
      }

      // 🎯 Listen for force collection requests
      const handleForceRequest = () => {
        console.log('🔄 [RUNWARE] Recebeu solicitação de força - reenviando prompts...');
        if (todosOsPrompts.length >= 2) {
          const firstTwoPrompts = todosOsPrompts.slice(0, 2);
          const runwayEvent = new CustomEvent('promptsReadyForRunway', {
            detail: {
              prompts: firstTwoPrompts,
              source: 'IA Avançada - Runware',
              productId: productId,
              timestamp: Date.now()
            }
          });
          window.dispatchEvent(runwayEvent);
          console.log('🔄 [RUNWARE] Reenvio forçado - 2 prompts enviados para Runway');
        }
      };

      window.addEventListener('requestPromptsForRunway', handleForceRequest);
      
      // Cleanup listener after 30 seconds
      setTimeout(() => {
        window.removeEventListener('requestPromptsForRunway', handleForceRequest);
      }, 30000);
      
      toast.success(`✅ ${todosOsPrompts.length} prompts gerados e APLICADOS automaticamente!`, {
        id: 'prompt-generation',
        description: `Prompts personalizados pelo Gemini prontos para gerar ${todosOsPrompts.length} imagens únicas`,
        duration: 8000
      });

    } catch (error) {
      console.error('Erro ao gerar prompts:', error);
      toast.error(`Erro ao gerar prompts com ${apiType.toUpperCase()}`, {
        id: 'prompt-generation'
      });
    } finally {
      setIsGeneratingPrompts(false);
      setCurrentProcessingImage(null);
    }
  };


  const copyPromptsToMultiGenerator = (prompts: string[]) => {
    if (prompts.length > 0) {
      // Aplicar prompts diretamente no MultiPromptImageGenerator
      setPromptsToApply(prompts);
      toast.success(`✅ ${prompts.length} prompts copiados para Geração Múltipla!`, {
        description: 'Os prompts foram aplicados automaticamente nos slots de geração múltipla'
      });
    }
  };

  const toggleTool = (tool: string) => {
    setExpandedTool(expandedTool === tool ? null : tool);
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <>
    <Card className="glass-effect border-2 border-indigo-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-lg">IA Avançada - Runware & Gemini</CardTitle>
            <Badge variant="outline" className="text-indigo-600 border-indigo-300 bg-indigo-50 text-xs">
              Premium
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => toggleTool('runware')}
            className="text-indigo-600 border-indigo-300 hover:bg-indigo-50"
          >
            {expandedTool === 'runware' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        
        {/* Seleção de IA */}
        <div className="mt-4 space-y-2">
          <Label htmlFor="ai-selector" className="text-sm font-medium">Selecione a IA</Label>
          <Select value={selectedAI} onValueChange={(value: 'runware' | 'gemini') => setSelectedAI(value)}>
            <SelectTrigger id="ai-selector" className="w-full">
              <SelectValue placeholder="Escolha a IA" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="runware">🚀 Runware API</SelectItem>
              <SelectItem value="gemini">✨ Gemini Background Generator</SelectItem>
            </SelectContent>
          </Select>
          {selectedAI === 'gemini' && (
            <p className="text-xs text-indigo-600 bg-indigo-50 p-2 rounded">
              ✨ Usando Gemini AI para geração de backgrounds profissionais
            </p>
          )}
        </div>
      </CardHeader>
      
      {expandedTool === 'runware' && (
        <CardContent className="pt-0">
          <Tabs defaultValue="image-to-image" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="image-to-image">Image to Image</TabsTrigger>
              <TabsTrigger value="image-processing">Processamento</TabsTrigger>
            </TabsList>
            
            <TabsContent value="image-to-image" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="w-5 h-5" />
                    Image to Image
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Mensagem Explicativa */}
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700 leading-relaxed">
                      {enhancedImages.length === 0 
                        ? "⚠️ Nenhuma imagem melhorada encontrada. Primeiro faça o enhancement das imagens na seção 'DeepAI Enhancement' antes de usar esta ferramenta."
                        : `✅ ${enhancedImages.length} imagens melhoradas disponíveis. Selecione as imagens base abaixo para transformação com IA avançada.`
                      }
                    </p>
                  </div>

                  {/* Seletor de Imagens Melhoradas DeepAI */}
                   <DeepAIImageSelector
                     productId={productId}
                     onImageSelected={setSelectedBaseImages}
                     selectedImageUrls={selectedBaseImages}
                   />

                    {/* URLs das Imagens Base Selecionadas */}
                    {selectedBaseImages.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-green-700">
                          ✅ Imagens Base Selecionadas Automaticamente ({selectedBaseImages.length})
                        </Label>
                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border-2 border-green-200 rounded-lg bg-green-50/50">
                          {selectedBaseImages.map((imageUrl, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border-2 border-green-300 text-xs shadow-sm">
                              <img 
                                src={imageUrl} 
                                alt={`Base ${index + 1}`} 
                                className="w-8 h-8 object-cover rounded border"
                                onError={(e) => {
                                  e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text y="50%" x="50%" text-anchor="middle" dy=".3em">❌</text></svg>';
                                }}
                              />
                              <span className="flex-1 truncate text-green-800 font-medium">
                                🎯 Imagem {index + 1} (Auto)
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="text-xs text-green-600 bg-green-50 p-2 rounded border border-green-200">
                          🤖 <strong>Automação Ativa:</strong> Imagens selecionadas automaticamente pela IA Avançada
                        </div>
                      </div>
                    )}

                  {/* Parâmetros Básicos Configurados */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Strength (Preservação)</Label>
                      <Input
                        type="number"
                        value={strength}
                        onChange={(e) => setStrength(Number(e.target.value))}
                        min={0.1}
                        max={1.0}
                        step={0.1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CFG Scale</Label>
                      <Input
                        type="number"
                        value={cfgScale}
                        onChange={(e) => setCfgScale(Number(e.target.value))}
                        min={1}
                        max={20}
                        step={0.1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Steps</Label>
                      <Input
                        type="number"
                        value={steps}
                        onChange={(e) => setSteps(Number(e.target.value))}
                        min={1}
                        max={50}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Guidance End Step %</Label>
                      <Input
                        type="number"
                        value={guidanceEndStepPercentage}
                        onChange={(e) => setGuidanceEndStepPercentage(Number(e.target.value))}
                        min={1}
                        max={100}
                      />
                    </div>
                  </div>

                  {/* Dimensões */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Largura</Label>
                      <Input
                        type="number"
                        value={width}
                        onChange={(e) => setWidth(Number(e.target.value))}
                        min={512}
                        max={2048}
                        step={64}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Altura</Label>
                      <Input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(Number(e.target.value))}
                        min={512}
                        max={2048}
                        step={64}
                      />
                    </div>
                  </div>

                   {/* Gerador de Prompts por Imagem Individual */}
                   {selectedBaseImages.length > 0 && (
                     <div className="space-y-4">
                       <Card className="border-orange-200 bg-gradient-to-br from-orange-50/50 to-amber-50/50">
                         <CardHeader className="pb-3">
                           <CardTitle className="flex items-center gap-2 text-orange-700">
                             <Sparkles className="h-5 w-5" />
                             Gerador de Prompts IA - Por Imagem
                             <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-100 text-xs">
                               3 Variações cada
                             </Badge>
                           </CardTitle>
                           <p className="text-sm text-orange-600">
                             Gera 3 variações de prompts ultra-realistas para cada imagem selecionada (Realista, Minimalista, Impacto Estratégico)
                           </p>
                         </CardHeader>
                         
                         <CardContent className="space-y-4">
                           {/* Botões de Geração por API */}
                           <div className="grid grid-cols-2 gap-3">
                             <Button
                               onClick={() => handleGeneratePromptsForAllImages('gemini')}
                               disabled={isGeneratingPrompts || selectedBaseImages.length === 0}
                               className="bg-orange-600 hover:bg-orange-700 text-white"
                             >
                               {isGeneratingPrompts ? (
                                 <>
                                   <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                   Gemini...
                                 </>
                               ) : (
                                 <>
                                   <Sparkles className="w-4 h-4 mr-2" />
                                   🤖 Gemini
                                 </>
                               )}
                             </Button>
                             
                             <Button
                               onClick={() => handleGeneratePromptsForAllImages('openai')}
                               disabled={isGeneratingPrompts || selectedBaseImages.length === 0}
                               className="bg-orange-600 hover:bg-orange-700 text-white"
                             >
                               {isGeneratingPrompts ? (
                                 <>
                                   <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                   OpenAI...
                                 </>
                               ) : (
                                 <>
                                   <Sparkles className="w-4 h-4 mr-2" />
                                   🧠 OpenAI
                                 </>
                               )}
                             </Button>
                           </div>

                           {/* Status de processamento por imagem */}
                           {isGeneratingPrompts && currentProcessingImage && (
                             <div className="text-sm text-orange-600 bg-orange-50/50 p-3 rounded border border-orange-200">
                               <p className="font-medium">🔄 Processando: Imagem {selectedBaseImages.indexOf(currentProcessingImage) + 1} de {selectedBaseImages.length}</p>
                               <p className="text-xs">Gerando 3 variações (Realista • Minimalista • Impacto Estratégico)</p>
                             </div>
                           )}

                           {/* Prompts gerados por imagem */}
                           {Object.keys(generatedPromptsPerImage).length > 0 && (
                             <div className="space-y-4">
                               <Label className="text-sm font-medium text-orange-700">Prompts Gerados por Imagem</Label>
                               <div className="max-h-80 overflow-y-auto space-y-3">
                                 {selectedBaseImages.map((imageUrl, imageIndex) => {
                                   const prompts = generatedPromptsPerImage[imageUrl];
                                   if (!prompts) return null;
                                   
                                   return (
                                     <div key={imageUrl} className="border border-orange-200 rounded-lg p-3 bg-orange-50/30">
                                       <div className="flex items-center gap-2 mb-3">
                                         <img 
                                           src={imageUrl} 
                                           alt={`Imagem ${imageIndex + 1}`}
                                           className="w-12 h-12 object-cover rounded"
                                         />
                                         <div>
                                           <p className="font-medium text-orange-800">Imagem {imageIndex + 1}</p>
                                           <p className="text-xs text-orange-600">{prompts.length} variações geradas</p>
                                         </div>
                                       </div>
                                       
                                       <div className="space-y-2">
                                         {prompts.map((promptText, promptIndex) => (
                                           <div key={promptIndex} className="p-2 bg-white rounded border border-orange-200">
                                             <div className="flex items-center justify-between mb-1">
                                               <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-100 text-xs">
                                                 {promptIndex === 0 ? 'Realista' : promptIndex === 1 ? 'Minimalista' : 'Impacto Estratégico'}
                                               </Badge>
                                               <Button
                                                 size="sm"
                                                 variant="outline"
                                                 onClick={() => {
                                                   setPrompt(promptText);
                                                   toast.success(`Prompt ${promptIndex === 0 ? 'Realista' : promptIndex === 1 ? 'Minimalista' : 'Impacto Estratégico'} aplicado!`);
                                                 }}
                                                 className="h-6 text-xs text-orange-600 border-orange-300 hover:bg-orange-50"
                                               >
                                                 Usar
                                               </Button>
                                             </div>
                                             <p className="text-xs text-orange-800 line-clamp-2">{promptText}</p>
                                           </div>
                                         ))}
                                        </div>
                                      </div>
                                    );
                                 })}
                               </div>
                             </div>
                           )}
                         </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* NOVO: Gerador de Prompts com 6 Estruturas Específicas */}
                    {selectedBaseImages.length > 0 && (
                      <div className="space-y-4">
                        <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-indigo-50/50">
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-purple-700">
                              <Sparkles className="h-5 w-5" />
                              Gerador IA Avançada - Runware
                              <Badge variant="outline" className="text-purple-600 border-purple-300 bg-purple-100 text-xs">
                                6 Estruturas
                              </Badge>
                            </CardTitle>
                            <p className="text-sm text-purple-600">
                              Gera 6 prompts baseados nos 5 Modelos Runware específicos + 1 combinado usando Gemini 2.5 Flash e copia automaticamente para "Geração Múltipla"
                            </p>
                          </CardHeader>
                          
                          <CardContent className="space-y-4">
                            {/* Descrição das 6 estruturas */}
                            <div className="bg-purple-50/50 border border-purple-200 rounded-lg p-4">
                              <h4 className="font-medium text-purple-800 mb-2">📋 6 Estruturas de Prompt:</h4>
                              <div className="grid grid-cols-2 gap-2 text-xs text-purple-700">
                                <div>1. Análise Completa (12 pontos)</div>
                                <div>2. Local + Ação + Cenário</div>
                                <div>3. Ultra-realista Profissional</div>
                                <div>4. Criatividade + Vendas</div>
                                <div>5. Problema → Solução</div>
                                <div>6. Cenário Desejado Detalhado</div>
                              </div>
                            </div>

                            {/* Botão para gerar prompts */}
                            <Button
                              onClick={generateGeminiPrompts}
                              disabled={isGeneratingGeminiPrompts}
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                              size="lg"
                            >
                              {isGeneratingGeminiPrompts ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Gerando com Gemini 2.5 Flash...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4 mr-2" />
                                  🤖 Gerar 6 Prompts com Gemini
                                </>
                              )}
                            </Button>

                            {/* Prompts gerados */}
                            {generatedGeminiPrompts.length > 0 && (
                              <div className="space-y-3">
                                <Label className="text-sm font-medium text-purple-700">
                                  ✅ Prompts Gerados ({generatedGeminiPrompts.length}/6)
                                </Label>
                                <div className="max-h-60 overflow-y-auto space-y-2">
                                  {generatedGeminiPrompts.map((prompt, index) => (
                                    <div key={index} className="border border-purple-200 rounded-lg p-3 bg-purple-50/30">
                                      <div className="flex items-center justify-between mb-2">
                                         <Badge variant="outline" className="text-purple-600 border-purple-300 bg-purple-100 text-xs">
                                           {runwareModelNames[index] || `Modelo ${index + 1}`}
                                         </Badge>
                                         <Button
                                           size="sm"
                                           variant="outline"
                                           onClick={() => {
                                             setPrompt(prompt);
                                             toast.success(`Prompt do modelo "${runwareModelNames[index]}" aplicado!`);
                                           }}
                                          className="h-6 text-xs text-purple-600 border-purple-300 hover:bg-purple-50"
                                        >
                                          Usar
                                        </Button>
                                      </div>
                                      <p className="text-xs text-purple-800 line-clamp-3">{prompt}</p>
                                    </div>
                                  ))}
                                </div>
                                
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <p className="text-sm text-green-700">
                                    ✅ <strong>Prompts copiados automaticamente!</strong> Os 6 prompts foram aplicados na seção "Geração Múltipla com Prompts Diferentes" e estão prontos para gerar imagens.
                                  </p>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    )}

                  {/* Prompt */}
                  <div className="space-y-2">
                    <Label htmlFor="prompt">Prompt para Background</Label>
                    <Textarea
                      id="prompt"
                      placeholder="Descreva o cenário/fundo que você quer para o produto ou use o gerador automático acima..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  <Button 
                    onClick={handleImageToImage} 
                    disabled={isProcessing || !prompt.trim() || selectedBaseImages.length === 0}
                    className={`w-full ${
                      (!prompt.trim() || selectedBaseImages.length === 0) 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Image className="w-4 h-4 mr-2" />
                        Transformar Imagem
                      </>
                    )}
                  </Button>

                  {/* Status Debug */}
                  {(!prompt.trim() || selectedBaseImages.length === 0) && (
                    <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                      <p className="font-medium mb-1">🔒 Botão bloqueado - Requisitos:</p>
                      <div className="space-y-1">
                        <p className={prompt.trim() ? "text-green-600" : "text-red-600"}>
                          {prompt.trim() ? "✅" : "❌"} Prompt preenchido {!prompt.trim() && "(digite ou gere um prompt)"}
                        </p>
                        <p className={selectedBaseImages.length > 0 ? "text-green-600" : "text-red-600"}>
                          {selectedBaseImages.length > 0 ? "✅" : "❌"} Imagens selecionadas ({selectedBaseImages.length}) {selectedBaseImages.length === 0 && "(selecione imagens melhoradas acima)"}
                        </p>
                      </div>
                    </div>
                  )}

                    {/* Geração Múltipla com Prompts Diferentes */}
                    {selectedBaseImages.length > 0 && (
                      <MultiPromptImageGenerator
                        baseImageUrls={selectedBaseImages}
                        onImagesGenerated={setGeneratedImages}
                        isDisabled={isProcessing}
                        externalPrompts={promptsToApply}
                        selectedAI={selectedAI}
                      />
                    )}

                   {/* Resultados em Galeria */}
                   {(() => {
                     console.log(`🖼️ [DEBUG RENDER] generatedImages.length: ${generatedImages.length}`);
                     console.log(`🖼️ [DEBUG RENDER] generatedImages:`, generatedImages);
                     return generatedImages.length > 0;
                   })() && (
                     <div className="space-y-4">
                       <Label className="text-lg font-semibold">Imagens Geradas ({generatedImages.length})</Label>
                       <div className="bg-white border border-green-200 rounded-lg p-4 shadow-sm">
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                             {generatedImages.map((imageUrl, index) => {
                               console.log(`🖼️ [DEBUG] Renderizando imagem ${index + 1}: ${imageUrl}`);
                               const isSelectedForWhiteBg = selectedImagesForWhiteBg.includes(imageUrl);
                               return (
                                 <div 
                                   key={index}
                                   className={`relative bg-gradient-to-br from-amber-100 to-orange-100 border-2 ${
                                     isSelectedForWhiteBg 
                                       ? 'border-blue-500 ring-2 ring-blue-300' 
                                       : 'border-amber-200'
                                   } rounded-xl overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02]`}
                                 >
                                   {/* Número da imagem */}
                                   <div className="absolute top-3 right-3 z-10">
                                     <div className="text-xs font-bold bg-amber-600 text-white px-2 py-1 rounded-full shadow-lg">
                                       {index + 1}
                                     </div>
                                   </div>
                                   
                                   {/* Checkbox de seleção para fundo branco */}
                                   <div className="absolute top-3 left-3 z-10">
                                     <div 
                                       className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${
                                         isSelectedForWhiteBg 
                                           ? 'bg-blue-500 border-blue-500' 
                                           : 'bg-white border-gray-300 hover:border-blue-400'
                                       }`}
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         toggleImageSelection(imageUrl);
                                       }}
                                     >
                                       {isSelectedForWhiteBg && (
                                         <CheckCircle className="w-4 h-4 text-white" />
                                       )}
                                     </div>
                                   </div>
                               
                               {/* Botão de visualizar */}
                               <div className="absolute bottom-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Button
                                   size="sm"
                                   className="h-8 w-8 p-0 bg-amber-600 hover:bg-amber-700 text-white shadow-lg"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     window.open(imageUrl, '_blank');
                                   }}
                                 >
                                   <Image className="h-3 w-3" />
                                 </Button>
                               </div>
                               
                               {/* Container da imagem com proporção natural */}
                               <div 
                                 className="w-full min-h-[200px] max-h-[400px] flex items-center justify-center p-3"
                                 onClick={(e) => {
                                   if (e.ctrlKey || e.metaKey) {
                                     e.preventDefault();
                                     toggleImageSelection(imageUrl);
                                   } else {
                                     window.open(imageUrl, '_blank');
                                   }
                                 }}
                               >
                                 <img 
                                   src={imageUrl} 
                                   alt={`Imagem gerada ${index + 1}`}
                                   className="max-w-full max-h-full object-contain rounded-lg shadow-md transition-all duration-300 group-hover:scale-105"
                                   draggable={false}
                                 />
                               </div>
                               
                               {/* Label da imagem */}
                               <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                                 <span className="text-white text-sm font-medium">
                                   Imagem {index + 1} {isSelectedForWhiteBg && '✓'}
                                 </span>
                               </div>
                              </div>
                            );
                            })}
                         </div>
                        
                         <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200 mt-4">
                           💡 <strong>Dica:</strong> Clique nas imagens para abrir em nova aba, use Ctrl+click para seleção múltipla para fundo branco. As imagens mantêm suas proporções originais para melhor visualização.
                         </div>
                       </div>
                     </div>
                   )}
                   
                   {/* Botão para Gerar Fundo Branco - Seleção Manual */}
                   {generatedImages.length >= 2 && (
                     <div className="space-y-4">
                       <Button
                         onClick={handleGenerateWhiteBgImages}
                         disabled={selectedImagesForWhiteBg.length !== 2 || isGeneratingWhiteBg}
                         className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                       >
                         {isGeneratingWhiteBg ? (
                           <>
                             <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                             Gerando Fundo Branco...
                           </>
                         ) : (
                           <>
                             🎨 Gerar Fundo Branco nas 2 Imagens Selecionadas 
                             <Badge variant="secondary" className="ml-2">
                               {selectedImagesForWhiteBg.length}/2
                             </Badge>
                           </>
                         )}
                       </Button>
                       
                       {selectedImagesForWhiteBg.length !== 2 && (
                         <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md border border-blue-200">
                           ℹ️ <strong>Como usar:</strong> Clique nos checkboxes das imagens ou use Ctrl+click para selecionar exatamente 2 imagens, depois clique no botão acima.
                         </div>
                       )}
                     </div>
                   )}
                   
                   {/* Resultados: Imagens com Fundo Branco */}
                   {whiteBgImages.length > 0 && (
                     <div className="space-y-4 mt-8">
                       <Label className="text-lg font-semibold text-blue-600">
                         Imagens com Fundo Branco (100%): {whiteBgImages.length}/2
                       </Label>
                       <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {whiteBgImages.map((imageUrl, index) => (
                             <div 
                               key={index}
                               className="relative bg-white border-2 border-blue-300 rounded-xl overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                               onClick={() => window.open(imageUrl, '_blank')}
                             >
                               {/* Número da imagem melhorada */}
                               <div className="absolute top-3 right-3 z-10">
                                 <div className="text-xs font-bold bg-blue-600 text-white px-2 py-1 rounded-full shadow-lg">
                                   {index + 1}ª
                                 </div>
                               </div>
                               
                               {/* Botão de visualizar */}
                               <div className="absolute bottom-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Button
                                   size="sm"
                                   className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     window.open(imageUrl, '_blank');
                                   }}
                                 >
                                   <Image className="h-3 w-3" />
                                 </Button>
                               </div>
                               
                               {/* Container da imagem */}
                               <div className="w-full min-h-[200px] max-h-[400px] flex items-center justify-center p-3">
                                 <img 
                                   src={imageUrl} 
                                   alt={`${index + 1}ª Imagem Selecionada - Fundo Branco`}
                                   className="max-w-full max-h-full object-contain rounded-lg shadow-md transition-all duration-300 group-hover:scale-105"
                                   draggable={false}
                                 />
                               </div>
                               
                               {/* Label da imagem melhorada */}
                               <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600/80 to-transparent p-3">
                                 <span className="text-white text-sm font-medium">
                                   {index + 1}ª Imagem Selecionada - Fundo Branco
                                 </span>
                               </div>
                             </div>
                           ))}
                         </div>
                         
                         <div className="text-sm text-blue-600 bg-white p-3 rounded-md border border-blue-300 mt-4">
                           ✨ <strong>Concluído:</strong> Suas imagens agora possuem fundo 100% branco com máximo brilho e destaque no produto. Clique para visualizar em tamanho completo.
                         </div>
                       </div>
                     </div>
                   )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="image-processing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowUp className="w-5 h-5" />
                    Processamento de Imagem
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Upload de Imagem */}
                  <div className="space-y-2">
                    <Label>Upload da Imagem</Label>
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                        isDragActive 
                          ? 'border-primary bg-primary/5' 
                          : 'border-muted-foreground/25 hover:border-primary/50'
                      }`}
                    >
                      <input {...getInputProps()} />
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      {isDragActive ? (
                        <p className="text-sm text-primary">Solte a imagem aqui...</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Arraste uma imagem aqui ou clique para selecionar
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Imagem Carregada */}
                  {uploadedImage && (
                    <div className="space-y-2">
                      <Label>Imagem Carregada</Label>
                      <img
                        src={`data:image/jpeg;base64,${uploadedImage}`}
                        alt="Imagem carregada"
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                    </div>
                  )}

                  {/* Fator de Upscale */}
                  <div className="space-y-2">
                    <Label>Fator de Upscale</Label>
                    <Select value={upscaleFactor.toString()} onValueChange={(value) => setUpscaleFactor(Number(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2x</SelectItem>
                        <SelectItem value="4">4x</SelectItem>
                        <SelectItem value="8">8x</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Botões de Processamento */}
                  <div className="grid grid-cols-1 gap-2">
                    <Button 
                      onClick={handleUpscaleImage} 
                      disabled={isProcessing || !uploadedImage}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <ArrowUp className="w-4 h-4 mr-2" />
                          Fazer Upscale
                        </>
                      )}
                    </Button>

                    <Button 
                      onClick={handleRemoveBackground} 
                      disabled={isProcessing || !uploadedImage}
                      variant="outline"
                      className="w-full"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Eraser className="w-4 h-4 mr-2" />
                          Remover Fundo
                        </>
                      )}
                    </Button>

                    <Button 
                      onClick={handleEnhanceImage} 
                      disabled={isProcessing || !uploadedImage}
                      variant="outline"
                      className="w-full"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Melhorar Imagem
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Seção de Resultado - Imagem Processada */}
                  <div className="mt-4 p-4 border-2 border-dashed border-primary/20 rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5">
                    <h3 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Resultado do Processamento
                    </h3>
                    
                    {processedImage && processedImage.startsWith('http') ? (
                      <div className="space-y-3">
                        <div className="text-center">
                          <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Processamento Concluído
                          </Badge>
                        </div>
                        
                        <div className="border-2 border-green-300 rounded-xl overflow-hidden bg-white shadow-lg">
                          <div className="relative group">
                            <img
                              src={processedImage}
                              alt="Imagem processada"
                              className="w-full max-w-md mx-auto h-auto cursor-pointer hover:opacity-90 transition-all duration-300"
                              onClick={() => setShowImageModal(true)}
                              onLoad={() => {
                                console.log('✅ [IMAGE DISPLAY] Imagem processada carregada com sucesso!', processedImage);
                                toast.success('✅ Imagem processada carregada!');
                              }}
                              onError={(e) => {
                                console.error('❌ [IMAGE DISPLAY] Erro ao carregar imagem processada:', {
                                  error: e,
                                  imageUrl: processedImage,
                                  event: e.currentTarget
                                });
                                toast.error('❌ Erro ao carregar imagem processada');
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="bg-white/95 text-black hover:bg-white shadow-lg"
                                onClick={() => setShowImageModal(true)}
                              >
                                <ZoomIn className="w-4 h-4 mr-2" />
                                Ampliar
                              </Button>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-200">
                            <div className="flex flex-col gap-3">
                               <div>
                                 <p className="text-sm font-medium text-green-700 mb-1">URL da Imagem Processada:</p>
                                 <div className="bg-white/80 p-2 rounded-lg border border-green-200">
                                   <p className="text-xs text-green-800 break-all font-mono">
                                     {processedImage}
                                   </p>
                                 </div>
                               </div>
                               
                               {apiCost && (
                                 <div>
                                   <p className="text-sm font-medium text-green-700 mb-1">Custo da Operação:</p>
                                   <div className="bg-amber-50/80 p-2 rounded-lg border border-amber-200">
                                     <p className="text-sm text-amber-800 font-semibold">
                                       ${apiCost.toFixed(4)} USD
                                     </p>
                                   </div>
                                 </div>
                               )}
                              
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowImageModal(true)}
                                  className="flex-1 text-green-700 border-green-300 hover:bg-green-100"
                                >
                                  <ZoomIn className="w-4 h-4 mr-2" />
                                  Visualizar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(processedImage, '_blank')}
                                  className="flex-1 text-green-700 border-green-300 hover:bg-green-100"
                                >
                                  Abrir em Nova Aba
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                          <Image className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h4 className="text-base font-medium text-muted-foreground mb-2">
                          Aguardando Processamento
                        </h4>
                        <p className="text-sm text-muted-foreground/80">
                          Faça upload de uma imagem e use uma das ferramentas de processamento acima.<br />
                          O resultado aparecerá aqui após o processamento.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
    
    {/* Modal de Visualização da Imagem Processada */}
    {processedImage && (
      <ZoomableImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        imageUrl={processedImage}
        alt="Imagem Processada"
      />
    )}
    </>
  );
};
