import { CheckCircle, Loader2, Circle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface AutomationStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'error';
}

interface AutomationProgressIndicatorProps {
  steps: AutomationStep[];
  isRunning: boolean;
}

export const AutomationProgressIndicator = ({ steps, isRunning }: AutomationProgressIndicatorProps) => {
  const completedCount = steps.filter(s => s.status === 'completed').length;
  const progressValue = (completedCount / steps.length) * 100;
  const currentStep = steps.find(s => s.status === 'running');

  if (!isRunning && completedCount === 0) return null;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isRunning && <Loader2 className="h-5 w-5 animate-spin text-purple-600" />}
          <span className="font-semibold text-purple-700 dark:text-purple-300">
            {isRunning ? 'Automação em Progresso' : 'Automação Completa'}
          </span>
        </div>
        <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-200">
          {completedCount}/{steps.length} etapas
        </Badge>
      </div>

      {/* Progress bar */}
      <Progress value={progressValue} className="h-2" />

      {/* Current step info */}
      {currentStep && (
        <div className="text-sm text-purple-600 dark:text-purple-400 animate-pulse">
          Executando: {currentStep.label}...
        </div>
      )}

      {/* Steps list */}
      <div className="grid grid-cols-2 gap-2">
        {steps.map((step) => (
          <div 
            key={step.id} 
            className={`flex items-center gap-2 text-sm p-2 rounded ${
              step.status === 'completed' 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                : step.status === 'running'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : step.status === 'error'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
            }`}
          >
            {step.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
            {step.status === 'running' && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
            {step.status === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
            {step.status === 'pending' && <Circle className="h-4 w-4 text-gray-400" />}
            <span className="truncate">{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
