import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, Link, Wand2, Download, Eye, Loader2 } from 'lucide-react';
import { useGeminiBackgroundGenerator } from '@/hooks/useGeminiBackgroundGenerator';
import { useUnifiedCommandsData, UnifiedResultsData } from '@/hooks/useUnifiedCommandsData';
import { convertImageToBase64 } from '@/utils/imageToBase64Utils';
import { toast } from 'sonner';

// Tipos e labels para as 10 imagens
const IMAGE_TYPES = ['ambient_1', 'ambient_2', 'ambient_3', 'ambient_4', 'ambient_5', 'ambient_6', 'ambient_7', 'person_using', 'white_bg_4k_1', 'white_bg_4k_2'] as const;

const imageLabels: Record<string, string> = {
  'ambient_1': 'Introdução',
  'ambient_2': 'Dor x Solução',
  'ambient_3': 'Benefícios',
  'ambient_4': 'Escassez',
  'ambient_5': 'CTA Forte',
  'ambient_6': 'FAQ',
  'ambient_7': 'Conversão',
  'person_using': 'Características',
  'white_bg_4k_1': 'Branco 4K #1',
  'white_bg_4k_2': 'Branco 4K #2'
};

const imageIcons: Record<string, string> = {
  'ambient_1': '🏠',
  'ambient_2': '💡',
  'ambient_3': '✨',
  'ambient_4': '⏰',
  'ambient_5': '🎯',
  'ambient_6': '❓',
  'ambient_7': '📈',
  'person_using': '👤',
  'white_bg_4k_1': '⬜',
  'white_bg_4k_2': '🔲'
};

type ImageGenerationStatus = 'pending' | 'generating' | 'completed' | 'failed';

const GeminiBackgroundGenerator = () => {
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Multiple images support and white background states
  const [multipleImages, setMultipleImages] = useState<string[]>([]);
  const [selectedImagesForWhiteBg, setSelectedImagesForWhiteBg] = useState<string[]>([]);
  const [whiteBgImages, setWhiteBgImages] = useState<string[]>([]);
  const [isGeneratingWhiteBg, setIsGeneratingWhiteBg] = useState(false);
  
  // Status de geração de cada imagem
  const [imageGenerationStatus, setImageGenerationStatus] = useState<Record<string, ImageGenerationStatus>>({});
  const [isAutomationRunning, setIsAutomationRunning] = useState(false);
  const [automationProgress, setAutomationProgress] = useState({ current: 0, total: 10, step: '' });
  
  // Unified Data (Comando Unificado + Copywriting)
  const [productId] = useState(() => {
    return sessionStorage.getItem('ad_generator_product_id') || 'demo-product';
  });
  const [unifiedData, setUnifiedData] = useState<UnifiedResultsData | null>(null);
  
  const { generateBackground, isProcessing, progress } = useGeminiBackgroundGenerator();
  const { getUnifiedDataForProduct } = useUnifiedCommandsData();
  
  // Carregar dados do Comando Unificado + Copywriting quando houver productId
  useEffect(() => {
    const loadUnifiedData = async () => {
      if (productId && productId !== 'demo-product') {
        console.log('📦 [GEMINI PAGE] Carregando dados do Copywriting para:', productId);
        const data = await getUnifiedDataForProduct(productId);
        setUnifiedData(data);
        
        if (data.hasUnifiedData) {
          console.log('✅ [GEMINI PAGE] Dados do Copywriting carregados:', {
            idealEnvironments: data.idealEnvironments?.length || 0,
            idealFor: data.idealFor?.length || 0,
            mainKeywords: data.mainKeywords?.length || 0,
            targetAudience: !!data.targetAudience
          });
        } else {
          console.log('⚠️ [GEMINI PAGE] Sem dados de Copywriting disponíveis');
        }
      }
    };
    
    loadUnifiedData();
  }, [productId, getUnifiedDataForProduct]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setImageUrl(''); // Clear URL when uploading
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (value: string) => {
    setImageUrl(value);
    if (value) {
      setUploadedImage(null); // Clear uploaded image when using URL
    }
  };

  const handleGenerateBackground = async () => {
    if (!prompt.trim()) {
      toast.error('Por favor, descreva o fundo desejado');
      return;
    }

    let imageToProcess = uploadedImage || imageUrl;
    
    if (!imageToProcess) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    try {
      // Convert URL to base64 if needed
      if (imageUrl && !uploadedImage) {
        imageToProcess = await convertImageToBase64(imageUrl);
      }

      const result = await generateBackground(
        imageToProcess, 
        prompt, 
        3, 
        unifiedData || undefined,
        undefined,
        undefined,
        productId
      );
      
      if (result.success && result.generatedImage) {
        setGeneratedImage(result.generatedImage);
        setAnalysisResult(null);
        // Add to multiple images array for potential white bg generation
        handleGeneratedImageAdd(result.generatedImage, 'ambient_1');
        toast.success('Novo fundo gerado com sucesso!');
      } else if (result.analysis) {
        // Mostrar análise mesmo quando não gera imagem
        setAnalysisResult(result.analysis);
        setGeneratedImage(null);
        toast.success('Análise concluída! Veja as sugestões abaixo.');
      } else {
        toast.error(result.error || 'Erro ao gerar fundo');
      }
    } catch (error) {
      console.error('Erro ao gerar fundo:', error);
      toast.error('Erro ao gerar fundo');
    }
  };

  // Generate all 10 types for testing automation
  const handleGenerateAll10Types = async () => {
    if (!prompt.trim()) {
      toast.error('Por favor, descreva o fundo desejado');
      return;
    }

    let imageToProcess = uploadedImage || imageUrl;
    
    if (!imageToProcess) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    const types = IMAGE_TYPES;
    const typeNames = [
      'Introdução Captadora',
      'Dor x Solução', 
      'Benefícios',
      'Gatilho de Escassez e Urgência',
      'Chamada para Ação Forte',
      'FAQ Resumidas',
      'Tópicos de Conversão',
      'Características',
      '🎯 Fundo Branco 4K - Fidelidade Cromática',
      '🎯 Fundo Branco 4K - Textura Macro'
    ];

    try {
      if (imageUrl && !uploadedImage) {
        imageToProcess = await convertImageToBase64(imageUrl);
      }

      // Inicializar status de todas as imagens como pending
      const initialStatus: Record<string, ImageGenerationStatus> = {};
      types.forEach(type => { initialStatus[type] = 'pending'; });
      setImageGenerationStatus(initialStatus);
      setIsAutomationRunning(true);
      setAutomationProgress({ current: 0, total: types.length, step: 'Preparando...' });

      toast.info(`🚀 Iniciando geração de 10 imagens para automação...`);

      for (let i = 0; i < types.length; i++) {
        const imageType = types[i];
        const typeName = typeNames[i];
        
        // Atualizar status para "generating"
        setImageGenerationStatus(prev => ({ ...prev, [imageType]: 'generating' }));
        setAutomationProgress({ current: i + 1, total: types.length, step: imageLabels[imageType] || typeName });
        
        console.log(`🎯 Gerando imagem ${i + 1}/10: ${typeName} (${imageType})`);
        
        const result = await generateBackground(
          imageToProcess, 
          `${imageType} - ${prompt} - ${typeName}`,
          3,
          unifiedData || undefined,
          undefined,
          undefined,
          productId
        );
        
        if (result.success && result.generatedImage) {
          setImageGenerationStatus(prev => ({ ...prev, [imageType]: 'completed' }));
          handleGeneratedImageAdd(result.generatedImage, imageType);
          toast.success(`✅ ${typeName} gerada!`);
        } else {
          setImageGenerationStatus(prev => ({ ...prev, [imageType]: 'failed' }));
          toast.error(`❌ Erro ao gerar ${typeName}`);
        }
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setIsAutomationRunning(false);
      toast.success(`🎉 Todas as 10 imagens foram geradas!`);
      
    } catch (error) {
      console.error('Erro ao gerar as 10 imagens:', error);
      setIsAutomationRunning(false);
      toast.error('Erro ao gerar as 10 imagens');
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `gemini-background-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download iniciado!');
  };

  // Download specific image from gallery
  const handleDownloadImage = (imageUrl: string, prefix: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${prefix}-${index + 1}-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download iniciado!');
  };

  // White background generation functions
  const toggleImageSelection = (imageUrl: string) => {
    setSelectedImagesForWhiteBg(prev => {
      if (prev.includes(imageUrl)) {
        return prev.filter(url => url !== imageUrl);
      } else if (prev.length < 2) {
        return [...prev, imageUrl];
      } else {
        toast.error("Selecione no máximo 2 imagens");
        return prev;
      }
    });
  };

  const handleGenerateWhiteBgImages = async () => {
    if (selectedImagesForWhiteBg.length === 0) {
      toast.error("Selecione pelo menos 1 imagem para gerar fundo branco");
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
      
      console.log('🎨 Gerando fundo branco para imagens:', selectedImagesForWhiteBg);
      console.log('📝 Prompt fixo:', fixedPrompt);
      
      for (let i = 0; i < selectedImagesForWhiteBg.length; i++) {
        const imageUrl = selectedImagesForWhiteBg[i];
        
        console.log(`🚀 Chamando Gemini para imagem ${i + 1}/${selectedImagesForWhiteBg.length}`);
        
        const result = await generateBackground(
          imageUrl, 
          fixedPrompt,
          3,
          unifiedData || undefined,
          undefined,
          undefined,
          productId
        );
        
        if (result.success && result.generatedImage) {
          newWhiteBgImages.push(result.generatedImage);
          console.log(`✅ Imagem ${i + 1} gerada com sucesso`);
        } else {
          throw new Error('Falha na geração da imagem');
        }
      }
      
      setWhiteBgImages(newWhiteBgImages);
      toast.success(`${newWhiteBgImages.length} imagem(ns) com fundo branco gerada(s) com sucesso!`);
      
    } catch (error) {
      console.error('❌ Erro ao gerar fundo branco:', error);
      toast.error(`Erro ao gerar fundo branco: ${error.message}`);
    } finally {
      setIsGeneratingWhiteBg(false);
    }
  };

  // Mapping for the 10 ambient types as requested by user
  const ambientTypeOrder = {
    'ambient_1': 0,
    'ambient_2': 1,
    'ambient_3': 2,
    'ambient_4': 3,
    'ambient_5': 4,
    'ambient_6': 5,
    'ambient_7': 6,
    'person_using': 7,
    'white_bg_4k_1': 8,
    'white_bg_4k_2': 9
  };

  // Add generated image to multiple images array for selection and dispatch event
  const handleGeneratedImageAdd = (imageUrl: string, imageType = 'ambient_1') => {
    if (!multipleImages.includes(imageUrl)) {
      setMultipleImages(prev => [...prev, imageUrl]);
      
      // Dispatch event for AutoProcessor with sequenceIndex
      const sequenceIndex = ambientTypeOrder[imageType as keyof typeof ambientTypeOrder] || 0;
      const event = new CustomEvent('imageGenerated', {
        detail: {
          source: 'gemini-background',
          images: [imageUrl],
          productId: 'demo-product',
          imageIndex: 0,
          sequenceIndex: sequenceIndex,
          totalInSet: 8,
          imageType: imageType,
          batchId: `gemini-bg-${Date.now()}`
        }
      });
      
      console.log(`🚀 [GEMINI-BG] Disparando evento para AutoProcessor: imageType=${imageType}, sequenceIndex=${sequenceIndex}`);
      window.dispatchEvent(event);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">Gemini Background Generator</h1>
          <p className="text-muted-foreground">
            Use o Gemini 2.5 Flash Image para gerar fundos ambientados baseados na sua imagem
          </p>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 mt-4">
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              <strong>✨ Novo:</strong> Usando o Gemini 2.5 Flash Image Preview - agora gera imagens reais com novos fundos!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" />
                Configuração
              </CardTitle>
              <CardDescription>
                Selecione uma imagem e descreva o fundo desejado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Image Input */}
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload
                  </TabsTrigger>
                  <TabsTrigger value="url" className="flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    URL
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="image-upload">Selecionar Imagem</Label>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="cursor-pointer"
                    />
                  </div>
                  {uploadedImage && (
                    <div className="relative">
                      <img 
                        src={uploadedImage} 
                        alt="Imagem selecionada"
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="url" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="image-url">URL da Imagem</Label>
                    <Input
                      id="image-url"
                      type="url"
                      value={imageUrl}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                  </div>
                  {imageUrl && !uploadedImage && (
                    <div className="relative">
                      <img 
                        src={imageUrl} 
                        alt="Imagem da URL"
                        className="w-full h-32 object-cover rounded-lg border"
                        onError={() => toast.error('Erro ao carregar imagem da URL')}
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Prompt Input */}
              <div className="space-y-2">
                <Label htmlFor="prompt">Descrição do Fundo</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex: Um fundo de escritório moderno com plantas, iluminação suave e ambiente profissional"
                  className="min-h-20 resize-none"
                />
              </div>

              {/* Generate Button */}
              <Button 
                onClick={handleGenerateBackground}
                disabled={isProcessing || !prompt.trim() || (!uploadedImage && !imageUrl)}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Wand2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando Fundo...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Gerar Novo Fundo
                  </>
                )}
              </Button>

              {/* Generate All 10 Types Button for Automation Testing */}
              <Button 
                onClick={handleGenerateAll10Types}
                disabled={isProcessing || !prompt.trim() || (!uploadedImage && !imageUrl)}
                className="w-full"
                size="lg"
                variant="outline"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando 10 Imagens...
                  </>
                ) : (
                  <>
                    🤖 Gerar 10 Imagens para Automação
                  </>
                )}
              </Button>

              {/* Progress simples para geração única */}
              {isProcessing && !isAutomationRunning && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Gerando com Gemini 2.5 Flash Image...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              {/* Indicador visual de progresso da automação */}
              {isAutomationRunning && (
                <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-blue-800 dark:text-blue-200">
                      🚀 Gerando: {automationProgress.step}
                    </span>
                    <Badge variant="secondary">
                      {automationProgress.current}/{automationProgress.total}
                    </Badge>
                  </div>
                  
                  <Progress 
                    value={(automationProgress.current / automationProgress.total) * 100} 
                    className="w-full h-2" 
                  />
                  
                  {/* Grid visual de todas as 10 imagens */}
                  <div className="grid grid-cols-5 gap-2 mt-3">
                    {IMAGE_TYPES.map((type) => {
                      const status = imageGenerationStatus[type] || 'pending';
                      const icon = imageIcons[type];
                      const label = imageLabels[type];
                      
                      return (
                        <div 
                          key={type}
                          className={`flex flex-col items-center p-2 rounded-lg text-center transition-all ${
                            status === 'generating' ? 'bg-yellow-100 dark:bg-yellow-900/40 border-2 border-yellow-400 animate-pulse' :
                            status === 'completed' ? 'bg-green-100 dark:bg-green-900/40 border-2 border-green-400' :
                            status === 'failed' ? 'bg-red-100 dark:bg-red-900/40 border-2 border-red-400' :
                            'bg-gray-100 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <span className="text-lg">
                            {status === 'generating' ? '⏳' : 
                             status === 'completed' ? '✅' : 
                             status === 'failed' ? '❌' : icon}
                          </span>
                          <span className="text-[10px] mt-1 font-medium truncate w-full text-foreground">
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <p className="text-xs text-blue-600 dark:text-blue-400 text-center">
                    {automationProgress.step === 'Preparando...' ? 'Preparando automação...' : 
                     `Gerando: ${automationProgress.step}`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Result Section */}
          <Card>
            <CardHeader>
              <CardTitle>Resultado</CardTitle>
              <CardDescription>
                Sua imagem com novo fundo aparecerá aqui
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedImage ? (
                <div className="space-y-4">
                  <div className="relative group">
                    <img 
                      src={generatedImage} 
                      alt="Fundo gerado"
                      className="w-full rounded-lg border shadow-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                        <DialogTrigger asChild>
                          <Button variant="secondary" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl w-full">
                          <DialogHeader>
                            <DialogTitle>Preview do Fundo Gerado</DialogTitle>
                            <DialogDescription>
                              Imagem gerada pelo Gemini
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex justify-center">
                            <img 
                              src={generatedImage} 
                              alt="Preview do fundo gerado"
                              className="max-w-full max-h-[70vh] object-contain rounded-lg"
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button variant="secondary" size="sm" onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsPreviewOpen(true)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                    
                    <Button 
                      onClick={handleDownload}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ) : analysisResult ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Análise de Fundo - Gemini
                    </h3>
                    <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed whitespace-pre-wrap">
                      {analysisResult}
                    </p>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                      💡 Como usar esta análise:
                    </h4>
                    <ul className="text-green-800 dark:text-green-200 text-sm space-y-1">
                      <li>• Copie a descrição do fundo sugerida pelo Gemini</li>
                      <li>• Use em geradores como DALL-E, Midjourney ou Stable Diffusion</li>
                      <li>• Adicione "professional product photography" para melhor resultado</li>
                      <li>• Experimente com diferentes estilos (realistic, minimalist, luxury)</li>
                    </ul>
                  </div>
                  
                  <Button 
                    onClick={() => navigator.clipboard.writeText(analysisResult)}
                    className="w-full"
                    variant="outline"
                  >
                    📋 Copiar Análise para Área de Transferência
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Wand2 className="h-12 w-12 mb-2" />
                  <p>Sua imagem com novo fundo aparecerá aqui</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Galeria - Imagens com Cenário */}
        {multipleImages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎨 Galeria - Imagens com Cenário
                <Badge variant="secondary">{multipleImages.length} gerada{multipleImages.length !== 1 ? 's' : ''}</Badge>
              </CardTitle>
              <CardDescription>
                Imagens geradas pelo Gemini Nano Banana - Clique para baixar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* White Background Selection UI */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">🎨 Gerar Fundo Branco</h3>
                    <div className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 px-2 py-1 rounded-full text-xs font-medium">
                      {selectedImagesForWhiteBg.length}/2 selecionadas
                    </div>
                  </div>
                  <Button
                    onClick={handleGenerateWhiteBgImages}
                    disabled={selectedImagesForWhiteBg.length === 0 || isGeneratingWhiteBg}
                    size="sm"
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  >
                    {isGeneratingWhiteBg ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        🎨 Gerar Fundo Branco nas {selectedImagesForWhiteBg.length > 0 ? selectedImagesForWhiteBg.length : ''} Imagem{selectedImagesForWhiteBg.length !== 1 ? 'ns' : ''} Selecionada{selectedImagesForWhiteBg.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Clique nas imagens abaixo para selecioná-las (máximo 2) e gerar versões com fundo 100% branco usando Gemini AI.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {multipleImages.map((imgUrl, index) => {
                  const isSelected = selectedImagesForWhiteBg.includes(imgUrl);
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div 
                        className={`aspect-square border-2 rounded-lg overflow-hidden bg-white relative cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'border-emerald-500 shadow-lg ring-2 ring-emerald-200 dark:ring-emerald-800' 
                            : 'border-muted hover:border-emerald-300'
                        }`}
                        onClick={() => toggleImageSelection(imgUrl)}
                      >
                        <img 
                          src={imgUrl} 
                          alt={`Cenário ${index + 1}`} 
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                        {isSelected && (
                          <div className="absolute top-2 left-2 bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                            ✓
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white rounded px-2 py-1 text-xs">
                          #{index + 1}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(imgUrl, '_blank');
                          }}
                          className="flex-1 text-xs"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Ver
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadImage(imgUrl, 'gemini-cenario', index);
                          }}
                          className="flex-1 text-xs"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Baixar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Galeria - Fundo Branco */}
        {whiteBgImages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🤍 Galeria - Imagens com Fundo Branco
                <Badge variant="secondary">{whiteBgImages.length} gerada{whiteBgImages.length !== 1 ? 's' : ''}</Badge>
              </CardTitle>
              <CardDescription>
                Versões com fundo 100% branco - Clique para baixar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {whiteBgImages.map((imgUrl, index) => (
                  <div key={index} className="space-y-2">
                    <div className="aspect-square border border-muted rounded-lg overflow-hidden bg-white relative">
                      <img 
                        src={imgUrl} 
                        alt={`Fundo branco ${index + 1}`} 
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => window.open(imgUrl, '_blank')}
                      />
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(imgUrl, '_blank')}
                        className="flex-1 text-xs"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleDownloadImage(imgUrl, 'gemini-fundo-branco', index)}
                        className="flex-1 text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Baixar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GeminiBackgroundGenerator;
