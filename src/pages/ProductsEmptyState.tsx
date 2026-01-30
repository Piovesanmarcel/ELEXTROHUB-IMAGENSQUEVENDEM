
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package, RefreshCw } from "lucide-react";

interface ProductsEmptyStateProps {
  hasFilters: boolean;
  onSync: () => void;
  isSyncing: boolean;
}

export function ProductsEmptyState({ hasFilters, onSync, isSyncing }: ProductsEmptyStateProps) {
  return (
    <Card className="glass-effect">
      <CardContent className="py-20 text-center">
        <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">
          {hasFilters ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
        </h3>
        <p className="text-muted-foreground mb-6">
          {hasFilters ? "Tente ajustar os filtros de busca" : "Sincronize com o Bling para importar seus produtos"}
        </p>
        {!hasFilters && (
          <Button onClick={onSync} disabled={isSyncing} className="gradient-primary">
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            Sincronizar Produtos
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
