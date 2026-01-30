
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { Order } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface UpdateCurrentPageOrdersButtonProps {
  orders: Order[];
  onOrdersUpdated?: () => void;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
}

export const UpdateCurrentPageOrdersButton = ({ 
  orders, 
  onOrdersUpdated,
  size = "default",
  variant = "default"
}: UpdateCurrentPageOrdersButtonProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleUpdateAllOrders = async () => {
    // Filtrar apenas pedidos que têm bling_id
    const ordersWithBlingId = orders.filter(order => order.bling_id);
    
    if (ordersWithBlingId.length === 0) {
      toast.error("Nenhum pedido com ID do Bling encontrado nesta página");
      return;
    }

    setIsUpdating(true);
    setProgress({ current: 0, total: ordersWithBlingId.length });
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Usuário não autenticado");
        return;
      }

      toast.info(`Iniciando atualização de ${ordersWithBlingId.length} pedidos...`);
      
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Processar pedidos sequencialmente com progresso atualizado
      for (let i = 0; i < ordersWithBlingId.length; i++) {
        const order = ordersWithBlingId[i];
        setProgress({ current: i + 1, total: ordersWithBlingId.length });
        
        try {
          console.log(`🔄 Atualizando pedido ${i + 1}/${ordersWithBlingId.length}: ${order.numero}`);
          
          const { data, error } = await supabase.functions.invoke('atualizar-pedido-bling-individual', {
            body: { pedido_id: order.id },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (error) {
            throw new Error(error.message || 'Erro ao atualizar pedido');
          }

          if (data?.error) {
            throw new Error(data.error);
          }

          console.log(`✅ Pedido ${order.numero} atualizado com sucesso`);
          successCount++;
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
          console.error(`❌ Erro ao atualizar pedido ${order.numero}:`, errorMessage);
          errorCount++;
          errors.push(`${order.numero}: ${errorMessage}`);
        }

        // Pequena pausa entre pedidos
        if (i < ordersWithBlingId.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      // Exibir resultado final
      console.log(`📊 Resultado final: ${successCount} sucessos, ${errorCount} falhas`);
      
      if (successCount > 0 && errorCount === 0) {
        toast.success(`🎉 Todos os ${successCount} pedidos foram atualizados com sucesso!`);
        if (onOrdersUpdated) {
          onOrdersUpdated();
        } else {
          window.dispatchEvent(new CustomEvent('orderUpdated'));
        }
      } else if (successCount > 0 && errorCount > 0) {
        toast.success(`✅ ${successCount} pedidos atualizados com sucesso`);
        toast.error(`❌ ${errorCount} pedidos falharam - verifique o console para detalhes`);
        console.group("❌ Pedidos que falharam:");
        errors.forEach(error => console.error(error));
        console.groupEnd();
        
        toast.info("🔄 Lista não recarregada devido às falhas - use sincronização geral");
      } else {
        toast.error(`❌ Falha ao atualizar todos os ${errorCount} pedidos`);
        console.group("❌ Todos os pedidos falharam:");
        errors.forEach(error => console.error(error));
        console.groupEnd();
      }
      
    } catch (error) {
      console.error("💥 Erro geral na atualização em lote:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(`Erro na atualização em lote: ${errorMessage}`);
    } finally {
      setIsUpdating(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const ordersWithBlingId = orders.filter(order => order.bling_id);
  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleUpdateAllOrders}
        disabled={isUpdating || ordersWithBlingId.length === 0}
        variant={variant}
        size={size}
        className="gradient-primary"
      >
        {isUpdating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Atualizando {progress.current}/{progress.total}...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar Página ({ordersWithBlingId.length} pedidos)
          </>
        )}
      </Button>
      
      {isUpdating && progress.total > 0 && (
        <div className="w-full">
          <Progress value={progressPercentage} className="h-2" />
          <div className="text-xs text-muted-foreground mt-1 text-center">
            {progress.current} de {progress.total} pedidos ({Math.round(progressPercentage)}%)
          </div>
        </div>
      )}
    </div>
  );
};
