
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { EnhancedImage } from "@/hooks/enhancement/types";
import { toast } from "sonner";
import { GalleryHeader } from "./gallery/GalleryHeader";
import { GalleryNavigation } from "./gallery/GalleryNavigation";
import { GalleryThumbnails } from "./gallery/GalleryThumbnails";
import { GalleryFooter } from "./gallery/GalleryFooter";

interface ImageGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: EnhancedImage[];
  initialIndex: number;
  productName: string;
  productSku: string;
}

export const ImageGalleryModal = ({
  isOpen,
  onClose,
  images,
  initialIndex,
  productName,
  productSku
}: ImageGalleryModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Reset when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setZoom(1);
      setRotation(0);
    }
  }, [isOpen, initialIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, currentIndex]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setZoom(1);
    setRotation(0);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setZoom(1);
    setRotation(0);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const downloadImage = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`Erro ao baixar: ${response.status}`);
      
      const blob = await response.blob();
      const fileName = `${productSku}_enhanced_${index + 1}.jpg`;
      
      // Usar método seguro para download
      const { safeBlobDownload } = await import('@/utils/safeDownload');
      await safeBlobDownload(blob, fileName);
      
      toast.success(`Download concluído: ${fileName}`);
    } catch (error) {
      toast.error('Erro ao baixar imagem');
    }
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
    setZoom(1);
    setRotation(0);
  };

  // Não renderizar se não tem imagens ou se não está aberto
  if (images.length === 0 || !isOpen) {
    return null;
  }

  const currentImage = images[currentIndex];
  const showThumbnails = images.length > 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] w-[90vw] h-[90vh] p-0 bg-black">
        <div className="relative w-full h-full flex flex-col">
          <GalleryHeader
            productName={productName}
            productSku={productSku}
            currentIndex={currentIndex}
            totalImages={images.length}
            zoom={zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onRotate={handleRotate}
            onReset={handleReset}
            onClose={onClose}
          />

          <div className="flex-1 flex items-center justify-center pt-16 pb-20 relative">
            <GalleryNavigation
              onPrevious={handlePrevious}
              onNext={handleNext}
              showNavigation={images.length > 1}
            />

            <div className="flex-1 flex items-center justify-center px-20 max-w-3xl max-h-[60vh]">
              <img
                src={currentImage.enhanced}
                alt={`${productName} - Melhorada ${currentIndex + 1}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.3s ease',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  cursor: zoom > 1 ? 'grab' : 'default'
                }}
                className="rounded-lg"
                draggable={false}
              />
            </div>
          </div>

          <GalleryThumbnails
            images={images}
            currentIndex={currentIndex}
            onImageClick={handleThumbnailClick}
            showThumbnails={showThumbnails}
          />

          <GalleryFooter showThumbnails={showThumbnails} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
