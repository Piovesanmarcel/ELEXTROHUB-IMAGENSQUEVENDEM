import { useState, useEffect } from 'react';
import { useUserJobStatus, ActiveJob } from '@/contexts/UserJobStatusContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  X, 
  RefreshCw,
  Zap,
  Timer,
  Sparkles
} from 'lucide-react';
import { calculateJobEstimate, formatRemainingTime, formatTimeOptimistic } from '@/hooks/useJobTimeEstimate';
import { useRotatingMessage, calculateSmoothProgress } from '@/hooks/useProcessingStages';
import { useCompletionNotification } from '@/hooks/useCompletionNotification';

export function ActiveJobIndicator() {
  const { 
    activeJobs, 
    activeJobsCount, 
    maxConcurrent, 
    isLoading,
    refreshStatus,
    isConnected,
    getEstimatedTime
  } = useUserJobStatus();
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [prevJobsCount, setPrevJobsCount] = useState(0);
  
  // Hooks de UX
  const isProcessing = activeJobs.some(j => j.status === 'processing');
  const rotatingMessage = useRotatingMessage(isProcessing, 10000);
  const { notifyCompletion, requestNotificationPermission } = useCompletionNotification();

  // Solicitar permissão de notificação
  useEffect(() => {
    if (activeJobsCount > 0) {
      requestNotificationPermission();
    }
  }, [activeJobsCount, requestNotificationPermission]);

  // Atualizar timestamp a cada segundo para estimativas em tempo real
  useEffect(() => {
    if (activeJobsCount === 0) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeJobsCount]);

  // Detectar quando jobs são concluídos
  useEffect(() => {
    if (prevJobsCount > 0 && activeJobsCount < prevJobsCount) {
      // Um ou mais jobs foram concluídos
      notifyCompletion({
        title: 'Imagem Gerada! 🎉',
        body: 'Sua imagem está pronta para visualização.',
        playSound: true,
        showNotification: true
      });
    }
    setPrevJobsCount(activeJobsCount);
  }, [activeJobsCount, prevJobsCount, notifyCompletion]);

  // Calcular tempo total restante para jobs em processamento
  const totalRemainingTime = activeJobs.reduce((acc, job) => {
    if (job.status !== 'processing') return acc;
    const estimate = calculateJobEstimate(job.startedAt, job.generationType, getEstimatedTime, now);
    return acc + estimate.remaining;
  }, 0);

  // Não mostrar se não há jobs ativos
  if (activeJobsCount === 0) return null;

  // Versão minimizada - só um badge
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="default"
          size="sm"
          onClick={() => setIsMinimized(false)}
          className="bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 gap-2"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{activeJobsCount} geração(ões) ativa(s)</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-card border rounded-lg shadow-xl overflow-hidden">
      {/* Header com mensagem rotativa */}
      <div 
        className="flex items-center justify-between p-3 bg-primary/10 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary icon-working" />
          <span className="font-medium text-sm">
            {rotatingMessage.emoji} {rotatingMessage.text}
          </span>
          <Badge variant="secondary" className="text-xs flex items-center gap-1 status-badge-active">
            {activeJobsCount}/{maxConcurrent}
            {totalRemainingTime > 0 && (
              <>
                <span className="text-muted-foreground">•</span>
                {formatTimeOptimistic(totalRemainingTime)}
              </>
            )}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {isConnected && (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Conectado" />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(true);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Jobs list */}
          {activeJobs.map((job) => (
            <JobCard key={job.id} job={job} now={now} getEstimatedTime={getEstimatedTime} />
          ))}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refreshStatus()}
              disabled={isLoading}
              className="text-xs"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <span className="text-xs text-muted-foreground">
              {activeJobsCount >= maxConcurrent 
                ? 'Fila cheia - aguarde'
                : `${maxConcurrent - activeJobsCount} slot(s) disponível(is)`
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

interface JobCardProps {
  job: ActiveJob;
  now: number;
  getEstimatedTime: (type: string) => number;
}

function JobCard({ job, now, getEstimatedTime }: JobCardProps) {
  const isProcessing = job.status === 'processing';
  const rotatingMessage = useRotatingMessage(isProcessing, 8000);
  
  // Calcular estimativas usando o hook utilitário
  const estimate = calculateJobEstimate(
    job.startedAt, 
    job.generationType, 
    getEstimatedTime, 
    now
  );

  // Usar progresso suavizado para UX melhor
  const smoothProgress = isProcessing 
    ? calculateSmoothProgress(estimate.elapsed, estimate.estimated)
    : 0;

  return (
    <div className={`p-2 rounded-md space-y-2 animate-fade-in-up ${
      isProcessing 
        ? 'bg-primary/5 border border-primary/20 processing-card' 
        : 'bg-muted/50'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {isProcessing ? (
            <Zap className="h-4 w-4 text-amber-500 icon-working" />
          ) : (
            <Clock className="h-4 w-4 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium truncate max-w-[180px]">
              {job.productName || 'Produto'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isProcessing ? rotatingMessage.text : job.generationType}
            </p>
          </div>
        </div>
        <Badge 
          variant={isProcessing ? 'default' : 'secondary'}
          className={`text-xs ${isProcessing ? 'status-badge-active' : ''}`}
        >
          {isProcessing ? '✨ Gerando' : 'Na fila'}
        </Badge>
      </div>

      {/* Progress bar suavizada para jobs em processamento */}
      {isProcessing && (
        <div className="space-y-1">
          <div className="relative overflow-hidden">
            <Progress value={smoothProgress} className="h-1.5" />
            <div className="progress-animated absolute inset-0" />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" />
              {formatTimeOptimistic(estimate.remaining)}
            </span>
            <span className="text-primary font-medium">
              {smoothProgress >= 85 ? '🎯 Finalizando!' : `${Math.round(smoothProgress)}%`}
            </span>
          </div>
        </div>
      )}

      {/* Status para jobs pending - mais engajante */}
      {!isProcessing && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span>Preparando...</span>
        </div>
      )}
    </div>
  );
}
