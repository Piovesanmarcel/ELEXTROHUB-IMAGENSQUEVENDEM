
import { AlertTriangle } from "lucide-react";
import { ProcessedImage } from "@/pages/BulkImageEnhancement";

interface BulkProcessingErrorAlertProps {
  processedImages: ProcessedImage[];
  isProcessing: boolean;
}

export const BulkProcessingErrorAlert = ({
  processedImages,
  isProcessing
}: BulkProcessingErrorAlertProps) => {
  const errorCount = processedImages.filter(img => img.status === 'error').length;

  if (errorCount === 0 || isProcessing) return null;

  return (
    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="text-sm">
        <div className="font-medium text-amber-800">Algumas imagens falharam</div>
        <div className="text-amber-700 mt-1">
          Verifique se você possui créditos suficientes na DeepAI e se a API key está configurada corretamente.
          <br />
          <a 
            href="https://deepai.org/dashboard" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-amber-800"
          >
            Acesse o dashboard da DeepAI →
          </a>
        </div>
      </div>
    </div>
  );
};
