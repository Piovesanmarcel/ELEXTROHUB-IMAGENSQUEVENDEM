
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Palette, Focus, ImageUp, Eraser } from "lucide-react";

export type EnhancementType = 'auto_enhance' | 'upscale' | 'denoise' | 'sharpen' | 'color_enhance' | 'super_resolution';

export const enhancementOptions = [
  { 
    value: 'super_resolution', 
    label: 'Super Resolution', 
    description: 'IA avançada para máxima qualidade e resolução', 
    icon: Zap 
  },
  { 
    value: 'auto_enhance', 
    label: 'Melhoria Automática', 
    description: 'IA decide automaticamente a melhor melhoria', 
    icon: Sparkles 
  },
  { 
    value: 'upscale', 
    label: 'Aumentar Resolução', 
    description: 'Aumenta qualidade e tamanho da imagem', 
    icon: ImageUp 
  },
  { 
    value: 'denoise', 
    label: 'Reduzir Ruído', 
    description: 'Remove granulação e ruído da imagem', 
    icon: Eraser 
  },
  { 
    value: 'sharpen', 
    label: 'Aumentar Nitidez', 
    description: 'Aumenta definição e clareza dos detalhes', 
    icon: Focus 
  },
  { 
    value: 'color_enhance', 
    label: 'Melhorar Cores', 
    description: 'Aprimora saturação e contraste das cores', 
    icon: Palette 
  },
];

interface EnhancementOptionsProps {
  value: EnhancementType;
  onChange: (value: EnhancementType) => void;
}

export const EnhancementOptions = ({ value, onChange }: EnhancementOptionsProps) => {
  return (
    <div className="space-y-3" style={{ display: 'none' }}>
      <label className="text-sm font-medium block">
        Tipo de Melhoria DeepAI
      </label>
      
      {/* Botão destacado para Super Resolution */}
      <Button
        onClick={() => onChange('super_resolution')}
        variant={value === 'super_resolution' ? 'default' : 'outline'}
        className={`w-full justify-start h-auto p-4 ${
          value === 'super_resolution' 
            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0' 
            : 'border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50'
        }`}
      >
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5" />
          <div className="text-left">
            <div className="font-semibold">Super Resolution DeepAI</div>
            <div className="text-xs opacity-90">
              Máxima qualidade com IA avançada - Recomendado
            </div>
          </div>
        </div>
      </Button>
      
      {/* Seletor para outras opções */}
      <div>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="border-purple-200 focus:border-purple-400">
            <SelectValue placeholder="Outras opções de melhoria DeepAI" />
          </SelectTrigger>
          <SelectContent>
            {enhancementOptions.filter(opt => opt.value !== 'super_resolution').map((option) => {
              const IconComponent = option.icon;
              return (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    {IconComponent && <IconComponent className="h-4 w-4" />}
                    <div className="space-y-1">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
