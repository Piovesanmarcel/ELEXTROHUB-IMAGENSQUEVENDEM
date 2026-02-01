import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface WorkflowStep {
  id: string;
  session_id: string;
  step_key: string;
  step_name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  message: string | null;
  progress: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface UseWorkflowTrackingOptions {
  sessionId: string;
  enabled?: boolean;
}

export function useWorkflowTracking({ sessionId, enabled = true }: UseWorkflowTrackingOptions) {
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar status inicial
  const fetchStatus = useCallback(async () => {
    if (!sessionId || !enabled) return;

    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('workflow_status')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('[WorkflowTracking] Erro ao buscar status:', fetchError);
        setError(fetchError.message);
        return;
      }

      setSteps((data || []) as WorkflowStep[]);
      setError(null);
    } catch (err) {
      console.error('[WorkflowTracking] Erro:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, enabled]);

  // Escutar atualizações em tempo real
  useEffect(() => {
    if (!sessionId || !enabled) return;

    fetchStatus();

    // Configurar canal realtime
    const channel: RealtimeChannel = supabase
      .channel(`workflow-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workflow_status',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('[WorkflowTracking] Evento recebido:', payload.eventType, payload.new);

          if (payload.eventType === 'INSERT') {
            const newStep = payload.new as WorkflowStep;
            setSteps(prev => {
              // Evitar duplicatas
              if (prev.find(s => s.id === newStep.id)) return prev;
              return [...prev, newStep];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedStep = payload.new as WorkflowStep;
            setSteps(prev =>
              prev.map(s => s.id === updatedStep.id ? updatedStep : s)
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedStep = payload.old as WorkflowStep;
            setSteps(prev => prev.filter(s => s.id !== deletedStep.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('[WorkflowTracking] Status da conexão:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('[WorkflowTracking] Removendo canal...');
      supabase.removeChannel(channel);
    };
  }, [sessionId, enabled, fetchStatus]);

  // Limpar status da sessão
  const clearSession = useCallback(async () => {
    if (!sessionId) return;

    try {
      await supabase
        .from('workflow_status')
        .delete()
        .eq('session_id', sessionId);

      setSteps([]);
    } catch (err) {
      console.error('[WorkflowTracking] Erro ao limpar sessão:', err);
    }
  }, [sessionId]);

  // Helpers
  const currentStep = steps.find(s => s.status === 'running');
  const completedSteps = steps.filter(s => s.status === 'completed');
  const hasError = steps.some(s => s.status === 'error');
  const isComplete = steps.length > 0 && steps.every(s => s.status === 'completed');
  const overallProgress = steps.length > 0
    ? Math.round(completedSteps.length / steps.length * 100)
    : 0;

  return {
    steps,
    currentStep,
    completedSteps,
    hasError,
    isComplete,
    overallProgress,
    isLoading,
    isConnected,
    error,
    refetch: fetchStatus,
    clearSession
  };
}
