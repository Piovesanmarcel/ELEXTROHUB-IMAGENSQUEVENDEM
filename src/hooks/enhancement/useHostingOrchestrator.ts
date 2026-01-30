import { toast } from "sonner";

interface AttemptLog {
  provider: string;
  duration: number;
  error?: string;
  status: 'success' | 'failed';
}

interface HostingResult {
  hostedUrl: string;
  hosted: boolean;
  service: string;
  attempts: number;
  trace: AttemptLog[];
}

/**
 * Hook simplificado - SEM hospedagem R2
 * Retorna URLs diretamente sem upload
 */
export const useHostingOrchestrator = () => {
  
  const hostDirect = async (url: string, fileName: string): Promise<HostingResult> => {
    console.log('🎯 [ORCHESTRATOR SIMPLIFICADO] Usando URL direta (sem R2)');
    
    return {
      hostedUrl: url,
      hosted: false,
      service: 'direct-url',
      attempts: 0,
      trace: []
    };
  };

  return {
    hostDirect
  };
};
