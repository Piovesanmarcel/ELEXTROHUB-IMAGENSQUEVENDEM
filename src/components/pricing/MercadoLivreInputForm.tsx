import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Package } from "lucide-react";
import { type MercadoLivrePricingInputs, MERCADOLIVRE_LISTING_FEES, FREE_SHIPPING_THRESHOLD } from "@/types/mercadolivre-pricing";
import { calculateShippingCost } from "@/utils/mercadolivrePricingCalculations";

interface MercadoLivreInputFormProps {
    inputs: MercadoLivrePricingInputs;
    onInputChange: (field: keyof MercadoLivrePricingInputs, value: string | boolean) => void;
    isBreakeven?: boolean;
}

const MercadoLivreInputForm = ({ inputs, onInputChange, isBreakeven = false }: MercadoLivreInputFormProps) => {
    const getEstimatedShipping = () => {
        if (inputs.shippingMode === 'mercado_envios') {
            const weight = parseFloat(inputs.productWeight) || 0;
            return calculateShippingCost(weight, inputs.shippingMode);
        }
        return 0;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Dados do Produto - MercadoLivre
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

                {/* Seção de Frete */}
                <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <Label className="text-base font-medium">Configurações de Frete</Label>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="product-weight">Peso do Produto (gramas)</Label>
                        <Input
                            id="product-weight"
                            type="number"
                            step="1"
                            placeholder="300"
                            value={inputs.productWeight}
                            onChange={(e) => onInputChange('productWeight', e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="shipping-mode">Modalidade de Entrega</Label>
                        <Select value={inputs.shippingMode} onValueChange={(value: any) => onInputChange('shippingMode', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a modalidade" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mercado_envios">Mercado Envios</SelectItem>
                                <SelectItem value="seller_shipping">Frete por Conta do Vendedor</SelectItem>
                                <SelectItem value="pickup_only">Retirada no Local</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {inputs.shippingMode === 'mercado_envios' && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm font-medium text-blue-800">Estimativa Mercado Envios:</p>
                            <p className="text-blue-600">R$ {getEstimatedShipping().toFixed(2)}</p>
                        </div>
                    )}

                    {inputs.shippingMode === 'seller_shipping' && (
                        <div className="space-y-2">
                            <Label htmlFor="estimated-shipping">Custo Estimado de Frete (R$)</Label>
                            <Input
                                id="estimated-shipping"
                                type="number"
                                step="0.01"
                                placeholder="15,00"
                                value={inputs.estimatedShippingCost}
                                onChange={(e) => onInputChange('estimatedShippingCost', e.target.value)}
                            />
                        </div>
                    )}

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="include-shipping"
                            checked={inputs.includeShippingInPrice}
                            onChange={(e) => onInputChange('includeShippingInPrice', e.target.checked)}
                            className="rounded border-gray-300"
                        />
                        <Label htmlFor="include-shipping">Incluir custo de frete no preço do produto</Label>
                    </div>
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
                    <div className="p-3 bg-orange-50 rounded-lg">
                        <p className="text-orange-700 font-medium">0% (Breakeven)</p>
                    </div>
                )}

                <div className="p-3 bg-blue-50 rounded-lg text-sm">
                    <p className="font-medium text-blue-800">Frete Grátis Automático:</p>
                    <p className="text-blue-600">
                        Produtos com preço acima de R$ {FREE_SHIPPING_THRESHOLD.toFixed(2)} qualificam automaticamente para frete grátis
                    </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                    <p className="font-medium text-gray-800">Taxas Padrão MercadoLivre:</p>
                    <div className="text-gray-600 space-y-1">
                        <p>• Classic: {MERCADOLIVRE_LISTING_FEES.classic}% de comissão</p>
                        <p>• Premium: {MERCADOLIVRE_LISTING_FEES.premium}% de comissão</p>
                        <p>• Taxa fixa: R$ 6,50 para todos os anúncios</p>
                    </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                    <p className="font-medium text-gray-800">Fórmula Simplificada:</p>
                    <p className="text-gray-600">
                        (CUSTO + R$ 6,50 + FRETE*) ÷ (1 - MARGEM - IMPOSTO - COMISSÃO)
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

export default MercadoLivreInputForm;
