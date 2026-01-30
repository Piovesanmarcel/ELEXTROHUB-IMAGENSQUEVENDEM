
import { useState, useCallback, useEffect } from "react";

export function useProductsPagination() {
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 30; // 30 produtos por página

  // Logar mudanças de página para depuração
  useEffect(() => {
    console.log(`📄 PAGINATION - currentPage mudou para: ${currentPage}`);
  }, [currentPage]);

  const resetToFirstPage = useCallback(() => {
    console.log('📄 PAGINATION - Reset para página 1');
    setCurrentPage(1);
  }, []);

  const getTotalPages = useCallback((filteredCount: number) => {
    const totalPages = Math.ceil(filteredCount / PRODUCTS_PER_PAGE);
    console.log(`📄 PAGINATION - Calculando páginas: ${filteredCount} produtos ÷ ${PRODUCTS_PER_PAGE} = ${totalPages} páginas`);
    return totalPages;
  }, [PRODUCTS_PER_PAGE]);

  const getPaginatedData = useCallback(<T>(data: T[]) => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    const paginatedData = data.slice(startIndex, endIndex);
    
    console.log(`📄 PAGINATION - Página ${currentPage}:`);
    console.log(`    Total dados disponíveis: ${data.length}`);
    console.log(`    Índice início: ${startIndex}`);
    console.log(`    Índice fim: ${endIndex}`);
    console.log(`    Dados desta página: ${paginatedData.length}`);
    console.log(`    ✅ PAGINAÇÃO: Exibindo ${paginatedData.length} de ${data.length} produtos totais`);
    
    return paginatedData;
  }, [currentPage, PRODUCTS_PER_PAGE]);

  return {
    currentPage,
    setCurrentPage,
    PRODUCTS_PER_PAGE,
    resetToFirstPage,
    getTotalPages,
    getPaginatedData
  };
}
