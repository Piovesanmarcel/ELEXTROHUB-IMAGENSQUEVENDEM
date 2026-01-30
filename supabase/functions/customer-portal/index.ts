import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-stripe-test-mode",
};

// Helper para detectar modo de teste
const isTestMode = (req: Request): boolean => {
  const url = new URL(req.url);
  return req.headers.get("x-stripe-test-mode") === "true" || 
         url.searchParams.get("test_mode") === "true";
};

// Helper para obter chave Stripe apropriada
const getStripeKey = (testMode: boolean): string => {
  if (testMode) {
    const testKey = Deno.env.get("STRIPE_TEST_SECRET_KEY");
    if (!testKey) throw new Error("STRIPE_TEST_SECRET_KEY não configurada para modo teste");
    return testKey;
  }
  const prodKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!prodKey) throw new Error("STRIPE_SECRET_KEY não configurada");
  return prodKey;
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Detectar modo de teste
    const testMode = isTestMode(req);
    logStep("Function started", { testMode });

    const stripeKey = getStripeKey(testMode);
    logStep("Stripe key verified", { mode: testMode ? "TEST" : "PRODUCTION" });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("Nenhum registro de cliente encontrado. Você precisa ter uma assinatura primeiro.");
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const origin = req.headers.get("origin") || "http://localhost:5173";
    
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/planos`,
    });

    logStep("Customer portal session created", { sessionId: portalSession.id, url: portalSession.url });

    return new Response(JSON.stringify({ url: portalSession.url }), {
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
