import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload, Sparkles, Download } from 'lucide-react';
import { useStabilityGenerator } from '@/hooks/useStabilityGenerator';
import { useEnhancedImagesCache } from '@/hooks/useEnhancedImagesCache';
import { useHostedImages } from '@/hooks/useHostedImages';
import { useAIImagesCache } from '@/hooks/useAIImagesCache';
import { AIGeneratedImagesGrid } from './AIGeneratedImagesGrid';
import { toast } from 'sonner';
import { useUnifiedCommandsData } from '@/hooks/useUnifiedCommandsData';
import { useImageResizer } from '@/hooks/useImageResizer';
import { generatePromptVariations } from '@/utils/promptVariationGenerator';
import { distributeVariations } from '@/utils/promptDistributor';

interface StabilityImageGeneratorProps {
  productId: string;
  productName: string;
  productImages: string[];
}

export const StabilityImageGenerator = ({
  productId,
  productName,
  productImages
}: StabilityImageGeneratorProps) => {
  const {
    isProcessing,
    progress,
    currentModel,
    generatedImages,
    generateImageToImage,
    fileToBase64
  } = useStabilityGenerator();

  // Cache de sessão para imagens geradas
  const { cachedImages, saveToCache } = useAIImagesCache(productId, 'Stability AI');

  const { enhancedImages, isLoading: isLoadingEnhanced } = useEnhancedImagesCache(productId);
  const { saveHostedImage } = useHostedImages();
  const { getUnifiedDataForProduct } = useUnifiedCommandsData();
  const { resizeImageTo1000x1000 } = useImageResizer();

  // Restaurar cache ao montar componente
  useEffect(() => {
    if (cachedImages.length > 0 && generatedImages.length === 0) {
      // Nota: generatedImages vem do hook useStabilityGenerator, então não podemos setar diretamente
      // mas o cache será útil para exibição persistente
      console.log(`🔄 [STABILITY] ${cachedImages.length} imagens disponíveis no cache`);
    }
  }, [cachedImages, generatedImages.length]);

  // Salvar no cache sempre que gerar novas imagens
  useEffect(() => {
    if (generatedImages.length > 0) {
      saveToCache(generatedImages);
    }
  }, [generatedImages, saveToCache]);

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const [backgroundPrompt, setBackgroundPrompt] = useState<string>('');
  const [foregroundPrompt, setForegroundPrompt] = useState<string>('');
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  
  const [preserveSubject, setPreserveSubject] = useState([70]);
  const [backgroundDepth, setBackgroundDepth] = useState([50]);
  const [lightDirection, setLightDirection] = useState<string>('none');
  const [lightStrength, setLightStrength] = useState([30]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 🎯 BUSCAR DADOS UNIFICADOS
  useEffect(() => {
    const loadUnifiedData = async () => {
      try {
        const data = await getUnifiedDataForProduct(productId);
        if (data.hasUnifiedData && data.idealEnvironments && data.idealEnvironments.length > 0) {
          // Auto-sugerir prompt baseado em ambiente ideal
          const randomEnv = data.idealEnvironments[Math.floor(Math.random() * data.idealEnvironments.length)];
          if (!backgroundPrompt) {
            setBackgroundPrompt(`Professional ${randomEnv} setting with natural lighting`);
            console.log('🎨 [STABILITY] Prompt sugerido baseado em ambiente ideal:', randomEnv);
          }
        }
      } catch (error) {
        console.error('❌ [STABILITY] Erro ao carregar dados unificados:', error);
      }
    };
    
    if (productId) {
      loadUnifiedData();
    }
  }, [productId, getUnifiedDataForProduct]);

  const availableImages = enhancedImages.length > 0 
    ? enhancedImages.map(img => img.enhanced)
    : productImages;
  const hasPublicImages = enhancedImages.length > 0;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
      setSelectedImage('');
    }
  };

  const handleSelectProductImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImagePreview(imageUrl);
    setUploadedImage(null);
  };

  const handleGenerate = async () => {
    if (!selectedImage && !uploadedImage) {
      toast.error('Selecione ou faça upload de uma imagem');
      return;
    }

    if (!backgroundPrompt || backgroundPrompt.trim().length < 10) {
      toast.error('Descreva o fundo desejado (mínimo 10 caracteres)');
      return;
    }

    let imageData = selectedImage;
    if (uploadedImage) {
      imageData = await fileToBase64(uploadedImage);
    }

    const result = await generateImageToImage({
      image: imageData,
      background_prompt: backgroundPrompt,
      foreground_prompt: foregroundPrompt || undefined,
      negative_prompt: negativePrompt || undefined,
      preserve_original_subject: preserveSubject[0] / 100,
      original_background_depth: backgroundDepth[0] / 100,
      light_source_direction: lightDirection !== 'none' ? lightDirection : undefined,
      light_source_strength: lightStrength[0] / 100,
    });

    if (result.success && result.image) {
      // Salvar na tabela hosted_images
      try {
        console.log('💾 [Stability] Salvando imagem gerada...');
        
        const fileName = `stability-${Date.now()}.png`;
        
        await saveHostedImage({
          url: result.image,
          filename: fileName,
          original_filename: `stability-${productName}-${Date.now()}.png`,
          r2_path: '',
          file_type: 'image/png',
          file_size: 0,
          width: 1024,
          height: 1024,
          productId: productId,
          aiSource: 'stability',
          processing: ['replace-background', 'relight'],
          quality: 'original',
          tags: ['ai-source:stability', 'product:' + productId, 'original-source:stability']
        });
        
        console.log('✅ [Stability] Imagem salva na tabela hosted_images');
      } catch (saveError) {
        console.error('❌ [Stability] Erro ao salvar imagem:', saveError);
        toast.error('Imagem gerada, mas houve erro ao salvar');
      }
      
      // 🔄 Converter Base64 → Blob URL ANTES de enviar para galeria
      console.log('🔄 [STABILITY] Convertendo imagem para Blob...');
      const resizedBlobUrl = await resizeImageTo1000x1000(result.image);
      console.log('✅ [STABILITY] Conversão Blob concluída:', resizedBlobUrl.substring(0, 50));
      
      // Disparar evento para a galeria de IA
      window.dispatchEvent(new CustomEvent('imageGenerated', {
        detail: {
          source: 'stability',
          images: [resizedBlobUrl], // ✅ Usar Blob URL
          productId: productId,
          timestamp: Date.now()
        }
      }));
      
      toast.success('Imagem gerada e salva com sucesso!');
    }
  };

  const handleDownloadImage = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `stability-${productName}-${index + 1}.png`;
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Replace Background & Relight
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Substitui o fundo preservando 100% do produto + iluminação profissional
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seleção de Imagem */}
        <div className="space-y-4">
          <Label>1. Selecione a Imagem do Produto</Label>

          {/* Upload */}
          <div 
            className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <img 
                src={imagePreview} 
                alt="Preview"
                className="max-h-48 mx-auto rounded-lg"
              />
            ) : (
              <div className="space-y-2">
                <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Clique para fazer upload ou selecione uma imagem abaixo
                </p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Imagens do Produto */}
          {isLoadingEnhanced && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando imagens melhoradas...
            </div>
          )}
          
          {availableImages.length > 0 && (
            <div className="space-y-2">
              {!hasPublicImages && (
                <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-700 dark:text-yellow-400">
                  ⚠️ Usando imagens originais. Recomendado: melhorar com DeepAI primeiro.
                </div>
              )}
              <div className="grid grid-cols-4 gap-2">
                {availableImages.slice(0, 8).map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectProductImage(img)}
                    className={`cursor-pointer rounded-lg border-2 transition-all ${
                      selectedImage === img ? 'border-primary ring-2 ring-primary' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <img 
                      src={img} 
                      alt={`${hasPublicImages ? 'Melhorada' : 'Original'} ${idx + 1}`} 
                      className="w-full h-20 object-cover rounded-lg" 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Configuração */}
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded p-3 text-sm">
            <strong>🎨 {currentModel}</strong>
            <p className="text-xs text-muted-foreground mt-1">
              Sistema assíncrono com polling (30-90s de processamento)
            </p>
          </div>

          <div>
            <Label htmlFor="backgroundPrompt">Descrição do Novo Fundo * (inglês)</Label>
            <Textarea
              id="backgroundPrompt"
              value={backgroundPrompt}
              onChange={(e) => setBackgroundPrompt(e.target.value)}
              placeholder="modern kitchen with marble countertop and natural lighting..."
              rows={3}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Descreva o cenário desejado em inglês (mínimo 10 caracteres)
            </p>
          </div>

          <div>
            <Label htmlFor="foregroundPrompt">Descrição do Produto (opcional)</Label>
            <Input
              id="foregroundPrompt"
              value={foregroundPrompt}
              onChange={(e) => setForegroundPrompt(e.target.value)}
              placeholder="elegant watch with leather strap..."
            />
          </div>

          <div>
            <Label htmlFor="negativePrompt">Prompt Negativo (opcional)</Label>
            <Textarea
              id="negativePrompt"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="blurry, distorted, low quality..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Preservar Produto Original</Label>
              <span className="text-sm text-muted-foreground">{preserveSubject[0]}%</span>
            </div>
            <Slider
              value={preserveSubject}
              onValueChange={setPreserveSubject}
              min={50}
              max={100}
              step={5}
              disabled={isProcessing}
            />
            <p className="text-xs text-muted-foreground">
              Quanto do produto original manter (recomendado: 70-80%)
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Profundidade do Fundo</Label>
              <span className="text-sm text-muted-foreground">{backgroundDepth[0]}%</span>
            </div>
            <Slider
              value={backgroundDepth}
              onValueChange={setBackgroundDepth}
              min={0}
              max={100}
              step={5}
              disabled={isProcessing}
            />
            <p className="text-xs text-muted-foreground">
              Desfoque do fundo (0 = nítido, 100 = muito desfocado)
            </p>
          </div>

          <div>
            <Label htmlFor="lightDirection">Direção da Luz</Label>
            <Select value={lightDirection} onValueChange={setLightDirection}>
              <SelectTrigger id="lightDirection">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Automático</SelectItem>
                <SelectItem value="above">De Cima</SelectItem>
                <SelectItem value="below">De Baixo</SelectItem>
                <SelectItem value="left">Esquerda</SelectItem>
                <SelectItem value="right">Direita</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {lightDirection !== 'none' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Intensidade da Luz</Label>
                <span className="text-sm text-muted-foreground">{lightStrength[0]}%</span>
              </div>
              <Slider
                value={lightStrength}
                onValueChange={setLightStrength}
                min={0}
                max={100}
                step={5}
                disabled={isProcessing}
              />
            </div>
          )}
        </div>

        {/* Progresso */}
        {isProcessing && progress > 0 && (
          <div className="space-y-2">
            <Label>Gerando imagem (30-90s)...</Label>
            <Progress value={progress} className="w-full" />
            <p className="text-xs text-muted-foreground">
              Sistema assíncrono: a geração continua no servidor
            </p>
          </div>
        )}

        {/* Botão de Ação */}
        <Button
          onClick={handleGenerate}
          disabled={isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando ({progress}%)...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Gerar Imagem (4 créditos)
            </>
          )}
        </Button>

        {/* Imagens Geradas - Usando o componente padronizado */}
        {generatedImages.length > 0 && (
          <AIGeneratedImagesGrid
            images={generatedImages}
            aiName="Stability AI"
            productName={productName}
            productId={productId}
            className="mt-6"
          />
        )}
      </CardContent>
    </Card>
  );
};