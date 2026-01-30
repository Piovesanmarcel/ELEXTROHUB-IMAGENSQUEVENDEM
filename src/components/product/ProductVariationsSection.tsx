import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ProductVariation {
  sku: string;
  bling_id?: string;
  nome: string;
  estoque: number;
  preco: number;
  preco_custo?: number;
  imagens?: string[];
  atributos?: Record<string, string>;
}

interface ProductVariationsSectionProps {
  variacoes: ProductVariation[];
}

export const ProductVariationsSection = ({ variacoes }: ProductVariationsSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!variacoes || variacoes.length === 0) {
    return null;
  }
  
  const totalStock = variacoes.reduce((sum, v) => sum + (v.estoque || 0), 0);
  const avgPrice = variacoes.reduce((sum, v) => sum + (v.preco || 0), 0) / variacoes.length;
  const totalImages = variacoes.reduce((sum, v) => sum + (v.imagens?.length || 0), 0);
  
  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="glass-effect shadow-lg border-0 bg-gradient-to-br from-white/90 to-purple-50/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-purple-100/50 to-pink-100/50 border-b border-purple-200/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Variações do Produto
                </CardTitle>
                {!isExpanded && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {variacoes.length} variação(ões) • {totalStock} unidades em estoque
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                {variacoes.length} itens
              </Badge>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="pt-6">
            {/* Resumo Total */}
            <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Total de Variações</p>
                  <p className="text-2xl font-bold text-purple-600">{variacoes.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Estoque Total</p>
                  <p className="text-2xl font-bold text-green-600">{totalStock}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Preço Médio</p>
                  <p className="text-2xl font-bold text-blue-600">R$ {avgPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total de Imagens</p>
                  <p className="text-2xl font-bold text-orange-600">{totalImages}</p>
                </div>
              </div>
            </div>

            {/* Lista de variações */}
            <div className="space-y-4">
              {variacoes.map((variacao, index) => (
                <Card key={variacao.sku || index} className="border border-purple-200/50 hover:border-purple-300/70 transition-all">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Coluna 1: Informações Básicas */}
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">SKU</p>
                          <p className="font-mono text-sm font-medium">{variacao.sku}</p>
                        </div>
                        {variacao.bling_id && (
                          <div>
                            <p className="text-xs text-muted-foreground">Bling ID</p>
                            <p className="font-mono text-xs text-muted-foreground">{variacao.bling_id}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground">Nome</p>
                          <p className="text-sm font-medium line-clamp-2">{variacao.nome}</p>
                        </div>
                      </div>

                      {/* Coluna 2: Atributos e Estoque */}
                      <div className="space-y-2">
                        {/* Atributos */}
                        {variacao.atributos && Object.keys(variacao.atributos).length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Atributos</p>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(variacao.atributos).map(([key, value]) => (
                                value && value !== variacao.nome && (
                                  <Badge 
                                    key={key} 
                                    variant="outline" 
                                    className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                                  >
                                    {key}: {value}
                                  </Badge>
                                )
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Estoque */}
                        <div>
                          <p className="text-xs text-muted-foreground">Estoque</p>
                          <Badge 
                            variant={variacao.estoque > 0 ? "default" : "destructive"}
                            className={variacao.estoque > 0 ? "bg-green-100 text-green-700 border-green-200" : ""}
                          >
                            {variacao.estoque} unidade(s)
                          </Badge>
                        </div>
                      </div>

                      {/* Coluna 3: Preços e Imagens */}
                      <div className="space-y-2">
                        {/* Preços */}
                        <div className="space-y-1">
                          <div>
                            <p className="text-xs text-muted-foreground">Preço de Venda</p>
                            <p className="text-lg font-bold text-green-600">
                              R$ {variacao.preco?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                          {variacao.preco_custo && (
                            <div>
                              <p className="text-xs text-muted-foreground">Preço de Custo</p>
                              <p className="text-sm text-muted-foreground">
                                R$ {variacao.preco_custo.toFixed(2)}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Imagens */}
                        {variacao.imagens && variacao.imagens.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Imagens ({variacao.imagens.length})</p>
                            <div className="flex gap-1 flex-wrap">
                              {variacao.imagens.slice(0, 3).map((img, imgIndex) => (
                                <img
                                  key={imgIndex}
                                  src={img}
                                  alt={`${variacao.nome} - imagem ${imgIndex + 1}`}
                                  className="w-12 h-12 object-cover rounded border border-purple-200"
                                />
                              ))}
                              {variacao.imagens.length > 3 && (
                                <div className="w-12 h-12 flex items-center justify-center rounded border border-purple-200 bg-purple-50 text-purple-600 text-xs font-medium">
                                  +{variacao.imagens.length - 3}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
