// Configuração unificada para galeria de imagens hospedadas
// Define a ordem de exibição e aparência dos blocos hospedados

export const HOSTED_DISPLAY_ORDER = [
  'runware-hosted',
  'tongyi-wanxiang-hosted',
  'showcase-hosted',
  'runway-hosted',
  'gemini-carousel-hosted',
  'gemini-white-background-hosted',
  'gemini-background-hosted',
  'bfl-white-bg-hosted',
  'bfl-hosted',
  'cloudinary-kit-hosted',
  'stability-hosted',
  'deepai-enhancement',
  // ✅ Sources adicionais que estavam faltando:
  'gemini-batch',
  'runware-upscale',
  'manual-upload',
  'deepai-hosted',
  // Templates de marketing:
  'marketing-templates-hosted',
  'marketing-gatilhos-gemini-hosted',
  'marketing-gatilhos-openai-hosted',
  'marketing-gatilhos-runware-hosted',
  'marketing-gatilhos-bfl-hosted',
  'marketing-gatilhos-replicate-hosted',
  // n8n Workflow:
  'n8n-hosted'
];

export const HOSTED_SOURCE_CONFIGS: Record<string, { name: string; icon: string; color: string; description: string }> = {
  'runware-hosted': {
    name: '☁️ Hospedagem - IA Avançada Runware',
    icon: '🚀',
    color: 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-900 border-blue-200',
    description: 'Imagens geradas pelo Runware hospedadas'
  },
  'tongyi-wanxiang-hosted': {
    name: '☁️ Hospedagem - Tongyi Wanxiang (Qwen)',
    icon: '🌟',
    color: 'bg-gradient-to-r from-orange-50 to-amber-50 text-orange-900 border-orange-200',
    description: 'Imagens geradas pelo Tongyi Wanxiang (Qwen) hospedadas'
  },
  'showcase-hosted': {
    name: '☁️ Hospedagem - Showcases de Produto',
    icon: '🖼️',
    color: 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-900 border-emerald-200',
    description: 'Showcases gerados e hospedados'
  },
  // ✅ Novo: chave correta para Runway
  'runway-hosted': {
    name: '☁️ Hospedagem - Runway AI',
    icon: '☁️',
    color: 'bg-gradient-to-r from-red-50 to-rose-50 text-red-900 border-red-200',
    description: 'Imagens geradas pelo Runway AI hospedadas'
  },
  'gemini-carousel-hosted': {
    name: '🍌 Hospedagem - Carrossel Gemini',
    icon: '🎪',
    color: 'bg-gradient-to-r from-yellow-50 to-orange-50 text-yellow-900 border-yellow-200',
    description: '4 imagens carrossel para todos os anúncios'
  },
  'gemini-white-background-hosted': {
    name: '☁️ Hospedagem - Gemini Fundo Branco',
    icon: '🤍',
    color: 'bg-gradient-to-r from-slate-50 to-gray-50 text-slate-900 border-slate-200',
    description: 'Imagens com fundo branco do Gemini hospedadas'
  },
  'gemini-background-hosted': {
    name: '☁️ Hospedagem - Gemini Background',
    icon: '🎨',
    color: 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-900 border-purple-200',
    description: 'Imagens com cenário do Gemini hospedadas'
  },
  'bfl-white-bg-hosted': {
    name: '☁️ Hospedagem - BFL Fundo Branco',
    icon: '⚪',
    color: 'bg-gradient-to-r from-zinc-50 to-neutral-50 text-zinc-900 border-zinc-200',
    description: 'Imagens com fundo branco do BFL.ai hospedadas'
  },
  'bfl-hosted': {
    name: '☁️ Hospedagem - BFL.ai',
    icon: '🚀',
    color: 'bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-900 border-indigo-200',
    description: 'Imagens geradas pelo BFL.ai hospedadas'
  },
  'cloudinary-kit-hosted': {
    name: '☁️ Hospedagem - Cloudinary KIT',
    icon: '📦',
    color: 'bg-gradient-to-r from-orange-50 to-amber-50 text-orange-900 border-orange-200',
    description: 'Kits criativos do Cloudinary hospedados'
  },
  'deepai-enhancement': {
    name: '✨ Melhoria com DeepAI',
    icon: '✨',
    color: 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-900 border-emerald-200',
    description: 'Imagens melhoradas com DeepAI já hospedadas'
  },
  'marketing-templates-hosted': {
    name: 'Templates de Marketing Estilo Canva',
    icon: '🎨',
    color: 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-900 border-purple-200',
    description: 'Templates de marketing gerados com IA e hospedados na nuvem'
  },
  'marketing-gatilhos-gemini-hosted': {
    name: '☁️ Hospedagem - Marketing Gatilhos Gemini',
    icon: '🎯',
    color: 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-900 border-green-200',
    description: 'Gatilhos de marketing gerados pelo Gemini hospedados'
  },
  'marketing-gatilhos-openai-hosted': {
    name: '☁️ Hospedagem - Marketing Gatilhos OpenAI',
    icon: '💡',
    color: 'bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-900 border-teal-200',
    description: 'Gatilhos de marketing gerados pela OpenAI hospedados'
  },
  'marketing-gatilhos-runware-hosted': {
    name: '☁️ Hospedagem - Marketing Gatilhos Runware',
    icon: '⚡',
    color: 'bg-gradient-to-r from-violet-50 to-purple-50 text-violet-900 border-violet-200',
    description: 'Gatilhos de marketing gerados pelo Runware hospedados'
  },
  'marketing-gatilhos-bfl-hosted': {
    name: '☁️ Hospedagem - Marketing Gatilhos BFL.ai',
    icon: '🎯',
    color: 'bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-900 border-indigo-200',
    description: 'Gatilhos de marketing gerados pelo BFL.ai hospedados'
  },
  'marketing-gatilhos-replicate-hosted': {
    name: '☁️ Hospedagem - Marketing Gatilhos Replicate',
    icon: '🔥',
    color: 'bg-gradient-to-r from-rose-50 to-red-50 text-rose-900 border-rose-200',
    description: 'Gatilhos de marketing gerados pelo Replicate hospedados'
  },
  // ✅ Novo: Stability AI hospedado
  'stability-hosted': {
    name: '☁️ Hospedagem - StabilityAI',
    icon: '☁️',
    color: 'bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-900 border-teal-200',
    description: 'Imagens geradas pelo Stability AI hospedadas'
  },
  // ✅ Sources adicionais que estavam faltando na galeria:
  'gemini-batch': {
    name: '☁️ Hospedagem - Gemini Batch',
    icon: '📦',
    color: 'bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-900 border-yellow-200',
    description: 'Imagens geradas em lote pelo Gemini'
  },
  'runware-upscale': {
    name: '☁️ Hospedagem - Runware Upscale',
    icon: '🔍',
    color: 'bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-900 border-cyan-200',
    description: 'Imagens upscaladas pelo Runware'
  },
  'manual-upload': {
    name: '📤 Upload Manual',
    icon: '📤',
    color: 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-900 border-gray-200',
    description: 'Imagens enviadas manualmente pelo usuário'
  },
  'deepai-hosted': {
    name: '☁️ Hospedagem - DeepAI',
    icon: '🧠',
    color: 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-900 border-green-200',
    description: 'Imagens do DeepAI hospedadas'
  },
  'n8n-hosted': {
    name: '☁️ Hospedagem - n8n Workflow',
    icon: '⚡',
    color: 'bg-gradient-to-r from-orange-50 to-amber-50 text-orange-900 border-orange-200',
    description: 'Imagens geradas via n8n workflow hospedadas'
  }
};
