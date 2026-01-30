import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Allowlist de domínios permitidos para o proxy (segurança)
// IMPORTANTE: Adicione TODOS os seus domínios n8n autorizados aqui
const ALLOWED_DOMAINS = [
  'n8n.cloud',
  '.n8n.cloud',
  'app.n8n.cloud',
  // Domínio customizado do projeto
  'nwh.visualvendas.cloud',
  '.visualvendas.cloud',
  // Adicione outros domínios n8n autorizados aqui
];

// Flag de ambiente para modo estrito
const IS_PRODUCTION = Deno.env.get('ENVIRONMENT') === 'production';

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Permite qualquer subdomínio de n8n.cloud
    if (hostname.endsWith('.n8n.cloud') || hostname === 'n8n.cloud') {
      return true;
    }

    // Permite domínios da whitelist
    const isInWhitelist = ALLOWED_DOMAINS.some(domain =>
      hostname === domain || hostname.endsWith(domain)
    );

    if (isInWhitelist) {
      return true;
    }

    // Permite webhooks do n8n em hosts com 'n8n' no nome
    if (hostname.includes('n8n') && (parsed.pathname.includes('/webhook') || parsed.pathname.includes('/webhook-test'))) {
      return true;
    }

    // 🔐 MODO DESENVOLVIMENTO: Permite URLs com /webhook (NÃO usar em produção!)
    if (!IS_PRODUCTION && parsed.pathname.includes('/webhook')) {
      console.warn(`⚠️ [n8n-proxy] MODO DEV: URL permitida por conter /webhook: ${hostname}`);
      console.warn(`⚠️ [n8n-proxy] ATENÇÃO: Este comportamento será BLOQUEADO em produção!`);
      return true;
    }

    // Em produção, bloquear URLs não autorizadas
    if (IS_PRODUCTION) {
      console.error(`🚨 [n8n-proxy] URL BLOQUEADA em produção: ${hostname}`);
    }

    return false;
  } catch {
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`🚀 [n8n-proxy][${requestId}] Requisição recebida`);

  try {
    const { webhookUrl, payload } = await req.json();

    // Validação básica
    if (!webhookUrl) {
      console.error(`❌ [n8n-proxy][${requestId}] webhookUrl não fornecida`);
      return new Response(
        JSON.stringify({ error: 'webhookUrl é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validação de segurança
    if (!isAllowedUrl(webhookUrl)) {
      console.error(`❌ [n8n-proxy][${requestId}] URL não permitida: ${webhookUrl}`);
      return new Response(
        JSON.stringify({ error: 'URL não permitida. Apenas webhooks n8n são aceitos.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📤 [n8n-proxy][${requestId}] Chamando n8n: ${webhookUrl}`);
    console.log(`📤 [n8n-proxy][${requestId}] Payload keys: ${payload ? Object.keys(payload).join(', ') : 'vazio'}`);

    // Chamada server-to-server para o n8n (sem CORS!)
    const startTime = Date.now();
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload || {}),
    });

    const duration = Date.now() - startTime;
    console.log(`📥 [n8n-proxy][${requestId}] Resposta n8n: status=${n8nResponse.status}, tempo=${duration}ms`);

    // Tentar ler a resposta
    let responseData: any;
    const contentType = n8nResponse.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      responseData = await n8nResponse.json();
      console.log(`📥 [n8n-proxy][${requestId}] Resposta JSON, campos: ${Object.keys(responseData).join(', ')}`);
    } else {
      const text = await n8nResponse.text();
      console.log(`📥 [n8n-proxy][${requestId}] Resposta não-JSON: ${text.substring(0, 200)}`);

      // Tentar parsear como JSON mesmo assim
      try {
        responseData = JSON.parse(text);
      } catch {
        responseData = { rawText: text };
      }
    }

    // Verificar se há erro do n8n
    if (!n8nResponse.ok) {
      console.error(`❌ [n8n-proxy][${requestId}] n8n retornou erro: ${n8nResponse.status}`);
      return new Response(
        JSON.stringify({
          error: `n8n retornou status ${n8nResponse.status}`,
          n8nStatus: n8nResponse.status,
          details: responseData
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Processar resposta para extrair imageUrl (normalização)
    let processedResponse = responseData;

    // Se for array, pegar primeiro item
    if (Array.isArray(responseData) && responseData.length > 0) {
      processedResponse = responseData[0];
      console.log(`📥 [n8n-proxy][${requestId}] Resposta era array, usando primeiro item`);
    }

    // Mapear imageBase64 para imageUrl (compatibilidade com frontend)
    if (processedResponse?.imageBase64 && !processedResponse?.imageUrl) {
      processedResponse.imageUrl = processedResponse.imageBase64;
      console.log(`📥 [n8n-proxy][${requestId}] Mapeado imageBase64 -> imageUrl`);
    }

    // ✅ Detectar imagem válida e adicionar success: true automaticamente
    const hasImageUrl = processedResponse?.imageUrl ||
      processedResponse?.imagem ||
      processedResponse?.result?.imageUrl ||
      processedResponse?.imageBase64;

    if (hasImageUrl && processedResponse?.success === undefined) {
      processedResponse.success = true;
      console.log(`📥 [n8n-proxy][${requestId}] Adicionado success: true (imagem encontrada)`);
    }

    console.log(`✅ [n8n-proxy][${requestId}] Retornando resposta. Tem imageUrl: ${!!hasImageUrl}, success: ${processedResponse?.success}`);

    return new Response(
      JSON.stringify(processedResponse),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error(`❌ [n8n-proxy][${requestId}] Erro:`, error);

    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('connect');

    return new Response(
      JSON.stringify({
        error: errorMessage,
        type: isNetworkError ? 'network_error' : 'internal_error',
        hint: isNetworkError
          ? 'Não foi possível conectar ao n8n. Verifique se a URL está correta e o workflow ativo.'
          : 'Erro interno no proxy.'
      }),
      {
        status: isNetworkError ? 502 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
