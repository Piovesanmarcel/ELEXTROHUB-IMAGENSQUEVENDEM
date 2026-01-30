import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  X, 
  Download, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight,
  ZoomIn,
  Loader2,
  ImageIcon
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import type { GalleryProduct, GalleryImage } from "@/hooks/useMarketingGallery";

interface ProductGalleryModalProps {
  product: GalleryProduct | null;
  isOpen: boolean;
  onClose: () => void;
  fetchImages: (productId: string) => Promise<GalleryImage[]>;
}

export function ProductGalleryModal({ 
  product, 
  isOpen, 
  onClose, 
  fetchImages 
}: ProductGalleryModalProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    if (isOpen && product) {
      loadImages();
    }
  }, [isOpen, product]);

  const loadImages = async () => {
    if (!product) return;
    setIsLoading(true);
    try {
      const data = await fetchImages(product.id);
      setImages(data);
      setActiveCategory("all");
    } catch (error) {
      console.error("Erro ao carregar imagens:", error);
      toast.error("Erro ao carregar imagens");
    } finally {
      setIsLoading(false);
    }
  };

  const categories = useMemo(() => {
    const cats = [...new Set(images.map(img => img.category || "Sem categoria"))];
    return ["all", ...cats];
  }, [images]);

  const filteredImages = useMemo(() => {
    if (activeCategory === "all") return images;
    return images.filter(img => (img.category || "Sem categoria") === activeCategory);
  }, [images, activeCategory]);

  const handleDownload = async (image: GalleryImage) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = image.filename || `image-${image.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Download iniciado!");
    } catch (error) {
      toast.error("Erro ao baixar imagem");
    }
  };

  const handleDownloadAll = async () => {
    toast.info(`Baixando ${filteredImages.length} imagens...`);
    for (const img of filteredImages) {
      await handleDownload(img);
      await new Promise(r => setTimeout(r, 300));
    }
    toast.success("Downloads concluídos!");
  };

  const navigateImage = (direction: "prev" | "next") => {
    if (!selectedImage) return;
    const currentIndex = filteredImages.findIndex(img => img.id === selectedImage.id);
    const newIndex = direction === "prev" 
      ? (currentIndex - 1 + filteredImages.length) % filteredImages.length
      : (currentIndex + 1) % filteredImages.length;
    setSelectedImage(filteredImages[newIndex]);
  };

  if (!product) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-6 py-4 border-b bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold">{product.name}</DialogTitle>
                <p className="text-sm text-muted-foreground font-mono">SKU: {product.sku}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  <ImageIcon className="w-3.5 h-3.5 mr-1" />
                  {images.length} imagens
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDownloadAll}
                  disabled={filteredImages.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Todas ({filteredImages.length})
                </Button>
              </div>
            </div>
          </DialogHeader>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="px-6 py-2 border-b bg-muted/30">
                <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0">
                  {categories.map(cat => (
                    <TabsTrigger 
                      key={cat} 
                      value={cat}
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-1.5 text-sm"
                    >
                      {cat === "all" ? "Todas" : cat}
                      <Badge variant="outline" className="ml-1.5 text-[10px] px-1 py-0">
                        {cat === "all" ? images.length : images.filter(i => i.category === cat).length}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <ScrollArea className="flex-1">
                <TabsContent value={activeCategory} className="m-0 p-6">
                  {filteredImages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <ImageIcon className="w-12 h-12 mb-4 opacity-30" />
                      <p>Nenhuma imagem nesta categoria</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {filteredImages.map(image => (
                        <div 
                          key={image.id}
                          className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10"
                          onClick={() => setSelectedImage(image)}
                        >
                          <img
                            src={image.url}
                            alt={image.filename}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-2">
                              <p className="text-white text-[10px] truncate">{image.templateName}</p>
                              <p className="text-white/70 text-[9px]">
                                {format(new Date(image.uploadedAt), "dd/MM HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                            <div className="absolute top-2 right-2 flex gap-1">
                              <button 
                                className="p-1.5 bg-white/20 rounded-full hover:bg-white/40 transition-colors"
                                onClick={(e) => { e.stopPropagation(); handleDownload(image); }}
                              >
                                <Download className="w-3.5 h-3.5 text-white" />
                              </button>
                              <button 
                                className="p-1.5 bg-white/20 rounded-full hover:bg-white/40 transition-colors"
                                onClick={(e) => { e.stopPropagation(); window.open(image.url, "_blank"); }}
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-white" />
                              </button>
                            </div>
                          </div>
                          <ZoomIn className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-white opacity-0 group-hover:opacity-70 transition-opacity pointer-events-none" />
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Lightbox para zoom - renderizado via portal para evitar conflito com Dialog */}
      {selectedImage && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedImage(null);
          }}
        >
          <button 
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(null);
            }}
          >
            <X className="w-8 h-8" />
          </button>

          <button 
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            onClick={(e) => { e.stopPropagation(); navigateImage("prev"); }}
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          <button 
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            onClick={(e) => { e.stopPropagation(); navigateImage("next"); }}
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          <div className="max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <img
              src={selectedImage.url}
              alt={selectedImage.filename}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-4 text-center text-white">
              <p className="font-medium">{selectedImage.templateName || "Sem template"}</p>
              <p className="text-white/60 text-sm">
                {format(new Date(selectedImage.uploadedAt), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
                {selectedImage.width && selectedImage.height && (
                  <span className="ml-2">• {selectedImage.width}x{selectedImage.height}px</span>
                )}
              </p>
              <div className="flex justify-center gap-2 mt-3">
                <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); handleDownload(selectedImage); }}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); window.open(selectedImage.url, "_blank"); }}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
