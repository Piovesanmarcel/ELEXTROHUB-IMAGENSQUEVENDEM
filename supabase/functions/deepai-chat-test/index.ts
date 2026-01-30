import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log('🔥 DEEPAI-CHAT-TEST FUNCTION STARTED', new Date().toISOString());
  console.log('📍 Method:', req.method);
  console.log('📍 URL:', req.url);
  
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📥 Processando request...');
    
    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    console.log('🔑 API Keys Status:', {
      gemini: geminiApiKey ? 'CONFIGURED' : 'MISSING',
      openai: openaiApiKey ? 'CONFIGURED' : 'MISSING'
    });
    
    // Resposta simples de teste
    const testResponse = {
      success: true,
      message: 'Função deepai-chat-test funcionando!',
      api_keys: {
        gemini: geminiApiKey ? 'CONFIGURED' : 'MISSING',
        openai: openaiApiKey ? 'CONFIGURED' : 'MISSING'
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Retornando resposta de teste:', testResponse);
    
    return new Response(JSON.stringify(testResponse), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Erro na função de teste:', error);
    
    return new Response(JSON.stringify({ 
      error: `Erro na função de teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});