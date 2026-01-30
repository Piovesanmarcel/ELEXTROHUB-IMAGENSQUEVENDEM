import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WebhookRequest {
  webhook_type: string;
  payload: Record<string, unknown>;
  package_id?: string;
}

interface WebhookConfig {
  webhook_url: string;
  credits_cost: number;
  config: {
    timeout?: number;
    retry?: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    console.log("🔐 Webhook Proxy - Iniciando...");

    // Verificar método
    if (req.method !== "POST") {
      throw new Error("Método não permitido");
    }

    // Obter token de autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("❌ Sem header de autorização");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Não autorizado",
          code: "UNAUTHORIZED",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Criar cliente Supabase com token do usuário
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validar formato do header
    if (!authHeader.startsWith("Bearer ")) {
      console.error("❌ Header de autorização malformado (deve começar com Bearer)");
    } else {
      console.log("🔐 Header de autorização recebido (Bearer ***)");
    }

    const token = authHeader.replace("Bearer ", "");

    // Cliente com token do usuário (para verificar autenticação)
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      }
    });

    // Verificação explícita do usuário
    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser(token);

    // Cliente admin (para acessar webhook_configs e debitar créditos)
    // REINSERINDO: Necessário para operações de banco
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    if (authError || !user) {
      console.error("❌ Usuário não autenticado:", authError?.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Sessão inválida ou expirada",
          code: "UNAUTHORIZED",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`✅ Usuário autenticado: ${user.id}`);

    // Obter dados da requisição
    const { webhook_type, payload, package_id }: WebhookRequest =
      await req.json();

    if (!webhook_type) {
      throw new Error("webhook_type é obrigatório");
    }

    if (!payload) {
      throw new Error("payload é obrigatório");
    }

    console.log(`📦 Webhook solicitado: ${webhook_type}`);
    console.log(`📦 Package ID: ${package_id || "N/A"}`);

    // Buscar configuração do webhook (usando service role)
    const { data: webhookData, error: webhookError } = await supabaseAdmin.rpc(
      "get_webhook_url",
      { p_webhook_type: webhook_type }
    );

    if (webhookError || !webhookData || webhookData.length === 0) {
      console.error("❌ Webhook não encontrado:", webhookError?.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Webhook '${webhook_type}' não encontrado ou inativo`,
          code: "WEBHOOK_NOT_FOUND",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const config: WebhookConfig = webhookData[0];
    console.log(`✅ Webhook encontrado: ${config.webhook_url} (Custo: ${config.credits_cost})`);

    // Verificar créditos do usuário (Tabela correta: user_credits)
    const { data: usageData, error: usageError } = await supabaseAdmin
      .from("user_credits")
      .select("credits_balance")
      .eq("user_id", user.id)
      .single();

    if (usageError) {
      console.error("❌ Erro ao verificar créditos:", usageError.message);
      throw new Error(`Erro ao verificar créditos disponíveis: ${usageError.message}`);
    }

    const creditsAvailable = usageData?.credits_balance || 0;
    console.log(`💰 Créditos disponíveis: ${creditsAvailable}`);

    if (creditsAvailable < config.credits_cost) {
      console.error(
        `❌ Créditos insuficientes: ${creditsAvailable} < ${config.credits_cost}`
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: `Créditos insuficientes. Necessário: ${config.credits_cost}, Disponível: ${creditsAvailable}`,
          code: "INSUFFICIENT_CREDITS",
          credits_required: config.credits_cost,
          credits_available: creditsAvailable,
        }),
        {
          status: 402, // Payment Required
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Criar log de uso (status pending)
    const { data: logData, error: logError } = await supabaseAdmin
      .from("webhook_usage_logs")
      .insert({
        user_id: user.id,
        webhook_type,
        package_id,
        status: "pending",
        credits_used: config.credits_cost,
        request_summary: {
          product_name: payload.product_name,
          product_id: payload.product_id,
          images_count: Array.isArray(payload.images)
            ? payload.images.length
            : 0,
        },
        client_ip: req.headers.get("x-forwarded-for") || "unknown",
      })
      .select("id")
      .single();

    if (logError) {
      console.warn("⚠️ Erro ao criar log:", logError.message);
    }

    const logId = logData?.id;
    console.log(`📝 Log criado: ${logId}`);

    // Debitar créditos ANTES de disparar o webhook
    const { error: debitError } = await supabaseAdmin.rpc("debit_credits", {
      p_user_id: user.id,
      p_amount: config.credits_cost,
      p_reason: `Webhook: ${webhook_type}`,
    });

    if (debitError) {
      console.error("❌ Erro ao debitar créditos:", debitError.message);

      // Atualizar log com erro
      if (logId) {
        await supabaseAdmin
          .from("webhook_usage_logs")
          .update({
            status: "error",
            error_message: `Erro ao debitar créditos: ${debitError.message}`,
            completed_at: new Date().toISOString(),
          })
          .eq("id", logId);
      }

      throw new Error("Erro ao processar pagamento de créditos");
    }

    console.log(`💰 Créditos debitados: ${config.credits_cost}`);

    // Preparar payload enriquecido para o n8n
    const enrichedPayload = {
      ...payload,
      _meta: {
        user_id: user.id,
        user_email: user.email,
        webhook_type,
        package_id,
        log_id: logId,
        credits_used: config.credits_cost,
        timestamp: new Date().toISOString(),
        source: "webhook-proxy",
      },
    };

    // Disparar webhook para n8n
    console.log(`🚀 Disparando webhook: ${config.webhook_url}`);

    const timeout = config.config?.timeout || 120000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const webhookResponse = await fetch(config.webhook_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Source": "electrohub-proxy",
          "X-User-ID": user.id,
          "X-Log-ID": logId || "",
        },
        body: JSON.stringify(enrichedPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`📋 Resposta n8n: ${webhookResponse.status}`);

      let responseData: unknown = null;
      const contentType = webhookResponse.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        responseData = await webhookResponse.json();
      } else {
        responseData = await webhookResponse.text();
      }

      // Atualizar log com sucesso
      if (logId) {
        await supabaseAdmin
          .from("webhook_usage_logs")
          .update({
            status: webhookResponse.ok ? "success" : "error",
            response_summary: {
              status: webhookResponse.status,
              ok: webhookResponse.ok,
              data_type: typeof responseData,
            },
            error_message: webhookResponse.ok
              ? null
              : `HTTP ${webhookResponse.status}`,
            completed_at: new Date().toISOString(),
          })
          .eq("id", logId);
      }

      if (!webhookResponse.ok) {
        // Se o webhook falhou, tentar estornar créditos
        console.warn(
          `⚠️ Webhook falhou, tentando estornar ${config.credits_cost} créditos`
        );

        await supabaseAdmin.rpc("refund_credits", {
          p_user_id: user.id,
          p_amount: config.credits_cost,
          p_reason: `Estorno: Falha no webhook ${webhook_type}`,
        });

        return new Response(
          JSON.stringify({
            success: false,
            error: `Webhook retornou erro: ${webhookResponse.status}`,
            code: "WEBHOOK_ERROR",
            credits_refunded: config.credits_cost,
          }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Webhook executado com sucesso em ${duration}ms`);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Webhook executado com sucesso",
          data: responseData,
          credits_used: config.credits_cost,
          log_id: logId,
          duration_ms: duration,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (fetchError) {
      clearTimeout(timeoutId);

      const isTimeout = fetchError instanceof Error && fetchError.name === "AbortError";
      const errorMessage = isTimeout
        ? `Timeout após ${timeout}ms`
        : fetchError instanceof Error
          ? fetchError.message
          : "Erro desconhecido";

      console.error(`❌ Erro ao chamar webhook (${config.webhook_url}): ${errorMessage}`);

      // Estornar créditos em caso de erro
      console.warn(
        `⚠️ Estornando ${config.credits_cost} créditos devido a erro`
      );

      await supabaseAdmin.rpc("refund_credits", {
        p_user_id: user.id,
        p_amount: config.credits_cost,
        p_reason: `Estorno: Erro no webhook ${webhook_type} - ${errorMessage}`,
      });

      // Atualizar log com erro
      if (logId) {
        await supabaseAdmin
          .from("webhook_usage_logs")
          .update({
            status: "error",
            error_message: errorMessage,
            completed_at: new Date().toISOString(),
          })
          .eq("id", logId);
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          code: isTimeout ? "WEBHOOK_TIMEOUT" : "WEBHOOK_ERROR",
          credits_refunded: config.credits_cost,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("❌ Erro geral no webhook-proxy:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        code: "INTERNAL_ERROR",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
