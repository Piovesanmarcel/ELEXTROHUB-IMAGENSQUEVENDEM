import AIAgentAvatar from '@/components/landing/AIAgentAvatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AgentStepItem, type AgentStep } from './AgentStepItem';

interface AgentProgressIndicatorProps {
  steps: AgentStep[];
  isRunning: boolean;
}

const agentInfo = {
  atlas: { name: 'ATLAS', role: 'Estrategista', color: 'text-cyan-400' },
  lyra: { name: 'LYRA', role: 'Persuasora', color: 'text-violet-400' },
  orion: { name: 'ORION', role: 'Artista Visual', color: 'text-amber-400' },
};

export function AgentProgressIndicator({ steps, isRunning }: AgentProgressIndicatorProps) {
  const currentStep = steps.find(s => s.status === 'running');
  const completedCount = steps.filter(s => s.status === 'completed').length;
  const progress = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;
  const allCompleted = completedCount === steps.length && steps.length > 0;
  
  // Determinar agente ativo
  const activeAgent = currentStep?.agent || null;

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 border border-slate-700 space-y-6 overflow-hidden">
      {/* Header com avatares dos 3 agentes */}
      <div className="flex justify-center items-center gap-6 md:gap-10">
        {(['atlas', 'lyra', 'orion'] as const).map((agent) => (
          <div 
            key={agent}
            className={cn(
              "relative transition-all duration-500 flex flex-col items-center gap-2",
              activeAgent === agent 
                ? "scale-110 opacity-100" 
                : activeAgent 
                  ? "scale-90 opacity-30 grayscale" 
                  : allCompleted
                    ? "opacity-100"
                    : "opacity-60"
            )}
          >
            <div className={cn(
              "relative",
              activeAgent === agent && "animate-bounce-subtle"
            )}>
              <AIAgentAvatar 
                agent={agent} 
                size="sm" 
                animated={activeAgent === agent || allCompleted || !isRunning} 
              />
              
              {/* Glow ring quando ativo */}
              {activeAgent === agent && (
                <div className={cn(
                  "absolute inset-0 rounded-full animate-ping opacity-30",
                  agent === 'atlas' && "bg-cyan-500",
                  agent === 'lyra' && "bg-violet-500",
                  agent === 'orion' && "bg-amber-500",
                )} />
              )}
            </div>
            
            {/* Nome e role do agente */}
            <div className="text-center">
              <p className={cn(
                "text-xs font-bold transition-colors",
                activeAgent === agent ? agentInfo[agent].color : "text-slate-400"
              )}>
                {agentInfo[agent].name}
              </p>
              <p className="text-[10px] text-slate-500">{agentInfo[agent].role}</p>
            </div>
            
            {/* Badge ativo */}
            {activeAgent === agent && (
              <Badge className={cn(
                "absolute -bottom-1 left-1/2 -translate-x-1/2 animate-pulse text-[10px] px-2 py-0 border-0",
                agent === 'atlas' && "bg-gradient-to-r from-cyan-600 to-blue-600",
                agent === 'lyra' && "bg-gradient-to-r from-violet-600 to-purple-600",
                agent === 'orion' && "bg-gradient-to-r from-amber-600 to-orange-600",
              )}>
                Ativo
              </Badge>
            )}
            
            {/* Checkmark quando todos completados */}
            {allCompleted && (
              <Badge className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-green-600 text-[10px] px-2 py-0 border-0">
                ✓
              </Badge>
            )}
          </div>
        ))}
      </div>

      {/* Barra de progresso */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-center text-slate-400">
          {Math.round(progress)}% Completo
        </p>
      </div>
      
      {/* Status atual com animação */}
      {currentStep && (
        <div className="text-center space-y-1 animate-fade-in">
          <p className={cn(
            "text-lg font-semibold",
            currentStep.agent === 'atlas' && "text-cyan-400",
            currentStep.agent === 'lyra' && "text-violet-400",
            currentStep.agent === 'orion' && "text-amber-400",
          )}>
            {currentStep.label}
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                currentStep.agent === 'atlas' && "bg-cyan-400",
                currentStep.agent === 'lyra' && "bg-violet-400",
                currentStep.agent === 'orion' && "bg-amber-400",
              )}></span>
              <span className={cn(
                "relative inline-flex rounded-full h-2 w-2",
                currentStep.agent === 'atlas' && "bg-cyan-500",
                currentStep.agent === 'lyra' && "bg-violet-500",
                currentStep.agent === 'orion' && "bg-amber-500",
              )}></span>
            </span>
            <p className="text-sm text-slate-400 animate-pulse">
              Processando...
            </p>
          </div>
        </div>
      )}
      
      {/* Mensagem de conclusão */}
      {allCompleted && !currentStep && (
        <div className="text-center space-y-1 animate-fade-in">
          <p className="text-lg font-semibold text-green-400">
            ✨ Processamento Concluído!
          </p>
          <p className="text-sm text-slate-400">
            Todos os agentes finalizaram suas tarefas
          </p>
        </div>
      )}

      {/* Timeline de etapas */}
      {steps.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {steps.map((step) => (
            <AgentStepItem key={step.id} step={step} />
          ))}
        </div>
      )}
    </div>
  );
}

// Tipos de etapas pré-definidas por tipo de geração
export const COMMAND_STEPS: AgentStep[] = [
  { id: 'sending', label: 'Enviando dados...', agent: 'atlas', status: 'pending' },
  { id: 'analyzing', label: 'Analisando produto', agent: 'atlas', status: 'pending' },
  { id: 'generating', label: 'Gerando conteúdo IA', agent: 'lyra', status: 'pending' },
  { id: 'finalizing', label: 'Finalizando resposta', agent: 'lyra', status: 'pending' },
];

export const COPY_STEPS: AgentStep[] = [
  { id: 'sending', label: 'Enviando para IA...', agent: 'atlas', status: 'pending' },
  { id: 'writing', label: 'Escrevendo copy', agent: 'lyra', status: 'pending' },
  { id: 'optimizing', label: 'Otimizando SEO', agent: 'lyra', status: 'pending' },
  { id: 'finalizing', label: 'Finalizando', agent: 'lyra', status: 'pending' },
];

export const IMAGE_STEPS: AgentStep[] = [
  { id: 'sending', label: 'Enviando imagem...', agent: 'atlas', status: 'pending' },
  { id: 'processing', label: 'Processando produto', agent: 'atlas', status: 'pending' },
  { id: 'generating', label: 'Gerando cenário', agent: 'orion', status: 'pending' },
  { id: 'upscaling', label: 'Upscaling 4K', agent: 'orion', status: 'pending' },
  { id: 'finalizing', label: 'Finalizando imagem', agent: 'orion', status: 'pending' },
];

export const FULL_FLOW_STEPS: AgentStep[] = [
  { id: 'sending_cmd', label: 'Enviando dados...', agent: 'atlas', status: 'pending' },
  { id: 'analyzing', label: 'Analisando produto', agent: 'atlas', status: 'pending' },
  { id: 'command_ai', label: 'Comando IA 5-em-1', agent: 'lyra', status: 'pending' },
  { id: 'copywriting', label: 'Gerando copywriting', agent: 'lyra', status: 'pending' },
  { id: 'image_gen', label: 'Gerando imagem', agent: 'orion', status: 'pending' },
  { id: 'upscaling', label: 'Upscaling 4K', agent: 'orion', status: 'pending' },
];

export type { AgentStep };
