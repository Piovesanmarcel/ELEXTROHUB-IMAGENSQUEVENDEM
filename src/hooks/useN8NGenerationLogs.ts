import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface N8NGenerationLog {
  id?: string;
  user_id: string;
  product_name: string;
  webhook_url: string;
  scene_type: string;
  status: 'pending' | 'processing' | 'success' | 'error' | 'retrying';
  attempts: number;
  error_message?: string;
  request_payload?: Record<string, any>;
  response_data?: Record<string, any>;
  image_url?: string;
  duration_ms?: number;
  n8n_node_config?: Record<string, any>;
  created_at?: string;
}

export interface LogFilters {
  status?: string;
  scene_type?: string;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export const useN8NGenerationLogs = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<N8NGenerationLog[]>([]);

  const saveLog = useCallback(async (log: Omit<N8NGenerationLog, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('n8n_generation_logs')
        .insert({
          user_id: log.user_id,
          product_name: log.product_name,
          webhook_url: log.webhook_url,
          scene_type: log.scene_type,
          status: log.status,
          attempts: log.attempts,
          error_message: log.error_message,
          request_payload: log.request_payload,
          response_data: log.response_data,
          image_url: log.image_url,
          duration_ms: log.duration_ms,
          n8n_node_config: log.n8n_node_config
        })
        .select()
        .single();

      if (error) {
        console.error('[N8N Logs] Erro ao salvar log:', error);
        return null;
      }

      console.log('[N8N Logs] Log salvo:', data?.id);
      return data;
    } catch (err) {
      console.error('[N8N Logs] Erro:', err);
      return null;
    }
  }, []);

  const updateLog = useCallback(async (
    logId: string, 
    updates: Partial<N8NGenerationLog>
  ) => {
    try {
      const { data, error } = await supabase
        .from('n8n_generation_logs')
        .update({
          status: updates.status,
          attempts: updates.attempts,
          error_message: updates.error_message,
          response_data: updates.response_data,
          image_url: updates.image_url,
          duration_ms: updates.duration_ms
        })
        .eq('id', logId)
        .select()
        .single();

      if (error) {
        console.error('[N8N Logs] Erro ao atualizar log:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('[N8N Logs] Erro:', err);
      return null;
    }
  }, []);

  const getLogs = useCallback(async (filters?: LogFilters) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('n8n_generation_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.scene_type) {
        query = query.eq('scene_type', filters.scene_type);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      } else {
        query = query.limit(100);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[N8N Logs] Erro ao buscar logs:', error);
        return [];
      }

      setLogs(data as N8NGenerationLog[]);
      return data as N8NGenerationLog[];
    } catch (err) {
      console.error('[N8N Logs] Erro:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getSuccessfulConfigs = useCallback(async (sceneType: string) => {
    try {
      const { data, error } = await supabase
        .from('n8n_generation_logs')
        .select('n8n_node_config, webhook_url, created_at')
        .eq('scene_type', sceneType)
        .eq('status', 'success')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('[N8N Logs] Erro ao buscar configs:', error);
        return [];
      }

      return data;
    } catch (err) {
      console.error('[N8N Logs] Erro:', err);
      return [];
    }
  }, []);

  const clearOldLogs = useCallback(async (daysOld: number = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    try {
      const { error } = await supabase
        .from('n8n_generation_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        console.error('[N8N Logs] Erro ao limpar logs antigos:', error);
        return false;
      }

      console.log(`[N8N Logs] Logs mais antigos que ${daysOld} dias removidos`);
      return true;
    } catch (err) {
      console.error('[N8N Logs] Erro:', err);
      return false;
    }
  }, []);

  return {
    logs,
    isLoading,
    saveLog,
    updateLog,
    getLogs,
    getSuccessfulConfigs,
    clearOldLogs
  };
};
