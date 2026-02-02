import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface WorkflowStep {
  id: string;
  session_id: string;
  step_key: string;
  step_name: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'timeout';
  message: string | null;
  progress: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface UseWorkflowTrackingOptions {
  sessionId: string;
  enabled?: boolean;
  timeoutMs?: number; // Timeout em milissegundos (padrão: 30000 = 30s)
}

export function useWorkflowTracking({
  sessionId,
  enabled = true,
  timeoutMs = 30000 // 30 segundos padrão
}: UseWorkflowTrackingOptions) {
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);

  // Refs para controle do timeout
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const hasReceivedAnyUpdate = useRef<boolean>(false);

  // Resetar o timeout quando receber qualquer atualização
  const resetTimeout = useCallback(() => {
    lastActivityRef.current = Date.now();
    hasReceivedAnyUpdate.current = true;
    setIsTimedOut(false);

    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Criar novo timeout
    timeoutRef.current = setTimeout(() => {
      console.warn('[WorkflowTracking] TIMEOUT! Nenhuma atualização em', timeoutMs / 1000, 'segundos');
      setIsTimedOut(true);
      setIsWaiting(false);
      setError('Servidor sobrecarregado. Tente novamente.');
    }, timeoutMs);
  }, [timeoutMs]);

  // Iniciar o monitoramento (quando começa a aguardar)
  const startWaiting = useCallback(() => {
    console.log('[WorkflowTracking] Iniciando monitoramento...');
    setIsWaiting(true);
    setIsTimedOut(false);
    setError(null);
    hasReceivedAnyUpdate.current = false;
    resetTimeout();
  }, [resetTimeout]);

  // Parar o monitoramento
  const stopWaiting = useCallback(() => {
    console.log('[WorkflowTracking] Parando monitoramento...');
    setIsWaiting(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

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

      const fetchedSteps = (data || []) as WorkflowStep[];
      setSteps(fetchedSteps);

      // Se já tem steps, reseta o timeout
      if (fetchedSteps.length > 0) {
        resetTimeout();
      }

      setError(null);
    } catch (err) {
      console.error('[WorkflowTracking] Erro:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, enabled, resetTimeout]);

  // Iniciar timeout automaticamente quando montado
  useEffect(() => {
    if (!sessionId || !enabled) return;

    // Inicia o monitoramento de timeout automaticamente
    console.log('[WorkflowTracking] Iniciando monitoramento automático de timeout...');
    resetTimeout();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [sessionId, enabled, resetTimeout]);

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

          // Resetar timeout a cada evento recebido
          resetTimeout();

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

      // Limpar timeout ao desmontar
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [sessionId, enabled, fetchStatus, resetTimeout]);

  // Limpar status da sessão
  const clearSession = useCallback(async () => {
    if (!sessionId) return;

    try {
      await supabase
        .from('workflow_status')
        .delete()
        .eq('session_id', sessionId);

      setSteps([]);
      setIsTimedOut(false);
      setError(null);
      stopWaiting();
    } catch (err) {
      console.error('[WorkflowTracking] Erro ao limpar sessão:', err);
    }
  }, [sessionId, stopWaiting]);

  // Helpers
  const currentStep = steps.find(s => s.status === 'running');
  const completedSteps = steps.filter(s => s.status === 'completed');
  const hasError = steps.some(s => s.status === 'error') || isTimedOut;
  const isComplete = steps.length > 0 && steps.every(s => s.status === 'completed');
  const overallProgress = steps.length > 0
    ? Math.round(completedSteps.length / steps.length * 100)
    : 0;

  // Parar o timeout quando o workflow terminar (sucesso ou erro do n8n)
  useEffect(() => {
    if (isComplete || steps.some(s => s.status === 'error')) {
      console.log('[WorkflowTracking] Workflow finalizado, parando timeout...');
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [isComplete, steps]);

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
    isTimedOut,
    isWaiting,
    refetch: fetchStatus,
    clearSession,
    startWaiting,
    stopWaiting
  };
}
