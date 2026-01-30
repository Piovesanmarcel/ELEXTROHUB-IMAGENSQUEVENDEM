
import { useMemo, useCallback } from "react";
import { Product } from "@/lib/supabase";

export function useProductsDisplay(filteredProducts: Product[], pagination: ReturnType<typeof import("../useProductsPagination").useProductsPagination>) {
  // Desestruturar para evitar problemas de referência
  const { currentPage, PRODUCTS_PER_PAGE, getPaginatedData, getTotalPages: getTotalPagesUtil, resetToFirstPage: resetUtil, setCurrentPage: setCurrentPageUtil } = pagination;
  
  const displayedProducts = useMemo(() => {
    console.log(`📄 DISPLAY - RECEBENDO ${filteredProducts.length} PRODUTOS FILTRADOS`);
    
    if (filteredProducts.length === 0) {
      console.log(`📄 DISPLAY - NENHUM PRODUTO PARA PAGINAR`);
      return [];
    }
    
    // PAGINAÇÃO: mostrar apenas os produtos da página atual
    const paginatedProducts = getPaginatedData(filteredProducts);
    
    console.log(`📄 PAGINAÇÃO APLICADA:`);
    console.log(`    Total filtrados: ${filteredProducts.length}`);
    console.log(`    Página atual: ${currentPage}`);
    console.log(`    Por página: ${PRODUCTS_PER_PAGE}`);
    console.log(`    Esta página: ${paginatedProducts.length} produtos`);
    console.log(`    Total páginas: ${Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE)}`);
    
    if (paginatedProducts.length > 0) {
      console.log(`📄 PRIMEIRA LINHA DESTA PÁGINA: ${paginatedProducts[0]?.nome} (${paginatedProducts[0]?.sku})`);
    }
    
    console.log(`📄 ✅ RETORNANDO ${paginatedProducts.length} PRODUTOS PARA RENDERIZAÇÃO`);
    
    return paginatedProducts;
  }, [filteredProducts, currentPage, PRODUCTS_PER_PAGE, getPaginatedData]);

  const getTotalPages = useCallback(() => {
    const totalPages = getTotalPagesUtil(filteredProducts.length);
    console.log(`📄 TOTAL DE PÁGINAS: ${totalPages} (${filteredProducts.length} produtos ÷ ${PRODUCTS_PER_PAGE})`);
    return totalPages;
  }, [filteredProducts.length, PRODUCTS_PER_PAGE, getTotalPagesUtil]);

  const resetToFirstPage = useCallback(() => {
    console.log('📄 RESETANDO PARA PRIMEIRA PÁGINA');
    resetUtil();
  }, [resetUtil]);

  const handleSetCurrentPage = useCallback((page: number) => {
    console.log(`📄 MUDANDO PARA PÁGINA ${page}`);
    setCurrentPageUtil(page);
  }, [setCurrentPageUtil]);

  return {
    displayedProducts,
    currentPage,
    setCurrentPage: handleSetCurrentPage,
    PRODUCTS_PER_PAGE,
    getTotalPages,
    resetToFirstPage
  };
}
