import { useState } from 'react';
import { useAdminMetrics } from '@/hooks/useAdminMetrics';
import { MetricsSummaryCards } from '@/components/admin/metrics/MetricsSummaryCards';
import { JobsTimelineChart } from '@/components/admin/metrics/JobsTimelineChart';
import { GenerationTypeChart } from '@/components/admin/metrics/GenerationTypeChart';
import { TopUsersTable } from '@/components/admin/metrics/TopUsersTable';
import { QueueStatusCard } from '@/components/admin/metrics/QueueStatusCard';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw, BarChart3, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const PERIOD_OPTIONS = [
  { value: '1d', label: 'Últimas 24 horas' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
];

const DEFAULT_SUMMARY = {
  totalJobs: 0,
  successfulJobs: 0,
  failedJobs: 0,
  successRate: 0,
  avgQueueTime: 0,
  avgProcessingTime: 0,
  totalCost: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
};

export default function AdminMetrics() {
  const [period, setPeriod] = useState('7d');
  const { data, isLoading, error, refetch } = useAdminMetrics(period);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Métricas de Geração
          </h1>
          <p className="text-muted-foreground mt-1">
            Dashboard de monitoramento de jobs e custos
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione período" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar métricas</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Erro desconhecido'}
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <MetricsSummaryCards 
        summary={data?.summary || DEFAULT_SUMMARY} 
        isLoading={isLoading} 
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <JobsTimelineChart 
          data={data?.byDay || []} 
          isLoading={isLoading} 
        />
        <GenerationTypeChart 
          data={data?.byType || []} 
          isLoading={isLoading} 
        />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TopUsersTable 
            users={data?.topUsers || []} 
            isLoading={isLoading} 
          />
        </div>
        <QueueStatusCard 
          status={data?.queueStatus || { pending: 0, processing: 0 }} 
          isLoading={isLoading} 
        />
      </div>
    </div>
  );
}
