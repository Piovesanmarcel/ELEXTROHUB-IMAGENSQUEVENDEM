
interface ZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
}

export const ZoomModal = ({ isOpen, onClose, imageUrl }: ZoomModalProps) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-6xl max-h-full">
        <img 
          src={imageUrl} 
          alt="Imagem ampliada" 
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
