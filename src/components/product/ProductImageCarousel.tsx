
import { useState, useEffect } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageIcon, AlertTriangle, Expand } from "lucide-react";
import { ImageGalleryModal } from "./ImageGalleryModal";

interface ProductImageCarouselProps {
  images: string[];
  productName: string;
  productId: string;
}

export const ProductImageCarousel = ({ images, productName, productId }: ProductImageCarouselProps) => {
  const [imageDimensions, setImageDimensions] = useState<Record<string, { width: number; height: number }>>({});
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Function to check image dimensions
  const checkImageDimensions = (imageUrl: string, index: number) => {
    const img = new Image();
    img.onload = () => {
      setImageDimensions(prev => ({
        ...prev,
        [imageUrl]: { width: img.width, height: img.height }
      }));
      console.log(`Imagem ${index + 1} - Dimensões: ${img.width}x${img.height}px - URL: ${imageUrl}`);
    };
    img.onerror = () => {
      console.error(`Erro ao carregar dimensões da imagem ${index + 1}:`, imageUrl);
    };
    img.src = imageUrl;
  };

  // Check if image has low resolution
  const isLowResolution = (imageUrl: string) => {
    const dimensions = imageDimensions[imageUrl];
    if (!dimensions) return false;
    return dimensions.width < 1000 || dimensions.height < 1000;
  };

  const openGallery = (index: number = 0) => {
    setSelectedImageIndex(index);
    setIsGalleryOpen(true);
  };

  useEffect(() => {
    if (images.length > 0) {
      console.log('Verificando dimensões para', images.length, 'imagens');
      images.forEach((imageUrl, index) => {
        checkImageDimensions(imageUrl, index);
      });
    }
  }, [images]);

  const lowResImages = images.filter(imageUrl => isLowResolution(imageUrl));

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center border">
        <div className="text-center text-purple-400">
          <ImageIcon className="h-24 w-24 mx-auto mb-2" />
          <p className="text-sm">Nenhuma imagem disponível</p>
          <p className="text-xs text-muted-foreground mt-1">ID: {productId}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        <Carousel className="w-full max-w-xs mx-auto">
          <CarouselContent>
            {images.map((imageUrl, index) => {
              const dimensions = imageDimensions[imageUrl];
              const lowRes = isLowResolution(imageUrl);
              
              return (
                <CarouselItem key={`${imageUrl}-${index}`}>
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-purple-100 to-indigo-100 border group cursor-pointer"
                       onClick={() => openGallery(index)}>
                    {lowRes && dimensions && (
                      <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-medium shadow-lg">
                        <AlertTriangle className="h-3 w-3" />
                        Baixa Resolução
                      </div>
                    )}
                    
                    {/* Botão para expandir */}
                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white/90 hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          openGallery(index);
                        }}
                      >
                        <Expand className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {imageErrors[imageUrl] ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <div className="text-center text-gray-500">
                          <svg className="h-16 w-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          <p className="text-sm">Imagem {index + 1} não disponível</p>
                        </div>
                      </div>
                    ) : (
                      <img 
                        src={imageUrl} 
                        alt={`${productName} - Imagem ${index + 1}`}
                        className="w-full h-full object-contain transition-all duration-200 group-hover:scale-105"
                        onLoad={(e) => {
                          console.log(`Imagem ${index + 1} carregada com sucesso:`, imageUrl);
                          const target = e.target as HTMLImageElement;
                          target.style.opacity = '1';
                        }}
                        onError={() => {
                          console.error(`Erro ao carregar imagem ${index + 1}:`, imageUrl);
                          setImageErrors(prev => ({ ...prev, [imageUrl]: true }));
                        }}
                        style={{ opacity: '0' }}
                      />
                    )}
                    
                    {dimensions && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                        {dimensions.width}x{dimensions.height}px
                      </div>
                    )}
                    
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                      {index + 1}/{images.length}
                    </div>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          {images.length > 1 && (
            <>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </>
          )}
        </Carousel>
        
        <div className="mt-3 text-center space-y-2">
          {images.length > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {images.length} imagens disponíveis
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openGallery(0)}
                className="text-xs"
              >
                <Expand className="h-3 w-3 mr-1" />
                Ver Todas
              </Button>
            </div>
          )}
          
          {/* Alert for low resolution images */}
          {images.some(url => isLowResolution(url)) && (
            <div className="flex items-center justify-center gap-2 text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium">
                {lowResImages.length} imagem(ns) com baixa resolução
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Modal da Galeria */}
      <ImageGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        images={images}
        productName={productName}
        initialIndex={selectedImageIndex}
      />
    </>
  );
};
