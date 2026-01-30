
import { Loader, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./button";

export default function LoadingScreen({ 
  message = "Carregando...", 
  onRetry 
}: { 
  message?: string;
  onRetry?: () => void;
}) {
  const [dots, setDots] = useState("");
  const [showTimeout, setShowTimeout] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    // Animação dos pontinhos
    const dotsInterval = setInterval(() => {
      setDots(prev => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    // Contador de tempo
    const timeInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    // Mostrar aviso se demorar muito
    const timeout = setTimeout(() => {
      setShowTimeout(true);
    }, 15000); // 15 segundos

    // Monitorar status da conexão
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(timeInterval);
      clearTimeout(timeout);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 max-w-md mx-auto px-4">
        <div className="relative">
          <Loader className="h-12 w-12 animate-spin text-primary" />
          <div className="absolute -top-1 -right-1">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>
        
        <div className="text-center space-y-3">
          <p className="text-lg font-medium">{message}{dots}</p>
          
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Aguarde enquanto carregamos todos os seus produtos...</p>
            <p className="font-mono">Tempo decorrido: {formatTime(elapsedTime)}</p>
            {!isOnline && (
              <p className="text-red-500 font-medium">⚠️ Sem conexão com a internet</p>
            )}
          </div>

          {showTimeout && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
              <p className="text-sm text-yellow-800">
                O carregamento está demorando mais que o esperado.
              </p>
              
              <div className="space-y-2 text-xs text-yellow-700">
                <p>• Verifique sua conexão com a internet</p>
                <p>• Produtos com muitas imagens podem demorar mais</p>
                <p>• O sistema está otimizando o carregamento</p>
              </div>

              {onRetry && (
                <Button 
                  onClick={onRetry}
                  variant="outline" 
                  size="sm"
                  className="w-full mt-3"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
              )}
              
              <Button
                onClick={() => window.location.reload()}
                variant="secondary"
                size="sm" 
                className="w-full"
              >
                Recarregar Página
              </Button>
            </div>
          )}
        </div>
        
        {/* Indicador de progresso visual */}
        <div className="w-full max-w-xs">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
              style={{ 
                width: `${Math.min((elapsedTime / 30) * 100, 95)}%` 
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-1">
            Carregando dados do sistema...
          </p>
        </div>
      </div>
    </div>
  );
}
