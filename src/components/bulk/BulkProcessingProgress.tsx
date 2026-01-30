
import { Progress } from "@/components/ui/progress";
import { RefreshCw } from "lucide-react";

interface BulkProcessingProgressProps {
  isProcessing: boolean;
  currentImageIndex: number;
  totalImages: number;
  progress: number;
}

export const BulkProcessingProgress = ({
  isProcessing,
  currentImageIndex,
  totalImages,
  progress
}: BulkProcessingProgressProps) => {
  if (!isProcessing) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Processando imagem {currentImageIndex} de {totalImages}
        </span>
        <span>{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};
