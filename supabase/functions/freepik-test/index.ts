import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FREEPIK_API_KEY = Deno.env.get('FREEPIK_API_KEY');
    if (!FREEPIK_API_KEY) {
      throw new Error('FREEPIK_API_KEY is not set');
    }

    const { prompt, model = "classic-fast", image, action = "text-to-image" } = await req.json();
    
    if (action === "text-to-image" && !prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required for text-to-image' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    if ((action === "remove-background" || action === "relight" || action === "upscale") && !image) {
      return new Response(
        JSON.stringify({ error: 'Image is required for this action' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    console.log(`Processing ${action} with Freepik API - Model: ${model}, Prompt: ${prompt}`);

    // Determine the API endpoint and request body based on action
    let endpoint = '';
    let requestBody: any = {};

    switch (action) {
      case 'remove-background':
        endpoint = 'https://api.freepik.com/v1/ai/remove-background';
        requestBody = {
          image: image // base64 image
        };
        break;
      
      case 'relight':
        endpoint = 'https://api.freepik.com/v1/ai/image-relight';
        requestBody = {
          image: image, // base64 image
          prompt: prompt || "professional lighting",
          strength: 0.8
        };
        break;
      
      case 'upscale':
        endpoint = 'https://api.freepik.com/v1/ai/image-upscaler';
        requestBody = {
          image: image, // base64 image
          scale_factor: "2x",
          optimized_for: "standard",
          prompt: prompt || "enhance image quality"
        };
        break;
      
      default: // text-to-image
        switch (model) {
          case 'imagen3':
            endpoint = 'https://api.freepik.com/v1/ai/text-to-image/imagen3';
            requestBody = {
              prompt: prompt,
              num_images: 1,
              aspect_ratio: "1:1"
            };
            if (image) requestBody.image = image; // Add image for img2img
            break;
          case 'mystic':
            endpoint = 'https://api.freepik.com/v1/ai/text-to-image/mystic';
            requestBody = {
              prompt: prompt,
              num_images: 1,
              style_id: 0
            };
            if (image) requestBody.image = image; // Add image for img2img
            break;
          default: // classic-fast
            endpoint = 'https://api.freepik.com/v1/ai/text-to-image';
            requestBody = {
              prompt: prompt,
              num_images: 1
            };
            if (image) requestBody.image = image; // Add image for img2img
        }
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-freepik-api-key': FREEPIK_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Freepik API error:', response.status, errorText);
      throw new Error(`Freepik API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Freepik API response:', result);

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        action_used: action,
        model_used: model
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in freepik-test function:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});