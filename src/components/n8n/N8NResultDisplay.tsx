import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Save, RefreshCw, CheckCircle2, XCircle, Clock, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { safeBlobDownload } from '@/utils/safeDownload';
import { N8NTemplateResponse } from '@/hooks/useCanvaTemplateN8N';

interface N8NResultDisplayProps {
  response: N8NTemplateResponse | null;
  processingTime: number;
  jobStatus: 'idle' | 'sending' | 'processing' | 'completed' | 'failed';
  productName: string;
  templateName: string;
  onRetry?: () => void;
  onSaveToGallery?: (imageUrl: string) => void;
}

export function N8NResultDisplay({
  response,
  processingTime,
  jobStatus,
  productName,
  templateName,
  onRetry,
  onSaveToGallery,
}: N8NResultDisplayProps) {
  const handleDownload = async () => {
    if (!response?.imageUrl) return;

    try {
      let blob: Blob;
      
      if (response.imageUrl.startsWith('data:')) {
        // Base64
        const base64Data = response.imageUrl.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: response.mimeType || 'image/png' });
      } else {
        // URL
        const res = await fetch(response.imageUrl);
        blob = await res.blob();
      }

      const filename = `${productName}-${templateName}-n8n.png`.replace(/\s+/g, '-').toLowerCase();
      await safeBlobDownload(blob, filename);
      toast.success('Download iniciado!');
    } catch (error) {
      console.error('Erro ao baixar:', error);
      toast.error('Erro ao baixar imagem');
    }
  };

  const handleSave = () => {
    if (response?.imageUrl && onSaveToGallery) {
      onSaveToGallery(response.imageUrl);
    }
  };

  // Status indicator
  const StatusBadge = () => {
    switch (jobStatus) {
      case 'sending':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <Clock className="h-3 w-3 mr-1 animate-pulse" />
            Enviando...
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Processando...
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Concluído
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Falhou
          </Badge>
        );
      default:
        return null;
    }
  };

  if (jobStatus === 'idle' && !response) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Resultado n8n</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge />
            {processingTime > 0 && jobStatus !== 'sending' && jobStatus !== 'processing' && (
              <Badge variant="secondary">
                {(processingTime / 1000).toFixed(1)}s
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Loading state */}
        {(jobStatus === 'sending' || jobStatus === 'processing') && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-muted animate-pulse" />
              <RefreshCw className="absolute inset-0 m-auto h-8 w-8 text-primary animate-spin" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {jobStatus === 'sending' ? 'Enviando para n8n...' : 'Aguardando processamento...'}
            </p>
          </div>
        )}

        {/* Success state */}
        {jobStatus === 'completed' && response?.success && response.imageUrl && (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden border bg-muted">
              <img
                src={response.imageUrl}
                alt={`${productName} - ${templateName}`}
                className="w-full h-auto max-h-[500px] object-contain"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              {onSaveToGallery && (
                <Button variant="outline" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar na Galeria
                </Button>
              )}
              {onRetry && (
                <Button variant="ghost" onClick={onRetry}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Gerar Novamente
                </Button>
              )}
            </div>

            {response.metadata && (
              <div className="p-3 bg-muted rounded-lg text-xs text-muted-foreground">
                <p>Template: {response.metadata.template}</p>
                <p>Tempo: {response.metadata.tempo_ms ? `${(response.metadata.tempo_ms / 1000).toFixed(1)}s` : '-'}</p>
              </div>
            )}
          </div>
        )}

        {/* Error state */}
        {jobStatus === 'failed' && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <XCircle className="h-12 w-12 text-destructive mb-3" />
            <p className="text-sm font-medium text-destructive">Erro na geração</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              {response?.error || 'Erro desconhecido. Verifique os logs do n8n.'}
            </p>
            {onRetry && (
              <Button variant="outline" className="mt-4" onClick={onRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
