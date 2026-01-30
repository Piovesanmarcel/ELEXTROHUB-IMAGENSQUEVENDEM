// Campos técnicos que NÃO devem aparecer como keywords (inclui variações sem underscore)
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

// Função ROBUSTA para normalizar improvedText que pode estar como JSON stringificado ou aninhado
const normalizeImprovedText = (text: any, depth: number = 0): string => {
  // Evitar recursão infinita
  if (depth > 10) {
    console.warn('⚠️ CONVERTER - Profundidade máxima atingida');
    return typeof text === 'string' ? text : '';
  }

  if (!text) return '';
  
  // Se é STRING
  if (typeof text === 'string') {
    const trimmed = text.trim();
    
    // String vazia ou muito curta
    if (trimmed.length < 3) return trimmed;
    
    // String válida que NÃO parece JSON - retorna direto
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[') && !trimmed.startsWith('"')) {
      return text;
    }
    
    // String que começa com " pode ser JSON stringificado de uma string
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      try {
        const unquoted = JSON.parse(trimmed);
        if (typeof unquoted === 'string') {
          return normalizeImprovedText(unquoted, depth + 1);
        }
      } catch {
        // Não é JSON válido, continuar
      }
    }
    
    // String que parece JSON objeto/array - tentar parsear
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        console.log(`🔧 CONVERTER - JSON parseado em depth ${depth}`);
        
        // Caso: { improvedText: "..." }
        if (parsed.improvedText !== undefined) {
          return normalizeImprovedText(parsed.improvedText, depth + 1);
        }
        // Caso: { topicos_conversao: { improvedText: "..." } }
        const allFields = ['topicos_conversao', 'palavras_chave_seo', 'perguntas_respostas', 'kits_criativos', 'cauda_longa'];
        for (const field of allFields) {
          if (parsed[field]?.improvedText) {
            return normalizeImprovedText(parsed[field].improvedText, depth + 1);
          }
        }
        // JSON válido mas sem campos conhecidos
        return text;
      } catch {
        // Não é JSON válido, retornar como está
        return text;
      }
    }
  }
  
  // Se é OBJETO
  if (typeof text === 'object' && text !== null) {
    // Caso: { improvedText: "..." }
    if (text.improvedText !== undefined) {
      return normalizeImprovedText(text.improvedText, depth + 1);
    }
    // Caso: { topicos_conversao: { improvedText: "..." } }
    const allFields = ['topicos_conversao', 'palavras_chave_seo', 'perguntas_respostas', 'kits_criativos', 'cauda_longa'];
    for (const field of allFields) {
      if (text[field]?.improvedText) {
        return normalizeImprovedText(text[field].improvedText, depth + 1);
      }
    }
    return '';
  }
  
  return String(text);
};

// Função para limpar keywords removendo termos técnicos
const cleanKeywords = (keywords: any): string[] | undefined => {
  if (!keywords) return undefined;
  if (!Array.isArray(keywords)) return undefined;
  
  const cleaned = keywords
    .filter((kw: any) => {
      if (typeof kw !== 'string') return false;
      const lower = kw.toLowerCase().replace(/[^a-z0-9]/g, '');
      return lower.length > 2 && !TECHNICAL_FIELDS.has(lower);
    })
    .slice(0, 10);
  
  return cleaned.length > 0 ? cleaned : undefined;
};

export const convertToAIResponse = (result: any): any => {
  return {
    improvedText: normalizeImprovedText(result?.improvedText),
    reasoning: result?.reasoning || undefined,
    improvements: result?.improvements || undefined,
    keywords: cleanKeywords(result?.keywords),
    longTailKeywords: cleanKeywords(result?.longTailKeywords),
    seoTitles: result?.seoTitles || undefined,
    metaDescriptions: result?.metaDescriptions || undefined,
    faqs: result?.faqs || undefined,
    hooks: result?.hooks || undefined,
    stories: result?.stories || undefined,
    objections: result?.objections || undefined,
    ctas: result?.ctas || undefined,
    titles: result?.titles || undefined,
    descriptions: result?.descriptions || undefined,
  };
};

export const commandLabels = {
  topicos_conversao: { label: 'Tópicos de Conversão', number: '1' },
  copywriting: { label: 'Gerador de Copywriting Profissional', number: '2' },
  palavras_chave_seo: { label: 'Palavras-chave e Sugestões de Nomes SEO', number: '3' },
  perguntas_respostas: { label: 'Perguntas & Respostas', number: '4' },
  kits_criativos: { label: 'Kits Criativos e Estratégias de Venda', number: '5' },
  cauda_longa: { label: 'Títulos de Cauda Longa (Long Tail SEO)', number: '6' }
};
