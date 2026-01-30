
export interface RequestBody {
  command: string;
  originalText?: string;
  productName: string;
  shortDescription: string;
  longDescription?: string;
  unifiedGeneration?: boolean;
  forceAPI: 'gemini' | 'openai';
  systemPrompt?: string;
  userPrompt?: string;
  imageBase64?: string;
  image_base64?: string;
}

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
  geminiSuccess?: boolean;
  openaiSuccess?: boolean;
  errors?: {
    gemini: string | null;
    openai: string | null;
  };
  usedAPI?: string;
  apiInfo?: string;
}
