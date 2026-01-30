
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import { Product, fetchProducts } from "@/lib/supabase";
import { useProductsCache } from "./useProductsCache";

export function useProductsData() {
  const { 
    cachedProducts, 
    isCacheLoaded, 
    lastCacheTime, 
    setProductsCache, 
    updateProductCache,
    isCacheValid,
    isCacheStale,
    getCacheAge
  } = useProductsCache();
  
  const [allProducts, setAllProducts] = useState<Product[]>(() => {
    // Inicializar com cache se disponível
    if (isCacheLoaded) {
      console.log('💾 [USE-PRODUCTS-DATA] Inicializando com dados do cache:', cachedProducts.length);
      return cachedProducts;
    }
    return [];
  });
  
  const [isLoading, setIsLoading] = useState(() => {
    // Não mostrar loading se tem cache
    console.log('🚀 [USE-PRODUCTS-DATA] Estado inicial loading:', !isCacheLoaded);
    return !isCacheLoaded;
  });
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLoadTime, setLastLoadTime] = useState<number>(lastCacheTime);
  
  // Refs para controlar execução e evitar loops
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(isCacheLoaded && isCacheValid());
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);
  const maxRetries = 2;

  const loadProducts = useCallback(async (force: boolean = false): Promise<void> => {
    // Verificar se o componente ainda está montado
    if (!isMountedRef.current) {
      console.log('⚠️ [USE-PRODUCTS-DATA] Componente desmontado, cancelando carregamento');
      return;
    }

    // Se tem cache válido e não é force, usar cache
    if (!force && isCacheValid()) {
      console.log('💾 [USE-PRODUCTS-DATA] Cache válido, não precisa recarregar');
      setAllProducts(cachedProducts);
      setIsLoading(false);
      return;
    }

    // Se cache está stale, mostrar e atualizar em background
    const shouldBackgroundRefresh = !force && isCacheStale() && isCacheLoaded;
    if (shouldBackgroundRefresh) {
      console.log('🔄 [USE-PRODUCTS-DATA] Cache stale, usando cache e atualizando em background');
      setAllProducts(cachedProducts);
      setIsLoading(false);
      setIsRefreshing(true);
    }

    const now = Date.now();
    
    console.log('🎯 [USE-PRODUCTS-DATA] loadProducts chamado', {
      force,
      isLoadingRef: isLoadingRef.current,
      hasLoadedRef: hasLoadedRef.current,
      timeSinceLastLoad: now - lastLoadTime,
      retryCount: retryCountRef.current,
      isMounted: isMountedRef.current
    });
    
    if (!force && isLoadingRef.current) {
      console.log(`⚠️ [USE-PRODUCTS-DATA] Carregamento já em progresso, ignorando...`);
      return;
    }

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      console.log(`🔄 [USE-PRODUCTS-DATA] Cancelando requisição anterior...`);
      abortControllerRef.current.abort();
    }

    // Criar novo controller para esta requisição
    abortControllerRef.current = new AbortController();
    
    console.log(`🚀 [USE-PRODUCTS-DATA] Iniciando carregamento de produtos (force: ${force}, retry: ${retryCountRef.current})`);
    
    isLoadingRef.current = true;
    
    // Só atualizar o estado se o componente estiver montado
    if (isMountedRef.current && !shouldBackgroundRefresh) {
      setIsLoading(true);
      setError(null);
    }
    
    try {
      const startTime = Date.now();
      console.log('📞 [USE-PRODUCTS-DATA] Chamando fetchProducts...');
      
      // Mostrar toast de progresso
      const loadingToastId = toast.loading('Carregando produtos...', {
        description: 'Aguarde enquanto carregamos seus produtos'
      });
      
      const data = await fetchProducts();
      
      // Remover toast de loading
      toast.dismiss(loadingToastId);
      
      const loadTime = Date.now() - startTime;
      
      // Verificar se a requisição foi cancelada ou componente desmontado
      if (abortControllerRef.current?.signal.aborted || !isMountedRef.current) {
        console.log(`❌ [USE-PRODUCTS-DATA] Requisição cancelada ou componente desmontado`);
        return;
      }
      
      console.log(`📦 [USE-PRODUCTS-DATA] fetchProducts retornou: ${data.length} produtos em ${loadTime}ms`);
      
      // Só atualizar estado se componente ainda estiver montado
      if (!isMountedRef.current) {
        console.log('⚠️ [USE-PRODUCTS-DATA] Componente desmontado durante carregamento, ignorando resultado');
        return;
      }
      
      if (data.length === 0) {
        console.log(`⚠️ [USE-PRODUCTS-DATA] Array vazio retornado`);
        setAllProducts([]);
        if (!hasLoadedRef.current) {
          toast.info("Nenhum produto encontrado. Sincronize com o Bling para carregar produtos.");
        }
      } else {
        console.log(`✅ [USE-PRODUCTS-DATA] Definindo ${data.length} produtos no estado`);
        
        // Batch update para evitar re-renderizações múltiplas
        setAllProducts(data);
        
        // Salvar no cache para futuras navegações
        setProductsCache(data);
        
        hasLoadedRef.current = true;
        setLastLoadTime(now);
        retryCountRef.current = 0;
        
        // Disparar evento para notificar outros componentes
        window.dispatchEvent(new CustomEvent('productsLoaded', { 
          detail: { count: data.length, loadTime } 
        }));
        
        console.log(`🎉 [USE-PRODUCTS-DATA] ${data.length} PRODUTOS DEFINIDOS NO ESTADO COM SUCESSO!`);
      }
      
    } catch (error) {
      // Não processar erro se componente foi desmontado
      if (!isMountedRef.current) {
        console.log('⚠️ [USE-PRODUCTS-DATA] Componente desmontado durante erro, ignorando');
        return;
      }

      // Não mostrar erro se foi cancelamento
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`🔄 [USE-PRODUCTS-DATA] Carregamento cancelado`);
        return;
      }
      
      console.error("❌ [USE-PRODUCTS-DATA] Erro ao carregar produtos:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      
      // Implementar retry automático apenas para erros de rede
      if (retryCountRef.current < maxRetries && !errorMessage.includes('timeout')) {
        retryCountRef.current++;
        console.log(`🔄 [USE-PRODUCTS-DATA] Tentativa ${retryCountRef.current}/${maxRetries} em 2s...`);
        
        setTimeout(() => {
          if (!abortControllerRef.current?.signal.aborted && isMountedRef.current) {
            loadProducts(force);
          }
        }, 2000);
        
        return;
      }
      
      console.error(`💥 [USE-PRODUCTS-DATA] Falha após tentativas`);
      setError(errorMessage);
      
      if (!hasLoadedRef.current) {
        toast.error(`Erro ao carregar produtos. Verifique sua conexão.`);
      }
      setAllProducts([]);
    } finally {
      console.log(`🏁 [USE-PRODUCTS-DATA] Finalizando carregamento`);
      isLoadingRef.current = false;
      
      // Só atualizar estado se componente ainda estiver montado
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
      
      abortControllerRef.current = null;
    }
  }, [lastLoadTime, cachedProducts, isCacheLoaded, isCacheValid, isCacheStale, setProductsCache]);

  // Carregar produtos apenas uma vez na inicialização
  useEffect(() => {
    console.log('🎬 [USE-PRODUCTS-DATA] useEffect executado', {
      hasLoaded: hasLoadedRef.current,
      isMounted: isMountedRef.current,
      isCacheValid: isCacheValid(),
      cacheLoaded: isCacheLoaded
    });
    
    // Marcar como montado
    isMountedRef.current = true;
    
    // Se já temos cache válido, não precisa recarregar
    if (isCacheValid() && isCacheLoaded) {
      console.log('💾 [USE-PRODUCTS-DATA] Cache válido encontrado, pulando carregamento inicial');
      hasLoadedRef.current = true;
      return;
    }
    
    if (!hasLoadedRef.current) {
      console.log('⚡ [USE-PRODUCTS-DATA] Iniciando carregamento inicial...');
      loadProducts();
    }
    
    // Cleanup ao desmontar
    return () => {
      console.log('🧹 [USE-PRODUCTS-DATA] Componente desmontado, limpando...');
      isMountedRef.current = false;
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // Dependências vazias para executar apenas uma vez

  const processedProducts = useMemo(() => {
    console.log(`🔄 [USE-PRODUCTS-DATA] processedProducts recalculado com ${allProducts.length} produtos`);
    
    if (allProducts.length === 0) {
      console.log('📭 [USE-PRODUCTS-DATA] Retornando array vazio');
      return [];
    }
    
    const processed = allProducts.map(product => ({
      ...product,
      preco: Number(product.preco) || 0,
      estoque: Number(product.estoque) || 0,
    }));
    
    console.log(`✅ [USE-PRODUCTS-DATA] ${processed.length} produtos processados`);
    return processed;
  }, [allProducts]);

  const refreshProducts = useCallback(async (): Promise<void> => {
    console.log(`🔄 [USE-PRODUCTS-DATA] Refresh manual solicitado`);
    retryCountRef.current = 0;
    await loadProducts(true);
  }, [loadProducts]);

  const setAllProductsSorted = useCallback((products: Product[]) => {
    console.log(`🔄 [USE-PRODUCTS-DATA] setAllProductsSorted chamado com ${products.length} produtos`);
    
    // Só atualizar se componente estiver montado
    if (!isMountedRef.current) {
      console.log('⚠️ [USE-PRODUCTS-DATA] Componente desmontado, ignorando setAllProductsSorted');
      return;
    }
    
    setAllProducts(products);
    hasLoadedRef.current = true;
    setLastLoadTime(Date.now());
  }, []);

  const resetState = useCallback(() => {
    console.log(`🔄 [USE-PRODUCTS-DATA] Resetando estado completo`);
    hasLoadedRef.current = false;
    isLoadingRef.current = false;
    retryCountRef.current = 0;
    
    // Só atualizar estado se componente estiver montado
    if (isMountedRef.current) {
      setAllProducts([]);
      setError(null);
      setIsLoading(false);
      setLastLoadTime(0);
    }
  }, []);

  // Função para atualizar apenas um produto específico
  const updateSingleProduct = useCallback((updatedProduct: Product) => {
    console.log(`🔄 [USE-PRODUCTS-DATA] Atualizando produto individual:`, updatedProduct.nome);
    
    if (!isMountedRef.current) {
      console.log('⚠️ [USE-PRODUCTS-DATA] Componente desmontado, ignorando updateSingleProduct');
      return;
    }

    // Atualizar no estado local
    setAllProducts(prevProducts => {
      const updatedProducts = prevProducts.map(product => 
        product.id === updatedProduct.id ? updatedProduct : product
      );
      console.log(`✅ [USE-PRODUCTS-DATA] Produto ${updatedProduct.nome} atualizado no estado`);
      return updatedProducts;
    });

    // Atualizar no cache
    updateProductCache(updatedProduct.id, updatedProduct);
  }, [updateProductCache]);

  console.log('📊 [USE-PRODUCTS-DATA] Estado atual:', {
    allProductsLength: allProducts.length,
    processedProductsLength: processedProducts.length,
    isLoading,
    error,
    hasLoaded: hasLoadedRef.current,
    isMounted: isMountedRef.current,
    lastLoadTime
  });

  return {
    allProducts: processedProducts,
    isLoading,
    isRefreshing,
    error,
    loadProducts: refreshProducts,
    setAllProducts: setAllProductsSorted,
    updateSingleProduct,
    resetState,
    hasLoaded: hasLoadedRef.current,
    lastLoadTime,
    cacheAge: getCacheAge()
  };
}
