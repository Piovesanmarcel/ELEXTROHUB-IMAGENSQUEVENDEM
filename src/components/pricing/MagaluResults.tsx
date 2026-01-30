import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Percent, Calculator } from "lucide-react";
import { MagaluPricingResults, MagaluPricingInputs } from "@/types/magalu-pricing";

interface MagaluResultsProps {
    results: MagaluPricingResults;
    inputs: MagaluPricingInputs;
    isBreakeven: boolean;
}

const MagaluResults = ({ results, inputs, isBreakeven }: MagaluResultsProps) => {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const productWeight = parseFloat(inputs.productWeight) || 300;
    const showShippingCost = results.finalPrice > 79 && !inputs.freeShipping;

    return (
        <Card className="glass-effect">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    Resultados da Precificação - Magalu
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium text-purple-800">Preço Final</span>
                        </div>
                        <p className="text-2xl font-bold text-purple-900">{formatCurrency(results.finalPrice)}</p>
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
                        <span className="text-sm text-gray-600">Comissão Magalu (18%)</span>
                        <span className="font-semibold">{formatCurrency(results.totalCommission)}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Custo Fixo por Pedido</span>
                        <span className="font-semibold">{formatCurrency(results.fixedFee)}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Impostos ({inputs.taxRate}%)</span>
                        <span className="font-semibold">{formatCurrency(results.taxAmount)}</span>
                    </div>

                    {showShippingCost && (
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                            <span className="text-sm text-blue-600">Frete ({productWeight}g - 50% coparticipação)</span>
                            <span className="font-semibold text-blue-700">{formatCurrency(results.shippingCost)}</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center p-3 bg-purple-100 rounded-lg border border-purple-200">
                        <span className="text-sm font-medium text-purple-800">Custos Totais</span>
                        <span className="font-bold text-purple-900">{formatCurrency(results.totalCosts)}</span>
                    </div>
                </div>

                {results.breakdownMessage && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Calculator className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">Resumo do Cálculo</span>
                        </div>
                        <p className="text-sm text-blue-700">{results.breakdownMessage}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default MagaluResults;
