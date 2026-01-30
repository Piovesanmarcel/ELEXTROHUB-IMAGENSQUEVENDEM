
import { Button } from "@/components/ui/button";
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface ComparisonHeaderProps {
  productName: string;
  index: number;
  zoom: number;
  rotation: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotate: () => void;
  onReset: () => void;
  onClose: () => void;
}

export const ComparisonHeader = ({
  productName,
  index,
  zoom,
  rotation,
  onZoomIn,
  onZoomOut,
  onRotate,
  onReset,
  onClose
}: ComparisonHeaderProps) => {
  return (
    <div className="absolute top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm p-3 flex items-center justify-between">
      <div className="flex items-center gap-2 text-white">
        <h3 className="font-semibold text-base">{productName} - Imagem {index + 1}</h3>
        <span className="text-green-400 text-xs">Zoom: {Math.round(zoom * 100)}%</span>
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={onZoomOut}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-8 px-2"
        >
          <ZoomOut className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onZoomIn}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-8 px-2"
        >
          <ZoomIn className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onRotate}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-8 px-2"
        >
          <RotateCw className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onReset}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-8 px-2 text-xs"
        >
          Reset
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onClose}
          className="bg-white/10 border-white/20 text-white hover:bg-red-500/20 h-8 px-2"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};
