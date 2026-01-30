
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ProductDescriptionProps {
  isEditing: boolean;
  formData: {
    nome: string;
    descricao_curta: string;
    descricao: string;
  };
  product: {
    descricao_curta?: string;
    descricao?: string;
  };
  onFormDataChange: (field: string, value: string) => void;
  onUpdateDescription: (type: 'short' | 'long' | 'name', value: string) => void;
}

export const ProductDescription = ({ 
  isEditing, 
  formData, 
  product, 
  onFormDataChange,
  onUpdateDescription
}: ProductDescriptionProps) => {
  return (
    <div className="space-y-6">
      {/* Descrição Resumida - Sempre editável */}
      <div className="space-y-2">
        <Label htmlFor="descricao_curta" className="text-sm font-semibold text-foreground/80">
          Descrição Resumida
        </Label>
        <Textarea
          id="descricao_curta"
          value={formData.descricao_curta}
          onChange={(e) => onFormDataChange('descricao_curta', e.target.value)}
          className="min-h-[80px] border-border focus:border-primary text-sm"
          placeholder="Digite uma descrição resumida do produto..."
        />
      </div>
    </div>
  );
};
