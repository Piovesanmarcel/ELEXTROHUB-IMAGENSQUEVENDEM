
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, TrendingUp } from "lucide-react";
import { Product } from "@/lib/supabase";

interface ProductBasicInfoProps {
  product: Product;
  isEditing: boolean;
  formData: {
    nome: string;
    sku: string;
    preco: number;
    preco_custo: number;
    peso_liquido: number;
    estoque: number;
    descricao_curta: string;
    categoria: string;
    marca: string;
    gtin: string;
    unidade: string;
    situacao: string;
  };
  onFormDataChange: (field: string, value: any) => void;
}

export const ProductBasicInfo = ({ 
  product, 
  isEditing, 
  formData, 
  onFormDataChange 
}: ProductBasicInfoProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  return (
    <div className="grid gap-6">
      {/* Primeira linha: Nome do Produto (esquerda) e SKU + Preço de Custo (direita) */}
      <div className="flex items-end justify-between gap-6">
        <div className="flex-1 space-y-2">
          <Label htmlFor="nome" className="text-sm font-semibold text-foreground/80">Nome do Produto</Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => onFormDataChange('nome', e.target.value)}
            className="border-border focus:border-primary"
            placeholder="Digite o nome do produto..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku" className="text-sm font-semibold text-foreground/80">SKU</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => onFormDataChange('sku', e.target.value)}
            className="border-border focus:border-primary w-32"
            placeholder="SKU"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="preco_custo" className="text-sm font-semibold text-foreground/80">Preço de Custo</Label>
          <Input
            id="preco_custo"
            type="number"
            step="0.01"
            min="0"
            value={formData.preco_custo || 0}
            onChange={(e) => onFormDataChange('preco_custo', parseFloat(e.target.value) || 0)}
            className="border-border focus:border-primary w-32"
            placeholder="R$ 0,00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="peso_liquido" className="text-sm font-semibold text-foreground/80">Peso (g)</Label>
          <Input
            id="peso_liquido"
            type="number"
            step="1"
            min="0"
            value={formData.peso_liquido || 0}
            onChange={(e) => onFormDataChange('peso_liquido', parseFloat(e.target.value) || 0)}
            className="border-border focus:border-primary w-32"
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );
};
