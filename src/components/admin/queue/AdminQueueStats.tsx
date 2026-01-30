import { Card, CardContent } from '@/components/ui/card';
import { Clock, CheckCircle2, XCircle, Loader2, TrendingUp, Timer } from 'lucide-react';
import type { AdminQueueStats } from '@/hooks/useAdminQueueMonitor';

interface AdminQueueStatsProps {
  stats: AdminQueueStats;
  isLoading?: boolean;
}

export function AdminQueueStatsCards({ stats, isLoading }: AdminQueueStatsProps) {
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  const statCards = [
    {
      title: 'Nunca Iniciados',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    },
    {
      title: 'Processando',
      value: stats.processing,
      icon: Loader2,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      iconClass: 'animate-spin'
    },
    {
      title: 'Concluídos',
      value: stats.completed,
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Falhos',
      value: stats.failed,
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10'
    },
    {
      title: 'Taxa de Sucesso',
      value: `${stats.successRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: stats.successRate >= 90 ? 'text-green-500' : stats.successRate >= 70 ? 'text-yellow-500' : 'text-red-500',
      bgColor: stats.successRate >= 90 ? 'bg-green-500/10' : stats.successRate >= 70 ? 'bg-yellow-500/10' : 'bg-red-500/10'
    },
    {
      title: 'Tempo Médio',
      value: formatTime(stats.avgProcessingTime),
      icon: Timer,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((card) => (
        <Card key={card.title} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{card.title}</p>
                <p className={`text-2xl font-bold ${card.color}`}>
                  {isLoading ? '-' : card.value}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color} ${card.iconClass || ''}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
