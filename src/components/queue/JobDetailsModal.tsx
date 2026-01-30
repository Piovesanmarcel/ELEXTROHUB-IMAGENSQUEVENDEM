import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RecentJob } from '@/hooks/useQueueMonitor';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface JobDetailsModalProps {
  job: RecentJob | null;
  isOpen: boolean;
  onClose: () => void;
  onRetry?: () => void;
}

export const JobDetailsModal = ({ job, isOpen, onClose, onRetry }: JobDetailsModalProps) => {
  const { toast } = useToast();

  if (!job) return null;

  const handleRetry = async () => {
    try {
      // Criar novo job com os mesmos dados
      const { error } = await (supabase as any)
        .from('image_generation_queue')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          generation_type: job.generation_type,
          input_data: job.input_data,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: 'Job adicionado à fila',
        description: 'O job foi adicionado novamente à fila de processamento',
      });
      
      if (onRetry) onRetry();
      onClose();
    } catch (error) {
      console.error('Error retrying job:', error);
      toast({
        title: 'Erro ao tentar novamente',
        description: 'Não foi possível adicionar o job à fila',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'processing': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTime = (ms: number | null) => {
    if (!ms) return '-';
    const seconds = ms / 1000;
    return `${seconds.toFixed(2)}s`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${getStatusColor(job.status)}`} />
            Job Details
          </DialogTitle>
          <DialogDescription>
            ID: <span className="font-mono text-xs">{job.id}</span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Status e Timestamps */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge variant={
                    job.status === 'completed' ? 'default' :
                    job.status === 'failed' ? 'destructive' :
                    job.status === 'processing' ? 'default' : 'secondary'
                  }>
                    {job.status}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                <div className="mt-1">
                  <Badge variant="outline">{job.generation_type}</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Criado</label>
                <p className="text-sm mt-1">
                  {formatDistanceToNow(new Date(job.created_at), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tempo de Processamento</label>
                <p className="text-sm mt-1">{formatTime(job.processing_time)}</p>
              </div>
            </div>

            {job.retry_count > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tentativas</label>
                <p className="text-sm mt-1">{job.retry_count}/3</p>
              </div>
            )}

            {/* Input Data */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Input Data</label>
              <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-x-auto">
                {JSON.stringify(job.input_data, null, 2)}
              </pre>
            </div>

            {/* Error Message */}
            {job.error_message && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 text-destructive mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Erro</span>
                </div>
                <p className="text-sm text-destructive/80">{job.error_message}</p>
              </div>
            )}

            {/* Result */}
            {job.result && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Resultado</label>
                {job.result.images && Array.isArray(job.result.images) ? (
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    {job.result.images.map((url: string, index: number) => (
                      <div key={index} className="relative group">
                        <img 
                          src={url} 
                          alt={`Result ${index + 1}`} 
                          className="w-full h-auto rounded-lg border"
                        />
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute top-2 right-2 p-2 bg-background/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(job.result, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 mt-4">
          {job.status === 'failed' && (
            <Button onClick={handleRetry} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          )}
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
