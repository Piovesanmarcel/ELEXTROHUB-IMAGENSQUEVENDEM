
import { useProductsController } from "@/hooks/useProductsController";
import { Progress } from "@/components/ui/progress";
import PricingControls from "@/components/pricing/PricingControls";
import { ProductsStatsCards } from "@/components/ProductsStatsCards";
import { ProductsFiltersControls } from "@/components/ProductsFiltersControls";
import { ProductsPagination } from "@/components/ProductsPagination";
import { ProductGrid } from "@/components/ProductGrid";
import { ProductTable } from "@/components/ProductTable";
import { BatchPremiumAdsExportButton } from "@/components/product/BatchPremiumAdsExportButton";
import { RefreshCw, Database } from "lucide-react";
import { ProductsHeader } from "./ProductsHeader";
import { ProductsTopBar } from "./ProductsTopBar";
import { ProductsEmptyState } from "./ProductsEmptyState";
import LoadingScreen from "@/components/ui/loading-screen";
import { Badge } from "@/components/ui/badge";
import { memo, useCallback } from "react";
import { VirtualizedProductGrid } from "@/components/VirtualizedProductGrid";

const Products = memo(() => {
  console.log('🔄 Products component rendering...');
  
  // CRÍTICO: Hooks sempre no topo
  const controller = useProductsController();

  // Early return apenas se controller existe mas está em estado inválido
  if (!controller || typeof controller !== 'object') {
    console.error('❌ Controller inválido');
    return <div>Erro de carregamento</div>;
  }

  // Handlers estáveis para filtros/pesquisa (evitam re-render e reset indevido da paginação)
  const onSetSearchQuery = useCallback((v: string) => {
    controller.setSearchQuery(v);
    controller.setCurrentPage(1);
  }, [controller.setSearchQuery, controller.setCurrentPage]);

  const onSetFilterStatus = useCallback((v: "all" | "low" | "empty" | "instock") => {
    controller.setFilterStatus(v);
    controller.setCurrentPage(1);
  }, [controller.setFilterStatus, controller.setCurrentPage]);

  const onSetFilterCategories = useCallback((v: string[]) => {
    controller.setFilterCategories(v);
    controller.setCurrentPage(1);
  }, [controller.setFilterCategories, controller.setCurrentPage]);

  const onSetFilterBrands = useCallback((v: string[]) => {
    controller.setFilterBrands(v);
    controller.setCurrentPage(1);
  }, [controller.setFilterBrands, controller.setCurrentPage]);

  const onSetPriceRange = useCallback((v: string) => {
    controller.setPriceRange(v);
    controller.setCurrentPage(1);
  }, [controller.setPriceRange, controller.setCurrentPage]);

  const onSetImageFilter = useCallback((v: "all" | "few" | "small" | "poorQuality" | "none") => {
    controller.setImageFilter(v);
    controller.setCurrentPage(1);
  }, [controller.setImageFilter, controller.setCurrentPage]);

  const onSetEnhancementFilter = useCallback((v: "all" | "enhanced" | "not_enhanced") => {
    controller.setEnhancementFilter(v);
    controller.setCurrentPage(1);
  }, [controller.setEnhancementFilter, controller.setCurrentPage]);

  const onSetUnifiedCommandsFilter = useCallback((v: "all" | "with_commands" | "without_commands") => {
    controller.setUnifiedCommandsFilter(v);
    controller.setCurrentPage(1);
  }, [controller.setUnifiedCommandsFilter, controller.setCurrentPage]);

  const onSetHostedImagesFilter = useCallback((v: "all" | "with_hosted") => {
    controller.setHostedImagesFilter(v);
    controller.setCurrentPage(1);
  }, [controller.setHostedImagesFilter, controller.setCurrentPage]);

  const onSetReadyForAdsFilter = useCallback((v: "all" | "ready") => {
    controller.setReadyForAdsFilter(v);
    controller.setCurrentPage(1);
  }, [controller.setReadyForAdsFilter, controller.setCurrentPage]);

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

  // Check if there are active filters
  const hasFilters = controller.selectedPricing === 'none' &&
    (
      Boolean(controller.searchQuery) ||
      controller.filterStatus !== "all" ||
      controller.filterCategories.length > 0 ||
      controller.filterBrands.length > 0 ||
      controller.priceRange !== "all" ||
      controller.imageFilter !== "all" ||
      controller.unifiedCommandsFilter !== "all"
    );

  // Se está carregando e não tem produtos ainda, mostra tela de loading completa
  if (controller.isLoading && controller.allProducts.length === 0) {
    return (
      <LoadingScreen 
        message="Carregando produtos..." 
        onRetry={() => {
          console.log('🔄 Retry solicitado pelo usuário - recarregando página');
          window.location.reload();  
        }}
      />
    );
  }

  // Calcular idade do cache
  const cacheAge = controller.cacheAge ? Math.round(controller.cacheAge / 1000 / 60) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <ProductsHeader allProductsCount={controller.allProducts.length} />
        
        {/* Indicador de cache */}
        {cacheAge > 0 && (
          <div className="flex items-center gap-2">
            {controller.isRefreshing && (
              <Badge variant="outline" className="gap-1.5 bg-blue-50 text-blue-700 border-blue-200">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Atualizando...
              </Badge>
            )}
            {!controller.isLoading && cacheAge < 60 && (
              <Badge variant="outline" className="gap-1.5 bg-green-50 text-green-700 border-green-200">
                <Database className="h-3 w-3" />
                Cache {cacheAge}min
              </Badge>
            )}
          </div>
        )}
      </div>

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

      {/* Cards de Estatísticas - só renderizar se não está carregando */}
      {!controller.isLoading && controller.selectedPricing === 'none' && (
        <ProductsStatsCards
          stats={controller.stats}
          isAnalyzing={controller.isAnalyzing}
          totalImagesNeedingImprovement={controller.totalImagesNeedingImprovement}
          onCardClick={controller.handleCardFilter}
        />
      )}

      {/* Filtros e visualização - só renderizar se tem produtos */}
{controller.allProducts.length > 0 && (
  <>
    <ProductsFiltersControls
      searchQuery={controller.searchQuery}
      setSearchQuery={onSetSearchQuery}
      filterStatus={controller.filterStatus}
      setFilterStatus={onSetFilterStatus}
      filterCategories={controller.filterCategories}
      setFilterCategories={onSetFilterCategories}
      categories={controller.categories}
      filterBrands={controller.filterBrands}
      setFilterBrands={onSetFilterBrands}
      brands={controller.brands}
      priceRange={controller.priceRange}
      setPriceRange={onSetPriceRange}
      imageFilter={controller.imageFilter}
      setImageFilter={onSetImageFilter}
      enhancementFilter={controller.enhancementFilter}
      setEnhancementFilter={onSetEnhancementFilter}
      unifiedCommandsFilter={controller.unifiedCommandsFilter}
      setUnifiedCommandsFilter={onSetUnifiedCommandsFilter}
      hostedImagesFilter={controller.hostedImagesFilter}
      setHostedImagesFilter={onSetHostedImagesFilter}
      readyForAdsFilter={controller.readyForAdsFilter}
      setReadyForAdsFilter={onSetReadyForAdsFilter}
      setViewMode={controller.setViewMode}
      viewMode={controller.viewMode}
      handleSync={controller.handleSync}
      isSyncing={controller.isSyncing}
      selectedPricing={controller.selectedPricing}
    />

    {/* Botão de geração em lote para "Prontos" */}
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
  </>
)}

      {/* Loading parcial durante refresh */}
      {controller.isLoading && controller.allProducts.length > 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center space-y-3">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
            <div>
              <p className="font-medium">Atualizando produtos...</p>
              <p className="text-sm text-muted-foreground">
                Buscando as informações mais recentes
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Exibição dos produtos - só se não está carregando e tem produtos */}
      {!controller.isLoading && controller.displayedProducts.length > 0 && (
        <>
          <ProductsTopBar
            displayedCount={controller.displayedProducts.length}
            filteredCount={controller.filteredCount}
            allProductsCount={controller.allProducts.length}
            selectedPricing={controller.selectedPricing}
            getMarketplaceName={getMarketplaceName}
            showClearFilters={hasFilters}
            handleClearFilters={controller.handleClearFilters}
            displayedProducts={controller.displayedProducts}
            onProductsUpdated={handleProductsUpdated}
            currentPage={controller.currentPage}
            allProducts={controller.allProducts}
            filteredProducts={controller.filteredProducts}
          />

          {/* Info de paginação */}
          <div className="text-center text-sm text-muted-foreground">
            Exibindo {controller.displayedProducts.length} de {controller.filteredCount} produtos ({controller.PRODUCTS_PER_PAGE} por página)
          </div>

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
            <VirtualizedProductGrid
              products={controller.displayedProducts}
              enableVirtualization={controller.displayedProducts.length > 50}
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

      {/* Estado vazio - mostrar apenas quando não está carregando e não há produtos */}
      {!controller.isLoading && controller.displayedProducts.length === 0 && (
        <ProductsEmptyState 
          hasFilters={hasFilters}
          onSync={controller.handleSync}
          isSyncing={controller.isSyncing}
        />
      )}
    </div>
  );
});

Products.displayName = 'Products';

export default Products;
