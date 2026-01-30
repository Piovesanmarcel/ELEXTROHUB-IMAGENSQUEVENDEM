import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wand2, Loader2, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import AIAgentAvatar from "@/components/landing/AIAgentAvatar";

interface MagicAgentButtonProps {
  onClick: () => void;
  isExecuting: boolean;
  isValid: boolean;
  missingFields: string[];
  currentStep?: string;
}

type AgentStatus = 'pending' | 'active' | 'completed';

const getAgentStatus = (agent: 'atlas' | 'lyra' | 'orion', currentStep?: string): AgentStatus => {
  if (!currentStep) return 'pending';
  
  const order = { atlas: 1, lyra: 2, orion: 3 };
  const agentOrder = order[agent];
  
  // Determinar em que etapa estamos
  let currentOrder = 0;
  if (currentStep.includes('atlas')) currentOrder = 1;
  else if (currentStep.includes('lyra')) currentOrder = 2;
  else if (currentStep.includes('orion')) currentOrder = 3;
  
  // Verificar se já completou
  if (currentStep === `${agent}_complete`) return 'completed';
  
  // Verificar se está ativo
  if (currentStep === agent) return 'active';
  
  // Se etapa atual é posterior, significa que este agente já completou
  if (agentOrder < currentOrder) return 'completed';
  
  // Verificar se uma etapa posterior está completa (implica que este completou)
  if (currentStep.includes('_complete')) {
    const completedAgent = currentStep.replace('_complete', '') as 'atlas' | 'lyra' | 'orion';
    if (order[completedAgent] > agentOrder) return 'completed';
  }
  
  return 'pending';
};

const getAgentMessage = (currentStep?: string): string => {
  if (!currentStep) return '';
  
  switch (currentStep) {
    case 'atlas':
      return '🌐 ATLAS analisando produto...';
    case 'atlas_complete':
      return '✅ ATLAS concluído! Preparando LYRA...';
    case 'lyra':
      return '✍️ LYRA gerando copy persuasivo...';
    case 'lyra_complete':
      return '✅ LYRA concluído! Preparando ORION...';
    case 'orion':
      return '🎨 ORION criando 8 cenários visuais...';
    case 'orion_complete':
      return '🎉 Todos os agentes concluíram!';
    default:
      return currentStep;
  }
};

export function MagicAgentButton({
  onClick,
  isExecuting,
  isValid,
  missingFields,
  currentStep,
}: MagicAgentButtonProps) {
  const agents = ['atlas', 'lyra', 'orion'] as const;
  
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Indicador de campos faltando - sempre visível quando inválido */}
      {!isValid && !isExecuting && missingFields.length > 0 && (
        <div className="w-full">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-muted-foreground font-medium">
              Campos obrigatórios faltando:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {missingFields.map((field, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="bg-amber-50 text-amber-700 border-amber-200"
              >
                {field}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Avatares dos Agentes - sempre visíveis */}
      <div className="flex justify-center items-end gap-4 md:gap-8 py-4 w-full">
        {agents.map((agent, index) => {
          const status = isExecuting ? getAgentStatus(agent, currentStep) : 'pending';
          const isActive = status === 'active';
          const isCompleted = status === 'completed';
          const isPending = status === 'pending';
          
          return (
            <div key={agent} className="flex flex-col items-center gap-2 relative">
              {/* Seta de conexão (exceto primeiro) */}
              {index > 0 && (
                <div className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2">
                  <div className={cn(
                    "w-4 md:w-6 h-0.5 transition-colors duration-500",
                    isCompleted || isActive ? "bg-gradient-to-r from-primary/50 to-primary" : "bg-muted"
                  )} />
                </div>
              )}
              
              {/* Container do Avatar */}
              <div 
                className={cn(
                  "relative transition-all duration-500",
                  isActive && "scale-110",
                  isPending && !isExecuting && "opacity-50 grayscale",
                  isPending && isExecuting && "opacity-40 grayscale"
                )}
              >
                {/* Avatar do Agente */}
                <AIAgentAvatar 
                  agent={agent} 
                  size="sm" 
                  animated={isActive} 
                  className={cn(
                    "transition-all duration-500",
                    isActive && "drop-shadow-lg"
                  )}
                />
                
                {/* Ping ring quando ativo */}
                {isActive && (
                  <div className={cn(
                    "absolute inset-0 rounded-full animate-ping opacity-20",
                    agent === 'atlas' && "bg-cyan-500",
                    agent === 'lyra' && "bg-violet-500",
                    agent === 'orion' && "bg-amber-500",
                  )} />
                )}
                
                {/* Checkmark quando completo */}
                {isCompleted && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg border-2 border-background">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
              </div>
              
              {/* Nome do Agente */}
              <span className={cn(
                "text-xs font-bold uppercase tracking-wider transition-colors duration-300",
                agent === 'atlas' && (isActive || isCompleted) && "text-cyan-500",
                agent === 'lyra' && (isActive || isCompleted) && "text-violet-500", 
                agent === 'orion' && (isActive || isCompleted) && "text-amber-500",
                isPending && "text-muted-foreground"
              )}>
                {agent}
              </span>
              
              {/* Badge "Ativo" quando processando */}
              {isActive && (
                <Badge className={cn(
                  "animate-pulse text-[10px] px-2 py-0.5 shadow-lg",
                  agent === 'atlas' && "bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-0",
                  agent === 'lyra' && "bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0",
                  agent === 'orion' && "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0",
                )}>
                  Ativo
                </Badge>
              )}
            </div>
          );
        })}
      </div>

      {/* Mensagem de status durante execução */}
      {isExecuting && currentStep && (
        <div className="w-full text-center">
          <p className="text-sm font-medium text-foreground animate-pulse">
            {getAgentMessage(currentStep)}
          </p>
        </div>
      )}

      {/* Botão Principal */}
      <Button
        onClick={onClick}
        disabled={!isValid || isExecuting}
        size="lg"
        className={cn(
          "w-full max-w-md h-14 text-lg font-bold shadow-lg transition-all duration-300",
          isValid && !isExecuting
            ? "bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-700 hover:via-purple-700 hover:to-pink-700 text-white hover:scale-[1.02] hover:shadow-xl"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        )}
      >
        {isExecuting ? (
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Agentes Trabalhando...</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Wand2 className="h-5 w-5" />
            <span>Acionar Agentes de Conversão</span>
          </div>
        )}
      </Button>
    </div>
  );
}

export default MagicAgentButton;
