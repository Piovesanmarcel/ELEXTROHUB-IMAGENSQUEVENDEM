
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Order } from "@/lib/supabase";
import { OrderItemsTable } from "./OrderItemsTable";
import { Package, Store, Truck, User, Calendar, DollarSign } from "lucide-react";

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderDetailsModal = ({ order, isOpen, onClose }: OrderDetailsModalProps) => {
  if (!order) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "aprovado":
        return "bg-green-100 text-green-800";
      case "em aberto":
        return "bg-yellow-100 text-yellow-800";
      case "pendente":
        return "bg-yellow-100 text-yellow-800";
      case "cancelado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Detalhes do Pedido #{order.numero}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{order.cliente}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Data do Pedido</p>
                  <p className="font-medium">{formatDate(order.criado_em)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusBadgeClass(order.status)}>
                    {order.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {order.loja && (
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Loja</p>
                    <p className="font-medium">{order.loja}</p>
                  </div>
                </div>
              )}

              {order.canal_venda && (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Canal de Venda</p>
                    <p className="font-medium">{order.canal_venda}</p>
                  </div>
                </div>
              )}

              {order.frete && order.frete > 0 && (
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Frete</p>
                    <p className="font-medium text-orange-600">{formatPrice(order.frete)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Resumo Financeiro */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Total do Pedido:</span>
              <span className="text-2xl font-bold text-primary">
                {formatPrice(order.total)}
              </span>
            </div>
            {order.frete && order.frete > 0 && (
              <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
                <span>Subtotal: {formatPrice(order.total - order.frete)}</span>
                <span>Frete: {formatPrice(order.frete)}</span>
              </div>
            )}
          </div>

          {/* Itens do Pedido */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Itens do Pedido
            </h3>
            <div className="border rounded-lg overflow-hidden">
              {/* Agora passa o número do pedido em vez do ID */}
              <OrderItemsTable orderNumber={order.numero} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
