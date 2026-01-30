
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Percent } from "lucide-react";
import { AmazonPricingResults, AmazonPricingInputs } from "@/types/amazon-pricing";

interface AmazonResultsProps {
  results: AmazonPricingResults;
  inputs: AmazonPricingInputs;
  isBreakeven: boolean;
}

const AmazonResults = ({ results, inputs, isBreakeven }: AmazonResultsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className="glass-effect">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-orange-600" />
          Resultados da Precificação - Amazon
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Preço Final</span>
            </div>
            <p className="text-2xl font-bold text-orange-900">{formatCurrency(results.finalPrice)}</p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                {isBreakeven ? "Margem" : "Lucro Líquido"}
              </span>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {isBreakeven ? "0%" : `${results.profitPercentage.toFixed(1)}%`}
            </p>
            <p className="text-sm text-green-700">{formatCurrency(results.netProfit)}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Custo do Produto</span>
            <span className="font-semibold">{formatCurrency(parseFloat(inputs.costPrice))}</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Comissão Amazon (11,5%)</span>
            <span className="font-semibold">{formatCurrency(results.totalCommission)}</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-orange-100 rounded-lg border border-orange-200">
            <span className="text-sm font-medium text-orange-800">Custos Totais</span>
            <span className="font-bold text-orange-900">{formatCurrency(results.totalCosts)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AmazonResults;
