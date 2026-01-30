

import { useState } from "react";
import { Calculator } from "lucide-react";
import { PricingInputs } from "@/types/pricing";
import { calculatePricing, calculateBreakeven } from "@/utils/pricingCalculations";
import PricingInputForm from "@/components/pricing/PricingInputForm";
import PricingResults from "@/components/pricing/PricingResults";
import PricingInfo from "@/components/pricing/PricingInfo";
import { Button } from "@/components/ui/button";

const Pricing = () => {
  const [inputs, setInputs] = useState<PricingInputs>({
    costPrice: "20",
    taxRate: "4",
    profitMargin: "30",
    freeShipping: true,
  });

  const [isBreakeven, setIsBreakeven] = useState(false);

  const handleInputChange = (field: keyof PricingInputs, value: string | boolean) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const results = isBreakeven ? calculateBreakeven(inputs) : calculatePricing(inputs);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <Calculator className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calculadora de Precificação</h1>
          <p className="text-gray-600">Calcule o preço ideal para seus produtos na Shopee</p>
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
        <PricingInputForm 
          inputs={inputs} 
          onInputChange={handleInputChange}
          isBreakeven={isBreakeven}
        />
        <PricingResults 
          results={results} 
          inputs={inputs}
          isBreakeven={isBreakeven}
        />
      </div>

      <PricingInfo />
    </div>
  );
};

export default Pricing;

