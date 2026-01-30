import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface MetricsSummary {
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  successRate: number;
  avgQueueTime: number;
  avgProcessingTime: number;
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
}

interface DailyMetric {
  date: string;
  total: number;
  successful: number;
  failed: number;
  cost: number;
}

interface TypeMetric {
  type: string;
  count: number;
  cost: number;
  avgTime: number;
}

interface TopUser {
  userId: string;
  email: string;
  jobCount: number;
  totalCost: number;
}

interface QueueStatus {
  pending: number;
  processing: number;
}

export interface AdminMetricsData {
  summary: MetricsSummary;
  byDay: DailyMetric[];
  byType: TypeMetric[];
  topUsers: TopUser[];
  queueStatus: QueueStatus;
}

async function fetchAdminMetrics(period: string): Promise<AdminMetricsData> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Não autenticado');
  }

  const { data, error } = await supabase.functions.invoke('admin-get-metrics', {
    body: { period },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    throw new Error(error.message || 'Erro ao buscar métricas');
  }

  return data;
}

export function useAdminMetrics(period: string = '7d') {
  const query = useQuery({
    queryKey: ['admin-metrics', period],
    queryFn: () => fetchAdminMetrics(period),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
