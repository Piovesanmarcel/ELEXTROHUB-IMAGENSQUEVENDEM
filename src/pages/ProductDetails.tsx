
import { RefreshCw, Package, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, ChevronDown, ChevronUp } from "lucide-react";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { ProductDetailsHeader } from "@/components/product/ProductDetailsHeader";
import { ProductImagesGrid } from "@/components/product/ProductImagesGrid";
import { ImageQualityAnalyzer } from "@/components/product/ImageQualityAnalyzer";
import { CompactImageTools } from "@/components/product/CompactImageTools";
import { GeminiBackgroundGenerator } from "@/components/product/GeminiBackgroundGenerator";
import { GeminiBatchImageGenerator } from "@/components/product/GeminiBatchImageGenerator";
import { CloudinaryProductTransform } from "@/components/product/CloudinaryProductTransform";
import { BflProductImageGenerator } from "@/components/product/BflProductImageGenerator";
import { RunwayImageGenerator } from "@/components/product/RunwayImageGenerator";
import { StabilityImageGenerator } from "@/components/product/StabilityImageGenerator";
import { ProductFormContent } from "@/components/product/ProductFormContent";
import { CopywritingGenerator } from "@/components/product/CopywritingGenerator";
import { PremiumAdsExportButton } from "@/components/product/PremiumAdsExportButton";
import { MarketingImageGenerator } from "@/components/marketing/MarketingImageGenerator";
import { ProductShowcaseGenerator } from "@/components/product/ProductShowcaseGenerator";
import { ProductDetailsLayout } from "@/components/product/ProductDetailsLayout";
import { ProductDetailsActions } from "@/components/product/ProductDetailsActions";
import { ProductReadyForAdsToggle } from "@/components/product/ProductReadyForAdsToggle";
import { CanvaStyleTemplateGenerator } from "@/components/product/CanvaStyleTemplateGenerator";
import { ProductMarketingGallery } from "@/components/product/ProductMarketingGallery";
import { ProductVariationsSection } from "@/components/product/ProductVariationsSection";
import { generateProductSpecificAIData } from "@/components/product/ProductDetailsMarketingData";
import { useProductDetails } from "@/hooks/useProductDetails";
import { SafeErrorBoundary } from "@/components/SafeErrorBoundary";
import PricingControls from "@/components/pricing/PricingControls";
import { ProductTable } from "@/components/ProductTable";
import { useProductsPricing } from "@/hooks/products/useProductsPricing";
import { supabase } from "@/integrations/supabase/client";
import { AIImageAutoProcessor } from "@/components/product/ai-automation/AIImageAutoProcessor";
import { useState, useEffect } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";


export default function ProductDetails() {
  const [expandedGemini, setExpandedGemini] = useState(false);
  const [expandedGeminiBatch, setExpandedGeminiBatch] = useState(false);
  const [expandedBfl, setExpandedBfl] = useState(false);
  const [expandedRunway, setExpandedRunway] = useState(false);
  const [expandedStability, setExpandedStability] = useState(false);
  const [expandedShowcase, setExpandedShowcase] = useState(false);
  const [expandedCanvaTemplates, setExpandedCanvaTemplates] = useState(false);
  const [unifiedData, setUnifiedData] = useState<any>(null);
  const [hostedAIImages, setHostedAIImages] = useState<string[]>([]);
  
  const {
    id,
    navigate,
    product,
    isLoading,
    isRefreshing,
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
    hasError,
    setHasError,
    loadProduct,
    handleSave,
    handleUpdateDescription,
    handleFormDataChange,
    handleGenerateMarketing,
    getProductImages,
    updateImageOrder
  } = useProductDetails();

  const {
    profitMargin,
    setProfitMargin,
    taxRate,
    setTaxRate,
    storeCommission,
    setStoreCommission,
    selectedPricing,
    setSelectedPricing
  } = useProductsPricing();

  // 🏷️ Brand Settings para logo global
  const { brandSettings } = useBrandSettings();

  const productImages = product ? getProductImages(product) : [];

  // 🚀 Listener para automação - expandir seções quando automação for iniciada
  useEffect(() => {
    const handleGeminiAutomation = async (event: CustomEvent) => {
      console.log('🧠 [PRODUCT DETAILS] Recebido evento de automação Gemini, expandindo seção...');
      setExpandedGemini(true);
    };

    const handleBflAutomation = async (event: CustomEvent) => {
      console.log('🤖 [PRODUCT DETAILS] Recebido evento de automação BFL, expandindo seção...');
      setExpandedBfl(true);
    };

    // 🚀 AUTOMAÇÃO BFL: Listener principal para iniciar a automação
    const handleBflBackgroundAutomation = async (event: CustomEvent) => {
      console.log('🤖 [AUTOMAÇÃO BFL] ===============================================');
      console.log('🤖 [AUTOMAÇÃO BFL] EVENTO RECEBIDO no ProductDetails!', event.detail);
      console.log('🤖 [AUTOMAÇÃO BFL] ProductId recebido:', event.detail?.productId);
      console.log('🤖 [AUTOMAÇÃO BFL] Source:', event.detail?.source);
      console.log('🤖 [AUTOMAÇÃO BFL] ===============================================');
      
      // Expandir a seção BFL primeiro
      setExpandedBfl(true);
      
      // Aguardar um momento para a seção ser renderizada
      setTimeout(() => {
        console.log('🔄 [AUTOMAÇÃO BFL] Redispachando evento para componente interno...');
        
        // Recriar e disparar evento para o componente interno
        const internalEvent = new CustomEvent('triggerBflAutomationInternal', {
          detail: event.detail
        });
        window.dispatchEvent(internalEvent);
      }, 500);
    };

    // 🎉 AUTOMAÇÃO COMPLETA: Listener para disparar geração de Showcases
    const handleAutomationComplete = async (event: CustomEvent) => {
      const eventProductId = event.detail?.productId;
      const success = event.detail?.success;
      
      console.log('🎉 [AUTOMAÇÃO COMPLETA] ===============================================');
      console.log('🎉 [AUTOMAÇÃO COMPLETA] Evento recebido!', event.detail);
      console.log('🎉 [AUTOMAÇÃO COMPLETA] ProductId:', eventProductId);
      console.log('🎉 [AUTOMAÇÃO COMPLETA] Current ID:', id);
      console.log('🎉 [AUTOMAÇÃO COMPLETA] Success:', success);
      console.log('🎉 [AUTOMAÇÃO COMPLETA] ===============================================');
      
      if (eventProductId === id && success) {
        console.log('🚀 [AUTOMAÇÃO COMPLETA] Disparando geração automática de Showcases...');
        
        // Expandir seção de Showcases
        setExpandedShowcase(true);
        
        // ✅ Disparar IMEDIATAMENTE com URLs do evento (sem esperar banco)
        const whiteBackgroundImage = event.detail?.whiteBackgroundImage;
        // ✅ NOVO: Usar circleImages ordenado (com packaging em 3º) se disponível
        const circleImages = event.detail?.circleImages || event.detail?.ambientImages || [];
        
        console.log('🎨 [AUTOMAÇÃO COMPLETA] Enviando evento para ProductShowcaseGenerator com URLs...');
        console.log('📦 [AUTOMAÇÃO COMPLETA] Círculos ordenados (packaging em 3º):', circleImages.length);
        
        window.dispatchEvent(new CustomEvent('startShowcaseGeneration', {
          detail: { 
            productId: id, 
            autoGenerate: true,
            mainImageUrl: whiteBackgroundImage,
            circleImages: circleImages // ✅ Usa array ordenado com packaging em 3º
          }
        }));
      }
    };

    // 🚫 AUTOMAÇÃO REMOVIDA: Listener de automação Gemini desabilitado
    console.log('🚫 [AUTOMAÇÃO REMOVIDA] Listeners de automação Gemini foram desabilitados');

    window.addEventListener('triggerBflAutomation', handleBflBackgroundAutomation as EventListener);
    window.addEventListener('automationComplete', handleAutomationComplete as EventListener);
    
    return () => {
      window.removeEventListener('triggerBflAutomation', handleBflBackgroundAutomation as EventListener);
      window.removeEventListener('automationComplete', handleAutomationComplete as EventListener);
    };
  }, [id]);

  // Carregar dados do Comando Unificado e imagens AI hospedadas
  useEffect(() => {
    const loadUnifiedData = async () => {
      if (!id || !product) return;

      try {
        console.log('🔍 Carregando dados para templates Canva...');
        
        // Buscar dados do Comando Unificado
        const { data: unifiedResults, error: unifiedError } = await supabase
          .from('ai_unified_results')
          .select('results')
          .eq('product_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (unifiedError) {
          console.error('❌ Erro ao buscar Comando Unificado:', unifiedError);
        } else if (unifiedResults) {
          console.log('✅ Comando Unificado carregado:', unifiedResults);
          setUnifiedData(unifiedResults.results);
        } else {
          console.log('ℹ️ Nenhum resultado do Comando Unificado encontrado');
        }

        // Buscar todas as imagens AI hospedadas do produto
        const { data: userData } = await supabase.auth.getUser();
        
        if (userData.user) {
          const { data: hostedImages, error: imagesError } = await supabase
            .from('hosted_images')
            .select('url, uploaded_at, tags, description')
            .eq('user_id', userData.user.id)
            .or(`tags.cs.{product:${id}},tags.cs.{${product.sku}},description.ilike.%${product.nome}%`)
            .order('uploaded_at', { ascending: false });

          if (imagesError) {
            console.error('❌ Erro ao buscar imagens hospedadas:', imagesError);
          } else if (hostedImages && hostedImages.length > 0) {
            console.log(`✅ ${hostedImages.length} imagens hospedadas encontradas`);
            console.log('🔍 Primeira imagem tags:', hostedImages[0].tags);
            console.log('🔍 Product ID usado na query:', id);
            console.log('🔍 Product SKU usado na query:', product.sku);
            console.log('🔍 User ID:', userData.user.id);
            setHostedAIImages(hostedImages.map(img => img.url));
          } else {
            console.log('ℹ️ Nenhuma imagem hospedada encontrada');
            console.log('🔍 Query usada - Product ID:', id);
            console.log('🔍 Query usada - Product SKU:', product.sku);
            console.log('🔍 Query usada - Product Nome:', product.nome);
            console.log('🔍 User ID:', userData.user.id);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados para templates:', error);
      }
    };

    loadUnifiedData();
  }, [id, product]);


  if (hasError && !product) {
    return (
      <SafeErrorBoundary>
        <ProductDetailsLayout>
          <div className="text-center py-10">
            <Package className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Erro ao carregar produto</h3>
            <p className="text-muted-foreground mb-4">
              Houve um problema ao carregar os dados do produto.
            </p>
            <button 
              onClick={() => {
                setHasError(false);
                loadProduct();
              }}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4 mr-2 inline" />
              Tentar Novamente
            </button>
          </div>
        </ProductDetailsLayout>
      </SafeErrorBoundary>
    );
  }

  if (isLoading) {
    return (
      <SafeErrorBoundary>
        <ProductDetailsLayout>
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando produto...</p>
          </div>
        </ProductDetailsLayout>
      </SafeErrorBoundary>
    );
  }

  if (!product) {
    return (
      <SafeErrorBoundary>
        <ProductDetailsLayout>
          <div className="text-center py-10">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Produto não encontrado</h3>
          </div>
        </ProductDetailsLayout>
      </SafeErrorBoundary>
    );
  }

  const aiData = generateProductSpecificAIData(product);

  return (
    <SafeErrorBoundary>
      <ProductDetailsLayout>
        {/* Indicador de atualização em background */}
        {isRefreshing && (
          <div className="mb-4">
            <Badge variant="outline" className="gap-1.5 bg-blue-50 text-blue-700 border-blue-200 w-full justify-center py-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Atualizando informações em segundo plano...
            </Badge>
          </div>
        )}

        <SafeErrorBoundary>
          <ProductDetailsHeader
            product={product}
            isEditMode={isEditing}
            onToggleEditMode={() => setIsEditing(!isEditing)}
          />
        </SafeErrorBoundary>

        <SafeErrorBoundary>
          <ProductImagesGrid
            images={productImages}
            productName={product.nome}
            productId={id!}
            onUpdateImageOrder={updateImageOrder}
          />
        </SafeErrorBoundary>

        {/* Bloco de Análise de Qualidade ocultado - funcionalidade integrada na Galeria */}

        {product?.tipo_produto === 'variavel' && product?.variacoes && (
          <SafeErrorBoundary>
            <ProductVariationsSection variacoes={product.variacoes} />
          </SafeErrorBoundary>
        )}

        {/* Bloco Informações do Produto - com Comando Unificado (5 em 1) */}
        <SafeErrorBoundary>
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
        </SafeErrorBoundary>

        {/* Gerador de Copywriting Profissional - Usa dados do formData inseridos pelo usuário */}
        <SafeErrorBoundary>
          <CopywritingGenerator
            productId={id!}
            productName={formData.nome}
            productSku={formData.sku}
            images={productImages}
            shortDescription={formData.descricao_curta || ''}
          />
        </SafeErrorBoundary>

        {/* Gerador de Background - Gemini AI (3 imagens: Prompts 1, 2 e 9) */}
        <SafeErrorBoundary>
          <GeminiBackgroundGenerator
            images={productImages}
            productName={formData.nome}
            productId={id!}
            dimensions={{
              altura: product.altura,
              largura: product.largura,
              profundidade: product.profundidade,
              peso_bruto: product.peso_bruto
            }}
          />
        </SafeErrorBoundary>

        {/* Templates de Marketing Estilo Canva */}
        <SafeErrorBoundary>
          <Collapsible open={expandedCanvaTemplates} onOpenChange={setExpandedCanvaTemplates}>
            <Card className="glass-effect shadow-lg border-0 bg-gradient-to-br from-white/90 to-green-50/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-100/50 to-teal-100/50 border-b border-green-200/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 shadow-lg">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                        Templates de Marketing Estilo Canva
                      </CardTitle>
                      {!expandedCanvaTemplates && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Gere imagens profissionais automaticamente com seus dados de IA
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                      Auto-Generate
                    </Badge>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        {expandedCanvaTemplates ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>
              </CardHeader>
              
              <CollapsibleContent forceMount className={!expandedCanvaTemplates ? "hidden" : ""}>
                <CardContent className="pt-6 space-y-6">
                  <CanvaStyleTemplateGenerator
                    productId={id!}
                    productName={product.nome}
                    aiImages={hostedAIImages}
                    unifiedData={unifiedData}
                    logoUrl={brandSettings?.logo_url || undefined}
                  />
                  
                  {/* ❌ DESATIVADO: Galeria de Marketing - Imagens agora vão para ProductImagesGrid */}
                  {/* <ProductMarketingGallery 
                    productId={id!}
                    productName={product.nome}
                  /> */}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </SafeErrorBoundary>

        {/* Gerador Automático de KITs - Cloudinary */}
        <SafeErrorBoundary>
          <CloudinaryProductTransform
            productId={id!}
            productSku={product.sku}
            productName={product.nome}
            images={productImages}
          />
        </SafeErrorBoundary>

        {/* Planilha de 20 Anúncios Premium */}
        <SafeErrorBoundary>
          <div className="flex justify-center my-4">
            <PremiumAdsExportButton product={product} />
          </div>
        </SafeErrorBoundary>

        {/* Configurações de Precificação */}
        <SafeErrorBoundary>
          <PricingControls
            profitMargin={profitMargin}
            taxRate={taxRate}
            onProfitMarginChange={setProfitMargin}
            onTaxRateChange={setTaxRate}
            selectedPricing={selectedPricing}
            onPricingChange={setSelectedPricing}
            storeCommission={storeCommission}
            onStoreCommissionChange={setStoreCommission}
          />
        </SafeErrorBoundary>

        {/* Tabela de Preços */}
        {selectedPricing !== 'none' && (
          <SafeErrorBoundary>
            <ProductTable
              products={[{
                ...product,
                preco_custo: formData.preco_custo,
                peso_liquido: formData.peso_liquido
              }]}
              onEditProduct={() => {}}
              onViewProduct={() => {}}
              updateSingleProduct={() => {}}
              profitMargin={profitMargin}
              taxRate={taxRate}
              selectedPricing={selectedPricing}
              storeCommission={storeCommission}
            />
          </SafeErrorBoundary>
        )}

        {/* ✅ Sistema de Automação IA - BACKGROUND (processa imagens em 5 categorias) */}
        {id && product && (
          <div className="hidden">
            <AIImageAutoProcessor
              productId={id}
              productName={formData.nome || product.nome}
              isExpanded={false}
              onToggleExpanded={() => {}}
            />
          </div>
        )}
      </ProductDetailsLayout>
    </SafeErrorBoundary>
  );
}
