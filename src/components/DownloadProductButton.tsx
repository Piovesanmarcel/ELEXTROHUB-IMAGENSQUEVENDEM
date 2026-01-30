
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { Product } from "@/lib/supabase";
import { downloadAllProductImages } from "@/utils/downloadUtils";
import { toast } from "sonner";

interface DownloadProductButtonProps {
  product: Product;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary" | "ghost";
}

export const DownloadProductButton = ({ 
  product, 
  size = "sm", 
  variant = "outline" 
}: DownloadProductButtonProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    console.log(`🔍 Iniciando download individual - Produto: ${product.sku}`);
    
    // Verificar se o produto tem pelo menos uma imagem
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
      toast.error("Este produto não possui imagens para download");
      return;
    }

    console.log(`🖼️ Produto ${product.sku} tem ${imageUrls.length} imagens`);

    setIsDownloading(true);
    
    try {
      toast.info(`Iniciando download de ${imageUrls.length} imagens do produto ${product.sku}...`);
      
      await downloadAllProductImages([product]);
      
      toast.success(`Download concluído! ${imageUrls.length} imagens do produto ${product.sku} foram baixadas.`);
    } catch (error) {
      console.error("Erro no download:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(`Erro ao fazer download das imagens: ${errorMessage}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const imageCount = [
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
  ].filter(Boolean).length;

  if (imageCount === 0) {
    return null; // Não mostrar o botão se não há imagens
  }

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleDownload}
      disabled={isDownloading}
      title={`Baixar ${imageCount} imagem(ns) do produto ${product.sku}`}
      className="shrink-0"
    >
      {isDownloading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
    </Button>
  );
};
