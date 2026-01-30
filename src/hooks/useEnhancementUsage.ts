
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EnhancementUsage {
  id: string;
  user_id: string;
  enhancements_used: number;
  enhancements_available: number;
  created_at: string;
  updated_at: string;
}

export const useEnhancementUsage = () => {
  const [usage, setUsage] = useState<EnhancementUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setUsage(null);
        return;
      }

      // Fonte única de créditos: tabela user_credits (já existe no backend)
      const { data, error } = await supabase
        .from("user_credits")
        .select("id, user_id, credits_balance, credits_used, created_at, updated_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar créditos:", error);
        toast.error("Erro ao carregar informações de créditos");
        return;
      }

      // Se não existe registro, criar um novo (0 créditos - sem bônus grátis)
      if (!data) {
        const { data: newRow, error: insertError } = await supabase
          .from("user_credits")
          .insert({
            user_id: user.id,
            credits_balance: 0,
            credits_used: 0,
          })
          .select("id, user_id, credits_balance, credits_used, created_at, updated_at")
          .maybeSingle();

        if (insertError) {
          console.error("Erro ao criar registro de créditos:", insertError);
          toast.error("Erro ao inicializar sistema de créditos");
          return;
        }

        if (!newRow) {
          toast.error("Erro ao inicializar sistema de créditos");
          return;
        }

        setUsage({
          id: newRow.id,
          user_id: newRow.user_id,
          enhancements_used: newRow.credits_used,
          enhancements_available: newRow.credits_balance,
          created_at: newRow.created_at,
          updated_at: newRow.updated_at,
        });
        return;
      }

      setUsage({
        id: data.id,
        user_id: data.user_id,
        enhancements_used: data.credits_used,
        enhancements_available: data.credits_balance,
        created_at: data.created_at,
        updated_at: data.updated_at,
      });
    } catch (err) {
      console.error("Erro inesperado ao carregar créditos:", err);
      toast.error("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  const useEnhancementCredit = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Usuário não autenticado");
        return false;
      }

      // Debita 1 crédito de forma segura no backend
      // SEGURO: auth.uid() é extraído do JWT no backend, não enviamos user_id
      const { data, error } = await supabase.rpc("debit_generation_credit", {
        p_amount: 1,
      });

      if (error) {
        console.error("Erro ao debitar crédito:", error);
        toast.error("Erro ao processar crédito");
        return false;
      }

      if (data) {
        await fetchUsage();
        return true;
      }

      toast.error("Créditos esgotados! Compre mais créditos para continuar.", {
        duration: 8000,
      });
      return false;
    } catch (err) {
      console.error("Erro inesperado ao debitar crédito:", err);
      toast.error("Erro interno ao processar crédito");
      return false;
    }
  };

  useEffect(() => {
    let channel: import("@supabase/supabase-js").RealtimeChannel;

    const setupRealtime = async () => {
      // Initial fetch
      await fetchUsage();

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        channel = supabase
          .channel('schema-db-changes')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'user_credits',
              filter: `user_id=eq.${user.id}`,
            },
            (payload: any) => {
              console.log('Realtime update received:', payload);
              if (payload.new) {
                setUsage((prev) => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    enhancements_used: payload.new.credits_used,
                    enhancements_available: payload.new.credits_balance,
                    updated_at: payload.new.updated_at,
                  };
                });
              }
            }
          )
          .subscribe();
      }
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    usage,
    isLoading,
    refetchUsage: fetchUsage,
    useEnhancementCredit,
  };
};
