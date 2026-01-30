
import { EnhancedImage } from "@/hooks/enhancement/types";

interface GalleryThumbnailsProps {
  images: EnhancedImage[];
  currentIndex: number;
  onImageClick: (index: number) => void;
  showThumbnails: boolean;
}

export const GalleryThumbnails = ({
  images,
  currentIndex,
  onImageClick,
  showThumbnails
}: GalleryThumbnailsProps) => {
  if (!showThumbnails) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm p-3">
      <div className="flex justify-center gap-1 overflow-x-auto">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => onImageClick(index)}
            className={`flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${
              index === currentIndex 
                ? 'border-green-400 ring-2 ring-green-400/50' 
                : 'border-white/20 hover:border-white/40'
            }`}
          >
            <img
              src={image.enhanced}
              alt={`Miniatura ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
};
