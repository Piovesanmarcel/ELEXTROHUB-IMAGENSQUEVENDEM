import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Settings, ChevronDown, Sparkles, FileText, Send } from "lucide-react";

interface WebhookConfigCardProps {
  showConfig: boolean;
  onShowConfigChange: (show: boolean) => void;
  webhookComandoUnificado: string;
  onWebhookComandoUnificadoChange: (value: string) => void;
  webhookCopywriting: string;
  onWebhookCopywritingChange: (value: string) => void;
  webhookTratamentoCombinado: string;
  onWebhookTratamentoCombinadoChange: (value: string) => void;
}

export function WebhookConfigCard({
  showConfig,
  onShowConfigChange,
  webhookComandoUnificado,
  onWebhookComandoUnificadoChange,
  webhookCopywriting,
  onWebhookCopywritingChange,
  webhookTratamentoCombinado,
  onWebhookTratamentoCombinadoChange,
}: WebhookConfigCardProps) {
  return (
    <Collapsible open={showConfig} onOpenChange={onShowConfigChange}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuração de Webhooks
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showConfig ? 'rotate-180' : ''}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-purple-600" />
                Webhook Comando Unificado (5 em 1)
              </Label>
              <Input
                placeholder="https://seu-n8n.app/webhook/unified-commands"
                value={webhookComandoUnificado}
                onChange={(e) => onWebhookComandoUnificadoChange(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-3 w-3 text-blue-600" />
                Webhook Copywriting (10 Tópicos)
              </Label>
              <Input
                placeholder="https://seu-n8n.app/webhook/copywriting"
                value={webhookCopywriting}
                onChange={(e) => onWebhookCopywritingChange(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Send className="h-3 w-3 text-green-600" />
                Webhook Tratamento Combinado
              </Label>
              <Input
                placeholder="https://n8n.visualvendas.cloud/webhook-test/tratamento-combinado"
                value={webhookTratamentoCombinado}
                onChange={(e) => onWebhookTratamentoCombinadoChange(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Recebe dados combinados de ambas as etapas em um único envio
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
