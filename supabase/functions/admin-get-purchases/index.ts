import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-GET-PURCHASES] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }
    
    logStep("User authenticated", { userId: userData.user.id });

    // Verificar se é admin
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      logStep("Access denied - not admin", { userId: userData.user.id });
      throw new Error("Access denied: Admin role required");
    }

    logStep("Admin verified, fetching purchases");

    // Buscar todas as compras
    const { data: purchases, error: purchasesError } = await supabaseClient
      .from("credit_purchases")
      .select("*")
      .order("created_at", { ascending: false });

    if (purchasesError) {
      logStep("Error fetching purchases", { error: purchasesError.message });
      throw new Error(`Failed to fetch purchases: ${purchasesError.message}`);
    }

    logStep("Purchases fetched successfully", { count: purchases?.length || 0 });

    // Calcular estatísticas
    const stats = {
      totalPurchases: purchases?.length || 0,
      totalCredits: purchases?.reduce((sum, p) => sum + p.credits_amount, 0) || 0,
      totalRevenue: purchases?.reduce((sum, p) => sum + p.amount_paid, 0) || 0,
    };

    logStep("Stats calculated", stats);

    return new Response(JSON.stringify({ 
      purchases: purchases || [],
      stats
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
