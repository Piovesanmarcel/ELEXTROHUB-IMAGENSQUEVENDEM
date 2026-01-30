import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  Database, 
  CreditCard, 
  Sparkles, 
  Bot,
  Rocket
} from 'lucide-react';
import { usePreflightCheck, CheckResult, PreflightResults } from '@/hooks/usePreflightCheck';
import { cn } from '@/lib/utils';

interface PreflightCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  productId: string;
  images: string[];
}

const checkConfig: Record<keyof Omit<PreflightResults, 'allCriticalPassed' | 'totalTimeMs'>, {
  label: string;
  icon: React.ElementType;
  critical: boolean;
}> = {
  database: { label: 'Conexão com banco de dados', icon: Database, critical: true },
  credits: { label: 'Créditos disponíveis', icon: CreditCard, critical: true },
  geminiApi: { label: 'Gemini API', icon: Sparkles, critical: true },
  openaiApi: { label: 'OpenAI API (fallback)', icon: Bot, critical: false }
};

function CheckItem({ 
  checkKey, 
  result 
}: { 
  checkKey: keyof typeof checkConfig;
  result: CheckResult;
}) {
  const config = checkConfig[checkKey];
  const Icon = config.icon;

  const statusIcon = {
    ok: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    pending: <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
  };

  const statusBg = {
    ok: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
    pending: 'bg-muted/50 border-muted'
  };

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg border transition-all duration-300',
      statusBg[result.status]
    )}>
      <div className="flex-shrink-0 p-1.5 rounded-md bg-background/80">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{config.label}</span>
          {config.critical && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              Crítico
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{result.message}</p>
      </div>
      
      <div className="flex-shrink-0 flex items-center gap-2">
        {result.latencyMs !== undefined && result.status === 'ok' && (
          <span className="text-xs text-muted-foreground">{result.latencyMs}ms</span>
        )}
        {result.value !== undefined && typeof result.value === 'number' && (
          <Badge variant="secondary" className="text-xs">
            {result.value}
          </Badge>
        )}
        {statusIcon[result.status]}
      </div>
    </div>
  );
}

export function PreflightCheckModal({
  isOpen,
  onClose,
  onProceed,
  productId,
  images
}: PreflightCheckModalProps) {
  const {
    runCheck,
    reset,
    isChecking,
    results,
    canProceed,
    completedChecks,
    totalChecks
  } = usePreflightCheck(productId, images);

  useEffect(() => {
    if (isOpen) {
      runCheck();
    } else {
      reset();
    }
  }, [isOpen, runCheck, reset]);

  const handleProceed = () => {
    onProceed();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Verificação Pré-Automação
          </DialogTitle>
          <DialogDescription>
            Verificando serviços críticos antes de iniciar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {results && (
            <>
              <CheckItem checkKey="database" result={results.database} />
              <CheckItem checkKey="credits" result={results.credits} />
              <CheckItem checkKey="geminiApi" result={results.geminiApi} />
              <CheckItem checkKey="openaiApi" result={results.openaiApi} />
            </>
          )}
        </div>

        {/* Barra de progresso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {isChecking ? 'Verificando...' : 'Verificação concluída'}
            </span>
            <span className="font-medium">
              {completedChecks}/{totalChecks}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-500",
                canProceed ? "bg-green-500" : isChecking ? "bg-purple-500" : "bg-red-500"
              )}
              style={{ width: `${(completedChecks / totalChecks) * 100}%` }}
            />
          </div>
          {results && !isChecking && (
            <p className="text-xs text-center text-muted-foreground">
              Tempo total: {results.totalTimeMs}ms
            </p>
          )}
        </div>

        {/* Resultado final */}
        {results && !isChecking && (
          <div className={cn(
            "text-center p-3 rounded-lg",
            canProceed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          )}>
            {canProceed ? (
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Pronto para iniciar!</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Corrija os erros antes de continuar.</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleProceed}
            disabled={isChecking || !canProceed}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isChecking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4 mr-2" />
                Iniciar Automação
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
