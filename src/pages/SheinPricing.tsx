
import { useState } from "react";
import { Gift } from "lucide-react";
import { SheinPricingInputs } from "@/types/shein-pricing";
import { calculateSheinPricing, calculateSheinBreakeven } from "@/utils/sheinPricingCalculations";
import SheinInputForm from "@/components/pricing/SheinInputForm";
import SheinResults from "@/components/pricing/SheinResults";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SheinPricing = () => {
  const [inputs, setInputs] = useState<SheinPricingInputs>({
    costPrice: "20",
    taxRate: "4",
    profitMargin: "30",
    freeShipping: true,
    productWeight: "200",
    shippingMode: "shein_express",
    includeShippingInPrice: true,
    estimatedShippingCost: "8.00",
  });

  const [isBreakeven, setIsBreakeven] = useState(false);

  const handleInputChange = (field: keyof SheinPricingInputs, value: string | boolean) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const results = isBreakeven ? calculateSheinBreakeven(inputs) : calculateSheinPricing(inputs);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-pink-100 rounded-lg">
          <Gift className="h-6 w-6 text-pink-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calculadora Shein</h1>
          <p className="text-gray-600">Calcule o preço ideal para seus produtos na Shein</p>
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
        <SheinInputForm 
          inputs={inputs} 
          onInputChange={handleInputChange}
          isBreakeven={isBreakeven}
        />
        <SheinResults 
          results={results} 
          inputs={inputs}
          isBreakeven={isBreakeven}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações sobre Taxas - Shein</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Estrutura de Taxas:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Comissão: 17,5% sobre o valor da venda</li>
                <li>• Taxa Fixa: R$ 3,00 por produto vendido</li>
                <li>• Frete: Incluso no preço final</li>
                <li>• Taxa de Processamento: 2,5%</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Modalidades de Entrega:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Shein Express: 7-15 dias úteis</li>
                <li>• Entrega Padrão: 15-25 dias úteis</li>
                <li>• Frete sempre incluso no preço</li>
                <li>• Sem custo adicional para o cliente</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SheinPricing;
