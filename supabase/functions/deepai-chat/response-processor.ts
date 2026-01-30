
import { AIResponse, UnifiedAIResponse } from './types.ts';

// Função ROBUSTA para normalizar improvedText que pode estar como JSON stringificado ou aninhado
function normalizeImprovedText(text: any, depth: number = 0): string {
  // Evitar recursão infinita
  if (depth > 10) {
    console.warn(`⚠️ [BACKEND NORMALIZE] Profundidade máxima ${depth} atingida`);
    return typeof text === 'string' ? text : '';
  }

  if (!text) return '';
  
  // Se é STRING
  if (typeof text === 'string') {
    const trimmed = text.trim();
    
    // String válida que NÃO parece JSON - retorna direto
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
      return text;
    }
    
    // String que parece JSON - tentar parsear
    try {
      const parsed = JSON.parse(trimmed);
      console.log(`🔧 [BACKEND NORMALIZE] JSON parseado com sucesso em depth ${depth}`);
      
      // Caso: { improvedText: "..." } ou { improvedText: {...} }
      if (parsed.improvedText !== undefined) {
        return normalizeImprovedText(parsed.improvedText, depth + 1);
      }
      // Caso: { topicos_conversao: { improvedText: "..." } }
      if (parsed.topicos_conversao?.improvedText) {
        return normalizeImprovedText(parsed.topicos_conversao.improvedText, depth + 1);
      }
      // JSON válido mas sem improvedText conhecido
      console.log(`⚠️ [BACKEND NORMALIZE] JSON sem improvedText, retornando original`);
      return text;
    } catch {
      // Não é JSON válido, retornar como está
      return text;
    }
  }
  
  // Se é OBJETO
  if (typeof text === 'object' && text !== null) {
    // Caso: { improvedText: "..." }
    if (text.improvedText !== undefined) {
      console.log(`🔧 [BACKEND NORMALIZE] Extraindo de objeto.improvedText em depth ${depth}`);
      return normalizeImprovedText(text.improvedText, depth + 1);
    }
    // Caso: { topicos_conversao: { improvedText: "..." } }
    if (text.topicos_conversao?.improvedText) {
      console.log(`🔧 [BACKEND NORMALIZE] Extraindo de objeto.topicos_conversao.improvedText`);
      return normalizeImprovedText(text.topicos_conversao.improvedText, depth + 1);
    }
    // Objeto sem campos conhecidos
    console.log(`⚠️ [BACKEND NORMALIZE] Objeto sem campos conhecidos`);
    return '';
  }
  
  return String(text);
}

// Campos técnicos que devem ser filtrados das keywords
const TECHNICAL_FIELDS = new Set([
  'improvedtext', 'improved_text', 'keywords', 'reasoning', 'improvements',
  'topicos_conversao', 'palavras_chave_seo', 'perguntas_respostas', 
  'kits_criativos', 'cauda_longa', 'longtailkeywords', 'seotitles',
  'metadescriptions', 'faqs', 'hooks', 'stories', 'objections', 'ctas',
  'titles', 'descriptions', 'undefined', 'null', 'object', 'function',
  // Variações sem underscore
  'topicosconversao', 'palavraschaveseo', 'perguntasrespostas', 
  'kitscriativos', 'caudalonga', 'string', 'number', 'boolean',
  'improvedtextcomplete', 'keywordsarray', 'textonormalizado',
  // Termos JSON comuns
  'json', 'array', 'true', 'false', 'type', 'content', 'data', 'result',
  'response', 'error', 'message', 'status', 'value', 'key', 'index'
]);

// Extrai apenas valores de texto de um objeto (ignora nomes de campos)
function extractTextValues(obj: any): string {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (typeof obj !== 'object') return '';
  
  const texts: string[] = [];
  for (const value of Object.values(obj)) {
    if (typeof value === 'string') {
      texts.push(value);
    } else if (typeof value === 'object' && value !== null) {
      texts.push(extractTextValues(value));
    }
  }
  return texts.join(' ');
}

function extractKeywords(text: string): string[] {
  if (!text) return [];

  // Se o texto parece ser JSON, extrair apenas os VALORES de texto (não as chaves)
  let cleanText = text;
  if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      // Extrair apenas valores de texto, ignorando nomes de campos
      cleanText = extractTextValues(parsed);
      console.log('🔧 [KEYWORDS] JSON convertido para texto puro');
    } catch {
      // Não é JSON válido, usar o texto original mas remover sintaxe JSON
      cleanText = text
        .replace(/"[a-zA-Z_]+"\s*:/g, '') // Remove "field_name":
        .replace(/[{}[\]"]/g, ' '); // Remove caracteres JSON
    }
  }

  // Remove HTML tags, JSON syntax, punctuation, and split into words
  const words = cleanText
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[{}[\]":,]/g, ' ') // Remove JSON syntax characters
    .replace(/[^a-zA-ZÀ-ÿ0-9\s]/g, '') // Remove other punctuation, keep accented chars
    .toLowerCase()
    .split(/\s+/);

  // Extended stop words list including Portuguese
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'of', 'at', 'in', 'on', 'to', 'for',
    'o', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'nos', 'nas',
    'por', 'para', 'com', 'sem', 'sob', 'sobre', 'entre', 'que', 'qual', 'quais', 'este', 'esta', 'estes', 'estas',
    'esse', 'essa', 'esses', 'essas', 'aquele', 'aquela', 'aqueles', 'aquelas', 'seu', 'sua', 'seus', 'suas',
    'meu', 'minha', 'meus', 'minhas', 'nosso', 'nossa', 'nossos', 'nossas', 'ele', 'ela', 'eles', 'elas',
    'se', 'si', 'como', 'mais', 'menos', 'muito', 'muita', 'muitos', 'muitas', 'pouco', 'pouca', 'poucos', 'poucas'
  ]);

  // Filter out stop words, short words, and technical field names
  const keywords = words.filter(word => {
    if (word.length <= 2) return false;
    if (stopWords.has(word)) return false;
    // Remove technical field names (normalized without special chars)
    const cleanWord = word.replace(/[^a-z]/g, '');
    if (TECHNICAL_FIELDS.has(cleanWord)) return false;
    // Remove words that look like JSON field paths
    if (word.includes('_') && word.length > 15) return false;
    return true;
  });

  // Count word frequency
  const wordFrequency: { [key: string]: number } = {};
  keywords.forEach(word => {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  });

  // Sort by frequency
  const sortedKeywords = Object.entries(wordFrequency)
    .sort(([, freqA], [, freqB]) => freqB - freqA)
    .map(([word]) => word);

  return sortedKeywords.slice(0, 10); // Return top 10 keywords
}

export function processUnifiedResponse(response: any): UnifiedAIResponse {
  const unifiedResponse: UnifiedAIResponse = {
    topicos_conversao: null,
    palavras_chave_seo: null,
    perguntas_respostas: null,
    kits_criativos: null,
    cauda_longa: null,
    geminiSuccess: false,
    openaiSuccess: false,
    errors: {
      gemini: null,
      openai: null
    }
  };

  try {
    console.log('Processando resposta:', JSON.stringify(response, null, 2));

    // Processar Tópicos de Conversão
    if (response.topicos_conversao) {
      console.log('Processando topicos_conversao...');
      const topicosResult = typeof response.topicos_conversao === 'string' 
        ? JSON.parse(response.topicos_conversao) 
        : response.topicos_conversao;

      if (topicosResult.improvedText) {
        const normalizedText = normalizeImprovedText(topicosResult.improvedText);
        unifiedResponse.topicos_conversao = {
          improvedText: normalizedText,
          keywords: topicosResult.keywords || extractKeywords(normalizedText)
        };
        console.log('Tópicos de conversão processado com sucesso');
      }
    }

    // Processar Palavras-chave SEO
    if (response.palavras_chave_seo) {
      console.log('Processando palavras_chave_seo...');
      const palavrasChaveResult = typeof response.palavras_chave_seo === 'string'
        ? JSON.parse(response.palavras_chave_seo)
        : response.palavras_chave_seo;

      if (palavrasChaveResult.improvedText || palavrasChaveResult.keywords) {
        unifiedResponse.palavras_chave_seo = {
          improvedText: normalizeImprovedText(palavrasChaveResult.improvedText) || '',
          keywords: palavrasChaveResult.keywords || []
        };
        console.log('Palavras-chave SEO processado com sucesso');
      }
    }

    // Processar Perguntas & Respostas
    if (response.perguntas_respostas) {
      console.log('Processando perguntas_respostas...');
      const perguntasRespostasResult = typeof response.perguntas_respostas === 'string'
        ? JSON.parse(response.perguntas_respostas)
        : response.perguntas_respostas;

      if (perguntasRespostasResult.improvedText) {
        unifiedResponse.perguntas_respostas = {
          improvedText: normalizeImprovedText(perguntasRespostasResult.improvedText),
          keywords: perguntasRespostasResult.keywords || ['perguntas', 'respostas', 'faq', 'dúvidas']
        };
        console.log('Perguntas & Respostas processado com sucesso');
      }
    }

    // Processar Kits Criativos
    if (response.kits_criativos) {
      console.log('Processando kits_criativos...');
      const kitsResult = typeof response.kits_criativos === 'string'
        ? JSON.parse(response.kits_criativos)
        : response.kits_criativos;

      if (kitsResult.improvedText) {
        unifiedResponse.kits_criativos = {
          improvedText: normalizeImprovedText(kitsResult.improvedText),
          keywords: kitsResult.keywords || ['kits', 'combos', 'ofertas', 'promoções']
        };
        console.log('Kits Criativos processado com sucesso');
      }
    }

    // Processar Cauda Longa
    if (response.cauda_longa) {
      console.log('Processando cauda_longa...');
      const caudaLongaResult = typeof response.cauda_longa === 'string'
        ? JSON.parse(response.cauda_longa)
        : response.cauda_longa;

      if (caudaLongaResult.improvedText) {
        unifiedResponse.cauda_longa = {
          improvedText: normalizeImprovedText(caudaLongaResult.improvedText),
          keywords: caudaLongaResult.keywords || ['cauda longa', 'long tail', 'títulos', 'seo', 'otimização']
        };
        console.log('Cauda Longa processado com sucesso');
      }
    }

    // Se nenhum comando foi processado com sucesso, vamos tentar processar como texto simples
    if (!unifiedResponse.topicos_conversao && 
        !unifiedResponse.palavras_chave_seo && 
        !unifiedResponse.perguntas_respostas && 
        !unifiedResponse.kits_criativos &&
        !unifiedResponse.cauda_longa) {
      
      console.log('⚠️ Nenhum comando processado, ativando fallback inteligente...');
      
      // Se a resposta é uma string, vamos criar uma estrutura mais robusta
      if (typeof response === 'string') {
        const text = response;
        const keywords = extractKeywords(text);
        
        console.log('🔍 Tentando extrair dados estruturados do texto...');
        
        // Tentar extrair seções específicas usando padrões
        const extractSection = (pattern: RegExp, fallbackText: string): string => {
          const match = text.match(pattern);
          if (match && match[1]) {
            const extracted = match[1].trim();
            console.log(`✅ Seção extraída (${extracted.substring(0, 50)}...)`);
            return extracted;
          }
          console.log('⚠️ Seção não encontrada, usando fallback');
          return fallbackText;
        };
        
        // Padrões para identificar cada seção
        const patterns = {
          topicos: /(?:tópicos?|topics?)[\s\S]*?[:：]\s*([^]+?)(?=\n\n|palavras?[-\s]chave|$)/i,
          palavrasChave: /(?:palavras?[-\s]chave|keywords?)[\s\S]*?[:：]\s*([^]+?)(?=\n\n|perguntas?|$)/i,
          perguntas: /(?:perguntas?|faq|q&a)[\s\S]*?[:：]\s*([^]+?)(?=\n\n|kits?|$)/i,
          kits: /(?:kits?|combos?|ofertas?)[\s\S]*?[:：]\s*([^]+?)(?=\n\n|cauda|$)/i,
          caudaLonga: /(?:cauda\s+longa|long\s+tail|títulos?)[\s\S]*?[:：]\s*([^]+?)$/i
        };
        
        unifiedResponse.topicos_conversao = {
          improvedText: extractSection(patterns.topicos, text.substring(0, Math.min(500, text.length))),
          keywords: keywords.slice(0, 5)
        };
        
        unifiedResponse.palavras_chave_seo = {
          improvedText: extractSection(patterns.palavrasChave, `🔑 Palavras-chave principais:\n${keywords.slice(0, 10).join(', ')}`),
          keywords: keywords
        };
        
        unifiedResponse.perguntas_respostas = {
          improvedText: extractSection(patterns.perguntas, `❓ Perguntas Frequentes\n\n1. Qual a aplicação?\n✅ ${text.substring(0, 150)}...\n\n2. Quais os benefícios?\n✅ Produto de qualidade`),
          keywords: ['perguntas', 'respostas', 'faq']
        };
        
        unifiedResponse.kits_criativos = {
          improvedText: extractSection(patterns.kits, `🎁 KITS SUGERIDOS:\n\n1. Kit Básico: Produto + Acessório\n2. Kit Premium: 2 unidades + Brinde\n3. Kit Profissional: 3 unidades com desconto`),
          keywords: ['kits', 'combos', 'ofertas']
        };

        unifiedResponse.cauda_longa = {
          improvedText: extractSection(patterns.caudaLonga, `🎯 TÍTULOS CAUDA LONGA:\n\n1. ${text.substring(0, 60).trim()}\n2. Produto ${keywords[0] || 'Premium'} | ${keywords[1] || 'Qualidade'}\n3. ${keywords[0] || 'Item'} Profissional para ${keywords[2] || 'Uso Geral'}`),
          keywords: ['cauda longa', 'long tail', 'títulos', 'seo']
        };
        
        console.log('✅ Fallback inteligente aplicado com sucesso');
      }
    }

    console.log('Resposta final processada:', {
      topicos: !!unifiedResponse.topicos_conversao,
      palavras: !!unifiedResponse.palavras_chave_seo,
      perguntas: !!unifiedResponse.perguntas_respostas,
      kits: !!unifiedResponse.kits_criativos,
      cauda_longa: !!unifiedResponse.cauda_longa
    });

  } catch (error) {
    console.error('Erro ao processar resposta unificada:', error);
    const message = error instanceof Error ? error.message : String(error);
    unifiedResponse.errors = {
      gemini: 'Erro ao processar resposta: ' + message,
      openai: null
    };
  }

  return unifiedResponse;
}
