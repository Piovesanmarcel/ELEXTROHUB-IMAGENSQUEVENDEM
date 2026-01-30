import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-worker-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function arrayBufferToBase64(buffer: Uint8Array): string {
  const chunkSize = 8192;
  let result = '';
  for (let i = 0; i < buffer.length; i += chunkSize) {
    const chunk = buffer.subarray(i, i + chunkSize);
    result += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(result);
}

interface ReplaceBackgroundRequest {
  image: string; // base64 or URL
  background_prompt: string;
  foreground_prompt?: string;
  negative_prompt?: string;
  preserve_original_subject?: number; // 0-1
  original_background_depth?: number; // 0-1
  keep_original_background?: boolean;
  light_source_direction?: string;
  light_source_strength?: number; // 0-1
  seed?: number;
  output_format?: string;
}

serve(async (req): Promise<Response> => {
  // 🔍 LOGGING INICIAL DETALHADO
  const method = req.method;
  const contentType = req.headers.get('content-type') || 'not-specified';
  const contentLength = req.headers.get('content-length') || 'unknown';
  
  console.log('📥 Replace Background - Request received');
  console.log('🔍 Request details:', { method, contentType, contentLength });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-worker-key',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  // 🔐 Verificar chave interna do worker - BLOQUEAR CHAMADAS DIRETAS
  const internalKey = req.headers.get('x-internal-worker-key');
  const expectedKey = Deno.env.get('INTERNAL_WORKER_SECRET');
  
  if (internalKey !== expectedKey) {
    console.log('❌ [STABILITY] Acesso negado - use a fila de geração');
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Acesso negado. Use a fila de geração assíncrona.',
        code: 'USE_QUEUE'
      }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  console.log('✅ [STABILITY] Acesso autorizado via worker');

  try {
    // Verificar API key
    const STABILITY_API_KEY = Deno.env.get('STABILITY_API_KEY');
    if (!STABILITY_API_KEY) {
      console.error('❌ STABILITY_API_KEY not configured');
      throw new Error('STABILITY_API_KEY is not configured');
    }

    // 🔄 PARSING DO BODY (apenas JSON, já que vem do worker)
    let background_prompt: string;
    let image: string;
    let foreground_prompt: string | undefined;
    let negative_prompt: string | undefined;
    let preserve_original_subject: number = 0.7;
    let original_background_depth: number = 0.5;
    let keep_original_background: boolean = false;
    let light_source_direction: string | undefined;
    let light_source_strength: number = 0.3;
    let seed: number | undefined;
    let output_format: string = 'webp';

    console.log('🔄 Parsing request body...');

    const body: ReplaceBackgroundRequest = await req.json();
    
    background_prompt = body.background_prompt;
    image = body.image;
    foreground_prompt = body.foreground_prompt;
    negative_prompt = body.negative_prompt;
    preserve_original_subject = body.preserve_original_subject ?? 0.7;
    original_background_depth = body.original_background_depth ?? 0.5;
    keep_original_background = body.keep_original_background ?? false;
    light_source_direction = body.light_source_direction;
    light_source_strength = body.light_source_strength ?? 0.3;
    seed = body.seed;
    output_format = body.output_format || 'webp';
    
    console.log('✅ Parsed JSON successfully');

    console.log('📦 Parsed params:', {
      hasImage: !!image,
      background_prompt_length: background_prompt?.length,
      preserve_original_subject,
      output_format
    });

    // Validações antecipadas
    if (!background_prompt || background_prompt.trim().length < 10) {
      console.error('❌ Invalid background_prompt');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Background prompt precisa ter pelo menos 10 caracteres'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!image) {
      console.error('❌ Missing image');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Imagem do produto é obrigatória'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 🎯 PROCESSAR IMAGEM (string: data URL, http URL, ou base64)
    let imageBlob: Blob;
    let mimeType = 'image/jpeg';

    console.log('🖼️ Processing image...');

    let imageData: string;

    if (image.startsWith('data:')) {
      const match = image.match(/^data:(image\/[a-z]+);base64,/);
      if (match) {
        mimeType = match[1];
        imageData = image.split(',')[1];
      } else {
        console.error('❌ Invalid data URL format');
        throw new Error('Invalid data URL format');
      }
    } else if (image.startsWith('http')) {
      console.log('🌐 Downloading image from URL...');
      const imgResponse = await fetch(image);
      const imgContentType = imgResponse.headers.get('content-type');
      if (imgContentType && imgContentType.startsWith('image/')) {
        mimeType = imgContentType;
      }
      const imgBuffer = await imgResponse.arrayBuffer();
      imageData = btoa(String.fromCharCode(...new Uint8Array(imgBuffer)));
    } else {
      imageData = image;
    }

    console.log(`📸 Image MIME type detected: ${mimeType}`);

    try {
      const binaryString = atob(imageData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      imageBlob = new Blob([bytes], { type: mimeType });
      console.log(`✅ Image blob created: ${imageBlob.size} bytes, type: ${imageBlob.type}`);
    } catch (decodeError) {
      console.error('❌ Failed to decode base64 image:', decodeError);
      throw new Error('Invalid image data: failed to decode base64');
    }

    // Validar tamanho da imagem
    if (imageBlob.size === 0) {
      console.error('❌ Empty image blob');
      throw new Error('Empty image data');
    }

    if (imageBlob.size > 10 * 1024 * 1024) {
      console.warn(`⚠️ Large image detected: ${(imageBlob.size / 1024 / 1024).toFixed(2)}MB`);
    }

    // Preparar FormData para Stability AI
    const formData = new FormData();
    formData.append('background_prompt', background_prompt);
    formData.append('output_format', output_format);
    formData.append('preserve_original_subject', preserve_original_subject.toString());
    formData.append('original_background_depth', original_background_depth.toString());
    formData.append('keep_original_background', keep_original_background.toString());
    
    if (foreground_prompt) formData.append('foreground_prompt', foreground_prompt);
    if (negative_prompt) formData.append('negative_prompt', negative_prompt);
    if (light_source_direction && light_source_direction !== 'none') {
      formData.append('light_source_direction', light_source_direction);
      formData.append('light_source_strength', light_source_strength.toString());
    }
    if (seed !== undefined) formData.append('seed', seed.toString());

    const fileExtension = mimeType.split('/')[1] || 'jpg';
    formData.append('subject_image', imageBlob, `product.${fileExtension}`);

    // 📤 ENVIAR PARA STABILITY AI
    const apiUrl = 'https://api.stability.ai/v2beta/stable-image/edit/replace-background-and-relight';
    console.log('🚀 Starting async generation...');
    console.log('📤 Sending request to Stability AI');
    console.log('📊 Request details:', {
      prompt_length: background_prompt.length,
      image_size_mb: (imageBlob.size / 1024 / 1024).toFixed(2),
      preserve_subject: preserve_original_subject,
      output_format
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
        'Accept': 'application/json',
      },
      body: formData,
    });

    console.log(`📬 Initial API response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    const generationId = responseData?.id;

    if (!generationId) {
      throw new Error('Generation ID not received from API');
    }

    console.log('🔄 Polling generation:', generationId);

    // Polling loop
    const timeout = 500; // 500 segundos
    const start = Date.now();
    let status = 202;

    while (status === 202) {
      if (Date.now() - start > timeout * 1000) {
        throw new Error(`Timeout after ${timeout} seconds`);
      }

      console.log(`⏳ Checking status at https://api.stability.ai/v2beta/results/${generationId}`);
      
      const pollResponse = await fetch(`https://api.stability.ai/v2beta/results/${generationId}`, {
        headers: {
          'Authorization': `Bearer ${STABILITY_API_KEY}`,
          'Accept': '*/*'
        },
      });

      status = pollResponse.status;

      if (status === 202) {
        console.log('⏱️ Still processing, waiting 10s...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      } else if (status === 200) {
        console.log('✅ Generation complete!');
        
        const finishReason = pollResponse.headers.get('finish-reason');
        const usedSeed = pollResponse.headers.get('seed');

        if (finishReason === 'CONTENT_FILTERED') {
          throw new Error('Content filtered by NSFW classifier');
        }

        const resultBlob = await pollResponse.blob();
        const arrayBuffer = await resultBlob.arrayBuffer();
        const imageBytes = new Uint8Array(arrayBuffer);
        const imageBase64 = arrayBufferToBase64(imageBytes);

        return new Response(
          JSON.stringify({
            success: true,
            image: `data:image/${output_format};base64,${imageBase64}`,
            model_used: 'replace-background-relight',
            credits_used: 4,
            finish_reason: finishReason || 'SUCCESS',
            seed: usedSeed ? parseInt(usedSeed) : (seed || 0),
            timestamp: new Date().toISOString()
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      } else {
        const errorText = await pollResponse.text();
        throw new Error(`Polling error: ${status} - ${errorText}`);
      }
    }

  } catch (error: unknown) {
    console.error('💥 Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Fallback return
  return new Response(
    JSON.stringify({ success: false, error: 'Unexpected error - no response generated' }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
