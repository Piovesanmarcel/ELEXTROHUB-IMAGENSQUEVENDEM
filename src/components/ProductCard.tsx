
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit, Save, X, Package } from "lucide-react";
import { Product } from "@/lib/supabase";
import { DownloadProductButton } from "./DownloadProductButton";

interface ProductCardProps {
  product: Product;
  onUpdateStock: (productId: string, newStock: number) => Promise<void>;
  isSelected?: boolean;
  onSelect?: (productId: string) => void;
}

export function ProductCard({ product, onUpdateStock, isSelected, onSelect }: ProductCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newStock, setNewStock] = useState(product.estoque);
  const [isLoading, setIsLoading] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const handleSaveStock = async () => {
    setIsLoading(true);
    try {
      await onUpdateStock(product.id, newStock);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating stock:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setNewStock(product.estoque);
    setIsEditing(false);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { color: "destructive", text: "Sem estoque" };
    if (stock < 10) return { color: "secondary", text: "Estoque baixo" };
    return { color: "default", text: "Em estoque" };
  };

  const stockStatus = getStockStatus(product.estoque);

  return (
    <Card className={`transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              {product.imagem_url ? (
                <img 
                  src={product.imagem_url} 
                  alt={product.nome}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <Package className={`h-6 w-6 text-muted-foreground ${product.imagem_url ? 'hidden' : ''}`} />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg leading-tight">{product.nome}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">SKU: {product.sku}</p>
              {product.categoria && (
                <Badge variant="outline" className="mt-1 text-xs">
                  {product.categoria}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(product.id)}
                className="mt-1"
              />
            )}
            <DownloadProductButton product={product} size="sm" variant="outline" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Preço</p>
            <p className="text-lg font-semibold">{formatPrice(product.preco)}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-muted-foreground">Estoque</p>
            {isEditing ? (
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                  className="h-8 w-20"
                  min="0"
                />
                <Button
                  size="sm"
                  onClick={handleSaveStock}
                  disabled={isLoading}
                  className="h-8 px-2"
                >
                  <Save className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="h-8 px-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-semibold">{product.estoque}</span>
                <Badge variant={stockStatus.color as any} className="text-xs">
                  {stockStatus.text}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  className="h-6 w-6 p-0"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {product.descricao && (
          <div className="mt-3">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.descricao}
            </p>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            Atualizado em {formatDate(product.atualizado_em)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
