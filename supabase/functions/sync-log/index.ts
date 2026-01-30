
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Permissão CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const url = new URL(req.url);
    const sku = url.searchParams.get("sku")?.trim();

    if (!sku) {
      return new Response(JSON.stringify({ success: false, message: "Parâmetro 'sku' obrigatório" }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Busca o produto processado
    const { data: productDetail, error: prodError } = await supabase
      .from('produtos')
      .select('*')
      .eq('sku', sku)
      .maybeSingle();

    if (prodError) {
      console.error("Erro ao buscar produto:", prodError);
      return new Response(JSON.stringify({ success: false, message: "Erro ao buscar produto no banco." }), { status: 500, headers: corsHeaders });
    }
    if (!productDetail) {
      return new Response(JSON.stringify({ success: false, message: "Produto não encontrado no banco." }), { status: 404, headers: corsHeaders });
    }

    // 2. Busca o sync log mais recente para esse SKU (detalhes.bling?.sku)
    const { data: syncLog, error: logError } = await supabase
      .from('sync_logs')
      .select('*')
      .eq('tipo', 'produto')
      .contains('detalhes', { sku })
      .order('criado_em', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Pega o blingRaw, se disponível no syncLog
    let blingRaw = undefined;
    if (syncLog && typeof syncLog.detalhes?.blingRaw !== "undefined") {
      blingRaw = syncLog.detalhes.blingRaw;
    }

    return new Response(JSON.stringify({
      success: true,
      productDetail,
      blingRaw,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[SYNC-LOG] Erro inesperado:", e);
    return new Response(JSON.stringify({ success: false, message: "Erro interno do servidor." }), { status: 500, headers: corsHeaders });
  }
});
