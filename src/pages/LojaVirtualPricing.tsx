
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { LojaVirtualPricingInputs } from "@/types/loja-virtual-pricing";
import { calculateLojaVirtualPricing } from "@/utils/lojaVirtualPricingCalculations";
import LojaVirtualInputForm from "@/components/pricing/LojaVirtualInputForm";
import LojaVirtualResults from "@/components/pricing/LojaVirtualResults";

const LojaVirtualPricing = () => {
  const [inputs, setInputs] = useState<LojaVirtualPricingInputs>({
    costPrice: "100",
    commission: "5",
    freight: "15",
    profitMargin: "20",
    taxRate: "8",
  });

  const handleInputChange = (field: keyof LojaVirtualPricingInputs, value: string) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const results = calculateLojaVirtualPricing(inputs);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <ShoppingBag className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calculadora Loja Virtual</h1>
          <p className="text-gray-600">Calcule o preço de venda considerando todos os custos e margem desejada</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <LojaVirtualInputForm 
          inputs={inputs} 
          onInputChange={handleInputChange}
        />
        <LojaVirtualResults 
          results={results} 
          inputs={inputs}
        />
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-semibold text-purple-800 mb-2">Como funciona o novo cálculo:</h3>
        <div className="text-sm text-purple-700 space-y-1">
          <p>1. <strong>Base de Cálculo:</strong> Produto + Frete</p>
          <p>2. <strong>Preço de Venda:</strong> Calculado para atingir a margem desejada após todos os custos</p>
          <p>3. <strong>Comissão da Loja:</strong> Percentual cobrado sobre o preço de venda</p>
          <p>4. <strong>Impostos:</strong> Percentual sobre o preço de venda</p>
          <p>5. <strong>Lucro Final:</strong> Preço de Venda - (Produto + Frete + Comissão + Impostos)</p>
          <p className="pt-2 font-semibold">Fórmula: Preço = (Produto + Frete) ÷ (1 - Margem% - Comissão% - Imposto%)</p>
        </div>
      </div>
    </div>
  );
};

export default LojaVirtualPricing;
