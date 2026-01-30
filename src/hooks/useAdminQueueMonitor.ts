import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdminQueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  successRate: number;
  avgProcessingTime: number;
  totalToday: number;
}

export interface AdminJob {
  id: string;
  user_id: string;
  user_email?: string;
  generation_type: string;
  status: string;
  priority: number | null;
  retry_count: number | null;
  created_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  locked_at: string | null;
  processing_time_ms: number | null;
  error_message: string | null;
  input_data: any;
  result: any;
}

export interface UserActiveJobs {
  userId: string;
  email: string;
  activeJobs: number;
  maxJobs: number;
  jobs: AdminJob[];
}

export function useAdminQueueMonitor() {
  const [stats, setStats] = useState<AdminQueueStats>({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    successRate: 0,
    avgProcessingTime: 0,
    totalToday: 0
  });
  const [recentJobs, setRecentJobs] = useState<AdminJob[]>([]);
  const [userActiveJobs, setUserActiveJobs] = useState<UserActiveJobs[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { toast } = useToast();

  const calculateStats = useCallback((jobs: AdminJob[]): AdminQueueStats => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pending = jobs.filter(j => j.status === 'pending').length;
    const processing = jobs.filter(j => j.status === 'processing').length;
    const completed = jobs.filter(j => j.status === 'completed').length;
    const failed = jobs.filter(j => j.status === 'failed').length;
    
    const total = completed + failed;
    const successRate = total > 0 ? (completed / total) * 100 : 0;
    
    const completedJobs = jobs.filter(j => j.status === 'completed' && j.processing_time_ms);
    const avgProcessingTime = completedJobs.length > 0
      ? completedJobs.reduce((acc, j) => acc + (j.processing_time_ms || 0), 0) / completedJobs.length
      : 0;

    const totalToday = jobs.filter(j => {
      const createdAt = j.created_at ? new Date(j.created_at) : null;
      return createdAt && createdAt >= today;
    }).length;

    return { pending, processing, completed, failed, successRate, avgProcessingTime, totalToday };
  }, []);

  const groupJobsByUser = useCallback((jobs: AdminJob[]): UserActiveJobs[] => {
    const activeJobs = jobs.filter(j => j.status === 'pending' || j.status === 'processing');
    
    const userMap = new Map<string, UserActiveJobs>();
    
    activeJobs.forEach(job => {
      const existing = userMap.get(job.user_id);
      if (existing) {
        existing.activeJobs++;
        existing.jobs.push(job);
      } else {
        userMap.set(job.user_id, {
          userId: job.user_id,
          email: job.user_email || job.user_id.slice(0, 8) + '...',
          activeJobs: 1,
          maxJobs: 2,
          jobs: [job]
        });
      }
    });

    return Array.from(userMap.values()).sort((a, b) => b.activeJobs - a.activeJobs);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch last 200 jobs
      const { data: jobs, error } = await supabase
        .from('image_generation_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      const typedJobs = (jobs || []) as AdminJob[];
      
      // Try to get user emails from user_profiles
      const userIds = [...new Set(typedJobs.map(j => j.user_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, email')
        .in('id', userIds);

      const emailMap = new Map<string, string>();
      profiles?.forEach(p => emailMap.set(p.id, p.email));

      // Enrich jobs with emails
      const enrichedJobs = typedJobs.map(job => ({
        ...job,
        user_email: emailMap.get(job.user_id) || undefined
      }));

      setRecentJobs(enrichedJobs);
      setStats(calculateStats(enrichedJobs));
      setUserActiveJobs(groupJobsByUser(enrichedJobs));
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error loading admin queue data:', err);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados da fila',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [calculateStats, groupJobsByUser, toast]);

  const cancelJob = useCallback(async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('image_generation_queue')
        .update({
          status: 'failed',
          error_message: 'Cancelado pelo administrador',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: 'Job cancelado',
        description: `Job ${jobId.slice(0, 8)}... foi cancelado`
      });

      loadData();
    } catch (err) {
      console.error('Error canceling job:', err);
      toast({
        title: 'Erro ao cancelar',
        description: 'Não foi possível cancelar o job',
        variant: 'destructive'
      });
    }
  }, [toast, loadData]);

  const retryJob = useCallback(async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('image_generation_queue')
        .update({
          status: 'pending',
          locked_at: null,
          started_at: null,
          error_message: null,
          retry_count: 0
        })
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: 'Job reenfileirado',
        description: `Job ${jobId.slice(0, 8)}... foi adicionado à fila novamente`
      });

      loadData();
    } catch (err) {
      console.error('Error retrying job:', err);
      toast({
        title: 'Erro ao reenfileirar',
        description: 'Não foi possível reenfileirar o job',
        variant: 'destructive'
      });
    }
  }, [toast, loadData]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime subscription for all job changes
  useEffect(() => {
    const channel = supabase
      .channel('admin-queue-monitor')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'image_generation_queue'
        },
        (payload) => {
          console.log('[AdminQueueMonitor] Realtime update:', payload.eventType);
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  return {
    stats,
    recentJobs,
    userActiveJobs,
    isLoading,
    lastUpdate,
    refreshData: loadData,
    cancelJob,
    retryJob
  };
}
