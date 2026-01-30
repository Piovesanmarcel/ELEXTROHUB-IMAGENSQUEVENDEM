import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CheckResult {
  status: 'ok' | 'error' | 'warning' | 'pending';
  message: string;
  value?: any;
  latencyMs?: number;
}

export interface PreflightResults {
  database: CheckResult;
  credits: CheckResult;
  geminiApi: CheckResult;
  openaiApi: CheckResult;
  allCriticalPassed: boolean;
  totalTimeMs: number;
}

const initialResults: PreflightResults = {
  database: { status: 'pending', message: 'Aguardando...' },
  credits: { status: 'pending', message: 'Aguardando...' },
  geminiApi: { status: 'pending', message: 'Aguardando...' },
  openaiApi: { status: 'pending', message: 'Aguardando...' },
  allCriticalPassed: false,
  totalTimeMs: 0
};

export function usePreflightCheck(productId: string, images: string[]) {
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<PreflightResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runCheck = useCallback(async () => {
    setIsChecking(true);
    setResults(initialResults);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('🔍 [usePreflightCheck] Iniciando verificações para produto:', productId);

      const response = await supabase.functions.invoke('preflight-check', {
        body: {
          productId,
          userId: user.id
        }
      });

      if (response.error) {
        const errMsg = response.error.message || '';
        if (errMsg.includes('401') || errMsg.includes('Unauthorized') || errMsg.includes('JWT')) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        if (errMsg.includes('FunctionsHttpError')) {
          throw new Error('Erro de comunicação com servidor');
        }
        throw new Error(errMsg || 'Erro na verificação');
      }

      const data = response.data as PreflightResults;
      setResults(data);
      console.log('✅ [usePreflightCheck] Concluído em', data.totalTimeMs, 'ms');
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('❌ [usePreflightCheck] Erro:', err);
      
      const failedResult: PreflightResults = {
        ...initialResults,
        database: { status: 'error', message: errorMessage },
        allCriticalPassed: false
      };
      setResults(failedResult);
      return failedResult;
    } finally {
      setIsChecking(false);
    }
  }, [productId]);

  const reset = useCallback(() => {
    setResults(null);
    setError(null);
    setIsChecking(false);
  }, []);

  const canProceed = results?.allCriticalPassed ?? false;

  const completedChecks = results 
    ? Object.values(results)
        .filter((v): v is CheckResult => typeof v === 'object' && v !== null && 'status' in v)
        .filter(check => check.status !== 'pending').length
    : 0;
  
  const totalChecks = 4; // database, credits, geminiApi, openaiApi

  return {
    runCheck,
    reset,
    isChecking,
    results,
    error,
    canProceed,
    completedChecks,
    totalChecks
  };
}
