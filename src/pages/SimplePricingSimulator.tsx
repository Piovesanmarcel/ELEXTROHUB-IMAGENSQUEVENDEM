
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Percent, Scale, Archive } from "lucide-react";
import { useEffect, useState } from "react";

interface PricingProps {
    initialCost?: number;
    initialWeight?: number;
}

export function SimplePricingSimulator({ initialCost = 0, initialWeight = 0 }: PricingProps) {
    const [cost, setCost] = useState(initialCost);
    const [markup, setMarkup] = useState(100); // %
    const [tax, setTax] = useState(10); // %
    const [weight, setWeight] = useState(initialWeight);

    // Calculations
    const salePrice = cost * (1 + markup / 100);
    const profit = salePrice - cost - (salePrice * (tax / 100));
    const shippingEstimate = weight > 0 ? (weight / 1000) * 25 : 0; // Rough estimate: R$25 per kg

    useEffect(() => {
        setCost(initialCost);
    }, [initialCost]);

    useEffect(() => {
        setWeight(initialWeight);
    }, [initialWeight]);

    return (
        <Card className="bg-slate-50 border border-slate-200">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-700">
                    <DollarSign className="w-5 h-5 text-green-600" /> Simulador de Precificação
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label className="text-xs text-slate-500">Custo (R$)</Label>
                        <div className="relative">
                            <span className="absolute left-2 top-2 text-slate-400 text-xs">R$</span>
                            <Input
                                type="number"
                                value={cost}
                                onChange={e => setCost(Number(e.target.value))}
                                className="pl-6 h-8 text-sm"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-slate-500">Markup (%)</Label>
                        <div className="relative">
                            <span className="absolute left-2 top-2 text-slate-400 text-xs">%</span>
                            <Input
                                type="number"
                                value={markup}
                                onChange={e => setMarkup(Number(e.target.value))}
                                className="pl-6 h-8 text-sm"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-slate-500">Impostos (%)</Label>
                        <div className="relative">
                            <span className="absolute left-2 top-2 text-slate-400 text-xs">%</span>
                            <Input
                                type="number"
                                value={tax}
                                onChange={e => setTax(Number(e.target.value))}
                                className="pl-6 h-8 text-sm"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-slate-500">Peso (g)</Label>
                        <div className="relative">
                            <span className="absolute left-2 top-2 text-slate-400 text-xs">g</span>
                            <Input
                                type="number"
                                value={weight}
                                onChange={e => setWeight(Number(e.target.value))}
                                className="pl-6 h-8 text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Preço de Venda:</span>
                        <span className="text-lg font-bold text-slate-800">R$ {salePrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Lucro Líquido Est.:</span>
                        <span className="font-semibold text-green-600">R$ {profit.toFixed(2)}</span>
                    </div>
                    {weight > 0 && (
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500">Frete Est. (Correios):</span>
                            <span className="font-semibold text-blue-600">~R$ {shippingEstimate.toFixed(2)}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
