import { useNavigate } from 'react-router-dom';
import { ClickableDashboardCard } from '@/components/ui/clickable-dashboard-card';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';
import { useQueueMonitor } from '@/hooks/useQueueMonitor';

export const QueueSummaryCard = () => {
  const { stats, isLoading } = useQueueMonitor();
  const navigate = useNavigate();

  const getStatusBadgeVariant = () => {
    if (stats.processing > 0) return "default";
    if (stats.pending > 0) return "secondary";
    return "outline";
  };

  return (
    <ClickableDashboardCard
      title="Fila de Geração"
      value={stats.pending}
      icon={
        <Activity 
          className={stats.processing > 0 ? "animate-pulse" : ""} 
        />
      }
      onClick={() => navigate('/monitoramento-fila')}
      description={
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={getStatusBadgeVariant()}>
            {stats.processing} processando
          </Badge>
          <span className="text-xs text-muted-foreground">
            Taxa de sucesso: {stats.successRate.toFixed(1)}%
          </span>
        </div>
      }
      isLoading={isLoading}
    />
  );
};
