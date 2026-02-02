import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-callback-secret',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    const requestId = crypto.randomUUID().substring(0, 8);
    console.log(`[unified-callback][${requestId}] Recebendo callback de Comando Unificado do n8n`);

    try {
        // Validar segredo
        const callbackSecret = req.headers.get('x-callback-secret');
        const expectedSecret = Deno.env.get('N8N_CALLBACK_SECRET') || '116188'; // Fallback para o valor que vi no print

        if (callbackSecret !== expectedSecret) {
            console.error(`[unified-callback][${requestId}] Segredo invalido`);
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const payload = await req.json();
        console.log(`[unified-callback][${requestId}] Payload recebido:`, JSON.stringify(payload));

        const { jobId, userId, productId, results, success } = payload;

        // Validar dados obrigatórios
        if (!jobId || !userId) {
            console.error(`[unified-callback][${requestId}] Dados obrigatorios ausentes (jobId, userId)`);
            return new Response(
                JSON.stringify({ error: 'jobId e userId são obrigatórios' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Se productId não vier, usamos o jobId como fallback para manter a integridade do banco
        const effectiveProductId = productId || jobId;

        // Criar cliente Supabase com service role
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        // 1. Salvar ou atualizar em ai_unified_results
        if (success && results) {
            console.log(`[unified-callback][${requestId}] Salvando em ai_unified_results para produto: ${productId}`);

            const { error: aiError } = await supabase
                .from('ai_unified_results')
                .upsert({
                    product_id: effectiveProductId,
                    user_id: userId,
                    results: results,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'product_id,user_id' }); // Ajuste se a constraint for diferente

            if (aiError) {
                console.error(`[unified-callback][${requestId}] Erro ao salvar ai_unified_results:`, aiError);
                throw aiError;
            }
        }

        // 2. Atualizar status em authorized_jobs (para o front saber que terminou)
        console.log(`[unified-callback][${requestId}] Atualizando status do job: ${jobId}`);

        const { error: jobError } = await supabase
            .from('authorized_jobs')
            .update({
                status: success ? 'completed' : 'failed',
                metadata: results ? { last_result: 'unified_async' } : null
            })
            .eq('job_id', jobId);

        if (jobError) {
            console.error(`[unified-callback][${requestId}] Erro ao atualizar authorized_jobs:`, jobError);
            // Nao damos throw aqui para nao falhar o salvamento do resultado principal
        }

        return new Response(
            JSON.stringify({ success: true, jobId }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error(`[unified-callback][${requestId}] Erro fatal:`, error);
        return new Response(
            JSON.stringify({ error: errorMessage }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
