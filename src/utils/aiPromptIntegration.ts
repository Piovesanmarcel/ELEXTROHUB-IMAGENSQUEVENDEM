/**
 * Utilitário central para integrar variações de prompts em todos os geradores de IA
 */

import { UnifiedResultsData } from "@/hooks/useUnifiedCommandsData";
import { generatePromptVariations, PromptVariation } from "./promptVariationGenerator";
import { distributeVariations, distributeToAISources } from "./promptDistributor";

export interface AIPromptConfig {
  productName: string;
  shortDescription: string;
  unifiedData?: UnifiedResultsData;
  aiSource: string;
  count: number;
}

/**
 * Gera prompts variados para um gerador de IA específico
 */
export async function getPromptsForAI(config: AIPromptConfig): Promise<string[]> {
  const { productName, shortDescription, unifiedData, count } = config;

  // Se não houver dados do Comando Unificado, retornar prompts genéricos
  if (!unifiedData || !unifiedData.hasUnifiedData) {
    console.log(`ℹ️ [${config.aiSource}] Sem dados do Comando Unificado, usando prompts genéricos`);
    return generateGenericPrompts(productName, shortDescription, count);
  }

  // Gerar variações baseadas nos dados do Comando Unificado
  const variations = generatePromptVariations(productName, shortDescription, unifiedData);

  // Distribuir as variações para obter o número exato solicitado
  const distributed = distributeVariations(variations, {
    totalImages: count,
    prioritizeHigh: true,
    shuffle: true
  });

  // Extrair apenas os prompts
  const prompts = distributed.map(v => v.prompt);

  console.log(`✅ [${config.aiSource}] ${prompts.length} prompts variados gerados`);
  return prompts;
}

/**
 * Gera prompts genéricos quando não há dados do Comando Unificado
 */
function generateGenericPrompts(productName: string, shortDescription: string, count: number): string[] {
  const templates = [
    `Professional product photography of ${productName}, ${shortDescription}, studio lighting, white background, high quality, 8K resolution`,
    `${productName} in modern lifestyle setting, ${shortDescription}, natural daylight, contemporary interior, professional photography`,
    `Luxury product shot of ${productName}, ${shortDescription}, elegant background, dramatic lighting, premium quality`,
    `${productName} in creative setting, ${shortDescription}, artistic composition, vibrant colors, professional quality`,
    `Minimalist product photography of ${productName}, ${shortDescription}, clean composition, soft lighting, simple elegant`
  ];

  const prompts: string[] = [];
  for (let i = 0; i < count; i++) {
    prompts.push(templates[i % templates.length]);
  }

  return prompts;
}

/**
 * Distribui prompts entre múltiplos geradores de IA
 */
export async function distributePromptsToAllAIs(
  productName: string,
  shortDescription: string,
  unifiedData: UnifiedResultsData | undefined,
  aiConfigs: { source: string; count: number }[]
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();

  // Se não houver dados do Comando Unificado, usar prompts genéricos
  if (!unifiedData || !unifiedData.hasUnifiedData) {
    for (const config of aiConfigs) {
      const prompts = generateGenericPrompts(productName, shortDescription, config.count);
      result.set(config.source, prompts);
    }
    return result;
  }

  // Gerar todas as variações possíveis
  const allVariations = generatePromptVariations(productName, shortDescription, unifiedData);

  // Calcular total de imagens necessárias
  const totalImages = aiConfigs.reduce((sum, config) => sum + config.count, 0);

  // Distribuir variações uniformemente
  const distributed = distributeVariations(allVariations, {
    totalImages,
    prioritizeHigh: true,
    shuffle: true
  });

  // Distribuir entre as IAs
  let currentIndex = 0;
  for (const config of aiConfigs) {
    const aiPrompts = distributed
      .slice(currentIndex, currentIndex + config.count)
      .map(v => v.prompt);
    
    result.set(config.source, aiPrompts);
    currentIndex += config.count;
  }

  console.log('🎨 Prompts distribuídos entre todas as IAs:', {
    totalAIs: aiConfigs.length,
    totalPrompts: totalImages,
    aiSources: Array.from(result.keys())
  });

  return result;
}

/**
 * Obtém informações de debug sobre as variações geradas
 */
export function getVariationsDebugInfo(variations: PromptVariation[]): string {
  const bySource = new Map<string, number>();
  const byPriority = new Map<string, number>();

  variations.forEach(v => {
    bySource.set(v.source, (bySource.get(v.source) || 0) + 1);
    byPriority.set(v.priority, (byPriority.get(v.priority) || 0) + 1);
  });

  return `
📊 Variações Geradas:
  Total: ${variations.length}
  Alta Prioridade: ${byPriority.get('high') || 0}
  Média Prioridade: ${byPriority.get('medium') || 0}
  
  Por Fonte:
  ${Array.from(bySource.entries()).map(([source, count]) => `  - ${source}: ${count}`).join('\n')}
  `;
}