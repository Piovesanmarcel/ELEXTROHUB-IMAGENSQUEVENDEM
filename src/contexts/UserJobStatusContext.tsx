import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProcessingStats } from '@/hooks/useJobTimeEstimate';

export interface ActiveJob {
  id: string;
  status: 'pending' | 'processing';
  generationType: string;
  createdAt: string;
  startedAt?: string;
  productName?: string;
}

interface UserJobStatusContextType {
  // Estado dos jobs
  activeJobs: ActiveJob[];
  activeJobsCount: number;
  pendingCount: number;
  processingCount: number;
  
  // Limites
  maxConcurrent: number;
  canStartNewJob: boolean;
  remainingSlots: number;
  
  // Estado de conexão
  isLoading: boolean;
  isConnected: boolean;
  lastUpdate: string | null;
  
  // Estimativas de tempo
  getEstimatedTime: (generationType: string) => number;
  
  // Ações
  refreshStatus: () => Promise<void>;
}

const UserJobStatusContext = createContext<UserJobStatusContextType | null>(null);

const MAX_CONCURRENT_JOBS = 2;

export function UserJobStatusProvider({ children }: { children: ReactNode }) {
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Estatísticas de tempo de processamento
  const { getEstimatedTime } = useProcessingStats();

  // Calcular métricas derivadas
  const activeJobsCount = activeJobs.length;
  const pendingCount = activeJobs.filter(j => j.status === 'pending').length;
  const processingCount = activeJobs.filter(j => j.status === 'processing').length;
  const canStartNewJob = activeJobsCount < MAX_CONCURRENT_JOBS;
  const remainingSlots = Math.max(0, MAX_CONCURRENT_JOBS - activeJobsCount);

  // Buscar jobs ativos do usuário
  const fetchActiveJobs = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('image_generation_queue')
        .select('id, status, generation_type, created_at, started_at, input_data')
        .eq('user_id', userId)
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const jobs: ActiveJob[] = (data || []).map(job => ({
        id: job.id,
        status: job.status as 'pending' | 'processing',
        generationType: job.generation_type,
        createdAt: job.created_at,
        startedAt: job.started_at || undefined,
        productName: (job.input_data as any)?.productName || undefined
      }));

      setActiveJobs(jobs);
      setLastUpdate(new Date().toISOString());
    } catch (error) {
      console.error('[UserJobStatus] Erro ao buscar jobs:', error);
    }
  }, [userId]);

  // Refresh manual
  const refreshStatus = useCallback(async () => {
    setIsLoading(true);
    await fetchActiveJobs();
    setIsLoading(false);
  }, [fetchActiveJobs]);

  // Obter userId
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };
    
    getUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Buscar jobs inicialmente e configurar Realtime
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    // Buscar inicial
    fetchActiveJobs().finally(() => setIsLoading(false));

    // Configurar Realtime subscription
    const channelName = `user-jobs-${userId}`;
    console.log('[UserJobStatus] 🔌 Configurando Realtime:', channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'image_generation_queue',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('[UserJobStatus] 📦 Mudança detectada:', payload);
          // Refetch para garantir consistência
          fetchActiveJobs();
        }
      )
      .subscribe((status) => {
        console.log('[UserJobStatus] 📡 Status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('[UserJobStatus] 🔌 Removendo subscription');
      supabase.removeChannel(channel);
    };
  }, [userId, fetchActiveJobs]);

  return (
    <UserJobStatusContext.Provider
      value={{
        activeJobs,
        activeJobsCount,
        pendingCount,
        processingCount,
        maxConcurrent: MAX_CONCURRENT_JOBS,
        canStartNewJob,
        remainingSlots,
        isLoading,
        isConnected,
        lastUpdate,
        getEstimatedTime,
        refreshStatus
      }}
    >
      {children}
    </UserJobStatusContext.Provider>
  );
}

export const useUserJobStatus = () => {
  const context = useContext(UserJobStatusContext);
  if (!context) {
    throw new Error('useUserJobStatus must be used within UserJobStatusProvider');
  }
  return context;
};
