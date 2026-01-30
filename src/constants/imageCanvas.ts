/**
 * Constantes para geração de imagens com canvas
 * Padroniza todas as imagens do sistema para 1000x1000 pixels
 */

export const CANVAS_SIZE = 1000;

// Offsets ajustados para canvas 1000x1000 (aumentados proporcionalmente de 800)
export const CANVAS_OFFSETS = {
  boxMargin: 50, // era 40
  boxBottomOffset: 375, // era 300
  boxHeight: 310, // era 250
  boxHeightLarge: 400, // era 320
  textPadding: 25, // era 20
  titleFontSize: 22, // era 18
  bodyFontSize: 18, // era 14-16
  lineHeight: 26, // era 22
  maxLines: 11, // era 9
};

// Cores padrão para os geradores
export const GENERATOR_COLORS = {
  features: '#10b981', // emerald
  authority: '#9333ea', // purple  
  benefits: '#22c55e', // green
  intro: '#3b82f6', // blue
  cta: '#fb923c', // orange
  urgency: '#ef4444', // red
  faq: '#6366f1', // indigo
};
