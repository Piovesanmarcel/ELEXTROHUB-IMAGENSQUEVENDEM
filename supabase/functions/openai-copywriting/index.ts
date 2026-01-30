import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`🚀 [OPENAI-COPYWRITING][${requestId}] Iniciando...`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Verificar chave interna do worker
    const internalKey = req.headers.get('x-internal-worker-key');
    const expectedKey = Deno.env.get('INTERNAL_WORKER_SECRET');
    const isInternalCall = internalKey === expectedKey;

    if (!isInternalCall) {
      console.log(`❌ [OPENAI-COPYWRITING][${requestId}] Acesso negado - apenas chamadas internas permitidas`);
      return new Response(JSON.stringify({ 
        error: 'Acesso negado - apenas chamadas internas via ai-chat-proxy' 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error(`❌ [OPENAI-COPYWRITING][${requestId}] OPENAI_API_KEY não configurada`);
      return new Response(JSON.stringify({ 
        error: 'OPENAI_API_KEY não configurada' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { prompt, imageData, _userId } = body;

    console.log(`📥 [OPENAI-COPYWRITING][${requestId}] User: ${_userId || 'interno'}, Prompt: ${prompt?.slice(0, 100)}...`);

    if (!prompt) {
      return new Response(JSON.stringify({ 
        error: 'Prompt é obrigatório' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // System prompt especializado para copywriting de e-commerce
    const systemPrompt = `Você é um especialista em copywriting para e-commerce com foco em conversão e vendas.

Sua especialidade é criar textos persuasivos que:
- Aumentam a taxa de conversão
- Destacam benefícios do produto
- Usam gatilhos mentais (urgência, escassez, prova social)
- São otimizados para SEO
- Funcionam em múltiplos canais (marketplace, redes sociais, anúncios pagos)

FORMATO OBRIGATÓRIO - Gere EXATAMENTE os 10 tópicos abaixo:

1. **COPY DE VENDAS** (3-5 linhas persuasivas para página de produto)
2. **DESCRIÇÃO OTIMIZADA SEO** (descrição completa otimizada para buscadores)
3. **PÚBLICO ALVO** (definição detalhada do público ideal)
4. **PERSONA IDEAL** (perfil fictício do cliente perfeito)
5. **COPY TRÁFEGO PAGO** (3 variações de anúncios para Meta/Google Ads)
6. **SCRIPT DE VENDAS** (roteiro para vídeo curto 30-60s)
7. **HASHTAGS** (20 hashtags relevantes separadas por espaço)
8. **PALAVRAS-CHAVE** (10-15 palavras-chave para SEO)
9. **NOMES CRIATIVOS** (5 sugestões de nomes alternativos para o produto)
10. **TÍTULOS DE CAUDA LONGA PARA ANÚNCIOS (Long Tail SEO)** (30 títulos)

REGRAS OBRIGATÓRIAS PARA SEÇÃO 10 - TÍTULOS DE CAUDA LONGA:

1. SEM REPETIÇÃO: Cada palavra-chave aparece APENAS 1 VEZ por título

2. USAR APENAS PALAVRAS DE PESQUISA DO PRODUTO:
   ✅ Nomes alternativos (amolador, afiador, apontador)
   ✅ Materiais (aço inox, cerâmica, tungstênio, plástico)
   ✅ Características técnicas (manual, elétrico, 3 estágios, ergonômico)
   ✅ Aplicações (cozinha, profissional, casa, restaurante, churrasco)
   ✅ Tipos específicos (faca chef, faca cerâmica, lâminas, tesoura)
   ✅ Funções (afiação, desbaste, polimento, amolar, afiar)

3. PROIBIDO PALAVRAS DE MARKETING:
   ❌ comprar, preço, barato, promoção, oferta, desconto
   ❌ frete grátis, entrega rápida, comprar online
   ❌ melhor, original, garantia, qualidade, premium
   ❌ exclusivo, perfeito, ideal, transforme, revolucione
   ❌ frases genéricas como "corte perfeito", "a revolução", "segredo dos chefs"

4. ESTRUTURA: [NOME PRODUTO] + [CARACTERÍSTICA] + [MATERIAL/TIPO] + [USO]

5. Use palavras-chave da seção 8 (PALAVRAS-CHAVE) nos títulos

6. Máximo 65 caracteres por título

EXEMPLOS CORRETOS DE TÍTULOS:
✅ "Amolador Facas Manual Aço Inox 3 Estágios Cozinha"
✅ "Afiador Profissional Cerâmica Tungstênio Desbaste"
✅ "Amolador Lâminas Faca Chef Polimento Afiação"

EXEMPLOS ERRADOS (PROIBIDO):
❌ "Amolador de Facas: A Revolução na Afiação"
❌ "Transforme suas Facas em Cortes Perfeitos"
❌ "O Melhor Amolador de Facas Comprar Online"

IMPORTANTE:
- Seja direto e persuasivo
- Use linguagem que vende
- Foque em benefícios, não apenas características
- Responda APENAS com o conteúdo solicitado, sem explicações adicionais`;

    console.log(`📡 [OPENAI-COPYWRITING][${requestId}] Chamando OpenAI gpt-4o-mini...`);

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.7
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error(`❌ [OPENAI-COPYWRITING][${requestId}] OpenAI erro ${openaiResponse.status}: ${errorText}`);
      return new Response(JSON.stringify({ 
        error: `OpenAI API error: ${openaiResponse.status}`,
        details: errorText.slice(0, 500)
      }), {
        status: openaiResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await openaiResponse.json();
    const generatedText = data.choices?.[0]?.message?.content || '';
    const usage = data.usage || {};

    const executionTime = Date.now() - startTime;
    
    console.log(`✅ [OPENAI-COPYWRITING][${requestId}] Concluído em ${executionTime}ms`);
    console.log(`📊 [OPENAI-COPYWRITING][${requestId}] Tokens: ${usage.total_tokens || 'N/A'} (prompt: ${usage.prompt_tokens}, completion: ${usage.completion_tokens})`);
    console.log(`📝 [OPENAI-COPYWRITING][${requestId}] Resposta: ${generatedText.slice(0, 200)}...`);

    // Calcular custo estimado (gpt-4o-mini: $0.15/1M input, $0.60/1M output)
    const inputCost = (usage.prompt_tokens || 0) * 0.00000015;
    const outputCost = (usage.completion_tokens || 0) * 0.0000006;
    const estimatedCostUsd = inputCost + outputCost;

    return new Response(JSON.stringify({ 
      generatedText,
      copywriting: generatedText,
      modelUsed: 'gpt-4o-mini',
      usage: {
        prompt_tokens: usage.prompt_tokens || 0,
        completion_tokens: usage.completion_tokens || 0,
        total_tokens: usage.total_tokens || 0,
        estimated_cost_usd: estimatedCostUsd
      },
      executionTimeMs: executionTime,
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`💥 [OPENAI-COPYWRITING][${requestId}] Erro:`, error);
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro interno',
      executionTimeMs: executionTime
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
