import { memo } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, CheckCircle } from "lucide-react";
import { DownloadProductButton } from "../DownloadProductButton";
import { Product } from "@/lib/supabase";
import { getStockDisplay } from "./utils";
import { TableCells } from "./TableCells";
import { getProxiedUrl } from "@/lib/imageProxy";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProductRowProps {
  product: Product;
  onEditProduct: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  updateSingleProduct?: (product: Product) => void;
  selectedPricing: 'none' | 'shopee' | 'shein' | 'kwai' | 'amazon' | 'tiktok' | 'loja-virtual';
  profitMargin: number | '';
  taxRate: number | '';
  storeCommission?: number;
}

export const ProductRow = memo(function ProductRow({
  product,
  onEditProduct,
  onViewProduct,
  updateSingleProduct,
  selectedPricing,
  profitMargin,
  taxRate,
  storeCommission = 5
}: ProductRowProps) {
  const hasVariations = product.variacoes && Array.isArray(product.variacoes) && product.variacoes.length > 0;
  const totalStock = hasVariations
    ? product.variacoes.reduce((sum: number, v: any) => sum + (v.estoque || 0), 0)
    : product.estoque || 0;
  const stockDisplay = getStockDisplay(totalStock, product.estoque_sincronizado_em);

  const handleEditInNewTab = () => {
    window.open(`/produtos/${product.id}`, '_blank');
  };

  return (
    <TableRow key={product.id} className="hover:bg-purple-50/50">
      <TableCell className="bg-slate-50">
        <div className="w-12 h-12 rounded-lg overflow-hidden">
          {product.imagem_url ? (
            <img
              src={getProxiedUrl(product.imagem_url)}
              alt={product.nome}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`${product.imagem_url ? 'hidden' : ''} w-full h-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center`}>
            <Package className="h-6 w-6 text-purple-400" />
          </div>
        </div>
      </TableCell>
      <TableCell className="bg-slate-50">
        <div className="max-w-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium truncate">{product.nome}</p>
            {product.tipo_produto === 'variavel' && hasVariations && (
              <Badge variant="secondary" className="flex items-center gap-1 shrink-0 bg-blue-100 text-blue-700 hover:bg-blue-200">
                🔗 {product.variacoes.length} {product.variacoes.length === 1 ? 'variação' : 'variações'}
              </Badge>
            )}
            {product.ready_for_ads && (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1 shrink-0">
                <CheckCircle className="h-3 w-3" />
                Pronto
              </Badge>
            )}
          </div>
          {product.marca && (
            <p className="text-sm text-muted-foreground truncate">
              {product.marca}
            </p>
          )}
        </div>
      </TableCell>
      <TableCell className="bg-slate-50">
        <Badge variant="outline">{product.sku}</Badge>
      </TableCell>

      <TableCells
        product={product}
        selectedPricing={selectedPricing}
        profitMargin={profitMargin}
        taxRate={taxRate}
        storeCommission={storeCommission}
      />
    </TableRow>
  );
}, (prevProps, nextProps) => {
  // Comparação customizada para evitar re-renders desnecessários
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.nome === nextProps.product.nome &&
    prevProps.product.estoque === nextProps.product.estoque &&
    prevProps.product.preco === nextProps.product.preco &&
    prevProps.product.imagem_url === nextProps.product.imagem_url &&
    prevProps.profitMargin === nextProps.profitMargin &&
    prevProps.taxRate === nextProps.taxRate &&
    prevProps.selectedPricing === nextProps.selectedPricing &&
    prevProps.storeCommission === nextProps.storeCommission
  );
});
