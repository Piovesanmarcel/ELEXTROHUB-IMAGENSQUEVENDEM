import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Wifi, WifiOff, ChevronDown, ChevronUp, Settings2, Check, ExternalLink } from 'lucide-react';

interface N8NWebhookConfigProps {
  webhookUrl: string;
  onWebhookUrlChange: (url: string) => void;
}

export function N8NWebhookConfig({ webhookUrl, onWebhookUrlChange }: N8NWebhookConfigProps) {
  const [isOpen, setIsOpen] = useState(!webhookUrl);
  const [tempUrl, setTempUrl] = useState(webhookUrl);

  // Sincronizar tempUrl quando webhookUrl mudar (ex: carregado do localStorage)
  useEffect(() => {
    if (webhookUrl && !tempUrl) {
      setTempUrl(webhookUrl);
    }
  }, [webhookUrl]);

  const handleSave = () => {
    onWebhookUrlChange(tempUrl);
    setIsOpen(false);
  };

  const isConfigured = !!webhookUrl;

  return (
    <Card className="border-dashed">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings2 className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Configuração n8n</CardTitle>
                {isConfigured ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <Wifi className="h-3 w-3 mr-1" />
                    Conectado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    <WifiOff className="h-3 w-3 mr-1" />
                    Não configurado
                  </Badge>
                )}
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">URL do Webhook n8n</Label>
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://seu-n8n.app.n8n.cloud/webhook/..."
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Cole a URL do webhook do seu workflow n8n. A URL será salva localmente.
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!tempUrl}>
                <Check className="h-4 w-4 mr-2" />
                Salvar Configuração
              </Button>
              <Button variant="outline" asChild>
                <a 
                  href="https://n8n.io" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Acessar n8n
                </a>
              </Button>
            </div>

            {isConfigured && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-1">Webhook atual:</p>
                <code className="text-xs break-all">{webhookUrl}</code>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
