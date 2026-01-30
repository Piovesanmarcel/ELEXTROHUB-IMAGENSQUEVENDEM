
import { Button } from "@/components/ui/button";
import { RefreshCw, Zap, Scissors, Archive } from "lucide-react";
import { UploadedImage, ProcessedImage } from "@/pages/BulkImageEnhancement";

interface BulkProcessingActionsProps {
  isProcessing: boolean;
  images: UploadedImage[];
  processedImages: ProcessedImage[];
  processingType: 'enhance' | 'background';
  usage: any;
  onProcessImages: () => void;
  onDownloadResults: () => void;
}

export const BulkProcessingActions = ({
  isProcessing,
  images,
  processedImages,
  processingType,
  usage,
  onProcessImages,
  onDownloadResults
}: BulkProcessingActionsProps) => {
  const completedCount = processedImages.filter(img => img.status === 'completed').length;

  const isProcessButtonDisabled = 
    isProcessing || 
    images.length === 0 || 
    (processingType === 'enhance' && usage && usage.enhancements_available < images.length);

  return (
    <div className="flex gap-3">
      <Button
        onClick={onProcessImages}
        disabled={isProcessButtonDisabled}
        className={`flex-1 ${
          processingType === 'enhance'
            ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
        } text-white`}
      >
        {isProcessing ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            {processingType === 'enhance' ? (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Melhorar {images.length} Imagem(ns)
              </>
            ) : (
              <>
                <Scissors className="h-4 w-4 mr-2" />
                Remover Fundo de {images.length} Imagem(ns)
              </>
            )}
          </>
        )}
      </Button>

      {completedCount > 0 && (
        <Button
          onClick={onDownloadResults}
          variant="outline"
          className="text-green-600 border-green-300 hover:bg-green-50"
        >
          <Archive className="h-4 w-4 mr-2" />
          Baixar {completedCount} Resultado(s)
        </Button>
      )}
    </div>
  );
};
