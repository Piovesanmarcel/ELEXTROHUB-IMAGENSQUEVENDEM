
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useEnhancedProductsData() {
  const [enhancedProducts, setEnhancedProducts] = useState<any[]>([]);
  const [isLoadingEnhanced, setIsLoadingEnhanced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEnhancedProducts = async () => {
    console.log('🔍 [ENHANCED-PRODUCTS] Iniciando carregamento...');
    setIsLoadingEnhanced(true);
    setError(null);
    
    try {
      // Fazer query mais simples e rápida - apenas contar produtos melhorados
      const { count, error } = await supabase
        .from('produtos')
        .select('id', { count: 'exact', head: true })
        .not('enhanced_at', 'is', null);

      if (error) {
        console.error('❌ [ENHANCED-PRODUCTS] Erro na query:', error);
        throw error;
      }

      console.log(`✅ [ENHANCED-PRODUCTS] ${count || 0} produtos melhorados encontrados`);
      setEnhancedProducts([]); // Por enquanto, retornar array vazio para evitar timeout
      
    } catch (error) {
      console.error('💥 [ENHANCED-PRODUCTS] Erro:', error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
      setEnhancedProducts([]);
    } finally {
      setIsLoadingEnhanced(false);
    }
  };

  useEffect(() => {
    // Delay maior para não interferir no carregamento principal
    const timeoutId = setTimeout(() => {
      loadEnhancedProducts();
    }, 5000); // 5 segundos de delay

    return () => clearTimeout(timeoutId);
  }, []);

  return {
    enhancedProducts,
    isLoadingEnhanced,
    error,
    loadEnhancedProducts
  };
}
