import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Clock, 
  Image as ImageIcon,
  AlertTriangle,
  Sparkles,
  Zap
} from "lucide-react";
import { useRotatingMessage } from "@/hooks/useProcessingStages";
import { formatTimeOptimistic } from "@/hooks/useJobTimeEstimate";

export interface SceneTypeStatus {
  sceneType: string;
  label: string;
  status: 'pending' | 'processing' | 'success' | 'error' | 'retrying';
  attempts: number;
  maxAttempts: number;
  error?: string;
  imageUrl?: string;
  startedAt?: number;
  completedAt?: number;
  duration?: number;
}

interface ParallelGenerationMonitorProps {
  sceneStatuses: SceneTypeStatus[];
  isRunning: boolean;
  onRetryScene: (sceneType: string) => void;
  onRetryAllFailed: () => void;
}

const statusConfig = {
  pending: {
    color: 'bg-muted',
    textColor: 'text-muted-foreground',
    icon: Clock,
    label: 'Preparando',
    message: 'Na fila...'
  },
  processing: {
    color: 'bg-primary/10 border-primary/30 processing-card',
    textColor: 'text-primary',
    icon: Sparkles,
    label: '✨ Gerando',
    message: 'Criando imagem...'
  },
  success: {
    color: 'bg-green-500/20',
    textColor: 'text-green-600',
    icon: CheckCircle2,
    label: '✓ Pronto',
    message: 'Concluído!'
  },
  error: {
    color: 'bg-red-500/20',
    textColor: 'text-red-600',
    icon: XCircle,
    label: 'Erro',
    message: 'Falhou'
  },
  retrying: {
    color: 'bg-amber-500/20 border-amber-500/30',
    textColor: 'text-amber-600',
    icon: RefreshCw,
    label: '🔄 Retry',
    message: 'Tentando novamente...'
  }
};

export function ParallelGenerationMonitor({
  sceneStatuses,
  isRunning,
  onRetryScene,
  onRetryAllFailed
}: ParallelGenerationMonitorProps) {
  const totalScenes = sceneStatuses.length;
  const completed = sceneStatuses.filter(s => s.status === 'success').length;
  const failed = sceneStatuses.filter(s => s.status === 'error').length;
  const processing = sceneStatuses.filter(s => s.status === 'processing' || s.status === 'retrying').length;
  const pending = sceneStatuses.filter(s => s.status === 'pending').length;
  
  // Mensagem rotativa quando processando
  const rotatingMessage = useRotatingMessage(processing > 0, 8000);
  
  // Progresso suavizado - nunca para completamente
  const baseProgress = totalScenes > 0 ? ((completed) / totalScenes) * 100 : 0;
  // Adicionar progresso parcial para itens em processamento
  const processingBonus = (processing / totalScenes) * 15; // Cada item processing adiciona até 15%
  const progressPercent = Math.min(baseProgress + processingBonus, completed === totalScenes ? 100 : 95);
  
  const hasFailures = failed > 0;

  if (totalScenes === 0) {
    return null;
  }

  return (
    <Card className="border-2 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {processing > 0 ? (
              <Sparkles className="h-5 w-5 text-primary icon-working" />
            ) : completed === totalScenes ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 check-animated" />
            ) : (
              <ImageIcon className="h-5 w-5 text-primary" />
            )}
            {processing > 0 ? (
              <span className="text-base">
                {rotatingMessage.emoji} {rotatingMessage.text}
              </span>
            ) : completed === totalScenes ? (
              <span className="text-green-600">Todas prontas! 🎉</span>
            ) : (
              'Monitor de Geração'
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 bg-green-50 dark:bg-green-950/30">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              {completed}/{totalScenes}
            </Badge>
            {failed > 0 && (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" />
                {failed}
              </Badge>
            )}
            {processing > 0 && (
              <Badge className="gap-1 bg-primary/10 text-primary border-primary/30 status-badge-active">
                <Zap className="h-3 w-3" />
                {processing}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Progress bar com animação */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {processing > 0 
                ? `${completed} pronta${completed !== 1 ? 's' : ''}, ${processing} gerando...`
                : `${completed} de ${totalScenes} concluída${completed !== 1 ? 's' : ''}`
              }
            </span>
            <span className={processing > 0 ? 'text-primary font-medium' : ''}>
              {progressPercent >= 95 && completed < totalScenes 
                ? 'Finalizando...' 
                : `${Math.round(progressPercent)}%`
              }
            </span>
          </div>
          <div className="relative">
            <Progress value={progressPercent} className="h-2" />
            {processing > 0 && (
              <div className="absolute inset-0 progress-animated rounded-full overflow-hidden" />
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Scene status grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {sceneStatuses.map((scene) => {
            const config = statusConfig[scene.status];
            const Icon = config.icon;
            const isActive = scene.status === 'processing' || scene.status === 'retrying';
            
            return (
              <div
                key={scene.sceneType}
                className={`p-3 rounded-lg border transition-all animate-fade-in-up ${config.color}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Icon 
                    className={`h-4 w-4 ${config.textColor} ${
                      isActive ? 'icon-working' : ''
                    } ${scene.status === 'success' ? 'check-animated' : ''}`} 
                  />
                  {scene.attempts > 1 && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1">
                      {scene.attempts}/{scene.maxAttempts}
                    </Badge>
                  )}
                </div>
                
                <p className="text-xs font-medium truncate" title={scene.label}>
                  {scene.label}
                </p>
                
                {/* Mensagem de status dinâmica */}
                <p className={`text-[10px] ${config.textColor} mt-0.5`}>
                  {scene.status === 'processing' && 'Criando...'}
                  {scene.status === 'pending' && 'Aguardando'}
                  {scene.status === 'success' && scene.duration && `${(scene.duration / 1000).toFixed(0)}s`}
                  {scene.status === 'retrying' && `Retry ${scene.attempts}/${scene.maxAttempts}`}
                  {scene.status === 'error' && 'Falhou'}
                </p>
                
                {scene.status === 'error' && (
                  <div className="mt-1">
                    <p className="text-[10px] text-red-600 truncate" title={scene.error}>
                      {scene.error?.substring(0, 25)}...
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 text-[10px] px-1 mt-1"
                      onClick={() => onRetryScene(scene.sceneType)}
                      disabled={isRunning}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  </div>
                )}
                
                {scene.status === 'success' && scene.imageUrl && (
                  <div className="mt-1 w-full h-12 rounded overflow-hidden bg-muted">
                    <img 
                      src={scene.imageUrl} 
                      alt={scene.label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Retry all failed button */}
        {hasFailures && !isRunning && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700 dark:text-red-400">
                {failed} {failed === 1 ? 'cena falhou' : 'cenas falharam'}
              </span>
            </div>
            <Button
              size="sm"
              variant="destructive"
              onClick={onRetryAllFailed}
              className="gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Retry Todas
            </Button>
          </div>
        )}

        {/* All success message */}
        {completed === totalScenes && totalScenes > 0 && (
          <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              Todas as {totalScenes} imagens geradas com sucesso!
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ParallelGenerationMonitor;
