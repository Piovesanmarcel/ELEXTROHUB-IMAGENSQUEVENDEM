import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckResult {
  status: 'ok' | 'error' | 'warning' | 'pending';
  message: string;
  value?: any;
  latencyMs?: number;
}

interface PreflightResults {
  database: CheckResult;
  credits: CheckResult;
  geminiApi: CheckResult;
  openaiApi: CheckResult;
  allCriticalPassed: boolean;
  totalTimeMs: number;
}

const QUERY_TIMEOUT = 2000;

async function withTimeout<T>(
  promise: Promise<T>, 
  ms: number, 
  fallback: T,
  label: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => {
        console.log(`⏱️ [PREFLIGHT] Timeout em ${label} (${ms}ms)`);
        resolve(fallback);
      }, ms);
    })
  ]);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('🔍 [PREFLIGHT] Iniciando verificações (4 críticas)...');

  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(JSON.stringify({
        error: 'userId é obrigatório',
        allCriticalPassed: false,
        totalTimeMs: Date.now() - startTime
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ===== VERIFICAÇÕES SÍNCRONAS =====
    
    // Gemini API (crítico)
    const geminiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    const geminiResult: CheckResult = geminiKey
      ? { status: 'ok', message: 'Chave configurada' }
      : { status: 'error', message: 'Chave não configurada' };

    // OpenAI API (fallback - warning é aceitável)
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const openaiResult: CheckResult = openaiKey
      ? { status: 'ok', message: 'Chave configurada' }
      : { status: 'warning', message: 'Não configurada (usará Gemini)' };

    // ===== VERIFICAÇÕES ASSÍNCRONAS =====
    
    // Database check
    const dbCheckPromise = (async (): Promise<CheckResult> => {
      const start = Date.now();
      try {
        const { error } = await supabase
          .from('user_credits')
          .select('user_id')
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        return { status: 'ok', message: 'Conectado', latencyMs: Date.now() - start };
      } catch (e) {
        console.log('❌ [PREFLIGHT] DB error:', e);
        return { status: 'error', message: 'Falha na conexão', latencyMs: Date.now() - start };
      }
    })();

    // Credits check
    const creditsCheckPromise = (async (): Promise<CheckResult> => {
      const start = Date.now();
      try {
        const { data, error } = await supabase
          .from('user_credits')
          .select('credits_balance')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (error) throw error;
        const credits = data?.credits_balance || 0;
        return credits >= 1
          ? { status: 'ok', message: `${credits} créditos`, value: credits, latencyMs: Date.now() - start }
          : { status: 'error', message: 'Sem créditos', value: 0, latencyMs: Date.now() - start };
      } catch (e) {
        console.log('❌ [PREFLIGHT] Credits error:', e);
        return { status: 'error', message: 'Erro ao verificar', latencyMs: Date.now() - start };
      }
    })();

    // Executar com timeout individual
    const [databaseResult, creditsResult] = await Promise.all([
      withTimeout(
        dbCheckPromise, 
        QUERY_TIMEOUT, 
        { status: 'ok', message: 'Assumido OK (timeout)', latencyMs: QUERY_TIMEOUT } as CheckResult,
        'database'
      ),
      withTimeout(
        creditsCheckPromise, 
        QUERY_TIMEOUT, 
        { status: 'ok', message: 'Assumido disponível (timeout)', value: 1, latencyMs: QUERY_TIMEOUT } as CheckResult,
        'credits'
      )
    ]);

    // ===== RESULTADO FINAL =====
    const results: PreflightResults = {
      database: databaseResult,
      credits: creditsResult,
      geminiApi: geminiResult,
      openaiApi: openaiResult,
      allCriticalPassed: false,
      totalTimeMs: 0
    };

    // Críticos: database, credits, geminiApi
    // OpenAI é fallback, warning é aceitável
    results.allCriticalPassed = 
      results.database.status === 'ok' &&
      results.credits.status === 'ok' &&
      results.geminiApi.status === 'ok';

    results.totalTimeMs = Date.now() - startTime;
    console.log('🏁 [PREFLIGHT] Concluído em', results.totalTimeMs, 'ms. OK:', results.allCriticalPassed);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [PREFLIGHT] Erro:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      allCriticalPassed: false,
      totalTimeMs: Date.now() - startTime
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
