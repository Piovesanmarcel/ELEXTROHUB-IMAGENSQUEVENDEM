import { PromptVariation } from "./promptVariationGenerator";

export interface DistributionConfig {
  totalImages: number;
  prioritizeHigh: boolean;
  shuffle: boolean;
}

/**
 * Distribui variações de prompts de forma inteligente
 * Evita repetições e garante diversidade
 */
export function distributeVariations(
  variations: PromptVariation[],
  config: DistributionConfig
): PromptVariation[] {
  const { totalImages, prioritizeHigh, shuffle } = config;

  if (variations.length === 0) {
    console.warn('⚠️ Nenhuma variação disponível para distribuição');
    return [];
  }

  // Separar por prioridade
  const highPriority = variations.filter(v => v.priority === 'high');
  const mediumPriority = variations.filter(v => v.priority === 'medium');

  let pool: PromptVariation[] = [];

  // Priorizar variações de alta prioridade
  if (prioritizeHigh && highPriority.length > 0) {
    console.log(`🎯 Priorizando ${highPriority.length} variações de alta prioridade`);
    pool = [...highPriority];
    
    // Se precisar de mais, adicionar médias
    if (pool.length < totalImages) {
      pool = [...pool, ...mediumPriority];
    }
  } else {
    // Usar todas as variações
    pool = [...variations];
  }

  // Embaralhar se solicitado
  if (shuffle) {
    pool = shuffleArray([...pool]);
  }

  // Se houver menos variações do que imagens solicitadas, repetir inteligentemente
  if (pool.length < totalImages) {
    console.log(`⚠️ Menos variações (${pool.length}) que imagens solicitadas (${totalImages}). Replicando...`);
    
    const repeated: PromptVariation[] = [];
    while (repeated.length < totalImages) {
      for (const variation of pool) {
        if (repeated.length >= totalImages) break;
        repeated.push(variation);
      }
    }
    pool = repeated;
  }

  // Retornar exatamente o número de variações solicitado
  const distributed = pool.slice(0, totalImages);

  console.log('📊 Distribuição de Prompts:', {
    totalVariations: variations.length,
    highPriority: highPriority.length,
    mediumPriority: mediumPriority.length,
    requested: totalImages,
    distributed: distributed.length,
    uniqueContexts: [...new Set(distributed.map(v => v.context))].length
  });

  return distributed;
}

/**
 * Distribui variações uniformemente entre múltiplas fontes de IA
 */
export function distributeToAISources(
  variations: PromptVariation[],
  aiSources: string[],
  imagesPerSource: number
): Map<string, PromptVariation[]> {
  const distribution = new Map<string, PromptVariation[]>();

  // Embaralhar variações para distribuição aleatória
  const shuffled = shuffleArray([...variations]);

  let currentIndex = 0;

  aiSources.forEach(source => {
    const sourceVariations: PromptVariation[] = [];
    
    for (let i = 0; i < imagesPerSource; i++) {
      if (currentIndex >= shuffled.length) {
        // Se acabaram as variações, recomeçar do início
        currentIndex = 0;
      }
      sourceVariations.push(shuffled[currentIndex]);
      currentIndex++;
    }

    distribution.set(source, sourceVariations);
  });

  console.log('🎨 Distribuição por IA:', {
    totalSources: aiSources.length,
    imagesPerSource,
    totalDistributed: aiSources.length * imagesPerSource
  });

  return distribution;
}

/**
 * Agrupa variações por fonte (copywriting, unified, etc.)
 */
export function groupVariationsBySource(
  variations: PromptVariation[]
): Map<string, PromptVariation[]> {
  const grouped = new Map<string, PromptVariation[]>();

  variations.forEach(variation => {
    const existing = grouped.get(variation.source) || [];
    existing.push(variation);
    grouped.set(variation.source, existing);
  });

  console.log('📂 Variações agrupadas por fonte:', {
    totalSources: grouped.size,
    sources: Array.from(grouped.keys()).map(key => ({
      source: key,
      count: grouped.get(key)?.length || 0
    }))
  });

  return grouped;
}

/**
 * Embaralha um array (Fisher-Yates shuffle)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Remove variações duplicadas (mesmo contexto)
 */
export function removeDuplicateContexts(variations: PromptVariation[]): PromptVariation[] {
  const seen = new Set<string>();
  const unique: PromptVariation[] = [];

  variations.forEach(variation => {
    if (!seen.has(variation.context)) {
      seen.add(variation.context);
      unique.push(variation);
    }
  });

  if (unique.length < variations.length) {
    console.log(`🧹 Removidas ${variations.length - unique.length} variações duplicadas`);
  }

  return unique;
}