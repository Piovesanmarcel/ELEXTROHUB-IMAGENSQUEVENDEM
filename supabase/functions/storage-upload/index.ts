import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const processStart = Date.now();
    console.log(`🚀 [${requestId}] Storage upload iniciado`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { imageUrl, base64, fileName } = body;

    if (!imageUrl && !base64) {
      return new Response(
        JSON.stringify({ success: false, error: 'imageUrl ou base64 é obrigatório', code: 'NO_IMAGE_DATA' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let imageData: Uint8Array;
    let contentType = 'image/jpeg';

    if (base64) {
      console.log(`📥 [${requestId}] Convertendo base64...`);
      const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
      const binaryString = atob(base64Data);
      imageData = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        imageData[i] = binaryString.charCodeAt(i);
      }
    } else {
      console.log(`📥 [${requestId}] Baixando imagem: ${imageUrl?.substring(0, 80)}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);
      
      let imageResponse;
      try {
        imageResponse = await fetch(imageUrl!, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/*,*/*',
          },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!imageResponse.ok) {
        console.error(`❌ [${requestId}] Falha ao baixar imagem: ${imageResponse.status}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Falha ao baixar imagem: ${imageResponse.status}`,
            code: 'DOWNLOAD_ERROR'
          }),
          { status: imageResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      imageData = new Uint8Array(imageBuffer);
      contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    }

    console.log(`✅ [${requestId}] Dados prontos: ${imageData.length} bytes`);

    // Gerar nome único
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 5);
    const finalFileName = fileName || `storage-${timestamp}-${randomPart}.jpg`;
    const filePath = `fallback/${finalFileName}`;

    // Upload para Storage
    console.log(`⬆️ [${requestId}] Iniciando upload para Supabase Storage...`);
    const uploadStart = Date.now();

    const { data, error } = await supabase.storage
      .from('hosted-fallback-public')
      .upload(filePath, imageData, {
        contentType: contentType,
        upsert: false
      });

    const uploadTime = Date.now() - uploadStart;

    if (error) {
      console.error(`❌ [${requestId}] Erro no upload Storage:`, error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message,
          code: 'STORAGE_UPLOAD_ERROR'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from('hosted-fallback-public')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;
    
    const totalTime = Date.now() - processStart;
    console.log(`✅ [${requestId}] Upload para Storage bem-sucedido!`);
    console.log(`🔗 [${requestId}] URL: ${publicUrl}`);
    console.log(`⏱️ [${requestId}] Tempo total: ${totalTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
        path: filePath,
        timing: { upload: uploadTime, total: totalTime }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        code: 'UNEXPECTED_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
