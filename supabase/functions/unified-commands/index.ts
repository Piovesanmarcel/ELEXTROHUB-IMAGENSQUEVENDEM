import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-worker-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ==================== PROMPTS ====================
function createUnifiedSystemPrompt(): string {
  return `Você é um ESPECIALISTA EM COPYWRITING, SEO E MARKETING DIGITAL para E-COMMERCE. Sua expertise é criar conteúdo de alta conversão que vende produtos online. 

CRÍTICO: Você DEVE retornar apenas um objeto JSON válido. Não adicione texto explicativo antes ou depois. O JSON deve seguir exatamente a estrutura solicitada no prompt do usuário.`;
}

function createUnifiedUserPrompt(productName: string, originalText: string, shortDescription: string, longDescription: string): string {
  return `EXECUTE TODOS OS 5 COMANDOS ABAIXO COM MÁXIMA QUALIDADE E DETALHAMENTO PARA O PRODUTO:

INFORMAÇÕES DO PRODUTO:
Nome: ${productName}
Descrição Atual: ${originalText}
Descrição Curta: ${shortDescription || 'Não informada'}
Descrição Completa: ${longDescription || 'Não informada'}

**📸 INSTRUÇÕES COMPLEMENTARES GLOBAIS PARA TODOS OS COMANDOS - GERAÇÃO DE IMAGENS E AMBIENTES:**

ÂNGULOS E PERSPECTIVAS ESPECÍFICAS:
- Close-up de ângulo baixo para destacar imponência e presença
- Visão de cima para baixo (overhead flat lay) para contexto completo  
- Três-quartos elevado para máxima profundidade visual
- Perfil lateral com ênfase em dimensionalidade
- Composição diagonal dinâmica para impacto visual

VARIAÇÕES DE ILUMINAÇÃO AVANÇADAS:
- Luz suave e difusa com rim lighting sutil e highlights estratégicos
- Luz de fundo estratégica com separação clara do produto
- Iluminação profissional de estúdio (key light + fill light + background)
- Luz natural golden hour com sombras orgânicas e ambientais
- Iluminação cinematográfica com contrastes dramáticos controlados

EXECUTE OS 5 COMANDOS COM EXCELÊNCIA:

===== COMANDO 1 - TÓPICOS DE CONVERSÃO COMPLETOS =====
Crie uma descrição PROFISSIONAL E ESTRUTURADA seguindo EXATAMENTE este formato:

**🔍 DESCRIÇÃO SEO OTIMIZADA**
- APENAS 1 parágrafo CURTO e OBJETIVO (máximo 50-70 palavras)
- Texto direto, persuasivo e com palavras-chave principais

**📋 ESPECIFICAÇÕES TÉCNICAS**
- APENAS especificações que você tem informação REAL do produto
- NÃO incluir itens com "Não informado", "Não disponível" ou similares

**✨ PRINCIPAIS BENEFÍCIOS**
• [Benefício 1 - principal vantagem do produto]
• [Benefício 2 - segundo maior benefício]
• [Benefício 3 - terceiro benefício mais relevante]
*MÁXIMO 3 BENEFÍCIOS - os mais importantes e impactantes*

**🛒 GARANTA JÁ O SEU!**
✅ Entrega rápida e segura
✅ Garantia de qualidade
✅ Suporte especializado
✅ Melhor custo-benefício do mercado

**💡 IDEAL PARA:**
- [Público-alvo específico 1]
- [Público-alvo específico 2]
- [Situação de uso 1]
- [Situação de uso 2]

===== COMANDO 2 - PALAVRAS-CHAVE E SUGESTÕES DE NOMES SEO =====
Forneça análise COMPLETA de palavras-chave para SEO:

🔍 **PRINCIPAIS (Alto Volume)** - 10 palavras-chave de alto volume de busca
🎯 **Calda Longa (Alta Conversão)** - 10 palavras-chave long-tail específicas
⚙️ **TERMOS TÉCNICOS** - 8 termos técnicos do produto
🔄 **VARIAÇÕES E SINÔNIMOS** - 10 variações e sinônimos relevantes

===== COMANDO 3 - PERGUNTAS & RESPOSTAS ESTRATÉGICAS =====
Crie EXATAMENTE 4 perguntas e respostas completas:
1. **ESPECIFICAÇÃO TÉCNICA PRINCIPAL**
2. **USO E INSTALAÇÃO**
3. **GARANTIA E SUPORTE**
4. **BENEFÍCIO PRINCIPAL**

===== COMANDO 4 - KITS CRIATIVOS E ESTRATÉGIAS DE VENDA =====
🎁 **KITS TEMÁTICOS INTELIGENTES (Máximo 6 sugestões)**
🎄 **CAMPANHAS SAZONAIS ESTRATÉGICAS**
💰 **ESTRATÉGIAS DE QUANTIDADE INTELIGENTE**
🏆 **CROSS-SELL INTELIGENTE**
🎯 **ESTRATÉGIAS PSICOLÓGICAS DE CONVERSÃO**

===== COMANDO 5 - TÍTULOS DE CAUDA LONGA (LONG TAIL SEO) =====
Crie 10 títulos de cauda longa otimizados seguindo esta estrutura (TUDO EM UMA ÚNICA LINHA, SEM HÍFEN OU QUEBRA DE LINHA):
[PRODUTO] [ESPECIFICAÇÃO TÉCNICA] [COR/MODELO] para [PÚBLICO-ALVO] [BENEFÍCIO PRINCIPAL]
IMPORTANTE: Cada título deve ser uma ÚNICA LINHA contínua, sem bullets ou sub-linhas de benefícios separados.

RESPONDA APENAS COM O JSON ABAIXO (SEM TEXTO ANTES OU DEPOIS):
{
  "topicos_conversao": {
    "improvedText": "🔍 DESCRIÇÃO SEO OTIMIZADA\\n\\n[Texto persuasivo do produto aqui]\\n\\n📋 ESPECIFICAÇÕES TÉCNICAS\\n\\n- Tipo de Item: [valor]\\n- Material: [valor]\\n- Cores: [valor]\\n- Fonte de Alimentação: [valor]\\n- Tamanho: [valor]\\n- Peso: [valor]\\n\\n✨ PRINCIPAIS BENEFÍCIOS\\n\\n• Benefício 1\\n• Benefício 2\\n• Benefício 3\\n\\n🛒 GARANTA JÁ O SEU!\\n\\n✅ Entrega rápida e segura\\n✅ Garantia de qualidade\\n✅ Suporte especializado\\n✅ Melhor custo-benefício do mercado\\n\\n💡 IDEAL PARA:\\n\\n- Público-alvo 1\\n- Público-alvo 2\\n- Situação de uso 1\\n- Situação de uso 2",
    "keywords": ["palavra1", "palavra2", "palavra3", "palavra4", "palavra5"]
  },
  "palavras_chave_seo": {
    "improvedText": "🔍 **PRINCIPAIS (Alto Volume)**\\n- Palavra 1\\n- Palavra 2\\n- Palavra 3\\n- Palavra 4\\n- Palavra 5\\n- Palavra 6\\n- Palavra 7\\n- Palavra 8\\n- Palavra 9\\n- Palavra 10\\n\\n🎯 **Calda Longa (Alta Conversão)**\\n- Long tail 1\\n- Long tail 2\\n- Long tail 3\\n- Long tail 4\\n- Long tail 5\\n- Long tail 6\\n- Long tail 7\\n- Long tail 8\\n- Long tail 9\\n- Long tail 10\\n\\n⚙️ **TERMOS TÉCNICOS**\\n- Termo técnico 1\\n- Termo técnico 2\\n- Termo técnico 3\\n- Termo técnico 4\\n- Termo técnico 5\\n- Termo técnico 6\\n- Termo técnico 7\\n- Termo técnico 8\\n\\n🔄 **VARIAÇÕES E SINÔNIMOS**\\n- Variação 1\\n- Variação 2\\n- Variação 3\\n- Variação 4\\n- Variação 5\\n- Variação 6\\n- Variação 7\\n- Variação 8\\n- Variação 9\\n- Variação 10",
    "keywords": ["principais", "long-tail", "técnicos", "variações"]
  },
  "perguntas_respostas": {
    "improvedText": "📋 **PERGUNTAS & RESPOSTAS ESTRATÉGICAS**\\n\\n❓ **PERGUNTA 1 - ESPECIFICAÇÃO TÉCNICA PRINCIPAL**\\nQuais são as especificações técnicas detalhadas deste produto?\\n✅ **RESPOSTA:** [Resposta completa com material, dimensões, peso, capacidade, voltagem, potência e outras especificações relevantes do produto]\\n\\n❓ **PERGUNTA 2 - USO E INSTALAÇÃO**\\nComo usar/instalar este produto corretamente?\\n✅ **RESPOSTA:** [Resposta completa com passo a passo de instalação/uso, requisitos necessários, dicas de utilização e cuidados importantes]\\n\\n❓ **PERGUNTA 3 - GARANTIA E SUPORTE**\\nQual a garantia e como funciona o suporte?\\n✅ **RESPOSTA:** [Resposta completa com período de garantia, o que está coberto, processo de troca/devolução, canais de atendimento e tempo de resposta]\\n\\n❓ **PERGUNTA 4 - BENEFÍCIO PRINCIPAL**\\nQual o principal benefício/diferencial deste produto?\\n✅ **RESPOSTA:** [Resposta completa destacando o benefício principal, comparação com concorrentes, vantagens exclusivas e resultados esperados]",
    "keywords": ["dúvidas frequentes", "perguntas e respostas", "FAQ", "suporte", "ajuda", "especificações", "garantia", "instalação", "benefícios"]
  },
  "kits_criativos": {
    "improvedText": "🎁 **KITS TEMÁTICOS INTELIGENTES**\\n- Kit 1: [Produto principal + Complemento 1] - Justificativa de valor\\n- Kit 2: [Produto principal + Complemento 2] - Justificativa de valor\\n- Kit 3: [Produto principal + Complemento 3] - Justificativa de valor\\n- Kit 4: [Produto principal + Complemento 4] - Justificativa de valor\\n- Kit 5: [Produto principal + Complemento 5] - Justificativa de valor\\n- Kit 6: [Produto principal + Complemento 6] - Justificativa de valor\\n\\n🎄 **CAMPANHAS SAZONAIS ESTRATÉGICAS**\\n- Natal: [estratégia específica com produtos e gatilho emocional]\\n- Dia das Crianças: [estratégia específica com produtos e gatilho emocional]\\n- Black Friday: [estratégia específica com produtos e urgência]\\n- Dia das Mães/Pais: [estratégia específica com produtos e gatilho emocional]\\n- Volta às Aulas: [estratégia específica com produtos e benefício]\\n\\n💰 **ESTRATÉGIAS DE QUANTIDADE INTELIGENTE**\\n- Compre 2, leve 3: [justificativa e economia]\\n- Leve mais, pague menos: [economia por quantidade]\\n- Frete grátis acima de X unidades: [valor mínimo]\\n- Combo família: [detalhes do combo]\\n- Assinatura mensal: [benefícios recorrentes]\\n\\n🏆 **CROSS-SELL INTELIGENTE**\\n- Produto complementar 1: [nome] - [justificativa de venda casada]\\n- Produto complementar 2: [nome] - [justificativa de venda casada]\\n- Produto complementar 3: [nome] - [justificativa de venda casada]\\n- Acessório recomendado 1: [nome] - [justificativa]\\n- Acessório recomendado 2: [nome] - [justificativa]\\n\\n🎯 **ESTRATÉGIAS PSICOLÓGICAS DE CONVERSÃO**\\n- Escassez: [técnica específica - ex: Últimas X unidades]\\n- Urgência: [técnica específica - ex: Oferta válida por 24h]\\n- Prova social: [técnica específica - ex: Mais de X vendidos]\\n- Autoridade: [técnica específica - ex: Recomendado por especialistas]\\n- Reciprocidade: [técnica específica - ex: Brinde exclusivo na compra]",
    "keywords": ["kits", "combos", "promoções", "ofertas", "estratégias", "cross-sell", "conversão", "campanhas", "sazonais", "quantidade"]
  },
  "cauda_longa": {
    "improvedText": "🎯 **ESTRATÉGIA CAUDA LONGA EXPLICADA**\\nA estratégia de cauda longa consiste em criar títulos mais específicos e detalhados que capturam buscas menos competitivas, mas com MAIOR INTENÇÃO DE COMPRA. Isso permite que o produto se destaque em mercados saturados.\\n\\n📝 **10 TÍTULOS OTIMIZADOS PARA SEO (LONG TAIL)**\\n\\n1. [Produto] [Especificação Técnica] [Cor/Modelo] para [Público-Alvo] [Benefício Principal]\\n2. [Produto] [Material/Composição] [Tamanho] Ideal para [Ocasião] [Diferencial]\\n3. [Produto] [Característica Única] [Versão] para [Necessidade Específica] [Vantagem]\\n4. [Produto] [Tipo/Categoria] [Estilo] Perfeito para [Ambiente/Uso] [Resultado]\\n5. [Produto] [Qualidade/Certificação] [Modelo] para [Perfil de Usuário] [Garantia]\\n6. [Produto] [Funcionalidade] [Capacidade] Recomendado para [Situação] [Economia]\\n7. [Produto] [Design/Acabamento] [Linha] Exclusivo para [Segmento] [Status]\\n8. [Produto] [Tecnologia/Inovação] [Geração] Desenvolvido para [Objetivo] [Performance]\\n9. [Produto] [Origem/Procedência] [Edição] Selecionado para [Exigência] [Autenticidade]\\n10. [Produto] [Durabilidade/Resistência] [Série] Criado para [Desafio] [Confiabilidade]\\n\\n💡 **DICA DE USO**\\nUse estes títulos em diferentes plataformas (Mercado Livre, Shopee, Amazon, Google Shopping) para maximizar alcance e capturar diferentes intenções de busca. Títulos de cauda longa têm menor concorrência e maior taxa de conversão.\\n\\n🔑 **ESTRUTURA RECOMENDADA**\\n[PRODUTO] + [ESPECIFICAÇÃO TÉCNICA] + [COR/MODELO] + [PÚBLICO-ALVO] + [BENEFÍCIO PRINCIPAL] (TUDO EM UMA ÚNICA LINHA, SEM HÍFEN OU QUEBRA)",
    "keywords": ["cauda longa", "long tail", "títulos otimizados", "seo", "alta conversão", "buscas específicas", "menor concorrência", "intenção de compra", "marketplace", "ranqueamento"]
  }
}`;
}

// ==================== AI PROVIDERS ====================
const API_TIMEOUT_MS = 90000; // 90 segundos (otimizado para evitar timeout de edge function)

// Função para criar timeout com Promise.race
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, apiName: string): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      console.error(`⏰ TIMEOUT ${apiName} após ${timeoutMs}ms`);
      reject(new Error(`TIMEOUT_${apiName}_${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
};

// Função de retry com backoff exponencial
const callWithRetry = async <T>(
  fn: () => Promise<T>, 
  maxRetries: number = 2, 
  baseDelay: number = 3000,
  apiName: string = 'API'
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      console.log(`🔄 [${apiName}] Tentativa ${attempt}/${maxRetries + 1}...`);
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.warn(`⚠️ [${apiName}] Tentativa ${attempt} falhou:`, error.message);
      
      // Se for rate limit ou timeout, fazer retry
      const isRetryable = error.message?.includes('429') || 
                          error.message?.includes('TIMEOUT') ||
                          error.message?.includes('500') ||
                          error.message?.includes('503');
      
      if (attempt <= maxRetries && isRetryable) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ [${apiName}] Aguardando ${delay}ms antes do retry...`);
        await new Promise(r => setTimeout(r, delay));
      } else if (!isRetryable) {
        // Erro não recuperável, não fazer retry
        throw error;
      }
    }
  }
  
  throw lastError || new Error(`${apiName} falhou após ${maxRetries + 1} tentativas`);
};

async function callGeminiAPI(systemPrompt: string, userPrompt: string, apiKey: string): Promise<any> {
  console.log('🤖 Chamando Gemini API...');
  
  const requestBody = {
    contents: [{
      parts: [{
        text: systemPrompt + '\n\n' + userPrompt
      }]
    }],
    generationConfig: {
      temperature: 0.3,
      topP: 0.8,
      maxOutputTokens: 2200,
      response_mime_type: 'application/json'
    }
  };
  
  const fetchPromise = fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });
  
  const response = await withTimeout(fetchPromise, API_TIMEOUT_MS, 'GEMINI');

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Erro HTTP Gemini:', response.status, errorText);
    
    if (response.status === 429) {
      throw new Error(`Gemini rate limit excedido (${response.status}). Aguarde alguns minutos.`);
    } else if (response.status >= 500) {
      throw new Error(`Gemini servidor sobrecarregado (${response.status}). Tente novamente.`);
    } else {
      throw new Error(`Gemini HTTP ${response.status}: ${errorText}`);
    }
  }
  
  const data = await response.json();
  
  if (data.candidates && data.candidates[0] && data.candidates[0].content) {
    const generatedText = data.candidates[0].content.parts?.[0]?.text || '';
    
    // Parse JSON
    const cleaned = generatedText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    
    try {
      return JSON.parse(cleaned);
    } catch {
      // Fallback: extrai primeiro bloco JSON
      let depth = 0, start = -1;
      for (let i = 0; i < cleaned.length; i++) {
        if (cleaned[i] === '{') { if (depth === 0) start = i; depth++; }
        else if (cleaned[i] === '}') { depth--; if (depth === 0 && start !== -1) return JSON.parse(cleaned.slice(start, i + 1)); }
      }
      throw new Error('Não foi possível extrair JSON da resposta Gemini');
    }
  }
  
  throw new Error('Resposta inválida do Gemini');
}

// Função auxiliar para tentar corrigir JSON truncado
function tryFixTruncatedJSON(text: string): any | null {
  if (!text) return null;
  
  try {
    return JSON.parse(text);
  } catch {
    let fixed = text.trim();
    
    // Contar chaves e colchetes
    const openBraces = (fixed.match(/{/g) || []).length;
    const closeBraces = (fixed.match(/}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/]/g) || []).length;
    
    // Adicionar fechamentos faltantes
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      fixed += ']';
    }
    for (let i = 0; i < openBraces - closeBraces; i++) {
      fixed += '}';
    }
    
    try {
      return JSON.parse(fixed);
    } catch {
      return null;
    }
  }
}

async function callOpenAIAPI(systemPrompt: string, userPrompt: string, apiKey: string): Promise<any> {
  console.log('🧠 Chamando OpenAI API...');
  
  const requestBody = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.1,
    max_tokens: 4096,
    response_format: { type: "json_object" }
  };
  
  const fetchPromise = fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  
  const response = await withTimeout(fetchPromise, API_TIMEOUT_MS, 'OPENAI');

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Erro HTTP OpenAI:', response.status, errorText);
    
    if (response.status === 429) {
      throw new Error(`OpenAI rate limit excedido (${response.status}). Aguarde alguns minutos.`);
    } else if (response.status >= 500) {
      throw new Error(`OpenAI servidor sobrecarregado (${response.status}). Tente novamente.`);
    } else {
      throw new Error(`OpenAI HTTP ${response.status}: ${errorText}`);
    }
  }
  
  const data = await response.json();
  
  if (data.choices && data.choices[0] && data.choices[0].message) {
    const generatedText = data.choices[0].message.content;
    console.log(`📄 Resposta OpenAI (${generatedText?.length || 0} chars)`);
    
    // Tentar parsear com tratamento de erro
    try {
      return JSON.parse(generatedText);
    } catch (parseError) {
      console.error('❌ Erro ao parsear JSON da OpenAI:', parseError);
      console.error('📄 Texto recebido (primeiros 500 chars):', generatedText?.substring(0, 500));
      console.error('📄 Texto recebido (últimos 500 chars):', generatedText?.substring(generatedText.length - 500));
      
      // Tentar corrigir JSON truncado
      const fixedResult = tryFixTruncatedJSON(generatedText);
      if (fixedResult) {
        console.log('✅ JSON corrigido com sucesso!');
        return fixedResult;
      }
      
      throw new Error(`JSON inválido da OpenAI: ${(parseError as Error).message}`);
    }
  }
  
  throw new Error('Resposta inválida do OpenAI');
}

// ==================== MAIN HANDLER ====================
serve(async (req) => {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();
  
  // 🔍 Instrumentação padronizada
  console.log({
    fn: 'unified-commands',
    requestId,
    method: req.method,
    contentType: req.headers.get('content-type'),
    hasAuth: !!req.headers.get('authorization'),
    hasInternalKey: !!req.headers.get('x-internal-worker-key'),
  });
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 🔐 AUTENTICAÇÃO: Aceitar APENAS worker key (chamada interna)
    const internalKey = req.headers.get('x-internal-worker-key');
    const expectedKey = Deno.env.get('INTERNAL_WORKER_SECRET');
    
    if (internalKey !== expectedKey) {
      console.log(`❌ [${requestId}] Acesso negado - use a fila de geração`);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Acesso negado. Use a fila de geração assíncrona.',
        code: 'USE_QUEUE'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`✅ [${requestId}] Acesso autorizado via worker`);

    const body = await req.json();
    const { 
      productName, 
      shortDescription: rawShortDescription, 
      productDescription, // Alias para compatibilidade
      longDescription, 
      forceAPI = 'gemini',
      apiKeyId,
      userId
    } = body;

    // Fallback: aceita shortDescription ou productDescription ou productName
    const shortDescription = rawShortDescription || productDescription || productName || '';

    console.log(`📥 [${requestId}] Request:`, {
      productName: productName?.substring(0, 30),
      forceAPI,
      hasApiKeyId: !!apiKeyId,
      userId
    });

    // Validação - apenas productName é obrigatório agora
    if (!productName) {
      return new Response(JSON.stringify({
        success: false,
        error: 'productName é obrigatório'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determinar qual API key usar
    let apiKey: string | null = null;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Criar cliente admin para consultas ao banco
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Primeiro tentar usar API key do usuário se apiKeyId fornecido
    if (apiKeyId && apiKeyId !== 'default') {
      console.log(`🔑 [${requestId}] Buscando API key do usuário: ${apiKeyId}`);
      
      const provider = forceAPI === 'gemini' ? 'gemini' : 'openai';
      
      const { data: keyData, error: keyError } = await supabaseAdmin
        .from('user_api_keys')
        .select('api_key_encrypted')
        .eq('id', apiKeyId)
        .eq('provider', provider)
        .single();
      
      if (keyError) {
        console.warn(`⚠️ [${requestId}] Erro ao buscar API key:`, keyError.message);
      } else if (keyData?.api_key_encrypted) {
        try {
          apiKey = atob(keyData.api_key_encrypted);
          console.log(`✅ [${requestId}] Usando API key do usuário`);
        } catch (e) {
          console.error(`❌ [${requestId}] Erro ao descriptografar API key:`, e);
        }
      }
    }

    // 2. Se não tem key do usuário, buscar key ativa do usuário para o provider
    if (!apiKey && userId) {
      console.log(`🔑 [${requestId}] Buscando API key ativa do usuário...`);
      
      const provider = forceAPI === 'gemini' ? 'gemini' : 'openai';
      
      const { data: keyData, error: keyError } = await supabaseAdmin
        .from('user_api_keys')
        .select('api_key_encrypted')
        .eq('user_id', userId)
        .eq('provider', provider)
        .eq('is_active', true)
        .eq('is_exhausted', false)
        .limit(1)
        .single();
      
      if (keyError && keyError.code !== 'PGRST116') {
        console.warn(`⚠️ [${requestId}] Erro ao buscar API key ativa:`, keyError.message);
      } else if (keyData?.api_key_encrypted) {
        try {
          apiKey = atob(keyData.api_key_encrypted);
          console.log(`✅ [${requestId}] Usando API key ativa do usuário`);
        } catch (e) {
          console.error(`❌ [${requestId}] Erro ao descriptografar API key:`, e);
        }
      }
    }

    // 3. Fallback para keys do sistema
    if (!apiKey) {
      console.log(`🔑 [${requestId}] Usando API key do sistema (fallback)`);
      if (forceAPI === 'gemini') {
        apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY') || null;
      } else {
        apiKey = Deno.env.get('OPENAI_API_KEY') || null;
      }
    }

    if (!apiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: `API Key ${forceAPI.toUpperCase()} não configurada. Configure nas configurações.`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Gerar prompts
    const systemPrompt = createUnifiedSystemPrompt();
    const userPrompt = createUnifiedUserPrompt(
      productName.trim(),
      shortDescription.trim(),
      shortDescription.trim(),
      (longDescription || shortDescription).trim()
    );

    console.log(`🚀 [${requestId}] Chamando ${forceAPI.toUpperCase()}...`);

    // Chamar API
    let result: any;
    let usedAPI = '';
    
    try {
      if (forceAPI === 'gemini') {
        // Gemini COM retry automático (2 tentativas extras)
        result = await callWithRetry(
          () => callGeminiAPI(systemPrompt, userPrompt, apiKey),
          2, 3000, 'Gemini'
        );
        usedAPI = 'Gemini';
      } else {
        // OpenAI COM retry automático (2 tentativas extras)
        result = await callWithRetry(
          () => callOpenAIAPI(systemPrompt, userPrompt, apiKey),
          2, 3000, 'OpenAI'
        );
        usedAPI = 'OpenAI';
      }
    } catch (apiError) {
      console.error(`❌ [${requestId}] Erro ${forceAPI} após retries:`, apiError);
      
      // CORREÇÃO: Só fazer fallback se forceAPI === 'gemini'
      // Quando forceAPI === 'openai', NÃO tentar Gemini (são responsabilidades separadas)
      if (forceAPI === 'gemini') {
        const fallbackKey = Deno.env.get('OPENAI_API_KEY');
        
        if (fallbackKey) {
          console.log(`🔄 [${requestId}] Tentando fallback para OpenAI com retry...`);
          
          try {
            result = await callWithRetry(
              () => callOpenAIAPI(systemPrompt, userPrompt, fallbackKey),
              2, 3000, 'OpenAI-Fallback'
            );
            usedAPI = 'OpenAI (fallback)';
          } catch (fallbackError) {
            console.error(`❌ [${requestId}] Fallback OpenAI também falhou após retries:`, fallbackError);
            throw apiError; // Re-throw original error
          }
        } else {
          throw apiError;
        }
      } else {
        // forceAPI === 'openai': não fazer fallback, apenas re-throw
        console.error(`❌ [${requestId}] OpenAI falhou após retries, sem fallback (conforme arquitetura)`);
        throw apiError;
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`✅ [${requestId}] Sucesso em ${totalTime}ms usando ${usedAPI}`);

    // Adicionar metadados
    result.usedAPI = usedAPI;
    result.apiInfo = `Gerado com ${usedAPI}`;
    result.debug_info = {
      execution_time_ms: totalTime,
      api_used: usedAPI,
      request_id: requestId
    };

    // Log de uso com cálculo de custos REAIS
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const isGemini = usedAPI.includes('Gemini');
      const modelUsed = isGemini ? 'gemini-2.5-flash' : 'gpt-4o-mini';
      
      // Preços OFICIAIS por 1M tokens
      const PRICE_INPUT_PER_M = 0.15;
      const PRICE_OUTPUT_PER_M = 0.60;
      const USD_TO_BRL = 6.10;
      
      // Usar tokens REAIS da resposta se disponíveis, senão estimar baseado no tamanho
      const responseText = JSON.stringify(result);
      const promptText = systemPrompt + userPrompt;
      
      // Estimativa: ~4 caracteres por token em média
      const estimatedPromptTokens = Math.ceil(promptText.length / 4);
      const estimatedCompletionTokens = Math.ceil(responseText.length / 4);
      const totalTokens = estimatedPromptTokens + estimatedCompletionTokens;
      
      const inputCost = (estimatedPromptTokens / 1_000_000) * PRICE_INPUT_PER_M;
      const outputCost = (estimatedCompletionTokens / 1_000_000) * PRICE_OUTPUT_PER_M;
      const estimatedCostUSD = inputCost + outputCost;
      const estimatedCostBRL = estimatedCostUSD * USD_TO_BRL;
      
      console.log(`📊 [${requestId}] Tokens: ${estimatedPromptTokens} in + ${estimatedCompletionTokens} out = $${estimatedCostUSD.toFixed(6)}`);
      
      await supabase.from('ai_usage_logs').insert({
        function_name: 'unified-commands',
        api_provider: isGemini ? 'gemini' : 'openai',
        model_used: modelUsed,
        command: 'unified_commands',
        prompt_tokens: estimatedPromptTokens,
        completion_tokens: estimatedCompletionTokens,
        total_tokens: totalTokens,
        estimated_cost_usd: estimatedCostUSD,
        estimated_cost_brl: estimatedCostBRL,
        usd_to_brl_rate: USD_TO_BRL,
        execution_time_ms: totalTime,
        success: true,
        request_id: requestId,
        user_id: userId || null
      });
    } catch (logError) {
      console.warn(`⚠️ [${requestId}] Falha ao salvar log:`, logError);
    }

    return new Response(JSON.stringify({
      success: true,
      ...result
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ [${requestId}] Erro após ${totalTime}ms:`, error);
    
    const message = error instanceof Error ? error.message : String(error);
    
    return new Response(JSON.stringify({
      success: false,
      error: message,
      debug_info: {
        execution_time_ms: totalTime,
        request_id: requestId
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
