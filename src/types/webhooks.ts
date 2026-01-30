/**
 * Tipos estritamente tipados para payloads de webhooks
 * 
 * Garante consistência entre frontend e backend/n8n
 */

// ============================================
// N8N Webhook Types
// ============================================

export interface N8NWebhookPayload {
  productId: string;
  productName: string;
  imageUrl: string;
  sceneType: string;
  userId: string;
  jobId: string;
  timestamp: string;
  
  // Campos opcionais para contexto adicional
  productSku?: string;
  shortDescription?: string;
  category?: string;
  brand?: string;
  
  // Configurações de geração
  resolution?: '1K' | '2K' | '4K';
  style?: string;
  customPrompt?: string;
}

export interface N8NWebhookResponse {
  success: boolean;
  jobId?: string;
  error?: string;
  estimatedTime?: number;
  queuePosition?: number;
}

// ============================================
// Image Stream Types (Broadcast)
// ============================================

export type ImageStreamStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ImageStreamPayload {
  jobId: string;
  userId: string;
  status: ImageStreamStatus;
  
  // Imagem gerada
  imageUrl?: string;
  imageBase64?: string;
  
  // Metadados
  templateId?: string;
  sceneType?: string;
  productName?: string;
  
  // Erro (se status === 'failed')
  error?: string;
  errorCode?: string;
  
  // Timestamps
  timestamp: string;
  processingTimeMs?: number;
}

// ============================================
// Queue Status Types
// ============================================

export interface QueueStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'not_found';
  progress?: number;
  result?: {
    imageUrl?: string;
    imageBase64?: string;
    metadata?: Record<string, unknown>;
  };
  error?: string;
  queuePosition?: number;
  estimatedWaitTime?: number;
}

// ============================================
// Generation Request Types
// ============================================

export interface GenerationRequest {
  productName: string;
  productId: string;
  userId: string;
  
  // Configurações
  sceneTypes: string[];
  resolution?: '1K' | '2K' | '4K';
  
  // Imagem de referência
  imageUrl?: string;
  imageBase64?: string;
  
  // Prompt personalizado
  customPrompt?: string;
  
  // Callback
  callbackUrl?: string;
}

export interface GenerationResponse {
  success: boolean;
  jobId?: string;
  jobIds?: string[];
  
  // Estimativas
  estimatedTime?: number;
  queuePosition?: number;
  
  // Erro
  error?: string;
  errorCode?: 'RATE_LIMITED' | 'INVALID_INPUT' | 'QUOTA_EXCEEDED' | 'SERVICE_ERROR';
}

// ============================================
// Callback Types (n8n -> Supabase)
// ============================================

export interface N8NCallbackPayload {
  job_id: string;
  user_id: string;
  template_id: string;
  
  // Resultado
  image_url?: string;
  image_base64?: string;
  
  // Status
  status: 'completed' | 'failed';
  error?: string;
  
  // Metadados
  processing_time_ms?: number;
  model_used?: string;
  
  // Autenticação
  callback_secret?: string;
}

// Aliases para compatibilidade com camelCase
export interface N8NCallbackPayloadCamelCase {
  jobId: string;
  userId: string;
  templateId: string;
  imageUrl?: string;
  imageBase64?: string;
  status: 'completed' | 'failed';
  error?: string;
  processingTimeMs?: number;
  modelUsed?: string;
  callbackSecret?: string;
}

// ============================================
// Type Guards
// ============================================

export function isN8NWebhookPayload(data: unknown): data is N8NWebhookPayload {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.productId === 'string' &&
    typeof obj.productName === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.jobId === 'string'
  );
}

export function isImageStreamPayload(data: unknown): data is ImageStreamPayload {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.jobId === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.status === 'string' &&
    ['pending', 'processing', 'completed', 'failed'].includes(obj.status as string)
  );
}

export function isN8NCallbackPayload(data: unknown): data is N8NCallbackPayload {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  
  // Suporta tanto snake_case quanto camelCase
  const jobId = obj.job_id || obj.jobId;
  const userId = obj.user_id || obj.userId;
  const templateId = obj.template_id || obj.templateId;
  
  return (
    typeof jobId === 'string' &&
    typeof userId === 'string' &&
    typeof templateId === 'string'
  );
}

// ============================================
// Helpers
// ============================================

/**
 * Normaliza payload de callback para formato consistente (snake_case)
 */
export function normalizeCallbackPayload(
  data: N8NCallbackPayload | N8NCallbackPayloadCamelCase
): N8NCallbackPayload {
  const camelData = data as N8NCallbackPayloadCamelCase;
  const snakeData = data as N8NCallbackPayload;
  
  return {
    job_id: snakeData.job_id || camelData.jobId,
    user_id: snakeData.user_id || camelData.userId,
    template_id: snakeData.template_id || camelData.templateId,
    image_url: snakeData.image_url || camelData.imageUrl,
    image_base64: snakeData.image_base64 || camelData.imageBase64,
    status: snakeData.status || camelData.status,
    error: snakeData.error || camelData.error,
    processing_time_ms: snakeData.processing_time_ms || camelData.processingTimeMs,
    model_used: snakeData.model_used || camelData.modelUsed,
    callback_secret: snakeData.callback_secret || camelData.callbackSecret,
  };
}
