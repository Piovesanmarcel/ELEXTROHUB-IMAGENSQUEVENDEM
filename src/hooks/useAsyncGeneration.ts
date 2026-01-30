import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type GenerationType = 'carousel' | 'marketing' | 'background' | 'stability' | 'tongyi' | 'unified_commands';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface QueueJob {
  id: string;
  status: JobStatus;
  generationType: GenerationType;
  result?: any;
  errorMessage?: string;
  queuePosition?: number;
  createdAt: string;
  completedAt?: string;
}

export interface QueueLimits {
  pendingJobs: number;
  maxConcurrent: number;
  creditsRemaining: number;
}

export interface AsyncGenerationResult<T = any> {
  success: boolean;
  jobId?: string;
  queuePosition?: number;
  estimatedWaitMinutes?: number;
  result?: T;
  error?: string;
  limits?: QueueLimits;
}

interface UseAsyncGenerationOptions {
  onStatusChange?: (job: QueueJob) => void;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
  pollingIntervalMs?: number;
  maxPollingAttempts?: number;
  showToasts?: boolean;
}

// ✅ Calcular intervalo adaptativo baseado na posição na fila
function getAdaptiveInterval(queuePosition: number | undefined, baseInterval: number): number {
  if (!queuePosition || queuePosition <= 5) return baseInterval; // 3s para posições 1-5
  if (queuePosition <= 20) return baseInterval * 2; // 6s para posições 6-20
  return baseInterval * 5; // 15s para posições > 20
}

export const useAsyncGeneration = (options: UseAsyncGenerationOptions = {}) => {
  const {
    onStatusChange,
    onComplete,
    onError,
    pollingIntervalMs = 3000,
    maxPollingAttempts = 120, // 6 minutos máximo
    showToasts = true
  } = options;

  const [currentJob, setCurrentJob] = useState<QueueJob | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isEnqueuing, setIsEnqueuing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [limits, setLimits] = useState<QueueLimits | null>(null);
  
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pollCountRef = useRef(0);
  const currentIntervalRef = useRef(pollingIntervalMs);
  const consecutiveErrorsRef = useRef(0);

  // Limpar polling ao desmontar
  useEffect(() => {
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Parar polling
  const stopPolling = useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsPolling(false);
    pollCountRef.current = 0;
    consecutiveErrorsRef.current = 0;
    currentIntervalRef.current = pollingIntervalMs;
  }, [pollingIntervalMs]);

  // Enfileirar job
  const enqueue = useCallback(async <T = any>(
    generationType: GenerationType,
    inputData: any
  ): Promise<AsyncGenerationResult<T>> => {
    setIsEnqueuing(true);
    setProgress(5);

    try {
      console.log(`[useAsyncGeneration] 📤 Enfileirando: ${generationType}`);

      const body = { generationType, inputData };
      const invokeOnce = () => supabase.functions.invoke('queue-image', { body });

      let { data, error } = await invokeOnce();

      // Retry 1x em 401/Invalid JWT
      if (error) {
        const status = (error as any)?.context?.status || 0;
        const msg = typeof (error as any)?.message === 'string' ? (error as any).message : '';
        const isAuth = status === 401 || /invalid jwt/i.test(msg) || /unauthorized/i.test(msg);

        if (isAuth) {
          console.warn('[useAsyncGeneration] 🔄 401/Invalid JWT no enqueue - tentando refresh e retry 1x...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError && refreshData.session?.access_token) {
            ({ data, error } = await invokeOnce());
          }
        }
      }

      if (error) {
        console.error('[useAsyncGeneration] ❌ Erro ao enfileirar:', error);
        const errorMsg = (error as any).message || 'Erro ao adicionar à fila';
        
        if (showToasts) {
          toast.error('Erro ao adicionar à fila', { description: errorMsg });
        }
        onError?.(errorMsg);
        
        return { success: false, error: errorMsg };
      }

      if (!data?.success) {
        const errorMsg = data?.error || 'Falha ao enfileirar';
        
        if (data?.limits) {
          setLimits(data.limits);
        }
        
        // Mensagem específica para créditos insuficientes
        const isCreditsError = data?.limits?.creditsRemaining === 0 || 
          /créditos/i.test(errorMsg) || /insuficientes/i.test(errorMsg);
        
        if (showToasts) {
          if (isCreditsError) {
            toast.error('Créditos insuficientes!', { 
              description: 'Você precisa comprar créditos para continuar usando a automação.',
              duration: 8000,
              action: {
                label: 'Comprar',
                onClick: () => window.location.href = '/comprar-creditos'
              }
            });
          } else {
            toast.error('Limite atingido', { description: errorMsg });
          }
        }
        onError?.(errorMsg);
        
        return { success: false, error: errorMsg, limits: data?.limits };
      }

      console.log(`[useAsyncGeneration] ✅ Job criado: ${data.jobId}`);
      
      if (data.limits) {
        setLimits(data.limits);
      }

      if (showToasts) {
        toast.success('Adicionado à fila!', {
          description: `Posição ${data.queuePosition} - Estimativa: ${data.estimatedWaitMinutes}min`,
          id: `queue-${data.jobId}`
        });
      }

      setProgress(10);

      return {
        success: true,
        jobId: data.jobId,
        queuePosition: data.queuePosition,
        estimatedWaitMinutes: data.estimatedWaitMinutes,
        limits: data.limits
      };

    } catch (err: any) {
      console.error('[useAsyncGeneration] 💥 Erro inesperado:', err);
      const errorMsg = err.message || 'Erro inesperado';
      
      if (showToasts) {
        toast.error('Erro', { description: errorMsg });
      }
      onError?.(errorMsg);
      
      return { success: false, error: errorMsg };
    } finally {
      setIsEnqueuing(false);
    }
  }, [showToasts, onError]);

  // ✅ NOVO: Polling com setTimeout dinâmico (não setInterval)
  const startPolling = useCallback((jobId: string) => {
    console.log(`[useAsyncGeneration] 🔄 Iniciando polling: ${jobId}`);
    setIsPolling(true);
    pollCountRef.current = 0;
    consecutiveErrorsRef.current = 0;
    currentIntervalRef.current = pollingIntervalMs;
    abortControllerRef.current = new AbortController();
    
    const checkStatus = async () => {
      pollCountRef.current++;
      
      if (pollCountRef.current > maxPollingAttempts) {
        console.log(`[useAsyncGeneration] ⏰ Timeout após ${maxPollingAttempts} tentativas`);
        stopPolling();
        
        const errorMsg = 'Timeout: processamento demorou muito';
        if (showToasts) {
          toast.error('Timeout', { description: errorMsg, id: `queue-${jobId}` });
        }
        onError?.(errorMsg);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('check-queue-status', {
          body: { jobId }
        });

        // ✅ NOVO: Tratar resposta estruturada do backend
        if (error) {
          throw error;
        }

        // ✅ Códigos estruturados do backend
        if (data?.code === 'BACKEND_TEMPORARY') {
          console.warn('[useAsyncGeneration] ⚠️ Backend temporariamente indisponível');
          consecutiveErrorsRef.current++;
          
          // Backoff: usar retryAfterMs do backend ou calcular
          const retryAfter = data.retryAfterMs || Math.min(2000 * Math.pow(2, consecutiveErrorsRef.current - 1), 20000);
          currentIntervalRef.current = retryAfter;
          
          // Agendar próximo poll com backoff
          pollingTimeoutRef.current = setTimeout(checkStatus, currentIntervalRef.current);
          return;
        }

        if (data?.code === 'JOB_NOT_FOUND') {
          console.error('[useAsyncGeneration] ❌ Job não encontrado:', jobId);
          stopPolling();
          
          const errorMsg = 'Job não encontrado. Pode ter expirado.';
          if (showToasts) {
            toast.error('Erro', { description: errorMsg, id: `queue-${jobId}` });
          }
          onError?.(errorMsg);
          return;
        }

        // ✅ Sucesso - resetar contador de erros
        consecutiveErrorsRef.current = 0;

        if (!data?.success || !data?.job) {
          console.warn('[useAsyncGeneration] ⚠️ Resposta inesperada:', data);
          pollingTimeoutRef.current = setTimeout(checkStatus, currentIntervalRef.current);
          return;
        }

        const job = data.job as QueueJob;
        setCurrentJob(job);
        onStatusChange?.(job);

        // ✅ Ajustar intervalo baseado na posição na fila
        currentIntervalRef.current = getAdaptiveInterval(job.queuePosition, pollingIntervalMs);

        // Atualizar progresso baseado no status
        if (job.status === 'pending') {
          const progressValue = 10 + (pollCountRef.current % 10);
          setProgress(progressValue);
          
          if (showToasts && job.queuePosition) {
            toast.loading(`Posição na fila: ${job.queuePosition}`, { id: `queue-${jobId}` });
          }
          
          // Agendar próximo poll
          pollingTimeoutRef.current = setTimeout(checkStatus, currentIntervalRef.current);
        } else if (job.status === 'processing') {
          const progressValue = 30 + Math.min(pollCountRef.current * 2, 60);
          setProgress(progressValue);
          
          if (showToasts) {
            toast.loading('Processando...', { id: `queue-${jobId}` });
          }
          
          // Polling mais frequente durante processamento
          currentIntervalRef.current = pollingIntervalMs;
          pollingTimeoutRef.current = setTimeout(checkStatus, currentIntervalRef.current);
        } else if (job.status === 'completed') {
          setProgress(100);
          stopPolling();
          
          if (showToasts) {
            toast.success('Concluído!', { id: `queue-${jobId}` });
          }
          
          onComplete?.(job.result);
        } else if (job.status === 'failed') {
          setProgress(0);
          stopPolling();
          
          const errorMsg = job.errorMessage || 'Falha no processamento';
          if (showToasts) {
            toast.error('Falha', { description: errorMsg, id: `queue-${jobId}` });
          }
          onError?.(errorMsg);
        }

      } catch (err: any) {
        console.error('[useAsyncGeneration] ❌ Erro no polling:', err);
        consecutiveErrorsRef.current++;

        const status = err?.context?.status || 0;
        const msg = typeof err?.message === 'string' ? err.message : '';

        // ✅ IGNORAR 401/Invalid JWT no polling (job pode continuar no backend)
        if (status === 401 || /invalid jwt/i.test(msg) || /unauthorized/i.test(msg)) {
          console.warn('[useAsyncGeneration] ⚠️ 401/Invalid JWT no polling - ignorando e continuando...');
          pollingTimeoutRef.current = setTimeout(checkStatus, currentIntervalRef.current);
          return;
        }
        
        // ✅ Backoff para erros consecutivos
        if (consecutiveErrorsRef.current < 5) {
          const backoff = Math.min(2000 * Math.pow(2, consecutiveErrorsRef.current - 1), 20000);
          currentIntervalRef.current = backoff;
          pollingTimeoutRef.current = setTimeout(checkStatus, currentIntervalRef.current);
          return;
        }
        
        // Muitos erros consecutivos - parar
        stopPolling();
        const errorMsg = 'Erro ao verificar status';
        if (showToasts) {
          toast.error(errorMsg, { id: `queue-${jobId}` });
        }
        onError?.(errorMsg);
      }
    };

    // Primeira verificação imediata
    checkStatus();
  }, [maxPollingAttempts, pollingIntervalMs, showToasts, onStatusChange, onComplete, onError, stopPolling]);

  // Método combinado: enfileirar e iniciar polling
  const generate = useCallback(async <T = any>(
    generationType: GenerationType,
    inputData: any
  ): Promise<AsyncGenerationResult<T>> => {
    const result = await enqueue<T>(generationType, inputData);
    
    if (result.success && result.jobId) {
      startPolling(result.jobId);
    }
    
    return result;
  }, [enqueue, startPolling]);

  // Resetar estado
  const reset = useCallback(() => {
    stopPolling();
    setCurrentJob(null);
    setProgress(0);
    setLimits(null);
  }, [stopPolling]);

  return {
    // Métodos
    enqueue,
    startPolling,
    stopPolling,
    generate,
    reset,
    
    // Estado
    currentJob,
    isPolling,
    isEnqueuing,
    isProcessing: isEnqueuing || isPolling,
    progress,
    limits
  };
};
