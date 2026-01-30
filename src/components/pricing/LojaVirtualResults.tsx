
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LojaVirtualPricingInputs, LojaVirtualPricingResults } from "@/types/loja-virtual-pricing";
import { Calculator, TrendingUp, DollarSign, Package, Receipt, Target } from "lucide-react";

interface LojaVirtualResultsProps {
  results: LojaVirtualPricingResults;
  inputs: LojaVirtualPricingInputs;
}

const LojaVirtualResults = ({ results, inputs }: LojaVirtualResultsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getProfitColor = (percentage: number) => {
    if (percentage >= 20) return "text-green-600 bg-green-50 border-green-200";
    if (percentage >= 10) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <Calculator className="h-5 w-5" />
          Resultados da Loja Virtual
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preço de Venda Sugerido */}
        <div className="p-4 rounded-lg bg-blue-50 border-2 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">Preço de Venda Sugerido</span>
          </div>
          <p className="text-2xl font-bold text-blue-800">
            {formatCurrency(results.sellingPrice)}
          </p>
        </div>

        {/* Custos Detalhados */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4 text-gray-600" />
              <span className="text-xs font-semibold text-gray-700">Produto + Frete</span>
            </div>
            <p className="text-sm font-bold text-gray-800">
              {formatCurrency(results.totalWithFreight)}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-semibold text-blue-700">Comissão</span>
            </div>
            <p className="text-sm font-bold text-blue-800">
              {formatCurrency(results.commissionValue)}
            </p>
            <p className="text-xs text-blue-600">
              {inputs.commission}% sobre venda
            </p>
          </div>

          <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
            <div className="flex items-center gap-2 mb-1">
              <Receipt className="h-4 w-4 text-orange-600" />
              <span className="text-xs font-semibold text-orange-700">Impostos</span>
            </div>
            <p className="text-sm font-bold text-orange-800">
              {formatCurrency(results.taxValue)}
            </p>
            <p className="text-xs text-orange-600">
              {inputs.taxRate}% sobre venda
            </p>
          </div>

          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center gap-2 mb-1">
              <Calculator className="h-4 w-4 text-red-600" />
              <span className="text-xs font-semibold text-red-700">Custos Totais</span>
            </div>
            <p className="text-sm font-bold text-red-800">
              {formatCurrency(results.totalCosts)}
            </p>
          </div>
        </div>

        {/* Lucro Final */}
        <div className={`p-4 rounded-lg border-2 ${getProfitColor(results.profitPercentage)}`}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm font-semibold">Lucro Final</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">
              {formatCurrency(results.finalProfit)}
            </p>
            <Badge variant="secondary" className="font-bold">
              {formatPercentage(results.profitPercentage)} sobre a venda
            </Badge>
          </div>
        </div>

        {/* Resumo do Cálculo */}
        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Resumo do Cálculo:</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• Preço de Venda: {formatCurrency(results.sellingPrice)}</p>
            <p>• Produto + Frete: -{formatCurrency(results.totalWithFreight)}</p>
            <p>• Comissão ({inputs.commission}%): -{formatCurrency(results.commissionValue)}</p>
            <p>• Impostos ({inputs.taxRate}%): -{formatCurrency(results.taxValue)}</p>
            <p className="font-semibold border-t pt-1">• Lucro Final: {formatCurrency(results.finalProfit)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LojaVirtualResults;
