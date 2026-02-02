import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] Cloudinary Request Start`);

  try {
    // 2. Parse Body with robust error handling
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error(`[${requestId}] JSON Parse Error:`, e);
      return new Response(
        JSON.stringify({ success: false, error: "JSON Inválido no Body", details: String(e) }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { imageUrl, ctaText, benefitText, upscale = false, ping = false } = body;

    // 3. Early Ping Response
    if (ping) {
      console.log(`[${requestId}] Ping OK`);
      return new Response(
        JSON.stringify({ success: true, message: "Conexão com Edge Function estabelecida! (V6.1)" }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${requestId}] Processing:`, { hasImage: !!imageUrl, upscale });

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "imageUrl é obrigatório" }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Check Environment Variables
    const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME') || "ddeqeeyo8"; // Fallback para o que vimos antes
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY');
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');

    if (!apiKey || !apiSecret) {
      console.error(`[${requestId}] Missing credentials`);
      return new Response(
        JSON.stringify({ success: false, error: "Configuração do Cloudinary incompleta (API_KEY/SECRET ausentes)" }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Generate Signature
    const timestamp = Math.round(new Date().getTime() / 1000);
    const publicId = `prod_${Date.now()}`;
    const folder = "produtos";
    const strToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;

    // Web Crypto API (Native Deno)
    const msgUint8 = new TextEncoder().encode(strToSign);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 6. Upload via REST
    console.log(`[${requestId}] Uploading to ${cloudName}...`);
    const formData = new FormData();
    formData.append('file', imageUrl);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', folder);
    formData.append('public_id', publicId);

    const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    const uploadResult = await uploadResponse.json();

    if (!uploadResponse.ok) {
      console.error(`[${requestId}] Cloudinary API Error:`, uploadResult);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Erro na API do Cloudinary",
          details: uploadResult.error?.message || JSON.stringify(uploadResult)
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Compose URL
    let transformations = [];
    if (upscale) transformations.push("e_upscale,q_auto:best");
    if (ctaText || benefitText) transformations.push("b_white");

    const tStr = transformations.length > 0 ? transformations.join(",") + "/" : "";
    const transformedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${tStr}${uploadResult.public_id}`;

    return new Response(
      JSON.stringify({ success: true, transformedUrl, message: "Sucesso!" }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[${requestId}] Fatal Error:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Erro interno crítico na Edge Function",
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});