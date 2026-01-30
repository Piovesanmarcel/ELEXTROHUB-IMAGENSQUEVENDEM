
import { useMemo } from "react";
import { Product } from "@/lib/supabase";

interface FilterOptions {
  searchQuery: string;
  filterStatus: "all" | "low" | "empty" | "instock";
  filterCategories: string[];
  filterBrands: string[];
  priceRange: string;
  imageFilter: "all" | "few" | "small" | "poorQuality" | "none";
  enhancementFilter: "all" | "enhanced" | "not_enhanced";
  unifiedCommandsFilter: "all" | "with_commands" | "without_commands";
  hostedImagesFilter: "all" | "with_hosted";
  readyForAdsFilter: "all" | "ready";
}

// Extended Product type that includes enhanced_at and ready_for_ads
interface ExtendedProduct extends Product {
  enhanced_at?: string | null;
  ready_for_ads?: boolean | null;
}

export function useProductsFiltering(
  allProducts: Product[],
  filters: FilterOptions,
  qualityResults?: Map<string, any>,
  productsWithCommands?: Set<string>,
  hostedImagesCount?: { [productId: string]: number }
) {
  const { filteredProducts, filteredCount } = useMemo(() => {
    console.log(`🔍 FILTRAGEM INICIANDO COM ${allProducts.length} PRODUTOS TOTAIS`);
    console.log(`🔍 FILTROS ATIVOS:`, {
      searchQuery: filters.searchQuery ? `"${filters.searchQuery}"` : 'NENHUM',
      filterStatus: filters.filterStatus,
      filterCategories: filters.filterCategories.length > 0 ? filters.filterCategories : 'NENHUM',
      filterBrands: filters.filterBrands.length > 0 ? filters.filterBrands : 'NENHUM',
      priceRange: filters.priceRange,
      imageFilter: filters.imageFilter,
      enhancementFilter: filters.enhancementFilter,
      unifiedCommandsFilter: filters.unifiedCommandsFilter,
      hostedImagesFilter: filters.hostedImagesFilter,
      readyForAdsFilter: filters.readyForAdsFilter
    });
    
    if (allProducts.length === 0) {
      console.log(`🔍 ❌ NENHUM PRODUTO PARA FILTRAR`);
      return { filteredProducts: [], filteredCount: 0 };
    }
    
    // MANTER ORDEM ORIGINAL - apenas filtrar
    let filtered = [...allProducts] as ExtendedProduct[];
    let originalCount = filtered.length;

    // SEMPRE ocultar variações - mostrar apenas produtos pai (variavel) e simples
    const beforeGrouping = filtered.length;
    filtered = filtered.filter(product => product.tipo_produto !== 'variacao');
    if (beforeGrouping !== filtered.length) {
      console.log(`🔗 Agrupamento: ${beforeGrouping} → ${filtered.length} produtos (${beforeGrouping - filtered.length} variações ocultas)`);
    }

    // Search filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      const beforeSearch = filtered.length;
      filtered = filtered.filter(product =>
        product.nome?.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query) ||
        product.categoria?.toLowerCase().includes(query) ||
        product.marca?.toLowerCase().includes(query)
      );
      console.log(`🔍 🔎 Filtro BUSCA: ${beforeSearch} → ${filtered.length} produtos`);
    }

    // Stock status filter
    if (filters.filterStatus !== "all") {
      const beforeStock = filtered.length;
      filtered = filtered.filter(product => {
        const stock = product.estoque || 0;
        switch (filters.filterStatus) {
          case "empty":
            return stock === 0;
          case "low":
            return stock > 0 && stock < 10;
          case "instock":
            return stock >= 10;
          default:
            return true;
        }
      });
      console.log(`🔍 📦 Filtro ESTOQUE: ${beforeStock} → ${filtered.length} produtos`);
    }

    // Category filter
    if (filters.filterCategories.length > 0) {
      const beforeCategory = filtered.length;
      filtered = filtered.filter(product =>
        product.categoria && filters.filterCategories.includes(product.categoria)
      );
      console.log(`🔍 🏷️ Filtro CATEGORIA: ${beforeCategory} → ${filtered.length} produtos`);
    }

    // Brand filter
    if (filters.filterBrands.length > 0) {
      const beforeBrand = filtered.length;
      filtered = filtered.filter(product =>
        product.marca && filters.filterBrands.includes(product.marca)
      );
      console.log(`🔍 🏭 Filtro MARCA: ${beforeBrand} → ${filtered.length} produtos`);
    }

    // Price range filter
    if (filters.priceRange !== "all") {
      const beforePrice = filtered.length;
      filtered = filtered.filter(product => {
        const price = product.preco || 0;
        switch (filters.priceRange) {
          case "0-50":
            return price >= 0 && price <= 50;
          case "51-100":
            return price >= 51 && price <= 100;
          case "101-200":
            return price >= 101 && price <= 200;
          case "201+":
            return price >= 201;
          default:
            return true;
        }
      });
      console.log(`🔍 💰 Filtro PREÇO: ${beforePrice} → ${filtered.length} produtos`);
    }

    // Image filter
    if (filters.imageFilter !== "all" && qualityResults) {
      const beforeImage = filtered.length;
      filtered = filtered.filter(product => {
        const imageUrls = [
          product.imagem_url,
          product.imagem_url_2,
          product.imagem_url_3,
          product.imagem_url_4,
          product.imagem_url_5,
          product.imagem_url_6,
          product.imagem_url_7,
          product.imagem_url_8,
          product.imagem_url_9,
          product.imagem_url_10,
        ].filter(Boolean);

        const qualityData = qualityResults.get(product.id);

        switch (filters.imageFilter) {
          case "none":
            return imageUrls.length === 0;
          case "few":
            return imageUrls.length > 0 && imageUrls.length < 3;
          case "small":
            return qualityData?.hasSmallImages || false;
          case "poorQuality":
            return qualityData?.hasPoorQuality || false;
          default:
            return true;
        }
      });
      console.log(`🔍 🖼️ Filtro IMAGEM: ${beforeImage} → ${filtered.length} produtos`);
    }

    // Enhancement filter
    if (filters.enhancementFilter !== "all") {
      const beforeEnhancement = filtered.length;
      filtered = filtered.filter(product => {
        const isEnhanced = Boolean((product as any).enhanced_at);
        return filters.enhancementFilter === "enhanced" ? isEnhanced : !isEnhanced;
      });
      console.log(`🔍 ✨ Filtro ENHANCEMENT: ${beforeEnhancement} → ${filtered.length} produtos`);
    }

    // Unified commands filter
    if (filters.unifiedCommandsFilter !== "all" && productsWithCommands) {
      const beforeCommands = filtered.length;
      filtered = filtered.filter(product => {
        const hasCommands = productsWithCommands.has(product.id);
        return filters.unifiedCommandsFilter === "with_commands" ? hasCommands : !hasCommands;
      });
      console.log(`🔍 🤖 Filtro COMANDOS: ${beforeCommands} → ${filtered.length} produtos`);
    }

    // Hosted images filter
    if (filters.hostedImagesFilter === "with_hosted" && hostedImagesCount) {
      const beforeHosted = filtered.length;
      filtered = filtered.filter(product => {
        const count = hostedImagesCount[product.id] || 0;
        return count > 30;
      });
      console.log(`🔍 🖼️ Filtro IMAGENS HOSPEDADAS (>30): ${beforeHosted} → ${filtered.length} produtos`);
    }

    // Ready for ads filter
    if (filters.readyForAdsFilter === "ready") {
      const beforeReady = filtered.length;
      filtered = filtered.filter(product => product.ready_for_ads === true);
      console.log(`🔍 ✅ Filtro PRONTO PARA ANÚNCIOS: ${beforeReady} → ${filtered.length} produtos`);
    }

    console.log(`🔍 ✅ FILTRAGEM FINALIZADA:`);
    console.log(`    Original: ${originalCount} produtos`);
    console.log(`    Filtrados: ${filtered.length} produtos`);
    console.log(`    📊 RETORNANDO ${filtered.length} PRODUTOS FILTRADOS`);

    return {
      filteredProducts: filtered,
      filteredCount: filtered.length
    };
  }, [allProducts, filters, qualityResults, productsWithCommands, hostedImagesCount]);

  return { filteredProducts, filteredCount };
}
