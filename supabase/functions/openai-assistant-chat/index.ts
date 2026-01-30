import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const ASSISTANT_ID = Deno.env.get("OPENAI_ASSISTANT_ID") || "asst_4xlvTGZq7nTOlfDUh00aCqEL";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Rate limiting simples em memória (por IP/usuário, 20 req/min para assistants)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60000;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
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
  
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  // 🔐 AUTENTICAÇÃO: Aceitar worker key OU JWT válido
  const internalKey = req.headers.get('x-internal-worker-key');
  const expectedKey = Deno.env.get('INTERNAL_WORKER_SECRET');
  const authHeader = req.headers.get('authorization') || '';
  
  let userId = 'anonymous';
  let isAuthenticated = false;
  
  // Opção 1: Worker interno com chave secreta
  if (internalKey === expectedKey) {
    isAuthenticated = true;
    console.log(`✅ [${requestId}] Acesso autorizado via worker key`);
  }
  // Opção 2: JWT válido do usuário
  else if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.49.1");
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (!authError && user) {
      isAuthenticated = true;
      userId = user.id;
      console.log(`✅ [${requestId}] Acesso autorizado via JWT: ${userId}`);
    }
  }
  
  if (!isAuthenticated) {
    console.log(`❌ [${requestId}] Acesso negado - autenticação obrigatória`);
    return new Response(JSON.stringify({ 
      error: 'Autenticação obrigatória. Use o endpoint ai-chat-proxy para chamadas do frontend.',
      code: 'UNAUTHORIZED'
    }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Rate limiting por usuário
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
  const rateLimitKey = userId !== 'anonymous' ? `user:${userId}` : `ip:${clientIp}`;
  
  if (!checkRateLimit(rateLimitKey)) {
    console.warn(`🚫 Rate limit exceeded for: ${rateLimitKey}`);
    return new Response(JSON.stringify({ 
      error: 'Rate limit exceeded. Máximo de 20 requisições por minuto.',
      retry_after_seconds: 60
    }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY não definida");
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY não configurada" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { message, threadId } = await req.json();
    
    if (!message) {
      return new Response(JSON.stringify({ error: "Mensagem não fornecida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("📨 Processando mensagem:", message);

    // Usa thread existente ou cria novo
    let thread_id = threadId;
    if (!thread_id) {
      const threadRes = await fetch("https://api.openai.com/v1/threads", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!threadRes.ok) {
        throw new Error(`Erro criando thread: ${threadRes.statusText}`);
      }
      
      const thread = await threadRes.json();
      thread_id = thread.id;
      console.log("📌 Thread criada:", thread_id);
    }

    // Adiciona a mensagem do usuário
    const messageRes = await fetch(`https://api.openai.com/v1/threads/${thread_id}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: "user", content: message }),
    });

    if (!messageRes.ok) {
      throw new Error(`Erro adicionando mensagem: ${messageRes.statusText}`);
    }

    // Inicia a execução do assistente
    const runRes = await fetch(`https://api.openai.com/v1/threads/${thread_id}/runs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ assistant_id: ASSISTANT_ID }),
    });

    if (!runRes.ok) {
      throw new Error(`Erro iniciando run: ${runRes.statusText}`);
    }

    const run = await runRes.json();
    
    if (!run.id) {
      throw new Error("Run ID não retornado pela API");
    }

    console.log("🚀 Run iniciado:", run.id);

    // Aguarda resposta do assistente (timeout 90s)
    for (let i = 0; i < 90; i++) {
      const statusRes = await fetch(`https://api.openai.com/v1/threads/${thread_id}/runs/${run.id}`, {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      });

      if (!statusRes.ok) {
        console.error(`Erro verificando status: ${statusRes.statusText}`);
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      const status = await statusRes.json();
      console.log(`🔁 Status [${i + 1}/90]:`, status.status);
      
      if (status.status === "completed") {
        console.log("✅ Finalizado. Buscando resposta...");
        
        // Busca mensagens da thread
        const messagesRes = await fetch(`https://api.openai.com/v1/threads/${thread_id}/messages`, {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
        });
        
        if (!messagesRes.ok) {
          throw new Error(`Erro buscando mensagens: ${messagesRes.statusText}`);
        }
        
        const messages = await messagesRes.json();
        const response = messages.data.find((m: any) => m.role === "assistant");
        const reply = response?.content?.[0]?.text?.value || "[Sem resposta]";

        console.log("✅ Resposta obtida:", reply.substring(0, 100) + "...");

        return new Response(
          JSON.stringify({ response: reply, thread_id }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
      
      if (status.status === "failed" || status.status === "cancelled") {
        console.error("❌ Run falhou:", status);
        throw new Error(`Falha na execução: ${status.status} - ${status.last_error?.message || "Erro desconhecido"}`);
      }
      
      if (status.status === "requires_action") {
        console.warn("⚠️ Run requer ação:", status.required_action);
        throw new Error("Assistente requer uma ação. Desative tools/function calling no painel da OpenAI.");
      }
      
      await new Promise((r) => setTimeout(r, 1000));
    }

    throw new Error("⏰ Timeout esperando resposta (90s). Verifique se o assistente não tem ferramentas ativadas.");

  } catch (err) {
    console.error("❌ Erro geral:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMessage || "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});