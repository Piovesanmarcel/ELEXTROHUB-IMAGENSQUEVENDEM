import { safeDownload } from "@/utils/safeDownload";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Download, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getProxiedUrl } from "@/lib/imageProxy";

interface ImageGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  productName: string;
  initialIndex?: number;
}

export const ImageGalleryModal = ({ 
  isOpen, 
  onClose, 
  images, 
  productName, 
  initialIndex = 0 
}: ImageGalleryModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const downloadImage = (imageUrl: string, index: number) => {
    const fileName = `${productName.replace(/\s+/g, '_')}_imagem_${index + 1}.jpg`;
    safeDownload(imageUrl, fileName);
  };

  const openImageInNewTab = (imageUrl: string) => {
    window.open(imageUrl, '_blank');
  };

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center justify-between">
            <span>{productName} - Galeria de Imagens</span>
            <Badge variant="outline">
              {currentIndex + 1} de {images.length}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative flex-1 flex flex-col">
          {/* Imagem Principal */}
          <div className="relative flex-1 bg-gray-50 flex items-center justify-center min-h-[400px]">
            <img
              src={getProxiedUrl(currentImage)}
              alt={`${productName} - Imagem ${currentIndex + 1}`}
              className="max-w-full max-h-[500px] object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f0f0f0'/%3E%3Ctext x='200' y='150' font-family='Arial' font-size='16' fill='%23999' text-anchor='middle'%3EImagem não disponível%3C/text%3E%3C/svg%3E";
              }}
            />
            
            {/* Controles de Navegação */}
            {images.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
            
            {/* Ações da Imagem */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openImageInNewTab(currentImage)}
                className="bg-white/90 hover:bg-white"
              >
                <Eye className="h-3 w-3 mr-1" />
                Ver Original
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadImage(currentImage, currentIndex)}
                className="bg-white/90 hover:bg-white"
              >
                <Download className="h-3 w-3 mr-1" />
                Baixar
              </Button>
            </div>
          </div>
          
          {/* Miniaturas */}
          {images.length > 1 && (
            <div className="p-4 border-t bg-white">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all ${
                      index === currentIndex 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={getProxiedUrl(image)}
                      alt={`Miniatura ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23f0f0f0'/%3E%3Ctext x='32' y='32' font-family='Arial' font-size='8' fill='%23999' text-anchor='middle'%3E?%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
