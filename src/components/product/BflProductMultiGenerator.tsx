import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, AlertCircle, CheckCircle, Brain } from "lucide-react";
import { toast } from "sonner";
import { useBflTest } from "@/hooks/useBflTest";
import { useImageResizer } from "@/hooks/useImageResizer";

interface BflProductMultiGeneratorProps {
  baseImage?: File;
  externalPrompts?: string[];
  onImagesGenerated: (images: string[]) => void;
}

export const BflProductMultiGenerator = ({ 
  baseImage,
  externalPrompts = [],
  onImagesGenerated
}: BflProductMultiGeneratorProps) => {
  const { isProcessing, generateImage } = useBflTest();
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isGeneratingMultiple, setIsGeneratingMultiple] = useState(false);
  const { resizeImageTo1000x1000 } = useImageResizer();

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

  // 🚀 AUTOMAÇÃO: Listener para automação do BFL Multi Generator
  useEffect(() => {
    const handleAutomation = async (event: CustomEvent) => {
      console.log('🔄 [AUTOMAÇÃO BFL MULTI] Evento de geração de imagens recebido:', event.detail);
      
      // Aguardar um pouco para garantir que os prompts estão disponíveis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log(`📋 [AUTOMAÇÃO BFL MULTI] Prompts disponíveis: ${externalPrompts.length}`);
      console.log(`🖼️ [AUTOMAÇÃO BFL MULTI] Imagem base disponível: ${!!baseImage}`);
      
      if (externalPrompts.length > 0 && baseImage) {
        console.log('🚀 [AUTOMAÇÃO BFL MULTI] Iniciando geração automática de imagens...');
        toast.info('🚀 Gerando imagens com BFL.ai Multi Generator...', { duration: 5000 });
        await generateAllImages();
      } else if (!baseImage) {
        console.log('⚠️ [AUTOMAÇÃO BFL MULTI] Nenhuma imagem base disponível para automação');
        toast.warning('Upload de uma imagem base necessário para geração BFL.ai');
      } else {
        console.log('⏳ [AUTOMAÇÃO BFL MULTI] Aguardando prompts serem gerados...');
        // Tentar novamente após um tempo
        setTimeout(async () => {
          if (externalPrompts.length > 0 && baseImage) {
            console.log('🔄 [AUTOMAÇÃO BFL MULTI] Tentativa 2: Iniciando geração...');
            await generateAllImages();
          } else {
            console.log('❌ [AUTOMAÇÃO BFL MULTI] Tentativa 2 falhou: sem prompts ou imagem base');
          }
        }, 5000);
      }
    };

    window.addEventListener('triggerBflImageGeneration', handleAutomation as EventListener);
    
    return () => {
      window.removeEventListener('triggerBflImageGeneration', handleAutomation as EventListener);
    };
  }, [externalPrompts.length, baseImage]);

  const generateAllImages = async () => {
    if (externalPrompts.length === 0) {
      toast.error('Nenhum prompt disponível para geração');
      return;
    }

    if (!baseImage) {
      toast.error('Faça upload de uma imagem base primeiro');
      return;
    }

    // Contar prompts válidos (não são mensagens de erro)
    const validPrompts = externalPrompts.filter(prompt => !prompt.startsWith('ERRO:'));
    const errorPrompts = externalPrompts.length - validPrompts.length;
    
    if (validPrompts.length === 0) {
      toast.error('Nenhum prompt válido disponível para geração');
      return;
    }

    console.log(`🎯 Iniciando geração com ${validPrompts.length} prompts válidos (${errorPrompts} com erro)`);

    setIsGeneratingMultiple(true);
    setGeneratedImages([]);
    setCurrentPromptIndex(0);

    const newImages: string[] = [];

    try {
      console.log(`🚀 Iniciando geração múltipla de ${externalPrompts.length} imagens...`);
      toast.loading('Iniciando geração múltipla...', { id: 'multi-gen' });

      // Converter imagem base para base64
      const imageBase64 = await convertImageToBase64(baseImage);

      for (let i = 0; i < externalPrompts.length; i++) {
        const prompt = externalPrompts[i];
        setCurrentPromptIndex(i + 1);
        
        // Pular prompts com erro
        if (prompt.startsWith('ERRO:')) {
          console.log(`⚠️ Pulando prompt ${i + 1} (contém erro):`, prompt.substring(0, 50));
          toast.warning(`Pulando prompt ${i + 1} (erro)`, { id: `img-${i}` });
          continue;
        }
        
        console.log(`🎯 Gerando imagem ${i + 1}/${externalPrompts.length}...`);
        toast.loading(`Gerando imagem ${i + 1}/${externalPrompts.length}...`, { id: 'multi-gen' });

        try {
          const result = await generateImage('flux-kontext-pro', {
            prompt,
            width: 1024,
            height: 1024,
            steps: 28,
            guidance: 3.5,
            input_image: imageBase64,
            strength: 0.3,
            operation: 'image-to-image'
          });
          
          if (result.success && result.result_url) {
            newImages.push(result.result_url);
            console.log(`✅ Imagem ${i + 1} gerada com sucesso`);
            toast.success(`Imagem ${i + 1} concluída!`, { id: `img-${i}` });
          } else {
            console.error(`❌ Falha na geração da imagem ${i + 1}:`, result);
            toast.error(`Falha na imagem ${i + 1}`, { id: `img-${i}` });
          }

          // Delay entre gerações para não sobrecarregar a API
          if (i < externalPrompts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }

        } catch (error) {
          console.error(`❌ Erro na geração da imagem ${i + 1}:`, error);
          toast.error(`Erro na imagem ${i + 1}`, { id: `img-${i}` });
        }
      }

      if (newImages.length > 0) {
        setGeneratedImages(newImages);
        onImagesGenerated(newImages);
        
        // 🔄 Converter Base64 → Blob URL ANTES de enviar para galeria
        console.log(`🔄 [BFL MULTI] Convertendo ${newImages.length} imagens para Blob...`);
        const blobUrls = await Promise.all(
          newImages.map(img => resizeImageTo1000x1000(img))
        );
        console.log('✅ [BFL MULTI] Conversão Blob concluída para todas as imagens');
        
        // ✅ SISTEMA ANTI-DUPLICAÇÃO BFL MULTI
        console.log('📸 [BFL] Enviando imagens para a galeria...');
        const imageEvent = new CustomEvent('imageGenerated', {
          detail: {
            source: 'bfl',
            images: blobUrls, // ✅ Usar Blob URLs
            productId: window.location.pathname.split('/')[2], // Extrair productId da URL
            timestamp: Date.now(),
            batchId: `bfl-multi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // ID único do lote
            generationRound: Date.now() // Round único de geração
          }
        });
        window.dispatchEvent(imageEvent);
        
        toast.success(`🎉 ${newImages.length} imagens geradas com sucesso!`, {
          id: 'multi-gen',
          description: 'Todas as imagens foram geradas!'
        });
      } else {
        toast.error('Nenhuma imagem foi gerada com sucesso', { id: 'multi-gen' });
      }

    } catch (error) {
      console.error('❌ Erro geral na geração múltipla:', error);
      toast.error(`Erro na geração múltipla: ${error.message}`, { id: 'multi-gen' });
    } finally {
      setIsGeneratingMultiple(false);
      setCurrentPromptIndex(0);
    }
  };

  const promptTitles = [
    'Estrutura Completa',
    'Foco em Local e Ação', 
    'Ultra-Realista Profissional',
    'Estratégia Promocional'
  ];

  return (
    <Card className="border-green-200 bg-gradient-to-br from-green-50/50 to-emerald-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-green-700">
          <Sparkles className="h-5 w-5" />
          Geração Múltipla com Prompts Diferentes
          <Badge variant="outline" className="text-green-600 border-green-300 bg-green-100 text-xs">
            {externalPrompts.length} PROMPTS
          </Badge>
        </CardTitle>
        <CardDescription className="text-green-600">
          Gere múltiplas imagens usando os prompts criados pelo Gemini AI
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-green-50/50 rounded-lg border border-green-200">
            <div className="text-xs font-medium text-green-700 mb-1">Imagem Base</div>
            <div className="text-sm text-green-800 font-medium">
              {baseImage ? `✅ ${baseImage.name}` : '❌ Nenhuma imagem'}
            </div>
          </div>
          <div className="p-3 bg-green-50/50 rounded-lg border border-green-200">
            <div className="text-xs font-medium text-green-700 mb-1">Prompts Disponíveis</div>
            <div className="text-sm text-green-800 font-medium">
              {externalPrompts.length > 0 ? `✅ ${externalPrompts.length} prompts` : '❌ Nenhum prompt'}
            </div>
          </div>
        </div>

        {/* Lista de Prompts */}
        {externalPrompts.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-green-700">Prompts que serão usados:</div>
            <div className="space-y-2">
              {externalPrompts.map((prompt, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-green-50/30 rounded border border-green-200">
                  <Badge 
                    variant={generatedImages[index] ? "default" : "outline"} 
                    className={`mt-0.5 text-xs ${
                      generatedImages[index] 
                        ? "bg-green-600 text-white" 
                        : isGeneratingMultiple && currentPromptIndex === index + 1
                          ? "bg-yellow-500 text-white animate-pulse"
                          : "text-green-600 border-green-300"
                    }`}
                  >
                    {generatedImages[index] ? (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    ) : isGeneratingMultiple && currentPromptIndex === index + 1 ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : null}
                    {index + 1}
                  </Badge>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-green-700 mb-1">
                      {promptTitles[index] || `Prompt ${index + 1}`}
                    </div>
                    <div className="text-xs text-green-600 line-clamp-2">
                      {prompt.substring(0, 100)}...
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status da Geração */}
        {isGeneratingMultiple && (
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2 text-yellow-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">
                Gerando imagem {currentPromptIndex}/{externalPrompts.length}...
              </span>
            </div>
            <div className="text-xs text-yellow-600 mt-1">
              Por favor, aguarde. Cada imagem leva cerca de 30-60 segundos.
            </div>
          </div>
        )}

        {/* Resultado */}
        {generatedImages.length > 0 && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {generatedImages.length} imagens geradas com sucesso!
              </span>
            </div>
            <div className="text-xs text-green-600">
              As imagens aparecerão na galeria abaixo.
            </div>
          </div>
        )}

        {/* Botão de Geração */}
        <Button
          onClick={generateAllImages}
          disabled={isGeneratingMultiple || externalPrompts.length === 0 || !baseImage}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          {isGeneratingMultiple ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando {currentPromptIndex}/{externalPrompts.length}...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              🚀 Gerar {externalPrompts.length} Imagens com IA
            </>
          )}
        </Button>

        {/* Avisos */}
        {externalPrompts.length === 0 && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-700">
              <div className="font-medium mb-1">Nenhum prompt disponível</div>
              <div className="text-xs">Use o "Gerador de Prompts" acima para criar prompts primeiro.</div>
            </div>
          </div>
        )}

        {!baseImage && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-700">
              <div className="font-medium mb-1">Imagem base necessária</div>
              <div className="text-xs">Faça upload de uma imagem no gerador manual acima.</div>
            </div>
          </div>
        )}

        {/* Informação */}
        <div className="text-xs text-green-600 bg-green-50/30 p-2 rounded border border-green-200">
          <p className="font-medium mb-1">🎯 GERAÇÃO MÚLTIPLA BFL.ai:</p>
          <p>✅ <strong>MÚLTIPLAS IMAGENS</strong> • ✅ <strong>PROMPTS GEMINI AI</strong> • ✅ <strong>ALTA QUALIDADE</strong> • ✅ <strong>PROCESSAMENTO SEQUENCIAL</strong> • ✅ <strong>CONTROLE DE STATUS</strong></p>
        </div>
      </CardContent>
    </Card>
  );
};