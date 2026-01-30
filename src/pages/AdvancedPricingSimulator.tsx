
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    DollarSign, Percent, ShoppingBag, ShoppingCart,
    Store, Globe, Package, TrendingUp, CreditCard
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface PricingProps {
    productName?: string;
    productSku?: string;
    initialCost?: number;
    initialWeight?: number;
    productImage?: string;
}

const MARKETPLACES = [
    { id: 'default', name: 'Padrão', color: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200', icon: Store },
    { id: 'ml', name: 'Mercado Livre', color: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200', icon: ShoppingBag },
    { id: 'magalu', name: 'Magalu', color: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200', icon: Globe }, // Using Globe as generic
    { id: 'shopee', name: 'Shopee', color: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200', icon: ShoppingCart },
    { id: 'shein', name: 'Shein', color: 'bg-black text-white hover:bg-slate-800', icon: Store },
    { id: 'kwai', name: 'Kwai', color: 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100', icon: TrendingUp },
    { id: 'amazon', name: 'Amazon', color: 'bg-slate-100 text-slate-800 border-orange-200 hover:bg-orange-50 border-b-4 border-b-orange-400', icon: Package }, // Amazon style hint
    { id: 'tiktok', name: 'TikTok Shop', color: 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100', icon: TrendingUp },
    { id: 'store', name: 'Loja Virtual', color: 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200', icon: Globe },
];

export function AdvancedPricingSimulator({
    productName = "Produto Sem Nome",
    productSku = "CODE-000",
    initialCost = 0,
    initialWeight = 0,
    productImage
}: PricingProps) {
    const [cost, setCost] = useState(initialCost);
    const [markup, setMarkup] = useState(30); // Default 30% margin
    const [tax, setTax] = useState(4); // Default 4% tax
    const [weight, setWeight] = useState(initialWeight);
    const [selectedMarketplace, setSelectedMarketplace] = useState('default');

    // Marketplace fees (simulated)
    const getMarketplaceFee = (id: string) => {
        switch (id) {
            case 'ml': return 11; // 11% Classico
            case 'shopee': return 14;
            case 'amazon': return 15;
            case 'magalu': return 12;
            case 'default': return 0;
            default: return 10;
        }
    };

    const marketplaceFee = getMarketplaceFee(selectedMarketplace);

    // Calculate Sale Price based on Desired Margin (Markup)
    // Simplified Formula: SalePrice = Cost / (1 - (Tax + Fee + ProfitMargin)/100) ???
    // Or usually Markup is on Cost? 
    // Let's use Markup on Cost for simplicity as visualized in current code, but robust pricing usually works backwards from desired profit margin.
    // Visual screenshot shows "Margem Real". 

    // Let's calculate Sale Price = Cost * (1 + Markup/100) first (Standard Markup pricing)
    const salePrice = cost * (1 + markup / 100);

    // Costs:
    const taxCost = salePrice * (tax / 100);
    const feeCost = salePrice * (marketplaceFee / 100);
    const totalDeductions = taxCost + feeCost + cost;

    const profit = salePrice - totalDeductions;
    const realMargin = (profit / salePrice) * 100;

    useEffect(() => { setCost(initialCost); }, [initialCost]);
    useEffect(() => { setWeight(initialWeight); }, [initialWeight]);

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">

            {/* 1. PRODUCT SUMMARY ROW (Similar to screenshot) */}
            <Card className="border-none shadow-md bg-white overflow-hidden">
                <div className="flex flex-col md:flex-row items-center">
                    {/* Image & Basic Info */}
                    <div className="flex items-center gap-4 p-4 w-full md:w-5/12 border-b md:border-b-0 md:border-r border-slate-100">
                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex-shrink-0 overflow-hidden border border-purple-200">
                            {productImage ? (
                                <img src={productImage} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-purple-400"><Package className="w-6 h-6" /></div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-bold text-slate-800 truncate text-sm" title={productName}>{productName}</h4>
                            <div className="flex gap-2 mt-1">
                                <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full border border-slate-200">{productSku}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-5 w-full md:w-7/12 text-center divide-x divide-slate-100 bg-slate-50/50">
                        <div className="p-3 flex flex-col justify-center">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Custo</span>
                            <span className="font-mono text-sm text-slate-600">R$ {cost.toFixed(2)}</span>
                        </div>
                        <div className="p-3 flex flex-col justify-center">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Peso</span>
                            <span className="font-mono text-sm text-slate-600">{weight}g</span>
                        </div>
                        <div className="p-3 flex flex-col justify-center bg-yellow-50/50">
                            <span className="text-[10px] text-yellow-600 uppercase font-bold">Venda</span>
                            <span className="font-bold text-sm text-yellow-700">R$ {salePrice.toFixed(2)}</span>
                        </div>
                        <div className="p-3 flex flex-col justify-center">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Lucro</span>
                            <span className={`font-bold text-sm ${profit > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                R$ {profit.toFixed(2)}
                            </span>
                        </div>
                        <div className="p-3 flex flex-col justify-center">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Margem</span>
                            <span className={`font-bold text-sm ${realMargin > 15 ? 'text-green-600' : realMargin > 0 ? 'text-yellow-600' : 'text-red-500'}`}>
                                {realMargin.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* 2. CONFIGURATION PANEL */}
            <Card className="border shadow-sm bg-white">
                <CardHeader className="pb-2 border-b border-slate-50">
                    <CardTitle className="text-sm font-bold text-slate-700 flex justify-between items-center">
                        <span>Configurações de Precificação</span>
                        <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Taxa {marketplaceFee}%</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">

                    {/* Marketplace Selectors */}
                    <div className="grid grid-cols-3 gap-3">
                        {MARKETPLACES.map(m => {
                            const Icon = m.icon;
                            const isSelected = selectedMarketplace === m.id;
                            return (
                                <button
                                    key={m.id}
                                    onClick={() => setSelectedMarketplace(m.id)}
                                    className={`
                        relative flex items-center justify-center gap-2 p-3 rounded-lg border transition-all text-xs font-bold
                        ${isSelected
                                            ? `${m.color} ring-2 ring-offset-1 ring-purple-400 shadow-md`
                                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                                        }
                      `}
                                >
                                    <Icon className={`w-4 h-4 ${isSelected ? '' : 'opacity-50'}`} />
                                    {m.name}
                                    {isSelected && <div className="absolute top-0 right-0 w-2 h-2 bg-purple-500 rounded-full -mr-1 -mt-1" />}
                                </button>
                            );
                        })}
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-blue-600 uppercase tracking-wider">Margem de Markup (%)</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={markup}
                                    onChange={e => setMarkup(Number(e.target.value))}
                                    className="h-10 text-lg font-bold border-blue-100 focus:border-blue-300 bg-blue-50/50 text-blue-900"
                                />
                                <Percent className="absolute right-3 top-3 w-4 h-4 text-blue-300" />
                            </div>
                            <p className="text-[10px] text-slate-400">Define o preço de venda sobre o custo.</p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-green-600 uppercase tracking-wider">Impostos & Taxas (%)</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={tax}
                                    onChange={e => setTax(Number(e.target.value))}
                                    className="h-10 text-lg font-bold border-green-100 focus:border-green-300 bg-green-50/50 text-green-900"
                                />
                                <Percent className="absolute right-3 top-3 w-4 h-4 text-green-300" />
                            </div>
                            <p className="text-[10px] text-slate-400">Impostos fixos (Ex: Simples Nacional).</p>
                        </div>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
