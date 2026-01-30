import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Rate limiting por usuário (20 req/min)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  entry.count++;
  return true;
}

serve(async (req) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`🔥 [AI-CHAT-PROXY][${requestId}] Iniciando...`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 🔐 AUTENTICAÇÃO: JWT ou chave interna do worker
    const internalKey = req.headers.get('x-internal-worker-key');
    const expectedKey = Deno.env.get('INTERNAL_WORKER_SECRET');
    const isInternalCall = internalKey === expectedKey;

    let userId: string;

    if (isInternalCall) {
      // ✅ Chamada interna do worker - não precisa JWT
      console.log(`✅ [AI-CHAT-PROXY][${requestId}] Acesso autorizado via worker interno`);
      // userId será passado no body como _userId
      const body = await req.clone().json();
      userId = body._userId || 'worker-internal';
    } else {
      // 🔐 Chamada externa - exige JWT
      const authHeader = req.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        console.log(`❌ [AI-CHAT-PROXY][${requestId}] Token JWT ausente`);
        return new Response(JSON.stringify({ 
          error: 'Autenticação obrigatória',
          code: 'UNAUTHORIZED'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const token = authHeader.replace('Bearer ', '');

      // Validar token JWT
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        console.log(`❌ [AI-CHAT-PROXY][${requestId}] Token inválido:`, authError?.message);
        return new Response(JSON.stringify({ 
          error: 'Token inválido ou expirado',
          code: 'INVALID_TOKEN'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      userId = user.id;
      console.log(`✅ [AI-CHAT-PROXY][${requestId}] Usuário autenticado: ${userId}`);
    }

    // 🚫 Rate limiting por usuário (skip para chamadas internas do worker)
    if (!isInternalCall && !checkRateLimit(userId)) {
      console.warn(`🚫 [AI-CHAT-PROXY][${requestId}] Rate limit excedido para: ${userId}`);
      
      // Log de rate limit
      await supabase.from('ai_usage_logs').insert({
        user_id: userId,
        function_name: 'ai-chat-proxy',
        api_provider: 'rate_limited',
        success: false,
        error_message: 'Rate limit exceeded'
      });

      return new Response(JSON.stringify({ 
        error: 'Rate limit excedido. Máximo de 20 requisições por minuto.',
        retry_after_seconds: 60
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' },
      });
    }

    // Parse body
    const body = await req.json();
    const { action, imageData, prompt, apiKeyId, dimensions, targetFunction } = body;

    console.log(`📥 [AI-CHAT-PROXY][${requestId}] Ação: ${action || targetFunction || 'generate_prompt'}`);

    // 🔑 Obter chave interna do worker
    const internalWorkerKey = Deno.env.get('INTERNAL_WORKER_SECRET');
    if (!internalWorkerKey) {
      console.error(`❌ [AI-CHAT-PROXY][${requestId}] INTERNAL_WORKER_SECRET não configurado`);
      return new Response(JSON.stringify({ 
        error: 'Configuração do servidor incompleta' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 🚀 Determinar função alvo
    let targetFunctionName = 'gemini-background-generator';
    if (targetFunction === 'deepai-chat') {
      targetFunctionName = 'deepai-chat';
    } else if (targetFunction === 'openai-normal-chat') {
      targetFunctionName = 'openai-normal-chat';
    } else if (targetFunction === 'openai-assistant-chat') {
      targetFunctionName = 'openai-assistant-chat';
    } else if (targetFunction === 'openai-copywriting') {
      targetFunctionName = 'openai-copywriting';
    }

    console.log(`🎯 [AI-CHAT-PROXY][${requestId}] Encaminhando para: ${targetFunctionName}`);

    // 📡 Chamar função alvo com chave interna
    const functionUrl = `${supabaseUrl}/functions/v1/${targetFunctionName}`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-worker-key': internalWorkerKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        ...body,
        _userId: userId // Passar user_id para logging interno
      })
    });

    const responseData = await response.json();
    const executionTime = Date.now() - startTime;

    // 📊 Logar uso com user_id - CÁLCULO LOCAL DE CUSTOS
    try {
      const promptTokens = responseData.usage?.prompt_tokens || 0;
      const completionTokens = responseData.usage?.completion_tokens || 0;
      const totalTokens = promptTokens + completionTokens;
      const modelUsed = responseData.modelUsed || (targetFunctionName.includes('openai') ? 'gpt-4o-mini' : 'gemini-2.5-flash');
      
      // Preços OFICIAIS por 1M tokens (Janeiro 2026)
      // GPT-4o Mini: Input $0.15/1M, Output $0.60/1M
      // GPT-4o: Input $2.50/1M, Output $10.00/1M
      // Gemini 2.5 Flash: Input $0.15/1M, Output $0.60/1M
      const USD_TO_BRL = 6.10;
      
      let PRICE_INPUT = 0.15;
      let PRICE_OUTPUT = 0.60;
      
      if (modelUsed.includes('gpt-4o-mini') || modelUsed.includes('gemini-2.5-flash')) {
        PRICE_INPUT = 0.15;
        PRICE_OUTPUT = 0.60;
      } else if (modelUsed.includes('gpt-4o') || modelUsed.includes('gemini-2.5-pro')) {
        PRICE_INPUT = 2.50;
        PRICE_OUTPUT = 10.00;
      }
      
      const inputCost = (promptTokens / 1_000_000) * PRICE_INPUT;
      const outputCost = (completionTokens / 1_000_000) * PRICE_OUTPUT;
      const costUSD = inputCost + outputCost;
      const costBRL = costUSD * USD_TO_BRL;
      
      await supabase.from('ai_usage_logs').insert({
        user_id: userId,
        function_name: 'ai-chat-proxy',
        api_provider: targetFunctionName.includes('openai') ? 'openai' : 'gemini',
        model_used: modelUsed,
        execution_time_ms: executionTime,
        success: response.ok,
        error_message: response.ok ? null : responseData.error,
        command: action || 'proxy_call',
        request_id: requestId,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
        estimated_cost_usd: costUSD,
        estimated_cost_brl: costBRL,
        usd_to_brl_rate: USD_TO_BRL
      });
      console.log(`📝 [AI-CHAT-PROXY][${requestId}] Log: ${promptTokens}+${completionTokens} tokens = $${costUSD.toFixed(6)} / R$${costBRL.toFixed(4)}`);
    } catch (logError) {
      console.warn(`⚠️ [AI-CHAT-PROXY][${requestId}] Erro ao salvar log:`, logError);
    }

    console.log(`✅ [AI-CHAT-PROXY][${requestId}] Concluído em ${executionTime}ms, status: ${response.status}`);

    return new Response(JSON.stringify(responseData), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`💥 [AI-CHAT-PROXY][${requestId}] Erro:`, error);
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro interno',
      debug_info: {
        execution_time_ms: executionTime,
        request_id: requestId
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
