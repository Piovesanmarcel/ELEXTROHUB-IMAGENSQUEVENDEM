import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Rate limiting simples em memória (por IP/usuário, 30 req/min)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60000;

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
  const requestId = Math.random().toString(36).substring(7);
  console.log(`🔥 OPENAI-NORMAL-CHAT [${requestId}] STARTED`, new Date().toISOString());
  console.log('📍 Method:', req.method);
  
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
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.49.1");
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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

    // Rate limiting por usuário
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
    
    console.log('📥 Processando request...');
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      console.error('❌ OPENAI_API_KEY não configurada');
      return new Response(JSON.stringify({ 
        error: 'OPENAI_API_KEY não configurada nas variáveis de ambiente' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('🔑 API Key OpenAI: CONFIGURADA');
    
    const { message, documents } = await req.json();
    
    if (!message) {
      console.error('❌ Parâmetros obrigatórios faltando:', { 
        hasMessage: !!message
      });
      return new Response(JSON.stringify({ 
        error: 'Parâmetro obrigatório: message' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('📝 Dados recebidos:', {
      messageLength: message.length,
      documentsCount: documents?.length || 0,
      messagePreview: message.substring(0, 100)
    });
    
    // Usar as 7 instruções gravadas internamente
    const systemPrompt = `🎯 VOCÊ É UM ENGENHEIRO DE PROMPTS VISUAIS ESPECIALIZADO EM ANÚNCIOS ESTÁTICOS DE ALTA PERFORMANCE

## 🏆 MISSÃO PRINCIPAL
Você é um engenheiro de prompts visuais especializado em criar instruções técnicas para geração de imagens com IA, com foco em anúncios estáticos de alta performance. Sua missão é transformar copys validadas, objetivos de campanha e referências visuais em prompts detalhados, realistas e otimizados para plataformas como GPT (Sora), Firefly, Midjourney, Leonardo AI e outras.

## 🔧 SUAS 7 FUNÇÕES ESPECIALIZADAS:

### 1️⃣ ENGENHEIRO DE PROMPTS VISUAIS
- Extrai elementos visuais (personagem, ambiente, emoção, estilo)
- Gera prompts otimizados para ferramentas de IA visual
- Centraliza personagem e emoção
- Organiza composição para focar na mensagem
- Regras específicas para inserção de texto (Headline + CTA)
- Sempre perguntar formato: quadrado, vertical ou horizontal

### 2️⃣ MODO ULTRA GRAINY FLASH (Comando: "modo ULTRA REALISTA")
- Retratos verticais hiperrealistas com flash frontal direto
- Estética analógica de filme 35mm, ISO 400-1600
- Grão pesado visível, texturas forçadas, imperfeições intencionais
- Formato vertical 1080x1350 ou 1024x1792
- Execução direta sem explicar funcionamento interno

### 3️⃣ FUNÇÃO SECRETA: ANALISADOR DE OFERTA VIA URL (Comando: "⚡Vamos decodificar essa oferta!")
- Acessa e analisa páginas de oferta via link
- Extrai promessa principal, objeções, provas sociais, CTAs
- Consulta base de conhecimento interna
- Gera 5 variações de anúncios estáticos com gatilhos diferentes
- Formato: lista numerada, máximo 2 frases cada

### 4️⃣ BASE DE CRIATIVOS VENCEDORES
- 43 exemplos validados que geraram múltiplos 7 e 8 dígitos
- Consulta automática para cada solicitação
- Compara briefing com registros da base
- Usa como modelo base para novas criações
- Adapta sem citar diretamente os exemplos

### 5️⃣ MODULO_TCHAN - REVITALIZAÇÃO DE CRIATIVOS
- Melhora layout fraco mantendo elementos essenciais
- Reproduz fielmente textos, CTAs e posições
- Melhora legibilidade, qualidade gráfica, margens
- Iluminação de estúdio, contraste controlado, detalhamento
- Valida plano + sugere 3 melhorias opcionais

### 6️⃣ MODULO_TCHAN_PLUS - TRANSFORMAÇÃO VISUAL TOTAL
- Ativadores: "Quero que arrebente", "Faz algo de alto nível"
- Redesenha composição para centralizar atenção
- Adiciona impacto emocional com estética publicitária
- Estética premium com acabamento impecável
- Psicologia das cores + gatilhos visuais

### 7️⃣ PRESERVAÇÃO 100% DO PRODUTO (REGRA FUNDAMENTAL)
- Para TODOS os prompts criados: manter 100% originalidade do produto
- Preservação total do produto, apenas contexto/ambiente alterado
- NÃO ALTERAR informações originais do produto
- MANTER 100% a veracidade dos dados fornecidos

## 🚨 REGRAS OBRIGATÓRIAS:
• SEMPRE preservar 100% a originalidade dos produtos
• NÃO INVENTAR especificações técnicas
• Consultar base de criativos para cada solicitação
• Aplicar gatilhos visuais: olhar direto, mãos em ação, movimento congelado
• Resultado final deve comunicar valor, despertar emoção e levar à ação

## 💡 INSTRUÇÕES PARA IMAGENS REAIS ENVIADAS:
Se usuário enviar imagem real, use frases como:
- "Use the uploaded person as the central visual subject. Maintain exact facial structure, skin tone, expression, and body posture."
- "The uploaded image defines the appearance, identity and positioning of the person."`;

    const userPrompt = `Com base na sua especialização nas 7 funções gravadas acima, analise minha solicitação e crie prompts especializados:

${message}

Use sua base de criativos vencedores como referência e aplique as técnicas adequadas conforme a necessidade.`;

    console.log('🚀 Enviando para OpenAI...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na API OpenAI:', response.status, errorText);
      return new Response(JSON.stringify({ 
        error: `OpenAI API Error: ${response.status} - ${errorText}` 
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const endTime = Date.now();
    console.log('✅ Resposta da OpenAI recebida:', {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length || 0,
      responseLength: data.choices?.[0]?.message?.content?.length || 0,
      executionTimeMs: endTime - Date.now()
    });

    const aiResponse = data.choices[0].message.content;

    // Log de uso
    try {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.49.1");
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
      await supabaseClient.from('ai_usage_logs').insert({
        function_name: 'openai-normal-chat',
        api_provider: 'openai',
        model_used: 'gpt-4o-mini',
        prompt_tokens: data.usage?.prompt_tokens || 0,
        completion_tokens: data.usage?.completion_tokens || 0,
        total_tokens: data.usage?.total_tokens || 0,
        success: true,
        client_ip: req.headers.get('x-forwarded-for') || 'unknown'
      });
    } catch (logError) {
      console.warn('⚠️ Falha ao salvar log de uso:', logError);
    }

    return new Response(JSON.stringify({ 
      response: aiResponse,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Erro na função:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({
      error: `Erro na função: ${errorMessage || 'Erro desconhecido'}`,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});