import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-stripe-test-mode",
};

// Price IDs for subscription plans
const SUBSCRIPTION_PRICES = {
  monthly: "price_1SieGfLke7TPb7Ln89aFSegd", // R$69,90/mês
  yearly: "price_1SieGsLke7TPb7LnTcvxK0Il",   // R$358,80/ano (R$29,90/mês)
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
  console.log(`[CREATE-SUBSCRIPTION-CHECKOUT] ${step}${detailsStr}`);
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
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
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

    const { planType } = await req.json();
    if (!planType || !['monthly', 'yearly'].includes(planType)) {
      throw new Error("Invalid plan type. Must be 'monthly' or 'yearly'");
    }
    logStep("Plan type received", { planType });

    const priceId = SUBSCRIPTION_PRICES[planType as keyof typeof SUBSCRIPTION_PRICES];
    logStep("Price ID selected", { priceId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer already exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });

      // Check if user already has an active subscription
      const existingSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });
      
      if (existingSubscriptions.data.length > 0) {
        logStep("User already has active subscription");
        throw new Error("Você já possui uma assinatura ativa. Gerencie sua assinatura no portal do cliente.");
      }
    } else {
      logStep("No existing customer, will create new one");
    }

    const origin = req.headers.get("origin") || "http://localhost:5173";
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/assinatura-sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/planos?canceled=true`,
      metadata: {
        user_id: user.id,
        plan_type: planType,
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
