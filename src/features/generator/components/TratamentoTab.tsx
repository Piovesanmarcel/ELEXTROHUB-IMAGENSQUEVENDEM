import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, RefreshCw } from "lucide-react";
import type { ImageWebhookStatus } from "../types";
import { MAX_RETRY_ATTEMPTS } from "../constants";

interface TratamentoTabProps {
  tratamentoCombStatus: ImageWebhookStatus;
  canSendTratamento: boolean;
  onResend: () => void;
}

export function TratamentoTab({
  tratamentoCombStatus,
  canSendTratamento,
  onResend,
}: TratamentoTabProps) {
  return (
    <Card className={`border-2 ${
      tratamentoCombStatus.status === "success" ? "border-green-500 bg-green-50" :
      tratamentoCombStatus.status === "error" ? "border-red-500 bg-red-50" :
      ["sending", "retrying"].includes(tratamentoCombStatus.status) ? "border-blue-500 bg-blue-50" :
      "border-muted"
    }`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Send className="h-4 w-4 text-green-600" />
          Tratamento Combinado
          <Badge variant="outline" className="ml-auto">
            {tratamentoCombStatus.status === "idle" && "Aguardando"}
            {tratamentoCombStatus.status === "sending" && "Enviando..."}
            {tratamentoCombStatus.status === "retrying" && "Reenviando..."}
            {tratamentoCombStatus.status === "success" && "Sucesso"}
            {tratamentoCombStatus.status === "error" && "Erro"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Envia dados extraídos de ambas as etapas (Comando Unificado + Copywriting) em um único payload
        </p>

        {tratamentoCombStatus.currentAttempt > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Tentativa {tratamentoCombStatus.currentAttempt}/{tratamentoCombStatus.maxAttempts}
            </Badge>
            {tratamentoCombStatus.nextRetryAt && (
              <span className="text-xs text-muted-foreground">
                Próxima em {Math.max(0, Math.ceil((new Date(tratamentoCombStatus.nextRetryAt).getTime() - Date.now()) / 1000))}s
              </span>
            )}
          </div>
        )}

        {tratamentoCombStatus.errorMessage && (
          <p className="text-sm text-red-600 bg-red-100 p-2 rounded">{tratamentoCombStatus.errorMessage}</p>
        )}

        {tratamentoCombStatus.payload && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Payload Enviado:</p>
            <pre className="bg-white/50 p-2 rounded text-xs overflow-x-auto max-h-48">
              {JSON.stringify(tratamentoCombStatus.payload, null, 2)}
            </pre>
          </div>
        )}

        {(tratamentoCombStatus.status === "error" || tratamentoCombStatus.status === "success" || canSendTratamento) && (
          <Button
            size="sm"
            variant="outline"
            onClick={onResend}
            disabled={tratamentoCombStatus.status === "retrying" || tratamentoCombStatus.status === "sending"}
            className="gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            {tratamentoCombStatus.status === "idle" ? "Enviar Agora" : "Reenviar"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
