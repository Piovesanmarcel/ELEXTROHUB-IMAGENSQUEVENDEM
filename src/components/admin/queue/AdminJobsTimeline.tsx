import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import type { AdminJob } from '@/hooks/useAdminQueueMonitor';
import { format, subHours, startOfHour } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdminJobsTimelineProps {
  jobs: AdminJob[];
  isLoading?: boolean;
}

interface TimelineDataPoint {
  time: string;
  hour: Date;
  completed: number;
  failed: number;
  pending: number;
  total: number;
}

export function AdminJobsTimeline({ jobs, isLoading }: AdminJobsTimelineProps) {
  const timelineData = useMemo(() => {
    const now = new Date();
    const data: TimelineDataPoint[] = [];

    // Create 24 hour buckets
    for (let i = 23; i >= 0; i--) {
      const hour = startOfHour(subHours(now, i));
      data.push({
        time: format(hour, 'HH:mm', { locale: ptBR }),
        hour,
        completed: 0,
        failed: 0,
        pending: 0,
        total: 0
      });
    }

    // Group jobs into buckets
    jobs.forEach(job => {
      if (!job.created_at) return;
      
      const jobDate = new Date(job.created_at);
      const jobHour = startOfHour(jobDate);
      
      const bucket = data.find(d => d.hour.getTime() === jobHour.getTime());
      if (bucket) {
        bucket.total++;
        if (job.status === 'completed') bucket.completed++;
        else if (job.status === 'failed') bucket.failed++;
        else bucket.pending++;
      }
    });

    return data;
  }, [jobs]);

  const totalJobs = timelineData.reduce((acc, d) => acc + d.total, 0);
  const peakHour = timelineData.reduce((max, d) => d.total > max.total ? d : max, timelineData[0]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-green-500">
              Concluídos: {payload.find((p: any) => p.dataKey === 'completed')?.value || 0}
            </p>
            <p className="text-red-500">
              Falhos: {payload.find((p: any) => p.dataKey === 'failed')?.value || 0}
            </p>
            <p className="text-yellow-500">
              Nunca Iniciados: {payload.find((p: any) => p.dataKey === 'pending')?.value || 0}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Timeline de Jobs (24h)
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="secondary">{totalJobs} jobs</Badge>
            {peakHour && peakHour.total > 0 && (
              <Badge variant="outline">
                Pico: {peakHour.time} ({peakHour.total})
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            Carregando...
          </div>
        ) : (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={timelineData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  className="text-muted-foreground"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '10px' }}
                  formatter={(value) => {
                    const labels: Record<string, string> = {
                      completed: 'Concluídos',
                      failed: 'Falhos',
                      pending: 'Nunca Iniciados'
                    };
                    return <span className="text-xs">{labels[value] || value}</span>;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stackId="1"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#colorCompleted)"
                />
                <Area
                  type="monotone"
                  dataKey="failed"
                  stackId="1"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#colorFailed)"
                />
                <Area
                  type="monotone"
                  dataKey="pending"
                  stackId="1"
                  stroke="#eab308"
                  strokeWidth={2}
                  fill="url(#colorPending)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
