
import { Badge } from "@/components/ui/badge";
import { ProcessedImage } from "@/pages/BulkImageEnhancement";

interface BulkProcessingStatsProps {
  processedImages: ProcessedImage[];
  totalImages: number;
}

export const BulkProcessingStats = ({
  processedImages,
  totalImages
}: BulkProcessingStatsProps) => {
  const completedCount = processedImages.filter(img => img.status === 'completed').length;
  const errorCount = processedImages.filter(img => img.status === 'error').length;

  return (
    <div className="flex gap-4">
      <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
        ✓ {completedCount} Concluídas
      </Badge>
      {errorCount > 0 && (
        <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">
          ✗ {errorCount} Erros
        </Badge>
      )}
      <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">
        📁 {totalImages} Total
      </Badge>
    </div>
  );
};
