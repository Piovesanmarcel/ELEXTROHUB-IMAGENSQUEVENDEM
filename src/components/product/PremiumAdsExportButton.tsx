import { Button } from "@/components/ui/button";
import { Download, Crown, Eye } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  checkPremiumEligibility, 
  fetchR2ImagesBySource, 
  generatePremium20Ads,
  analyzeAdsAgainstStructure,
  PremiumAdProduct,
  AdsStructureReport,
  fetchFormattedConversionTopics
} from "@/utils/premiumAdsUtils";
import { generateExcelFile, downloadExcelFile, createBlingFormattedProduct } from "@/utils/blingSpreadsheetUtils";
import { generateWebcExcelFile, downloadWebcExcelFile } from "@/utils/webcSpreadsheetUtils";
import { Product } from "@/utils/productFilterUtils";
import { PremiumAdsPreviewModal } from "./PremiumAdsPreviewModal";
import { PremiumAdsDisplayBlock } from "./PremiumAdsDisplayBlock";

interface PremiumAdsExportButtonProps {
  product: Product;
}

export const PremiumAdsExportButton = ({ product }: PremiumAdsExportButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewAds, setPreviewAds] = useState<PremiumAdProduct[]>([]);
  const [savedAds, setSavedAds] = useState<PremiumAdProduct[]>([]);
  const [adsReport, setAdsReport] = useState<AdsStructureReport | undefined>(undefined);
  const [imagesBySource, setImagesBySource] = useState<Record<string, any>>({});

  // Carregar anúncios salvos do localStorage ao montar o componente
  useEffect(() => {
    const storageKey = `premium-ads-${product.id}`;
    const reportKey = `premium-ads-report-${product.id}`;
    
    try {
      const savedData = localStorage.getItem(storageKey);
      const savedReportData = localStorage.getItem(reportKey);
      
      if (savedData) {
        const parsedAds = JSON.parse(savedData);
        setSavedAds(parsedAds);
        console.log(`✅ ${parsedAds.length} anúncios carregados do localStorage`);
      }
      
      if (savedReportData) {
        const parsedReport = JSON.parse(savedReportData);
        setAdsReport(parsedReport);
        console.log('✅ Relatório carregado do localStorage');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar anúncios do localStorage:', error);
    }
  }, [product.id]);

  // Salvar anúncios no localStorage sempre que mudarem
  useEffect(() => {
    if (savedAds.length > 0) {
      const storageKey = `premium-ads-${product.id}`;
      try {
        localStorage.setItem(storageKey, JSON.stringify(savedAds));
        console.log(`💾 ${savedAds.length} anúncios salvos no localStorage`);
      } catch (error) {
        console.error('❌ Erro ao salvar anúncios no localStorage:', error);
      }
    }
  }, [savedAds, product.id]);

  // Salvar relatório no localStorage sempre que mudar
  useEffect(() => {
    if (adsReport) {
      const reportKey = `premium-ads-report-${product.id}`;
      try {
        localStorage.setItem(reportKey, JSON.stringify(adsReport));
        console.log('💾 Relatório salvo no localStorage');
      } catch (error) {
        console.error('❌ Erro ao salvar relatório no localStorage:', error);
      }
    }
  }, [adsReport, product.id]);

  const handlePreview = async () => {
    console.log("🚀 [DEBUG] INÍCIO handlePreview");
    console.log("🚀 [DEBUG] Product:", product);
    console.log("🚀 [DEBUG] Product ID:", product?.id);
    
    // Validação prévia do produto
    if (!product?.id) {
      console.error("❌ [DEBUG] Product ID não encontrado:", product);
      toast.error("Produto inválido - ID não encontrado");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    console.log("🚀 [DEBUG] User auth:", user?.id);
    
    if (!user?.id) {
      console.error("❌ [DEBUG] Usuário não autenticado");
      toast.error("Usuário não autenticado");
      return;
    }

    setIsLoading(true);
    console.log("🚀 INÍCIO GERAÇÃO PLANILHA ANÚNCIOS PREMIUM");
    console.log(`📦 Produto: ${product.nome} (ID: ${product.id})`);

    try {
      // Verificar elegibilidade
      console.log("🔍 [DEBUG] Iniciando verificação de elegibilidade...");
      toast.info("Verificando elegibilidade do produto...", { duration: 2000 });
      const eligibility = await checkPremiumEligibility(product, user.id);
      console.log("🔍 [DEBUG] Resultado da elegibilidade:", eligibility);
      
      if (!eligibility.eligible) {
        console.error("❌ [DEBUG] Produto não elegível:", eligibility.reason);
        toast.error(eligibility.reason || "Produto não elegível");
        return;
      }

      console.log("✅ [DEBUG] Produto elegível, preparando anúncios...");
      toast.success("✅ Produto elegível! Preparando anúncios...", { duration: 2000 });
      
      // Buscar imagens R2
      console.log("🖼️ [DEBUG] Buscando imagens R2...");
      toast.info("Organizando imagens R2...", { duration: 2000 });
      const images = await fetchR2ImagesBySource(user.id, product.id);
      console.log("🖼️ [DEBUG] Imagens encontradas:", images);
      setImagesBySource(images); // Salvar para análise
      
      // Gerar 20 anúncios
      console.log("⚡ [DEBUG] Gerando anúncios premium...");
      toast.info("Gerando 20 anúncios premium...", { duration: 3000 });
      const premiumAds = await generatePremium20Ads(
        product, 
        eligibility.seoTitles!, 
        images,
        user.id
      );
      console.log("⚡ [DEBUG] Anúncios gerados:", premiumAds.length);
      
      if (premiumAds.length === 0) {
        console.error("❌ [DEBUG] Nenhum anúncio foi gerado");
        toast.error("Nenhum anúncio foi gerado");
        return;
      }

      // Analisar estrutura dos anúncios
      console.log("🔍 [DEBUG] Analisando estrutura dos anúncios...");
      const report = analyzeAdsAgainstStructure(images, premiumAds);
      console.log("🔍 [DEBUG] Relatório gerado:", report);
      setAdsReport(report);

      // Mostrar preview e salvar anúncios
      console.log("🎯 [DEBUG] Abrindo modal preview...");
      setPreviewAds(premiumAds);
      setSavedAds(premiumAds); // Salvar para exibição permanente
      setShowPreview(true);
      
      const validationMsg = report.invalidAds === 0 
        ? `✅ ${report.totalAds} anúncios salvos - Estrutura 100% conforme!` 
        : `✅ ${report.totalAds} anúncios salvos (${report.validAds} OK, ${report.invalidAds} com ajustes)`;
      toast.success(validationMsg, { duration: 4000 });
      console.log("🎯 [DEBUG] Modal deve estar aberto agora");
      
    } catch (error) {
      console.error("❌ ERRO CRÍTICO - Preview Premium:", error);
      console.error("❌ [DEBUG] Stack trace:", error.stack);
      toast.error(`Erro ao gerar preview: ${error.message}`);
    } finally {
      console.log("🏁 [DEBUG] Finalizando handlePreview, setIsLoading(false)");
      setIsLoading(false);
    }
  };

  const handleConfirmDownload = async () => {
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        toast.error("Usuário não autenticado");
        return;
      }

      // Buscar Tópicos de Conversão formatados (sem emojis)
      const topicsText = await fetchFormattedConversionTopics(product.id, user.id);
      
      // Converter PremiumAdProduct para formato Product compatível e usar createBlingFormattedProduct
      const blingFormattedAds = previewAds.map((ad: PremiumAdProduct) => {
        const productData = {
          ...product, // Herdar dados do produto pai
          sku: ad.sku,
          nome: ad.nome,
          preco: ad.preco,
          estoque: ad.estoque,
          descricao: ad.descricao,
          descricao_curta: ad.descricao_curta,
          categoria: ad.categoria,
          altura: ad.altura,
          largura: ad.largura,
          profundidade: ad.profundidade,
          peso_bruto: ad.peso_bruto,
          marca: ad.marca,
          gtin: ad.gtin,
          unidade: ad.unidade,
          situacao: ad.situacao
        };
        
        // Montar URLs das imagens melhoradas (formato esperado pela função)
        const enhancedImageUrls = ad.imageUrls.join('|');
        
        return createBlingFormattedProduct(productData, topicsText || '', enhancedImageUrls);
      });

      // Gerar arquivo Excel usando a função oficial
      toast.info("Gerando planilha Excel...", { duration: 2000 });
      const workbook = generateExcelFile(blingFormattedAds);
      
      // Nome do arquivo
      const fileName = `anuncios_premium_${product.sku}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Download
      const success = downloadExcelFile(workbook, fileName);
      
      if (success) {
        toast.success(
          `🎉 Planilha Premium exportada! ${previewAds.length} anúncios criados para ${product.nome}`,
          { duration: 5000 }
        );
        
        console.log("✅ SUCESSO - Planilha Premium exportada:", {
          produto: product.nome,
          anuncios: previewAds.length,
          arquivo: fileName
        });
        
        setShowPreview(false);
      }
      
    } catch (error) {
      console.error("❌ ERRO CRÍTICO - Download Premium:", error);
      toast.error(`Erro ao baixar planilha: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDownloadWEBC = async () => {
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        toast.error("Usuário não autenticado");
        return;
      }

      toast.info("Gerando planilha WEBC...", { duration: 2000 });

      // Buscar Tópicos de Conversão salvos no banco (sem emojis)
      let topicsText = await fetchFormattedConversionTopics(product.id, user.id);
      const stripEmojis = (s: string) => (s || '').replace(/\p{Extended_Pictographic}/gu, '');
      if (!topicsText) {
        console.warn("⚠️ Tópicos de Conversão não encontrados. Usando descrição do anúncio sem emojis.");
      }

      // Forçar a coluna "Descrição" a usar os Tópicos de Conversão (sem emojis)
      const adsForWebc = previewAds.map((ad: PremiumAdProduct) => ({
        ...ad,
        descricao: topicsText ? topicsText : stripEmojis(ad.descricao || '')
      }));
      
      const workbook = generateWebcExcelFile(adsForWebc);
      
      const fileName = `anuncios_premium_webc_${product.sku}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      const success = downloadWebcExcelFile(workbook, fileName);
      
      if (success) {
        toast.success(
          `🎉 Planilha WEBC exportada! ${previewAds.length} anúncios criados para ${product.nome}`,
          { duration: 5000 }
        );
        
        console.log("✅ SUCESSO - Planilha WEBC exportada:", {
          produto: product.nome,
          anuncios: previewAds.length,
          arquivo: fileName
        });
        
        setShowPreview(false);
      }
      
    } catch (error: any) {
      console.error("❌ ERRO CRÍTICO - Download WEBC:", error);
      toast.error(`Erro ao baixar planilha WEBC: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handlePreview}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-yellow-50 border-purple-200 hover:from-purple-100 hover:to-yellow-100 transition-all duration-200"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-purple-700 font-medium">Gerando...</span>
          </>
        ) : (
          <>
            <Crown className="w-4 h-4 text-purple-600" />
            <span className="text-purple-700 font-medium">Planilha de 20 Anúncios Premium</span>
          </>
        )}
      </Button>
      
      <PremiumAdsPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onConfirmDownload={handleConfirmDownload}
        onConfirmDownloadWEBC={handleConfirmDownloadWEBC}
        ads={previewAds}
        isDownloading={isLoading}
        productName={product.nome}
      />

      {savedAds.length > 0 && (
        <PremiumAdsDisplayBlock
          ads={savedAds}
          onClearAds={() => {
            setSavedAds([]);
            setAdsReport(undefined);
            // Limpar também do localStorage
            const storageKey = `premium-ads-${product.id}`;
            const reportKey = `premium-ads-report-${product.id}`;
            localStorage.removeItem(storageKey);
            localStorage.removeItem(reportKey);
            console.log('🗑️ Anúncios e relatório removidos do localStorage');
          }}
          onDownloadSpreadsheet={handleConfirmDownload}
          onDownloadWebcSpreadsheet={handleConfirmDownloadWEBC}
          productName={product.nome}
          report={adsReport}
        />
      )}
    </div>
  );
};