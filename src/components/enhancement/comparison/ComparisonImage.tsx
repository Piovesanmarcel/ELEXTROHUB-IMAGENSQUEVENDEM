
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ImageDimensions {
  width: number;
  height: number;
}

interface ComparisonImageProps {
  src: string;
  alt: string;
  label: string;
  dimensions: ImageDimensions | null;
  zoom: number;
  imageZoom: number;
  position: { x: number; y: number };
  rotation: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onDownload: () => void;
  isEnhanced?: boolean;
}

export const ComparisonImage = ({
  src,
  alt,
  label,
  dimensions,
  zoom,
  imageZoom,
  position,
  rotation,
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
  onDownload,
  isEnhanced = false
}: ComparisonImageProps) => {
  const imageRef = useRef<HTMLImageElement>(null);

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className={`${isEnhanced ? 'text-green-400' : 'text-white'} text-sm mb-3 font-medium flex items-center gap-3`}>
        <span>{label}</span>
        {dimensions && (
          <span className={`${isEnhanced ? 'bg-green-600/80' : 'bg-red-600/80'} px-2 py-1 rounded text-xs`}>
            {dimensions.width}x{dimensions.height}px
          </span>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={onDownload}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-7 px-2 text-xs"
        >
          <Download className="h-3 w-3 mr-1" />
          Download
        </Button>
      </div>
      <div className="relative overflow-hidden rounded-lg w-[600px] h-[600px] flex items-center justify-center bg-gray-900/50">
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onMouseMove={onMouseMove}
          style={{
            transform: `scale(${zoom * imageZoom}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
            transition: imageZoom > 1 ? 'none' : 'transform 0.3s ease',
            cursor: 'crosshair',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain'
          }}
          className={`rounded border ${isEnhanced ? 'border-green-400/50' : 'border-white/20'}`}
        />
      </div>
    </div>
  );
};
