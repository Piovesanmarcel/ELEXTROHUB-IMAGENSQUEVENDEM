
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UnifiedResultsData {
  hasUnifiedData: boolean;
  seoDescription: string;
  technicalSpecs: string;
  keywords: string;
  idealFor: string[];           // 💡 IDEAL PARA do Comando Unificado
  idealEnvironments: string[];  // 9. Ambientes Ideais do Copywriting
  targetAudience: string;       // Público-alvo
  mainKeywords: string[];       // Palavras-chave principais
  longTailKeywords: string[];   // Palavras-chave long-tail
}

export function useUnifiedCommandsData() {
  const [productsWithCommands, setProductsWithCommands] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProductsWithCommands();
  }, []);

  const loadProductsWithCommands = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('ai_unified_results')
        .select('product_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao carregar produtos com comandos:', error);
        setIsLoading(false);
        return;
      }

      const productIds = new Set(data?.map(item => item.product_id) || []);
      setProductsWithCommands(productIds);
      setIsLoading(false);
    } catch (error) {
      console.error('Erro inesperado ao carregar produtos com comandos:', error);
      setIsLoading(false);
    }
  };

  const getUnifiedDataForProduct = async (productId: string): Promise<UnifiedResultsData> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { 
          hasUnifiedData: false, 
          seoDescription: '', 
          technicalSpecs: '', 
          keywords: '',
          idealFor: [],
          idealEnvironments: [],
          targetAudience: '',
          mainKeywords: [],
          longTailKeywords: []
        };
      }

      // Buscar dados do Comando Unificado
      const { data, error } = await supabase
        .from('ai_unified_results')
        .select('results')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single();

      if (error || !data) {
        console.log('Nenhum dado do Comando Unificado encontrado para este produto');
        return { 
          hasUnifiedData: false, 
          seoDescription: '', 
          technicalSpecs: '', 
          keywords: '',
          idealFor: [],
          idealEnvironments: [],
          targetAudience: '',
          mainKeywords: [],
          longTailKeywords: []
        };
      }

      // === PROCESSAR COMANDO UNIFICADO ===
      const results = data.results as any;
      const topicosConversao = results?.topicos_conversao?.improvedText || '';
      const palavrasChave = results?.palavras_chave_seo?.improvedText || '';
      
      let seoDescription = '';
      let technicalSpecs = '';
      let idealFor: string[] = [];
      
      if (topicosConversao) {
        const parts = topicosConversao.split('📋 ESPECIFICAÇÕES TÉCNICAS');
        seoDescription = parts[0].replace('🔍 DESCRIÇÃO SEO OTIMIZADA', '').trim();
        technicalSpecs = parts[1] ? parts[1].trim() : '';
        
        // Extrair "💡 IDEAL PARA"
        const idealForMatch = topicosConversao.match(/💡 IDEAL PARA[:\s]*([\s\S]*?)(?=\n\n|📋|$)/i);
        if (idealForMatch) {
          idealFor = idealForMatch[1]
            .split(/[•\-\n]/)
            .map(item => item.trim())
            .filter(item => item.length > 5);
        }
      }

      // Extrair palavras-chave principais e long-tail
      let mainKeywords: string[] = [];
      let longTailKeywords: string[] = [];
      
      if (palavrasChave) {
        const keywordLines = palavrasChave.split('\n').map(l => l.trim()).filter(l => l);
        mainKeywords = keywordLines
          .filter(l => !l.toLowerCase().includes('long') && !l.toLowerCase().includes('cauda'))
          .map(l => l.replace(/^[•\-\d.]+/, '').trim())
          .filter(k => k.length > 2)
          .slice(0, 10);
        
        longTailKeywords = keywordLines
          .filter(l => l.toLowerCase().includes('long') || l.toLowerCase().includes('cauda'))
          .map(l => l.replace(/^[•\-\d.]+/, '').trim())
          .filter(k => k.length > 5)
          .slice(0, 10);
      }

      // === PROCESSAR COPYWRITING PROFISSIONAL ===
      let idealEnvironments: string[] = [];
      let targetAudience = '';
      
      // Buscar dados do copywriting do Comando Unificado
      const copywritingData = results?.copywriting;
      
      if (copywritingData) {
        console.log('📋 [COPYWRITING] Dados brutos encontrados:', typeof copywritingData);
        
        // Tentar extrair como string ou objeto
        let copyText = '';
        if (typeof copywritingData === 'string') {
          copyText = copywritingData;
        } else if (copywritingData?.improvedText) {
          copyText = copywritingData.improvedText;
        } else if (copywritingData?.text) {
          copyText = copywritingData.text;
        } else if (copywritingData?.generatedText) {
          copyText = copywritingData.generatedText;
        }
        
        if (copyText) {
          console.log('📋 [COPYWRITING] Texto encontrado, tamanho:', copyText.length);
          
          // MÚLTIPLOS PADRÕES para extrair Ambientes Ideais
          const ambientPatterns = [
            // Padrão 1: "9. Ambientes Ideais" com lista inline
            /9\.\s*(?:\*\*)?(?:Ambientes?\s*Ideais?|AMBIENTES?\s*IDEAIS?)(?:\*\*)?[^:]*:\s*([^\n]+)/i,
            // Padrão 2: "Ambientes Ideais" seguido de lista em bullets
            /(?:Ambientes?\s*Ideais?|AMBIENTES?\s*IDEAIS?)(?:\s*que\s*se\s*encaixa)?[^:]*:\s*\n?((?:[•\-\*]\s*[^\n]+\n?)+)/i,
            // Padrão 3: Seção numerada com lista abaixo
            /9\.\s*(?:\*\*)?(?:Ambientes?\s*Ideais?)[^:]*(?:\*\*)?[\s:]+\n?([\s\S]*?)(?=\n\d+\.|$)/i,
            // Padrão 4: Header simples sem número
            /(?:Ambientes?\s*Ideais?|AMBIENTES?\s*IDEAIS?)[\s:]+\n?([\s\S]*?)(?=\n\n|\n[A-Z]|\n\d+\.|$)/i
          ];
          
          for (const pattern of ambientPatterns) {
            const match = copyText.match(pattern);
            if (match && match[1]) {
              const rawEnvs = match[1]
                .split(/[\n•\-\*,،;]/)
                .map(env => env.replace(/^\s*\d+\.\s*/, '').replace(/\([^)]*\)/g, '').trim())
                .filter(env => env.length > 2 && env.length < 60);
              
              if (rawEnvs.length > 0) {
                idealEnvironments = rawEnvs.slice(0, 7);
                console.log('🎯 [COPYWRITING] Ambientes Ideais extraídos:', idealEnvironments);
                break;
              }
            }
          }
          
          if (idealEnvironments.length === 0) {
            console.log('⚠️ [COPYWRITING] Nenhum padrão de "Ambientes Ideais" encontrado');
          }
          
          // Extrair público-alvo (múltiplos padrões)
          const publicoPatterns = [
            /5\.\s*(?:\*\*)?Público[- ]?alvo(?:\*\*)?[^:]*:\s*([^\n]+)/i,
            /(?:Público[- ]?alvo|PÚBLICO[- ]?ALVO)[^:]*:\s*([^\n]+)/i,
            /3\.\s*(?:\*\*)?Público[- ]?alvo(?:\*\*)?[^:]*:\s*([^\n]+)/i
          ];
          
          for (const pattern of publicoPatterns) {
            const match = copyText.match(pattern);
            if (match && match[1]) {
              targetAudience = match[1].trim();
              console.log('👥 [COPYWRITING] Público-alvo extraído:', targetAudience);
              break;
            }
          }
        }
      }
      
      // FALLBACK MELHORADO: Inferir ambientes baseado no nome do produto e categoria
      if (idealEnvironments.length === 0) {
        console.log('⚠️ [FALLBACK] Inferindo ambientes baseado no produto');
        
        // Tentar obter nome do produto das outras seções
        const productName = seoDescription.split('.')[0] || '';
        const allText = `${seoDescription} ${technicalSpecs}`.toLowerCase();
        
        // Mapeamento inteligente de palavras-chave para ambientes
        const envMappings: { keywords: string[]; environments: string[] }[] = [
          { keywords: ['cozinha', 'panela', 'frigideira', 'culinária', 'chef', 'alimento'], environments: ['cozinha moderna', 'cozinha gourmet', 'restaurante'] },
          { keywords: ['escritório', 'office', 'trabalho', 'notebook', 'mesa', 'cadeira'], environments: ['escritório moderno', 'home office', 'coworking'] },
          { keywords: ['banheiro', 'banho', 'toalha', 'shampoo', 'higiene'], environments: ['banheiro luxuoso', 'spa', 'banheiro moderno'] },
          { keywords: ['quarto', 'cama', 'travesseiro', 'dormir', 'sono'], environments: ['quarto aconchegante', 'suíte de hotel', 'quarto minimalista'] },
          { keywords: ['esporte', 'fitness', 'academia', 'treino', 'exercício'], environments: ['academia moderna', 'estúdio fitness', 'ao ar livre'] },
          { keywords: ['bebê', 'criança', 'infantil', 'kids', 'brinquedo'], environments: ['quarto infantil', 'berçário', 'área de brincar'] },
          { keywords: ['eletrônico', 'tecnologia', 'celular', 'gadget', 'fone'], environments: ['setup tech', 'mesa minimalista', 'ambiente moderno'] },
          { keywords: ['moda', 'roupa', 'vestido', 'camisa', 'sapato', 'bolsa'], environments: ['boutique de moda', 'closet organizado', 'estúdio fashion'] },
          { keywords: ['pet', 'cachorro', 'gato', 'animal'], environments: ['sala pet-friendly', 'parque para pets', 'ambiente aconchegante'] },
          { keywords: ['jardim', 'planta', 'vaso', 'flor'], environments: ['jardim zen', 'varanda verde', 'terraço'] }
        ];
        
        for (const mapping of envMappings) {
          if (mapping.keywords.some(kw => allText.includes(kw))) {
            idealEnvironments = mapping.environments;
            console.log('🔄 [FALLBACK] Ambientes inferidos:', idealEnvironments);
            break;
          }
        }
        
        // Fallback genérico se ainda vazio
        if (idealEnvironments.length === 0) {
          idealEnvironments = ['ambiente moderno', 'sala de estar elegante', 'estúdio profissional'];
          console.log('🔄 [FALLBACK] Usando ambientes genéricos:', idealEnvironments);
        }
      }

      console.log('✅ Dados ENRIQUECIDOS carregados:', {
        hasSeoDescription: !!seoDescription,
        hasTechnicalSpecs: !!technicalSpecs,
        hasKeywords: !!palavrasChave,
        idealForCount: idealFor.length,
        idealEnvironmentsCount: idealEnvironments.length,
        mainKeywordsCount: mainKeywords.length,
        longTailKeywordsCount: longTailKeywords.length
      });

      return {
        hasUnifiedData: !!(seoDescription || technicalSpecs || palavrasChave || idealEnvironments.length > 0),
        seoDescription,
        technicalSpecs,
        keywords: palavrasChave,
        idealFor,
        idealEnvironments,
        targetAudience,
        mainKeywords,
        longTailKeywords
      };
    } catch (error) {
      console.error('Erro ao buscar dados enriquecidos:', error);
      return { 
        hasUnifiedData: false, 
        seoDescription: '', 
        technicalSpecs: '', 
        keywords: '',
        idealFor: [],
        idealEnvironments: [],
        targetAudience: '',
        mainKeywords: [],
        longTailKeywords: []
      };
    }
  };

  return {
    productsWithCommands,
    isLoading,
    loadProductsWithCommands,
    getUnifiedDataForProduct
  };
}
