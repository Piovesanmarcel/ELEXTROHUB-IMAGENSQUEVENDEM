import { useState, useEffect, useMemo } from "react";
import { useProductsData } from "./useProductsData";
import { Product } from "@/lib/supabase";

interface ProductGroup {
  groupId: string;
  groupName: string;
  products: Product[];
  similarity: number;
  hasStock: boolean;
}

interface GroupStats {
  totalGroups: number;
  totalProducts: number;
  outOfStock: number;
  withAlternatives: number;
}

interface UseProductGroupingOptions {
  searchTerm?: string;
  minSimilarity?: number;
}

// Cache para resultados de similaridade
const similarityCache = new Map<string, number>();

// Cache para grupos de produtos com TTL de 8 horas
interface GroupCache {
  groups: ProductGroup[];
  searchTerm: string;
  minSimilarity: number;
  timestamp: number;
  productsCount: number;
}

class ProductGroupsCache {
  private static instance: ProductGroupsCache;
  private cache = new Map<string, GroupCache>();
  private readonly TTL = 8 * 60 * 60 * 1000; // 8 horas em ms

  static getInstance(): ProductGroupsCache {
    if (!ProductGroupsCache.instance) {
      ProductGroupsCache.instance = new ProductGroupsCache();
    }
    return ProductGroupsCache.instance;
  }

  getCacheKey(searchTerm: string, minSimilarity: number, productsCount: number): string {
    return `${searchTerm.toLowerCase().trim()}_${minSimilarity}_${productsCount}`;
  }

  get(searchTerm: string, minSimilarity: number, productsCount: number): ProductGroup[] | null {
    const key = this.getCacheKey(searchTerm, minSimilarity, productsCount);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > this.TTL;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    console.log('📦 [CACHE] Usando cache de agrupamento:', key);
    return cached.groups;
  }

  set(searchTerm: string, minSimilarity: number, productsCount: number, groups: ProductGroup[]): void {
    const key = this.getCacheKey(searchTerm, minSimilarity, productsCount);
    this.cache.set(key, {
      groups: [...groups],
      searchTerm,
      minSimilarity,
      timestamp: Date.now(),
      productsCount
    });
    console.log('💾 [CACHE] Salvando cache de agrupamento:', key, 'grupos:', groups.length);
  }

  clear(): void {
    this.cache.clear();
    console.log('🗑️ [CACHE] Cache de agrupamento limpo');
  }
}

const groupsCache = ProductGroupsCache.getInstance();

// Função otimizada para calcular similaridade entre strings
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const cacheKey = `${str1}|${str2}`;
  if (similarityCache.has(cacheKey)) {
    return similarityCache.get(cacheKey)!;
  }
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) {
    similarityCache.set(cacheKey, 100);
    return 100;
  }
  
  // Cálculo mais simples para performance
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) {
    similarityCache.set(cacheKey, 100);
    return 100;
  }
  
  // Usar uma abordagem mais simples que Levenshtein para melhor performance
  let matches = 0;
  const shorterWords = shorter.split(' ');
  const longerWords = longer.split(' ');
  
  shorterWords.forEach(word => {
    if (longerWords.some(lw => lw.includes(word) || word.includes(lw))) {
      matches++;
    }
  });
  
  const similarity = Math.round((matches / Math.max(shorterWords.length, longerWords.length)) * 100);
  similarityCache.set(cacheKey, similarity);
  
  return similarity;
}

// Função para normalizar texto para comparação
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9\s]/g, "") // Remove caracteres especiais
    .replace(/\s+/g, " ") // Normaliza espaços
    .trim();
}

// Função otimizada para calcular similaridade de produto
function calculateProductSimilarity(product1: Product, product2: Product): number {
  // Priorizar comparação por nome e marca primeiro (mais rápido)
  if (product1.nome && product2.nome) {
    const nameSimilarity = calculateSimilarity(
      normalizeText(product1.nome),
      normalizeText(product2.nome)
    );
    
    // Se nomes são muito diferentes, não vale a pena calcular o resto
    if (nameSimilarity < 30) return nameSimilarity;
    
    // Se marcas são iguais, aumentar peso
    if (product1.marca && product2.marca && 
        normalizeText(product1.marca) === normalizeText(product2.marca)) {
      return Math.min(100, nameSimilarity + 20);
    }
    
    return nameSimilarity;
  }
  
  return 0;
}

export function useProductGroupingOptimized(options: UseProductGroupingOptions = {}) {
  const { searchTerm = "", minSimilarity = 70 } = options;
  const { allProducts, isLoading } = useProductsData();
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [isGrouping, setIsGrouping] = useState(false);

  // Filtragem de produtos otimizada
  const filteredProducts = useMemo(() => {
    if (!allProducts?.length) return [];
    
    if (!searchTerm) return allProducts;
    
    const searchLower = searchTerm.toLowerCase();
    return allProducts.filter(product => {
      return (
        product.nome?.toLowerCase().includes(searchLower) ||
        product.marca?.toLowerCase().includes(searchLower) ||
        product.categoria?.toLowerCase().includes(searchLower) ||
        product.sku?.toLowerCase().includes(searchLower)
      );
    });
  }, [allProducts, searchTerm]);

  // Agrupamento otimizado de produtos - só processar com busca ativa
  useEffect(() => {
    if (!filteredProducts.length || !searchTerm.trim()) {
      setProductGroups([]);
      setIsGrouping(false);
      return;
    }

    // Verificar cache primeiro
    const cachedGroups = groupsCache.get(searchTerm, minSimilarity, filteredProducts.length);
    if (cachedGroups) {
      setProductGroups(cachedGroups);
      setIsGrouping(false);
      return;
    }

    // Evitar agrupamento desnecessário para listas muito grandes
    if (filteredProducts.length > 1000) {
      console.log('⚠️ Muitos produtos para agrupar, limitando...');
      return;
    }

    setIsGrouping(true);
    
    // Usar requestIdleCallback para não bloquear a UI
    const processGroups = () => {
      const groups: ProductGroup[] = [];
      const processedProducts = new Set<string>();

      // Processar em lotes menores
      const batchSize = 50;
      let currentIndex = 0;

      const processBatch = () => {
        const endIndex = Math.min(currentIndex + batchSize, filteredProducts.length);
        
        for (let i = currentIndex; i < endIndex; i++) {
          const product = filteredProducts[i];
          if (processedProducts.has(product.id)) continue;

          const similarProducts: Product[] = [product];
          processedProducts.add(product.id);

          // Buscar produtos similares apenas nos próximos produtos
          for (let j = i + 1; j < filteredProducts.length && j < i + 100; j++) {
            const otherProduct = filteredProducts[j];
            
            if (processedProducts.has(otherProduct.id)) continue;

            const similarity = calculateProductSimilarity(product, otherProduct);
            
            if (similarity >= minSimilarity) {
              similarProducts.push(otherProduct);
              processedProducts.add(otherProduct.id);
            }
          }

          // Só criar grupo se tiver mais de um produto similar
          if (similarProducts.length > 1) {
            const hasStock = similarProducts.some(p => p.estoque && p.estoque > 0);

            groups.push({
              groupId: `group-${product.id}`,
              groupName: product.nome || `Produto ${product.sku}`,
              products: similarProducts.sort((a, b) => {
                if (a.estoque && !b.estoque) return -1;
                if (!a.estoque && b.estoque) return 1;
                return (a.sku || '').localeCompare(b.sku || '');
              }),
              similarity: Math.round(
                similarProducts.slice(1).reduce((sum, p) => 
                  sum + calculateProductSimilarity(product, p), 0
                ) / (similarProducts.length - 1)
              ),
              hasStock
            });
          }
        }

        currentIndex = endIndex;

        if (currentIndex < filteredProducts.length) {
          // Continuar processamento no próximo frame
          requestAnimationFrame(processBatch);
        } else {
          // Finalizar agrupamento
          groups.sort((a, b) => (a.groupName || '').localeCompare(b.groupName || ''));
          
          // Salvar no cache
          groupsCache.set(searchTerm, minSimilarity, filteredProducts.length, groups);
          
          setProductGroups(groups);
          setIsGrouping(false);
        }
      };

      processBatch();
    };

    // Usar requestIdleCallback se disponível, senão setTimeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(processGroups);
    } else {
      setTimeout(processGroups, 0);
    }

    return () => {
      setIsGrouping(false);
    };
  }, [filteredProducts, minSimilarity, searchTerm]);

  // Estatísticas calculadas de forma eficiente
  const groupStats: GroupStats = useMemo(() => {
    if (!productGroups.length) {
      return {
        totalGroups: 0,
        totalProducts: 0,
        outOfStock: 0,
        withAlternatives: 0
      };
    }

    let totalProducts = 0;
    let outOfStock = 0;
    let withAlternatives = 0;

    for (const group of productGroups) {
      totalProducts += group.products.length;
      if (!group.hasStock) outOfStock++;
      if (group.products.length > 1 && group.hasStock) withAlternatives++;
    }

    return {
      totalGroups: productGroups.length,
      totalProducts,
      outOfStock,
      withAlternatives
    };
  }, [productGroups]);

  return {
    productGroups,
    isLoading: isLoading || isGrouping,
    groupStats
  };
}