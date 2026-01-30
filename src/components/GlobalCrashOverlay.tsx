import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Trash2, Copy, CheckCircle2 } from "lucide-react";

interface CrashInfo {
  message: string;
  stack?: string;
  route: string;
  productId?: string;
  timestamp: string;
  aiEvents?: any[];
}

const CRASH_STORAGE_KEY = '__last_crash__';
const CHECKPOINT_KEY = '__automation_checkpoint__';

// Salvar checkpoint de automação
export const saveCheckpoint = (step: string, data: Record<string, any>) => {
  try {
    const checkpoint = {
      step,
      timestamp: new Date().toISOString(),
      ...data
    };
    sessionStorage.setItem(CHECKPOINT_KEY, JSON.stringify(checkpoint));
    console.log(`📍 [CHECKPOINT] ${step}`, checkpoint);
  } catch (e) {
    console.warn('Erro ao salvar checkpoint:', e);
  }
};

// Limpar checkpoint
export const clearCheckpoint = () => {
  try {
    sessionStorage.removeItem(CHECKPOINT_KEY);
  } catch (e) {
    // ignore
  }
};

// Obter último checkpoint
export const getLastCheckpoint = (): Record<string, any> | null => {
  try {
    const data = sessionStorage.getItem(CHECKPOINT_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

export const GlobalCrashOverlay = () => {
  const [crashInfo, setCrashInfo] = useState<CrashInfo | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Capturar erros síncronos
    const handleError = (event: ErrorEvent) => {
      console.error('🔴 [GlobalCrashOverlay] Erro capturado:', event.error);
      
      const aiEvents = (window as any).__AI_EVENT_LOG__?.getLogs?.() || [];
      const checkpoint = getLastCheckpoint();
      
      const info: CrashInfo = {
        message: event.message || event.error?.message || 'Erro desconhecido',
        stack: event.error?.stack,
        route: window.location.pathname,
        productId: sessionStorage.getItem('currentProductId') || undefined,
        timestamp: new Date().toISOString(),
        aiEvents: aiEvents.slice(-5) // últimos 5 eventos
      };

      // Adicionar checkpoint se existir
      if (checkpoint) {
        (info as any).checkpoint = checkpoint;
      }

      // Salvar no localStorage para persistir entre reloads
      try {
        localStorage.setItem(CRASH_STORAGE_KEY, JSON.stringify(info));
      } catch (e) {
        console.warn('Não foi possível salvar crash info');
      }

      setCrashInfo(info);
    };

    // Capturar promises rejeitadas
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🔴 [GlobalCrashOverlay] Promise rejeitada:', event.reason);
      
      const aiEvents = (window as any).__AI_EVENT_LOG__?.getLogs?.() || [];
      const checkpoint = getLastCheckpoint();
      
      const info: CrashInfo = {
        message: event.reason?.message || String(event.reason) || 'Promise rejeitada',
        stack: event.reason?.stack,
        route: window.location.pathname,
        productId: sessionStorage.getItem('currentProductId') || undefined,
        timestamp: new Date().toISOString(),
        aiEvents: aiEvents.slice(-5)
      };

      if (checkpoint) {
        (info as any).checkpoint = checkpoint;
      }

      try {
        localStorage.setItem(CRASH_STORAGE_KEY, JSON.stringify(info));
      } catch (e) {
        // ignore
      }

      setCrashInfo(info);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Verificar se há crash anterior
    try {
      const savedCrash = localStorage.getItem(CRASH_STORAGE_KEY);
      if (savedCrash) {
        const parsed = JSON.parse(savedCrash);
        // Só mostrar se foi recente (últimos 5 minutos)
        const crashTime = new Date(parsed.timestamp).getTime();
        const now = Date.now();
        if (now - crashTime < 5 * 60 * 1000) {
          setCrashInfo(parsed);
        } else {
          localStorage.removeItem(CRASH_STORAGE_KEY);
        }
      }
    } catch (e) {
      // ignore
    }

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const handleReload = () => {
    localStorage.removeItem(CRASH_STORAGE_KEY);
    window.location.reload();
  };

  const handleClearAndReload = () => {
    // Limpar caches locais relacionados à automação
    localStorage.removeItem(CRASH_STORAGE_KEY);
    sessionStorage.removeItem('currentProductId');
    sessionStorage.removeItem(CHECKPOINT_KEY);
    
    // Limpar outros caches que podem estar corrompidos
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('automation') || key.includes('showcase') || key.includes('gemini'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
    } catch (e) {
      // ignore
    }

    window.location.reload();
  };

  const handleDismiss = () => {
    localStorage.removeItem(CRASH_STORAGE_KEY);
    setCrashInfo(null);
  };

  const handleCopyDetails = async () => {
    if (!crashInfo) return;

    const details = `
🔴 ERRO DETECTADO
==================
Mensagem: ${crashInfo.message}
Rota: ${crashInfo.route}
Product ID: ${crashInfo.productId || 'N/A'}
Timestamp: ${crashInfo.timestamp}
${(crashInfo as any).checkpoint ? `\nCheckpoint: ${JSON.stringify((crashInfo as any).checkpoint, null, 2)}` : ''}

Stack Trace:
${crashInfo.stack || 'N/A'}

Últimos Eventos IA:
${crashInfo.aiEvents?.map(e => `- ${e.type}: ${e.source}`).join('\n') || 'N/A'}
    `.trim();

    try {
      await navigator.clipboard.writeText(details);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Erro ao copiar:', e);
    }
  };

  if (!crashInfo) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-destructive/50 bg-background shadow-2xl">
        <CardHeader className="border-b border-destructive/20">
          <CardTitle className="flex items-center gap-3 text-destructive">
            <AlertTriangle className="h-6 w-6" />
            Erro Detectado na Aplicação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Mensagem principal */}
          <div className="rounded-lg bg-destructive/10 p-4">
            <p className="font-medium text-foreground">{crashInfo.message}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Rota: {crashInfo.route} | {new Date(crashInfo.timestamp).toLocaleTimeString('pt-BR')}
            </p>
            {crashInfo.productId && (
              <p className="text-sm text-muted-foreground">
                Product ID: {crashInfo.productId}
              </p>
            )}
            {(crashInfo as any).checkpoint && (
              <p className="text-sm text-amber-600 mt-1">
                Último checkpoint: {(crashInfo as any).checkpoint.step}
              </p>
            )}
          </div>

          {/* Stack trace */}
          {crashInfo.stack && (
            <div className="rounded-lg bg-muted p-3 max-h-48 overflow-auto">
              <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-words">
                {crashInfo.stack}
              </pre>
            </div>
          )}

          {/* Eventos IA */}
          {crashInfo.aiEvents && crashInfo.aiEvents.length > 0 && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm font-medium mb-2">Últimos Eventos IA:</p>
              <div className="space-y-1">
                {crashInfo.aiEvents.map((event, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    • {event.type}: {event.source}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={handleReload} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Recarregar Página
            </Button>
            
            <Button onClick={handleClearAndReload} variant="secondary" className="flex-1">
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Cache e Recarregar
            </Button>
            
            <Button onClick={handleCopyDetails} variant="outline" size="icon">
              {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
            
            <Button onClick={handleDismiss} variant="ghost" size="sm">
              Ignorar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GlobalCrashOverlay;
