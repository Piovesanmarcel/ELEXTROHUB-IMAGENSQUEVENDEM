import { DashboardCard } from '@/components/ui/dashboard-card';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign, 
  Zap,
  TrendingUp
} from 'lucide-react';

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

interface MetricsSummaryCardsProps {
  summary: MetricsSummary;
  isLoading?: boolean;
}

export function MetricsSummaryCards({ summary, isLoading = false }: MetricsSummaryCardsProps) {
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <DashboardCard
        title="Total de Jobs"
        value={formatNumber(summary.totalJobs)}
        icon={<Activity className="h-4 w-4" />}
        description={`${formatNumber(summary.successfulJobs)} sucesso / ${formatNumber(summary.failedJobs)} falha`}
        isLoading={isLoading}
      />
      
      <DashboardCard
        title="Taxa de Sucesso"
        value={`${summary.successRate.toFixed(1)}%`}
        icon={<TrendingUp className="h-4 w-4" />}
        description={
          <span className={summary.successRate >= 90 ? 'text-green-500' : summary.successRate >= 70 ? 'text-yellow-500' : 'text-red-500'}>
            {summary.successRate >= 90 ? 'Excelente' : summary.successRate >= 70 ? 'Bom' : 'Precisa atenção'}
          </span>
        }
        isLoading={isLoading}
      />
      
      <DashboardCard
        title="Tempo Médio Fila"
        value={formatTime(summary.avgQueueTime)}
        icon={<Clock className="h-4 w-4" />}
        description={`Processamento: ${formatTime(summary.avgProcessingTime)}`}
        isLoading={isLoading}
      />
      
      <DashboardCard
        title="Custo Total"
        value={formatCurrency(summary.totalCost)}
        icon={<DollarSign className="h-4 w-4" />}
        description={`${formatNumber(summary.totalInputTokens + summary.totalOutputTokens)} tokens`}
        isLoading={isLoading}
      />
    </div>
  );
}
