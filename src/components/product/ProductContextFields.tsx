import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Tag, Users } from "lucide-react";

interface ProductContextFieldsProps {
  formData: {
    categoria_produto?: string;
    cenario_ideal?: string;
    contexto_uso?: string;
  };
  onFormDataChange: (field: string, value: any) => void;
  isEditing?: boolean;
}

const PRODUCT_CATEGORIES = [
  { value: 'cozinha', label: '🍳 Cozinha & Culinária' },
  { value: 'escritorio', label: '💼 Escritório & Trabalho' },
  { value: 'beleza', label: '💄 Beleza & Cosméticos' },
  { value: 'tecnologia', label: '📱 Tecnologia & Eletrônicos' },
  { value: 'fitness', label: '🏋️ Fitness & Esportes' },
  { value: 'pet', label: '🐾 Pet & Animais' },
  { value: 'infantil', label: '👶 Infantil & Bebê' },
  { value: 'moda', label: '👗 Moda & Acessórios' },
  { value: 'casa', label: '🏠 Casa & Decoração' },
  { value: 'jardim', label: '🌱 Jardim & Exterior' },
  { value: 'saude', label: '💊 Saúde & Bem-estar' },
  { value: 'automotivo', label: '🚗 Automotivo' },
  { value: 'outro', label: '📦 Outro' }
];

export const ProductContextFields = ({
  formData,
  onFormDataChange,
  isEditing = true
}: ProductContextFieldsProps) => {
  if (!isEditing) {
    return null;
  }

  return (
    <Card className="border-dashed border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 to-pink-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-purple-700">
          <MapPin className="h-4 w-4" />
          Contexto para Cenários (Opcional)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Especifique o contexto para garantir cenários de imagem mais precisos e relevantes
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Categoria do Produto */}
        <div className="space-y-2">
          <Label htmlFor="categoria_produto" className="flex items-center gap-2 text-sm">
            <Tag className="h-3.5 w-3.5" />
            Categoria do Produto
          </Label>
          <Select 
            value={formData.categoria_produto || ''} 
            onValueChange={(value) => onFormDataChange('categoria_produto', value)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecione a categoria..." />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Ajuda a IA a escolher ambientes mais adequados
          </p>
        </div>

        {/* Cenário Ideal */}
        <div className="space-y-2">
          <Label htmlFor="cenario_ideal" className="flex items-center gap-2 text-sm">
            <MapPin className="h-3.5 w-3.5" />
            Cenário Ideal para Imagens
          </Label>
          <Input
            id="cenario_ideal"
            value={formData.cenario_ideal || ''}
            onChange={(e) => onFormDataChange('cenario_ideal', e.target.value)}
            placeholder="Ex: cozinha moderna com bancada de mármore branco"
            className="bg-white"
          />
          <p className="text-xs text-muted-foreground">
            Descreva o ambiente onde o produto deve aparecer nas imagens
          </p>
        </div>

        {/* Contexto de Uso */}
        <div className="space-y-2">
          <Label htmlFor="contexto_uso" className="flex items-center gap-2 text-sm">
            <Users className="h-3.5 w-3.5" />
            Contexto de Uso
          </Label>
          <Textarea
            id="contexto_uso"
            value={formData.contexto_uso || ''}
            onChange={(e) => onFormDataChange('contexto_uso', e.target.value)}
            placeholder="Ex: mães preparando café da manhã para a família, chef profissional em restaurante..."
            className="bg-white resize-none"
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            Descreva quem usa o produto e em qual situação
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
