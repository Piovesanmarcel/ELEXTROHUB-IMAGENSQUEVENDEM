import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertCircle, 
  Clock, 
  Loader2, 
  Eye,
  Timer
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { RateLimitErrorData } from '@/hooks/useJobLimitCheck';
import type { ActiveJob } from '@/contexts/UserJobStatusContext';

interface JobLimitAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: RateLimitErrorData | null;
  onViewProgress?: () => void;
  onRetry?: () => void;
  cooldownSeconds?: number;
}

export function JobLimitAlert({ 
  open, 
  onOpenChange, 
  data,
  onViewProgress,
  onRetry,
  cooldownSeconds = 0
}: JobLimitAlertProps) {
  if (!data) return null;

  const { pendingJobs, maxConcurrent, activeJobs, reason, errorType } = data;
  const isCooldown = errorType === 'cooldown';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
              isCooldown 
                ? 'bg-blue-100 dark:bg-blue-900/30' 
                : 'bg-amber-100 dark:bg-amber-900/30'
            }`}>
              {isCooldown ? (
                <Timer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div>
              <DialogTitle>
                {isCooldown 
                  ? 'Aguarde antes de gerar novamente' 
                  : 'Você já tem uma geração em andamento'
                }
              </DialogTitle>
              <DialogDescription className="text-sm">
                {isCooldown 
                  ? 'Rate limit ativo para proteger o sistema'
                  : 'Aguarde suas gerações atuais terminarem'
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Cooldown Timer */}
          {isCooldown && cooldownSeconds > 0 && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative">
                <div className="text-6xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                  {cooldownSeconds}
                </div>
                <div className="text-sm text-muted-foreground text-center mt-1">
                  segundos
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Aguarde o tempo acima para iniciar uma nova geração
              </p>
            </div>
          )}

          {/* Explicação para limite de jobs */}
          {!isCooldown && (
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm">
                Para evitar sobrecarga no sistema, permitimos apenas{' '}
                <strong>{maxConcurrent || 2} gerações simultâneas</strong> por usuário.
              </AlertDescription>
            </Alert>
          )}

          {/* Explicação para cooldown */}
          {isCooldown && cooldownSeconds === 0 && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
              <Clock className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm">
                Cooldown finalizado! Você já pode iniciar uma nova geração.
              </AlertDescription>
            </Alert>
          )}

          {/* Jobs ativos - apenas mostrar se não for cooldown */}
          {!isCooldown && activeJobs && activeJobs.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Jobs ativos ({pendingJobs || activeJobs.length}/{maxConcurrent || 2}):
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {activeJobs.map((job) => (
                  <ActiveJobCard key={job.id} job={job} />
                ))}
              </div>
            </div>
          )}

          {/* Razão adicional */}
          {reason && !reason.includes('limite') && !reason.includes('Aguarde') && (
            <p className="text-sm text-muted-foreground">
              {reason}
            </p>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {onViewProgress && !isCooldown && (
            <Button 
              variant="outline" 
              onClick={() => {
                onViewProgress();
                onOpenChange(false);
              }}
              className="w-full sm:w-auto"
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver Progresso
            </Button>
          )}
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            <Clock className="h-4 w-4 mr-2" />
            {isCooldown && cooldownSeconds === 0 
              ? 'Fechar e tentar novamente'
              : 'Entendi, vou aguardar'
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ActiveJobCard({ job }: { job: ActiveJob }) {
  const isProcessing = job.status === 'processing';
  
  return (
    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
      <div className="flex-shrink-0">
        {isProcessing ? (
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
        ) : (
          <Clock className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {job.productName || 'Produto sem nome'}
        </p>
        <p className="text-xs text-muted-foreground">
          {isProcessing ? 'Processando' : 'Na fila'} • {' '}
          {formatDistanceToNow(new Date(job.startedAt || job.createdAt), {
            addSuffix: false,
            locale: ptBR
          })}
        </p>
      </div>
      <Badge 
        variant={isProcessing ? 'default' : 'secondary'}
        className="flex-shrink-0"
      >
        {isProcessing ? 'Ativo' : 'Pendente'}
      </Badge>
    </div>
  );
}
