import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Truck, Package, Crown, Star } from "lucide-react";
import { type MercadoLivrePricingResults, type MercadoLivrePricingInputs, SHIPPING_MODES } from "@/types/mercadolivre-pricing";
import { formatCurrency, formatPercent } from "@/utils/mercadolivrePricingCalculations";

interface MercadoLivreResultsProps {
    results: MercadoLivrePricingResults;
    inputs: MercadoLivrePricingInputs;
    isBreakeven?: boolean;
}

const MercadoLivreResults = ({ results, inputs, isBreakeven = false }: MercadoLivreResultsProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Detalhamento MercadoLivre
                    {isBreakeven && <span className="text-orange-600">(Breakeven)</span>}
                </CardTitle>
                <CardDescription>
                    {isBreakeven
                        ? "Preços no ponto de equilíbrio (sem lucro)"
                        : "Preços sugeridos para Classic e Premium com breakdown completo dos custos"
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Preços Sugeridos - Classic e Premium */}
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Classic */}
                        <div className={`p-4 rounded-lg border ${isBreakeven ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Star className="h-4 w-4 text-blue-600" />
                                    <p className="text-sm font-medium">Classic (11,5%)</p>
                                </div>
                                <p className="text-2xl font-bold">{formatCurrency(results.classic.finalPrice)}</p>
                                <div className="mt-2">
                                    {results.classic.qualifiesForFreeShipping ? (
                                        <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                            <Truck className="h-3 w-3 mr-1" />Frete Grátis
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-gray-600 text-xs">Sem Frete Grátis</Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Premium */}
                        <div className={`p-4 rounded-lg border ${isBreakeven ? 'bg-orange-50 border-orange-200' : 'bg-purple-50 border-purple-200'}`}>
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Crown className="h-4 w-4 text-purple-600" />
                                    <p className="text-sm font-medium">Premium (16,5%)</p>
                                </div>
                                <p className="text-2xl font-bold">{formatCurrency(results.premium.finalPrice)}</p>
                                <div className="mt-2">
                                    {results.premium.qualifiesForFreeShipping ? (
                                        <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                            <Truck className="h-3 w-3 mr-1" />Frete Grátis
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-gray-600 text-xs">Sem Frete Grátis</Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Comparação Detalhada */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Classic Details */}
                        <div>
                            <h4 className="font-medium text-blue-700 mb-3 flex items-center gap-2">
                                <Star className="h-4 w-4" /> Detalhamento Classic
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Custo do Produto:</span>
                                    <span className="font-medium">{formatCurrency(parseFloat(inputs.costPrice) || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Comissão Classic (11,5%):</span>
                                    <span className="font-medium text-red-600">-{formatCurrency(results.classic.categoryCommissionValue)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Taxa Fixa:</span>
                                    <span className="font-medium text-red-600">-{formatCurrency(results.classic.fixedFeeValue)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Impostos ({inputs.taxRate}%):</span>
                                    <span className="font-medium text-red-600">-{formatCurrency(results.classic.taxValue)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-medium">
                                    <span className="text-gray-600">Lucro:</span>
                                    <span className="text-green-600">{formatCurrency(results.classic.actualProfit)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Margem Real:</span>
                                    <span className="text-green-600">{formatPercent(results.classic.actualProfitMargin)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Premium Details - Same structure */}
                        <div>
                            <h4 className="font-medium text-purple-700 mb-3 flex items-center gap-2">
                                <Crown className="h-4 w-4" /> Detalhamento Premium
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Custo do Produto:</span>
                                    <span className="font-medium">{formatCurrency(parseFloat(inputs.costPrice) || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Comissão Premium (16,5%):</span>
                                    <span className="font-medium text-red-600">-{formatCurrency(results.premium.categoryCommissionValue)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Taxa Fixa:</span>
                                    <span className="font-medium text-red-600">-{formatCurrency(results.premium.fixedFeeValue)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Impostos ({inputs.taxRate}%):</span>
                                    <span className="font-medium text-red-600">-{formatCurrency(results.premium.taxValue)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-medium">
                                    <span className="text-gray-600">Lucro:</span>
                                    <span className="text-green-600">{formatCurrency(results.premium.actualProfit)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Margem Real:</span>
                                    <span className="text-green-600">{formatPercent(results.premium.actualProfitMargin)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Resumo Comparativo */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-3">Resumo Comparativo</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-blue-100 rounded">
                                <p className="text-xs text-blue-600 font-medium">CLASSIC</p>
                                <p className="text-lg font-bold text-blue-700">{formatCurrency(results.classic.finalPrice)}</p>
                                <p className="text-xs text-blue-600">Lucro: {formatCurrency(results.classic.actualProfit)}</p>
                            </div>
                            <div className="text-center p-3 bg-purple-100 rounded">
                                <p className="text-xs text-purple-600 font-medium">PREMIUM</p>
                                <p className="text-lg font-bold text-purple-700">{formatCurrency(results.premium.finalPrice)}</p>
                                <p className="text-xs text-purple-600">Lucro: {formatCurrency(results.premium.actualProfit)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default MercadoLivreResults;
