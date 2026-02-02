import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import * as XLSX from 'xlsx';
import {
  Loader2,
  DollarSign,
  Zap,
  Image as ImageIcon,
  TrendingUp,
  Calendar,
  RefreshCw,
  Brain,
  Sparkles,
  Download,
  Search,
  Filter,
  BarChart3,
  PieChartIcon,
  CheckCircle,
  XCircle,
  Clock,
  Activity
} from 'lucide-react';

interface UsageSummary {
  date: string;
  provider: string;
  model: string;
  total_calls: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  total_images: number;
  total_cost_usd: number;
  avg_response_ms: number;
}

interface PricingInfo {
  provider: string;
  model: string;
  input_price_per_1m: number;
  output_price_per_1m: number;
  image_price: number;
  notes: string;
}

interface DetailedCall {
  id: string;
  created_at: string;
  brt_date: string;
  provider: string;
  model: string;
  operation: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  images_count: number;
  total_cost: number;
  job_id: string | null;
  session_id: string | null;
  success: boolean;
  request_metadata: any;
  response_time_ms?: number;
}

interface FxRate {
  rate_date: string;
  usd_brl: number;
  reference_date?: string | null;
  source?: string | null;
}

// Cores para graficos
const CHART_COLORS = {
  gemini: '#3B82F6',
  openai: '#22C55E',
  anthropic: '#F97316',
  default: '#6B7280'
};

const PIE_COLORS = ['#3B82F6', '#22C55E', '#F97316', '#8B5CF6', '#EC4899', '#14B8A6'];

const brtDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

const brtDateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});

const brtDateTimeFullFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});

const toBrtDate = (value: string) => brtDateFormatter.format(new Date(value));
const toBrtDateTime = (value: string) => brtDateTimeFormatter.format(new Date(value));
const toBrtDateTimeFull = (value: string) => brtDateTimeFullFormatter.format(new Date(value));
const toShortBrtDate = (value: string) => value.split('-').reverse().slice(0, 2).join('/');

export default function AICostsDashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [dailySummary, setDailySummary] = useState<UsageSummary[]>([]);
  const [detailedCalls, setDetailedCalls] = useState<DetailedCall[]>([]);
  const [pricing, setPricing] = useState<PricingInfo[]>([]);
  const [fxRates, setFxRates] = useState<Record<string, FxRate>>({});
  const [totals, setTotals] = useState({
    totalCost: 0,
    totalTokens: 0,
    totalCalls: 0,
    totalImages: 0
  });

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [operationFilter, setOperationFilter] = useState<string>('all');

  // Buscar usuario atual
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Carregar dados
  const loadData = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data: summaryData, error: summaryError } = await supabase
        .from('ai_usage_log')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (summaryError) {
        console.error('Erro ao buscar uso:', summaryError);
      }

      setDetailedCalls((summaryData || []).map((row: any) => ({
        id: row.id,
        created_at: row.created_at,
        brt_date: toBrtDate(row.created_at),
        provider: row.provider,
        model: row.model,
        operation: row.operation || 'text',
        input_tokens: row.input_tokens || 0,
        output_tokens: row.output_tokens || 0,
        total_tokens: row.total_tokens || 0,
        images_count: row.images_count || 0,
        total_cost: parseFloat(row.total_cost) || 0,
        job_id: row.job_id,
        session_id: row.session_id,
        success: row.success !== false,
        request_metadata: row.request_metadata || {},
        response_time_ms: row.response_time_ms
      })));

      const grouped: Record<string, UsageSummary> = {};
      (summaryData || []).forEach((row: any) => {
        const date = toBrtDate(row.created_at);
        const key = `${date}-${row.provider}-${row.model}`;

        if (!grouped[key]) {
          grouped[key] = {
            date,
            provider: row.provider,
            model: row.model,
            total_calls: 0,
            total_input_tokens: 0,
            total_output_tokens: 0,
            total_tokens: 0,
            total_images: 0,
            total_cost_usd: 0,
            avg_response_ms: 0
          };
        }

        grouped[key].total_calls += 1;
        grouped[key].total_input_tokens += row.input_tokens || 0;
        grouped[key].total_output_tokens += row.output_tokens || 0;
        grouped[key].total_tokens += row.total_tokens || 0;
        grouped[key].total_images += row.images_count || 0;
        grouped[key].total_cost_usd += parseFloat(row.total_cost) || 0;
      });

      const summaryList = Object.values(grouped).sort((a, b) => {
        const timeA = new Date(`${a.date}T00:00:00`).getTime();
        const timeB = new Date(`${b.date}T00:00:00`).getTime();
        return timeB - timeA;
      });
      setDailySummary(summaryList);

      const totalCost = summaryList.reduce((acc, s) => acc + s.total_cost_usd, 0);
      const totalTokens = summaryList.reduce((acc, s) => acc + s.total_tokens, 0);
      const totalCalls = summaryList.reduce((acc, s) => acc + s.total_calls, 0);
      const totalImages = summaryList.reduce((acc, s) => acc + s.total_images, 0);
      setTotals({ totalCost, totalTokens, totalCalls, totalImages });

      const { data: pricingData } = await supabase
        .from('ai_pricing')
        .select('*')
        .order('provider', { ascending: true });

      setPricing(pricingData || []);

    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFxRates = async (dates: string[]) => {
    const uniqueDates = Array.from(new Set(dates.filter(Boolean)));
    if (uniqueDates.length === 0) {
      setFxRates({});
      return;
    }

    try {
      const { data: existingRates, error: existingError } = await supabase
        .from('fx_rates')
        .select('rate_date, usd_brl, reference_date, source')
        .in('rate_date', uniqueDates);

      if (existingError) {
        console.error('Erro ao buscar cotacoes:', existingError);
      }

      const ratesMap: Record<string, FxRate> = {};
      (existingRates || []).forEach((rate: any) => {
        ratesMap[rate.rate_date] = {
          rate_date: rate.rate_date,
          usd_brl: Number(rate.usd_brl),
          reference_date: rate.reference_date,
          source: rate.source
        };
      });

      const missingDates = uniqueDates.filter(date => !ratesMap[date]);

      if (missingDates.length > 0) {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;

        if (!accessToken) {
          console.error('Sessao nao encontrada para buscar cotacoes:', sessionError);
        }

        const { error: invokeError } = await supabase.functions.invoke('fetch-fx-rate', {
          body: { dates: missingDates },
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
        });

        if (invokeError) {
          console.error('Erro ao buscar cotacoes externas:', invokeError);
        }

        const { data: refreshedRates, error: refreshedError } = await supabase
          .from('fx_rates')
          .select('rate_date, usd_brl, reference_date, source')
          .in('rate_date', uniqueDates);

        if (refreshedError) {
          console.error('Erro ao atualizar cotacoes:', refreshedError);
        } else {
          (refreshedRates || []).forEach((rate: any) => {
            ratesMap[rate.rate_date] = {
              rate_date: rate.rate_date,
              usd_brl: Number(rate.usd_brl),
              reference_date: rate.reference_date,
              source: rate.source
            };
          });
        }
      }

      setFxRates(ratesMap);
    } catch (error) {
      console.error('Erro ao carregar cotacoes:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId, period]);

  useEffect(() => {
    const todayBrt = toBrtDate(new Date().toISOString());
    const dates = detailedCalls.map(call => call.brt_date);
    loadFxRates([...dates, todayBrt]);
  }, [detailedCalls]);

  // Metricas adicionais calculadas
  const additionalMetrics = useMemo(() => {
    if (detailedCalls.length === 0) return null;

    const successCalls = detailedCalls.filter(c => c.success).length;
    const failedCalls = detailedCalls.filter(c => !c.success).length;
    const successRate = (successCalls / detailedCalls.length) * 100;

    const avgCostPerCall = totals.totalCalls > 0 ? totals.totalCost / totals.totalCalls : 0;
    const avgTokensPerCall = totals.totalCalls > 0 ? totals.totalTokens / totals.totalCalls : 0;

    const callsWithTime = detailedCalls.filter(c => c.response_time_ms);
    const avgResponseTime = callsWithTime.length > 0
      ? callsWithTime.reduce((acc, c) => acc + (c.response_time_ms || 0), 0) / callsWithTime.length
      : 0;

    // Modelo mais usado
    const modelCounts: Record<string, number> = {};
    detailedCalls.forEach(c => {
      modelCounts[c.model] = (modelCounts[c.model] || 0) + 1;
    });
    const mostUsedModel = Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      successRate,
      successCalls,
      failedCalls,
      avgCostPerCall,
      avgTokensPerCall,
      avgResponseTime,
      mostUsedModel: mostUsedModel ? { name: mostUsedModel[0], count: mostUsedModel[1] } : null
    };
  }, [detailedCalls, totals]);

  // Dados para grafico de linha (tendencia diaria)
  const chartData = useMemo(() => {
    const byDate: Record<string, { date: string; cost: number; calls: number; tokens: number }> = {};

    dailySummary.forEach(s => {
      if (!byDate[s.date]) {
        byDate[s.date] = { date: s.date, cost: 0, calls: 0, tokens: 0 };
      }
      byDate[s.date].cost += s.total_cost_usd;
      byDate[s.date].calls += s.total_calls;
      byDate[s.date].tokens += s.total_tokens;
    });

    return Object.values(byDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({
        ...d,
        date: d.date.split('-').reverse().slice(0, 2).join('/'),
        cost: parseFloat(d.cost.toFixed(4))
      }));
  }, [dailySummary]);

  // Dados para grafico de pizza (por provider)
  const pieData = useMemo(() => {
    const byProvider: Record<string, number> = {};
    dailySummary.forEach(s => {
      byProvider[s.provider] = (byProvider[s.provider] || 0) + s.total_cost_usd;
    });
    return Object.entries(byProvider).map(([name, value]) => ({
      name: name === 'gemini' ? 'Google' : name === 'openai' ? 'OpenAI' : name,
      value: parseFloat(value.toFixed(4)),
      provider: name
    }));
  }, [dailySummary]);

  // Filtrar chamadas detalhadas
  const filteredCalls = useMemo(() => {
    return detailedCalls.filter(call => {
      const matchesSearch = searchQuery === '' ||
        call.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        call.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (call.job_id && call.job_id.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesProvider = providerFilter === 'all' || call.provider === providerFilter;
      const matchesOperation = operationFilter === 'all' || call.operation === operationFilter;

      return matchesSearch && matchesProvider && matchesOperation;
    });
  }, [detailedCalls, searchQuery, providerFilter, operationFilter]);

  // Exportar para Excel
  const exportToExcel = () => {
    const data = filteredCalls.map(call => {
      const fxRate = fxRates[call.brt_date]?.usd_brl;
      const hasFxRate = typeof fxRate === 'number' && Number.isFinite(fxRate);
      const brlCost = hasFxRate ? call.total_cost * fxRate : null;

      return {
        'Data/Hora': toBrtDateTimeFull(call.created_at),
        'Provider': call.provider,
        'Modelo': call.model,
        'Tipo': call.operation,
        'Tokens Input': call.input_tokens,
        'Tokens Output': call.output_tokens,
        'Tokens Total': call.total_tokens,
        'Imagens': call.images_count,
        'Custo (USD)': call.total_cost.toFixed(6),
        'Cotacao USD/BRL': hasFxRate ? Number(fxRate.toFixed(2)) : '',
        'Custo (BRL)': brlCost !== null ? Number(brlCost.toFixed(2)) : '',
        'Status': call.success ? 'Sucesso' : 'Erro',
        'Job ID': call.job_id || '-'
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Custos IA');
    XLSX.writeFile(wb, `custos-ia-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Exportar para CSV
  const exportToCSV = () => {
    const headers = [
      'Data/Hora',
      'Provider',
      'Modelo',
      'Tipo',
      'Tokens Input',
      'Tokens Output',
      'Tokens Total',
      'Imagens',
      'Custo (USD)',
      'Cotacao USD/BRL',
      'Custo (BRL)',
      'Status',
      'Job ID'
    ];
    const rows = filteredCalls.map(call => {
      const fxRate = fxRates[call.brt_date]?.usd_brl;
      const hasFxRate = typeof fxRate === 'number' && Number.isFinite(fxRate);
      const brlCost = hasFxRate ? call.total_cost * fxRate : null;

      return [
        toBrtDateTimeFull(call.created_at),
        call.provider,
        call.model,
        call.operation,
        call.input_tokens,
        call.output_tokens,
        call.total_tokens,
        call.images_count,
        call.total_cost.toFixed(6),
        hasFxRate ? fxRate.toFixed(2) : '',
        brlCost !== null ? brlCost.toFixed(2) : '',
        call.success ? 'Sucesso' : 'Erro',
        call.job_id || '-'
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `custos-ia-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    }).format(value);
  };

  const formatCurrencyBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatCurrencyBRLTable = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(value);
  };

  const formatFxRate = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const todayBrtDate = toBrtDate(new Date().toISOString());
  const todayFxRate = fxRates[todayBrtDate];
  const todayFxRateLabel = todayFxRate ? formatCurrencyBRL(todayFxRate.usd_brl) : '-';
  const todayFxReference = todayFxRate?.reference_date && todayFxRate.reference_date !== todayBrtDate
    ? toShortBrtDate(todayFxRate.reference_date)
    : null;

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const byProvider = dailySummary.reduce((acc, s) => {
    if (!acc[s.provider]) {
      acc[s.provider] = { cost: 0, tokens: 0, calls: 0 };
    }
    acc[s.provider].cost += s.total_cost_usd;
    acc[s.provider].tokens += s.total_tokens;
    acc[s.provider].calls += s.total_calls;
    return acc;
  }, {} as Record<string, { cost: number; tokens: number; calls: number }>);

  const providerColors: Record<string, string> = {
    gemini: 'bg-blue-500',
    openai: 'bg-green-500',
    anthropic: 'bg-orange-500'
  };

  // Lista de providers e operacoes unicas para filtros
  const uniqueProviders = [...new Set(detailedCalls.map(c => c.provider))];
  const uniqueOperations = [...new Set(detailedCalls.map(c => c.operation))];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-500" />
            Custos de IA
          </h1>
          <p className="text-muted-foreground">
            Acompanhe o uso e custos de APIs de inteligencia artificial
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Custo Total</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totals.totalCost)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cotacao dolar hoje</p>
                <p className="text-2xl font-bold text-blue-600">
                  {todayFxRateLabel}
                </p>
                {todayFxReference && (
                  <p className="text-xs text-muted-foreground">
                    Ref: {todayFxReference}
                  </p>
                )}
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tokens</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatNumber(totals.totalTokens)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chamadas API</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatNumber(totals.totalCalls)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Imagens Geradas</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatNumber(totals.totalImages)}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <ImageIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metricas Adicionais */}
      {additionalMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-xs text-green-700">Taxa Sucesso</span>
              </div>
              <p className="text-lg font-bold text-green-800">{additionalMetrics.successRate.toFixed(1)}%</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-xs text-red-700">Erros</span>
              </div>
              <p className="text-lg font-bold text-red-800">{additionalMetrics.failedCalls}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-blue-700">Custo/Chamada</span>
              </div>
              <p className="text-lg font-bold text-blue-800">${additionalMetrics.avgCostPerCall.toFixed(4)}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-600" />
                <span className="text-xs text-purple-700">Tokens/Chamada</span>
              </div>
              <p className="text-lg font-bold text-purple-800">{formatNumber(additionalMetrics.avgTokensPerCall)}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-xs text-orange-700">Tempo Medio</span>
              </div>
              <p className="text-lg font-bold text-orange-800">
                {additionalMetrics.avgResponseTime > 0 ? `${(additionalMetrics.avgResponseTime / 1000).toFixed(1)}s` : '-'}
              </p>
            </CardContent>
          </Card>

          {additionalMetrics.mostUsedModel && (
            <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-pink-600" />
                  <span className="text-xs text-pink-700">Mais Usado</span>
                </div>
                <p className="text-sm font-bold text-pink-800 truncate" title={additionalMetrics.mostUsedModel.name}>
                  {additionalMetrics.mostUsedModel.name.slice(0, 15)}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Graficos */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grafico de Tendencia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Tendencia de Custos
              </CardTitle>
              <CardDescription>Evolucao diaria dos custos no periodo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toFixed(4)}`, 'Custo']}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="cost"
                    name="Custo (USD)"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={{ fill: '#8B5CF6', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Grafico de Pizza */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Distribuicao por Provider
              </CardTitle>
              <CardDescription>Proporcao de custos por provedor</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: '#6B7280', strokeWidth: 1 }}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[entry.provider as keyof typeof CHART_COLORS] || PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toFixed(4)}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Distribuicao por Provider (barras) */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuicao por Provider</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(byProvider).map(([provider, data]) => {
              const percentage = totals.totalCost > 0
                ? (data.cost / totals.totalCost) * 100
                : 0;

              return (
                <div key={provider} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={providerColors[provider] || 'bg-gray-500'}>
                        {provider}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {data.calls} chamadas | {formatNumber(data.tokens)} tokens
                      </span>
                    </div>
                    <span className="font-medium">{formatCurrency(data.cost)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${providerColors[provider] || 'bg-gray-500'} transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {Object.keys(byProvider).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum uso registrado no periodo</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Historico, Detalhado e Precos */}
      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">
            <Calendar className="h-4 w-4 mr-2" />
            Historico Diario
          </TabsTrigger>
          <TabsTrigger value="detailed">
            <Zap className="h-4 w-4 mr-2" />
            Chamadas Detalhadas
          </TabsTrigger>
          <TabsTrigger value="pricing">
            <DollarSign className="h-4 w-4 mr-2" />
            Tabela de Precos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : dailySummary.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2">Data</th>
                        <th className="text-left py-3 px-2">Provider</th>
                        <th className="text-left py-3 px-2">Modelo</th>
                        <th className="text-right py-3 px-2">Chamadas</th>
                        <th className="text-right py-3 px-2">Input</th>
                        <th className="text-right py-3 px-2">Output</th>
                        <th className="text-right py-3 px-2">Imagens</th>
                        <th className="text-right py-3 px-2">Custo</th>
                        <th className="text-right py-3 px-2">Cotacao USD/BRL</th>
                        <th className="text-right py-3 px-2">Custo (BRL)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailySummary.map((row, idx) => {
                        const fxRate = fxRates[row.date]?.usd_brl;
                        const hasFxRate = typeof fxRate === 'number' && Number.isFinite(fxRate);
                        const brlCost = hasFxRate ? row.total_cost_usd * fxRate : null;

                        return (
                          <tr key={idx} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-2">{row.date}</td>
                            <td className="py-3 px-2">
                              <Badge variant="outline" className="capitalize">
                                {row.provider}
                              </Badge>
                            </td>
                            <td className="py-3 px-2 font-mono text-xs">{row.model}</td>
                            <td className="py-3 px-2 text-right">{row.total_calls}</td>
                            <td className="py-3 px-2 text-right">{formatNumber(row.total_input_tokens)}</td>
                            <td className="py-3 px-2 text-right">{formatNumber(row.total_output_tokens)}</td>
                            <td className="py-3 px-2 text-right">{row.total_images || '-'}</td>
                            <td className="py-3 px-2 text-right font-medium text-green-600">
                              {formatCurrency(row.total_cost_usd)}
                            </td>
                            <td className="py-3 px-2 text-right font-mono text-xs">
                              {hasFxRate ? formatFxRate(fxRate) : '-'}
                            </td>
                            <td className="py-3 px-2 text-right font-medium text-emerald-700">
                              {brlCost !== null ? formatCurrencyBRLTable(brlCost) : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum registro encontrado</p>
                  <p className="text-sm">Os custos aparecerao aqui quando voce usar APIs de IA</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>Chamadas Detalhadas</CardTitle>
                  <CardDescription>
                    Historico completo de cada chamada individual de IA ({filteredCalls.length} registros)
                  </CardDescription>
                </div>

                {/* Botoes de Exportacao */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportToCSV} disabled={filteredCalls.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportToExcel} disabled={filteredCalls.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </div>

              {/* Filtros */}
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar modelo, provider, job ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={providerFilter} onValueChange={setProviderFilter}>
                  <SelectTrigger className="w-36">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {uniqueProviders.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={operationFilter} onValueChange={setOperationFilter}>
                  <SelectTrigger className="w-36">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Operacao" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {uniqueOperations.map(o => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredCalls.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2">Data/Hora</th>
                        <th className="text-left py-3 px-2">Provider</th>
                        <th className="text-left py-3 px-2">Modelo</th>
                        <th className="text-left py-3 px-2">Tipo</th>
                        <th className="text-right py-3 px-2">Input</th>
                        <th className="text-right py-3 px-2">Output</th>
                        <th className="text-right py-3 px-2">Imagens</th>
                        <th className="text-right py-3 px-2">Custo</th>
                        <th className="text-right py-3 px-2">Cotacao USD/BRL</th>
                        <th className="text-right py-3 px-2">Custo (BRL)</th>
                        <th className="text-center py-3 px-2">Status</th>
                        <th className="text-left py-3 px-2">Job ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCalls.slice(0, 100).map((call) => {
                        const fxRate = fxRates[call.brt_date]?.usd_brl;
                        const hasFxRate = typeof fxRate === 'number' && Number.isFinite(fxRate);
                        const brlCost = hasFxRate ? call.total_cost * fxRate : null;

                        return (
                          <tr key={call.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-2 text-xs">
                              {toBrtDateTime(call.created_at)}
                            </td>
                            <td className="py-3 px-2">
                              <Badge className={providerColors[call.provider] || 'bg-gray-500'}>
                                {call.provider}
                              </Badge>
                            </td>
                            <td className="py-3 px-2 font-mono text-xs">{call.model}</td>
                            <td className="py-3 px-2">
                              <Badge variant="outline" className="text-xs">
                                {call.operation}
                              </Badge>
                            </td>
                            <td className="py-3 px-2 text-right font-mono text-xs">
                              {formatNumber(call.input_tokens)}
                            </td>
                            <td className="py-3 px-2 text-right font-mono text-xs">
                              {formatNumber(call.output_tokens)}
                            </td>
                            <td className="py-3 px-2 text-right">
                              {call.images_count > 0 ? call.images_count : '-'}
                            </td>
                            <td className="py-3 px-2 text-right font-medium text-green-600">
                              {formatCurrency(call.total_cost)}
                            </td>
                            <td className="py-3 px-2 text-right font-mono text-xs">
                              {hasFxRate ? formatFxRate(fxRate) : '-'}
                            </td>
                            <td className="py-3 px-2 text-right font-medium text-emerald-700">
                              {brlCost !== null ? formatCurrencyBRLTable(brlCost) : '-'}
                            </td>
                            <td className="py-3 px-2 text-center">
                              {call.success ? (
                                <Badge className="bg-green-100 text-green-700 text-xs">OK</Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-700 text-xs">Erro</Badge>
                              )}
                            </td>
                            <td className="py-3 px-2 font-mono text-xs text-muted-foreground truncate max-w-[120px]" title={call.job_id || '-'}>
                              {call.job_id ? call.job_id.substring(0, 15) + '...' : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredCalls.length > 100 && (
                    <p className="text-center text-sm text-muted-foreground mt-4">
                      Mostrando 100 de {filteredCalls.length} registros. Exporte para ver todos.
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma chamada encontrada</p>
                  <p className="text-sm">Tente ajustar os filtros</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tabela de Precos por Modelo</CardTitle>
              <CardDescription>
                Precos de referencia por 1 milhao de tokens (USD). Per Call assume 500 tokens input + 500 tokens output.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left py-3 px-2 font-semibold">Provider</th>
                      <th className="text-left py-3 px-2 font-semibold">Modelo</th>
                      <th className="text-center py-3 px-2 font-semibold">Context</th>
                      <th className="text-right py-3 px-2 font-semibold">Input/1M</th>
                      <th className="text-right py-3 px-2 font-semibold">Output/1M</th>
                      <th className="text-right py-3 px-2 font-semibold">Per Call</th>
                      <th className="text-right py-3 px-2 font-semibold">Total/1K Calls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricing
                      .filter(row => row.input_price_per_1m || row.output_price_per_1m)
                      .map((row, idx) => {
                        const contextMatch = row.notes?.match(/(\d+[KM])/i);
                        const context = contextMatch ? contextMatch[1] : '-';

                        const perCall = row.input_price_per_1m && row.output_price_per_1m
                          ? ((row.input_price_per_1m * 0.0005) + (row.output_price_per_1m * 0.0005))
                          : null;

                        const total1k = perCall ? perCall * 1000 : null;

                        return (
                          <tr key={idx} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-2">
                              <Badge className={providerColors[row.provider] || 'bg-gray-500'}>
                                {row.provider === 'gemini' ? 'Google' : row.provider === 'openai' ? 'OpenAI' : row.provider}
                              </Badge>
                            </td>
                            <td className="py-3 px-2">
                              <div className="font-medium">{row.model.replace(/-/g, ' ').replace(/gemini |gpt |claude /gi, '').slice(0, 25)}</div>
                              <div className="text-xs text-muted-foreground font-mono">{row.model}</div>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">{context}</span>
                            </td>
                            <td className="py-3 px-2 text-right font-mono">
                              ${row.input_price_per_1m?.toFixed(2) || '-'}
                            </td>
                            <td className="py-3 px-2 text-right font-mono">
                              ${row.output_price_per_1m?.toFixed(2) || '-'}
                            </td>
                            <td className="py-3 px-2 text-right font-mono text-blue-600">
                              {perCall ? `$${perCall.toFixed(4)}` : '-'}
                            </td>
                            <td className="py-3 px-2 text-right font-mono font-medium">
                              {total1k ? `$${total1k.toFixed(2)}` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>

                {pricing.some(row => row.image_price) && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Precos de Geracao de Imagem</h4>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left py-2 px-2 font-semibold">Provider</th>
                          <th className="text-left py-2 px-2 font-semibold">Modelo</th>
                          <th className="text-right py-2 px-2 font-semibold">Preco/Imagem</th>
                          <th className="text-left py-2 px-2 font-semibold">Notas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pricing
                          .filter(row => row.image_price)
                          .map((row, idx) => (
                            <tr key={idx} className="border-b hover:bg-muted/50">
                              <td className="py-2 px-2">
                                <Badge className={providerColors[row.provider] || 'bg-gray-500'}>
                                  {row.provider === 'gemini' ? 'Google' : row.provider === 'openai' ? 'OpenAI' : row.provider}
                                </Badge>
                              </td>
                              <td className="py-2 px-2 font-mono text-xs">{row.model}</td>
                              <td className="py-2 px-2 text-right font-mono text-orange-600 font-medium">
                                ${row.image_price?.toFixed(3)}
                              </td>
                              <td className="py-2 px-2 text-muted-foreground text-xs">
                                {row.notes || '-'}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
