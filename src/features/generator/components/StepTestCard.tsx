import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Bot, Sparkles, FileText, Zap, Play, Loader2, 
  CheckCircle2, AlertCircle, Clock, Send, Shrink 
} from "lucide-react";
import type { StepStatus } from "../types";
import { getBase64SizeKB } from "@/lib/imageCompression";
import type { ProductImage } from "../types";

interface StepTestCardProps {
  // Step 1
  step1Status: StepStatus;
  onExecuteStep1: () => void;
  webhookComandoUnificadoConfigured: boolean;
  // Step 2
  step2Status: StepStatus;
  onExecuteStep2: () => void;
  webhookCopywritingConfigured: boolean;
  // Step 3 (Parallel)
  isTestingParallel: boolean;
  parallelTestProgress: { current: number; total: number; completed: number; failed: number };
  onTestParallel: () => void;
  webhookTratamentoConfigured: boolean;
  hasProductImages: boolean;
  hasProductName: boolean;
  // Job limits
  canStartNewJob: boolean;
  activeJobsCount: number;
  maxConcurrent: number;
  // Compression
  enableCompression: boolean;
  onEnableCompressionChange: (value: boolean) => void;
  productImages: ProductImage[];
  // Product validation
  productValid: boolean;
}

// Status icon helper
function StatusIcon({ status }: { status: StepStatus["status"] }) {
  switch (status) {
    case "running":
      return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
    case "success":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "error":
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    default:
      return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />;
  }
}

export function StepTestCard({
  step1Status,
  onExecuteStep1,
  webhookComandoUnificadoConfigured,
  step2Status,
  onExecuteStep2,
  webhookCopywritingConfigured,
  isTestingParallel,
  parallelTestProgress,
  onTestParallel,
  webhookTratamentoConfigured,
  hasProductImages,
  hasProductName,
  canStartNewJob,
  activeJobsCount,
  maxConcurrent,
  enableCompression,
  onEnableCompressionChange,
  productImages,
  productValid,
}: StepTestCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bot className="h-4 w-4" />
          Testar Etapas Individualmente
        </CardTitle>
        <CardDescription>
          Execute cada etapa separadamente para testar no n8n
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Grid 3 colunas para as 3 etapas */}
        <div className="grid grid-cols-3 gap-2">
          {/* Etapa 1: Comando Unificado */}
          <div className={`p-3 rounded-lg border-2 space-y-2 ${
            step1Status.status === 'success' ? 'border-green-500 bg-green-50' : 
            step1Status.status === 'error' ? 'border-red-500 bg-red-50' : 
            step1Status.status === 'running' ? 'border-blue-500 bg-blue-50' : 
            'border-muted'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                <span className="font-medium text-xs">1. Comando</span>
              </div>
              <StatusIcon status={step1Status.status} />
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full h-8 text-xs"
              onClick={onExecuteStep1}
              disabled={step1Status.status === "running" || !webhookComandoUnificadoConfigured || !productValid}
            >
              {step1Status.status === "running" ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Play className="h-3 w-3 mr-1" />
              )}
              Executar
            </Button>
            {step1Status.responseTime && (
              <p className="text-[10px] text-muted-foreground text-center">{(step1Status.responseTime / 1000).toFixed(1)}s</p>
            )}
          </div>

          {/* Etapa 2: Copywriting */}
          <div className={`p-3 rounded-lg border-2 space-y-2 ${
            step2Status.status === 'success' ? 'border-green-500 bg-green-50' : 
            step2Status.status === 'error' ? 'border-red-500 bg-red-50' : 
            step2Status.status === 'running' ? 'border-blue-500 bg-blue-50' : 
            'border-muted'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-blue-600" />
                <span className="font-medium text-xs">2. Copy</span>
              </div>
              <StatusIcon status={step2Status.status} />
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full h-8 text-xs"
              onClick={onExecuteStep2}
              disabled={step2Status.status === "running" || !webhookCopywritingConfigured || !productValid}
            >
              {step2Status.status === "running" ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Play className="h-3 w-3 mr-1" />
              )}
              Executar
            </Button>
            {step2Status.responseTime && (
              <p className="text-[10px] text-muted-foreground text-center">{(step2Status.responseTime / 1000).toFixed(1)}s</p>
            )}
          </div>

          {/* Etapa 3: Gerar 8 Cenas em Paralelo */}
          <div className={`p-3 rounded-lg border-2 space-y-2 ${
            isTestingParallel ? 'border-blue-500 bg-blue-50' :
            parallelTestProgress.completed === 8 ? 'border-green-500 bg-green-50' : 
            parallelTestProgress.failed > 0 && !isTestingParallel ? 'border-orange-500 bg-orange-50' : 
            'border-muted'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-green-600" />
                <span className="font-medium text-xs">3. Gerar 8 Cenas</span>
              </div>
              {isTestingParallel ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              ) : parallelTestProgress.completed === 8 ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : parallelTestProgress.failed > 0 ? (
                <AlertCircle className="h-4 w-4 text-orange-500" />
              ) : (
                <Clock className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={!canStartNewJob ? 'cursor-not-allowed w-full' : 'w-full'}>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full h-8 text-xs"
                    onClick={onTestParallel}
                    disabled={isTestingParallel || !webhookTratamentoConfigured || !hasProductImages || !hasProductName || !canStartNewJob}
                  >
                    {isTestingParallel ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : !canStartNewJob ? (
                      <>
                        <Clock className="h-3 w-3 mr-1" />
                        Aguarde ({activeJobsCount}/{maxConcurrent})
                      </>
                    ) : (
                      <Send className="h-3 w-3 mr-1" />
                    )}
                    {canStartNewJob && !isTestingParallel && "Enviar"}
                  </Button>
                </span>
              </TooltipTrigger>
              {!canStartNewJob && (
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm">Você tem {activeJobsCount} geração(ões) em andamento.</p>
                  <p className="text-sm text-muted-foreground">Aguarde terminar para iniciar outra.</p>
                </TooltipContent>
              )}
            </Tooltip>
            {isTestingParallel && (
              <p className="text-[10px] text-muted-foreground text-center">
                {parallelTestProgress.completed + parallelTestProgress.failed}/{parallelTestProgress.total}
              </p>
            )}
            {!isTestingParallel && parallelTestProgress.completed > 0 && (
              <p className="text-[10px] text-muted-foreground text-center">
                ✓ {parallelTestProgress.completed} | ✗ {parallelTestProgress.failed}
              </p>
            )}
          </div>
        </div>

        {/* Nota sobre geração paralela */}
        <p className="text-xs text-muted-foreground text-center">
          Gera 8 cenas em paralelo com retry automático (até 3 tentativas cada)
        </p>

        {/* Toggle de compressão */}
        <div className="pt-3 border-t space-y-3">
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Shrink className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Comprimir imagens</span>
            </div>
            <Switch
              checked={enableCompression}
              onCheckedChange={onEnableCompressionChange}
            />
          </div>
          {enableCompression && productImages.length > 0 && (
            <p className="text-xs text-muted-foreground px-2">
              Tamanho atual: {productImages.reduce((sum, img) => sum + getBase64SizeKB(img.base64), 0).toFixed(0)}KB
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
