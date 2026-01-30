
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface ImageEnhancerHeaderProps {
  imageCount: number;
  hasPersistedImages?: boolean;
  isLoadingPersisted?: boolean;
}

export const ImageEnhancerHeader = ({ 
  imageCount, 
  hasPersistedImages = false,
  isLoadingPersisted = false 
}: ImageEnhancerHeaderProps) => {
  if (imageCount === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg border">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">
          Nenhuma imagem disponível para melhoria
        </span>
      </div>
    );
  }

  if (isLoadingPersisted) {
    return (
      <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">
          Carregando imagens melhoradas salvas...
        </span>
      </div>
    );
  }

  if (hasPersistedImages) {
    return (
      <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm">
          Imagens melhoradas carregadas do banco de dados
        </span>
      </div>
    );
  }

  return null;
};
