import { useEffect, useState } from "react";
import { OrderItem, fetchOrderItemsByOrderNumber } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, AlertCircle } from "lucide-react";

interface OrderItemsTableProps {
  orderNumber: string; // Recebe o número do pedido do Bling
}

export const OrderItemsTable = ({ orderNumber }: OrderItemsTableProps) => {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>("");

  useEffect(() => {
    const loadItems = async () => {
      setIsLoading(true);
      setDebugInfo(`Carregando itens para pedido: ${orderNumber} (SEM #)`);
      
      try {
        console.log('🔍 OrderItemsTable: Carregando itens para pedido número (sem #):', orderNumber);
        const orderItems = await fetchOrderItemsByOrderNumber(orderNumber);
        
        console.log('🔍 OrderItemsTable: Itens recebidos:', orderItems);
        setItems(orderItems);
        
        if (orderItems.length === 0) {
          setDebugInfo(`❌ NENHUM ITEM ENCONTRADO para pedido ${orderNumber}. Buscando pelo número exato sem # prefixo.`);
        } else {
          setDebugInfo(`✅ ${orderItems.length} itens carregados para pedido ${orderNumber}`);
        }
      } catch (error) {
        console.error("❌ OrderItemsTable: Erro ao carregar itens:", error);
        setDebugInfo(`Erro ao carregar itens: ${error}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (orderNumber) {
      loadItems();
    }
  }, [orderNumber]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Package className="h-6 w-6 animate-spin mr-2" />
        <div>
          <span className="block">Carregando itens...</span>
          <span className="text-xs text-muted-foreground">{debugInfo}</span>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <div className="space-y-2">
          <p className="font-semibold text-red-600">❌ NENHUM ITEM ENCONTRADO</p>
          <p className="text-sm text-muted-foreground">Pedido: {orderNumber} (sem # prefixo)</p>
          <p className="text-xs text-muted-foreground bg-red-50 p-2 rounded border border-red-200">
            {debugInfo}
          </p>
          <p className="text-xs text-muted-foreground">
            ⚠️ Verifique se o pedido {orderNumber} existe e possui itens na tabela pedidos_itens
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 text-xs text-muted-foreground bg-green-50 p-2 rounded border border-green-200">
        ✅ {debugInfo}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU/Código</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-center">Qtd</TableHead>
            <TableHead className="text-right">Preço Unit.</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                {item.sku && item.sku.trim() !== '' ? (
                  <Badge variant="outline" className="font-mono text-xs">
                    {item.sku}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm italic">Sem SKU</span>
                )}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{item.descricao}</div>
                  {item.produto && (
                    <div className="text-sm text-muted-foreground">
                      Produto: {item.produto.nome}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center font-medium">
                {item.quantidade}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatPrice(item.preco_unitario)}
              </TableCell>
              <TableCell className="text-right font-bold">
                {formatPrice(item.preco_total)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
