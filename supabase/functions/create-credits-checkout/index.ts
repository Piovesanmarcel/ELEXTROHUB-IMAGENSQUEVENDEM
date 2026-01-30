import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-stripe-test-mode",
};

// Mapeamento de pacotes de créditos - PRODUÇÃO (R$ 2,00 base)
const CREDIT_PACKAGES_PROD: Record<string, { credits: number; name: string }> = {
  "price_1Srhz0LhRGF1A3qGK3W51NSk": { credits: 100, name: "Pro" },
  "price_1SrhzKLhRGF1A3qGqes8BwHO": { credits: 200, name: "Standard" },
  "price_1SrhztLhRGF1A3qGs6TuBxCN": { credits: 300, name: "Avançado" },
  "price_1Sri0ELhRGF1A3qGseNNGFiQ": { credits: 500, name: "Premium" },
};

// Mapeamento de pacotes de créditos - TESTE (Price IDs criados no Stripe Test Mode)
const CREDIT_PACKAGES_TEST: Record<string, { credits: number; name: string }> = {
  "price_1SrtSPLhRGF1A3qGM7AU1jr5": { credits: 100, name: "Pro (Test)" },
  "price_1SrtSeLhRGF1A3qGl6kascFI": { credits: 200, name: "Standard (Test)" },
  "price_1SrtSsLhRGF1A3qGpY9lvlzb": { credits: 300, name: "Avançado (Test)" },
  "price_1SrtT4LhRGF1A3qGdrBZOvUf": { credits: 500, name: "Premium (Test)" },
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
  console.log(`[CREATE-CREDITS-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Detectar modo de teste
    const testMode = isTestMode(req);
    logStep("Function started", { testMode });

    const { priceId } = await req.json();
    logStep("Received request", { priceId, testMode });

    // Selecionar mapeamento correto baseado no modo
    const CREDIT_PACKAGES = testMode ? CREDIT_PACKAGES_TEST : CREDIT_PACKAGES_PROD;

    if (!priceId || !CREDIT_PACKAGES[priceId]) {
      throw new Error("Invalid price ID");
    }

    const creditsAmount = CREDIT_PACKAGES[priceId].credits;
    logStep("Credits package found", { credits: creditsAmount, testMode });

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Usar chave apropriada (teste ou produção)
    const stripeKey = getStripeKey(testMode);
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });
    logStep("Stripe initialized", { mode: testMode ? "TEST" : "PRODUCTION" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/pagamento-sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pagamento-cancelado`,
      metadata: {
        user_id: user.id,
        credits_amount: creditsAmount.toString(),
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
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
