
import { Badge } from "@/components/ui/badge";
import { LojaVirtualPricingResults } from "@/types/loja-virtual-pricing";
import { DollarSign, TrendingUp } from "lucide-react";

interface LojaVirtualCompactResultsProps {
  results: LojaVirtualPricingResults | null;
  costPrice: number;
}

const LojaVirtualCompactResults = ({ results, costPrice }: LojaVirtualCompactResultsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getProfitColor = (percentage: number) => {
    if (percentage >= 20) return "text-green-600";
    if (percentage >= 10) return "text-yellow-600";
    return "text-red-600";
  };

  if (!results || costPrice <= 0) {
    return (
      <div className="text-xs text-gray-400 text-center py-2">
        Preço de custo necessário
      </div>
    );
  }

  return (
    <div className="space-y-1 text-xs">
      <div className="flex items-center gap-1">
        <DollarSign className="h-3 w-3 text-purple-600" />
        <span className="font-semibold text-purple-800">
          {formatCurrency(results.sellingPrice)}
        </span>
      </div>
      
      <div className="flex items-center gap-1">
        <TrendingUp className="h-3 w-3 text-green-600" />
        <span className={`font-medium ${getProfitColor(results.profitPercentage)}`}>
          {formatCurrency(results.finalProfit)}
        </span>
        <Badge variant="secondary" className="text-xs px-1 py-0">
          {formatPercentage(results.profitPercentage)}
        </Badge>
      </div>

      <div className="text-gray-500 text-xs">
        Frete: R$ 28,00 (fixo)
      </div>
    </div>
  );
};

export default LojaVirtualCompactResults;
