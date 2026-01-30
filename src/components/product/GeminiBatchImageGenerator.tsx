import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Wand2, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react';
import { useGeminiBackgroundGenerator } from '@/hooks/useGeminiBackgroundGenerator';
import { useAIImagesCache } from '@/hooks/useAIImagesCache';
import { AIGeneratedImagesGrid } from './AIGeneratedImagesGrid';
import { toast } from 'sonner';
import { EnhancedImage } from '@/hooks/enhancement/types';
import { useImageEnhancementPersistence } from '@/hooks/enhancement/useImageEnhancementPersistence';
import { Textarea } from '@/components/ui/textarea';
import { useHostedImages } from '@/hooks/useHostedImages';
import { useImageHosting } from '@/hooks/enhancement/useImageHosting';
import { useImageResizer } from '@/hooks/useImageResizer';

interface GeminiBatchImageGeneratorProps {
  images: string[];
  productName: string;
  productId: string;
}

export const GeminiBatchImageGenerator = ({ 
  images, 
  productName, 
  productId
}: GeminiBatchImageGeneratorProps) => {
  const [selectedImageIndices, setSelectedImageIndices] = useState<number[]>([]);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [batchPrompts, setBatchPrompts] = useState('');
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  
  // Estados para imagens melhoradas com DeepAI
  const [enhancedImages, setEnhancedImages] = useState<EnhancedImage[]>([]);
  const [isLoadingEnhanced, setIsLoadingEnhanced] = useState(true);
  const { loadEnhancedImages } = useImageEnhancementPersistence();
  
  // Cache de sessão para imagens geradas
  const { cachedImages, saveToCache } = useAIImagesCache(productId, 'Gemini Batch');

  // Hooks
  const { generateBackground, isProcessing, progress } = useGeminiBackgroundGenerator();
  const { saveHostedImage } = useHostedImages();
  const { hostEnhancedImage } = useImageHosting();
  const { resizeImageTo1000x1000 } = useImageResizer();

  // Restaurar cache ao montar componente
  useEffect(() => {
    if (cachedImages.length > 0 && generatedImages.length === 0) {
      setGeneratedImages(cachedImages);
      console.log(`🔄 [GEMINI BATCH] ${cachedImages.length} imagens restauradas do cache`);
    }
  }, [cachedImages]);

  // Salvar no cache sempre que gerar novas imagens
  useEffect(() => {
    if (generatedImages.length > 0) {
      saveToCache(generatedImages);
    }
  }, [generatedImages, saveToCache]);

  // Load enhanced images from DeepAI
  useEffect(() => {
    const loadImages = async () => {
      if (!productId) {
        setIsLoadingEnhanced(false);
        return;
      }

      try {
        console.log('🔍 [BATCH] Carregando imagens melhoradas do DeepAI para productId:', productId);
        const enhanced = await loadEnhancedImages(productId);
        
        console.log('📸 [BATCH] Imagens melhoradas carregadas:', {
          count: enhanced.length,
          images: enhanced.map(img => ({ id: img.id, enhanced: img.enhanced }))
        });
        
        setEnhancedImages(enhanced);
        
        // Auto-select first image
        if (enhanced.length > 0 && selectedImageIndices.length === 0) {
          setSelectedImageIndices([0]);
          console.log('✅ [BATCH] Auto-selecionada primeira imagem melhorada DeepAI');
        }
      } catch (error) {
        console.error('❌ [BATCH] Erro ao carregar imagens melhoradas:', error);
      } finally {
        setIsLoadingEnhanced(false);
      }
    };

    loadImages();
  }, [productId]);

  // Determinar qual conjunto de imagens usar
  const getActiveImages = () => {
    if (isLoadingEnhanced) {
      console.log('⏳ [BATCH ACTIVE IMAGES] Carregando imagens melhoradas...');
      return [];
    }

    if (enhancedImages.length > 0) {
      const result = enhancedImages.map(img => img.enhanced);
      console.log('🖼️ [BATCH ACTIVE IMAGES] Usando imagens MELHORADAS do DeepAI:', result.length);
      return result;
    }
    
    console.log('❌ [BATCH ACTIVE IMAGES] Nenhuma imagem melhorada disponível');
    return [];
  };
  
  const activeImages = getActiveImages();

  // Função para extrair prompts do texto colado (separados por títulos com 🖼️)
  const extractPrompts = (text: string): string[] => {
    const prompts: string[] = [];
    const sections = text.split('🖼️').filter(section => section.trim());
    
    sections.forEach(section => {
      // Remover o título (primeira linha após o emoji)
      const lines = section.trim().split('\n');
      if (lines.length > 1) {
        // Pegar tudo após a primeira linha (que é o título)
        const promptText = lines.slice(1).join('\n').trim();
        if (promptText) {
          prompts.push(promptText);
        }
      }
    });
    
    return prompts;
  };

  // Processar batch de 12 prompts
  const handleBatchGeneration = async () => {
    if (!batchPrompts.trim()) {
      toast.error('❌ Cole os 12 prompts no campo acima');
      return;
    }

    if (activeImages.length === 0) {
      toast.error('❌ Nenhuma imagem de referência disponível. Processe imagens com DeepAI primeiro.');
      return;
    }

    if (selectedImageIndices.length === 0) {
      toast.error('❌ Selecione pelo menos uma imagem de referência');
      return;
    }

    const prompts = extractPrompts(batchPrompts);
    
    if (prompts.length === 0) {
      toast.error('❌ Não foi possível extrair prompts. Verifique o formato.');
      return;
    }

    console.log(`🚀 [BATCH] Iniciando geração em lote: ${prompts.length} prompts com ${selectedImageIndices.length} imagens de referência`);
    
    setIsBatchProcessing(true);
    setBatchProgress({ current: 0, total: prompts.length });
    
    const newGeneratedImages: string[] = [];
    const selectedImages = selectedImageIndices.map(index => activeImages[index]);

    try {
      for (let i = 0; i < prompts.length; i++) {
        const prompt = prompts[i];
        setBatchProgress({ current: i + 1, total: prompts.length });
        
        console.log(`🎨 [BATCH ${i + 1}/${prompts.length}] Gerando imagem com prompt:`, prompt.substring(0, 100));
        
        toast.info(`🎨 Gerando imagem ${i + 1}/${prompts.length}...`);

        // Gerar imagem com Gemini Nano Banana (múltiplas imagens de referência)
        const result = await generateBackground(
          selectedImages,
          prompt,
          3 // max retries
        );

        if (result.success && result.generatedImage) {
          console.log(`✅ [BATCH ${i + 1}/${prompts.length}] Imagem gerada com sucesso`);
          
          newGeneratedImages.push(result.generatedImage);
          
          // Hospedar diretamente no R2 sem upscale
          try {
            console.log(`☁️ [BATCH ${i + 1}/${prompts.length}] Hospedando no R2...`);
            
            // Redimensionar para 1000x1000 antes de hospedar
            const resizedBase64 = await resizeImageTo1000x1000(result.generatedImage);
            
            const fileName = `gemini-batch-${productId}-${Date.now()}-${i}.png`;
            const hostingResult = await hostEnhancedImage(resizedBase64, fileName);

            if (hostingResult.url && hostingResult.hosted) {
              console.log(`✅ [BATCH ${i + 1}/${prompts.length}] Hospedado no R2:`, hostingResult.url);
              
              // Calcular tamanho aproximado do base64
              const base64Length = resizedBase64.replace(/^data:image\/\w+;base64,/, '').length;
              const fileSizeBytes = Math.floor((base64Length * 3) / 4);
              
              // Salvar na tabela hosted_images
              await saveHostedImage({
                url: hostingResult.url,
                r2_path: hostingResult.url,
                filename: fileName,
                original_filename: `prompt-${i + 1}.png`,
                file_type: 'image/png',
                file_size: fileSizeBytes,
                width: 1000,
                height: 1000,
                description: `${productName} - Gemini Batch ${i + 1}/${prompts.length}`,
                tags: [
                  `product:${productId}`,
                  'source:gemini-batch',
                  'ai-source:gemini-nano-banana',
                  'quality:1000x1000',
                  'hosted',
                  `batch-index:${i}`,
                  'no-upscale'
                ]
              });
              
              toast.success(`✅ Imagem ${i + 1}/${prompts.length} gerada e hospedada!`);
            }
          } catch (hostingError) {
            console.error(`❌ [BATCH ${i + 1}/${prompts.length}] Erro ao hospedar:`, hostingError);
            toast.error(`⚠️ Imagem ${i + 1} gerada mas não foi hospedada`);
          }
        } else {
          console.error(`❌ [BATCH ${i + 1}/${prompts.length}] Falha na geração:`, result.error);
          toast.error(`❌ Falha ao gerar imagem ${i + 1}`);
        }
      }

      setGeneratedImages(prev => [...newGeneratedImages, ...prev]);
      
      toast.success(`🎉 Processo completo! ${newGeneratedImages.length}/${prompts.length} imagens geradas e hospedadas`, {
        duration: 5000
      });
      
    } catch (error) {
      console.error('❌ [BATCH] Erro no processo:', error);
      toast.error('❌ Erro ao processar batch de imagens');
    } finally {
      setIsBatchProcessing(false);
      setBatchProgress({ current: 0, total: 0 });
    }
  };

  const isAnyProcessing = isProcessing || isBatchProcessing;

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          Gerador em Lote - Gemini Nano Banana (12 Prompts)
        </CardTitle>
        <CardDescription>
          Cole 12 prompts de uma vez e gere todas as imagens automaticamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seletor de Imagens de Referência DeepAI (Múltipla Seleção) */}
        <div className="space-y-2">
          <Label>📸 Imagens de Referência (DeepAI) - Selecione quantas quiser</Label>
          {isLoadingEnhanced ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando imagens melhoradas...
            </div>
          ) : activeImages.length > 0 ? (
            <>
              <div className="grid grid-cols-4 gap-2">
                {activeImages.map((img, index) => {
                  const isSelected = selectedImageIndices.includes(index);
                  return (
                    <div
                      key={index}
                      onClick={() => {
                        setSelectedImageIndices(prev => 
                          isSelected 
                            ? prev.filter(i => i !== index)
                            : [...prev, index]
                        );
                      }}
                      className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                        isSelected
                          ? 'border-purple-500 ring-2 ring-purple-200'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Referência ${index + 1}`}
                        className="w-full h-24 object-cover"
                      />
                      {isSelected && (
                        <Badge className="w-full justify-center rounded-none bg-purple-500">
                          Selecionada
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedImageIndices.length} {selectedImageIndices.length === 1 ? 'imagem selecionada' : 'imagens selecionadas'}
              </div>
            </>
          ) : (
            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              ⚠️ Nenhuma imagem melhorada disponível. Processe imagens com DeepAI primeiro.
            </div>
          )}
        </div>

        {/* Campo para colar os 12 prompts */}
        <div className="space-y-2">
          <Label htmlFor="batch-prompts">
            📝 Cole os 12 Prompts (separados por 🖼️)
          </Label>
          <Textarea
            id="batch-prompts"
            value={batchPrompts}
            onChange={(e) => setBatchPrompts(e.target.value)}
            placeholder="Cole aqui os 12 prompts com títulos começando com 🖼️..."
            className="min-h-[300px] font-mono text-sm"
            disabled={isAnyProcessing}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {extractPrompts(batchPrompts).length} prompts detectados
            </span>
            <span>
              Objetivo: 12 prompts
            </span>
          </div>
        </div>

        {/* Botão de Geração */}
        <Button
          onClick={handleBatchGeneration}
          disabled={isAnyProcessing || activeImages.length === 0 || selectedImageIndices.length === 0 || !batchPrompts.trim()}
          className="w-full"
          size="lg"
        >
          {isBatchProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Gerando {batchProgress.current}/{batchProgress.total}...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Gerar {extractPrompts(batchPrompts).length} Imagens com Gemini
            </>
          )}
        </Button>

        {/* Progress Bar */}
        {isBatchProcessing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Progresso: {batchProgress.current}/{batchProgress.total}
              </span>
              <span className="font-medium">
                {Math.round((batchProgress.current / batchProgress.total) * 100)}%
              </span>
            </div>
            <Progress 
              value={(batchProgress.current / batchProgress.total) * 100} 
              className="h-2"
            />
          </div>
        )}

        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Gerando imagem...</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Grid de Imagens Geradas */}
        {generatedImages.length > 0 && (
          <AIGeneratedImagesGrid
            images={generatedImages}
            productId={productId}
            productName={productName}
            aiName="Gemini Batch (Nano Banana)"
          />
        )}
      </CardContent>
    </Card>
  );
};
