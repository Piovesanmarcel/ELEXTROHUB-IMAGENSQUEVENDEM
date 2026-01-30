
import { useState } from "react";
import { Calculator } from "lucide-react";
import { TiktokPricingInputs } from "@/types/tiktok-pricing";
import { calculateTikTokPricing, calculateTikTokBreakeven } from "@/utils/tiktokPricingCalculations";
import TiktokInputForm from "@/components/pricing/TiktokInputForm";
import TiktokResults from "@/components/pricing/TiktokResults";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TiktokPricing = () => {
  const [inputs, setInputs] = useState<TiktokPricingInputs>({
    costPrice: "20",
    taxRate: "4",
    profitMargin: "30",
    freeShipping: true,
    productWeight: "150",
    shippingMode: "tiktok_shipping",
    includeShippingInPrice: true,
    estimatedShippingCost: "6.00",
  });

  const [isBreakeven, setIsBreakeven] = useState(false);

  const handleInputChange = (field: keyof TiktokPricingInputs, value: string | boolean) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const results = isBreakeven ? calculateTikTokBreakeven(inputs) : calculateTikTokPricing(inputs);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-100 rounded-lg">
          <Calculator className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calculadora TikTok Shop</h1>
          <p className="text-gray-600">Calcule o preço ideal para seus produtos no TikTok Shop</p>
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
        <TiktokInputForm 
          inputs={inputs} 
          onInputChange={handleInputChange}
          isBreakeven={isBreakeven}
        />
        <TiktokResults 
          results={results} 
          inputs={inputs}
          isBreakeven={isBreakeven}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações sobre Taxas - TikTok Shop</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Estrutura de Taxas:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Comissão: 5% sobre o valor da venda</li>
                <li>• Taxa de Pagamento: 3,9% por transação</li>
                <li>• Taxa Fixa: R$ 2,00 por produto vendido</li>
                <li>• Frete: Geralmente grátis para o cliente</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Modalidades de Entrega:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• TikTok Shipping: 5-10 dias úteis</li>
                <li>• Entrega Expressa: 3-7 dias úteis</li>
                <li>• Frete incluso no preço final</li>
                <li>• Sem custo adicional para comprador</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TiktokPricing;
