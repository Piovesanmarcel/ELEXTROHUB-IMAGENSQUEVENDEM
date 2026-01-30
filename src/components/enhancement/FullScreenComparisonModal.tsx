
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EnhancedImage } from "@/hooks/enhancement/types";
import { toast } from "sonner";
import { ComparisonHeader } from "./comparison/ComparisonHeader";
import { ComparisonImage } from "./comparison/ComparisonImage";

interface ImageDimensions {
  width: number;
  height: number;
}

interface FullScreenComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: EnhancedImage;
  productName: string;
  index: number;
}

export const FullScreenComparisonModal = ({
  isOpen,
  onClose,
  image,
  productName,
  index
}: FullScreenComparisonModalProps) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [originalDimensions, setOriginalDimensions] = useState<ImageDimensions | null>(null);
  const [enhancedDimensions, setEnhancedDimensions] = useState<ImageDimensions | null>(null);
  
  // Estados para zoom com mouse - ajustado para 1.7x
  const [originalImageZoom, setOriginalImageZoom] = useState(1);
  const [enhancedImageZoom, setEnhancedImageZoom] = useState(1);
  const [originalImagePosition, setOriginalImagePosition] = useState({ x: 0, y: 0 });
  const [enhancedImagePosition, setEnhancedImagePosition] = useState({ x: 0, y: 0 });

  // Ajustado zoom máximo para 5x
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOriginalImageZoom(1);
    setEnhancedImageZoom(1);
    setOriginalImagePosition({ x: 0, y: 0 });
    setEnhancedImagePosition({ x: 0, y: 0 });
  };

  // Detectar dimensões da imagem original
  useEffect(() => {
    if (image?.original) {
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        console.warn('Erro ao carregar imagem original para detectar dimensões');
        setOriginalDimensions(null);
      };
      img.src = image.original;
    }
  }, [image?.original]);

  // Detectar dimensões da imagem melhorada
  useEffect(() => {
    if (image?.enhanced) {
      const img = new Image();
      img.onload = () => {
        setEnhancedDimensions({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        console.warn('Erro ao carregar imagem melhorada para detectar dimensões');
        setEnhancedDimensions(null);
      };
      img.src = image.enhanced;
    }
  }, [image?.enhanced]);

  // Reset quando modal abre
  useEffect(() => {
    if (isOpen) {
      handleReset();
    }
  }, [isOpen]);

  // Zoom ao passar o mouse - ajustado para 1.7x
  const handleMouseEnter = (imageType: 'original' | 'enhanced') => {
    if (imageType === 'original') {
      setOriginalImageZoom(1.7);
    } else {
      setEnhancedImageZoom(1.7);
    }
  };

  const handleMouseLeave = (imageType: 'original' | 'enhanced') => {
    if (imageType === 'original') {
      setOriginalImageZoom(1);
      setOriginalImagePosition({ x: 0, y: 0 });
    } else {
      setEnhancedImageZoom(1);
      setEnhancedImagePosition({ x: 0, y: 0 });
    }
  };

  const handleMouseMove = (e: React.MouseEvent, imageType: 'original' | 'enhanced') => {
    const currentZoom = imageType === 'original' ? originalImageZoom : enhancedImageZoom;
    
    if (currentZoom > 1) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      // Movimento mais suave para zoom 1.7x
      const moveX = (x - 0.5) * -70;
      const moveY = (y - 0.5) * -70;
      
      if (imageType === 'original') {
        setOriginalImagePosition({ x: moveX, y: moveY });
      } else {
        setEnhancedImagePosition({ x: moveX, y: moveY });
      }
    }
  };

  const downloadImage = async (imageUrl: string, isEnhanced: boolean = false) => {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`Erro ao baixar: ${response.status}`);
      
      const blob = await response.blob();
      const fileName = `imagem_${isEnhanced ? 'melhorada' : 'original'}_${index + 1}.jpg`;
      
      // Usar método seguro para download
      const { safeBlobDownload } = await import('@/utils/safeDownload');
      await safeBlobDownload(blob, fileName);
      
      toast.success(`Download concluído: ${fileName}`);
    } catch (error) {
      toast.error('Erro ao baixar imagem');
    }
  };

  // Garantir que temos uma imagem válida para evitar erros
  const safeImage = image || { original: '', enhanced: '', metadata: {} };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] w-[90vw] h-[90vh] p-0 bg-black">
        <div className="relative w-full h-full flex flex-col">
          <ComparisonHeader
            productName={productName}
            index={index}
            zoom={zoom}
            rotation={rotation}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onRotate={handleRotate}
            onReset={handleReset}
            onClose={onClose}
          />

          <div className="flex-1 flex pt-14 pb-12 gap-4 p-4">
            <ComparisonImage
              src={safeImage.original || ''}
              alt={`${productName} - Original`}
              label="ORIGINAL"
              dimensions={originalDimensions}
              zoom={zoom}
              imageZoom={originalImageZoom}
              position={originalImagePosition}
              rotation={rotation}
              onMouseEnter={() => handleMouseEnter('original')}
              onMouseLeave={() => handleMouseLeave('original')}
              onMouseMove={(e) => handleMouseMove(e, 'original')}
              onDownload={() => downloadImage(safeImage.original, false)}
            />

            <ComparisonImage
              src={safeImage.enhanced || ''}
              alt={`${productName} - Melhorada`}
              label="MELHORADA COM DEEPAI"
              dimensions={enhancedDimensions}
              zoom={zoom}
              imageZoom={enhancedImageZoom}
              position={enhancedImagePosition}
              rotation={rotation}
              onMouseEnter={() => handleMouseEnter('enhanced')}
              onMouseLeave={() => handleMouseLeave('enhanced')}
              onMouseMove={(e) => handleMouseMove(e, 'enhanced')}
              onDownload={() => downloadImage(safeImage.enhanced, true)}
              isEnhanced
            />
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm p-3 text-center">
            <div className="text-white/70 text-xs">
              Zoom: {Math.round(zoom * 100)}% | Rotação: {rotation}° | 
              {originalDimensions && enhancedDimensions && (
                <span className="text-green-400 ml-2 font-medium">
                  Aumento: {Math.round((enhancedDimensions.width / originalDimensions.width) * 100)}% resolução
                </span>
              )}
              <span className="ml-2 text-yellow-400">• Passe o mouse sobre as imagens para zoom 1.7x automático • Use os controles para zoom manual até 5x</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
