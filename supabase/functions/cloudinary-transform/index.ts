import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { v2 as cloudinary } from "npm:cloudinary@2.7.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log("🚀 FUNÇÃO CLOUDINARY V4.0 FINAL - REQUEST:", req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { imageUrl, ctaText, benefitText } = await req.json();

    console.log("📋 DADOS RECEBIDOS V4.0:");
    console.log("📋 imageUrl:", imageUrl?.substring(0, 50) + "...");
    console.log("📋 ctaText:", ctaText);
    console.log("📋 benefitText:", benefitText);

    if (!imageUrl || !ctaText || !benefitText) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios: imageUrl, ctaText, benefitText' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Configurar Cloudinary
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY');
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');
    const cloudName = "ddeqeeyo8";

    if (!apiKey || !apiSecret) {
      console.error("❌ Credenciais não encontradas");
      return new Response(
        JSON.stringify({ error: 'Credenciais do Cloudinary não configuradas' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("✅ CONFIGURANDO SDK CLOUDINARY V4.0");
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true
    });

    // Upload da imagem
    console.log("📤 FAZENDO UPLOAD COM SDK...");
    const uploadResult = await cloudinary.uploader.upload(imageUrl, {
      folder: "produtos",
      public_id: `produto_${Date.now()}`,
      overwrite: true,
      resource_type: "auto"
    });

    console.log("✅ UPLOAD SUCCESS! Public ID:", uploadResult.public_id);

    // Gerar URL transformada
    console.log("🎨 GERANDO TRANSFORMAÇÕES...");
    const transformedUrl = cloudinary.url(uploadResult.public_id, {
      transformation: [
        { background: "white" },
        {
          overlay: {
            font_family: "Montserrat",
            font_size: 60,
            font_weight: "bold",
            text: ctaText
          },
          color: "#000000",
          gravity: "north",
          y: 50
        },
        {
          overlay: {
            font_family: "Montserrat",
            font_size: 40,
            font_weight: "bold",
            text: benefitText
          },
          color: "#000000",
          gravity: "north",
          y: 120
        }
      ]
    });

    console.log("🎉 TRANSFORMAÇÃO COMPLETA! URL:", transformedUrl);

    return new Response(
      JSON.stringify({
        success: true,
        transformedUrl,
        message: "Imagem transformada com sucesso!"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 ERRO COMPLETO V4.0:', error);
    console.error('💥 Stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('💥 Message:', error instanceof Error ? error.message : String(error));
    
    return new Response(
      JSON.stringify({
        error: 'Erro na transformação',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});