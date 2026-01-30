import { z } from 'zod';

/**
 * Schema Zod para validação completa do payload n8n
 * Garante que TODOS os campos obrigatórios estejam presentes e corretos
 */

// Schema para validar base64 de imagem
const base64ImageSchema = z.string().refine(
  (val) => val.startsWith('data:image'),
  { message: 'Deve ser uma string base64 de imagem (começar com data:image)' }
);

// Schema para imagens
const imagesSchema = z.object({
  reference_base64: base64ImageSchema,
  template_base64: base64ImageSchema,
  product_images_base64: z.array(base64ImageSchema).min(1, 'Pelo menos uma imagem de produto é obrigatória'),
  logo_base64: z.string().optional(),
});

// Schema para dimensões
const dimensionsSchema = z.object({
  width: z.number().positive('Largura deve ser positiva'),
  height: z.number().positive('Altura deve ser positiva'),
});

// Schema para metadata
const metadataSchema = z.object({
  templateId: z.string().min(1, 'templateId é obrigatório'),
  templateName: z.string().min(1, 'templateName é obrigatório'),
  productName: z.string().min(1, 'productName é obrigatório'),
  dimensions: dimensionsSchema,
  promptMode: z.enum(['complete', 'reduced', 'minimal']),
  zones: z.array(z.any()),
});

// Schema para config
const configSchema = z.object({
  quality: z.enum(['standard', 'HD']),
  promptMode: z.enum(['complete', 'reduced', 'minimal']),
  incluir_logo: z.boolean(),
});

// Schema completo do payload
export const n8nTemplatePayloadSchema = z.object({
  request_id: z.string().uuid('request_id deve ser um UUID válido'),
  job_id: z.string().min(1, 'job_id é obrigatório'),
  user_id: z.string().min(1, 'user_id é obrigatório'),
  timestamp: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'timestamp deve ser uma data ISO válida' }
  ),
  source: z.literal('lovable-canva-template-n8n'),
  version: z.literal('1.0'),
  prompt: z.string().min(50, 'Prompt muito curto (mínimo 50 caracteres)'),
  images: imagesSchema,
  metadata: metadataSchema,
  config: configSchema,
});

export type ValidatedN8NPayload = z.infer<typeof n8nTemplatePayloadSchema>;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  details: Record<string, { status: 'ok' | 'error' | 'warning'; message?: string; size?: string }>;
}

/**
 * Valida o payload n8n e retorna resultado detalhado
 */
export function validateN8NPayload(payload: unknown): ValidationResult {
  const result = n8nTemplatePayloadSchema.safeParse(payload);
  
  // Calcular detalhes de cada campo
  const details: ValidationResult['details'] = {};
  const payloadObj = payload as Record<string, unknown>;
  
  // Campos principais
  const mainFields = ['request_id', 'job_id', 'user_id', 'timestamp', 'source', 'version', 'prompt'];
  for (const field of mainFields) {
    if (payloadObj?.[field]) {
      details[field] = { status: 'ok' };
    } else {
      details[field] = { status: 'error', message: 'Campo ausente' };
    }
  }
  
  // Verificar tamanho do prompt
  if (typeof payloadObj?.prompt === 'string') {
    details.prompt = { 
      status: payloadObj.prompt.length >= 50 ? 'ok' : 'error',
      size: `${payloadObj.prompt.length} chars`,
      message: payloadObj.prompt.length < 50 ? 'Prompt muito curto' : undefined
    };
  }
  
  // Imagens
  const images = payloadObj?.images as Record<string, unknown> | undefined;
  if (images) {
    const refB64 = images.reference_base64 as string;
    const tplB64 = images.template_base64 as string;
    const prodB64 = images.product_images_base64 as string[];
    const logoB64 = images.logo_base64 as string | undefined;
    
    details['images.reference_base64'] = refB64?.startsWith('data:image') 
      ? { status: 'ok', size: formatSize(refB64.length) }
      : { status: 'error', message: 'Não é base64 válido' };
      
    details['images.template_base64'] = tplB64?.startsWith('data:image')
      ? { status: 'ok', size: formatSize(tplB64.length) }
      : { status: 'error', message: 'Não é base64 válido' };
      
    if (Array.isArray(prodB64) && prodB64.length > 0) {
      const allValid = prodB64.every(p => p?.startsWith('data:image'));
      details['images.product_images_base64'] = allValid
        ? { status: 'ok', size: `${prodB64.length} imagens` }
        : { status: 'error', message: 'Uma ou mais imagens não são base64 válido' };
    } else {
      details['images.product_images_base64'] = { status: 'error', message: 'Nenhuma imagem de produto' };
    }
    
    if (logoB64) {
      details['images.logo_base64'] = logoB64.startsWith('data:image')
        ? { status: 'ok', size: formatSize(logoB64.length) }
        : { status: 'warning', message: 'Logo não é base64 válido' };
    } else {
      details['images.logo_base64'] = { status: 'ok', message: 'Não solicitado' };
    }
  } else {
    details['images'] = { status: 'error', message: 'Objeto images ausente' };
  }
  
  // Metadata
  const metadata = payloadObj?.metadata as Record<string, unknown> | undefined;
  if (metadata) {
    details['metadata.templateId'] = metadata.templateId 
      ? { status: 'ok' } 
      : { status: 'error', message: 'Ausente' };
    details['metadata.templateName'] = metadata.templateName 
      ? { status: 'ok' } 
      : { status: 'error', message: 'Ausente' };
    details['metadata.productName'] = metadata.productName 
      ? { status: 'ok' } 
      : { status: 'error', message: 'Ausente' };
    details['metadata.dimensions'] = metadata.dimensions 
      ? { status: 'ok' } 
      : { status: 'error', message: 'Ausente' };
  } else {
    details['metadata'] = { status: 'error', message: 'Objeto metadata ausente' };
  }
  
  // Config
  const config = payloadObj?.config as Record<string, unknown> | undefined;
  if (config) {
    details['config.quality'] = config.quality 
      ? { status: 'ok' } 
      : { status: 'error', message: 'Ausente' };
    details['config.promptMode'] = config.promptMode 
      ? { status: 'ok' } 
      : { status: 'error', message: 'Ausente' };
    details['config.incluir_logo'] = typeof config.incluir_logo === 'boolean' 
      ? { status: 'ok' } 
      : { status: 'error', message: 'Ausente' };
  } else {
    details['config'] = { status: 'error', message: 'Objeto config ausente' };
  }
  
  if (result.success) {
    return { 
      valid: true, 
      errors: [], 
      warnings: [],
      details 
    };
  }
  
  // Mapear erros Zod para mensagens amigáveis
  const errors = result.error.errors.map(err => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  });
  
  // Atualizar details com erros do Zod
  for (const err of result.error.errors) {
    const path = err.path.join('.');
    details[path] = { status: 'error', message: err.message };
  }
  
  return {
    valid: false,
    errors,
    warnings: [],
    details,
  };
}

/**
 * Pré-validação rápida de requisitos básicos
 */
export function validatePrerequisites(data: {
  webhookUrl?: string;
  userId?: string | null;
  productName?: string;
  images?: string[];
  templateId?: string;
}): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  if (!data.webhookUrl) missing.push('URL do webhook n8n');
  if (!data.userId) missing.push('Usuário autenticado');
  if (!data.productName) missing.push('Nome do produto');
  if (!data.images?.length) missing.push('Imagens do produto');
  if (!data.templateId) missing.push('Template selecionado');
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Formata tamanho em bytes para string legível
 */
function formatSize(charCount: number): string {
  // Base64 usa ~1.33x o tamanho original
  const approxBytes = Math.round(charCount * 0.75);
  if (approxBytes < 1024) return `${approxBytes}B`;
  if (approxBytes < 1024 * 1024) return `${(approxBytes / 1024).toFixed(1)}KB`;
  return `${(approxBytes / (1024 * 1024)).toFixed(2)}MB`;
}
