import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@4.0.0";

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
  console.log(`[VERIFY-CREDITS-PAYMENT] ${step}${detailsStr}`);
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount / 100);
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const generateEmailHtml = (credits: number, amountPaid: number, totalAvailable: number): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compra Confirmada</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🎉 Compra Confirmada!</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Seus créditos já estão disponíveis</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 25px; color: #374151; font-size: 16px; line-height: 1.6;">
                Olá! Sua compra de créditos foi processada com sucesso.
              </p>
              
              <!-- Purchase Details Card -->
              <table role="presentation" style="width: 100%; background-color: #f9fafb; border-radius: 12px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 25px;">
                    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 18px; font-weight: 600;">📦 Detalhes da Compra</h2>
                    
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Créditos adicionados:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${credits} créditos</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Valor pago:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${formatCurrency(amountPaid)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Data:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${formatDate(new Date())}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Balance Card -->
              <table role="presentation" style="width: 100%; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px; text-align: center;">
                    <p style="margin: 0 0 5px; color: rgba(255,255,255,0.9); font-size: 14px;">Seu saldo atual</p>
                    <p style="margin: 0; color: #ffffff; font-size: 36px; font-weight: 700;">${totalAvailable}</p>
                    <p style="margin: 5px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">créditos disponíveis</p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center;">
                Obrigado por usar nosso serviço! 💜
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Este é um email automático. Por favor, não responda.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
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
    // Detectar modo de teste
    const testMode = isTestMode(req);
    logStep("Function started", { testMode });

    const { sessionId } = await req.json();
    logStep("Received request", { sessionId, testMode });

    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Initialize Stripe com chave apropriada
    const stripeKey = getStripeKey(testMode);
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });
    logStep("Stripe initialized", { mode: testMode ? "TEST" : "PRODUCTION" });

    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Session retrieved", { 
      status: session.payment_status, 
      metadata: session.metadata 
    });

    if (session.payment_status !== "paid") {
      logStep("Payment not completed", { status: session.payment_status });
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Payment not completed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Verify the session belongs to this user
    if (session.metadata?.user_id !== user.id) {
      throw new Error("Session does not belong to this user");
    }

    const creditsAmount = parseInt(session.metadata?.credits_amount || "0");
    if (creditsAmount <= 0) {
      throw new Error("Invalid credits amount in session");
    }

    logStep("Adding credits", { userId: user.id, credits: creditsAmount });

    // Note: Duplicate check removed - stripe_session_id column doesn't exist
    // Stripe already prevents duplicate payments on checkout sessions

    // Get current credits record
    const { data: creditsRow, error: creditsError } = await supabaseClient
      .from("user_credits")
      .select("id, credits_balance, credits_used")
      .eq("user_id", user.id)
      .single();

    if (creditsError && creditsError.code !== "PGRST116") {
      throw new Error(`Error fetching credits: ${creditsError.message}`);
    }

    let newAvailable: number;

    if (creditsRow) {
      newAvailable = (creditsRow.credits_balance || 0) + creditsAmount;
      const { error: updateError } = await supabaseClient
        .from("user_credits")
        .update({
          credits_balance: newAvailable,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) {
        throw new Error(`Error updating credits: ${updateError.message}`);
      }
      logStep("Credits updated", { newAvailable });
    } else {
      newAvailable = creditsAmount;
      const { error: insertError } = await supabaseClient
        .from("user_credits")
        .insert({
          user_id: user.id,
          credits_balance: newAvailable,
          credits_used: 0,
        });

      if (insertError) {
        throw new Error(`Error creating credits record: ${insertError.message}`);
      }
      logStep("New credits record created", { available: newAvailable });
    }

    // Record the purchase
    const amountPaid = session.amount_total || 0;
    const { error: purchaseError } = await supabaseClient
      .from("credit_purchases")
      .insert({
        user_id: user.id,
        credits_purchased: creditsAmount,
        price_paid: amountPaid / 100, // Convert cents to BRL
        payment_method: 'stripe'
      });

    if (purchaseError) {
      logStep("Warning: Could not record purchase", { error: purchaseError.message });
    } else {
      logStep("Purchase recorded");
    }

    // Send confirmation email
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey && user.email) {
      try {
        const resend = new Resend(resendApiKey);
        
        const emailHtml = generateEmailHtml(creditsAmount, amountPaid, newAvailable);
        
        const { error: emailError } = await resend.emails.send({
          from: "Créditos <onboarding@resend.dev>",
          to: [user.email],
          subject: `🎉 Compra confirmada - ${creditsAmount} créditos adicionados!`,
          html: emailHtml,
        });

        if (emailError) {
          logStep("Warning: Could not send email", { error: emailError });
        } else {
          logStep("Confirmation email sent", { to: user.email });
        }
      } catch (emailErr) {
        logStep("Warning: Email sending failed", { error: String(emailErr) });
      }
    } else {
      logStep("Skipping email", { hasApiKey: !!resendApiKey, hasEmail: !!user.email });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Credits added successfully",
      credits_added: creditsAmount,
      total_available: newAvailable
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
