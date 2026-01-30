import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

// Type-safe wrapper for legacy tables
const legacyDb = supabase as any;

export interface GalleryProduct {
  id: string;
  name: string;
  sku: string;
  imageUrl: string | null;
  imageCount: number;
  lastGenerated: string | null;
  categories: string[];
}

export interface GalleryImage {
  id: string;
  url: string;
  filename: string;
  templateId: string | null;
  templateName: string | null;
  category: string | null;
  uploadedAt: string;
  width: number | null;
  height: number | null;
}

interface UseMarketingGalleryReturn {
  products: GalleryProduct[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  dateFilter: "all" | "7days" | "30days";
  setDateFilter: (filter: "all" | "7days" | "30days") => void;
  filteredProducts: GalleryProduct[];
  totalImages: number;
  fetchProductImages: (productId: string) => Promise<GalleryImage[]>;
  refetch: () => Promise<void>;
}

export function useMarketingGallery(): UseMarketingGalleryReturn {
  const [products, setProducts] = useState<GalleryProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "7days" | "30days">("all");

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Usuário não autenticado");
        return;
      }

      // Buscar todas as imagens hospedadas com product_id
      const { data: images, error: imagesError } = await legacyDb
        .from("hosted_images")
        .select(`
          id,
          product_id,
          template_id,
          uploaded_at,
          url,
          original_filename,
          marketing_templates (
            name,
            category
          )
        `)
        .eq("user_id", user.id)
        .not("product_id", "is", null)
        .order("uploaded_at", { ascending: false });

      if (imagesError) throw imagesError;

      // Buscar produtos relacionados
      const productIds = [...new Set(images?.map(img => img.product_id).filter(Boolean))];
      
      if (productIds.length === 0) {
        setProducts([]);
        return;
      }

      const { data: productsData, error: productsError } = await legacyDb
        .from("produtos")
        .select("id, nome, sku, imagem_original")
        .in("id", productIds);

      if (productsError) throw productsError;

      // Agrupar imagens por produto
      const productMap = new Map<string, GalleryProduct>();

      productsData?.forEach(product => {
        const productImages = images?.filter(img => img.product_id === product.id) || [];
        const categories = [...new Set(
          productImages
            .map(img => (img.marketing_templates as any)?.category)
            .filter(Boolean)
        )];
        
        const lastImage = productImages[0];

        productMap.set(product.id, {
          id: product.id,
          name: product.nome,
          sku: product.sku || '',
          imageUrl: product.imagem_original || null,
          imageCount: productImages.length,
          lastGenerated: lastImage?.uploaded_at || null,
          categories: categories as string[],
        });
      });

      setProducts(Array.from(productMap.values()).sort((a, b) => b.imageCount - a.imageCount));
    } catch (err) {
      console.error("Erro ao buscar galeria:", err);
      setError("Erro ao carregar galeria de marketing");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductImages = async (productId: string): Promise<GalleryImage[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await legacyDb
      .from("hosted_images")
      .select(`
        id,
        url,
        original_filename,
        template_id,
        uploaded_at,
        width,
        height,
        marketing_templates (
          name,
          category
        )
      `)
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar imagens do produto:", error);
      return [];
    }

    return (data || []).map((img: any) => ({
      id: img.id,
      url: img.url,
      filename: img.original_filename || '',
      templateId: img.template_id,
      templateName: img.marketing_templates?.name || null,
      category: img.marketing_templates?.category || "Sem categoria",
      uploadedAt: img.uploaded_at,
      width: img.width,
      height: img.height,
    }));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filtro de busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        p => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query)
      );
    }

    // Filtro de data
    if (dateFilter !== "all") {
      const now = new Date();
      const daysAgo = dateFilter === "7days" ? 7 : 30;
      const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      result = result.filter(p => {
        if (!p.lastGenerated) return false;
        return new Date(p.lastGenerated) >= cutoff;
      });
    }

    return result;
  }, [products, searchQuery, dateFilter]);

  const totalImages = useMemo(() => 
    products.reduce((acc, p) => acc + p.imageCount, 0),
    [products]
  );

  return {
    products,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    dateFilter,
    setDateFilter,
    filteredProducts,
    totalImages,
    fetchProductImages,
    refetch: fetchProducts,
  };
}
