
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SyncLog {
  id: string;
  usuario_id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  products_synced: number;
  error_message: string | null;
  created_at: string;
}

export const useAutoSync = () => {
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncLogs, setLastSyncLogs] = useState<SyncLog[]>([]);

  // Carregar configuração atual
  useEffect(() => {
    loadAutoSyncConfig();
    loadSyncLogs();
  }, []);

  const loadAutoSyncConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from('usuarios')
        .select('sync_automatica')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erro ao carregar configuração de sync automático:', error);
        return;
      }

      setIsAutoSyncEnabled(data?.sync_automatica || false);
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSyncLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from('sync_schedule_logs')
        .select('*')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Erro ao carregar logs de sincronização:', error);
        return;
      }

      setLastSyncLogs(data || []);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    }
  };

  const toggleAutoSync = async (enabled: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return false;
      }

      const { error } = await (supabase as any)
        .from('usuarios')
        .update({ sync_automatica: enabled })
        .eq('id', user.id);

      if (error) {
        console.error('Erro ao atualizar configuração:', error);
        toast.error('Erro ao alterar configuração de sincronização automática');
        return false;
      }

      setIsAutoSyncEnabled(enabled);
      toast.success(`Sincronização automática ${enabled ? 'ativada' : 'desativada'}`);
      
      if (enabled) {
        toast.info('A sincronização automática será executada a cada hora', {
          description: 'Novos produtos do Bling serão sincronizados automaticamente'
        });
      }

      return true;
    } catch (error) {
      console.error('Erro ao alterar configuração:', error);
      toast.error('Erro ao alterar sincronização automática');
      return false;
    }
  };

  const triggerManualSync = async () => {
    try {
      toast.info('Iniciando sincronização manual...');
      
      const { data, error } = await supabase.functions.invoke('sincronizar-produtos', {
        body: { manual_trigger: true }
      });

      if (error) {
        console.error('Erro na sincronização manual:', error);
        toast.error('Erro na sincronização manual');
        return false;
      }

      toast.success('Sincronização manual iniciada com sucesso!');
      
      // Recarregar logs após alguns segundos
      setTimeout(() => {
        loadSyncLogs();
      }, 3000);
      
      return true;
    } catch (error) {
      console.error('Erro na sincronização manual:', error);
      toast.error('Erro na sincronização manual');
      return false;
    }
  };

  return {
    isAutoSyncEnabled,
    isLoading,
    lastSyncLogs,
    toggleAutoSync,
    triggerManualSync,
    loadSyncLogs
  };
};
