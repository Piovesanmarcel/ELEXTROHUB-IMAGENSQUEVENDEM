import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Product IDs for subscription plans
const SUBSCRIPTION_PRODUCTS = {
  monthly: "prod_Tg0HXp22CphG0K",
  yearly: "prod_Tg0H5KZVVDRkZb",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

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

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, user has no subscription");
      return new Response(JSON.stringify({ 
        subscribed: false,
        plan_type: null,
        subscription_end: null,
        status: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // Also check for past_due or trialing
      const otherSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        limit: 1,
      });

      if (otherSubscriptions.data.length > 0) {
        const sub = otherSubscriptions.data[0];
        const productId = sub.items.data[0].price.product as string;
        let planType = null;

        if (productId === SUBSCRIPTION_PRODUCTS.monthly) {
          planType = "monthly";
        } else if (productId === SUBSCRIPTION_PRODUCTS.yearly) {
          planType = "yearly";
        }

        logStep("Found non-active subscription", { status: sub.status, planType });

        return new Response(JSON.stringify({
          subscribed: false,
          plan_type: planType,
          subscription_end: new Date(sub.current_period_end * 1000).toISOString(),
          status: sub.status
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      logStep("No subscription found");
      return new Response(JSON.stringify({
        subscribed: false,
        plan_type: null,
        subscription_end: null,
        status: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscription = subscriptions.data[0];
    const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
    const productId = subscription.items.data[0].price.product as string;

    let planType = null;
    if (productId === SUBSCRIPTION_PRODUCTS.monthly) {
      planType = "monthly";
    } else if (productId === SUBSCRIPTION_PRODUCTS.yearly) {
      planType = "yearly";
    }

    logStep("Active subscription found", { 
      subscriptionId: subscription.id, 
      planType,
      endDate: subscriptionEnd 
    });

    // Update local subscription record
    const { error: upsertError } = await supabaseClient
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        plan_type: planType,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: subscriptionEnd,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      logStep("Warning: Failed to update local subscription record", { error: upsertError.message });
    } else {
      logStep("Local subscription record updated");
    }

    return new Response(JSON.stringify({
      subscribed: true,
      plan_type: planType,
      subscription_end: subscriptionEnd,
      status: subscription.status
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
