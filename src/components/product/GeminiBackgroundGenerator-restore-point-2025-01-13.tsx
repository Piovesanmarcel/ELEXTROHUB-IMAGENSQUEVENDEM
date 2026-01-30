// ============= PONTO DE RESTAURAÇÃO - 13/01/2025 =============
// Este é um backup do componente GeminiBackgroundGenerator.tsx
// Para restaurar: renomeie este arquivo para GeminiBackgroundGenerator.tsx
// Data: 2025-01-13
// Backup criado antes da implementação de upscale 2x automático
// ================================================================

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Wand2, Brain, User, Camera, Palette, Sparkles, Image } from 'lucide-react';
import { useGeminiBackgroundGenerator } from '@/hooks/useGeminiBackgroundGenerator';
import { useAIImagesCache } from '@/hooks/useAIImagesCache';
import { useSafeDownload } from '@/hooks/useSafeDownload';
import { useImageResizer } from '@/hooks/useImageResizer';
import { AIGeneratedImagesGrid } from './AIGeneratedImagesGrid';
import { toast } from 'sonner';
import { EnhancedImage } from '@/hooks/enhancement/types';
import { useImageEnhancementPersistence } from '@/hooks/enhancement/useImageEnhancementPersistence';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { useHostedImages } from '@/hooks/useHostedImages';
import { useUnifiedCommandsData } from '@/hooks/useUnifiedCommandsData';
import { generatePromptVariations } from '@/utils/promptVariationGenerator';
import { distributeVariations } from '@/utils/promptDistributor';
import { showCopywritingToastOnce } from '@/utils/toastControl';

interface GeminiBackgroundGeneratorProps {
  images: string[];
  productName: string;
  productId: string;
}

type ImageType = 'white_bg' | 'ambient_1' | 'ambient_2' | 'ambient_3' | 'ambient_4' | 'ambient_5' | 'ambient_6' | 'ambient_7' | 'person_using' | 'kit_1' | 'kit_2' | 'kit_3' | 'kit_4' | 'kit_5';

const promptTemplates = {
  ambient_1: `Gere um prompt para criação de um anúncio visual do produto da imagem, seguindo esta estrutura detalhada:

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

  ambient_2: `Gere um prompt para criação de um anúncio visual do produto da imagem, seguindo esta estrutura do prompt + imagem, e o prompt deve incluir.

Pense no [Cenário Desejado]:
Local: [Descreva o local onde o produto estará.]
Ação Principal: [Descreva o que as pessoas estão fazendo com o produto ou o que o produto está transmitindo.]
Nova Posição do Produto: [Descreva como o produto deve estar organizado ou exposto no local.]
Ambiente/Atmosfera: [Descreva a iluminação, cores, objetos ao redor e o clima geral do cenário.]
Dicas Importantes para Você:
Seja Específico: Quanto mais detalhes você der em cada item da estrutura (Local, Ação, Posição, Ambiente), melhores serão os prompts gerados.
Pense no Público-Alvo: Quem você quer atingir com a imagem? Isso ajuda a definir o cenário e a ação.
Pense no Benefício: Que benefício o produto traz? (diversão, aprendizado, criatividade, união familiar). Isso ajuda a descrever a "Ação Principal".
manter todas as características do produto original

CRÍTICO - REGRAS OBRIGATÓRIAS DE IMAGEM:
- NUNCA inclua textos, palavras, letras, números ou caracteres na imagem
- NUNCA adicione legendas, títulos, CTAs, botões ou elementos textuais
- NUNCA coloque texto explicativo, descrições escritas ou call-to-action
- MANTER MODELO VISUAL ATUAL: comunicar problema/solução APENAS através do cenário visual
- A imagem deve ser 100% visual sem nenhum elemento textual ou gráfico sobreposto
- Foque EXCLUSIVAMENTE no produto e ambiente para transmitir a mensagem

IMPORTANTE: Gere APENAS imagens visuais puras. Qualquer texto na imagem está PROIBIDO.`,

  ambient_3: `Gere um prompt para criação de um anúncio visual do produto da imagem, preenchendo a estrutura abaixo:

Cenário Desejado (Local): descreva onde o produto estará (casa, escola, estúdio, etc.).

Ação Principal: descreva o que as pessoas estão fazendo com o produto ou o que ele transmite (ex.: criatividade, diversão, aprendizado, união familiar).

Nova Posição do Produto: detalhe como o produto deve estar organizado, exposto ou interagindo com o cenário.

Ambiente/Atmosfera: defina iluminação, cores, estilo, objetos complementares e o clima geral da cena.

Público-Alvo: quem deve se conectar com essa imagem (pais, crianças, famílias, educadores).

Benefício do Produto: destaque o valor emocional (diversão, criatividade, aprendizado, vínculo).

IMPORTANTE: NÃO inclua texto, legendas, CTA (call-to-action), botões ou elementos gráficos na imagem. Foque apenas no produto e cenário visual.`,

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

IMPORTANTE: NÃO inclua texto, legendas, CTA (call-to-action), botões ou elementos gráficos na imagem. Foque apenas no produto e cenário visual.`
};

const imagePrompts = {
  white_bg: 'Gerar foto ultra realista do produto com fundo 100% branco puro. IMPORTANTE: O produto deve estar PERFEITAMENTE CENTRALIZADO na imagem, ocupando aproximadamente 70-80% do espaço total do quadro para criar destaque máximo. Garantir que o produto preencha bem o frame sem ficar pequeno ou perdido no fundo branco. Manter todas as características originais do produto com qualidade fotográfica profissional.',
  kit_1: 'Com base na imagem gerada de fundo 100% branco, crie uma imagem com duas quantidades do produto, organize as imagens do produto na imagem para destacar o produto',
  kit_2: 'Com base na imagem gerada de fundo 100% branco, crie uma imagem com quatro quantidades do produto, organize as imagens do produto na imagem para destacar o produto',
  kit_3: 'Com base na imagem gerada de fundo 100% branco, crie uma imagem com seis quantidades do produto, organize as imagens do produto na imagem para destacar o produto',
  kit_4: 'Com base na imagem gerada de fundo 100% branco, crie uma imagem com oito quantidades do produto, organize as imagens do produto na imagem para destacar o produto',
  kit_5: 'Com base na imagem gerada de fundo 100% branco, crie uma imagem com dez quantidades do produto, organize as imagens do produto na imagem para destacar o produto'
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
  kit_5: 'Kit - 10 Produtos'
};

// Ordem fixa para mapeamento de automação (0..7)
const ambientTypeOrder: Record<ImageType, number> = {
  white_bg: 0, // não usado no mapeamento de 8 passos
  ambient_1: 0, // Introdução Captadora
  ambient_2: 1, // Dor x Solução
  ambient_3: 2, // Benefícios
  ambient_4: 3, // Gatilho de Escassez e Urgência
  ambient_5: 4, // Chamada para Ação Forte
  ambient_6: 5, // FAQ Resumidas
  ambient_7: 6, // Tópicos de Conversão
  person_using: 7, // Características
  kit_1: 0, // não usado
  kit_2: 0, // não usado
  kit_3: 0, // não usado
  kit_4: 0, // não usado
  kit_5: 0  // não usado
};

export const GeminiBackgroundGenerator = ({ 
  images, 
  productName, 
  productId
}: GeminiBackgroundGeneratorProps) => {
  console.log('🔧 [DEBUG RENDER] GeminiBackgroundGenerator renderizado!');
  console.log('🔧 [DEBUG RENDER] ProductId:', productId);
  console.log('🔧 [DEBUG RENDER] Images:', images.length);
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedImageIndexes, setSelectedImageIndexes] = useState<number[]>([0, 1]); // Automaticamente duas imagens
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

  // Estados para imagens melhoradas com DeepAI
  const [enhancedImages, setEnhancedImages] = useState<EnhancedImage[]>([]);
  const [isLoadingEnhanced, setIsLoadingEnhanced] = useState(true);
  const { loadEnhancedImages } = useImageEnhancementPersistence();
  
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

  // Load enhanced images from DeepAI and auto-select if available + Load unified data
  useEffect(() => {
    const loadImages = async () => {
      if (!productId) {
        setIsLoadingEnhanced(false);
        return;
      }

      try {
        console.log('🔍 Carregando imagens melhoradas do DeepAI para productId:', productId);
        const enhanced = await loadEnhancedImages(productId);
        
        // 🎯 Carregar dados unificados do copywriting
        console.log('🔍 [GEMINI] Buscando dados unificados do copywriting...');
        const unified = await getUnifiedDataForProduct(productId);
        
        if (unified && unified.idealEnvironments.length > 0) {
          setUnifiedData(unified);
          console.log('🎯 [GEMINI] Dados unificados carregados!', {
            idealEnvironments: unified.idealEnvironments.length,
            idealFor: unified.idealFor.length,
            mainKeywords: unified.mainKeywords.length
          });
          
          // Usar controle de toast para exibir apenas uma vez por sessão
          showCopywritingToastOnce(productId, {
            env: unified.idealEnvironments.length,
            scenarios: unified.idealFor.length,
            keywords: unified.mainKeywords.length
          });
        } else {
          console.log('⚠️ [GEMINI] Nenhum dado unificado encontrado');
        }
        
        console.log('📸 Imagens melhoradas carregadas:', {
          count: enhanced.length,
          images: enhanced.map(img => ({ id: img.id, enhanced: img.enhanced }))
        });
        
        setEnhancedImages(enhanced);
        
        // Auto-select first image when enhanced images are loaded
        if (enhanced.length > 0 && selectedImageIndex !== 0) {
          setSelectedImageIndex(0);
          console.log('✅ Auto-selecionada primeira imagem melhorada DeepAI para Gemini');
        }
      } catch (error) {
        console.error('❌ Erro ao carregar imagens melhoradas:', error);
      } finally {
        setIsLoadingEnhanced(false);
      }
    };

    loadImages();
  }, [productId]);

  // Determinar qual conjunto de imagens usar (OBRIGATÓRIO: Apenas imagens melhoradas do DeepAI)
  const getActiveImages = () => {
    // Durante o carregamento, retornar array vazio mas manter estabilidade
    if (isLoadingEnhanced) {
      console.log('⏳ [ACTIVE IMAGES] Carregando imagens melhoradas...');
      return [];
    }

    // OBRIGATÓRIO: Sempre usar imagens melhoradas quando disponíveis, NUNCA as originais
    if (enhancedImages.length > 0) {
      const result = enhancedImages.map(img => img.enhanced);
      
      console.log('🖼️ [ACTIVE IMAGES] Usando imagens MELHORADAS do DeepAI (OBRIGATÓRIO):', {
        enhancedCount: enhancedImages.length,
        activeCount: result.length,
        activeImages: result.map((url, index) => `${index + 1}: ${url?.substring(0, 50)}...`)
      });
      
      return result;
    }
    
    // Sem imagens melhoradas disponíveis - aguardar processamento
    console.log('❌ [ACTIVE IMAGES] Nenhuma imagem melhorada disponível - Aguardando DeepAI');
    return [];
  };
  
  const activeImages = getActiveImages();

  const { generateBackground, isProcessing, progress } = useGeminiBackgroundGenerator();
  const { downloadFile } = useSafeDownload();
  
  // Hook para salvar imagens hospedadas com tags padronizadas  
  const { saveHostedImage } = useHostedImages();
  
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

  // Função para gerar prompt usando Gemini 2.5 Flash Image Preview com retry
  const generatePromptWithAI = async (
    imageType: ImageType, 
    imageIndex: number, 
    customTemplate?: string, 
    maxRetries = 3
  ): Promise<string | null> => {
    console.log(`🎯 [PROMPT AI] Iniciando geração de prompt para imageIndex: ${imageIndex}, imageType: ${imageType}`);
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

    // Função auxiliar com retry
    const attemptPromptGeneration = async (attempt: number): Promise<string | null> => {
      try {
        console.log(`🧠 [PROMPT AI] Tentativa ${attempt}/${maxRetries} - Gerando prompt com Gemini 2.5 Flash para Imagem ${imageIndex + 1} - ${imageLabels[imageType]}`);
        console.log(`🧠 [PROMPT AI] URL da imagem:`, imageUrl?.substring(0, 100) + '...');
        
        // Validar URL da imagem antes de enviar
        if (!imageUrl || typeof imageUrl !== 'string') {
          throw new Error(`URL da imagem inválida: ${imageUrl}`);
        }

        console.log(`🧠 [PROMPT AI] Enviando para Gemini (tentativa ${attempt})...`);
        // Enforce strict, structured output
        const strictTemplate = `${template}

REGRAS DE SAÍDA (OBRIGATÓRIO):
- Responda APENAS com as seções indicadas no template, na MESMA ordem, usando exatamente os mesmos títulos e dois-pontos.
- Substitua os textos entre colchetes por conteúdo objetivo e REMOVA os colchetes.
- Não inclua introdução, comentários, markdown, bullets ou texto extra antes/depois.
- Use 1 a 2 frases por seção, diretas e claras.
- Idioma: Português (Brasil).

🚫 REGRA CRÍTICA ANTI-TEXTO (OBRIGATÓRIO INCLUIR NO PROMPT GERADO):
O prompt gerado DEVE conter explicitamente a seguinte instrução ao final:
"CRÍTICO: A imagem NÃO DEVE conter NENHUM texto, palavra, letra, número, CTA, legenda, título, botão ou elemento textual. A comunicação deve ser 100% VISUAL através do cenário, produto e ambiente. Imagens com qualquer texto serão rejeitadas."

Esta regra anti-texto DEVE aparecer literalmente no prompt final que você vai gerar.`;

        const { data, error } = await supabase.functions.invoke('gemini-background-generator', {
          body: {
            action: 'generate_prompt',
            imageData: imageUrl,
            prompt: strictTemplate
          }
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

  const handleGenerateImage = async (imageType: ImageType, imageIndex: number = selectedImageIndex): Promise<boolean> => {
    // Para ambientes com IA, gerar prompt primeiro
    const needsAIPrompt = ['ambient_1', 'ambient_2', 'ambient_3', 'ambient_4', 'ambient_5', 'ambient_6', 'ambient_7', 'person_using'].includes(imageType);
    
    let promptToUse: string;
    const promptKey = `img${imageIndex + 1}_${imageType}`;
    
    if (needsAIPrompt) {
      // Primeiro gerar o prompt, depois a imagem
      let aiPrompt = generatedPrompts[promptKey];
      
      if (!aiPrompt) {
        // Se não há prompt gerado, gerar agora
        aiPrompt = await generatePromptWithAI(imageType, imageIndex);
        if (!aiPrompt) {
          return false; // Falha na geração do prompt
        }
      }
      promptToUse = aiPrompt;
    } else {
      // Usar prompt fixo para fundo branco e kits
      promptToUse = imagePrompts[imageType] || 'Prompt não encontrado';
    }

    if (!activeImages[imageIndex]) {
      // CRÍTICO: Verificar se está tentando usar imagens originais em vez das melhoradas
      if (enhancedImages.length === 0) {
        toast.error(`❌ Nenhuma imagem melhorada do DeepAI disponível. Execute o DeepAI primeiro.`);
        return false;
      }
      toast.error(`Imagem ${imageIndex + 1} não encontrada nas imagens melhoradas`);
      return false;
    }

    const imageUrl = activeImages[imageIndex];
    const generatingKey = `img${imageIndex + 1}_${imageType}`;
    setCurrentGenerating(generatingKey);

    console.log(`🚀 Gerando imagem tipo: ${imageType} para Imagem ${imageIndex + 1} com prompt:`, needsAIPrompt ? 'gerado pela IA' : 'fixo');

    try {
      const result = await generateBackground(imageUrl, promptToUse);
      
      console.log('📥 Resultado do Gemini:', {
        success: result.success,
        hasGeneratedImage: !!result.generatedImage,
        hasAnalysis: !!result.analysis,
        error: result.error
      });
      
      if (result.success && result.generatedImage) {
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
          
          await saveHostedImage({
            url: result.generatedImage, // URL ORIGINAL do Gemini
            filename: fileName,
            original_filename: `gemini-${imageType}-generated-${Date.now()}.jpg`,
            r2_path: '', // Vazio = não hospedado ainda
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
          
          console.log('✅ [GEMINI] Imagem salva na tabela hosted_images (aguardando hospedagem)');
          toast.success('Imagem gerada e salva com sucesso!');
        } catch (saveError) {
          console.error('❌ [GEMINI] Erro ao salvar imagem na tabela hosted_images:', saveError);
        }
        
        setGeneratedImages(prev => ({
          ...prev,
          [generatingKey]: result.generatedImage
        }));
        setAnalysisResult(null);
        toast.success(`${imageLabels[imageType]} gerado para Imagem ${imageIndex + 1}!`);
        
        // 🔄 Converter Base64 → Blob URL ANTES de enviar para galeria
        console.log('🔄 [GEMINI] Convertendo imagem para Blob...');
        const resizedBlobUrl = await resizeImageTo1000x1000(result.generatedImage);
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
        return true;
      } else if (result.analysis) {
        setAnalysisResult(result.analysis);
        toast.info('Análise realizada pelo Gemini');
        return false;
      } else {
        console.error('❌ Falha na geração:', result);
        toast.error(result.error || 'Erro ao gerar background');
        return false;
      }
    } catch (error) {
      console.error('💥 Erro inesperado na geração de fundo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro inesperado: ${errorMessage}`);
      return false;
    } finally {
      setCurrentGenerating(null);
    }
  };

  // 🚀 AUTOMAÇÃO: Listener global para automação do Gemini Background Generator (sempre ativo, independente de estar expandido)
  useEffect(() => {
    console.log('🔧 [DEBUG GEMINI] useEffect do listener sendo executado');
    console.log('🔧 [DEBUG GEMINI] ProductId atual:', productId);
    console.log('🔧 [DEBUG GEMINI] ActiveImages length:', activeImages.length);
    
    const handleGeminiAutomation = async (event: CustomEvent) => {
      console.log('🧠 [AUTOMAÇÃO GEMINI] ===============================================');
      console.log('🧠 [AUTOMAÇÃO GEMINI] EVENTO RECEBIDO! Evento de automação detectado:', event.detail);
      console.log('🧠 [AUTOMAÇÃO GEMINI] ProductId recebido:', event.detail?.productId);
      console.log('🧠 [AUTOMAÇÃO GEMINI] Source:', event.detail?.source);
      console.log('🧠 [AUTOMAÇÃO GEMINI] Timestamp:', event.detail?.timestamp);
      console.log('🧠 [AUTOMAÇÃO GEMINI] activeImages disponíveis:', activeImages.length);
      console.log('🧠 [AUTOMAÇÃO GEMINI] ===============================================');
      
      try {
        setIsAutomationRunning(true);
        toast.info('🧠 Iniciando geração automática Gemini Background (1 imagem × 8 ambientes = 8 imagens)...', { duration: 8000 });
        
        // Verificar quantas imagens temos disponíveis
        const availableImagesCount = activeImages.length;
        console.log(`📊 [AUTOMAÇÃO GEMINI] Imagens disponíveis: ${availableImagesCount}`);
        
        if (availableImagesCount === 0) {
          toast.error('Nenhuma imagem disponível para automação');
          return;
        }
        
        // ✅ CORREÇÃO CRÍTICA: Processar APENAS 1 imagem (8 ambientes) = 8 imagens total FIXO
        const imagesToProcess = [0]; // ✅ SEMPRE apenas índice 0 (primeira imagem)
        
        console.log(`🔒 [AUTOMAÇÃO GEMINI CORRIGIDA] LIMITE RIGOROSO: Processando APENAS imagem índice 0 com 8 ambientes = 8 imagens total`);
        
        // ✅ CORREÇÃO: 8 ambientes únicos para 1 imagem fixa
        const allAmbientTypes: ImageType[] = [
          'ambient_1', 'ambient_2', 'ambient_3', 'ambient_4', 
          'ambient_5', 'ambient_6', 'ambient_7', 'person_using'
        ];
        
        console.log('✅ [AUTOMAÇÃO GEMINI CORRIGIDA] 8 ambientes para 1 imagem fixa = 8 imagens total GARANTIDO');
        console.log('✅ [AUTOMAÇÃO GEMINI CORRIGIDA] Ambientes que serão gerados:', allAmbientTypes.map(t => imageLabels[t]));
        
        let successCount = 0;
        const totalSteps = 8; // ✅ SEMPRE 8, nunca mais
        
        setAutomationProgress({ current: 0, total: totalSteps, step: 'Iniciando...' });

        // ✅ PROCESSAR APENAS A PRIMEIRA IMAGEM (índice 0) com todos os 8 ambientes
        const imageIndex = 0; // ✅ SEMPRE usar a primeira imagem
        
        console.log(`🖼️ [AUTOMAÇÃO GEMINI CORRIGIDA] Processando APENAS Imagem 1 (índice 0) com todos os 8 ambientes`);
        toast.info(`🖼️ Processando Imagem 1 com 8 ambientes (total: 8 imagens)...`, { duration: 5000 });

        // ✅ Gerar TODOS os 8 ambientes para esta imagem ÚNICA
        for (let typeIndex = 0; typeIndex < allAmbientTypes.length; typeIndex++) {
          const imageType = allAmbientTypes[typeIndex];
          const currentStep = typeIndex + 1; // ✅ De 1 a 8
          
          console.log(`🔄 [AUTOMAÇÃO GEMINI CORRIGIDA] Gerando ${currentStep}/${totalSteps}: ${imageLabels[imageType]}`);
          
          setAutomationProgress({
            current: currentStep,
            total: totalSteps,
            step: `${imageLabels[imageType]}`
          });
          
          toast.info(`🧠 Gerando ${currentStep}/${totalSteps}: ${imageLabels[imageType]}...`, { duration: 5000 });
          
          try {
            const success = await handleGenerateImage(imageType, imageIndex);
            
            if (!success) {
              // Se a geração falhou, parar o processo de automação
              toast.error(`❌ Falha na geração automática de ${imageLabels[imageType]}. Automação interrompida.`);
              console.error(`❌ Automação parada na etapa ${currentStep}/${totalSteps} devido à falha na geração`);
              return; // Sai da automação
            }
            
            successCount++;
            
            // Pausa entre as gerações
            if (currentStep < totalSteps) {
              await new Promise(resolve => setTimeout(resolve, 3000));
            }

          } catch (error) {
            console.error(`❌ [AUTOMAÇÃO GEMINI CORRIGIDA] Erro na geração de ${imageLabels[imageType]}:`, error);
            toast.error(`❌ Erro ao gerar ${imageLabels[imageType]}. Automação interrompida.`);
            return; // Sai da automação
          }
        }

        console.log(`✅ [AUTOMAÇÃO GEMINI CORRIGIDA] Total final: ${successCount} de 8 imagens geradas`);
        toast.success(`🎉 Automação Gemini concluída! ${successCount} de 8 imagens geradas com sucesso!`);
        
        // 🚀 NOVA ORDEM: Após completar o Gemini, aguardar 5s e acionar o BFL.ai
        console.log('🚀 [AUTOMAÇÃO REMOVIDA] Gemini finalizado, mas automação de Runware foi desabilitada');
        toast.info('🤖 Gemini concluído!', { duration: 3000 });
        
      } catch (error) {
        console.error('❌ [AUTOMAÇÃO GEMINI] Erro na automação:', error);
        toast.error('Erro na automação do Gemini Background');
      } finally {
        setIsAutomationRunning(false);
        setAutomationProgress({ current: 0, total: 0, step: '' });
      }
    };

    console.log('🔧 [AUTOMAÇÃO REMOVIDA] Listener de automação interno do Gemini foi desabilitado');
    // window.addEventListener('triggerGeminiBackgroundAutomationInternal', handleGeminiAutomation as EventListener);
    
    return () => {
      console.log('🔧 [AUTOMAÇÃO REMOVIDA] Cleanup de listener de automação removido');
      // window.removeEventListener('triggerGeminiBackgroundAutomationInternal', handleGeminiAutomation as EventListener);
    };
  }, [handleGenerateImage, productId, productName, selectedImageIndexes, activeImages]);

  const handleGenerateAllImages = async () => {
    if (activeImages.length === 0) {
      toast.error('⚠️ Nenhuma imagem melhorada DeepAI disponível! Execute "Melhoria com DeepAI" primeiro para desbloquear este gerador.');
      return;
    }
    
    if (!activeImages[selectedImageIndex]) {
      toast.error('⚠️ Selecione uma imagem melhorada DeepAI primeiro!');
      return;
    }

    const imageTypes: ImageType[] = [
      'ambient_1', 'ambient_2', 'ambient_3', 'ambient_4', 'ambient_5', 'ambient_6', 'ambient_7',
      'person_using'
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
        totalImages: 8,
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
      
      // Enriquecer cada template com dados da variação
      imageTypes.forEach((imageType, index) => {
        if (promptTemplates[imageType]) {
          const variation = distributed[index] || distributed[0];
          
          enrichedTemplates[imageType] = `${promptTemplates[imageType]}

🎯 CONTEXTO ESPECÍFICO DO COPYWRITING PROFISSIONAL:
Ambiente Ideal: ${variation.context}
Ideal Para: ${unifiedData.idealFor[index % unifiedData.idealFor.length] || 'uso profissional'}
Keywords SEO: ${unifiedData.mainKeywords.slice(0, 3).join(', ')}
Público-Alvo: ${unifiedData.targetAudience}

IMPORTANTE: Integre estes elementos do copywriting ao prompt de forma natural e profissional para criar uma imagem contextualizada e específica.`;
        }
      });
      
      toast.info('✅ Templates enriquecidos com copywriting profissional!', { duration: 3000 });
    }
    
    console.log('🚀 [GERAÇÃO COMPLETA] Iniciando geração de todas as 8 imagens...');
    console.log('🚀 [GERAÇÃO COMPLETA] Imagem selecionada:', selectedImageIndex + 1);
    toast.info('🎯 Gerando 8 imagens com contextos variados...', { duration: 6000 });

    let successCount = 0;
    let failedImages: string[] = [];
    let processedPrompts = 0;
    let processedImages = 0;

    for (let i = 0; i < imageTypes.length; i++) {
      const imageType = imageTypes[i];
      
      console.log(`🔄 [GERAÇÃO COMPLETA] Processando ${i + 1}/8: ${imageLabels[imageType]}`);
      toast.info(`🔄 Gerando ${i + 1}/8: ${imageLabels[imageType]}...`, { duration: 3000 });
      
      try {
        // 🔧 NOVA LÓGICA: Primeiro gerar prompt, depois imagem
        const needsAIPrompt = ['ambient_1', 'ambient_2', 'ambient_3', 'ambient_4', 'ambient_5', 'ambient_6', 'ambient_7', 'person_using'].includes(imageType);
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
      toast.success(`🎉 Processo concluído! Todas as 8 imagens foram geradas com sucesso!`, { duration: 8000 });
    } else if (successCount > 0) {
      toast.success(`🎯 Processo parcial: ${successCount} de 8 imagens geradas!`, { duration: 6000 });
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
        
        const result = await generateBackground(imageData, whitePrompt);
        
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
        setWhiteBgImages(prev => [...prev, ...newWhiteBgImages]);
        
        // Disparar evento para a galeria de IA
        window.dispatchEvent(new CustomEvent('imageGenerated', {
          detail: {
            source: 'gemini-white-background',
            images: newWhiteBgImages,
            productId: productId,
            timestamp: Date.now()
          }
        }));
        
        toast.success(`✅ ${newWhiteBgImages.length} imagem(ns) com fundo branco gerada(s)!`);
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
  const hasActiveImages = !isLoadingEnhanced && activeImages && activeImages.length > 0;
  const showRequirementMessage = !isLoadingEnhanced && (!activeImages || activeImages.length === 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Gerador de Background - Gemini AI + IA Prompts
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6 min-h-[600px]">
        {/* Loading State */}
        {isLoadingEnhanced && (
          <div className="flex items-center justify-center p-8 min-h-[200px]">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">Carregando imagens melhoradas...</p>
            </div>
          </div>
        )}

        {/* Requirement Message - SEMPRE VISÍVEL quando necessário */}
        {showRequirementMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 min-h-[160px]">
            <h3 className="font-medium text-red-800 mb-2 flex items-center gap-2">
              <Badge variant="outline" className="text-red-600 border-red-300 bg-red-100">
                DeepAI obrigatório
              </Badge>
              ⚠️ Imagens melhoradas DeepAI obrigatórias
            </h3>
            <p className="text-sm text-red-700 mb-3">
              Este gerador requer imagens melhoradas do DeepAI. Imagens originais não são aceitas para garantir máxima qualidade.
            </p>
            <div className="flex flex-col gap-2">
              <p className="text-xs text-red-600">
                • Execute "Melhoria com DeepAI" primeiro
              </p>
              <p className="text-xs text-red-600">
                • Aguarde o processamento das imagens
              </p>
              <p className="text-xs text-red-600">
                • Retorne aqui para gerar backgrounds incríveis
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
            <Label className="text-xs font-medium text-blue-700">🚀 Automação - Uma Imagem Selecionada</Label>
            <p className="text-sm text-blue-800 font-medium">
              {hasActiveImages && enhancedImages.length > 0 ? (
                `✅ Melhoradas DeepAI: Imagem ${selectedImageIndexes[0] + 1}`
              ) : hasActiveImages ? (
                `📷 Galeria Original: Imagem ${selectedImageIndexes[0] + 1}`
              ) : (
                '⏳ Aguardando imagens melhoradas...'
              )}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              🤖 Geração automática: 8 ambientes para 1 imagem (total: 8 imagens finais)
            </p>
            {hasActiveImages && enhancedImages.length > 0 && (
              <p className="text-xs text-blue-600 mt-1">
                Usando imagens melhoradas do DeepAI (maior qualidade)
              </p>
            )}
          </div>

          {/* Seleção Manual de Imagem (para uso individual) */}
          <div className="space-y-2">
            <Label>Selecionar Imagem para Geração Individual</Label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {hasActiveImages ? activeImages.map((image, index) => (
                <div
                  key={index}
                  className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                    selectedImageIndexes.includes(index) 
                      ? 'border-green-500 ring-2 ring-green-500/20' 
                      : selectedImageIndex === index
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img
                    src={image}
                    alt={`${productName} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {selectedImageIndexes.includes(index) && (
                    <div className="absolute top-1 left-1">
                      <div className="bg-green-500 text-white rounded-full px-2 py-1 text-xs font-bold">
                        AUTO
                      </div>
                    </div>
                  )}
                  {selectedImageIndex === index && !selectedImageIndexes.includes(index) && (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                      <div className="bg-primary text-primary-foreground rounded-full p-1">
                        ✓
                      </div>
                    </div>
                  )}
                </div>
              )) : (
                // Skeleton placeholders quando não há imagens
                [...Array(5)].map((_, index) => (
                  <div key={index} className="aspect-square rounded-lg bg-gray-200 animate-pulse"></div>
                ))
              )}
            </div>
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
                Processando 1 imagem × 8 ambientes = 8 imagens total
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

          {/* Botão de Geração Unificado */}
          <div className="space-y-3">
            <Button
              onClick={handleGenerateAllImages}
              disabled={!hasActiveImages || isProcessing || isGeneratingPrompt || isAutomationRunning || !activeImages[selectedImageIndex]}
              className="w-full"
              size="lg"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              {isProcessing || isGeneratingPrompt || isAutomationRunning ? 'Processando...' : 'Gerar Todas as 8 Imagens - Imagem Selecionada (IA Completa)'}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              ✨ Gera 7 ambientes avançados + pessoa usando (8 imagens total)
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