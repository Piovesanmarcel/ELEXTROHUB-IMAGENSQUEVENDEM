// ============================================================
// TABELA DE PREÇOS OFICIAIS DAS APIs (Janeiro 2026)
// Fonte: https://ai.google.dev/pricing | https://openai.com/api/pricing/
// ============================================================

// Taxa de conversão USD -> BRL (atualizar conforme necessário)
export const USD_TO_BRL = 6.10;

// Tokens estimados por imagem gerada (1024x1024)
export const TOKENS_PER_IMAGE = 1120;

// Preços por 1 MILHÃO de tokens (1M tokens)
export const API_PRICING = {
  gemini: {
    // Gemini 2.5 Flash - Modelo balanceado
    'gemini-2.5-flash': {
      input: 0.15,        // $0.15 per 1M tokens (≤200k) / $0.30 (>200k)
      output: 0.60,       // $0.60 per 1M tokens (≤200k) / $2.50 (>200k)
      imageOutput: null,  // Não gera imagens
    },
    // Gemini 2.5 Flash - Preview com imagens
    'gemini-2.5-flash-preview': {
      input: 0.15,
      output: 0.60,
      imageOutput: 0.039, // $0.039 por imagem (texto→imagem)
    },
    // Gemini 2.5 Flash Image - Geração de imagens
    'gemini-2.5-flash-image-preview': {
      input: 0.15,
      output: 0.60,
      imageOutput: 0.039, // $0.039 por imagem gerada
    },
    // Gemini 2.5 Pro - Modelo premium
    'gemini-2.5-pro': {
      input: 1.25,        // $1.25 per 1M tokens (≤200k) / $2.50 (>200k)
      output: 10.00,      // $10.00 per 1M tokens (≤200k) / $15.00 (>200k)
      imageOutput: null,
    },
    // Gemini 2.5 Pro Preview
    'gemini-2.5-pro-preview': {
      input: 1.25,
      output: 10.00,
      imageOutput: 0.039,
    },
    // Gemini 3 Pro Image Preview (via API direta)
    'gemini-3-pro-image-preview': {
      input: 2.00,         // ~$2.00 per 1M tokens (estimativa beta)
      output: 12.00,       // ~$12.00 per 1M tokens
      imageOutput: 0.134,  // $0.134 por imagem (tokens: 1120 * $120/1M)
    },
  },
  openai: {
    // GPT-4o Mini - Modelo rápido e econômico
    'gpt-4o-mini': {
      input: 0.15,         // $0.15 per 1M tokens
      output: 0.60,        // $0.60 per 1M tokens
      cached_input: 0.075, // $0.075 per 1M tokens (cached)
    },
    // GPT-4o - Modelo completo
    'gpt-4o': {
      input: 2.50,         // $2.50 per 1M tokens
      output: 10.00,       // $10.00 per 1M tokens
      cached_input: 1.25,
    },
    // GPT-4.1 - Modelo mais recente
    'gpt-4.1': {
      input: 2.00,
      output: 8.00,
    },
    // GPT-4.1 Mini
    'gpt-4.1-mini': {
      input: 0.40,
      output: 1.60,
    },
    // GPT-4.1 Nano
    'gpt-4.1-nano': {
      input: 0.10,
      output: 0.40,
    },
    // O3 - Reasoning
    'o3': {
      input: 10.00,
      output: 40.00,
    },
    // O3 Mini
    'o3-mini': {
      input: 1.10,
      output: 4.40,
    },
    // O4 Mini
    'o4-mini': {
      input: 1.10,
      output: 4.40,
    },
  },
  cloudinary: {
    // Cloudinary Transformations (Credit-based)
    // 1 Credit = 1000 Transformations = ~$0.44 USD (Plus Plan)
    // Custo por upscale: ~$0.00044 USD
    upscale: {
      input: 0,
      output: 0,
      imageOutput: 0.00044,
    }
  }
};

// Interface para resultado do cálculo
export interface CostResult {
  usd: number;
  brl: number;
  breakdown?: {
    inputCost: number;
    outputCost: number;
    imageCost: number;
  };
}

/**
 * Calcula o custo de uma chamada de API baseado no modelo e tokens
 * @param provider - 'gemini' ou 'openai'
 * @param model - Nome do modelo usado
 * @param inputTokens - Tokens de entrada (prompt)
 * @param outputTokens - Tokens de saída (resposta)
 * @param imagesGenerated - Número de imagens geradas (opcional)
 * @returns Custo em USD e BRL
 */
export function calculateCost(
  provider: 'gemini' | 'openai' | 'cloudinary',
  model: string,
  inputTokens: number,
  outputTokens: number,
  imagesGenerated: number = 0
): CostResult {
  // Encontrar preços do modelo
  const providerPricing = (API_PRICING as any)[provider];
  if (!providerPricing) {
    console.warn(`Provider desconhecido: ${provider}`);
    return { usd: 0, brl: 0 };
  }

  // Tentar encontrar modelo exato ou parcial
  let pricing = (providerPricing as any)[model];

  if (!pricing) {
    // Buscar por modelo parcial (ex: gemini-2.5-flash-image-preview-xxxx)
    const modelKey = Object.keys(providerPricing).find(key =>
      model.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(model.toLowerCase().split('-').slice(0, 4).join('-'))
    );

    if (modelKey) {
      pricing = (providerPricing as any)[modelKey];
    }
  }

  if (!pricing) {
    console.warn(`Modelo sem preço definido: ${provider}/${model}, usando defaults`);
    // Fallback para preços médios
    pricing = provider === 'gemini'
      ? { input: 0.15, output: 0.60, imageOutput: 0.039 }
      : provider === 'cloudinary'
        ? { input: 0, output: 0, imageOutput: 0.00044 }
        : { input: 0.15, output: 0.60 };
  }

  // Calcular custos por componente
  const inputCost = (inputTokens / 1_000_000) * (pricing.input || 0);
  const outputCost = (outputTokens / 1_000_000) * (pricing.output || 0);
  const imageCost = imagesGenerated * (pricing.imageOutput || 0);

  const totalUSD = inputCost + outputCost + imageCost;
  const totalBRL = totalUSD * USD_TO_BRL;

  return {
    usd: totalUSD,
    brl: totalBRL,
    breakdown: {
      inputCost,
      outputCost,
      imageCost,
    }
  };
}

/**
 * Obtém o preço de uma imagem para um modelo específico
 */
export function getImagePrice(model: string): number {
  if (model === 'upscale') return 0.00044;

  // Modelos Gemini com geração de imagens
  if (model.includes('gemini-3-pro-image') || model.includes('gemini-3.0-pro-image')) {
    return 0.134; // $0.134 por imagem
  }
  if (model.includes('gemini-2.5-flash-image') || model.includes('gemini-2.5-flash-preview')) {
    return 0.039; // $0.039 por imagem
  }
  if (model.includes('gemini-2.5-pro')) {
    return 0.039;
  }

  // Fallback
  return 0.039;
}

/**
 * Formata a tabela de preços para exibição
 */
export function getPricingTableData() {
  return {
    gemini: [
      { model: 'Gemini 2.5 Flash', input: '$0.15', output: '$0.60', image: '-' },
      { model: 'Gemini 2.5 Flash Image', input: '$0.15', output: '$0.60', image: '$0.039' },
      { model: 'Gemini 2.5 Pro', input: '$1.25', output: '$10.00', image: '-' },
      { model: 'Gemini 2.5 Pro Preview', input: '$1.25', output: '$10.00', image: '$0.039' },
      { model: 'Gemini 3 Pro Image', input: '$2.00', output: '$12.00', image: '$0.134' },
      { model: 'gemini-3-pro-image-preview', input: '$2.00', output: '$12.00', image: '$0.134' },
    ],
    openai: [
      { model: 'GPT-4o Mini', input: '$0.15', output: '$0.60', image: '-' },
      { model: 'GPT-4o', input: '$2.50', output: '$10.00', image: '-' },
      { model: 'GPT-4.1', input: '$2.00', output: '$8.00', image: '-' },
      { model: 'GPT-4.1 Mini', input: '$0.40', output: '$1.60', image: '-' },
    ],
    cloudinary: [
      { model: 'Upscale AI', input: '-', output: '-', image: '$0.00044' },
    ],
    usdToBrl: USD_TO_BRL,
    tokensPerImage: TOKENS_PER_IMAGE,
  };
}
