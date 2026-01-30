import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, ChevronDown, ChevronUp, Image, Loader2, CheckCircle, FileText, Copy, Eye, EyeOff, Sparkles, Database, Trash2, Images, Key, Upload, Plus } from "lucide-react";
import { DeepAIImageSelector } from "./DeepAIImageSelector";
import { CopywritingPersistence } from "./copywriting/CopywritingPersistence";
import { CopywritingFormatter } from "./copywriting/CopywritingFormatter";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { validateImageUrl } from "@/utils/imageUrlValidator";
import { useEnhancedImagesCache } from "@/hooks/useEnhancedImagesCache";
import { useGeminiApiKeys } from "@/hooks/useGeminiApiKeys";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useDropzone } from "react-dropzone";

// Componente otimizado para seleção de imagem
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
          ? 'border-emerald-500 shadow-lg'
          : 'border-gray-200 hover:border-emerald-300'
      }`}
      onClick={onSelect}
    >
      {isLoading && (
        <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      )}
      
      {hasError && (
        <div className="w-full h-24 bg-gray-100 flex flex-col items-center justify-center text-gray-400">
          <Image className="h-5 w-5 mb-1" />
          <span className="text-xs">Erro</span>
        </div>
      )}
      
      <img
        src={imageUrl}
        alt={`${productName} ${index + 1}`}
        className={`w-full h-24 object-cover transition-opacity ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        loading="lazy"
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          console.error('❌ [COPYWRITING] Falha ao carregar imagem:', imageUrl);
          setIsLoading(false);
          setHasError(true);
        }}
        style={{ display: hasError ? 'none' : 'block' }}
      />
      
      {isSelected && (
        <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle className="h-6 w-6 text-emerald-600 bg-white rounded-full" />
        </div>
      )}
    </div>
  );
};

interface CopywritingGeneratorProps {
  productId: string;
  productName: string;
  productSku: string;
  images: string[];
  shortDescription?: string;
  autoGenerate?: boolean;
  onComplete?: (content: string) => void;
  simplifiedView?: boolean;
}

export const CopywritingGenerator = ({ 
  productId, 
  productName, 
  productSku, 
  images,
  shortDescription = '',
  autoGenerate = false,
  onComplete,
  simplifiedView = false
}: CopywritingGeneratorProps) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [generatedCopywriting, setGeneratedCopywriting] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(true);
  const [hasPersistedCopywriting, setHasPersistedCopywriting] = useState(false);
  
  // Estado para imagens da galeria de IA
  const [aiGalleryImages, setAiGalleryImages] = useState<string[]>([]);

  // ✅ Puxar imagens melhoradas do DeepAI direto do produto (independente de validação)
  const { enhancedImages: deepAIEnhancedImages } = useEnhancedImagesCache(productId);

  // 🔑 Hook para gerenciar múltiplas API keys do Gemini
  const { 
    apiKeys, 
    selectedKeyId, 
    setSelectedKeyId, 
    getAvailableKeys 
  } = useGeminiApiKeys();

  // Estado para imagens validadas (evita mostrar URLs quebradas)
  const [validatedAvailableImages, setValidatedAvailableImages] = useState<string[]>([]);
  const [isValidatingImages, setIsValidatingImages] = useState(false);
  const [validatedOriginalCount, setValidatedOriginalCount] = useState(0);
  const [validatedGalleryCount, setValidatedGalleryCount] = useState(0);
  // Estado para imagens uploadadas pelo usuário
  const [userUploadedImages, setUserUploadedImages] = useState<string[]>([]);

  useEffect(() => {
    const handleImageGenerated = (event: CustomEvent) => {
      console.log('🎨 CopywritingGenerator - Nova imagem da galeria IA:', event.detail);
      if (event.detail?.images && Array.isArray(event.detail.images)) {
        setAiGalleryImages(prev => {
          const newImages = event.detail.images.filter((img: string) => !prev.includes(img));
          return [...prev, ...newImages];
        });
      } else if (event.detail?.url) {
        setAiGalleryImages(prev => 
          prev.includes(event.detail.url) ? prev : [...prev, event.detail.url]
        );
      }
    };

    const handleDeepAIImages = (event: CustomEvent) => {
      console.log('🎨 CopywritingGenerator - Imagens DeepAI:', event.detail);
      if (event.detail?.images && Array.isArray(event.detail.images)) {
        setAiGalleryImages(prev => {
          const newImages = event.detail.images.filter((img: string) => !prev.includes(img));
          return [...prev, ...newImages];
        });
      }
    };

    const handleGeminiImages = (event: CustomEvent) => {
      console.log('🎨 CopywritingGenerator - Imagens Gemini:', event.detail);
      if (event.detail?.images && Array.isArray(event.detail.images)) {
        setAiGalleryImages(prev => {
          const newImages = event.detail.images.filter((img: string) => !prev.includes(img));
          return [...prev, ...newImages];
        });
      }
    };

    // Listener para imagens uploadadas na galeria do produto
    const handleProductImagesUploaded = (event: CustomEvent) => {
      console.log('📤 CopywritingGenerator - Imagens uploadadas:', event.detail);
      if (event.detail?.images && Array.isArray(event.detail.images)) {
        setUserUploadedImages(event.detail.images);
      }
    };

    // Adicionar listeners para todos os eventos da galeria IA
    window.addEventListener('imageGenerated', handleImageGenerated as EventListener);
    window.addEventListener('deepaiImagesToKit', handleDeepAIImages as EventListener);
    window.addEventListener('geminiWhiteBackgroundToKit', handleGeminiImages as EventListener);
    window.addEventListener('productImagesUploaded', handleProductImagesUploaded as EventListener);

    return () => {
      window.removeEventListener('imageGenerated', handleImageGenerated as EventListener);
      window.removeEventListener('deepaiImagesToKit', handleDeepAIImages as EventListener);
      window.removeEventListener('geminiWhiteBackgroundToKit', handleGeminiImages as EventListener);
      window.removeEventListener('productImagesUploaded', handleProductImagesUploaded as EventListener);
    };
  }, []);

  // Validar e combinar imagens disponíveis (incluindo uploads do usuário)
  useEffect(() => {
    const validateAndSetImages = async () => {
      setIsValidatingImages(true);
      
      try {
        // Combinar imagens originais + DeepAI (do produto) + galeria IA + uploads do usuário
        const deepAIUrls = (deepAIEnhancedImages || []).map((img) => img.enhanced).filter(Boolean);
        const allImages = [...images, ...deepAIUrls, ...aiGalleryImages, ...userUploadedImages].filter(Boolean);
        
        const validImages: string[] = [];
        let origCount = 0;
        let galCount = 0;
        
        for (const url of allImages) {
          const isDeepAIUrl = url.includes('api.deepai.org') || url.includes('deepai.org');
          const isBase64 = url.startsWith('data:image/');

          // ✅ DeepAI, R2, e base64 são sempre válidas
          if (isDeepAIUrl || url.includes('.r2.dev') || isBase64) {
            validImages.push(url);
            if (images.includes(url)) origCount++;
            else galCount++;
            continue;
          }

          // Para outras URLs (ImgBB, etc), validar
          const isValid = await validateImageUrl(url);
          if (isValid) {
            validImages.push(url);
            if (images.includes(url)) origCount++;
            else galCount++;
          } else {
            console.warn('⚠️ [COPYWRITING] Imagem inválida filtrada:', url);
          }
        }
        
        setValidatedAvailableImages(validImages);
        setValidatedOriginalCount(origCount);
        setValidatedGalleryCount(galCount);
        
        console.log(`✅ [COPYWRITING] ${validImages.length} imagens validadas (${origCount} originais + ${galCount} galeria/uploads)`);
      } catch (error) {
        console.error('❌ [COPYWRITING] Erro na validação de imagens:', error);
        // Fallback: usar todas as imagens sem validação
        setValidatedAvailableImages([...images, ...aiGalleryImages, ...userUploadedImages].filter(Boolean));
      } finally {
        setIsValidatingImages(false);
      }
    };
    
    validateAndSetImages();
  }, [images, aiGalleryImages, deepAIEnhancedImages, userUploadedImages]);

  // Auto-selecionar primeira imagem quando houver imagens disponíveis e nenhuma selecionada
  useEffect(() => {
    if (!selectedImage && validatedAvailableImages.length > 0 && !isValidatingImages) {
      const firstImage = validatedAvailableImages[0];
      console.log('🎯 [COPYWRITING] Auto-selecionando primeira imagem da galeria:', firstImage.substring(0, 50) + '...');
      setSelectedImage(firstImage);
      // Toast removido - não exibir mensagem ao atualizar página
    }
  }, [validatedAvailableImages, selectedImage, isValidatingImages]);

  // 🚀 AUTOMAÇÃO: Auto-gerar copywriting quando autoGenerate=true
  const automationTriggeredRef = React.useRef(false);
  // ✅ NOVO: Flag para indicar que o backend já completou copywriting
  const [automationCopywritingDone, setAutomationCopywritingDone] = React.useState(false);
  const retryCountRef = React.useRef(0);
  const MAX_RETRIES = 5;
  
  // ✅ Listener para evento de copywriting completado pelo backend
  useEffect(() => {
    const handleAutomationCopywritingDone = (event: CustomEvent) => {
      console.log('✅ [COPYWRITING] Marcado como completo pela automação do backend', event.detail);
      setAutomationCopywritingDone(true);
      automationTriggeredRef.current = true; // Prevenir re-trigger
      retryCountRef.current = MAX_RETRIES; // Parar retries
    };
    
    window.addEventListener('automationCopywritingCompleted', handleAutomationCopywritingDone as EventListener);
    return () => {
      window.removeEventListener('automationCopywritingCompleted', handleAutomationCopywritingDone as EventListener);
    };
  }, []);
  
  useEffect(() => {
    const handleAutomationTrigger = async () => {
      console.log('🤖 [COPYWRITING AUTOMAÇÃO] Recebido evento automationTriggerCopywriting');
      
      // ✅ GUARDS ROBUSTOS: Verificar todas as condições de parada
      if (automationTriggeredRef.current) {
        console.log('⏭️ [COPYWRITING AUTOMAÇÃO] automationTriggeredRef = true, ignorando');
        return;
      }
      
      if (automationCopywritingDone) {
        console.log('⏭️ [COPYWRITING AUTOMAÇÃO] Já completo pela automação do backend');
        return;
      }
      
      if (hasPersistedCopywriting && generatedCopywriting) {
        console.log('⏭️ [COPYWRITING AUTOMAÇÃO] Já possui copywriting persistida');
        return;
      }
      
      if (isGenerating) {
        console.log('⏭️ [COPYWRITING AUTOMAÇÃO] Já gerando, ignorando');
        return;
      }
      
      // Aguardar imagens serem validadas
      if (isValidatingImages || validatedAvailableImages.length === 0) {
        // ✅ Verificar limite de retries antes de re-disparar
        if (retryCountRef.current >= MAX_RETRIES) {
          console.warn('⚠️ [COPYWRITING AUTOMAÇÃO] Máximo de retries atingido, parando');
          return;
        }
        
        retryCountRef.current += 1;
        console.log(`⏳ [COPYWRITING AUTOMAÇÃO] Aguardando imagens... (retry ${retryCountRef.current}/${MAX_RETRIES})`);
        
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('automationTriggerCopywriting'));
        }, 1000);
        return;
      }
      
      // Selecionar primeira imagem se não houver seleção
      let imageToUse = selectedImage;
      if (!imageToUse && validatedAvailableImages.length > 0) {
        imageToUse = validatedAvailableImages[0];
        setSelectedImage(imageToUse);
      }
      
      if (!imageToUse) {
        console.error('❌ [COPYWRITING AUTOMAÇÃO] Nenhuma imagem disponível');
        return;
      }
      
      automationTriggeredRef.current = true;
      console.log('🚀 [COPYWRITING AUTOMAÇÃO] Iniciando geração automática...');
      
      // Aguardar um pouco para garantir que selectedImage foi atualizado
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Chamar a função de geração
      await generateCopywritingAuto(imageToUse);
    };

    window.addEventListener('automationTriggerCopywriting', handleAutomationTrigger);
    return () => {
      window.removeEventListener('automationTriggerCopywriting', handleAutomationTrigger);
    };
  }, [isGenerating, isValidatingImages, validatedAvailableImages, selectedImage, automationCopywritingDone, hasPersistedCopywriting, generatedCopywriting]);

  // Função de geração automática (separada para automação)
  const generateCopywritingAuto = async (imageToUse: string) => {
    if (!imageToUse) return;
    
    setIsGenerating(true);
    
    try {
      console.log('🔍 [COPYWRITING AUTO] Processando imagem...');
      const imageInput = await convertUrlToBase64(imageToUse);
      
      const copywritingPrompt = `${productName ? `PRODUTO ESPECÍFICO: ${productName}\n\n` : ''}### Estrutura de Copywriting Completa e Profissional para Produtos

**⚠️ REGRA OBRIGATÓRIA: VOCÊ DEVE GERAR **TODOS** OS 10 TÓPICOS ABAIXO. NÃO É OPCIONAL.**
**⚠️ NÃO PARE EM 7 TÓPICOS. CONTINUE ATÉ O TÓPICO 10.**
**⚠️ SE VOCÊ PARAR ANTES DO TÓPICO 10, A RESPOSTA SERÁ CONSIDERADA INCOMPLETA.**

**Instruções:**

1. **Análise da Imagem e Produto:**
   - **Descrição Visual:** Analise a imagem fornecida, identificando características visuais como design, cores, funcionalidades aparentes.
   - **Detalhes do Produto:** Identifique o nome do produto (ou crie um nome comercial sugestivo), suas principais funções, benefícios e qualquer informação relevante sobre seu uso.

PRODUTO: ${productName}
DESCRIÇÃO: ${shortDescription}

2. **Estrutura da Copywriting (MANTENHA EXATAMENTE ESTA NUMERAÇÃO E TÍTULOS):**

**⚠️ ATENÇÃO: OS 10 TÓPICOS ABAIXO SÃO TODOS OBRIGATÓRIOS. GERE TODOS SEM EXCEÇÃO:**

#### 1. Título Atraente e Impactante:
   - Crie um título que capture a atenção imediatamente, destacando o principal benefício ou característica única do produto.

#### 2. Introdução Captadora de Atenção:
   - Escreva uma introdução curta e envolvente que desperte o interesse do leitor, fazendo uma ligação emocional com o problema que o produto resolve.

#### 3. Destaque das Principais Características:
   - Liste as principais características técnicas do produto de forma clara e concisa.
   - Foque nos aspectos físicos, técnicos e funcionais do produto.
   - **IMPORTANTE:** Use o formato: **Nome da Característica:** Descrição da característica.

#### 4. Dor x Solução para Conversão:
   - Identifique as principais DORES e PROBLEMAS que o produto resolve.
   - Apresente de forma clara como o produto é a SOLUÇÃO perfeita para essas dores.
   - Use linguagem persuasiva focada na transformação que o cliente terá.
   - **IMPORTANTE:** Use o formato: **PROBLEMA:** Dor específica do cliente **SOLUÇÃO:** Como o produto resolve.

#### 5. Principais Benefícios para o Cliente:
   - Liste os principais benefícios que o produto oferece ao cliente.
   - Explique como cada benefício resolve problemas específicos ou melhora a vida do usuário.
   - **IMPORTANTE:** Use o formato: **Nome do Benefício:** Descrição do benefício.

#### 6. Gatilho de Escassez e Urgência:
   - Crie um senso de urgência, mencionando ofertas limitadas, estoque restrito ou benefícios temporários.

#### 7. Chamada para Ação Forte:
   - Finalize com uma chamada para ação clara e persuasiva, incentivando o leitor a tomar uma decisão de compra imediata.

#### 8. Perguntas Frequentes (FAQ) Resumidas:
   - Forneça respostas rápidas para possíveis dúvidas dos clientes, mantendo a informação clara e objetiva.
   - **IMPORTANTE:** Use o formato: **P:** Pergunta **R:** Resposta

#### 9. Ambientes Ideais que se Encaixa para o Produto:
   - Liste os ambientes específicos onde o produto é ideal: Cozinha, Banheiro, Sala de Estar, Escritório, Lavanderia, Varanda, Quarto, Garagem, Jardim, Comercial (loja, escritório, clínica), Outros

#### 10. Títulos de Cauda Longa para Anúncios (Long Tail SEO):
   - Gere EXATAMENTE 30 títulos otimizados para SEO de cauda longa
   - Cada título deve ter NO MÁXIMO 200 caracteres
   - Baseie os títulos em:
     * Características principais do produto
     * Palavras-chave identificadas anteriormente (tópicos 2 e 3)
     * Termos de busca relacionados (como usuários pesquisariam no Google)
     * Variações semânticas e sinônimos
     * Benefícios específicos (problema + solução)
   - **FORMATO OBRIGATÓRIO:** Liste um título por linha, numerados de 1 a 30
   - **NÃO use emojis** nos títulos
   - **Foque em conversão:** Cada título deve ser atraente e clicável

**CRÍTICO E OBRIGATÓRIO:**
1. Mantenha EXATAMENTE esta numeração (1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
2. **TODOS OS 10 TÓPICOS SÃO OBRIGATÓRIOS** - não omita nenhum
3. Se você parar no tópico 7, a resposta será considerada INCOMPLETA
4. Não altere a estrutura numérica nem os nomes das seções principais
5. **Continue escrevendo até completar o tópico 10**

${productName ? `\n\nIMPORTANTE: A copywriting deve ser específica para "${productName}" e refletir suas características reais.` : ''}

**LEMBRE-SE: GERE **TODOS** OS 10 TÓPICOS. NÃO PARE EM 7!**`;

      const { data, error } = await supabase.functions.invoke('ai-chat-proxy', {
        body: {
          action: 'generate_prompt',
          imageData: imageInput,
          prompt: copywritingPrompt,
          apiKeyId: selectedKeyId,
          targetFunction: 'gemini-background-generator'
        }
      });
      
      const result = error ? { success: false, error: error.message } : data;
      
      if (result.success && (result.data?.response || result.generated_image_text || result.generatedPrompt)) {
        const newCopywriting = result.data?.response || result.generated_image_text || result.generatedPrompt;
        updateCopywriting(newCopywriting);
        
        console.log('✅ [COPYWRITING AUTO] Geração concluída!');
        
        // Emitir evento de conclusão para automação
        window.dispatchEvent(new CustomEvent('copywritingComplete', {
          detail: { content: newCopywriting }
        }));
        
        if (onComplete) {
          onComplete(newCopywriting);
        }
      } else {
        console.error('❌ [COPYWRITING AUTO] Falha:', result.error);
      }
    } catch (error) {
      console.error('❌ [COPYWRITING AUTO] Erro:', error);
    } finally {
      setIsGenerating(false);
      automationTriggeredRef.current = false;
    }
  };

  // Handler para quando a copywriting for carregada do banco
  const handleCopywritingLoaded = useCallback((loadedCopywriting: string) => {
    console.log('🔄 COPYWRITING - Carregando copywriting persistida, expandindo automaticamente');
    setGeneratedCopywriting(loadedCopywriting);
    setHasPersistedCopywriting(true);
    // Auto-expandir e mostrar resultado quando carregar da persistência
    setShowResult(true);
    setExpanded(true);
  }, []);

  // Função para extrair títulos do tópico 10
  const extractLongTailTitles = useCallback((copywriting: string): string[] => {
    console.log('🔍 [EXTRACT-TITLES] Extraindo títulos de cauda longa do tópico 10...');
    
    // Regex para encontrar o tópico 10
    const topic10Regex = /####\s*10\.\s*Títulos de Cauda Longa[^#]*?((?:\d+\.\s*.+\n?)+)/i;
    const match = copywriting.match(topic10Regex);
    
    if (!match || !match[1]) {
      console.warn('⚠️ [EXTRACT-TITLES] Tópico 10 não encontrado ou vazio');
      return [];
    }
    
    // Extrair títulos numerados (formato: "1. Título aqui")
    const titlesSection = match[1];
    const titleRegex = /^\d+\.\s*(.+)$/gm;
    const titles: string[] = [];
    
    let titleMatch;
    while ((titleMatch = titleRegex.exec(titlesSection)) !== null) {
      const title = titleMatch[1].trim();
      // Validar que não tem mais de 200 caracteres
      if (title && title.length <= 200) {
        titles.push(title);
      } else if (title && title.length > 200) {
        // Se exceder, truncar para 200 chars
        console.warn(`⚠️ [EXTRACT-TITLES] Título truncado: ${title.substring(0, 50)}...`);
        titles.push(title.substring(0, 200));
      }
    }
    
    console.log(`✅ [EXTRACT-TITLES] ${titles.length} títulos extraídos`);
    return titles;
  }, []);

  // Atualizar estado de persistência quando copywriting for gerada
  const updateCopywriting = useCallback((copywriting: string) => {
    setGeneratedCopywriting(copywriting);
    if (copywriting && copywriting.trim()) {
      setHasPersistedCopywriting(true);
      
      // NOVO: Extrair e emitir títulos de cauda longa
      const longTailTitles = extractLongTailTitles(copywriting);
      if (longTailTitles.length > 0) {
        console.log(`📤 [COPYWRITING] Emitindo ${longTailTitles.length} títulos de cauda longa`);
        window.dispatchEvent(new CustomEvent('copywritingLongTailTitles', {
          detail: {
            productId,
            titles: longTailTitles,
            timestamp: Date.now()
          }
        }));
      }
    }
  }, [productId, extractLongTailTitles]);

  // Função melhorada para converter URL em base64 - aceita TODOS os tipos de imagem
  const convertUrlToBase64 = async (imageUrl: string): Promise<string> => {
    console.log('🔄 [COPYWRITING] Iniciando processamento da imagem:', imageUrl);
    
    if (!imageUrl) {
      throw new Error('URL da imagem não fornecida');
    }

    // Se já é base64, validar e retornar
    if (imageUrl.startsWith('data:')) {
      console.log('✅ [COPYWRITING] Já é base64, validando formato...');
      if (imageUrl.includes('image/') && imageUrl.includes('base64,')) {
        return imageUrl;
      } else {
        console.log('⚠️ [COPYWRITING] Base64 inválido, processando novamente...');
      }
    }

    // Verificar se é URL válida
    if (!imageUrl.startsWith('https://') && !imageUrl.startsWith('http://')) {
      throw new Error('URL deve ser HTTPS ou HTTP válida');
    }

    try {
      console.log('🔄 [COPYWRITING] Método 1: Fetch -> Blob -> ObjectURL -> Canvas');
      
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('📦 [COPYWRITING] Blob obtido:', { 
        size: blob.size, 
        type: blob.type,
        sizeKB: Math.round(blob.size / 1024)
      });

      // Validar se é realmente uma imagem
      if (!blob.type.startsWith('image/')) {
        throw new Error(`Tipo de arquivo inválido: ${blob.type}. Esperado: image/*`);
      }
      
      const objectUrl = URL.createObjectURL(blob);
      
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const img = new window.Image();
          
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                reject(new Error('Canvas não disponível'));
                return;
              }
              
              // Definir dimensões do canvas
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              
              // Desenhar a imagem no canvas
              ctx.drawImage(img, 0, 0);
              
              // Converter para base64 JPEG com qualidade alta
              const result = canvas.toDataURL('image/jpeg', 0.95);
              
              console.log('✅ [COPYWRITING] Canvas convertido:', {
                originalSize: `${img.naturalWidth}x${img.naturalHeight}`,
                base64Length: result.length,
                startsCorrectly: result.startsWith('data:image/jpeg;base64,')
              });
              
              // Validar o resultado
              if (!result.startsWith('data:image/jpeg;base64,') || result.length < 1000) {
                reject(new Error('Base64 gerado é inválido ou muito pequeno'));
                return;
              }
              
              resolve(result);
            } catch (canvasError) {
              console.error('❌ [COPYWRITING] Erro no canvas:', canvasError);
              reject(canvasError);
            }
          };
          
          img.onerror = (error) => {
            console.error('❌ [COPYWRITING] Erro ao carregar imagem:', error);
            reject(new Error('Falha ao carregar imagem no canvas'));
          };
          
          img.src = objectUrl;
        });
        
        URL.revokeObjectURL(objectUrl);
        return base64;
        
      } catch (canvasError) {
        URL.revokeObjectURL(objectUrl);
        throw canvasError;
      }
      
    } catch (error) {
      console.error('❌ [COPYWRITING] Método principal falhou:', error);
      
      // Como último recurso, enviar a URL para o backend processar
      console.log('🔄 [COPYWRITING] Enviando URL para backend processar');
      return imageUrl;
    }
  };

  // Gerar copywriting completa via fila (OpenAI gpt-4o-mini)
  const generateCopywriting = async () => {
    if (!selectedImage) {
      toast.error('Selecione uma imagem para análise primeiro');
      return;
    }

    setIsGenerating(true);
    
    toast.info('⏳ Gerando copywriting completa via OpenAI. Pode levar até 2 minutos...', {
      duration: 5000
    });

    try {
      console.log('🔍 [COPYWRITING] Iniciando geração de copywriting via fila...');
      console.log('📸 [COPYWRITING] URL da imagem selecionada:', selectedImage);
      console.log('🏷️ [COPYWRITING] Nome do produto:', productName);
      console.log('📝 [COPYWRITING] Descrição:', shortDescription);
      
      // Processar imagem
      console.log('🔄 [COPYWRITING] Processando imagem...');
      const imageInput = await convertUrlToBase64(selectedImage);
      console.log('✅ [COPYWRITING] Processamento concluído:', imageInput.startsWith('data:') ? 'base64' : 'URL');
      
      const copywritingPrompt = `${productName ? `PRODUTO ESPECÍFICO: ${productName}\n\n` : ''}### Estrutura de Copywriting Completa e Profissional para Produtos

**⚠️ REGRA OBRIGATÓRIA: VOCÊ DEVE GERAR **TODOS** OS 10 TÓPICOS ABAIXO. NÃO É OPCIONAL.**
**⚠️ NÃO PARE EM 7 TÓPICOS. CONTINUE ATÉ O TÓPICO 10.**
**⚠️ SE VOCÊ PARAR ANTES DO TÓPICO 10, A RESPOSTA SERÁ CONSIDERADA INCOMPLETA.**

**Instruções:**

1. **Análise da Imagem e Produto:**
   - **Descrição Visual:** Analise a imagem fornecida, identificando características visuais como design, cores, funcionalidades aparentes.
   - **Detalhes do Produto:** Identifique o nome do produto (ou crie um nome comercial sugestivo), suas principais funções, benefícios e qualquer informação relevante sobre seu uso.

PRODUTO: ${productName}
DESCRIÇÃO: ${shortDescription}

2. **Estrutura da Copywriting (MANTENHA EXATAMENTE ESTA NUMERAÇÃO E TÍTULOS):**

**⚠️ ATENÇÃO: OS 10 TÓPICOS ABAIXO SÃO TODOS OBRIGATÓRIOS. GERE TODOS SEM EXCEÇÃO:**

#### 1. Título Atraente e Impactante:
   - Crie um título que capture a atenção imediatamente, destacando o principal benefício ou característica única do produto.

#### 2. Introdução Captadora de Atenção:
   - Escreva uma introdução curta e envolvente que desperte o interesse do leitor, fazendo uma ligação emocional com o problema que o produto resolve.

#### 3. Destaque das Principais Características:
   - Liste as principais características técnicas do produto de forma clara e concisa.
   - Foque nos aspectos físicos, técnicos e funcionais do produto.
   - **IMPORTANTE:** Use o formato: **Nome da Característica:** Descrição da característica.

#### 4. Dor x Solução para Conversão:
   - Identifique as principais DORES e PROBLEMAS que o produto resolve.
   - Apresente de forma clara como o produto é a SOLUÇÃO perfeita para essas dores.
   - Use linguagem persuasiva focada na transformação que o cliente terá.
   - **IMPORTANTE:** Use o formato: **PROBLEMA:** Dor específica do cliente **SOLUÇÃO:** Como o produto resolve.

#### 5. Principais Benefícios para o Cliente:
   - Liste os principais benefícios que o produto oferece ao cliente.
   - Explique como cada benefício resolve problemas específicos ou melhora a vida do usuário.
   - **IMPORTANTE:** Use o formato: **Nome do Benefício:** Descrição do benefício.

#### 6. Gatilho de Escassez e Urgência:
   - Crie um senso de urgência, mencionando ofertas limitadas, estoque restrito ou benefícios temporários.

#### 7. Chamada para Ação Forte:
   - Finalize com uma chamada para ação clara e persuasiva, incentivando o leitor a tomar uma decisão de compra imediata.

#### 8. Perguntas Frequentes (FAQ) Resumidas:
   - Forneça respostas rápidas para possíveis dúvidas dos clientes, mantendo a informação clara e objetiva.
   - **IMPORTANTE:** Use o formato: **P:** Pergunta **R:** Resposta

#### 9. Ambientes Ideais que se Encaixa para o Produto:
   - Liste os ambientes específicos onde o produto é ideal: Cozinha, Banheiro, Sala de Estar, Escritório, Lavanderia, Varanda, Quarto, Garagem, Jardim, Comercial (loja, escritório, clínica), Outros

#### 10. Títulos de Cauda Longa para Anúncios (Long Tail SEO):
   - Gere EXATAMENTE 30 títulos otimizados para SEO de cauda longa
   - Cada título deve ter NO MÁXIMO 200 caracteres
   - Baseie os títulos em:
     * Características principais do produto
     * Palavras-chave identificadas anteriormente (tópicos 2 e 3)
     * Termos de busca relacionados (como usuários pesquisariam no Google)
     * Variações semânticas e sinônimos
     * Benefícios específicos (problema + solução)
   - **FORMATO OBRIGATÓRIO:** Liste um título por linha, numerados de 1 a 30
   - **NÃO use emojis** nos títulos
   - **Foque em conversão:** Cada título deve ser atraente e clicável
   
   **EXEMPLO DE FORMATO:**
   1. [Primeiro título otimizado com até 200 caracteres]
   2. [Segundo título otimizado com até 200 caracteres]
   ...
   30. [Trigésimo título otimizado com até 200 caracteres]

**CRÍTICO E OBRIGATÓRIO:**
1. Mantenha EXATAMENTE esta numeração (1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
2. **TODOS OS 10 TÓPICOS SÃO OBRIGATÓRIOS** - não omita nenhum
3. Se você parar no tópico 7, a resposta será considerada INCOMPLETA
4. Não altere a estrutura numérica nem os nomes das seções principais
5. **Continue escrevendo até completar o tópico 10. Contato e Suporte**

${productName ? `\n\nIMPORTANTE: A copywriting deve ser específica para "${productName}" e refletir suas características reais.` : ''}

**LEMBRE-SE: GERE **TODOS** OS 10 TÓPICOS. NÃO PARE EM 7!**`;

      // 🆕 Enviar para fila via queue-image
      console.log('📤 [COPYWRITING] Enviando para fila (queue-image)...');
      
      const { data: queueData, error: queueError } = await supabase.functions.invoke('queue-image', {
        body: {
          generationType: 'copywriting_professional',
          inputData: {
            imageData: imageInput,
            productName: productName,
            shortDescription: shortDescription,
            copywritingPrompt: copywritingPrompt
          }
        }
      });
      
      if (queueError) {
        console.error('❌ [COPYWRITING] Erro ao enfileirar:', queueError);
        throw new Error(queueError.message || 'Erro ao enfileirar job');
      }
      
      if (!queueData?.success || !queueData?.jobId) {
        console.error('❌ [COPYWRITING] Resposta inválida da fila:', queueData);
        throw new Error(queueData?.error || 'Resposta inválida da fila');
      }
      
      const jobId = queueData.jobId;
      console.log(`✅ [COPYWRITING] Job enfileirado: ${jobId}`);
      
      // 🔄 Polling para verificar status
      const maxAttempts = 60; // 2 minutos (2s * 60)
      const pollInterval = 2000; // 2 segundos
      let attempts = 0;
      
      const pollForResult = async (): Promise<any> => {
        while (attempts < maxAttempts) {
          attempts++;
          console.log(`🔄 [COPYWRITING] Polling ${attempts}/${maxAttempts}...`);
          
          const { data: statusData, error: statusError } = await supabase.functions.invoke('check-queue-status', {
            body: { jobId }
          });
          
          if (statusError) {
            console.warn(`⚠️ [COPYWRITING] Erro no polling:`, statusError);
          }
          
          const status = statusData?.status || statusData?.job?.status;
          console.log(`📊 [COPYWRITING] Status: ${status}`);
          
          if (status === 'completed') {
            return statusData?.result || statusData?.job?.result;
          }
          
          if (status === 'failed') {
            throw new Error(statusData?.error_message || statusData?.job?.error_message || 'Job falhou');
          }
          
          // Aguardar antes do próximo poll
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
        
        throw new Error('Timeout: copywriting demorou mais de 2 minutos');
      };
      
      const result = await pollForResult();
      console.log('📥 [COPYWRITING] Resultado do OpenAI:', result);
      
      if (result?.success && result?.copywriting) {
        const newCopywriting = result.copywriting;
        
        // Validar se contém todos os 10 tópicos
        const topicPattern = /####\s*(\d+)\./g;
        const topics = newCopywriting.match(topicPattern);
        const topicCount = topics ? topics.length : 0;
        
        console.log(`🔍 [COPYWRITING] Tópicos detectados: ${topicCount}/10`);
        
        updateCopywriting(newCopywriting);
        
        if (topicCount >= 10) {
          console.log('✅ [COPYWRITING] Copywriting gerada com sucesso (completa)');
          toast.success('Copywriting completa gerada com sucesso via OpenAI!');
        } else {
          console.warn(`⚠️ [COPYWRITING] Copywriting incompleta: ${topicCount}/10 tópicos`);
          toast.warning(`Copywriting gerada com ${topicCount}/10 tópicos`, { duration: 5000 });
        }
      } else {
        console.error('❌ [COPYWRITING] Falha na geração:', result?.error || 'Resposta inválida');
        toast.error('Erro ao gerar copywriting: ' + (result?.error || 'Resposta inválida'));
      }
    } catch (error) {
      console.error('Erro ao gerar copywriting:', error);
      toast.error('Erro ao gerar copywriting: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Copiar copywriting para área de transferência
  const copyCopywriting = async () => {
    if (!generatedCopywriting) {
      toast.error('Nenhuma copywriting gerada ainda');
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedCopywriting);
      toast.success('Copywriting copiada para área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar copywriting:', error);
      toast.error('Erro ao copiar copywriting');
    }
  };

  // Limpar copywriting e remover do banco
  const clearCopywriting = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      // Buscar dados existentes para preservar outros campos
      const { data: existingRecord } = await (supabase as any)
        .from('ai_unified_results')
        .select('results')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingRecord?.results) {
        // Remover apenas o campo copywriting, preservando outros resultados de IA
        const currentResults = existingRecord.results as Record<string, any>;
        const { copywriting, ...otherResults } = currentResults;

        // Se ainda há outros resultados, fazer update sem copywriting
        if (Object.keys(otherResults).length > 0) {
          await (supabase as any)
            .from('ai_unified_results')
            .update({
              results: otherResults,
              updated_at: new Date().toISOString()
            })
            .eq('product_id', productId)
            .eq('user_id', user.id);
        } else {
          // Se não há outros resultados, deletar o registro completo
          await (supabase as any)
            .from('ai_unified_results')
            .delete()
            .eq('product_id', productId)
            .eq('user_id', user.id);
        }
      }

      // Limpar estado local
      setGeneratedCopywriting('');
      setHasPersistedCopywriting(false);
      
      toast.success('Copywriting removida com sucesso!');
    } catch (error) {
      console.error('Erro ao limpar copywriting:', error);
      toast.error('Erro ao limpar copywriting');
    }
  };

  // Combinar e validar todas as imagens disponíveis (originais + galeria IA)
  const availableImages = validatedAvailableImages;

  // Info auxiliar (apenas visual)
  const originalCount = validatedOriginalCount;
  const galleryCount = validatedGalleryCount;

  return (
    <Card className="glass-effect border-2 border-emerald-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg">Gerador de Copywriting Profissional</CardTitle>
            <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50 text-xs">
              IA Avançada
            </Badge>
            {aiGalleryImages.length > 0 && (
              <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 text-xs">
                <Images className="h-3 w-3 mr-1" />
                +{aiGalleryImages.length} IA
              </Badge>
            )}
            
            {/* Badge indicando status da copywriting salva */}
            {hasPersistedCopywriting && (
              <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 text-xs">
                <Database className="h-3 w-3 mr-1" />
                Copywriting Salva
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setExpanded(!expanded)}
            className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        {!expanded && (
          <p className="text-sm text-emerald-600 mt-2">
            📝 Gere copywriting completa e profissional usando análise de imagem com Gemini 2.5 Flash Image Preview
            {aiGalleryImages.length > 0 && (
              <span className="text-blue-600 ml-2">
                • Incluindo {aiGalleryImages.length} imagens da Galeria IA
              </span>
            )}
          </p>
        )}
      </CardHeader>
      
      {expanded && (
        <CardContent className="space-y-6">
          {/* API Key do Gemini - Ocultado */}

          {/* Seleção de Imagem com Upload */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-emerald-700">
                Selecione uma imagem para análise:
                {(originalCount > 0 || galleryCount > 0) && (
                  <span className="text-blue-600 text-xs ml-2">
                    ({originalCount} originais + {galleryCount} uploads = {availableImages.length} total)
                    {isValidatingImages ? ' • validando...' : ''}
                  </span>
                )}
              </h4>
              {/* Botão de Upload */}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files) {
                      Array.from(files).forEach((file) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                          const base64 = reader.result as string;
                          setUserUploadedImages(prev => [...prev, base64]);
                          toast.success('Imagem carregada!');
                        };
                        reader.readAsDataURL(file);
                      });
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                  asChild
                >
                  <span>
                    <Plus className="h-4 w-4 mr-1" />
                    Upload
                  </span>
                </Button>
              </label>
            </div>
            
            {availableImages.length > 0 ? (
              <div className="grid grid-cols-4 gap-3">
                {availableImages.map((imageUrl, index) => (
                  <ImageSelector
                    key={`copywriting-${index}`}
                    imageUrl={imageUrl}
                    productName={productName}
                    index={index}
                    isSelected={selectedImage === imageUrl}
                    onSelect={() => setSelectedImage(imageUrl)}
                  />
                ))}
              </div>
            ) : (
              <div 
                className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/50 transition-all"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.multiple = true;
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files) {
                      Array.from(files).forEach((file) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                          const base64 = reader.result as string;
                          setUserUploadedImages(prev => [...prev, base64]);
                          toast.success('Imagem carregada!');
                        };
                        reader.readAsDataURL(file);
                      });
                    }
                  };
                  input.click();
                }}
              >
                <Upload className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>Clique para fazer upload de imagens</p>
                <p className="text-xs mt-1 text-emerald-600">
                  JPG, PNG, GIF, WebP
                </p>
              </div>
            )}
          </div>

          {/* Botão de Geração */}
          <div className="flex justify-center">
            <Button
              onClick={generateCopywriting}
              disabled={!selectedImage || isGenerating || hasPersistedCopywriting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-base font-medium disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando Copywriting...
                </>
              ) : hasPersistedCopywriting ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Gerar Nova Copywriting
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Gerar Copywriting Profissional
                </>
              )}
            </Button>
          </div>

          {/* Resultado da Copywriting */}
          {generatedCopywriting && (
            <div className="space-y-4">
              {/* Header com controles */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-full">
                    <Sparkles className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-emerald-800">
                      Copywriting Profissional Gerada
                    </h4>
                    <p className="text-sm text-emerald-600">
                      Conteúdo otimizado com análise de IA avançada
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setShowResult(!showResult)}
                    variant="outline"
                    size="sm"
                    className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                  >
                    {showResult ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                    {showResult ? 'Ocultar' : 'Mostrar'}
                  </Button>
                  
                  <Button
                    onClick={copyCopywriting}
                    variant="outline"
                    size="sm"
                    className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar Tudo
                  </Button>
                  
                  <Button
                    onClick={clearCopywriting}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                </div>
              </div>
              
              {/* Conteúdo da copywriting */}
              {showResult && (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-xl blur-xl"></div>
                  <div className="relative bg-white/95 backdrop-blur-sm border-2 border-emerald-200 rounded-xl overflow-hidden shadow-lg">
                    {/* Barra decorativa superior */}
                    <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400"></div>
                    
                    {/* Conteúdo */}
                    <div className="p-8 max-h-[600px] overflow-y-auto custom-scrollbar">
                      <CopywritingFormatter copywriting={generatedCopywriting} />
                    </div>
                    
                    {/* Gradiente fade no final */}
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/95 to-transparent pointer-events-none"></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Componente de persistência */}
          <CopywritingPersistence
            productId={productId}
            productSku={productSku}
            copywriting={generatedCopywriting}
            onCopywritingLoaded={handleCopywritingLoaded}
          />
        </CardContent>
      )}
    </Card>
  );
};