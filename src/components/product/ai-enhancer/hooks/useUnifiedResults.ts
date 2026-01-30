
import { useState, useCallback } from "react";
import { UnifiedAIResponse } from "../types";

/**
 * Hook simplificado para gerenciar resultados unificados
 * ✅ 100% em memória - SEM persistência em banco de dados
 * ⚠️ Fechar a aba = dados perdidos (comportamento esperado)
 */
export const useUnifiedResults = () => {
  const [unifiedResults, setUnifiedResults] = useState<UnifiedAIResponse | null>(null);

  const updateResults = useCallback((results: UnifiedAIResponse | null) => {
    console.log('🔄 useUnifiedResults - Atualizando resultados em memória:', results ? Object.keys(results) : 'null');
    setUnifiedResults(results);
  }, []);

  const clearResults = useCallback(() => {
    console.log('🗑️ useUnifiedResults - Limpando resultados');
    setUnifiedResults(null);
  }, []);

  return {
    unifiedResults,
    setUnifiedResults: updateResults,
    clearResults,
    // Sempre false - não há persistência em banco
    hasPersistedResults: false
  };
};
