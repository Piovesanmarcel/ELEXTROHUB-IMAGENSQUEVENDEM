import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
    Briefcase,
    Home,
    Zap,
    Crown,
    Minus,
    Grid3X3,
    Gift,
    LucideIcon,
    Check
} from 'lucide-react';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/ui/hover-card';
import type { KitStyle } from '@/types/kit-generator';

interface StyleSelectorProps {
    value: KitStyle | KitStyle[];
    onChange: (style: KitStyle | KitStyle[]) => void;
    disabled?: boolean;
    idPrefix?: string;
    multiSelect?: boolean;
    maxSelections?: number;
}

interface StyleOption {
    value: KitStyle;
    label: string;
    description: string;
    icon: LucideIcon;
    iconColor: string;
    preview: {
        gradient: string;
        elements: React.ReactNode;
        detailedDescription: string;
    };
}

export const styleOptions: StyleOption[] = [
    {
        value: 'professional',
        label: 'Profissional',
        description: 'Fundo branco, estudio',
        icon: Briefcase,
        iconColor: 'text-slate-600',
        preview: {
            gradient: 'from-gray-50 via-white to-gray-100',
            elements: (
                <div className="flex items-end justify-center gap-3 px-4">
                    <div className="w-8 h-12 bg-gradient-to-b from-white to-gray-100 rounded-sm shadow-lg border border-gray-200" />
                    <div className="w-10 h-14 bg-gradient-to-b from-white to-gray-100 rounded-sm shadow-lg border border-gray-200" />
                    <div className="w-8 h-12 bg-gradient-to-b from-white to-gray-100 rounded-sm shadow-lg border border-gray-200" />
                </div>
            ),
            detailedDescription: 'Fundo branco puro com iluminacao de estudio profissional. Sombras suaves e reflexos delicados. Ideal para e-commerce e catalogos.'
        }
    },
    {
        value: 'lifestyle',
        label: 'Lifestyle',
        description: 'Ambiente natural',
        icon: Home,
        iconColor: 'text-amber-600',
        preview: {
            gradient: 'from-amber-100 via-orange-50 to-yellow-100',
            elements: (
                <div className="flex items-end justify-center gap-2 px-4">
                    <div className="w-3 h-8 bg-green-600/60 rounded-full" />
                    <div className="w-8 h-10 bg-amber-200/80 rounded-sm shadow-md" />
                    <div className="w-10 h-12 bg-orange-100/80 rounded-sm shadow-md" />
                    <div className="w-6 h-4 bg-amber-800/40 rounded-sm" />
                </div>
            ),
            detailedDescription: 'Ambiente aconchegante com luz natural e texturas organicas. Produtos em contexto de uso real. Perfeito para lifestyle e redes sociais.'
        }
    },
    {
        value: 'promotional',
        label: 'Promocional',
        description: 'Dinamico, destaque',
        icon: Zap,
        iconColor: 'text-red-500',
        preview: {
            gradient: 'from-red-500 via-orange-400 to-yellow-400',
            elements: (
                <div className="relative flex items-center justify-center gap-2 px-4">
                    <div className="absolute -top-1 -right-1 w-8 h-4 bg-yellow-300 rounded-full flex items-center justify-center text-[8px] font-bold text-red-600 shadow-lg transform rotate-12">
                        -30%
                    </div>
                    <div className="w-9 h-12 bg-white/90 rounded-sm shadow-xl transform -rotate-6" />
                    <div className="w-11 h-14 bg-white/95 rounded-sm shadow-xl transform rotate-3" />
                </div>
            ),
            detailedDescription: 'Visual impactante com cores vibrantes e badges de promocao. Destaque para ofertas e kits especiais. Maximo impacto visual.'
        }
    },
    {
        value: 'luxury',
        label: 'Luxo',
        description: 'Fundo escuro, dourado',
        icon: Crown,
        iconColor: 'text-yellow-500',
        preview: {
            gradient: 'from-gray-900 via-gray-800 to-black',
            elements: (
                <div className="flex items-end justify-center gap-3 px-4">
                    <div className="w-8 h-11 bg-gradient-to-b from-yellow-400/30 to-yellow-600/20 rounded-sm shadow-lg border border-yellow-500/30" />
                    <div className="w-10 h-14 bg-gradient-to-b from-yellow-300/40 to-yellow-500/30 rounded-sm shadow-xl border border-yellow-400/40" />
                    <div className="w-8 h-11 bg-gradient-to-b from-yellow-400/30 to-yellow-600/20 rounded-sm shadow-lg border border-yellow-500/30" />
                    <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/10 to-transparent pointer-events-none" />
                </div>
            ),
            detailedDescription: 'Fundo escuro elegante com detalhes dourados e iluminacao dramatica. Reflexos premium e atmosfera exclusiva para produtos de alto padrao.'
        }
    },
    {
        value: 'minimalist',
        label: 'Minimalista',
        description: 'Clean, sem badges',
        icon: Minus,
        iconColor: 'text-gray-400',
        preview: {
            gradient: 'from-white via-gray-50 to-white',
            elements: (
                <div className="flex items-center justify-center gap-8 px-4">
                    <div className="w-6 h-10 bg-gray-100 rounded-sm shadow-sm" />
                    <div className="w-7 h-11 bg-gray-50 rounded-sm shadow-sm" />
                </div>
            ),
            detailedDescription: 'Ultra clean com maximo espaco em branco. SEM badges ou CTAs. Foco total nos produtos. Estetica contemporanea e sofisticada.'
        }
    },
    {
        value: 'flat_lay',
        label: 'Flat Lay',
        description: 'Vista de cima',
        icon: Grid3X3,
        iconColor: 'text-stone-500',
        preview: {
            gradient: 'from-stone-200 via-stone-100 to-stone-200',
            elements: (
                <div className="grid grid-cols-3 gap-1.5 p-2">
                    <div className="w-6 h-6 bg-white/80 rounded-sm shadow-sm transform rotate-2" />
                    <div className="w-6 h-6 bg-stone-300/60 rounded-sm" />
                    <div className="w-6 h-6 bg-white/80 rounded-sm shadow-sm transform -rotate-3" />
                    <div className="w-6 h-6 bg-stone-400/40 rounded-full" />
                    <div className="w-6 h-6 bg-white/90 rounded-sm shadow-md" />
                    <div className="w-6 h-6 bg-stone-300/50 rounded-sm transform rotate-6" />
                </div>
            ),
            detailedDescription: 'Camera de cima (90 graus) com composicao geometrica organizada. Props decorativos e texturas. Estetica Instagram/Pinterest perfeita.'
        }
    },
    {
        value: 'gift_box',
        label: 'Gift Box',
        description: 'Caixa de presente',
        icon: Gift,
        iconColor: 'text-pink-500',
        preview: {
            gradient: 'from-pink-100 via-rose-50 to-red-50',
            elements: (
                <div className="relative flex items-center justify-center px-4">
                    <div className="w-20 h-12 bg-gradient-to-b from-rose-200 to-rose-300 rounded-sm shadow-lg relative">
                        <div className="absolute inset-x-0 top-1/2 h-2 bg-red-400/80 -translate-y-1/2" />
                        <div className="absolute left-1/2 inset-y-0 w-2 bg-red-400/80 -translate-x-1/2" />
                        <div className="absolute -top-2 left-1/4 w-4 h-6 bg-white/90 rounded-sm shadow-md" />
                        <div className="absolute -top-3 left-1/2 w-5 h-7 bg-white/95 rounded-sm shadow-md -translate-x-1/2" />
                        <div className="absolute -top-2 right-1/4 w-4 h-6 bg-white/90 rounded-sm shadow-md" />
                    </div>
                </div>
            ),
            detailedDescription: 'Produtos em caixa de presente aberta com papel de seda e fitas. Experiencia de unboxing premium. Perfeito para datas especiais.'
        }
    }
];

const StyleSelector = ({
    value,
    onChange,
    disabled,
    idPrefix = '',
    multiSelect = false,
    maxSelections = 4
}: StyleSelectorProps) => {

    const selectedStyles = Array.isArray(value) ? value : [value];

    const handleToggle = (styleValue: KitStyle) => {
        if (disabled) return;

        if (!multiSelect) {
            onChange(styleValue);
            return;
        }

        if (selectedStyles.includes(styleValue)) {
            if (selectedStyles.length > 1) {
                onChange(selectedStyles.filter(s => s !== styleValue));
            }
        } else {
            if (selectedStyles.length < maxSelections) {
                onChange([...selectedStyles, styleValue]);
            }
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label>
                    {multiSelect ? 'Estilos Visuais (selecione 1 ou mais)' : 'Estilo Visual'}
                </Label>
                {multiSelect && (
                    <span className="text-xs text-muted-foreground">
                        {selectedStyles.length} de {styleOptions.length} selecionado(s)
                        {selectedStyles.length > 1 && (
                            <span className="ml-1 text-primary font-medium">
                                → {selectedStyles.length} imagens serao geradas
                            </span>
                        )}
                    </span>
                )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {styleOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedStyles.includes(option.value);
                    const inputId = `${idPrefix}${option.value}`;

                    return (
                        <HoverCard key={option.value} openDelay={300} closeDelay={100}>
                            <HoverCardTrigger asChild>
                                <button
                                    type="button"
                                    id={inputId}
                                    onClick={() => handleToggle(option.value)}
                                    disabled={disabled}
                                    className={cn(
                                        "flex items-start space-x-3 border-2 rounded-xl p-3 cursor-pointer transition-all duration-200 text-left w-full",
                                        "hover:shadow-md hover:scale-[1.02]",
                                        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                                        isSelected
                                            ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                                            : "border-border hover:border-primary/50 hover:bg-muted/30"
                                    )}
                                >
                                    <div className={cn(
                                        "w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                                        multiSelect ? "rounded-md border-2" : "rounded-full border-2",
                                        isSelected
                                            ? "border-primary bg-primary"
                                            : "border-muted-foreground/40"
                                    )}>
                                        {isSelected && (
                                            multiSelect ? (
                                                <Check className="h-3 w-3 text-primary-foreground" />
                                            ) : (
                                                <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                                            )
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <Icon className={cn("h-4 w-4", isSelected ? "text-primary" : option.iconColor)} />
                                            <span className={cn(
                                                "font-medium text-sm",
                                                isSelected && "text-primary"
                                            )}>{option.label}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {option.description}
                                        </p>
                                    </div>
                                </button>
                            </HoverCardTrigger>
                            <HoverCardContent
                                side="top"
                                align="center"
                                className="w-72 p-0 overflow-hidden shadow-xl border-2"
                            >
                                <div className={cn(
                                    "h-28 bg-gradient-to-br flex items-center justify-center relative overflow-hidden",
                                    option.preview.gradient
                                )}>
                                    {option.preview.elements}
                                </div>
                                <div className="p-3 space-y-1 bg-card">
                                    <div className="flex items-center gap-2">
                                        <Icon className={cn("h-4 w-4", option.iconColor)} />
                                        <h4 className="font-semibold text-sm">{option.label}</h4>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {option.preview.detailedDescription}
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

export default StyleSelector;
