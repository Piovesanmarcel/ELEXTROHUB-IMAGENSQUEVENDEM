import { useSystemStatus, SystemState } from '@/hooks/useSystemStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  RefreshCw,
  Activity,
  Server,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Configuração visual por estado
const STATE_CONFIG: Record<SystemState, {
  label: string;
  description: string;
  bgClass: string;
  textClass: string;
  badgeClass: string;
  icon: typeof CheckCircle;
}> = {
  NORMAL: {
    label: 'NORMAL',
    description: 'Sistema Operacional',
    bgClass: 'bg-green-50 dark:bg-green-950/30',
    textClass: 'text-green-700 dark:text-green-400',
    badgeClass: 'bg-green-600 hover:bg-green-700',
    icon: CheckCircle,
  },
  WARNING: {
    label: 'ALERTA',
    description: 'Sistema em Alerta',
    bgClass: 'bg-yellow-50 dark:bg-yellow-950/30',
    textClass: 'text-yellow-700 dark:text-yellow-400',
    badgeClass: 'bg-yellow-600 hover:bg-yellow-700',
    icon: AlertTriangle,
  },
  CRITICAL: {
    label: 'CRÍTICO',
    description: 'Sistema Crítico',
    bgClass: 'bg-red-50 dark:bg-red-950/30',
    textClass: 'text-red-700 dark:text-red-400',
    badgeClass: 'bg-red-600 hover:bg-red-700',
    icon: AlertCircle,
  },
};

export default function SystemStatus() {
  const { 
    workerStatus, 
    queueSize, 
    checkedAt, 
    systemState, 
    isLoading, 
    error,
    refresh 
  } = useSystemStatus();

  const config = STATE_CONFIG[systemState];
  const StateIcon = config.icon;

  const formatDate = (date: Date | null) => {
    if (!date) return 'Aguardando...';
    return format(date, "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Status do Sistema
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitoramento em tempo real
            </p>
          </div>
          <Button 
            variant="outline" 
            size="icon"
            onClick={refresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Erro */}
        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span>Erro ao conectar: {error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Card Principal - Status Geral */}
        <Card className={`border-2 ${config.bgClass}`}>
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center text-center gap-4">
              <div className={`p-4 rounded-full ${config.bgClass}`}>
                <StateIcon className={`h-12 w-12 ${config.textClass}`} />
              </div>
              <Badge className={`text-lg px-4 py-1 ${config.badgeClass}`}>
                {config.label}
              </Badge>
              <h2 className={`text-2xl font-bold ${config.textClass}`}>
                {config.description}
              </h2>
            </div>
          </CardContent>
        </Card>

        {/* Cards Secundários */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Worker Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Server className="h-4 w-4" />
                Workers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {workerStatus === 'NORMAL' ? (
                  <>
                    <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xl font-bold text-green-700 dark:text-green-400">
                      NORMAL
                    </span>
                  </>
                ) : (
                  <>
                    <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xl font-bold text-red-700 dark:text-red-400">
                      OFFLINE
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Queue Size */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Activity className="h-4 w-4" />
                Fila de Processos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${
                  queueSize >= 10 
                    ? 'text-yellow-700 dark:text-yellow-400' 
                    : 'text-foreground'
                }`}>
                  {queueSize}
                </span>
                <span className="text-muted-foreground">jobs</span>
              </div>
            </CardContent>
          </Card>

          {/* Last Check */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="h-4 w-4" />
                Última Verificação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-sm font-medium">
                {isLoading ? 'Carregando...' : formatDate(checkedAt)}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          Atualização automática a cada 30 segundos
        </div>
      </div>
    </div>
  );
}
