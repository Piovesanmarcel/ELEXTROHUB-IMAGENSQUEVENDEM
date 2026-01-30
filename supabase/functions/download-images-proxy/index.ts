
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageUrls } = await req.json()
    
    if (!imageUrls || !Array.isArray(imageUrls)) {
      return new Response(
        JSON.stringify({ error: 'imageUrls array is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`🔄 Processando ${imageUrls.length} imagens via proxy`)

    // Limitar o número de imagens por requisição
    const MAX_IMAGES = 50
    if (imageUrls.length > MAX_IMAGES) {
      return new Response(
        JSON.stringify({ 
          error: `Máximo de ${MAX_IMAGES} imagens por requisição. Recebido: ${imageUrls.length}`,
          maxAllowed: MAX_IMAGES,
          received: imageUrls.length
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Processar em lotes pequenos
    const BATCH_SIZE = 2
    const BATCH_DELAY = 1000
    const results: any[] = []
    
    for (let i = 0; i < imageUrls.length; i += BATCH_SIZE) {
      const batch = imageUrls.slice(i, i + BATCH_SIZE)
      console.log(`📦 Processando lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(imageUrls.length / BATCH_SIZE)} (${batch.length} imagens)`)
      
      const batchPromises = batch.map(async (imageUrl: string, batchIndex: number) => {
        const globalIndex = i + batchIndex
        try {
          console.log(`📥 Baixando imagem ${globalIndex + 1}: ${imageUrl}`)
          
          // Timeout mais agressivo por imagem
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout
          
          const response = await fetch(imageUrl, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          })
          
          clearTimeout(timeoutId)
          
          if (!response.ok) {
            console.error(`❌ Erro HTTP ${response.status} ao baixar imagem ${globalIndex + 1}`)
            return null
          }

          const arrayBuffer = await response.arrayBuffer()
          
          // Limitar tamanho máximo da imagem (5MB)
          if (arrayBuffer.byteLength > 5 * 1024 * 1024) {
            console.error(`❌ Imagem ${globalIndex + 1} muito grande (${arrayBuffer.byteLength} bytes)`)
            return null
          }
          
          // CONVERSÃO BASE64 CORRIGIDA - método direto e eficiente
          const uint8Array = new Uint8Array(arrayBuffer)
          
          // Converter diretamente para string binária
          let binaryString = ''
          for (let i = 0; i < uint8Array.length; i++) {
            binaryString += String.fromCharCode(uint8Array[i])
          }
          
          // Converter para base64 de uma só vez
          const base64 = btoa(binaryString)
          
          const contentType = response.headers.get('content-type') || 'image/jpeg'
          
          console.log(`✅ Imagem ${globalIndex + 1} baixada com sucesso (${arrayBuffer.byteLength} bytes, base64: ${base64.length} chars)`)
          
          return {
            url: imageUrl,
            data: base64,
            contentType,
            size: arrayBuffer.byteLength
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            console.error(`❌ Timeout ao baixar imagem ${globalIndex + 1}`)
          } else {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`❌ Erro ao processar imagem ${globalIndex + 1}:`, message)
          }
          return null
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      // Delay entre lotes para evitar sobrecarga
      if (i + BATCH_SIZE < imageUrls.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY))
      }
    }

    const successfulDownloads = results.filter(result => result !== null)
    
    console.log(`📊 Resultado final: ${successfulDownloads.length}/${imageUrls.length} imagens baixadas com sucesso`)

    return new Response(
      JSON.stringify({ 
        success: true,
        images: successfulDownloads,
        total: imageUrls.length,
        successful: successfulDownloads.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Erro no proxy de download:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
