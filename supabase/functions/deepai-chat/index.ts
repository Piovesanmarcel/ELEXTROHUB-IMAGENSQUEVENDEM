import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { RequestBody, UnifiedAIResponse } from './types.ts';
import { createUnifiedSystemPrompt, createUnifiedUserPrompt, createIndividualSystemPrompt, createIndividualUserPrompt } from './prompts/index.ts';
import { callGeminiAPI, callOpenAIAPI } from './ai-providers.ts';
import { callGeminiText } from './gemini-text.ts';

const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Rate limiting simples em memória (por IP/usuário, 30 req/min)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minuto

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  entry.count++;
  return true;
}

serve(async (req) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  console.log('═══════════════════════════════════════════════════');
  console.log(`🔥 DEEPAI-CHAT [${requestId}] STARTED`, new Date().toISOString());
  console.log('📍 Method:', req.method);
  console.log('📍 URL:', req.url);
  
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 🔐 AUTENTICAÇÃO: Aceitar worker key OU JWT válido
    const internalKey = req.headers.get('x-internal-worker-key');
    const expectedKey = Deno.env.get('INTERNAL_WORKER_SECRET');
    const authHeader = req.headers.get('authorization') || '';
    
    let userId = 'anonymous';
    let isAuthenticated = false;
    
    // Opção 1: Worker interno com chave secreta
    if (internalKey === expectedKey) {
      isAuthenticated = true;
      console.log(`✅ [${requestId}] Acesso autorizado via worker key`);
    }
    // Opção 2: JWT válido do usuário
    else if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && user) {
        isAuthenticated = true;
        userId = user.id;
        console.log(`✅ [${requestId}] Acesso autorizado via JWT: ${userId}`);
      }
    }
    
    if (!isAuthenticated) {
      console.log(`❌ [${requestId}] Acesso negado - autenticação obrigatória`);
      return new Response(JSON.stringify({ 
        error: 'Autenticação obrigatória. Use o endpoint ai-chat-proxy para chamadas do frontend.',
        code: 'UNAUTHORIZED'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting - usar userId ou IP como identificador
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    const rateLimitKey = userId !== 'anonymous' ? `user:${userId}` : `ip:${clientIp}`;
    
    if (!checkRateLimit(rateLimitKey)) {
      console.warn(`🚫 Rate limit exceeded for: ${rateLimitKey}`);
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded. Máximo de 30 requisições por minuto.',
        retry_after_seconds: 60
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' },
      });
    }
    
    // Check if we have a body to parse
    const contentType = req.headers.get('content-type');
    console.log('📍 Content-Type:', contentType);
    
    const bodyText = await req.text();
    console.log('📍 Raw body length:', bodyText.length);
    console.log('📍 Raw body preview:', bodyText.substring(0, 200));
    
    if (!bodyText || bodyText.trim() === '') {
      console.error('❌ Empty request body');
      return new Response(JSON.stringify({ 
        error: 'Request body is empty' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse JSON safely
    let requestBody: RequestBody;
    try {
      requestBody = JSON.parse(bodyText);
      console.log('📥 Request body parsed successfully');
      console.log('📝 Command:', requestBody.command);
      console.log('📝 ForceAPI:', requestBody.forceAPI);
      console.log('📝 Product name length:', requestBody.productName?.length || 0);
      
      // Verificação crítica de API keys
      console.log('🔑 API Keys Status:', {
        gemini: geminiApiKey ? 'CONFIGURED' : 'MISSING',
        openai: openaiApiKey ? 'CONFIGURED' : 'MISSING'
      });
      
      if (!geminiApiKey && !openaiApiKey) {
        console.error('💀 ERRO CRÍTICO: Nenhuma API key configurada!');
        return new Response(JSON.stringify({ 
          error: 'Nenhuma API key está configurada. Configure GOOGLE_GEMINI_API_KEY ou OPENAI_API_KEY nos secrets do Supabase.',
          missingKeys: { gemini: !geminiApiKey, openai: !openaiApiKey }
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch (parseError) {
      console.error('❌ Error parsing JSON:', parseError);
      console.error('❌ Body text that failed to parse:', bodyText);
      const message = parseError instanceof Error ? parseError.message : String(parseError);
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body',
        details: message
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { 
      command, 
      originalText, 
      productName,
      shortDescription, 
      longDescription, 
      unifiedGeneration,
      forceAPI,
      systemPrompt: providedSystemPrompt,
      userPrompt: providedUserPrompt
    } = requestBody;
    
    console.log('⏱️ Tempo decorrido até validação:', Date.now() - startTime, 'ms');
    
    // Validação rigorosa dos dados de entrada
    if (!command || typeof command !== 'string') {
      console.error('❌ Missing or invalid command');
      return new Response(JSON.stringify({ 
        error: 'Command é obrigatório e deve ser uma string' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!productName || typeof productName !== 'string' || !productName.trim()) {
      console.error('❌ Missing or invalid product name');
      return new Response(JSON.stringify({ 
        error: 'Nome do produto é obrigatório e deve ser uma string válida' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!shortDescription || typeof shortDescription !== 'string' || !shortDescription.trim()) {
      console.error('❌ Missing or invalid short description');
      return new Response(JSON.stringify({ 
        error: 'Descrição curta é obrigatória e deve ser uma string válida' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!forceAPI || !['gemini', 'openai'].includes(forceAPI)) {
      console.error('❌ Invalid or missing forceAPI');
      return new Response(JSON.stringify({ 
        error: 'API deve ser especificada: gemini ou openai' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se a API solicitada está disponível
    if (forceAPI === 'gemini' && !geminiApiKey) {
      console.error('❌ Gemini API key not configured');
      return new Response(JSON.stringify({ 
        error: 'API Key do Google Gemini não configurada' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (forceAPI === 'openai' && !openaiApiKey) {
      console.error('❌ OpenAI API key not configured');
      return new Response(JSON.stringify({ 
        error: 'API Key do OpenAI não configurada' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Preparar dados limpos para processamento
    const cleanProductName = productName.trim();
    const cleanShortDescription = shortDescription.trim();
    const cleanLongDescription = (longDescription && typeof longDescription === 'string') 
      ? longDescription.trim() 
      : cleanShortDescription;
    const cleanOriginalText = (originalText && typeof originalText === 'string') 
      ? originalText.trim() 
      : cleanShortDescription;

    console.log('🧹 Clean data prepared');
    console.log('⏱️ Tempo decorrido até limpeza de dados:', Date.now() - startTime, 'ms');

    // Se for um comando de estrutura Runware (prompts de imagem), usar Gemini para texto puro
    const isRunwarePrompt = /^generate_prompt_structure_\d+$/.test(command);
    if (isRunwarePrompt && forceAPI === 'gemini') {
      console.log('🧩 Detected Runware structure command, delegating to Gemini (text mode)');
      const sys = (typeof providedSystemPrompt === 'string' && providedSystemPrompt.trim())
        ? providedSystemPrompt.trim()
        : 'Você é um especialista em geração de prompts para IA de imagens. Gere apenas o prompt final seguindo a estrutura fornecida.';
      const usr = (typeof providedUserPrompt === 'string' && providedUserPrompt.trim())
        ? providedUserPrompt.trim()
        : `Produto: ${cleanProductName}\nDescrição: ${cleanShortDescription}\n\nGere um prompt publicitário seguindo a estrutura fornecida.`;

      // Extrair imagem base64 se fornecida
      const imageBase64 = requestBody.imageBase64 || requestBody.image_base64;

      try {
        const promptText = await callGeminiText(sys, usr, geminiApiKey as string, imageBase64);
        const totalTime = Date.now() - startTime;
        return new Response(JSON.stringify({
          content: promptText,
          usedAPI: 'Gemini',
          command,
          debug_info: { execution_time_ms: totalTime, api_used: 'Gemini' }
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        const msg = (err as Error)?.message || '';
        console.error('❌ Gemini text generation error:', msg);
        // Parse status from error message e.g. "Gemini HTTP 400/429/503"
        let status = 500;
        if (msg.includes('Gemini HTTP 429')) status = 429;
        else if (msg.includes('Gemini HTTP 503') || msg.toLowerCase().includes('overloaded')) status = 503;
        else if (msg.includes('Gemini HTTP 400')) status = 400;
        return new Response(JSON.stringify({
          error: 'Falha ao gerar prompt (Gemini - texto)',
          details: msg,
          usedAPI: 'Gemini',
          command,
          debug_info: { execution_time_ms: Date.now() - startTime, api_used: 'Gemini', error_type: 'gemini_text_error' }
        }), {
          status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Criar prompts (fluxo antigo - JSON estruturado)
    let systemPrompt = '';
    let userPrompt = '';

    if (command === 'unified_commands' && unifiedGeneration) {
      console.log('🔄 Creating unified prompts...');
      systemPrompt = createUnifiedSystemPrompt();
      userPrompt = createUnifiedUserPrompt(
        cleanProductName, 
        cleanOriginalText, 
        cleanShortDescription, 
        cleanLongDescription
      );
    } else {
      console.log('🔄 Creating individual prompts...');
      systemPrompt = createIndividualSystemPrompt();
      userPrompt = createIndividualUserPrompt(
        cleanProductName, 
        cleanOriginalText, 
        cleanShortDescription, 
        cleanLongDescription
      );
    }

    console.log('📝 Prompts created successfully');
    console.log('⏱️ Tempo decorrido até criação de prompts:', Date.now() - startTime, 'ms');

    let result: UnifiedAIResponse | null = null;
    let usedAPI = '';

    // Executar com a API solicitada
    try {
      console.log(`🚀 Starting API call to ${forceAPI.toUpperCase()}...`);
      const apiStartTime = Date.now();
      
      if (forceAPI === 'openai') {
        console.log('🧠 Calling OpenAI API...');
        result = await callOpenAIAPI(systemPrompt, userPrompt, openaiApiKey as string, command);
        usedAPI = 'OpenAI';
        console.log(`✅ OpenAI responded successfully in ${Date.now() - apiStartTime}ms`);
      } else if (forceAPI === 'gemini') {
        console.log('🤖 Calling Gemini API...');
        result = await callGeminiAPI(systemPrompt, userPrompt, geminiApiKey as string, command);
        usedAPI = 'Gemini';
        console.log(`✅ Gemini responded successfully in ${Date.now() - apiStartTime}ms`);
      }
      
      console.log('📊 API call completed, processing response...');
      console.log('⏱️ Tempo total decorrido:', Date.now() - startTime, 'ms');
    } catch (apiError) {
      console.error(`❌ ${forceAPI.toUpperCase()} API Error:`, apiError);
      console.error('⏱️ Tempo até erro da API:', Date.now() - startTime, 'ms');
      
      let errorMessage = `Erro na API ${forceAPI.toUpperCase()}`;
      
      if (apiError instanceof Error && apiError.message) {
        if (apiError.message.includes('90 segundos') || apiError.message.includes('TIMEOUT')) {
          errorMessage = `API ${forceAPI.toUpperCase()} demorou mais de 90 segundos. Servidor pode estar sobrecarregado.`;
        } else if (apiError.message.includes('503') || apiError.message.includes('overloaded') || apiError.message.includes('sobrecarregado')) {
          errorMessage = `API ${forceAPI.toUpperCase()} está sobrecarregada. Tente novamente em alguns minutos.`;
        } else if (apiError.message.includes('429') || apiError.message.includes('rate limit')) {
          errorMessage = `Rate limit da API ${forceAPI.toUpperCase()} excedido. Aguarde alguns minutos.`;
        } else if (apiError.message.includes('401') || apiError.message.includes('403')) {
          errorMessage = `Chave da API ${forceAPI.toUpperCase()} inválida ou não autorizada.`;
        } else {
          errorMessage = `${forceAPI.toUpperCase()}: ${apiError.message}`;
        }
      }
      
      return new Response(JSON.stringify({ 
        error: errorMessage,
        debug_info: {
          execution_time_ms: Date.now() - startTime,
          api_used: forceAPI,
          error_type: (apiError instanceof Error && apiError.message?.includes('TIMEOUT')) ? 'timeout' : 'api_error'
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!result) {
      console.error('❌ No result from API');
      console.error('⏱️ Tempo até erro no resultado:', Date.now() - startTime, 'ms');
      return new Response(JSON.stringify({ 
        error: 'Não foi possível obter resposta da API',
        debug_info: {
          execution_time_ms: Date.now() - startTime,
          api_used: forceAPI
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Adicionar informações da API usada
    result.usedAPI = usedAPI;
    result.apiInfo = `Gerado com ${usedAPI}`;

    const totalTime = Date.now() - startTime;
    console.log(`✅ [${requestId}] Final response generated with ${usedAPI} in ${totalTime}ms`);
    console.log(`📊 [${requestId}] Response structure:`, {
      topicos_conversao: !!result.topicos_conversao,
      palavras_chave_seo: !!result.palavras_chave_seo,
      perguntas_respostas: !!result.perguntas_respostas,
      kits_criativos: !!result.kits_criativos,
      cauda_longa: !!result.cauda_longa
    });
    console.log(`═══════════════════════════════════════════════════`);

    // Log de uso para métricas
    try {
      const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
      await supabaseClient.from('ai_usage_logs').insert({
        function_name: 'deepai-chat',
        api_provider: usedAPI.toLowerCase(),
        model_used: usedAPI === 'Gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini',
        command: command,
        execution_time_ms: totalTime,
        success: true,
        request_id: requestId,
        client_ip: req.headers.get('x-forwarded-for') || 'unknown'
      });
    } catch (logError) {
      console.warn('⚠️ Falha ao salvar log de uso:', logError);
    }

    return new Response(JSON.stringify({
      ...result,
      debug_info: {
        execution_time_ms: totalTime,
        api_used: usedAPI,
        request_id: requestId
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('💥 Unexpected error in function:', error);
    console.error('⏱️ Tempo até erro inesperado:', totalTime, 'ms');
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ 
      error: `Erro interno do servidor: ${errorMessage || 'Erro desconhecido'}`,
      debug_info: {
        execution_time_ms: totalTime,
        error_type: 'unexpected_error'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
