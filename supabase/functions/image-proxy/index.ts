import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let imageUrl: string | null = null;

    // Support GET request with URL parameter (for direct image loading)
    if (req.method === 'GET') {
      imageUrl = url.searchParams.get('url');
    } else {
      // Support POST request with JSON body (existing behavior)
      const body = await req.json();
      imageUrl = body.imageUrl;
    }
    
    if (!imageUrl) {
      throw new Error('imageUrl is required');
    }

    console.log(`🔗 [IMAGE-PROXY] Fetching: ${imageUrl.substring(0, 100)}...`);

    // Fetch the image with headers to bypass hotlink protection
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    
    const imageResponse = await fetch(imageUrl, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': new URL(imageUrl).origin + '/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      }
    });
    clearTimeout(timeout);

    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/png';
    
    console.log(`✅ [IMAGE-PROXY] Fetched: ${(arrayBuffer.byteLength / 1024).toFixed(2)} KB`);

    // For GET requests, return the image directly (for <img src> usage)
    if (req.method === 'GET') {
      return new Response(arrayBuffer, {
        headers: {
          ...corsHeaders,
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        }
      });
    }

    // For POST requests, return base64 (existing behavior)
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    const dataUrl = `data:${contentType};base64,${base64}`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        base64: dataUrl,
        size: arrayBuffer.byteLength,
        contentType
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const err = error as Error;
    console.error('❌ [IMAGE-PROXY] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: err.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
