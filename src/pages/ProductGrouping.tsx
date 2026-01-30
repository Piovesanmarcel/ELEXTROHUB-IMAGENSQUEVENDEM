import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Search, Package, Users, AlertTriangle } from "lucide-react";
import { useProductGroupingOptimized as useProductGrouping } from "@/hooks/useProductGroupingOptimized";
import { OptimizedImage } from "@/components/OptimizedImage";

export default function ProductGrouping() {
  const [searchTerm, setSearchTerm] = useState("");
  const [minSimilarity, setMinSimilarity] = useState(70);
  const { productGroups, isLoading, groupStats } = useProductGrouping({
    searchTerm,
    minSimilarity
  });

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Agrupamento de Produtos</h1>
        <p className="text-muted-foreground">
          Identifique produtos iguais ou similares de diferentes fornecedores para melhor gestão de estoque
        </p>
      </div>

      {/* Controles de Filtro */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros de Busca
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Buscar Produtos</Label>
              <Input
                id="search"
                placeholder="Digite o nome, marca ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="similarity">Similaridade Mínima (%)</Label>
              <Input
                id="similarity"
                type="number"
                min="50"
                max="100"
                value={minSimilarity}
                onChange={(e) => setMinSimilarity(Number(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {groupStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total de Grupos</p>
                  <p className="text-2xl font-bold">{groupStats.totalGroups}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Produtos Agrupados</p>
                  <p className="text-2xl font-bold">{groupStats.totalProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Sem Estoque</p>
                  <p className="text-2xl font-bold">{groupStats.outOfStock}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Com Alternativas</p>
                  <p className="text-2xl font-bold">{groupStats.withAlternatives}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Grupos */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {productGroups.length > 0 ? "Reagrupando produtos..." : "Carregando produtos..."}
            </p>
          </div>
        ) : productGroups.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm.trim() ? "Nenhum grupo encontrado" : "Digite um termo para buscar"}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm.trim() 
                  ? "Tente ajustar os filtros ou reduzir a similaridade mínima"
                  : "Use o campo de busca acima para encontrar produtos similares e criar agrupamentos"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          productGroups.map((group) => (
            <Card key={group.groupId} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {group.groupName}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {group.products.length} produtos similares
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={group.hasStock ? "default" : "destructive"}>
                      {group.hasStock ? "Com Estoque" : "Sem Estoque"}
                    </Badge>
                    <Badge variant="outline">
                      {group.similarity}% similar
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {group.products.map((product) => (
                    <Card key={product.id} className="border-l-4 border-l-primary/20">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <div className="w-16 h-16 flex-shrink-0">
                            <OptimizedImage
                              src={product.imagem_url || "/placeholder.svg"}
                              alt={product.nome}
                              className="w-full h-full object-cover rounded"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">
                              {product.nome}
                            </h4>
                            <p className="text-xs text-muted-foreground truncate">
                              SKU: {product.sku}
                            </p>
                            {product.marca && (
                              <p className="text-xs text-blue-600 truncate">
                                Marca: {product.marca}
                              </p>
                            )}
                            <div className="flex justify-between items-center mt-2">
                              <Badge 
                                variant={product.estoque && product.estoque > 0 ? "default" : "destructive"}
                                className="text-xs"
                              >
                                Estoque: {product.estoque || 0}
                              </Badge>
                              {product.preco && (
                                <span className="text-sm font-medium">
                                  R$ {product.preco.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {group.products.length > 1 && (
                  <>
                    <Separator className="my-4" />
                    <div className="text-sm text-muted-foreground">
                      <strong>Sugestão:</strong> {
                        group.hasStock 
                          ? "Você tem alternativas disponíveis para este produto."
                          : "Todos os fornecedores estão sem estoque. Considere fazer pedidos de reposição."
                      }
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}