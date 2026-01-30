import { BatchResult } from '@/hooks/useBatchResults';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, Clock, Download, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BatchGenerationStatusProps {
  batches: BatchResult[];
  isLoading: boolean;
}

const statusConfig = {
  pending: {
    label: 'Aguardando',
    icon: Clock,
    variant: 'secondary' as const,
    className: 'text-muted-foreground',
  },
  processing: {
    label: 'Processando',
    icon: Loader2,
    variant: 'default' as const,
    className: 'text-primary animate-pulse',
  },
  completed: {
    label: 'Concluído',
    icon: CheckCircle2,
    variant: 'default' as const,
    className: 'text-green-500',
  },
  failed: {
    label: 'Falhou',
    icon: XCircle,
    variant: 'destructive' as const,
    className: 'text-destructive',
  },
};

export function BatchGenerationStatus({ batches, isLoading }: BatchGenerationStatusProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (batches.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhuma geração em lote ainda. Envie um job para o n8n para começar.
        </CardContent>
      </Card>
    );
  }

  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `imagem-${index + 1}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar imagem:', error);
    }
  };

  return (
    <div className="space-y-4">
      {batches.slice(0, 5).map((batch) => {
        const config = statusConfig[batch.status];
        const StatusIcon = config.icon;
        
        return (
          <Card key={batch.job_id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">
                  {batch.product_name}
                </CardTitle>
                <Badge variant={config.variant} className="gap-1">
                  <StatusIcon className={cn('h-3 w-3', config.className, batch.status === 'processing' && 'animate-spin')} />
                  {config.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(batch.created_at).toLocaleString('pt-BR')}
              </p>
            </CardHeader>
            
            <CardContent>
              {batch.status === 'failed' && batch.error_message && (
                <div className="text-sm text-destructive bg-destructive/10 rounded-md p-3 mb-3">
                  {batch.error_message}
                </div>
              )}
              
              {batch.status === 'processing' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando imagens no n8n...
                </div>
              )}
              
              {batch.status === 'completed' && batch.images && batch.images.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {batch.images.length} imagem(ns) gerada(s)
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {batch.images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img.imageUrl}
                          alt={`Gerada ${idx + 1}`}
                          className="w-full aspect-square object-cover rounded-md border"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-white hover:bg-white/20"
                            onClick={() => handleDownload(img.imageUrl, idx)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-white hover:bg-white/20"
                            onClick={() => window.open(img.imageUrl, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {batch.status === 'completed' && (!batch.images || batch.images.length === 0) && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma imagem retornada.
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
