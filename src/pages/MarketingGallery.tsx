import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  ImageIcon, 
  Package, 
  Sparkles, 
  Calendar,
  RefreshCw
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMarketingGallery, type GalleryProduct } from "@/hooks/useMarketingGallery";
import { ProductGalleryCard } from "@/components/gallery/ProductGalleryCard";
import { ProductGalleryModal } from "@/components/gallery/ProductGalleryModal";

export default function MarketingGallery() {
  const {
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    dateFilter,
    setDateFilter,
    filteredProducts,
    totalImages,
    fetchProductImages,
    refetch,
    products,
  } = useMarketingGallery();

  const [selectedProduct, setSelectedProduct] = useState<GalleryProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    document.title = "Galeria de Marketing | AI Marketing Hub";
  }, []);

  const handleProductClick = (product: GalleryProduct) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-primary to-primary/60 rounded-xl">
                  <Sparkles className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Galeria de Marketing
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Todas as imagens geradas por IA, organizadas por produto
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
                <Package className="w-4 h-4 text-primary" />
                <span className="font-semibold">{products.length}</span>
                <span className="text-muted-foreground text-sm">produtos</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
                <ImageIcon className="w-4 h-4 text-primary" />
                <span className="font-semibold">{totalImages}</span>
                <span className="text-muted-foreground text-sm">imagens</span>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>

            <Select value={dateFilter} onValueChange={(v: "all" | "7days" | "30days") => setDateFilter(v)}>
              <SelectTrigger className="w-[180px] bg-background">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os períodos</SelectItem>
                <SelectItem value="7days">Últimos 7 dias</SelectItem>
                <SelectItem value="30days">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={refetch} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="p-6 bg-muted/30 rounded-full mb-6">
              <ImageIcon className="w-16 h-16 opacity-30" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-center max-w-md">
              {searchQuery 
                ? `Não encontramos produtos com "${searchQuery}". Tente outro termo.`
                : "Você ainda não tem imagens de marketing geradas. Acesse um produto e gere suas primeiras imagens!"
              }
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                Mostrando <span className="font-semibold text-foreground">{filteredProducts.length}</span> produtos
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredProducts.map((product) => (
                <ProductGalleryCard
                  key={product.id}
                  product={product}
                  onClick={() => handleProductClick(product)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      <ProductGalleryModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        fetchImages={fetchProductImages}
      />
    </div>
  );
}
