
import { safeBlobDownload } from "@/utils/safeDownload";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface DownloadImageButtonProps {
  imageUrl: string;
  fileName: string;
  className?: string;
  onDownload?: () => Promise<void>;
}

export const DownloadImageButton = ({ 
  imageUrl, 
  fileName, 
  className,
  onDownload 
}: DownloadImageButtonProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadImage = async () => {
    if (onDownload) {
      try {
        setIsDownloading(true);
        await onDownload();
      } catch (error) {
        console.error("Erro ao baixar imagem:", error);
        toast.error("Erro ao baixar a imagem");
      } finally {
        setIsDownloading(false);
      }
      return;
    }

    try {
      setIsDownloading(true);
      
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const downloadFileName = `${fileName}.png`;
      
      await safeBlobDownload(blob, downloadFileName);
      
      toast.success("Imagem baixada com sucesso!");
    } catch (error) {
      console.error("Erro ao baixar imagem:", error);
      toast.error("Erro ao baixar a imagem");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={downloadImage}
      disabled={isDownloading}
      className={className}
      size="sm"
    >
      <Download className="h-4 w-4 mr-2" />
      {isDownloading ? "Baixando..." : "Baixar Imagem"}
    </Button>
  );
};
