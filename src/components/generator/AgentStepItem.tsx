import { CheckCircle, Loader2, Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const agentColors = {
  atlas: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400',
  lyra: 'border-violet-500/50 bg-violet-500/10 text-violet-400',
  orion: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
};

const agentNames = {
  atlas: 'ATLAS',
  lyra: 'LYRA',
  orion: 'ORION',
};

export interface AgentStep {
  id: string;
  label: string;
  agent: 'atlas' | 'lyra' | 'orion';
  status: 'pending' | 'running' | 'completed' | 'error';
}

interface AgentStepItemProps {
  step: AgentStep;
}

export function AgentStepItem({ step }: AgentStepItemProps) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border transition-all duration-300",
      step.status === 'completed' && "border-green-500/50 bg-green-500/10",
      step.status === 'running' && cn(agentColors[step.agent], "animate-pulse shadow-lg"),
      step.status === 'error' && "border-red-500/50 bg-red-500/10",
      step.status === 'pending' && "border-slate-600 bg-slate-800/50 opacity-50"
    )}>
      {step.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />}
      {step.status === 'running' && <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />}
      {step.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />}
      {step.status === 'pending' && <Circle className="h-4 w-4 text-slate-500 flex-shrink-0" />}
      
      <div className="flex-1 min-w-0">
        <span className="text-sm truncate block">{step.label}</span>
        {step.status === 'running' && (
          <span className={cn(
            "text-xs font-medium",
            step.agent === 'atlas' && "text-cyan-400",
            step.agent === 'lyra' && "text-violet-400",
            step.agent === 'orion' && "text-amber-400",
          )}>
            {agentNames[step.agent]}
          </span>
        )}
      </div>
    </div>
  );
}
