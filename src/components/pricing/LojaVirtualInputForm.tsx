
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LojaVirtualPricingInputs } from "@/types/loja-virtual-pricing";
import { ShoppingBag } from "lucide-react";

interface LojaVirtualInputFormProps {
  inputs: LojaVirtualPricingInputs;
  onInputChange: (field: keyof LojaVirtualPricingInputs, value: string) => void;
}

const LojaVirtualInputForm = ({ inputs, onInputChange }: LojaVirtualInputFormProps) => {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <ShoppingBag className="h-5 w-5" />
          Dados da Loja Virtual
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cost-price" className="font-semibold text-gray-700">
            Valor do Produto (R$)
          </Label>
          <Input
            id="cost-price"
            type="number"
            step="0.01"
            placeholder="0,00"
            value={inputs.costPrice}
            onChange={(e) => onInputChange("costPrice", e.target.value)}
            className="text-center font-semibold bg-purple-50 border-purple-200 focus:border-purple-400"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="freight" className="font-semibold text-green-700">
            Valor do Frete (R$)
          </Label>
          <Input
            id="freight"
            type="number"
            step="0.01"
            placeholder="0,00"
            value={inputs.freight}
            onChange={(e) => onInputChange("freight", e.target.value)}
            className="text-center font-semibold bg-green-50 border-green-200 focus:border-green-400"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="commission" className="font-semibold text-blue-700">
            Comissão da Loja (%)
          </Label>
          <Input
            id="commission"
            type="number"
            step="0.01"
            placeholder="0,00"
            value={inputs.commission}
            onChange={(e) => onInputChange("commission", e.target.value)}
            className="text-center font-semibold bg-blue-50 border-blue-200 focus:border-blue-400"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="profit-margin" className="font-semibold text-emerald-700">
            Margem de Lucro (%)
          </Label>
          <Input
            id="profit-margin"
            type="number"
            step="0.01"
            placeholder="0,00"
            value={inputs.profitMargin}
            onChange={(e) => onInputChange("profitMargin", e.target.value)}
            className="text-center font-semibold bg-emerald-50 border-emerald-200 focus:border-emerald-400"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tax-rate" className="font-semibold text-orange-700">
            Taxa de Imposto (%)
          </Label>
          <Input
            id="tax-rate"
            type="number"
            step="0.01"
            placeholder="0,00"
            value={inputs.taxRate}
            onChange={(e) => onInputChange("taxRate", e.target.value)}
            className="text-center font-semibold bg-orange-50 border-orange-200 focus:border-orange-400"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default LojaVirtualInputForm;
