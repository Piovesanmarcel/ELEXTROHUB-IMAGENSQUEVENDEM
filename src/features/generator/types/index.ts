// ============= GENERATOR TYPES =============

// Interface para imagens de referência
export interface ProductImage {
  file: File;
  preview: string;
  base64: string;
}

// Product input
export interface ProductInput {
  nome: string;
  descricao_curta: string;
  preco_custo?: number;
  sku?: string;
}

// Step status for workflow steps
export interface StepStatus {
  status: "idle" | "running" | "success" | "error";
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  result: any | null;
  responseTime?: number;
}

// Image webhook status
export interface ImageWebhookStatus {
  status: "idle" | "sending" | "success" | "error" | "retrying";
  attemptedAt: string | null;
  httpStatus: number | null;
  responseText: string | null;
  errorMessage: string | null;
  payload: any | null;
  currentAttempt: number;
  maxAttempts: number;
  nextRetryAt: string | null;
}

// 8 Scene types for image generation
export const SCENE_TYPES = [
  { id: 'product_studio', label: '📷 Studio Profissional', description: 'Fundo branco, iluminação profissional' },
  { id: 'packaging', label: '📦 Embalagem Premium', description: 'Apresentação de embalagem luxuosa' },
  { id: 'mockup', label: '🏠 Mockup Realista', description: 'Produto em contexto de uso real' },
  { id: 'lifestyle', label: '👤 Lifestyle', description: 'Interação humana com o produto' },
  { id: 'ambient_1', label: '🌆 Ambiente Comercial', description: 'Cena em ambiente profissional/comercial' },
  { id: 'ambient_2', label: '🏡 Ambiente Residencial', description: 'Produto em ambiente doméstico' },
  { id: 'ambient_3', label: '✨ Ambiente Minimalista', description: 'Clean, minimalista e elegante' },
  { id: 'person_using', label: '👋 Pessoa Usando', description: 'Demonstração de uso do produto' },
] as const;

export type SceneType = typeof SCENE_TYPES[number]['id'];

// Parallel generation progress
export interface ParallelProgress {
  current: number;
  total: number;
  completed: number;
  failed: number;
}
