import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { AdminJob } from '@/hooks/useAdminQueueMonitor';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdminJobDetailsModalProps {
  job: AdminJob | null;
  open: boolean;
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-500',
  processing: 'bg-blue-500/20 text-blue-500',
  completed: 'bg-green-500/20 text-green-500',
  failed: 'bg-red-500/20 text-red-500'
};

export function AdminJobDetailsModal({ job, open, onClose }: AdminJobDetailsModalProps) {
  if (!job) return null;

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
  };

  const formatTime = (ms: number | null) => {
    if (!ms) return '-';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}min`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Detalhes do Job</span>
            <Badge className={statusColors[job.status]}>
              {job.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">ID do Job</p>
                <p className="font-mono text-sm">{job.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tipo</p>
                <Badge variant="outline">{job.generation_type}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Usuário</p>
                <p className="text-sm">{job.user_email || job.user_id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Prioridade</p>
                <p className="text-sm">{job.priority ?? 0}</p>
              </div>
            </div>

            <Separator />

            {/* Timestamps */}
            <div>
              <h4 className="font-medium mb-2">Timestamps</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Criado em</p>
                  <p>{formatDate(job.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Iniciado em</p>
                  <p>{formatDate(job.started_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Concluído em</p>
                  <p>{formatDate(job.completed_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bloqueado em</p>
                  <p>{formatDate(job.locked_at)}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Processing Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tempo de Processamento</p>
                <p className="font-mono">{formatTime(job.processing_time_ms)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tentativas</p>
                <p className="font-mono">{job.retry_count ?? 0}</p>
              </div>
            </div>

            {/* Error Message */}
            {job.error_message && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Mensagem de Erro</p>
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md">
                    <p className="text-sm text-red-400 font-mono whitespace-pre-wrap">
                      {job.error_message}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Input Data */}
            {job.input_data && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Dados de Entrada</p>
                  <div className="p-3 bg-muted/50 rounded-md overflow-x-auto">
                    <pre className="text-xs font-mono">
                      {JSON.stringify(job.input_data, null, 2)}
                    </pre>
                  </div>
                </div>
              </>
            )}

            {/* Result */}
            {job.result && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Resultado</p>
                  <div className="p-3 bg-muted/50 rounded-md overflow-x-auto">
                    <pre className="text-xs font-mono">
                      {JSON.stringify(job.result, null, 2)}
                    </pre>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
