
import { useMemo } from "react";
import { Product } from "@/lib/supabase";

export function useProductsStats(products: Product[], qualityResults?: Map<string, any>) {
  const stats = useMemo(() => {
    const total = products.length;
    const lowStock = products.filter(p => (p.estoque || 0) > 0 && (p.estoque || 0) < 10).length;
    const outOfStock = products.filter(p => (p.estoque || 0) === 0).length;
    const inStock = products.filter(p => (p.estoque || 0) >= 10).length;

    let fewImages = 0;
    let smallImages = 0;
    let poorQualityImages = 0;
    let noImages = 0;

    if (qualityResults) {
      for (const product of products) {
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

        if (imageUrls.length === 0) {
          noImages++;
        } else if (imageUrls.length < 3) {
          fewImages++;
        }

        if (qualityData?.hasSmallImages) {
          smallImages++;
        }

        if (qualityData?.hasPoorQuality) {
          poorQualityImages++;
        }
      }
    } else {
      // Fallback calculation when qualityResults is not available
      for (const product of products) {
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

        if (imageUrls.length === 0) {
          noImages++;
        } else if (imageUrls.length < 3) {
          fewImages++;
        }
      }
    }

    return {
      total,
      lowStock,
      outOfStock,
      inStock,
      fewImages,
      smallImages,
      poorQualityImages,
      noImages,
    };
  }, [products, qualityResults]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      products
        .map(p => p.categoria)
        .filter(Boolean)
        .filter(cat => cat !== "N/A")
    );
    return Array.from(uniqueCategories).sort();
  }, [products]);

  const brands = useMemo(() => {
    // Marcas prioritárias na ordem especificada
    const priorityBrands = [
      '3Cliques',
      'FullComemerce', 
      'FullComerce',
      'GlobalUP',
      'ObaOba Mix',
      'SDBrasil',
      'Utimix b2b',
      'Utimix DNJ'
    ];
    
    const uniqueBrands = new Set(
      products
        .map(p => p.marca)
        .filter(Boolean)
        .filter(brand => brand !== "N/A")
    );
    
    const brandsArray = Array.from(uniqueBrands);
    
    // Separar em prioritárias e outras
    const priority = brandsArray
      .filter(b => priorityBrands.includes(b))
      .sort((a, b) => priorityBrands.indexOf(a) - priorityBrands.indexOf(b));
    
    const others = brandsArray
      .filter(b => !priorityBrands.includes(b))
      .sort();
    
    // Retornar prioritárias primeiro, depois as outras
    return [...priority, ...others];
  }, [products]);

  return { stats, categories, brands };
}
