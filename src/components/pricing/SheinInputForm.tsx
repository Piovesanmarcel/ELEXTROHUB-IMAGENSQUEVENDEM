
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gift } from "lucide-react";
import { SheinPricingInputs } from "@/types/shein-pricing";

interface SheinInputFormProps {
  inputs: SheinPricingInputs;
  onInputChange: (field: keyof SheinPricingInputs, value: string | boolean) => void;
  isBreakeven: boolean;
}

const SheinInputForm = ({ inputs, onInputChange, isBreakeven }: SheinInputFormProps) => {
  return (
    <Card className="glass-effect">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gift className="h-5 w-5 text-pink-600" />
          Dados do Produto - Shein
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

          <div className="space-y-2">
            <Label htmlFor="product-weight">Peso do Produto (g)</Label>
            <Input
              id="product-weight"
              type="number"
              placeholder="200"
              value={inputs.productWeight}
              onChange={(e) => onInputChange('productWeight', e.target.value)}
              className="text-center font-semibold"
            />
          </div>
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

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shipping-mode">Modalidade de Entrega</Label>
            <Select value={inputs.shippingMode} onValueChange={(value) => onInputChange('shippingMode', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a modalidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shein_express">Shein Express</SelectItem>
                <SelectItem value="standard">Entrega Padrão</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipping-cost">Custo Estimado de Frete (R$)</Label>
            <Input
              id="shipping-cost"
              type="number"
              step="0.01"
              placeholder="8.00"
              value={inputs.estimatedShippingCost}
              onChange={(e) => onInputChange('estimatedShippingCost', e.target.value)}
              className="text-center font-semibold"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="include-shipping">Incluir Frete no Preço</Label>
            <Switch
              id="include-shipping"
              checked={inputs.includeShippingInPrice}
              onCheckedChange={(checked) => onInputChange('includeShippingInPrice', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="free-shipping">Frete Grátis Incluído</Label>
            <Switch
              id="free-shipping"
              checked={inputs.freeShipping}
              onCheckedChange={(checked) => onInputChange('freeShipping', checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SheinInputForm;
