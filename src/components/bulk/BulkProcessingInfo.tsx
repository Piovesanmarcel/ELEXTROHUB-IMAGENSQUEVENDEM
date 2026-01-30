
import { Sparkles } from "lucide-react";

interface BulkProcessingInfoProps {
  processingType: 'enhance' | 'background';
}

export const BulkProcessingInfo = ({ processingType }: BulkProcessingInfoProps) => {
  return (
    <div className={`text-xs p-3 rounded border ${
      processingType === 'enhance'
        ? 'text-purple-600 bg-purple-50 border-purple-200'
        : 'text-blue-600 bg-blue-50 border-blue-200'
    }`}>
      <Sparkles className="h-3 w-3 inline mr-1" />
      <strong>Dica:</strong> {processingType === 'enhance' 
        ? 'As imagens serão processadas sequencialmente com IA da DeepAI para garantir máxima qualidade.'
        : 'O fundo será removido automaticamente, gerando imagens com transparência (PNG).'
      }
    </div>
  );
};
