import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { secretName } = await req.json();
    
    console.log(`🔍 Verificando secret: ${secretName}`);
    
    const secretValue = Deno.env.get(secretName);
    const isConfigured = !!secretValue && secretValue.length > 0;
    
    console.log(`✅ Secret ${secretName}: ${isConfigured ? 'configurado' : 'não configurado'}`);
    
    return new Response(JSON.stringify({
      secretName,
      isConfigured,
      message: isConfigured 
        ? `Secret ${secretName} está configurado` 
        : `Secret ${secretName} não está configurado`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro ao verificar secret:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
