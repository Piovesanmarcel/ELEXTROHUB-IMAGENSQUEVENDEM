
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, RefreshCw, Clock } from "lucide-react";
import { EnhancementOptions, EnhancementType } from "./EnhancementOptions";
import { EnhancementProgress } from "./EnhancementProgress";

interface ImageEnhancementProcessorProps {
  images: string[];
  enhancementType: EnhancementType;
  isProcessing: boolean;
  progress: number;
  processedCount: number;
  onEnhancementTypeChange: (type: EnhancementType) => void;
  onProcessImages: () => void;
  hasPersistedImages?: boolean;
}

export const ImageEnhancementProcessor = ({
  images,
  enhancementType,
  isProcessing,
  progress,
  processedCount,
  onEnhancementTypeChange,
  onProcessImages,
  hasPersistedImages = false
}: ImageEnhancementProcessorProps) => {
  const hasSelectedImages = images.length > 0;
  const isButtonDisabled = isProcessing || hasPersistedImages || !hasSelectedImages;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-purple-600" />
          <span className="font-medium text-gray-900">
            Melhoria de Imagens com DeepAI
          </span>
        </div>
        <Badge variant="outline" className="text-purple-600 border-purple-300 bg-purple-50">
          {images.length} imagem(ns)
        </Badge>
      </div>

      <div className="space-y-3">
        <EnhancementOptions
          value={enhancementType}
          onChange={onEnhancementTypeChange}
        />

        {isProcessing && (
          <EnhancementProgress
            progress={progress}
            processedCount={processedCount}
            totalImages={images.length}
          />
        )}

        <Button 
          onClick={onProcessImages}
          disabled={isButtonDisabled}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Processando com DeepAI...
            </>
          ) : !hasSelectedImages ? (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Selecione as imagens para melhorar
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              {hasPersistedImages ? 'Reprocessar' : 'Melhorar'} {images.length} Imagem(ns) com DeepAI
            </>
          )}
        </Button>

        {hasPersistedImages && !isProcessing && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-xs text-green-700">
              <span className="font-medium">✅ Imagens já foram melhoradas!</span> Este produto já possui imagens melhoradas salvas no banco de dados.
            </p>
          </div>
        )}

        {/* Aviso sobre rate limiting */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-blue-700">
                <span className="font-medium">Sistema Anti Rate-Limit Ativo</span>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Aguarda automaticamente entre uploads para evitar bloqueios. Se o ImgBB estiver sobrecarregado, usa URL direta do DeepAI como fallback.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
