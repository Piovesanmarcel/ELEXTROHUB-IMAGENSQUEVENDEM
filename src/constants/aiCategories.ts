export const AI_CATEGORIES = {
  'ia-avancada': {
    name: 'IA Avançada',
    icon: '🤖',
    description: 'Inteligência Artificial Avançada para geração e processamento',
    color: 'bg-blue-50 border-blue-200 text-blue-900'
  },
  'geradores-especializados': {
    name: 'Geradores Especializados', 
    icon: '🎨',
    description: 'Geradores especializados para casos específicos',
    color: 'bg-purple-50 border-purple-200 text-purple-900'
  },
  'marketing-gatilhos': {
    name: '🎯 Marketing Gatilhos',
    icon: '🎯',
    description: 'Imagens otimizadas com gatilhos mentais de marketing',
    color: 'bg-amber-50 border-amber-200 text-amber-900'
  },
  'sistema-automacao-ia': {
    name: 'Sistema de Automação IA',
    icon: '📱',
    description: 'Automação inteligente para marketing e vendas',
    color: 'bg-green-50 border-green-200 text-green-900'
  }
} as const;

export const AI_SOURCE_MAPPING = {
  // IA Avançada
  'runware': { 
    category: 'ia-avancada' as const,
    name: 'Runware Pro',
    icon: '⚡',
    color: 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-900 border-blue-200',
    badge: 'bg-blue-500 text-white'
  },
  'tongyi-wanxiang': { 
    category: 'ia-avancada' as const,
    name: 'Tongyi Wanxiang',
    icon: '🌟', 
    color: 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-900 border-orange-200',
    badge: 'bg-orange-500 text-white'
  },
  'tongyi-wanxiang-hosted': { 
    category: 'ia-avancada' as const,
    name: 'Tongyi Wanxiang (Hospedado)',
    icon: '☁️',
    color: 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-900 border-orange-300',
    badge: 'bg-orange-600 text-white'
  },
  'runware-upscale': {
    category: 'ia-avancada' as const,
    name: 'Upscale 4x (Runware)',
    icon: '🔍',
    color: 'bg-gradient-to-r from-cyan-50 to-cyan-100 text-cyan-900 border-cyan-200',
    badge: 'bg-cyan-500 text-white'
  },

  // Geradores Especializados
  'gemini-background': { 
    category: 'geradores-especializados' as const,
    name: 'Gemini Background AI',
    icon: '🎨',
    color: 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-900 border-yellow-200',
    badge: 'bg-yellow-500 text-white'
  },
  'gemini-white-background': { 
    category: 'geradores-especializados' as const,
    name: 'Gemini White BG',
    icon: '⚪',
    color: 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 border-gray-200',
    badge: 'bg-gray-500 text-white'
  },
  'bfl': { 
    category: 'geradores-especializados' as const,
    name: 'BFL.ai Generator',
    icon: '🚀',
    color: 'bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-900 border-indigo-200',
    badge: 'bg-indigo-500 text-white'
  },
  'bfl-white-bg': { 
    category: 'geradores-especializados' as const,
    name: 'BFL.ai White BG',
    icon: '🤍',
    color: 'bg-gradient-to-r from-slate-50 to-slate-100 text-slate-900 border-slate-200',
    badge: 'bg-slate-500 text-white'
  },
  'runway': { 
    category: 'geradores-especializados' as const,
    name: 'Runway AI Studio',
    icon: '🎬',
    color: 'bg-gradient-to-r from-red-50 to-red-100 text-red-900 border-red-200',
    badge: 'bg-red-500 text-white'
  },

  // Versões Hospedadas - IA Avançada
  'runware-hosted': { 
    category: 'ia-avancada' as const,
    name: 'Runware (Hospedado)',
    icon: '☁️',
    color: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-900 border-blue-300',
    badge: 'bg-blue-600 text-white'
  },

  // Versões Hospedadas - Geradores Especializados
  'gemini-background-hosted': { 
    category: 'geradores-especializados' as const,
    name: 'Gemini Background (Hospedado)',
    icon: '☁️',
    color: 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-900 border-yellow-300',
    badge: 'bg-yellow-600 text-white'
  },
  'gemini-white-background-hosted': { 
    category: 'geradores-especializados' as const,
    name: 'Gemini White BG (Hospedado)',
    icon: '☁️',
    color: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 border-gray-300',
    badge: 'bg-gray-600 text-white'
  },
  'bfl-hosted': { 
    category: 'geradores-especializados' as const,
    name: 'BFL.ai (Hospedado)',
    icon: '☁️',
    color: 'bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-900 border-indigo-300',
    badge: 'bg-indigo-600 text-white'
  },
  'bfl-white-bg-hosted': { 
    category: 'geradores-especializados' as const,
    name: 'BFL.ai White BG (Hospedado)',
    icon: '☁️',
    color: 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-900 border-slate-300',
    badge: 'bg-slate-600 text-white'
  },
  'runway-hosted': { 
    category: 'geradores-especializados' as const,
    name: 'Runway AI (Hospedado)',
    icon: '☁️',
    color: 'bg-gradient-to-r from-red-100 to-red-200 text-red-900 border-red-300',
    badge: 'bg-red-600 text-white'
  },
  'stability': { 
    category: 'geradores-especializados' as const,
    name: 'Stability AI',
    icon: '🎨',
    color: 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-900 border-purple-200',
    badge: 'bg-purple-500 text-white'
  },
  'stability-hosted': { 
    category: 'geradores-especializados' as const,
    name: 'Stability AI (Hospedado)',
    icon: '☁️',
    color: 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-900 border-purple-300',
    badge: 'bg-purple-600 text-white'
  },

  // Sistema de Automação IA
  'cloudinary-kit': { 
    category: 'sistema-automacao-ia' as const,
    name: 'Kit Criativos',
    icon: '🎨',
    color: 'bg-gradient-to-r from-green-50 to-green-100 text-green-900 border-green-200',
    badge: 'bg-green-500 text-white'
  },
  'cta-processed': { 
    category: 'sistema-automacao-ia' as const,
    name: 'CTA Automático',
    icon: '📢',
    color: 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-900 border-emerald-200',
    badge: 'bg-emerald-500 text-white'
  },
  'faq-processed': { 
    category: 'sistema-automacao-ia' as const,
    name: 'FAQ Automático',
    icon: '❓',
    color: 'bg-gradient-to-r from-teal-50 to-teal-100 text-teal-900 border-teal-200',
    badge: 'bg-teal-500 text-white'
  },
  // Marketing Gatilhos por IA de Origem - Ícones específicos por IA
  'marketing-gatilhos-gemini': { 
    category: 'marketing-gatilhos' as const,
    name: 'Gatilhos - Gemini AI',
    icon: '💎',
    color: 'bg-gradient-to-r from-lime-50 to-lime-100 text-lime-900 border-lime-200',
    badge: 'bg-lime-500 text-white'
  },
  'marketing-gatilhos-runware': { 
    category: 'marketing-gatilhos' as const,
    name: 'Gatilhos - Runware',
    icon: '⚡',
    color: 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-900 border-blue-200',
    badge: 'bg-blue-500 text-white'
  },
  'marketing-gatilhos-bfl': { 
    category: 'marketing-gatilhos' as const,
    name: 'Gatilhos - BFL.ai',
    icon: '🚀',
    color: 'bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-900 border-indigo-200',
    badge: 'bg-indigo-500 text-white'
  },
  'marketing-gatilhos-outros': { 
    category: 'marketing-gatilhos' as const,
    name: 'Gatilhos - Outras IAs',
    icon: '🎯',
    color: 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 border-gray-200',
    badge: 'bg-gray-500 text-white'
  },

  // Versões Hospedadas - Marketing Gatilhos
  'marketing-gatilhos-gemini-hosted': { 
    category: 'marketing-gatilhos' as const,
    name: 'Gatilhos Gemini (Hospedado)',
    icon: '☁️',
    color: 'bg-gradient-to-r from-lime-100 to-lime-200 text-lime-900 border-lime-300',
    badge: 'bg-lime-600 text-white'
  },
  'marketing-gatilhos-runware-hosted': { 
    category: 'marketing-gatilhos' as const,
    name: 'Gatilhos Runware (Hospedado)',
    icon: '☁️',
    color: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-900 border-blue-300',
    badge: 'bg-blue-600 text-white'
  },
  'marketing-gatilhos-bfl-hosted': { 
    category: 'marketing-gatilhos' as const,
    name: 'Gatilhos BFL (Hospedado)',
    icon: '☁️',
    color: 'bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-900 border-indigo-300',
    badge: 'bg-indigo-600 text-white'
  },

  // Versões Hospedadas - Sistema de Automação
  'cloudinary-kit-hosted': { 
    category: 'sistema-automacao-ia' as const,
    name: 'Kit Criativos (Hospedado)',
    icon: '☁️',
    color: 'bg-gradient-to-r from-green-100 to-green-200 text-green-900 border-green-300',
    badge: 'bg-green-600 text-white'
  },

  // Processados - Sistema de Automação IA
  'authority-processed': { 
    category: 'sistema-automacao-ia' as const,
    name: 'Autoridade - Processado',
    icon: '👑',
    color: 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-900 border-amber-200',
    badge: 'bg-amber-500 text-white'
  },
  'benefits-processed': { 
    category: 'sistema-automacao-ia' as const,
    name: 'Benefícios - Processado',
    icon: '💎',
    color: 'bg-gradient-to-r from-cyan-50 to-cyan-100 text-cyan-900 border-cyan-200',
    badge: 'bg-cyan-500 text-white'
  },
  'conversion-processed': { 
    category: 'sistema-automacao-ia' as const,
    name: 'Conversão - Processado',
    icon: '🚀',
    color: 'bg-gradient-to-r from-rose-50 to-rose-100 text-rose-900 border-rose-200',
    badge: 'bg-rose-500 text-white'
  },
  'feature-processed': { 
    category: 'sistema-automacao-ia' as const,
    name: 'Funcionalidades - Processado',
    icon: '⚡',
    color: 'bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-900 border-indigo-200',
    badge: 'bg-indigo-500 text-white'
  },
  'objection-processed': { 
    category: 'sistema-automacao-ia' as const,
    name: 'Objeções - Processado',
    icon: '🛡️',
    color: 'bg-gradient-to-r from-slate-50 to-slate-100 text-slate-900 border-slate-200',
    badge: 'bg-slate-500 text-white'
  },
  'scarcity-processed': { 
    category: 'sistema-automacao-ia' as const,
    name: 'Escassez - Processado',
    icon: '⏰',
    color: 'bg-gradient-to-r from-red-50 to-red-100 text-red-900 border-red-200',
    badge: 'bg-red-500 text-white'
  },
  'social-proof-processed': { 
    category: 'sistema-automacao-ia' as const,
    name: 'Prova Social - Processado',
    icon: '👥',
    color: 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-900 border-blue-200',
    badge: 'bg-blue-500 text-white'
  },
  'urgency-processed': { 
    category: 'sistema-automacao-ia' as const,
    name: 'Urgência - Processado',
    icon: '🔥',
    color: 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-900 border-orange-200',
    badge: 'bg-orange-500 text-white'
  },

  // Versões Hospedadas - Sistema de Automação IA (Processados)
  'authority-processed-hosted': { 
    category: 'sistema-automacao-ia' as const,
    name: 'Autoridade - Hospedado',
    icon: '☁️',
    color: 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-900 border-amber-300',
    badge: 'bg-amber-600 text-white'
  },
  'benefits-processed-hosted': { 
    category: 'sistema-automacao-ia' as const,
    name: 'Benefícios - Hospedado',
    icon: '☁️',
    color: 'bg-gradient-to-r from-cyan-100 to-cyan-200 text-cyan-900 border-cyan-300',
    badge: 'bg-cyan-600 text-white'
  },
  'conversion-processed-hosted': { 
    category: 'sistema-automacao-ia' as const,
    name: 'Conversão - Hospedado',
    icon: '☁️',
    color: 'bg-gradient-to-r from-rose-100 to-rose-200 text-rose-900 border-rose-300',
    badge: 'bg-rose-600 text-white'
  },
  'feature-processed-hosted': { 
    category: 'sistema-automacao-ia' as const,
    name: 'Funcionalidades - Hospedado',
    icon: '☁️',
    color: 'bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-900 border-indigo-300',
    badge: 'bg-indigo-600 text-white'
  },
  'objection-processed-hosted': { 
    category: 'sistema-automacao-ia' as const,
    name: 'Objeções - Hospedado',
    icon: '☁️',
    color: 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-900 border-slate-300',
    badge: 'bg-slate-600 text-white'
  },
  'scarcity-processed-hosted': { 
    category: 'sistema-automacao-ia' as const,
    name: 'Escassez - Hospedado',
    icon: '☁️',
    color: 'bg-gradient-to-r from-red-100 to-red-200 text-red-900 border-red-300',
    badge: 'bg-red-600 text-white'
  },
  'social-proof-processed-hosted': { 
    category: 'sistema-automacao-ia' as const,
    name: 'Prova Social - Hospedado',
    icon: '☁️',
    color: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-900 border-blue-300',
    badge: 'bg-blue-600 text-white'
  },
  'urgency-processed-hosted': { 
    category: 'sistema-automacao-ia' as const,
    name: 'Urgência - Hospedado',
    icon: '☁️',
    color: 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-900 border-orange-300',
    badge: 'bg-orange-600 text-white'
  },

  // Processamento e Melhoria
  'deepai': { 
    category: 'ia-avancada' as const,
    name: 'IA Avançada - DeepAI',
    icon: '🧠',
    color: 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-900 border-purple-200',
    badge: 'bg-purple-500 text-white'
  },
  'background-removal': { 
    category: 'ia-avancada' as const,
    name: 'IA Avançada - Background Removal',
    icon: '🎭',
    color: 'bg-gradient-to-r from-pink-50 to-pink-100 text-pink-900 border-pink-200',
    badge: 'bg-pink-500 text-white'
  },
  'image-enhancement': { 
    category: 'ia-avancada' as const,
    name: 'IA Avançada - Image Enhancement',
    icon: '✨',
    color: 'bg-gradient-to-r from-violet-50 to-violet-100 text-violet-900 border-violet-200',
    badge: 'bg-violet-500 text-white'
  },

  // Importação e Organização
  'imported-images': { 
    category: 'sistema-automacao-ia' as const,
    name: 'Imagens Importadas',
    icon: '📥',
    color: 'bg-gradient-to-r from-teal-50 to-teal-100 text-teal-900 border-teal-200',
    badge: 'bg-teal-500 text-white'
  },
  'manual-upload': { 
    category: 'sistema-automacao-ia' as const,
    name: 'Upload Manual',
    icon: '📁',
    color: 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 border-gray-200',
    badge: 'bg-gray-500 text-white'
  }
} as const;

export const IMAGE_TYPE_CONFIGS = {
  'original': {
    name: 'Original',
    badge: 'bg-blue-100 text-blue-800',
    priority: 1
  },
  'upscaled-4x': {
    name: 'Upscaled 4x',
    badge: 'bg-purple-100 text-purple-800', 
    priority: 2
  },
  'upscaled-2x': {
    name: 'Upscaled 2x',
    badge: 'bg-purple-100 text-purple-800',
    priority: 3
  },
  'original-fallback': {
    name: 'Original (Fallback)',
    badge: 'bg-orange-100 text-orange-800',
    priority: 4
  },
  'marketing-ready': {
    name: 'Marketing Ready',
    badge: 'bg-green-100 text-green-800',
    priority: 5
  },
  'background-removed': {
    name: 'Background Removed',
    badge: 'bg-pink-100 text-pink-800',
    priority: 6
  },
  'enhanced': {
    name: 'Enhanced',
    badge: 'bg-violet-100 text-violet-800',
    priority: 7
  }
} as const;

// Mapeamento de IAs específicas para Sistema de Automação IA
export const AUTOMATION_AI_SOURCES = {
  'gemini': {
    name: 'Gemini AI',
    icon: '🎨',
    color: 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-900 border-yellow-200',
    badge: 'bg-yellow-500 text-white'
  },
  'runware': {
    name: 'Runware',
    icon: '⚡',
    color: 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-900 border-blue-200',
    badge: 'bg-blue-500 text-white'
  },
  'bfl': {
    name: 'BFL.ai',
    icon: '🚀',
    color: 'bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-900 border-indigo-200',
    badge: 'bg-indigo-500 text-white'
  },
  'tongyi': {
    name: 'Tongyi Wanxiang',
    icon: '🌟',
    color: 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-900 border-orange-200',
    badge: 'bg-orange-500 text-white'
  },
  'outros': {
    name: 'Outras IAs',
    icon: '🎯',
    color: 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 border-gray-200',
    badge: 'bg-gray-500 text-white'
  }
} as const;

export type AICategory = keyof typeof AI_CATEGORIES;
export type AISource = keyof typeof AI_SOURCE_MAPPING;
export type ImageType = keyof typeof IMAGE_TYPE_CONFIGS;
export type AutomationAISource = keyof typeof AUTOMATION_AI_SOURCES;