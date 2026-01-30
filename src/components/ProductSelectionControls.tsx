
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Square, X } from "lucide-react";
import { Product } from "@/lib/supabase";
import { DownloadImagesButton } from "./DownloadImagesButton";

interface ProductSelectionControlsProps {
  products: Product[];
  selectedProducts: Set<string>;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onToggleSelectionMode: () => void;
  selectionMode: boolean;
  getSelectedProductsData: () => Product[];
  onProductUpdated?: () => void;
  updateSingleProduct?: (product: Product) => void;
}

export function ProductSelectionControls({
  products,
  selectedProducts,
  onSelectAll,
  onDeselectAll,
  onToggleSelectionMode,
  selectionMode,
  getSelectedProductsData,
  onProductUpdated,
  updateSingleProduct
}: ProductSelectionControlsProps) {
  // Filtrar apenas os produtos selecionados que estão na página atual
  const currentPageSelectedProducts = products.filter(product => 
    selectedProducts.has(product.id)
  );
  
  const selectedCount = currentPageSelectedProducts.length;
  const maxSelectionReached = selectedCount >= 100;

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={selectionMode ? "default" : "outline"}
          size="sm"
          onClick={onToggleSelectionMode}
          className={selectionMode ? "gradient-primary" : ""}
        >
          {selectionMode ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Cancelar Seleção
            </>
          ) : (
            <>
              <CheckSquare className="h-4 w-4 mr-2" />
              Selecionar Produtos
            </>
          )}
        </Button>

        {selectionMode && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectAll}
              disabled={products.length === 0 || maxSelectionReached}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Selecionar Todos da Página
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onDeselectAll}
              disabled={selectedCount === 0}
            >
              <Square className="h-4 w-4 mr-2" />
              Desmarcar Todos da Página
            </Button>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        {selectionMode && (
          <div className="flex items-center gap-2">
            <Badge variant={selectedCount > 0 ? "default" : "secondary"}>
              {selectedCount} selecionados nesta página
            </Badge>
            {maxSelectionReached && (
              <Badge variant="destructive">
                Limite máximo atingido
              </Badge>
            )}
          </div>
        )}

        {selectionMode && selectedCount > 0 && (
          <div className="flex items-center gap-2">
            <DownloadImagesButton 
              selectedProducts={currentPageSelectedProducts}
            />
          </div>
        )}
      </div>
    </div>
  );
}
