import React from 'react';
import { useWorkflowTracking, WorkflowStep } from '@/hooks/useWorkflowTracking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  ServerCrash,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WorkflowProgressTrackerProps {
  sessionId: string;
  title?: string;
  showHeader?: boolean;
  compact?: boolean;
  className?: string;
  timeoutMs?: number;
  onRetry?: () => void;
}

const StatusIcon = ({ status }: { status: WorkflowStep['status'] }) => {
  switch (status) {
    case 'running':
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'error':
    case 'timeout':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const StatusBadge = ({ status }: { status: WorkflowStep['status'] }) => {
  const variants: Record<WorkflowStep['status'], string> = {
    pending: 'bg-gray-100 text-gray-700',
    running: 'bg-blue-100 text-blue-700 animate-pulse',
    completed: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-700',
    timeout: 'bg-orange-100 text-orange-700'
  };

  const labels: Record<WorkflowStep['status'], string> = {
    pending: 'Pendente',
    running: 'Executando',
    completed: 'Concluído',
    error: 'Erro',
    timeout: 'Timeout'
  };

  return (
    <Badge className={cn('text-xs font-medium', variants[status])}>
      {labels[status]}
    </Badge>
  );
};

export function WorkflowProgressTracker({
  sessionId,
  title = 'Aguardando servidor responder',
  showHeader = true,
  compact = false,
  className,
  timeoutMs = 30000,
  onRetry,
  onTimeout
}: WorkflowProgressTrackerProps & { onTimeout?: () => void }) {
  const {
    steps,
    currentStep,
    overallProgress,
    isLoading,
    isConnected,
    hasError,
    isComplete,
    isTimedOut,
    error,
    refetch,
    clearSession
  } = useWorkflowTracking({ sessionId, enabled: !!sessionId, timeoutMs });

  if (!sessionId) return null;

  // Chamar onTimeout automaticamente quando der timeout
  React.useEffect(() => {
    if (isTimedOut && onTimeout) {
      console.log('[WorkflowProgressTracker] Timeout! Finalizando processo automaticamente...');
      onTimeout();
    }
  }, [isTimedOut, onTimeout]);

  // Exibir mensagem de TIMEOUT / SERVIDOR SOBRECARREGADO (sem botões - finaliza automaticamente)
  if (isTimedOut) {
    return (
      <Card className={cn('w-full border-orange-300 bg-orange-50', className)}>
        <CardContent className="py-6">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="p-3 bg-orange-100 rounded-full">
              <ServerCrash className="h-10 w-10 text-orange-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-orange-800">
                Servidor Sobrecarregado
              </h3>
              <p className="text-sm text-orange-700 max-w-md">
                Não recebemos resposta em {timeoutMs / 1000}s. Tente novamente mais tarde.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Versão compacta (só mostra etapa atual)
  if (compact && steps.length > 0) {
    return (
      <div className={cn('flex items-center gap-3 p-3 bg-muted/50 rounded-lg', className)}>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="h-3 w-3 text-green-500" />
          ) : (
            <WifiOff className="h-3 w-3 text-red-500" />
          )}
        </div>

        {currentStep ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            <span className="text-sm font-medium">{currentStep.step_name}</span>
            {currentStep.message && (
              <span className="text-xs text-muted-foreground">
                {currentStep.message}
              </span>
            )}
          </>
        ) : isComplete ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-700">Concluído!</span>
          </>
        ) : hasError ? (
          <>
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-red-700">
              {error || 'Erro no processo'}
            </span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Aguardando...</span>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {overallProgress}%
          </span>
          <Progress value={overallProgress} className="w-20 h-2" />
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              {title}
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={refetch}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <Progress value={overallProgress} className="flex-1 h-2" />
            <span className="text-sm font-medium text-muted-foreground">
              {overallProgress}%
            </span>
          </div>
        </CardHeader>
      )}

      <CardContent className={cn(showHeader ? 'pt-0' : 'pt-4')}>
        {isLoading && steps.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span>Carregando status...</span>
          </div>
        ) : steps.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Clock className="h-5 w-5 mr-2" />
            <span>Aguardando início do workflow...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg transition-colors',
                  step.status === 'running' && 'bg-blue-50 border border-blue-200',
                  step.status === 'completed' && 'bg-green-50/50',
                  step.status === 'error' && 'bg-red-50 border border-red-200',
                  step.status === 'timeout' && 'bg-orange-50 border border-orange-200',
                  step.status === 'pending' && 'bg-muted/30'
                )}
              >
                {/* Linha de conexão */}
                <div className="flex flex-col items-center">
                  <StatusIcon status={step.status} />
                  {index < steps.length - 1 && (
                    <div className={cn(
                      'w-0.5 h-full min-h-[20px] mt-1',
                      step.status === 'completed' ? 'bg-green-300' : 'bg-muted-foreground/20'
                    )} />
                  )}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      'font-medium text-sm',
                      step.status === 'running' && 'text-blue-700',
                      step.status === 'completed' && 'text-green-700',
                      step.status === 'error' && 'text-red-700',
                      step.status === 'timeout' && 'text-orange-700'
                    )}>
                      {step.step_name}
                    </span>
                    <StatusBadge status={step.status} />
                  </div>

                  {step.message && (
                    <p className={cn(
                      'text-xs mt-1',
                      step.status === 'error' ? 'text-red-600' : 'text-muted-foreground'
                    )}>
                      {step.message}
                    </p>
                  )}

                  {/* Progress individual se disponível */}
                  {step.status === 'running' && step.progress > 0 && step.progress < 100 && (
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={step.progress} className="flex-1 h-1.5" />
                      <span className="text-xs text-muted-foreground">
                        {step.progress}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default WorkflowProgressTracker;
