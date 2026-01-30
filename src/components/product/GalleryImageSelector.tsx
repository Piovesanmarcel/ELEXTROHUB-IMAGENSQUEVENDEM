import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Image as ImageIcon, AlertCircle, Globe, HardDrive } from "lucide-react";
import { useHostedImages } from "@/hooks/useHostedImages";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface GalleryImageSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (selectedUrls: string[]) => void;
  productId?: string;
  maxSelection?: number;
  availableImages?: string[]; // Imagens da galeria do produto
}

export function GalleryImageSelector({ 
  open, 
  onOpenChange, 
  onConfirm,
  productId,
  maxSelection = 10,
  availableImages = []
}: GalleryImageSelectorProps) {
  const { hostedImages, loading, fetchHostedImages } = useHostedImages();
  const [selectedImageUrls, setSelectedImageUrls] = useState<string[]>([]);

  // Helper para verificar se é uma URL https válida (não blob/data)
  const isValidHttpsUrl = (url: string): boolean => {
    return url.startsWith('https://') || url.startsWith('http://');
  };

  // Helper para obter tipo de URL
  const getUrlType = (url: string): 'https' | 'blob' | 'data' | 'unknown' => {
    if (url.startsWith('https://') || url.startsWith('http://')) return 'https';
    if (url.startsWith('blob:')) return 'blob';
    if (url.startsWith('data:')) return 'data';
    return 'unknown';
  };

  // Combinar imagens disponíveis (prop) com imagens do hook (DeepAI)
  const allImages = useMemo(() => {
    // Converter URLs em objetos compatíveis
    const propImages = availableImages
      .filter(url => url && url.trim() !== '')
      .map((url, index) => ({
        id: `gallery-${index}`,
        url,
        original_filename: `Imagem ${index + 1}`,
        width: undefined as number | undefined,
        height: undefined as number | undefined,
        tags: productId ? [`product:${productId}`] : [],
        urlType: getUrlType(url) // ✅ NOVO: Adicionar tipo de URL
      }));
    
    // Evitar duplicatas baseado na URL
    const hostedUrls = new Set(hostedImages.map(img => img.url));
    const uniquePropImages = propImages.filter(img => !hostedUrls.has(img.url));
    
    // Adicionar tipo de URL às imagens do hook
    const hostedWithType = hostedImages.map(img => ({
      ...img,
      urlType: getUrlType(img.url)
    }));
    
    return [...uniquePropImages, ...hostedWithType];
  }, [availableImages, hostedImages, productId]);

  // Filtrar por produto se necessário
  // ✅ NOVO: Ordenar para mostrar URLs https primeiro (mais úteis)
  const filteredImages = useMemo(() => {
    const filtered = productId 
      ? allImages.filter(img => img.tags?.includes(`product:${productId}`) || img.id.startsWith('gallery-'))
      : allImages;
    
    // Ordenar: https primeiro, depois blob, depois data
    return [...filtered].sort((a, b) => {
      const order = { https: 0, blob: 1, data: 2, unknown: 3 };
      return (order[a.urlType] || 3) - (order[b.urlType] || 3);
    });
  }, [allImages, productId]);
  
  // Contar quantas imagens são https vs locais
  const httpsCount = filteredImages.filter(img => img.urlType === 'https').length;
  const localCount = filteredImages.length - httpsCount;

  const handleToggleImage = (url: string) => {
    setSelectedImageUrls(prev => {
      if (prev.includes(url)) {
        return prev.filter(u => u !== url);
      }
      if (prev.length >= maxSelection) {
        return prev;
      }
      return [...prev, url];
    });
  };

  const handleConfirm = () => {
    onConfirm(selectedImageUrls);
    setSelectedImageUrls([]);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedImageUrls([]);
    onOpenChange(false);
  };

  // Carregar imagens quando abrir o dialog
  useEffect(() => {
    if (open) {
      fetchHostedImages(productId);
    }
  }, [open, productId, fetchHostedImages]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Selecionar Imagens da Galeria</DialogTitle>
          <DialogDescription className="space-y-2">
            <span>
              Selecione até {maxSelection} imagens para usar na geração de templates
              {selectedImageUrls.length > 0 && ` (${selectedImageUrls.length} selecionadas)`}
            </span>
            {/* Indicador de tipos de imagem */}
            {filteredImages.length > 0 && (
              <div className="flex items-center gap-4 text-xs mt-2">
                <span className="flex items-center gap-1 text-green-600">
                  <Globe className="w-3 h-3" />
                  {httpsCount} hospedadas
                </span>
                {localCount > 0 && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <HardDrive className="w-3 h-3" />
                    {localCount} locais (serão convertidas)
                  </span>
                )}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
              <p>Nenhuma imagem encontrada na galeria</p>
              <p className="text-sm mt-2">Salve algumas imagens primeiro para selecioná-las aqui</p>
            </div>
          ) : (
            <TooltipProvider>
              <div className="grid grid-cols-3 gap-4">
                {filteredImages.map((image) => {
                  const isSelected = selectedImageUrls.includes(image.url);
                  const isHttps = image.urlType === 'https';
                  const isLocal = image.urlType === 'blob' || image.urlType === 'data';
                  
                  return (
                    <Tooltip key={image.id}>
                      <TooltipTrigger asChild>
                        <div
                          className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                            isSelected 
                              ? 'border-primary shadow-lg' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => handleToggleImage(image.url)}
                        >
                          <div className="aspect-square relative">
                            <img
                              src={image.url}
                              alt={image.original_filename}
                              className="w-full h-full object-cover"
                            />
                            {/* Indicador de tipo de URL */}
                            <div className="absolute top-2 left-2">
                              {isHttps ? (
                                <div className="p-1 rounded bg-green-500/90 text-white" title="Hospedada (HTTPS)">
                                  <Globe className="w-3 h-3" />
                                </div>
                              ) : (
                                <div className="p-1 rounded bg-blue-500/90 text-white" title="Local (será convertida)">
                                  <HardDrive className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                            {/* Checkbox */}
                            <div className="absolute top-2 right-2">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleToggleImage(image.url)}
                                className="bg-background"
                              />
                            </div>
                          </div>
                          <div className="p-2 bg-background/95">
                            <p className="text-xs truncate font-medium">{image.original_filename}</p>
                            {image.width && image.height && (
                              <p className="text-xs text-muted-foreground">
                                {image.width} x {image.height}
                              </p>
                            )}
                            {isLocal && (
                              <p className="text-xs text-blue-600 font-medium">
                                Será convertida
                              </p>
                            )}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        {isHttps ? (
                          <p className="text-green-600">✓ Imagem hospedada (HTTPS)</p>
                        ) : (
                          <p className="text-blue-600">
                            Imagem local - será convertida para base64 automaticamente na geração
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={selectedImageUrls.length === 0}
          >
            Confirmar Seleção ({selectedImageUrls.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
