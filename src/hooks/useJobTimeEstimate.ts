import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Valores default por tipo (em ms)
const DEFAULT_TIMES: Record<string, number> = {
  'tratamento_combinado': 4 * 60 * 1000,    // 4 min (8 imagens)
  'unified_marketing': 3 * 60 * 1000,       // 3 min
  'kit_completo': 5 * 60 * 1000,            // 5 min
  'carousel': 3 * 60 * 1000,                // 3 min
  'marketing': 2 * 60 * 1000,               // 2 min
  'default': 3 * 60 * 1000                  // 3 min default
};

interface TimeEstimate {
  elapsed: number;
  estimated: number;
  remaining: number;
  progress: number;
  isFinishing: boolean;
  formattedRemaining: string;
}

interface ProcessingStats {
  estimatedTimeByType: Record<string, number>;
  globalAvgTime: number;
}

// Hook para buscar estatísticas globais de processamento
export function useProcessingStats() {
  const [stats, setStats] = useState<ProcessingStats>({
    estimatedTimeByType: {},
    globalAvgTime: DEFAULT_TIMES.default
  });
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      // Buscar tempo médio dos últimos 7 dias por tipo
      const { data, error } = await supabase
        .from('generation_metrics')
        .select('generation_type, processing_time_ms')
        .eq('success', true)
        .not('processing_time_ms', 'is', null)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(500);

      if (error) {
        console.warn('[ProcessingStats] Erro ao buscar métricas:', error);
        return;
      }

      if (!data || data.length === 0) {
        console.log('[ProcessingStats] Sem dados históricos, usando defaults');
        return;
      }

      // Calcular médias por tipo
      const typeStats: Record<string, number[]> = {};
      data.forEach(row => {
        const type = row.generation_type || 'default';
        if (!typeStats[type]) typeStats[type] = [];
        if (row.processing_time_ms && row.processing_time_ms > 0) {
          typeStats[type].push(row.processing_time_ms);
        }
      });

      // Calcular média de cada tipo
      const avgByType: Record<string, number> = {};
      Object.entries(typeStats).forEach(([type, times]) => {
        if (times.length > 0) {
          avgByType[type] = times.reduce((a, b) => a + b, 0) / times.length;
        }
      });

      // Média global
      const allTimes = data
        .map(r => r.processing_time_ms)
        .filter((t): t is number => t !== null && t > 0);
      
      const globalAvg = allTimes.length > 0 
        ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length 
        : DEFAULT_TIMES.default;

      console.log('[ProcessingStats] Estatísticas carregadas:', {
        types: Object.keys(avgByType).length,
        globalAvg: Math.round(globalAvg / 1000) + 's'
      });

      setStats({
        estimatedTimeByType: avgByType,
        globalAvgTime: globalAvg
      });
    } catch (error) {
      console.error('[ProcessingStats] Erro:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const getEstimatedTime = useCallback((generationType: string): number => {
    return stats.estimatedTimeByType[generationType] 
      || stats.estimatedTimeByType['default'] 
      || DEFAULT_TIMES[generationType] 
      || DEFAULT_TIMES.default;
  }, [stats.estimatedTimeByType]);

  return {
    ...stats,
    isLoaded,
    getEstimatedTime,
    refreshStats: fetchStats
  };
}

// Formatar tempo restante de forma OTIMISTA (UX melhorada)
export function formatRemainingTime(ms: number): string {
  if (ms <= 0) return 'Finalizando...';
  
  const seconds = Math.ceil(ms / 1000);
  
  if (seconds <= 30) return 'alguns segundos';
  if (seconds <= 60) return 'menos de 1 minuto';
  if (seconds <= 90) return 'cerca de 1 minuto';
  if (seconds <= 120) return 'menos de 2 minutos';
  if (seconds <= 180) return 'alguns minutos';
  
  return 'processando...';
}

// Formatar tempo de forma otimista para exibição
export function formatTimeOptimistic(ms: number): string {
  if (ms <= 0) return 'quase pronto!';
  
  const seconds = Math.ceil(ms / 1000);
  
  if (seconds <= 15) return 'poucos segundos';
  if (seconds <= 30) return 'alguns segundos';
  if (seconds <= 60) return 'menos de 1 min';
  if (seconds <= 120) return 'menos de 2 min';
  
  return 'alguns minutos';
}

// Calcular estimativa para um job específico
export function calculateJobEstimate(
  startedAt: string | undefined,
  generationType: string,
  getEstimatedTime: (type: string) => number,
  now: number = Date.now()
): TimeEstimate {
  const startTime = startedAt ? new Date(startedAt).getTime() : null;
  const elapsed = startTime ? now - startTime : 0;
  const estimated = getEstimatedTime(generationType);
  const remaining = Math.max(0, estimated - elapsed);
  const progress = startTime 
    ? Math.min(95, (elapsed / estimated) * 100) 
    : 0;

  return {
    elapsed,
    estimated,
    remaining,
    progress,
    isFinishing: remaining <= 0,
    formattedRemaining: formatRemainingTime(remaining)
  };
}
