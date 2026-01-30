import { useState, useEffect, useCallback } from 'react';

// Contrato da API (imutável)
interface SystemStatusResponse {
  status: string;
  worker_status: 'NORMAL' | 'OFFLINE';
  queue_size: string | number;  // Backend retorna string
  checked_at: string;
}

export type SystemState = 'NORMAL' | 'WARNING' | 'CRITICAL';

interface UseSystemStatusReturn {
  status: string | null;
  workerStatus: 'NORMAL' | 'OFFLINE' | null;
  queueSize: number;
  checkedAt: Date | null;
  systemState: SystemState;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

// Endpoint de produção (READ-ONLY, imutável)
const SYSTEM_STATUS_ENDPOINT = 'https://nwh.visualvendas.cloud/webhook/system-status';

// Intervalo de polling fixo: 30 segundos
const POLLING_INTERVAL = 30000;

/**
 * Hook para consumir o status do sistema
 * 
 * Fonte única de verdade para lógica de estado:
 * - CRITICAL: worker_status === "OFFLINE"
 * - WARNING: queue_size >= 10
 * - NORMAL: default
 */
export function useSystemStatus(): UseSystemStatusReturn {
  const [data, setData] = useState<SystemStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lógica de estado centralizada (ÚNICA no sistema)
  const getSystemState = useCallback((response: SystemStatusResponse | null): SystemState => {
    if (!response) return 'NORMAL';
    
    // Prioridade 1: CRÍTICO se worker offline
    if (response.worker_status === 'OFFLINE') {
      return 'CRITICAL';
    }
    
    // Prioridade 2: ALERTA se fila >= 10 (converter string para number)
    const queueSize = Number(response.queue_size);
    if (queueSize >= 10) {
      return 'WARNING';
    }
    
    // Default: NORMAL
    return 'NORMAL';
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      // Fetch público simples - SEM headers extras para evitar CORS preflight
      const response = await fetch(SYSTEM_STATUS_ENDPOINT, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar status: ${response.status}`);
      }
      
      const json: SystemStatusResponse = await response.json();
      setData(json);
      setError(null);
    } catch (err) {
      console.error('[useSystemStatus] Erro:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      // NÃO limpar data - preservar último estado válido
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch inicial + polling a cada 30 segundos
  useEffect(() => {
    fetchStatus();
    
    const interval = setInterval(fetchStatus, POLLING_INTERVAL);
    
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return {
    status: data?.status ?? null,
    workerStatus: data?.worker_status ?? null,
    queueSize: data ? Number(data.queue_size) : 0,  // Sempre converter para number
    checkedAt: data?.checked_at ? new Date(data.checked_at) : null,
    systemState: getSystemState(data),
    isLoading,
    error,
    refresh: fetchStatus,
  };
}
