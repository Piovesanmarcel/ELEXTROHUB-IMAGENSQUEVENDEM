import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-content-type-options, x-frame-options',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Sistema de cache simples para reduzir chamadas durante instabilidade
const responseCache = new Map();

// Função para gerar hash da requisição para cache
function generateCacheKey(imageData: string, prompt: string, action: string): string {
  const crypto = new TextEncoder().encode(imageData + prompt + action);
  const hash = Array.from(crypto)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 16);
  return hash;
}

// Função de retry com fallback - 3 níveis (APENAS Gemini)
async function retryWithFallback(
  requestId: string,
  geminiApiKey: string,
  requestBody: any,
  isImageGeneration: boolean,
  maxRetries: number = 3
): Promise<any> {
  let lastError: any;

  // ✅ MODELOS CORRETOS: APENAS GEMINI (OpenAI removido - usado apenas em Comando Unificado e Copywriting)
  const models = [
    'gemini-2.5-flash-image:generateContent',    // Modelo principal para imagens
    'gemini-2.5-flash:generateContent',           // Fallback multimodal
    'gemini-1.5-flash:generateContent'            // Fallback estável
  ];

  // Log inicial de diagnóstico
  console.log(`🔑 [${requestId}] === INICIANDO FALLBACK DE MODELOS GEMINI ===`);
  console.log(`🔑 [${requestId}] Gemini Key: ${geminiApiKey ? 'OK (' + geminiApiKey.substring(0, 15) + '...)' : 'MISSING'}`);
  console.log(`🔑 [${requestId}] Modelos disponíveis:`, models);

  for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
    const modelEndpoint = models[modelIndex];

    console.log(`🔄 [${requestId}] Tentando modelo ${modelIndex + 1}/${models.length}: ${modelEndpoint}`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🎯 [${requestId}] Tentativa ${attempt}/${maxRetries} com ${modelEndpoint}`);

        // Delay exponencial entre tentativas (exceto primeira tentativa)
        if (attempt > 1) {
          const delay = Math.pow(2, attempt - 1) * 1000; // 2s, 4s, 8s
          console.log(`⏳ [${requestId}] Aguardando ${delay}ms antes da tentativa ${attempt}...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Lógica do Gemini
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log(`⏰ [${requestId}] Timeout de 120s atingido para ${modelEndpoint}, abortando...`);
          abortController.abort();
        }, 120000);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelEndpoint}?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: abortController.signal
          }
        );

        clearTimeout(timeoutId);

        console.log(`📥 [${requestId}] Resposta da API Gemini (${modelEndpoint}):`, {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ [${requestId}] Sucesso com ${modelEndpoint} na tentativa ${attempt}`);
          return { data, modelUsed: modelEndpoint };
        } else {
          const errorText = await response.text();
          lastError = new Error(`${response.status}: ${errorText}`);

          console.error(`❌ [${requestId}] Erro ${response.status} com ${modelEndpoint} (tentativa ${attempt}):`, errorText);

          // Se for erro 500 e ainda tem tentativas, continuar
          if (response.status === 500 && attempt < maxRetries) {
            console.log(`🔄 [${requestId}] Erro 500 detectado, tentando novamente...`);
            continue;
          }

          // Se não for 500 ou acabaram as tentativas, tentar próximo modelo
          break;
        }

      } catch (fetchError) {
        console.error(`💥 [${requestId}] Erro na requisição para ${modelEndpoint} (tentativa ${attempt}):`, fetchError);
        lastError = fetchError;

        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.log(`⏰ [${requestId}] Timeout para ${modelEndpoint}, tentando próximo modelo...`);
          break; // Timeout, tentar próximo modelo
        }

        // Para outros erros, tentar novamente se ainda há tentativas
        if (attempt < maxRetries) {
          continue;
        }
      }
    }
  }

  // Se chegou aqui, todos os modelos falharam
  throw lastError || new Error('Todos os 3 modelos Gemini falharam');
}

serve(async (req) => {
  const requestId = Math.random().toString(36).substr(2, 9);

  console.log(`🔥 [${requestId}] GEMINI-BACKGROUND-GENERATOR REQUEST:`, {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
    headers: Object.fromEntries(req.headers.entries())
  });

  if (req.method === 'OPTIONS') {
    console.log(`✅ [${requestId}] CORS preflight handled`);
    return new Response(null, { headers: corsHeaders });
  }

  // 🔐 Verificar autenticação - Aceitar AMBOS: worker OU frontend autenticado
  const internalKey = req.headers.get('x-internal-worker-key');
  const expectedKey = Deno.env.get('INTERNAL_WORKER_SECRET');
  const authHeader = req.headers.get('authorization');

  let authenticatedUserId: string | null = null;

  // Método 1: Worker interno (mantido para compatibilidade)
  if (internalKey === expectedKey) {
    console.log(`✅ [${requestId}] Acesso autorizado via worker`);
  }
  // Método 2: Frontend autenticado via JWT
  else if (authHeader) {
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        console.log(`❌ [${requestId}] Token JWT inválido:`, error?.message);
        return new Response(JSON.stringify({
          success: false,
          error: 'Token de autenticação inválido.',
          code: 'INVALID_TOKEN'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      authenticatedUserId = user.id;
      console.log(`✅ [${requestId}] Acesso autorizado via JWT para usuário:`, user.id);
    } catch (authError) {
      console.error(`❌ [${requestId}] Erro ao validar JWT:`, authError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro ao validar autenticação.',
        code: 'AUTH_ERROR'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
  // Método 3: Sem autenticação válida
  else {
    console.log(`❌ [${requestId}] Acesso negado - sem autenticação`);
    return new Response(JSON.stringify({
      success: false,
      error: 'Autenticação necessária.',
      code: 'AUTH_REQUIRED'
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (req.method !== 'POST') {
    console.log(`❌ [${requestId}] Method not allowed: ${req.method}`);
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 🔐 RATE LIMITING: Verificar limites antes de processar (protege contra abuso)
  if (authenticatedUserId) {
    const rateLimitResult = await checkRateLimit(authenticatedUserId, RATE_LIMITS.gemini);
    if (!rateLimitResult.allowed) {
      console.warn(`🚫 [${requestId}] Rate limit excedido para usuário ${authenticatedUserId}`);
      return rateLimitResponse(rateLimitResult);
    }
    console.log(`✅ [${requestId}] Rate limit OK: ${rateLimitResult.remaining} requisições restantes`);
  }

  try {
    console.log(`📥 [${requestId}] Processing POST request...`);

    let geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');

    console.log(`🔑 [${requestId}] Default Gemini API Key Status:`, geminiApiKey ? 'CONFIGURED (' + geminiApiKey.substring(0, 10) + '...)' : 'MISSING');

    if (!geminiApiKey) {
      console.error(`❌ [${requestId}] GOOGLE_GEMINI_API_KEY não configurada`);
      return new Response(JSON.stringify({
        error: 'Chave da API do Gemini não configurada'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📖 [${requestId}] Lendo body da requisição...`);
    const requestText = await req.text();
    console.log(`📊 [${requestId}] Body length:`, requestText.length);

    let parsedBody;
    try {
      parsedBody = JSON.parse(requestText);
      console.log(`✅ [${requestId}] JSON parsed successfully`);
    } catch (parseError) {
      console.error(`❌ [${requestId}] Erro ao fazer parse do JSON:`, parseError);
      return new Response(JSON.stringify({
        error: 'JSON inválido na requisição'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { imageData, prompt, action, dimensions, apiKeyId, productContext } = parsedBody;

    // Log do contexto do produto recebido
    if (productContext) {
      console.log(`📦 [${requestId}] Contexto do produto recebido:`, {
        name: productContext.productName,
        category: productContext.productCategory,
        environments: productContext.idealEnvironments?.length || 0,
        keywords: productContext.mainKeywords?.length || 0
      });
    }

    // 🔑 Se apiKeyId foi fornecido e não é 'default', buscar a chave do usuário
    if (apiKeyId && apiKeyId !== 'default') {
      console.log(`🔑 [${requestId}] Buscando API key do usuário: ${apiKeyId}`);

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

      // Tentar primeiro na nova tabela user_api_keys
      let keyResponse = await fetch(
        `${supabaseUrl}/rest/v1/user_api_keys?id=eq.${apiKeyId}&provider=eq.gemini&select=api_key_encrypted`,
        {
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json'
          }
        }
      );

      let keyData = await keyResponse.json();

      // Fallback para tabela antiga gemini_api_keys se não encontrou
      if (!keyData || keyData.length === 0) {
        console.log(`🔄 [${requestId}] Não encontrado em user_api_keys, tentando gemini_api_keys...`);
        keyResponse = await fetch(
          `${supabaseUrl}/rest/v1/gemini_api_keys?id=eq.${apiKeyId}&select=api_key_encrypted`,
          {
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey,
              'Content-Type': 'application/json'
            }
          }
        );
        keyData = await keyResponse.json();
      }

      if (keyData && keyData.length > 0 && keyData[0].api_key_encrypted) {
        try {
          geminiApiKey = atob(keyData[0].api_key_encrypted);
          console.log(`✅ [${requestId}] Usando API key do usuário: ${geminiApiKey.substring(0, 10)}...`);
        } catch (decryptError) {
          console.error(`❌ [${requestId}] Erro ao descriptografar API key:`, decryptError);
        }
      } else {
        console.log(`⚠️ [${requestId}] API key do usuário não encontrada, usando key padrão do sistema`);
      }
    }

    console.log(`📥 [${requestId}] Request recebida:`, {
      action,
      hasImageData: !!imageData,
      isImageDataArray: Array.isArray(imageData),
      imageDataLength: Array.isArray(imageData) ? imageData.length : (imageData?.length || 0),
      promptLength: prompt?.length || 0,
      hasDimensions: !!dimensions,
      hasApiKeyId: !!apiKeyId,
      dimensions: dimensions ? { altura: dimensions.altura, largura: dimensions.largura, profundidade: dimensions.profundidade, peso_bruto: dimensions.peso_bruto } : null
    });

    // Validar entrada conforme ação
    const isImageGeneration = action === 'generate_background';
    const isPromptGeneration = !action || action === 'generate_prompt';

    // SEMPRE exigir imageData e prompt, pois agora o prompt generation também analisa a imagem
    if (!imageData || !prompt) {
      return new Response(JSON.stringify({
        error: 'Imagem e prompt são obrigatórios para todas as operações'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🤖 Iniciando geração com Gemini 2.5 Flash...');

    // Detectar se é copywriting profissional (DEVE VIR ANTES DE USAR A VARIÁVEL)
    const isCopywritingProfessional = prompt.includes('### Estrutura de Copywriting') ||
      prompt.includes('#### 1. Título Atraente') ||
      prompt.length > 1000;

    console.log(`🎯 [${requestId}] Tipo de geração:`, {
      isImageGeneration,
      isPromptGeneration,
      isCopywritingProfessional
    });

    // CRÍTICO: Processar image data ANTES de qualquer outra lógica
    // Agora suporta múltiplas imagens
    let base64Images: Array<{ data: string; mimeType: string }> = [];

    const processImageData = async (imgData: string): Promise<{ data: string; mimeType: string }> => {
      let base64Image: string;
      let inputMimeType = 'image/png';

      // 🚫 VALIDAÇÃO: Rejeitar placeholder do sanitizador ou blob:
      if (imgData === '[base64_removed_use_https_url]' ||
        imgData === '[base64_image_removed]' ||
        imgData === '[blob_removed_use_https_url]' ||
        imgData === '[image_data_removed]') {
        console.error(`❌ [${requestId}] Imagem inválida recebida: placeholder do sanitizador`);
        throw new Error('Imagem inválida: a fila removeu o base64. Envie uma URL https:// hospedada.');
      }

      if (imgData.startsWith('blob:')) {
        console.error(`❌ [${requestId}] blob: URL não pode ser usada no backend`);
        throw new Error('blob: URLs não funcionam no backend. Hospede a imagem primeiro e envie URL https://');
      }

      if (imgData.startsWith('http://') || imgData.startsWith('https://')) {
        // É uma URL - fazer fetch na edge function para evitar CORS
        console.log(`📡 [${requestId}] URL detectada, fazendo fetch do servidor:`, imgData.substring(0, 100) + '...');

        const response = await fetch(imgData);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        inputMimeType = blob.type || 'image/png';
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Converter para base64
        let binaryString = '';
        for (let i = 0; i < uint8Array.length; i++) {
          binaryString += String.fromCharCode(uint8Array[i]);
        }
        base64Image = btoa(binaryString);

        console.log(`✅ [${requestId}] Imagem baixada e convertida com sucesso, tamanho: ${base64Image.length}, mime: ${inputMimeType}`);
      } else if (imgData.startsWith('data:')) {
        // É base64 com prefixo data: - extrair dados
        const mimeMatch = imgData.match(/^data:([^;]+);base64,/);
        if (mimeMatch && mimeMatch[1]) {
          inputMimeType = mimeMatch[1];
        }
        base64Image = imgData.includes(',')
          ? imgData.split(',')[1]
          : imgData;
        console.log(`✅ [${requestId}] Base64 com prefixo recebido, tamanho: ${base64Image.length}, mime: ${inputMimeType}`);
      } else if (imgData.length > 100) {
        // Assume que é base64 puro (sem prefixo)
        base64Image = imgData;
        console.log(`✅ [${requestId}] Base64 puro recebido, tamanho: ${base64Image.length}, mime: ${inputMimeType}`);
      } else {
        // String muito curta para ser imagem válida
        console.error(`❌ [${requestId}] Imagem inválida: string muito curta (${imgData.length} chars)`);
        throw new Error(`Imagem inválida: dados muito curtos (${imgData.length} caracteres). Esperado URL https:// ou base64.`);
      }

      return { data: base64Image, mimeType: inputMimeType };
    };

    if (imageData) {
      try {
        if (Array.isArray(imageData)) {
          // Múltiplas imagens
          console.log(`📸 [${requestId}] Processando ${imageData.length} imagens...`);
          for (const imgData of imageData) {
            const processed = await processImageData(imgData);
            base64Images.push(processed);
          }
          console.log(`✅ [${requestId}] ${base64Images.length} imagens processadas com sucesso`);
        } else {
          // Imagem única (backward compatibility)
          const processed = await processImageData(imageData);
          base64Images.push(processed);
        }
      } catch (fetchError) {
        console.error(`❌ [${requestId}] Erro ao processar imagem(ns):`, fetchError);
        const message = fetchError instanceof Error ? fetchError.message : String(fetchError);
        return new Response(JSON.stringify({
          error: `Não foi possível acessar a imagem: ${message}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Para compatibilidade com código existente
    const base64Image = base64Images[0]?.data;
    const inputMimeType = base64Images[0]?.mimeType || 'image/png';

    // Se for apenas geração de prompt de texto, incluir a imagem na análise
    if (isPromptGeneration) {
      try {
        console.log(`🔍 [${requestId}] Gerando prompt COM análise da imagem do produto...`);

        // CRÍTICO: Incluir TODAS as imagens de referência na análise para que o Gemini entenda o produto
        const body = {
          contents: [{
            role: 'user',
            parts: [
              // Adicionar todas as imagens de referência
              ...base64Images.map(img => ({
                inlineData: {
                  mimeType: img.mimeType,
                  data: img.data
                }
              })),
              { text: prompt }
            ]
          }]
        } as any;

        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${geminiApiKey}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
        );

        if (!resp.ok) {
          const t = await resp.text();
          console.error(`❌ [${requestId}] Erro ao gerar prompt:`, t);
          return new Response(JSON.stringify({ error: `Falha ao gerar prompt: ${resp.status}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const data = await resp.json();
        const generatedPrompt = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log(`✅ [${requestId}] Prompt gerado COM análise do produto (${generatedPrompt.length} chars)`);

        return new Response(JSON.stringify({
          success: true,
          generatedPrompt,
          generated_image_text: generatedPrompt,
          data: { response: generatedPrompt }
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      } catch (e) {
        console.error(`💥 [${requestId}] Exceção ao gerar prompt:`, e);
        return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Erro desconhecido' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Helper: Inferir ambientes inteligentes baseado no nome/categoria do produto
    const inferSmartEnvironments = (name: string, category: string): string[] => {
      const text = `${name} ${category}`.toLowerCase();

      const envMappings: { keywords: string[]; environments: string[] }[] = [
        { keywords: ['cozinha', 'panela', 'frigideira', 'culinária', 'chef', 'alimento', 'kitchen', 'cook'], environments: ['modern kitchen', 'gourmet kitchen', 'professional restaurant'] },
        { keywords: ['escritório', 'office', 'trabalho', 'notebook', 'mesa', 'cadeira', 'desk'], environments: ['modern office', 'home office', 'coworking space'] },
        { keywords: ['banheiro', 'banho', 'toalha', 'shampoo', 'higiene', 'bathroom', 'bath'], environments: ['luxury bathroom', 'spa', 'modern bathroom'] },
        { keywords: ['quarto', 'cama', 'travesseiro', 'dormir', 'sono', 'bedroom', 'sleep'], environments: ['cozy bedroom', 'hotel suite', 'minimalist bedroom'] },
        { keywords: ['esporte', 'fitness', 'academia', 'treino', 'exercício', 'gym', 'sport'], environments: ['modern gym', 'fitness studio', 'outdoor setting'] },
        { keywords: ['bebê', 'criança', 'infantil', 'kids', 'brinquedo', 'baby', 'child'], environments: ['children bedroom', 'nursery', 'play area'] },
        { keywords: ['eletrônico', 'tecnologia', 'celular', 'gadget', 'fone', 'tech', 'phone'], environments: ['tech setup', 'minimalist desk', 'modern environment'] },
        { keywords: ['moda', 'roupa', 'vestido', 'camisa', 'sapato', 'bolsa', 'fashion', 'clothes'], environments: ['fashion boutique', 'organized closet', 'fashion studio'] },
        { keywords: ['pet', 'cachorro', 'gato', 'animal', 'dog', 'cat'], environments: ['pet-friendly living room', 'pet park', 'cozy home'] },
        { keywords: ['jardim', 'planta', 'vaso', 'flor', 'garden', 'plant'], environments: ['zen garden', 'green balcony', 'terrace'] },
        { keywords: ['beleza', 'maquiagem', 'cosmetic', 'beauty', 'makeup'], environments: ['beauty vanity', 'salon', 'elegant bathroom'] },
        { keywords: ['ferramenta', 'tool', 'construção', 'work'], environments: ['workshop', 'garage', 'professional workspace'] }
      ];

      for (const mapping of envMappings) {
        if (mapping.keywords.some(kw => text.includes(kw))) {
          return mapping.environments;
        }
      }

      return ['modern living space', 'elegant studio', 'professional environment'];
    };

    // Helper: Inferir keywords inteligentes baseado no nome/categoria
    const inferSmartKeywords = (name: string, category: string): string[] => {
      const text = `${name} ${category}`.toLowerCase();
      const keywords: string[] = [];

      if (text.includes('premium') || text.includes('luxo') || text.includes('profissional')) {
        keywords.push('premium', 'sophisticated');
      }
      if (text.includes('aço') || text.includes('inox') || text.includes('metal')) {
        keywords.push('durable', 'resistant');
      }
      if (text.includes('natural') || text.includes('orgânico') || text.includes('eco')) {
        keywords.push('natural', 'sustainable');
      }
      if (text.includes('moderno') || text.includes('design') || text.includes('inovador')) {
        keywords.push('modern', 'innovative');
      }

      return keywords.length > 0 ? keywords : ['quality', 'elegant', 'versatile'];
    };

    // Função para construir prompts de ambiente com contexto do produto
    const buildAmbientPrompt = (key: string, ctx?: any) => {
      const productName = ctx?.productName || 'the product';
      const category = ctx?.productCategory || 'consumer product';

      // FALLBACK INTELIGENTE: Se idealEnvironments estiver vazio/genérico, inferir do produto
      let environments: string;
      const rawEnvs = ctx?.idealEnvironments;
      if (rawEnvs && Array.isArray(rawEnvs) && rawEnvs.length > 0 && !rawEnvs.every((e: string) => e === 'various settings' || e === 'ambiente moderno')) {
        environments = rawEnvs.join(', ');
        console.log(`[AMBIENT-PROMPT] ✅ Usando ambientes do contexto: ${environments}`);
      } else {
        const inferredEnvs = inferSmartEnvironments(productName, category);
        environments = inferredEnvs.join(', ');
        console.log(`[AMBIENT-PROMPT] 🔄 Ambientes inferidos do produto "${productName}": ${environments}`);
      }

      // FALLBACK INTELIGENTE para keywords
      let keywords: string;
      const rawKeywords = ctx?.mainKeywords;
      if (rawKeywords && Array.isArray(rawKeywords) && rawKeywords.length > 0 && !rawKeywords.every((k: string) => k === 'quality' || k === 'qualidade')) {
        keywords = rawKeywords.join(', ');
        console.log(`[AMBIENT-PROMPT] ✅ Usando keywords do contexto: ${keywords}`);
      } else {
        const inferredKeywords = inferSmartKeywords(productName, category);
        keywords = inferredKeywords.join(', ');
        console.log(`[AMBIENT-PROMPT] 🔄 Keywords inferidas do produto: ${keywords}`);
      }

      const description = ctx?.productDescription || '';

      const templates: Record<string, string> = {
        ambient_1: `Create a concise English prompt (max 150 words) for a commercial product ad.

PRODUCT CONTEXT (use this information to create a RELEVANT scene):
- Product Name: ${productName}
- Product Category: ${category}
- Ideal Environments: ${environments}
- Key Features/Keywords: ${keywords}
${description ? `- Description: ${description.substring(0, 200)}` : ''}

CRITICAL PRODUCT FIDELITY INSTRUCTIONS:
- PRESERVE THE EXACT PRODUCT from the reference image
- DO NOT change product appearance, colors, shape, or design
- The reference image shows the ACTUAL PRODUCT that must appear in the final image
- Only change the BACKGROUND/SCENE, never the product itself

Based on the product context above, include in the prompt:
- A specific scene/location from the IDEAL ENVIRONMENTS list: ${environments}
- Product positioning that highlights the KEY FEATURES: ${keywords}
- Professional lighting and atmosphere matching the PRODUCT CATEGORY: ${category}
- NO text, words, letters, or graphic elements with writing

Format: Direct prompt in English, no explanations.`,

        ambient_2: `PRODUCT CONTEXT (use this to create an APPROPRIATE lifestyle scene):
- Product Name: ${productName}
- Product Category: ${category}
- Ideal Environments: ${environments}
- Key Features/Keywords: ${keywords}
${description ? `- Description: ${description.substring(0, 200)}` : ''}

STEP 1 - UNDERSTAND THIS SPECIFIC PRODUCT:
Based on the context above (not just the image), identify:
- How is this ${category} product typically used?
- Who is the target audience for ${productName}?
- Which environment from the list is most relevant: ${environments}?

STEP 2 - CREATE REALISTIC SCENE PROMPT:
Create an objective English prompt (max 150 words) for a photorealistic lifestyle image.

PRODUCT REFERENCE GUIDE:
- Use reference image to understand product identity (colors, design, brand)
- You MAY freely reposition, rescale, and adjust angle for the scene
- Product must look NATURALLY INTEGRATED in the environment, not "cut and pasted"
- Maintain product recognition but allow creative composition for realism
- The scene MUST be appropriate for the product category: ${category}

Include in the prompt:
- REALISTIC location from IDEAL ENVIRONMENTS: ${environments}
- Natural product placement that fits the scene organically
- Real props and context elements around the product
- Professional commercial photography lighting
- Photorealistic style - looks like an actual photo, not CGI
- NO text, words, letters, or graphic elements with writing

Format: Direct prompt in English, no explanations.`,

        ambient_3: `STEP 1 - ANALYZE THE PRODUCT:
Product Context: ${productName} (${category})
Ideal Settings: ${environments}
Key Features: ${keywords}

First, identify what product is shown in the reference image:
- Product category and function
- Target audience (children, adults, professionals, etc.)
- Appropriate usage contexts for THIS product

STEP 2 - CREATE REALISTIC SCENE:
Create a simple English prompt for a PHOTOREALISTIC scene.

PRODUCT REFERENCE GUIDE:
- Use reference image to understand product identity
- You MAY freely reposition, rescale, and adjust angle for the scene
- Product must look NATURAL in the environment, not "pasted"
- Allow creative composition for maximum realism

Include:
- REAL location APPROPRIATE for this ${category} product from: ${environments}
- Product naturally placed in the scene (can be at different angle)
- Real props and context elements
- Professional photography lighting
- Clean visual atmosphere - looks like actual commercial photo
- NO text or writing

Format: Direct English prompt only.`,

        ambient_4: `Create a focused English prompt (max 140 words) on experience.

PRODUCT CONTEXT:
- Product: ${productName}
- Category: ${category}
- Settings: ${environments}
- Keywords: ${keywords}

CRITICAL PRODUCT FIDELITY:
- MAINTAIN THE EXACT PRODUCT from reference image
- DO NOT alter product appearance, colors, shape, or design
- Reference shows REAL PRODUCT to preserve in final image
- Only change BACKGROUND/CONTEXT

Include:
- Usage context appropriate for ${category} and lifestyle from: ${environments}
- Brand personality and emotional elements matching ${keywords}
- NO text, words, letters, CTAs, or graphic writing

Format: Direct English prompt only.`,

        ambient_5: `Create a concise English prompt (max 110 words) for premium concept.

PRODUCT: ${productName} (${category})
SETTINGS: ${environments}
FEATURES: ${keywords}

CRITICAL: PRESERVE EXACT PRODUCT from reference - DO NOT change appearance, colors, or design. Only modify BACKGROUND.

Include:
- Luxurious environment appropriate for ${category}
- Noble materials and cinematic lighting
- Sophisticated minimalism
- Convey exclusivity for ${productName}
- NO text, words, letters, or graphic writing

Format: Direct English prompt only.`,

        ambient_6: `STEP 1 - UNDERSTAND THE PRODUCT:
Product: ${productName}
Category: ${category}
Key Features: ${keywords}
Settings: ${environments}

First, analyze the reference image to identify:
- What problem does this ${category} product solve?
- Who uses this product and why?
- What is the typical pain point this product addresses?
- In what context is this product used?

STEP 2 - CREATE PROBLEM/SOLUTION SCENE:
Create an objective English prompt (max 100 words) for functional use showing problem/solution.

CRITICAL PRODUCT PRESERVATION:
- KEEP EXACT PRODUCT from reference unchanged
- DO NOT modify product appearance, colors, or design
- Reference shows ACTUAL PRODUCT for final image
- Only change BACKGROUND/SCENE
- The scene MUST show a realistic problem that THIS specific ${category} product solves

Include:
- Pain/need situation RELEVANT to ${category} in setting from: ${environments}
- Product ease of use in its appropriate context
- Visible practical benefits and organization
- Communicate practical value of ${productName} through visual elements only
- NO text, words, letters, numbers, or graphic writing

Format: Direct English prompt only.`,

        ambient_7: `STEP 1 - EXAMINE THE PRODUCT:
Product: ${productName}
Category: ${category}
Features: ${keywords}

First, carefully look at the reference image to understand:
- What is this ${category} product and its essence?
- What makes ${productName} unique or special?
- What emotions or story could this product tell?
- What creative concepts would fit this product's identity?

STEP 2 - CREATE CREATIVE CONCEPT:
Create a direct English prompt (max 120 words) for creative concept.

CRITICAL: PRESERVE EXACT PRODUCT from reference image - DO NOT change appearance, colors, or design. Only modify BACKGROUND.

Include:
- Impactful visual and storytelling ALIGNED with ${category} nature
- Artistic elements and differentiated perspective
- Create memorable impact appropriate for ${productName}
- NO text, words, letters, or graphic writing

Format: Direct English prompt only.`,

        person_using: `Create a concise English prompt (max 100 words) for person using product.

PRODUCT: ${productName} (${category})
SETTINGS: ${environments}
FEATURES: ${keywords}

CRITICAL PRODUCT FIDELITY:
- MAINTAIN EXACT PRODUCT from reference unchanged
- DO NOT alter product appearance, colors, or design
- Only change BACKGROUND/SCENE

Include:
- Location from: ${environments}
- Main action appropriate for ${category}
- Product positioning for ${productName}
- Visual appeal atmosphere
- NO text, words, letters, or graphic writing

Format: Direct English prompt only.`,

        white_bg_4k_1: `Gere uma fotografia de produto ultra-realista em resolução 4K nativa, baseada estritamente na imagem de referência fornecida. O objeto deve ser uma réplica exata 1:1 da referência, mantendo fidelidade cromática absoluta (perfect color accuracy) e nitidez perfeita em todos os detalhes e texturas originais do produto. O produto está centralizado e em destaque, preenchendo a maior parte do quadro. O fundo é 100% branco puro e infinito (pure white RGB 255,255,255). Iluminação de estúdio comercial limpa (high-key lighting) cria sombras de contato realistas e suaves na base, ancorando o produto ao chão branco. Foco extremamente nítido (razor-sharp focus) em toda a peça.

Format: Direct image generation, no explanations.`,

        white_bg_4k_2: `Renderização ultra-realista em 4K, qualidade de macrofotografia comercial, do produto exato mostrado na imagem de referência. É imperativo que todas as cores, micro-texturas e detalhes do design original sejam preservados com perfeição e precisão cirúrgica. O objeto está isolado e centralizado contra um fundo branco total e limpo (stark clean white background). A iluminação de estúdio é configurada para acentuar o volume tridimensional do produto, criando sombras definidas e realistas que dão profundidade à imagem, sem perder nenhum detalhe nas áreas sombreadas. Nenhuma alteração nas características do produto original.

Format: Direct image generation, no explanations.`
      };

      return templates[key] || null;
    };

    // Prompts estáticos (fallback quando não há contexto)
    const ambientPrompts: Record<string, string> = {
      ambient_1: `Create a concise English prompt (max 150 words) for a PHOTOREALISTIC commercial product photograph.

PRODUCT REFERENCE GUIDE:
- Use reference image to understand product identity (colors, design, brand)
- You MAY freely reposition, rescale, and adjust angle for the scene
- Product must look NATURALLY INTEGRATED in the scene, not "cut and pasted"
- Allow creative composition for maximum realism

Include in the prompt:
- REALISTIC specific scene/location
- Natural product placement that fits the environment
- Real props and context elements around the product
- Professional commercial photography lighting
- Photorealistic style - looks like an actual photo, not CGI or 3D render
- NO text, words, letters, or graphic elements with writing

Format: Direct prompt in English, no explanations.`,

      ambient_2: `STEP 1 - ANALYZE THE PRODUCT IN THE REFERENCE IMAGE:
First, carefully examine the reference image to identify:
- What type of product is it? (category, function, target audience)
- What are its key characteristics? (colors, shape, size, materials)
- Who is the target audience for this product?
- What lifestyle/context makes sense for THIS specific product?

STEP 2 - CREATE REALISTIC LIFESTYLE SCENE:
Based on your analysis, create an objective English prompt (max 150 words) for a PHOTOREALISTIC lifestyle image.

PRODUCT REFERENCE GUIDE:
- Use reference image to understand product identity
- You MAY freely reposition, rescale, and adjust angle for the scene
- Product must look NATURALLY INTEGRATED, not "cut and pasted"
- Allow creative composition for maximum realism
- The scene MUST be appropriate for the product category you identified

Include in the prompt:
- REALISTIC location and usage context RELEVANT to the product type
- Natural product placement in the scene
- Real props and context elements that belong in the environment
- Professional photography lighting
- Photorealistic style - actual photo, not CGI
- NO text, words, letters, or graphic elements with writing

Format: Direct prompt in English, no explanations.`,

      ambient_3: `STEP 1 - ANALYZE THE PRODUCT:
First, identify what product is shown in the reference image:
- Product category and function
- Target audience (children, adults, professionals, etc.)
- Appropriate usage contexts for THIS product

STEP 2 - CREATE SIMPLE SCENE:
Create a simple English prompt for complete scene.

CRITICAL: PRESERVE THE EXACT PRODUCT from reference image - DO NOT change its appearance, colors, or design. Only modify the BACKGROUND.

Include:
- Simple location APPROPRIATE for this product type
- Product in natural use matching its function
- Good lighting
- Clean visual and welcoming atmosphere
- NO text or writing

Format: Direct English prompt only.`,

      ambient_4: `Create a focused English prompt (max 140 words) on experience.

CRITICAL PRODUCT FIDELITY:
- MAINTAIN THE EXACT PRODUCT from reference image
- DO NOT alter product appearance, colors, shape, or design
- Reference shows REAL PRODUCT to preserve in final image
- Only change BACKGROUND/CONTEXT

Include:
- Usage context and lifestyle
- Brand personality and emotional elements
- NO text, words, letters, CTAs, or graphic writing

Format: Direct English prompt only.`,

      ambient_5: `Create a concise English prompt (max 110 words) for premium concept.

CRITICAL: PRESERVE EXACT PRODUCT from reference - DO NOT change appearance, colors, or design. Only modify BACKGROUND.

Include:
- Luxurious environment and noble materials
- Cinematic lighting and sophisticated minimalism
- Convey exclusivity
- NO text, words, letters, or graphic writing

Format: Direct English prompt only.`,

      ambient_6: `STEP 1 - UNDERSTAND THE PRODUCT:
First, analyze the reference image to identify:
- What problem does this product solve?
- Who uses this product and why?
- What is the typical pain point this product addresses?
- In what context is this product used?

STEP 2 - CREATE PROBLEM/SOLUTION SCENE:
Create an objective English prompt (max 100 words) for functional use showing problem/solution.

CRITICAL PRODUCT PRESERVATION:
- KEEP EXACT PRODUCT from reference unchanged
- DO NOT modify product appearance, colors, or design
- Reference shows ACTUAL PRODUCT for final image
- Only change BACKGROUND/SCENE
- The scene MUST show a realistic problem that THIS specific product solves

Include:
- Pain/need situation RELEVANT to this product type
- Product ease of use in its appropriate context
- Visible practical benefits and organization
- Communicate practical value through visual elements only
- NO text, words, letters, numbers, or graphic writing

Format: Direct English prompt only.`,

      ambient_7: `STEP 1 - EXAMINE THE PRODUCT:
First, carefully look at the reference image to understand:
- What is this product and its essence?
- What makes this product unique or special?
- What emotions or story could this product tell?
- What creative concepts would fit this product's identity?

STEP 2 - CREATE CREATIVE CONCEPT:
Create a direct English prompt (max 120 words) for creative concept.

CRITICAL: PRESERVE EXACT PRODUCT from reference image - DO NOT change appearance, colors, or design. Only modify BACKGROUND.

Include:
- Impactful visual and storytelling ALIGNED with the product's nature
- Artistic elements and differentiated perspective
- Create memorable impact appropriate for this product type
- NO text, words, letters, or graphic writing

Format: Direct English prompt only.`,

      person_using: `Create a concise English prompt (max 100 words) for person using product.

CRITICAL PRODUCT FIDELITY:
- MAINTAIN EXACT PRODUCT from reference unchanged
- DO NOT alter product appearance, colors, or design
- Only change BACKGROUND/SCENE

Include:
- Location and main action
- Product positioning
- Visual appeal atmosphere
- NO text, words, letters, or graphic writing

Format: Direct English prompt only.`,

      white_bg_4k_1: `Gere uma fotografia de produto ultra-realista em resolução 4K nativa, baseada estritamente na imagem de referência fornecida. O objeto deve ser uma réplica exata 1:1 da referência, mantendo fidelidade cromática absoluta (perfect color accuracy) e nitidez perfeita em todos os detalhes e texturas originais do produto. O produto está centralizado e em destaque, preenchendo a maior parte do quadro. O fundo é 100% branco puro e infinito (pure white RGB 255,255,255). Iluminação de estúdio comercial limpa (high-key lighting) cria sombras de contato realistas e suaves na base, ancorando o produto ao chão branco. Foco extremamente nítido (razor-sharp focus) em toda a peça.

Format: Direct image generation, no explanations.`,

      white_bg_4k_2: `Renderização ultra-realista em 4K, qualidade de macrofotografia comercial, do produto exato mostrado na imagem de referência. É imperativo que todas as cores, micro-texturas e detalhes do design original sejam preservados com perfeição e precisão cirúrgica. O objeto está isolado e centralizado contra um fundo branco total e limpo (stark clean white background). A iluminação de estúdio é configurada para acentuar o volume tridimensional do produto, criando sombras definidas e realistas que dão profundidade à imagem, sem perder nenhum detalhe nas áreas sombreadas. Nenhuma alteração nas características do produto original.

Format: Direct image generation, no explanations.`
    };

    // Prompt de fallback ultra-simplificado para ambient_3 em caso de erro 400
    const ambient3Fallback = `Gere prompt básico para cenário: local, produto, iluminação natural.`;

    // Detectar se é copywriting profissional (prompt longo e estruturado)
    // REMOVIDO - Já foi declarado acima

    // Detectar qual ambiente está sendo solicitado baseado no prompt
    let specificPrompt = prompt;
    let detectedAmbient = '';

    // Apenas aplicar prompts de ambiente se NÃO for copywriting profissional
    if (!isCopywritingProfessional) {
      // Verificar se o prompt contém identificadores de ambiente
      for (const ambientKey of Object.keys(ambientPrompts)) {
        if (prompt.includes(ambientKey) || prompt.toLowerCase().includes(ambientKey.replace('_', ' '))) {
          console.log(`🎯 [${requestId}] Ambiente detectado: ${ambientKey}`);

          // ✅ NOVA LÓGICA: Usar template com contexto do produto se disponível
          const templateWithContext = buildAmbientPrompt(ambientKey, productContext);
          if (templateWithContext && productContext) {
            console.log(`📦 [${requestId}] Usando template COM contexto do produto para ${ambientKey}`);
            specificPrompt = templateWithContext;
          } else {
            console.log(`⚠️ [${requestId}] Usando template GENÉRICO para ${ambientKey} (sem contexto)`);
            specificPrompt = ambientPrompts[ambientKey];
          }

          detectedAmbient = ambientKey;
          break;
        }
      }
    } else {
      console.log(`📝 [${requestId}] Copywriting profissional detectada - usando prompt completo`);
    }

    // Gerar instrução de escala baseada nas dimensões do produto
    let scaleInstruction = '';
    if (dimensions && (dimensions.altura || dimensions.largura || dimensions.profundidade)) {
      const altura = dimensions.altura || 0;
      const largura = dimensions.largura || 0;
      const profundidade = dimensions.profundidade || 0;
      const peso = dimensions.peso_bruto || 0;

      // Calcular tamanho aproximado do produto
      const maxDimension = Math.max(altura, largura, profundidade);

      let sizeCategory = '';
      let scaleReference = '';
      if (maxDimension < 10) {
        sizeCategory = 'VERY SMALL (fits in palm of hand)';
        scaleReference = 'a coin, a key, fingers holding it';
      } else if (maxDimension < 30) {
        sizeCategory = 'SMALL (fits in one hand)';
        scaleReference = 'a smartphone, a book, a coffee mug next to it';
      } else if (maxDimension < 60) {
        sizeCategory = 'MEDIUM (shoebox size)';
        scaleReference = 'a shoebox, a laptop, placed on a desk or table';
      } else if (maxDimension < 100) {
        sizeCategory = 'LARGE (suitcase size)';
        scaleReference = 'a suitcase, a person standing nearby for scale';
      } else {
        sizeCategory = 'VERY LARGE (furniture size)';
        scaleReference = 'furniture, a full person standing next to it, room environment';
      }

      scaleInstruction = `

CRITICAL PRODUCT SCALE INSTRUCTIONS:
Real product dimensions: ${altura}cm (H) x ${largura}cm (W) x ${profundidade}cm (D), Weight: ${peso}kg
Size category: ${sizeCategory}
- The product MUST appear in PROPORTIONAL SCALE to the environment
- Use scale reference elements like: ${scaleReference}
- NEVER show the product disproportionate to the scene
- Use perspective and depth to convey correct real-world size`;

      console.log(`📏 [${requestId}] Dimensões do produto aplicadas:`, { altura, largura, profundidade, peso, sizeCategory });
    }

    // Escolher o prompt e modelo baseado no tipo de geração
    let geminiPrompt;
    let modelEndpoint;

    if (isImageGeneration) {
      // Detectar se é fundo branco 4K pelo conteúdo REAL do prompt (não precisa de scale instruction)
      const isWhiteBg4K = prompt.includes('4K WHITE BACKGROUND') ||
        prompt.includes('PURE WHITE (#FFFFFF)') ||
        prompt.includes('CHROMATIC FIDELITY') ||
        prompt.includes('MACRO TEXTURE rendering');

      // Determinar qual variante (para usar prompt correto)
      const isChromatic = prompt.includes('CHROMATIC FIDELITY');

      if (isWhiteBg4K) {
        // Para fundo branco 4K - usar prompt especializado DIRETO sem modificações
        const whiteBgPrompt = isChromatic
          ? `CRITICAL INSTRUCTION - PURE WHITE BACKGROUND ONLY:
Generate a professional e-commerce product photograph with these MANDATORY requirements:

1. BACKGROUND: 100% PURE WHITE (#FFFFFF, RGB 255,255,255) - absolutely NO environment, NO context, NO scene, NO additional elements
2. PRODUCT: Exact replica of the reference image - preserve ALL original colors, textures, details, and design
3. COMPOSITION: Product PERFECTLY CENTERED, occupying 75-85% of the frame
4. LIGHTING: Professional studio high-key lighting, creating ONLY subtle soft shadows beneath the product for depth
5. QUALITY: Ultra-realistic 4K resolution, razor-sharp focus on all details
6. FORBIDDEN: NO backgrounds, NO scenes, NO surfaces, NO environments, NO text, NO watermarks

The final image must look like a professional Amazon/e-commerce product photo with infinite white background.`
          : `CRITICAL INSTRUCTION - PURE WHITE BACKGROUND ONLY:
Generate a macro-quality e-commerce product photograph with these MANDATORY requirements:

1. BACKGROUND: 100% PURE WHITE (#FFFFFF, RGB 255,255,255) - absolutely NO environment, NO context, NO scene, NO additional elements  
2. PRODUCT: Exact replica of the reference image - preserve ALL micro-textures, materials, stitching, finishes
3. COMPOSITION: Product PERFECTLY CENTERED, occupying 75-85% of the frame
4. LIGHTING: Even diffused studio lighting, soft realistic shadows anchoring product to white floor
5. QUALITY: 4K ultra-high definition, capture EVERY micro-detail with surgical precision
6. FORBIDDEN: NO backgrounds, NO scenes, NO surfaces, NO environments, NO text, NO watermarks

The final image must look like a professional catalog photo with infinite white seamless background.`;

        geminiPrompt = whiteBgPrompt;
        console.log(`⚪ [${requestId}] Detectado tipo fundo branco 4K - usando prompt especializado DIRETO`);
      } else {
        // Para outros tipos - CRIAR CENA REALISTA COM O PRODUTO (não apenas trocar fundo)
        geminiPrompt = `Create a photorealistic commercial product photograph.

PRODUCT REFERENCE GUIDE:
- Use the product from the reference image as your visual guide for the product's identity
- MAINTAIN product IDENTITY: preserve exact colors, design, brand elements, key features
- You MAY FREELY ADJUST: angle, position, scale, perspective, lighting to fit the scene naturally
- The product should look NATURALLY INTEGRATED in the new scene, NOT "cut and pasted"
- Allow creative composition - reposition and rescale the product as needed

SCENE TO CREATE:
${prompt}

CREATIVE FREEDOM:
- Reposition and rescale product naturally for the scene
- Use realistic lighting that matches the environment
- Product can be shown from different angles if it fits better
- Create depth and natural integration between product and scene
- Make it look like an actual professional photo, not a composite

${scaleInstruction}

STRICTLY FORBIDDEN: text, letters, words, watermarks, logos that weren't in original product`;
      }
      modelEndpoint = 'gemini-2.5-flash-image:generateContent';
    } else {
      // Para geração de prompt de texto - usar gemini-2.5-flash-image (analisa imagem e gera texto)
      if (isCopywritingProfessional) {
        // Para copywriting profissional - usar o prompt completo e direto
        geminiPrompt = specificPrompt;
      } else {
        // Para prompts de ambiente - usar prompt simplificado com instruções de escala
        if (detectedAmbient === 'ambient_3') {
          // Para ambient_3, usar versão ainda mais simplificada para evitar 400
          geminiPrompt = `Analise a imagem e ${specificPrompt}${scaleInstruction}`;
        } else {
          geminiPrompt = `Analise rapidamente a imagem e ${specificPrompt}${scaleInstruction}
        
        CRÍTICO: 
        - Gere um prompt CONCISO (máximo 100-150 palavras)
        - Seja DIRETO e OBJETIVO
        - Foque apenas no essencial para geração da imagem
        - NÃO use descrições longas ou repetitivas
        - Mantenha características originais do produto
        - RESPEITE a escala real do produto baseado nas dimensões fornecidas`;
        }
      }
      modelEndpoint = 'gemini-2.5-flash-image:generateContent';
    }

    const geminiRequestBody = {
      contents: [{
        parts: [
          // Adicionar todas as imagens de referência
          ...base64Images.map(img => ({
            inlineData: {
              mimeType: img.mimeType,
              data: img.data
            }
          })),
          { text: geminiPrompt }
        ]
      }],
      generationConfig: {
        temperature: isImageGeneration ? 0.4 : 0.7,
        candidateCount: 1,
        maxOutputTokens: 16384, // Aumentado para permitir respostas longas (copywriting completa)
        topP: 0.95,
        topK: 40
      }
    };

    console.log(`📡 [${requestId}] Fazendo requisição para ${modelEndpoint}...`);

    // Verificar cache primeiro
    const cacheKey = generateCacheKey(base64Image, geminiPrompt, action || 'generate_prompt');
    const cachedResponse = responseCache.get(cacheKey);

    if (cachedResponse && Date.now() - cachedResponse.timestamp < 300000) { // Cache por 5 minutos
      console.log(`📋 [${requestId}] Resposta encontrada em cache`);
      return new Response(JSON.stringify({
        ...cachedResponse.data,
        metadata: {
          ...cachedResponse.data.metadata,
          fromCache: true,
          requestId
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      // Usar função de retry com fallback - 5 níveis
      let { data, modelUsed } = await retryWithFallback(
        requestId,
        geminiApiKey,
        geminiRequestBody,
        isImageGeneration
      ).catch(async (error) => {
        // Se foi ambient_3 e deu erro 400, tentar com fallback ultra-simplificado
        if (detectedAmbient === 'ambient_3' && error.message?.includes('400')) {
          console.log(`🔄 [${requestId}] Erro 400 no ambient_3, tentando com fallback ultra-simplificado...`);

          const fallbackPrompt = `Analise a imagem e ${ambient3Fallback}`;
          const fallbackRequestBody = {
            ...geminiRequestBody,
            contents: [{
              parts: [
                {
                  inlineData: {
                    mimeType: inputMimeType,
                    data: base64Image
                  }
                },
                { text: fallbackPrompt }
              ]
            }]
          };

          console.log(`📡 [${requestId}] Tentando fallback para ambient_3 com prompt: ${fallbackPrompt}`);

          return await retryWithFallback(
            requestId,
            geminiApiKey,
            fallbackRequestBody,
            isImageGeneration,
            2 // Menos retries para o fallback
          );
        }

        throw error;
      });
      console.log(`📥 [${requestId}] Dados da resposta Gemini:`, {
        hasCandidates: !!data.candidates,
        candidatesCount: data.candidates?.length || 0,
        firstCandidate: data.candidates?.[0] ? {
          finishReason: data.candidates[0].finishReason,
          hasContent: !!data.candidates[0].content,
          partsCount: data.candidates[0].content?.parts?.length || 0
        } : null
      });

      if (!data.candidates || data.candidates.length === 0) {
        console.error(`❌ [${requestId}] Nenhum candidato retornado pela API`);
        console.log(`🔍 [${requestId}] Resposta completa:`, JSON.stringify(data, null, 2));
        return new Response(JSON.stringify({
          error: 'Nenhum resultado gerado pela API',
          debug: data
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const candidate = data.candidates[0];

      console.log(`🔍 [${requestId}] Analisando candidato:`, {
        finishReason: candidate.finishReason,
        hasContent: !!candidate.content,
        partsCount: candidate.content?.parts?.length || 0,
        safetyRatings: candidate.safetyRatings
      });

      if (candidate.finishReason === 'SAFETY') {
        console.error(`❌ [${requestId}] Conteúdo bloqueado por segurança`);
        return new Response(JSON.stringify({
          error: 'Conteúdo bloqueado por políticas de segurança. Tente com uma imagem ou prompt diferente.'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Log completo da estrutura do candidato para debug
      console.log(`🔍 [${requestId}] Estrutura completa do candidato:`, JSON.stringify(candidate, null, 2));

      const parts = candidate.content?.parts || [];

      if (isImageGeneration) {
        // Processar geração de imagem
        console.log(`🔍 [${requestId}] Parts na resposta (imagem):`, parts.map((part: any, index: number) => ({
          index,
          hasText: !!part.text,
          hasInlineData: !!part.inlineData,
          hasInline_data: !!part.inline_data,
          mimeType: part.inlineData?.mimeType || part.inline_data?.mime_type,
          partKeys: Object.keys(part)
        })));

        // Procurar por dados de imagem em diferentes formatos possíveis
        const imagePart = parts.find((part: any) =>
          (part.inlineData?.data) ||
          (part.inline_data?.data)
        );

        if (imagePart) {
          // Tentar ambos os formatos possíveis
          const imageData = imagePart.inlineData?.data || imagePart.inline_data?.data;
          const mimeType = imagePart.inlineData?.mimeType || imagePart.inline_data?.mime_type || 'image/png';

          if (imageData) {
            const generatedImageBase64 = `data:${mimeType};base64,${imageData}`;

            console.log(`✅ [${requestId}] Imagem gerada com sucesso com ${modelUsed}`);
            console.log(`🖼️ [${requestId}] Tipo MIME: ${mimeType}, Tamanho dos dados: ${imageData.length}`);

            // Capturar usageMetadata para cálculo de custos
            const usageMetadata = data.usageMetadata || {};
            const promptTokens = usageMetadata.promptTokenCount || 0;
            const candidatesTokens = usageMetadata.candidatesTokenCount || 0;
            const totalTokens = usageMetadata.totalTokenCount || 0;

            // Preços Gemini OFICIAIS (Janeiro 2026)
            // Gemini 2.5 Flash Image: $0.039 por imagem gerada
            // Input tokens: $0.15 per 1M tokens
            const PRICE_INPUT_PER_M = 0.15;
            const PRICE_PER_IMAGE = 0.039;  // Preço fixo por imagem
            const TOKENS_PER_IMAGE = 1120;  // Para referência
            const USD_TO_BRL = 6.10;

            const inputCost = (promptTokens / 1_000_000) * PRICE_INPUT_PER_M;
            const imageCost = PRICE_PER_IMAGE;  // Custo fixo por imagem
            const totalCostUSD = inputCost + imageCost;
            const totalCostBRL = totalCostUSD * USD_TO_BRL;

            console.log(`💰 [${requestId}] Custo estimado:`, {
              promptTokens,
              candidatesTokens,
              totalTokens,
              inputCost: `$${inputCost.toFixed(6)}`,
              imageCost: `$${imageCost.toFixed(4)}`,
              totalCostUSD: `$${totalCostUSD.toFixed(4)}`,
              totalCostBRL: `R$${totalCostBRL.toFixed(2)}`,
              model: modelUsed
            });

            // 📊 NOVO: Salvar log de uso no banco
            try {
              const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
              const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
              const supabase = createClient(supabaseUrl, supabaseServiceKey);

              // Obter userId do body (passado pelo ai-chat-proxy)
              const logUserId = parsedBody._userId || null;

              await supabase.from('ai_usage_logs').insert({
                user_id: logUserId,
                function_name: 'gemini-background-generator',
                api_provider: 'gemini',
                model_used: modelUsed,
                command: 'generate_image',
                prompt_tokens: promptTokens,
                completion_tokens: TOKENS_PER_IMAGE,
                total_tokens: promptTokens + TOKENS_PER_IMAGE,
                estimated_cost_usd: totalCostUSD,
                estimated_cost_brl: totalCostBRL,
                usd_to_brl_rate: USD_TO_BRL,
                execution_time_ms: Date.now() - parseInt(requestId, 36),
                success: true,
                request_id: requestId
              });
              console.log(`📝 [${requestId}] Log de geração de imagem salvo: $${totalCostUSD.toFixed(4)} / R$${totalCostBRL.toFixed(2)}`);
            } catch (logError) {
              console.warn(`⚠️ [${requestId}] Erro ao salvar log de imagem:`, logError);
            }

            const responseData = {
              success: true,
              generatedImage: generatedImageBase64,
              // ✅ NOVO: Retornar o prompt usado para debug
              promptUsed: prompt.substring(0, 500) + (prompt.length > 500 ? '...' : ''),
              promptLength: prompt.length,
              usage: {
                model: modelUsed,
                promptTokens,
                candidatesTokens,
                totalTokens,
                estimatedCostUSD: totalCostUSD,
                estimatedCostBRL: totalCostBRL,
                usdToBrlRate: USD_TO_BRL,
                timestamp: new Date().toISOString()
              },
              metadata: {
                model: modelUsed,
                finishReason: candidate.finishReason,
                timestamp: new Date().toISOString(),
                requestId,
                // ✅ NOVO: Contexto do produto recebido
                productContextReceived: productContext ? {
                  name: productContext.productName,
                  environments: productContext.idealEnvironments?.slice(0, 3),
                  keywords: productContext.mainKeywords?.slice(0, 3)
                } : null
              }
            };

            // Salvar no cache
            responseCache.set(cacheKey, {
              data: responseData,
              timestamp: Date.now()
            });

            return new Response(JSON.stringify(responseData), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      } else {
        // Processar geração de prompt de texto
        console.log(`🔍 [${requestId}] Parts na resposta (texto):`, parts.map((part: any, index: number) => ({
          index,
          hasText: !!part.text,
          textLength: part.text?.length || 0
        })));

        const textPart = parts.find((part: any) => part.text);
        if (textPart && textPart.text) {
          console.log(`✅ [${requestId}] Prompt de texto gerado com sucesso`);
          console.log(`📝 [${requestId}] Tamanho do texto: ${textPart.text.length}`);

          let finalText = textPart.text;

          let truncated = false;
          // Apenas truncar se NÃO for copywriting profissional
          if (!isCopywritingProfessional) {
            // Truncar texto se for muito longo (máximo 800 caracteres para prompts de ambiente)
            const maxLength = 800;

            if (finalText.length > maxLength) {
              console.log(`⚠️ [${requestId}] Texto muito longo (${finalText.length}), truncando para ${maxLength} caracteres`);
              // Truncar preservando palavras completas
              finalText = finalText.substring(0, maxLength);
              const lastSpaceIndex = finalText.lastIndexOf(' ');
              if (lastSpaceIndex > maxLength * 0.8) { // Só truncar na palavra se não perder muito conteúdo
                finalText = finalText.substring(0, lastSpaceIndex);
              }
              finalText = finalText.trim() + '...';
              truncated = true;
            }
          } else {
            console.log(`📝 [${requestId}] Copywriting profissional - preservando texto completo (${finalText.length} caracteres)`);
          }

          const responseData = {
            success: true,
            generated_image_text: finalText,
            metadata: {
              model: modelUsed,
              finishReason: candidate.finishReason,
              timestamp: new Date().toISOString(),
              requestId,
              originalLength: textPart.text.length,
              truncated
            }
          };

          // Salvar no cache
          responseCache.set(cacheKey, {
            data: responseData,
            timestamp: Date.now()
          });

          return new Response(JSON.stringify(responseData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Se não encontrou o resultado esperado
      console.log('⚠️ Estrutura da resposta:', JSON.stringify(candidate, null, 2));

      // Tentar encontrar texto mesmo se esperávamos imagem
      const textPart = parts.find((part: any) => part.text);
      if (textPart) {
        console.log('📝 Texto recebido:', textPart.text.substring(0, 200) + '...');

        if (isImageGeneration) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Gemini retornou texto ao invés de imagem',
            analysis: textPart.text,
            suggestion: 'Tente com uma descrição de fundo mais específica ou uma imagem diferente'
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          // Se era para ser texto, retornar como sucesso
          let finalText = textPart.text;
          let truncated = false;

          // Apenas truncar se NÃO for copywriting profissional
          if (!isCopywritingProfessional) {
            const maxLength = 800;
            if (finalText.length > maxLength) {
              console.log(`⚠️ [${requestId}] Texto muito longo (${finalText.length}), truncando para ${maxLength} caracteres`);
              finalText = finalText.substring(0, maxLength);
              const lastSpaceIndex = finalText.lastIndexOf(' ');
              if (lastSpaceIndex > maxLength * 0.8) {
                finalText = finalText.substring(0, lastSpaceIndex);
              }
              finalText = finalText.trim() + '...';
              truncated = true;
            }
          } else {
            console.log(`📝 [${requestId}] Copywriting profissional (fallback) - preservando texto completo (${finalText.length} caracteres)`);
          }

          return new Response(JSON.stringify({
            success: true,
            generated_image_text: finalText,
            metadata: {
              model: modelUsed,
              finishReason: candidate.finishReason,
              timestamp: new Date().toISOString(),
              requestId,
              originalLength: textPart.text.length,
              truncated
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      console.error('❌ Formato de resposta inesperado:', candidate);
      return new Response(JSON.stringify({
        error: 'Formato de resposta inesperado da API'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (retryError) {
      console.error(`💥 [${requestId}] Todos os modelos falharam:`, retryError);

      // Determinar o tipo de erro para retornar o status correto
      const errorMessage = retryError instanceof Error ? retryError.message : String(retryError);
      let status = 500;

      if (errorMessage.includes('429')) {
        status = 429;
      } else if (errorMessage.includes('timeout') || (retryError instanceof Error && retryError.name === 'AbortError')) {
        status = 504;
      }

      return new Response(JSON.stringify({
        error: `Erro após múltiplas tentativas: ${errorMessage}`,
        details: 'Tentamos com diferentes modelos Gemini mas todos falharam'
      }), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('💥 Erro geral na função:', error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({
      error: `Erro interno: ${errorMessage || 'Erro desconhecido'}`,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Limpeza periódica do cache (a cada 10 minutos)
setInterval(() => {
  const now = Date.now();
  const expiredKeys: string[] = [];

  for (const [key, value] of responseCache.entries()) {
    if (now - value.timestamp > 600000) { // 10 minutos
      expiredKeys.push(key);
    }
  }

  expiredKeys.forEach(key => {
    responseCache.delete(key);
  });

  if (expiredKeys.length > 0) {
    console.log(`🧹 Cache limpo: ${expiredKeys.length} itens removidos`);
  }
}, 600000); // 10 minutos