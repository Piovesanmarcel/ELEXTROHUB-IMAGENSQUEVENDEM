
import { useState, useRef } from "react";

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
  zoomLevel?: number;
}

export const ZoomableImage = ({ 
  src, 
  alt, 
  className = "",
  zoomLevel = 2
}: ZoomableImageProps) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  const handleMouseEnter = () => {
    setIsZoomed(true);
  };

  const handleMouseLeave = () => {
    setIsZoomed(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setZoomPosition({ x, y });
  };

  return (
    <div className="relative overflow-hidden rounded">
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        className={`${className} transition-transform duration-200 ease-out cursor-zoom-in ${
          isZoomed ? `scale-${zoomLevel === 2 ? '200' : '300'}` : 'scale-100'
        }`}
        style={
          isZoomed
            ? {
                transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                transform: `scale(${zoomLevel})`,
              }
            : {}
        }
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      />
      
      {isZoomed && (
        <div className="absolute top-2 left-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium">
          Zoom {zoomLevel}x
        </div>
      )}
    </div>
  );
};
