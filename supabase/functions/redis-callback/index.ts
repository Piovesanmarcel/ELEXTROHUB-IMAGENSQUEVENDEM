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
  console.log(`[redis-callback][${requestId}] Recebendo callback do n8n`);

  try {
    // Validar segredo
    const callbackSecret = req.headers.get('x-callback-secret');
    const expectedSecret = Deno.env.get('N8N_CALLBACK_SECRET');
    
    if (!expectedSecret || callbackSecret !== expectedSecret) {
      console.error(`[redis-callback][${requestId}] Segredo invalido ou nao configurado`);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = await req.json();
    console.log(`[redis-callback][${requestId}] Payload recebido:`, JSON.stringify(payload));

    const { jobId, userId, productName, success, images, error } = payload;

    // Validar dados obrigatórios
    if (!jobId || !userId) {
      console.error(`[redis-callback][${requestId}] jobId ou userId ausente`);
      return new Response(
        JSON.stringify({ error: 'jobId e userId são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase com service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Preparar dados para upsert
    const batchData = {
      job_id: jobId,
      user_id: userId,
      product_name: productName || 'Produto',
      status: success ? 'completed' : 'failed',
      images: images || [],
      error_message: error || null,
      completed_at: new Date().toISOString(),
    };

    console.log(`[redis-callback][${requestId}] Salvando batch:`, JSON.stringify(batchData));

    // Atualizar ou inserir batch
    const { data, error: dbError } = await supabase
      .from('generated_images_batch')
      .upsert(batchData, { onConflict: 'job_id' })
      .select();

    if (dbError) {
      console.error(`[redis-callback][${requestId}] Erro ao salvar no DB:`, dbError);
      throw dbError;
    }

    console.log(`[redis-callback][${requestId}] Batch salvo com sucesso. JobId: ${jobId}, Data:`, data);

    return new Response(
      JSON.stringify({ success: true, jobId, saved: data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`[redis-callback][${requestId}] Erro:`, error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
