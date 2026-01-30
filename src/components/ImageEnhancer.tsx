
import { ImageEnhancementResults } from "./enhancement/ImageEnhancementResults";
import { ImageEnhancementProcessor } from "./enhancement/ImageEnhancementProcessor";
import { EnhancementUsageDisplay } from "./enhancement/EnhancementUsageDisplay";
import { ImageEnhancerHeader } from "./enhancement/ImageEnhancerHeader";
import { ImageSelector } from "./enhancement/ImageSelector";
import { useImageEnhancementCore } from "@/hooks/enhancement/useImageEnhancementCore";
import { SafeErrorBoundary } from "./SafeErrorBoundary";
import { useState, useEffect } from "react";

interface ImageEnhancerProps {
  productId: string;
  productName: string;
  productSku: string;
  images: string[];
  onImagesUpdated: () => void;
}

export const ImageEnhancer = ({ 
  productId, 
  productName, 
  productSku,
  images, 
  onImagesUpdated 
}: ImageEnhancerProps) => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  
  const {
    isProcessing,
    progress,
    processedCount,
    enhancementType,
    enhancedImages,
    usage,
    isUsageLoading,
    isLoadingPersisted,
    isSaving,
    setEnhancementType,
    processImages,
    loadPersistedImages
  } = useImageEnhancementCore(productId);

  const handleEnhanceImages = () => {
    processImages(selectedImages);
  };

  // 🚀 ENVIAR IMAGENS MELHORADAS PARA O GERADOR DE KITS
  useEffect(() => {
    if (enhancedImages.length > 0) {
      const enhancedUrls = enhancedImages.map(img => img.enhanced);
      
      console.log('📤 [DEEPAI] Enviando imagens melhoradas para o Gerador de KITs:', enhancedUrls);
      
      // Disparar evento para o CloudinaryProductTransform
      const event = new CustomEvent('deepaiImagesToKit', {
        detail: {
          source: 'deepai',
          images: enhancedUrls,
          productId: productId
        }
      });
      
      window.dispatchEvent(event);
    }
  }, [enhancedImages, productId]);

  return (
    <SafeErrorBoundary>
      <div className="space-y-4">
        <SafeErrorBoundary>
          <ImageEnhancerHeader 
            imageCount={images.length} 
            hasPersistedImages={enhancedImages.length > 0}
            isLoadingPersisted={isLoadingPersisted}
          />
        </SafeErrorBoundary>

        {images.length > 0 && (
          <>
            {/* Seletor de imagens */}
            <SafeErrorBoundary>
              <ImageSelector
                images={images}
                selectedImages={selectedImages}
                onSelectionChange={setSelectedImages}
              />
            </SafeErrorBoundary>

            {/* Display de uso de créditos */}
            {usage && (
              <SafeErrorBoundary>
                <EnhancementUsageDisplay
                  enhancements_used={usage.enhancements_used}
                  enhancements_available={usage.enhancements_available}
                  isLoading={isUsageLoading}
                />
              </SafeErrorBoundary>
            )}

            <SafeErrorBoundary>
              <ImageEnhancementProcessor
                images={selectedImages}
                enhancementType={enhancementType}
                isProcessing={isProcessing}
                progress={progress}
                processedCount={processedCount}
                onEnhancementTypeChange={setEnhancementType}
                onProcessImages={handleEnhanceImages}
                hasPersistedImages={enhancedImages.length > 0}
              />
            </SafeErrorBoundary>

            {/* Só renderizar resultados quando há imagens E não está processando */}
            {enhancedImages.length > 0 && !isProcessing && (
              <SafeErrorBoundary>
                <ImageEnhancementResults
                  enhancedImages={enhancedImages}
                  productName={productName}
                  productSku={productSku}
                  isPersisted={true}
                  isSaving={isSaving}
                />
              </SafeErrorBoundary>
            )}
          </>
        )}
      </div>
    </SafeErrorBoundary>
  );
};
