
import { useState } from "react";
import { Zap } from "lucide-react";
import { KwaiPricingInputs } from "@/types/kwai-pricing";
import { calculateKwaiPricing, calculateKwaiBreakeven } from "@/utils/kwaiPricingCalculations";
import KwaiInputForm from "@/components/pricing/KwaiInputForm";
import KwaiResults from "@/components/pricing/KwaiResults";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const KwaiPricing = () => {
  const [inputs, setInputs] = useState<KwaiPricingInputs>({
    costPrice: "20",
    taxRate: "4",
    profitMargin: "30",
    freeShipping: true,
    productWeight: "250",
    shippingMode: "kwai_express",
    includeShippingInPrice: false,
    estimatedShippingCost: "10.00",
  });

  const [isBreakeven, setIsBreakeven] = useState(false);

  const handleInputChange = (field: keyof KwaiPricingInputs, value: string | boolean) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const results = isBreakeven ? calculateKwaiBreakeven(inputs) : calculateKwaiPricing(inputs);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-yellow-100 rounded-lg">
          <Zap className="h-6 w-6 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calculadora Kwai</h1>
          <p className="text-gray-600">Calcule o preço ideal para seus produtos no Kwai Shop</p>
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
        <KwaiInputForm 
          inputs={inputs} 
          onInputChange={handleInputChange}
          isBreakeven={isBreakeven}
        />
        <KwaiResults 
          results={results} 
          inputs={inputs}
          isBreakeven={isBreakeven}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações sobre Taxas - Kwai</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Estrutura de Taxas:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Comissão: 10% sobre o valor da venda</li>
                <li>• Taxa Fixa: R$ 1,50 por produto vendido</li>
                <li>• Frete Grátis: Para pedidos acima de R$ 50</li>
                <li>• Taxa de Processamento: 2,0%</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Modalidades de Entrega:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Kwai Express: 3-7 dias úteis</li>
                <li>• Entrega Padrão: 7-15 dias úteis</li>
                <li>• Retirada no Local: Disponível</li>
                <li>• Cálculo por peso e região</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KwaiPricing;
