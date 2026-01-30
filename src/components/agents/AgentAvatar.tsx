/**
 * ============================================
 * AGENT AVATAR - Avatar Animado dos Agentes IA
 * ============================================
 * Componente visual que representa os 3 agentes de conversão
 * com animações específicas para cada um
 */

import { CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import {
  AgentAvatarProps,
  AGENT_CONFIGS,
  AGENT_MESSAGES,
  AvatarSize,
} from './types';

/**
 * Mapa de tamanhos em pixels
 */
const SIZE_MAP: Record<AvatarSize, { avatar: number; icon: string; badge: number }> = {
  xs: { avatar: 32, icon: 'text-xs', badge: 16 },
  sm: { avatar: 48, icon: 'text-base', badge: 20 },
  md: { avatar: 64, icon: 'text-2xl', badge: 24 },
  lg: { avatar: 96, icon: 'text-4xl', badge: 32 },
  xl: { avatar: 128, icon: 'text-6xl', badge: 40 },
};

/**
 * Componente de Avatar do Agente
 */
export function AgentAvatar({
  agent,
  status,
  size = 'sm',
  showName = false,
  showProgress = false,
  progress = 0,
  statusMessage,
  className,
}: AgentAvatarProps) {
  const config = AGENT_CONFIGS[agent];
  const messages = AGENT_MESSAGES[agent];
  const sizing = SIZE_MAP[size];

  // Mensagem padrão se não fornecida
  const defaultMessage = (() => {
    switch (status) {
      case 'idle':
        return messages.idle;
      case 'running':
        // Alterna entre as mensagens de running baseado no progresso
        const index = Math.floor((progress / 100) * messages.running.length);
        return messages.running[Math.min(index, messages.running.length - 1)];
      case 'success':
        return messages.success;
      case 'error':
        return messages.error;
      default:
        return messages.idle;
    }
  })();

  const message = statusMessage || defaultMessage;

  // Classes de status
  const statusClasses = {
    idle: 'opacity-50 grayscale',
    running: config.pulseAnimation,
    success: 'border-green-500',
    error: 'border-red-500 animate-pulse',
  };

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      {/* Container do Avatar */}
      <div className="relative">
        {/* Avatar Base */}
        <div
          className={cn(
            'relative rounded-full border-2 flex items-center justify-center transition-all duration-300',
            statusClasses[status]
          )}
          style={{
            width: `${sizing.avatar}px`,
            height: `${sizing.avatar}px`,
            borderColor: status === 'running' ? config.primaryColor : 'hsl(var(--border))',
            backgroundColor: status === 'running' ? `${config.primaryColor}10` : 'hsl(var(--background))',
          }}
        >
          {/* Camadas de Animação */}
          {status === 'running' && (
            <>
              {/* ATLAS: Órbitas Girando */}
              {agent === 'atlas' && (
                <>
                  {/* Órbita externa */}
                  <div
                    className="absolute inset-0 rounded-full border-2 border-dashed animate-orbit-slow"
                    style={{
                      borderColor: config.primaryColor,
                      opacity: 0.3,
                    }}
                  />
                  {/* Órbita média */}
                  <div
                    className="absolute inset-2 rounded-full border-2 border-dotted animate-orbit-medium"
                    style={{
                      borderColor: config.secondaryColor,
                      opacity: 0.5,
                    }}
                  />
                  {/* Órbita interna */}
                  <div
                    className="absolute inset-4 rounded-full border-2 animate-orbit-fast"
                    style={{
                      borderColor: config.primaryColor,
                      opacity: 0.7,
                    }}
                  />
                </>
              )}

              {/* LYRA: Ondas Sonoras */}
              {agent === 'lyra' && (
                <>
                  {/* Onda 1 */}
                  <div
                    className="absolute inset-0 rounded-full border-2 animate-wave-pulse"
                    style={{
                      borderColor: config.primaryColor,
                      animationDelay: '0s',
                    }}
                  />
                  {/* Onda 2 */}
                  <div
                    className="absolute inset-0 rounded-full border-2 animate-wave-pulse"
                    style={{
                      borderColor: config.secondaryColor,
                      animationDelay: '0.5s',
                    }}
                  />
                  {/* Brilhos cintilantes */}
                  <div
                    className="absolute top-1 right-1 w-2 h-2 rounded-full bg-current animate-sparkle"
                    style={{ color: config.primaryColor, animationDelay: '0s' }}
                  />
                  <div
                    className="absolute bottom-1 left-1 w-2 h-2 rounded-full bg-current animate-sparkle"
                    style={{ color: config.secondaryColor, animationDelay: '0.3s' }}
                  />
                </>
              )}

              {/* ORION: Estrelas Cintilantes */}
              {agent === 'orion' && (
                <>
                  {/* Estrela superior direita */}
                  <div
                    className="absolute -top-1 -right-1 w-3 h-3 animate-twinkle"
                    style={{ color: config.primaryColor, animationDelay: '0s' }}
                  >
                    ✨
                  </div>
                  {/* Estrela superior esquerda */}
                  <div
                    className="absolute -top-1 -left-1 w-3 h-3 animate-twinkle"
                    style={{ color: config.secondaryColor, animationDelay: '0.5s' }}
                  >
                    ✨
                  </div>
                  {/* Pixels flutuantes */}
                  <div
                    className="absolute bottom-0 left-1/4 w-1 h-1 rounded-full bg-current animate-float-pixel"
                    style={{ color: config.primaryColor, animationDelay: '0s' }}
                  />
                  <div
                    className="absolute bottom-0 right-1/4 w-1 h-1 rounded-full bg-current animate-float-pixel"
                    style={{ color: config.secondaryColor, animationDelay: '0.3s' }}
                  />
                </>
              )}
            </>
          )}

          {/* Ícone Central */}
          <div
            className={cn('relative z-10 transition-all', sizing.icon)}
            style={{
              filter: status === 'running' ? 'drop-shadow(0 0 8px currentColor)' : 'none',
              color: status === 'running' ? config.primaryColor : 'hsl(var(--foreground))',
            }}
          >
            {config.icon}
          </div>

          {/* Badge de Status (Success/Error) */}
          {(status === 'success' || status === 'error') && (
            <div
              className="absolute -bottom-1 -right-1 rounded-full bg-background border-2 flex items-center justify-center"
              style={{
                width: `${sizing.badge}px`,
                height: `${sizing.badge}px`,
                borderColor: status === 'success' ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)',
              }}
            >
              {status === 'success' ? (
                <CheckCircle className="w-3/4 h-3/4 text-green-600" />
              ) : (
                <AlertCircle className="w-3/4 h-3/4 text-red-600" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Nome e Descrição */}
      {showName && (
        <div className="text-center">
          <h3
            className="font-bold text-sm"
            style={{
              color: status === 'running' ? config.primaryColor : 'hsl(var(--foreground))',
            }}
          >
            {config.name}
          </h3>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>
      )}

      {/* Barra de Progresso */}
      {showProgress && status === 'running' && (
        <div className="w-full space-y-1">
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{Math.round(progress)}%</span>
          </div>
        </div>
      )}

      {/* Mensagem de Status */}
      {message && (
        <p
          className={cn(
            'text-xs text-center max-w-[200px] transition-colors',
            status === 'running' && 'text-muted-foreground animate-pulse',
            status === 'success' && 'text-green-600 font-medium',
            status === 'error' && 'text-red-600 font-medium'
          )}
        >
          {status === 'running' && '💭 '}
          {status === 'success' && '✅ '}
          {status === 'error' && '⚠️ '}
          {message}
        </p>
      )}
    </div>
  );
}

/**
 * ============================================
 * AGENT CARD - Card Completo do Agente
 * ============================================
 * Card com avatar + informações completas
 */

interface AgentCardProps extends AgentAvatarProps {
  /** Tempo decorrido (em segundos) */
  elapsed?: number;
  /** Estimativa de tempo restante */
  estimatedTime?: string;
}

export function AgentCard({
  agent,
  status,
  size = 'md',
  progress = 0,
  statusMessage,
  elapsed,
  estimatedTime,
  className,
}: AgentCardProps) {
  const config = AGENT_CONFIGS[agent];

  return (
    <div
      className={cn(
        'rounded-lg border-2 p-4 transition-all duration-300',
        status === 'running' && 'shadow-lg',
        className
      )}
      style={{
        borderColor: status === 'running' ? config.primaryColor : 'hsl(var(--border))',
        backgroundColor: status === 'running' ? `${config.primaryColor}05` : 'transparent',
      }}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <AgentAvatar agent={agent} status={status} size={size} />

        {/* Informações */}
        <div className="flex-1 space-y-2">
          {/* Nome e Descrição */}
          <div>
            <h3
              className="font-bold text-lg"
              style={{
                color: status === 'running' ? config.primaryColor : 'hsl(var(--foreground))',
              }}
            >
              {config.icon} {config.name}
            </h3>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>

          {/* Progresso */}
          {status === 'running' && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{Math.round(progress)}%</span>
                {elapsed && <span>⏱️ {elapsed}s</span>}
                {estimatedTime && <span>~{estimatedTime}</span>}
              </div>
            </div>
          )}

          {/* Mensagem de Status */}
          {statusMessage && (
            <p
              className={cn(
                'text-sm',
                status === 'running' && 'text-muted-foreground animate-pulse',
                status === 'success' && 'text-green-600 font-medium',
                status === 'error' && 'text-red-600 font-medium'
              )}
            >
              {statusMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
