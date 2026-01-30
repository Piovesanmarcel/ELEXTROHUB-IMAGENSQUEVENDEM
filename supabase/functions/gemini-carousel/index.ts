import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-content-type-options, x-frame-options',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Helper para converter URL em Base64
async function urlToBase64(url: string): Promise<{ data: string; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha ao baixar imagem: ${url}`);
  }
  
  const blob = await response.blob();
  const mimeType = blob.type || 'image/png';
  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  // Processar em chunks para evitar "Maximum call stack size exceeded"
  const chunkSize = 8192;
  let binary = '';
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  
  return { data: btoa(binary), mimeType };
}

serve(async (req) => {
  console.log('🔍 [GEMINI CAROUSEL] Request method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 🔐 Verificar chave interna do worker - BLOQUEAR CHAMADAS DIRETAS
  const internalKey = req.headers.get('x-internal-worker-key');
  const expectedKey = Deno.env.get('INTERNAL_WORKER_SECRET');
  
  if (internalKey !== expectedKey) {
    console.log('❌ [GEMINI CAROUSEL] Acesso negado - use a fila de geração');
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Acesso negado. Use a fila de geração assíncrona.',
        code: 'USE_QUEUE'
      }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  console.log('✅ [GEMINI CAROUSEL] Acesso autorizado via worker');

  try {
    const { imageUrl } = await req.json();
    
    if (!imageUrl) {
      console.error('❌ [GEMINI CAROUSEL] imageUrl não fornecida');
      return new Response(
        JSON.stringify({ success: false, error: 'imageUrl é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const GOOGLE_GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GOOGLE_GEMINI_API_KEY) {
      console.error('❌ [GEMINI CAROUSEL] GOOGLE_GEMINI_API_KEY não configurada');
      return new Response(
        JSON.stringify({ success: false, error: 'API key não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('🎨 [GEMINI CAROUSEL] Iniciando geração com Gemini 2.5 Flash Image Preview');
    console.log('🎨 [GEMINI CAROUSEL] Image URL:', imageUrl.substring(0, 100));
    
    // Converter imagem para base64
    let imageBase64: string;
    let imageMimeType: string;
    
    if (imageUrl.startsWith('data:')) {
      // Já é base64
      const mimeMatch = imageUrl.match(/^data:([^;]+);base64,/);
      imageMimeType = mimeMatch?.[1] || 'image/png';
      imageBase64 = imageUrl.includes(',') ? imageUrl.split(',')[1] : imageUrl;
    } else {
      // É URL - converter
      const converted = await urlToBase64(imageUrl);
      imageBase64 = converted.data;
      imageMimeType = converted.mimeType;
    }
    
    console.log('📸 [GEMINI CAROUSEL] Imagem convertida, tamanho:', imageBase64.length, 'mime:', imageMimeType);
    
    // Prompt fixo otimizado para 4 imagens carrossel SEM TEXTO/CTA
    const FIXED_PROMPT = `CRIE 4 CENÁRIOS DE PUBLICIDADE DO PRODUTO EM FORMATO CARROSSEL.
- NÃO INSIRA QUALQUER TEXTO NA IMAGEM: sem CTA, sem palavras, letras, números, slogans, tipografia, logotipos, marcas d'água, selos ou banners.
- Somente a imagem publicitária do produto (visual puro), sem textos sobrepostos.
- Foque em composições visuais e fotográficas do produto, com iluminação profissional e estética comercial.
- Varie enquadramentos e ambientes para parecerem 4 cards consecutivos de um carrossel de redes sociais.
- Manter consistência do produto, sem deformações.`;
    
    // Chamar API do Gemini diretamente
    const requestBody = {
      contents: [{
        parts: [
          {
            text: FIXED_PROMPT
          },
          {
            inline_data: {
              mime_type: imageMimeType,
              data: imageBase64
            }
          }
        ]
      }],
      generationConfig: {
        responseModalities: ["image", "text"],
        temperature: 0.8,
        candidateCount: 1
      }
    };
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [GEMINI CAROUSEL] Gemini API error: ${response.status}`, errorText);
      
      // Passar erros específicos de rate limit
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit excedido' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: `Gemini API error: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const data = await response.json();
    console.log('📦 [GEMINI CAROUSEL] Resposta do Gemini recebida');
    console.log('📊 [GEMINI CAROUSEL] Response status:', response.status);
    
    // Extrair as imagens do response (formato Gemini direto)
    const images: string[] = [];
    const candidates = data.candidates || [];
    
    for (const candidate of candidates) {
      const parts = candidate.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          // Converter para data URL
          const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          images.push(dataUrl);
        }
      }
    }
    
    console.log(`📊 [GEMINI CAROUSEL] Images array length: ${images.length}`);
    if (images.length > 0) {
      console.log('📊 [GEMINI CAROUSEL] First image format:', images[0].substring(0, 50));
    }
    
    if (images.length === 0) {
      console.error('❌ [GEMINI CAROUSEL] Nenhuma imagem foi gerada');
      console.log('📊 [GEMINI CAROUSEL] Response data:', JSON.stringify(data).substring(0, 500));
      return new Response(
        JSON.stringify({ success: false, error: 'Nenhuma imagem foi gerada pela IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Capturar usage do Gemini para cálculo de custos
    const usageMetadata = data.usageMetadata || {};
    const promptTokens = usageMetadata.promptTokenCount || 0;
    const completionTokens = usageMetadata.candidatesTokenCount || 0;
    const totalTokens = usageMetadata.totalTokenCount || 0;
    
    // Preços OFICIAIS Gemini 2.5 Flash Image Preview (Fonte: ai.google.dev/pricing)
    // Texto→Imagem: $0.039 por imagem gerada (1024x1024)
    const PRICE_PER_IMAGE_USD = 0.039; // Preço oficial por imagem
    const USD_TO_BRL = 6.10;
    
    const imagesCount = images.length;
    const totalCostUSD = imagesCount * PRICE_PER_IMAGE_USD;
    const totalCostBRL = totalCostUSD * USD_TO_BRL;
    
    console.log(`💰 [GEMINI CAROUSEL] Custo estimado: ${imagesCount} imagens = $${totalCostUSD.toFixed(4)} / R$${totalCostBRL.toFixed(2)}`);
    console.log(`📊 [GEMINI CAROUSEL] Tokens: prompt=${promptTokens}, completion=${completionTokens}, total=${totalTokens}`);
    
    console.log(`✅ [GEMINI CAROUSEL] ${images.length} imagens geradas com sucesso`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        images,
        usage: {
          model: 'gemini-2.5-flash-image-preview',
          promptTokens,
          completionTokens,
          totalTokens,
          imagesGenerated: imagesCount,
          estimatedCostUSD: totalCostUSD,
          estimatedCostBRL: totalCostBRL,
          costPerImageUSD: PRICE_PER_IMAGE_USD,
          costPerImageBRL: PRICE_PER_IMAGE_USD * USD_TO_BRL,
          usdToBrlRate: USD_TO_BRL
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('❌ [GEMINI CAROUSEL] Erro inesperado:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erro inesperado' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
