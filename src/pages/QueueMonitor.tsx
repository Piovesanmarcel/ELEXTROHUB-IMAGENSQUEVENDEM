import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardCard } from '@/components/ui/dashboard-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { OptimizedPieChart } from '@/components/charts/OptimizedPieChart';
import { QueueStatsChart } from '@/components/queue/QueueStatsChart';
import { JobDetailsModal } from '@/components/queue/JobDetailsModal';
import { useQueueMonitor, RecentJob } from '@/hooks/useQueueMonitor';
import { 
  Clock, 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Eye,
  TrendingUp,
  Zap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const QueueMonitor = () => {
  const { stats, recentJobs, isLoading, refreshData } = useQueueMonitor();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'24h' | '7d'>('24h');
  const [selectedJob, setSelectedJob] = useState<RecentJob | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const statusDistributionData = useMemo(() => [
    { name: 'Concluídos', value: stats.completed, color: '#10B981' },
    { name: 'Pendentes', value: stats.pending, color: '#F59E0B' },
    { name: 'Processando', value: stats.processing, color: '#3B82F6' },
    { name: 'Falhados', value: stats.failed, color: '#EF4444' }
  ], [stats]);

  const typeDistributionData = useMemo(() => {
    const typeCounts = recentJobs.reduce((acc, job) => {
      acc[job.generation_type] = (acc[job.generation_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const colors = ['#8B5CF6', '#10B981', '#F59E0B', '#06B6D4'];
    
    return Object.entries(typeCounts).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));
  }, [recentJobs]);

  const filteredJobs = useMemo(() => {
    return recentJobs.filter(job => {
      const statusMatch = filterStatus === 'all' || job.status === filterStatus;
      const typeMatch = filterType === 'all' || job.generation_type === filterType;
      return statusMatch && typeMatch;
    });
  }, [recentJobs, filterStatus, filterType]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      case 'processing': return 'default';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  const viewJobDetails = (jobId: string) => {
    const job = recentJobs.find(j => j.id === jobId);
    if (job) {
      setSelectedJob(job);
      setIsModalOpen(true);
    }
  };

  const formatTime = (ms: number | null) => {
    if (!ms) return '-';
    const seconds = ms / 1000;
    return `${seconds.toFixed(1)}s`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Monitoramento da Fila
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Acompanhe o status dos jobs de geração de imagem em tempo real
          </p>
        </div>
        <Button onClick={refreshData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-4">
        <DashboardCard
          title="Na Fila"
          value={stats.pending}
          icon={<Clock />}
          description="Aguardando início do processamento"
          isLoading={isLoading}
        />
        <DashboardCard
          title="Processando"
          value={stats.processing}
          icon={<Activity className={stats.processing > 0 ? "animate-pulse" : ""} />}
          description="Em execução agora"
          isLoading={isLoading}
        />
        <DashboardCard
          title="Concluídos"
          value={stats.completed}
          icon={<CheckCircle />}
          description={`${stats.successRate.toFixed(1)}% de sucesso`}
          isLoading={isLoading}
        />
        <DashboardCard
          title="Falhados"
          value={stats.failed}
          icon={<AlertCircle />}
          description="Requerem atenção"
          isLoading={isLoading}
        />
      </div>

      {/* Métricas Avançadas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tempo Médio de Processamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">
                {(stats.avgProcessingTime / 1000).toFixed(1)}s
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jobs Últimas 24h
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{stats.jobsLast24h}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jobs Última Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{stats.jobsLast7d}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Status</CardTitle>
          </CardHeader>
          <CardContent>
            <OptimizedPieChart
              data={statusDistributionData}
              height={250}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jobs por Tipo de Geração</CardTitle>
          </CardHeader>
          <CardContent>
            <OptimizedPieChart
              data={typeDistributionData}
              height={250}
            />
          </CardContent>
        </Card>
      </div>

      {/* Timeline Chart */}
      <div className="space-y-4">
        <div className="flex justify-end">
          <Select value={timeRange} onValueChange={(value: '24h' | '7d') => setTimeRange(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Últimas 24 horas</SelectItem>
              <SelectItem value="7d">Última semana</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <QueueStatsChart timeRange={timeRange} />
      </div>

      {/* Tabela de Jobs Recentes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Jobs Recentes</CardTitle>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                  <SelectItem value="completed">Concluídos</SelectItem>
                  <SelectItem value="failed">Falhados</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Array.from(new Set(recentJobs.map(j => j.generation_type))).map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado</TableHead>
                <TableHead>Tempo</TableHead>
                <TableHead>Tentativas</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono text-xs">
                      {job.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{job.generation_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(job.status)}>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDistanceToNow(new Date(job.created_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatTime(job.processing_time)}
                    </TableCell>
                    <TableCell>
                      {job.retry_count > 0 && (
                        <Badge variant="outline">{job.retry_count}/3</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => viewJobDetails(job.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum job encontrado com os filtros selecionados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <JobDetailsModal
        job={selectedJob}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedJob(null);
        }}
        onRetry={refreshData}
      />
    </div>
  );
};

export default QueueMonitor;
