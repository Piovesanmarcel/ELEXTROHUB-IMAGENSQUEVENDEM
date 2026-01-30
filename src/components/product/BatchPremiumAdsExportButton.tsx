import { Button } from "@/components/ui/button";
import { Download, Crown, Eye } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  checkPremiumEligibility,
  fetchR2ImagesBySource, 
  generatePremium20Ads,
  PremiumAdProduct,
  fetchFormattedConversionTopics
} from "@/utils/premiumAdsUtils";
import { generateExcelFile, downloadExcelFile, createBlingFormattedProduct } from "@/utils/blingSpreadsheetUtils";
import { generateWebcExcelFile, downloadWebcExcelFile } from "@/utils/webcSpreadsheetUtils";
import { Product } from "@/utils/productFilterUtils";
import { PremiumAdsPreviewModal } from "./PremiumAdsPreviewModal";

interface BatchPremiumAdsExportButtonProps {
  products: Product[];
}

export const BatchPremiumAdsExportButton = ({ products }: BatchPremiumAdsExportButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedAds, setGeneratedAds] = useState<PremiumAdProduct[]>([]);

  const handleGeneratePreview = async () => {
    if (!products || products.length === 0) {
      toast.error("Nenhum produto selecionado");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    setIsLoading(true);
    const allAds: any[] = [];
    let processedCount = 0;

    try {
      toast.info(`Processando ${products.length} produtos...`);

      for (const product of products) {
        try {
          console.log(`\n📦 Processando produto ${processedCount + 1}/${products.length}: ${product.nome}`);

          // Verificar elegibilidade
          const eligibility = await checkPremiumEligibility(product, user.id);
          if (!eligibility.eligible) {
            console.warn(`⚠️ Produto ${product.nome} não elegível: ${eligibility.reason}`);
            continue;
          }

          // Buscar imagens hospedadas
          const imagesBySource = await fetchR2ImagesBySource(user.id, product.id);
          
          // Gerar 20 anúncios para este produto
          const ads = await generatePremium20Ads(
            product,
            eligibility.seoTitles!,
            imagesBySource,
            user.id
          );
          
          if (ads && ads.length > 0) {
            console.log(`✅ ${ads.length} anúncios gerados para ${product.nome}`);
            allAds.push(...ads);
          } else {
            console.warn(`⚠️ Nenhum anúncio gerado para ${product.nome}`);
          }

          processedCount++;
          toast.info(`Processado ${processedCount}/${products.length} produtos`);

        } catch (error) {
          console.error(`❌ Erro ao processar produto ${product.nome}:`, error);
          // Continua processando os próximos produtos
        }
      }

      if (allAds.length === 0) {
        toast.error("Nenhum anúncio foi gerado");
        return;
      }

      // Salvar anúncios gerados e mostrar preview
      console.log(`\n📊 ${allAds.length} anúncios gerados de ${processedCount} produtos`);
      setGeneratedAds(allAds);
      setShowPreview(true);
      toast.success(`✅ ${allAds.length} anúncios gerados! Revise antes de baixar.`);

    } catch (error) {
      console.error('❌ Erro ao gerar planilha em lote:', error);
      toast.error("Erro ao gerar planilha em lote");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDownloadBling = async () => {
    if (generatedAds.length === 0) return;
    
    setIsLoading(true);
    try {
      console.log(`\n📊 Gerando planilha Bling com ${generatedAds.length} anúncios...`);
      
      const blingFormattedProducts = generatedAds.map(ad => {
        const premiumAd = ad as PremiumAdProduct;
        const productData = {
          ...products[0],
          sku: premiumAd.sku,
          nome: premiumAd.nome,
          preco: premiumAd.preco,
          estoque: premiumAd.estoque,
          descricao: premiumAd.descricao,
          descricao_curta: premiumAd.descricao_curta,
          categoria: premiumAd.categoria,
          altura: premiumAd.altura,
          largura: premiumAd.largura,
          profundidade: premiumAd.profundidade,
          peso_bruto: premiumAd.peso_bruto,
          marca: premiumAd.marca,
          gtin: premiumAd.gtin,
          unidade: premiumAd.unidade,
          situacao: premiumAd.situacao
        };
        const enhancedImageUrls = premiumAd.imageUrls.join('|');
        return createBlingFormattedProduct(productData, '', enhancedImageUrls);
      });

      const workbook = generateExcelFile(blingFormattedProducts);
      const filename = `anuncios_premium_lote_bling_${new Date().toISOString().split('T')[0]}.xlsx`;
      downloadExcelFile(workbook, filename);

      toast.success(`✅ Planilha Bling gerada com ${generatedAds.length} anúncios!`);
      setShowPreview(false);
    } catch (error) {
      console.error('❌ Erro ao gerar planilha Bling:', error);
      toast.error("Erro ao gerar planilha Bling");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDownloadWEBC = async () => {
    if (generatedAds.length === 0) return;
    
    setIsLoading(true);
    try {
      console.log(`\n📊 Gerando planilha WEBC com ${generatedAds.length} anúncios...`);
      
      const workbook = generateWebcExcelFile(generatedAds);
      const filename = `anuncios_premium_lote_webc_${new Date().toISOString().split('T')[0]}.xlsx`;
      downloadWebcExcelFile(workbook, filename);

      toast.success(`✅ Planilha WEBC gerada com ${generatedAds.length} anúncios!`);
      setShowPreview(false);
    } catch (error) {
      console.error('❌ Erro ao gerar planilha WEBC:', error);
      toast.error("Erro ao gerar planilha WEBC");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleGeneratePreview}
        disabled={isLoading || !products || products.length === 0}
        className="w-full gap-2"
        size="lg"
      >
        <Crown className="h-5 w-5" />
        {isLoading 
          ? `Processando ${products?.length || 0} produtos...` 
          : `Planilha de 20 Anúncios Premium (${products?.length || 0} produtos)`
        }
        <Eye className="h-4 w-4" />
      </Button>

      <PremiumAdsPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onConfirmDownload={handleConfirmDownloadBling}
        onConfirmDownloadWEBC={handleConfirmDownloadWEBC}
        ads={generatedAds}
        isDownloading={isLoading}
        productName={`${products?.length || 0} produtos (${generatedAds.length} anúncios)`}
      />
    </>
  );
};
