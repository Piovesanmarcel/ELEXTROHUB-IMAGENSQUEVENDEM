import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  Layers,
  RefreshCw,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { useHostedImages, HostedImage } from '@/hooks/useHostedImages';
import { HOSTED_DISPLAY_ORDER, HOSTED_SOURCE_CONFIGS } from '@/constants/galleryDisplay';
import { ReplicateImagesModal } from './ReplicateImagesModal';

interface HostedImagesGalleryHierarchicalProps {
  productId?: string;
  productName?: string;
}

export const HostedImagesGalleryHierarchical = ({ 
  productId, 
  productName 
}: HostedImagesGalleryHierarchicalProps) => {
  const { 
    hostedImages, 
    loading, 
    error,
    deleteHostedImage, 
    fetchHostedImages 
  } = useHostedImages();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<HostedImage | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [isReplicateModalOpen, setIsReplicateModalOpen] = useState(false);

  // Filtrar imagens hospedadas (r2_path preenchido, sem tag 'not-hosted')
  const filteredImages = useMemo(() => {
    const hostedOnly = hostedImages.filter(img => 
      img.r2_path && 
      img.r2_path !== '' && 
      !img.tags?.includes('not-hosted')
    );
    
    if (!productId) return hostedOnly;
    return hostedOnly.filter(image => 
      image.tags?.includes(`product:${productId}`) ||
      image.description?.includes(productId)
    );
  }, [hostedImages, productId]);

  // Agrupar imagens por source:XXX-hosted ou source:XXX (tolerante)
  const imagesBySource = useMemo(() => {
    const grouped: Record<string, HostedImage[]> = {};
    
    filteredImages.forEach(image => {
      // Primeiro tentar encontrar tag source:XXX-hosted
      let sourceTag = image.tags?.find(tag => tag.startsWith('source:') && tag.endsWith('-hosted'));
      
      if (sourceTag) {
        const sourceKey = sourceTag.replace('source:', '');
        if (!grouped[sourceKey]) {
          grouped[sourceKey] = [];
        }
        grouped[sourceKey].push(image);
      } else {
        // Se não encontrar -hosted, procurar source:XXX simples e verificar se está na configuração
        const simpleSourceTag = image.tags?.find(tag => tag.startsWith('source:'));
        if (simpleSourceTag) {
          const sourceKey = simpleSourceTag.replace('source:', '');
          // Verificar se essa source está configurada em HOSTED_DISPLAY_ORDER
          if (HOSTED_DISPLAY_ORDER.includes(sourceKey)) {
            if (!grouped[sourceKey]) {
              grouped[sourceKey] = [];
            }
            grouped[sourceKey].push(image);
          }
        }
      }
    });
    
    return grouped;
  }, [filteredImages]);

  // Fetch images when component mounts or productId changes
  useEffect(() => {
    fetchHostedImages(productId);
  }, [fetchHostedImages, productId]);

  // Escutar eventos de nova imagem hospedada
  useEffect(() => {
    const handleHostedImageSaved = () => {
      console.log('🔄 Nova imagem hospedada detectada, atualizando galeria hierárquica...');
      fetchHostedImages(productId);
    };

    window.addEventListener('hostedImageSaved', handleHostedImageSaved);
    return () => window.removeEventListener('hostedImageSaved', handleHostedImageSaved);
  }, [fetchHostedImages, productId]);

  const handleUseForAds = (images: HostedImage[]) => {
    const imageUrls = images.map(img => img.url).join('\n');
    navigator.clipboard.writeText(imageUrls);
    toast.success(`${images.length} URLs copiadas para usar em anúncios!`);
  };

  const handleImagePreview = (image: HostedImage) => {
    setSelectedImage(image);
    setIsPreviewOpen(true);
  };

  const handleDownloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Download iniciado!');
    } catch (error) {
      toast.error('Erro ao fazer download da imagem');
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copiada!');
  };

  const handleDeleteImage = async (imageId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta imagem?')) {
      try {
        await deleteHostedImage(imageId);
        toast.success('Imagem excluída com sucesso!');
        if (selectedImage?.id === imageId) {
          setIsPreviewOpen(false);
        }
      } catch (error) {
        toast.error('Erro ao excluir imagem');
      }
    }
  };

  const toggleSource = (key: string) => {
    setExpandedSources(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getImageType = (image: HostedImage): string => {
    if (image.tags?.includes('type:upscaled-4x')) return 'upscaled-4x';
    if (image.tags?.includes('type:upscaled-2x')) return 'upscaled-2x';
    if (image.tags?.includes('type:original-fallback')) return 'original-fallback';
    if (image.tags?.includes('type:marketing-ready')) return 'marketing-ready';
    if (image.tags?.includes('type:background-removed')) return 'background-removed';
    if (image.tags?.includes('type:enhanced')) return 'enhanced';
    return 'original';
  };

  const totalImages = filteredImages.length;

  // Error state with retry
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
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
              <Layers className="h-4 w-4" />
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
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Carregando imagens...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No product selected state
  if (!productId) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Galeria Hierárquica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecione um produto para ver as imagens hospedadas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Galeria de Imagens Hospedadas {productName && `- ${productName}`}
              <Badge variant="secondary" className="ml-2">
                {totalImages} imagens
              </Badge>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {totalImages > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsReplicateModalOpen(true)}
                    className="flex items-center gap-1"
                  >
                    <Share2 className="h-4 w-4" />
                    Replicar para SKUs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUseForAds(filteredImages)}
                    className="flex items-center gap-1"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Usar Todas ({totalImages})
                  </Button>
                </>
              )}
              
              {/* Botão Atualizar */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchHostedImages(productId);
                  toast.success('Galeria atualizada!');
                }}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
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
        </CardHeader>

        {isExpanded && (
          <CardContent className="space-y-4">
            {totalImages === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Cloud className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma imagem hospedada encontrada</p>
                {productName && (
                  <p className="text-sm">Para o produto: {productName}</p>
                )}
              </div>
            ) : (
              // Renderizar blocos na ordem definida
              HOSTED_DISPLAY_ORDER.map(sourceKey => {
                const images = imagesBySource[sourceKey] || [];
                const config = HOSTED_SOURCE_CONFIGS[sourceKey];
                
                if (images.length === 0) return null;

                return (
                  <Collapsible 
                    key={sourceKey}
                    open={expandedSources[sourceKey]}
                    onOpenChange={() => toggleSource(sourceKey)}
                  >
                    <CollapsibleTrigger asChild>
                      <Card className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${config.color}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{config.icon}</span>
                              <div>
                                <h3 className="font-semibold text-base">{config.name}</h3>
                                <p className="text-xs opacity-70">{config.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="font-medium">
                                {images.length}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUseForAds(images);
                                }}
                              >
                                <ShoppingBag className="h-4 w-4" />
                              </Button>
                              {expandedSources[sourceKey] ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4 ml-6">
                        {images.map((image) => (
                          <Card key={image.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                            <div className="aspect-square relative bg-muted">
                              <img
                                src={image.url}
                                alt={image.original_filename}
                                className="w-full h-full object-contain cursor-pointer"
                                onClick={() => handleImagePreview(image)}
                              />
                              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleImagePreview(image);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyUrl(image.url);
                                  }}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <CardContent className="p-3">
                              <p className="text-xs font-medium truncate" title={image.filename}>
                                {image.filename}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-muted-foreground">
                                  {formatFileSize(image.file_size)}
                                </span>
                                {image.width && image.height && (
                                  <span className="text-xs text-muted-foreground">
                                    {image.width}x{image.height}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-1 mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 h-7 text-xs"
                                  onClick={() => handleDownloadImage(image.url, image.filename)}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Baixar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleDeleteImage(image.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })
            )}
          </CardContent>
        )}
      </Card>

      {/* Preview Dialog */}
      {selectedImage && (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {selectedImage.filename}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.filename}
                  className="max-w-full max-h-96 object-contain rounded-lg"
                />
              </div>
              
              {/* Metadados */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Tamanho:</strong> {formatFileSize(selectedImage.file_size)}
                </div>
                <div>
                  <strong>Tipo:</strong> {selectedImage.file_type}
                </div>
                {selectedImage.width && selectedImage.height && (
                  <>
                    <div>
                      <strong>Dimensões:</strong> {selectedImage.width} x {selectedImage.height}
                    </div>
                  </>
                )}
                <div>
                  <strong>Upload:</strong> {new Date(selectedImage.uploaded_at).toLocaleString()}
                </div>
              </div>

              {/* Tags */}
              {selectedImage.tags && selectedImage.tags.length > 0 && (
                <div>
                  <strong className="text-sm">Tags:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedImage.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Descrição */}
              {selectedImage.description && (
                <div>
                  <strong className="text-sm">Descrição:</strong>
                  <p className="text-sm text-muted-foreground mt-1">{selectedImage.description}</p>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleCopyUrl(selectedImage.url)}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar URL
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDownloadImage(selectedImage.url, selectedImage.filename)}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedImage.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Replicate Images Modal */}
      <ReplicateImagesModal
        isOpen={isReplicateModalOpen}
        onClose={() => setIsReplicateModalOpen(false)}
        sourceProductId={productId || ''}
        sourceProductName={productName}
        imagesToReplicate={filteredImages}
      />
    </>
  );
};