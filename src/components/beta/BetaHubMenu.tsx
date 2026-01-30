
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Palette, Zap, Layout, Monitor, Box, Smartphone, Terminal, Grid, BarChart3, Play, Edit3 } from "lucide-react";

export type BetaVariantId =
    | 'default'
    | 'variant-01-aero'
    | 'variant-02-swiss'
    | 'variant-03-cyber'
    | 'variant-04-stripe'
    | 'variant-05-obsidian'
    | 'variant-06-canvas'
    | 'variant-07-terminal'
    | 'variant-08-spatial'
    | 'variant-09-solar'
    | 'variant-10-luxury'
    | 'variant-11-retro'
    | 'variant-12-brutalist'
    | 'variant-13-wizard'
    | 'variant-14-mobile'
    | 'variant-15-chat'
    | 'variant-16-dashboard'
    | 'variant-17-netflix'
    | 'variant-18-pinterest'
    | 'variant-19-voice'
    | 'variant-20-sketch'
    | string; // Expand as we go

interface BetaHubMenuProps {
    currentVariant: BetaVariantId;
    onSelectVariant: (id: BetaVariantId) => void;
}

const variants = [
    { id: 'default', name: 'Magic Studio v1 (Default)', icon: Layout, description: 'Layout original estável' },
    { id: 'variant-01-aero', name: 'The Aero (Glass)', icon: Box, description: 'Glassmorphism, Blur, Apple Style' },
];

export function BetaHubMenu({ currentVariant, onSelectVariant }: BetaHubMenuProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button
                        size="lg"
                        className="rounded-full h-14 w-14 shadow-2xl bg-slate-900 border-2 border-white/20 hover:scale-110 transition-transform"
                    >
                        <Palette className="w-6 h-6 text-purple-400" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2 text-2xl">
                            <Zap className="w-6 h-6 text-yellow-500" /> Beta Hub
                        </SheetTitle>
                    </SheetHeader>

                    <div className="mt-8">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Escolha seu Estilo</h3>
                        <ScrollArea className="h-[calc(100vh-150px)] pr-4">
                            <div className="grid gap-3">
                                {variants.map((variant) => {
                                    const Icon = variant.icon;
                                    const isActive = currentVariant === variant.id;

                                    return (
                                        <button
                                            key={variant.id}
                                            onClick={() => {
                                                onSelectVariant(variant.id);
                                                setIsOpen(false);
                                            }}
                                            className={`
                        text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-4 group
                        ${isActive
                                                    ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-200'
                                                    : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                                                }
                      `}
                                        >
                                            <div className={`
                        p-3 rounded-lg transition-colors
                        ${isActive ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'}
                      `}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className={`font-bold text-lg ${isActive ? 'text-purple-700' : 'text-slate-800'}`}>
                                                    {variant.name}
                                                </h4>
                                                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                                                    {variant.description}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
