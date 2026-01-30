import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type GenerationType = 'carousel' | 'marketing';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface QueueJob {
  id: string;
  status: JobStatus;
  generationType: GenerationType;
  result?: any;
  errorMessage?: string;
  queuePosition?: number;
  createdAt: string;
  completedAt?: string;
}

export const useImageQueue = () => {
  const [currentJob, setCurrentJob] = useState<QueueJob | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Adicionar job à fila
  const queueGeneration = async (
    generationType: GenerationType,
    inputData: any,
    priority: number = 0
  ): Promise<string | null> => {
    try {
      console.log(`🚀 [useImageQueue] Adicionando job à fila: ${generationType}`);

      // Best-effort: tenta renovar a sessão antes de enfileirar
      await supabase.auth.refreshSession().catch(() => undefined);

      // Verificar autenticação antes de enfileirar
      let { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session) {
        console.error('🔐 [useImageQueue] Usuário não autenticado');
        toast.error('Faça login para continuar');
        return null;
      }

      console.log(`✅ [useImageQueue] Usuário autenticado: ${session.user.id}`);

      const invokeOnce = () =>
        supabase.functions.invoke('queue-image', {
          body: { generationType, inputData, priority }
        });

      let { data, error } = await invokeOnce();

      // Se der 401/Invalid JWT, tenta 1x refresh e repetir
      if (error) {
        const status = (error as any)?.context?.status || 0;
        const msg = typeof (error as any)?.message === 'string' ? (error as any).message : '';
        const isAuth = status === 401 || /invalid jwt/i.test(msg) || /unauthorized/i.test(msg);

        if (isAuth) {
          console.warn('🔄 [useImageQueue] 401/Invalid JWT no enqueue - tentando refresh e retry 1x...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError && refreshData.session) {
            ({ data: { session }, error: authError } = await supabase.auth.getSession());
            ({ data, error } = await invokeOnce());
          }
        }
      }

      if (error) {
        const status = (error as any)?.context?.status || 0;
        const errorBody = (error as any)?.context?.body || (error as any)?.message;
        console.error(`❌ [useImageQueue] Erro HTTP ${status}:`, error);

        if (status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        
        if (status === 429) {
          // Capturar dados ricos do 429
          let parsedBody: any = {};
          try {
            if (typeof errorBody === 'string') {
              parsedBody = JSON.parse(errorBody);
            } else if (typeof errorBody === 'object') {
              parsedBody = errorBody;
            }
          } catch {}
          
          const rateLimitError = new Error(parsedBody?.error || 'Limite de gerações atingido') as any;
          rateLimitError.status = 429;
          rateLimitError.limits = parsedBody?.limits || {};
          rateLimitError.context = { status: 429, body: errorBody };
          throw rateLimitError;
        }
        
        throw error;
      }

      const jobId = data.jobId;
      console.log(`✅ [useImageQueue] Job ${jobId} adicionado à fila`);
      
      toast.success('Geração adicionada à fila', {
        description: 'Seu pedido está sendo processado...'
      });

      return jobId;
    } catch (error: any) {
      console.error('❌ [useImageQueue] Erro ao adicionar à fila:', error);
      toast.error('Erro ao adicionar à fila', {
        description: error.message
      });
      return null;
    }
  };

  // Polling para verificar status
  const startPolling = useCallback((jobId: string, onComplete?: (result: any) => void) => {
    console.log(`[useImageQueue] Iniciando polling para job: ${jobId}`);
    setIsPolling(true);
    
    let pollCount = 0;
    const maxPolls = 100; // 5 minutos (100 * 3s)
    
    const pollInterval = setInterval(async () => {
      pollCount++;
      
      if (pollCount > maxPolls) {
        clearInterval(pollInterval);
        setIsPolling(false);
        toast.error('Timeout na geração', {
          description: 'Por favor, tente novamente',
          id: `queue-${jobId}`
        });
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('check-queue-status', {
          body: { jobId }
        });

        if (error) throw error;

        const job = data.job as QueueJob;
        setCurrentJob(job);

        console.log(`[useImageQueue] Status do job ${jobId}: ${job.status}${job.queuePosition ? ` (posição ${job.queuePosition})` : ''}`);

        // Feedback visual baseado no status
        if (job.status === 'pending' && job.queuePosition) {
          toast.loading(`Posição na fila: ${job.queuePosition}`, {
            id: `queue-${jobId}`
          });
        } else if (job.status === 'processing') {
          toast.loading('Processando sua geração...', {
            id: `queue-${jobId}`
          });
        } else if (job.status === 'completed') {
          clearInterval(pollInterval);
          setIsPolling(false);
          toast.success('Geração concluída!', {
            id: `queue-${jobId}`
          });
          
          if (onComplete && job.result) {
            onComplete(job.result);
          }
        } else if (job.status === 'failed') {
          clearInterval(pollInterval);
          setIsPolling(false);
          toast.error('Falha na geração', {
            id: `queue-${jobId}`,
            description: job.errorMessage || 'Erro desconhecido'
          });
        }

      } catch (error: any) {
        console.error('❌ [useImageQueue] Erro ao verificar status:', error);
        
        // Verificar status HTTP
        const status = error?.context?.status || 0;
        const errorMessage = error?.message || '';
        
        // ✅ IGNORAR 401 NO POLLING - Sessão pode expirar, mas job continua no backend
        // O endpoint check-queue-status agora é público (verify_jwt = false)
        if (status === 401 || errorMessage.includes('401') || errorMessage.toLowerCase().includes('unauthorized')) {
          console.warn('⚠️ [useImageQueue] 401 no polling - IGNORANDO (job continua no backend)');
          // ❌ NÃO parar polling
          // ✅ Apenas continuar tentando
          return;
        }
        
        // Para outros erros, continuar tentando até o limite
        if (pollCount < 5) {
          console.log(`⏳ [useImageQueue] Tentativa ${pollCount}/5 - continuando...`);
          return;
        }
        
        clearInterval(pollInterval);
        setIsPolling(false);
        toast.error('Erro ao verificar status', {
          description: error.message,
          id: `queue-${jobId}`
        });
      }
    }, 3000); // Poll a cada 3 segundos

  }, []);

  return {
    queueGeneration,
    startPolling,
    currentJob,
    isPolling
  };
};
