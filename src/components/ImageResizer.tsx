
import { safeDownload } from "@/utils/safeDownload";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, Wand2, Upload, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface ImageResizerProps {
  productId: string;
  productName: string;
  images: string[];
  lowResImages: string[];
  onImagesUpdated: () => void;
}

const resizeImageToSquare = (imageUrl: string, targetSize: number = 1000): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      // Set canvas size to target square dimensions
      canvas.width = targetSize;
      canvas.height = targetSize;
      
      // Calculate scaling to fit image within square maintaining aspect ratio
      const scale = Math.min(targetSize / img.width, targetSize / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      
      // Center the image
      const x = (targetSize - scaledWidth) / 2;
      const y = (targetSize - scaledHeight) / 2;
      
      // Fill background with white
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetSize, targetSize);
      
      // Draw the scaled image
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      
      // Convert to base64
      const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      resolve(resizedDataUrl);
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${imageUrl}`));
    };
    
    img.src = imageUrl;
  });
};

export const ImageResizer = ({ 
  productId, 
  productName, 
  images, 
  lowResImages, 
  onImagesUpdated 
}: ImageResizerProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);

  const handleResizeImages = async () => {
    if (lowResImages.length === 0) {
      toast.info("Não há imagens com baixa resolução para redimensionar");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setProcessedCount(0);

    try {
      const resizedImages: string[] = [];
      
      toast.info(`Iniciando redimensionamento de ${lowResImages.length} imagem(ns)...`);
      
      for (let i = 0; i < lowResImages.length; i++) {
        const imageUrl = lowResImages[i];
        
        try {
          console.log(`Redimensionando imagem ${i + 1}/${lowResImages.length}:`, imageUrl);
          
          const resizedImage = await resizeImageToSquare(imageUrl, 1000);
          resizedImages.push(resizedImage);
          
          setProcessedCount(i + 1);
          const newProgress = ((i + 1) / lowResImages.length) * 100;
          setProgress(newProgress);
          
          toast.info(`Imagem ${i + 1} de ${lowResImages.length} processada`);
          
        } catch (error) {
          console.error(`Erro ao redimensionar imagem ${i + 1}:`, error);
          toast.error(`Erro ao redimensionar imagem ${i + 1}: ${error.message}`);
        }
      }

      if (resizedImages.length > 0) {
        toast.success(`${resizedImages.length} imagem(ns) redimensionada(s) com sucesso para 1000x1000px!`);
        
        // Create download links for the resized images
        resizedImages.forEach((dataUrl, index) => {
          const fileName = `${productName.replace(/\s+/g, '_')}_redimensionada_${index + 1}.jpg`;
          safeDownload(dataUrl, fileName);
        });
        
        toast.info("Downloads das imagens redimensionadas iniciados. Você pode fazer upload manual dessas imagens no Bling.");
      } else {
        toast.error("Nenhuma imagem foi redimensionada com sucesso");
      }
      
    } catch (error) {
      console.error('Erro no processo de redimensionamento:', error);
      toast.error("Erro ao redimensionar imagens");
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        setProgress(0);
        setProcessedCount(0);
      }, 3000);
    }
  };

  if (lowResImages.length === 0) {
    return (
      <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
        <Check className="h-4 w-4" />
        <span className="text-sm font-medium">
          Todas as imagens têm resolução adequada (≥1000x1000px)
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <span className="font-medium text-yellow-700">
            {lowResImages.length} imagem(ns) com baixa resolução detectada(s)
          </span>
        </div>
        <Badge variant="outline" className="text-yellow-600 border-yellow-200">
          {lowResImages.length} de {images.length} imagens
        </Badge>
      </div>

      {isProcessing && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Processando imagens...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="text-sm text-muted-foreground">
            {processedCount} de {lowResImages.length} imagem(ns) processada(s)
          </div>
        </div>
      )}

      <Button 
        onClick={handleResizeImages}
        disabled={isProcessing}
        className="w-full gradient-primary"
      >
        {isProcessing ? (
          <>
            <Wand2 className="h-4 w-4 mr-2 animate-spin" />
            Redimensionando...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Redimensionar para 1000x1000px
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground">
        As imagens serão redimensionadas mantendo a proporção, preenchendo com fundo branco quando necessário.
        Os arquivos redimensionados serão baixados automaticamente para que você possa fazer upload manual no Bling.
      </p>
    </div>
  );
};
