import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { MercadoLivrePricingInputs } from "@/types/mercadolivre-pricing";
import { calculateMercadoLivrePricing, calculateMercadoLivreBreakeven } from "@/utils/mercadolivrePricingCalculations";
import MercadoLivreInputForm from "@/components/pricing/MercadoLivreInputForm";
import MercadoLivreResults from "@/components/pricing/MercadoLivreResults";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MercadoLivrePricing = () => {
    const [inputs, setInputs] = useState<MercadoLivrePricingInputs>({
        costPrice: "20",
        taxRate: "4",
        profitMargin: "30",
        freeShipping: false,
        productWeight: "300",
        shippingMode: "mercado_envios",
        includeShippingInPrice: false,
        estimatedShippingCost: "15.00",
    });

    const [isBreakeven, setIsBreakeven] = useState(false);

    const handleInputChange = (field: keyof MercadoLivrePricingInputs, value: string | boolean) => {
        setInputs(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const results = isBreakeven ? calculateMercadoLivreBreakeven(inputs) : calculateMercadoLivrePricing(inputs);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                    <ShoppingCart className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Calculadora MercadoLivre</h1>
                    <p className="text-gray-600">Calcule o preço ideal para seus produtos no MercadoLivre com comparação entre Classic e Premium</p>
                </div>
            </div>

            <div className="flex gap-4">
                <Button
                    variant={!isBreakeven ? "default" : "outline"}
                    onClick={() => setIsBreakeven(false)}
                >
                    Cálculo com Margem
                </Button>
                <Button
                    variant={isBreakeven ? "default" : "outline"}
                    onClick={() => setIsBreakeven(true)}
                >
                    Breakeven (0% Lucro)
                </Button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <MercadoLivreInputForm
                    inputs={inputs}
                    onInputChange={handleInputChange}
                    isBreakeven={isBreakeven}
                />
                <MercadoLivreResults
                    results={results}
                    inputs={inputs}
                    isBreakeven={isBreakeven}
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Informações sobre Taxas e Frete - MercadoLivre</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-6 text-sm">
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">Estrutura de Taxas:</h4>
                            <ul className="space-y-1 text-gray-600">
                                <li>• Classic: 11,5% + taxa fixa de R$ 6,50</li>
                                <li>• Premium: 16,5% + taxa fixa de R$ 6,50</li>
                                <li>• Frete Grátis: Automático acima de R$ 79,90</li>
                                <li>• Taxa Fixa: R$ 6,50 para todos os anúncios</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">Modalidades de Frete:</h4>
                            <ul className="space-y-1 text-gray-600">
                                <li>• Mercado Envios: Calculado por peso/região</li>
                                <li>• Frete por Conta do Vendedor: Valor definido</li>
                                <li>• Retirada no Local: Sem custo de frete</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default MercadoLivrePricing;
