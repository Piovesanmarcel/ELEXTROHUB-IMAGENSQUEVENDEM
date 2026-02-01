
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, CheckCircle, Database } from "lucide-react";

interface AIEnhancerHeaderProps {
  isLoading: boolean;
  shortDescription: string;
  onGenerateUnifiedCommands: () => void;
  hasPersistedResults: boolean;
  // N8N Webhooks
  onExecuteWebhookComando?: () => void;
  onExecuteWebhookCopywriting?: () => void;
  isLoadingComando?: boolean;
  isLoadingCopywriting?: boolean;
  webhookComandoConfigured?: boolean;
  webhookCopywritingConfigured?: boolean;
}

export const AIEnhancerHeader = ({
  isLoading,
  shortDescription,
  onGenerateUnifiedCommands,
  hasPersistedResults,
  onExecuteWebhookComando,
  onExecuteWebhookCopywriting,
  isLoadingComando = false,
  isLoadingCopywriting = false,
  webhookComandoConfigured = false,
  webhookCopywritingConfigured = false
}: AIEnhancerHeaderProps) => {
  const isDisabled = !shortDescription.trim();

  return (
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white rounded-lg shadow-sm">
          <Sparkles className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">
            Comando Unificado (5 em 1)
          </h3>
          <p className="text-sm text-gray-600">
            Gera todos os comandos de uma só vez
          </p>
        </div>

        {/* Badge indicando status dos resultados */}
        {hasPersistedResults && (
          <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
            <Database className="h-3 w-3 mr-1" />
            Resultados Salvos
          </Badge>
        )}
      </div>

      <div className="flex gap-2">
        {/* Botões de disparo manual removidos por solicitação do usuário - disparo agora é 100% automático */}
      </div>

    </div>
  );
};
