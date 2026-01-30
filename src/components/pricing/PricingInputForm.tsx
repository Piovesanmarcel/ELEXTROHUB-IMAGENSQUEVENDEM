

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign } from "lucide-react";
import { type PricingInputs } from "@/types/pricing";

interface PricingInputFormProps {
  inputs: PricingInputs;
  onInputChange: (field: keyof PricingInputs, value: string | boolean) => void;
  isBreakeven?: boolean;
}

const PricingInputForm = ({ inputs, onInputChange, isBreakeven = false }: PricingInputFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Dados do Produto
          {isBreakeven && <span className="text-orange-600">(Breakeven)</span>}
        </CardTitle>
        <CardDescription>
          {isBreakeven 
            ? "Calculando preço no ponto de equilíbrio (0% de lucro)"
            : "Insira as informações do seu produto para calcular o preço de venda ideal"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cost-price">Custo do Produto (R$)</Label>
          <Input
            id="cost-price"
            type="number"
            step="0.01"
            placeholder="0,00"
            value={inputs.costPrice}
            onChange={(e) => onInputChange('costPrice', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tax-rate">Taxa de Imposto (%)</Label>
          <Input
            id="tax-rate"
            type="number"
            step="0.1"
            placeholder="4"
            value={inputs.taxRate}
            onChange={(e) => onInputChange('taxRate', e.target.value)}
          />
        </div>

        {!isBreakeven && (
          <div className="space-y-2">
            <Label htmlFor="profit-margin">Margem de Lucro Desejada (%)</Label>
            <Input
              id="profit-margin"
              type="number"
              step="0.1"
              placeholder="30"
              value={inputs.profitMargin}
              onChange={(e) => onInputChange('profitMargin', e.target.value)}
            />
          </div>
        )}

        {isBreakeven && (
          <div className="space-y-2">
            <Label>Margem de Lucro</Label>
            <div className="p-3 bg-orange-50 rounded-lg">
              <p className="text-orange-700 font-medium">0% (Breakeven)</p>
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="free-shipping"
            checked={inputs.freeShipping}
            onChange={(e) => onInputChange('freeShipping', e.target.checked)}
            className="rounded border-gray-300"
          />
          <Label htmlFor="free-shipping">Programa Frete Grátis (+6% comissão)</Label>
        </div>

        {/* Fórmula EXATA do Excel */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
          <p className="font-medium text-blue-800">Fórmula do Excel:</p>
          <p className="text-blue-600">(CUSTO DO PRODUTO + FIXO R$4) ÷ (1 - MARGEM{isBreakeven ? ' DE 0%' : ' DE 30%'} - IMPOSTO 4% - COMISSÃO DE 20%)</p>
          <p className="text-blue-600">(R$20 + R$4) ÷ (1 - {isBreakeven ? '0,00' : '0,30'} - 0,04 - 0,20) = R$24 ÷ {isBreakeven ? '0,76' : '0,46'} = R${isBreakeven ? '31,58' : '52,17'}</p>
          <p className="text-xs text-blue-500 mt-1">*Valores atualizados conforme seus inputs</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PricingInputForm;

