// ============= PONTO DE RESTAURAÇÃO - 13/01/2025 =============
// Este é um backup da página ProductDetails.tsx
// Para restaurar: renomeie este arquivo para ProductDetails.tsx

import { RefreshCw, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductDetailsHeader } from "@/components/product/ProductDetailsHeader";
import { ProductImagesGrid } from "@/components/product/ProductImagesGrid";
import { ImageQualityAnalyzer } from "@/components/product/ImageQualityAnalyzer";
import { CompactImageTools } from "@/components/product/CompactImageTools";
import { ProductFormContent } from "@/components/product/ProductFormContent";
import { MarketingImageGenerator } from "@/components/marketing/MarketingImageGenerator";
import { ProductDetailsLayout } from "@/components/product/ProductDetailsLayout";
import { ProductDetailsActions } from "@/components/product/ProductDetailsActions";
import { generateProductSpecificAIData } from "@/components/product/ProductDetailsMarketingData";
import { useProductDetails } from "@/hooks/useProductDetails";

export default function ProductDetails() {
  const {
    id,
    navigate,
    product,
    isLoading,
    isEditing,
    setIsEditing,
    isSaving,
    syncToBling,
    setSyncToBling,
    enhancementRecommended,
    setEnhancementRecommended,
    formData,
    showMarketingGenerator,
    setShowMarketingGenerator,
    loadProduct,
    handleSave,
    handleUpdateDescription,
    handleFormDataChange,
    handleGenerateMarketing,
    getProductImages
  } = useProductDetails();

  const productImages = product ? getProductImages(product) : [];

  if (isLoading) {
    return (
      <ProductDetailsLayout>
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ProductDetailsLayout>
    );
  }

  if (!product) {
    return (
      <ProductDetailsLayout>
        <div className="text-center py-10">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Produto não encontrado</h3>
        </div>
      </ProductDetailsLayout>
    );
  }

  const aiData = generateProductSpecificAIData(product);

  return (
    <ProductDetailsLayout>
      <ProductDetailsHeader
        product={product}
        isEditMode={isEditing}
        onToggleEditMode={() => setIsEditing(!isEditing)}
      />

      <ProductImagesGrid
        images={productImages}
        productName={product.nome}
        productId={id!}
      />

      <ImageQualityAnalyzer
        images={productImages}
        productName={product.nome}
        onNeedsEnhancement={setEnhancementRecommended}
      />

      <CompactImageTools
        productId={id!}
        productName={product.nome}
        productSku={product.sku}
        images={productImages}
        onImagesUpdated={loadProduct}
        enhancementRecommended={enhancementRecommended}
      />

      <Card className="glass-effect shadow-lg border-0 bg-gradient-to-br from-white/90 to-blue-50/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-100/50 to-purple-100/50 border-b border-blue-200/30">
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Informações do Produto
            </span>
          </CardTitle>
        </CardHeader>
        <ProductFormContent
          product={product}
          isEditing={isEditing}
          formData={formData}
          onFormDataChange={handleFormDataChange}
          onUpdateDescription={handleUpdateDescription}
        />
      </Card>

      <ProductDetailsActions
        showMarketingGenerator={showMarketingGenerator}
        onToggleMarketing={handleGenerateMarketing}
      />

      {showMarketingGenerator && (
        <div className="mt-8">
          <MarketingImageGenerator
            productName={product.nome}
            productImages={productImages}
            productDescription={product.descricao_curta || undefined}
            productBenefits={aiData.benefits}
            productFaqs={aiData.faqs}
            productPainPoints={aiData.painPoints}
            productSolutions={aiData.solutions}
            testimonials={aiData.testimonials}
            seoDescription={aiData.seoDescription}
            idealFor={aiData.idealFor}
            guarantee={aiData.guarantee}
          />
        </div>
      )}
    </ProductDetailsLayout>
  );
}