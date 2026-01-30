import { useState } from "react";
import { Package } from "lucide-react";
import { MagaluPricingInputs } from "@/types/magalu-pricing";
import { calculateMagaluPricing, calculateMagaluBreakeven } from "@/utils/magaluPricingCalculations";
import MagaluInputForm from "@/components/pricing/MagaluInputForm";
import MagaluResults from "@/components/pricing/MagaluResults";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MagaluPricing = () => {
    const [inputs, setInputs] = useState<MagaluPricingInputs>({
        costPrice: "20",
        taxRate: "4",
        profitMargin: "30",
        freeShipping: false,
        productWeight: "300",
        shippingMode: "magalu_envios",
        includeShippingInPrice: false,
        estimatedShippingCost: "12.50",
    });

    const [isBreakeven, setIsBreakeven] = useState(false);

    const handleInputChange = (field: keyof MagaluPricingInputs, value: string | boolean) => {
        setInputs(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const results = isBreakeven ? calculateMagaluBreakeven(inputs) : calculateMagaluPricing(inputs);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                    <Package className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Calculadora Magalu</h1>
                    <p className="text-gray-600">Calcule o preço ideal para seus produtos no Magazine Luiza</p>
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
                <MagaluInputForm
                    inputs={inputs}
                    onInputChange={handleInputChange}
                    isBreakeven={isBreakeven}
                />
                <MagaluResults
                    results={results}
                    inputs={inputs}
                    isBreakeven={isBreakeven}
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Informações sobre Taxas - Magalu</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-6 text-sm">
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">Estrutura de Taxas:</h4>
                            <ul className="space-y-1 text-gray-600">
                                <li>• Comissão: 18% sobre o valor da venda</li>
                                <li>• Custo Fixo: R$ 5,00 por pedido</li>
                                <li>• Frete obrigatório para produtos acima de R$ 79</li>
                                <li>• Coparticipação de frete: 50% pago pela Magalu</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">Tabela de Frete (50% já aplicado):</h4>
                            <ul className="space-y-1 text-gray-600 text-xs">
                                <li>• Até 500g: R$ 17,95</li>
                                <li>• 500g a 1kg: R$ 20,45</li>
                                <li>• 1kg a 2kg: R$ 21,45</li>
                                <li>• 2kg a 5kg: R$ 25,45</li>
                                <li>• 5kg a 9kg: R$ 38,95</li>
                                <li>• 9kg a 13kg: R$ 49,45</li>
                                <li>• 13kg a 17kg: R$ 55,95</li>
                                <li>• 23kg a 30kg: R$ 67,45</li>
                                <li>• 30kg a 40kg: R$ 74,45</li>
                                <li>• 40kg a 50kg: R$ 79,95</li>
                                <li>• 50kg a 60kg: R$ 98,95</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default MagaluPricing;
