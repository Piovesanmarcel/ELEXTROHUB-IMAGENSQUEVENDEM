import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BatchProgress {
  jobId: string;
  productName: string;
  current: number;
  total: number;
  status: 'pending' | 'processing' | 'completed';
}

interface BatchProgressBarProps {
  progress: BatchProgress;
  onComplete?: () => void;
}

export function BatchProgressBar({ progress, onComplete }: BatchProgressBarProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const percentage = Math.round((progress.current / progress.total) * 100);
  const isComplete = progress.status === 'completed' || progress.current >= progress.total;

  useEffect(() => {
    if (isComplete) {
      setShowCelebration(true);
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, onComplete]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border p-4 transition-all duration-500",
        isComplete 
          ? "border-green-500/50 bg-green-500/10" 
          : "border-primary/30 bg-primary/5"
      )}
    >
      {/* Celebration animation */}
      {showCelebration && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 animate-bounce delay-100">
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="absolute top-0 left-1/2 animate-bounce delay-200">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="absolute top-0 left-3/4 animate-bounce delay-300">
            <Sparkles className="w-4 h-4 text-pink-400" />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          )}
          <span className="font-medium text-foreground">
            {isComplete ? 'Todas as imagens geradas!' : `Gerando imagens para "${progress.productName}"`}
          </span>
        </div>
        <Badge 
          variant={isComplete ? "default" : "secondary"}
          className={cn(
            "transition-all",
            isComplete && "bg-green-500 hover:bg-green-600"
          )}
        >
          {isComplete ? (
            <>Concluído ✓</>
          ) : (
            <>Processando...</>
          )}
        </Badge>
      </div>

      <div className="space-y-2">
        <Progress 
          value={percentage} 
          className={cn(
            "h-3 transition-all duration-300",
            isComplete && "[&>div]:bg-green-500"
          )}
        />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">{progress.current}</span> de{' '}
            <span className="font-semibold text-foreground">{progress.total}</span> imagens
          </span>
          <span className={cn(
            "font-medium",
            isComplete ? "text-green-500" : "text-primary"
          )}>
            {percentage}%
          </span>
        </div>
      </div>
    </div>
  );
}
