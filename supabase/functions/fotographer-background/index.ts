import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BackgroundRequest {
  imageUrl?: string;
  imageData?: string;
  prompt?: string;
  style?: string;
}

interface BackgroundResult {
  success: boolean;
  error?: string;
  message?: string;
  original_url: string | null;
  background_url: string | null;
  style?: string;
  processing_time?: string;
  metadata?: {
    resolution?: string;
    format?: string;
    size?: string;
    note?: string;
    processor?: string;
    fotographer_id?: string;
  };
  user_action_required?: string;
  dashboard_url?: string;
  troubleshooting?: {
    issue: string;
    solution: string;
    steps: string[];
  };
  debug_info?: {
    status?: number;
    statusText?: string;
    apiKeyPrefix?: string;
    endpoint?: string;
    timestamp?: string;
    fullError?: any;
    errorType?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, imageData, prompt = 'professional product photography background', style = 'realistic' } = await req.json() as BackgroundRequest
    
    console.log('=== FOTOGRAPHER BACKGROUND FUNCTION START ===')
    console.log('Image URL received:', imageUrl)
    console.log('Has imageData:', !!imageData)
    console.log('Prompt:', prompt)
    console.log('Style:', style)
    
    // Validate input
    if (!imageUrl && !imageData) {
      console.error('Neither URL nor image data provided')
      const errorResult: BackgroundResult = {
        success: false,
        error: 'URL da imagem ou dados são obrigatórios',
        original_url: null,
        background_url: null
      }
      return new Response(JSON.stringify(errorResult), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check API key
    const fotographerApiKey = Deno.env.get('FOTOGRAPHER_API_KEY')
    if (!fotographerApiKey) {
      console.error('FOTOGRAPHER_API_KEY not configured')
      const errorResult: BackgroundResult = {
        success: false,
        error: 'API Key do Fotographer.ai não configurada no servidor',
        original_url: imageUrl || null,
        background_url: null,
        user_action_required: 'Configure a chave da API Fotographer.ai nas configurações do projeto',
        dashboard_url: 'https://api-dashboard.fotographer.ai/'
      }
      return new Response(JSON.stringify(errorResult), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('API Key configured:', fotographerApiKey ? 'Yes (first 8 chars: ' + fotographerApiKey.substring(0, 8) + '...)' : 'No')

    // Process with Fotographer.ai
    console.log('Processing with Fotographer.ai...')
    
    // Prepare the request body based on common API patterns
    const requestBody: any = {
      prompt: prompt,
      style: style,
      output: {
        format: 'jpeg',
        quality: 80
      }
    }

    // Add image source
    if (imageUrl) {
      requestBody.image_url = imageUrl
    } else if (imageData) {
      requestBody.image = imageData
    }

    const startTime = Date.now()
    
    // Try multiple possible endpoints based on common patterns
    const possibleEndpoints = [
      'https://api-dashboard.fotographer.ai/v1/background/generate',
      'https://api-dashboard.fotographer.ai/api/v1/background',
      'https://api-dashboard.fotographer.ai/background',
      'https://api.fotographer.ai/v1/background/generate',
      'https://api.fotographer.ai/background'
    ]

    let lastError: any = null
    let response: Response | null = null

    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`)
        
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${fotographerApiKey}`,
            'Content-Type': 'application/json',
            'X-API-Key': fotographerApiKey, // Alternative header format
          },
          body: JSON.stringify(requestBody),
        })

        console.log(`Response status for ${endpoint}:`, response.status)
        
        if (response.ok) {
          break // Success, exit the loop
        } else if (response.status === 404) {
          console.log(`Endpoint ${endpoint} not found, trying next...`)
          continue
        } else {
          const errorText = await response.text()
          console.log(`Error from ${endpoint}:`, errorText)
          lastError = { status: response.status, message: errorText, endpoint }
          continue
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`Network error for ${endpoint}:`, message)
        lastError = { error: message, endpoint }
        continue
      }
    }

    if (!response || !response.ok) {
      console.error('All endpoints failed. Last error:', lastError)
      
      const errorResult: BackgroundResult = {
        success: false,
        error: 'Falha ao conectar com a API do Fotographer.ai',
        message: lastError?.message || 'Todos os endpoints falharam',
        original_url: imageUrl || null,
        background_url: null,
        troubleshooting: {
          issue: 'API connection failed',
          solution: 'Verifique se a API key está correta e se o serviço está disponível',
          steps: [
            'Verifique a API key no dashboard: https://api-dashboard.fotographer.ai/',
            'Confirme se há créditos disponíveis na conta',
            'Tente novamente em alguns minutos'
          ]
        },
        debug_info: {
          status: lastError?.status,
          statusText: lastError?.message,
          apiKeyPrefix: fotographerApiKey.substring(0, 8) + '...',
          endpoint: lastError?.endpoint,
          timestamp: new Date().toISOString(),
          fullError: lastError,
          errorType: 'CONNECTION_FAILED'
        }
      }
      
      return new Response(JSON.stringify(errorResult), {
        status: lastError?.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2) + 's'
    const responseData = await response.json()
    
    console.log('=== RESPONSE FROM FOTOGRAPHER ===')
    console.log('Response data:', responseData)
    console.log('Processing time:', processingTime)

    // Extract the background URL from response (adapt based on actual API response structure)
    let backgroundUrl = null
    
    // Try different possible response structures
    if (responseData.image) {
      backgroundUrl = responseData.image
    } else if (responseData.url) {
      backgroundUrl = responseData.url
    } else if (responseData.background_url) {
      backgroundUrl = responseData.background_url
    } else if (responseData.result) {
      backgroundUrl = responseData.result
    } else if (responseData.data && responseData.data.url) {
      backgroundUrl = responseData.data.url
    } else if (responseData.output) {
      backgroundUrl = responseData.output
    }

    if (!backgroundUrl) {
      console.error('No background URL found in response:', responseData)
      const errorResult: BackgroundResult = {
        success: false,
        error: 'Resposta inválida da API do Fotographer.ai',
        original_url: imageUrl || null,
        background_url: null,
        debug_info: {
          timestamp: new Date().toISOString(),
          fullError: responseData,
          errorType: 'INVALID_RESPONSE'
        }
      }
      
      return new Response(JSON.stringify(errorResult), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const result: BackgroundResult = {
      success: true,
      original_url: imageUrl || null,
      background_url: backgroundUrl,
      style: style,
      processing_time: processingTime,
      metadata: {
        resolution: '1024x1024',
        format: 'jpeg',
        processor: 'Fotographer.ai',
        fotographer_id: responseData.id || responseData.task_id,
        note: 'Background gerado com sucesso'
      }
    }

    console.log('=== PROCESSING RESULT ===')
    console.log('Success:', result.success)
    console.log('Background URL type:', typeof result.background_url)
    console.log('Processing time:', result.processing_time)
    console.log('=== END RESULT ===')
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('=== ERROR IN PROCESSING ===')
    console.error('Complete error:', error)
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorResult: BackgroundResult = {
      success: false,
      error: 'Erro interno do servidor',
      message: errorMessage,
      original_url: null,
      background_url: null,
      debug_info: {
        timestamp: new Date().toISOString(),
        fullError: error,
        errorType: 'INTERNAL_ERROR'
      }
    }
    
    return new Response(JSON.stringify(errorResult), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})