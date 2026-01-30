import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Image, Upload, X } from "lucide-react";
import type { ProductInput, ProductImage } from "../types";

interface ProductInputCardProps {
  product: ProductInput;
  onProductChange: (product: ProductInput) => void;
  productImages: ProductImage[];
  onRemoveImage: (index: number) => void;
  dropzoneProps: {
    getRootProps: () => any;
    getInputProps: () => any;
    isDragActive: boolean;
  };
  isMaxImages: boolean;
}

export function ProductInputCard({
  product,
  onProductChange,
  productImages,
  onRemoveImage,
  dropzoneProps,
  isMaxImages,
}: ProductInputCardProps) {
  const { getRootProps, getInputProps, isDragActive } = dropzoneProps;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Dados do Produto</CardTitle>
        <CardDescription>
          Mesmos dados serão usados em ambas as etapas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome do Produto *</Label>
          <Input
            id="nome"
            placeholder="Ex: Jogo Kit Utensílios Cozinha 12 Peças"
            value={product.nome}
            onChange={(e) => onProductChange({ ...product, nome: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="descricao_curta">Descrição Curta *</Label>
          <Textarea
            id="descricao_curta"
            placeholder="Descrição do produto com características, materiais, dimensões..."
            value={product.descricao_curta}
            onChange={(e) => onProductChange({ ...product, descricao_curta: e.target.value })}
            rows={4}
          />
        </div>

        {/* Grid com Preço e SKU */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="preco_custo">Preço de Custo *</Label>
            <Input
              id="preco_custo"
              type="number"
              step="0.01"
              min="0"
              placeholder="Ex: 29.90"
              value={product.preco_custo || ''}
              onChange={(e) => onProductChange({ 
                ...product, 
                preco_custo: parseFloat(e.target.value) || 0 
              })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sku">SKU *</Label>
            <Input
              id="sku"
              placeholder="Ex: PROD-001"
              value={product.sku || ''}
              onChange={(e) => onProductChange({ ...product, sku: e.target.value })}
            />
          </div>
        </div>

        {/* Upload de Imagens de Referência */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Image className="h-4 w-4 text-green-600" />
            Imagens de Referência (até 3)
          </Label>
          
          {/* Previews das imagens */}
          {productImages.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {productImages.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={img.preview}
                    alt={`Referência ${idx + 1}`}
                    className="h-20 w-20 object-cover rounded-lg border"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemoveImage(idx)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {/* Dropzone */}
          {!isMaxImages && (
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-primary/50'}
              `}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="h-6 w-6" />
                <span className="text-sm">
                  {isDragActive ? 'Solte as imagens aqui' : 'Arraste imagens ou clique para selecionar'}
                </span>
                <span className="text-xs">PNG, JPG ou WebP</span>
              </div>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground">
            Imagens serão enviadas em base64 para análise visual no n8n
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
