import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, keyId } = await req.json();
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Obter usuário do token JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[manage-gemini-keys] Ação: ${action} | User: ${user.id}`);

    switch (action) {
      case 'test': {
        if (!keyId) {
          return new Response(
            JSON.stringify({ success: false, error: 'keyId é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Buscar a key do usuário
        const { data: keyData, error: keyError } = await supabaseClient
          .from('user_api_keys')
          .select('api_key_encrypted')
          .eq('id', keyId)
          .eq('user_id', user.id)
          .eq('provider', 'gemini')
          .single();

        if (keyError || !keyData) {
          return new Response(
            JSON.stringify({ success: false, error: 'API Key não encontrada' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Descriptografar
        let decryptedKey: string;
        try {
          decryptedKey = atob(keyData.api_key_encrypted);
        } catch {
          return new Response(
            JSON.stringify({ success: false, error: 'Erro ao descriptografar API key' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Testar a key com uma chamada simples ao Gemini
        try {
          const testResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${decryptedKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: 'Say "OK" if you can read this.' }] }],
                generationConfig: { maxOutputTokens: 10 }
              })
            }
          );

          if (!testResponse.ok) {
            const errorData = await testResponse.json();
            console.error('[manage-gemini-keys] Teste falhou:', errorData);
            return new Response(
              JSON.stringify({ success: false, error: 'API Key inválida ou sem créditos' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Atualizar last_used_at
          await supabaseClient
            .from('user_api_keys')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', keyId);

          return new Response(
            JSON.stringify({ success: true, message: 'API Key válida!' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('[manage-gemini-keys] Erro ao testar:', error);
          return new Response(
            JSON.stringify({ success: false, error: 'Erro ao testar API Key' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'get-decrypted': {
        // Esta ação é usada internamente pela edge function de geração
        if (!keyId) {
          return new Response(
            JSON.stringify({ success: false, error: 'keyId é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: keyData, error: keyError } = await supabaseClient
          .from('user_api_keys')
          .select('api_key_encrypted, user_id')
          .eq('id', keyId)
          .eq('provider', 'gemini')
          .single();

        if (keyError || !keyData) {
          return new Response(
            JSON.stringify({ success: false, error: 'API Key não encontrada' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verificar se a key pertence ao usuário
        if (keyData.user_id !== user.id) {
          return new Response(
            JSON.stringify({ success: false, error: 'Acesso negado' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        try {
          const decryptedKey = atob(keyData.api_key_encrypted);
          
          // Atualizar last_used_at
          await supabaseClient
            .from('user_api_keys')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', keyId);

          return new Response(
            JSON.stringify({ success: true, apiKey: decryptedKey }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch {
          return new Response(
            JSON.stringify({ success: false, error: 'Erro ao descriptografar' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'mark-exhausted': {
        if (!keyId) {
          return new Response(
            JSON.stringify({ success: false, error: 'keyId é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabaseClient
          .from('user_api_keys')
          .update({ 
            is_exhausted: true, 
            exhausted_at: new Date().toISOString() 
          })
          .eq('id', keyId)
          .eq('user_id', user.id)
          .eq('provider', 'gemini');

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: 'Erro ao marcar key como exausta' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Ação não reconhecida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('[manage-gemini-keys] Erro:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
