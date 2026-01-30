import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[cleanup-reservations] Iniciando limpeza de reservas expiradas...');

    // Executar função de cleanup
    const { data: cleanedCount, error } = await supabase.rpc('cleanup_expired_reservations');

    if (error) {
      console.error('[cleanup-reservations] Erro ao executar cleanup:', error);
      throw error;
    }

    console.log(`[cleanup-reservations] Reservas estornadas: ${cleanedCount || 0}`);

    // Log para auditoria se houve estornos
    if (cleanedCount && cleanedCount > 0) {
      await supabase.from('ai_usage_logs').insert({
        user_id: '00000000-0000-0000-0000-000000000000', // System user
        operation_type: 'cleanup_expired_reservations',
        success: true,
        tokens_used: cleanedCount,
        model_used: 'system_cron'
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        cleaned_count: cleanedCount || 0,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[cleanup-reservations] Erro:', errorMessage);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
