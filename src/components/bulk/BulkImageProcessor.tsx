
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Scissors } from "lucide-react";
import { UploadedImage, ProcessedImage } from "@/pages/BulkImageEnhancement";
import { EnhancementUsageDisplay } from "@/components/enhancement/EnhancementUsageDisplay";
import { useBulkImageProcessor } from "@/hooks/useBulkImageProcessor";
import { useBulkDownloadManager } from "./BulkDownloadManager";
import { BulkProcessingProgress } from "./BulkProcessingProgress";
import { BulkProcessingStats } from "./BulkProcessingStats";
import { BulkProcessingErrorAlert } from "./BulkProcessingErrorAlert";
import { BulkProcessingActions } from "./BulkProcessingActions";
import { BulkProcessingInfo } from "./BulkProcessingInfo";

interface BulkImageProcessorProps {
  images: UploadedImage[];
  processedImages: ProcessedImage[];
  onProcessedImagesUpdate: (images: ProcessedImage[]) => void;
  processingType: 'enhance' | 'background';
  isProcessing: boolean;
  onProcessingChange: (processing: boolean) => void;
}

export const BulkImageProcessor = ({
  images,
  processedImages,
  onProcessedImagesUpdate,
  processingType,
  isProcessing,
  onProcessingChange
}: BulkImageProcessorProps) => {
  const {
    progress,
    currentImageIndex,
    usage,
    isUsageLoading,
    handleBulkProcess
  } = useBulkImageProcessor();

  const { downloadAllResults } = useBulkDownloadManager();

  const handleProcessImages = () => {
    handleBulkProcess(
      images,
      processedImages,
      onProcessedImagesUpdate,
      processingType,
      onProcessingChange
    );
  };

  const handleDownloadResults = () => {
    downloadAllResults(processedImages, images, processingType);
  };

  return (
    <Card className="glass-effect shadow-lg">
      <CardHeader className={`border-b ${
        processingType === 'enhance' 
          ? 'bg-gradient-to-r from-purple-50 to-blue-50' 
          : 'bg-gradient-to-r from-blue-50 to-indigo-50'
      }`}>
        <CardTitle className="flex items-center gap-2">
          {processingType === 'enhance' ? (
            <>
              <Zap className="h-6 w-6 text-purple-600" />
              <span className="text-xl font-bold gradient-text">Processamento DeepAI</span>
            </>
          ) : (
            <>
              <Scissors className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold gradient-text">Remoção de Fundo</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Display de uso de créditos para melhorias */}
          {processingType === 'enhance' && usage && (
            <EnhancementUsageDisplay
              enhancements_used={usage.enhancements_used}
              enhancements_available={usage.enhancements_available}
              isLoading={isUsageLoading}
            />
          )}

          {/* Progress */}
          <BulkProcessingProgress
            isProcessing={isProcessing}
            currentImageIndex={currentImageIndex}
            totalImages={images.length}
            progress={progress}
          />

          {/* Stats */}
          <BulkProcessingStats
            processedImages={processedImages}
            totalImages={images.length}
          />

          {/* Error Alert */}
          <BulkProcessingErrorAlert
            processedImages={processedImages}
            isProcessing={isProcessing}
          />

          {/* Action Buttons */}
          <BulkProcessingActions
            isProcessing={isProcessing}
            images={images}
            processedImages={processedImages}
            processingType={processingType}
            usage={usage}
            onProcessImages={handleProcessImages}
            onDownloadResults={handleDownloadResults}
          />

          {/* Info */}
          <BulkProcessingInfo processingType={processingType} />
        </div>
      </CardContent>
    </Card>
  );
};
