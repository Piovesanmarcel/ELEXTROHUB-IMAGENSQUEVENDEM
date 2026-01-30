import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { StepStatus, ImageWebhookStatus } from "../types";
import { MAX_RETRY_ATTEMPTS } from "../constants";

interface ProgressTabProps {
  progress: number;
  step1: StepStatus;
  step2: StepStatus;
  tratamentoCombStatus: ImageWebhookStatus;
  webhookComandoUnificadoConfigured: boolean;
  webhookCopywritingConfigured: boolean;
  webhookTratamentoConfigured: boolean;
}

// Status icon helper
function StatusIcon({ status }: { status: StepStatus["status"] | ImageWebhookStatus["status"] }) {
  switch (status) {
    case "running":
    case "sending":
    case "retrying":
      return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
    case "success":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "error":
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    default:
      return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />;
  }
}

export function ProgressTab({
  progress,
  step1,
  step2,
  tratamentoCombStatus,
  webhookComandoUnificadoConfigured,
  webhookCopywritingConfigured,
  webhookTratamentoConfigured,
}: ProgressTabProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Progresso da Geração</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-center text-muted-foreground">{progress}% Completo</p>

        {/* Etapa 1: Comando Unificado */}
        <div className={`flex items-center gap-3 p-3 rounded-lg border ${
          step1.status === "success" ? "bg-green-50 border-green-200" :
          step1.status === "error" ? "bg-red-50 border-red-200" :
          step1.status === "running" ? "bg-blue-50 border-blue-200" : "bg-muted/50"
        }`}>
          <StatusIcon status={step1.status} />
          <div className="flex-1">
            <p className="font-medium text-sm">Etapa 1: Comando Unificado</p>
            <p className="text-xs text-muted-foreground">
              {step1.status === "idle" && "Aguardando"}
              {step1.status === "running" && "Processando 5 em 1..."}
              {step1.status === "success" && `Concluído em ${step1.responseTime}ms`}
              {step1.status === "error" && step1.error}
            </p>
          </div>
          {!webhookComandoUnificadoConfigured && (
            <Badge variant="outline" className="text-xs">Não configurado</Badge>
          )}
        </div>

        {/* Etapa 2: Copywriting */}
        <div className={`flex items-center gap-3 p-3 rounded-lg border ${
          step2.status === "success" ? "bg-green-50 border-green-200" :
          step2.status === "error" ? "bg-red-50 border-red-200" :
          step2.status === "running" ? "bg-blue-50 border-blue-200" : "bg-muted/50"
        }`}>
          <StatusIcon status={step2.status} />
          <div className="flex-1">
            <p className="font-medium text-sm">Etapa 2: Copywriting</p>
            <p className="text-xs text-muted-foreground">
              {step2.status === "idle" && "Aguardando"}
              {step2.status === "running" && "Gerando 10 tópicos..."}
              {step2.status === "success" && `Concluído em ${step2.responseTime}ms`}
              {step2.status === "error" && step2.error}
            </p>
          </div>
          {!webhookCopywritingConfigured && (
            <Badge variant="outline" className="text-xs">Não configurado</Badge>
          )}
        </div>

        {/* Etapa 3: Tratamento Combinado */}
        <div className={`flex items-center gap-3 p-3 rounded-lg border ${
          tratamentoCombStatus.status === "success" ? "bg-green-50 border-green-200" :
          tratamentoCombStatus.status === "error" ? "bg-red-50 border-red-200" :
          ["sending", "retrying"].includes(tratamentoCombStatus.status) ? "bg-blue-50 border-blue-200" : "bg-muted/50"
        }`}>
          <StatusIcon status={tratamentoCombStatus.status} />
          <div className="flex-1">
            <p className="font-medium text-sm">Etapa 3: Tratamento Combinado</p>
            <p className="text-xs text-muted-foreground">
              {tratamentoCombStatus.status === "idle" && "Aguardando"}
              {tratamentoCombStatus.status === "sending" && "Enviando dados combinados..."}
              {tratamentoCombStatus.status === "retrying" && `Reenviando (${tratamentoCombStatus.currentAttempt}/${MAX_RETRY_ATTEMPTS})...`}
              {tratamentoCombStatus.status === "success" && "Dados combinados enviados!"}
              {tratamentoCombStatus.status === "error" && tratamentoCombStatus.errorMessage?.slice(0, 50)}
            </p>
          </div>
          {!webhookTratamentoConfigured && (
            <Badge variant="outline" className="text-xs">Não configurado</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
