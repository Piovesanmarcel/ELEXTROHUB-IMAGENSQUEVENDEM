
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("🔄 INICIANDO SINCRONIZAÇÃO AUTOMÁTICA DE PRODUTOS");
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar todos os usuários com sincronização automática ativada
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('id, bling_access_token, bling_refresh_token, sync_automatica')
      .eq('sync_automatica', true)
      .not('bling_access_token', 'is', null);

    if (usuariosError) {
      console.error('❌ Erro ao buscar usuários:', usuariosError);
      throw usuariosError;
    }

    if (!usuarios || usuarios.length === 0) {
      console.log('ℹ️ Nenhum usuário com sincronização automática ativada');
      return new Response(JSON.stringify({
        success: true,
        message: 'Nenhum usuário com sincronização automática ativada',
        users_processed: 0
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`👥 Encontrados ${usuarios.length} usuários para sincronização automática`);

    let totalProcessed = 0;
    let totalErrors = 0;

    // Processar cada usuário
    for (const usuario of usuarios) {
      try {
        console.log(`🔄 Processando usuário: ${usuario.id}`);
        
        // Criar log de início
        const { data: logData } = await supabase
          .from('sync_schedule_logs')
          .insert({
            usuario_id: usuario.id,
            status: 'running',
            started_at: new Date().toISOString()
          })
          .select()
          .single();

        const logId = logData?.id;

        try {
          // Chamar a função de sincronização principal
          const { data: syncResult, error: syncError } = await supabase.functions.invoke(
            'sincronizar-produtos',
            {
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              }
            }
          );

          if (syncError) {
            console.error(`❌ Erro na sincronização do usuário ${usuario.id}:`, syncError);
            totalErrors++;
            
            // Atualizar log com erro
            if (logId) {
              await supabase
                .from('sync_schedule_logs')
                .update({
                  status: 'error',
                  completed_at: new Date().toISOString(),
                  error_message: syncError.message || 'Erro desconhecido'
                })
                .eq('id', logId);
            }
          } else {
            console.log(`✅ Sincronização concluída para usuário ${usuario.id}`);
            totalProcessed++;
            
            // Atualizar log com sucesso
            if (logId) {
              await supabase
                .from('sync_schedule_logs')
                .update({
                  status: 'completed',
                  completed_at: new Date().toISOString(),
                  products_synced: syncResult?.products_synced || 0
                })
                .eq('id', logId);
            }
          }
        } catch (userError) {
          console.error(`💥 Erro crítico para usuário ${usuario.id}:`, userError);
          totalErrors++;
          
          // Atualizar log com erro crítico
          if (logId) {
            await supabase
              .from('sync_schedule_logs')
              .update({
                status: 'error',
                completed_at: new Date().toISOString(),
                error_message: userError instanceof Error ? userError.message : 'Erro crítico'
              })
              .eq('id', logId);
          }
        }

        // Aguardar um pouco entre usuários para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`💥 Erro ao processar usuário ${usuario.id}:`, error);
        totalErrors++;
      }
    }

    const message = `Sincronização automática concluída: ${totalProcessed} usuários processados com sucesso, ${totalErrors} erros`;
    console.log(`📊 ${message}`);

    return new Response(JSON.stringify({
      success: true,
      message,
      users_processed: totalProcessed,
      errors: totalErrors,
      total_users: usuarios.length
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 ERRO CRÍTICO NA SINCRONIZAÇÃO AUTOMÁTICA:', error);
    
    return new Response(JSON.stringify({
      error: 'Erro interno na sincronização automática',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
