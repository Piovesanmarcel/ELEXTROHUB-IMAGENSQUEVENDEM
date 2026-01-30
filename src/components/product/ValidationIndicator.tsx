import { AlertCircle, CheckCircle, Image, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ValidationIndicatorProps {
  isValid: boolean;
  missingFields: string[];
  imageCount: number;
}

export const ValidationIndicator = ({ isValid, missingFields, imageCount }: ValidationIndicatorProps) => {
  if (isValid) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <span className="text-green-700 dark:text-green-300 font-medium">
          Todos os campos obrigatórios preenchidos!
        </span>
        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200 ml-auto">
          {imageCount} imagens
        </Badge>
      </div>
    );
  }

  return (
    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg space-y-2">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-amber-600" />
        <span className="text-amber-700 dark:text-amber-300 font-medium">
          Campos obrigatórios faltando:
        </span>
      </div>
      <div className="flex flex-wrap gap-2 ml-7">
        {missingFields.map((field, index) => (
          <Badge 
            key={index} 
            variant="outline" 
            className="border-amber-300 text-amber-700 dark:border-amber-600 dark:text-amber-300"
          >
            {field.includes('Imagens') ? <Image className="h-3 w-3 mr-1" /> : <FileText className="h-3 w-3 mr-1" />}
            {field}
          </Badge>
        ))}
      </div>
    </div>
  );
};
