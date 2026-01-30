
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { Product } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface UpdateCurrentPageButtonProps {
  products: Product[];
  onProductsUpdated?: () => void;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
}

export const UpdateCurrentPageButton = ({ 
  products, 
  onProductsUpdated,
  size = "default",
  variant = "default"
}: UpdateCurrentPageButtonProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleUpdateAllProducts = async () => {
    // Filtrar apenas produtos que têm bling_id
    const productsWithBlingId = products.filter(product => product.bling_id);
    
    if (productsWithBlingId.length === 0) {
      toast.error("Nenhum produto com ID do Bling encontrado nesta página");
      return;
    }

    setIsUpdating(true);
    setProgress({ current: 0, total: productsWithBlingId.length });
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Usuário não autenticado");
        return;
      }

      toast.info(`Iniciando atualização de ${productsWithBlingId.length} produtos...`);
      
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Processar produtos em lotes menores para melhor controle
      const batchSize = 2; // Reduzido para evitar sobrecarga
      for (let i = 0; i < productsWithBlingId.length; i += batchSize) {
        const batch = productsWithBlingId.slice(i, i + batchSize);
        
        // Processar batch sequencialmente para melhor controle de erros
        for (let j = 0; j < batch.length; j++) {
          const product = batch[j];
          const currentIndex = i + j + 1;
          setProgress({ current: currentIndex, total: productsWithBlingId.length });
          
          try {
            console.log(`🔄 Atualizando produto ${currentIndex}/${productsWithBlingId.length}: ${product.nome}`);
            
            const { data, error } = await supabase.functions.invoke('atualizar-produto-bling-individual', {
              body: { produto_id: product.id },
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            });

            if (error) {
              throw new Error(error.message || 'Erro ao atualizar produto');
            }

            if (data?.error) {
              throw new Error(data.error);
            }

            console.log(`✅ Produto ${product.nome} atualizado com sucesso`);
            successCount++;
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
            console.error(`❌ Erro ao atualizar produto ${product.nome}:`, errorMessage);
            errorCount++;
            errors.push(`${product.nome}: ${errorMessage}`);
          }

          // Pequena pausa entre produtos para não sobrecarregar
          if (currentIndex < productsWithBlingId.length) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
      }

      // Exibir resultado final com mais detalhes
      console.log(`📊 Resultado final: ${successCount} sucessos, ${errorCount} falhas`);
      
      if (successCount > 0 && errorCount === 0) {
        toast.success(`🎉 Todos os ${successCount} produtos foram atualizados com sucesso!`);
        // Só atualiza a lista se TODOS foram bem-sucedidos
        if (onProductsUpdated) {
          onProductsUpdated();
        } else {
          window.dispatchEvent(new CustomEvent('productUpdated'));
        }
      } else if (successCount > 0 && errorCount > 0) {
        toast.success(`✅ ${successCount} produtos atualizados com sucesso`);
        toast.error(`❌ ${errorCount} produtos falharam - verifique o console para detalhes`);
        console.group("❌ Produtos que falharam:");
        errors.forEach(error => console.error(error));
        console.groupEnd();
        
        // NÃO atualiza a lista quando há falhas para evitar que produtos "sumam"
        toast.info("🔄 Lista não recarregada devido às falhas - use atualização individual nos produtos com erro");
      } else {
        toast.error(`❌ Falha ao atualizar todos os ${errorCount} produtos`);
        console.group("❌ Todos os produtos falharam:");
        errors.forEach(error => console.error(error));
        console.groupEnd();
        
        // NÃO atualiza a lista quando todos falharam
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

  const productsWithBlingId = products.filter(product => product.bling_id);
  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleUpdateAllProducts}
        disabled={isUpdating || productsWithBlingId.length === 0}
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
            Atualizar Página ({productsWithBlingId.length} produtos)
          </>
        )}
      </Button>
      
      {isUpdating && progress.total > 0 && (
        <div className="w-full">
          <Progress value={progressPercentage} className="h-2" />
          <div className="text-xs text-muted-foreground mt-1 text-center">
            {progress.current} de {progress.total} produtos ({Math.round(progressPercentage)}%)
          </div>
        </div>
      )}
    </div>
  );
};
