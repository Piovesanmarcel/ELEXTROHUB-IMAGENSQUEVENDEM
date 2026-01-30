
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { Product } from "@/lib/supabase";
import { downloadAllProductImages } from "@/utils/downloadUtils";
import { toast } from "sonner";

interface DownloadImagesButtonProps {
  selectedProducts: Product[];
  disabled?: boolean;
}

export const DownloadImagesButton = ({ selectedProducts, disabled = false }: DownloadImagesButtonProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (selectedProducts.length === 0) {
      toast.error("Nenhum produto selecionado para download");
      return;
    }

    // Filtrar produtos que têm pelo menos uma imagem
    const productsWithImages = selectedProducts.filter(product => {
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
      
      return imageUrls.length > 0;
    });

    if (productsWithImages.length === 0) {
      toast.error("Nenhum produto selecionado possui imagens para download");
      return;
    }

    setIsDownloading(true);
    
    try {
      toast.info(`Iniciando download de imagens de ${productsWithImages.length} produtos da página atual...`);
      
      await downloadAllProductImages(productsWithImages);
      
      toast.success(`Download concluído! ${productsWithImages.length} produtos processados da página atual.`);
    } catch (error) {
      console.error("Erro no download:", error);
      toast.error("Erro ao fazer download das imagens. Tente novamente.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={disabled || isDownloading || selectedProducts.length === 0}
      className="gradient-primary"
      size="sm"
    >
      {isDownloading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Baixando...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Baixar Imagens da Página ({selectedProducts.length})
        </>
      )}
    </Button>
  );
};
