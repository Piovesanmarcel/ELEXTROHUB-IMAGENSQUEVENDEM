import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 🔄 Helper: Upload base64 para Cloudinary e retornar URL pública
async function uploadToCloudinary(
  base64Data: string,
  fileName: string
): Promise<string | null> {
  try {
    const cloudinaryApiKey = Deno.env.get('CLOUDINARY_API_KEY');
    const cloudinaryApiSecret = Deno.env.get('CLOUDINARY_API_SECRET');
    const cloudName = 'ddeqeeyo8'; // Mesmo cloud_name usado em cloudinary-transform

    if (!cloudinaryApiKey || !cloudinaryApiSecret) {
      console.error(`[CLOUDINARY-UPLOAD] ❌ Credenciais não configuradas`);
      return null;
    }

    // Garantir que o base64 tenha o prefixo correto
    let uploadData = base64Data;
    if (!base64Data.startsWith('data:')) {
      uploadData = `data:image/png;base64,${base64Data}`;
    }

    // Gerar timestamp e signature para autenticação
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = `gemini-automation/${fileName}`;

    // Criar string para assinar (ordem alfabética dos parâmetros)
    const signatureString = `folder=gemini-automation&public_id=${fileName}&timestamp=${timestamp}${cloudinaryApiSecret}`;

    // Gerar SHA1 da string
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureString);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log(`[CLOUDINARY-UPLOAD] 📤 Enviando imagem: ${fileName}...`);

    // Upload via API REST do Cloudinary
    const formData = new FormData();
    formData.append('file', uploadData);
    formData.append('api_key', cloudinaryApiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', 'gemini-automation');
    formData.append('public_id', fileName);

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`[CLOUDINARY-UPLOAD] ❌ Falha: ${errorText}`);
      return null;
    }

    const uploadResult = await uploadResponse.json();
    const publicUrl = uploadResult.secure_url || uploadResult.url;

    console.log(`[CLOUDINARY-UPLOAD] ✅ Upload bem-sucedido: ${publicUrl}`);
    return publicUrl;
  } catch (error: any) {
    console.error(`[CLOUDINARY-UPLOAD] ❌ Erro:`, error.message);
    return null;
  }
}

// 🚀 CONFIGURAÇÕES OTIMIZADAS DO WORKER
const BATCH_SIZE = 10; // Aumentado de 3 para 10
const JOB_TIMEOUT_MS = 180000; // 180 segundos (3 min) timeout padrão
const AUTOMATION_TIMEOUT_MS = 300000; // 300 segundos (5 min) timeout para automação completa
const MAX_RETRIES = 3;
const STUCK_JOB_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutos para considerar job travado

// ============================================================
// 💾 SALVAR IMAGEM NA GALERIA (hosted_images)
// Permite que as imagens geradas apareçam na ProductMarketingGallery
// ============================================================
async function saveImageToDatabase(
  supabase: any,
  userId: string,
  productId: string | null,
  imageUrl: string,
  imageType: 'fundo-branco' | 'ambiente' | 'kit' | 'lifestyle' | 'premium',
  productName: string
): Promise<void> {
  try {
    const timestamp = Date.now();
    const safeProductName = productName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
    const filename = `${safeProductName}-${imageType}-${timestamp}.png`;

    const imageTypeLabels: Record<string, string> = {
      'fundo-branco': 'Fundo Branco Profissional',
      'ambiente': 'Imagem Ambiente',
      'lifestyle': 'Lifestyle',
      'premium': 'Premium',
      'kit': 'Kit Promocional'
    };

    // ✅ MAPEAMENTO de imageType para source AI reconhecida pelo ProductShowcaseGenerator
    // O Showcase busca tags "source:gemini", "source:gemini-background", etc.
    const aiSourceMap: Record<string, string> = {
      'fundo-branco': 'source:gemini-white-background',
      'ambiente': 'source:gemini',
      'lifestyle': 'source:gemini',
      'premium': 'source:gemini-background',
      'kit': 'source:cloudinary-kit'
    };

    const aiSourceTag = aiSourceMap[imageType] || 'source:gemini';

    // ✅ IMPORTANTE: source:AI deve vir PRIMEIRO para o Showcase encontrar
    const tags = [
      aiSourceTag, // PRIMEIRO - fonte AI para Showcases
      'marketing',
      'gerada-automaticamente',
      'pipeline:automation', // Identificador de automação (sem prefixo source:)
      'hosted',
      imageType,
      productName.toLowerCase().substring(0, 50)
    ];

    if (productId) {
      tags.push(`product:${productId}`);
    }

    const { error } = await supabase
      .from('hosted_images')
      .insert({
        user_id: userId,
        product_id: productId,
        url: imageUrl,
        original_filename: `${productName} - ${imageTypeLabels[imageType] || imageType}`,
        description: `${imageTypeLabels[imageType] || imageType} gerada via automação para ${productName}`,
        tags: tags,
        uploaded_at: new Date().toISOString()
      });

    if (error) {
      console.error(`[SAVE-IMAGE] ❌ Erro ao salvar ${imageType}:`, error.message);
    } else {
      console.log(`[SAVE-IMAGE] ✅ ${imageType} salva com tag ${aiSourceTag}: ${imageUrl.substring(0, 60)}...`);
    }
  } catch (err: any) {
    console.error(`[SAVE-IMAGE] ❌ Erro inesperado ao salvar ${imageType}:`, err.message);
  }
}

// ============================================================
// 🔄 FUNÇÃO HELPER: Atualizar job COM RETRY
// Garante que atualizações críticas não falhem por problemas de rede
// ============================================================
async function updateJobWithRetry(
  supabase: any,
  jobId: string,
  updateData: any,
  maxRetries = 3
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { error } = await supabase
        .from('image_generation_queue')
        .update(updateData)
        .eq('id', jobId);

      if (!error) {
        console.log(`[PROCESS-QUEUE] ✅ Job ${jobId.slice(0, 8)} atualizado (tentativa ${attempt})`);
        return true;
      }

      console.warn(`[PROCESS-QUEUE] ⚠️ Tentativa ${attempt}/${maxRetries} falhou:`, error.message);

      // Backoff exponencial entre tentativas
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    } catch (e: any) {
      console.error(`[PROCESS-QUEUE] ❌ Erro tentativa ${attempt}/${maxRetries}:`, e.message);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
  }
  console.error(`[PROCESS-QUEUE] 💥 Falha após ${maxRetries} tentativas para job ${jobId.slice(0, 8)}`);
  return false;
}

// ============================================================
// 🔍 VERIFICADOR DE CACHE: Verificar assets já gerados
// Evita duplicação de custo e tempo re-gerando assets existentes
// ============================================================
interface ExistingAssets {
  hasWhiteBackground: boolean;
  hasKits: boolean;
  hasAmbientImages: boolean;
  hasCopywriting: boolean;
  hasUnified: boolean;
  whiteBackgroundUrl: string | null;
  kitUrls: string[];
  ambientUrls: string[];
  unifiedData: any | null;
  copywritingData: any | null;
  totalExisting: number;
}

async function checkExistingAssets(
  supabase: any,
  userId: string,
  productId: string | null,
  productName: string
): Promise<ExistingAssets> {
  const checkStart = Date.now();
  console.log(`[CACHE-CHECK] 🔍 Verificando assets existentes para produto: ${productName} (ID: ${productId || 'N/A'})`);

  const existing: ExistingAssets = {
    hasWhiteBackground: false,
    hasKits: false,
    hasAmbientImages: false,
    hasCopywriting: false,
    hasUnified: false,
    whiteBackgroundUrl: null,
    kitUrls: [],
    ambientUrls: [],
    unifiedData: null,
    copywritingData: null,
    totalExisting: 0
  };

  try {
    // ========================================
    // 1. VERIFICAR IMAGENS EXISTENTES (hosted_images)
    // ========================================
    let imagesQuery = supabase
      .from('hosted_images')
      .select('url, tags, description')
      .eq('user_id', userId);

    // Se temos product_id, filtrar por ele
    if (productId) {
      imagesQuery = imagesQuery.or(`product_id.eq.${productId},tags.cs.{product:${productId}}`);
    }

    const { data: images, error: imagesError } = await imagesQuery;

    if (imagesError) {
      console.warn(`[CACHE-CHECK] ⚠️ Erro ao buscar imagens:`, imagesError.message);
    } else if (images?.length) {
      console.log(`[CACHE-CHECK] 📦 Encontradas ${images.length} imagens no banco`);

      for (const img of images) {
        const tags = img.tags || [];
        const desc = (img.description || '').toLowerCase();

        // Verificar fundo branco
        if (
          tags.includes('fundo-branco') ||
          tags.includes('source:gemini-white-background') ||
          desc.includes('fundo branco')
        ) {
          if (!existing.hasWhiteBackground) {
            existing.hasWhiteBackground = true;
            existing.whiteBackgroundUrl = img.url;
            existing.totalExisting++;
            console.log(`[CACHE-CHECK] ✅ Fundo branco encontrado: ${img.url.substring(0, 50)}...`);
          }
        }

        // Verificar kits
        if (
          tags.includes('kit') ||
          tags.includes('source:cloudinary-kit') ||
          desc.includes('kit promocional')
        ) {
          existing.kitUrls.push(img.url);
        }

        // Verificar imagens ambiente/lifestyle
        if (
          tags.includes('ambiente') ||
          tags.includes('lifestyle') ||
          tags.includes('source:gemini') ||
          desc.includes('ambiente') ||
          desc.includes('lifestyle')
        ) {
          existing.ambientUrls.push(img.url);
        }
      }

      // Verificar se tem kits suficientes (7)
      if (existing.kitUrls.length >= 7) {
        existing.hasKits = true;
        existing.totalExisting++;
        console.log(`[CACHE-CHECK] ✅ Kits completos: ${existing.kitUrls.length}/7`);
      } else if (existing.kitUrls.length > 0) {
        console.log(`[CACHE-CHECK] ⚠️ Kits parciais: ${existing.kitUrls.length}/7`);
      }

      // Verificar se tem imagens ambiente suficientes (2)
      if (existing.ambientUrls.length >= 2) {
        existing.hasAmbientImages = true;
        existing.totalExisting++;
        console.log(`[CACHE-CHECK] ✅ Imagens ambiente completas: ${existing.ambientUrls.length}/2`);
      } else if (existing.ambientUrls.length > 0) {
        console.log(`[CACHE-CHECK] ⚠️ Imagens ambiente parciais: ${existing.ambientUrls.length}/2`);
      }
    }

    // ========================================
    // 2. VERIFICAR UNIFIED RESULTS (ai_unified_results)
    // ========================================
    if (productId) {
      const { data: unified, error: unifiedError } = await supabase
        .from('ai_unified_results')
        .select('results, updated_at')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .maybeSingle();

      if (unifiedError) {
        console.warn(`[CACHE-CHECK] ⚠️ Erro ao buscar unified:`, unifiedError.message);
      } else if (unified?.results) {
        // Verificar se o unified tem dados válidos
        const results = unified.results;
        const hasValidUnified =
          results.improvedText ||
          results.melhorado ||
          results.seoDescription ||
          results.benefits?.length > 0;

        if (hasValidUnified) {
          existing.hasUnified = true;
          existing.unifiedData = results;
          existing.totalExisting++;
          console.log(`[CACHE-CHECK] ✅ Unified Commands encontrado (atualizado: ${unified.updated_at})`);
        }

        // Verificar se tem copywriting dentro do unified
        const hasCopywriting =
          results.copywriting ||
          results.generatedText ||
          results.copywritingText;

        if (hasCopywriting) {
          existing.hasCopywriting = true;
          existing.copywritingData = results.copywriting || results.generatedText || results.copywritingText;
          existing.totalExisting++;
          console.log(`[CACHE-CHECK] ✅ Copywriting encontrado no Unified`);
        }
      }
    }

    const checkDuration = Date.now() - checkStart;
    console.log(`[CACHE-CHECK] 📊 Verificação concluída em ${checkDuration}ms`);
    console.log(`[CACHE-CHECK] 📋 Resumo:`);
    console.log(`  - Fundo Branco: ${existing.hasWhiteBackground ? '✅' : '❌'}`);
    console.log(`  - Kits: ${existing.hasKits ? '✅' : '❌'} (${existing.kitUrls.length}/7)`);
    console.log(`  - Ambient Images: ${existing.hasAmbientImages ? '✅' : '❌'} (${existing.ambientUrls.length}/2)`);
    console.log(`  - Unified Commands: ${existing.hasUnified ? '✅' : '❌'}`);
    console.log(`  - Copywriting: ${existing.hasCopywriting ? '✅' : '❌'}`);
    console.log(`  - Total existente: ${existing.totalExisting}/5 etapas`);

    return existing;

  } catch (error: any) {
    console.error(`[CACHE-CHECK] ❌ Erro na verificação:`, error.message);
    return existing; // Retorna tudo como não existente em caso de erro
  }
}

// ============================================================
// 🚀 PROCESSADOR DE AUTOMAÇÃO COMPLETA (ad_automation_full)
// Executa todas as etapas no backend, sem depender de JWT
// ============================================================
async function processFullAutomation(
  supabase: any,
  job: any,
  internalHeaders: Record<string, string>,
  internalWorkerSecret: string
): Promise<any> {
  const automationId = job.id.slice(0, 8);
  const startTime = Date.now();

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const input = job.input_data;
  const userId = job.user_id;

  console.log(`[FULL-AUTOMATION][${automationId}] 🚀 ========================================`);
  console.log(`[FULL-AUTOMATION][${automationId}] 🚀 INICIANDO AUTOMAÇÃO COMPLETA`);
  console.log(`[FULL-AUTOMATION][${automationId}] 🚀 ========================================`);
  console.log(`[FULL-AUTOMATION][${automationId}] 📋 Job ID: ${job.id}`);
  console.log(`[FULL-AUTOMATION][${automationId}] 👤 User ID: ${userId}`);
  console.log(`[FULL-AUTOMATION][${automationId}] 📋 Input:`, JSON.stringify({
    hasImages: !!input.productImages?.length,
    imagesCount: input.productImages?.length || 0,
    productName: input.formData?.nome || 'N/A',
    hasSku: !!input.formData?.sku,
    formDataKeys: input.formData ? Object.keys(input.formData) : []
  }, null, 2));

  // ✅ LOG: Confirmar imagens de referência
  console.log(`[FULL-AUTOMATION][${automationId}] 📸 Imagens de referência:`);
  console.log(`[FULL-AUTOMATION][${automationId}]   - Total recebidas: ${input.productImages?.length || 0}`);
  console.log(`[FULL-AUTOMATION][${automationId}]   - Usaremos até 2: ${Math.min(2, input.productImages?.length || 0)}`);
  if (input.productImages?.[0]) {
    console.log(`[FULL-AUTOMATION][${automationId}]   - Imagem 1: ${typeof input.productImages[0] === 'string' ? input.productImages[0].substring(0, 60) + '...' : 'objeto'}`);
  }
  if (input.productImages?.[1]) {
    console.log(`[FULL-AUTOMATION][${automationId}]   - Imagem 2: ${typeof input.productImages[1] === 'string' ? input.productImages[1].substring(0, 60) + '...' : 'objeto'}`);
  }

  const result: any = {
    steps: {},
    success: true,
    completedAt: null
  };

  // ✅ ACUMULADOR DE CUSTOS GEMINI - Rastreia cada imagem gerada
  const geminiCostAccumulator = {
    totalCostUSD: 0,
    totalCostBRL: 0,
    totalTokens: 0,
    imagesGenerated: 0,
    modelUsed: 'gemini-2.5-flash-image-preview',
    imagesCosts: [] as Array<{
      imageType: string;
      costUSD: number;
      costBRL: number;
      tokens: number;
      model: string;
      durationMs: number;
    }>
  };

  try {
    // ========================================
    // 🔍 VERIFICAÇÃO DE CACHE: Evitar duplicação de gerações
    // ========================================
    const productId = input.formData?.bling_id || input.formData?.sku || null;
    const productName = input.formData?.nome || 'Produto';

    const existingAssets = await checkExistingAssets(supabase, userId, productId, productName);

    // Calcular o que precisa ser gerado
    const needsUnified = !existingAssets.hasUnified;
    const needsCopywriting = !existingAssets.hasCopywriting;
    const needsWhiteBackground = !existingAssets.hasWhiteBackground;
    const needsKits = !existingAssets.hasKits;
    const needsAmbientImages = !existingAssets.hasAmbientImages;

    const kitsToGenerate = 7 - existingAssets.kitUrls.length;
    const ambientToGenerate = 2 - existingAssets.ambientUrls.length;

    console.log(`[FULL-AUTOMATION][${automationId}] 📋 ====== ANÁLISE DE CACHE ======`);
    console.log(`[FULL-AUTOMATION][${automationId}]   - Unified: ${needsUnified ? '🔄 GERAR' : '⏭️ SKIP (já existe)'}`);
    console.log(`[FULL-AUTOMATION][${automationId}]   - Copywriting: ${needsCopywriting ? '🔄 GERAR' : '⏭️ SKIP (já existe)'}`);
    console.log(`[FULL-AUTOMATION][${automationId}]   - Fundo Branco: ${needsWhiteBackground ? '🔄 GERAR' : '⏭️ SKIP (já existe)'}`);
    console.log(`[FULL-AUTOMATION][${automationId}]   - Kits: ${needsKits ? `🔄 GERAR ${kitsToGenerate}/7` : '⏭️ SKIP (todos existem)'}`);
    console.log(`[FULL-AUTOMATION][${automationId}]   - Ambient: ${needsAmbientImages ? `🔄 GERAR ${ambientToGenerate}/2` : '⏭️ SKIP (todas existem)'}`);
    console.log(`[FULL-AUTOMATION][${automationId}] ================================`);

    // Se tudo já existe, retornar sucesso imediato
    if (!needsUnified && !needsCopywriting && !needsWhiteBackground && !needsKits && !needsAmbientImages) {
      console.log(`[FULL-AUTOMATION][${automationId}] ✅ TUDO JÁ EXISTE - Retornando cache!`);

      result.steps.unified = {
        status: 'cached',
        data: existingAssets.unifiedData,
        fromCache: true
      };
      result.steps.copywriting = {
        status: 'cached',
        data: { generatedText: existingAssets.copywritingData },
        fromCache: true
      };
      result.steps.gemini = {
        status: 'cached',
        images: [existingAssets.whiteBackgroundUrl, ...existingAssets.ambientUrls].filter(Boolean),
        whiteBackgroundImage: existingAssets.whiteBackgroundUrl,
        fromCache: true
      };
      result.steps.kits = {
        status: 'cached',
        images: existingAssets.kitUrls,
        fromCache: true
      };

      result.success = true;
      result.completedAt = new Date().toISOString();
      result.fromCache = true;
      result.summary = {
        unifiedCommandsGenerated: false,
        copywritingGenerated: false,
        geminiImagesCount: existingAssets.ambientUrls.length + 1,
        kitImagesCount: existingAssets.kitUrls.length,
        allImages: [existingAssets.whiteBackgroundUrl, ...existingAssets.ambientUrls, ...existingAssets.kitUrls].filter(Boolean),
        totalExecutionMs: Date.now() - startTime,
        fromCache: true,
        cacheHit: 'full'
      };

      console.log(`[FULL-AUTOMATION][${automationId}] 🎉 Cache hit completo em ${Date.now() - startTime}ms!`);
      return result;
    }

    // ======================
    // EXECUÇÃO PARALELA: OpenAI (Unified + Copywriting) || Gemini (Backgrounds)
    // ======================
    console.log(`[FULL-AUTOMATION][${automationId}] ⚡ INICIANDO EXECUÇÃO PARALELA: OpenAI + Gemini`);

    // Atualizar progresso no job - usar 'unified' para frontend reconhecer
    await updateJobWithRetry(supabase, job.id, {
      result: { ...result, currentStep: 'unified', progress: 10, steps: {} }
    });

    // ========================================
    // THREAD 1: OpenAI (Unified Commands + Copywriting) COM CACHE
    // ========================================
    const runOpenAISteps = async () => {
      const openAIResults: any = { unified: null, copywriting: null };
      let unifiedData: any = null;

      // ETAPA 1: UNIFIED COMMANDS (OpenAI) - COM SKIP SE EXISTE
      if (needsUnified) {
        const step1Start = Date.now();
        console.log(`[FULL-AUTOMATION][${automationId}] 📝 [OpenAI] Iniciando Unified Commands...`);

        const unifiedResponse = await supabase.functions.invoke('unified-commands', {
          body: {
            productImages: input.productImages,
            productName: input.formData?.nome || 'Produto',
            shortDescription: input.formData?.descricao_curta || input.formData?.nome || 'Produto sem descrição',
            longDescription: input.formData?.descricao || '',
            userId,
            forceAPI: 'openai'
          },
          headers: internalHeaders
        });

        if (unifiedResponse.error) {
          console.error(`[FULL-AUTOMATION][${automationId}] ❌ [OpenAI] unified-commands ERRO:`, unifiedResponse.error);
          throw new Error(`Unified commands failed: ${unifiedResponse.error.message}`);
        }

        const step1Duration = Date.now() - step1Start;
        openAIResults.unified = {
          status: 'completed',
          data: unifiedResponse.data,
          completedAt: new Date().toISOString(),
          durationMs: step1Duration
        };
        unifiedData = unifiedResponse.data?.result || unifiedResponse.data;
        console.log(`[FULL-AUTOMATION][${automationId}] ✅ [OpenAI] Unified Commands COMPLETO em ${step1Duration}ms`);
      } else {
        // ⏭️ SKIP: Usar dados do cache
        console.log(`[FULL-AUTOMATION][${automationId}] ⏭️ [OpenAI] SKIP Unified Commands (usando cache)`);
        openAIResults.unified = {
          status: 'cached',
          data: existingAssets.unifiedData,
          fromCache: true,
          durationMs: 0
        };
        unifiedData = existingAssets.unifiedData;
      }

      // ✅ ATUALIZAR PROGRESSO: Unified completo, iniciando Copywriting
      await updateJobWithRetry(supabase, job.id, {
        result: { currentStep: 'copywriting', progress: 25, steps: { unified: openAIResults.unified } }
      });

      // ETAPA 2: COPYWRITING - COM SKIP SE EXISTE
      if (needsCopywriting) {
        const step2Start = Date.now();
        console.log(`[FULL-AUTOMATION][${automationId}] ✍️ [OpenAI] Iniciando Copywriting via ai-chat-proxy...`);

        const copywritingPrompt = buildCopywritingPrompt(unifiedData, input.formData);

        try {
          // ✅ CHAMADA VIA AI-CHAT-PROXY (mantém arquitetura de filas)
          const copywritingUrl = `${supabaseUrl}/functions/v1/ai-chat-proxy`;

          const copywritingResponse = await fetch(copywritingUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-worker-key': internalWorkerSecret,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
              action: 'generate_copywriting',
              prompt: copywritingPrompt,
              targetFunction: 'openai-copywriting',
              _userId: userId
            })
          });

          const step2Duration = Date.now() - step2Start;

          if (!copywritingResponse.ok) {
            const errorText = await copywritingResponse.text();
            console.warn(`[FULL-AUTOMATION][${automationId}] ⚠️ [OpenAI] Copywriting FALHOU (${step2Duration}ms): ${errorText.slice(0, 200)}`);
            openAIResults.copywriting = { status: 'failed', error: errorText, durationMs: step2Duration };
          } else {
            const copywritingData = await copywritingResponse.json();
            const generatedText = copywritingData.generatedText || copywritingData.copywriting || '';

            console.log(`[FULL-AUTOMATION][${automationId}] ✅ [OpenAI] Copywriting COMPLETO em ${step2Duration}ms`);
            console.log(`[FULL-AUTOMATION][${automationId}] 📊 [OpenAI] Tokens: ${copywritingData.usage?.total_tokens || 'N/A'}`);

            openAIResults.copywriting = {
              status: 'completed',
              data: {
                generatedText,
                copywriting: generatedText,
                usage: copywritingData.usage
              },
              completedAt: new Date().toISOString(),
              durationMs: step2Duration
            };
          }
        } catch (copyError: any) {
          const step2Duration = Date.now() - step2Start;
          console.error(`[FULL-AUTOMATION][${automationId}] ❌ [OpenAI] Copywriting ERRO:`, copyError.message);
          openAIResults.copywriting = { status: 'failed', error: copyError.message, durationMs: step2Duration };
        }
      } else {
        // ⏭️ SKIP: Usar dados do cache
        console.log(`[FULL-AUTOMATION][${automationId}] ⏭️ [OpenAI] SKIP Copywriting (usando cache)`);
        openAIResults.copywriting = {
          status: 'cached',
          data: { generatedText: existingAssets.copywritingData },
          fromCache: true,
          durationMs: 0
        };
      }

      return { openAIResults, unifiedData };
    };

    // ========================================
    // FASE 1: Gemini (Fundo Branco + Kits) COM CACHE - Roda em PARALELO com OpenAI
    // Lifestyle/Premium vão para FASE 2 (aguarda dados do Copywriting)
    // ========================================
    const runGeminiFase1WithKits = async () => {
      const step3Start = Date.now();
      console.log(`[FULL-AUTOMATION][${automationId}] 🖼️ [Gemini FASE 1] Iniciando Fundo Branco + Kits (paralelo com OpenAI)...`);

      let whiteBackgroundImage: string | null = null;
      let kitImages: string[] = [];

      // ⏭️ SKIP: Verificar se fundo branco já existe
      if (!needsWhiteBackground && existingAssets.whiteBackgroundUrl) {
        console.log(`[FULL-AUTOMATION][${automationId}] ⏭️ [FASE 1] SKIP Fundo Branco (usando cache: ${existingAssets.whiteBackgroundUrl.substring(0, 50)}...)`);
        whiteBackgroundImage = existingAssets.whiteBackgroundUrl;
      } else {
        // Gerar apenas o prompt de fundo branco para Fase 1
        // Incluir campos de contexto do formulário se disponíveis
        const prompts = generateGeminiPrompts({
          productName: input.formData?.nome || 'Produto',
          productCategory: input.formData?.categoria || input.formData?.nome || 'Produto',
          shortDescription: input.formData?.descricao_curta || '',
          longDescription: input.formData?.descricao || input.formData?.descricao_longa || '',
          idealEnvironments: [], // Será preenchido na Fase 2 com dados do Copywriting
          mainKeywords: [],
          dimensions: {
            altura: input.formData?.altura,
            largura: input.formData?.largura,
            profundidade: input.formData?.profundidade,
            peso_bruto: input.formData?.peso_bruto
          },
          // NOVOS: Campos de contexto explícito do formulário
          cenarioIdeal: input.formData?.cenario_ideal || '',
          contextoUso: input.formData?.contexto_uso || '',
          categoriaFormulario: input.formData?.categoria_produto || ''
        });
        const whiteBackgroundPrompt = prompts.find(p => p.isWhiteBackground);

        console.log(`[FULL-AUTOMATION][${automationId}] 📋 [Gemini FASE 1] Gerando FUNDO BRANCO (Lifestyle/Premium na Fase 2)`);

        // API Key "word" - usada para todas as gerações Gemini na automação
        const GEMINI_WORD_KEY_ID = '6698752c-1ec4-426b-baf5-8c66f0d33059';

        // Helper: Gerar e fazer upload de uma imagem
        const generateAndUploadImage = async (promptConfig: any, index: number): Promise<string | null> => {
          const imgStart = Date.now();
          console.log(`[FULL-AUTOMATION][${automationId}] 🎨 [Gemini] Gerando: ${promptConfig.name} (usando API Key 'word')`);

          // Log do contexto sendo enviado
          if (promptConfig.productContext) {
            console.log(`[FULL-AUTOMATION][${automationId}] 📋 [Gemini] Contexto do produto:`, {
              nome: promptConfig.productContext.productName,
              categoria: promptConfig.productContext.productCategory,
              ambientes: promptConfig.productContext.idealEnvironments?.slice(0, 2),
              keywords: promptConfig.productContext.mainKeywords?.slice(0, 2)
            });
          }

          try {
            // ✅ ENVIAR ATÉ 2 IMAGENS DE REFERÊNCIA
            const referenceImages = input.productImages?.slice(0, 2) || [];
            console.log(`[FULL-AUTOMATION][${automationId}] 🖼️ [FASE 1] Enviando ${referenceImages.length} imagem(ns) para Gemini`);

            const geminiResponse = await supabase.functions.invoke('gemini-background-generator', {
              body: {
                imageData: referenceImages.length === 1 ? referenceImages[0] : referenceImages,
                prompt: promptConfig.prompt,
                action: 'generate_background',
                apiKeyId: GEMINI_WORD_KEY_ID,
                // ✅ NOVO: Enviar contexto completo do produto
                productContext: promptConfig.productContext || {
                  productName: input.formData?.nome || 'Produto',
                  productCategory: input.formData?.categoria || input.formData?.nome || 'Produto',
                  shortDescription: input.formData?.descricao_curta || '',
                  longDescription: input.formData?.descricao || '',
                  idealEnvironments: input.formData?.ideal_environments || ['ambiente moderno'],
                  mainKeywords: input.formData?.main_keywords || ['qualidade']
                },
                // ✅ NOVO: Enviar dimensões se disponíveis
                dimensions: promptConfig.productContext?.dimensions || {
                  altura: input.formData?.altura,
                  largura: input.formData?.largura,
                  profundidade: input.formData?.profundidade,
                  peso_bruto: input.formData?.peso_bruto
                }
              },
              headers: internalHeaders
            });

            const imgDuration = Date.now() - imgStart;
            const base64Image = geminiResponse.data?.generatedImage || geminiResponse.data?.imageUrl;

            if (!geminiResponse.error && base64Image) {
              // ✅ COLETAR dados de custo do Gemini
              const usage = geminiResponse.data?.usage;
              if (usage) {
                geminiCostAccumulator.totalCostUSD += usage.estimatedCostUSD || 0;
                geminiCostAccumulator.totalCostBRL += usage.estimatedCostBRL || 0;
                geminiCostAccumulator.totalTokens += usage.totalTokens || 0;
                geminiCostAccumulator.imagesGenerated++;
                geminiCostAccumulator.modelUsed = usage.model || 'gemini-2.5-flash-image-preview';
                geminiCostAccumulator.imagesCosts.push({
                  imageType: promptConfig.name || 'fundo-branco',
                  costUSD: usage.estimatedCostUSD || 0,
                  costBRL: usage.estimatedCostBRL || 0,
                  tokens: usage.totalTokens || 0,
                  model: usage.model || 'unknown',
                  durationMs: imgDuration
                });
                console.log(`[FULL-AUTOMATION][${automationId}] 💰 [Gemini] ${promptConfig.name}: $${(usage.estimatedCostUSD || 0).toFixed(4)} / R$${(usage.estimatedCostBRL || 0).toFixed(2)}`);
              }

              console.log(`[FULL-AUTOMATION][${automationId}] ✅ [Gemini] ${promptConfig.name} pronto em ${imgDuration}ms (data URL temporário)`);
              return base64Image;
            } else {
              console.warn(`[FULL-AUTOMATION][${automationId}] ⚠️ [Gemini] Falha ${promptConfig.name} (${imgDuration}ms):`, geminiResponse.error?.message);
              return null;
            }
          } catch (imgError: any) {
            console.warn(`[FULL-AUTOMATION][${automationId}] ⚠️ [Gemini] Erro ${promptConfig.name}:`, imgError.message);
            return null;
          }
        };

        // ========================================
        // ETAPA: Gerar FUNDO BRANCO
        // ========================================
        console.log(`[FULL-AUTOMATION][${automationId}] 🎯 [FASE 1] Gerando FUNDO BRANCO...`);
        if (whiteBackgroundPrompt) {
          whiteBackgroundImage = await generateAndUploadImage(whiteBackgroundPrompt, 0);
        }
      }

      // ========================================
      // ETAPA: Gerar KITS (se temos fundo branco)
      // ========================================
      if (whiteBackgroundImage) {
        console.log(`[FULL-AUTOMATION][${automationId}] ✅ [FASE 1] Fundo branco pronto! Verificando Kits...`);

        // ⏭️ SKIP: Verificar se kits já existem
        if (!needsKits && existingAssets.kitUrls.length >= 7) {
          console.log(`[FULL-AUTOMATION][${automationId}] ⏭️ [FASE 1] SKIP Kits (usando cache: ${existingAssets.kitUrls.length} kits)`);
          kitImages = existingAssets.kitUrls;
        } else {
          // Gerar Kits (apenas os faltantes)
          const generateKits = async (): Promise<string[]> => {
            const kitsStart = Date.now();
            const kits: string[] = [...existingAssets.kitUrls]; // Começar com os existentes

            const KIT_CTAS = [
              "KIT com 2 unidades",
              "KIT com 4 unidades",
              "KIT com 6 unidades",
              "KIT com 8 unidades",
              "KIT com 10 unidades",
              "KIT com 20 unidades",
              "KIT com 30 unidades"
            ];
            const BENEFIT_TEXT = "Leve mais e Pague menos!";

            // Gerar apenas os kits faltantes
            const startIndex = existingAssets.kitUrls.length;
            const kitsToGenerate = KIT_CTAS.slice(startIndex);

            console.log(`[FULL-AUTOMATION][${automationId}] 📦 [Kits] Gerando ${kitsToGenerate.length} kits faltantes (${startIndex} já existem)...`);

            for (let i = 0; i < kitsToGenerate.length; i++) {
              try {
                const cloudinaryResponse = await supabase.functions.invoke('cloudinary-transform', {
                  body: {
                    imageUrl: whiteBackgroundImage,
                    ctaText: kitsToGenerate[i],
                    benefitText: BENEFIT_TEXT
                  },
                  headers: internalHeaders
                });

                if (!cloudinaryResponse.error && cloudinaryResponse.data?.transformedUrl) {
                  kits.push(cloudinaryResponse.data.transformedUrl);
                  console.log(`[FULL-AUTOMATION][${automationId}] ✅ [Kits] Kit ${startIndex + i + 1}/7 gerado`);
                }
              } catch (kitError: any) {
                console.warn(`[FULL-AUTOMATION][${automationId}] ⚠️ [Kits] Erro kit ${startIndex + i + 1}:`, kitError.message);
              }
            }

            const kitsDuration = Date.now() - kitsStart;
            console.log(`[FULL-AUTOMATION][${automationId}] ✅ [Kits] ${kits.length} kits totais em ${kitsDuration}ms (${kitsToGenerate.length} novos)`);
            return kits;
          };

          kitImages = await generateKits();
        }
      }

      const step3Duration = Date.now() - step3Start;
      const fromCache = !needsWhiteBackground && !needsKits;
      console.log(`[FULL-AUTOMATION][${automationId}] ✅ [FASE 1] COMPLETO em ${step3Duration}ms: Fundo branco + ${kitImages.length} kits ${fromCache ? '(CACHE)' : ''}`);

      return {
        whiteBackgroundImage,
        kitImages,
        durationMs: step3Duration,
        fromCache
      };
    };

    // ========================================
    // FASE 2: Gerar Lifestyle + Premium COM DADOS DO COPYWRITING
    // Esta função é chamada APÓS OpenAI completar
    // ========================================
    const runGeminiFase2 = async (
      whiteBackgroundImage: string | null,
      richContext: {
        productName: string;
        productCategory: string;
        shortDescription: string;
        longDescription: string;
        idealEnvironments: string[];
        mainKeywords: string[];
        copywritingEnvironments: string[];
        targetAudience: string;
        dimensions?: any;
        // NOVOS: Campos de contexto explícito do formulário
        cenarioIdeal?: string;
        contextoUso?: string;
        categoriaFormulario?: string;
      }
    ): Promise<{ geminiImages: string[]; durationMs: number; resultsByType: Record<string, { prompt_mj: string | null; imageUrl: string | null }>; fromCache?: boolean }> => {
      const fase2Start = Date.now();

      // ⏭️ SKIP: Verificar se imagens ambient já existem
      if (!needsAmbientImages && existingAssets.ambientUrls.length >= 2) {
        console.log(`[FULL-AUTOMATION][${automationId}] ⏭️ [FASE 2] SKIP Ambient Images (usando cache: ${existingAssets.ambientUrls.length} imagens)`);
        return {
          geminiImages: existingAssets.ambientUrls,
          durationMs: Date.now() - fase2Start,
          resultsByType: {},
          fromCache: true
        };
      }

      console.log(`[FULL-AUTOMATION][${automationId}] 🎨 [FASE 2] Iniciando Lifestyle + Premium COM CONTEXTO DO COPYWRITING...`);
      console.log(`[FULL-AUTOMATION][${automationId}] 📋 [FASE 2] Contexto rico:`);
      console.log(`  - Produto: ${richContext.productName}`);
      console.log(`  - Cenário do Formulário: ${richContext.cenarioIdeal || 'N/A'}`);
      console.log(`  - Contexto de Uso: ${richContext.contextoUso || 'N/A'}`);
      console.log(`  - Categoria Formulário: ${richContext.categoriaFormulario || 'N/A'}`);
      console.log(`  - Ambientes do Copywriting: ${richContext.copywritingEnvironments.join(', ') || 'N/A'}`);
      console.log(`  - Ambientes do Unified: ${richContext.idealEnvironments.join(', ') || 'N/A'}`);
      console.log(`  - Keywords: ${richContext.mainKeywords.join(', ') || 'N/A'}`);

      const geminiImages: string[] = [...existingAssets.ambientUrls]; // Começar com existentes

      // PRIORIDADE DE AMBIENTES:
      // 1. Cenário explícito do formulário (máxima prioridade)
      // 2. Ambientes do Copywriting
      // 3. Ambientes do Unified Commands
      // 4. Inferência automática (fallback)
      let effectiveEnvironments: string[];

      if (richContext.cenarioIdeal && richContext.cenarioIdeal.trim().length > 5) {
        effectiveEnvironments = [richContext.cenarioIdeal.trim()];
        console.log(`[FULL-AUTOMATION][${automationId}] ✅ [FASE 2] Usando cenário EXPLÍCITO: "${richContext.cenarioIdeal}"`);
      } else if (richContext.copywritingEnvironments.length > 0) {
        effectiveEnvironments = richContext.copywritingEnvironments;
        console.log(`[FULL-AUTOMATION][${automationId}] 📋 [FASE 2] Usando ambientes do Copywriting`);
      } else if (richContext.idealEnvironments.length > 0) {
        effectiveEnvironments = richContext.idealEnvironments;
        console.log(`[FULL-AUTOMATION][${automationId}] 📋 [FASE 2] Usando ambientes do Unified`);
      } else {
        effectiveEnvironments = inferEnvironmentsFromProduct(richContext.productName, richContext.shortDescription, richContext.productCategory);
        console.log(`[FULL-AUTOMATION][${automationId}] 🔄 [FASE 2] Usando inferência automática`);
      }

      // Adicionar contexto de uso se fornecido
      if (richContext.contextoUso && richContext.contextoUso.trim().length > 10) {
        effectiveEnvironments = [richContext.contextoUso.trim(), ...effectiveEnvironments].slice(0, 5);
        console.log(`[FULL-AUTOMATION][${automationId}] 👥 [FASE 2] Adicionando contexto de uso`);
      }

      // Construir prompts para Fase 2 com contexto RICO
      const productContext: ProductContext = {
        productName: richContext.productName,
        productCategory: richContext.productCategory,
        shortDescription: richContext.shortDescription,
        longDescription: richContext.longDescription,
        idealEnvironments: effectiveEnvironments,
        mainKeywords: richContext.mainKeywords.length > 0
          ? richContext.mainKeywords
          : inferKeywordsFromProduct(richContext.productName, richContext.shortDescription),
        dimensions: richContext.dimensions
      };

      // ========================================
      // INFERÊNCIA INTELIGENTE DE CENÁRIOS E PERSONAS
      // ========================================

      // Mapear categoria para ambiente ideal de mockup
      const inferMockupEnvironment = (
        categoria: string | undefined,
        cenarioIdeal: string | undefined,
        productName: string
      ): string => {
        // Prioridade 1: Cenário explícito do usuário
        if (cenarioIdeal && cenarioIdeal.trim().length > 5) {
          console.log(`[FULL-AUTOMATION][${automationId}] 🏠 Mockup: Usando cenário do usuário: ${cenarioIdeal.trim()}`);
          return cenarioIdeal.trim();
        }

        // Prioridade 2: Baseado na categoria
        const categoryEnvironments: Record<string, string> = {
          'infantil': 'colorful children bedroom with toys and playful decor, warm lighting',
          'brinquedos': 'colorful children playroom with toys, fun and playful atmosphere',
          'cozinha': 'modern kitchen with marble countertop, cooking environment, warm lighting',
          'escritorio': 'professional home office, organized workspace, modern desk',
          'beleza': 'elegant bathroom vanity with mirror, beauty setup, soft lighting',
          'cosmeticos': 'elegant bathroom vanity with soft lighting, luxury spa atmosphere',
          'tecnologia': 'modern desk setup with clean lines, tech workspace, minimalist',
          'fitness': 'home gym or living room with exercise space, energetic atmosphere',
          'esportes': 'gym or outdoor sports environment, dynamic setting',
          'pet': 'cozy living room with pet-friendly decor, warm home atmosphere',
          'animais': 'cozy home with pet, comfortable living space',
          'moda': 'stylish bedroom or dressing area with mirror, fashion setup',
          'roupas': 'elegant wardrobe or dressing room, fashion lifestyle',
          'casa': 'modern living room with contemporary decor, comfortable atmosphere',
          'decoracao': 'elegant interior design setting, stylish home decor',
          'jardim': 'sunny backyard or garden patio, natural outdoor setting',
          'saude': 'clean bathroom or wellness space, healthy lifestyle',
          'automotivo': 'garage or car interior setting, automotive environment',
          'eletronicos': 'modern home office or living room with tech gadgets',
          'alimentos': 'kitchen countertop or dining table, food photography setting',
          'bebidas': 'elegant bar setup or kitchen counter, lifestyle setting'
        };

        const categoriaLower = (categoria || '').toLowerCase();
        for (const [key, value] of Object.entries(categoryEnvironments)) {
          if (categoriaLower.includes(key)) {
            console.log(`[FULL-AUTOMATION][${automationId}] 🏠 Mockup: Inferido da categoria "${categoria}": ${value}`);
            return value;
          }
        }

        // Prioridade 3: Inferir do nome do produto
        const productLower = productName.toLowerCase();
        if (productLower.includes('brinquedo') || productLower.includes('infantil') || productLower.includes('bebê') || productLower.includes('criança') || productLower.includes('kids')) {
          const env = 'colorful children bedroom with toys and playful decor, warm lighting';
          console.log(`[FULL-AUTOMATION][${automationId}] 🏠 Mockup: Inferido do nome do produto (infantil): ${env}`);
          return env;
        }
        if (productLower.includes('cozinha') || productLower.includes('panela') || productLower.includes('frigideira') || productLower.includes('utensilio')) {
          const env = 'modern kitchen with marble countertop, cooking environment';
          console.log(`[FULL-AUTOMATION][${automationId}] 🏠 Mockup: Inferido do nome do produto (cozinha): ${env}`);
          return env;
        }
        if (productLower.includes('pet') || productLower.includes('cachorro') || productLower.includes('gato') || productLower.includes('animal')) {
          const env = 'cozy living room with pet-friendly decor, warm home atmosphere';
          console.log(`[FULL-AUTOMATION][${automationId}] 🏠 Mockup: Inferido do nome do produto (pet): ${env}`);
          return env;
        }
        if (productLower.includes('maquiagem') || productLower.includes('cosmetic') || productLower.includes('beleza') || productLower.includes('skincare')) {
          const env = 'elegant bathroom vanity with mirror, beauty setup, soft lighting';
          console.log(`[FULL-AUTOMATION][${automationId}] 🏠 Mockup: Inferido do nome do produto (beleza): ${env}`);
          return env;
        }

        // Fallback
        console.log(`[FULL-AUTOMATION][${automationId}] 🏠 Mockup: Usando ambiente genérico`);
        return 'modern lifestyle setting, clean aesthetic, natural lighting';
      };

      // Mapear categoria para persona ideal de lifestyle
      const inferLifestylePersona = (
        categoria: string | undefined,
        contextoUso: string | undefined,
        targetAudience: string | undefined,
        productName: string
      ): { persona: string; scenario: string; mood: string } => {
        // Prioridade 1: Contexto de uso explícito
        if (contextoUso && contextoUso.trim().length > 10) {
          console.log(`[FULL-AUTOMATION][${automationId}] 👤 Lifestyle: Usando contexto do usuário: ${contextoUso.trim()}`);
          return {
            persona: contextoUso.trim(),
            scenario: 'authentic real-life setting',
            mood: 'natural and candid'
          };
        }

        // Prioridade 2: Público-alvo do copywriting
        if (targetAudience && targetAudience.trim().length > 5) {
          console.log(`[FULL-AUTOMATION][${automationId}] 👤 Lifestyle: Usando público-alvo: ${targetAudience.trim()}`);
          return {
            persona: targetAudience.trim(),
            scenario: 'relevant daily life setting',
            mood: 'authentic and relatable'
          };
        }

        // Prioridade 3: Baseado na categoria
        const categoryPersonas: Record<string, { persona: string; scenario: string; mood: string }> = {
          'infantil': {
            persona: 'happy child (5-10 years old) playing joyfully',
            scenario: 'colorful playroom or children bedroom',
            mood: 'joyful, playful and fun'
          },
          'brinquedos': {
            persona: 'excited child playing with toy',
            scenario: 'colorful playroom with toys',
            mood: 'happy, playful and energetic'
          },
          'cozinha': {
            persona: 'home cook or professional chef preparing food',
            scenario: 'modern kitchen while cooking',
            mood: 'warm and inviting'
          },
          'escritorio': {
            persona: 'professional adult working productively',
            scenario: 'home office or corporate workspace',
            mood: 'focused and productive'
          },
          'beleza': {
            persona: 'woman doing skincare or makeup routine',
            scenario: 'bathroom vanity or dressing table',
            mood: 'elegant and self-care'
          },
          'cosmeticos': {
            persona: 'woman applying beauty products',
            scenario: 'elegant vanity with mirror',
            mood: 'glamorous and self-care'
          },
          'tecnologia': {
            persona: 'tech-savvy young adult using device',
            scenario: 'modern home or cafe setting',
            mood: 'connected and modern'
          },
          'fitness': {
            persona: 'fit person exercising or post-workout',
            scenario: 'gym or home workout space',
            mood: 'energetic and healthy'
          },
          'esportes': {
            persona: 'athlete or sports enthusiast',
            scenario: 'outdoor sports field or gym',
            mood: 'dynamic and active'
          },
          'pet': {
            persona: 'loving pet owner with their dog or cat',
            scenario: 'cozy home with beloved pet',
            mood: 'loving and caring'
          },
          'animais': {
            persona: 'happy pet owner caring for pet',
            scenario: 'home environment with pet',
            mood: 'affectionate and joyful'
          },
          'moda': {
            persona: 'stylish person getting ready',
            scenario: 'bedroom or dressing room with mirror',
            mood: 'fashionable and confident'
          },
          'roupas': {
            persona: 'fashion-conscious person trying clothes',
            scenario: 'stylish wardrobe or boutique',
            mood: 'trendy and confident'
          },
          'casa': {
            persona: 'homeowner enjoying their comfortable space',
            scenario: 'cozy living area',
            mood: 'relaxed and comfortable'
          },
          'decoracao': {
            persona: 'person admiring home decor',
            scenario: 'beautifully decorated living space',
            mood: 'satisfied and proud'
          },
          'jardim': {
            persona: 'gardener tending to plants outdoors',
            scenario: 'sunny garden or backyard',
            mood: 'peaceful and nature-connected'
          },
          'saude': {
            persona: 'health-conscious adult',
            scenario: 'bathroom or wellness setting',
            mood: 'healthy and mindful'
          },
          'automotivo': {
            persona: 'car enthusiast or driver',
            scenario: 'car interior or garage',
            mood: 'automotive passion'
          },
          'alimentos': {
            persona: 'person enjoying delicious food',
            scenario: 'kitchen or dining table',
            mood: 'satisfied and appetizing'
          },
          'bebidas': {
            persona: 'person savoring a drink',
            scenario: 'cafe, bar, or kitchen',
            mood: 'refreshing and enjoyable'
          }
        };

        const categoriaLower = (categoria || '').toLowerCase();
        for (const [key, value] of Object.entries(categoryPersonas)) {
          if (categoriaLower.includes(key)) {
            console.log(`[FULL-AUTOMATION][${automationId}] 👤 Lifestyle: Inferido da categoria "${categoria}": ${value.persona}`);
            return value;
          }
        }

        // Prioridade 4: Inferir do nome do produto
        const productLower = productName.toLowerCase();
        if (productLower.includes('brinquedo') || productLower.includes('infantil') || productLower.includes('bebê') || productLower.includes('kids')) {
          const persona = {
            persona: 'happy child playing with toy, genuine joy',
            scenario: 'colorful playroom or children bedroom',
            mood: 'joyful, playful and fun'
          };
          console.log(`[FULL-AUTOMATION][${automationId}] 👤 Lifestyle: Inferido do nome (infantil): ${persona.persona}`);
          return persona;
        }
        if (productLower.includes('criança')) {
          const persona = {
            persona: 'child (6-12 years old) using product happily',
            scenario: 'home or school setting',
            mood: 'fun and engaging'
          };
          console.log(`[FULL-AUTOMATION][${automationId}] 👤 Lifestyle: Inferido do nome (criança): ${persona.persona}`);
          return persona;
        }
        if (productLower.includes('pet') || productLower.includes('cachorro') || productLower.includes('gato')) {
          const persona = {
            persona: 'loving pet owner with their pet',
            scenario: 'cozy home environment',
            mood: 'affectionate and caring'
          };
          console.log(`[FULL-AUTOMATION][${automationId}] 👤 Lifestyle: Inferido do nome (pet): ${persona.persona}`);
          return persona;
        }
        if (productLower.includes('maquiagem') || productLower.includes('cosmetic') || productLower.includes('beleza')) {
          const persona = {
            persona: 'woman applying beauty products',
            scenario: 'elegant vanity with soft lighting',
            mood: 'glamorous and confident'
          };
          console.log(`[FULL-AUTOMATION][${automationId}] 👤 Lifestyle: Inferido do nome (beleza): ${persona.persona}`);
          return persona;
        }

        // Fallback genérico
        console.log(`[FULL-AUTOMATION][${automationId}] 👤 Lifestyle: Usando persona genérica`);
        return {
          persona: 'person naturally using the product',
          scenario: 'authentic daily life setting',
          mood: 'relaxed and natural'
        };
      };

      // ========================================
      // CONSTRUIR PROMPTS COM INFERÊNCIA INTELIGENTE
      // ========================================
      const buildMidjourneyPrompts = (ctx: typeof productContext) => {
        const productName = ctx.productName || 'Produto';
        const description = ctx.shortDescription || ctx.longDescription || '';
        const keywords = (ctx.mainKeywords || []).slice(0, 5).join(', ') || 'qualidade premium, detalhado';

        // INFERIR ambiente para mockup
        const mockupEnvironment = inferMockupEnvironment(
          richContext.categoriaFormulario,
          richContext.cenarioIdeal,
          productName
        );

        // INFERIR persona para lifestyle
        const lifestylePersona = inferLifestylePersona(
          richContext.categoriaFormulario,
          richContext.contextoUso,
          richContext.targetAudience,
          productName
        );

        console.log(`[FULL-AUTOMATION][${automationId}] 🎯 INFERÊNCIA DE CENÁRIOS:`);
        console.log(`  - Mockup Ambiente: ${mockupEnvironment}`);
        console.log(`  - Lifestyle Persona: ${lifestylePersona.persona}`);
        console.log(`  - Lifestyle Cenário: ${lifestylePersona.scenario}`);
        console.log(`  - Lifestyle Mood: ${lifestylePersona.mood}`);

        return {
          product_studio: {
            prompt_mj: `Professional product photography of ${productName} ${description}, white background, studio lighting, high resolution, commercial photography, centered composition, soft shadows, 8K, detailed, ${keywords} --ar 1:1`,
            prompt_image: `Professional product photography of ${productName} ${description}, white background, studio lighting, high resolution, commercial photography, centered composition, soft shadows, 8K, detailed, ${keywords}, square format aspect ratio 1:1`
          },
          packaging: {
            prompt_mj: `Professional packaging photography, elegant box of ${productName}, ${description}, cardboard material, modern luxury design, clean background, detailed texture, premium look, ${keywords} --ar 4:5`,
            prompt_image: `Professional packaging photography, elegant box of ${productName}, ${description}, cardboard material, modern luxury design, clean background, detailed texture, premium look, ${keywords}, vertical format aspect ratio 4:5`
          },
          mockup: {
            prompt_mj: `Product mockup, ${productName} in ${mockupEnvironment}, ${description}, natural lighting, realistic scene, cozy atmosphere, detailed, ${keywords} --ar 4:5`,
            prompt_image: `Product mockup, ${productName} in ${mockupEnvironment}, ${description}, natural lighting, realistic scene, cozy atmosphere, detailed, ${keywords}, vertical format aspect ratio 4:5`
          },
          lifestyle: {
            prompt_mj: `Lifestyle photography, ${lifestylePersona.persona} with ${productName}, ${lifestylePersona.scenario}, ${description}, natural lighting, candid moment, ${lifestylePersona.mood} atmosphere, realistic, high quality, ${keywords} --ar 4:5`,
            prompt_image: `Lifestyle photography, ${lifestylePersona.persona} with ${productName}, ${lifestylePersona.scenario}, ${description}, natural lighting, candid moment, ${lifestylePersona.mood} atmosphere, realistic, high quality, ${keywords}, vertical format aspect ratio 4:5`
          }
        };
      };

      const midjourneyPrompts = buildMidjourneyPrompts(productContext);
      console.log(`[FULL-AUTOMATION][${automationId}] 📋 [FASE 2] Prompts Midjourney gerados para 4 tipos`);

      const fase2Prompts = [
        // Ambient existentes (mantidos)
        {
          name: 'Ambiente 1 - Lifestyle',
          prompt: 'ambient_1',
          imageType: 'ambient_1',
          promptMJ: `Lifestyle product photography, ${productContext.productName} in ${effectiveEnvironments[0] || 'modern living room'}, natural lighting, cozy atmosphere, realistic scene, high quality product showcase --ar 4:5`,
          productContext
        },
        {
          name: 'Ambiente 2 - Premium',
          prompt: 'ambient_2',
          imageType: 'ambient_2',
          promptMJ: `Premium product photography, ${productContext.productName} in ${effectiveEnvironments[1] || 'elegant luxury setting'}, professional studio lighting, luxurious atmosphere, high-end commercial look --ar 4:5`,
          productContext
        },
        // NOVOS: 4 tipos com prompts Midjourney/DALL-E fixos
        {
          name: 'Studio - Midjourney/DALL-E',
          prompt: midjourneyPrompts.product_studio.prompt_image,
          imageType: 'product_studio',
          promptMJ: midjourneyPrompts.product_studio.prompt_mj,
          productContext
        },
        {
          name: 'Embalagem',
          prompt: midjourneyPrompts.packaging.prompt_image,
          imageType: 'packaging',
          promptMJ: midjourneyPrompts.packaging.prompt_mj,
          productContext
        },
        {
          name: 'Mockup',
          prompt: midjourneyPrompts.mockup.prompt_image,
          imageType: 'mockup',
          promptMJ: midjourneyPrompts.mockup.prompt_mj,
          productContext
        },
        {
          name: 'Lifestyle Humano',
          prompt: midjourneyPrompts.lifestyle.prompt_image,
          imageType: 'lifestyle_human',
          promptMJ: midjourneyPrompts.lifestyle.prompt_mj,
          productContext
        }
      ];

      console.log(`[FULL-AUTOMATION][${automationId}] 🎯 [FASE 2] Ambientes efetivos: ${effectiveEnvironments.join(', ')}`);

      // API Key "word" - usada para todas as gerações Gemini na automação
      const GEMINI_WORD_KEY_ID = '6698752c-1ec4-426b-baf5-8c66f0d33059';

      // ========================================
      // Gerar imagens em paralelo COM rastreamento de resultados por tipo
      // ========================================
      const resultsByType: Record<string, { prompt_mj: string | null; imageUrl: string | null }> = {};

      const generateFase2Image = async (promptConfig: any, index: number): Promise<string | null> => {
        const imgStart = Date.now();
        const imageType = promptConfig.imageType || `ambient_${index}`;

        console.log(`[FULL-AUTOMATION][${automationId}] 🎨 [FASE 2] Gerando: ${promptConfig.name} (type=${imageType})`);
        if (promptConfig.promptMJ) {
          console.log(`[FULL-AUTOMATION][${automationId}]   → Prompt MJ: ${promptConfig.promptMJ.substring(0, 80)}...`);
        }
        console.log(`[FULL-AUTOMATION][${automationId}]   → Ambientes: ${promptConfig.productContext.idealEnvironments.slice(0, 3).join(', ')}`);

        try {
          // ✅ ENVIAR ATÉ 2 IMAGENS DE REFERÊNCIA
          const referenceImages = input.productImages?.slice(0, 2) || [];
          console.log(`[FULL-AUTOMATION][${automationId}] 🖼️ [FASE 2] Enviando ${referenceImages.length} imagem(ns) para Gemini`);

          const geminiResponse = await supabase.functions.invoke('gemini-background-generator', {
            body: {
              imageData: referenceImages.length === 1 ? referenceImages[0] : referenceImages,
              prompt: promptConfig.prompt,
              action: 'generate_background',
              apiKeyId: GEMINI_WORD_KEY_ID,
              productContext: promptConfig.productContext,
              dimensions: promptConfig.productContext.dimensions
            },
            headers: internalHeaders
          });

          const imgDuration = Date.now() - imgStart;
          const base64Image = geminiResponse.data?.generatedImage || geminiResponse.data?.imageUrl;

          if (!geminiResponse.error && base64Image) {
            // ✅ COLETAR dados de custo do Gemini - FASE 2
            const usage = geminiResponse.data?.usage;
            if (usage) {
              geminiCostAccumulator.totalCostUSD += usage.estimatedCostUSD || 0;
              geminiCostAccumulator.totalCostBRL += usage.estimatedCostBRL || 0;
              geminiCostAccumulator.totalTokens += usage.totalTokens || 0;
              geminiCostAccumulator.imagesGenerated++;
              geminiCostAccumulator.modelUsed = usage.model || 'gemini-2.5-flash-image-preview';
              geminiCostAccumulator.imagesCosts.push({
                imageType: imageType,
                costUSD: usage.estimatedCostUSD || 0,
                costBRL: usage.estimatedCostBRL || 0,
                tokens: usage.totalTokens || 0,
                model: usage.model || 'unknown',
                durationMs: imgDuration
              });
              console.log(`[FULL-AUTOMATION][${automationId}] 💰 [FASE 2] ${promptConfig.name}: $${(usage.estimatedCostUSD || 0).toFixed(4)} / R$${(usage.estimatedCostBRL || 0).toFixed(2)}`);
            }

            console.log(`[FULL-AUTOMATION][${automationId}] ✅ [FASE 2] ${promptConfig.name} pronto em ${imgDuration}ms (data URL temporário)`);

            // SEMPRE rastrear resultado por tipo (inclusive ambient_1 e ambient_2)
            resultsByType[imageType] = {
              prompt_mj: promptConfig.promptMJ || null,
              imageUrl: base64Image
            };
            console.log(`[FULL-AUTOMATION][${automationId}] 📋 [FASE 2] Resultado salvo para ${imageType}`);

            return base64Image;
          } else {
            console.warn(`[FULL-AUTOMATION][${automationId}] ⚠️ [FASE 2] Falha ${promptConfig.name} (${imgDuration}ms):`, geminiResponse.error?.message);
            return null;
          }
        } catch (imgError: any) {
          console.warn(`[FULL-AUTOMATION][${automationId}] ⚠️ [FASE 2] Erro ${promptConfig.name}:`, imgError.message);
          return null;
        }
      };

      // Executar Lifestyle e Premium em paralelo
      const results = await Promise.all(
        fase2Prompts.map((prompt, idx) => generateFase2Image(prompt, idx))
      );

      geminiImages.push(...results.filter((img): img is string => img !== null));

      const fase2Duration = Date.now() - fase2Start;
      console.log(`[FULL-AUTOMATION][${automationId}] ✅ [FASE 2] COMPLETO em ${fase2Duration}ms: ${geminiImages.length} imagens`);
      console.log(`[FULL-AUTOMATION][${automationId}] 📋 [FASE 2] resultsByType: ${Object.keys(resultsByType).join(', ')}`);

      return { geminiImages, durationMs: fase2Duration, resultsByType };
    };

    // ========================================
    // EXECUTAR EM PARALELO: OpenAI + Gemini FASE 1 (Fundo Branco + Kits)
    // ========================================
    console.log(`[FULL-AUTOMATION][${automationId}] ⚡ FASE 1: OpenAI + (Fundo Branco + Kits) em PARALELO...`);
    const fase1Start = Date.now();

    const [openAIData, geminiFase1Data] = await Promise.all([
      runOpenAISteps(),
      runGeminiFase1WithKits()
    ]);

    const fase1Duration = Date.now() - fase1Start;
    console.log(`[FULL-AUTOMATION][${automationId}] ✅ FASE 1 concluída em ${fase1Duration}ms`);

    // ✅ ATUALIZAR PROGRESSO: Fase 1 completa (Unified + Copywriting + Fundo Branco + Kits da Fase 1)
    await updateJobWithRetry(supabase, job.id, {
      result: {
        currentStep: 'gemini',
        progress: 50,
        steps: {
          unified: openAIData.openAIResults.unified,
          copywriting: openAIData.openAIResults.copywriting
        }
      }
    });

    // ========================================
    // EXTRAIR DADOS RICOS DO COPYWRITING PARA FASE 2
    // ========================================
    const copywritingText = openAIData.openAIResults.copywriting?.data?.generatedText || '';
    const unifiedData = openAIData.unifiedData || {};

    // Extrair "Ambientes Ideais" do Copywriting (tópico 9)
    const copywritingEnvironments = extractEnvironmentsFromCopywriting(copywritingText);

    console.log(`[FULL-AUTOMATION][${automationId}] 📋 Dados extraídos do Copywriting:`);
    console.log(`  - Ambientes do Copywriting: ${copywritingEnvironments.join(', ') || 'Nenhum encontrado'}`);
    console.log(`  - Ambientes do Unified: ${(unifiedData.idealEnvironments || []).join(', ') || 'Nenhum'}`);
    console.log(`  - Keywords: ${(unifiedData.mainKeywords || []).join(', ') || 'Nenhum'}`);

    // Construir contexto rico para Fase 2
    // PRIORIDADE: cenario_ideal do formulário > copywritingEnvironments > unifiedData.idealEnvironments > inferência
    const richContext = {
      productName: input.formData?.nome || 'Produto',
      productCategory: input.formData?.categoria || input.formData?.nome || 'Produto',
      shortDescription: input.formData?.descricao_curta || '',
      longDescription: input.formData?.descricao || input.formData?.descricao_longa || '',
      idealEnvironments: unifiedData.idealEnvironments || [],
      mainKeywords: unifiedData.mainKeywords || [],
      copywritingEnvironments,
      targetAudience: unifiedData.targetAudience || '',
      dimensions: {
        altura: input.formData?.altura,
        largura: input.formData?.largura,
        profundidade: input.formData?.profundidade,
        peso_bruto: input.formData?.peso_bruto
      },
      // NOVOS: Campos de contexto explícito do formulário (alta prioridade)
      cenarioIdeal: input.formData?.cenario_ideal || '',
      contextoUso: input.formData?.contexto_uso || '',
      categoriaFormulario: input.formData?.categoria_produto || ''
    };

    // ========================================
    // FASE 2: Gerar Lifestyle + Premium com CONTEXTO RICO do Copywriting
    // ========================================
    console.log(`[FULL-AUTOMATION][${automationId}] ⚡ FASE 2: Gerando Lifestyle + Premium COM dados do Copywriting...`);

    const geminiFase2Data = await runGeminiFase2(geminiFase1Data.whiteBackgroundImage, richContext);

    // ========================================
    // COMBINAR RESULTADOS
    // ========================================
    const allGeminiImages = [
      geminiFase1Data.whiteBackgroundImage,
      ...geminiFase2Data.geminiImages
    ].filter((img): img is string => img !== null);

    const kitImages = geminiFase1Data.kitImages || [];

    // Atribuir resultados
    result.steps.unified = openAIData.openAIResults.unified;
    result.steps.copywriting = openAIData.openAIResults.copywriting;
    result.steps.gemini = {
      status: allGeminiImages.length > 0 ? 'completed' : 'failed',
      images: allGeminiImages,
      whiteBackgroundImage: geminiFase1Data.whiteBackgroundImage,
      completedAt: new Date().toISOString(),
      durationMs: geminiFase1Data.durationMs + geminiFase2Data.durationMs,
      fase1DurationMs: geminiFase1Data.durationMs,
      fase2DurationMs: geminiFase2Data.durationMs,
      // ✅ NOVO: Prompts Midjourney/DALL-E por tipo para o frontend exibir
      resultsByType: geminiFase2Data.resultsByType || {},
      contextUsed: {
        copywritingEnvironments,
        unifiedEnvironments: unifiedData.idealEnvironments || [],
        mainKeywords: unifiedData.mainKeywords || []
      }
    };

    result.steps.kits = {
      status: kitImages.length > 0 ? 'completed' : 'skipped',
      images: kitImages,
      completedAt: new Date().toISOString(),
      durationMs: geminiFase1Data.durationMs
    };

    // Atualizar progresso final COM RETRY (crítico!)
    await updateJobWithRetry(supabase, job.id, {
      result: { ...result, currentStep: 'kits', progress: 100 }
    });

    // ========================================
    // ✅ SALVAR CUSTOS GEMINI NA TABELA ai_usage_logs
    // ========================================
    if (geminiCostAccumulator.imagesGenerated > 0) {
      try {
        const totalProcessingTime = Date.now() - startTime;

        await supabase.from('ai_usage_logs').insert({
          user_id: userId,
          function_name: 'process-queue/gemini-images',
          api_provider: 'gemini',
          model_used: geminiCostAccumulator.modelUsed,
          command: 'generate_ad_images',
          prompt_tokens: geminiCostAccumulator.totalTokens,
          completion_tokens: 0,
          total_tokens: geminiCostAccumulator.totalTokens,
          estimated_cost_usd: geminiCostAccumulator.totalCostUSD,
          estimated_cost_brl: geminiCostAccumulator.totalCostBRL,
          usd_to_brl_rate: 6.10,
          execution_time_ms: totalProcessingTime,
          success: true,
          request_id: automationId
        });

        console.log(`[FULL-AUTOMATION][${automationId}] 📊 ====== CUSTOS GEMINI SALVOS ======`);
        console.log(`[FULL-AUTOMATION][${automationId}]   💰 Imagens geradas: ${geminiCostAccumulator.imagesGenerated}`);
        console.log(`[FULL-AUTOMATION][${automationId}]   💵 Custo Total: $${geminiCostAccumulator.totalCostUSD.toFixed(4)} USD`);
        console.log(`[FULL-AUTOMATION][${automationId}]   💲 Custo Total: R$${geminiCostAccumulator.totalCostBRL.toFixed(2)} BRL`);
        console.log(`[FULL-AUTOMATION][${automationId}]   🔢 Tokens Total: ${geminiCostAccumulator.totalTokens}`);
        console.log(`[FULL-AUTOMATION][${automationId}]   📋 Detalhes por imagem:`);
        geminiCostAccumulator.imagesCosts.forEach((img, idx) => {
          console.log(`[FULL-AUTOMATION][${automationId}]     ${idx + 1}. ${img.imageType}: $${img.costUSD.toFixed(4)} / R$${img.costBRL.toFixed(2)} (${img.tokens} tokens, ${img.durationMs}ms)`);
        });
        console.log(`[FULL-AUTOMATION][${automationId}] ===================================`);
      } catch (logError: any) {
        console.warn(`[FULL-AUTOMATION][${automationId}] ⚠️ Erro ao salvar custos Gemini:`, logError.message);
      }
    }

    // ========================================
    // ❌ DESABILITADO: NÃO SALVAR NO BANCO DE DADOS
    // Imagens serão convertidas para Blob URL e baixadas diretamente
    // ========================================
    // productName já foi definido no início da função
    console.log(`[FULL-AUTOMATION][${automationId}] ⚡ Imagens NÃO serão salvas no banco - download direto no frontend`);
    console.log(`[FULL-AUTOMATION][${automationId}] 📦 Total de imagens para download: ${allGeminiImages.length + kitImages.length}`);

    // ======================
    // RESULTADO FINAL
    // ======================
    const totalDuration = Date.now() - startTime;
    result.success = true;
    result.completedAt = new Date().toISOString();
    result.summary = {
      unifiedCommandsGenerated: !!result.steps.unified?.data,
      copywritingGenerated: result.steps.copywriting?.status === 'completed',
      geminiImagesCount: allGeminiImages.length,
      kitImagesCount: kitImages.length,
      allImages: [...allGeminiImages, ...kitImages],
      fase1ExecutionMs: fase1Duration,
      fase2ExecutionMs: geminiFase2Data.durationMs,
      totalExecutionMs: totalDuration,
      optimizedFlow: true,
      sequentialFase2: true, // Indica que Fase 2 aguardou OpenAI
      whiteBackgroundImage: geminiFase1Data.whiteBackgroundImage,
      triggerShowcases: allGeminiImages.length >= 3,
      contextUsed: {
        copywritingEnvironments,
        unifiedEnvironments: unifiedData.idealEnvironments || [],
        effectiveEnvironments: copywritingEnvironments.length > 0 ? copywritingEnvironments : (unifiedData.idealEnvironments || [])
      }
    };

    // ✅ INCLUIR CUSTOS GEMINI NO RESULTADO FINAL (para generation_metrics)
    result.usage = {
      model: geminiCostAccumulator.modelUsed,
      totalTokens: geminiCostAccumulator.totalTokens,
      estimatedCostUSD: geminiCostAccumulator.totalCostUSD,
      estimatedCostBRL: geminiCostAccumulator.totalCostBRL,
      imagesGenerated: geminiCostAccumulator.imagesGenerated,
      imagesCosts: geminiCostAccumulator.imagesCosts
    };

    console.log(`[FULL-AUTOMATION][${automationId}] 🎉 Automação OTIMIZADA com FASE 2 SEQUENCIAL finalizada!`);
    console.log(`[FULL-AUTOMATION][${automationId}] 📊 Resumo:`, {
      ...result.summary,
      allImages: `${result.summary.allImages.length} imagens`
    });
    console.log(`[FULL-AUTOMATION][${automationId}] 🎨 Ambientes usados: ${result.summary.contextUsed.effectiveEnvironments.join(', ')}`);

    return result;

  } catch (error: any) {
    console.error(`[FULL-AUTOMATION][${automationId}] 💥 Erro fatal:`, error);
    result.success = false;
    result.error = error.message || 'Erro desconhecido na automação';
    result.completedAt = new Date().toISOString();
    throw error;
  }
}

// ============================================================
// 📋 EXTRATOR DE AMBIENTES DO COPYWRITING (tópico 9)
// Procura por "Ambientes Ideais" no texto gerado pelo copywriting
// ============================================================
function extractEnvironmentsFromCopywriting(copywritingText: string): string[] {
  if (!copywritingText || copywritingText.length < 50) {
    console.log('[EXTRACT-ENVIRONMENTS] ⚠️ Copywriting vazio ou muito curto');
    return [];
  }

  const environments: string[] = [];

  // Padrões para encontrar seção de ambientes ideais
  const patterns = [
    // Padrão 1: "9. Ambientes Ideais" ou similar
    /9\.\s*(?:\*\*)?(?:AMBIENTES?\s*IDEAIS?|Ambientes?\s*Ideais?)(?:\*\*)?[\s:]*\n?([\s\S]*?)(?=\n\d+\.|$)/i,
    // Padrão 2: "Ambientes Ideais:" como header
    /(?:AMBIENTES?\s*IDEAIS?|Ambientes?\s*Ideais?)[\s:]+\n?([\s\S]*?)(?=\n\n|\n[A-Z]|\n\d+\.|$)/i,
    // Padrão 3: Bullets com ambientes
    /(?:ambientes?|locais?|cenários?)[\s:]+(?:ideais?|sugeridos?|recomendados?)[\s:]*\n?([\s\S]*?)(?=\n\n|\n\d+\.|$)/i
  ];

  for (const pattern of patterns) {
    const match = copywritingText.match(pattern);
    if (match && match[1]) {
      const envSection = match[1].trim();

      // Extrair itens da lista (bullets, números, vírgulas)
      const items = envSection
        .split(/[\n•\-\*\d\.]+/)
        .map(item => item.replace(/^\s*[-•\*]\s*/, '').trim())
        .filter(item => {
          // Filtrar itens válidos
          const isValid = item.length > 3 &&
            item.length < 100 &&
            !item.match(/^(\d+|[a-z])\./i) &&
            !item.toLowerCase().includes('copy') &&
            !item.toLowerCase().includes('hashtag') &&
            !item.toLowerCase().includes('palavra-chave');
          return isValid;
        });

      if (items.length > 0) {
        environments.push(...items);
        console.log(`[EXTRACT-ENVIRONMENTS] ✅ Encontrados ${items.length} ambientes: ${items.slice(0, 3).join(', ')}...`);
        break; // Usar primeiro padrão que encontrar
      }
    }
  }

  // Fallback: procurar menções a ambientes no texto geral
  if (environments.length === 0) {
    const generalEnvironments = [
      'cozinha', 'escritório', 'sala', 'quarto', 'banheiro',
      'academia', 'jardim', 'varanda', 'restaurante', 'hotel',
      'clínica', 'estúdio', 'loja', 'casa', 'apartamento'
    ];

    for (const env of generalEnvironments) {
      const regex = new RegExp(`(${env}[\\s\\w]{0,30})`, 'gi');
      const matches = copywritingText.match(regex);
      if (matches) {
        environments.push(...matches.slice(0, 2).map(m => m.trim()));
      }
    }

    if (environments.length > 0) {
      console.log(`[EXTRACT-ENVIRONMENTS] 🔄 Fallback: ${environments.slice(0, 3).join(', ')}...`);
    }
  }

  // Remover duplicatas e limitar a 5
  const uniqueEnvironments = [...new Set(environments)].slice(0, 5);

  console.log(`[EXTRACT-ENVIRONMENTS] 📋 Total: ${uniqueEnvironments.length} ambientes extraídos`);
  return uniqueEnvironments;
}

// Helper: Construir prompt de copywriting COMPLETO com 10 tópicos
function buildCopywritingPrompt(unifiedData: any, formData: any): string {
  const productName = formData?.nome || 'Produto';
  const shortDesc = formData?.descricao_curta || '';
  const longDesc = formData?.descricao_longa || '';
  const price = formData?.preco_venda || formData?.preco || 0;
  const sku = formData?.sku || '';

  // Extrair dados do unified-commands
  const improvedDesc = unifiedData?.improvedText || unifiedData?.melhorado || longDesc || shortDesc;
  const seoDescription = unifiedData?.seoDescription || '';
  const technicalSpecs = unifiedData?.technicalSpecs || '';
  const benefits = unifiedData?.benefits || [];
  const keywords = unifiedData?.keywords || [];
  const targetAudience = unifiedData?.targetAudience || '';
  const idealFor = unifiedData?.idealFor || [];
  const idealEnvironments = unifiedData?.idealEnvironments || [];
  const mainKeywords = unifiedData?.mainKeywords || [];
  const longTailKeywords = unifiedData?.longTailKeywords || [];

  // Construir contexto rico do produto
  const productContext = [
    `Nome do Produto: ${productName}`,
    sku ? `SKU: ${sku}` : '',
    price ? `Preço: R$ ${price}` : '',
    improvedDesc ? `\nDescrição Melhorada:\n${improvedDesc}` : '',
    seoDescription ? `\nDescrição SEO:\n${seoDescription}` : '',
    technicalSpecs ? `\nEspecificações Técnicas:\n${technicalSpecs}` : '',
    benefits.length > 0 ? `\nBenefícios: ${benefits.join(', ')}` : '',
    targetAudience ? `\nPúblico-Alvo: ${targetAudience}` : '',
    idealFor.length > 0 ? `\nIdeal Para: ${idealFor.join(', ')}` : '',
    idealEnvironments.length > 0 ? `\nAmbientes Ideais: ${idealEnvironments.join(', ')}` : '',
    keywords.length > 0 ? `\nPalavras-chave: ${keywords.join(', ')}` : '',
    mainKeywords.length > 0 ? `\nPalavras-chave Principais: ${mainKeywords.join(', ')}` : '',
    longTailKeywords.length > 0 ? `\nPalavras-chave Long Tail: ${longTailKeywords.join(', ')}` : ''
  ].filter(Boolean).join('\n');

  return `INFORMAÇÕES COMPLETAS DO PRODUTO:
${productContext}

---

### Estrutura de Copywriting Profissional Completo

Com base nas informações acima, gere um COPYWRITING PROFISSIONAL COMPLETO seguindo EXATAMENTE esta estrutura com os 10 tópicos obrigatórios:

#### 1. Título Atraente e Impactante:
(Crie um título poderoso e persuasivo que capture atenção e comunique o principal benefício do produto. Use gatilhos emocionais e palavras de poder.)

#### 2. Introdução Captadora de Atenção:
(Parágrafo envolvente de 3-5 linhas que conecte com a dor do cliente, apresente o produto como solução e desperte curiosidade para continuar lendo.)

#### 3. Destaque das Principais Características:
(Liste TODAS as características técnicas e funcionais do produto em formato de bullet points. Inclua: capacidade, dimensões, materiais, tecnologias, funcionalidades, marca, modelo, voltagem, peso, garantia, etc. Seja completo e detalhado.)

#### 4. Dor x Solução para Conversão:
(Crie 2-3 blocos no formato:
PROBLEMA: [Descreva uma dor/frustração real do cliente relacionada ao não ter o produto]
SOLUÇÃO: [Mostre como o produto resolve esse problema específico de forma clara e direta])

#### 5. Principais Benefícios para o Cliente:
(Liste 5-7 benefícios transformacionais do produto. Foque no RESULTADO que o cliente terá, não apenas nas características. Use linguagem emocional e impactante. Cada benefício deve ter título em negrito + explicação.)

#### 6. Gatilho de Escassez e Urgência:
(Crie um parágrafo de 2-3 linhas que comunique urgência e escassez para incentivar ação imediata. Use gatilhos como "unidades limitadas", "oferta por tempo limitado", "alta demanda", "garantia especial", etc.)

#### 7. Chamada para Ação Forte:
(CTA poderoso e direto de 2-3 linhas. Use verbos de ação imperativos como "CLIQUE AGORA", "GARANTA JÁ", "ADQUIRA HOJE". Reforce o benefício principal e crie senso de urgência.)

#### 8. Perguntas Frequentes (FAQ) Resumidas:
(Crie 5 perguntas e respostas objetivas no formato:
P: [Pergunta comum sobre o produto]
R: [Resposta direta e informativa]
Inclua perguntas sobre uso, garantia, compatibilidade, durabilidade e diferencial.)

#### 9. Ambientes Ideais que se Encaixa para o Produto:
(Liste 5-7 ambientes/locais/situações onde o produto é ideal para uso. Seja específico e considere tanto uso doméstico quanto comercial/profissional quando aplicável. Exemplo: Banheiro, Quarto, Academia em Casa, Clínica, etc.)

#### 10. Títulos de Cauda Longa para Anúncios (Long Tail SEO):
(Crie 25-30 títulos otimizados para SEO e anúncios. Cada título deve ter máximo 70 caracteres, usar palavras-chave específicas do produto, variações do nome, termos de busca reais, benefícios e diferenciais. Exemplo: "Balança Digital Bioimpedância Preta 140kg:Análise Corporal Completa.")

REGRAS OBRIGATÓRIAS:
- Responda APENAS com o conteúdo dos 10 tópicos estruturados conforme acima
- Use EXATAMENTE a numeração e títulos mostrados (1. Título Atraente e Impactante, 2. Introdução Captadora, etc.)
- Seja persuasivo e focado em conversão
- Use dados REAIS do produto fornecidos acima, NÃO invente especificações
- O tópico 9 (Ambientes Ideais) é CRÍTICO pois será usado para geração de imagens com IA
- O tópico 10 deve ter pelo menos 25 títulos long tail variados e únicos
- NÃO adicione explicações extras, apenas os 10 tópicos com conteúdo
`;
}

// Interface para contexto do produto
interface ProductContext {
  productName: string;
  productCategory: string;
  shortDescription: string;
  longDescription: string;
  idealEnvironments: string[];
  mainKeywords: string[];
  dimensions?: {
    altura?: number;
    largura?: number;
    profundidade?: number;
    peso_bruto?: number;
  };
}

// Helper: Gerar prompts para Gemini - FUNDO BRANCO PRIMEIRO (crítico para Kits)
// ATUALIZADO: Agora recebe contexto completo do produto para cenários condizentes
// PRIORIDADE DE CONTEXTO:
// 1. Campos manuais do formulário (cenario_ideal, contexto_uso, categoria_produto)
// 2. Dados do Copywriting/Unified Commands (idealEnvironments)
// 3. Inferência automática (inferEnvironmentsFromProduct)
function generateGeminiPrompts(ctx: {
  productName?: string;
  productCategory?: string;
  shortDescription?: string;
  longDescription?: string;
  idealEnvironments?: string[];
  mainKeywords?: string[];
  dimensions?: any;
  // NOVOS: Campos de contexto explícito do formulário
  cenarioIdeal?: string;
  contextoUso?: string;
  categoriaFormulario?: string;
}): Array<{ name: string; prompt: string; isWhiteBackground?: boolean; productContext?: ProductContext }> {

  // Extrair dados do contexto com fallbacks
  const productName = ctx?.productName || 'produto';

  // PRIORIDADE 1: Categoria explícita do formulário > categoria inferida
  const category = ctx?.categoriaFormulario || ctx?.productCategory || ctx?.productName || 'produto de alta qualidade';

  const shortDesc = ctx?.shortDescription || '';
  const longDesc = ctx?.longDescription || '';
  const description = shortDesc || longDesc || productName;

  // PRIORIDADE DE AMBIENTES IDEAIS:
  // 1. Cenário específico do formulário (maior prioridade)
  // 2. Ambientes do Copywriting/Unified Commands
  // 3. Inferência automática (fallback)
  let idealEnvironments: string[];

  if (ctx?.cenarioIdeal && ctx.cenarioIdeal.trim().length > 5) {
    // Cenário explícito tem prioridade máxima
    idealEnvironments = [ctx.cenarioIdeal.trim()];
    console.log(`[GEMINI-PROMPTS] ✅ Usando cenário EXPLÍCITO do formulário: "${ctx.cenarioIdeal}"`);
  } else if (ctx?.idealEnvironments?.length && ctx.idealEnvironments[0] !== 'ambiente moderno') {
    // Ambientes do Copywriting/Unified têm segunda prioridade
    idealEnvironments = ctx.idealEnvironments;
    console.log(`[GEMINI-PROMPTS] 📋 Usando ambientes do Copywriting/Unified: ${idealEnvironments.join(', ')}`);
  } else {
    // Fallback para inferência automática
    idealEnvironments = inferEnvironmentsFromProduct(productName, description, category);
    console.log(`[GEMINI-PROMPTS] 🔄 Usando inferência automática de ambientes`);
  }

  // Adicionar contexto de uso como keyword/ambiente se fornecido
  if (ctx?.contextoUso && ctx.contextoUso.trim().length > 10) {
    // Inserir contexto de uso no início dos ambientes para dar prioridade
    idealEnvironments = [ctx.contextoUso.trim(), ...idealEnvironments].slice(0, 5);
    console.log(`[GEMINI-PROMPTS] 👥 Adicionando contexto de uso: "${ctx.contextoUso}"`);
  }

  // Keywords - usar do contexto ou inferir
  const mainKeywords = ctx?.mainKeywords?.length
    ? ctx.mainKeywords
    : inferKeywordsFromProduct(productName, description);

  // Contexto completo para passar à edge function
  const productContext: ProductContext = {
    productName,
    productCategory: category,
    shortDescription: shortDesc,
    longDescription: longDesc,
    idealEnvironments,
    mainKeywords,
    dimensions: ctx?.dimensions
  };

  // Selecionar ambiente aleatório para variedade
  const randomEnv = idealEnvironments[Math.floor(Math.random() * idealEnvironments.length)] || 'ambiente moderno';
  const randomKeyword = mainKeywords[Math.floor(Math.random() * mainKeywords.length)] || 'qualidade';

  console.log(`[GEMINI-PROMPTS] 📋 Contexto do produto:`);
  console.log(`  - Nome: ${productName}`);
  console.log(`  - Categoria: ${category}`);
  console.log(`  - Ambientes ideais: ${idealEnvironments.join(', ')}`);
  console.log(`  - Keywords: ${mainKeywords.join(', ')}`);
  console.log(`  - Ambiente selecionado: ${randomEnv}`);
  console.log(`  - Keyword selecionada: ${randomKeyword}`);

  return [
    // PRIMEIRO: Fundo Branco 4K Ultra-Realista (crítico para iniciar Kits imediatamente)
    {
      name: 'Fundo Branco 4K',
      prompt: `CRITICAL INSTRUCTION — PURE WHITE BACKGROUND ONLY (#FFFFFF, RGB 255,255,255)

Using the provided reference image as the ONLY visual reference,
RECREATE the product in its ORIGINAL design and identity,
but NOT by copying the low-resolution pixels of the reference image.

The goal is to faithfully reconstruct the product at MAXIMUM QUALITY,
preserving its original shape, proportions, colors, materials, textures,
logos, labels and finishes, while enhancing clarity, sharpness,
micro-details and realism beyond the source image.

Do NOT redesign, reinterpret or stylize the product.
This is a high-resolution reconstruction, not a modification.

COMPOSITION:
The product must be PERFECTLY CENTERED and LARGE,
occupying approximately 85–90% of the image area,
fully visible, no cropping, dominant in the frame,
optimized for marketplace listings.

BACKGROUND:
100% pure white seamless background (#FFFFFF),
no environment, no scene, no context, no surface,
no horizon line, no gradients.

LIGHTING & SHADOW:
Professional studio lighting with physically accurate light behavior,
even and controlled illumination.
Add ONLY a soft, subtle, natural shadow beneath the product
to anchor it to the white background.
No dramatic, hard or artistic shadows.

DETAIL & QUALITY:
Ultra-realistic professional product photography,
true 4K or higher resolution,
razor-sharp focus across the entire product,
accurate color reproduction (color-matched to the real product),
high dynamic range (HDR),
global illumination,
realistic material response.

Capture and enhance ALL authentic micro-details:
textures, stitching, grain, surface imperfections,
material finishes and edges,
with surgical precision — without inventing details.

STYLE:
Clean, neutral, premium e-commerce look.
Looks like a high-end DSLR studio photograph
made specifically for Amazon and major marketplaces.
No artistic interpretation.`,
      isWhiteBackground: true,
      productContext
    },
    // AMBIENTE 1 - LIFESTYLE CONTEXTUALIZADO
    {
      name: 'Ambiente 1 - Lifestyle',
      prompt: `ambient_1`,  // Edge function usará productContext para contextualizar
      productContext
    },
    // AMBIENTE 2 - PREMIUM CONTEXTUALIZADO  
    {
      name: 'Ambiente 2 - Premium',
      prompt: `ambient_2`,  // Edge function usará productContext para contextualizar
      productContext
    }
  ];
}

// Helper: Inferir ambientes ideais baseado no nome/descrição do produto
function inferEnvironmentsFromProduct(name: string, description: string, category: string): string[] {
  const text = `${name} ${description} ${category}`.toLowerCase();

  // Mapeamento de palavras-chave para ambientes
  const environmentMappings: { keywords: string[]; environments: string[] }[] = [
    {
      keywords: ['cozinha', 'panela', 'frigideira', 'fogão', 'culinária', 'chef', 'gourmet', 'alimento', 'comida'],
      environments: ['cozinha moderna', 'cozinha gourmet', 'restaurante profissional', 'bancada de mármore']
    },
    {
      keywords: ['escritório', 'office', 'trabalho', 'notebook', 'mesa', 'cadeira', 'monitor'],
      environments: ['escritório moderno', 'home office', 'coworking', 'sala executiva']
    },
    {
      keywords: ['banheiro', 'banho', 'toalha', 'shampoo', 'sabonete', 'higiene'],
      environments: ['banheiro luxuoso', 'spa', 'banheiro moderno', 'suíte master']
    },
    {
      keywords: ['quarto', 'cama', 'travesseiro', 'lençol', 'dormir', 'sono'],
      environments: ['quarto aconchegante', 'suíte de hotel', 'quarto minimalista']
    },
    {
      keywords: ['esporte', 'fitness', 'academia', 'treino', 'exercício', 'corrida'],
      environments: ['academia moderna', 'estúdio de pilates', 'ao ar livre', 'parque']
    },
    {
      keywords: ['jardim', 'planta', 'vaso', 'terra', 'flor', 'jardinagem'],
      environments: ['jardim zen', 'varanda verde', 'estufa', 'terraço']
    },
    {
      keywords: ['bebê', 'criança', 'infantil', 'kids', 'brinquedo'],
      environments: ['quarto infantil', 'berçário', 'área de brincar']
    },
    {
      keywords: ['pet', 'cachorro', 'gato', 'animal', 'cão'],
      environments: ['sala de estar pet-friendly', 'parque para pets', 'clínica veterinária']
    },
    {
      keywords: ['eletrônico', 'tecnologia', 'celular', 'smartphone', 'gadget', 'fone'],
      environments: ['setup gamer', 'mesa minimalista', 'ambiente tech', 'loja de eletrônicos']
    },
    {
      keywords: ['moda', 'roupa', 'vestido', 'camisa', 'calça', 'sapato', 'bolsa'],
      environments: ['boutique de moda', 'closet organizado', 'estúdio fotográfico fashion']
    }
  ];

  for (const mapping of environmentMappings) {
    if (mapping.keywords.some(kw => text.includes(kw))) {
      return mapping.environments;
    }
  }

  // Fallback genérico
  return ['ambiente moderno', 'sala de estar elegante', 'estúdio fotográfico profissional'];
}

// Helper: Inferir keywords baseado no nome/descrição do produto
function inferKeywordsFromProduct(name: string, description: string): string[] {
  const text = `${name} ${description}`.toLowerCase();
  const keywords: string[] = [];

  // Palavras de qualidade
  if (text.includes('premium') || text.includes('luxo') || text.includes('profissional')) {
    keywords.push('premium', 'sofisticado');
  }
  if (text.includes('aço') || text.includes('inox') || text.includes('metal')) {
    keywords.push('durável', 'resistente');
  }
  if (text.includes('natural') || text.includes('orgânico') || text.includes('eco')) {
    keywords.push('natural', 'sustentável');
  }
  if (text.includes('moderno') || text.includes('design') || text.includes('inovador')) {
    keywords.push('moderno', 'inovador');
  }
  if (text.includes('prático') || text.includes('fácil') || text.includes('simples')) {
    keywords.push('prático', 'funcional');
  }

  // Se não encontrou nada específico, usar fallbacks
  if (keywords.length === 0) {
    keywords.push('qualidade', 'elegante', 'versátil');
  }

  return keywords;
}

// ============================================================
// 📝 PROCESSADOR DE COPYWRITING PROFISSIONAL (OpenAI gpt-4o-mini)
// Usa o mesmo modelo do unified-commands para gerar copywriting
// ============================================================
async function processCopywriting(
  supabase: any,
  job: any,
  internalWorkerSecret: string
): Promise<any> {
  const copywritingId = job.id.slice(0, 8);
  const startTime = Date.now();

  console.log(`[COPYWRITING][${copywritingId}] 📝 ========================================`);
  console.log(`[COPYWRITING][${copywritingId}] 📝 INICIANDO COPYWRITING PROFISSIONAL`);
  console.log(`[COPYWRITING][${copywritingId}] 📝 ========================================`);

  const input = job.input_data;
  const userId = job.user_id;

  console.log(`[COPYWRITING][${copywritingId}] 📋 Input:`, {
    hasImageData: !!input.imageData,
    productName: input.productName || 'N/A',
    hasShortDescription: !!input.shortDescription,
    hasCopywritingPrompt: !!input.copywritingPrompt
  });

  try {
    // Buscar API key do OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    console.log(`[COPYWRITING][${copywritingId}] 🔑 OpenAI API Key disponível`);

    // Construir o prompt de copywriting COMPLETO com 10 tópicos
    const systemPrompt = `Você é um especialista em copywriting para e-commerce com anos de experiência. 
Seu trabalho é criar textos persuasivos e otimizados para SEO que convertem visitantes em compradores.
Sempre siga a estrutura solicitada exatamente como pedido, mantendo todos os 10 tópicos obrigatórios.
Use linguagem persuasiva mas natural, focando em benefícios e gatilhos emocionais.`;

    // Usar buildCopywritingPrompt se disponível, senão gerar prompt completo
    const userPrompt = input.copywritingPrompt || `
INFORMAÇÕES DO PRODUTO:
Nome: ${input.productName || 'Produto'}
${input.shortDescription ? `Descrição: ${input.shortDescription}` : ''}

---

Com base nas informações acima, gere um copywriting profissional COMPLETO seguindo EXATAMENTE este formato com os 10 tópicos obrigatórios:

1. **COPY DE VENDAS**
(3-5 linhas persuasivas para página de produto, use gatilhos mentais como urgência, escassez e prova social)

2. **DESCRIÇÃO OTIMIZADA SEO**
(Descrição completa otimizada para buscadores, inclua palavras-chave naturalmente, mínimo 150 palavras)

3. **PÚBLICO ALVO**
(Definição detalhada do público ideal: idade, gênero, interesses, comportamentos de compra, dores e desejos)

4. **PERSONA IDEAL**
(Perfil fictício do cliente perfeito com nome, idade, profissão, rotina, motivações e objeções)

5. **COPY TRÁFEGO PAGO**
(3 variações de anúncios para Meta/Google Ads - cada um com headline, texto principal e CTA)

6. **SCRIPT DE VENDAS**
(Roteiro completo para vídeo curto 30-60s com: gancho inicial, problema, solução, benefícios e CTA)

7. **HASHTAGS**
(20 hashtags relevantes separadas por espaço, incluindo hashtags de nicho e populares)

8. **PALAVRAS-CHAVE**
(10-15 palavras-chave para SEO, ordenadas por relevância, incluindo long-tail)

9. **NOMES CRIATIVOS**
(5 sugestões de nomes alternativos/comerciais para o produto)

10. **ANÁLISE DETALHADA**
(Pontos fortes, diferenciais competitivos, oportunidades de melhoria e sugestões de posicionamento)

IMPORTANTE:
- Seja direto e persuasivo em todos os textos
- Use linguagem que vende, foque em benefícios
- Responda APENAS com o conteúdo dos 10 tópicos, sem explicações extras
- Todos os tópicos são OBRIGATÓRIOS
`;

    console.log(`[COPYWRITING][${copywritingId}] 🤖 Chamando OpenAI gpt-4o-mini...`);

    // Chamada ao OpenAI com suporte a visão (se houver imagem)
    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Se tiver imagem em base64, usar visão
    if (input.imageData && input.imageData.startsWith('data:image/')) {
      console.log(`[COPYWRITING][${copywritingId}] 🖼️ Usando visão com imagem base64`);
      messages.push({
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: input.imageData,
              detail: 'high'
            }
          },
          {
            type: 'text',
            text: userPrompt
          }
        ]
      });
    } else {
      // Sem imagem, só texto
      messages.push({ role: 'user', content: userPrompt });
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 4000,
        temperature: 0.7
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error(`[COPYWRITING][${copywritingId}] ❌ OpenAI erro: ${openaiResponse.status}`, errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText.slice(0, 200)}`);
    }

    const openaiData = await openaiResponse.json();
    const copywritingText = openaiData.choices?.[0]?.message?.content;

    if (!copywritingText) {
      throw new Error('OpenAI retornou resposta vazia');
    }

    const duration = Date.now() - startTime;
    console.log(`[COPYWRITING][${copywritingId}] ✅ Copywriting gerada em ${duration}ms`);
    console.log(`[COPYWRITING][${copywritingId}] 📊 Tokens usados:`, openaiData.usage);

    // Verificar se tem todos os 10 tópicos
    const topicPattern = /####\s*(\d+)\./g;
    const topics = copywritingText.match(topicPattern);
    const topicCount = topics ? topics.length : 0;
    console.log(`[COPYWRITING][${copywritingId}] 🔍 Tópicos detectados: ${topicCount}/10`);

    return {
      success: true,
      copywriting: copywritingText,
      topicCount: topicCount,
      usage: {
        model: 'gpt-4o-mini',
        promptTokens: openaiData.usage?.prompt_tokens || 0,
        completionTokens: openaiData.usage?.completion_tokens || 0,
        totalTokens: openaiData.usage?.total_tokens || 0
      },
      durationMs: duration
    };

  } catch (error: any) {
    console.error(`[COPYWRITING][${copywritingId}] 💥 Erro:`, error.message);
    throw error;
  }
}

// ============================================================
// 🧪 PROCESSADOR DE TESTE AI-ONLY (Unified + Copywriting APENAS)
// Para testes rápidos sem gastar créditos de imagem
// ============================================================
async function processAITestOnly(
  supabase: any,
  job: any,
  internalHeaders: Record<string, string>,
  internalWorkerSecret: string
): Promise<any> {
  const testId = job.id.slice(0, 8);
  const startTime = Date.now();

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const input = job.input_data;
  const userId = job.user_id;

  console.log(`[AI-TEST][${testId}] 🧪 ========================================`);
  console.log(`[AI-TEST][${testId}] 🧪 INICIANDO TESTE AI-ONLY (sem imagens)`);
  console.log(`[AI-TEST][${testId}] 🧪 ========================================`);
  console.log(`[AI-TEST][${testId}] 📋 Product: ${input.formData?.nome || 'N/A'}`);

  const result: any = {
    steps: {},
    success: true,
    isTestMode: true,
    completedAt: null
  };

  try {
    // Atualizar progresso
    await supabase.from('image_generation_queue').update({
      result: { ...result, currentStep: 'unified', progress: 10 }
    }).eq('id', job.id);

    // ========================================
    // ETAPA 1: UNIFIED COMMANDS
    // ========================================
    const step1Start = Date.now();
    console.log(`[AI-TEST][${testId}] 📝 Iniciando Unified Commands...`);

    const unifiedResponse = await supabase.functions.invoke('unified-commands', {
      body: {
        productImages: input.productImages || [],
        productName: input.formData?.nome || 'Produto Teste',
        shortDescription: input.formData?.descricao_curta || 'Descrição de teste',
        longDescription: input.formData?.descricao || '',
        userId,
        forceAPI: 'openai'
      },
      headers: internalHeaders
    });

    if (unifiedResponse.error) {
      console.error(`[AI-TEST][${testId}] ❌ Unified ERRO:`, unifiedResponse.error);
      throw new Error(`Unified commands failed: ${unifiedResponse.error.message}`);
    }

    const step1Duration = Date.now() - step1Start;
    result.steps.unified = {
      status: 'completed',
      data: unifiedResponse.data,
      durationMs: step1Duration
    };
    console.log(`[AI-TEST][${testId}] ✅ Unified COMPLETO em ${step1Duration}ms`);

    // Atualizar progresso
    await supabase.from('image_generation_queue').update({
      result: { ...result, currentStep: 'copywriting', progress: 50 }
    }).eq('id', job.id);

    // ========================================
    // ETAPA 2: COPYWRITING
    // ========================================
    const step2Start = Date.now();
    console.log(`[AI-TEST][${testId}] ✍️ Iniciando Copywriting...`);

    const unifiedData = unifiedResponse.data?.result || unifiedResponse.data;
    const copywritingPrompt = buildCopywritingPrompt(unifiedData, input.formData);

    const copywritingUrl = `${supabaseUrl}/functions/v1/ai-chat-proxy`;

    const copywritingResponse = await fetch(copywritingUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-worker-key': internalWorkerSecret,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        action: 'generate_copywriting',
        prompt: copywritingPrompt,
        targetFunction: 'openai-copywriting',
        _userId: userId
      })
    });

    const step2Duration = Date.now() - step2Start;

    if (!copywritingResponse.ok) {
      const errorText = await copywritingResponse.text();
      console.error(`[AI-TEST][${testId}] ❌ Copywriting ERRO: ${copywritingResponse.status}`, errorText);
      result.steps.copywriting = {
        status: 'failed',
        error: errorText,
        durationMs: step2Duration
      };
    } else {
      const copywritingData = await copywritingResponse.json();
      result.steps.copywriting = {
        status: 'completed',
        data: {
          content: copywritingData.generatedText || copywritingData.copywriting || JSON.stringify(copywritingData)
        },
        durationMs: step2Duration
      };
      console.log(`[AI-TEST][${testId}] ✅ Copywriting COMPLETO em ${step2Duration}ms`);
    }

    // ========================================
    // ETAPAS GEMINI/KITS: PULADAS (teste apenas AI)
    // ========================================
    result.steps.gemini = { status: 'skipped', reason: 'Teste AI-Only - sem geração de imagens' };
    result.steps.kits = { status: 'skipped', reason: 'Teste AI-Only - sem geração de KITs' };

    const totalDuration = Date.now() - startTime;
    result.completedAt = new Date().toISOString();
    result.totalDurationMs = totalDuration;
    result.summary = {
      unifiedCompleted: result.steps.unified?.status === 'completed',
      copywritingCompleted: result.steps.copywriting?.status === 'completed',
      imagesSkipped: true,
      kitsSkipped: true
    };

    console.log(`[AI-TEST][${testId}] 🏁 TESTE CONCLUÍDO em ${totalDuration}ms`);
    console.log(`[AI-TEST][${testId}] 📊 Summary:`, result.summary);

    return result;

  } catch (error: any) {
    console.error(`[AI-TEST][${testId}] 💥 ERRO FATAL:`, error.message);
    result.success = false;
    result.error = error.message;
    return result;
  }
}

serve(async (req) => {
  // 🔍 Instrumentação padronizada
  console.log({
    fn: 'process-queue',
    method: req.method,
    contentType: req.headers.get('content-type'),
    hasAuth: !!req.headers.get('authorization'),
    hasInternalKey: !!req.headers.get('x-internal-worker-key'),
  });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[PROCESS-QUEUE] 🚀 Worker iniciado:', new Date().toISOString());

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 🔐 Obter chave interna para chamadas às Edge Functions
    // SEGURANÇA: Secret é OBRIGATÓRIO em produção
    const INTERNAL_WORKER_SECRET = Deno.env.get('INTERNAL_WORKER_SECRET');
    const IS_PRODUCTION = Deno.env.get('ENVIRONMENT') === 'production';

    if (!INTERNAL_WORKER_SECRET) {
      if (IS_PRODUCTION) {
        console.error('[PROCESS-QUEUE] 🚨 ERRO CRÍTICO: INTERNAL_WORKER_SECRET não configurada em produção!');
        return new Response(
          JSON.stringify({
            error: 'Configuração de segurança ausente',
            code: 'MISSING_WORKER_SECRET'
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      console.warn('[PROCESS-QUEUE] ⚠️ INTERNAL_WORKER_SECRET não configurada - modo desenvolvimento (NÃO usar em produção!)');
    }

    // 🎯 VERIFICAR SE HÁ targetJobId NO BODY (disparo manual)
    let targetJobId: string | null = null;
    let triggerType = 'cron';

    try {
      const body = await req.json().catch(() => ({}));
      targetJobId = body?.targetJobId || null;
      triggerType = body?.trigger || 'cron';

      if (targetJobId) {
        console.log(`[PROCESS-QUEUE] 🎯 Disparo MANUAL para job específico: ${targetJobId}`);
      } else {
        console.log(`[PROCESS-QUEUE] ⏰ Disparo tipo: ${triggerType} (batch de jobs)`);
      }
    } catch (e) {
      console.log('[PROCESS-QUEUE] ℹ️ Sem body na requisição (cron/automático)');
    }

    // ============================================================
    // 🧹 CLEANUP AUTOMÁTICO: Usar funções RPC robustas
    // ============================================================
    console.log('[PROCESS-QUEUE] 🧹 CLEANUP: Executando limpeza automática...');

    // 🔄 1. RESETAR JOBS TRAVADOS (via RPC atômico)
    try {
      const { data: stuckResult, error: stuckError } = await supabase.rpc('reset_stuck_jobs', {
        p_timeout_minutes: 10, // 10 minutos sem resposta = travado
        p_max_retries: MAX_RETRIES
      });

      if (stuckError) {
        console.warn('[CLEANUP] ⚠️ Erro ao resetar jobs travados (RPC):', stuckError.message);
        // Fallback para lógica antiga se RPC falhar
        const stuckThreshold = new Date(Date.now() - STUCK_JOB_THRESHOLD_MS).toISOString();
        await supabase
          .from('image_generation_queue')
          .update({
            status: 'pending',
            locked_at: null,
            locked_by: null,
            error_message: 'Watchdog recovery: job travado'
          })
          .eq('status', 'processing')
          .lt('started_at', stuckThreshold)
          .lt('retry_count', MAX_RETRIES);
      } else if (typeof stuckResult === 'number' && stuckResult > 0) {
        console.log(`[CLEANUP] ♻️ Reset ${stuckResult} jobs travados (via RPC)`);
      } else if (stuckResult && typeof stuckResult === 'object' && stuckResult.length > 0) {
        // Compatibilidade com versão antiga que retornava array
        const { reset_count, failed_count } = stuckResult[0];
        if (reset_count > 0 || failed_count > 0) {
          console.log(`[CLEANUP] ♻️ Reset ${reset_count} jobs, Failed ${failed_count} jobs (via RPC)`);
        } else {
          console.log('[CLEANUP] ✅ Nenhum job travado encontrado');
        }
      } else {
        console.log('[CLEANUP] ✅ Nenhum job travado encontrado');
      }
    } catch (e: any) {
      console.warn('[CLEANUP] ⚠️ Erro no reset_stuck_jobs:', e.message);
    }

    // 🗑️ 2. LIMPAR JOBS ANTIGOS (apenas 5% das execuções para não sobrecarregar)
    const shouldCleanupOld = Math.random() < 0.05;
    if (shouldCleanupOld) {
      try {
        const { data: deletedCount, error: cleanupError } = await supabase.rpc('cleanup_completed_jobs', {
          p_retention_hours: 24 // Manter apenas 24 horas de histórico
        });

        if (cleanupError) {
          console.warn('[CLEANUP] ⚠️ Erro na limpeza de jobs antigos:', cleanupError.message);
        } else if (deletedCount && deletedCount > 0) {
          console.log(`[CLEANUP] 🗑️ Removidos ${deletedCount} jobs antigos (>24h)`);
        }
      } catch (e: any) {
        console.warn('[CLEANUP] ⚠️ Erro no cleanup_completed_jobs:', e.message);
      }
    }

    // 2. Buscar jobs - SE HÁ targetJobId: buscar APENAS esse job
    let jobs: any[] = [];

    if (targetJobId) {
      // 🎯 MODO MANUAL: Buscar job específico
      console.log(`[PROCESS-QUEUE] 🎯 Buscando job específico: ${targetJobId}`);

      const { data: specificJob, error: specificError } = await supabase
        .from('image_generation_queue')
        .select('*')
        .eq('id', targetJobId)
        .eq('status', 'pending')
        .single();

      if (specificError || !specificJob) {
        console.log(`[PROCESS-QUEUE] ℹ️ Job ${targetJobId} não está pending (status: ${specificJob?.status || 'não existe'})`);
        return new Response(
          JSON.stringify({
            message: 'Job não encontrado ou já processado',
            targetJobId,
            currentStatus: specificJob?.status || 'not_found'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Adquirir lock no job específico
      const { error: lockError } = await supabase
        .from('image_generation_queue')
        .update({
          status: 'processing',
          locked_at: new Date().toISOString(),
          started_at: new Date().toISOString(),
          locked_by: 'manual-trigger'
        })
        .eq('id', targetJobId)
        .eq('status', 'pending'); // Garantir que ainda está pending

      if (!lockError) {
        jobs = [specificJob];
        console.log(`[PROCESS-QUEUE] ✅ Job ${targetJobId} locked para processamento manual`);
      } else {
        console.warn(`[PROCESS-QUEUE] ⚠️ Falha ao adquirir lock no job ${targetJobId}:`, lockError);
      }
    } else {
      // 📦 MODO BATCH: Buscar múltiplos jobs pendentes
      try {
        // Tentar usar a função RPC com FOR UPDATE SKIP LOCKED
        const { data: rpcJobs, error: rpcError } = await supabase
          .rpc('acquire_queue_jobs', { p_batch_size: BATCH_SIZE });

        if (!rpcError && rpcJobs && rpcJobs.length > 0) {
          jobs = rpcJobs;
          console.log(`[PROCESS-QUEUE] 🔒 ${jobs.length} jobs adquiridos via RPC atômico`);
        } else {
          throw new Error('RPC não disponível ou sem jobs');
        }
      } catch (rpcFallbackError) {
        // Fallback: SELECT tradicional (mantém compatibilidade)
        console.log('[PROCESS-QUEUE] ⚠️ Fallback para SELECT tradicional');

        const { data: fallbackJobs, error: fetchError } = await supabase
          .from('image_generation_queue')
          .select('*')
          .eq('status', 'pending')
          .is('locked_at', null)
          .order('priority', { ascending: false })
          .order('created_at', { ascending: true })
          .limit(BATCH_SIZE);

        if (fetchError) {
          console.error('[PROCESS-QUEUE] ❌ Erro ao buscar jobs:', fetchError);
          throw fetchError;
        }

        jobs = fallbackJobs || [];

        // Adquirir lock nos jobs encontrados (modo tradicional)
        if (jobs.length > 0) {
          const jobIds = jobs.map(j => j.id);
          const lockTime = new Date().toISOString();

          await supabase
            .from('image_generation_queue')
            .update({ locked_at: lockTime, status: 'processing', started_at: new Date().toISOString() })
            .in('id', jobIds);
        }
      }
    }

    if (!jobs || jobs.length === 0) {
      console.log('[PROCESS-QUEUE] ✅ Nenhum job pendente na fila');
      return new Response(
        JSON.stringify({ message: 'Nenhum job pendente', processedCount: 0, triggerType }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[PROCESS-QUEUE] 📋 ${jobs.length} jobs para processar`);

    // 3. Processar cada job
    const results: { jobId: string; success: boolean; error?: string }[] = [];

    for (const job of jobs) {
      const jobStartTime = Date.now();
      const queueWaitTime = jobStartTime - new Date(job.created_at).getTime();

      console.log(`[PROCESS-QUEUE] 🔄 Processando job ${job.id} (tipo: ${job.generation_type}, prioridade: ${job.priority})`);

      try {
        // Marcar como processing (se não foi feito pelo RPC)
        if (job.status !== 'processing') {
          await supabase
            .from('image_generation_queue')
            .update({
              status: 'processing',
              started_at: new Date().toISOString(),
              queue_wait_time_ms: queueWaitTime
            })
            .eq('id', job.id);
        }

        let result;
        let processingError = null;

        // Criar promise com timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout: processamento excedeu limite')), JOB_TIMEOUT_MS);
        });

        try {
          // 🔐 Headers com chave interna para autenticação
          const internalHeaders = {
            'x-internal-worker-key': INTERNAL_WORKER_SECRET
          };

          // Chamar edge function apropriada baseado no tipo
          let generationPromise;

          if (job.generation_type === 'carousel') {
            console.log(`[PROCESS-QUEUE] 📸 Chamando gemini-carousel para job ${job.id}`);
            generationPromise = supabase.functions.invoke('gemini-carousel', {
              body: job.input_data,
              headers: internalHeaders
            });
          } else if (job.generation_type === 'marketing') {
            console.log(`[PROCESS-QUEUE] 🎨 Chamando generate-marketing-image para job ${job.id}`);
            generationPromise = supabase.functions.invoke('generate-marketing-image', {
              body: job.input_data,
              headers: internalHeaders
            });
          } else if (job.generation_type === 'background') {
            console.log(`[PROCESS-QUEUE] 🖼️ Chamando gemini-background-generator para job ${job.id}`);
            generationPromise = supabase.functions.invoke('gemini-background-generator', {
              body: job.input_data,
              headers: internalHeaders
            });
          } else if (job.generation_type === 'stability') {
            console.log(`[PROCESS-QUEUE] ⚡ Chamando stability-generator para job ${job.id}`);
            generationPromise = supabase.functions.invoke('stability-generator', {
              body: job.input_data,
              headers: internalHeaders
            });
          } else if (job.generation_type === 'tongyi') {
            console.log(`[PROCESS-QUEUE] 🐉 Chamando tongyi-wanxiang para job ${job.id}`);
            generationPromise = supabase.functions.invoke('tongyi-wanxiang', {
              body: job.input_data,
              headers: internalHeaders
            });
          } else if (job.generation_type === 'unified_commands') {
            console.log(`[PROCESS-QUEUE] 📝 Chamando unified-commands para job ${job.id}`);
            generationPromise = supabase.functions.invoke('unified-commands', {
              body: { ...job.input_data, userId: job.user_id },
              headers: internalHeaders
            });
          } else if (job.generation_type === 'specialist_commands') {
            console.log(`[PROCESS-QUEUE] 🎯 Chamando unified-commands (specialist) para job ${job.id}`);
            // Specialist commands usa a mesma edge function unified-commands 
            // mas com flag isSpecialist para processamento diferenciado
            generationPromise = supabase.functions.invoke('unified-commands', {
              body: {
                ...job.input_data,
                userId: job.user_id,
                isSpecialist: true
              },
              headers: internalHeaders
            });
          } else if (job.generation_type === 'ad_automation_full') {
            // 🚀 AUTOMAÇÃO COMPLETA EM UM ÚNICO JOB (COM TIMEOUT ESTENDIDO)
            console.log(`[PROCESS-QUEUE] 🚀 Processando AUTOMAÇÃO COMPLETA para job ${job.id}`);
            console.log(`[PROCESS-QUEUE] ⏱️ Timeout estendido: ${AUTOMATION_TIMEOUT_MS / 1000}s (5 minutos)`);

            // ✅ TIMEOUT ESPECÍFICO PARA AUTOMAÇÃO (5 minutos ao invés de 3)
            const automationTimeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Timeout: automação excedeu 5 minutos')), AUTOMATION_TIMEOUT_MS);
            });

            try {
              const automationResult = await Promise.race([
                processFullAutomation(supabase, job, internalHeaders, INTERNAL_WORKER_SECRET),
                automationTimeoutPromise
              ]) as any;

              result = automationResult;
              // ✅ Já processado - não precisa do Promise.race padrão
              generationPromise = Promise.resolve({ data: automationResult, error: null });
            } catch (automationError: any) {
              console.error(`[PROCESS-QUEUE] ❌ Erro na automação:`, automationError.message);
              throw automationError;
            }
          } else if (job.generation_type === 'ai_test_only') {
            // 🧪 TESTE AI-ONLY: Apenas Unified + Copywriting (sem imagens)
            console.log(`[PROCESS-QUEUE] 🧪 Processando TESTE AI-ONLY para job ${job.id}`);
            const testResult = await processAITestOnly(
              supabase,
              job,
              internalHeaders,
              INTERNAL_WORKER_SECRET
            );
            result = testResult;
            generationPromise = Promise.resolve({ data: testResult, error: null });
          } else if (job.generation_type === 'copywriting_professional') {
            // 📝 COPYWRITING PROFISSIONAL VIA OPENAI
            console.log(`[PROCESS-QUEUE] 📝 Processando COPYWRITING PROFISSIONAL para job ${job.id}`);
            const copywritingResult = await processCopywriting(
              supabase,
              job,
              INTERNAL_WORKER_SECRET
            );
            result = copywritingResult;
            // Pular a chamada padrão de edge function - já foi processado
            generationPromise = Promise.resolve({ data: copywritingResult, error: null });
          } else {
            throw new Error(`Tipo de geração desconhecido: ${job.generation_type}`);
          }

          const response = await Promise.race([generationPromise, timeoutPromise]) as { data: any; error: any };

          if (response.error) {
            // 🔍 MELHOR CAPTURA DE ERROS: Extrair mensagem real da edge function
            let errorMessage = 'Erro na edge function';

            // Tentar extrair do FunctionsHttpError
            if (response.error?.message) {
              errorMessage = response.error.message;
            }

            // Se tiver context com body, tentar parsear
            if (response.error?.context?.body) {
              try {
                const errorBody = JSON.parse(response.error.context.body);
                if (errorBody?.error) {
                  errorMessage = errorBody.error;
                } else if (errorBody?.message) {
                  errorMessage = errorBody.message;
                }
              } catch (e) {
                // Pode ser string simples
                if (typeof response.error.context.body === 'string' && response.error.context.body.length < 500) {
                  errorMessage = response.error.context.body;
                }
              }
            }

            // Se a resposta tiver data com erro (alguns endpoints retornam success:false)
            if (response.data && response.data.success === false && response.data.error) {
              errorMessage = response.data.error;
            }

            console.error(`[PROCESS-QUEUE] ❌ Erro detalhado da edge function:`, errorMessage);
            throw new Error(errorMessage);
          }

          // Verificar se a resposta indica falha mesmo sem error formal
          if (response.data && response.data.success === false) {
            const errorMessage = response.data.error || response.data.message || 'Edge function retornou falha';
            console.error(`[PROCESS-QUEUE] ❌ Edge function retornou success:false:`, errorMessage);
            throw new Error(errorMessage);
          }

          result = response.data;

        } catch (genError: any) {
          processingError = genError;
          console.error(`[PROCESS-QUEUE] ❌ Erro ao processar job ${job.id}:`, genError.message);
        }

        const processingTime = Date.now() - jobStartTime;

        if (processingError) {
          // Verificar se deve fazer retry
          const isRetryableError =
            processingError.message?.includes('429') ||
            processingError.message?.includes('timeout') ||
            processingError.message?.includes('Timeout') ||
            processingError.message?.includes('rate') ||
            processingError.message?.includes('500') ||
            processingError.message?.includes('Internal');

          const currentRetries = job.retry_count || 0;
          const shouldRetry = isRetryableError && currentRetries < MAX_RETRIES;

          if (shouldRetry) {
            await supabase
              .from('image_generation_queue')
              .update({
                status: 'pending',
                locked_at: null,
                retry_count: currentRetries + 1,
                error_message: processingError.message,
                processing_time_ms: processingTime
              })
              .eq('id', job.id);

            console.log(`[PROCESS-QUEUE] 🔁 Job ${job.id} voltou para fila (retry ${currentRetries + 1}/${MAX_RETRIES})`);
            results.push({ jobId: job.id, success: false, error: `Retry ${currentRetries + 1}` });
          } else {
            // Falha definitiva
            await supabase
              .from('image_generation_queue')
              .update({
                status: 'failed',
                locked_at: null,
                error_message: processingError.message,
                completed_at: new Date().toISOString(),
                processing_time_ms: processingTime
              })
              .eq('id', job.id);

            // Registrar métrica de falha
            await supabase.from('generation_metrics').insert({
              job_id: job.id,
              user_id: job.user_id,
              generation_type: job.generation_type,
              queue_wait_time_ms: queueWaitTime,
              processing_time_ms: processingTime,
              success: false,
              error_message: processingError.message
            });

            console.log(`[PROCESS-QUEUE] 💀 Job ${job.id} falhou após ${currentRetries} tentativas`);
            results.push({ jobId: job.id, success: false, error: processingError.message });
          }
        } else {
          // Sucesso!
          await supabase
            .from('image_generation_queue')
            .update({
              status: 'completed',
              locked_at: null,
              result: result,
              completed_at: new Date().toISOString(),
              processing_time_ms: processingTime,
              credits_debited: true
            })
            .eq('id', job.id);

          // Debitar crédito do usuário via função admin (service_role)
          // SEGURO: usa debit_generation_credit_admin que requer service_role
          // e o job.user_id vem da tabela (fonte confiável, não do frontend)
          try {
            await supabase.rpc('debit_generation_credit_admin', {
              p_user_id: job.user_id,
              p_amount: 1
            });
          } catch (creditError) {
            console.warn(`[PROCESS-QUEUE] ⚠️ Erro ao debitar crédito:`, creditError);
          }

          // Registrar métrica de sucesso
          const usage = result?.usage || {};
          await supabase.from('generation_metrics').insert({
            job_id: job.id,
            user_id: job.user_id,
            generation_type: job.generation_type,
            model_used: usage.model || 'unknown',
            queue_wait_time_ms: queueWaitTime,
            processing_time_ms: processingTime,
            tokens_used: usage.totalTokens || usage.total_tokens || 0,
            estimated_cost_usd: usage.estimatedCostUSD || usage.estimated_cost_usd || 0,
            estimated_cost_brl: usage.estimatedCostBRL || usage.estimated_cost_brl || 0,
            success: true
          });

          console.log(`[PROCESS-QUEUE] ✅ Job ${job.id} completado em ${processingTime}ms`);
          results.push({ jobId: job.id, success: true });
        }

      } catch (jobError: any) {
        console.error(`[PROCESS-QUEUE] 💥 Erro fatal no job ${job.id}:`, jobError);

        // Liberar lock e marcar como failed
        await supabase
          .from('image_generation_queue')
          .update({
            status: 'failed',
            locked_at: null,
            error_message: jobError.message || 'Erro fatal',
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id);

        results.push({ jobId: job.id, success: false, error: jobError.message });
      }
    }

    const totalTime = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;

    console.log(`[PROCESS-QUEUE] 🏁 Worker finalizado: ${successCount}/${results.length} jobs processados em ${totalTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        processedCount: results.length,
        successCount,
        failedCount: results.length - successCount,
        results,
        totalTimeMs: totalTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[PROCESS-QUEUE] ❌ Erro geral no worker:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
