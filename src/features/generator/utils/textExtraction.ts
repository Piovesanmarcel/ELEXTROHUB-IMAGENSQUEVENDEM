// ============= TEXT EXTRACTION UTILITIES =============

/**
 * Extract section by emoji from Comando Unificado
 */
export const extractSection = (text: string, sectionEmoji: string): string[] => {
  if (!text) return [];
  const regex = new RegExp(`${sectionEmoji}[^\\n]*\\n([\\s\\S]*?)(?=\\n[🔍🎯⚙️🔄📋✨💡🛒🎁💰🏆❓]|$)`, 'g');
  const match = regex.exec(text);
  if (match) {
    const lines = match[1].split('\n');
    return lines
      .filter(line => /^[-•✅✨🔍🎯⚙️🔄📋💡🛒🎁💰🏆❓]\s|^\d+\.\s/.test(line.trim()))
      .map(line => line.replace(/^[-•✅✨🔍🎯⚙️🔄📋💡🛒🎁💰🏆❓]\s*/, '').replace(/^\d+\.\s*/, '').trim())
      .filter(Boolean);
  }
  return [];
};

/**
 * Extract full section text
 */
export const extractFullSection = (text: string, sectionEmoji: string): string => {
  if (!text) return '';
  const regex = new RegExp(`${sectionEmoji}[^\\n]*\\n([\\s\\S]*?)(?=\\n[🔍🎯⚙️🔄📋✨💡🛒🎁💰🏆❓]|$)`, 'g');
  const match = regex.exec(text);
  return match ? match[1].trim() : '';
};

/**
 * Extract copywriting section by number
 */
export const extractCopywritingSection = (text: string, sectionNum: number): string => {
  const pattern = new RegExp(`####\\s*${sectionNum}\\.\\s*[^:\\n]+:?\\s*([\\s\\S]*?)(?=####\\s*\\d+\\.|$)`, 'i');
  const match = text.match(pattern);
  return match ? match[1].trim() : '';
};

/**
 * Extract list items from text
 */
export const extractListItems = (text: string): string[] => {
  return text
    .split('\n')
    .map(line => line.replace(/^\d+\.\s*/, '').replace(/^\*\s*/, '').replace(/^-\s*/, '').replace(/\*\*([^*]+)\*\*/g, '$1').trim())
    .filter(line => line.length > 3 && line.length < 150);
};

/**
 * Clean unwanted characters from text
 */
export const cleanText = (text: string): string => {
  return text
    .replace(/\\\\/g, '')
    .replace(/\\n/g, ' ')
    .replace(/\\/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Extract text from n8n response (Gemini format)
 */
export const extractTextFromResponse = (rawData: any): string => {
  if (!rawData) return '';
  
  if (typeof rawData === 'object' && !Array.isArray(rawData)) {
    if (rawData?.content?.parts?.[0]?.text) {
      return rawData.content.parts[0].text;
    }
  }
  
  const dataStr = typeof rawData === 'string' ? rawData : JSON.stringify(rawData);
  
  if (typeof rawData === 'string') {
    try {
      const parsed = JSON.parse(rawData);
      if (parsed?.content?.parts?.[0]?.text) {
        return parsed.content.parts[0].text;
      }
    } catch {}
  }
  
  const markdownPattern = /(####\s*\d+\.[\s\S]+)/;
  const markdownMatch = dataStr.match(markdownPattern);
  if (markdownMatch && markdownMatch[1]) {
    return markdownMatch[1]
      .replace(/}+,?\s*role:model.*$/s, '')
      .replace(/}\s*],?\s*finishReason.*$/s, '')
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .trim();
  }
  
  const textMatch = dataStr.match(/text:\s*["`]([^"`]+)["`]/);
  if (textMatch && textMatch[1]) {
    return textMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
  }
  
  return '';
};

/**
 * Build unified marketing text string
 */
export const buildMarketingText = (
  copy: string,
  beneficios: string[],
  publicoAlvo: string[],
  ambientesUso: string[]
): string => {
  const sections: string[] = [];
  
  if (copy) {
    sections.push(`COPY: ${cleanText(copy)}`);
  }
  
  if (beneficios.length > 0) {
    const limpos = beneficios.map(b => cleanText(b)).filter(Boolean);
    sections.push(`BENEFÍCIOS: ${limpos.join('; ')}`);
  }
  
  if (publicoAlvo.length > 0) {
    const limpos = publicoAlvo.map(p => cleanText(p)).filter(Boolean);
    sections.push(`PÚBLICO-ALVO: ${limpos.join('; ')}`);
  }
  
  if (ambientesUso.length > 0) {
    const limpos = ambientesUso.map(a => cleanText(a)).filter(Boolean);
    sections.push(`AMBIENTES: ${limpos.join('; ')}`);
  }
  
  return sections.join(' | ');
};
