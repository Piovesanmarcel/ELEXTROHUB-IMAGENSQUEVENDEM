
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Zap } from "lucide-react";
import { KwaiPricingInputs } from "@/types/kwai-pricing";

interface KwaiInputFormProps {
  inputs: KwaiPricingInputs;
  onInputChange: (field: keyof KwaiPricingInputs, value: string | boolean) => void;
  isBreakeven: boolean;
}

const KwaiInputForm = ({ inputs, onInputChange, isBreakeven }: KwaiInputFormProps) => {
  return (
    <Card className="glass-effect">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-yellow-600" />
          Dados do Produto - Kwai
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cost-price">Preço de Custo (R$)</Label>
            <Input
              id="cost-price"
              type="number"
              step="0.01"
              placeholder="20.00"
              value={inputs.costPrice}
              onChange={(e) => onInputChange('costPrice', e.target.value)}
              className="text-center font-semibold"
            />
          </div>

          {!isBreakeven && (
            <div className="space-y-2">
              <Label htmlFor="profit-margin">Margem de Lucro (%)</Label>
              <Input
                id="profit-margin"
                type="number"
                step="0.1"
                placeholder="30"
                value={inputs.profitMargin}
                onChange={(e) => onInputChange('profitMargin', e.target.value)}
                className="text-center font-semibold"
              />
            </div>
          )}
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
            className="text-center font-semibold"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="free-shipping">Frete Grátis (acima de R$ 50)</Label>
          <Switch
            id="free-shipping"
            checked={inputs.freeShipping}
            onCheckedChange={(checked) => onInputChange('freeShipping', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default KwaiInputForm;
