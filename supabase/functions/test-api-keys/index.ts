import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  console.log('🔍 Test API Keys Function Called');
  console.log('📍 Method:', req.method);
  console.log('📍 URL:', req.url);
  
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    console.log('🔑 Checking API Keys...');
    console.log('🔑 Gemini Key exists:', !!geminiApiKey);
    console.log('🔑 OpenAI Key exists:', !!openaiApiKey);
    
    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      method: req.method,
      api_keys: {
        gemini: geminiApiKey ? 'CONFIGURED' : 'MISSING',
        openai: openaiApiKey ? 'CONFIGURED' : 'MISSING',
        gemini_length: geminiApiKey ? geminiApiKey.length : 0,
        openai_length: openaiApiKey ? openaiApiKey.length : 0
      }
    };
    
    console.log('✅ Returning result:', JSON.stringify(result, null, 2));
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('❌ Error in test function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});