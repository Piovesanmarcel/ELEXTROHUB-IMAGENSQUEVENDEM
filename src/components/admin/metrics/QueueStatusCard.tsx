import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, Loader2 } from 'lucide-react';

interface QueueStatus {
  pending: number;
  processing: number;
}

interface QueueStatusCardProps {
  status: QueueStatus;
  isLoading?: boolean;
}

export function QueueStatusCard({ status, isLoading = false }: QueueStatusCardProps) {
  const total = status.pending + status.processing;
  const isActive = status.processing > 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Status da Fila
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className={isActive ? 'h-5 w-5 animate-pulse text-primary' : 'h-5 w-5'} />
          Status da Fila
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total na Fila</span>
            <span className="text-2xl font-bold">{total}</span>
          </div>
          
          <div className="flex gap-3">
            <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{status.pending} aguardando</span>
            </Badge>
            
            <Badge 
              variant={isActive ? 'default' : 'outline'} 
              className="flex items-center gap-1.5 px-3 py-1.5"
            >
              {isActive ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Activity className="h-3.5 w-3.5" />
              )}
              <span>{status.processing} processando</span>
            </Badge>
          </div>
          
          {total === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum job na fila no momento
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
