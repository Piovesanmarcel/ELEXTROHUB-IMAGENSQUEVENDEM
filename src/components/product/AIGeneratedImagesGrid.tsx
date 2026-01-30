import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Eye, Download, Sparkles } from "lucide-react";
import { ImageGalleryModal } from "./ImageGalleryModal";
import { downloadAllProductImages } from "@/utils/downloadUtils";
import { ImageGridItem } from "./ImageGridItem";
import { toast } from "sonner";

interface AIGeneratedImagesGridProps {
  images: string[];
  aiName: string;
  productName: string;
  productId: string;
  className?: string;
}

export const AIGeneratedImagesGrid = ({ 
  images, 
  aiName, 
  productName, 
  productId,
  className = ""
}: AIGeneratedImagesGridProps) => {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const openGallery = (index: number = 0) => {
    setSelectedImageIndex(index);
    setIsGalleryOpen(true);
  };

  const handleDownloadImages = async () => {
    if (images.length === 0) {
      toast.error("Nenhuma imagem disponível para download");
      return;
    }

    setIsDownloading(true);
    
    try {
      // Criar um produto mock com as imagens para o download
      const mockProduct = {
        id: `${productId}-${aiName.toLowerCase().replace(/\s+/g, '-')}`,
        nome: `${productName} - ${aiName}`,
        sku: `${productId}-AI-${aiName}`,
        imagem_url: images[0] || null,
        imagem_url_2: images[1] || null,
        imagem_url_3: images[2] || null,
        imagem_url_4: images[3] || null,
        imagem_url_5: images[4] || null,
        imagem_url_6: images[5] || null,
        imagem_url_7: images[6] || null,
        imagem_url_8: images[7] || null,
        imagem_url_9: images[8] || null,
        imagem_url_10: images[9] || null,
      } as any;

      toast.info(`Iniciando download de ${images.length} imagens geradas por ${aiName}...`);
      
      await downloadAllProductImages([mockProduct]);
      
      toast.success(`Download concluído! ${images.length} imagens do ${aiName} foram baixadas.`);
    } catch (error) {
      console.error("Erro no download:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(`Erro ao fazer download das imagens: ${errorMessage}`);
    } finally {
      setIsDownloading(false);
    }
  };

  if (images.length === 0) {
    return (
      <Card className={`glass-effect ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Imagens Geradas - {aiName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center border">
            <div className="text-center text-purple-400">
              <ImageIcon className="h-16 w-16 mx-auto mb-2" />
              <p className="text-sm">Nenhuma imagem gerada ainda</p>
              <p className="text-xs text-muted-foreground mt-1">Use o {aiName} para gerar imagens</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={`glass-effect shadow-lg ${className}`}>
        <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
          <CardTitle className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
              <span className="text-xl font-bold gradient-text">
                Imagens Geradas - {aiName}
              </span>
              <Badge variant="outline" className="text-purple-600 border-purple-300 bg-purple-50">
                {images.length} imagem(ns)
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleDownloadImages}
                disabled={isDownloading}
                variant="outline"
                className="text-green-600 border-green-300 hover:bg-green-50"
              >
                {isDownloading ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Baixando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Imagens
                  </>
                )}
              </Button>
              <Button
                size="sm"
                onClick={() => openGallery(0)}
                className="gradient-primary"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Galeria Completa
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {images.map((imageUrl, index) => (
              <ImageGridItem
                key={`${aiName}-${imageUrl}-${index}`}
                imageUrl={imageUrl}
                index={index}
                productName={`${productName} - ${aiName}`}
                productId={productId}
                onClick={() => openGallery(index)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal da Galeria */}
      <ImageGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        images={images}
        productName={`${productName} - ${aiName}`}
        initialIndex={selectedImageIndex}
      />
    </>
  );
};