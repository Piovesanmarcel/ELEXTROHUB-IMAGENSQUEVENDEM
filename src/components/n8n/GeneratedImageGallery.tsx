import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  ImageIcon,
  Trash2,
  ZoomIn
} from "lucide-react";
import { toast } from "sonner";

export interface GeneratedImage {
  imageUrl: string; // data:image/png;base64,...
  mimeType: string;
  generatedAt: string;
  productName: string;
  sceneType?: string; // Tipo de cena que gerou esta imagem
}

interface GeneratedImageGalleryProps {
  images: GeneratedImage[];
  isGenerating: boolean;
  onClearImages: () => void;
}

export function GeneratedImageGallery({ 
  images, 
  isGenerating,
  onClearImages 
}: GeneratedImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  // Download individual image
  const downloadImage = async (image: GeneratedImage, index: number) => {
    try {
      setDownloadingIndex(index);
      
      // Convert data URL to blob
      const response = await fetch(image.imageUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      const timestamp = new Date(image.generatedAt).toISOString().slice(0, 10);
      const extension = image.mimeType.split('/')[1] || 'png';
      link.download = `${image.productName.replace(/\s+/g, '_')}_gerada_${index + 1}_${timestamp}.${extension}`;
      
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success(`Imagem ${index + 1} baixada!`);
    } catch (error) {
      console.error('Erro ao baixar imagem:', error);
      toast.error('Erro ao baixar imagem');
    } finally {
      setDownloadingIndex(null);
    }
  };

  // Download all images
  const downloadAllImages = async () => {
    if (images.length === 0) return;
    
    setIsDownloadingAll(true);
    toast.info(`Baixando ${images.length} imagem(ns)...`);
    
    try {
      for (let i = 0; i < images.length; i++) {
        await downloadImage(images[i], i);
        // Small delay between downloads
        if (i < images.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      toast.success(`${images.length} imagem(ns) baixada(s)!`);
    } catch (error) {
      console.error('Erro ao baixar imagens:', error);
      toast.error('Erro ao baixar algumas imagens');
    } finally {
      setIsDownloadingAll(false);
    }
  };

  // Navigation in modal
  const goToPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (selectedIndex === null) return;
    
    if (e.key === 'ArrowLeft') goToPrevious();
    else if (e.key === 'ArrowRight') goToNext();
    else if (e.key === 'Escape') setSelectedIndex(null);
  };

  if (images.length === 0 && !isGenerating) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma imagem gerada ainda</p>
          <p className="text-xs mt-2">As imagens do n8n aparecerão aqui</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-green-600" />
              Imagens Geradas
              <Badge variant="secondary">{images.length}</Badge>
            </span>
            <div className="flex items-center gap-2">
              {images.length > 0 && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={downloadAllImages}
                    disabled={isDownloadingAll}
                    className="gap-1"
                  >
                    {isDownloadingAll ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Download className="h-3 w-3" />
                    )}
                    Baixar Todas
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onClearImages}
                    className="gap-1 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                    Limpar
                  </Button>
                </>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isGenerating && (
            <div className="flex items-center justify-center gap-2 p-4 mb-4 bg-blue-50 rounded-lg border border-blue-200">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm text-blue-700">Gerando imagem via n8n...</span>
            </div>
          )}

          {/* Image Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((image, index) => (
              <div 
                key={index} 
                className="relative group aspect-square rounded-lg overflow-hidden border bg-muted/50 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                onClick={() => setSelectedIndex(index)}
              >
                <img
                  src={image.imageUrl}
                  alt={`Imagem gerada ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIndex(index);
                    }}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    disabled={downloadingIndex === index}
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadImage(image, index);
                    }}
                  >
                    {downloadingIndex === index ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Index badge */}
                <Badge className="absolute bottom-1 left-1 text-xs">
                  {index + 1}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fullscreen Modal */}
      {selectedIndex !== null && images[selectedIndex] && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setSelectedIndex(null)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Close button */}
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setSelectedIndex(null)}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Navigation arrows */}
          {selectedIndex > 0 && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute left-4 text-white hover:bg-white/20 h-12 w-12"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}
          
          {selectedIndex < images.length - 1 && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-4 text-white hover:bg-white/20 h-12 w-12"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}

          {/* Main image */}
          <div 
            className="max-w-[90vw] max-h-[80vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[selectedIndex].imageUrl}
              alt={`Imagem gerada ${selectedIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            
            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{images[selectedIndex].productName}</p>
                  <p className="text-white/70 text-sm">
                    Imagem {selectedIndex + 1} de {images.length} • {new Date(images[selectedIndex].generatedAt).toLocaleString('pt-BR')}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1"
                  onClick={() => downloadImage(images[selectedIndex], selectedIndex)}
                  disabled={downloadingIndex === selectedIndex}
                >
                  {downloadingIndex === selectedIndex ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Download
                </Button>
              </div>
            </div>
          </div>

          {/* Position indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === selectedIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/60'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex(i);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
