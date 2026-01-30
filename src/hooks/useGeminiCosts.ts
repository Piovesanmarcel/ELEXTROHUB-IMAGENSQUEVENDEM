import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo, useState } from 'react';

export interface GeminiUsageLog {
  id: string;
  user_id: string;
  product_id: string | null;
  operation_type: string;
  model_used: string;
  prompt_tokens: number;
  candidates_tokens: number;
  total_tokens: number;
  images_generated: number;
  image_resolution: string;
  estimated_cost_usd: number;
  estimated_cost_brl: number;
  usd_to_brl_rate: number;
  created_at: string;
  source: string | null;
  api_key_id: string | null;
  api_key_name: string | null;
}

export interface GeminiCostTotals {
  totalCostBRL: number;
  totalCostUSD: number;
  totalImages: number;
  totalTokens: number;
  averageCostPerImage: number;
  byType: {
    background: { images: number; costBRL: number; costUSD: number };
    carousel: { images: number; costBRL: number; costUSD: number };
  };
  bySource: {
    products: { images: number; costBRL: number; costUSD: number };
    templates: { images: number; costBRL: number; costUSD: number };
    carousel: { images: number; costBRL: number; costUSD: number };
  };
  byApiKey: Record<string, { images: number; costBRL: number; costUSD: number }>;
}

export const useGeminiCosts = () => {
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedApiKey, setSelectedApiKey] = useState<string>('all');

  const { data: logs, isLoading, error, refetch } = useQuery({
    queryKey: ['gemini-usage-logs'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('ai_usage_logs')
        .select('*')
        .eq('api_provider', 'gemini')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Map ai_usage_logs to GeminiUsageLog format
      return (data || []).map((log: any) => ({
        id: log.id,
        user_id: log.user_id,
        product_id: null,
        operation_type: log.function_name || 'unknown',
        model_used: log.model_used || 'unknown',
        prompt_tokens: log.prompt_tokens || 0,
        candidates_tokens: log.completion_tokens || 0,
        total_tokens: log.total_tokens || 0,
        images_generated: 1,
        image_resolution: '1024x1024',
        estimated_cost_usd: log.estimated_cost_usd || 0,
        estimated_cost_brl: log.estimated_cost_brl || 0,
        usd_to_brl_rate: log.usd_to_brl_rate || 5.5,
        created_at: log.created_at,
        source: log.command || null,
        api_key_id: null,
        api_key_name: null
      })) as GeminiUsageLog[];
    }
  });

  // Lista única de API Keys
  const apiKeys = useMemo(() => {
    if (!logs) return [];
    const keys = new Set<string>();
    logs.forEach(log => {
      if (log.api_key_name) {
        keys.add(log.api_key_name);
      }
    });
    return Array.from(keys).sort();
  }, [logs]);

  // Lista única de sources
  const sources = useMemo(() => {
    if (!logs) return [];
    const srcs = new Set<string>();
    logs.forEach(log => {
      if (log.source) {
        srcs.add(log.source);
      }
    });
    return Array.from(srcs).sort();
  }, [logs]);

  // Logs filtrados
  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter(log => {
      const matchSource = selectedSource === 'all' || log.source === selectedSource;
      const matchApiKey = selectedApiKey === 'all' || log.api_key_name === selectedApiKey;
      return matchSource && matchApiKey;
    });
  }, [logs, selectedSource, selectedApiKey]);

  const totals = useMemo<GeminiCostTotals>(() => {
    const emptyTotals: GeminiCostTotals = {
      totalCostBRL: 0,
      totalCostUSD: 0,
      totalImages: 0,
      totalTokens: 0,
      averageCostPerImage: 0,
      byType: {
        background: { images: 0, costBRL: 0, costUSD: 0 },
        carousel: { images: 0, costBRL: 0, costUSD: 0 }
      },
      bySource: {
        products: { images: 0, costBRL: 0, costUSD: 0 },
        templates: { images: 0, costBRL: 0, costUSD: 0 },
        carousel: { images: 0, costBRL: 0, costUSD: 0 }
      },
      byApiKey: {}
    };

    if (!filteredLogs || filteredLogs.length === 0) return emptyTotals;

    const totalCostBRL = filteredLogs.reduce((sum, log) => sum + (log.estimated_cost_brl || 0), 0);
    const totalCostUSD = filteredLogs.reduce((sum, log) => sum + (log.estimated_cost_usd || 0), 0);
    const totalImages = filteredLogs.reduce((sum, log) => sum + (log.images_generated || 0), 0);
    const totalTokens = filteredLogs.reduce((sum, log) => sum + (log.total_tokens || 0), 0);

    // Por tipo de operação (legado)
    const backgroundLogs = filteredLogs.filter(log => 
      log.operation_type?.toLowerCase().includes('background')
    );
    const carouselLogs = filteredLogs.filter(log => 
      log.operation_type?.toLowerCase().includes('carousel')
    );

    // Por source
    const productsLogs = filteredLogs.filter(log => log.source === 'products');
    const templatesLogs = filteredLogs.filter(log => log.source === 'templates');
    const carouselSourceLogs = filteredLogs.filter(log => log.source === 'carousel');

    // Por API Key
    const byApiKey: Record<string, { images: number; costBRL: number; costUSD: number }> = {};
    filteredLogs.forEach(log => {
      const keyName = log.api_key_name || 'Sem identificação';
      if (!byApiKey[keyName]) {
        byApiKey[keyName] = { images: 0, costBRL: 0, costUSD: 0 };
      }
      byApiKey[keyName].images += log.images_generated || 0;
      byApiKey[keyName].costBRL += log.estimated_cost_brl || 0;
      byApiKey[keyName].costUSD += log.estimated_cost_usd || 0;
    });

    return {
      totalCostBRL,
      totalCostUSD,
      totalImages,
      totalTokens,
      averageCostPerImage: totalImages > 0 ? totalCostBRL / totalImages : 0,
      byType: {
        background: {
          images: backgroundLogs.reduce((sum, log) => sum + (log.images_generated || 0), 0),
          costBRL: backgroundLogs.reduce((sum, log) => sum + (log.estimated_cost_brl || 0), 0),
          costUSD: backgroundLogs.reduce((sum, log) => sum + (log.estimated_cost_usd || 0), 0)
        },
        carousel: {
          images: carouselLogs.reduce((sum, log) => sum + (log.images_generated || 0), 0),
          costBRL: carouselLogs.reduce((sum, log) => sum + (log.estimated_cost_brl || 0), 0),
          costUSD: carouselLogs.reduce((sum, log) => sum + (log.estimated_cost_usd || 0), 0)
        }
      },
      bySource: {
        products: {
          images: productsLogs.reduce((sum, log) => sum + (log.images_generated || 0), 0),
          costBRL: productsLogs.reduce((sum, log) => sum + (log.estimated_cost_brl || 0), 0),
          costUSD: productsLogs.reduce((sum, log) => sum + (log.estimated_cost_usd || 0), 0)
        },
        templates: {
          images: templatesLogs.reduce((sum, log) => sum + (log.images_generated || 0), 0),
          costBRL: templatesLogs.reduce((sum, log) => sum + (log.estimated_cost_brl || 0), 0),
          costUSD: templatesLogs.reduce((sum, log) => sum + (log.estimated_cost_usd || 0), 0)
        },
        carousel: {
          images: carouselSourceLogs.reduce((sum, log) => sum + (log.images_generated || 0), 0),
          costBRL: carouselSourceLogs.reduce((sum, log) => sum + (log.estimated_cost_brl || 0), 0),
          costUSD: carouselSourceLogs.reduce((sum, log) => sum + (log.estimated_cost_usd || 0), 0)
        }
      },
      byApiKey
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
    selectedSource,
    setSelectedSource,
    selectedApiKey,
    setSelectedApiKey,
    apiKeys,
    sources
  };
};
