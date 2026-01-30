import { useState, useEffect, useCallback, useRef } from "react";
import { Product } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";

// Configurações do cache
const CACHE_KEY = 'electrohub_products_cache';
const CACHE_VERSION = '1.0';
const CACHE_TTL = 60 * 60 * 1000; // 1 hora
const STALE_TIME = 30 * 60 * 1000; // 30 minutos

interface CacheData {
  version: string;
  timestamp: number;
  userId: string;
  products: Product[];
  metadata: {
    count: number;
    lastSync: number;
  };
}

// Cache global que persiste entre navegações + localStorage
class ProductsCache {
  private static instance: ProductsCache;
  private data: Product[] = [];
  private lastLoadTime: number = 0;
  private isLoaded: boolean = false;
  private listeners: Set<() => void> = new Set();
  private currentUserId: string | null = null;

  static getInstance(): ProductsCache {
    if (!ProductsCache.instance) {
      ProductsCache.instance = new ProductsCache();
      ProductsCache.instance.loadFromStorage();
    }
    return ProductsCache.instance;
  }

  private async loadFromStorage() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      this.currentUserId = user.id;
      const stored = localStorage.getItem(CACHE_KEY);
      if (!stored) return;

      const cacheData: CacheData = JSON.parse(stored);
      
      // Validar versão e usuário
      if (cacheData.version !== CACHE_VERSION || cacheData.userId !== user.id) {
        localStorage.removeItem(CACHE_KEY);
        return;
      }

      // Cache válido - carregar dados
      this.data = cacheData.products;
      this.lastLoadTime = cacheData.timestamp;
      this.isLoaded = true;
      
      console.log('💾 [CACHE] Carregado do localStorage:', {
        count: this.data.length,
        age: `${Math.round((Date.now() - this.lastLoadTime) / 1000 / 60)}min`
      });
    } catch (error) {
      console.error('❌ [CACHE] Erro ao carregar do localStorage:', error);
      localStorage.removeItem(CACHE_KEY);
    }
  }

  private async saveToStorage() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const cacheData: CacheData = {
        version: CACHE_VERSION,
        timestamp: this.lastLoadTime,
        userId: user.id,
        products: this.data,
        metadata: {
          count: this.data.length,
          lastSync: this.lastLoadTime
        }
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log('💾 [CACHE] Salvo no localStorage:', this.data.length, 'produtos');
    } catch (error) {
      console.error('❌ [CACHE] Erro ao salvar no localStorage:', error);
    }
  }

  setData(products: Product[]) {
    this.data = products;
    this.lastLoadTime = Date.now();
    this.isLoaded = true;
    this.saveToStorage();
    this.notifyListeners();
  }

  getData(): { products: Product[]; isLoaded: boolean; lastLoadTime: number } {
    return {
      products: [...this.data],
      isLoaded: this.isLoaded,
      lastLoadTime: this.lastLoadTime
    };
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  updateProduct(productId: string, updatedProduct: Product) {
    const index = this.data.findIndex(p => p.id === productId);
    if (index !== -1) {
      this.data[index] = updatedProduct;
      this.notifyListeners();
      console.log('💾 [CACHE] Produto atualizado no cache:', updatedProduct.nome);
    }
  }

  clear() {
    this.data = [];
    this.isLoaded = false;
    this.lastLoadTime = 0;
    localStorage.removeItem(CACHE_KEY);
    this.notifyListeners();
  }

  // Cache válido por 1 hora
  isCacheValid(): boolean {
    return this.isLoaded && (Date.now() - this.lastLoadTime) < CACHE_TTL;
  }

  // Cache stale após 30 minutos (mas ainda usável)
  isCacheStale(): boolean {
    return this.isLoaded && (Date.now() - this.lastLoadTime) > STALE_TIME;
  }

  getCacheAge(): number {
    return Date.now() - this.lastLoadTime;
  }
}

export function useProductsCache() {
  const cache = ProductsCache.getInstance();
  const [state, setState] = useState(cache.getData());
  const forceUpdateRef = useRef<() => void>();

  useEffect(() => {
    const updateState = () => {
      setState(cache.getData());
    };
    
    forceUpdateRef.current = updateState;
    const unsubscribe = cache.subscribe(updateState);
    
    return () => {
      unsubscribe();
    };
  }, [cache]);

  const setProductsCache = useCallback((products: Product[]) => {
    console.log('💾 [CACHE] Salvando produtos no cache:', products.length);
    cache.setData(products);
  }, [cache]);

  const clearCache = useCallback(() => {
    console.log('🗑️ [CACHE] Limpando cache de produtos');
    cache.clear();
  }, [cache]);

  const isValid = useCallback(() => {
    return cache.isCacheValid();
  }, [cache]);

  const isStale = useCallback(() => {
    return cache.isCacheStale();
  }, [cache]);

  const getCacheAge = useCallback(() => {
    return cache.getCacheAge();
  }, [cache]);

  const updateProductCache = useCallback((productId: string, updatedProduct: Product) => {
    console.log('💾 [CACHE] Atualizando produto individual no cache:', updatedProduct.nome);
    cache.updateProduct(productId, updatedProduct);
  }, [cache]);

  return {
    cachedProducts: state.products,
    isCacheLoaded: state.isLoaded,
    lastCacheTime: state.lastLoadTime,
    setProductsCache,
    updateProductCache,
    clearCache,
    isCacheValid: isValid,
    isCacheStale: isStale,
    getCacheAge
  };
}