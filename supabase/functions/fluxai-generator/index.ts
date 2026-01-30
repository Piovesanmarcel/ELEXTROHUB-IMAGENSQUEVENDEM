import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log('🚀 FluxAI Generator function started - Method:', req.method);
  console.log('🌐 Request URL:', req.url);
  console.log('📋 Request headers:', Object.fromEntries(req.headers.entries()));
  
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('FLUXAI_API_KEY');
    console.log('🔑 API Key configured:', apiKey ? 'Yes' : 'No');
    if (!apiKey) {
      throw new Error('FluxAI API key not configured');
    }

    console.log('📥 Reading request body...');
    const requestBody = await req.json();
    console.log('📊 Request body received:', requestBody);
    
    const { action, imageData, imageUrl, prompt, description } = requestBody;
    console.log('📥 Action:', action);
    console.log('📝 Request params:', { 
      hasImageData: !!imageData, 
      hasImageUrl: !!imageUrl, 
      prompt, 
      description 
    });

    let response;
    const baseUrl = 'https://api-flux.aiturboapi.com';
    // Usar apenas a base URL oficial conforme documentação

    switch (action) {
      case 'image-to-image':
        console.log('🎨 Processing image-to-image with aiturboapi');
        response = await fetch(`${baseUrl}/v1/flux-pro/image-to-image`, {
          method: 'POST',
          headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: imageData || imageUrl,
            prompt: prompt,
            strength: 0.8,
            guidance_scale: 7.5,
            steps: 30,
            seed: Math.floor(Math.random() * 1000000)
          }),
        });
        break;

      case 'flux-kontext':
        console.log('🎭 Processing flux-kontext - using image-to-image as fallback');
        // Flux Kontext não está disponível, usar image-to-image como fallback
        response = await fetch(`${baseUrl}/v1/flux-pro/image-to-image`, {
          method: 'POST',
          headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: imageData || imageUrl,
            prompt: prompt,
            strength: 0.7,
            guidance_scale: 8.0,
            steps: 25
          }),
        });
        break;

      case 'prompt-generation':
        if (imageData) {
          console.log('🎯 Processing image-to-prompt with FluxAI official API');
          console.log('🌐 URL:', `${baseUrl}/v1/image-to-prompt`);
          
          // Usar o endpoint oficial do FluxAI conforme documentação
          response = await fetch(`${baseUrl}/v1/image-to-prompt`, {
            method: 'POST',
            headers: {
              'X-API-KEY': apiKey, // Header correto conforme documentação
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: imageData // Apenas a imagem base64, conforme documentação
            }),
          });
        } else {
          console.log('🎯 Processing text-based prompt generation with FluxAI');
          console.log('🌐 URL:', `${baseUrl}/v1/text-to-prompt`);
          
          // Usar endpoint de text-to-prompt do FluxAI
          response = await fetch(`${baseUrl}/v1/text-to-prompt`, {
            method: 'POST',
            headers: {
              'X-API-KEY': apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: description || prompt || 'Create a detailed prompt for AI image generation'
            }),
          });
        }
        break;

      case 'image-enhancement':
        console.log('✨ Processing image-enhancement');
        response = await fetch(`${baseUrl}/v1/upscale`, {
          method: 'POST',
          headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: imageData || imageUrl,
            scale_factor: 2,
            model: 'realesrgan'
          }),
        });
        break;

      case 'background-removal-4x':
        console.log('🖼️ Processing background-removal');
        response = await fetch(`${baseUrl}/v1/remove-background`, {
          method: 'POST',
          headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: imageData || imageUrl,
            model: 'u2net',
            return_mask: false
          }),
        });
        break;

      default:
        console.error('❌ Unsupported action:', action);
        throw new Error(`Ação não suportada: ${action}`);
    }

    console.log('📡 External API response status:', response.status);
    console.log('📡 External API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ FluxAI API Error:', response.status, errorText);
      
      // Tratamento específico para diferentes códigos de erro
      if (response.status === 401) {
        throw new Error('API Key inválida ou expirada. Verifique sua configuração.');
      } else if (response.status === 429) {
        throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.');
      } else if (response.status === 404) {
        throw new Error('Endpoint não encontrado. A API pode ter mudado.');
      } else {
        throw new Error(`Erro da API: ${response.status} - ${errorText}`);
      }
    }

    const result = await response.json();
    console.log('✅ FluxAI Success:', action, 'Result keys:', Object.keys(result));

    return new Response(JSON.stringify({
      success: true,
      action,
      result,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 FluxAI Error:', error);
    const stack = error instanceof Error ? error.stack : undefined;
    const message = error instanceof Error ? error.message : String(error);
    console.error('💥 Error stack:', stack);
    return new Response(JSON.stringify({
      success: false,
      error: message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});