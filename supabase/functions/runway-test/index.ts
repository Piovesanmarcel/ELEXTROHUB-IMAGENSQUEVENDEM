import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'apikey, authorization, content-type, x-client-info, x-content-type-options, x-frame-options, x-runway-version',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400'
};

const RUNWAY_API_KEY = Deno.env.get('RUNWAY_API_KEY');
const RUNWAY_API_URL = 'https://api.dev.runwayml.com/v1';

console.log('🚀 [RUNWAY] Function initialized, API key configured:', !!RUNWAY_API_KEY);

interface RunwayTextToImageRequest {
  action: 'create' | 'status';
  promptText?: string;
  model?: 'gen4_image' | 'gen4_image_turbo' | 'gemini_2.5_flash';
  ratio?: string;
  seed?: number;
  referenceImage?: string;
  taskId?: string;
}

interface RunwayTask {
  id: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  output?: string[];
  error?: string;
}

serve(async (req): Promise<Response> => {
  const requestId = crypto.randomUUID();
  console.log(`🔵 [RUNWAY-${requestId}] Nova requisição recebida`);

  // Handle CORS preflight requests PRIMEIRO
  if (req.method === 'OPTIONS') {
    console.log(`🔵 [RUNWAY-${requestId}] OPTIONS request - CORS preflight`);
    console.log(`🔵 [RUNWAY-${requestId}] Requested headers:`, req.headers.get('access-control-request-headers'));
    console.log(`🔵 [RUNWAY-${requestId}] Requested method:`, req.headers.get('access-control-request-method'));
    console.log(`🔵 [RUNWAY-${requestId}] Origin:`, req.headers.get('origin'));
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  console.log(`📨 [RUNWAY-${requestId}] Method: ${req.method}`);
  console.log(`📨 [RUNWAY-${requestId}] URL: ${req.url}`);
  console.log(`📨 [RUNWAY-${requestId}] Headers:`, Object.fromEntries(req.headers.entries()));

  if (req.method !== 'POST') {
    console.log(`❌ [RUNWAY-${requestId}] Method not allowed: ${req.method}`);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Method ${req.method} not allowed`,
        requestId
      }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  if (!RUNWAY_API_KEY) {
    console.error(`❌ [RUNWAY-${requestId}] RUNWAY_API_KEY não configurada`);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'RUNWAY_API_KEY não configurada',
        requestId
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // ✅ PARSING SEGURO - Verificar content-length e content-type primeiro
    const contentLength = req.headers.get('content-length');
    const contentType = req.headers.get('content-type');
    
    console.log(`📨 [RUNWAY-${requestId}] Content-Length: ${contentLength}`);
    console.log(`📨 [RUNWAY-${requestId}] Content-Type: ${contentType}`);
    
    if (!contentLength || contentLength === '0') {
      console.error(`❌ [RUNWAY-${requestId}] Body vazio - content-length: ${contentLength}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Request body está vazio',
          requestId
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // ✅ LER COMO TEXTO PRIMEIRO
    console.log(`📨 [RUNWAY-${requestId}] Lendo body como texto...`);
    const rawBody = await req.text();
    console.log(`📨 [RUNWAY-${requestId}] Raw body length: ${rawBody?.length || 0}`);
    console.log(`📨 [RUNWAY-${requestId}] Raw body preview: ${rawBody?.substring(0, 200)}...`);
    
    if (!rawBody || rawBody.trim() === '') {
      console.error(`❌ [RUNWAY-${requestId}] Body vazio após leitura como texto`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Request body está vazio ou inválido',
          requestId
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // ✅ PARSING JSON MANUAL COM TRY/CATCH
    let body;
    try {
      console.log(`📨 [RUNWAY-${requestId}] Fazendo parse JSON...`);
      body = JSON.parse(rawBody);
      console.log(`✅ [RUNWAY-${requestId}] JSON parsed successfully. Keys: ${Object.keys(body).join(', ')}`);
    } catch (parseError) {
      console.error(`❌ [RUNWAY-${requestId}] Erro no parse JSON:`, parseError instanceof Error ? parseError.message : String(parseError));
      console.error(`❌ [RUNWAY-${requestId}] Raw body que falhou:`, rawBody.substring(0, 500));
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid JSON in request body',
          details: parseError instanceof Error ? parseError.message : String(parseError),
          requestId,
          rawBodyPreview: rawBody.substring(0, 200)
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { action, promptText, model = 'gen4_image_turbo', referenceImage, taskId } = body;

      const imageType = referenceImage ? (referenceImage.startsWith('data:') ? 'base64' : 'url') : 'none';
      console.log(`📋 [RUNWAY-${requestId}] Request parameters:`, { 
        action,
        promptText: promptText?.substring(0, 100) + '...', 
        model, 
        hasReferenceImage: !!referenceImage,
        referenceImageType: imageType,
        referenceImageLength: referenceImage?.length || 0,
        taskId
      });

    if (!action || !['create', 'status'].includes(action)) {
      console.error(`❌ [RUNWAY-${requestId}] Action é obrigatório (create ou status)`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Action é obrigatório (create ou status)',
          requestId
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Handle CREATE action
    if (action === 'create') {
      if (!promptText) {
        console.error(`❌ [RUNWAY-${requestId}] Prompt é obrigatório para create`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Prompt é obrigatório para create',
            requestId
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Validar imagem de referência obrigatória
      if (!referenceImage) {
        console.error(`❌ [RUNWAY-${requestId}] Imagem de referência é obrigatória`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Imagem de referência é obrigatória para todos os modelos',
            requestId
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Preparar corpo da requisição
      const requestBody: any = {
        promptText,
        ratio: '1024:1024',
        model,
        referenceImages: [
          {
            uri: referenceImage,
            tag: 'reference'
          }
        ]
      };

      const isBase64 = referenceImage.startsWith('data:');
      console.log(`📸 [RUNWAY-${requestId}] Reference image type: ${isBase64 ? 'base64' : 'URL'}`);
      console.log(`📸 [RUNWAY-${requestId}] Reference image size: ${referenceImage.length} chars`);

      console.log(`📤 [RUNWAY-${requestId}] Criando task na Runway API...`);
      console.log(`📤 [RUNWAY-${requestId}] Request body structure:`, {
        promptText: requestBody.promptText?.substring(0, 100) + '...',
        ratio: requestBody.ratio,
        model: requestBody.model,
        referenceImages: requestBody.referenceImages.map((img: any) => ({
          uri: img.uri.substring(0, 50) + '...',
          tag: img.tag
        }))
      });

      // Criar task de geração de imagem
      const createResponse = await fetch(`${RUNWAY_API_URL}/text_to_image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RUNWAY_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Runway-Version': '2024-11-06'
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`📥 [RUNWAY-${requestId}] Create response status:`, createResponse.status);

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error(`❌ [RUNWAY-${requestId}] Erro ao criar task:`, {
          status: createResponse.status,
          statusText: createResponse.statusText,
          errorText
        });
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Erro da API Runway: ${createResponse.status} - ${errorText}`,
            requestId,
            details: {
              status: createResponse.status,
              statusText: createResponse.statusText,
              response: errorText
            }
          }),
          { 
            status: createResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const createData = await createResponse.json();
      console.log(`📋 [RUNWAY-${requestId}] Create response data:`, createData);
      
      const createdTaskId = createData.id;

      if (!createdTaskId) {
        console.error(`❌ [RUNWAY-${requestId}] Task ID não retornado:`, createData);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Task ID não retornado pela API',
            requestId,
            responseData: createData
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log(`✅ [RUNWAY-${requestId}] Task criada com sucesso, ID:`, createdTaskId);

      return new Response(
        JSON.stringify({
          success: true,
          action: 'create',
          data: {
            taskId: createdTaskId,
            status: 'PENDING',
            model,
            promptText
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Handle STATUS action
    if (action === 'status') {
      if (!taskId) {
        console.error(`❌ [RUNWAY-${requestId}] Task ID é obrigatório para status`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Task ID é obrigatório para status',
            requestId
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log(`🔍 [RUNWAY-${requestId}] Verificando status da task:`, taskId);

      const statusResponse = await fetch(`${RUNWAY_API_URL}/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${RUNWAY_API_KEY}`,
          'X-Runway-Version': '2024-11-06'
        }
      });

      console.log(`📥 [RUNWAY-${requestId}] Status response:`, statusResponse.status);

      if (!statusResponse.ok) {
        const statusErrorText = await statusResponse.text();
        console.error(`❌ [RUNWAY-${requestId}] Erro ao verificar status:`, {
          status: statusResponse.status,
          error: statusErrorText
        });
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Erro ao verificar status: ${statusResponse.status} - ${statusErrorText}`,
            requestId
          }),
          { 
            status: statusResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const task = await statusResponse.json();
      console.log(`📊 [RUNWAY-${requestId}] Status atual:`, task.status);
      console.log(`📊 [RUNWAY-${requestId}] Task completa:`, task);

      if (task.status === 'SUCCEEDED' && task.output && task.output.length > 0) {
        const imageUrl = task.output[0];
        console.log(`✅ [RUNWAY-${requestId}] Task completada com sucesso:`, imageUrl);

        return new Response(
          JSON.stringify({
            success: true,
            action: 'status',
            data: {
              taskId,
              status: task.status,
              imageURL: imageUrl
            }
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      } else if (task.status === 'FAILED') {
        console.error(`❌ [RUNWAY-${requestId}] Task falhou:`, task.error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: task.error || 'Falha na geração da imagem',
            data: {
              taskId,
              status: task.status
            }
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      } else {
        // Still processing
        console.log(`⏳ [RUNWAY-${requestId}] Task ainda em processamento:`, task.status);
        return new Response(
          JSON.stringify({
            success: true,
            action: 'status',
            data: {
              taskId,
              status: task.status
            }
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

  // Default fallback return to ensure all code paths return a Response
  return new Response(JSON.stringify({
    success: false,
    error: 'Invalid request method. Only POST is allowed.'
  }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });

  } catch (error) {
    console.error('❌ [RUNWAY] Erro inesperado:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});