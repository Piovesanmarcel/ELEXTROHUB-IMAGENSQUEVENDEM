import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Product } from "@/lib/supabase";

interface DownloadFilteredProductsButtonProps {
  products: Product[];
  filterLabel?: string;
}

export function DownloadFilteredProductsButton({
  products,
  filterLabel = "filtrados"
}: DownloadFilteredProductsButtonProps) {
  
  const handleDownload = () => {
    if (products.length === 0) {
      toast.error("Nenhum produto para exportar");
      return;
    }

    try {
      // Preparar dados para exportação
      const exportData = products.map(product => ({
        sku: product.sku || "",
        sku_pai: product.sku_pai || "",
        tipo_produto: product.tipo_produto || "simples",
        nome: product.nome || "",
        marca: product.marca || "",
        categoria: product.categoria || "",
        estoque: product.estoque || 0,
        preco: product.preco || 0,
        preco_custo: product.preco_custo || 0,
        gtin: product.gtin || "",
        descricao: product.descricao || "",
        descricao_curta: product.descricao_curta || "",
        situacao: product.situacao || "",
        altura: product.altura || 0,
        largura: product.largura || 0,
        profundidade: product.profundidade || 0,
        peso_bruto: product.peso_bruto || 0,
        unidade: product.unidade || "",
        imagem_url: product.imagem_url || "",
        imagem_url_2: product.imagem_url_2 || "",
        imagem_url_3: product.imagem_url_3 || "",
        imagem_url_4: product.imagem_url_4 || "",
        imagem_url_5: product.imagem_url_5 || "",
        imagem_url_6: product.imagem_url_6 || "",
        imagem_url_7: product.imagem_url_7 || "",
        imagem_url_8: product.imagem_url_8 || "",
        imagem_url_9: product.imagem_url_9 || "",
        imagem_url_10: product.imagem_url_10 || "",
      }));

      // Criar worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Definir largura das colunas
      const columnWidths = [
        { wch: 15 }, // sku
        { wch: 15 }, // sku_pai
        { wch: 12 }, // tipo_produto
        { wch: 50 }, // nome
        { wch: 20 }, // marca
        { wch: 20 }, // categoria
        { wch: 10 }, // estoque
        { wch: 10 }, // preco
        { wch: 10 }, // preco_custo
        { wch: 15 }, // gtin
        { wch: 60 }, // descricao
        { wch: 40 }, // descricao_curta
        { wch: 10 }, // situacao
        { wch: 8 },  // altura
        { wch: 8 },  // largura
        { wch: 10 }, // profundidade
        { wch: 10 }, // peso_bruto
        { wch: 8 },  // unidade
        { wch: 50 }, // imagem_url
        { wch: 50 }, // imagem_url_2
        { wch: 50 }, // imagem_url_3
        { wch: 50 }, // imagem_url_4
        { wch: 50 }, // imagem_url_5
        { wch: 50 }, // imagem_url_6
        { wch: 50 }, // imagem_url_7
        { wch: 50 }, // imagem_url_8
        { wch: 50 }, // imagem_url_9
        { wch: 50 }, // imagem_url_10
      ];
      worksheet['!cols'] = columnWidths;

      // Criar workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Produtos Filtrados");

      // Gerar nome do arquivo com timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `produtos_${filterLabel}_${timestamp}.xlsx`;

      // Download
      XLSX.writeFile(workbook, fileName);

      toast.success(`${products.length} produtos exportados com sucesso!`);
    } catch (error) {
      console.error("Erro ao exportar produtos:", error);
      toast.error("Erro ao exportar produtos");
    }
  };

  return (
    <Button
      onClick={handleDownload}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
      disabled={products.length === 0}
    >
      <Download className="w-4 h-4" />
      Baixar Filtrados ({products.length})
    </Button>
  );
}
