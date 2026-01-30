
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { Product } from "@/lib/supabase";
import { downloadAllProductImages } from "@/utils/downloadUtils";
import { toast } from "sonner";

interface DownloadCurrentPageButtonProps {
  products: Product[];
  currentPage: number;
}

export const DownloadCurrentPageButton = ({ products, currentPage }: DownloadCurrentPageButtonProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    console.log(`🔍 Iniciando download - Página: ${currentPage}`);
    console.log(`📦 Total de produtos recebidos: ${products.length}`);
    
    if (products.length === 0) {
      toast.error("Nenhum produto encontrado na página atual");
      return;
    }

    // Filtrar e validar produtos com imagens válidas
    const productsWithImages = products.filter(product => {
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
      ].filter(url => {
        // Validação mais rigorosa das URLs de imagem
        if (!url || typeof url !== 'string') return false;
        const trimmedUrl = url.trim();
        if (trimmedUrl === '') return false;
        
        // Verificar se é uma URL válida
        try {
          new URL(trimmedUrl);
          return /\.(jpg|jpeg|png|webp|gif|bmp|svg)(\?.*)?$/i.test(trimmedUrl);
        } catch {
          return false;
        }
      });
      
      return imageUrls.length > 0;
    });

    console.log(`🖼️ Produtos com imagens válidas: ${productsWithImages.length}`);

    if (productsWithImages.length === 0) {
      toast.error("Nenhum produto da página atual possui imagens válidas para download");
      return;
    }

    // Contar total de imagens para informar ao usuário
    const totalImages = productsWithImages.reduce((count, product) => {
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
      ].filter(url => {
        if (!url || typeof url !== 'string') return false;
        const trimmedUrl = url.trim();
        if (trimmedUrl === '') return false;
        try {
          new URL(trimmedUrl);
          return /\.(jpg|jpeg|png|webp|gif|bmp|svg)(\?.*)?$/i.test(trimmedUrl);
        } catch {
          return false;
        }
      });
      return count + imageUrls.length;
    }, 0);

    console.log(`📊 Total de imagens para download: ${totalImages}`);

    setIsDownloading(true);
    
    try {
      if (totalImages > 20) {
        const batches = Math.ceil(totalImages / 20);
        toast.info(`Processando ${totalImages} imagens em ${batches} lotes de até 20 imagens cada. Isso pode levar alguns minutos...`);
      } else {
        toast.info(`Iniciando download de ${totalImages} imagens de ${productsWithImages.length} produtos da página ${currentPage}...`);
      }
      
      await downloadAllProductImages(productsWithImages);
      
      toast.success(`Download concluído! ${productsWithImages.length} produtos da página ${currentPage} processados com ${totalImages} imagens.`);
    } catch (error) {
      console.error("❌ Erro detalhado no download:", error);
      
      let errorMessage = "Erro ao fazer download das imagens";
      
      if (error instanceof Error) {
        if (error.message.includes('Timeout')) {
          errorMessage = "Timeout no download - tente novamente em alguns minutos";
        } else if (error.message.includes('fetch')) {
          errorMessage = "Erro de conexão - verifique sua internet";
        } else if (error.message.includes('Nenhuma imagem')) {
          errorMessage = "Nenhuma imagem foi baixada com sucesso";
        } else {
          errorMessage = `Erro: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isDownloading || products.length === 0}
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
          Baixar Imagens da Página {currentPage} ({products.length} produtos)
        </>
      )}
    </Button>
  );
};
