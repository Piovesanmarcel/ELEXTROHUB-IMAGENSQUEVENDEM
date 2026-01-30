
export interface AIResponse {
  improvedText: string;
  keywords: string[];
  reasoning?: string;
  improvements?: string[];
  longTailKeywords?: string[];
  seoTitles?: string[];
  metaDescriptions?: string[];
  faqs?: Array<{ question: string; answer: string }>;
  hooks?: string[];
  stories?: string[];
  objections?: string[];
  ctas?: string[];
  titles?: string[];
  descriptions?: string[];
}

export interface UnifiedAIResponse {
  topicos_conversao: AIResponse | null;
  palavras_chave_seo: AIResponse | null;
  perguntas_respostas: AIResponse | null;
  kits_criativos: AIResponse | null;
  cauda_longa?: AIResponse | null;
  copywriting?: AIResponse | null;
  errors?: {
    gemini: string | null;
    openai: string | null;
  };
  usedAPI?: string;
  apiInfo?: string;
}

export type UnifiedResults = UnifiedAIResponse;

export interface CompactAIDescriptionEnhancerProps {
  productName: string;
  shortDescription: string;
  onUpdateDescription: (type: 'short' | 'long' | 'name', value: string) => void;
  productId?: string;
  productSku?: string;
  isAutomationRunning?: boolean;
  automationStep?: string | null;
  copywritingData?: { content: string; timestamp: number } | null;
  externalUnifiedData?: UnifiedAIResponse | null;
  // N8N Webhooks
  onExecuteWebhookComando?: () => void;
  onExecuteWebhookCopywriting?: () => void;
  isLoadingComando?: boolean;
  isLoadingCopywriting?: boolean;
  webhookComandoConfigured?: boolean;
  webhookCopywritingConfigured?: boolean;
}
