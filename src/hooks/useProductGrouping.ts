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

// Função para calcular similaridade entre strings
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 100;
  
  // Levenshtein distance
  const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
  
  for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= s2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= s2.length; j++) {
    for (let i = 1; i <= s1.length; i++) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  const maxLength = Math.max(s1.length, s2.length);
  const similarity = ((maxLength - matrix[s2.length][s1.length]) / maxLength) * 100;
  
  return Math.round(similarity);
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

// Função para calcular similaridade de produto
function calculateProductSimilarity(product1: Product, product2: Product): number {
  const weights = {
    nome: 0.4,
    marca: 0.2,
    categoria: 0.2,
    sku: 0.1,
    descricao: 0.1
  };
  
  let totalSimilarity = 0;
  let totalWeight = 0;
  
  // Similaridade do nome
  if (product1.nome && product2.nome) {
    const nameSimilarity = calculateSimilarity(
      normalizeText(product1.nome),
      normalizeText(product2.nome)
    );
    totalSimilarity += nameSimilarity * weights.nome;
    totalWeight += weights.nome;
  }
  
  // Similaridade da marca
  if (product1.marca && product2.marca) {
    const brandSimilarity = calculateSimilarity(
      normalizeText(product1.marca),
      normalizeText(product2.marca)
    );
    totalSimilarity += brandSimilarity * weights.marca;
    totalWeight += weights.marca;
  }
  
  // Similaridade da categoria
  if (product1.categoria && product2.categoria) {
    const categorySimilarity = calculateSimilarity(
      normalizeText(product1.categoria),
      normalizeText(product2.categoria)
    );
    totalSimilarity += categorySimilarity * weights.categoria;
    totalWeight += weights.categoria;
  }
  
  // Similaridade do SKU
  if (product1.sku && product2.sku) {
    const skuSimilarity = calculateSimilarity(
      normalizeText(product1.sku),
      normalizeText(product2.sku)
    );
    totalSimilarity += skuSimilarity * weights.sku;
    totalWeight += weights.sku;
  }
  
  // Similaridade da descrição
  if (product1.descricao && product2.descricao) {
    const descSimilarity = calculateSimilarity(
      normalizeText(product1.descricao),
      normalizeText(product2.descricao)
    );
    totalSimilarity += descSimilarity * weights.descricao;
    totalWeight += weights.descricao;
  }
  
  return totalWeight > 0 ? Math.round(totalSimilarity / totalWeight) : 0;
}

export function useProductGrouping(options: UseProductGroupingOptions = {}) {
  const { searchTerm = "", minSimilarity = 70 } = options;
  const { allProducts, isLoading } = useProductsData();
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);

  // Filtragem de produtos
  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];
    
    return allProducts.filter(product => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        product.nome?.toLowerCase().includes(searchLower) ||
        product.marca?.toLowerCase().includes(searchLower) ||
        product.categoria?.toLowerCase().includes(searchLower) ||
        product.sku?.toLowerCase().includes(searchLower) ||
        product.descricao?.toLowerCase().includes(searchLower)
      );
    });
  }, [allProducts, searchTerm]);

  // Agrupamento de produtos
  useEffect(() => {
    if (!filteredProducts.length) {
      setProductGroups([]);
      return;
    }

    const groups: ProductGroup[] = [];
    const processedProducts = new Set<string>();

    filteredProducts.forEach((product, index) => {
      if (processedProducts.has(product.id)) return;

      const similarProducts: Product[] = [product];
      processedProducts.add(product.id);

      // Buscar produtos similares
      for (let i = index + 1; i < filteredProducts.length; i++) {
        const otherProduct = filteredProducts[i];
        
        if (processedProducts.has(otherProduct.id)) continue;

        const similarity = calculateProductSimilarity(product, otherProduct);
        
        if (similarity >= minSimilarity) {
          similarProducts.push(otherProduct);
          processedProducts.add(otherProduct.id);
        }
      }

      // Só criar grupo se tiver mais de um produto similar
      if (similarProducts.length > 1) {
        const groupSimilarity = Math.min(
          ...similarProducts.slice(1).map(p => 
            calculateProductSimilarity(product, p)
          )
        );

        const hasStock = similarProducts.some(p => p.estoque && p.estoque > 0);

        groups.push({
          groupId: `group-${product.id}`,
          groupName: product.nome,
          products: similarProducts.sort((a, b) => {
            // Ordenar por estoque (com estoque primeiro) e depois por SKU
            if (a.estoque && !b.estoque) return -1;
            if (!a.estoque && b.estoque) return 1;
            return a.sku.localeCompare(b.sku);
          }),
          similarity: groupSimilarity,
          hasStock
        });
      }
    });

    // Ordenar grupos por nome
    groups.sort((a, b) => a.groupName.localeCompare(b.groupName));
    
    setProductGroups(groups);
  }, [filteredProducts, minSimilarity]);

  // Estatísticas
  const groupStats: GroupStats = useMemo(() => {
    const totalGroups = productGroups.length;
    const totalProducts = productGroups.reduce((sum, group) => sum + group.products.length, 0);
    const outOfStock = productGroups.filter(group => !group.hasStock).length;
    const withAlternatives = productGroups.filter(group => group.products.length > 1 && group.hasStock).length;

    return {
      totalGroups,
      totalProducts,
      outOfStock,
      withAlternatives
    };
  }, [productGroups]);

  return {
    productGroups,
    isLoading,
    groupStats
  };
}