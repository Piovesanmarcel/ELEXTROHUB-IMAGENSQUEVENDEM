
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface Product {
  id: string;
  sku: string;
  nome: string;
  unidade?: string;
  preco?: number;
  situacao?: string;
  estoque?: number;
  preco_custo?: number;
  peso_bruto?: number;
  gtin?: string;
  largura?: number;
  altura?: number;
  profundidade?: number;
  descricao?: string;
  descricao_curta?: string;
  marca?: string;
  categoria?: string;
  bling_id?: string;
  codigo_fornecedor?: string;
  nome_fornecedor?: string;
  imagem_url?: string;
  imagem_url_2?: string;
  imagem_url_3?: string;
  imagem_url_4?: string;
  imagem_url_5?: string;
  imagem_url_6?: string;
  imagem_url_7?: string;
  imagem_url_8?: string;
  imagem_url_9?: string;
  imagem_url_10?: string;
}

interface BlingExportButtonProps {
  products: Product[];
}

export const BlingExportButton = ({ products }: BlingExportButtonProps) => {
  const formatProductForBling = (product: Product) => {
    // Compilar URLs de imagens externas no formato do Bling (separadas por |)
    const imageUrls = [
      product.imagem_url,
      product.imagem_url_2,
      product.imagem_url_3,
      product.imagem_url_4,
      product.imagem_url_5,
      product.imagem_url_6,
      product.imagem_url_7,
      product.imagem_url_8,
      product.imagem_url_9,
      product.imagem_url_10,
    ].filter(url => url && url.trim()).join('|');

    return {
      'ID': product.bling_id || '',
      'Código': product.sku || '',
      'Descrição': product.nome || '',
      'Unidade': product.unidade || 'UN',
      'NCM': '', // Não temos essa informação
      'Origem': '0', // Valor padrão
      'Preço': product.preco || 0,
      'Valor IPI fixo': 0, // Valor padrão
      'Observações': '', // Vazio por padrão
      'Situação': 'Ativo', // Sempre "Ativo"
      'Estoque': product.estoque || 0,
      'Preço de custo': product.preco_custo || 0,
      'Cód. no fornecedor': product.codigo_fornecedor || '',
      'Fornecedor': product.nome_fornecedor || '',
      'Localização': '', // Vazio por padrão
      'Estoque máximo': 0, // Valor padrão
      'Estoque mínimo': 0, // Valor padrão
      'Peso líquido (Kg)': 0, // Valor padrão
      'Peso bruto (Kg)': product.peso_bruto || 0,
      'GTIN/EAN': product.gtin || '',
      'GTIN/EAN da Embalagem': product.gtin || '',
      'Largura do produto': product.largura || 0,
      'Altura do Produto': product.altura || 0,
      'Profundidade do produto': product.profundidade || 0,
      'Data Validade': '', // Vazio por padrão
      'Descrição do Produto no Fornecedor': '', // Vazio por padrão
      'Descrição Complementar': product.descricao || '',
      'Itens p/ caixa': 0, // Valor padrão
      'Produto Variação': 'Variação', // Valor padrão
      'Tipo Produção': 'Própria', // Valor padrão
      'Classe de enquadramento do IPI': '', // Vazio por padrão
      'Código na Lista de Serviços': '', // Vazio por padrão
      'Tipo do item': '', // Vazio por padrão
      'Grupo de Tags/Tags': product.categoria || '',
      'Tributos': '', // Vazio por padrão
      'Código Pai': 0, // Valor padrão
      'Código Integração': '', // Vazio por padrão
      'Grupo de produtos': 0, // Valor padrão
      'Marca': product.marca || '',
      'CEST': '', // Vazio por padrão
      'Volumes': 1, // Valor padrão
      'Descrição Curta': product.descricao_curta || '',
      'Cross-Docking': 0, // Valor padrão
      'URL Imagens Externas': imageUrls,
      'Link Externo': '', // Vazio por padrão
      'Meses Garantia no Fornecedor': 0, // Valor padrão
      'Clonar dados do pai': 'NÃO', // Valor padrão
      'Condição do Produto': 'NOVO', // Valor padrão
      'Frete Grátis': 'NÃO', // Valor padrão
      'Número FCI': '', // Vazio por padrão
      'Vídeo': '', // Vazio por padrão
      'Departamento': '', // Vazio por padrão
      'Unidade de Medida': 'Centímetro', // Valor padrão
      'Preço de Compra': product.preco_custo || 0,
      'Valor base ICMS ST para retenção': 0, // Valor padrão
      'Valor ICMS ST para retenção': 0, // Valor padrão
      'Valor ICMS próprio do substituto': 0, // Valor padrão
    };
  };

  const handleExport = () => {
    try {
      if (!products || products.length === 0) {
        toast.error("Nenhum produto disponível para exportar");
        return;
      }

      // Converter produtos para o formato do Bling
      const blingFormattedProducts = products.map(formatProductForBling);

      // Criar workbook e worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(blingFormattedProducts);

      // Adicionar a planilha ao workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Produtos Bling");

      // Gerar e baixar o arquivo
      const fileName = `produtos_bling_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success(`Planilha exportada com ${products.length} produtos!`);
    } catch (error) {
      console.error("Erro ao exportar planilha:", error);
      toast.error("Erro ao exportar planilha");
    }
  };

  return (
    <Button
      onClick={handleExport}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <Download className="w-4 h-4" />
      Planilha Bling
    </Button>
  );
};
