import { useBroadcast } from '@/contexts/BroadcastContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Wifi, WifiOff, Download, ExternalLink, 
  Trash2, Activity, Image as ImageIcon, Clock, Zap,
  Radio, AlertCircle
} from 'lucide-react';
import { useState } from 'react';
import { WorkerStatusIndicator } from './WorkerStatusIndicator';

// Formatar tempo relativo
const formatRelativeTime = (timestamp: string | null) => {
  if (!timestamp) return 'Nunca';
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 5) return 'Agora';
  if (seconds < 60) return `${seconds}s atrás`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m atrás`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h atrás`;
};

// Formatar hora
const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  variant?: 'default' | 'success' | 'warning';
}

function StatCard({ icon: Icon, label, value, variant = 'default' }: StatCardProps) {
  const bgClass = variant === 'success' 
    ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' 
    : variant === 'warning'
    ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
    : 'bg-muted/50 border-border';
  
  return (
    <div className={`p-3 rounded-lg border ${bgClass}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

export function N8NStreamDebugPanel() {
  const { 
    receivedImages, 
    activeBatchProgress, 
    clearImages, 
    isConnected, 
    debugState 
  } = useBroadcast();
  
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  // Download da imagem
  const handleDownload = (img: { imageBase64: string; productName: string; templateId: string }) => {
    try {
      const base64 = img.imageBase64.startsWith('data:') 
        ? img.imageBase64.split(',')[1] 
        : img.imageBase64;
      
      const byteCharacters = atob(base64);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }
      
      const blob = new Blob([byteArray], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${img.productName}-${img.templateId}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao fazer download:', error);
    }
  };

  // Abrir em nova aba
  const handleOpenInNewTab = (img: { imageBase64: string }) => {
    const base64 = img.imageBase64.startsWith('data:') 
      ? img.imageBase64 
      : `data:image/png;base64,${img.imageBase64}`;
    window.open(base64, '_blank');
  };

  // Obter URL da imagem
  const getImageSrc = (base64: string) => {
    return base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
  };

  return (
    <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
      {/* Header com status de conexão */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            Debug n8n Stream
            {isConnected ? (
              <Badge className="bg-green-500 hover:bg-green-600">
                <Wifi className="h-3 w-3 mr-1" />
                Conectado
              </Badge>
            ) : (
              <Badge variant="destructive">
                <WifiOff className="h-3 w-3 mr-1" />
                Desconectado
              </Badge>
            )}
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearImages}
            disabled={receivedImages.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <Radio className="h-3 w-3" />
          <span>Canal: <code className="bg-muted px-1 py-0.5 rounded">{debugState.channelName || 'Aguardando login...'}</code></span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Worker Status Indicator */}
        <WorkerStatusIndicator 
          workerState={debugState.workerState}
          lastMessageAt={debugState.lastMessageAt}
          pollingInterval={3}
        />
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard 
            icon={Wifi} 
            label="Conexões" 
            value={debugState.connectionAttempts}
            variant={debugState.connectionAttempts > 0 ? 'success' : 'default'}
          />
          <StatCard 
            icon={Zap} 
            label="Mensagens" 
            value={debugState.messagesReceived}
            variant={debugState.messagesReceived > 0 ? 'success' : 'default'}
          />
          <StatCard 
            icon={ImageIcon} 
            label="Imagens" 
            value={receivedImages.length}
            variant={receivedImages.length > 0 ? 'success' : 'default'}
          />
          <StatCard 
            icon={Clock} 
            label="Última Msg" 
            value={formatRelativeTime(debugState.lastMessageAt)}
          />
        </div>

        {/* Progresso do Batch Ativo */}
        {activeBatchProgress && (
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium truncate max-w-[200px]">
                  {activeBatchProgress.productName}
                </span>
              </div>
              <Badge variant={activeBatchProgress.status === 'completed' ? 'default' : 'secondary'}>
                {activeBatchProgress.current}/{activeBatchProgress.total}
              </Badge>
            </div>
            <Progress 
              value={(activeBatchProgress.current / activeBatchProgress.total) * 100} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              JobID: <code className="bg-muted px-1 rounded">{activeBatchProgress.jobId.substring(0, 8)}...</code>
            </p>
          </div>
        )}

        {/* Timeline de Eventos */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timeline de Eventos
          </h4>
          <ScrollArea className="h-32 rounded-md border bg-background/50">
            {receivedImages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4">
                <AlertCircle className="h-4 w-4 mr-2" />
                Aguardando imagens do n8n...
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {receivedImages.slice().reverse().slice(0, 20).map((img, idx) => (
                  <div 
                    key={`${img.jobId}-${img.templateId}-${idx}`} 
                    className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded transition-colors"
                  >
                    <div className="h-2 w-2 bg-green-500 rounded-full flex-shrink-0" />
                    <Badge variant="outline" className="text-[10px] flex-shrink-0">
                      {img.templateId}
                    </Badge>
                    <span className="text-xs flex-1 truncate text-muted-foreground">
                      {img.productName}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {formatTime(img.receivedAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Grid de Imagens Recebidas */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Imagens Recebidas ({receivedImages.length})
          </h4>
          
          {receivedImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
              <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">Nenhuma imagem recebida ainda</p>
              <p className="text-xs">As imagens aparecerão aqui quando o n8n enviar</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {receivedImages.slice().reverse().map((img, idx) => (
                <div 
                  key={`img-${img.jobId}-${img.templateId}-${idx}`} 
                  className="relative group rounded-lg overflow-hidden border bg-background shadow-sm hover:shadow-md transition-shadow"
                >
                  <img
                    src={getImageSrc(img.imageBase64)}
                    alt={`${img.productName} - ${img.templateId}`}
                    className="w-full aspect-square object-cover cursor-pointer"
                    onClick={() => setExpandedImage(getImageSrc(img.imageBase64))}
                  />
                  
                  {/* Overlay com ações */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-white hover:bg-white/20"
                      onClick={(e) => { e.stopPropagation(); handleDownload(img); }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-white hover:bg-white/20"
                      onClick={(e) => { e.stopPropagation(); handleOpenInNewTab(img); }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Badge com template ID */}
                  <Badge className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5">
                    {img.templateId}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Imagem Expandida */}
        {expandedImage && (
          <div 
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setExpandedImage(null)}
          >
            <img 
              src={expandedImage} 
              alt="Imagem expandida" 
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setExpandedImage(null)}
            >
              ✕
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
