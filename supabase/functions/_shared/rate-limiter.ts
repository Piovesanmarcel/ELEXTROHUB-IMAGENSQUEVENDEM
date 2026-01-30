/**
 * Rate Limiter Server-Side para Edge Functions
 * 
 * Implementa rate limiting usando Supabase como storage.
 * Para produção de alto volume, considere usar Redis.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

interface RateLimitConfig {
    /** Número máximo de requests permitidos */
    maxRequests: number;
    /** Janela de tempo em segundos */
    windowSeconds: number;
    /** Identificador do limite (ex: 'gemini', 'openai') */
    limitKey: string;
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
    retryAfter?: number;
}

/**
 * Verifica e incrementa contador de rate limit
 * 
 * @param userId - ID do usuário
 * @param config - Configuração do rate limit
 * @returns Resultado indicando se a requisição é permitida
 */
export async function checkRateLimit(
    userId: string,
    config: RateLimitConfig
): Promise<RateLimitResult> {
    const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowSeconds * 1000);
    const cacheKey = `${config.limitKey}:${userId}`;

    try {
        // Contar requests recentes do usuário
        const { count, error: countError } = await supabase
            .from("rate_limit_log")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("limit_key", config.limitKey)
            .gte("created_at", windowStart.toISOString());

        if (countError) {
            console.error("[RateLimit] Erro ao contar requests:", countError);
            // Em caso de erro, permitir (fail-open) mas logar
            return {
                allowed: true,
                remaining: config.maxRequests,
                resetAt: new Date(now.getTime() + config.windowSeconds * 1000),
            };
        }

        const currentCount = count || 0;
        const remaining = Math.max(0, config.maxRequests - currentCount);
        const resetAt = new Date(now.getTime() + config.windowSeconds * 1000);

        if (currentCount >= config.maxRequests) {
            const oldestRequest = await supabase
                .from("rate_limit_log")
                .select("created_at")
                .eq("user_id", userId)
                .eq("limit_key", config.limitKey)
                .gte("created_at", windowStart.toISOString())
                .order("created_at", { ascending: true })
                .limit(1)
                .single();

            const retryAfter = oldestRequest.data
                ? Math.ceil(
                    (new Date(oldestRequest.data.created_at).getTime() +
                        config.windowSeconds * 1000 -
                        now.getTime()) /
                    1000
                )
                : config.windowSeconds;

            console.warn(
                `[RateLimit] BLOQUEADO: ${userId} excedeu ${config.maxRequests} requests/${config.windowSeconds}s para ${config.limitKey}`
            );

            return {
                allowed: false,
                remaining: 0,
                resetAt,
                retryAfter: Math.max(1, retryAfter),
            };
        }

        // Registrar este request
        const { error: insertError } = await supabase
            .from("rate_limit_log")
            .insert({
                user_id: userId,
                limit_key: config.limitKey,
                created_at: now.toISOString(),
            });

        if (insertError) {
            console.error("[RateLimit] Erro ao registrar request:", insertError);
        }

        return {
            allowed: true,
            remaining: remaining - 1,
            resetAt,
        };
    } catch (error) {
        console.error("[RateLimit] Erro inesperado:", error);
        // Fail-open em caso de erro
        return {
            allowed: true,
            remaining: config.maxRequests,
            resetAt: new Date(now.getTime() + config.windowSeconds * 1000),
        };
    }
}

/**
 * Rate limit response com headers padrão
 */
export function rateLimitResponse(result: RateLimitResult): Response {
    return new Response(
        JSON.stringify({
            error: "Rate limit exceeded",
            message: `Muitas requisições. Tente novamente em ${result.retryAfter} segundos.`,
            retryAfter: result.retryAfter,
        }),
        {
            status: 429,
            headers: {
                "Content-Type": "application/json",
                "X-RateLimit-Remaining": String(result.remaining),
                "X-RateLimit-Reset": result.resetAt.toISOString(),
                "Retry-After": String(result.retryAfter || 60),
            },
        }
    );
}

/**
 * Configurações pré-definidas de rate limit por tipo de API
 */
export const RATE_LIMITS = {
    // APIs de IA - mais restritivas (custam $$)
    gemini: { maxRequests: 10, windowSeconds: 60, limitKey: "gemini" },
    openai: { maxRequests: 10, windowSeconds: 60, limitKey: "openai" },
    stability: { maxRequests: 5, windowSeconds: 60, limitKey: "stability" },

    // Operações gerais - mais permissivas
    general: { maxRequests: 60, windowSeconds: 60, limitKey: "general" },
    auth: { maxRequests: 5, windowSeconds: 300, limitKey: "auth" }, // 5 tentativas / 5 min

    // Webhooks e filas - bem permissivas
    queue: { maxRequests: 100, windowSeconds: 60, limitKey: "queue" },
} as const;

/**
 * Limpa logs de rate limit antigos (para manutenção)
 * Chamar periodicamente via cron
 */
export async function cleanupRateLimitLogs(): Promise<number> {
    const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 horas

    const { count, error } = await supabase
        .from("rate_limit_log")
        .delete()
        .lt("created_at", cutoff.toISOString());

    if (error) {
        console.error("[RateLimit] Erro ao limpar logs antigos:", error);
        return 0;
    }

    return count || 0;
}
