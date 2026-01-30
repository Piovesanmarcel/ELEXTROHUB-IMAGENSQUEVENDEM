/**
 * Utilitários padronizados para respostas de Edge Functions
 * 
 * Garante consistência em todas as respostas do backend
 */

import { corsHeaders } from "./cors.ts";

interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  timestamp: string;
}

/**
 * Resposta de sucesso padronizada
 */
export function successResponse<T>(data: T, status = 200): Response {
  const body: SuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Resposta de erro padronizada
 */
export function errorResponse(
  message: string,
  status = 400,
  code?: string
): Response {
  const body: ErrorResponse = {
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Resposta para erros de autenticação
 */
export function unauthorizedResponse(message = "Não autorizado"): Response {
  return errorResponse(message, 401, "UNAUTHORIZED");
}

/**
 * Resposta para erros de rate limiting
 */
export function rateLimitResponse(
  retryAfter = 30,
  message = "Limite de requisições excedido"
): Response {
  const body: ErrorResponse = {
    success: false,
    error: message,
    code: "RATE_LIMITED",
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(body), {
    status: 429,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Retry-After": String(retryAfter),
    },
  });
}

/**
 * Resposta para erros internos do servidor
 */
export function serverErrorResponse(
  message = "Erro interno do servidor"
): Response {
  return errorResponse(message, 500, "SERVER_ERROR");
}

/**
 * Resposta para recursos não encontrados
 */
export function notFoundResponse(message = "Recurso não encontrado"): Response {
  return errorResponse(message, 404, "NOT_FOUND");
}

/**
 * Resposta para validação de dados
 */
export function validationErrorResponse(
  errors: Record<string, string>
): Response {
  const body = {
    success: false,
    error: "Erro de validação",
    code: "VALIDATION_ERROR",
    details: errors,
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(body), {
    status: 422,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Resposta CORS para preflight
 */
export function corsPreflightResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
