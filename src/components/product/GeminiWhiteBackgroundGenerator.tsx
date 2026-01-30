import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Eye, Wand2, ChevronUp, ChevronDown, Scissors, ZoomIn } from 'lucide-react';
import { useRunwareTest } from '@/hooks/useRunwareTest';
import { useImageResizer } from '@/hooks/useImageResizer';
import { toast } from 'sonner';

interface RunwareBackgroundProcessorProps {
  productName: string;
  productId: string;
}

const RunwareBackgroundProcessor = ({ productName, productId }: RunwareBackgroundProcessorProps) => {
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [processedImages, setProcessedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string>('');
  const [processType, setProcessType] = useState<'removeBackground' | 'upscale'>('removeBackground');

  const { removeBackground, upscaleImage, isProcessing: runwareProcessing } = useRunwareTest();
  const { resizeImageTo1000x1000 } = useImageResizer();

  // Escutar eventos para receber imagens da Galeria de IA
  useEffect(() => {
    const handleImageGenerated = (event: CustomEvent) => {
      const { source, images, productId: eventProductId } = event.detail;
      
      if (eventProductId === productId) {
        console.log(`✅ [RUNWARE PROCESSOR] Recebendo imagens de ${source}:`, images?.length || 0);
        
        if (images && Array.isArray(images) && images.length > 0) {
          setGalleryImages(prevImages => {
            const newImages = [...prevImages];
            images.forEach((imageUrl: string) => {
              if (!newImages.includes(imageUrl)) {
                newImages.push(imageUrl);
              }
            });
            
            if (newImages.length > prevImages.length) {
              const addedCount = newImages.length - prevImages.length;
              toast.info(`📸 ${addedCount} novas imagens adicionadas da galeria!`);
            }
            
            return newImages;
          });
        }
      }
    };

    window.addEventListener('imageGenerated', handleImageGenerated as EventListener);
    return () => {
      window.removeEventListener('imageGenerated', handleImageGenerated as EventListener);
    };
  }, [productId]);

  // Funções de controle de seleção
  const toggleImageSelection = (imageUrl: string) => {
    setSelectedImages(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(imageUrl)) {
        newSelection.delete(imageUrl);
      } else {
        newSelection.add(imageUrl);
      }
      return newSelection;
    });
  };

  const selectAllImages = () => {
    setSelectedImages(new Set(galleryImages));
  };

  const clearSelection = () => {
    setSelectedImages(new Set());
  };

  const processImageWithRunware = async (imageUrl: string): Promise<string | null> => {
    try {
      let result;
      
      if (processType === 'removeBackground') {
        console.log('🔍 [RUNWARE] Removendo fundo da imagem...');
        result = await removeBackground(imageUrl);
      } else {
        console.log('🔍 [RUNWARE] Aplicando upscale na imagem...');
        result = await upscaleImage(imageUrl, 4); // 4x upscale
      }
      
      console.log('📥 [RUNWARE] Resultado:', result);
      
      if (result.success && result.data) {
        // Verificar diferentes estruturas de resposta
        const processedImageUrl = result.data.imageURL || result.data[0]?.imageURL || result.data.image_url || result.data[0]?.image_url;
        
        if (processedImageUrl) {
          return processedImageUrl;
        } else {
          console.error('❌ [RUNWARE] URL da imagem processada não encontrada:', result.data);
          toast.error(`Erro: URL da imagem não encontrada na resposta`);
          return null;
        }
      } else {
        console.error('❌ [RUNWARE] Erro ao processar:', result.error);
        toast.error(`Erro ao processar imagem: ${result.error}`);
        return null;
      }
    } catch (error) {
      console.error('❌ [RUNWARE] Erro inesperado:', error);
      toast.error('Erro inesperado ao processar imagem');
      return null;
    }
  };

  const handleProcessSelectedImages = async () => {
    if (selectedImages.size === 0) {
      toast.error('Selecione pelo menos uma imagem para processar');
      return;
    }

    const imagesToProcess = Array.from(selectedImages);
    setIsProcessing(true);
    setProcessedImages([]);
    setCurrentProcessingIndex(0);

    const processTypeLabel = processType === 'removeBackground' ? 'Removendo fundo' : 'Aplicando upscale';
    console.log(`🚀 [RUNWARE] Iniciando ${processTypeLabel} em ${imagesToProcess.length} imagens...`);
    toast.info(`🚀 ${processTypeLabel} em ${imagesToProcess.length} imagens...`);

    const results: string[] = [];

    for (let i = 0; i < imagesToProcess.length; i++) {
      setCurrentProcessingIndex(i);
      console.log(`🔄 [RUNWARE] Processando imagem ${i + 1}/${imagesToProcess.length}`);
      toast.info(`Processando imagem ${i + 1}/${imagesToProcess.length}...`);

      const result = await processImageWithRunware(imagesToProcess[i]);
      
      if (result) {
        results.push(result);
        console.log(`✅ [RUNWARE] Imagem ${i + 1} processada com sucesso`);
      } else {
        console.log(`❌ [RUNWARE] Falha ao processar imagem ${i + 1}`);
      }

      // Pequena pausa entre processamentos
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setProcessedImages(results);
    setIsProcessing(false);
    
    console.log(`🎉 [RUNWARE] Processamento concluído: ${results.length}/${imagesToProcess.length} imagens processadas`);
    toast.success(`🎉 ${processTypeLabel} aplicado em ${results.length} imagens!`);
    
    // 🚀 ENVIAR IMAGENS PROCESSADAS PARA A GALERIA DE IA
    if (results.length > 0) {
      // 🔄 Converter Base64 → Blob URL ANTES de enviar para galeria
      console.log(`🔄 [RUNWARE PROCESSOR] Convertendo ${results.length} imagens para Blob...`);
      const blobUrls = await Promise.all(
        results.map(img => resizeImageTo1000x1000(img))
      );
      console.log('✅ [RUNWARE PROCESSOR] Conversão Blob concluída para todas as imagens');
      
      console.log('📤 [RUNWARE PROCESSOR] Enviando imagens processadas para a galeria:', blobUrls);
      
      const sourceLabel = processType === 'removeBackground' ? 'Fundo' : 'Scale';
      
      const event = new CustomEvent('imageGenerated', {
        detail: {
          source: sourceLabel,
          images: blobUrls, // ✅ Usar Blob URLs
          productId: productId,
          timestamp: Date.now(),
          batchComplete: true,
          batchId: `runware-processor-${productId}-${Date.now()}`
        }
      });
      
      window.dispatchEvent(event);
    }
  };

  const handleDownloadAll = () => {
    processedImages.forEach((imageUrl, index) => {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `${productName}-fundo-branco-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
    
    toast.success(`📥 Download de ${processedImages.length} imagens iniciado!`);
  };

  const handlePreview = (imageUrl: string) => {
    setSelectedPreviewImage(imageUrl);
    setIsPreviewOpen(true);
  };

  const clearImages = () => {
    setGalleryImages([]);
    setSelectedImages(new Set());
    setProcessedImages([]);
    toast.info('🗑️ Imagens removidas');
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              Runware - Fundo/Scale
            </CardTitle>
            <CardDescription>
              🔧 Processe imagens da Galeria de IA com Runware: Removedor de Fundo ou Upscale
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Informações */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>🔧 MANUAL:</strong> Selecione imagens da Galeria de IA e escolha entre Removedor de Fundo ou Upscale do Runware!
            </p>
          </div>

          {/* Tipo de processamento */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tipo de Processamento:</Label>
            <RadioGroup value={processType} onValueChange={(value) => setProcessType(value as 'removeBackground' | 'upscale')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="removeBackground" id="removeBackground" />
                <Label htmlFor="removeBackground" className="flex items-center gap-2 cursor-pointer">
                  <Scissors className="h-4 w-4" />
                  Removedor de Fundo
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="upscale" id="upscale" />
                <Label htmlFor="upscale" className="flex items-center gap-2 cursor-pointer">
                  <ZoomIn className="h-4 w-4" />
                  Upscale (4x)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-muted rounded-lg p-3">
              <div className="text-2xl font-bold text-primary">{galleryImages.length}</div>
              <div className="text-xs text-muted-foreground">Da Galeria</div>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-600">{selectedImages.size}</div>
              <div className="text-xs text-muted-foreground">Selecionadas</div>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="text-2xl font-bold text-green-600">{processedImages.length}</div>
              <div className="text-xs text-muted-foreground">Processadas</div>
            </div>
          </div>

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{processType === 'removeBackground' ? 'Removendo fundo' : 'Aplicando upscale'} com Runware...</span>
                <span>{Math.round((currentProcessingIndex / selectedImages.size) * 100)}%</span>
              </div>
              <Progress value={(currentProcessingIndex / selectedImages.size) * 100} className="w-full" />
            </div>
          )}

          {/* Controles de seleção */}
          {galleryImages.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={selectAllImages}
                variant="outline"
                size="sm"
              >
                Selecionar Todas
              </Button>
              <Button 
                onClick={clearSelection}
                variant="outline"
                size="sm"
              >
                Limpar Seleção
              </Button>
            </div>
          )}

          {/* Controles principais */}
          <div className="flex gap-2">
            <Button 
              onClick={handleProcessSelectedImages}
              disabled={isProcessing || selectedImages.size === 0}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Wand2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando... ({currentProcessingIndex + 1}/{selectedImages.size})
                </>
              ) : (
                <>
                  {processType === 'removeBackground' ? (
                    <Scissors className="mr-2 h-4 w-4" />
                  ) : (
                    <ZoomIn className="mr-2 h-4 w-4" />
                  )}
                  {processType === 'removeBackground' ? 'Remover Fundo' : 'Aplicar Upscale'} ({selectedImages.size})
                </>
              )}
            </Button>

            {processedImages.length > 0 && (
              <Button 
                onClick={handleDownloadAll}
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Download ({processedImages.length})
              </Button>
            )}

            {galleryImages.length > 0 && (
              <Button 
                onClick={clearImages}
                variant="destructive"
                size="sm"
              >
                🗑️ Limpar
              </Button>
            )}
          </div>

          {/* Imagens da galeria */}
          {galleryImages.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Imagens da Galeria de IA ({galleryImages.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {galleryImages.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <div 
                      className={`relative border-2 rounded-lg cursor-pointer transition-all ${
                        selectedImages.has(imageUrl) 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleImageSelection(imageUrl)}
                    >
                      <img 
                        src={imageUrl} 
                        alt={`Galeria ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      
                      {/* Checkbox de seleção */}
                      <div className="absolute top-2 left-2">
                        <Checkbox 
                          checked={selectedImages.has(imageUrl)}
                          onChange={() => toggleImageSelection(imageUrl)}
                          className="bg-white shadow-md"
                        />
                      </div>
                      
                      {/* Botão de preview */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(imageUrl);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Imagens processadas */}
          {processedImages.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">
                Imagens Processadas ({processedImages.length}) - {processType === 'removeBackground' ? 'Fundo Removido' : 'Upscale Aplicado'}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {processedImages.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={imageUrl} 
                      alt={`Processada ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border cursor-pointer"
                      onClick={() => handlePreview(imageUrl)}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-1">
                      <Button variant="secondary" size="sm" onClick={() => handlePreview(imageUrl)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estado vazio */}
          {galleryImages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground border-2 border-dashed rounded-lg">
              <Wand2 className="h-8 w-8 mb-2" />
              <p className="text-sm">Aguardando imagens da Galeria de IA...</p>
              <p className="text-xs mt-1">Gere imagens com qualquer IA para processá-las aqui</p>
            </div>
          )}
        </CardContent>
      )}

      {/* Modal de preview */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>Preview da Imagem</DialogTitle>
            <DialogDescription>
              Imagem processada com Runware
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <img 
              src={selectedPreviewImage} 
              alt="Preview da imagem processada"
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default RunwareBackgroundProcessor;