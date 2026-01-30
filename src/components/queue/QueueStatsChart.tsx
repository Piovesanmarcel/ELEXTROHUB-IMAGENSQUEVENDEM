import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subHours, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TimelineData {
  time: string;
  completed: number;
  failed: number;
  pending: number;
}

interface QueueStatsChartProps {
  timeRange: '24h' | '7d';
}

export const QueueStatsChart = ({ timeRange }: QueueStatsChartProps) => {
  const [data, setData] = useState<TimelineData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTimelineData = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const now = new Date();
        const startDate = timeRange === '24h' 
          ? subHours(now, 24) 
          : subDays(now, 7);

        const { data: jobs, error } = await (supabase as any)
          .from('image_generation_queue')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (!jobs) return;

        // Agrupar por período
        const grouped: Record<string, { completed: number; failed: number; pending: number }> = {};
        
        jobs.forEach((job) => {
          const date = new Date(job.created_at);
          const key = timeRange === '24h'
            ? format(date, 'HH:00', { locale: ptBR })
            : format(date, 'dd/MM', { locale: ptBR });

          if (!grouped[key]) {
            grouped[key] = { completed: 0, failed: 0, pending: 0 };
          }

          if (job.status === 'completed') grouped[key].completed++;
          else if (job.status === 'failed') grouped[key].failed++;
          else if (job.status === 'pending' || job.status === 'processing') grouped[key].pending++;
        });

        const chartData = Object.entries(grouped).map(([time, counts]) => ({
          time,
          ...counts,
        }));

        setData(chartData);
      } catch (error) {
        console.error('Error loading timeline data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTimelineData();
  }, [timeRange]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline de Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Timeline de Jobs ({timeRange === '24h' ? 'Últimas 24 horas' : 'Última semana'})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="time" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="completed" 
              stroke="hsl(142 71% 45%)" 
              name="Concluídos"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="failed" 
              stroke="hsl(0 84% 60%)" 
              name="Falhados"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="pending" 
              stroke="hsl(38 92% 50%)" 
              name="Pendentes"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
