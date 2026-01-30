
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface ProductFormFieldsProps {
  product: any;
  isEditing: boolean;
  formData: any;
  onFormDataChange: (field: string, value: any) => void;
}

export const ProductFormFields = ({
  product,
  isEditing,
  formData,
  onFormDataChange
}: ProductFormFieldsProps) => {
  if (!isEditing) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nome</Label>
              <p className="text-sm text-gray-600">{product.nome}</p>
            </div>
            <div>
              <Label>SKU</Label>
              <p className="text-sm text-gray-600">{product.sku}</p>
            </div>
            <div>
              <Label>Preço</Label>
              <p className="text-sm text-gray-600">R$ {product.preco?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <Label>Estoque</Label>
              <p className="text-sm text-gray-600">{product.estoque || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => onFormDataChange('nome', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => onFormDataChange('sku', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="preco">Preço</Label>
            <Input
              id="preco"
              type="number"
              step="0.01"
              value={formData.preco}
              onChange={(e) => onFormDataChange('preco', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="preco_custo">Preço de Custo</Label>
            <Input
              id="preco_custo"
              type="number"
              step="0.01"
              value={formData.preco_custo}
              onChange={(e) => onFormDataChange('preco_custo', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="estoque">Estoque</Label>
            <Input
              id="estoque"
              type="number"
              value={formData.estoque}
              onChange={(e) => onFormDataChange('estoque', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="categoria">Categoria</Label>
            <Input
              id="categoria"
              value={formData.categoria}
              onChange={(e) => onFormDataChange('categoria', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="marca">Marca</Label>
            <Input
              id="marca"
              value={formData.marca}
              onChange={(e) => onFormDataChange('marca', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="gtin">GTIN</Label>
            <Input
              id="gtin"
              value={formData.gtin}
              onChange={(e) => onFormDataChange('gtin', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="unidade">Unidade</Label>
            <Select value={formData.unidade} onValueChange={(value) => onFormDataChange('unidade', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UN">Unidade</SelectItem>
                <SelectItem value="PC">Peça</SelectItem>
                <SelectItem value="KG">Quilograma</SelectItem>
                <SelectItem value="MT">Metro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="situacao">Situação</Label>
            <Select value={formData.situacao} onValueChange={(value) => onFormDataChange('situacao', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label htmlFor="descricao_curta">Descrição Curta</Label>
          <Textarea
            id="descricao_curta"
            value={formData.descricao_curta}
            onChange={(e) => onFormDataChange('descricao_curta', e.target.value)}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
};
