import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Componente para testar API Keys configuradas
 * Atualizado para usar check-queue-status ao invés de deepai-chat-test
 */
export const APIKeysTest = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testAPIKeys = async () => {
    setTesting(true);
    setResults(null);
    
    try {
      console.log('🔍 Testando configuração da fila...');
      
      // Testar check-queue-status que é a nova arquitetura
      const { data: statusData, error: statusError } = await supabase.functions.invoke('check-queue-status', {
        body: { test: true }
      });
      
      console.log('📥 Resposta check-queue-status:', { statusData, statusError });
      
      if (statusError) {
        setResults({ 
          error: `Erro: ${statusError.message}`, 
          timestamp: new Date().toISOString(),
          test_status: 'FAILED'
        });
        toast.error('❌ Teste falhou: ' + statusError.message);
        return;
      }
      
      // Buscar API keys do usuário para mostrar status
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setResults({ 
          error: 'Usuário não autenticado', 
          timestamp: new Date().toISOString(),
          test_status: 'FAILED'
        });
        toast.error('❌ Faça login para testar');
        return;
      }
      
      // Verificar API keys cadastradas
      const { data: apiKeys } = await supabase
        .from('user_api_keys')
        .select('provider, is_active, is_exhausted')
        .eq('usuario_id', session.user.id) as { data: any[] | null };
      
      const geminiKey = apiKeys?.find(k => k.provider === 'gemini' && k.is_active && !k.is_exhausted);
      const openaiKey = apiKeys?.find(k => k.provider === 'openai' && k.is_active && !k.is_exhausted);
      
      setResults({ 
        test_status: 'SUCCESS',
        api_keys: {
          gemini: geminiKey ? 'CONFIGURED' : 'NOT_CONFIGURED',
          openai: openaiKey ? 'CONFIGURED' : 'NOT_CONFIGURED'
        },
        queue_status: 'OPERATIONAL',
        message: 'Sistema de fila funcionando corretamente!',
        timestamp: new Date().toISOString()
      });
      toast.success('✅ Teste bem-sucedido!');
      
    } catch (error) {
      console.error('💥 Erro inesperado:', error);
      setResults({ error: (error as Error).message, timestamp: new Date().toISOString() });
      toast.error('Erro inesperado: ' + (error as Error).message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🔑 Teste de API Keys</CardTitle>
        <CardDescription>
          Verificar se as API keys e o sistema de fila estão configurados corretamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testAPIKeys} 
          disabled={testing}
          className="w-full"
        >
          {testing ? 'Testando...' : 'Testar Configuração'}
        </Button>
        
        {results && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Resultados:</h3>
            
            {results.error ? (
              <div className="p-4 border border-red-300 rounded-lg bg-red-50">
                <h4 className="font-medium text-red-800">Erro Detectado:</h4>
                <p className="text-red-700">{results.error}</p>
              </div>
            ) : results.test_status === 'SUCCESS' ? (
              <div className="p-4 border border-green-300 rounded-lg bg-green-50">
                <h4 className="font-medium text-green-800">✅ Teste Bem-sucedido:</h4>
                <div className="flex gap-2 mt-2">
                  <Badge variant="default">FILA OK</Badge>
                </div>
                <p className="text-sm text-green-600 mt-2">{results.message}</p>
                {results.api_keys && (
                  <div className="mt-3 space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span>Gemini:</span>
                      <Badge variant={results.api_keys.gemini === 'CONFIGURED' ? 'default' : 'secondary'}>
                        {results.api_keys.gemini === 'CONFIGURED' ? '✓ Configurada' : '○ Não configurada'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>OpenAI:</span>
                      <Badge variant={results.api_keys.openai === 'CONFIGURED' ? 'default' : 'secondary'}>
                        {results.api_keys.openai === 'CONFIGURED' ? '✓ Configurada' : '○ Não configurada'}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
            
            <div className="text-xs text-muted-foreground">
              Timestamp: {results.timestamp}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
