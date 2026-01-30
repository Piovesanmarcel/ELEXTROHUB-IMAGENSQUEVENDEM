import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-callback-secret',
};

interface ImageStreamPayload {
  // Support both camelCase and snake_case
  jobId?: string;
  job_id?: string;
  userId?: string;
  user_id?: string;
  productId?: string;
  product_id?: string;
  productName?: string;
  product_name?: string;
  templateId?: string;
  template_id?: string;
  imageBase64?: string;
  image_base64?: string;
  image?: string;
  isLast?: boolean;
  is_last?: boolean;
}

// Normalize payload to handle both camelCase and snake_case
function normalizePayload(raw: ImageStreamPayload) {
  return {
    jobId: raw.jobId || raw.job_id || '',
    userId: raw.userId || raw.user_id || '',
    productId: raw.productId || raw.product_id || '',
    productName: raw.productName || raw.product_name || 'Produto',
    templateId: raw.templateId || raw.template_id || '',
    imageBase64: raw.imageBase64 || raw.image_base64 || raw.image || '',
    isLast: raw.isLast ?? raw.is_last ?? false,
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  console.log(`[image-stream] ===== INÍCIO ${requestId} (BROADCAST + NORMALIZED PAYLOAD) =====`);

  try {
    // Validate callback secret
    const callbackSecret = Deno.env.get('N8N_CALLBACK_SECRET');
    const providedSecret = req.headers.get('x-callback-secret');

    if (!callbackSecret || providedSecret !== callbackSecret) {
      console.error(`[image-stream] ❌ ${requestId} Secret inválido`);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', requestId }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and normalize payload (accept both camelCase and snake_case)
    const rawPayload: ImageStreamPayload = await req.json();
    const { jobId, userId, productId, productName, templateId, imageBase64, isLast } = normalizePayload(rawPayload);

    console.log(`[image-stream] 📥 ${requestId} Payload normalizado:`, {
      jobId,
      userId: userId ? `${userId.substring(0, 8)}...` : 'MISSING',
      templateId,
      isLast,
      base64Length: imageBase64?.length || 0,
      rawKeys: Object.keys(rawPayload)
    });

    // Validate required fields
    if (!jobId || !userId || !templateId || !imageBase64) {
      const missing = [];
      if (!jobId) missing.push('jobId/job_id');
      if (!userId) missing.push('userId/user_id');
      if (!templateId) missing.push('templateId/template_id');
      if (!imageBase64) missing.push('imageBase64/image_base64/image');

      console.error(`[image-stream] ❌ ${requestId} Campos faltando:`, missing);
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          missing,
          requestId,
          hint: 'Accept both camelCase and snake_case. Required: jobId, userId, templateId, imageBase64'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate payload size (Supabase Realtime limit is ~1MB)
    const MAX_PAYLOAD_SIZE = 950 * 1024; // 950KB safety limit
    if (imageBase64.length > MAX_PAYLOAD_SIZE) {
      console.error(`[image-stream] ❌ ${requestId} Payload muito grande: ${(imageBase64.length / 1024).toFixed(2)}KB (Max: 950KB)`);
      return new Response(
        JSON.stringify({
          error: 'Payload Too Large',
          message: 'Image size exceeds Supabase Realtime limit (approx 1MB). Please compress image in n8n before sending.',
          sizeKB: (imageBase64.length / 1024).toFixed(2),
          maxKB: 950,
          requestId
        }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role for database access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ========================================
    // ANTI-LOOP PROTECTION #1: Kill Switch
    // ========================================
    console.log(`[image-stream] 🔴 ${requestId} Verificando kill switch...`);

    const { data: automationSettings } = await supabase
      .from('automation_settings')
      .select('paused')
      .eq('user_id', userId)
      .maybeSingle();

    if (automationSettings?.paused) {
      console.log(`[image-stream] ⏸️ ${requestId} Automação pausada pelo usuário`);
      return new Response(
        JSON.stringify({
          success: false,
          skipped: true,
          reason: 'automation_paused',
          requestId
        }),
        { status: 423, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // SECURITY: Validate job with FALLBACK MAPPING
    // Step 1: Try exact match
    // Step 2: If not found, map to latest active job for user
    // ========================================
    const originalJobId = jobId;
    let effectiveJobId = jobId;
    let mappedFromOriginal = false;

    console.log(`[image-stream] 🔐 ${requestId} STEP 1: Tentando match exato: ${jobId}`);

    const { data: exactJob, error: exactError } = await supabase
      .from('authorized_jobs')
      .select('*')
      .eq('job_id', jobId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    let effectiveJob = exactJob;

    // STEP 2: Fallback - find latest active job for this user
    if (!effectiveJob) {
      console.log(`[image-stream] 🔄 ${requestId} STEP 2: JobId ${jobId} não encontrado. Buscando fallback...`);

      const { data: fallbackJob, error: fallbackError } = await supabase
        .from('authorized_jobs')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fallbackJob) {
        effectiveJob = fallbackJob;
        effectiveJobId = fallbackJob.job_id;
        mappedFromOriginal = true;
        console.log(`[image-stream] ✅ ${requestId} FALLBACK MAPEADO: ${originalJobId} → ${effectiveJobId}`);
      } else {
        console.log(`[image-stream] ❌ ${requestId} Fallback falhou:`, {
          fallbackError: fallbackError?.message,
          hint: 'No active jobs found for user'
        });
      }
    }

    // If still no job found, reject
    if (!effectiveJob) {
      console.log(`[image-stream] ❌ ${requestId} Job não autorizado (exact + fallback falharam)`);
      console.log(`[image-stream] ❌ ${requestId} Detalhes:`, {
        originalJobId,
        userId: userId.substring(0, 8),
        exactError: exactError?.message,
        hint: 'Both exact match and fallback failed. Job NOT saved to processed_callbacks.'
      });
      return new Response(
        JSON.stringify({
          success: false,
          skipped: true,
          reason: 'job_not_authorized',
          jobId: originalJobId,
          requestId,
          hint: 'Job may be expired (>60min) or not registered. Tried fallback but no active jobs found.'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[image-stream] ✅ ${requestId} Job autorizado: ${effectiveJob.received_images + 1}/${effectiveJob.expected_images}`, {
      mapped: mappedFromOriginal,
      originalJobId: mappedFromOriginal ? originalJobId : undefined,
      effectiveJobId
    });

    // ========================================
    // ANTI-LOOP PROTECTION #2: Deduplication
    // Use effectiveJobId for dedup (ensures correct mapping)
    // ========================================
    const callbackHash = `${effectiveJobId}:${templateId}:${userId}`;
    console.log(`[image-stream] 🔍 ${requestId} Verificando duplicata: ${callbackHash}`);

    const { error: dupError } = await supabase
      .from('processed_callbacks')
      .insert({
        job_id: effectiveJobId,
        template_id: templateId,
        callback_hash: callbackHash,
        user_id: userId
      });

    if (dupError?.code === '23505') {
      console.log(`[image-stream] ⏭️ ${requestId} Callback duplicado: ${callbackHash}`);
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          reason: 'duplicate',
          callbackHash,
          requestId,
          mapped: mappedFromOriginal,
          originalJobId: mappedFromOriginal ? originalJobId : undefined
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (dupError) {
      console.error(`[image-stream] ⚠️ ${requestId} Erro ao registrar callback: ${dupError.message}`);
    }

    // ========================================
    // Update job progress (use effectiveJob)
    // ========================================
    const newReceivedCount = effectiveJob.received_images + 1;
    const shouldComplete = isLast || newReceivedCount >= effectiveJob.expected_images;

    await supabase
      .from('authorized_jobs')
      .update({
        received_images: newReceivedCount,
        status: shouldComplete ? 'completed' : 'active',
        metadata: {
          ...(effectiveJob.metadata as object || {}),
          last_template_id: templateId,
          last_received_at: new Date().toISOString(),
          original_n8n_job_id: mappedFromOriginal ? originalJobId : undefined
        }
      })
      .eq('id', effectiveJob.id);

    // ========================================
    // Broadcast with retry and extended timeout
    // Use effectiveJobId so frontend receives on correct channel
    // ========================================
    const broadcastPayload = {
      jobId: effectiveJobId,
      originalJobId: mappedFromOriginal ? originalJobId : undefined,
      mapped: mappedFromOriginal,
      userId,
      productId,
      productName,
      templateId,
      imageBase64,
      receivedAt: new Date().toISOString(),
      isLast: shouldComplete,
      progress: {
        received: newReceivedCount,
        expected: effectiveJob.expected_images
      }
    };

    const channelName = `user-images-${userId}`;
    console.log(`[image-stream] 📡 ${requestId} Broadcast no canal: ${channelName}`);

    let sendResult = 'unknown';
    let broadcastSuccess = false;

    // Retry logic for broadcast
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const channel = supabase.channel(channelName);

        // Extended timeout (15s instead of 5s)
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Subscribe timeout')), 15000);
          channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              clearTimeout(timeout);
              resolve();
            } else if (status === 'CHANNEL_ERROR') {
              clearTimeout(timeout);
              reject(new Error('Channel error'));
            }
          });
        });

        // Send broadcast
        sendResult = await channel.send({
          type: 'broadcast',
          event: 'new-image',
          payload: broadcastPayload
        });

        console.log(`[image-stream] 📤 ${requestId} Broadcast attempt ${attempt}: ${sendResult}`);

        // Small delay before removing channel to ensure flush
        await new Promise(resolve => setTimeout(resolve, 200));
        await supabase.removeChannel(channel);

        broadcastSuccess = sendResult === 'ok';
        if (broadcastSuccess) break;

      } catch (err) {
        console.error(`[image-stream] ⚠️ ${requestId} Broadcast attempt ${attempt} failed:`, err);
        if (attempt === 2) {
          sendResult = `error: ${err instanceof Error ? err.message : 'unknown'}`;
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[image-stream] ⏱️ ${requestId} Concluído em ${duration}ms (broadcast: ${broadcastSuccess ? 'OK' : 'FAILED'})`);
    console.log(`[image-stream] ===== FIM ${requestId} =====`);

    return new Response(
      JSON.stringify({
        success: true,
        broadcastSuccess,
        sendResult,
        templateId,
        isLast: shouldComplete,
        mapped: mappedFromOriginal,
        originalJobId: mappedFromOriginal ? originalJobId : undefined,
        effectiveJobId,
        mappingReason: mappedFromOriginal ? 'fallback_latest_active_job' : undefined,
        progress: {
          received: newReceivedCount,
          expected: effectiveJob.expected_images
        },
        duration,
        requestId
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[image-stream] ❌ ${requestId} Erro:`, errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, requestId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
