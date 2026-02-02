import { Package, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KitMode } from '@/types/kit-generator';

interface KitModeSelectorProps {
    value: KitMode;
    onChange: (mode: KitMode) => void;
    disabled?: boolean;
}

const modes = [
    {
        value: 'single_product' as KitMode,
        icon: Package,
        title: 'Produto Unico',
        description: '1 produto com N unidades iguais'
    },
    {
        value: 'multiple_products' as KitMode,
        icon: Layers,
        title: 'Multiplos Produtos',
        description: '2 a 5 produtos diferentes'
    }
];

export const KitModeSelector = ({ value, onChange, disabled }: KitModeSelectorProps) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {modes.map((mode) => {
                const Icon = mode.icon;
                const isSelected = value === mode.value;

                return (
                    <button
                        key={mode.value}
                        type="button"
                        onClick={() => onChange(mode.value)}
                        disabled={disabled}
                        className={cn(
                            "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
                            "hover:border-primary/50 hover:bg-muted/50",
                            isSelected
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-border",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <div className={cn(
                            "p-4 rounded-full",
                            isSelected ? "bg-primary/10" : "bg-muted"
                        )}>
                            <Icon className={cn(
                                "h-8 w-8",
                                isSelected ? "text-primary" : "text-muted-foreground"
                            )} />
                        </div>
                        <div className="text-center">
                            <h3 className={cn(
                                "font-semibold text-lg",
                                isSelected && "text-primary"
                            )}>
                                {mode.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {mode.description}
                            </p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

export default KitModeSelector;
