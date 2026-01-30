
interface GalleryFooterProps {
  showThumbnails: boolean;
}

export const GalleryFooter = ({ showThumbnails }: GalleryFooterProps) => {
  return (
    <div 
      className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm p-2 text-center" 
      style={{ marginBottom: showThumbnails ? '70px' : '0' }}
    >
      <div className="text-white/60 text-xs">
        Use as setas do teclado para navegar • Zoom com os controles • ESC para fechar
      </div>
    </div>
  );
};
