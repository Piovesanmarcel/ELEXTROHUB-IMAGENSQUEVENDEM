import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/services/LoggerService';

type HealthStatus = 'healthy' | 'degraded' | 'error' | 'unknown';

interface SystemHealth {
  database: HealthStatus;
  queue: HealthStatus;
  n8n: HealthStatus;
  overall: HealthStatus;
  lastCheck: string | null;
  details: {
    databaseLatency?: number;
    queueSize?: number;
    pendingJobs?: number;
    failedJobsLast24h?: number;
  };
}

interface UseSystemHealthOptions {
  autoCheck?: boolean;
  checkInterval?: number; // ms
}

/**
 * Hook para monitorar a saúde do sistema
 * 
 * Verifica conectividade com banco, fila de jobs e n8n
 */
export function useSystemHealth(options: UseSystemHealthOptions = {}) {
  const { autoCheck = false, checkInterval = 60000 } = options;
  
  const [health, setHealth] = useState<SystemHealth>({
    database: 'unknown',
    queue: 'unknown',
    n8n: 'unknown',
    overall: 'unknown',
    lastCheck: null,
    details: {},
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = useCallback(async () => {
    if (isChecking) return health;
    
    setIsChecking(true);
    const startTime = performance.now();
    
    const newHealth: SystemHealth = {
      database: 'unknown',
      queue: 'unknown',
      n8n: 'unknown',
      overall: 'unknown',
      lastCheck: new Date().toISOString(),
      details: {},
    };

    try {
      // 1. Check Database connectivity
      const dbStart = performance.now();
      const { error: dbError } = await supabase
        .from('user_credits')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      const dbLatency = Math.round(performance.now() - dbStart);
      newHealth.details.databaseLatency = dbLatency;
      
      if (dbError) {
        newHealth.database = 'error';
        logger.error('Database health check failed', dbError);
      } else if (dbLatency > 2000) {
        newHealth.database = 'degraded';
        logger.warn('Database latency high', { latency: dbLatency });
      } else {
        newHealth.database = 'healthy';
      }
    } catch (error) {
      newHealth.database = 'error';
      logger.error('Database health check exception', error);
    }

    try {
      // 2. Check Queue status
      const { data: queueData, error: queueError } = await supabase
        .from('image_generation_queue')
        .select('status')
        .in('status', ['pending', 'processing']);
      
      if (queueError) {
        newHealth.queue = 'error';
        logger.error('Queue health check failed', queueError);
      } else {
        const pendingCount = queueData?.filter(j => j.status === 'pending').length || 0;
        const processingCount = queueData?.filter(j => j.status === 'processing').length || 0;
        
        newHealth.details.queueSize = queueData?.length || 0;
        newHealth.details.pendingJobs = pendingCount;
        
        if (pendingCount > 50) {
          newHealth.queue = 'degraded';
          logger.warn('Queue backlog detected', { pending: pendingCount });
        } else {
          newHealth.queue = 'healthy';
        }
      }

      // Check failed jobs in last 24h
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: failedData } = await supabase
        .from('image_generation_queue')
        .select('id')
        .eq('status', 'failed')
        .gte('created_at', twentyFourHoursAgo);
      
      newHealth.details.failedJobsLast24h = failedData?.length || 0;
      
      if ((failedData?.length || 0) > 10 && newHealth.queue === 'healthy') {
        newHealth.queue = 'degraded';
      }
    } catch (error) {
      newHealth.queue = 'error';
      logger.error('Queue health check exception', error);
    }

    // 3. n8n health check (basic - just check if we have recent successful jobs)
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: recentJobs } = await supabase
        .from('authorized_jobs')
        .select('status')
        .gte('created_at', oneHourAgo)
        .limit(10);
      
      if (!recentJobs || recentJobs.length === 0) {
        newHealth.n8n = 'unknown'; // No recent activity
      } else {
        const completedCount = recentJobs.filter(j => j.status === 'completed').length;
        const failedCount = recentJobs.filter(j => j.status === 'failed').length;
        
        if (failedCount > completedCount) {
          newHealth.n8n = 'degraded';
        } else {
          newHealth.n8n = 'healthy';
        }
      }
    } catch (error) {
      newHealth.n8n = 'unknown';
      logger.error('n8n health check exception', error);
    }

    // Calculate overall health
    const statuses = [newHealth.database, newHealth.queue, newHealth.n8n];
    if (statuses.includes('error')) {
      newHealth.overall = 'error';
    } else if (statuses.includes('degraded')) {
      newHealth.overall = 'degraded';
    } else if (statuses.every(s => s === 'healthy')) {
      newHealth.overall = 'healthy';
    } else {
      newHealth.overall = 'unknown';
    }

    const totalTime = Math.round(performance.now() - startTime);
    logger.performance('System health check', totalTime, newHealth);

    setHealth(newHealth);
    setIsChecking(false);
    
    return newHealth;
  }, [isChecking, health]);

  // Auto-check on interval
  useEffect(() => {
    if (!autoCheck) return;

    // Initial check
    checkHealth();

    const interval = setInterval(checkHealth, checkInterval);
    return () => clearInterval(interval);
  }, [autoCheck, checkInterval, checkHealth]);

  return {
    health,
    isChecking,
    checkHealth,
  };
}

export type { SystemHealth, HealthStatus };
