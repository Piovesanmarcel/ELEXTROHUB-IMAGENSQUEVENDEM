import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    // 2. Auth & body parse
    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader || '' } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    const userId = user?.id || 'anonymous';

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ success: false, error: "JSON Inválido", details: String(e) }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { imageUrl, ctaText, benefitText, upscale = false, ping = false } = body;

    // 3. Ping Response
    if (ping) {
      return new Response(
        JSON.stringify({ success: true, message: "Conexão OK! (V6.2 + Cost Logging)" }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "imageUrl é obrigatório" }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME') || "ddeqeeyo8";
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY');
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');

    if (!apiKey || !apiSecret) {
      return new Response(
        JSON.stringify({ success: false, error: "Cloudinary credentials missing" }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Generate Signature & Upload
    const timestamp = Math.round(new Date().getTime() / 1000);
    const publicId = `prod_${Date.now()}`;
    const folder = "produtos";
    const strToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;

    const msgUint8 = new TextEncoder().encode(strToSign);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

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
      return new Response(
        JSON.stringify({ success: false, error: "Cloudinary API Error", details: uploadResult.error?.message }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Compose URL
    let transformations = [];
    if (upscale) transformations.push("e_upscale,q_auto:best");
    if (ctaText || benefitText) transformations.push("b_white");

    const tStr = transformations.length > 0 ? transformations.join(",") + "/" : "";
    const transformedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${tStr}${uploadResult.public_id}`;

    // 6. LOG USAGE & COST
    try {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Custo Cloudinary: ~$0.00044 USD
      await supabaseAdmin.from('ai_usage_log').insert({
        user_id: userId,
        provider: 'cloudinary',
        model: upscale ? 'upscale' : 'transform',
        input_tokens: 0,
        output_tokens: 0,
        images_generated: 1,
        estimated_cost_usd: 0.00044,
        request_id: requestId,
        metadata: { upscale, cloud_name: cloudName }
      });
    } catch (logError) {
      console.error("Logging error:", logError);
    }

    return new Response(
      JSON.stringify({ success: true, transformedUrl, message: "Sucesso!" }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Erro interno",
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});