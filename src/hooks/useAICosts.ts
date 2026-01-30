import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo, useState } from 'react';

// Tabela de preços oficial (espelhada do backend)
export const API_PRICING_REFERENCE = {
  gemini: [
    { model: 'Gemini 2.5 Flash', input: 0.15, output: 0.60, image: 0.039 },
    { model: 'Gemini 2.5 Flash Image', input: 0.15, output: 0.60, image: 0.039 },
    { model: 'Gemini 2.5 Pro', input: 1.25, output: 10.00, image: null },
    { model: 'Gemini 3 Pro Image', input: 2.00, output: 12.00, image: 0.134 },
  ],
  openai: [
    { model: 'GPT-4o Mini', input: 0.15, output: 0.60, image: null },
    { model: 'GPT-4o', input: 2.50, output: 10.00, image: null },
    { model: 'GPT-4.1', input: 2.00, output: 8.00, image: null },
    { model: 'GPT-4.1 Mini', input: 0.40, output: 1.60, image: null },
  ],
  usdToBrl: 6.10,
};

export interface AIUsageLog {
  id: string;
  user_id: string | null;
  api_provider: string;
  function_name: string;
  model_used: string | null;
  command: string | null;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  estimated_cost_brl: number;
  usd_to_brl_rate: number;
  execution_time_ms: number | null;
  success: boolean | null;
  created_at: string;
}

export interface AICostTotals {
  totalCostBRL: number;
  totalCostUSD: number;
  totalTokens: number;
  totalRequests: number;
  byProvider: {
    gemini: { requests: number; tokens: number; costBRL: number; costUSD: number };
    openai: { requests: number; tokens: number; costBRL: number; costUSD: number };
  };
  byFunction: Record<string, { requests: number; tokens: number; costBRL: number; costUSD: number }>;
  byModel: Record<string, { requests: number; tokens: number; costBRL: number; costUSD: number }>;
}

interface UseAICostsOptions {
  enabled?: boolean; // ✅ Controlar se a query deve rodar
}

export const useAICosts = (options: UseAICostsOptions = {}) => {
  const { enabled = false } = options; // ✅ DESABILITADO por padrão - reduz tráfego desnecessário
  
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedFunction, setSelectedFunction] = useState<string>('all');

  const { data: logs, isLoading, error, refetch } = useQuery({
    queryKey: ['ai-usage-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_usage_logs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((log: any) => ({
        id: log.id,
        user_id: log.user_id,
        api_provider: log.api_provider || 'unknown',
        function_name: log.function_name || 'unknown',
        model_used: log.model_used || 'unknown',
        command: log.command,
        prompt_tokens: log.prompt_tokens || 0,
        completion_tokens: log.completion_tokens || 0,
        total_tokens: log.total_tokens || 0,
        estimated_cost_usd: log.estimated_cost_usd || 0,
        estimated_cost_brl: log.estimated_cost_brl || 0,
        usd_to_brl_rate: log.usd_to_brl_rate || 6.10,
        execution_time_ms: log.execution_time_ms,
        success: log.success,
        created_at: log.created_at,
      })) as AIUsageLog[];
    },
    enabled, // ✅ Só executa se enabled=true
    staleTime: 60_000, // ✅ Dados válidos por 1 minuto
    refetchOnWindowFocus: false, // ✅ Não refetch ao focar janela
    refetchOnMount: false, // ✅ Não refetch ao montar
    retry: 1, // ✅ Apenas 1 retry em caso de erro
    retryDelay: 2000, // ✅ 2s entre retries
  });

  // Lista de providers únicos
  const providers = useMemo(() => {
    if (!logs) return [];
    const provs = new Set<string>();
    logs.forEach(log => {
      if (log.api_provider) {
        provs.add(log.api_provider);
      }
    });
    return Array.from(provs).sort();
  }, [logs]);

  // Lista de functions únicas
  const functions = useMemo(() => {
    if (!logs) return [];
    const funcs = new Set<string>();
    logs.forEach(log => {
      if (log.function_name) {
        funcs.add(log.function_name);
      }
    });
    return Array.from(funcs).sort();
  }, [logs]);

  // Logs filtrados
  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter(log => {
      const matchProvider = selectedProvider === 'all' || log.api_provider === selectedProvider;
      const matchFunction = selectedFunction === 'all' || log.function_name === selectedFunction;
      return matchProvider && matchFunction;
    });
  }, [logs, selectedProvider, selectedFunction]);

  const totals = useMemo<AICostTotals>(() => {
    const emptyTotals: AICostTotals = {
      totalCostBRL: 0,
      totalCostUSD: 0,
      totalTokens: 0,
      totalRequests: 0,
      byProvider: {
        gemini: { requests: 0, tokens: 0, costBRL: 0, costUSD: 0 },
        openai: { requests: 0, tokens: 0, costBRL: 0, costUSD: 0 },
      },
      byFunction: {},
      byModel: {},
    };

    if (!filteredLogs || filteredLogs.length === 0) return emptyTotals;

    const totalCostBRL = filteredLogs.reduce((sum, log) => sum + (log.estimated_cost_brl || 0), 0);
    const totalCostUSD = filteredLogs.reduce((sum, log) => sum + (log.estimated_cost_usd || 0), 0);
    const totalTokens = filteredLogs.reduce((sum, log) => sum + (log.total_tokens || 0), 0);
    const totalRequests = filteredLogs.length;

    // Por provider
    const geminiLogs = filteredLogs.filter(log => log.api_provider?.toLowerCase() === 'gemini');
    const openaiLogs = filteredLogs.filter(log => log.api_provider?.toLowerCase() === 'openai');

    // Por function
    const byFunction: Record<string, { requests: number; tokens: number; costBRL: number; costUSD: number }> = {};
    filteredLogs.forEach(log => {
      const funcName = log.function_name || 'unknown';
      if (!byFunction[funcName]) {
        byFunction[funcName] = { requests: 0, tokens: 0, costBRL: 0, costUSD: 0 };
      }
      byFunction[funcName].requests += 1;
      byFunction[funcName].tokens += log.total_tokens || 0;
      byFunction[funcName].costBRL += log.estimated_cost_brl || 0;
      byFunction[funcName].costUSD += log.estimated_cost_usd || 0;
    });

    // Por modelo
    const byModel: Record<string, { requests: number; tokens: number; costBRL: number; costUSD: number }> = {};
    filteredLogs.forEach(log => {
      const modelName = log.model_used || 'unknown';
      if (!byModel[modelName]) {
        byModel[modelName] = { requests: 0, tokens: 0, costBRL: 0, costUSD: 0 };
      }
      byModel[modelName].requests += 1;
      byModel[modelName].tokens += log.total_tokens || 0;
      byModel[modelName].costBRL += log.estimated_cost_brl || 0;
      byModel[modelName].costUSD += log.estimated_cost_usd || 0;
    });

    return {
      totalCostBRL,
      totalCostUSD,
      totalTokens,
      totalRequests,
      byProvider: {
        gemini: {
          requests: geminiLogs.length,
          tokens: geminiLogs.reduce((sum, log) => sum + (log.total_tokens || 0), 0),
          costBRL: geminiLogs.reduce((sum, log) => sum + (log.estimated_cost_brl || 0), 0),
          costUSD: geminiLogs.reduce((sum, log) => sum + (log.estimated_cost_usd || 0), 0),
        },
        openai: {
          requests: openaiLogs.length,
          tokens: openaiLogs.reduce((sum, log) => sum + (log.total_tokens || 0), 0),
          costBRL: openaiLogs.reduce((sum, log) => sum + (log.estimated_cost_brl || 0), 0),
          costUSD: openaiLogs.reduce((sum, log) => sum + (log.estimated_cost_usd || 0), 0),
        },
      },
      byFunction,
      byModel,
    };
  }, [filteredLogs]);

  return { 
    logs: filteredLogs, 
    allLogs: logs,
    totals, 
    isLoading, 
    error, 
    refetch,
    // Filtros
    selectedProvider,
    setSelectedProvider,
    selectedFunction,
    setSelectedFunction,
    providers,
    functions,
    // Referência de preços
    pricingReference: API_PRICING_REFERENCE,
  };
};
