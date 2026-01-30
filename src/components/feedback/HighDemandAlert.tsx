import { useState, useEffect, useCallback } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Flame, Clock, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface HighDemandAlertProps {
  onRetry: () => void;
  retryIn?: number;
  message?: string;
  showProgress?: boolean;
}

/**
 * Componente amigável para substituir erros 429 (rate limiting)
 * Mostra que o sistema está popular em vez de mensagem de erro técnica
 */
export const HighDemandAlert = ({ 
  onRetry, 
  retryIn = 30,
  message,
  showProgress = true
}: HighDemandAlertProps) => {
  const [countdown, setCountdown] = useState(retryIn);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    setCountdown(retryIn);
  }, [retryIn]);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry]);

  const progress = ((retryIn - countdown) / retryIn) * 100;

  return (
    <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <div className="relative">
            <Flame className="h-5 w-5 text-amber-600 dark:text-amber-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <AlertTitle className="text-amber-800 dark:text-amber-200 font-semibold flex items-center gap-2">
            Sistema em alta demanda
            <span className="text-xs font-normal bg-amber-200 dark:bg-amber-800 px-2 py-0.5 rounded-full">
              Popular! 🔥
            </span>
          </AlertTitle>
          
          <AlertDescription className="text-amber-700 dark:text-amber-300 mt-1">
            {message || 'Muitas pessoas estão gerando imagens agora! Seu pedido está na fila.'}
            
            {countdown > 0 ? (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>Próxima tentativa em <strong>{countdown}s</strong></span>
                </div>
                
                {showProgress && (
                  <Progress 
                    value={progress} 
                    className="h-1.5 bg-amber-200 dark:bg-amber-800"
                  />
                )}
              </div>
            ) : (
              <div className="mt-3">
                <Button 
                  onClick={handleRetry}
                  disabled={isRetrying}
                  size="sm"
                  variant="outline"
                  className="border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900"
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Tentando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Tentar novamente
                    </>
                  )}
                </Button>
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};

// Variante compacta para uso em listas
export const HighDemandBadge = () => (
  <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full">
    <Flame className="h-3 w-3" />
    Alta demanda
  </span>
);

export default HighDemandAlert;
