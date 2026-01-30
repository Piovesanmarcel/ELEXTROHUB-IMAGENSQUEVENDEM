
import { EnhancementResult } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export function createErrorResponse(
  result: EnhancementResult, 
  status: number = 500
): Response {
  return new Response(
    JSON.stringify(result),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

export function createSuccessResponse(result: EnhancementResult): Response {
  return new Response(
    JSON.stringify(result),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

export function createValidationError(message: string, originalUrl?: string): EnhancementResult {
  return {
    success: false,
    error: message,
    original_url: originalUrl || null,
    enhanced_url: null
  }
}

export function createApiKeyError(): EnhancementResult {
  return {
    success: false,
    error: 'API Key da DeepAI não configurada no servidor',
    original_url: null,
    enhanced_url: null,
    user_action_required: 'Configure a chave da API DeepAI nas configurações do projeto'
  }
}

export function createInternalError(error: Error, originalUrl?: string): EnhancementResult {
  return {
    success: false,
    error: 'Erro interno do servidor',
    message: error.message,
    original_url: originalUrl || null,
    enhanced_url: null
  }
}
