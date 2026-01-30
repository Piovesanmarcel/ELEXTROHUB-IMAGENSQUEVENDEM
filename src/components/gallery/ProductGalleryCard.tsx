import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Calendar, Package } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { GalleryProduct } from "@/hooks/useMarketingGallery";

interface ProductGalleryCardProps {
  product: GalleryProduct;
  onClick: () => void;
}

export function ProductGalleryCard({ product, onClick }: ProductGalleryCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <Card 
      className="group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 border-border/50 bg-card/50 backdrop-blur-sm"
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.imageUrl && !imageError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Package className="w-16 h-16 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Badge de quantidade */}
        <Badge 
          className="absolute top-3 right-3 bg-primary/90 hover:bg-primary text-primary-foreground shadow-lg"
        >
          <ImageIcon className="w-3 h-3 mr-1" />
          {product.imageCount} {product.imageCount === 1 ? "imagem" : "imagens"}
        </Badge>

        {/* Info no hover */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <p className="text-white/80 text-xs flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {product.lastGenerated 
              ? format(new Date(product.lastGenerated), "dd MMM yyyy, HH:mm", { locale: ptBR })
              : "Sem data"
            }
          </p>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <p className="text-xs text-muted-foreground font-mono">
          SKU: {product.sku}
        </p>
        
        {product.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {product.categories.slice(0, 3).map((cat, idx) => (
              <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0">
                {cat}
              </Badge>
            ))}
            {product.categories.length > 3 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                +{product.categories.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
