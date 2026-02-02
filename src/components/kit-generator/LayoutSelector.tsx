import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
    Sparkles,
    Columns2,
    Layers,
    ArrowUpRight,
    Triangle,
    Circle
} from 'lucide-react';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/ui/hover-card';
import type { KitLayout, LayoutOption } from '@/types/kit-generator';
import { layoutOptions } from '@/types/kit-generator';

interface LayoutSelectorProps {
    value: KitLayout;
    onChange: (layout: KitLayout) => void;
    disabled?: boolean;
}

const iconMap = {
    auto: Sparkles,
    columns: Columns2,
    layers: Layers,
    'arrow-up-right': ArrowUpRight,
    triangle: Triangle,
    circle: Circle
};

const layoutPreviews: Record<KitLayout, { element: React.ReactNode; detailedDescription: string }> = {
    auto: {
        element: (
            <div className="flex flex-col items-center justify-center gap-2">
                <Sparkles className="h-10 w-10 text-primary animate-pulse" />
                <div className="flex gap-1.5 opacity-60">
                    <div className="w-5 h-7 bg-primary/30 rounded-sm" />
                    <div className="w-6 h-8 bg-primary/50 rounded-sm" />
                    <div className="w-5 h-7 bg-primary/30 rounded-sm" />
                </div>
            </div>
        ),
        detailedDescription: 'A IA analisa seus produtos e escolhe automaticamente o melhor arranjo visual. Considera formas, tamanhos e cores para composicao ideal.'
    },
    side_by_side: {
        element: (
            <div className="flex items-end justify-center gap-2 px-4">
                <div className="w-8 h-12 bg-primary/30 rounded-sm shadow-md border border-primary/20" />
                <div className="w-8 h-12 bg-primary/50 rounded-sm shadow-md border border-primary/30" />
                <div className="w-8 h-12 bg-primary/40 rounded-sm shadow-md border border-primary/25" />
            </div>
        ),
        detailedDescription: 'Produtos alinhados horizontalmente com espacamento uniforme. Todos na mesma linha de base. Composicao simetrica e equilibrada.'
    },
    stacked: {
        element: (
            <div className="relative w-24 h-16 flex items-center justify-center">
                <div className="absolute left-2 bottom-0 w-7 h-10 bg-primary/20 rounded-sm shadow-sm" />
                <div className="absolute left-1/2 bottom-1 -translate-x-1/2 w-8 h-11 bg-primary/40 rounded-sm shadow-md z-10" />
                <div className="absolute right-2 bottom-2 w-7 h-10 bg-primary/60 rounded-sm shadow-lg z-20" />
            </div>
        ),
        detailedDescription: 'Produtos sobrepostos criando efeito de profundidade 3D. O produto frontal e o mais proeminente. Visual sofisticado e dinamico.'
    },
    diagonal: {
        element: (
            <div className="relative w-24 h-16 flex items-center justify-center">
                <div className="absolute left-1 top-2 w-6 h-8 bg-primary/25 rounded-sm shadow-sm transform -rotate-12" />
                <div className="absolute left-1/2 -translate-x-1/2 w-7 h-10 bg-primary/45 rounded-sm shadow-md transform -rotate-6" />
                <div className="absolute right-1 bottom-1 w-8 h-11 bg-primary/65 rounded-sm shadow-lg" />
            </div>
        ),
        detailedDescription: 'Linha diagonal dinamica com gradacao de tamanho. Cria fluxo visual atraente. Composicao moderna e energetica.'
    },
    pyramid: {
        element: (
            <div className="relative w-24 h-16 flex flex-col items-center">
                <div className="w-10 h-10 bg-primary/60 rounded-sm shadow-lg z-10" />
                <div className="flex gap-1 -mt-1">
                    <div className="w-6 h-6 bg-primary/30 rounded-sm shadow-sm" />
                    <div className="w-6 h-6 bg-primary/30 rounded-sm shadow-sm" />
                </div>
            </div>
        ),
        detailedDescription: 'Um produto hero grande no centro com produtos secundarios menores ao redor. Hierarquia visual clara com destaque principal.'
    },
    circular: {
        element: (
            <div className="relative w-20 h-16 flex items-center justify-center">
                <div className="absolute w-16 h-16 border-2 border-dashed border-primary/30 rounded-full" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-6 bg-primary/40 rounded-sm shadow-sm" />
                <div className="absolute bottom-0 left-0 w-5 h-6 bg-primary/40 rounded-sm shadow-sm" />
                <div className="absolute bottom-0 right-0 w-5 h-6 bg-primary/40 rounded-sm shadow-sm" />
                <div className="w-6 h-7 bg-primary/60 rounded-sm shadow-md z-10" />
            </div>
        ),
        detailedDescription: 'Arranjo orbital moderno com produtos ao redor de um centro. Distribuicao radial equilibrada. Visual contemporaneo e elegante.'
    }
};

const LayoutSelector = ({ value, onChange, disabled }: LayoutSelectorProps) => {
    return (
        <div className="space-y-3">
            <Label>Template Visual</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {layoutOptions.map((option) => {
                    const Icon = iconMap[option.icon as keyof typeof iconMap];
                    const isSelected = value === option.value;
                    const preview = layoutPreviews[option.value];

                    return (
                        <HoverCard key={option.value} openDelay={300} closeDelay={100}>
                            <HoverCardTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => onChange(option.value)}
                                    disabled={disabled}
                                    className={cn(
                                        "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200",
                                        "hover:shadow-md hover:scale-[1.03]",
                                        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                                        isSelected
                                            ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                                            : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30"
                                    )}
                                >
                                    <div className={cn(
                                        "p-2.5 rounded-lg transition-colors",
                                        isSelected ? "bg-primary/15" : "bg-muted"
                                    )}>
                                        <Icon className={cn(
                                            "h-5 w-5 transition-colors",
                                            isSelected ? "text-primary" : "text-muted-foreground"
                                        )} />
                                    </div>
                                    <span className={cn(
                                        "text-xs font-medium text-center transition-colors",
                                        isSelected ? "text-primary" : "text-foreground"
                                    )}>
                                        {option.label}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground text-center leading-tight hidden md:block">
                                        {option.description}
                                    </span>
                                </button>
                            </HoverCardTrigger>
                            <HoverCardContent
                                side="top"
                                align="center"
                                className="w-64 p-0 overflow-hidden shadow-xl border-2"
                            >
                                <div className="h-24 bg-gradient-to-br from-muted/50 via-background to-muted/30 flex items-center justify-center">
                                    {preview.element}
                                </div>
                                <div className="p-3 space-y-1 bg-card border-t">
                                    <div className="flex items-center gap-2">
                                        <Icon className="h-4 w-4 text-primary" />
                                        <h4 className="font-semibold text-sm">{option.label}</h4>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {preview.detailedDescription}
                                    </p>
                                </div>
                            </HoverCardContent>
                        </HoverCard>
                    );
                })}
            </div>
        </div>
    );
};

export default LayoutSelector;
