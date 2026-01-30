
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
        {/* Botão Webhook Comando (era Gemini) */}
        {onExecuteWebhookComando && (
          <Button
            onClick={() => {
              console.log('📡 Clique no botão Comando (n8n) - shortDescription:', shortDescription);
              onExecuteWebhookComando();
            }}
            disabled={isLoadingComando || isDisabled || !webhookComandoConfigured}
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
            title={!webhookComandoConfigured ? "Configure o webhook na seção N8N" : ""}
          >
            {isLoadingComando ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Executando...
              </>
            ) : (
              <>
                📡 Comando (n8n)
              </>
            )}
          </Button>
        )}

        {/* Botão Webhook Copywriting (era OpenAI) */}
        {onExecuteWebhookCopywriting && (
          <Button
            onClick={() => {
              console.log('📝 Clique no botão Copywriting (n8n) - shortDescription:', shortDescription);
              onExecuteWebhookCopywriting();
            }}
            disabled={isLoadingCopywriting || isDisabled || !webhookCopywritingConfigured}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg"
            title={!webhookCopywritingConfigured ? "Configure o webhook na seção N8N" : ""}
          >
            {isLoadingCopywriting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Executando...
              </>
            ) : (
              <>
                📝 Copywriting (n8n)
              </>
            )}
          </Button>
        )}

        {/* Botão padrão (fallback) - quando nenhum webhook está configurado */}
        {!onExecuteWebhookComando && !onExecuteWebhookCopywriting && (
          <Button
            onClick={onGenerateUnifiedCommands}
            disabled={isLoading || isDisabled}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : hasPersistedResults ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Gerar Novamente
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Gerar Todos
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
