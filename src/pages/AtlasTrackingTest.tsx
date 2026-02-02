import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { WorkflowProgressTracker } from '@/components/workflow/WorkflowProgressTracker';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Rocket, Sparkles, RefreshCw } from 'lucide-react';

export default function AtlasTrackingTest() {
  const { toast } = useToast();

  // Estado do formulario
  const [productName, setProductName] = useState('Produto Teste Atlas');
  const [shortDescription, setShortDescription] = useState('Descricao curta do produto para teste');
  const [webhookUrl, setWebhookUrl] = useState('');

  // Estado de execucao
  const [isRunning, setIsRunning] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Buscar webhook salvo
  React.useEffect(() => {
    const loadWebhook = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_webhooks')
          .select('webhook_comando_unificado')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data?.webhook_comando_unificado) {
          setWebhookUrl(data.webhook_comando_unificado);
        }
      }
    };
    loadWebhook();
  }, []);

  // Executar ATLAS
  const handleExecuteAtlas = async () => {
    if (!webhookUrl) {
      toast({
        title: "Erro",
        description: "Configure a URL do webhook primeiro",
        variant: "destructive"
      });
      return;
    }

    if (!productName) {
      toast({
        title: "Erro",
        description: "Digite o nome do produto",
        variant: "destructive"
      });
      return;
    }

    // Gerar tracking ID
    const trackingId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    setCurrentJobId(trackingId);
    setIsRunning(true);
    setResult(null);
    setError(null);

    console.log('[AtlasTest] Iniciando com trackingId:', trackingId);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const payload = {
        product_name: productName,
        short_description: shortDescription,
        long_description: shortDescription,
        original_text: shortDescription,
        request_id: `atlas_test_${Date.now()}`,
        user_id: user?.id || 'test-user',
        tracking_id: trackingId,
        trackingId: trackingId,
        seo: {
          especificacoes: shortDescription,
          descricao: shortDescription
        },
        marketing: {
          texto_marketing: shortDescription
        }
      };

      console.log('[AtlasTest] Payload:', payload);

      const { data: proxyResponse, error: proxyError } = await supabase.functions.invoke('n8n-proxy', {
        body: {
          webhookUrl: webhookUrl,
          payload: payload
        }
      });

      if (proxyError) {
        throw new Error(proxyError.message || 'Erro ao chamar proxy');
      }

      console.log('[AtlasTest] Resposta:', proxyResponse);
      setResult(proxyResponse);

      toast({
        title: "Sucesso!",
        description: "ATLAS executado com sucesso"
      });

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('[AtlasTest] Erro:', errorMsg);
      setError(errorMsg);

      toast({
        title: "Erro",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Reset
  const handleReset = () => {
    setCurrentJobId(null);
    setResult(null);
    setError(null);
    setIsRunning(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">ATLAS</h1>
            <p className="text-muted-foreground">O Estrategista - Teste de Tracking</p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm">
          Comando Unificado n8n
        </Badge>
      </div>

      {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle>Configuracao do Teste</CardTitle>
          <CardDescription>
            Preencha os dados para testar o ATLAS com rastreamento em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook">URL do Webhook (Comando Unificado)</Label>
            <Input
              id="webhook"
              placeholder="https://n8n.exemplo.com/webhook/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="productName">Nome do Produto</Label>
            <Input
              id="productName"
              placeholder="Ex: Camiseta Premium..."
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descricao Curta</Label>
            <Textarea
              id="description"
              placeholder="Descricao do produto..."
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleExecuteAtlas}
              disabled={isRunning || !webhookUrl || !productName}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executando ATLAS...
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-4 w-4" />
                  Executar ATLAS
                </>
              )}
            </Button>

            {(currentJobId || result || error) && (
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tracking ID */}
      {currentJobId && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Tracking ID:</p>
                <code className="text-xs bg-blue-100 px-2 py-1 rounded">{currentJobId}</code>
              </div>
              <Badge variant="secondary">Ativo</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Tracker */}
      {currentJobId && (
        <WorkflowProgressTracker
          sessionId={currentJobId}
          title="Status do ATLAS"
          timeoutMs={300000}
          onTimeout={() => {
            toast({
              title: "Timeout",
              description: "Servidor sobrecarregado. Tente novamente.",
              variant: "destructive"
            });
            setIsRunning(false);
          }}
        />
      )}

      {/* Resultado */}
      {result && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Resultado do ATLAS</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-white p-4 rounded border overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Erro */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
