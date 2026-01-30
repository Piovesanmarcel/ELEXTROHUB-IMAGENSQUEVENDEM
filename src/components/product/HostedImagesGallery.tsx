import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HostedImagesGalleryHierarchical } from './HostedImagesGalleryHierarchical';
import { 
  Cloud, 
  Eye, 
  Download, 
  Copy, 
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Trash2,
  Grid3X3,
  BarChart3,
  Layers,
  ToggleLeft,
  ToggleRight,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useHostedImages, HostedImage } from '@/hooks/useHostedImages';

interface HostedImagesGalleryProps {
  productId?: string;
  productName?: string;
}

const SOURCE_CONFIGS = {
  // Originais
  'runware': { 
    name: '⚡ IA Avançada - Runware', 
    color: 'bg-blue-100 text-blue-800' 
  },
  'gemini-white-background': { 
    name: '🤖 Gemini - Fundo Branco', 
    color: 'bg-gray-100 text-gray-800' 
  },
  'gemini-background': { 
    name: '🎨 Gerador de fundo - Gemini AI', 
    color: 'bg-orange-100 text-orange-800' 
  },
  'bfl': { 
    name: '🖼️ Gerador BFL.ai', 
    color: 'bg-indigo-100 text-indigo-800' 
  },
  'bfl-white-bg': { 
    name: '⚪ BFL.ai - Fundo Branco', 
    color: 'bg-slate-100 text-slate-800' 
  },
  'runway': { 
    name: '🎬 Runway AI - Gen4', 
    color: 'bg-red-100 text-red-800' 
  },
  'marketing-gatilhos-gemini': { 
    name: '🎯 Marketing Gatilhos - Gemini AI', 
    color: 'bg-purple-100 text-purple-800' 
  },
  'marketing-gatilhos-runware': { 
    name: '🎯 Marketing Gatilhos - Runware', 
    color: 'bg-blue-100 text-blue-800' 
  },
  'marketing-gatilhos-bfl': { 
    name: '🎯 Marketing Gatilhos - BFL.ai', 
    color: 'bg-indigo-100 text-indigo-800' 
  },
  'cloudinary-kit': { 
    name: '🎬 Gerador Automático de KITs', 
    color: 'bg-pink-100 text-pink-800' 
  },
  'deepai-enhancement': { 
    name: '✨ Melhoria com DeepAI', 
    color: 'bg-emerald-100 text-emerald-800' 
  },
  
  // Versões hospedadas (separadas)
  'runware-hosted': { 
    name: '☁️ Hospedagem - Runware', 
    color: 'bg-blue-200 text-blue-900' 
  },
  'gemini-white-background-hosted': { 
    name: '☁️ Hospedagem - Gemini Fundo Branco', 
    color: 'bg-gray-200 text-gray-900' 
  },
  'gemini-background-hosted': { 
    name: '☁️ Hospedagem - Gemini AI', 
    color: 'bg-orange-200 text-orange-900' 
  },
  'bfl-hosted': { 
    name: '☁️ Hospedagem - BFL.ai', 
    color: 'bg-indigo-200 text-indigo-900' 
  },
  'bfl-white-bg-hosted': { 
    name: '☁️ Hospedagem - BFL Fundo Branco', 
    color: 'bg-slate-200 text-slate-900' 
  },
  'runway-hosted': { 
    name: '☁️ Hospedagem - Runway AI', 
    color: 'bg-red-200 text-red-900' 
  },
  'marketing-gatilhos-gemini-hosted': { 
    name: '☁️ Hospedagem - Gatilhos Gemini', 
    color: 'bg-purple-200 text-purple-900' 
  },
  'marketing-gatilhos-runware-hosted': { 
    name: '☁️ Hospedagem - Gatilhos Runware', 
    color: 'bg-blue-200 text-blue-900' 
  },
  'marketing-gatilhos-bfl-hosted': { 
    name: '☁️ Hospedagem - Gatilhos BFL', 
    color: 'bg-indigo-200 text-indigo-900' 
  },
  'cloudinary-kit-hosted': { 
    name: '☁️ Hospedagem - KITs', 
    color: 'bg-pink-200 text-pink-900' 
  },
  'stability': { 
    name: '🎨 Gerador StabilityAI', 
    color: 'bg-teal-100 text-teal-800' 
  },
  'stability-hosted': { 
    name: '☁️ Hospedagem - StabilityAI', 
    color: 'bg-teal-200 text-teal-900' 
  },
  
  'runware-upscale': {
    name: 'IA Avançada - Upscale 4x Runware', 
    color: 'bg-yellow-100 text-yellow-800' 
  },
  'outros': { 
    name: 'Outros', 
    color: 'bg-gray-100 text-gray-800' 
  }
} as const;

// Ordem fixa de exibição (apenas categorias com imagens serão mostradas)
const DISPLAY_ORDER = [
  // Originais
  'runware',
  'gemini-white-background',
  'gemini-background',
  'bfl',
  'bfl-white-bg',
  'runway',
  'marketing-gatilhos-gemini',
  'marketing-gatilhos-runware',
  'marketing-gatilhos-bfl',
  'cloudinary-kit',
  'deepai-enhancement',
  
  // Hospedados (separados)
  'runware-hosted',
  'gemini-white-background-hosted',
  'gemini-background-hosted',
  'bfl-hosted',
  'bfl-white-bg-hosted',
  'runway-hosted',
  'marketing-gatilhos-gemini-hosted',
  'marketing-gatilhos-runware-hosted',
  'marketing-gatilhos-bfl-hosted',
  'cloudinary-kit-hosted',
  'stability',
  'stability-hosted'
] as const;

export const HostedImagesGallery = ({ productId, productName }: HostedImagesGalleryProps) => {
  const { 
    hostedImages, 
    loading, 
    error,
    deleteHostedImage, 
    getImagesBySource, 
    getStorageStats,
    fetchHostedImages 
  } = useHostedImages();
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [useHierarchicalView, setUseHierarchicalView] = useState(true);
  const [selectedImage, setSelectedImage] = useState<HostedImage | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Fetch images when component mounts or productId changes
  useEffect(() => {
    fetchHostedImages(productId);
  }, [fetchHostedImages, productId]);

  // Listen for hosted image events to refresh gallery
  useEffect(() => {
    const handleHostedImageSaved = () => {
      console.log('🔄 [GALLERY] Evento hostedImageSaved detectado, atualizando galeria...');
      fetchHostedImages(productId);
    };

    window.addEventListener('hostedImageSaved', handleHostedImageSaved);
    
    return () => {
      window.removeEventListener('hostedImageSaved', handleHostedImageSaved);
    };
  }, [fetchHostedImages, productId]);

  // Filter images by product if productId is provided (server-side filtering already done, this is fallback)
  const filteredImages = useMemo(() => {
    // ✅ ETAPA 1: Filtrar APENAS imagens realmente hospedadas
    const hostedOnly = hostedImages.filter(img => 
      img.r2_path && 
      img.r2_path !== '' && 
      !img.tags.includes('not-hosted') // ← Novo filtro para excluir não-hospedadas
    );
    
    if (!productId) return hostedOnly;
    // Server already filtered by productId, but keep client-side as safety
    return hostedOnly.filter(img => 
      img.tags.includes(`product:${productId}`) ||
      img.description?.includes(productId)
    );
  }, [hostedImages, productId]);

  const imagesBySource = useMemo(() => {
    console.log('🔄 [GALLERY] Recalculando imagesBySource...', {
      totalImages: filteredImages.length,
      sources: [...new Set(filteredImages.map(img => 
        img.tags.find(tag => tag.startsWith('source:'))?.replace('source:', '') || 
        img.tags.find(tag => tag.startsWith('ai-source:'))?.replace('ai-source:', '') || 
        'outros'
      ))]
    });
    
    return filteredImages.reduce((acc, img) => {
      // ✅ ETAPA 3: Priorizar source: (hospedadas), fallback para ai-source:
      let source = img.tags.find(tag => tag.startsWith('source:'))?.replace('source:', '');
      
      // ✅ Fallback: usar ai-source: se não tiver source:
      if (!source) {
        const aiSource = img.tags.find(tag => tag.startsWith('ai-source:'))?.replace('ai-source:', '');
        source = aiSource || 'outros';
      }
      
      if (!acc[source]) {
        acc[source] = [];
      }
      acc[source].push(img);
      return acc;
    }, {} as Record<string, HostedImage[]>);
  }, [filteredImages]);

  const storageStats = getStorageStats();

  const handlePreview = (image: HostedImage) => {
    setSelectedImage(image);
    setIsPreviewOpen(true);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copiada para o clipboard!');
  };

  const handleDownload = async (image: HostedImage) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = image.original_filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast.success('Download iniciado!');
    } catch (error) {
      toast.error('Erro ao fazer download da imagem');
    }
  };

  const handleDelete = async (image: HostedImage) => {
    if (confirm('Tem certeza que deseja excluir esta imagem hospedada?')) {
      await deleteHostedImage(image.id);
    }
  };

  const handleUseForAds = (images: HostedImage[]) => {
    const urls = images.map(img => img.url);
    toast.success(`${urls.length} imagens selecionadas para anúncios!`);
    
    // Dispatch event for ad tools integration
    const event = new CustomEvent('hostedImagesForAds', {
      detail: {
        images: urls,
        productId,
        productName
      }
    });
    window.dispatchEvent(event);
  };

  // Error state with retry
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Erro ao Carregar Imagens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">{error}</div>
            <Button 
              onClick={() => fetchHostedImages(productId)}
              className="flex items-center gap-2"
            >
              <Cloud className="h-4 w-4" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Carregando Imagens Hospedadas...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  // No product selected state
  if (!productId) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Imagens Hospedadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Cloud className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecione um produto para ver as imagens hospedadas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalImages = filteredImages.length;

  // Renderizar visão hierárquica se selecionada
  if (useHierarchicalView) {
    return <HostedImagesGalleryHierarchical productId={productId} productName={productName} />;
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Imagens Hospedadas {productName && `- ${productName}`}
              <Badge variant="secondary" className="ml-2">
                {totalImages} imagens
              </Badge>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {totalImages > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUseForAds(filteredImages)}
                  className="flex items-center gap-1"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Usar em Anúncios ({totalImages})
                </Button>
              )}

              {/* Botão Atualizar */}
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  toast.info('Atualizando galeria...');
                  await fetchHostedImages(productId);
                  toast.success('Galeria atualizada com sucesso!');
                  console.log('✅ [GALLERY] Galeria atualizada manualmente');
                }}
                disabled={loading}
                className="flex items-center gap-1"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>

              {/* Toggle entre visualizações */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUseHierarchicalView(!useHierarchicalView)}
                className="flex items-center gap-1"
              >
                {useHierarchicalView ? (
                  <>
                    <Grid3X3 className="h-4 w-4" />
                    Clássica
                  </>
                ) : (
                  <>
                    <Layers className="h-4 w-4" />
                    Hierárquica
                  </>
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Recolher
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Expandir
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Storage Statistics */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              {storageStats.totalSizeGB}GB utilizados
            </div>
            <div className="flex items-center gap-1">
              <Grid3X3 className="h-4 w-4" />
              {Object.keys(imagesBySource).length} fontes de IA
            </div>
          </div>
        </CardHeader>

        {isExpanded && totalImages > 0 && (
          <CardContent className="space-y-6">
            {DISPLAY_ORDER.map((source) => {
              const images = imagesBySource[source];
              if (!images || images.length === 0) return null; // Pular se não tiver imagens
              
              const sourceConfig = SOURCE_CONFIGS[source as keyof typeof SOURCE_CONFIGS] || SOURCE_CONFIGS.outros;
              
              return (
                <div key={source} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={sourceConfig.color}>
                        {sourceConfig.name}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        ({images.length} {images.length === 1 ? 'imagem' : 'imagens'})
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUseForAds(images)}
                      className="flex items-center gap-1"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Usar todas ({images.length})
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {images.map((image) => (
                      <div
                        key={image.id}
                        className="relative group bg-muted rounded-lg overflow-hidden aspect-square"
                      >
                        <img
                          src={image.url}
                          alt={image.original_filename}
                          className="w-full h-full object-cover"
                        />
                        
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handlePreview(image)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleCopyUrl(image.url)}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDownload(image)}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(image)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="absolute top-1 right-1 flex items-center gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(image.file_size / 1024)}KB
                          </Badge>
                          
                          {/* Indicador de "recém processada" - últimas 24h */}
                          {(() => {
                            const uploadTime = new Date(image.uploaded_at).getTime();
                            const now = Date.now();
                            const hoursSinceUpload = (now - uploadTime) / (1000 * 60 * 60);
                            
                            return hoursSinceUpload <= 24 && (
                              <Badge 
                                variant="default" 
                                className="text-xs bg-green-600 hover:bg-green-700 animate-pulse"
                              >
                                NOVO
                              </Badge>
                            );
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        )}

        {isExpanded && totalImages === 0 && (
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Cloud className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma imagem hospedada encontrada</p>
              {productName ? (
                <p className="text-sm">Nenhuma imagem encontrada para o produto: {productName}</p>
              ) : (
                <p className="text-sm">As imagens hospedadas aparecerão aqui após o upload para o R2</p>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Preview Dialog */}
      {selectedImage && (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                {selectedImage.original_filename}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <img
                src={selectedImage.url}
                alt={selectedImage.original_filename}
                className="w-full max-h-96 object-contain rounded-lg"
              />
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleCopyUrl(selectedImage.url)}
                  className="flex items-center gap-1"
                >
                  <Copy className="h-4 w-4" />
                  Copiar URL
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleDownload(selectedImage)}
                  className="flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedImage.url, '_blank')}
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir em Nova Aba
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleUseForAds([selectedImage])}
                  className="flex items-center gap-1"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Usar em Anúncios
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Tamanho:</strong> {Math.round(selectedImage.file_size / 1024)}KB</p>
                  <p><strong>Tipo:</strong> {selectedImage.file_type}</p>
                </div>
                <div>
                  {selectedImage.width && selectedImage.height && (
                    <p><strong>Dimensões:</strong> {selectedImage.width}x{selectedImage.height}px</p>
                  )}
                  <p><strong>Hospedado em:</strong> {new Date(selectedImage.uploaded_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};