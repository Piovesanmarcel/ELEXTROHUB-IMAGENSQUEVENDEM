import { useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  AlertCircle, 
  TrendingDown, 
  Clock, 
  XCircle,
  Activity,
  CheckCircle2
} from 'lucide-react';
import type { AdminQueueStats, AdminJob } from '@/hooks/useAdminQueueMonitor';

interface AdminQueueAlertsProps {
  stats: AdminQueueStats;
  jobs: AdminJob[];
  isLoading?: boolean;
}

interface QueueAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  icon: React.ReactNode;
  title: string;
  description: string;
  metric?: string;
}

export function AdminQueueAlerts({ stats, jobs, isLoading }: AdminQueueAlertsProps) {
  const alerts = useMemo<QueueAlert[]>(() => {
    const result: QueueAlert[] = [];

    // Alert 1: High failure rate
    if (stats.successRate < 70 && (stats.completed + stats.failed) > 5) {
      result.push({
        id: 'high-failure-rate',
        type: 'error',
        icon: <XCircle className="h-4 w-4" />,
        title: 'Taxa de falha alta',
        description: 'Mais de 30% dos jobs estão falhando. Verifique os logs de erro.',
        metric: `${(100 - stats.successRate).toFixed(1)}% de falhas`
      });
    } else if (stats.successRate < 90 && (stats.completed + stats.failed) > 10) {
      result.push({
        id: 'moderate-failure-rate',
        type: 'warning',
        icon: <AlertTriangle className="h-4 w-4" />,
        title: 'Taxa de sucesso abaixo do ideal',
        description: 'A taxa de sucesso está abaixo de 90%. Monitore os jobs falhando.',
        metric: `${stats.successRate.toFixed(1)}% de sucesso`
      });
    }

    // Alert 2: Queue backlog growing
    if (stats.pending > 10) {
      result.push({
        id: 'queue-backlog',
        type: 'error',
        icon: <Clock className="h-4 w-4" />,
        title: 'Jobs aguardando na fila',
        description: 'Há mais de 10 jobs que nunca iniciaram. O worker pode estar inativo.',
        metric: `${stats.pending} nunca iniciados`
      });
    } else if (stats.pending > 5) {
      result.push({
        id: 'queue-growing',
        type: 'warning',
        icon: <Activity className="h-4 w-4" />,
        title: 'Fila crescendo',
        description: 'Há jobs acumulando na fila. Verifique se os workers estão funcionando.',
        metric: `${stats.pending} nunca iniciados`
      });
    }

    // Alert 3: Slow processing time
    if (stats.avgProcessingTime > 120000) { // > 2 minutes
      result.push({
        id: 'slow-processing',
        type: 'warning',
        icon: <TrendingDown className="h-4 w-4" />,
        title: 'Tempo de processamento lento',
        description: 'O tempo médio de processamento está acima de 2 minutos.',
        metric: `${(stats.avgProcessingTime / 60000).toFixed(1)} min em média`
      });
    }

    // Alert 4: Too many jobs processing at once (might indicate stuck jobs)
    if (stats.processing > 5) {
      result.push({
        id: 'many-processing',
        type: 'warning',
        icon: <AlertCircle className="h-4 w-4" />,
        title: 'Muitos jobs em processamento',
        description: 'Há muitos jobs sendo processados simultaneamente. Alguns podem estar travados.',
        metric: `${stats.processing} processando`
      });
    }

    // Alert 5: Recent failures spike
    const recentJobs = jobs.filter(j => {
      if (!j.created_at) return false;
      const created = new Date(j.created_at);
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return created > hourAgo;
    });
    
    const recentFailed = recentJobs.filter(j => j.status === 'failed').length;
    const recentTotal = recentJobs.length;
    
    if (recentTotal >= 5 && recentFailed / recentTotal > 0.5) {
      result.push({
        id: 'recent-failures-spike',
        type: 'error',
        icon: <AlertTriangle className="h-4 w-4" />,
        title: 'Pico de falhas na última hora',
        description: 'Mais de 50% dos jobs da última hora falharam.',
        metric: `${recentFailed}/${recentTotal} falharam`
      });
    }

    // Alert 6: Check for stuck jobs (processing > 5 min)
    const stuckJobs = jobs.filter(j => {
      if (j.status !== 'processing' || !j.locked_at) return false;
      const lockedAt = new Date(j.locked_at);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return lockedAt < fiveMinutesAgo;
    });

    if (stuckJobs.length > 0) {
      result.push({
        id: 'stuck-jobs',
        type: 'error',
        icon: <AlertCircle className="h-4 w-4" />,
        title: 'Jobs travados detectados',
        description: 'Há jobs em processamento há mais de 5 minutos. Serão resetados automaticamente.',
        metric: `${stuckJobs.length} travado(s)`
      });
    }

    return result;
  }, [stats, jobs]);

  if (isLoading) return null;

  // Show success message when no alerts
  if (alerts.length === 0) {
    return (
      <Alert className="border-green-500/30 bg-green-500/5">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <AlertTitle className="text-green-500">Sistema operando normalmente</AlertTitle>
        <AlertDescription className="text-green-500/80">
          Nenhum problema detectado no momento.
        </AlertDescription>
      </Alert>
    );
  }

  const errorAlerts = alerts.filter(a => a.type === 'error');
  const warningAlerts = alerts.filter(a => a.type === 'warning');

  return (
    <div className="space-y-3">
      {/* Error Alerts */}
      {errorAlerts.map(alert => (
        <Alert key={alert.id} variant="destructive" className="border-red-500/50 bg-red-500/10">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-red-500">{alert.icon}</div>
            <div className="flex-1">
              <AlertTitle className="flex items-center gap-2">
                {alert.title}
                {alert.metric && (
                  <Badge variant="destructive" className="ml-2 font-mono text-xs">
                    {alert.metric}
                  </Badge>
                )}
              </AlertTitle>
              <AlertDescription className="text-red-400/80 mt-1">
                {alert.description}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      ))}

      {/* Warning Alerts */}
      {warningAlerts.map(alert => (
        <Alert key={alert.id} className="border-yellow-500/50 bg-yellow-500/10">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-yellow-500">{alert.icon}</div>
            <div className="flex-1">
              <AlertTitle className="flex items-center gap-2 text-yellow-500">
                {alert.title}
                {alert.metric && (
                  <Badge className="ml-2 font-mono text-xs bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                    {alert.metric}
                  </Badge>
                )}
              </AlertTitle>
              <AlertDescription className="text-yellow-400/80 mt-1">
                {alert.description}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      ))}
    </div>
  );
}
