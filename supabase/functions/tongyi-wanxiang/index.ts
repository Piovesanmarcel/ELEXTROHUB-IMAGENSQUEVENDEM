import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-content-type-options, x-frame-options',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  
  console.log(`🧠 [${requestId}] TONGYI WANXIANG REQUEST:`, {
    method: req.method,
    timestamp: new Date().toISOString()
  });

  if (req.method === 'OPTIONS') {
    console.log(`✅ [${requestId}] CORS preflight handled successfully`);
    return new Response(null, { 
      headers: corsHeaders,
      status: 200
    });
  }

  // 🔐 Verificar chave interna do worker - BLOQUEAR CHAMADAS DIRETAS
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  console.log(`✅ [${requestId}] Acesso autorizado via worker`);

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      error: 'Método não permitido'
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.json();
    const { action, model, prompt, image, imageUrl } = body;

    // Log detalhado dos parâmetros recebidos
    console.log(`📋 [${requestId}] Parâmetros recebidos:`, {
      action,
      model,
      hasPrompt: !!prompt,
      promptLength: prompt?.length,
      hasImage: !!image,
      imageLength: image?.length,
      hasImageUrl: !!imageUrl,
      imageUrlPreview: imageUrl ? imageUrl.substring(0, 100) + '...' : null,
      imageStartsWith: image ? image.substring(0, 30) : null,
      imageUrlStartsWith: imageUrl ? imageUrl.substring(0, 30) : null
    });

    // Validações básicas - aceitar tanto image (base64) quanto imageUrl (URL)
    if (!action || !model || !prompt || (!image && !imageUrl)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Parâmetros obrigatórios: action, model, prompt, e (image OU imageUrl)'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🚀 [${requestId}] Processando ${action} com ${model}`);
    console.log(`📸 [${requestId}] Usando ${image ? 'base64' : 'URL'}: ${imageUrl ? imageUrl.substring(0, 100) + '...' : 'base64 fornecido'}`);

    let result;
    if (action === 'analyze' && model === 'qwen-vl-max') {
      result = await processAnalyze(requestId, image, imageUrl, prompt);
    } else if (action === 'edit' && model === 'qwen-image-edit') {
      result = await processEdit(requestId, image, imageUrl, prompt);
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Ação ou modelo inválido'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`💥 [${requestId}] ERRO:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: `Erro na função: ${error instanceof Error ? error.message : String(error)}`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function processAnalyze(requestId: string, image: string | undefined, imageUrl: string | undefined, prompt: string) {
  const maxRetries = 2;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 [${requestId}] Tentativa ${attempt}/${maxRetries} - Processando análise`);
      
      // Verificar se a API key está disponível
      const apiKey = Deno.env.get('QWEN_VL_MAX_API_KEY');
      console.log(`🔑 [${requestId}] API Key disponível:`, !!apiKey);
      
      if (!apiKey) {
        throw new Error('API Key não configurada');
      }

      let base64Data: string;
      let imageFormat: string = 'jpeg'; // Default
      
      // Se imageUrl foi fornecida, fazer download
      if (imageUrl) {
        console.log(`🌐 [${requestId}] Fazendo download da imagem via URL: ${imageUrl}`);
        
        try {
          const imageResponse = await fetch(imageUrl);
          
          if (!imageResponse.ok) {
            throw new Error(`Erro no download: ${imageResponse.status} - ${imageResponse.statusText}`);
          }
          
          const imageBlob = await imageResponse.blob();
          console.log(`📦 [${requestId}] Imagem baixada:`, {
            size: imageBlob.size,
            type: imageBlob.type,
            sizeKB: Math.round(imageBlob.size / 1024)
          });
          
          // Detectar formato da imagem
          if (imageBlob.type === 'image/png') {
            imageFormat = 'png';
          } else if (imageBlob.type === 'image/webp') {
            imageFormat = 'webp';
          } else {
            imageFormat = 'jpeg'; // Force to JPEG for compatibility
          }
          
          // Converter blob para base64
          const buffer = await imageBlob.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          base64Data = btoa(binary);
          
          console.log(`🔄 [${requestId}] Conversão concluída:`, {
            originalFormat: imageBlob.type,
            detectedFormat: imageFormat,
            base64Length: base64Data.length,
            sampleStart: base64Data.substring(0, 20)
          });
          
        } catch (downloadError) {
          console.error(`❌ [${requestId}] Erro no download da imagem:`, downloadError);
          throw new Error(`Falha no download da imagem: ${downloadError instanceof Error ? downloadError.message : String(downloadError)}`);
        }
        
      } else if (image) {
        // Usar base64 fornecido diretamente
        console.log(`📄 [${requestId}] Processando imagem base64 fornecida`);
        console.log(`🔍 [${requestId}] Tipo de entrada:`, {
          isString: typeof image === 'string',
          length: image?.length,
          startsWithData: image?.startsWith('data:'),
          startsWithHttp: image?.startsWith('http'),
          first50Chars: image?.substring(0, 50)
        });
        
        let rawBase64 = image;
        
        // Se é uma URL HTTPS, fazer download
        if (image.startsWith('https://')) {
          console.log(`🌐 [${requestId}] Fazendo download da URL:`, image);
          
          try {
            const imageResponse = await fetch(image);
            
            if (!imageResponse.ok) {
              throw new Error(`Erro no download: ${imageResponse.status} - ${imageResponse.statusText}`);
            }
            
            const imageBlob = await imageResponse.blob();
            console.log(`📦 [${requestId}] Imagem baixada via URL:`, {
              size: imageBlob.size,
              type: imageBlob.type,
              sizeKB: Math.round(imageBlob.size / 1024)
            });
            
            // Converter blob para base64
            const buffer = await imageBlob.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            rawBase64 = btoa(binary);
            imageFormat = 'jpeg'; // Forçar JPEG para compatibilidade
            
            console.log(`🔄 [${requestId}] URL convertida para base64:`, {
              base64Length: rawBase64.length,
              format: imageFormat
            });
            
          } catch (downloadError) {
            console.error(`❌ [${requestId}] Erro no download da URL:`, downloadError);
            throw new Error(`Falha no download da URL: ${downloadError instanceof Error ? downloadError.message : String(downloadError)}`);
          }
        }
        // Se tem prefixo data URL, extrair informações e remover
        else if (image.startsWith('data:image/')) {
          const dataUrlMatch = image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
          if (dataUrlMatch) {
            imageFormat = dataUrlMatch[1].toLowerCase();
            rawBase64 = dataUrlMatch[2];
            console.log(`🎯 [${requestId}] Data URL detectado: formato=${imageFormat}, base64Length=${rawBase64.length}`);
          } else {
            // Fallback: remover prefixo genérico
            rawBase64 = image.replace(/^data:image\/[^;]+;base64,/, '');
            console.log(`⚠️ [${requestId}] Removendo prefixo genérico, base64Length=${rawBase64.length}`);
          }
        }
        
        // Limpar e normalizar o base64
        base64Data = rawBase64
          .replace(/\s+/g, '') // Remover espaços
          .replace(/[^A-Za-z0-9+/=]/g, ''); // Remover caracteres inválidos
        
        // Adicionar padding se necessário
        while (base64Data.length % 4 !== 0) {
          base64Data += '=';
        }
        
        // Forçar formato JPEG para máxima compatibilidade
        if (imageFormat !== 'jpeg' && imageFormat !== 'jpg') {
          console.log(`⚠️ [${requestId}] Forçando formato JPEG para compatibilidade (era: ${imageFormat})`);
          imageFormat = 'jpeg';
        }
        
        console.log(`📏 [${requestId}] Base64 processado:`, {
          originalLength: image.length,
          cleanedLength: base64Data.length,
          format: imageFormat,
          paddingAdded: base64Data.endsWith('='),
          firstChars: base64Data.substring(0, 20),
          lastChars: base64Data.substring(base64Data.length - 20)
        });
        
      } else {
        throw new Error('Nem image nem imageUrl fornecidos');
      }
    
      // Timeout de 180s para análise (3 minutos)
      console.log(`🔍 [${requestId}] Iniciando análise com timeout de 180s (tentativa ${attempt})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`⏰ [${requestId}] TIMEOUT após 180s - abortando requisição de análise (tentativa ${attempt})`);
        controller.abort();
      }, 180000); // 180s timeout (3 minutos)

      console.log(`🌐 [${requestId}] Fazendo requisição para API Qwen (análise - tentativa ${attempt})`);
      console.log(`📊 [${requestId}] Dados da requisição:`, {
        model: 'qwen-vl-max',
        base64Length: base64Data.length,
        promptLength: prompt.length,
        imageFormat: imageFormat,
        imageDataPrefix: `data:image/jpeg;base64`, // Sempre usar JPEG
        base64Sample: base64Data.substring(0, 50) + '...'
      });

      const requestBody = {
        model: 'qwen-vl-max',
        input: {
          messages: [
            {
              role: 'user',
              content: [
                {
                  image: `data:image/jpeg;base64,${base64Data}`
                },
                {
                  text: prompt
                }
              ]
            }
          ]
        }
      };

      console.log(`📤 [${requestId}] Enviando requisição com estrutura:`, {
        model: requestBody.model,
        messageCount: requestBody.input.messages.length,
        contentItems: requestBody.input.messages[0].content.length,
        hasImage: !!requestBody.input.messages[0].content[0].image,
        hasText: !!requestBody.input.messages[0].content[1].text,
        imagePrefix: requestBody.input.messages[0].content[0].image?.substring(0, 30)
      });

      const response = await fetch('https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        // Verificar se é um erro da API Qwen (500) que pode ser recuperável
        const is500Error = response.status === 500;
        const isApiTimeout = data.message?.includes('timed out') || data.message?.includes('timeout') || 
                            data.error?.includes('timed out') || data.error?.includes('timeout');
        
        if ((is500Error || isApiTimeout) && attempt < maxRetries) {
          console.log(`⚠️ [${requestId}] Erro 500/timeout na análise (tentativa ${attempt}), tentando novamente em ${attempt * 2}s...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 2000)); // Wait 2s, 4s
          continue; // Retry
        }
        
        throw new Error(`API Error (${response.status}): ${data.message || data.error || JSON.stringify(data)}`);
      }

      let responseText = '';
      if (data.output?.choices?.[0]?.message?.content) {
        const content = data.output.choices[0].message.content;
        if (Array.isArray(content)) {
          responseText = content.map(item => typeof item === 'object' && item.text ? item.text : String(item)).join('\n');
        } else {
          responseText = String(content);
        }
      }

      console.log(`✅ [${requestId}] Análise concluída com sucesso na tentativa ${attempt}`);
      return {
        success: true,
        data: {
          response: responseText,
          task_id: data.request_id
        }
      };

    } catch (error) {
      console.error(`💥 [${requestId}] Erro na análise (tentativa ${attempt}):`, {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        cause: error instanceof Error ? error.cause : undefined
      });
      
      if (error instanceof Error && error.name === 'AbortError') {
        if (attempt < maxRetries) {
          console.log(`⚠️ [${requestId}] Timeout na análise (tentativa ${attempt}), tentando novamente...`);
          continue; // Retry on timeout
        }
        return {
          success: false,
          error: 'Timeout - a API Qwen demorou mais que 180s (3 minutos) para responder na análise após múltiplas tentativas'
        };
      }
      
      // Verificar se é um erro que vale a pena tentar novamente
      const errorMsg = error instanceof Error ? error.message : String(error);
      const isRetryableError = errorMsg.includes('timed out') ||
                              errorMsg.includes('timeout') ||
                              errorMsg.includes('500');
      
      if (isRetryableError && attempt < maxRetries) {
        console.log(`⚠️ [${requestId}] Erro recuperável na análise (tentativa ${attempt}), tentando novamente em ${attempt * 2}s...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        continue; // Retry
      }
      
      // Se é a última tentativa ou erro não recuperável, retornar erro
      if (attempt === maxRetries) {
        return {
          success: false,
          error: `Erro na análise após ${maxRetries} tentativas: ${error instanceof Error ? error.message : String(error)}`
        };
      }
      
      // Para outros erros, não tentar novamente
      return {
        success: false,
        error: `Erro na análise: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  // Fallback (não deveria chegar aqui)
  return {
    success: false,
    error: 'Erro inesperado no processamento da análise'
  };
}

async function processEdit(requestId: string, image: string | undefined, imageUrl: string | undefined, prompt: string) {
  const maxRetries = 2;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`✏️ [${requestId}] Tentativa ${attempt}/${maxRetries} - Processando edição`);
      
      // Usar a mesma chave do QWEN_VL_MAX para edição
      const apiKey = Deno.env.get('QWEN_VL_MAX_API_KEY');
      console.log(`🔑 [${requestId}] API Key disponível:`, !!apiKey);
      
      if (!apiKey) {
        throw new Error('API Key não configurada');
      }

      // Processar imagem da mesma forma que na análise que funciona
      console.log(`📸 [${requestId}] Usando base64:`, image ? 'base64 fornecido' : 'URL fornecida');
      
      let imageFormat = 'jpeg'; // Sempre usar JPEG para compatibilidade
      console.log(`🔍 [${requestId}] Tipo de entrada:`, {
        isString: typeof image === 'string',
        length: image?.length,
        startsWithData: image?.startsWith('data:'),
        startsWithHttp: image?.startsWith('http'),
        first50Chars: image?.substring(0, 50)
      });
      
      let rawBase64 = image;
      
      // Se é uma URL HTTPS, fazer download (mesmo código da análise)
      if (image && image.startsWith('https://')) {
        console.log(`🌐 [${requestId}] Fazendo download da URL:`, image);
        
        try {
          const imageResponse = await fetch(image);
          
          if (!imageResponse.ok) {
            throw new Error(`Erro no download: ${imageResponse.status} - ${imageResponse.statusText}`);
          }
          
          const imageBlob = await imageResponse.blob();
          console.log(`📦 [${requestId}] Imagem baixada via URL:`, {
            size: imageBlob.size,
            type: imageBlob.type,
            sizeKB: Math.round(imageBlob.size / 1024)
          });
          
          // Converter blob para base64
          const buffer = await imageBlob.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          rawBase64 = btoa(binary);
          imageFormat = 'jpeg'; // Forçar JPEG para compatibilidade
          
          console.log(`🔄 [${requestId}] URL convertida para base64:`, {
            base64Length: rawBase64.length,
            format: imageFormat
          });
          
        } catch (downloadError) {
          console.error(`❌ [${requestId}] Erro no download da URL:`, downloadError);
          throw new Error(`Falha no download da URL: ${downloadError instanceof Error ? downloadError.message : String(downloadError)}`);
        }
      }
      // Se tem prefixo data URL, extrair informações e remover
      else if (image && image.startsWith('data:image/')) {
        const dataUrlMatch = image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
        if (dataUrlMatch) {
          imageFormat = dataUrlMatch[1].toLowerCase();
          rawBase64 = dataUrlMatch[2];
        } else {
          rawBase64 = image.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
        }
      }
      
      if (!rawBase64) {
        throw new Error('Imagem não fornecida ou inválida');
      }
      
      // Limpar e normalizar base64 (igual à análise)
      let base64Data = rawBase64.replace(/[^A-Za-z0-9+/=]/g, '');
      
      // Adicionar padding se necessário
      while (base64Data.length % 4 !== 0) {
        base64Data += '=';
      }
      
      // Forçar formato JPEG para máxima compatibilidade
      if (imageFormat !== 'jpeg' && imageFormat !== 'jpg') {
        console.log(`⚠️ [${requestId}] Forçando formato JPEG para compatibilidade (era: ${imageFormat})`);
        imageFormat = 'jpeg';
      }
      
      console.log(`📏 [${requestId}] Base64 processado:`, {
        originalLength: image?.length || 0,
        cleanedLength: base64Data.length,
        format: imageFormat,
        paddingAdded: base64Data.endsWith('='),
        firstChars: base64Data.substring(0, 20),
        lastChars: base64Data.substring(base64Data.length - 20)
      });

      // Usar estrutura de request IDÊNTICA à análise que funciona
      console.log(`📊 [${requestId}] Dados da requisição:`, {
        model: 'qwen-image-edit',
        base64Length: base64Data.length,
        promptLength: prompt.length,
        imageFormat: imageFormat,
        imageDataPrefix: `data:image/jpeg;base64`,
        base64Sample: base64Data.substring(0, 50) + '...'
      });

      // Para edição de imagem, usar formato messages como na análise
      const requestBody = {
        model: 'qwen-image-edit',
        input: {
          messages: [
            {
              role: 'user',
              content: [
                {
                  image: `data:image/jpeg;base64,${base64Data}`
                },
                {
                  text: prompt
                }
              ]
            }
          ]
        },
        parameters: {
          watermark: false,
          size: "1024*1024"
        }
      };

      console.log(`📤 [${requestId}] Enviando requisição com estrutura:`, {
        model: requestBody.model,
        messageCount: requestBody.input.messages.length,
        contentItems: requestBody.input.messages[0].content.length,
        hasImage: !!requestBody.input.messages[0].content[0].image,
        hasText: !!requestBody.input.messages[0].content[1].text,
        imagePrefix: requestBody.input.messages[0].content[0].image?.substring(0, 30),
        parameters: requestBody.parameters
      });
      
      // Timeout reduzido para 120s (2 minutos) para edição
      console.log(`✏️ [${requestId}] Iniciando edição com timeout de 120s (tentativa ${attempt})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`⏰ [${requestId}] TIMEOUT após 120s - abortando requisição (tentativa ${attempt})`);
        controller.abort();
      }, 120000); // 120s timeout (2 minutos)

      console.log(`🌐 [${requestId}] Fazendo requisição para API Qwen (edição - tentativa ${attempt})`);
      
      const response = await fetch('https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      console.log(`📊 [${requestId}] Resposta da API (detalhada):`, {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        hasOutput: !!data.output,
        hasChoices: !!data.output?.choices?.[0],
        hasMessage: !!data.output?.choices?.[0]?.message,
        hasContent: !!data.output?.choices?.[0]?.message?.content,
        contentLength: data.output?.choices?.[0]?.message?.content?.length,
        hasImage: !!data.output?.choices?.[0]?.message?.content?.[0]?.image,
        responseKeys: Object.keys(data || {}),
        outputKeys: data.output ? Object.keys(data.output) : [],
        choicesLength: data.output?.choices?.length || 0
      });
      
      // Log da resposta completa para debug
      console.log(`🔍 [${requestId}] Resposta completa da API:`, JSON.stringify(data, null, 2));

      if (!response.ok) {
        // Verificar se é um erro da API Qwen (500) que pode ser recuperável
        const is500Error = response.status === 500;
        const is429Error = response.status === 429; // Rate limit
        const is400Error = response.status === 400;
        const isApiTimeout = data.message?.includes('timed out') || data.message?.includes('timeout') || 
                            data.error?.includes('timed out') || data.error?.includes('timeout') ||
                            data.code === 'RequestTimeOut';
        
        if ((is500Error || isApiTimeout || is429Error) && attempt < maxRetries) {
          const waitTime = attempt === 1 ? 3000 : attempt * 3000; // 3s, 6s, 9s
          console.log(`⚠️ [${requestId}] Erro ${response.status}/timeout na tentativa ${attempt}, tentando novamente em ${waitTime/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue; // Retry
        }
        
        // Log detalhado do erro para debugging
        console.error(`💥 [${requestId}] Erro HTTP ${response.status}:`, {
          status: response.status,
          statusText: response.statusText,
          responseData: JSON.stringify(data, null, 2)
        });
        
        throw new Error(`Falha ao enviar uma requisição para a Função Edge (${response.status}): ${data.message || data.error || data.code || 'Erro na API'}`);
      }

      // Para qwen-image-edit, a resposta vem diretamente em data.output.image_url
      if (data.output?.image_url) {
        console.log(`✅ [${requestId}] Imagem editada gerada com sucesso na tentativa ${attempt}`);
        
        return {
          success: true,
          data: {
            image_url: data.output.image_url,
            task_id: data.request_id,
            response: `Imagem editada com sucesso usando Qwen-Image-Edit`
          }
        };
      }
      
      if (data.output?.choices?.[0]?.message?.content) {
        // Verificar diferentes formatos de conteúdo (fallback)
        const content = data.output.choices[0].message.content;
        console.log(`🔍 [${requestId}] Analisando conteúdo:`, {
          isArray: Array.isArray(content),
          contentType: typeof content,
          contentLength: content?.length,
          firstItemType: Array.isArray(content) ? typeof content[0] : 'N/A',
          hasImageInFirstItem: Array.isArray(content) && content[0]?.image ? true : false
        });
        
        // Se é array, procurar por imagem
        if (Array.isArray(content)) {
          for (let i = 0; i < content.length; i++) {
            if (content[i]?.image) {
              console.log(`✅ [${requestId}] Imagem encontrada no índice ${i} da tentativa ${attempt}`);
              return {
                success: true,
                data: {
                  image_url: content[i].image,
                  task_id: data.request_id,
                  response: `Imagem editada com sucesso usando Qwen-Image-Edit`
                }
              };
            }
          }
        }
        
        // Se é string ou tem propriedade image diretamente
        if (typeof content === 'string' && content.startsWith('data:image/')) {
          console.log(`✅ [${requestId}] Imagem como string encontrada na tentativa ${attempt}`);
          return {
            success: true,
            data: {
              image_url: content,
              task_id: data.request_id,
              response: `Imagem editada com sucesso usando Qwen-Image-Edit`
            }
          };
        }
        
        // Verificar se tem image na raiz do content
        if (content.image) {
          console.log(`✅ [${requestId}] Imagem na raiz do content encontrada na tentativa ${attempt}`);
          return {
            success: true,
            data: {
              image_url: content.image,
              task_id: data.request_id,
              response: `Imagem editada com sucesso usando Qwen-Image-Edit`
            }
          };
        }
      }

      // Se não tem imagem na resposta, verificar outros formatos possíveis
      console.log(`⚠️ [${requestId}] Formato de resposta inesperado na tentativa ${attempt}:`);
      console.log(`📊 [${requestId}] Estrutura completa da resposta:`, JSON.stringify(data, null, 2));
      
      // Verificar se tem erro específico na resposta
      if (data.error || data.message) {
        throw new Error(`API retornou erro: ${data.error || data.message}`);
      }
      
      throw new Error('Resposta da API não contém imagem editada');

    } catch (error) {
      console.error(`💥 [${requestId}] Erro na edição (tentativa ${attempt}):`, {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? (error.stack?.substring(0, 200) + '...') : undefined, // Limitar stack trace
        cause: error instanceof Error ? error.cause : undefined,
        attempt: attempt,
        maxRetries: maxRetries
      });
      
      const errorMsg = error instanceof Error ? error.message : String(error);
      if ((error instanceof Error && error.name === 'AbortError') || errorMsg.includes('timeout')) {
        if (attempt < maxRetries) {
          console.log(`⚠️ [${requestId}] Timeout na tentativa ${attempt}, tentando novamente em ${attempt * 2}s...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));
          continue; // Retry on timeout
        }
        return {
          success: false,
          error: 'Timeout - a API Qwen demorou mais que 300s (5 minutos) para responder na edição após múltiplas tentativas'
        };
      }
      
      // Verificar se é um erro que vale a pena tentar novamente
      const errorMsg2 = error instanceof Error ? error.message : String(error);
      const isRetryableError = errorMsg2.includes('timed out') ||
                              errorMsg2.includes('timeout') ||
                              errorMsg2.includes('500');
      
      if (isRetryableError && attempt < maxRetries) {
        console.log(`⚠️ [${requestId}] Erro recuperável na tentativa ${attempt}, tentando novamente em ${attempt * 2}s...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        continue; // Retry
      }
      
      // Se é a última tentativa ou erro não recuperável, retornar erro
      if (attempt === maxRetries) {
        return {
          success: false,
          error: `Erro na edição após ${maxRetries} tentativas: ${error instanceof Error ? error.message : String(error)}`
        };
      }
      
      // Para outros erros, não tentar novamente
      return {
        success: false,
        error: `Erro na edição: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  // Fallback (não deveria chegar aqui)
  return {
    success: false,
    error: 'Erro inesperado no processamento'
  };
}