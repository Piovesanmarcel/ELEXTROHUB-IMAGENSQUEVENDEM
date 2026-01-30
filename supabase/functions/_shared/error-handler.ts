/**
 * Tratamento centralizado de erros para Edge Functions
 */

import { errorResponse, serverErrorResponse, unauthorizedResponse, rateLimitResponse } from "./response.ts";
import { logger } from "./logger.ts";

interface ErrorHandlerOptions {
  logError?: boolean;
  includeStack?: boolean;
}

/**
 * Tipos de erros conhecidos
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Não autorizado') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public readonly errors?: Record<string, string>) {
    super(message, 'VALIDATION_ERROR', 422);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends AppError {
  constructor(
    message = 'Limite de requisições excedido',
    public readonly retryAfter = 30
  ) {
    super(message, 'RATE_LIMITED', 429);
    this.name = 'RateLimitError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    super(message || `Erro ao comunicar com ${service}`, 'EXTERNAL_SERVICE_ERROR', 502);
    this.name = 'ExternalServiceError';
  }
}

/**
 * Converte um erro em uma Response apropriada
 */
export function handleError(
  error: unknown,
  options: ErrorHandlerOptions = {}
): Response {
  const { logError = true } = options;

  // Log do erro se solicitado
  if (logError) {
    if (error instanceof Error) {
      logger.error(`Error: ${error.message}`, error);
    } else {
      logger.error('Unknown error', error);
    }
  }

  // Erros conhecidos da aplicação
  if (error instanceof AuthenticationError) {
    return unauthorizedResponse(error.message);
  }

  if (error instanceof RateLimitError) {
    return rateLimitResponse(error.retryAfter, error.message);
  }

  if (error instanceof AppError) {
    return errorResponse(error.message, error.statusCode, error.code);
  }

  // Erros do Supabase
  if (isSupabaseError(error)) {
    const { message, code } = error;
    
    // Erros de autenticação do Supabase
    if (code === 'PGRST301' || message.includes('JWT')) {
      return unauthorizedResponse('Sessão expirada');
    }
    
    // Erros de RLS
    if (code === '42501' || message.includes('row-level security')) {
      return errorResponse('Acesso negado', 403, 'FORBIDDEN');
    }

    return errorResponse(message, 400, code);
  }

  // Erro genérico
  if (error instanceof Error) {
    // Em produção, não expor detalhes do erro
    return serverErrorResponse('Ocorreu um erro inesperado');
  }

  return serverErrorResponse();
}

/**
 * Verifica se é um erro do Supabase
 */
function isSupabaseError(error: unknown): error is { message: string; code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

/**
 * Wrapper para handlers que captura erros automaticamente
 */
export function withErrorHandler<T extends (...args: unknown[]) => Promise<Response>>(
  handler: T,
  options?: ErrorHandlerOptions
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleError(error, options);
    }
  }) as T;
}
