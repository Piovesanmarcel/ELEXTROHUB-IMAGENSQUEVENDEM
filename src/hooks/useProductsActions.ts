
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Product, syncProducts } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";

export function useProductsActions() {
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    message?: string; 
    finished?: boolean; 
    currentStep?: number; 
    totalSteps?: number;
  }>({});

  const handleSync = async (forceResync: boolean = false, forceAll: boolean = false) => {
    setIsSyncing(true);
    setSyncProgress({ message: "Iniciando sincronização...", finished: false });

    try {
      console.log("🚀 INICIANDO SINCRONIZAÇÃO DE PRODUTOS DO BLING");
      
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session) {
        console.error("❌ Erro de autenticação:", authError);
        toast.error("Usuário não autenticado. Faça login novamente.");
        return false;
      }

      console.log("✅ Usuário autenticado:", session.user.id);

      // Se forceAll = true, fazer sincronização completa de uma vez
      if (forceAll) {
        console.log("🔄 Executando sincronização COMPLETA");
        setSyncProgress({ message: "Executando sincronização completa...", finished: false });
        
        const { data: result, error } = await supabase.functions.invoke('sincronizar-produtos', {
          body: { 
            force_complete_sync: true,
            manual_trigger: true
          },
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        });

        if (error) {
          console.error("❌ Erro na sincronização completa:", error);
          toast.error(`Erro na sincronização: ${error.message}`);
          return false;
        }

        if (result && result.success) {
          toast.success(`✅ Sincronização completa: ${result.summary?.totalProducts || 0} produtos`);
          setSyncProgress({ 
            message: `Sincronização completa finalizada: ${result.summary?.totalProducts || 0} produtos`,
            finished: true 
          });
          return true;
        }
      }

      // Sincronização incremental (padrão)
      console.log("🔄 Executando sincronização incremental");
      
      let totalProcessed = 0;
      let maxAttempts = 100; // Limite de tentativas
      let attempt = 0;
      let hasMore = true;
      
      while (hasMore && attempt < maxAttempts) {
        attempt++;
        
        setSyncProgress({
          message: `Processando lote ${attempt}... (${totalProcessed} produtos processados)`,
          currentStep: attempt,
          totalSteps: maxAttempts
        });

        console.log(`📦 Tentativa ${attempt}: Chamando sincronização incremental`);

        const { data: result, error } = await supabase.functions.invoke('sincronizar-produtos', {
          body: { 
            manual_trigger: true
          },
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        });

        if (error) {
          console.error(`❌ Erro na tentativa ${attempt}:`, error);
          
          // Se for erro de token, parar
          if (error.message?.includes('token') || error.message?.includes('401')) {
            toast.error("Erro de autenticação com o Bling. Reconecte sua conta.");
            break;
          }
          
          // Outros erros: tentar algumas vezes mais
          if (attempt >= 3) {
            toast.error(`Erro na sincronização: ${error.message}`);
            break;
          }
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }

        if (result) {
          console.log(`✅ Resultado da tentativa ${attempt}:`, result);
          
          if (result.productsInPage > 0) {
            totalProcessed += result.productsInPage;
          }
          
          hasMore = result.hasMore === true && !result.finished;
          
          if (result.finished) {
            console.log("🎉 Sincronização finalizada pelo backend");
            break;
          }
        } else {
          console.log("⚠️ Resposta vazia, parando sincronização");
          break;
        }
        
        // Pausa entre chamadas
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Verificar quantos produtos foram sincronizados
      const { count: finalCount } = await supabase
        .from('produtos')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', session.user.id);
      
      console.log(`📊 RESULTADO FINAL: ${finalCount} produtos na base`);
      
      setSyncProgress({
        finished: true,
        message: `Sincronização concluída! ${finalCount} produtos na base de dados`
      });
      
      if (finalCount && finalCount > 0) {
        toast.success(`🎉 Sincronização concluída! ${finalCount} produtos sincronizados.`);
      } else {
        toast.warning("⚠️ Nenhum produto foi sincronizado. Verifique sua conexão com o Bling.");
      }
      
      return true;
      
    } catch (error) {
      console.error("💥 ERRO GERAL NA SINCRONIZAÇÃO:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      
      if (errorMessage.includes("token") || errorMessage.includes('401')) {
        toast.error("❌ Problema de autenticação com o Bling. Reconecte sua conta.");
      } else {
        toast.error(`❌ Erro na sincronização: ${errorMessage}`);
      }
      
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    navigate(`/produtos/${product.id}`);
  };

  const handleViewProduct = (product: Product) => {
    navigate(`/produtos/${product.id}`);
  };

  return {
    isSyncing,
    syncProgress,
    handleSync,
    handleEditProduct,
    handleViewProduct
  };
}
