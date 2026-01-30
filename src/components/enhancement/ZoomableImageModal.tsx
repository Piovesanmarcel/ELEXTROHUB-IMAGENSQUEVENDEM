import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface ZoomableImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt: string;
}

export const ZoomableImageModal = ({
  isOpen,
  onClose,
  imageUrl,
  alt
}: ZoomableImageModalProps) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setImageLoaded(false);
    }
  }, [isOpen]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onClose]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ 
        x: e.clientX - position.x, 
        y: e.clientY - position.y 
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      e.preventDefault();
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  if (!isOpen || !imageUrl) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] w-[90vw] h-[90vh] p-0 bg-black">
        <div className="relative w-full h-full flex flex-col">
          {/* Header com controles */}
          <div className="absolute top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <h3 className="font-semibold">Visualização com Zoom</h3>
              <span className="text-green-400 text-sm">Zoom: {Math.round(zoom * 100)}%</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleZoomIn}
                disabled={zoom >= 5}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRotate}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Reset
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onClose}
                className="bg-white/10 border-white/20 text-white hover:bg-red-500/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Área da imagem */}
          <div 
            ref={containerRef}
            className="flex-1 flex items-center justify-center pt-16 pb-16 overflow-hidden"
          >
            <div 
              className={`relative select-none ${
                zoom > 1 
                  ? isDragging 
                    ? 'cursor-grabbing' 
                    : 'cursor-grab' 
                  : 'cursor-default'
              }`}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              style={{
                transform: `translate(${position.x}px, ${position.y}px)`
              }}
            >
              <img
                ref={imageRef}
                src={imageUrl}
                alt={alt || 'Imagem ampliada'}
                onLoad={handleImageLoad}
                onError={() => setImageLoaded(true)}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: isDragging ? 'none' : 'transform 0.3s ease',
                  maxWidth: '90vw',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                  userSelect: 'none'
                }}
                className="rounded-lg select-none"
                draggable={false}
              />
              
              {/* Loading indicator */}
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                  <div className="text-white text-sm">Carregando...</div>
                </div>
              )}
            </div>
          </div>

          {/* Footer com instruções */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-4 text-center">
            <div className="text-white/60 text-sm">
              Use os controles acima para zoom e rotação
              {zoom > 1 && (
                <span className="text-green-400 ml-2">• Arraste para mover a imagem</span>
              )}
              <span className="ml-2">• ESC ou clique fora para fechar</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};