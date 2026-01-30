import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UploadRequest {
  imageData: string;
  fileName: string;
}

interface CloudflareResponse {
  success: boolean;
  result?: {
    id: string;
    variants: string[];
  };
  errors?: Array<{ message: string }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Cloudflare Upload Function iniciada');

    // Verificar método
    if (req.method !== 'POST') {
      throw new Error('Método não permitido');
    }

    // Obter dados da requisição
    const { imageData, fileName }: UploadRequest = await req.json();
    
    console.log(`📝 Dados recebidos:`);
    console.log(`- fileName: ${fileName}`);
    console.log(`- imageData type: ${typeof imageData}`);
    console.log(`- imageData length: ${imageData?.length || 'undefined'}`);
    console.log(`- imageData preview: ${imageData?.substring(0, 50) || 'undefined'}...`);
    
    if (!imageData || !fileName) {
      throw new Error('imageData e fileName são obrigatórios');
    }

    console.log(`📝 Processando upload: ${fileName}`);

    // Obter credenciais do Cloudflare dos secrets
    const cloudflareToken = Deno.env.get('TOKEN_API_CLOUDFLARE');
    const accountId = Deno.env.get('ID_DA_CONTA_CLOUDFLARE');

    if (!cloudflareToken || !accountId) {
      console.error('❌ Credenciais do Cloudflare não configuradas');
      throw new Error('Credenciais do Cloudflare não configuradas');
    }

    console.log(`🔑 Account ID: ${accountId.substring(0, 8)}...`);
    console.log(`🔑 Token configurado: ${cloudflareToken ? 'SIM' : 'NÃO'}`);

    // Preparar dados da imagem - melhor validação
    let base64Data: string;
    
    if (imageData.startsWith('data:')) {
      // Se é uma data URL, extrair apenas o base64
      const parts = imageData.split(',');
      if (parts.length !== 2) {
        throw new Error('Formato de data URL inválido');
      }
      base64Data = parts[1];
      console.log(`✅ Data URL detectada, base64 extraído: ${base64Data.length} caracteres`);
    } else {
      // Se já é base64 puro
      base64Data = imageData;
      console.log(`✅ Base64 puro detectado: ${base64Data.length} caracteres`);
    }
    
    if (!base64Data || base64Data.length < 50) {
      console.error(`❌ Base64 inválido: length=${base64Data?.length}, content="${base64Data?.substring(0, 100)}"`);
      throw new Error(`Dados de imagem inválidos: base64 muito pequeno (${base64Data?.length} caracteres)`);
    }

    // Converter base64 para blob com validação
    console.log(`🔄 Convertendo base64 para blob...`);
    
    try {
      const byteCharacters = atob(base64Data);
      console.log(`✅ Base64 decodificado: ${byteCharacters.length} bytes`);
      
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      
      console.log(`✅ Blob criado: ${blob.size} bytes, tipo: ${blob.type}`);
      
      if (blob.size === 0) {
        throw new Error('Blob vazio criado a partir do base64');
      }

      // Preparar FormData para Cloudflare
      const formData = new FormData();
      formData.append('file', blob, fileName);

      const cloudflareEndpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`;
      
      console.log(`📡 Enviando para Cloudflare: ${cloudflareEndpoint}`);
      console.log(`📦 FormData preparado com arquivo: ${fileName} (${blob.size} bytes)`);

      // Fazer upload para Cloudflare
      const response = await fetch(cloudflareEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cloudflareToken}`,
        },
        body: formData
      });

      console.log(`📋 Status da resposta Cloudflare: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Erro HTTP Cloudflare: ${response.status} - ${errorText}`);
        throw new Error(`Cloudflare HTTP ${response.status}: ${errorText}`);
      }

      const data: CloudflareResponse = await response.json();
      console.log('📋 Resposta completa do Cloudflare:', JSON.stringify(data, null, 2));

      if (data.success && data.result?.variants?.[0]) {
        const hostedUrl = data.result.variants[0];
        console.log(`✅ SUCESSO! Imagem hospedada no Cloudflare: ${hostedUrl}`);
        
        return new Response(
          JSON.stringify({
            success: true,
            url: hostedUrl,
            service: 'cloudflare',
            message: 'Imagem hospedada no Cloudflare com sucesso!'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } else {
        const errorMessage = data.errors?.[0]?.message || 'Resposta inválida do Cloudflare';
        console.error('❌ Cloudflare retornou erro:', errorMessage);
        throw new Error(errorMessage);
      }
      
    } catch (base64Error) {
      console.error('❌ Erro ao processar base64:', base64Error);
      throw new Error(`Erro ao processar dados de imagem: ${base64Error instanceof Error ? base64Error.message : String(base64Error)}`);
    }

  } catch (error) {
    console.error('❌ ERRO na função Cloudflare Upload:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        service: 'cloudflare'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});