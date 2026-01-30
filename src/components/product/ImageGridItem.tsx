import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Expand, ChevronLeft, ChevronRight, Star, Trash2 } from "lucide-react";
import { getProxiedUrl } from "@/lib/imageProxy";

interface ImageDimensions {
  width: number;
  height: number;
}

interface ImageQuality {
  resolution: 'low' | 'medium' | 'high';
  width: number;
  height: number;
  needsImprovement: boolean;
}

interface ImageGridItemProps {
  imageUrl: string;
  index: number;
  productName: string;
  productId: string;
  onClick: () => void;
  onImageUrlUpdate?: (newUrl: string) => void;
  // Props para modo de reordenação
  isReordering?: boolean;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  onSetPrimary?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  // Props para qualidade e exclusão
  quality?: ImageQuality;
  onDelete?: () => void;
  canDelete?: boolean;
  // Props para imagem de referência
  isReferenceImage?: boolean;
}

export const ImageGridItem = ({ 
  imageUrl, 
  index, 
  productName, 
  productId, 
  onClick, 
  onImageUrlUpdate,
  isReordering = false,
  onMoveLeft,
  onMoveRight,
  onSetPrimary,
  isFirst = false,
  isLast = false,
  quality,
  onDelete,
  canDelete = false,
  isReferenceImage = false
}: ImageGridItemProps) => {
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const [imageError, setImageError] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(imageUrl);

  // Atualizar URL local quando a prop mudar
  useEffect(() => {
    setCurrentUrl(imageUrl);
    setImageError(false);
  }, [imageUrl]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
    setImageError(false);
  };

  const handleImageError = () => {
    console.warn(`⚠️ Erro ao carregar imagem ${index + 1}: ${currentUrl}`);
    setDimensions({ width: 0, height: 0 });
    setImageError(true);
  };

  const isLowRes = dimensions && (dimensions.width < 1000 || dimensions.height < 1000);

  return (
    <div
      className={`relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-purple-100 to-indigo-100 border-2 group cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${
        isReordering ? 'border-purple-400 ring-2 ring-purple-200' : 
        isReferenceImage ? 'border-amber-400 ring-2 ring-amber-200 ring-offset-2' : 'border-gray-200'
      }`}
      onClick={isReordering ? undefined : onClick}
    >
      
      {/* Badge de referência */}
      {isReferenceImage && (
        <div className="absolute top-2 left-2 z-20">
          <Badge className="bg-amber-500 text-white text-xs px-1.5 py-0.5 shadow-lg">
            📌 Ref
          </Badge>
        </div>
      )}
      
      {/* Número da imagem */}
      <div className={`absolute top-2 z-10 ${isReferenceImage ? 'right-2' : 'right-2'}`}>
        <Badge 
          variant="secondary" 
          className={`text-xs font-bold border-0 ${
            index === 0 ? 'bg-yellow-500 text-white' : 'bg-black/70 text-white'
          }`}
        >
          {index === 0 ? '⭐ 1' : index + 1}
        </Badge>
      </div>
      
      {/* Controles de reordenação */}
      {isReordering && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-white/95 hover:bg-white shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onMoveLeft?.();
            }}
            disabled={isFirst}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-yellow-100 hover:bg-yellow-200 shadow-lg border-yellow-400"
            onClick={(e) => {
              e.stopPropagation();
              onSetPrimary?.();
            }}
            disabled={isFirst}
            title="Definir como imagem principal"
          >
            <Star className="h-4 w-4 text-yellow-600" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-white/95 hover:bg-white shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onMoveRight?.();
            }}
            disabled={isLast}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* Botão de excluir - inferior esquerdo (só quando não está reordenando e pode excluir) */}
      {!isReordering && canDelete && onDelete && (
        <div className="absolute bottom-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="destructive"
            className="h-8 w-8 p-0 bg-red-500/90 hover:bg-red-600 shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
      
      {/* Botão para expandir (só quando não está reordenando) - movido para top-left */}
      {!isReordering && (
        <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="outline"
            className="h-7 w-7 p-0 bg-white/90 hover:bg-white shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Expand className="h-3 w-3" />
          </Button>
        </div>
      )}
      
      {imageError ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-500">
            <svg className="h-12 w-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <p className="text-sm font-medium text-red-600">Imagem indisponível</p>
            <p className="text-xs mb-3 text-gray-500">Não foi possível carregar</p>
            {canDelete && onDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="gap-1"
              >
                <Trash2 className="h-3 w-3" />
                Remover
              </Button>
            )}
          </div>
        </div>
      ) : (
        <img 
          src={getProxiedUrl(currentUrl)} 
          alt={`${productName} - Imagem ${index + 1}`}
          className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
      
      {/* Overlay com informações (só quando não está reordenando) */}
      {!isReordering && (
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-lg px-3 py-1">
            <p className="text-sm font-semibold text-gray-800">Clique para ampliar</p>
          </div>
        </div>
      )}
    </div>
  );
};