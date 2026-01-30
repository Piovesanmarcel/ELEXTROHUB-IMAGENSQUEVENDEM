

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Percent } from "lucide-react";
import { type PricingResults, type PricingInputs } from "@/types/pricing";
import { formatCurrency, formatPercent } from "@/utils/pricingCalculations";

interface PricingResultsProps {
  results: PricingResults;
  inputs: PricingInputs;
  isBreakeven?: boolean;
}

const PricingResults = ({ results, inputs, isBreakeven = false }: PricingResultsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Percent className="h-5 w-5" />
          Detalhamento de Custos
          {isBreakeven && <span className="text-orange-600">(Breakeven)</span>}
        </CardTitle>
        <CardDescription>
          {isBreakeven 
            ? "Preço no ponto de equilíbrio (sem lucro)" 
            : "Breakdown completo dos custos e preço sugerido"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Preço Final Sugerido */}
          <div className={`p-4 rounded-lg border ${isBreakeven ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
            <div className="text-center">
              <p className={`text-sm font-medium ${isBreakeven ? 'text-orange-600' : 'text-green-600'}`}>
                {isBreakeven ? 'Preço Breakeven' : 'Preço de Venda Sugerido'}
              </p>
              <p className={`text-3xl font-bold ${isBreakeven ? 'text-orange-700' : 'text-green-700'}`}>
                {formatCurrency(results.finalPrice)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Detalhamento */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Custo do Produto:</span>
              <span className="font-medium">{formatCurrency(parseFloat(inputs.costPrice) || 0)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Comissão Padrão (14%):</span>
              <span className="font-medium text-red-600">-{formatCurrency(results.standardCommissionValue)}</span>
            </div>

            {inputs.freeShipping && (
              <div className="flex justify-between">
                <span className="text-gray-600">Comissão Frete Grátis (6%):</span>
                <span className="font-medium text-red-600">-{formatCurrency(results.freeShippingCommissionValue)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-gray-600">Taxa por Item:</span>
              <span className="font-medium text-red-600">-{formatCurrency(results.itemFee)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Impostos ({inputs.taxRate}%):</span>
              <span className="font-medium text-red-600">-{formatCurrency(results.taxValue)}</span>
            </div>

            <Separator />

            <div className="flex justify-between">
              <span className="text-gray-600">Receita Líquida:</span>
              <span className="font-medium">{formatCurrency(results.netRevenue)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Lucro:</span>
              <span className={`font-medium ${isBreakeven ? 'text-orange-600' : 'text-green-600'}`}>
                {formatCurrency(results.actualProfit)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Margem de Lucro Real:</span>
              <span className={`font-medium ${isBreakeven ? 'text-orange-600' : 'text-green-600'}`}>
                {formatPercent(results.actualProfitMargin)}
              </span>
            </div>
          </div>

          {/* Resumo Visual */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Resumo</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Custo</p>
                <p className="font-medium text-red-600">{formatCurrency(parseFloat(inputs.costPrice) || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Taxas</p>
                <p className="font-medium text-red-600">{formatCurrency(results.totalDeductions - (parseFloat(inputs.costPrice) || 0))}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Lucro</p>
                <p className={`font-medium ${isBreakeven ? 'text-orange-600' : 'text-green-600'}`}>
                  {formatCurrency(results.actualProfit)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PricingResults;

