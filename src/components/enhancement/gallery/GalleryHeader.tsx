
import { Button } from "@/components/ui/button";
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GalleryHeaderProps {
  productName: string;
  productSku: string;
  currentIndex: number;
  totalImages: number;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotate: () => void;
  onReset: () => void;
  onClose: () => void;
}

export const GalleryHeader = ({
  productName,
  productSku,
  currentIndex,
  totalImages,
  zoom,
  onZoomIn,
  onZoomOut,
  onRotate,
  onReset,
  onClose
}: GalleryHeaderProps) => {
  return (
    <div className="absolute top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm p-3 flex items-center justify-between">
      <div className="flex items-center gap-2 text-white">
        <h3 className="font-semibold text-sm">{productName}</h3>
        <Badge variant="outline" className="text-green-400 border-green-400 text-xs">
          {currentIndex + 1} de {totalImages}
        </Badge>
        <Badge variant="outline" className="text-blue-400 border-blue-400 text-xs">
          SKU: {productSku}
        </Badge>
        <span className="text-green-400 text-xs">Zoom: {Math.round(zoom * 100)}%</span>
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={onZoomOut}
          disabled={zoom <= 0.5}
          className="h-8 px-2 bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
        >
          <ZoomOut className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onZoomIn}
          disabled={zoom >= 3}
          className="h-8 px-2 bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
        >
          <ZoomIn className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onRotate}
          className="h-8 px-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <RotateCw className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onReset}
          className="h-8 px-2 bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs"
        >
          Reset
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onClose}
          className="h-8 px-2 bg-white/10 border-white/20 text-white hover:bg-red-500/20"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};
