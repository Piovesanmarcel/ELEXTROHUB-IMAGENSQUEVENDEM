
import { TableHead } from "@/components/ui/table";
import { getMarketplaceColor } from "./utils";

interface TableHeadersProps {
  selectedPricing: 'none' | 'shopee' | 'shein' | 'kwai' | 'amazon' | 'tiktok' | 'loja-virtual';
}

export function TableHeaders({ selectedPricing }: TableHeadersProps) {
  const renderStandardColumns = () => (
    <>
      <TableHead className="bg-slate-50">Preço de Venda</TableHead>
      <TableHead className="bg-slate-50">Preço de Custo</TableHead>
      <TableHead className="bg-slate-50">Marca</TableHead>
    </>
  );

  const renderMarketplaceColumns = () => {
    const color = getMarketplaceColor(selectedPricing);
    const bgClass = `bg-${color}-50`;

    if (selectedPricing === 'loja-virtual') {
      return (
        <>
          <TableHead className="bg-slate-50">Preço de Custo</TableHead>
          <TableHead className="bg-slate-50">Peso (g)</TableHead>
          <TableHead className="bg-purple-50">Preço de Venda</TableHead>
          <TableHead className="bg-purple-50">Lucro Final</TableHead>
          <TableHead className="bg-purple-50">Margem %</TableHead>
          <TableHead className="bg-purple-50">Comissão</TableHead>
          <TableHead className="bg-purple-50">Impostos</TableHead>
        </>
      );
    }

    return (
      <>
        <TableHead className="bg-slate-50">Preço de Custo</TableHead>
        <TableHead className="bg-slate-50">Peso (g)</TableHead>
        <TableHead className={bgClass}>Preço Venda</TableHead>
        <TableHead className={bgClass}>Lucro</TableHead>
        <TableHead className={bgClass}>Margem Real</TableHead>
      </>
    );
  };

  return (
    <>
      <TableHead className="w-16 bg-slate-50">Imagem</TableHead>
      <TableHead className="bg-slate-50">Nome do Produto</TableHead>
      <TableHead className="bg-slate-50">SKU</TableHead>

      {selectedPricing === 'none' && renderStandardColumns()}
      {selectedPricing !== 'none' && renderMarketplaceColumns()}
    </>
  );
}
