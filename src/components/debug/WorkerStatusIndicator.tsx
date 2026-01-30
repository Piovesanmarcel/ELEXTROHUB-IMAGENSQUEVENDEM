import { Loader2, Clock, Moon, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type WorkerState = 'idle' | 'active' | 'inactive';

interface WorkerStatusIndicatorProps {
  workerState: WorkerState;
  lastMessageAt: string | null;
  pollingInterval?: number; // em segundos
}

const stateConfig = {
  active: {
    label: 'Processando',
    description: 'Worker ativo processando jobs',
    Icon: Loader2,
    dotColor: 'bg-green-500',
    iconAnimation: 'animate-spin',
    bgColor: 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800',
    badgeClass: 'bg-green-500 hover:bg-green-600'
  },
  idle: {
    label: 'Idle',
    description: 'Fila vazia, polling a cada 3s aguardando novos jobs',
    Icon: Clock,
    dotColor: 'bg-amber-500',
    iconAnimation: 'animate-pulse',
    bgColor: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',
    badgeClass: 'bg-amber-500 hover:bg-amber-600'
  },
  inactive: {
    label: 'Inativo',
    description: 'Sem atividade há mais de 5 minutos',
    Icon: Moon,
    dotColor: 'bg-gray-400',
    iconAnimation: '',
    bgColor: 'bg-muted/50 border-border',
    badgeClass: 'bg-muted-foreground hover:bg-muted-foreground'
  }
};

// Formatar tempo relativo detalhado
const formatDetailedTime = (timestamp: string | null): string => {
  if (!timestamp) return 'Nunca';
  
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  
  if (seconds < 5) return 'agora mesmo';
  if (seconds < 60) return `${seconds} segundos atrás`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minuto${minutes > 1 ? 's' : ''} atrás`;
  
  const hours = Math.floor(minutes / 60);
  return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
};

export function WorkerStatusIndicator({ 
  workerState, 
  lastMessageAt,
  pollingInterval = 3 
}: WorkerStatusIndicatorProps) {
  const config = stateConfig[workerState];
  const { Icon, iconAnimation, bgColor, dotColor, label, description, badgeClass } = config;

  return (
    <div className={`p-4 rounded-lg border ${bgColor} transition-all duration-300`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Indicador visual animado */}
          <div className="relative">
            <div className={`h-3 w-3 rounded-full ${dotColor} ${workerState === 'active' ? 'animate-ping absolute' : ''}`} />
            <div className={`h-3 w-3 rounded-full ${dotColor} ${workerState === 'idle' ? 'animate-pulse' : ''}`} />
          </div>
          
          {/* Ícone e Label */}
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 text-muted-foreground ${iconAnimation}`} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{label}</span>
                <Badge className={`text-[10px] px-1.5 py-0 ${badgeClass}`}>
                  {workerState === 'active' ? 'RUNNING' : workerState === 'idle' ? 'POLLING' : 'STOPPED'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
        </div>

        {/* Info adicional */}
        <div className="text-right text-xs text-muted-foreground">
          {workerState === 'idle' && (
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              <span>Polling: {pollingInterval}s</span>
            </div>
          )}
          <div className="mt-0.5">
            Última atividade: {formatDetailedTime(lastMessageAt)}
          </div>
        </div>
      </div>
    </div>
  );
}
