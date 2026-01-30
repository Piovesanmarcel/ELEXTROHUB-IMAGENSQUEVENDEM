import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  
  console.log(`🚀 [${requestId}] CLOUDINARY-UPSCALE REQUEST`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { imageUrl, imageBase64, targetSize = 3840 } = await req.json();
    
    if (!imageUrl && !imageBase64) {
      return new Response(JSON.stringify({ 
        error: 'imageUrl ou imageBase64 é obrigatório' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cloudinaryCloudName = 'duzm3rzco'; // Cloud name público
    const cloudinaryApiKey = Deno.env.get('CLOUDINARY_API_KEY');
    const cloudinaryApiSecret = Deno.env.get('CLOUDINARY_API_SECRET');

    if (!cloudinaryApiKey || !cloudinaryApiSecret) {
      console.error(`❌ [${requestId}] Cloudinary API keys não configuradas`);
      return new Response(JSON.stringify({ 
        error: 'Cloudinary não configurado' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📤 [${requestId}] Fazendo upload para Cloudinary...`);
    
    // Preparar dados para upload
    let uploadData: string;
    if (imageBase64) {
      // Se recebeu base64, usar diretamente
      uploadData = imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`;
    } else {
      // Se recebeu URL, Cloudinary pode fazer fetch
      uploadData = imageUrl;
    }

    // Gerar timestamp e signature para upload autenticado
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'upscaled-4k';
    
    // Criar string para assinatura
    const signatureString = `folder=${folder}&timestamp=${timestamp}${cloudinaryApiSecret}`;
    
    // Gerar SHA1 signature
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureString);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Fazer upload para Cloudinary
    const formData = new FormData();
    formData.append('file', uploadData);
    formData.append('api_key', cloudinaryApiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', folder);

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`❌ [${requestId}] Erro no upload Cloudinary:`, errorText);
      return new Response(JSON.stringify({ 
        error: 'Falha no upload para Cloudinary',
        details: errorText
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const uploadResult = await uploadResponse.json();
    console.log(`✅ [${requestId}] Upload concluído:`, {
      publicId: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height
    });

    // Construir URL com transformações para 4K
    // Usamos c_fit para manter proporções e w_3840,h_3840 para 4K
    // q_auto:best para máxima qualidade
    const upscaledUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/c_fit,w_${targetSize},h_${targetSize},q_auto:best/${uploadResult.public_id}.png`;
    
    // URL alternativa com upscale AI se disponível
    const upscaledUrlAI = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/c_fit,w_${targetSize},h_${targetSize},q_auto:best,e_upscale/${uploadResult.public_id}.png`;

    console.log(`🖼️ [${requestId}] URLs geradas:`, {
      standard: upscaledUrl,
      ai: upscaledUrlAI,
      targetSize
    });

    return new Response(JSON.stringify({
      success: true,
      originalUrl: uploadResult.secure_url,
      upscaledUrl: upscaledUrl,
      upscaledUrlAI: upscaledUrlAI,
      publicId: uploadResult.public_id,
      originalSize: {
        width: uploadResult.width,
        height: uploadResult.height
      },
      targetSize: targetSize,
      metadata: {
        requestId,
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`💥 [${requestId}] Erro:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      requestId 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
