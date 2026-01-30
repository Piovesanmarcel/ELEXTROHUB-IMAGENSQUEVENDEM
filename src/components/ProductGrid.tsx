
import { memo, useMemo, useCallback } from "react";
import { Product } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Package, Star, CheckCircle } from "lucide-react";
import { DownloadProductButton } from "./DownloadProductButton";
import { OptimizedImage } from "./OptimizedImage";

interface ProductGridProps {
  products: Product[];
  onEditProduct: (product: Product) => void;
  onViewProduct: (product: Product) => void;
}

// Memoizar cada item do produto para evitar re-renderizações desnecessárias
export const ProductGridItem = memo(({
  product, 
  onEditProduct, 
  onViewProduct,
  formatPrice,
  getStockStatus,
  isPriority = false
}: {
  product: Product;
  onEditProduct: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  formatPrice: (price: number) => string;
  getStockStatus: (stock: number) => { color: string; text: string };
  isPriority?: boolean;
}) => {
  const stockStatus = useMemo(() => getStockStatus(product.estoque), [product.estoque, getStockStatus]);
  
  const handleEditClick = useCallback(() => {
    onEditProduct(product);
  }, [onEditProduct, product]);

  const handleViewClick = useCallback(() => {
    onViewProduct(product);
  }, [onViewProduct, product]);
  
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 glass-effect">
      <div className="aspect-square p-4 relative overflow-hidden rounded-t-lg">
        {product.imagem_url ? (
          <OptimizedImage
            src={product.imagem_url}
            alt={product.nome}
            className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
            fallbackClassName="w-full h-full bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center"
            priority={isPriority}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center">
            <Package className="h-16 w-16 text-purple-400" />
          </div>
        )}
        
        <div className="absolute top-2 right-2 flex gap-1">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleViewClick}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleEditClick}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <DownloadProductButton 
              product={product} 
              size="sm" 
              variant="secondary"
            />
          </div>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
            {product.nome}
          </h3>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {product.sku}
            </Badge>
            {product.categoria && (
              <Badge variant="secondary" className="text-xs">
                {product.categoria}
              </Badge>
            )}
            {product.ready_for_ads && (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1 text-xs">
                <CheckCircle className="h-3 w-3" />
                Pronto
              </Badge>
            )}
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-primary">
                {formatPrice(product.preco)}
              </span>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-muted-foreground">4.5</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Estoque: {product.estoque}
              </span>
              <Badge variant={stockStatus.color as any} className="text-xs">
                {stockStatus.text}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ProductGridItem.displayName = "ProductGridItem";

export function ProductGrid({ 
  products, 
  onEditProduct, 
  onViewProduct
}: ProductGridProps) {
  // Usar useCallback para memoizar funções utilitárias
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  }, []);

  const getStockStatus = useCallback((stock: number) => {
    if (stock === 0) return { color: "destructive", text: "Sem estoque" };
    if (stock < 10) return { color: "secondary", text: "Estoque baixo" };
    return { color: "default", text: "Em estoque" };
  }, []);

  // Memoizar produtos para otimizar renderização
  const memoizedProducts = useMemo(() => products, [products]);

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {memoizedProducts.map((product, index) => (
        <ProductGridItem
          key={product.id}
          product={product}
          onEditProduct={onEditProduct}
          onViewProduct={onViewProduct}
          formatPrice={formatPrice}
          getStockStatus={getStockStatus}
          isPriority={index < 8} // Primeiros 8 produtos têm prioridade
        />
      ))}
    </div>
  );
}
