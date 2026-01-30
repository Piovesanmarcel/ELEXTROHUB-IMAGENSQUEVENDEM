import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Sparkles, Loader2, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedCommandsData } from "@/hooks/useUnifiedCommandsData";
import { generatePromptVariations } from "@/utils/promptVariationGenerator";
import { distributeVariations } from "@/utils/promptDistributor";

interface BflProductPromptGeneratorProps {
  onPromptGenerated: (prompts: string[]) => void;
  uploadedImage?: File;
  enhancedImages?: any[];
  originalImages?: string[];
  selectedImageIndex?: number;
  productName?: string;
}

export const BflProductPromptGenerator = ({ 
  onPromptGenerated,
  uploadedImage,
  enhancedImages = [],
  originalImages = [],
  selectedImageIndex = 0,
  productName,
  onPromptGenerated: onPromptGeneratedProp
}: BflProductPromptGeneratorProps) => {
  const [generatedPrompts, setGeneratedPrompts] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  // Removido useTongyiWanxiang - agora usa Gemini 2.5 Flash Image Preview
  
  // Hook para dados unificados do copywriting
  const { getUnifiedDataForProduct } = useUnifiedCommandsData();
  const [productIdFromImage, setProductIdFromImage] = useState<string | null>(null);

  // 🚀 AUTOMAÇÃO: Listener para automação do BFL.ai
  useEffect(() => {
    const handleBflAutomation = async (event: CustomEvent) => {
      console.log('🤖 [AUTOMAÇÃO BFL] Evento de automação recebido:', event.detail);
      
      try {
        console.log('🚀 [AUTOMAÇÃO BFL] Aguardando 2s para garantir componentes prontos...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('🚀 [AUTOMAÇÃO BFL] Iniciando geração automática de prompts...');
        toast.info('🤖 Iniciando automação: BFL.ai Gerador de Prompts...', { duration: 8000 });
        
        // ⚡ Debug: Verificar estado das imagens antes de gerar
        console.log('🔍 [DEBUG AUTOMAÇÃO] Estado das imagens:', {
          hasUploadedImage: !!uploadedImage,
          enhancedImagesCount: enhancedImages.length,
          originalImagesCount: originalImages.length,
          selectedImageIndex
        });
        
        // ⚡ CORREÇÃO: Automaticamente gerar prompts (equivalente a clicar no botão)
        await generatePromptsWithGemini();
        
        // 🚀 NOVA ORDEM: Após completar BFL.ai, aguardar 5s e acionar Runware
        console.log('🚀 [NOVA ORDEM] BFL.ai finalizado, aguardando 5s para Gemini...');
        toast.info('🤖 BFL.ai concluído! Aguardando 5s para iniciar Gemini...', { duration: 5000 });
        
        // Aguardar 5 segundos antes de iniciar o Gemini
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('🚀 [AUTOMAÇÃO REMOVIDA] BFL.ai concluído, mas automação de Gemini foi desabilitada');
        
      } catch (error) {
        console.error('❌ [AUTOMAÇÃO BFL] Erro na automação:', error);
        toast.error('Erro na automação do BFL.ai: ' + error.message);
      }
    };

    console.log('🔧 [DEBUG BFL] Registrando listener para triggerBflAutomationInternal');
    window.addEventListener('triggerBflAutomationInternal', handleBflAutomation as EventListener);
    
    return () => {
      console.log('🔧 [DEBUG BFL] Removendo listener para triggerBflAutomationInternal');
      window.removeEventListener('triggerBflAutomationInternal', handleBflAutomation as EventListener);
    };
  }, [uploadedImage, enhancedImages, originalImages, selectedImageIndex]);

  const promptTemplates = [
    {
      id: 'prompt1',
      title: 'Prompt 1 - Estrutura Completa',
      template: `${productName ? `PRODUTO ESPECÍFICO: ${productName}\n\n` : ''}Analise o produto na imagem e crie um prompt publicitário conciso que inclua:

1. Descrição do produto específico da imagem
2. Cenário/ambiente criativo diferente do original 
3. Estilo visual (fotográfico realista, minimalista, lifestyle, etc.)
4. Iluminação adequada para destacar o produto
5. Elementos de composição que valorizem o produto
6. Emoção/sentimento que deve transmitir

O prompt final deve ser direto, específico e gerar uma imagem publicitária atrativa e diferente da original.${productName ? `\n\nIMPORTANTE: Todos os prompts e imagens devem ser específicos para "${productName}" e manter suas características visuais originais.` : ''}`
    },
    {
      id: 'prompt2',
      title: 'Prompt 2 - Foco em Local e Ação',
      template: `${productName ? `PRODUTO ESPECÍFICO: ${productName}\n\n` : ''}Gere um prompt para criação de um anúncio visual do produto da imagem, seguindo esta estrutura do prompt, O prompt deve incluir:

Local: Onde você quer que o produto esteja?
Ação principal: O que você quer que as pessoas façam com o produto? (por exemplo, jogar, criar, compartilhar, aprender, etc.)
Nova posição: Como o produto em si deve ser organizado ou exibido nesse novo local?
Cenários ambientais: Que tipo de atmosfera, iluminação e elementos circundantes devem estar presentes para melhorar a cena?
Quanto mais detalhes você fornecer, melhor o modelo de geração de imagens poderá entender e criar o que você imagina para uma melhor conversão.${productName ? `\n\nIMPORTANTE: Todos os prompts e imagens devem ser específicos para "${productName}" e manter suas características visuais originais.` : ''}`
    },
    {
      id: 'prompt3',
      title: 'Prompt 3 - Ultra-Realista Profissional',
      template: `${productName ? `PRODUTO ESPECÍFICO: ${productName}\n\n` : ''}Gere um prompt para criação de um anúncio visual do produto da imagem, seguindo esta estrutura do prompt, O prompt deve incluir:

Analise o produto na imagem de referência anexa. Crie um prompt profissional ultra-realista para uma imagem publicitária que reposicione o produto de forma a maximizar o apelo visual para conversão em vendas, focando no destaque do produto e em uma estética de alta qualidade.${productName ? `\n\nIMPORTANTE: Todos os prompts e imagens devem ser específicos para "${productName}" e manter suas características visuais originais.` : ''}`
    },
    {
      id: 'prompt4',
      title: 'Prompt 4 - Estratégia Promocional',
      template: `${productName ? `PRODUTO ESPECÍFICO: ${productName}\n\n` : ''}Gere um prompt para criação de um anúncio visual do produto da imagem, seguindo esta estrutura do prompt, O prompt deve incluir:

Com base na análise do produto presente na imagem de referência, desenvolva um prompt profissional ultra-realista para a geração de uma nova imagem. A finalidade é a promoção e aumento de vendas, exigindo um reposicionamento estratégico do produto no layout e uma composição visual que inspire criatividade e desejo de compra. A imagem final deve ter qualidade publicitária e excelente estética.${productName ? `\n\nIMPORTANTE: Todos os prompts e imagens devem ser específicos para "${productName}" e manter suas características visuais originais.` : ''}`
    }
  ];

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert image to base64'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const convertUrlToBase64 = async (url: string): Promise<string> => {
    console.log('🔄 Convertendo URL para base64:', url);
    
    try {
      // Tentar fetch primeiro para URLs que suportam CORS
      const response = await fetch(url);
      if (response.ok) {
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              console.log('✅ URL convertida para base64 via fetch, length:', reader.result.length);
              resolve(reader.result);
            } else {
              reject(new Error('Failed to convert blob to base64'));
            }
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
      }
    } catch (fetchError) {
      console.log('⚠️ Fetch falhou, tentando canvas method:', fetchError.message);
    }
    
    // Fallback para canvas method
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Canvas not supported'));
            return;
          }
          
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const dataURL = canvas.toDataURL('image/jpeg', 0.9);
          console.log('✅ URL convertida para base64 via canvas, length:', dataURL.length);
          resolve(dataURL);
        } catch (canvasError) {
          console.error('❌ Erro no canvas:', canvasError);
          reject(canvasError);
        }
      };
      
      img.onerror = (error) => {
        console.error('❌ Erro ao carregar imagem:', error);
        reject(new Error('Failed to load image from URL: ' + url));
      };
      
      img.src = url;
    });
  };

  const getSelectedImageBase64 = async (): Promise<string | null> => {
    try {
      // PRIMEIRA PRIORIDADE: Imagem uploadada pelo usuário
      if (uploadedImage) {
        console.log('📷 Usando imagem uploadada pelo usuário');
        return await convertImageToBase64(uploadedImage);
      }
      
      // SEGUNDA PRIORIDADE: Imagens melhoradas PÚBLICAS do DeepAI (OBRIGATÓRIO QUANDO DISPONÍVEL)
      if (enhancedImages.length > 0 && selectedImageIndex < enhancedImages.length) {
        const enhancedImageUrl = enhancedImages[selectedImageIndex].enhanced;
        console.log('📷 🚀 USANDO IMAGEM MELHORADA PÚBLICA DO DEEPAI (índice:', selectedImageIndex, '):');
        console.log('   URL Pública DeepAI:', enhancedImageUrl);
        
        if (!enhancedImageUrl.includes('app.sistemab2drop.com.br')) {
          return await convertUrlToBase64(enhancedImageUrl);
        } else {
          console.warn('⚠️ URL do DeepAI não é pública (contém sistemab2drop), pulando...');
          toast.error('Imagem melhorada não é pública. Execute novamente "Melhoria com DeepAI".');
          return null;
        }
      }
      
      // AVISAR que não há imagens melhoradas disponíveis
      if (originalImages.length > 0) {
        console.warn('⚠️ Não há imagens melhoradas do DeepAI. Imagens originais não são públicas.');
        toast.error('Execute primeiro "Melhoria com DeepAI" para obter imagens públicas de qualidade!');
        return null;
      }
      
      console.warn('⚠️ Nenhuma imagem válida disponível');
      return null;
      
    } catch (error) {
      console.error('❌ Erro ao converter imagem para base64:', error);
      toast.error('Erro ao processar imagem: ' + error.message);
      return null;
    }
  };

  const generatePromptsWithGemini = async () => {
    // VALIDAÇÃO RIGOROSA: Só permitir imagens melhoradas PÚBLICAS ou upload
    const hasValidImages = uploadedImage || (enhancedImages.length > 0);
    
    console.log('🔍 Debug - Verificando imagens VÁLIDAS (PÚBLICAS) disponíveis:', {
      hasUploadedImage: !!uploadedImage,
      enhancedImagesCount: enhancedImages.length,
      originalImagesCount: originalImages.length,
      selectedImageIndex,
      hasValidImages,
      message: hasValidImages ? 'IMAGENS PÚBLICAS OK' : 'APENAS IMAGENS PRIVADAS - EXECUTE DEEPAI PRIMEIRO'
    });
    
    if (!hasValidImages) {
      toast.error('🚫 Execute primeiro "Melhoria com DeepAI" para obter imagens públicas!', {
        description: 'As imagens originais não são públicas e não podem ser usadas.'
      });
      return;
    }
    
    // Verificar se as imagens melhoradas são mesmo públicas
    if (enhancedImages.length > 0 && !uploadedImage) {
      const testUrl = enhancedImages[selectedImageIndex]?.enhanced;
      if (testUrl && testUrl.includes('app.sistemab2drop.com.br')) {
        toast.error('⚠️ Imagens melhoradas não são públicas! Execute "Melhoria com DeepAI" novamente.');
        return;
      }
    }

    setIsGenerating(true);
    
    try {
      // 🎯 Buscar dados unificados do copywriting
      let unifiedData: any = null;
      
      if (productIdFromImage || productName) {
        console.log('🔍 [BFL] Buscando dados unificados do copywriting...');
        
        try {
          // Tentar obter productId da imagem melhorada
          let pidToUse = productIdFromImage;
          
          if (!pidToUse && enhancedImages.length > 0) {
            const enhancedImage = enhancedImages[selectedImageIndex];
            if (enhancedImage?.product_id) {
              pidToUse = enhancedImage.product_id;
              setProductIdFromImage(pidToUse);
            }
          }
          
          if (pidToUse) {
            unifiedData = await getUnifiedDataForProduct(pidToUse);
            
            if (unifiedData && unifiedData.idealEnvironments.length > 0) {
              console.log('🎯 [BFL] Dados unificados encontrados!', {
                idealEnvironments: unifiedData.idealEnvironments.length,
                idealFor: unifiedData.idealFor.length,
                mainKeywords: unifiedData.mainKeywords.length
              });
            }
          }
        } catch (err) {
          console.log('⚠️ [BFL] Erro ao buscar dados unificados:', err);
        }
      }
      
      console.log('🚀 Iniciando geração de 4 prompts com Gemini 2.5 Flash Image Preview...');
      
      // Preferir URL pública (DeepAI) para evitar payload muito grande; caso contrário, usar base64
      const useUrl = !uploadedImage && enhancedImages.length > 0 && selectedImageIndex < enhancedImages.length &&
        !enhancedImages[selectedImageIndex].enhanced.includes('app.sistemab2drop.com.br');
      const selectedImageUrl = useUrl ? enhancedImages[selectedImageIndex].enhanced : null;

      let imageBase64: string | null = null;
      if (!useUrl) {
        imageBase64 = await getSelectedImageBase64();
        if (!imageBase64) {
          console.error('❌ Falha ao obter imageBase64');
          toast.error('Erro ao processar a imagem selecionada');
          return;
        }
        console.log('📸 Imagem processada para base64, length:', imageBase64.length);
      } else {
        console.log('🌐 Usando URL pública para análise:', selectedImageUrl);
      }

      // 🎨 Enriquecer templates com dados unificados
      let enrichedTemplates = promptTemplates;
      
      if (unifiedData && unifiedData.idealEnvironments.length > 0) {
        console.log('🎨 [BFL] Gerando variações de prompts com dados unificados...');
        
        const variations = generatePromptVariations(
          productName || 'Produto',
          '',
          unifiedData
        );
        
        const distributed = distributeVariations(variations, {
          totalImages: 4,
          prioritizeHigh: true,
          shuffle: true
        });
        
        console.log('🎨 [BFL] Variações distribuídas:', {
          totalVariacoes: variations.length,
          distribuidas: distributed.length,
          ambientesIdeais: unifiedData.idealEnvironments,
          idealPara: unifiedData.idealFor,
          keywords: unifiedData.mainKeywords,
          contextosDistribuidos: distributed.map(v => v.context)
        });
        
        // Enriquecer cada template com dados da variação
        enrichedTemplates = promptTemplates.map((template, index) => {
          const variation = distributed[index] || distributed[0];
          
          return {
            ...template,
            template: `${template.template}

🎯 CONTEXTO ESPECÍFICO DO COPYWRITING PROFISSIONAL:
Ambiente Ideal: ${variation.context}
Ideal Para: ${unifiedData.idealFor[index % unifiedData.idealFor.length] || 'uso profissional'}
Keywords SEO: ${unifiedData.mainKeywords.slice(0, 3).join(', ')}
Público-Alvo: ${unifiedData.targetAudience}

IMPORTANTE: Integre estes elementos do copywriting ao prompt final de forma natural e profissional.`
          };
        });
        
        toast.info('✅ Templates enriquecidos com copywriting profissional!', { duration: 3000 });
      }

      const allPrompts: string[] = [];

      // Gerar cada um dos 4 prompts sequencialmente com retry logic
      for (let i = 0; i < enrichedTemplates.length; i++) {
        const template = enrichedTemplates[i];
        let promptGenerated = false;
        let retryCount = 0;
        const maxRetries = 3;
        
        console.log(`🎯 Gerando ${template.title}...`);
        toast.loading(`Gerando ${template.title}...`, { id: `gen-${i}` });

        // Loop de retry para cada prompt
        while (!promptGenerated && retryCount < maxRetries) {
          try {
            if (retryCount > 0) {
              console.log(`🔄 Tentativa ${retryCount + 1}/${maxRetries} para ${template.title}`);
              toast.loading(`Tentativa ${retryCount + 1}/${maxRetries} - ${template.title}...`, { id: `gen-${i}` });
            }

            console.log(`🎯 Chamando Gemini para ${template.title} com:`, {
              templateTitle: template.title,
              templateLength: template.template.length,
              usingUrl: useUrl,
              imageDataLength: imageBase64 ? imageBase64.length : 0,
              attempt: retryCount + 1
            });
            
            // Usar Gemini API diretamente com timeout maior para prompt 4
            const timeoutMs = i === 3 ? 60000 : 30000; // 60s para prompt 4, 30s para outros
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            try {
              const { data, error } = await supabase.functions.invoke('ai-chat-proxy', {
                body: {
                  action: 'generate_prompt',
                  imageData: useUrl && selectedImageUrl ? selectedImageUrl : imageBase64,
                  prompt: template.template,
                  targetFunction: 'gemini-background-generator'
                }
              });

              clearTimeout(timeoutId);
              const result = error ? { success: false, error: error.message } : data;

              console.log(`📥 Resposta do Gemini para ${template.title} (tentativa ${retryCount + 1}):`, {
                success: result.success,
                hasResponse: !!result.data?.response,
                error: result.error
              });

              if (result.success && (result.data?.response || result.generated_image_text || result.generatedPrompt)) {
                const generatedPrompt = result.data?.response || result.generated_image_text || result.generatedPrompt;
                allPrompts.push(generatedPrompt);
                
                console.log(`✅ ${template.title} gerado com sucesso na tentativa ${retryCount + 1}, length:`, generatedPrompt.length);
                toast.success(`${template.title} concluído!`, { id: `gen-${i}` });
                promptGenerated = true;
              } else {
                throw new Error(result.error || 'Resposta inválida da API');
              }

            } catch (apiError) {
              clearTimeout(timeoutId);
              throw apiError;
            }

          } catch (promptError) {
            retryCount++;
            console.error(`❌ Erro na geração de ${template.title} (tentativa ${retryCount}):`, promptError);
            
            if (retryCount >= maxRetries) {
              console.error(`❌ Falha final na geração de ${template.title} após ${maxRetries} tentativas`);
              toast.error(`Falha final: ${template.title} (${maxRetries} tentativas)`, { id: `gen-${i}` });
              
              // Adicionar prompt vazio para manter o índice
              allPrompts.push(`ERRO: Não foi possível gerar ${template.title} após ${maxRetries} tentativas.`);
            } else {
              // Aguardar antes de tentar novamente (tempo progressivo)
              const delayMs = 2000 * retryCount; // 2s, 4s, 6s
              console.log(`⏳ Aguardando ${delayMs}ms antes da próxima tentativa...`);
              await new Promise(resolve => setTimeout(resolve, delayMs));
            }
          }
        }

        // Delay entre gerações para não sobrecarregar a API (maior delay após prompt 3)
        if (i < promptTemplates.length - 1) {
          const delayMs = i === 2 ? 5000 : 3000; // 5s antes do prompt 4, 3s para outros
          console.log(`⏳ Aguardando ${delayMs}ms antes do próximo prompt...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      if (allPrompts.length > 0) {
        // Filtrar prompts válidos (não são mensagens de erro)
        const validPrompts = allPrompts.filter(prompt => !prompt.startsWith('ERRO:'));
        const errorPrompts = allPrompts.length - validPrompts.length;
        
      setGeneratedPrompts(allPrompts);
      onPromptGeneratedProp(allPrompts);
        
        if (errorPrompts > 0) {
          toast.warning(`⚠️ ${validPrompts.length} prompts gerados, ${errorPrompts} falharam`, {
            description: 'Alguns prompts falharam, mas prosseguindo com os disponíveis'
          });
        } else {
          toast.success(`🎉 ${allPrompts.length} prompts gerados com sucesso!`, {
            description: 'Iniciando geração automática de imagens sequenciais!'
          });
        }
        
        // 🚀 AUTOMAÇÃO: Após gerar os prompts automaticamente, acionar a geração sequencial
        console.log('🚀 [AUTOMAÇÃO BFL] Prompts gerados, iniciando geração sequencial automática...');
        toast.info('🚀 Iniciando geração sequencial automática BFL.ai...', { duration: 5000 });
        
        // Aguardar 2 segundos e então disparar automação das imagens
        setTimeout(() => {
          const imageGenEvent = new CustomEvent('triggerBflImageGeneration', {
            detail: {
              prompts: allPrompts,
              validPromptsCount: validPrompts.length,
              timestamp: Date.now()
            }
          });
          
          console.log('🚀 [AUTOMAÇÃO BFL PROMPT] Disparando geração automática de imagens:', {
            totalPrompts: allPrompts.length,
            validPrompts: validPrompts.length,
            errorPrompts: errorPrompts
          });
          window.dispatchEvent(imageGenEvent);
        }, 3000);
        
      } else {
        toast.error('❌ Nenhum prompt foi gerado com sucesso - Tente novamente');
      }

    } catch (error) {
      console.error('❌ Erro geral na geração de prompts:', error);
      toast.error(`Erro ao gerar prompts: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompts = async () => {
    if (generatedPrompts.length === 0) return;
    
    try {
      const promptsText = generatedPrompts
        .map((prompt, index) => `${promptTemplates[index]?.title}:\n${prompt}`)
        .join('\n\n---\n\n');
      
      await navigator.clipboard.writeText(promptsText);
      setCopySuccess(true);
      toast.success('Todos os prompts copiados para a área de transferência!');
      
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Erro ao copiar prompts:', error);
      toast.error('Erro ao copiar prompts');
    }
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-indigo-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <Brain className="h-5 w-5" />
          Gerador de Prompts BFL.ai - Gemini 2.5 Flash Image Preview
          <Badge variant="outline" className="text-purple-600 border-purple-300 bg-purple-100 text-xs">
            4 PROMPTS ESPECÍFICOS
          </Badge>
        </CardTitle>
        <p className="text-sm text-purple-600">
          Gera <strong>4 prompts especializados</strong> para anúncios visuais usando <strong>Gemini 2.5 Flash Image Preview</strong> baseado na imagem do produto
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status da Imagem */}
        <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-200">
          <Label className="text-xs font-medium text-purple-700">Imagem Selecionada</Label>
          <p className="text-sm text-purple-800 font-medium">
            {uploadedImage ? (
              `✅ Upload: ${uploadedImage.name}`
            ) : enhancedImages.length > 0 ? (
              `✅ Melhorada DeepAI (PÚBLICA): Imagem ${selectedImageIndex + 1}`
            ) : originalImages.length > 0 ? (
              `❌ Apenas imagens originais (NÃO PÚBLICAS)`
            ) : (
              '❌ Nenhuma imagem disponível'
            )}
          </p>
          {enhancedImages.length > 0 && !uploadedImage && (
            <p className="text-xs text-green-600 mt-1 bg-green-50 p-1 rounded">
              ✅ Usando imagem melhorada PÚBLICA do DeepAI - Qualidade garantida!
            </p>
          )}
          {!uploadedImage && enhancedImages.length === 0 && originalImages.length > 0 && (
            <p className="text-xs text-red-600 mt-1 bg-red-50 p-1 rounded">
              ⚠️ Execute primeiro "Melhoria com DeepAI" para obter imagens PÚBLICAS!
            </p>
          )}
        </div>

        {/* Botão de Geração */}
        <Button
          onClick={generatePromptsWithGemini}
          disabled={isGenerating || (!uploadedImage && enhancedImages.length === 0)}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando 4 Prompts...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              🧠 Gerar 4 Prompts com Gemini 2.5 Flash
            </>
          )}
        </Button>

        {/* Lista de Templates */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-purple-700">Prompts que serão gerados:</Label>
          <div className="grid grid-cols-1 gap-2">
            {promptTemplates.map((template, index) => (
              <div key={template.id} className="flex items-center gap-2 p-2 bg-purple-50/30 rounded border border-purple-200">
                <Badge variant="outline" className="text-xs">{index + 1}</Badge>
                <span className="text-sm text-purple-700 font-medium">{template.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Prompts Gerados */}
        {generatedPrompts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-purple-700">Prompts Gerados ({generatedPrompts.length})</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyPrompts}
                className="text-purple-600 border-purple-300 hover:bg-purple-50"
              >
                {copySuccess ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Copiados!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copiar Todos
                  </>
                )}
              </Button>
            </div>
            
            {generatedPrompts.map((prompt, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{index + 1}</Badge>
                  <Label className="text-xs font-medium text-purple-700">
                    {promptTemplates[index]?.title}
                  </Label>
                </div>
                <Textarea
                  value={prompt}
                  readOnly
                  className="min-h-[100px] text-sm bg-purple-50/30 border-purple-200 text-purple-800"
                />
              </div>
            ))}

            <Button
              onClick={() => onPromptGenerated(generatedPrompts)}
              size="sm"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              ✨ Iniciar Geração Sequencial Automática ({generatedPrompts.length} imagens)
            </Button>
          </div>
        )}

        {/* Informação */}
        <div className="text-xs text-purple-600 bg-purple-50/30 p-2 rounded border border-purple-200">
          <p className="font-medium mb-1">🎯 GERADOR DE PROMPTS + GERAÇÃO AUTOMÁTICA:</p>
          <p>✅ <strong>4 PROMPTS ESPECÍFICOS</strong> • ✅ <strong>ANÁLISE COM GEMINI 2.5 FLASH IMAGE PREVIEW</strong> • ✅ <strong>BASEADO NA IMAGEM</strong> • ✅ <strong>GERAÇÃO SEQUENCIAL AUTOMÁTICA</strong> • ✅ <strong>4 IMAGENS FINAIS</strong> • ✅ <strong>PROMPTS PUBLICITÁRIOS</strong></p>
        </div>
      </CardContent>
    </Card>
  );
};