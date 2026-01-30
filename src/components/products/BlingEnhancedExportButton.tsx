
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Product, fetchAIResults, filterEligibleProducts } from "@/utils/productFilterUtils";
import { processBlingProducts, generateExcelFile, downloadExcelFile } from "@/utils/blingSpreadsheetUtils";

interface BlingEnhancedExportButtonProps {
  products: Product[];
}

export const BlingEnhancedExportButton = ({ products }: BlingEnhancedExportButtonProps) => {
  const handleExport = async () => {
    console.log("🚀 INÍCIO DO PROCESSO DE EXPORTAÇÃO MELHORADA");
    console.log(`📊 Produtos recebidos: ${products?.length || 0}`);
    
    try {
      // Verificação inicial
      if (!products || products.length === 0) {
        console.error("❌ ERRO: Nenhum produto disponível");
        toast.error("Nenhum produto disponível para exportar");
        return;
      }

      console.log("✅ Produtos validados, iniciando processamento...");
      toast.info("Preparando planilha melhorada...", { duration: 3000 });

      // Buscar resultados de AI
      const { aiResultsMap, resultsCount } = await fetchAIResults();
      console.log(`📝 Encontrados ${resultsCount} resultados de AI`);

      // Filtrar produtos elegíveis
      const eligibleProducts = filterEligibleProducts(products, aiResultsMap);

      if (eligibleProducts.length === 0) {
        toast.error("Nenhum produto encontrado com imagens melhoradas E comando unificado (5 em 1) salvos");
        return;
      }

      // Processar produtos elegíveis
      const blingEnhancedProducts = processBlingProducts(eligibleProducts, aiResultsMap);
      console.log(`📊 Total de produtos processados: ${blingEnhancedProducts.length}`);

      if (blingEnhancedProducts.length === 0) {
        console.error("❌ Nenhum produto foi processado");
        toast.error("Nenhum produto foi processado com sucesso");
        return;
      }

      // Gerar arquivo Excel
      const workbook = generateExcelFile(blingEnhancedProducts);
      
      // Gerar nome do arquivo
      const fileName = `produtos_bling_melhorados_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Fazer download
      const success = downloadExcelFile(workbook, fileName);
      
      if (success) {
        toast.success(`Planilha melhorada exportada com ${blingEnhancedProducts.length} produtos!`);
      }
      
    } catch (error) {
      console.error("❌ ERRO CRÍTICO GERAL:", error);
      toast.error(`Erro crítico ao exportar: ${error?.message || 'Erro desconhecido'}`);
    }
  };

  return (
    <Button
      onClick={handleExport}
      variant="outline"
      size="sm"
      className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:from-purple-100 hover:to-blue-100"
    >
      <Download className="w-4 h-4 text-purple-600" />
      <span className="text-purple-700 font-medium">Planilha Bling Melhorada</span>
    </Button>
  );
};
