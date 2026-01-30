import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Type-safe wrapper for legacy tables
const legacyDb = supabase as any;

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  successRate: number;
  avgProcessingTime: number;
  totalJobs: number;
  jobsLast24h: number;
  jobsLast7d: number;
}

export interface RecentJob {
  id: string;
  generation_type: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  started_at: string | null;
  processing_time: number | null;
  error_message: string | null;
  retry_count: number;
  input_data: any;
  result: any;
}

export const useQueueMonitor = () => {
  const [stats, setStats] = useState<QueueStats>({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    successRate: 0,
    avgProcessingTime: 0,
    totalJobs: 0,
    jobsLast24h: 0,
    jobsLast7d: 0,
  });
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const calculateStats = (jobs: RecentJob[]): QueueStats => {
    const pending = jobs.filter(j => j.status === 'pending').length;
    const processing = jobs.filter(j => j.status === 'processing').length;
    const completed = jobs.filter(j => j.status === 'completed').length;
    const failed = jobs.filter(j => j.status === 'failed').length;
    
    const totalFinished = completed + failed;
    const successRate = totalFinished > 0 ? (completed / totalFinished) * 100 : 0;
    
    const completedJobs = jobs.filter(j => j.status === 'completed' && j.started_at && j.completed_at);
    const avgProcessingTime = completedJobs.length > 0
      ? completedJobs.reduce((sum, j) => {
          const start = new Date(j.started_at!).getTime();
          const end = new Date(j.completed_at!).getTime();
          return sum + (end - start);
        }, 0) / completedJobs.length
      : 0;

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const jobsLast24h = jobs.filter(j => new Date(j.created_at) > last24h).length;
    const jobsLast7d = jobs.filter(j => new Date(j.created_at) > last7d).length;

    return {
      pending,
      processing,
      completed,
      failed,
      successRate,
      avgProcessingTime,
      totalJobs: jobs.length,
      jobsLast24h,
      jobsLast7d,
    };
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar últimos 100 jobs do usuário
      const { data: jobs, error } = await legacyDb
        .from('image_generation_queue')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (jobs) {
        // Calcular processing_time para cada job e map to RecentJob
        const jobsWithProcessingTime: RecentJob[] = jobs.map((job: any) => ({
          id: job.id,
          generation_type: job.generation_type || 'unknown',
          status: job.status || 'pending',
          created_at: job.created_at,
          completed_at: job.completed_at || null,
          started_at: job.started_at || null,
          processing_time: job.started_at && job.completed_at
            ? new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()
            : null,
          error_message: job.error_message || null,
          retry_count: job.retry_count || 0,
          input_data: job.input_data || null,
          result: job.result || null
        }));
        
        setRecentJobs(jobsWithProcessingTime);
        setStats(calculateStats(jobsWithProcessingTime));
      }
    } catch (error) {
      console.error('Error loading queue data:', error);
      toast({
        title: 'Erro ao carregar dados da fila',
        description: 'Não foi possível carregar as estatísticas da fila',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    loadData();
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, []);

  // Subscrição Realtime
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('queue-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'image_generation_queue',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('🔔 Queue update:', payload);

            // Atualizar lista de jobs
            loadData();

            // Mostrar toast quando job for concluído
            if (payload.eventType === 'UPDATE' && 
                payload.new && 
                (payload.new as any).status === 'completed') {
              toast({
                title: 'Job concluído!',
                description: `Job ${(payload.new as any).id.slice(0, 8)} foi processado com sucesso`,
              });
            }

            // Mostrar toast quando job falhar
            if (payload.eventType === 'UPDATE' && 
                payload.new && 
                (payload.new as any).status === 'failed') {
              toast({
                title: 'Job falhou',
                description: `Job ${(payload.new as any).id.slice(0, 8)} encontrou um erro`,
                variant: 'destructive',
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtimeSubscription();
  }, [toast]);

  return {
    stats,
    recentJobs,
    isLoading,
    refreshData,
  };
};
