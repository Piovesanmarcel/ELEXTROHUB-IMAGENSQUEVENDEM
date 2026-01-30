import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-content-type-options, x-frame-options, x-xss-protection',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Função para converter Blob URL em Data URI
async function convertBlobToDataURI(blobUrl: string): Promise<string> {
  try {
    console.log('🔄 Convertendo Blob URL para Data URI:', blobUrl.substring(0, 50) + '...');
    
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`Fetch falhou: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Detectar MIME type pelos primeiros bytes
    let mimeType = 'image/jpeg'; // default
    if (bytes[0] === 0x89 && bytes[1] === 0x50) {
      mimeType = 'image/png';
    } else if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
      mimeType = 'image/jpeg';
    } else if (bytes[0] === 0x52 && bytes[1] === 0x49) {
      mimeType = 'image/webp';
    }
    
    // Converter para base64
    const base64 = btoa(String.fromCharCode(...bytes));
    const dataUri = `data:${mimeType};base64,${base64}`;
    
    console.log('✅ Blob convertido para Data URI:', {
      originalSize: arrayBuffer.byteLength,
      mimeType,
      base64Length: base64.length
    });
    
    return dataUri;
  } catch (error) {
    const err = error as Error;
    console.error('❌ Erro ao converter Blob URL:', error);
    throw new Error(`Falha na conversão Blob→DataURI: ${err.message}`);
  }
}

serve(async (req): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    // ✅ Prioridade: RUNWARE_API_KEY2 > RUNWARE_API_KEY
    const apiKey = Deno.env.get('RUNWARE_API_KEY2') || Deno.env.get('RUNWARE_API_KEY');

    if (!apiKey) {
      throw new Error('RUNWARE_API_KEY2 ou RUNWARE_API_KEY não configurada. Configure a chave da API do Runware.');
    }
    
    console.log('🔑 Usando chave:', Deno.env.get('RUNWARE_API_KEY2') ? 'RUNWARE_API_KEY2' : 'RUNWARE_API_KEY');

    // Enhanced logging with request ID
    const requestId = crypto.randomUUID().substring(0, 8);
    console.log(`🚀 [${requestId}] Runware API Request:`, { 
      action, 
      params: {
        ...params,
        image: params.image ? `[IMAGEM - ${params.image.substring(0, 50)}...]` : 'Nenhuma imagem'
      }
    });

    // VALIDAÇÃO CRÍTICA: Verificar imagem para background removal
    if (action === 'remove-background') {
      if (!params.image) {
        console.error('❌ ERRO CRÍTICO: Nenhuma imagem foi enviada para remove-background');
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Imagem é obrigatória para background removal' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('🖼️ BACKGROUND REMOVAL - Tipo de imagem recebida:', {
        isBase64: params.image.startsWith('/9j/') || params.image.startsWith('iVBORw0KGgo'),
        isDataURI: params.image.startsWith('data:image/'),
        isURL: params.image.startsWith('http'),
        length: params.image.length
      });
    }

    // Processar diferentes ações usando REST API
    let requestBody: any;
    
    if (action === 'remove-background') {
      console.log('🖼️ [BACKGROUND REMOVAL] Processando imagem...');
      
      // Processar a imagem baseado no formato recebido
      let processedImage = params.image;
      
      // NOVO: Detectar e converter Blob URLs
      if (params.image.startsWith('blob:')) {
        console.log('🔄 [BACKGROUND REMOVAL] Detectado Blob URL, convertendo...');
        processedImage = await convertBlobToDataURI(params.image);
      }
      // Se é base64 puro (JPEG começa com /9j/, PNG com iVBORw0KGgo), adicionar data URI
      else if (params.image.startsWith('/9j/') || params.image.startsWith('iVBORw0KGgo')) {
        const mimeType = params.image.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
        processedImage = `data:${mimeType};base64,${params.image}`;
        console.log('✅ Base64 convertido para data URI');
      }
      
      // Gerar taskUUID v4 válido para REST API usando Deno
      const taskUUID = globalThis.crypto.randomUUID();
      
      // Log para debug do UUID gerado
      console.log('🔑 UUID v4 gerado:', taskUUID);
      console.log('🔍 UUID format check:', {
        length: taskUUID.length,
        pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(taskUUID),
        value: taskUUID
      });
      
      // Estrutura REST API conforme documentação curl
      requestBody = [{
        taskType: "imageBackgroundRemoval",
        taskUUID: taskUUID,
        inputImage: processedImage,
        outputType: ["URL"], // Array conforme documentação
        outputFormat: params.outputFormat || "PNG",
        model: params.model || "runware:110@1", // Bria RMBG 2.0
        includeCost: true
      }];

      console.log('📤 [REMOVE BACKGROUND] Estrutura REST API conforme documentação:', {
        taskType: requestBody[0].taskType,
        taskUUID: requestBody[0].taskUUID,
        inputImageType: processedImage.startsWith('data:') ? 'dataURI' : (processedImage.startsWith('http') ? 'URL' : 'base64'),
        outputType: requestBody[0].outputType, // Array ["URL"]
        outputFormat: requestBody[0].outputFormat,
        model: requestBody[0].model,
        includeCost: requestBody[0].includeCost
      });
    } else if (action === 'upscale-image') {
      console.log('📈 [UPSCALE IMAGE] Processando upscale...');
      
      if (!params.image) {
        console.error('❌ ERRO: Nenhuma imagem foi enviada para upscale');
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Imagem é obrigatória para upscale' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Processar a imagem baseado no formato recebido
      let processedImage = params.image;
      
      // NOVO: Detectar e converter Blob URLs
      if (params.image.startsWith('blob:')) {
        console.log('🔄 [UPSCALE] Detectado Blob URL, convertendo...');
        processedImage = await convertBlobToDataURI(params.image);
      }
      // Se é base64 puro, adicionar data URI
      else if (params.image.startsWith('/9j/') || params.image.startsWith('iVBORw0KGgo')) {
        const mimeType = params.image.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
        processedImage = `data:${mimeType};base64,${params.image}`;
        console.log('✅ Base64 convertido para data URI para upscale');
      }
      
      const taskUUID = globalThis.crypto.randomUUID();
      console.log('🔑 UUID gerado para upscale:', taskUUID);
      
      // Estrutura REST API para upscale com modelo configurável
      requestBody = [{
        taskType: "imageUpscale",
        taskUUID: taskUUID,
        inputImage: processedImage,
        outputType: ["URL"], // Array conforme documentação
        outputFormat: params.outputFormat || "JPEG",
        outputQuality: params.outputQuality || 85, // ✅ Qualidade 85 por padrão
        upscaleFactor: params.factor || 2,
        model: params.model || "runware:504@1", // Modelo de upscale configurável
        includeCost: true
      }];

      console.log('📤 [UPSCALE] Estrutura REST API:', {
        taskType: requestBody[0].taskType,
        taskUUID: requestBody[0].taskUUID,
        upscaleFactor: requestBody[0].upscaleFactor,
        outputFormat: requestBody[0].outputFormat,
        outputQuality: requestBody[0].outputQuality, // ✅ Log da qualidade
        model: requestBody[0].model
      });
    } else if (action === 'text-to-image') {
      console.log('🎨 [TEXT TO IMAGE] Processando geração...');
      
      if (!params.prompt) {
        console.error('❌ ERRO: Nenhum prompt foi enviado para text-to-image');
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Prompt é obrigatório para text-to-image' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const taskUUID = globalThis.crypto.randomUUID();
      console.log('🔑 UUID gerado para text-to-image:', taskUUID);
      
      // Estrutura REST API para text-to-image
      requestBody = [{
        taskType: "imageInference",
        taskUUID: taskUUID,
        positivePrompt: params.prompt,
        model: params.model || "runware:100@1",
        width: params.width || 1024,
        height: params.height || 1024,
        numberResults: params.numberResults || 1,
        outputFormat: params.outputFormat || "JPEG",
        CFGScale: params.cfgScale || 2.5,
        steps: params.steps || 30,
        includeCost: true
      }];

      console.log('📤 [TEXT TO IMAGE] Estrutura REST API:', {
        taskType: requestBody[0].taskType,
        taskUUID: requestBody[0].taskUUID,
        positivePrompt: requestBody[0].positivePrompt.substring(0, 100) + '...',
        model: requestBody[0].model,
        dimensions: `${requestBody[0].width}x${requestBody[0].height}`
      });
    } else if (action === 'image-to-image') {
      console.log('🖼️ [IMAGE TO IMAGE] Processando transformação...');
      
      if (!params.prompt || !params.image) {
        console.error('❌ ERRO: Prompt e imagem são obrigatórios para image-to-image');
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Prompt e imagem são obrigatórios para image-to-image' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Usar a imagem diretamente se já é uma URL
      let processedImage = params.image;
      
      // NOVO: Detectar e converter Blob URLs
      if (params.image.startsWith('blob:')) {
        console.log('🔄 [IMAGE TO IMAGE] Detectado Blob URL, convertendo...');
        processedImage = await convertBlobToDataURI(params.image);
      }
      // Se é base64 puro, adicionar data URI
      else if (params.image.startsWith('/9j/') || params.image.startsWith('iVBORw0KGgo')) {
        const mimeType = params.image.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
        processedImage = `data:${mimeType};base64,${params.image}`;
        console.log('✅ Base64 convertido para data URI para image-to-image');
      }

      const taskUUID = globalThis.crypto.randomUUID();
      console.log('🔑 UUID gerado para image-to-image:', taskUUID);
      
      // Estrutura REST API correta usando referenceImages conforme documentação
      requestBody = [{
        taskType: "imageInference",
        taskUUID: taskUUID,
        numberResults: params.numberResults || 1,
        outputFormat: params.outputFormat || "JPEG",
        width: params.width || 1024,
        height: params.height || 1024,
        steps: params.steps || 28,
        CFGScale: params.cfgScale || 2.5,
        scheduler: params.scheduler || "Default",
        includeCost: true,
        outputType: ["URL"],
        referenceImages: [processedImage], // Array com a imagem de referência
        advancedFeatures: {
          guidanceEndStepPercentage: params.guidanceEndStepPercentage || 75
        },
        model: params.model || "runware:106@1",
        positivePrompt: params.prompt,
        negativePrompt: params.negativePrompt || ""
      }];

      console.log('📤 [IMAGE TO IMAGE] Estrutura REST API:', {
        taskType: requestBody[0].taskType,
        taskUUID: requestBody[0].taskUUID,
        positivePrompt: requestBody[0].positivePrompt.substring(0, 100) + '...',
        model: requestBody[0].model,
        referenceImages: requestBody[0].referenceImages ? `[${requestBody[0].referenceImages.length} imagem(ns)]` : 'Nenhuma',
        dimensions: `${requestBody[0].width}x${requestBody[0].height}`
      });
    } else if (action === 'enhance-image') {
      console.log('✨ [ENHANCE IMAGE] Processando melhoria...');
      
      if (!params.image) {
        console.error('❌ ERRO: Nenhuma imagem foi enviada para enhance');
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Imagem é obrigatória para enhance' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Processar a imagem baseado no formato recebido
      let processedImage = params.image;
      
      // NOVO: Detectar e converter Blob URLs
      if (params.image.startsWith('blob:')) {
        console.log('🔄 [ENHANCE] Detectado Blob URL, convertendo...');
        processedImage = await convertBlobToDataURI(params.image);
      }
      // Se é base64 puro, adicionar data URI
      else if (params.image.startsWith('/9j/') || params.image.startsWith('iVBORw0KGgo')) {
        const mimeType = params.image.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
        processedImage = `data:${mimeType};base64,${params.image}`;
        console.log('✅ Base64 convertido para data URI para enhance');
      }

      const taskUUID = globalThis.crypto.randomUUID();
      console.log('🔑 UUID gerado para enhance:', taskUUID);
      
      // Para enhance, usamos upscale com fator menor
      requestBody = [{
        taskType: "imageUpscale",
        taskUUID: taskUUID,
        inputImage: processedImage,
        outputType: "URL",
        outputFormat: params.outputFormat || "JPEG",
        upscaleFactor: 2,
        includeCost: true
      }];

      console.log('📤 [ENHANCE] Estrutura REST API:', {
        taskType: requestBody[0].taskType,
        taskUUID: requestBody[0].taskUUID,
        upscaleFactor: requestBody[0].upscaleFactor
      });
    } else if (action === 'inpaint-image') {
      console.log('🎭 [INPAINT IMAGE] Processando inpainting...');
      
      if (!params.prompt || !params.image || !params.mask) {
        console.error('❌ ERRO: Prompt, imagem e máscara são obrigatórios para inpaint');
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Prompt, imagem e máscara são obrigatórios para inpaint' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Processar imagem e máscara
      let processedImage = params.image;
      let processedMask = params.mask;
      
      // Processar imagem
      if (params.image.startsWith('blob:')) {
        console.log('🔄 [INPAINT] Detectado Blob URL na imagem, convertendo...');
        processedImage = await convertBlobToDataURI(params.image);
      } else if (params.image.startsWith('/9j/') || params.image.startsWith('iVBORw0KGgo')) {
        const mimeType = params.image.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
        processedImage = `data:${mimeType};base64,${params.image}`;
      }
      
      // Processar máscara
      if (params.mask.startsWith('blob:')) {
        console.log('🔄 [INPAINT] Detectado Blob URL na máscara, convertendo...');
        processedMask = await convertBlobToDataURI(params.mask);
      } else if (params.mask.startsWith('/9j/') || params.mask.startsWith('iVBORw0KGgo')) {
        const mimeType = params.mask.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
        processedMask = `data:${mimeType};base64,${params.mask}`;
      }

      const taskUUID = globalThis.crypto.randomUUID();
      console.log('🔑 UUID gerado para inpaint:', taskUUID);
      
      // Estrutura REST API para inpainting
      requestBody = [{
        taskType: "imageInference",
        taskUUID: taskUUID,
        positivePrompt: params.prompt,
        inputImage: processedImage,
        maskImage: processedMask,
        model: params.model || "dreamshaper_8",
        width: params.width || 1024,
        height: params.height || 1024,
        numberResults: params.numberResults || 1,
        outputFormat: params.outputFormat || "JPEG",
        CFGScale: params.cfgScale || 9,
        steps: params.steps || 30,
        strength: params.strength || 0.7,
        negativePrompt: params.negativePrompt || "",
        includeCost: true
      }];

      console.log('📤 [INPAINT] Estrutura REST API:', {
        taskType: requestBody[0].taskType,
        taskUUID: requestBody[0].taskUUID,
        positivePrompt: requestBody[0].positivePrompt.substring(0, 100) + '...',
        model: requestBody[0].model,
        strength: requestBody[0].strength
      });
    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Ação não suportada: ${action}. Actions disponíveis: 'text-to-image', 'image-to-image', 'upscale-image', 'remove-background', 'enhance-image', 'inpaint-image'.`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Exponential backoff retry utility for API calls
    const retryApiCall = async (maxRetries = 3): Promise<Response> => {
      let attempt = 0;
      
      while (attempt < maxRetries) {
        attempt++;
        
        try {
          console.log(`🌐 [${requestId}] Tentativa ${attempt}/${maxRetries} para REST API: https://api.runware.ai/v1`);
          
          const response = await fetch("https://api.runware.ai/v1", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody),
          });

          console.log(`📡 [${requestId}] Status da resposta:`, response.status, response.statusText);
          
          // Handle rate limiting and server errors with backoff
          if (response.status === 429 || response.status >= 500) {
            const backoffDelay = Math.pow(2, attempt - 1) * 1000 + Math.random() * 1000;
            console.log(`⏳ [${requestId}] Rate limit/server error, backing off ${Math.round(backoffDelay)}ms...`);
            
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, backoffDelay));
              continue;
            }
          }
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ [${requestId}] API error:`, response.status, errorText);
            
            // Return detailed error for debugging
            return new Response(JSON.stringify({ 
              success: false, 
              error: `API Error ${response.status}: ${response.statusText}`,
              details: errorText,
              requestId
            }), {
              status: response.status,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const result = await response.json();
          console.log(`🎯 [${requestId}] API success:`, result);
          
          return new Response(JSON.stringify({ 
            success: true, 
            data: result,
            requestId
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
          
        } catch (error) {
          console.error(`💥 [${requestId}] Network error attempt ${attempt}:`, error);
          
          if (attempt >= maxRetries) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return new Response(JSON.stringify({ 
              success: false, 
              error: `Network error after ${maxRetries} attempts: ${errorMessage}`,
              requestId
            }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          const backoffDelay = Math.pow(2, attempt - 1) * 1000;
          console.log(`⏳ [${requestId}] Retrying in ${backoffDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }

      // Fallback response - should never reach here
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Maximum retries exceeded',
        requestId
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    };
    
    return await retryApiCall();

  } catch (error) {
    console.error('💥 Erro na função:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});