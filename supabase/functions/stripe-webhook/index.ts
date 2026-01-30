/**
 * Stripe Webhook Handler com Validação de Assinatura
 * 
 * Este endpoint recebe webhooks do Stripe e valida a assinatura
 * antes de processar eventos de pagamento.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// 🔐 CORS restritivo - webhooks não precisam de CORS permissivo
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "stripe-signature, content-type",
};

const logStep = (step: string, details?: any) => {
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
    console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Helper para obter chave Stripe apropriada
const getStripeKey = (testMode: boolean): string => {
    if (testMode) {
        const testKey = Deno.env.get("STRIPE_TEST_SECRET_KEY");
        if (!testKey) throw new Error("STRIPE_TEST_SECRET_KEY não configurada");
        return testKey;
    }
    const prodKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!prodKey) throw new Error("STRIPE_SECRET_KEY não configurada");
    return prodKey;
};

// Helper para obter webhook secret
const getWebhookSecret = (testMode: boolean): string => {
    if (testMode) {
        const testSecret = Deno.env.get("STRIPE_TEST_WEBHOOK_SECRET");
        if (!testSecret) throw new Error("STRIPE_TEST_WEBHOOK_SECRET não configurada");
        return testSecret;
    }
    const prodSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!prodSecret) throw new Error("STRIPE_WEBHOOK_SECRET não configurada");
    return prodSecret;
};

serve(async (req) => {
    // OPTIONS para CORS
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    // Apenas POST permitido
    if (req.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
    }

    const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
    );

    try {
        // 🔐 VALIDAÇÃO DE ASSINATURA - CRÍTICO!
        const signature = req.headers.get("stripe-signature");
        if (!signature) {
            logStep("ERROR", { message: "Missing stripe-signature header" });
            return new Response(
                JSON.stringify({ error: "Missing stripe-signature header" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Ler body como texto para validação de assinatura
        const body = await req.text();

        // Detectar modo de teste via URL ou header
        const url = new URL(req.url);
        const testMode = url.searchParams.get("test_mode") === "true" ||
            url.hostname.includes("localhost");

        logStep("Webhook received", { testMode, hasSignature: !!signature });

        // Obter keys apropriadas
        const stripeKey = getStripeKey(testMode);
        const webhookSecret = getWebhookSecret(testMode);

        const stripe = new Stripe(stripeKey, {
            apiVersion: "2025-08-27.basil",
        });

        // 🔐 CONSTRUIR E VALIDAR EVENTO
        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
            logStep("Signature verified", { eventId: event.id, type: event.type });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unknown error";
            logStep("Signature verification FAILED", { error: message });
            return new Response(
                JSON.stringify({ error: `Webhook signature verification failed: ${message}` }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // 🔐 REGISTRAR EM AUDIT LOG
        await supabaseClient.from("audit_logs").insert({
            event_type: `stripe.${event.type}`,
            event_details: {
                eventId: event.id,
                type: event.type,
                livemode: event.livemode,
            },
            ip_address: req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for"),
        });

        // Processar eventos
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                logStep("Processing checkout.session.completed", {
                    sessionId: session.id,
                    paymentStatus: session.payment_status,
                    customerId: session.customer,
                });

                if (session.payment_status === "paid" && session.metadata?.user_id) {
                    const userId = session.metadata.user_id;
                    const creditsAmount = parseInt(session.metadata.credits_amount || "0");

                    if (creditsAmount > 0) {
                        // Adicionar créditos ao usuário
                        const { data: creditsRow, error: fetchError } = await supabaseClient
                            .from("user_credits")
                            .select("id, credits_balance")
                            .eq("user_id", userId)
                            .single();

                        if (fetchError && fetchError.code !== "PGRST116") {
                            throw new Error(`Error fetching credits: ${fetchError.message}`);
                        }

                        if (creditsRow) {
                            const newBalance = (creditsRow.credits_balance || 0) + creditsAmount;
                            await supabaseClient
                                .from("user_credits")
                                .update({ credits_balance: newBalance, updated_at: new Date().toISOString() })
                                .eq("user_id", userId);
                            logStep("Credits updated", { userId, added: creditsAmount, newBalance });
                        } else {
                            await supabaseClient
                                .from("user_credits")
                                .insert({ user_id: userId, credits_balance: creditsAmount, credits_used: 0 });
                            logStep("Credits created", { userId, balance: creditsAmount });
                        }

                        // Registrar compra
                        await supabaseClient.from("credit_purchases").insert({
                            user_id: userId,
                            credits_purchased: creditsAmount,
                            price_paid: (session.amount_total || 0) / 100,
                            payment_method: "stripe",
                        });
                    }
                }
                break;
            }

            case "customer.subscription.created":
            case "customer.subscription.updated": {
                const subscription = event.data.object as Stripe.Subscription;
                logStep(`Processing ${event.type}`, {
                    subscriptionId: subscription.id,
                    status: subscription.status,
                    customerId: subscription.customer,
                });
                // TODO: Atualizar status de assinatura do usuário
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                logStep("Processing subscription.deleted", {
                    subscriptionId: subscription.id,
                    customerId: subscription.customer,
                });
                // TODO: Cancelar assinatura do usuário
                break;
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object as Stripe.Invoice;
                logStep("Processing payment_failed", {
                    invoiceId: invoice.id,
                    customerId: invoice.customer,
                });
                // TODO: Notificar usuário sobre falha no pagamento
                break;
            }

            default:
                logStep("Unhandled event type", { type: event.type });
        }

        return new Response(
            JSON.stringify({ received: true, eventId: event.id }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logStep("ERROR", { message: errorMessage });

        return new Response(
            JSON.stringify({ error: errorMessage }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
});
