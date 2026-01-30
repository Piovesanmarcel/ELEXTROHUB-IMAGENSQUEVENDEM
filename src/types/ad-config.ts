export type ImageSourceType = 
  | 'runware' 
  | 'geminiWhite' 
  | 'geminiBackground' 
  | 'bfl' 
  | 'bflWhite' 
  | 'runway' 
  | 'deepai' 
  | 'carousel' 
  | 'marketingDescription' 
  | 'marketingFeatures' 
  | 'marketingBenefits'
  | 'showcase'
  | 'canvaTemplate';

export type MarketingType = 'all' | 'intro' | 'features' | 'benefits' | 'authority' | 'conversion' | 'cta' | 'faq' | 'urgency';
export type GeminiModel = 'all' | 'gemini-background' | 'gemini-white-background' | 'gemini-carousel' | 'gemini-nano-banana';

export interface ImageSource {
  id: string;
  source: ImageSourceType;
  quantity: number | 'all';
  order: number;
  // For canvaTemplate source: specific template selection
  selectedTemplateIds?: string[];
  useProductCategory?: boolean;
  // For marketing description types
  marketingType?: MarketingType;
  // For gemini background models
  geminiModel?: GeminiModel;
}

export const MARKETING_TYPE_LABELS: Record<MarketingType, string> = {
  all: '🎯 Todos os tipos',
  intro: '📝 Intro/Descrição',
  features: '📋 Características',
  benefits: '✨ Benefícios',
  authority: '🎯 Autoridade',
  conversion: '🔄 Conversão',
  cta: '📢 CTA',
  faq: '❓ FAQ',
  urgency: '⏰ Urgência',
};

export const GEMINI_MODEL_LABELS: Record<GeminiModel, string> = {
  all: '🎨 Todos os modelos',
  'gemini-background': '🎨 Background Padrão',
  'gemini-white-background': '⬜ Fundo Branco',
  'gemini-carousel': '🎠 Carousel',
  'gemini-nano-banana': '🍌 Nano Banana',
};

export interface TemplateSource {
  id: string;
  useProductCategory: boolean;
  specificCategory?: string;
  templateIds?: string[];
  quantity: number;
  order: number;
}

export interface AdConfig {
  id: number;
  name: string;
  enabled: boolean;
  imageSources: ImageSource[];
  templateSources: TemplateSource[];
}

export interface AdModelConfig {
  id: string;
  name: string;
  userId: string;
  isDefault: boolean;
  ads: AdConfig[];
  createdAt: string;
  updatedAt: string;
}

// Configuração padrão dos 28 anúncios baseada no código atual
export const DEFAULT_AD_CONFIGS: AdConfig[] = [
  {
    id: 1,
    name: '🚀 Runware - Todas as imagens',
    enabled: true,
    imageSources: [
      { id: '1-1', source: 'runware', quantity: 'all', order: 1 },
      { id: '1-2', source: 'carousel', quantity: 4, order: 2 },
      { id: '1-3', source: 'marketingDescription', quantity: 1, order: 3 },
      { id: '1-4', source: 'marketingFeatures', quantity: 1, order: 4 },
      { id: '1-5', source: 'marketingBenefits', quantity: 1, order: 5 },
    ],
    templateSources: []
  },
  {
    id: 2,
    name: '🤖 Gemini White',
    enabled: true,
    imageSources: [
      { id: '2-1', source: 'geminiWhite', quantity: 'all', order: 1 },
      { id: '2-2', source: 'carousel', quantity: 4, order: 2 },
      { id: '2-3', source: 'marketingDescription', quantity: 1, order: 3 },
      { id: '2-4', source: 'marketingFeatures', quantity: 1, order: 4 },
      { id: '2-5', source: 'marketingBenefits', quantity: 1, order: 5 },
    ],
    templateSources: []
  },
  {
    id: 3,
    name: '🎨 Gemini Background',
    enabled: true,
    imageSources: [
      { id: '3-1', source: 'geminiBackground', quantity: 'all', order: 1 },
      { id: '3-2', source: 'carousel', quantity: 4, order: 2 },
      { id: '3-3', source: 'marketingDescription', quantity: 1, order: 3 },
      { id: '3-4', source: 'marketingFeatures', quantity: 1, order: 4 },
      { id: '3-5', source: 'marketingBenefits', quantity: 1, order: 5 },
    ],
    templateSources: []
  },
  {
    id: 4,
    name: '⚡ BFL - Todas as imagens',
    enabled: true,
    imageSources: [
      { id: '4-1', source: 'bfl', quantity: 'all', order: 1 },
      { id: '4-2', source: 'carousel', quantity: 4, order: 2 },
      { id: '4-3', source: 'marketingDescription', quantity: 1, order: 3 },
      { id: '4-4', source: 'marketingFeatures', quantity: 1, order: 4 },
      { id: '4-5', source: 'marketingBenefits', quantity: 1, order: 5 },
    ],
    templateSources: []
  },
  {
    id: 5,
    name: '⬜ BFL White',
    enabled: true,
    imageSources: [
      { id: '5-1', source: 'bflWhite', quantity: 'all', order: 1 },
      { id: '5-2', source: 'carousel', quantity: 4, order: 2 },
      { id: '5-3', source: 'marketingDescription', quantity: 1, order: 3 },
      { id: '5-4', source: 'marketingFeatures', quantity: 1, order: 4 },
      { id: '5-5', source: 'marketingBenefits', quantity: 1, order: 5 },
    ],
    templateSources: []
  },
  {
    id: 6,
    name: '🎬 Runway',
    enabled: true,
    imageSources: [
      { id: '6-1', source: 'runway', quantity: 'all', order: 1 },
      { id: '6-2', source: 'carousel', quantity: 4, order: 2 },
      { id: '6-3', source: 'marketingDescription', quantity: 1, order: 3 },
      { id: '6-4', source: 'marketingFeatures', quantity: 1, order: 4 },
      { id: '6-5', source: 'marketingBenefits', quantity: 1, order: 5 },
    ],
    templateSources: []
  },
  {
    id: 7,
    name: '🧠 DeepAI',
    enabled: true,
    imageSources: [
      { id: '7-1', source: 'deepai', quantity: 'all', order: 1 },
      { id: '7-2', source: 'carousel', quantity: 4, order: 2 },
      { id: '7-3', source: 'marketingDescription', quantity: 1, order: 3 },
      { id: '7-4', source: 'marketingFeatures', quantity: 1, order: 4 },
      { id: '7-5', source: 'marketingBenefits', quantity: 1, order: 5 },
    ],
    templateSources: []
  },
  {
    id: 8,
    name: '🖼️ Showcase + Canva',
    enabled: true,
    imageSources: [
      { id: '8-1', source: 'showcase', quantity: 1, order: 1 },
      { id: '8-2', source: 'canvaTemplate', quantity: 2, order: 2 },
      { id: '8-3', source: 'carousel', quantity: 4, order: 3 },
      { id: '8-4', source: 'marketingDescription', quantity: 1, order: 4 },
      { id: '8-5', source: 'marketingFeatures', quantity: 1, order: 5 },
      { id: '8-6', source: 'marketingBenefits', quantity: 1, order: 6 },
    ],
    templateSources: []
  },
  {
    id: 9,
    name: '🚀 Mix Runware + Templates',
    enabled: true,
    imageSources: [
      { id: '9-1', source: 'runware', quantity: 3, order: 1 },
      { id: '9-2', source: 'carousel', quantity: 4, order: 3 },
      { id: '9-3', source: 'marketingDescription', quantity: 1, order: 4 },
    ],
    templateSources: [
      { id: '9-t1', useProductCategory: true, quantity: 2, order: 2 }
    ]
  },
  {
    id: 10,
    name: '🤖 Mix Gemini + Templates',
    enabled: true,
    imageSources: [
      { id: '10-1', source: 'geminiWhite', quantity: 2, order: 1 },
      { id: '10-2', source: 'geminiBackground', quantity: 2, order: 2 },
      { id: '10-3', source: 'carousel', quantity: 4, order: 4 },
    ],
    templateSources: [
      { id: '10-t1', useProductCategory: true, quantity: 2, order: 3 }
    ]
  },
  {
    id: 11,
    name: '⚡ Mix BFL + Templates',
    enabled: true,
    imageSources: [
      { id: '11-1', source: 'bfl', quantity: 3, order: 1 },
      { id: '11-2', source: 'bflWhite', quantity: 2, order: 2 },
      { id: '11-3', source: 'carousel', quantity: 4, order: 4 },
    ],
    templateSources: [
      { id: '11-t1', useProductCategory: true, quantity: 2, order: 3 }
    ]
  },
  {
    id: 12,
    name: '🎨 All IA Mix',
    enabled: true,
    imageSources: [
      { id: '12-1', source: 'runware', quantity: 2, order: 1 },
      { id: '12-2', source: 'geminiWhite', quantity: 2, order: 2 },
      { id: '12-3', source: 'bfl', quantity: 2, order: 3 },
      { id: '12-4', source: 'carousel', quantity: 4, order: 4 },
    ],
    templateSources: []
  },
  {
    id: 13,
    name: '📋 Templates Only',
    enabled: true,
    imageSources: [
      { id: '13-1', source: 'carousel', quantity: 4, order: 2 },
      { id: '13-2', source: 'marketingDescription', quantity: 1, order: 3 },
      { id: '13-3', source: 'marketingFeatures', quantity: 1, order: 4 },
    ],
    templateSources: [
      { id: '13-t1', useProductCategory: true, quantity: 6, order: 1 }
    ]
  },
  {
    id: 14,
    name: '🎯 Premium Mix 1',
    enabled: true,
    imageSources: [
      { id: '14-1', source: 'runware', quantity: 2, order: 1 },
      { id: '14-2', source: 'showcase', quantity: 1, order: 3 },
      { id: '14-3', source: 'canvaTemplate', quantity: 1, order: 4 },
      { id: '14-4', source: 'carousel', quantity: 4, order: 5 },
    ],
    templateSources: [
      { id: '14-t1', useProductCategory: true, quantity: 2, order: 2 }
    ]
  },
  {
    id: 15,
    name: '🎯 Premium Mix 2',
    enabled: true,
    imageSources: [
      { id: '15-1', source: 'geminiWhite', quantity: 2, order: 1 },
      { id: '15-2', source: 'geminiBackground', quantity: 1, order: 2 },
      { id: '15-3', source: 'showcase', quantity: 1, order: 4 },
      { id: '15-4', source: 'carousel', quantity: 4, order: 5 },
    ],
    templateSources: [
      { id: '15-t1', useProductCategory: true, quantity: 2, order: 3 }
    ]
  },
  {
    id: 16,
    name: '🎯 Premium Mix 3',
    enabled: true,
    imageSources: [
      { id: '16-1', source: 'bfl', quantity: 2, order: 1 },
      { id: '16-2', source: 'bflWhite', quantity: 1, order: 2 },
      { id: '16-3', source: 'canvaTemplate', quantity: 2, order: 4 },
      { id: '16-4', source: 'carousel', quantity: 4, order: 5 },
    ],
    templateSources: [
      { id: '16-t1', useProductCategory: true, quantity: 2, order: 3 }
    ]
  },
  {
    id: 17,
    name: '🌟 Ultimate Mix 1',
    enabled: true,
    imageSources: [
      { id: '17-1', source: 'runware', quantity: 1, order: 1 },
      { id: '17-2', source: 'geminiWhite', quantity: 1, order: 2 },
      { id: '17-3', source: 'bfl', quantity: 1, order: 3 },
      { id: '17-4', source: 'showcase', quantity: 1, order: 5 },
      { id: '17-5', source: 'carousel', quantity: 4, order: 6 },
    ],
    templateSources: [
      { id: '17-t1', useProductCategory: true, quantity: 3, order: 4 }
    ]
  },
  {
    id: 18,
    name: '🌟 Ultimate Mix 2',
    enabled: true,
    imageSources: [
      { id: '18-1', source: 'runway', quantity: 2, order: 1 },
      { id: '18-2', source: 'deepai', quantity: 1, order: 2 },
      { id: '18-3', source: 'canvaTemplate', quantity: 2, order: 4 },
      { id: '18-4', source: 'carousel', quantity: 4, order: 5 },
    ],
    templateSources: [
      { id: '18-t1', useProductCategory: true, quantity: 2, order: 3 }
    ]
  },
  {
    id: 19,
    name: '📸 Kit Completo 1',
    enabled: true,
    imageSources: [
      { id: '19-1', source: 'runware', quantity: 3, order: 1 },
      { id: '19-2', source: 'showcase', quantity: 1, order: 2 },
      { id: '19-3', source: 'canvaTemplate', quantity: 1, order: 3 },
      { id: '19-4', source: 'carousel', quantity: 4, order: 4 },
      { id: '19-5', source: 'marketingDescription', quantity: 1, order: 5 },
    ],
    templateSources: []
  },
  {
    id: 20,
    name: '📸 Kit Completo 2',
    enabled: true,
    imageSources: [
      { id: '20-1', source: 'geminiWhite', quantity: 2, order: 1 },
      { id: '20-2', source: 'geminiBackground', quantity: 2, order: 2 },
      { id: '20-3', source: 'showcase', quantity: 1, order: 3 },
      { id: '20-4', source: 'carousel', quantity: 4, order: 4 },
      { id: '20-5', source: 'marketingFeatures', quantity: 1, order: 5 },
    ],
    templateSources: []
  },
  {
    id: 21,
    name: '🔥 Hot Mix 1',
    enabled: true,
    imageSources: [
      { id: '21-1', source: 'bfl', quantity: 2, order: 1 },
      { id: '21-2', source: 'runway', quantity: 1, order: 2 },
      { id: '21-3', source: 'carousel', quantity: 4, order: 4 },
      { id: '21-4', source: 'marketingBenefits', quantity: 1, order: 5 },
    ],
    templateSources: [
      { id: '21-t1', useProductCategory: true, quantity: 2, order: 3 }
    ]
  },
  {
    id: 22,
    name: '🔥 Hot Mix 2',
    enabled: true,
    imageSources: [
      { id: '22-1', source: 'bflWhite', quantity: 2, order: 1 },
      { id: '22-2', source: 'deepai', quantity: 2, order: 2 },
      { id: '22-3', source: 'carousel', quantity: 4, order: 4 },
    ],
    templateSources: [
      { id: '22-t1', useProductCategory: true, quantity: 2, order: 3 }
    ]
  },
  {
    id: 23,
    name: '💎 Exclusive 1',
    enabled: true,
    imageSources: [
      { id: '23-1', source: 'runware', quantity: 2, order: 1 },
      { id: '23-2', source: 'bfl', quantity: 2, order: 2 },
      { id: '23-3', source: 'canvaTemplate', quantity: 2, order: 4 },
      { id: '23-4', source: 'carousel', quantity: 4, order: 5 },
    ],
    templateSources: [
      { id: '23-t1', useProductCategory: true, quantity: 1, order: 3 }
    ]
  },
  {
    id: 24,
    name: '💎 Exclusive 2',
    enabled: true,
    imageSources: [
      { id: '24-1', source: 'geminiWhite', quantity: 2, order: 1 },
      { id: '24-2', source: 'bflWhite', quantity: 2, order: 2 },
      { id: '24-3', source: 'showcase', quantity: 1, order: 4 },
      { id: '24-4', source: 'carousel', quantity: 4, order: 5 },
    ],
    templateSources: [
      { id: '24-t1', useProductCategory: true, quantity: 2, order: 3 }
    ]
  },
  {
    id: 25,
    name: '🎪 Variety Pack 1',
    enabled: true,
    imageSources: [
      { id: '25-1', source: 'runware', quantity: 1, order: 1 },
      { id: '25-2', source: 'geminiBackground', quantity: 1, order: 2 },
      { id: '25-3', source: 'bfl', quantity: 1, order: 3 },
      { id: '25-4', source: 'runway', quantity: 1, order: 4 },
      { id: '25-5', source: 'carousel', quantity: 4, order: 6 },
    ],
    templateSources: [
      { id: '25-t1', useProductCategory: true, quantity: 2, order: 5 }
    ]
  },
  {
    id: 26,
    name: '🎪 Variety Pack 2',
    enabled: true,
    imageSources: [
      { id: '26-1', source: 'geminiWhite', quantity: 1, order: 1 },
      { id: '26-2', source: 'bflWhite', quantity: 1, order: 2 },
      { id: '26-3', source: 'deepai', quantity: 1, order: 3 },
      { id: '26-4', source: 'showcase', quantity: 1, order: 5 },
      { id: '26-5', source: 'carousel', quantity: 4, order: 6 },
    ],
    templateSources: [
      { id: '26-t1', useProductCategory: true, quantity: 2, order: 4 }
    ]
  },
  {
    id: 27,
    name: '🏆 Champion Mix',
    enabled: true,
    imageSources: [
      { id: '27-1', source: 'runware', quantity: 2, order: 1 },
      { id: '27-2', source: 'geminiWhite', quantity: 1, order: 2 },
      { id: '27-3', source: 'bfl', quantity: 1, order: 3 },
      { id: '27-4', source: 'showcase', quantity: 1, order: 5 },
      { id: '27-5', source: 'canvaTemplate', quantity: 1, order: 6 },
      { id: '27-6', source: 'carousel', quantity: 4, order: 7 },
    ],
    templateSources: [
      { id: '27-t1', useProductCategory: true, quantity: 2, order: 4 }
    ]
  },
  {
    id: 28,
    name: '🏆 Supreme Mix',
    enabled: true,
    imageSources: [
      { id: '28-1', source: 'geminiBackground', quantity: 2, order: 1 },
      { id: '28-2', source: 'bflWhite', quantity: 1, order: 2 },
      { id: '28-3', source: 'runway', quantity: 1, order: 3 },
      { id: '28-4', source: 'canvaTemplate', quantity: 2, order: 5 },
      { id: '28-5', source: 'carousel', quantity: 4, order: 6 },
      { id: '28-6', source: 'marketingDescription', quantity: 1, order: 7 },
    ],
    templateSources: [
      { id: '28-t1', useProductCategory: true, quantity: 2, order: 4 }
    ]
  },
];

export const IMAGE_SOURCE_LABELS: Record<ImageSourceType, string> = {
  runware: '🚀 Runware',
  geminiWhite: '🤖 Gemini White',
  geminiBackground: '🎨 Gemini Background',
  bfl: '⚡ BFL',
  bflWhite: '⬜ BFL White',
  runway: '🎬 Runway',
  deepai: '🧠 DeepAI',
  carousel: '🎠 Carousel',
  marketingDescription: '📝 Marketing Descrição',
  marketingFeatures: '✨ Marketing Features',
  marketingBenefits: '💎 Marketing Benefícios',
  showcase: '🖼️ Showcase',
  canvaTemplate: '🎨 Canva Template',
};
