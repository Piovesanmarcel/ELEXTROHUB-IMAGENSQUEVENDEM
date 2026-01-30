
import { useEffect, useCallback, useRef, useState, useMemo } from "react";
import { useImageQualityAnalysis } from "@/hooks/useImageQualityAnalysis";
import { useProductsData } from "./useProductsData";
import { useProductsFilters } from "./useProductsFilters";
import { useProductsStats } from "./useProductsStats";
import { useProductsFiltering } from "./useProductsFiltering";
import { useProductsView } from "./products/useProductsView";
import { useProductsPricing } from "./products/useProductsPricing";
import { useProductsSync } from "./products/useProductsSync";
import { useUnifiedCommandsData } from "./useUnifiedCommandsData";
import { useAutoUpdateNABrands } from "./useAutoUpdateNABrands";
import { useHostedImagesCount } from "./useHostedImagesCount";

export interface UseProductsControllerReturn {
  allProducts: any[];
  filteredProducts: any[];
  displayedProducts: any[];
  isLoading: boolean;
  isRefreshing: boolean;
  isSyncing: boolean;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  viewMode: "grid" | "list";
  setViewMode: (v: "grid" | "list") => void;
  filterStatus: "all" | "low" | "empty" | "instock";
  setFilterStatus: (v: any) => void;
  filterCategories: string[];
  setFilterCategories: (v: string[]) => void;
  filterBrands: string[];
  setFilterBrands: (v: string[]) => void;
  priceRange: string;
  setPriceRange: (v: string) => void;
  imageFilter: "all" | "few" | "small" | "poorQuality" | "none";
  setImageFilter: (v: any) => void;
  enhancementFilter: "all" | "enhanced" | "not_enhanced";
  setEnhancementFilter: (v: any) => void;
  unifiedCommandsFilter: "all" | "with_commands" | "without_commands";
  setUnifiedCommandsFilter: (v: any) => void;
  hostedImagesFilter: "all" | "with_hosted";
  setHostedImagesFilter: (v: any) => void;
  readyForAdsFilter: "all" | "ready";
  setReadyForAdsFilter: (v: any) => void;
  currentPage: number;
  setCurrentPage: (v: number) => void;
  PRODUCTS_PER_PAGE: number;
  profitMargin: number | '';
  setProfitMargin: (v: number | '') => void;
  taxRate: number | '';
  setTaxRate: (v: number | '') => void;
  storeCommission: number;
  setStoreCommission: (v: number) => void;
  selectedPricing: 'none' | 'shopee' | 'shein' | 'kwai' | 'amazon' | 'tiktok' | 'loja-virtual';
  setSelectedPricing: (v: any) => void;
  syncProgress: {
    message?: string;
    finished?: boolean;
    currentStep?: number;
    totalSteps?: number;
  }
  handleSync: () => Promise<void>;
  handleEditProduct: (product: any) => void;
  handleViewProduct: (product: any) => void;
  updateSingleProduct: (product: any) => void;
  handleClearFilters: () => void;
  handleCardFilter: (filter: "total" | "low" | "empty" | "fewImages" | "smallImages" | "poorQualityImages" | "noImages" | "enhanced" | "unifiedCommands") => void;
  categories: string[];
  brands: string[];
  filteredCount: number;
  totalPages: number;
  stats: {
    total: number;
    lowStock: number;
    outOfStock: number;
    inStock: number;
    fewImages: number;
    smallImages: number;
    poorQualityImages: number;
    noImages: number;
    enhancedProducts: number;
    unifiedCommandsProducts: number;
  };
  isAnalyzing: boolean;
  totalImagesNeedingImprovement: number;
  cacheAge: number;
}

export function useProductsController(): UseProductsControllerReturn {
  // Core data com controle de erro melhorado
  const { 
    allProducts, 
    isLoading, 
    isRefreshing, 
    loadProducts, 
    updateSingleProduct, 
    error, 
    hasLoaded, 
    cacheAge 
  } = useProductsData();
  
  console.log(`🎮 Controller: ${allProducts.length} produtos${isLoading ? ' (carregando...)' : ''}${error ? ' (com erro)' : ''}`);
  
  // View and UI state
  const viewHook = useProductsView();
  const pricingHook = useProductsPricing();
  
  // PAGINAÇÃO DIRETA - SEM HOOKS INTERMEDIÁRIOS
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.sessionStorage.getItem('products_current_page') : null;
      const parsed = saved ? parseInt(saved, 10) : 1;
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    } catch {
      return 1;
    }
  });
  const PRODUCTS_PER_PAGE = 30;

  useEffect(() => {
    try {
      window.sessionStorage.setItem('products_current_page', String(currentPage));
    } catch {}
  }, [currentPage]);
  
  // Filters and search
  const filtersHook = useProductsFilters();
  
  // Unified commands data - apenas se necessário
  const { productsWithCommands } = useUnifiedCommandsData();
  
  // Hosted images count
  const { hostedImagesCount } = useHostedImagesCount();
  
  // Sync functionality
  const syncHook = useProductsSync(loadProducts);
  
  // Auto update N/A brands (funcionalidade oculta) - desabilitado por enquanto
  // const autoUpdateHook = useAutoUpdateNABrands(allProducts);
  
  // Image quality analysis com controle de performance - apenas após carregamento
  const { qualityResults, isAnalyzing, productsNeedingImprovement, totalImagesNeedingImprovement } = 
    useImageQualityAnalysis(hasLoaded && allProducts.length > 0 ? allProducts : []);
  
  // Stats and derived data
  const { stats, categories, brands } = useProductsStats(allProducts, qualityResults);
  
  // Filtering logic com auto-refresh
  const { filteredProducts, filteredCount } = useProductsFiltering(allProducts, {
    searchQuery: filtersHook.searchQuery,
    filterStatus: filtersHook.filterStatus,
    filterCategories: filtersHook.filterCategories,
    filterBrands: filtersHook.filterBrands,
    priceRange: filtersHook.priceRange,
    imageFilter: filtersHook.imageFilter,
    enhancementFilter: filtersHook.enhancementFilter,
    unifiedCommandsFilter: filtersHook.unifiedCommandsFilter,
    hostedImagesFilter: filtersHook.hostedImagesFilter,
    readyForAdsFilter: filtersHook.readyForAdsFilter
  }, qualityResults, productsWithCommands, hostedImagesCount);

  // PAGINAÇÃO E DISPLAY DIRETO - MEMO PARA EVITAR RECALCULOS
  const displayedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const end = start + PRODUCTS_PER_PAGE;
    const paginated = filteredProducts.slice(start, end);
    console.log(`📄 PAGINAÇÃO: Página ${currentPage}, mostrando ${paginated.length} de ${filteredProducts.length} produtos`);
    return paginated;
  }, [filteredProducts, currentPage, PRODUCTS_PER_PAGE]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  }, [filteredProducts.length, PRODUCTS_PER_PAGE]);

  // Garantir que currentPage não ultrapasse totalPages (evita reset indevido quando lista fica temporariamente vazia)
  useEffect(() => {
    if (filteredProducts.length > 0 && currentPage > totalPages) {
      console.log(`📄 Ajustando página ${currentPage} para ${totalPages}`);
      setCurrentPage(totalPages);
    }
  }, [filteredProducts.length, currentPage, totalPages]);

  // Refs para controlar atualizações
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const lastUpdateRef = useRef<number>(0);

  // Listen for product updates com debounce melhorado
  useEffect(() => {
    const handleProductUpdate = () => {
      console.log('🔄 Evento productUpdated recebido (não fazendo reload completo)');
      // Não precisa fazer reload completo, a atualização individual já foi feita via cache
    };

    const handleProductsLoaded = (event: CustomEvent) => {
      console.log(`📦 Produtos carregados: ${event.detail.count} em ${event.detail.loadTime}ms`);
    };

    // Adicionar listeners apenas se necessário
    if (hasLoaded) {
      window.addEventListener('productUpdated', handleProductUpdate);
      window.addEventListener('productsLoaded', handleProductsLoaded as EventListener);
    }
    
    return () => {
      window.removeEventListener('productUpdated', handleProductUpdate);
      window.removeEventListener('productsLoaded', handleProductsLoaded as EventListener);
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [loadProducts, hasLoaded]);

  // Enhanced handlers com performance otimizada
  const handleClearFilters = useCallback(() => {
    console.log('🎮 Limpando filtros');
    filtersHook.handleClearFilters();
    setCurrentPage(1);
  }, [filtersHook]);

  const handleCardFilter = useCallback((filter: "total" | "low" | "empty" | "fewImages" | "smallImages" | "poorQualityImages" | "noImages" | "enhanced" | "unifiedCommands") => {
    console.log(`🎮 Aplicando filtro: ${filter}`);
    filtersHook.handleCardFilter(filter);
    setCurrentPage(1);
  }, [filtersHook]);

  // Enhanced stats
  const enhancedStats = {
    ...stats,
    enhancedProducts: allProducts.filter(p => (p as any).enhanced_at).length,
    unifiedCommandsProducts: allProducts.filter(p => productsWithCommands.has(p.id)).length
  };

  return {
    // Data
    allProducts,
    filteredProducts,
    displayedProducts,
    isLoading,
    isRefreshing: isRefreshing || false,
    cacheAge: cacheAge || 0,
    
    // Sync
    isSyncing: syncHook.isSyncing,
    syncProgress: syncHook.syncProgress,
    handleSync: syncHook.handleSync,
    
    // Filters
    ...filtersHook,
    handleClearFilters,
    handleCardFilter,
    
    // View
    ...viewHook,
    
    // Pagination DIRETO
    currentPage,
    setCurrentPage,
    PRODUCTS_PER_PAGE,
    totalPages,
    
    // Pricing
    ...pricingHook,
    
    // Actions
    handleEditProduct: syncHook.handleEditProduct,
    handleViewProduct: syncHook.handleViewProduct,
    updateSingleProduct,
    
    // Stats and filters data
    categories,
    brands,
    filteredCount,
    stats: enhancedStats,
    
    // Image analysis
    isAnalyzing,
    totalImagesNeedingImprovement,
  };
}
