
import { TableCell } from "@/components/ui/table";
import { Product } from "@/lib/supabase";
import { formatPrice, getMarketplaceColor, calculateMarketplacePricing } from "./utils";
import { formatCurrency, formatPercent } from "@/utils/formatters";
import { useLojaVirtualAutoPricing } from "@/hooks/useLojaVirtualAutoPricing";

interface TableCellsProps {
  product: Product;
  selectedPricing: 'none' | 'shopee' | 'shein' | 'kwai' | 'amazon' | 'tiktok' | 'loja-virtual';
  profitMargin: number | '';
  taxRate: number | '';
  storeCommission?: number;
}

export function TableCells({ product, selectedPricing, profitMargin, taxRate, storeCommission = 5 }: TableCellsProps) {
  // Converter valores vazios para 0 nos cálculos
  const effectiveProfitMargin = profitMargin === '' ? 0 : profitMargin;
  const effectiveTaxRate = taxRate === '' ? 0 : taxRate;

  // Hook para cálculo da Loja Virtual
  const lojaVirtualResults = useLojaVirtualAutoPricing({
    costPrice: product.preco_custo || 0,
    profitMargin: effectiveProfitMargin,
    taxRate: effectiveTaxRate,
    storeCommission,
    fixedFreight: 28
  });

  const renderStandardCells = () => (
    <>
      <TableCell className="text-muted-foreground bg-slate-50">
        {product.preco ? formatPrice(product.preco) : 'N/A'}
      </TableCell>
      <TableCell className="text-muted-foreground bg-slate-50">
        {product.preco_custo ? formatPrice(product.preco_custo) : 'N/A'}
      </TableCell>
      <TableCell className="text-muted-foreground bg-slate-50">
        {product.marca || 'N/A'}
      </TableCell>
    </>
  );

  const renderLojaVirtualCells = () => {
    // Priorizar peso_liquido (em gramas), depois peso_bruto (em kg convertido para g)
    const weightInGrams = product.peso_liquido || (product.peso_bruto ? product.peso_bruto * 1000 : 300);

    return (
      <>
        <TableCell className="text-muted-foreground bg-slate-50">
          {product.preco_custo ? formatPrice(product.preco_custo) : 'N/A'}
        </TableCell>
        <TableCell className="text-muted-foreground bg-slate-50">
          {product.peso_liquido || product.peso_bruto ? `${weightInGrams}g` : '300g (padrão)'}
        </TableCell>
        <TableCell className="font-semibold text-purple-600 bg-purple-50">
          {lojaVirtualResults ? formatCurrency(lojaVirtualResults.sellingPrice) : 'N/A'}
        </TableCell>
        <TableCell className="font-semibold text-purple-600 bg-purple-50">
          {lojaVirtualResults ? formatCurrency(lojaVirtualResults.finalProfit) : 'N/A'}
        </TableCell>
        <TableCell className="font-semibold text-purple-600 bg-purple-50">
          {lojaVirtualResults ? formatPercent(lojaVirtualResults.profitPercentage) : 'N/A'}
        </TableCell>
        <TableCell className="font-semibold text-purple-600 bg-purple-50">
          {lojaVirtualResults ? formatCurrency(lojaVirtualResults.commissionValue) : 'N/A'}
        </TableCell>
        <TableCell className="font-semibold text-purple-600 bg-purple-50">
          {lojaVirtualResults ? formatCurrency(lojaVirtualResults.taxValue) : 'N/A'}
        </TableCell>
      </>
    );
  };

  const renderMarketplaceCells = () => {
    // Priorizar peso_liquido (em gramas), depois peso_bruto (em kg convertido para g)
    const weightInGrams = product.peso_liquido || (product.peso_bruto ? product.peso_bruto * 1000 : 300);

    const calculations = calculateMarketplacePricing(product, selectedPricing, effectiveProfitMargin, effectiveTaxRate);
    const color = getMarketplaceColor(selectedPricing);
    const textClass = `text-${color}-600`;
    const bgClass = `bg-${color}-50`;

    return (
      <>
        <TableCell className="text-muted-foreground bg-slate-50">
          {product.preco_custo ? formatPrice(product.preco_custo) : 'N/A'}
        </TableCell>
        <TableCell className="text-muted-foreground bg-slate-50">
          {product.peso_liquido || product.peso_bruto ? `${weightInGrams}g` : '300g (padrão)'}
        </TableCell>
        <TableCell className={`font-semibold ${textClass} ${bgClass}`}>
          {calculations ? formatCurrency(calculations.finalPrice) : 'N/A'}
        </TableCell>
        <TableCell className={`font-semibold ${textClass} ${bgClass}`}>
          {calculations ? formatCurrency(calculations.actualProfit) : 'N/A'}
        </TableCell>
        <TableCell className={`font-semibold ${textClass} ${bgClass}`}>
          {calculations ? formatPercent(calculations.actualProfitMargin) : 'N/A'}
        </TableCell>
      </>
    );
  };

  if (selectedPricing === 'none') {
    return renderStandardCells();
  }

  if (selectedPricing === 'loja-virtual') {
    return renderLojaVirtualCells();
  }

  return renderMarketplaceCells();
}
