export const stylePresets = {
  none: 'Nenhum',
  'photographic': 'Fotográfico',
  'digital-art': 'Arte Digital',
  'analog-film': 'Filme Analógico',
  'cinematic': 'Cinematográfico',
  '3d-model': 'Modelo 3D',
  'enhance': 'Aprimorado',
  'anime': 'Anime',
  'fantasy-art': 'Arte Fantasia',
  'line-art': 'Arte em Linha',
  'low-poly': 'Low Poly',
  'neon-punk': 'Neon Punk',
  'origami': 'Origami',
  'pixel-art': 'Pixel Art',
};

export const productPromptTemplates = {
  ecommerce: {
    name: 'E-commerce Básico',
    prompt: 'IMPORTANT: KEEP THE EXACT SAME PRODUCT from the reference image, DO NOT change its appearance, colors, shape or design. Professional product photography on pure white background, studio lighting, commercial quality, centered composition, sharp focus, high resolution, clean and minimal. The product must remain identical to the reference.',
    negative: 'different product, altered product, modified design, changed colors, deformed product, wrong shape, shadows, gradient background, people, hands, text, watermark, low quality, blurry, distorted'
  },

  lifestyle: {
    name: 'Lifestyle/Contexto',
    prompt: 'IMPORTANT: PRESERVE THE EXACT PRODUCT from the reference image without any modifications. Product in modern lifestyle setting, natural daylight, soft shadows, minimalist aesthetic, contemporary interior, professional photography, magazine quality, elegant composition. Keep original product appearance exactly as shown.',
    negative: 'different product, changed product design, altered colors, modified shape, cluttered, busy background, artificial lighting, low quality, distorted, blurry, deformed'
  },

  premium: {
    name: 'Premium/Luxo',
    prompt: 'CRITICAL: MAINTAIN THE IDENTICAL PRODUCT from reference, preserve all original features, colors and design. Luxury product photography, elegant dark background, dramatic lighting, premium quality, sophisticated composition, high-end commercial style, ultra detailed, professional studio setup. Product must look exactly like the reference.',
    negative: 'different product, altered appearance, wrong colors, modified design, deformed, cheap looking, bright colors, busy background, low quality, amateur, cluttered'
  },

  creative: {
    name: 'Criativo/Artístico',
    prompt: 'ESSENTIAL: USE THE EXACT SAME PRODUCT from reference image, do not alter its design or appearance. Creative product photography, artistic composition, unique lighting setup, interesting perspective, professional quality, vibrant colors, modern aesthetic, editorial style. Product details must remain unchanged.',
    negative: 'different product, modified product, changed design, wrong colors, deformed shape, boring, generic, low quality, blurry, overexposed, underexposed'
  },

  minimal: {
    name: 'Minimalista',
    prompt: 'MANDATORY: KEEP PRODUCT IDENTICAL to reference image, preserve exact appearance and features. Minimalist product photography, clean composition, neutral background, soft natural lighting, simple and elegant, professional quality, scandinavian aesthetic, zen-like atmosphere. Original product must be recognizable.',
    negative: 'different product, altered product, changed colors, modified design, cluttered, busy, colorful background, dramatic, low quality, complex background, deformed'
  },

  outdoor: {
    name: 'Ambiente Externo',
    prompt: 'REQUIRED: PRESERVE EXACT PRODUCT from reference without modifications. Product in natural outdoor setting, golden hour lighting, beautiful landscape background, professional photography, natural environment, soft bokeh, cinematic quality. Keep product appearance exactly as reference shows.',
    negative: 'different product, changed product, altered design, wrong colors, deformed, artificial, studio, indoor, low quality, harsh lighting, overcast, modified shape'
  }
};

export const negativePromptDefaults = [
  'low quality',
  'blurry',
  'distorted',
  'deformed',
  'watermark',
  'text',
  'signature',
  'amateur',
  'pixelated',
  'overexposed',
  'underexposed'
].join(', ');

export function buildPrompt(
  productType: string,
  template: keyof typeof productPromptTemplates,
  customAdditions?: string,
  unifiedData?: { idealFor?: string[]; idealEnvironments?: string[]; mainKeywords?: string[] }
): string {
  const basePrompt = productPromptTemplates[template].prompt;
  const productDescription = productType ? `${productType}, ` : '';
  
  // Adicionar contexto do Comando Unificado se disponível
  let contextualAdditions = customAdditions || '';
  
  if (unifiedData) {
    if (unifiedData.idealFor && unifiedData.idealFor.length > 0) {
      const idealForContext = unifiedData.idealFor[0]; // Usar o primeiro cenário
      contextualAdditions += `, ideal for ${idealForContext}`;
    }
    
    if (unifiedData.idealEnvironments && unifiedData.idealEnvironments.length > 0) {
      const envContext = unifiedData.idealEnvironments[0];
      contextualAdditions += `, in ${envContext} setting`;
    }
    
    if (unifiedData.mainKeywords && unifiedData.mainKeywords.length > 0) {
      const keyword = unifiedData.mainKeywords[0];
      contextualAdditions += `, emphasizing ${keyword}`;
    }
  }
  
  const additions = contextualAdditions ? `, ${contextualAdditions}` : '';
  return `${productDescription}${basePrompt}${additions}`;
}

export function buildNegativePrompt(
  template: keyof typeof productPromptTemplates,
  customNegative?: string
): string {
  const baseNegative = productPromptTemplates[template].negative;
  const additions = customNegative ? `, ${customNegative}` : '';

  return `${baseNegative}${additions}`;
}
