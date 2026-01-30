
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/lib/supabase";

export function useAutoUpdateNABrands(allProducts: Product[]) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatedCount, setUpdatedCount] = useState(0);

  useEffect(() => {
    const updateNABrandProducts = async () => {
      // Filtrar produtos com marca "N/A"
      const naBrandProducts = allProducts.filter(
        product => product.marca === "N/A" || product.marca === null || product.marca === ""
      );

      if (naBrandProducts.length === 0) {
        return;
      }

      console.log(`🔄 Encontrados ${naBrandProducts.length} produtos com marca N/A para atualizar automaticamente`);
      setIsUpdating(true);

      let successCount = 0;

      for (const product of naBrandProducts) {
        try {
          console.log(`📦 Atualizando produto automaticamente: ${product.sku} (ID: ${product.id})`);
          
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session) {
            console.warn("⚠️ Usuário não autenticado para atualização automática");
            break;
          }

          // Chamar a edge function para atualizar o produto individual do Bling
          const { data, error } = await supabase.functions.invoke('atualizar-produto-bling-individual', {
            body: { produto_id: product.id },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (error) {
            console.error(`❌ Erro ao atualizar produto ${product.sku}:`, error);
            continue;
          }

          if (data.error) {
            console.error(`❌ Erro na resposta para produto ${product.sku}:`, data.error);
            continue;
          }

          console.log(`✅ Produto ${product.sku} atualizado automaticamente`);
          successCount++;
          
          // Pequena pausa entre atualizações para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`💥 Erro inesperado ao atualizar produto ${product.sku}:`, error);
        }
      }

      setUpdatedCount(successCount);
      setIsUpdating(false);
      
      if (successCount > 0) {
        console.log(`🎉 Atualização automática concluída: ${successCount}/${naBrandProducts.length} produtos atualizados`);
        
        // Disparar evento para recarregar a lista de produtos
        window.dispatchEvent(new CustomEvent('productUpdated'));
      }
    };

    // Executar apenas se há produtos e não está já atualizando
    if (allProducts.length > 0 && !isUpdating) {
      // Delay de 2 segundos após carregar os produtos para executar a atualização
      const timeoutId = setTimeout(updateNABrandProducts, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [allProducts, isUpdating]);

  return {
    isUpdating,
    updatedCount
  };
}
