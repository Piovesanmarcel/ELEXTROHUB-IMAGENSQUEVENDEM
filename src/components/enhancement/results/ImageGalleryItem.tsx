
import { Button } from "@/components/ui/button";
import { Eye, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

interface EnhancedImage {
  original: string;
  enhanced: string;
  metadata?: any;
}

interface ImageDimensions {
  width: number;
  height: number;
}

interface ImageGalleryItemProps {
  item: EnhancedImage;
  index: number;
  productName: string;
  productSku: string;
  onViewImage: (url: string) => void;
  onDownloadImage: (url: string, index: number) => void;
  onOpenGallery?: (index: number) => void;
}

export const ImageGalleryItem = ({ 
  item, 
  index, 
  productName, 
  productSku, 
  onViewImage, 
  onDownloadImage,
  onOpenGallery
}: ImageGalleryItemProps) => {
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    console.log(`🔍 ImageGalleryItem ${index + 1}: Iniciando carregamento da imagem`);
    console.log(`📱 URL da imagem:`, item.enhanced);
    
    const img = new Image();
    // Para URLs do Cloudflare R2, não usar CORS que pode causar problemas
    const isR2Url = item.enhanced.includes('r2.dev');
    const isDeepAI = item.enhanced.includes('api.deepai.org');
    
    console.log(`🌐 URL Info:`, { isR2Url, isDeepAI, url: item.enhanced });
    
    // Só usar CORS para DeepAI, não para R2
    if (isDeepAI) {
      img.crossOrigin = "anonymous";
    }
    
    img.onload = () => {
      console.log(`✅ ImageGalleryItem ${index + 1}: Imagem carregada com sucesso`, { 
        width: img.width, 
        height: img.height 
      });
      setDimensions({ width: img.width, height: img.height });
      setImageError(false);
    };
    
    img.onerror = (error) => {
      console.error(`❌ ImageGalleryItem ${index + 1}: Erro ao carregar imagem`, {
        url: item.enhanced,
        error: error,
        isR2Url,
        isDeepAI
      });
      
      // Tentar carregar sem CORS como fallback
      if (isR2Url) {
        console.log(`🔄 Tentando carregar R2 URL sem CORS...`);
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          console.log(`✅ Fallback bem-sucedido para imagem ${index + 1}`);
          setDimensions({ width: fallbackImg.width, height: fallbackImg.height });
          setImageError(false);
        };
        fallbackImg.onerror = () => {
          console.error(`❌ Fallback também falhou para imagem ${index + 1}`);
          setDimensions({ width: 0, height: 0 });
          setImageError(true);
        };
        fallbackImg.src = item.enhanced;
      } else {
        setDimensions({ width: 0, height: 0 });
        setImageError(true);
      }
    };
    
    img.src = item.enhanced;
  }, [item.enhanced, index]);

  const isHighRes = dimensions && (dimensions.width >= 1000 && dimensions.height >= 1000);

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log(`🖼️ CLIQUE CAPTURADO NA IMAGEM ${index + 1}!`);
    console.log(`📋 onOpenGallery disponível:`, !!onOpenGallery);
    
    if (onOpenGallery) {
      console.log(`🎯 EXECUTANDO onOpenGallery com índice ${index}`);
      onOpenGallery(index);
    } else {
      console.log(`⚠️ Fallback: usando visualização simples`);
      onViewImage(item.enhanced);
    }
  };

  return (
    <div 
      className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-green-100 to-emerald-100 border-2 border-green-200 group cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
      onClick={handleImageClick}
    >
      {/* Badge de Resolução */}
      <div className="absolute top-3 left-3 z-10">
        <Badge 
          variant="outline" 
          className={`text-xs font-semibold ${
            isHighRes 
              ? 'bg-green-50 text-green-700 border-green-300' 
              : 'bg-orange-50 text-orange-700 border-orange-300'
          }`}
        >
          {dimensions ? `${dimensions.width}x${dimensions.height}px` : 'Carregando...'}
        </Badge>
      </div>
      
      {/* Número da imagem */}
      <div className="absolute top-3 right-3 z-10">
        <Badge variant="secondary" className="text-xs font-bold bg-green-600 text-white border-0">
          {index + 1}
        </Badge>
      </div>
      
      {/* Botões de ação */}
      <div className="absolute bottom-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            console.log(`👁️ Visualização rápida da imagem ${index + 1}`);
            onViewImage(item.enhanced);
          }}
        >
          <Eye className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 text-white shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            console.log(`💾 Download da imagem ${index + 1}`);
            onDownloadImage(item.enhanced, index);
          }}
        >
          <Download className="h-3 w-3" />
        </Button>
      </div>
      
      {imageError ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-500">
            <svg className="h-12 w-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <p className="text-sm font-medium">Erro ao carregar</p>
            <p className="text-xs">Imagem {index + 1}</p>
          </div>
        </div>
      ) : (
        <img 
          src={item.enhanced} 
          alt={`${productName} - Melhorada ${index + 1}`}
          className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110 pointer-events-none"
          draggable={false}
          crossOrigin={item.enhanced.includes('api.deepai.org') ? "anonymous" : undefined}
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
};
