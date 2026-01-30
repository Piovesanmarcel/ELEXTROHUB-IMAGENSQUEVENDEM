
import { useProductsController } from "@/hooks/useProductsController";
import { Progress } from "@/components/ui/progress";
import PricingControls from "@/components/pricing/PricingControls";
import { ProductsStatsCards } from "@/components/ProductsStatsCards";
import { ProductsFiltersControls } from "@/components/ProductsFiltersControls";
import { ProductsPagination } from "@/components/ProductsPagination";
import { ProductGrid } from "@/components/ProductGrid";
import { ProductTable } from "@/components/ProductTable";
import { BatchPremiumAdsExportButton } from "@/components/product/BatchPremiumAdsExportButton";
import { RefreshCw } from "lucide-react";
import { ProductsHeader } from "./ProductsHeader";
import { ProductsTopBar } from "./ProductsTopBar";
import { ProductsEmptyState } from "./ProductsEmptyState";

const ProductsPage = () => {
  const controller = useProductsController();

  const getMarketplaceName = () => {
    const names: Record<string, string> = {
      shopee: 'Shopee',
      shein: 'Shein',
      kwai: 'Kwai',
      amazon: 'Amazon',
      tiktok: 'TikTok Shop',
      'loja-virtual': 'Loja Virtual'
    };
    return names[controller.selectedPricing] || '';
  };

  const handleProductsUpdated = () => {
    console.log('🔄 Produtos atualizados, recarregando lista...');
    // Forçar atualização da lista
    window.dispatchEvent(new CustomEvent('productUpdated'));
  };

  return (
    <div className="space-y-6">
      <ProductsHeader allProductsCount={controller.allProducts.length} />

      <PricingControls
        profitMargin={controller.profitMargin}
        taxRate={controller.taxRate}
        onProfitMarginChange={controller.setProfitMargin}
        onTaxRateChange={controller.setTaxRate}
        selectedPricing={controller.selectedPricing}
        onPricingChange={controller.setSelectedPricing}
        storeCommission={controller.storeCommission}
        onStoreCommissionChange={controller.setStoreCommission}
      />

      {/* Progresso de sincronização */}
      {controller.isSyncing && (
        <div className="flex flex-col items-center gap-2 w-full max-w-md mx-auto py-2">
          <Progress value={controller.syncProgress.currentStep ? Math.min(controller.syncProgress.currentStep * 10, 100) : 10} className="w-full h-2 bg-secondary" />
          <span className="text-sm text-muted-foreground">
            {controller.syncProgress.message || "Sincronizando..."}
          </span>
        </div>
      )}

      {/* Cards de Estatísticas */}
      {controller.selectedPricing === 'none' && (
        <ProductsStatsCards
          stats={controller.stats}
          isAnalyzing={controller.isAnalyzing}
          totalImagesNeedingImprovement={controller.totalImagesNeedingImprovement}
          onCardClick={controller.handleCardFilter}
        />
      )}

      {/* Filtros e visualização */}
      <ProductsFiltersControls
        searchQuery={controller.searchQuery}
        setSearchQuery={v => { controller.setSearchQuery(v); controller.setCurrentPage(1); }}
        filterStatus={controller.filterStatus}
        setFilterStatus={v => { controller.setFilterStatus(v); controller.setCurrentPage(1); }}
        filterCategories={controller.filterCategories}
        setFilterCategories={v => { controller.setFilterCategories(v); controller.setCurrentPage(1); }}
        categories={controller.categories}
        filterBrands={controller.filterBrands}
        setFilterBrands={v => { controller.setFilterBrands(v); controller.setCurrentPage(1); }}
        brands={controller.brands}
        priceRange={controller.priceRange}
        setPriceRange={v => { controller.setPriceRange(v); controller.setCurrentPage(1); }}
        imageFilter={controller.imageFilter}
        setImageFilter={v => { controller.setImageFilter(v); controller.setCurrentPage(1); }}
        enhancementFilter={controller.enhancementFilter}
        setEnhancementFilter={v => { controller.setEnhancementFilter(v); controller.setCurrentPage(1); }}
        unifiedCommandsFilter={controller.unifiedCommandsFilter}
        setUnifiedCommandsFilter={v => { controller.setUnifiedCommandsFilter(v); controller.setCurrentPage(1); }}
        hostedImagesFilter={controller.hostedImagesFilter}
        setHostedImagesFilter={v => { controller.setHostedImagesFilter(v); controller.setCurrentPage(1); }}
        readyForAdsFilter={controller.readyForAdsFilter}
        setReadyForAdsFilter={v => { controller.setReadyForAdsFilter(v); controller.setCurrentPage(1); }}
        setViewMode={controller.setViewMode}
        viewMode={controller.viewMode}
        handleSync={controller.handleSync}
        isSyncing={controller.isSyncing}
        selectedPricing={controller.selectedPricing}
      />

      {/* Botão de geração em lote - Sempre visível para debug */}
      {controller.readyForAdsFilter === "ready" && (
        <div className="mb-4">
          <div className="text-sm text-muted-foreground mb-2">
            Debug: Filtro = {controller.readyForAdsFilter}, Produtos filtrados = {controller.filteredProducts.length}
          </div>
          {controller.filteredProducts.length > 0 ? (
            <BatchPremiumAdsExportButton products={controller.filteredProducts} />
          ) : (
            <div className="p-4 bg-muted rounded-lg text-center">
              Nenhum produto encontrado com o filtro "Pronto para Anúncios"
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {controller.isLoading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando produtos...</p>
        </div>
      )}

      {/* Empty state */}
      {!controller.isLoading && controller.displayedProducts.length === 0 && (
        <ProductsEmptyState 
          hasFilters={
            controller.selectedPricing === 'none' &&
            (
              Boolean(controller.searchQuery) ||
              controller.filterStatus !== "all" ||
              controller.filterCategories.length > 0 ||
              controller.filterBrands.length > 0 ||
              controller.priceRange !== "all" ||
              controller.imageFilter !== "all" ||
              controller.unifiedCommandsFilter !== "all"
            )
          }
          onSync={controller.handleSync}
          isSyncing={controller.isSyncing}
        />
      )}

      {/* Exibição dos produtos */}
      {!controller.isLoading && controller.displayedProducts.length > 0 && (
        <>
          <ProductsTopBar
            displayedCount={controller.displayedProducts.length}
            filteredCount={controller.filteredCount}
            allProductsCount={controller.allProducts.length}
            selectedPricing={controller.selectedPricing}
            getMarketplaceName={getMarketplaceName}
            showClearFilters={
              controller.selectedPricing === 'none' &&
              (
                Boolean(controller.searchQuery) ||
                controller.filterStatus !== "all" ||
                controller.filterCategories.length > 0 ||
                controller.filterBrands.length > 0 ||
                controller.priceRange !== "all" ||
                controller.imageFilter !== "all" ||
                controller.unifiedCommandsFilter !== "all"
              )
            }
            handleClearFilters={controller.handleClearFilters}
            displayedProducts={controller.displayedProducts}
            onProductsUpdated={handleProductsUpdated}
            currentPage={controller.currentPage}
            allProducts={controller.allProducts}
          />


          {/* Paginação topo */}
          <ProductsPagination
            currentPage={controller.currentPage}
            totalPages={controller.totalPages}
            setCurrentPage={controller.setCurrentPage}
          />

          {controller.viewMode === "list" ? (
            <ProductTable
              products={controller.displayedProducts}
              onEditProduct={controller.handleEditProduct}
              onViewProduct={controller.handleViewProduct}
              updateSingleProduct={controller.updateSingleProduct}
              profitMargin={controller.profitMargin}
              taxRate={controller.taxRate}
              selectedPricing={controller.selectedPricing}
              storeCommission={controller.storeCommission}
            />
          ) : (
            <ProductGrid
              products={controller.displayedProducts}
              onEditProduct={controller.handleEditProduct}
              onViewProduct={controller.handleViewProduct}
            />
          )}

          {/* Paginação inferior */}
          <div className="pt-4">
            <ProductsPagination
              currentPage={controller.currentPage}
              totalPages={controller.totalPages}
              setCurrentPage={controller.setCurrentPage}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ProductsPage;
