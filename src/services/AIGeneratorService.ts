import { supabase } from "@/integrations/supabase/client";

export interface GeneratorInput {
  imageUrl: string;
  productId: string;
  productName: string;
  generatorType: 'features' | 'authority';
}

export interface GeneratorResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

class AIGeneratorService {
  private async getEnhancedImages(productId: string): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('🔍 [ENHANCED IMAGES] Usuário não autenticado');
        return [];
      }

      console.log(`🔍 [ENHANCED IMAGES] Buscando imagens para produto: ${productId}`);
      
      // Buscar imagens melhoradas em múltiplas fontes
      const enhancedImages: any[] = [];

      // 1. PRIORIZAR tabela produtos (DeepAI) - mais confiável
      console.log('🔍 [ENHANCED IMAGES] Verificando tabela produtos PRIMEIRO...');
      const { data: produto, error: produtoError } = await supabase
        .from('produtos')
        .select('*')
        .eq('id', productId)
        .eq('usuario_id', user.id)
        .single();

      if (!produtoError && produto) {
        // Extrair imagens melhoradas das colunas imagem_melhorada_*
        for (let i = 1; i <= 10; i++) {
          const imagemMelhorada = produto[`imagem_melhorada_${i}`];
          if (imagemMelhorada) {
            console.log(`🔍 [ENHANCED IMAGES] Encontrada imagem_melhorada_${i}`);
            enhancedImages.push({
              enhanced: imagemMelhorada,
              url: imagemMelhorada,
              index: i,
              type: 'deepai'
            });
          }
        }
      }

      // 2. FALLBACK: ai_unified_results se não achou nada nos produtos
      if (enhancedImages.length === 0) {
        console.log('🔍 [ENHANCED IMAGES] Fallback: Verificando ai_unified_results...');
        const { data: aiResults, error: aiError } = await supabase
          .from('ai_unified_results')
          .select('results')
          .eq('product_id', productId)
          .eq('user_id', user.id);

        if (!aiError && aiResults && aiResults.length > 0) {
          for (const result of aiResults) {
            const results = result.results as any;
            
            // Verificar enhanced_images em ai_unified_results
            if (results.enhanced_images && Array.isArray(results.enhanced_images)) {
              results.enhanced_images.forEach((img: any, index: number) => {
                if (img && (img.enhanced || img.url)) {
                  enhancedImages.push({
                    enhanced: img.enhanced || img.url,
                    original: img.original || img.url,
                    url: img.enhanced || img.url,
                    index: index + 1,
                    type: 'ai_unified'
                  });
                }
              });
            }
            
            // Verificar outras estruturas possíveis
            if (results.images && Array.isArray(results.images)) {
              results.images.forEach((img: any, index: number) => {
                if (typeof img === 'string') {
                  enhancedImages.push({
                    enhanced: img,
                    url: img,
                    index: index + 1,
                    type: 'ai_unified_string'
                  });
                }
              });
            }
          }
        }
      }

      // 3. ÚLTIMO RECURSO: usar imagens originais se nenhuma enhanced foi encontrada
      if (enhancedImages.length === 0) {
        console.log('⚠️ [ENHANCED IMAGES] Último recurso: usando imagens originais...');
        if (!produtoError && produto) {
          for (let i = 1; i <= 10; i++) {
            const imagemOriginal = produto[`imagem_url${i === 1 ? '' : `_${i}`}`];
            if (imagemOriginal) {
              console.log(`🔍 [ENHANCED IMAGES] Usando imagem original ${i}`);
              enhancedImages.push({
                enhanced: imagemOriginal,
                original: imagemOriginal,
                url: imagemOriginal,
                index: i,
                type: 'original'
              });
            }
          }
        }
      }

      console.log(`✅ [ENHANCED IMAGES] Total encontrado: ${enhancedImages.length} imagens`);
      return enhancedImages;

    } catch (error) {
      console.error('❌ [ENHANCED IMAGES] Erro:', error);
      return [];
    }
  }

  private async getCopywritingText(productId: string, section: string): Promise<string> {
    try {
      // Check cache first
      const { cacheService } = await import('./CacheService');
      const cachedText = cacheService.getCopywritingText(productId, section);
      if (cachedText) {
        return cachedText;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('🔍 [COPYWRITING] Usuário não autenticado — usando fallback');
        const fallbackText = await this.generateTextFallback(productId, section);
        cacheService.setCopywritingText(productId, section, fallbackText);
        return fallbackText;
      }

      console.log(`🔍 [COPYWRITING] === OPTIMIZED === Buscando texto da seção '${section}' para produto: ${productId}`);

      // Single query to get all copywriting data
      const { data: results, error } = await supabase
        .from('ai_unified_results')
        .select('results')
        .eq('product_id', productId)
        .eq('user_id', user.id);

      if (error || !results || results.length === 0) {
        console.log('❌ [COPYWRITING] Nenhum resultado encontrado, tentando fallback:', error);
        const fallbackText = await this.generateTextFallback(productId, section);
        cacheService.setCopywritingText(productId, section, fallbackText);
        return fallbackText;
      }

      // Extract all sections at once and cache them
      const allSections: Record<string, string> = {};
      
      for (const result of results) {
        const resultsData = result.results as any;
        
        // Extract all sections in one pass
        const sections = ['intro', 'authority', 'benefits', 'urgency', 'cta', 'faq', 'conversion', 'features'];
        
        for (const sec of sections) {
          if (!allSections[sec]) {
            let extractedText = '';
            
            // PRIORIDADE ESPECIAL para conversion: usar topicos_conversao primeiro
            if (sec === 'conversion' && resultsData.topicos_conversao?.improvedText) {
              extractedText = resultsData.topicos_conversao.improvedText;
            }
            // ✅ FIX: PRIORIDADE para authority: topicos_conversao → copywriting → fallback robusto
            else if (sec === 'authority') {
              // PRIORIDADE 1: topicos_conversao
              if (resultsData.topicos_conversao?.improvedText) {
                const authorityText = this.extractAuthorityFromCopywriting(resultsData.topicos_conversao.improvedText);
                if (authorityText && authorityText.length > 20) {
                  extractedText = authorityText;
                  console.log(`✅ [COPYWRITING] Authority extraído de topicos_conversao (${authorityText.length} chars)`);
                }
              }
              
              // PRIORIDADE 2: Copywriting estruturado
              if (!extractedText && resultsData.copywriting) {
                let copyText = '';
                if (typeof resultsData.copywriting === 'string') {
                  copyText = resultsData.copywriting;
                } else if (typeof resultsData.copywriting === 'object' && resultsData.copywriting !== null) {
                  const copyObj = resultsData.copywriting as any;
                  copyText = copyObj.content || copyObj.text || copyObj.generatedText || '';
                }
                
                if (copyText) {
                  const authorityText = this.extractAuthorityFromCopywriting(copyText);
                  if (authorityText && authorityText.length > 20) {
                    extractedText = authorityText;
                    console.log(`✅ [COPYWRITING] Authority extraído de copywriting (${authorityText.length} chars)`);
                  }
                }
              }
              
              // FALLBACK: Texto robusto genérico
              if (!extractedText) {
                extractedText = 'VANTAGENS:\n- Qualidade premium garantida\n- Durabilidade superior\n- Custo-benefício excelente\n- Satisfação garantida\n- Resolução de problemas do dia a dia';
                console.log('⚠️ [COPYWRITING] Authority: usando fallback genérico robusto');
              }
            }
            // ✅ FIX: PRIORIDADE para features: topicos_conversao (SPECS + BENEFÍCIOS) → copywriting seção 3 → genérico
            else if (sec === 'features') {
              // PRIORIDADE 1: Tentar topicos_conversao primeiro - COM SPECS E BENEFÍCIOS
              if (resultsData.topicos_conversao?.improvedText) {
                const { specs, benefits } = this.extractSpecsAndBenefitsFromTopicos(resultsData.topicos_conversao.improvedText);
                
                if (specs.length > 0 || benefits.length > 0) {
                  // Formato estruturado: SPECS primeiro, depois BENEFITS
                  let combined = '';
                  
                  if (specs.length > 0) {
                    combined += '📋 ESPECIFICAÇÕES:\n';
                    specs.forEach(s => combined += `- ${s}\n`);
                  }
                  
                  if (benefits.length > 0) {
                    combined += '\n✨ BENEFÍCIOS:\n';
                    benefits.forEach(b => combined += `- ${b}\n`);
                  }
                  
                  extractedText = combined.trim();
                  console.log(`✅ [COPYWRITING] Features extraído: ${specs.length} specs + ${benefits.length} benefits`);
                }
              }
              
              // PRIORIDADE 2: FALLBACK para copywriting seção 3 (Destaque das Principais Características)
              if (!extractedText && resultsData.copywriting) {
                console.log(`🔄 [COPYWRITING] Features: topicos_conversao não disponível, tentando copywriting seção 3...`);
                
                let copyText = '';
                if (typeof resultsData.copywriting === 'string') {
                  copyText = resultsData.copywriting;
                } else if (typeof resultsData.copywriting === 'object' && resultsData.copywriting !== null) {
                  const copyObj = resultsData.copywriting as any;
                  copyText = copyObj.content || copyObj.text || copyObj.generatedText || '';
                }
                
                if (copyText) {
                  const features = this.extractFeaturesFromCopywriting(copyText);
                  if (features && features.length > 0) {
                    extractedText = features.join('\n');
                    console.log(`✅ [COPYWRITING] Features extraído de copywriting seção 3: ${features.length} características`);
                  }
                }
              }
              
              // PRIORIDADE 3: Fallback genérico robusto
              if (!extractedText) {
                extractedText = '📋 ESPECIFICAÇÕES:\n- Produto de alta qualidade\n- Material resistente e durável\n- Design moderno e funcional\n\n✨ BENEFÍCIOS:\n- Praticidade no uso diário\n- Durabilidade garantida\n- Excelente custo-benefício';
                console.log(`⚠️ [COPYWRITING] Features: nenhuma fonte encontrada, usando fallback genérico robusto`);
              }
            }
            // EXTRAÇÃO TIPO-ESPECÍFICA para casos especiais
            else if (sec === 'benefits' && resultsData.beneficios?.improvedText) {
              extractedText = resultsData.beneficios.improvedText;
            }
            else if (sec === 'faq' && resultsData.faq?.improvedText) {
              extractedText = resultsData.faq.improvedText;
            }
            // Buscar primeiro em copywriting
            else if (resultsData.copywriting) {
              // ✅ FIX: Tratar copywriting como objeto se não for string
              let copy: string;
              if (typeof resultsData.copywriting === 'string') {
                copy = resultsData.copywriting;
              } else if (typeof resultsData.copywriting === 'object' && resultsData.copywriting !== null) {
                // Se for objeto, tentar extrair content ou converter para string
                const copyObj = resultsData.copywriting as any;
                copy = copyObj.content || copyObj.text || copyObj.generatedText || 
                       resultsData.marketing_copy || JSON.stringify(copyObj);
                console.log(`🔄 [COPYWRITING] Convertido objeto copywriting para string (${copy.length} chars)`);
              } else {
                copy = '';
              }
              
              if (copy && copy.length > 10 && !copy.startsWith('[object')) {
                // Extratores especializados priorizados
                if (sec === 'authority') {
                  extractedText = this.extractAuthorityFromCopywriting(copy) || '';
                } else if (sec === 'features') {
                  // ✅ NÃO extrair features do copywriting - deve vir apenas do topicos_conversao
                  // Ignorar - features já foi tratado acima com topicos_conversao
                } else if (sec === 'faq') {
                  extractedText = this.extractFaqFromCopywriting(copy) || '';
                } else if (sec === 'urgency') {
                  extractedText = this.extractUrgencyFromCopywriting(copy) || '';
                } else {
                  extractedText = this.extractSectionFromCopywriting(copy, sec);
                }
              }
            }
            // Fallback: buscar em marketing_copy
            else if (resultsData.marketing_copy) {
              extractedText = this.extractSectionFromCopywriting(resultsData.marketing_copy, sec);
            }
            // Buscar em outras estruturas possíveis
            else if (resultsData.copy && resultsData.copy.sections) {
              extractedText = resultsData.copy.sections[sec] || '';
            }
            
            if (extractedText) {
              allSections[sec] = extractedText;
            }
          }
        }
      }

      // Cache all extracted sections
      if (Object.keys(allSections).length > 0) {
        cacheService.setCopywritingBatch(productId, allSections);
        console.log(`✅ [COPYWRITING] Cached ${Object.keys(allSections).length} sections for product ${productId}`);
      }

      // Return the requested section or fallback
      const sectionText = allSections[section];
      if (sectionText) {
        console.log(`✅ [COPYWRITING] Texto encontrado para '${section}' (${sectionText.length} chars)`);
        return sectionText;
      }

      console.log(`❌ [COPYWRITING] Texto da seção '${section}' não encontrado, tentando fallback`);
      const fallbackText = await this.generateTextFallback(productId, section);
      cacheService.setCopywritingText(productId, section, fallbackText);
      return fallbackText;

    } catch (error) {
      console.error('❌ [COPYWRITING] Erro:', error);
      const fallbackText = await this.generateTextFallback(productId, section);
      const { cacheService } = await import('./CacheService');
      cacheService.setCopywritingText(productId, section, fallbackText);
      return fallbackText;
    }
  }

  private async generateTextFallback(productId: string, section: string): Promise<string> {
    try {
      console.log(`🔄 [FALLBACK] Gerando texto on-the-fly para seção '${section}' do produto ${productId}`);
      
      // Usar nome genérico do produto para fallback
      const productName = `Produto ${productId.substring(0, 8)}`;

      // Mapeamento de seções para prompts específicos
      const sectionPrompts = {
        'intro': `Crie uma introdução captadora para um produto inovador. Foque em capturar atenção e despertar interesse. Máximo 150 caracteres.`,
        'authority': `Crie um texto sobre dor x solução para um produto que resolve problemas importantes. Identifique problemas e apresente soluções. Máximo 150 caracteres.`,
        'benefits': `Liste os principais benefícios de um produto de qualidade superior. Foque nos resultados positivos para o cliente. Máximo 150 caracteres.`,
        'urgency': `Crie um texto de escassez e urgência para um produto em oferta especial. Motive ação imediata. Máximo 150 caracteres.`,
        'cta': `Crie uma chamada para ação forte e convincente. Convença a comprar agora com urgência e benefícios claros. Máximo 150 caracteres.`,
        'faq': `Responda à principal pergunta sobre qualidade e garantia de um produto. FAQ resumida e esclarecedora. Máximo 150 caracteres.`,
        'conversion': `Crie tópicos de conversão convincentes. Motivos irresistíveis para comprar este produto agora. Máximo 150 caracteres.`,
        'features': `Liste as principais características técnicas de um produto de alta qualidade. Especificações relevantes. Máximo 150 caracteres.`
      };

      const prompt = sectionPrompts[section as keyof typeof sectionPrompts] || 
        `Crie um texto de marketing persuasivo para um produto de qualidade. Máximo 150 caracteres.`;

      // ✅ FIX: Chamar openai-copywriting diretamente (não gemini-background-generator que exige imagem)
      const { data, error } = await supabase.functions.invoke('ai-chat-proxy', {
        body: {
          prompt: prompt,
          action: 'generate_copywriting',
          targetFunction: 'openai-copywriting'
        }
      });

      if (error || (!data?.generatedText && !data?.generatedPrompt)) {
        console.log('❌ [FALLBACK] Erro ao gerar texto:', error);
        return this.getDefaultText(section, productName);
      }

      const generatedText = (data.generatedText || data.generatedPrompt || '').substring(0, 150).trim();
      console.log(`✅ [FALLBACK] Texto gerado para '${section}' (${generatedText.length} chars): ${generatedText}`);
      
      return generatedText;

    } catch (error) {
      console.error('❌ [FALLBACK] Erro na geração de texto:', error);
      return this.getDefaultText(section, 'este produto');
    }
  }

  private getDefaultText(section: string, productName: string): string {
    const defaults = {
      'intro': `Descubra ${productName} - a solução que você precisa!`,
      'authority': `Problema resolvido com ${productName} de forma eficaz.`,
      'benefits': `${productName} oferece benefícios únicos para você.`,
      'urgency': `Oferta limitada! Garante seu ${productName} agora!`,
      'cta': `Compre ${productName} hoje e transforme sua vida!`,
      'faq': `${productName} é seguro, eficaz e com garantia.`,
      'conversion': `${productName}: qualidade, confiança e resultados.`,
      'features': `${productName} - especificações técnicas superiores.`
    };
    
    return defaults[section as keyof typeof defaults] || `Conheça ${productName} - sua melhor escolha!`;
  }

  private extractSectionFromCopywriting(content: string, section: string): string {
    console.log(`🔍 === DEBUG EXTRACTION === Extraindo seção '${section}' do copywriting`);
    console.log(`📄 === DEBUG === Primeiras 500 chars do conteúdo: ${content.substring(0, 500)}...`);
    
    const lines = content.split('\n');
    let sectionText = '';
    let inTargetSection = false;
    
    // Mapeamento SIMPLIFICADO baseado no formato real das seções numeradas
    const sectionNumbers = {
      'intro': ['1', '2'],           // "1. **Introdução Captadora**" ou "2. **Introdução**"
      'authority': ['2', '4'],        // "2. **Dor x Solução**" ou "4. **Dor x Solução**"
      'benefits': ['3', '5'],         // "3. **Benefícios**" ou "5. **Principais Benefícios**"
      'urgency': ['4', '5', '6'],     // "4. **Gatilho de Escassez**", "5. **Gatilho**", "6. **Urgência**"
      'cta': ['5', '6', '7'],         // "5. **Chamada para Ação**", "6. **CTA**", "7. **Chamada**"
      'faq': ['6', '7', '8'],         // "6. **FAQ**", "7. **Perguntas Frequentes**", "8. **FAQ**"
      'conversion': ['7', '8', '9'],  // "7. **Tópicos de Conversão**", "8. **Conversão**", "9. **Tópicos**"
      'features': ['8', '9', '3']     // "8. **Características**", "9. **Especificações**", "3. **Especificações Técnicas**"
    };
    
    const numbers = sectionNumbers[section as keyof typeof sectionNumbers] || [];
    console.log(`🔍 === DEBUG === Procurando números: ${numbers.join(', ')} para seção '${section}'`);
    
    // BUSCA SIMPLIFICADA: procurar por padrões do tipo "N. **TÍTULO**"
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Debug das primeiras 30 linhas numeradas
      if (i < 30 && line.match(/^\d+\.\s*\*\*/)) {
        console.log(`📋 === DEBUG === Linha ${i + 1}: ${line}`);
      }
      
      // Verificar se é uma linha numerada que corresponde à nossa seção
      if (!inTargetSection) {
        for (const num of numbers) {
          // Padrões mais flexíveis para capturar seções numeradas
          const patterns = [
            new RegExp(`^${num}\\.\s*\\*\\*.*${this.getSectionKeywords(section)}.*\\*\\*`, 'i'),
            new RegExp(`^${num}\\.\s*\\*\\*[^*]*\\*\\*`, 'i'), // Qualquer seção com esse número
            new RegExp(`^${num}\\.\s*[^*]*${this.getSectionKeywords(section)}`, 'i') // Sem asteriscos
          ];
          
          if (patterns.some(pattern => pattern.test(line))) {
            console.log(`✅ === DEBUG === Encontrou seção '${section}' número ${num} na linha ${i + 1}: ${line}`);
            inTargetSection = true;
            break;
          }
        }
        continue;
      }
      
      // Se estamos na seção alvo, verificar se chegou ao fim
      if (inTargetSection) {
        // Parar na próxima seção numerada
        if (line.match(/^\d+\.\s*\*\*/)) {
          console.log(`🔚 === DEBUG === Fim da seção '${section}' na próxima seção numerada: ${line}`);
          break;
        }
        
        // Coletar conteúdo, incluindo linhas com formatação
        if (line && !line.startsWith('#') && line.length > 0) {
          // Limpar formatação básica mas preservar conteúdo
          const cleanLine = line
            .replace(/^\*\*|\*\*$/g, '') // Remove ** do início e fim
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove ** do meio
            .replace(/\*(.*?)\*/g, '$1') // Remove * simples
            .replace(/^[-*•]\s*/, '') // Remove marcadores de lista
            .replace(/^[🎯✨⚡🛒🚨❓💡📋]\s*/, '') // Remove emojis do início
            .trim();
          
          if (cleanLine) {
            sectionText += cleanLine + ' ';
          }
        }
      }
    }
    
    let result = sectionText.trim();
    console.log(`📝 === DEBUG === Texto FINAL extraído da seção '${section}' (${result.length} chars):`, result.substring(0, 300) + '...');
    
    // Se não encontrou nada, tentar fallback inteligente
    if (result.length === 0) {
      console.log(`❌ === DEBUG === NENHUM CONTEÚDO encontrado para seção '${section}', tentando fallback inteligente`);
      result = this.tryIntelligentFallback(content, section, false);
      if (result) {
        console.log(`✅ === FALLBACK === Texto encontrado via fallback inteligente para '${section}' (${result.length} chars):`, result.substring(0, 200) + '...');
      }
    }
    
    return result;
  }

  private getSectionKeywords(section: string): string {
    const keywords = {
      'intro': 'Introdução|Captadora',
      'authority': 'Dor|Solução|Autoridade|Problema',
      'benefits': 'Benefícios|Vantagens|Principais',
      'urgency': 'Gatilho|Escassez|Urgência|Limitado|Garanta',
      'cta': 'Chamada|Ação|CTA|Compre|Garanta',
      'faq': 'FAQ|Perguntas|Frequentes|Dúvidas',
      'conversion': 'Tópicos|Conversão|Motivos|Ideal',
      'features': 'Características|Especificações|Técnicas|Ficha'
    };
    
    return keywords[section as keyof typeof keywords] || section;
  }

  // === EXTRATORES ESPECIALIZADOS (PARIDADE 100% COM BLOCOS MANUAIS) ===
  private extractFeaturesFromCopywriting(copywriting: string): string[] {
    const lines = copywriting.split('\n');
    const specs: string[] = [];
    const benefits: string[] = [];
    let currentSection: 'specs' | 'benefits' | '' = '';

    for (const line of lines) {
      const trimmed = line.trim();
      const lowerTrimmed = trimmed.toLowerCase();

      // Detectar seção 3 - Destaque das Principais Características / Especificações (mais padrões)
      if (currentSection !== 'specs' && 
          (trimmed.match(/^[#*]*\s*3\./) || 
           lowerTrimmed.includes('características') ||
           lowerTrimmed.includes('especificações técnicas') ||
           lowerTrimmed.includes('especificações') ||
           lowerTrimmed.includes('destaque das principais'))) {
        currentSection = 'specs';
        continue;
      }

      // Detectar seção 5 - Principais Benefícios para o Cliente (mais padrões)
      if (currentSection !== 'benefits' &&
          (trimmed.match(/^[#*]*\s*5\./) || 
           (lowerTrimmed.includes('benefício') && !lowerTrimmed.includes('especificação')) ||
           lowerTrimmed.includes('principais benefícios') ||
           lowerTrimmed.includes('benefícios para o cliente'))) {
        currentSection = 'benefits';
        continue;
      }

      // Detectar início de outra seção numerada (4, 6, etc) - encerra seção atual
      if (trimmed.match(/^[#*]*\s*[4679]\./)) {
        if (currentSection === 'specs' && !trimmed.match(/^[#*]*\s*5\./)) {
          currentSection = '';
        } else if (currentSection === 'benefits') {
          currentSection = '';
        }
        continue;
      }

      if (!currentSection) continue;

      // Formato **Nome:** descrição
      if (trimmed && (trimmed.includes('**') && trimmed.includes(':**'))) {
        let clean = trimmed.replace(/\*\*/g, '').replace(/[#*]/g, '').trim();
        if (clean) {
          if (currentSection === 'specs') specs.push(clean);
          else if (currentSection === 'benefits') benefits.push(clean);
        }
      }

      // Itens numerados simples dentro da seção
      if (trimmed.match(/^\d+\.\s/) && !trimmed.includes('**')) {
        let item = trimmed.replace(/^\d+\.\s/, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\s*:\s*:/g, ':');
        if (item.trim()) {
          if (currentSection === 'specs') specs.push(item.trim());
          else if (currentSection === 'benefits') benefits.push(item.trim());
        }
      }

      // Itens de lista com - ou *
      if (trimmed.match(/^[-*]\s/)) {
        let item = trimmed.replace(/^[-*]\s/, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\s*:\s*:/g, ':');
        if (item.trim()) {
          if (currentSection === 'specs') specs.push(item.trim());
          else if (currentSection === 'benefits') benefits.push(item.trim());
        }
      }
    }

    // ✅ FALLBACK ROBUSTO: Se não encontrou seções estruturadas, extrair qualquer lista
    if (specs.length === 0 && benefits.length === 0) {
      console.log('⚠️ [FEATURES] Formato estruturado não encontrado, usando fallback...');
      
      // Extrair qualquer lista de itens do texto
      const allItems = lines
        .filter(l => l.trim().match(/^[-*•]\s/) || l.trim().match(/^\d+\.\s/))
        .map(l => l.replace(/^[-*•]\s/, '').replace(/^\d+\.\s/, '').replace(/\*\*/g, '').trim())
        .filter(l => l.length > 5);
      
      if (allItems.length > 0) {
        // Dividir: primeiros 50% são specs, resto benefits
        const midPoint = Math.ceil(allItems.length / 2);
        specs.push(...allItems.slice(0, midPoint));
        benefits.push(...allItems.slice(midPoint));
        console.log(`✅ [FEATURES] Fallback extraiu ${specs.length} specs + ${benefits.length} benefits`);
      }
    }

    // Retornar formato estruturado para o renderizador
    const result: string[] = [];
    if (specs.length > 0) {
      result.push('ESPECIFICAÇÕES:');
      specs.forEach(s => result.push('- ' + s));
    }
    if (benefits.length > 0) {
      result.push('BENEFÍCIOS:');
      benefits.forEach(b => result.push('- ' + b));
    }
    
    // ✅ FALLBACK FINAL: Se ainda não tem nada, gerar conteúdo genérico
    if (result.length === 0) {
      console.log('⚠️ [FEATURES] Nenhum conteúdo encontrado, usando fallback genérico');
      result.push('ESPECIFICAÇÕES:');
      result.push('- Produto de alta qualidade');
      result.push('- Material resistente e durável');
      result.push('BENEFÍCIOS:');
      result.push('- Praticidade no uso diário');
      result.push('- Durabilidade garantida');
    }

    return result;
  }

  private extractFaqFromCopywriting(copywriting: string): string {
    if (!copywriting) return '';
    const lines = copywriting.split('\n');
    let inSection = false;
    const pairs: { q: string; a: string }[] = [];
    let currentQ = '';

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();

      // Início da seção 8. Perguntas Frequentes (FAQ)
      if ((trimmed.includes('8.') || trimmed.includes('8 -') || trimmed.includes('8)')) && (trimmed.toLowerCase().includes('pergunta') || trimmed.toLowerCase().includes('frequente') || trimmed.toLowerCase().includes('faq'))) {
        inSection = true;
        continue;
      }

      // Fim da seção (próxima seção numerada)
      if (inSection && trimmed.match(/^(9\.|9 -|9\))/)) break;

      if (!inSection) continue;

      // Pergunta
      if (trimmed.includes('P') && (trimmed.includes('**P') || trimmed.includes('P:') || trimmed.includes('P :')) && (trimmed.includes('**') || trimmed.includes('?'))) {
        let q = trimmed.replace(/^-\s*/, '').replace(/\*\*P\s*:\s*\*\*/g, '').replace(/\*\*P:\*\*/g, '').replace(/P\s*:\s*/g, '').replace(/\*\*/g, '').replace(/[#*]/g, '').trim();
        if (q) currentQ = q;
      }

      // Resposta
      if (currentQ && (trimmed.startsWith('R:') || trimmed.includes('**R:**') || (trimmed.includes('R:') && !trimmed.includes('P')))) {
        let a = trimmed.replace(/^\s*\*\*R:\*\*/g, '').replace(/^R:\s*/g, '').replace(/[#*]/g, '').trim();
        if (a) {
          pairs.push({ q: currentQ, a });
          currentQ = '';
        }
      }
    }

    if (pairs.length === 0) {
      // Estratégia alternativa: qualquer linha com ? seguida de resposta
      const all = copywriting.split('\n');
      for (let i = 0; i < all.length - 1; i++) {
        const cur = all[i].trim();
        const next = all[i + 1]?.trim();
        if (cur.includes('?') && next && (next.startsWith('R:') || next.includes('**R:**') || next.toLowerCase().includes('sim') || next.toLowerCase().includes('não'))) {
          let q = cur.replace(/\*\*/g, '').replace(/P\s*:\s*/g, '').replace(/^-\s*/, '').trim();
          let a = next.replace(/^\s*\*\*R:\*\*/g, '').replace(/^R:\s*/g, '').trim();
          pairs.push({ q, a });
        }
      }
    }

    // Converter para formato esperado (Q e A alternados em linhas)
    let out = '';
    pairs.forEach(p => {
      out += p.q + '\n';
      out += p.a + '\n';
    });
    return out.trim();
  }

  private extractUrgencyFromCopywriting(copywriting: string): string {
    const lines = copywriting.split('\n');
    let inSection = false;
    let out = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.includes('6.') && (trimmed.toLowerCase().includes('gatilho') || trimmed.toLowerCase().includes('escassez') || trimmed.toLowerCase().includes('urgência'))) {
        inSection = true;
        continue;
      }
      if (inSection && (trimmed.match(/^\d+\./) || trimmed.match(/^#{1,6}\s/))) break;
      if (!inSection) continue;
      if (trimmed && !trimmed.match(/^[-*]\s/) && !trimmed.match(/^#{1,6}\s/) && !trimmed.match(/^\*\*.*\*\*:?-?\s*$/) && !trimmed.includes('####')) {
        let clean = trimmed.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/#{1,6}\s/g, '').trim();
        if (clean) out += clean + ' ';
      }
    }
    return out.trim();
  }

  private extractAuthorityFromCopywriting(copywriting: string): string {
    console.log('🔍 [AUTHORITY] Extraindo DOR X SOLUÇÃO do copywriting...');
    const lines = copywriting.split('\n');
    let inSection = false;
    let problems: string[] = [];
    let solutions: string[] = [];
    let fallback = '';

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      const lowerTrimmed = trimmed.toLowerCase();
      
      // Detectar início da seção 4 (Dor x Solução)
      if (!inSection && 
          (trimmed.includes('4.') || trimmed.includes('2.')) && 
          (lowerTrimmed.includes('dor') || 
           lowerTrimmed.includes('solução') || 
           lowerTrimmed.includes('conversão') || 
           lowerTrimmed.includes('problema') ||
           lowerTrimmed.includes('autoridade') ||
           lowerTrimmed.includes('vantag'))) {
        inSection = true;
        console.log(`✅ [AUTHORITY] Encontrou seção na linha ${i+1}: ${trimmed.substring(0, 50)}`);
        continue;
      }
      if (inSection && trimmed.match(/^5\./)) break;
      if (inSection && trimmed.match(/^([6-9]|1[0-9])\./)) break;
      if (!inSection) continue;

      if (trimmed && trimmed.length > 5) {
        let clean = trimmed.replace(/^\*+\s*/, '').replace(/\s*\*+$/, '').replace(/^-+\s*/, '').replace(/^#{1,6}\s*/, '').trim();
        if (!clean) continue;
        
        // ✅ PRIORIDADE 1: Detectar padrão explícito PROBLEMA: e SOLUÇÃO: do copywriting gerado
        if (clean.match(/^PROBLEMA[S]?:/i)) {
          const problemText = clean.replace(/^PROBLEMA[S]?:\s*/i, '').trim();
          if (problemText) {
            problems.push(problemText);
            console.log(`➕ [AUTHORITY] PROBLEMA detectado: ${problemText.substring(0, 50)}`);
          }
          continue;
        }
        
        if (clean.match(/^SOLU[ÇC][ÃA]O[ES]?:/i)) {
          const solutionText = clean.replace(/^SOLU[ÇC][ÃA]O[ES]?:\s*/i, '').trim();
          if (solutionText) {
            solutions.push(solutionText);
            console.log(`➕ [AUTHORITY] SOLUÇÃO detectada: ${solutionText.substring(0, 50)}`);
          }
          continue;
        }
        
        // ✅ PRIORIDADE 2: Heurística baseada em conteúdo (mais genérica)
        const lower = clean.toLowerCase();
        if (lower.includes('problema') || lower.includes('dificuldade') || lower.includes('dor') || 
            lower.includes('falta') || lower.includes('sem ') || lower.includes('difícil')) {
          problems.push(clean);
        } else if (lower.includes('solução') || lower.includes('resolve') || lower.includes('elimina') ||
                   lower.includes('proporciona') || lower.includes('garante') || lower.includes('oferece')) {
          solutions.push(clean);
        } else {
          fallback += clean + ' ';
        }
      }
    }

    // ✅ FALLBACK: Se não encontrou padrões explícitos, usar heurística de posição
    if (problems.length === 0 && solutions.length === 0 && fallback.trim()) {
      console.log('⚠️ [AUTHORITY] Padrões PROBLEMA:/SOLUÇÃO: não encontrados, usando heurística de posição...');
      const sentences = fallback.split(/[.!?]+/).filter(s => s.trim().length > 10);
      
      // Primeiras 3 frases = problemas, últimas 3 = soluções
      const mid = Math.ceil(sentences.length / 2);
      problems = sentences.slice(0, Math.min(3, mid)).map(s => s.trim());
      solutions = sentences.slice(mid, mid + 3).map(s => s.trim());
      console.log(`✅ [AUTHORITY] Heurística: ${problems.length} problemas + ${solutions.length} soluções`);
    }

    let organized = '';
    if (problems.length > 0) organized += 'PROBLEMAS: ' + problems.join('. ') + '. ';
    if (solutions.length > 0) organized += 'SOLUÇÕES: ' + solutions.join('. ') + '.';
    if (!organized.trim() && fallback.trim()) organized = fallback.trim();
    
    // ✅ FALLBACK FINAL: Se não encontrou nada, tentar extrair benefícios como fallback
    if (!organized.trim()) {
      console.log('⚠️ [AUTHORITY] Nenhum conteúdo encontrado, tentando fallback de benefícios...');
      const benefitsFallback = this.extractBenefitsFromCopywriting(copywriting);
      if (benefitsFallback && benefitsFallback.length > 10) {
        organized = benefitsFallback;
        console.log(`✅ [AUTHORITY] Usando benefícios como fallback (${organized.length} chars)`);
      } else {
        // Fallback genérico final
        organized = 'Produto de alta qualidade que resolve seus problemas do dia a dia com eficiência e praticidade.';
        console.log('⚠️ [AUTHORITY] Usando fallback genérico');
      }
    }
    
    console.log(`✅ [AUTHORITY] Resultado final (${organized.length} chars): ${organized.substring(0, 100)}...`);
    return organized.trim();
  }

  // ✅ NOVO: Extrator para BENEFÍCIOS do copywriting (fallback para authority)
  private extractBenefitsFromCopywriting(copywriting: string): string {
    if (!copywriting) return '';
    
    const lines = copywriting.split('\n');
    let inSection = false;
    const benefits: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      const lowerTrimmed = trimmed.toLowerCase();

      // Detectar seção 5 - Principais Benefícios
      if (!inSection && 
          (trimmed.match(/^[#*]*\s*5\./) || 
           lowerTrimmed.includes('principais benefícios') ||
           lowerTrimmed.includes('benefícios para o cliente'))) {
        inSection = true;
        continue;
      }

      // Fim da seção (próxima seção numerada)
      if (inSection && trimmed.match(/^[#*]*\s*[6-9]\./)) break;

      if (!inSection) continue;

      // Itens de lista
      if (trimmed.match(/^[-*•]\s/) || trimmed.match(/^\d+\.\s/)) {
        let item = trimmed
          .replace(/^[-*•]\s/, '')
          .replace(/^\d+\.\s/, '')
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .trim();
        if (item.length > 5) {
          benefits.push(item);
        }
      }
    }

    if (benefits.length === 0) {
      // Fallback: qualquer linha com bullet points
      const allItems = lines
        .filter(l => l.trim().match(/^[-*•]\s/))
        .map(l => l.replace(/^[-*•]\s/, '').replace(/\*\*/g, '').trim())
        .filter(l => l.length > 10);
      
      if (allItems.length > 0) {
        return allItems.slice(0, 5).join('. ') + '.';
      }
    }

    return benefits.slice(0, 5).join('. ') + (benefits.length > 0 ? '.' : '');
  }

  // ✅ NOVO: Extrator para ESPECIFICAÇÕES TÉCNICAS do topicos_conversao
  private extractTechnicalSpecsFromTopicos(topicosConversao: string): string[] {
    if (!topicosConversao) return [];
    
    console.log(`🔍 [SPECS EXTRACTOR] Buscando ESPECIFICAÇÕES TÉCNICAS no topicos_conversao...`);
    
    // Encontrar seção "📋 ESPECIFICAÇÕES TÉCNICAS" ou variações
    const specsPatterns = [
      /📋\s*\*?\*?ESPECIFICAÇÕES\s*TÉCNICAS\*?\*?\s*([\s\S]*?)(?=\*\*[✨🛒💡🎯🔥⚡]|\*\*[A-Z]{2,}|$)/i,
      /ESPECIFICAÇÕES\s*TÉCNICAS\*?\*?\s*([\s\S]*?)(?=\*\*[✨🛒💡🎯🔥⚡]|\*\*[A-Z]{2,}|$)/i,
      /📋\s*([\s\S]*?)(?=\*\*[✨🛒💡🎯🔥⚡]|\*\*[A-Z]{2,}|$)/i
    ];
    
    let specsText = '';
    for (const pattern of specsPatterns) {
      const match = topicosConversao.match(pattern);
      if (match && match[1]) {
        specsText = match[1].trim();
        console.log(`✅ [SPECS EXTRACTOR] Encontrou seção de specs (${specsText.length} chars)`);
        break;
      }
    }
    
    if (!specsText) {
      console.log(`⚠️ [SPECS EXTRACTOR] Seção ESPECIFICAÇÕES TÉCNICAS não encontrada`);
      return [];
    }
    
    // Extrair itens - formato: "- Dimensões: 40 cm de diâmetro x 4 cm de altura"
    const items: string[] = [];
    const lines = specsText.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Pular linhas vazias ou títulos
      if (!trimmed || trimmed.startsWith('**') || trimmed.startsWith('##')) continue;
      
      // Capturar itens com formato "- Chave: Valor" ou "• Chave: Valor"
      const itemMatch = trimmed.match(/^[-•*]\s*(.+)$/);
      if (itemMatch && itemMatch[1]) {
        const item = itemMatch[1].trim();
        // Verificar se parece com especificação (tem ":" ou é descritivo)
        if (item.includes(':') || item.length > 10) {
          items.push(item);
          console.log(`📋 [SPECS EXTRACTOR] Item: ${item}`);
        }
      }
    }
    
    console.log(`✅ [SPECS EXTRACTOR] Total: ${items.length} especificações extraídas`);
    return items; // SEM LIMITE - retorna todas as especificações
  }

  /**
   * Extrai ESPECIFICAÇÕES TÉCNICAS + PRINCIPAIS BENEFÍCIOS do topicos_conversao
   * Retorna ambas as seções para exibição combinada no gerador features
   */
  private extractSpecsAndBenefitsFromTopicos(topicosConversao: string): { specs: string[]; benefits: string[] } {
    if (!topicosConversao) return { specs: [], benefits: [] };
    
    console.log(`🔍 [COMBINED EXTRACTOR] Buscando ESPECIFICAÇÕES + BENEFÍCIOS...`);
    
    // 1. Extrair ESPECIFICAÇÕES TÉCNICAS
    const specsPatterns = [
      /📋\s*\*?\*?ESPECIFICAÇÕES\s*TÉCNICAS\*?\*?\s*([\s\S]*?)(?=\*\*[✨🛒💡🎯]|✨|$)/i,
      /ESPECIFICAÇÕES\s*TÉCNICAS\*?\*?\s*([\s\S]*?)(?=\*\*[✨🛒💡🎯]|✨|$)/i,
      /\*\*📋\s*ESPECIFICAÇÕES\s*TÉCNICAS\*\*\s*([\s\S]*?)(?=\*\*[✨🛒💡🎯]|✨|$)/i
    ];
    
    let specsText = '';
    for (const pattern of specsPatterns) {
      const match = topicosConversao.match(pattern);
      if (match && match[1]) {
        specsText = match[1].trim();
        console.log(`✅ [COMBINED EXTRACTOR] Encontrou seção de specs (${specsText.length} chars)`);
        break;
      }
    }
    
    // 2. Extrair PRINCIPAIS BENEFÍCIOS
    const benefitsPatterns = [
      // Prioridade 1: Com emoji ✨ (sem asteriscos) - captura até próxima seção com emoji
      /✨\s*PRINCIPAIS\s*BENEFÍCIOS\s*\n([\s\S]*?)(?=\n[🛒💡🎯📋🔍]|\n\*\*|$)/i,
      
      // Prioridade 2: Com asteriscos markdown
      /\*\*✨?\s*PRINCIPAIS\s*BENEFÍCIOS\*\*\s*([\s\S]*?)(?=\n[🛒💡🎯📋🔍]|\n\*\*|$)/i,
      
      // Prioridade 3: Sem emoji, formato simples
      /PRINCIPAIS\s*BENEFÍCIOS[:\s]*\n([\s\S]*?)(?=\n[🛒💡🎯📋🔍✨]|\n\*\*|$)/i
    ];
    
    let benefitsText = '';
    for (const pattern of benefitsPatterns) {
      const match = topicosConversao.match(pattern);
      if (match && match[1]) {
        benefitsText = match[1].trim();
        console.log(`✅ [COMBINED EXTRACTOR] Encontrou seção de benefits (${benefitsText.length} chars)`);
        break;
      }
    }
    
    // Log de warning se não encontrar benefícios
    if (!benefitsText) {
      console.warn(`⚠️ [COMBINED EXTRACTOR] Nenhuma seção de BENEFÍCIOS encontrada no texto!`);
      console.log(`📝 Amostra do texto para análise:\n${topicosConversao.substring(0, 300)}...`);
    }
    
    // 3. Parsear linhas de cada seção
    const parseItems = (text: string): string[] => {
      const items: string[] = [];
      const lines = text.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        // Pular linhas vazias, headers markdown, ou linhas que são títulos de seção
        if (!trimmed || trimmed.startsWith('**') || trimmed.startsWith('##') || 
            trimmed.startsWith('###') || /^[🛒💡🎯📋🔍✨✅❓]/.test(trimmed)) continue;
        
        // Capturar itens com bullet points (-•*✓✔) ou checkmarks (✅)
        const itemMatch = trimmed.match(/^[-•*✓✔✅]\s*(.+)$/);
        if (itemMatch && itemMatch[1]) {
          const item = itemMatch[1].trim();
          if (item.length > 5) { // Mínimo de caracteres
            items.push(item);
          }
        }
      }
      return items;
    };
    
    const specs = parseItems(specsText);
    const benefits = parseItems(benefitsText);
    
    console.log(`✅ [COMBINED EXTRACTOR] Total: ${specs.length} specs + ${benefits.length} benefits`);
    
    return { specs, benefits };
  }

  private detectIndividualFormat(content: string): boolean {
    // Formato individual tem padrões como **✨ PRINCIPAIS BENEFÍCIOS** 
    // Formato unificado tem padrões como #### 3. Benefícios
    const individualPatterns = [
      /\*\*[🎯✨⚡🛒🚨❓💡📋]/,
      /\*\*PRINCIPAIS\s*BENEFÍCIOS\*\*/i,
      /\*\*GARANTA\s*JÁ\*\*/i,
      /\*\*IDEAL\s*PARA\*\*/i,
      /\*\*ESPECIFICAÇÕES\*\*/i
    ];
    
    const unifiedPatterns = [
      /####\s*[0-9]+\./,
      /[0-9]+\.\s*\*\*/
    ];
    
    const individualMatches = individualPatterns.reduce((count, pattern) => 
      count + (content.match(pattern) ? 1 : 0), 0);
    
    const unifiedMatches = unifiedPatterns.reduce((count, pattern) => 
      count + (content.match(pattern) ? 1 : 0), 0);
    
    console.log(`🔍 === FORMAT DETECTION === Individual: ${individualMatches}, Unificado: ${unifiedMatches}`);
    
    return individualMatches > unifiedMatches;
  }

  private tryIntelligentFallback(content: string, section: string, skipFallback = false): string {
    console.log(`🔄 === INTELLIGENT FALLBACK === Tentando fallback para '${section}'`);
    
    // Evitar recursão infinita
    if (skipFallback) {
      console.log(`🚫 === FALLBACK === Skipando fallback para evitar recursão infinita`);
      return '';
    }
    
    // Mapeamento de fallback inteligente por proximidade semântica
    const fallbackMapping = {
      'faq': ['benefits', 'features'], // FAQ pode usar benefícios ou especificações
      'cta': ['urgency'], // CTA pode usar urgência
      'conversion': ['benefits', 'urgency'], // Conversão pode usar benefícios ou urgência
      'urgency': ['cta'], // Urgência pode usar CTA
      'benefits': ['features'], // Benefícios pode usar características
      'features': ['benefits'] // Características pode usar benefícios
    };
    
    const fallbackSections = fallbackMapping[section as keyof typeof fallbackMapping] || [];
    
    for (const fallbackSection of fallbackSections) {
      console.log(`🔄 === FALLBACK === Tentando extrair '${fallbackSection}' como fallback para '${section}'`);
      const fallbackText = this.extractSectionFromCopywritingDirect(content, fallbackSection);
      if (fallbackText && fallbackText.length > 0) {
        console.log(`✅ === FALLBACK === Sucesso! Usando '${fallbackSection}' para '${section}'`);
        return fallbackText;
      }
    }
    
    console.log(`❌ === FALLBACK === Nenhum fallback encontrado para '${section}'`);
    return '';
  }

  private extractSectionFromCopywritingDirect(content: string, section: string): string {
    // Versão direta sem fallback para evitar recursão
    const lines = content.split('\n');
    let sectionText = '';
    let inTargetSection = false;
    
    const sectionNumbers = {
      'intro': ['1', '2'],
      'authority': ['2', '4'],
      'benefits': ['3', '5'],
      'urgency': ['4', '5', '6'],
      'cta': ['5', '6', '7'],
      'faq': ['6', '7', '8'],
      'conversion': ['7', '8', '9'],
      'features': ['8', '9', '3']
    };
    
    const numbers = sectionNumbers[section as keyof typeof sectionNumbers] || [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!inTargetSection) {
        for (const num of numbers) {
          const patterns = [
            new RegExp(`^${num}\\.\s*\\*\\*.*${this.getSectionKeywords(section)}.*\\*\\*`, 'i'),
            new RegExp(`^${num}\\.\s*\\*\\*[^*]*\\*\\*`, 'i'),
            new RegExp(`^${num}\\.\s*[^*]*${this.getSectionKeywords(section)}`, 'i')
          ];
          
          if (patterns.some(pattern => pattern.test(line))) {
            inTargetSection = true;
            break;
          }
        }
        continue;
      }
      
      if (inTargetSection) {
        if (line.match(/^\d+\.\s*\*\*/)) {
          break;
        }
        
        if (line && !line.startsWith('#') && line.length > 0) {
          const cleanLine = line
            .replace(/^\*\*|\*\*$/g, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/^[-*•]\s*/, '')
            .replace(/^[🎯✨⚡🛒🚨❓💡📋]\s*/, '')
            .trim();
          
          if (cleanLine) {
            sectionText += cleanLine + ' ';
          }
        }
      }
    }
    
    return sectionText.trim();
  }

  private async createImageWithTextOptimized(baseImageUrl: string, overlayText: string, productName: string, generatorType: string): Promise<string> {
    console.log('🎨 [OPTIMIZED] Criando imagem com texto (renderização otimizada):', { baseImageUrl: baseImageUrl.substring(0, 50), overlayText: overlayText.substring(0, 50), generatorType });
    
    try {
      // Import cache service
      const { cacheService } = await import('./CacheService');
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Não foi possível obter contexto do canvas');
      }
      
      // Configurar tamanho do canvas 1000x1000
      canvas.width = 1000;
      canvas.height = 1000;
      
      // Carregar imagem base com cache otimizado
      const img = await cacheService.loadImageSecure(baseImageUrl);
      
      // Usar requestAnimationFrame para renderização não-bloqueante
      return new Promise((resolve, reject) => {
        requestAnimationFrame(() => {
          try {
            // Desenhar imagem base
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            console.log('✅ [OPTIMIZED] Imagem base desenhada');

            // Criar gradiente overlay (idêntico aos geradores manuais)
            const gradient = ctx.createLinearGradient(0, canvas.height * 0.5, 0, canvas.height);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
            gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.7)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            console.log('✅ [OPTIMIZED] Gradiente aplicado');

            // Obter configurações específicas do gerador
            const advancedConfig = this.getAdvancedTextConfig(generatorType);
            
            // Configurações da caixa (específicas por tipo de gerador)
            const boxX = 40;
            const boxWidth = canvas.width - 80;
            const boxHeight = advancedConfig.boxHeight;
            const boxY = canvas.height - (boxHeight + 50);
            
            // Fundo da caixa semi-transparente (idêntico ao manual)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
            
            // Borda da caixa (cor específica por tipo)
            ctx.strokeStyle = advancedConfig.borderColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
            
            // Renderização específica para authority (dor x solução)
            if (generatorType === 'authority') {
              this.renderAuthorityText(ctx, boxX, boxY, boxWidth, boxHeight, overlayText, advancedConfig);
            } else {
              // Renderização padrão para outros tipos
              this.renderStandardText(ctx, boxX, boxY, boxWidth, boxHeight, overlayText, advancedConfig, generatorType);
            }
            
            console.log('✅ [OPTIMIZED] Texto renderizado');
            
            resolve(canvas.toDataURL('image/png'));
          } catch (error) {
            reject(error);
          }
        });
      });
      
    } catch (error) {
      console.error('❌ [OPTIMIZED] Erro ao criar imagem com texto:', error);
      throw error;
    }
  }

  // Original method kept for backwards compatibility
  private async createImageWithText(baseImageUrl: string, overlayText: string, productName: string, generatorType: string): Promise<string> {
    console.log('🎨 Criando imagem com texto (renderização avançada):', { baseImageUrl, overlayText: overlayText.substring(0, 50), generatorType });
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Não foi possível obter contexto do canvas');
      }
      
      // Configurar tamanho do canvas 1000x1000
      canvas.width = 1000;
      canvas.height = 1000;
      
      // Carregar imagem base
      const img = await this.loadImageSecure(baseImageUrl);
      
      // Desenhar imagem base
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      console.log('✅ Imagem base desenhada');

      // Criar gradiente overlay (idêntico aos geradores manuais)
      const gradient = ctx.createLinearGradient(0, canvas.height * 0.5, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
      gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.7)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      console.log('✅ Gradiente aplicado');

      // Obter configurações específicas do gerador
      const advancedConfig = this.getAdvancedTextConfig(generatorType);
      
      // Configurações da caixa (específicas por tipo de gerador)
      const boxX = 40;
      const boxWidth = canvas.width - 80;
      const boxHeight = advancedConfig.boxHeight;
      const boxY = canvas.height - (boxHeight + 50);  // Ajustar posição baseado na altura
      
      // Fundo da caixa semi-transparente (idêntico ao manual)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
      
      // Borda da caixa (cor específica por tipo)
      ctx.strokeStyle = advancedConfig.borderColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      
      // Renderização específica para authority (dor x solução)
      if (generatorType === 'authority') {
        this.renderAuthorityText(ctx, boxX, boxY, boxWidth, boxHeight, overlayText, advancedConfig);
      } else {
        // Renderização padrão para outros tipos
        this.renderStandardText(ctx, boxX, boxY, boxWidth, boxHeight, overlayText, advancedConfig, generatorType);
      }
      
      console.log('✅ Texto renderizado');
      
      return canvas.toDataURL('image/png');
      
    } catch (error) {
      console.error('❌ Erro ao criar imagem com texto:', error);
      throw error;
    }
  }

  private async loadImageSecure(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      console.log('📷 Carregando imagem via blob para evitar taint:', src);
      
      const loadViaBlob = async (url: string) => {
        try {
          const response = await fetch(url, {
            mode: 'cors',
            cache: 'no-cache', 
            credentials: 'omit'
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          
          const img = document.createElement('img');
          img.onload = () => {
            console.log('✅ Imagem carregada via blob:', img.width, 'x', img.height);
            URL.revokeObjectURL(objectUrl);
            resolve(img);
          };
          img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error(`Falha ao carregar imagem: ${src}`));
          };
          
          img.src = objectUrl;
          
        } catch (fetchError) {
          console.log('🔄 Tentando carregamento direto...');
          const img = document.createElement('img');
          
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Falha ao carregar imagem: ${src}`));
          
          if (!src.includes('.r2.dev')) {
            img.crossOrigin = 'anonymous';
          }
          
          img.src = src;
        }
      };
      
      loadViaBlob(src);
    });
  }

  private getAdvancedTextConfig(generatorType: string) {
    // Configs exatos dos geradores manuais para paridade visual completa
    const configs = {
      intro: {
        title: '🎯 Descubra Os Segredos:',
        borderColor: 'rgba(59, 130, 246, 0.5)', // blue - EXATO do manual
        boxHeight: 250
      },
      authority: {
        title: '💡 VANTAGENS DO PRODUTO',
        borderColor: 'rgba(147, 51, 234, 0.5)', // purple - EXATO do manual
        boxHeight: 320
      },
      benefits: {
        title: '🎯 Benefícios:',
        borderColor: 'rgba(34, 197, 94, 0.5)', // green - EXATO do manual
        boxHeight: 250
      },
      urgency: {
        title: '⚡ Últimas Unidades Disponíveis:',
        borderColor: 'rgba(239, 68, 68, 0.5)', // red - EXATO do manual
        boxHeight: 250
      },
      cta: {
        title: '✨ Não Perca Esta Oportunidade:',
        borderColor: 'rgba(251, 146, 60, 0.5)', // orange - EXATO do manual
        boxHeight: 250
      },
      faq: {
        title: '❓ Perguntas Frequentes:',
        borderColor: 'rgba(99, 102, 241, 0.5)', // indigo - EXATO do manual
        boxHeight: 250
      },
      conversion: {
        title: '🎯 DESCRIÇÃO',
        borderColor: 'rgba(34, 197, 94, 0.6)', // green strong - EXATO do manual
        boxHeight: 320
      },
      features: {
        title: 'Características:',
        borderColor: 'rgba(16, 185, 129, 0.5)', // emerald - EXATO do manual
        boxHeight: 420 // Aumentado para acomodar fontes maiores
      }
    };

    return configs[generatorType] || configs.intro;
  }

  /**
   * Remove palavras indesejadas do texto (dor, solução, problema, etc.)
   */
  private cleanUnwantedWords(text: string): string {
    return text
      .replace(/\bdor\s*x\s*solução\b/gi, '')
      .replace(/\bdor\b/gi, '')
      .replace(/\bproblema[s]?\b:?\s*/gi, '')
      .replace(/\bsolução\b:?\s*/gi, '')
      .replace(/\bsoluções\b:?\s*/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  private renderAuthorityText(ctx: CanvasRenderingContext2D, boxX: number, boxY: number, boxWidth: number, boxHeight: number, text: string, config: any) {
    console.log('🎨 Renderizando texto de AUTHORITY - EXATO do manual...');
    
    let currentY = boxY + 25;
    const lineHeight = 18;
    const maxWidth = boxWidth - 60;

    // Título EXATO do manual
    ctx.font = 'bold 16px Inter, Arial, sans-serif';
    ctx.fillStyle = '#ff6b6b'; // vermelho para chamar atenção - EXATO do manual
    ctx.fillText('💡 VANTAGENS DO PRODUTO', boxX + 20, currentY);
    currentY += 30;

    // Processar o texto organizando em frases separadas - IGUAL ao manual
    if (text.includes('PROBLEMAS:') && text.includes('SOLUÇÕES:')) {
      // Texto já organizado - desenhar seções separadas
      const parts = text.split('SOLUÇÕES:');
      const problemsPart = this.cleanUnwantedWords(parts[0].replace('PROBLEMAS:', '').trim());
      const solutionsPart = parts[1] ? this.cleanUnwantedWords(parts[1].trim()) : '';

      // Desenhar seção de NECESSIDADES - EXATO do manual
      ctx.font = 'bold 14px Inter, Arial, sans-serif';
      ctx.fillStyle = '#fbbf24'; // amarelo para necessidades - EXATO do manual
      ctx.fillText('📋 NECESSIDADES:', boxX + 20, currentY);
      currentY += 22;

      ctx.font = '12px Inter, Arial, sans-serif';
      ctx.fillStyle = '#fef3c7';
      
      // Quebrar problemas em frases curtas - EXATO do manual
      const problemSentences = problemsPart.split('.').filter(s => s.trim().length > 10);
      
      problemSentences.slice(0, 3).forEach((sentence, index) => {
        let cleanSentence = this.cleanUnwantedWords(sentence.trim());
        if (cleanSentence) {
          // Quebrar frases longas em múltiplas linhas se necessário - EXATO do manual
          const words = cleanSentence.split(' ');
          let currentLine = '• ';
          
          for (let word of words) {
            const testLine = currentLine + word + ' ';
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine !== '• ') {
              ctx.fillText(currentLine.trim(), boxX + 25, currentY);
              currentY += lineHeight;
              currentLine = '  ' + word + ' ';
            } else {
              currentLine = testLine;
            }
          }
          
          if (currentLine.trim() !== '•') {
            ctx.fillText(currentLine.trim(), boxX + 25, currentY);
            currentY += lineHeight + 3;
          }
        }
      });
      
      currentY += 10;

      // Desenhar seção de BENEFÍCIOS - EXATO do manual
      if (solutionsPart) {
        ctx.font = 'bold 14px Inter, Arial, sans-serif';
        ctx.fillStyle = '#22c55e'; // verde para benefícios - EXATO do manual
        ctx.fillText('✅ BENEFÍCIOS:', boxX + 20, currentY);
        currentY += 22;

        ctx.font = '12px Inter, Arial, sans-serif';
        ctx.fillStyle = '#dcfce7';
        
        // Quebrar soluções em frases curtas - EXATO do manual
        const solutionSentences = solutionsPart.split('.').filter(s => s.trim().length > 10);
        
        solutionSentences.slice(0, 3).forEach((sentence, index) => {
          let cleanSentence = this.cleanUnwantedWords(sentence.trim());
          if (cleanSentence) {
            // Quebrar frases longas em múltiplas linhas se necessário - EXATO do manual
            const words = cleanSentence.split(' ');
            let currentLine = '• ';
            
            for (let word of words) {
              const testLine = currentLine + word + ' ';
              const metrics = ctx.measureText(testLine);
              
              if (metrics.width > maxWidth && currentLine !== '• ') {
                ctx.fillText(currentLine.trim(), boxX + 25, currentY);
                currentY += lineHeight;
                currentLine = '  ' + word + ' ';
              } else {
                currentLine = testLine;
              }
            }
            
            if (currentLine.trim() !== '•') {
              ctx.fillText(currentLine.trim(), boxX + 25, currentY);
              currentY += lineHeight + 3;
            }
          }
        });
      }
    } else {
      // Texto não organizado - quebrar em frases bem estruturadas - EXATO do manual
      ctx.font = '13px Inter, Arial, sans-serif';
      ctx.fillStyle = '#ffffff';

      // Dividir o texto em frases
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 15);
      
      sentences.slice(0, 6).forEach((sentence, index) => {
        const cleanSentence = sentence.trim();
        if (cleanSentence) {
          const words = cleanSentence.split(' ');
          let currentLine = '• ';
          
          for (let word of words) {
            const testLine = currentLine + word + ' ';
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine !== '• ') {
              ctx.fillText(currentLine.trim(), boxX + 25, currentY);
              currentY += lineHeight;
              currentLine = '  ' + word + ' ';
            } else {
              currentLine = testLine;
            }
          }
          
          if (currentLine.trim() !== '•') {
            ctx.fillText(currentLine.trim(), boxX + 25, currentY);
            currentY += lineHeight + 3;
          }
        }
      });
    }
  }

  private renderStandardText(ctx: CanvasRenderingContext2D, boxX: number, boxY: number, boxWidth: number, boxHeight: number, text: string, config: any, generatorType?: string) {
    console.log(`🎨 Renderizando texto padrão para ${generatorType} - EXATO do manual...`);
    
    let currentY = boxY + 25;
    const lineHeight = 22;
    const maxWidth = boxWidth - 60;

    // Configurações específicas por tipo (EXATO dos manuais)
    if (generatorType === 'intro') {
      // INTRO - EXATO do ProductIntroImageGenerator
      ctx.font = 'bold 18px Inter, Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('🎯 Descubra Os Segredos:', boxX + 20, currentY);
      currentY += 30;

      // Configurar fonte para o texto principal
      ctx.font = '16px Inter, Arial, sans-serif';

      // Quebrar texto em linhas - EXATO do manual
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';

      for (let n = 0; n < words.length; n++) {
        const testLine = currentLine + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && currentLine !== '') {
          lines.push(currentLine.trim());
          currentLine = words[n] + ' ';
        } else {
          currentLine = testLine;
        }
      }
      
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }

      // Desenhar cada linha da introdução
      lines.slice(0, 9).forEach((line, index) => {
        ctx.fillText(line, boxX + 20, currentY + (index * lineHeight));
      });

    } else if (generatorType === 'benefits') {
      // BENEFITS - EXATO do ProductBenefitsImageGenerator
      ctx.font = 'bold 18px Inter, Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('🎯 Benefícios:', boxX + 20, currentY);
      currentY += 30;

      // Processar texto para organizar melhor e remover formatações - EXATO do manual
      let organizedText = text;
      
      // Remover todos os caracteres # e *
      organizedText = organizedText.replace(/[#*]/g, '');
      
      // Se o texto contém formatação, processar cada linha
      const lines = organizedText.split('\n').filter(line => line.trim());
      const processedLines = [];
      const emojis = ['✅', '⚡', '🔧', '🛡️', '💎', '🎯', '🚀', '⭐'];
      
      lines.forEach((line, index) => {
        if (line.trim()) {
          // Quebrar em frases separadas por ponto final
          const sentences = line.split('.').filter(s => s.trim());
          sentences.forEach((sentence, sentenceIndex) => {
            if (sentence.trim()) {
              const cleanSentence = sentence.trim() + (sentence.includes('?') ? '' : '.');
              const emoji = emojis[processedLines.length % emojis.length];
              processedLines.push(emoji + ' ' + cleanSentence);
            }
          });
        }
      });

      // Se não conseguiu processar, criar formato padrão
      if (processedLines.length === 0) {
        const sentences = organizedText.split('.').filter(s => s.trim());
        sentences.forEach((sentence, index) => {
          if (sentence.trim()) {
            const emoji = emojis[index % emojis.length];
            processedLines.push(emoji + ' ' + sentence.trim() + '.');
          }
        });
      }

      // Quebrar texto em linhas que cabem no canvas
      ctx.font = '16px Inter, Arial, sans-serif';
      const textLines = [];
      
      processedLines.forEach(paragraph => {
        if (!paragraph.trim()) return;
        
        const words = paragraph.split(' ');
        let currentLine = '';

        for (let n = 0; n < words.length; n++) {
          const testLine = currentLine + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && currentLine !== '') {
            textLines.push(currentLine.trim());
            currentLine = words[n] + ' ';
          } else {
            currentLine = testLine;
          }
        }
        
        if (currentLine.trim()) {
          textLines.push(currentLine.trim());
        }
      });

      // Renderizar as linhas limitando a 9 linhas (para dar espaço ao título)
      textLines.slice(0, 9).forEach((line, index) => {
        ctx.fillText(line, boxX + 20, currentY + (index * lineHeight));
      });

    } else if (generatorType === 'urgency') {
      // URGENCY - EXATO do ProductUrgencyImageGenerator
      ctx.font = 'bold 18px Inter, Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('⚡ Últimas Unidades Disponíveis:', boxX + 20, currentY);
      currentY += 30;

      // Configurar fonte para o texto principal EXATA do manual
      ctx.font = '16px Inter, Arial, sans-serif';

      const words = text.split(' ');
      const lines = [];
      let currentLine = '';
      const maxWidth = boxWidth - 60;
      const lineHeight = 22; // CORREÇÃO: usar line height exato do manual

      for (let n = 0; n < words.length; n++) {
        const testLine = currentLine + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && currentLine !== '') {
          lines.push(currentLine.trim());
          currentLine = words[n] + ' ';
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }

      // CORREÇÃO: Renderizar as linhas com espaçamento correto e limitação adequada
      lines.slice(0, 9).forEach((line, index) => {
        ctx.fillText(line, boxX + 20, currentY + (index * lineHeight));
      });

    } else if (generatorType === 'cta') {
      // CTA - EXATO do ProductCtaImageGenerator
      ctx.font = 'bold 18px Inter, Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('✨ Não Perca Esta Oportunidade:', boxX + 20, currentY);
      currentY += 30;

      // Processar texto para organizar melhor e remover formatações
      let organizedText = text;
      
      // Remover todos os caracteres # e *
      organizedText = organizedText.replace(/[#*]/g, '');
      
      // Quebrar em frases por ponto final e adicionar emojis
      const sentences = organizedText.split('.').filter(s => s.trim());
      const emojis = ['💥', '🎁', '⭐', '🔥', '💎', '🚀', '⚡', '🎯'];
      const processedLines = [];
      
      if (sentences.length > 1) {
        sentences.forEach((sentence, index) => {
          if (sentence.trim()) {
            const emoji = emojis[index % emojis.length];
            processedLines.push(emoji + ' ' + sentence.trim() + '.');
          }
        });
      } else {
        const emoji = emojis[0];
        processedLines.push(emoji + ' ' + organizedText);
      }

      // Quebrar texto em linhas que cabem no canvas
      ctx.font = '16px Inter, Arial, sans-serif';
      const textLines = [];
      
      processedLines.forEach(paragraph => {
        if (!paragraph.trim()) return;
        
        const words = paragraph.split(' ');
        let currentLine = '';

        for (let n = 0; n < words.length; n++) {
          const testLine = currentLine + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && currentLine !== '') {
            textLines.push(currentLine.trim());
            currentLine = words[n] + ' ';
          } else {
            currentLine = testLine;
          }
        }
        
        if (currentLine.trim()) {
          textLines.push(currentLine.trim());
        }
      });

      // Renderizar as linhas limitando a 9 linhas (para dar espaço ao título)
      textLines.slice(0, 9).forEach((line, index) => {
        ctx.fillText(line, boxX + 20, currentY + (index * lineHeight));
      });

    } else if (generatorType === 'faq') {
      // FAQ - EXATO do ProductFaqImageGenerator
      ctx.font = 'bold 18px Inter, Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('❓ Perguntas Frequentes:', boxX + 20, currentY);
      currentY += 28;

      // Processar texto para organizar melhor e remover formatações
      let organizedText = text;
      
      // Remover todos os caracteres # e *
      organizedText = organizedText.replace(/[#*]/g, '');
      
      // Processar FAQ em formato pergunta-resposta
      const lines = organizedText.split('\n').filter(line => line.trim());
      const processedLines = [];
      const questionEmojis = ['🤔', '💡', '🔧', '📦', '⚠️', '🛡️', '✅', '❓'];
      
      for (let i = 0; i < lines.length; i += 2) { // Processa pares de pergunta-resposta
        const question = lines[i]?.trim();
        const answer = lines[i + 1]?.trim();
        
        if (question) {
          // Adicionar emoji à pergunta
          const emoji = questionEmojis[Math.floor(i / 2) % questionEmojis.length];
          processedLines.push({
            text: emoji + ' ' + question,
            type: 'question'
          });
          
          // Se houver resposta, adicionar com emoji de check
          if (answer) {
            processedLines.push({
              text: '✅ ' + answer,
              type: 'answer'
            });
          }
        }
      }

      // Quebrar texto em linhas que cabem no canvas
      ctx.font = '14px Inter, Arial, sans-serif';
      const textLines = [];
      
      processedLines.forEach(item => {
        if (!item.text.trim()) return;
        
        const words = item.text.split(' ');
        let currentLine = '';

        for (let n = 0; n < words.length; n++) {
          const testLine = currentLine + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && currentLine !== '') {
            textLines.push({
              text: currentLine.trim(),
              type: item.type
            });
            currentLine = words[n] + ' ';
          } else {
            currentLine = testLine;
          }
        }
        
        if (currentLine.trim()) {
          textLines.push({
            text: currentLine.trim(),
            type: item.type
          });
        }
      });

      // Renderizar as linhas com cores específicas EXATAS do manual
      textLines.slice(0, 10).forEach((line, index) => {
        if (line.type === 'question') {
          ctx.font = 'bold 15px Inter, Arial, sans-serif';
          ctx.fillStyle = '#ffffff'; // CORREÇÃO: branco para perguntas como no manual
        } else {
          ctx.font = '14px Inter, Arial, sans-serif';
          ctx.fillStyle = '#e0e0e0'; // CORREÇÃO: cinza claro para respostas como no manual
        }
        ctx.fillText(line.text, boxX + 20, currentY + (index * 20));
      });

    } else if (generatorType === 'conversion') {
      // CONVERSION - EXATO do ProductConversionImageGenerator
      console.log('🎨 Renderizando CONVERSION com 3 seções...');
      
      let currentYPos = boxY + 20;
      const lineHeight = 18;
      const maxWidth = boxWidth - 40;

      // Processar o texto em 3 seções: descrição, especificações e benefícios
      const lines = text.split('\n').filter(line => line.trim());
      let description = '';
      let specifications = '';
      let benefits = '';
      let currentSection = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.includes('DESCRIÇÃO') || trimmedLine.includes('Descrição')) {
          currentSection = 'description';
          continue;
        }
        if (trimmedLine.includes('ESPECIFICAÇÕES') || trimmedLine.includes('Especificações')) {
          currentSection = 'specifications';
          continue;
        }
        if (trimmedLine.includes('BENEFÍCIOS') || trimmedLine.includes('Benefícios')) {
          currentSection = 'benefits';
          continue;
        }
        
        if (trimmedLine && trimmedLine.length > 3) {
          const cleanText = trimmedLine.replace(/^[•\-\*]\s*/, '').trim();
          if (cleanText) {
            if (currentSection === 'description') {
              description += cleanText + ' ';
            } else if (currentSection === 'specifications') {
              specifications += cleanText + '\n';
            } else if (currentSection === 'benefits') {
              benefits += cleanText + '\n';
            }
          }
        }
      }

      // 1. DESCRIÇÃO
      if (description) {
        ctx.font = 'bold 16px Inter, Arial, sans-serif';
        ctx.fillStyle = '#22c55e'; // verde
        ctx.fillText('🎯 DESCRIÇÃO', boxX + 20, currentYPos);
        currentYPos += 30;

        ctx.font = '14px Inter, Arial, sans-serif';
        ctx.fillStyle = '#ffffff';
        
        const descWords = description.split(' ');
        const descLines = [];
        let currentLine = '';

        for (let n = 0; n < descWords.length; n++) {
          const testLine = currentLine + descWords[n] + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && currentLine !== '') {
            descLines.push(currentLine.trim());
            currentLine = descWords[n] + ' ';
          } else {
            currentLine = testLine;
          }
        }
        
        if (currentLine.trim()) {
          descLines.push(currentLine.trim());
        }

        descLines.slice(0, 3).forEach((line, index) => {
          ctx.fillText(line, boxX + 20, currentYPos + (index * lineHeight));
        });
        
        currentYPos += (Math.min(descLines.length, 3) * lineHeight) + 15;
      }

      // 2. ESPECIFICAÇÕES TÉCNICAS
      if (specifications) {
        ctx.font = 'bold 13px Inter, Arial, sans-serif';
        ctx.fillStyle = '#60a5fa'; // azul
        ctx.fillText('📋 ESPECIFICAÇÕES TÉCNICAS', boxX + 20, currentYPos);
        currentYPos += 18;

        ctx.font = '11px Inter, Arial, sans-serif';
        ctx.fillStyle = '#e5e7eb';
        
        const specLines = specifications.split('\n').filter(line => line.trim());
        const maxSpecLines = Math.min(specLines.length, 8);
        specLines.slice(0, maxSpecLines).forEach((line, index) => {
          const cleanLine = line.replace(/^[•\-\*]\s*/, '• ').trim();
          
          const words = cleanLine.split(' ');
          let currentLine = '';
          let yOffset = 0;
          
          for (let i = 0; i < words.length; i++) {
            const testLine = currentLine + words[i] + ' ';
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth - 25 && currentLine !== '') {
              ctx.fillText(currentLine.trim(), boxX + 25, currentYPos + (index * 13) + yOffset);
              currentLine = words[i] + ' ';
              yOffset += 13;
            } else {
              currentLine = testLine;
            }
          }
          
          if (currentLine.trim()) {
            ctx.fillText(currentLine.trim(), boxX + 25, currentYPos + (index * 13) + yOffset);
          }
        });
        
        currentYPos += (maxSpecLines * 13) + 10;
      }

      // 3. PRINCIPAIS BENEFÍCIOS
      if (benefits) {
        ctx.font = 'bold 13px Inter, Arial, sans-serif';
        ctx.fillStyle = '#fbbf24'; // amarelo/dourado
        ctx.fillText('✨ PRINCIPAIS BENEFÍCIOS', boxX + 20, currentYPos);
        currentYPos += 18;

        ctx.font = '12px Inter, Arial, sans-serif';
        ctx.fillStyle = '#e5e7eb';
        
        const benefitLines = benefits.split('\n').filter(line => line.trim());
        benefitLines.slice(0, 3).forEach((line, index) => {
          const cleanLine = line.replace(/^[•\-\*]\s*/, '• ');
          ctx.fillText(cleanLine, boxX + 25, currentYPos + (index * 15));
        });
      }

    } else if (generatorType === 'features') {
      // FEATURES - COM ESPECIFICAÇÕES + BENEFÍCIOS
      console.log('🎨 Renderizando FEATURES com 2 seções: SPECS + BENEFÍCIOS...');
      
      let currentYPos = boxY + 25;
      const lineHeight = 18;
      const maxTextWidth = boxWidth - 60;

      // Parsear texto estruturado (📋 ESPECIFICAÇÕES: + ✨ BENEFÍCIOS:)
      let specsLines: string[] = [];
      let benefitsLines: string[] = [];
      let currentSection = '';
      
      for (const line of text.split('\n')) {
        if (line.includes('ESPECIFICAÇÕES')) {
          currentSection = 'specs';
          continue;
        }
        if (line.includes('BENEFÍCIOS')) {
          currentSection = 'benefits';
          continue;
        }
        const trimmed = line.replace(/^[-•*]\s*/, '').trim();
        if (trimmed && trimmed.length > 3) {
          if (currentSection === 'specs') specsLines.push(trimmed);
          else if (currentSection === 'benefits') benefitsLines.push(trimmed);
        }
      }

      // Se não encontrou seções estruturadas, usar texto como specs legado
      if (specsLines.length === 0 && benefitsLines.length === 0) {
        specsLines = text.split('\n').filter(l => l.trim()).map(l => l.replace(/^[-•*]\s*/, '').trim());
      }

      console.log(`📋 [FEATURES] ${specsLines.length} specs + ${benefitsLines.length} benefits`);

      // 1. ESPECIFICAÇÕES TÉCNICAS (máximo 6 itens)
      if (specsLines.length > 0) {
        ctx.font = 'bold 18px Inter, Arial, sans-serif';
        ctx.fillStyle = '#60a5fa'; // azul
        ctx.fillText('📋 ESPECIFICAÇÕES TÉCNICAS', boxX + 20, currentYPos);
        currentYPos += 28;

        ctx.font = '14px Inter, Arial, sans-serif';
        ctx.fillStyle = '#e5e7eb';
        
        specsLines.slice(0, 6).forEach((line) => {
          const displayText = line.length > 70 ? line.substring(0, 67) + '...' : line;
          ctx.fillText('• ' + displayText, boxX + 25, currentYPos);
          currentYPos += lineHeight + 2;
        });
        
        currentYPos += 16;
      }

      // 2. PRINCIPAIS BENEFÍCIOS (máximo 4 itens)
      if (benefitsLines.length > 0) {
        ctx.font = 'bold 18px Inter, Arial, sans-serif';
        ctx.fillStyle = '#22c55e'; // verde
        ctx.fillText('✨ PRINCIPAIS BENEFÍCIOS', boxX + 20, currentYPos);
        currentYPos += 28;

        ctx.font = '14px Inter, Arial, sans-serif';
        ctx.fillStyle = '#dcfce7';
        
        benefitsLines.slice(0, 4).forEach((line) => {
          const displayText = line.length > 65 ? line.substring(0, 62) + '...' : line;
          ctx.fillText('• ' + displayText, boxX + 25, currentYPos);
          currentYPos += lineHeight + 4;
        });
      }

    } else {
      // DEFAULT - Renderização padrão
      ctx.font = 'bold 18px Inter, Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(config.title, boxX + 20, currentY);
      currentY += 30;

      // Texto principal
      ctx.font = '16px Inter, Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      
      const lines = this.wrapText(ctx, text, maxWidth);
      const remainingHeight = (boxY + boxHeight - 20) - currentY;
      const maxLines = Math.min(lines.length, Math.floor(remainingHeight / lineHeight));
      
      for (let i = 0; i < maxLines; i++) {
        ctx.fillText(lines[i], boxX + 20, currentY);
        currentY += lineHeight;
      }
    }
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  async processImageWithGenerator(input: GeneratorInput): Promise<GeneratorResult> {
    try {
      console.log(`🚀 [AI-GENERATOR] === DEBUG AUTOMAÇÃO === Processando com generatorType: '${input.generatorType}'`);
      console.log(`📋 [AI-GENERATOR] Input completo:`, {
        imageUrl: input.imageUrl.substring(0, 50) + '...',
        productId: input.productId,
        productName: input.productName,
        generatorType: input.generatorType
      });
      
      // 1. Usar a imagem fornecida (vem do AutoProcessor)
      const baseImageUrl = input.imageUrl;
      console.log(`✅ Usando imagem fornecida pelo AutoProcessor: ${baseImageUrl.substring(0, 50)}...`);
      
      // 2. Buscar texto de copywriting para esta seção específica
      console.log(`🔍 [AI-GENERATOR] === DEBUG === Buscando copywriting para seção: '${input.generatorType}'`);
      const copywritingText = await this.getCopywritingText(input.productId, input.generatorType);
      
      if (!copywritingText || copywritingText.trim().length === 0) {
        console.log(`❌ [AI-GENERATOR] === DEBUG === Nenhum texto de copywriting encontrado para: ${input.generatorType}`);
        console.log(`🔄 [AI-GENERATOR] === DEBUG === Fallback também falhou, retornando erro`);
        return { 
          success: false, 
          error: `Falha ao obter texto para a seção: ${input.generatorType}. Verifique se há copywriting disponível ou conectividade com a IA.`
        };
      }
      
      console.log(`✅ [AI-GENERATOR] === DEBUG === Texto encontrado para '${input.generatorType}' (${copywritingText.length} chars): ${copywritingText.substring(0, 100)}...`);
      
      // 3. Criar imagem com texto específico para o tipo de gerador
      const finalImageUrl = await this.createImageWithText(
        baseImageUrl,
        copywritingText,
        input.productName,
        input.generatorType
      );
      
      console.log(`✅ [AI-GENERATOR] === DEBUG === Imagem processada com sucesso para '${input.generatorType}'`);
      
      // Não disparar evento aqui - deixar o AutoProcessor disparar
      // para manter controle sobre batchId e source
      
      return { 
        success: true, 
        imageUrl: finalImageUrl
      };
      
    } catch (error) {
      console.error(`❌ [AI-GENERATOR] === DEBUG === Erro no processamento para '${input.generatorType}':`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido no processamento'
      };
    }
  }

  async batchProcessImages(inputs: GeneratorInput[]): Promise<GeneratorResult[]> {
    console.log(`🚀 Processamento em lote de ${inputs.length} imagens iniciado`);
    
    const results: GeneratorResult[] = [];
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      console.log(`📋 Processando imagem ${i + 1}/${inputs.length}: ${input.generatorType}`);
      
      try {
        const result = await this.processImageWithGenerator(input);
        results.push(result);
        
        // Pequena pausa entre processamentos para evitar sobrecarga
        if (i < inputs.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (error) {
        console.error(`❌ Erro no processamento da imagem ${i + 1}:`, error);
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }
    
    console.log(`✅ Processamento em lote concluído: ${results.filter(r => r.success).length}/${results.length} sucessos`);
    
    return results;
  }
}

export const aiGeneratorService = new AIGeneratorService();