import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ✅ HELPER: Retry com backoff para erros temporários de DB
async function queryWithRetry<T>(
  fn: () => Promise<{ data: T | null; error: any }>,
  maxRetries = 3
): Promise<{ data: T | null; error: any; isTemporary: boolean }> {
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const { data, error } = await fn();
    
    if (!error) {
      return { data, error: null, isTemporary: false };
    }
    
    lastError = error;
    
    // Verificar se é erro temporário (PGRST002, schema cache, connection)
    const isTemporary = 
      error.code === 'PGRST002' ||
      error.message?.includes('schema cache') ||
      error.message?.includes('connection') ||
      error.message?.includes('timeout') ||
      error.code === '57014'; // query_canceled
    
    if (!isTemporary) {
      // Erro permanente, não tentar novamente
      return { data: null, error, isTemporary: false };
    }
    
    console.log(`[CHECK-STATUS] ⚠️ Tentativa ${attempt}/${maxRetries} falhou (temporário): ${error.message}`);
    
    if (attempt < maxRetries) {
      // Backoff exponencial: 250ms, 500ms, 1000ms
      await new Promise(r => setTimeout(r, 250 * Math.pow(2, attempt - 1)));
    }
  }
  
  return { data: null, error: lastError, isTemporary: true };
}

serve(async (req) => {
  // 🔍 Instrumentação padronizada
  console.log({
    fn: 'check-queue-status',
    method: req.method,
    contentType: req.headers.get('content-type'),
    hasAuth: !!req.headers.get('authorization'),
  });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 🔓 PÚBLICO: Não exige JWT - permite polling mesmo com sessão expirada
    // Segurança: jobId é UUID gerado pelo sistema, impossível adivinhar
    // Dados expostos: apenas status/result (não sensíveis)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1️⃣ jobId por query string
    const url = new URL(req.url);
    let jobId = url.searchParams.get('jobId');

    // 2️⃣ jobId por body (invoke usa POST + JSON)
    if (!jobId && req.headers.get('content-type')?.includes('application/json')) {
      try {
        const body = await req.json();
        jobId = body?.jobId;
      } catch {
        // body inválido → ignora, valida depois
      }
    }

    // 3️⃣ validação semântica (400, não 500)
    if (!jobId) {
      console.log('[CHECK-STATUS] ❌ jobId ausente');
      return new Response(
        JSON.stringify({ success: false, code: 'INVALID_REQUEST', error: 'jobId obrigatório' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[CHECK-STATUS] 🔍 Consultando job: ${jobId}`);

    // 4️⃣ Buscar job COM RETRY para erros temporários
    const { data: jobData, error: jobError, isTemporary } = await queryWithRetry(async () => {
      return await supabase
        .from('image_generation_queue')
        .select('*')
        .eq('id', jobId)
        .single();
    });

    // Tipar o job para evitar erros TS
    const job = jobData as {
      id: string;
      status: string;
      generation_type: string;
      result: any;
      error_message: string | null;
      created_at: string;
      completed_at: string | null;
      priority: number;
    } | null;

    // ✅ ERRO TEMPORÁRIO: Retornar 200 com código estruturado
    if (isTemporary && jobError) {
      console.warn(`[CHECK-STATUS] ⚠️ Erro temporário após retries: ${jobError.message}`);
      return new Response(
        JSON.stringify({
          success: false, 
          code: 'BACKEND_TEMPORARY',
          error: 'Servidor temporariamente indisponível',
          retryAfterMs: 2000
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ JOB NÃO ENCONTRADO: Retornar 200 com código estruturado (não 404)
    if (jobError || !job) {
      console.warn(`[CHECK-STATUS] Job não encontrado: ${jobId}`, jobError?.message);
      return new Response(
        JSON.stringify({ 
          success: false, 
          code: 'JOB_NOT_FOUND',
          error: 'Job não encontrado',
          jobId
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5️⃣ Calcular posição na fila (se pending)
    let queuePosition = null;
    if (job.status === 'pending') {
      const { data: positionResult, error: posError, isTemporary: posIsTemp } = await queryWithRetry(async () => {
        return await supabase
          .from('image_generation_queue')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending')
          .or(`priority.gt.${job.priority},and(priority.eq.${job.priority},created_at.lt.${job.created_at})`);
      });
      
      if (!posIsTemp && !posError) {
        queuePosition = ((positionResult as any)?.count || 0) + 1;
      }
      console.log(`[CHECK-STATUS] ✅ Job ${jobId} na posição ${queuePosition || '?'}`);
    } else {
      console.log(`[CHECK-STATUS] ✅ Job ${jobId} status: ${job.status}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        code: 'OK',
        job: {
          id: job.id,
          status: job.status,
          generationType: job.generation_type,
          result: job.result,
          errorMessage: job.error_message,
          createdAt: job.created_at,
          completedAt: job.completed_at,
          queuePosition: queuePosition
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ [CHECK-STATUS] Erro:', error);
    
    // ✅ QUALQUER ERRO NÃO TRATADO: Retornar 200 com código estruturado
    return new Response(
      JSON.stringify({ 
        success: false, 
        code: 'BACKEND_ERROR',
        error: error.message || 'Erro interno',
        retryAfterMs: 3000
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
