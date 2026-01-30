import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tipos de geração suportados
const VALID_GENERATION_TYPES = ['carousel', 'marketing', 'background', 'stability', 'tongyi', 'unified_commands', 'ad_automation_full', 'copywriting_professional', 'ai_test_only'];

// Função para limpar dados base64 grandes do inputData antes de salvar
// Isso reduz drasticamente o tamanho da tabela (de 662MB para ~1MB)
// IMPORTANTE: Não remove URLs http(s) - apenas base64/blob
function sanitizeInputDataForQueue(inputData: any): any {
  if (!inputData || typeof inputData !== 'object') {
    return inputData;
  }

  // Limite maior para prompts (eles são importantes para a geração)
  const MAX_PROMPT_LENGTH = 10000;
  // Limite para strings genéricas
  const MAX_STRING_LENGTH = 2000;
  
  const sanitize = (value: any, depth = 0, key?: string): any => {
    // Evitar recursão muito profunda
    if (depth > 10) return '[truncated]';
    
    if (typeof value === 'string') {
      // CRÍTICO: NUNCA remover URLs http(s) - são necessárias para o worker
      if (value.startsWith('http://') || value.startsWith('https://')) {
        return value; // Manter URLs intactas
      }
      
      // Detectar e remover APENAS base64 (data:image) e blob: (não funciona no backend)
      if (value.startsWith('data:image') || value.startsWith('data:application')) {
        console.log(`[SANITIZE] Removendo base64 de campo "${key}" (${value.length} chars)`);
        return '[base64_removed_use_https_url]';
      }
      if (value.startsWith('blob:')) {
        console.log(`[SANITIZE] Removendo blob: de campo "${key}"`);
        return '[blob_removed_use_https_url]';
      }
      
      // Prompts podem ser longos - usar limite maior
      const isPromptField = key && ['prompt', 'description', 'text', 'content'].includes(key.toLowerCase());
      const maxLength = isPromptField ? MAX_PROMPT_LENGTH : MAX_STRING_LENGTH;
      
      if (value.length > maxLength) {
        return value.slice(0, maxLength) + '...[truncated]';
      }
      return value;
    }
    
    if (Array.isArray(value)) {
      // Limitar arrays grandes, mas NÃO adicionar marcador que quebra o worker
      const maxItems = 10;
      // Apenas fazer slice, sem adicionar "[+N more items]" que causa erros
      return value.slice(0, maxItems).map(item => sanitize(item, depth + 1, key));
    }
    
    if (typeof value === 'object' && value !== null) {
      const sanitized: Record<string, any> = {};
      for (const [objKey, val] of Object.entries(value)) {
        sanitized[objKey] = sanitize(val, depth + 1, objKey);
      }
      return sanitized;
    }
    
    return value;
  };
  
  return sanitize(inputData);
}

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  const startTime = Date.now();
  
  // 🔍 Instrumentação detalhada
  console.log(`[QUEUE-IMAGE][${requestId}] 📥 Request recebido`, {
    method: req.method,
    contentType: req.headers.get('content-type'),
    hasAuth: !!req.headers.get('authorization'),
    authPreview: req.headers.get('authorization')?.slice(0, 30) + '...',
  });

  if (req.method === 'OPTIONS') {
    console.log(`[QUEUE-IMAGE][${requestId}] ✅ CORS preflight`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parsing JSON-safe
    let payload: any = {};
    const contentType = req.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      try {
        const rawBody = await req.text();
        console.log(`[QUEUE-IMAGE][${requestId}] 📄 Body size: ${rawBody.length} bytes`);
        payload = JSON.parse(rawBody);
      } catch (parseErr) {
        console.error(`[QUEUE-IMAGE][${requestId}] ❌ JSON parse error:`, parseErr);
        return new Response(
          JSON.stringify({ success: false, error: 'JSON inválido no body' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.warn(`[QUEUE-IMAGE][${requestId}] ⚠️ Content-Type não é JSON:`, contentType);
    }

    const { generationType, inputData, priority: customPriority } = payload;
    
    console.log(`[QUEUE-IMAGE][${requestId}] 📋 Payload:`, {
      generationType,
      hasInputData: !!inputData,
      inputDataKeys: inputData ? Object.keys(inputData) : [],
      customPriority
    });
    
    // Validações
    if (!VALID_GENERATION_TYPES.includes(generationType)) {
      console.error(`[QUEUE-IMAGE][${requestId}] ❌ Tipo inválido: ${generationType}`);
      console.error(`[QUEUE-IMAGE][${requestId}] Tipos válidos:`, VALID_GENERATION_TYPES);
      throw new Error(`generationType inválido: "${generationType}". Use: ${VALID_GENERATION_TYPES.join(', ')}`);
    }
    
    if (!inputData) {
      console.error(`[QUEUE-IMAGE][${requestId}] ❌ inputData ausente`);
      throw new Error('inputData obrigatório');
    }
    
    console.log(`[QUEUE-IMAGE][${requestId}] ✅ Validações OK`);

    // Autenticar usuário
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error(`[QUEUE-IMAGE][${requestId}] ❌ Sem header Authorization`);
      return new Response(
        JSON.stringify({ success: false, error: 'Não autenticado - header ausente' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Extrair token do header (Bearer <token>)
    const token = authHeader.replace('Bearer ', '');
    console.log(`[QUEUE-IMAGE][${requestId}] 🔐 Auth header presente, token length: ${token.length}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    // Obter usuário passando o token explicitamente (obrigatório em server runtime)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError) {
      console.error(`[QUEUE-IMAGE][${requestId}] ❌ Erro ao validar usuário:`, userError.message);
      return new Response(
        JSON.stringify({ success: false, error: `Auth error: ${userError.message}` }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!user) {
      console.error(`[QUEUE-IMAGE][${requestId}] ❌ Usuário não encontrado`);
      return new Response(
        JSON.stringify({ success: false, error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[QUEUE-IMAGE][${requestId}] 👤 Usuário autenticado: ${user.id} (${user.email})`);

    // Usar service role para verificar limites
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verificar limites do usuário usando função RPC
    console.log(`[QUEUE-IMAGE][${requestId}] 🔍 Verificando limites para usuário ${user.id}...`);
    
    const { data: limits, error: limitsError } = await supabaseAdmin.rpc('check_user_queue_limits', {
      p_user_id: user.id
    });

    if (limitsError) {
      console.error(`[QUEUE-IMAGE][${requestId}] ❌ Erro ao verificar limites:`, limitsError);
      // Se a função não existir, permitir (modo legacy)
      if (!limitsError.message?.includes('does not exist')) {
        throw limitsError;
      }
      console.log(`[QUEUE-IMAGE][${requestId}] ⚠️ Função de limites não existe, usando modo legacy`);
    }

    // Se a função existe e retornou resultado
    if (limits && limits.length > 0) {
      const userLimits = limits[0];
      
      // Detectar tipo de erro (cooldown vs limite de jobs)
      const isCooldown = userLimits.cooldown_remaining_seconds > 0;
      
      console.log(`[QUEUE-IMAGE][${requestId}] 📊 Limites do usuário:`, {
        canEnqueue: userLimits.can_enqueue,
        pendingJobs: userLimits.pending_jobs,
        maxConcurrent: userLimits.max_concurrent,
        creditsRemaining: userLimits.credits_remaining,
        queuePriority: userLimits.queue_priority,
        cooldownRemaining: userLimits.cooldown_remaining_seconds,
        reason: userLimits.reason
      });
      
      if (!userLimits.can_enqueue) {
        const errorType = isCooldown ? 'cooldown' : 'concurrent_limit';
        console.warn(`[QUEUE-IMAGE][${requestId}] ⛔ BLOQUEADO (${errorType}): ${userLimits.reason}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: userLimits.reason,
            errorType: errorType,
            limits: {
              pendingJobs: userLimits.pending_jobs,
              maxConcurrent: userLimits.max_concurrent,
              creditsRemaining: userLimits.credits_remaining,
              cooldownRemaining: userLimits.cooldown_remaining_seconds
            }
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Usar prioridade do plano do usuário
      const priority = customPriority ?? userLimits.queue_priority;
      
      console.log(`[QUEUE-IMAGE][${requestId}] ✅ Limites OK, inserindo job com prioridade ${priority}...`);

      // Sanitizar inputData para remover base64 e dados grandes
      const sanitizedInputData = sanitizeInputDataForQueue(inputData);
      const originalSize = JSON.stringify(inputData).length;
      const sanitizedSize = JSON.stringify(sanitizedInputData).length;
      console.log(`[QUEUE-IMAGE][${requestId}] 📉 Input sanitizado: ${originalSize} -> ${sanitizedSize} bytes (${Math.round((1 - sanitizedSize/originalSize) * 100)}% redução)`);

      // Inserir job na fila
      const { data: job, error: insertError } = await supabaseAdmin
        .from('image_generation_queue')
        .insert({
          user_id: user.id,
          generation_type: generationType,
          input_data: sanitizedInputData,
          priority: priority,
          status: 'pending',
          retry_count: 0
        })
        .select()
        .single();

      if (insertError) {
        console.error(`[QUEUE-IMAGE][${requestId}] ❌ Erro ao inserir job:`, insertError);
        throw insertError;
      }

      // Calcular posição na fila
      const { count } = await supabaseAdmin
        .from('image_generation_queue')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
        .or(`priority.gt.${priority},and(priority.eq.${priority},created_at.lt.${job.created_at})`);

      const queuePosition = (count || 0) + 1;
      const elapsed = Date.now() - startTime;

      console.log(`[QUEUE-IMAGE][${requestId}] ✅ JOB CRIADO COM SUCESSO`, {
        jobId: job.id,
        generationType,
        queuePosition,
        priority,
        elapsedMs: elapsed
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          jobId: job.id,
          queuePosition,
          estimatedWaitMinutes: Math.ceil(queuePosition * 0.5), // Estimativa: 30s por job
          message: 'Geração adicionada à fila',
          limits: {
            pendingJobs: userLimits.pending_jobs + 1,
            maxConcurrent: userLimits.max_concurrent,
            creditsRemaining: userLimits.credits_remaining
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback: modo legacy sem verificação de limites
    console.log('[QUEUE-IMAGE] ⚠️ Modo legacy: sem verificação de limites');
    
    const priority = customPriority ?? 0;
    
    // Sanitizar inputData para remover base64 e dados grandes
    const sanitizedInputData = sanitizeInputDataForQueue(inputData);
    console.log(`[QUEUE-IMAGE] 📉 Input sanitizado para modo legacy`);
    
    const { data: job, error: insertError } = await supabaseAdmin
      .from('image_generation_queue')
      .insert({
        user_id: user.id,
        generation_type: generationType,
        input_data: sanitizedInputData,
        priority: priority,
        status: 'pending',
        retry_count: 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('[QUEUE-IMAGE] ❌ Erro ao inserir job:', insertError);
      throw insertError;
    }

    console.log(`[QUEUE-IMAGE] ✅ Job ${job.id} criado (modo legacy)`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        jobId: job.id,
        message: 'Geração adicionada à fila'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[QUEUE-IMAGE][${requestId}] ❌ ERRO FATAL`, {
      message: error.message,
      stack: error.stack?.slice(0, 200),
      elapsedMs: elapsed
    });
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
