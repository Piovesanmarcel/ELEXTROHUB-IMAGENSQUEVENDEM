import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";

interface GroupingResult {
  success: boolean;
  productsGrouped: number;
  groupsCreated: number;
  errors: string[];
  details: {
    parentsCreated: number;
    variationsLinked: number;
    inconsistenciesFixed: number;
  };
}

export const AutoGroup3CliquesButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAutoGroup = async () => {
    try {
      setIsLoading(true);
      
      toast.info("Iniciando agrupamento automático...", {
        description: "Analisando padrões de nomes dos produtos 3Cliques"
      });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão não encontrada");
        return;
      }

      const response = await supabase.functions.invoke('auto-group-3cliques', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw response.error;
      }

      const result = response.data as GroupingResult;

      if (result.success) {
        toast.success("Agrupamento concluído com sucesso!", {
          description: `${result.productsGrouped} produtos organizados em ${result.groupsCreated} grupos`,
          duration: 5000
        });

        // Mostrar detalhes
        setTimeout(() => {
          toast.info("Detalhes do agrupamento:", {
            description: `${result.details.parentsCreated} produtos pai criados, ${result.details.variationsLinked} variações vinculadas`,
            duration: 8000
          });
        }, 1000);

        // Recarregar página após 3 segundos
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        toast.error("Agrupamento falhou", {
          description: result.errors.join(', ') || "Erro desconhecido"
        });
      }

    } catch (error) {
      console.error('Erro ao agrupar produtos:', error);
      toast.error("Erro ao executar agrupamento", {
        description: error instanceof Error ? error.message : "Erro desconhecido"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleAutoGroup}
      disabled={isLoading}
      variant="default"
      size="sm"
      className="gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Agrupando...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          Auto-Agrupar 3Cliques
        </>
      )}
    </Button>
  );
};
