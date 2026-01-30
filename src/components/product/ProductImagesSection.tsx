
import { ProductImagesGrid } from "./ProductImagesGrid";
import { ImageQualityAnalyzer } from "./ImageQualityAnalyzer";
import { CompactImageTools } from "./CompactImageTools";
import { FotographerBackgroundGenerator } from "./FotographerBackgroundGenerator";
import { BflProductImageGenerator } from "./BflProductImageGenerator";
import { StabilityImageGenerator } from "./StabilityImageGenerator";

interface ProductImagesSectionProps {
  productId: string;
  productName: string;
  productSku: string;
  images: string[];
  enhancementRecommended: boolean;
  onNeedsEnhancement: (recommended: boolean) => void;
  onImagesUpdated: () => void;
}

export const ProductImagesSection = ({
  productId,
  productName,
  productSku,
  images,
  enhancementRecommended,
  onNeedsEnhancement,
  onImagesUpdated
}: ProductImagesSectionProps) => {
  return (
    <>
      {/* 1. Galeria de Imagens Centralizada */}
      <ProductImagesGrid
        images={images}
        productName={productName}
        productId={productId}
      />

      {/* 2. Análise de Qualidade das Imagens */}
      <ImageQualityAnalyzer
        images={images}
        productName={productName}
        onNeedsEnhancement={onNeedsEnhancement}
      />

      {/* 3. Ferramentas de Imagem Compactas */}
      <CompactImageTools
        productId={productId}
        productName={productName}
        productSku={productSku}
        images={images}
        onImagesUpdated={onImagesUpdated}
        enhancementRecommended={enhancementRecommended}
      />

      {/* 4. Gerador de Background - Fotographer.ai */}
      <FotographerBackgroundGenerator
        images={images}
        productName={productName}
        productId={productId}
      />

      {/* 5. Gerador BFL.ai */}
      <BflProductImageGenerator
        images={images}
        productName={productName}
        productId={productId}
      />

      {/* 6. Gerador Stability.ai */}
      <StabilityImageGenerator
        productId={productId}
        productName={productName}
        productImages={images}
      />
    </>
  );
};
