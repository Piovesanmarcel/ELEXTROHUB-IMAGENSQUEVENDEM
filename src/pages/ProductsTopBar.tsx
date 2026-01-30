
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus, Download, FileSpreadsheet, Zap } from "lucide-react";
import { useProductsActions } from "@/hooks/useProductsActions";
import { useProductsStats } from "@/hooks/useProductsStats";
import { DownloadCurrentPageButton } from "@/components/DownloadCurrentPageButton";
import { UpdateCurrentPageButton } from "@/components/UpdateCurrentPageButton";
import { ProductSpreadsheetUpload } from "@/components/products/ProductSpreadsheetUpload";
import { BlingExportButton } from "@/components/products/BlingExportButton";
import { BlingEnhancedExportButton } from "@/components/products/BlingEnhancedExportButton";
import { DownloadFilteredProductsButton } from "@/components/products/DownloadFilteredProductsButton";
import { AutoGroup3CliquesButton } from "@/components/products/AutoGroup3CliquesButton";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface ProductsTopBarProps {
  displayedCount: number;
  filteredCount: number;
  allProductsCount: number;
  selectedPricing: 'none' | 'shopee' | 'shein' | 'kwai' | 'amazon' | 'tiktok' | 'loja-virtual';
  getMarketplaceName: () => string;
  showClearFilters: boolean;
  handleClearFilters: () => void;
  displayedProducts: any[];
  onProductsUpdated?: () => void;
  currentPage: number;
  allProducts?: any[];
  filteredProducts?: any[]; // Produtos filtrados para exportação
}

export function ProductsTopBar({
  displayedCount,
  filteredCount,
  allProductsCount,
  selectedPricing,
  getMarketplaceName,
  showClearFilters,
  handleClearFilters,
  displayedProducts,
  onProductsUpdated,
  currentPage,
  allProducts = [],
  filteredProducts = []
}: ProductsTopBarProps) {
  const [isSpreadsheetDialogOpen, setIsSpreadsheetDialogOpen] = useState(false);
  const { handleSync, isSyncing } = useProductsActions();

  const handleProductsUploaded = () => {
    onProductsUpdated?.();
    setIsSpreadsheetDialogOpen(false);
    toast.success("Produtos da planilha carregados com sucesso!");
  };

  const handleCompleteSyncClick = async () => {
    console.log("🚀 Iniciando sincronização completa de TODOS os produtos...");
    toast.info("Iniciando sincronização completa! Isso pode levar alguns minutos...", { duration: 5000 });
    
    const success = await handleSync(true, true); // forceResync = true, forceAll = true
    
    if (success) {
      onProductsUpdated?.();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">
          {selectedPricing !== 'none' ? (
            <>Precificação {getMarketplaceName()}</>
          ) : (
            <>Produtos</>
          )}
        </h2>
        <div className="text-sm text-muted-foreground">
          Exibindo {displayedCount} de {filteredCount} produtos
          {filteredCount !== allProductsCount && (
            <span className="ml-1">
              ({allProductsCount} no total)
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Botão de sincronização completa - apenas na visualização normal */}
        {selectedPricing === 'none' && (
          <Button
            onClick={handleCompleteSyncClick}
            disabled={isSyncing}
            className="bg-orange-600 hover:bg-orange-700 text-white"
            size="sm"
          >
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            Sincronização Completa
          </Button>
        )}

        {/* Botão para upload de planilha - apenas na visualização normal */}
        {selectedPricing === 'none' && (
          <Dialog open={isSpreadsheetDialogOpen} onOpenChange={setIsSpreadsheetDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Planilha
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <ProductSpreadsheetUpload onProductsUploaded={handleProductsUploaded} />
            </DialogContent>
          </Dialog>
        )}

        {/* Botão para exportar planilha no formato Bling */}
        {selectedPricing === 'none' && (
          <BlingExportButton products={allProducts} />
        )}

        {/* Botão para exportar planilha melhorada no formato Bling */}
        {selectedPricing === 'none' && (
          <BlingEnhancedExportButton products={allProducts} />
        )}

        {/* Botão para baixar produtos filtrados */}
        {selectedPricing === 'none' && (
          <DownloadFilteredProductsButton 
            products={filteredProducts}
            filterLabel="filtrados"
          />
        )}

        {/* Botão de agrupamento automático 3Cliques */}
        {selectedPricing === 'none' && (
          <AutoGroup3CliquesButton />
        )}

        {/* Botão para baixar imagens da página atual */}
        <DownloadCurrentPageButton
          products={displayedProducts}
          currentPage={currentPage}
        />

        {/* Botão para atualizar produtos da página atual */}
        <UpdateCurrentPageButton 
          products={displayedProducts}
          onProductsUpdated={onProductsUpdated}
          size="sm"
          variant="outline"
        />

        {showClearFilters && (
          <Button
            onClick={handleClearFilters}
            variant="outline"
            size="sm"
            className="text-muted-foreground"
          >
            Limpar Filtros
          </Button>
        )}
      </div>
    </div>
  );
}
