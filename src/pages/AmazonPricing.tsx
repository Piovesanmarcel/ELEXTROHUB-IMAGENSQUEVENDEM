
import { useState } from "react";
import { Truck } from "lucide-react";
import { AmazonPricingInputs } from "@/types/amazon-pricing";
import { calculateAmazonPricing, calculateAmazonBreakeven } from "@/utils/amazonPricingCalculations";
import AmazonInputForm from "@/components/pricing/AmazonInputForm";
import AmazonResults from "@/components/pricing/AmazonResults";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AmazonPricing = () => {
  const [inputs, setInputs] = useState<AmazonPricingInputs>({
    costPrice: "20",
    taxRate: "4",
    profitMargin: "30",
    freeShipping: false,
    productWeight: "400",
    shippingMode: "fba",
    includeShippingInPrice: false,
    estimatedShippingCost: "18.00",
    category: "electronics",
  });

  const [isBreakeven, setIsBreakeven] = useState(false);

  const handleInputChange = (field: keyof AmazonPricingInputs, value: string | boolean) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const results = isBreakeven ? calculateAmazonBreakeven(inputs) : calculateAmazonPricing(inputs);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-100 rounded-lg">
          <Truck className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calculadora Amazon</h1>
          <p className="text-gray-600">Calcule o preço ideal para seus produtos na Amazon Brasil</p>
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
        <AmazonInputForm 
          inputs={inputs} 
          onInputChange={handleInputChange}
          isBreakeven={isBreakeven}
        />
        <AmazonResults 
          results={results} 
          inputs={inputs}
          isBreakeven={isBreakeven}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações sobre Taxas - Amazon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Estrutura de Taxas:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Comissão: 11,5% sobre o valor da venda</li>
                <li>• Taxa Fixa: R$ 5,00 por produto vendido</li>
                <li>• FBA: Taxa adicional de armazenagem</li>
                <li>• Prime: Frete grátis incluído</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Modalidades de Entrega:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• FBA (Fulfillment by Amazon): 1-2 dias</li>
                <li>• Entrega pelo Vendedor: 7-15 dias</li>
                <li>• Amazon Prime: Frete grátis</li>
                <li>• Cálculo por peso e categoria</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AmazonPricing;
