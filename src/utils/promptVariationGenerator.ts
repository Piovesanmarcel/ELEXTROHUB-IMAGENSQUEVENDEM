import { UnifiedResultsData } from "@/hooks/useUnifiedCommandsData";

export interface PromptVariation {
  prompt: string;
  context: string;
  priority: 'high' | 'medium';
  source: string;
}

/**
 * Gera variações de prompts baseadas em dados do Comando Unificado e Copywriting
 * Combina: Ambientes Ideais + IDEAL PARA + Keywords para criar contextos diversos
 */
export function generatePromptVariations(
  productName: string,
  shortDescription: string,
  unifiedData: UnifiedResultsData
): PromptVariation[] {
  const variations: PromptVariation[] = [];

  console.log('🎨 [PROMPT GENERATOR] Iniciando geração de variações');
  console.log('📊 [DADOS DISPONÍVEIS]:', {
    idealEnvironments: unifiedData.idealEnvironments?.length || 0,
    idealFor: unifiedData.idealFor?.length || 0,
    mainKeywords: unifiedData.mainKeywords?.length || 0,
    longTailKeywords: unifiedData.longTailKeywords?.length || 0
  });

  // Base do prompt que preserva o produto
  const baseInstruction = `CRITICAL: Maintain the EXACT SAME ${productName} from reference image, preserve all original features, colors, design, and appearance.`;
  
  // === 1. PRIORIDADE MÁXIMA: VARIAÇÕES BASEADAS EM "AMBIENTES IDEAIS" (Copywriting) ===
  if (unifiedData.idealEnvironments && unifiedData.idealEnvironments.length > 0) {
    console.log('🏢 [AMBIENTES] Criando variações para', unifiedData.idealEnvironments.length, 'ambientes');
    
    unifiedData.idealEnvironments.forEach((environment, index) => {
      const prompt = `${baseInstruction} ${productName} placed in ${environment}, ${shortDescription}, professional product photography, natural lighting, realistic scene, high quality, ultra detailed, 8K resolution. The product must look identical to the reference.`;
      
      variations.push({
        prompt,
        context: `Ambiente Ideal: ${environment}`,
        priority: 'high',
        source: 'copywriting-environments'
      });
      
      console.log(`  ✓ Variação ${index + 1}: ${environment}`);
    });
  } else {
    console.log('⚠️ [AMBIENTES] Nenhum ambiente ideal encontrado no copywriting');
  }

  // === 2. VARIAÇÕES BASEADAS EM "💡 IDEAL PARA" (Comando Unificado) ===
  if (unifiedData.idealFor && unifiedData.idealFor.length > 0) {
    console.log('💡 [IDEAL PARA] Criando variações para', Math.min(5, unifiedData.idealFor.length), 'casos de uso');
    
    unifiedData.idealFor.slice(0, 5).forEach((useCase, index) => {
      const prompt = `${baseInstruction} ${productName} being used for ${useCase}, ${shortDescription}, lifestyle photography, person interacting with product, natural environment, professional quality, realistic scene. Product appearance must remain unchanged.`;
      
      variations.push({
        prompt,
        context: `Ideal Para: ${useCase}`,
        priority: 'high',
        source: 'unified-ideal-for'
      });
      
      console.log(`  ✓ Caso de uso ${index + 1}: ${useCase.substring(0, 50)}...`);
    });
  } else {
    console.log('⚠️ [IDEAL PARA] Nenhum caso de uso encontrado');
  }

  // === 3. VARIAÇÕES COMBINADAS (Ambiente + Keyword) ===
  if (unifiedData.mainKeywords && unifiedData.mainKeywords.length > 0 && 
      unifiedData.idealEnvironments && unifiedData.idealEnvironments.length > 0) {
    
    console.log('🔑 [KEYWORDS + AMBIENTES] Criando combinações');
    
    // Combinar os 3 primeiros ambientes com as 3 primeiras keywords
    const topEnvironments = unifiedData.idealEnvironments.slice(0, 3);
    const topKeywords = unifiedData.mainKeywords.slice(0, 3);
    
    let comboCount = 0;
    topEnvironments.forEach(environment => {
      topKeywords.forEach(keyword => {
        const prompt = `${baseInstruction} ${productName} in ${environment}, emphasizing ${keyword}, ${shortDescription}, professional commercial photography, clean composition, modern aesthetic, high resolution. Keep product exactly as reference shows.`;
        
        variations.push({
          prompt,
          context: `${environment} + ${keyword}`,
          priority: 'medium',
          source: 'combined-environment-keyword'
        });
        comboCount++;
      });
    });
    
    console.log(`  ✓ ${comboCount} combinações criadas`);
  }

  // === VARIAÇÕES POR PÚBLICO-ALVO ===
  if (unifiedData.targetAudience && unifiedData.targetAudience.length > 10) {
    const audienceWords = unifiedData.targetAudience.split(/[,.]/).map(s => s.trim()).filter(s => s.length > 5).slice(0, 3);
    
    audienceWords.forEach(audience => {
      const prompt = `${baseInstruction} ${productName} designed for ${audience}, ${shortDescription}, lifestyle photography showing the target audience, professional quality, authentic scene, natural colors. Product must remain identical to reference.`;
      
      variations.push({
        prompt,
        context: `Público: ${audience}`,
        priority: 'medium',
        source: 'target-audience'
      });
    });
  }

  // === VARIAÇÕES COM LONG-TAIL KEYWORDS ===
  if (unifiedData.longTailKeywords && unifiedData.longTailKeywords.length > 0) {
    unifiedData.longTailKeywords.slice(0, 5).forEach((keyword, index) => {
      const prompt = `${baseInstruction} ${productName} showcasing ${keyword}, ${shortDescription}, professional product photography, strategic lighting, commercial quality, realistic presentation. Original product features must be preserved.`;
      
      variations.push({
        prompt,
        context: `Long-tail: ${keyword}`,
        priority: 'medium',
        source: 'long-tail-keywords'
      });
    });
  }

  // === FALLBACK: Se não houver dados suficientes, criar variações genéricas ===
  if (variations.length === 0) {
    const genericScenarios = [
      { env: 'modern minimalist studio with white background', context: 'Studio Minimalista' },
      { env: 'contemporary lifestyle setting with natural daylight', context: 'Lifestyle Natural' },
      { env: 'professional workspace environment', context: 'Ambiente Profissional' },
      { env: 'cozy home interior with warm lighting', context: 'Interior Acolhedor' },
      { env: 'outdoor natural environment', context: 'Ambiente Externo' }
    ];

    genericScenarios.forEach(scenario => {
      const prompt = `${baseInstruction} ${productName} in ${scenario.env}, ${shortDescription}, professional photography, high quality, realistic scene, 8K resolution. Keep product identical to reference.`;
      
      variations.push({
        prompt,
        context: scenario.context,
        priority: 'medium',
        source: 'generic-fallback'
      });
    });
  }

  const stats = {
    porAmbientes: variations.filter(v => v.source === 'copywriting-environments').length,
    porUso: variations.filter(v => v.source === 'unified-ideal-for').length,
    porCombinacoes: variations.filter(v => v.source === 'combined-environment-keyword').length,
    porPublico: variations.filter(v => v.source === 'target-audience').length,
    porLongTail: variations.filter(v => v.source === 'long-tail-keywords').length,
    fallback: variations.filter(v => v.source === 'generic-fallback').length,
    highPriority: variations.filter(v => v.priority === 'high').length,
    mediumPriority: variations.filter(v => v.priority === 'medium').length
  };
  
  console.log(`✅ [RESUMO] Total de variações geradas: ${variations.length}`);
  console.log('📊 [DISTRIBUIÇÃO POR FONTE]:', stats);
  console.log('🎯 [CONTEXTOS ÚNICOS]:', [...new Set(variations.map(v => v.context))].length);
  console.log('📋 [PREVIEW DOS CONTEXTOS]:', variations.slice(0, 5).map(v => v.context));

  return variations;
}

/**
 * Filtra e retorna apenas variações de alta prioridade
 */
export function getHighPriorityVariations(variations: PromptVariation[]): PromptVariation[] {
  return variations.filter(v => v.priority === 'high');
}

/**
 * Retorna uma variação aleatória de uma lista
 */
export function getRandomVariation(variations: PromptVariation[]): PromptVariation | null {
  if (variations.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * variations.length);
  return variations[randomIndex];
}