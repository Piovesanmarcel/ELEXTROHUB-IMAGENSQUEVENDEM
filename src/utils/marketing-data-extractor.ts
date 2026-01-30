import { UnifiedAIResponse } from '@/components/product/ai-enhancer/types';
import { TemplateData } from '@/types/marketing-templates';

export class MarketingDataExtractor {
  extract(dataSource: string, allData: TemplateData): any {
    console.log('🔍 [EXTRACTOR] Extraindo:', dataSource);

    // Handle static text
    if (dataSource.startsWith('static:')) {
      const text = dataSource.replace('static:', '');
      console.log('📝 Texto estático:', text);
      return text;
    }
    
    // Handle AI images
    if (dataSource.startsWith('aiImages')) {
      const match = dataSource.match(/aiImages\[(\d+)\]/);
      if (match) {
        const index = parseInt(match[1]);
        const image = allData.aiImages[index] || allData.aiImages[0];
        console.log(`📸 Imagem AI [${index}]:`, image);
        return image;
      }
    }
    
    // Handle copywriting data (Seções 3, 5, 9)
    if (dataSource.startsWith('copywriting.')) {
      const result = this.extractFromCopywriting(dataSource, allData.copywriting);
      console.log('📄 Dados da Copywriting extraídos:', result);
      return result;
    }
    
    // Handle unified data
    if (dataSource.startsWith('unified.')) {
      const result = this.extractFromUnified(dataSource, allData.unified);
      console.log('📊 Dados unificados extraídos:', result);
      return result;
    }
    
    // Handle product data
    if (dataSource.startsWith('product.')) {
      const field = dataSource.replace('product.', '');
      const result = allData.product[field as keyof typeof allData.product];
      console.log('🏷️ Dados do produto:', result);
      return result;
    }
    
    console.warn('⚠️ Fonte de dados não reconhecida:', dataSource);
    return '';
  }
  
  private extractFromCopywriting(path: string, copywriting?: TemplateData['copywriting']): any {
    if (!copywriting) {
      console.warn('⚠️ Dados de copywriting não disponíveis');
      return '';
    }
    
    const parts = path.replace('copywriting.', '').split('.');
    const section = parts[0];
    
    // Seção 3 - Características
    if (section === 'characteristics') {
      const characteristics = copywriting.characteristics || [];
      const indexMatch = parts[0].match(/characteristics\[(\d+)\]/);
      if (indexMatch) {
        return characteristics[parseInt(indexMatch[1])] || '';
      }
      // Retornar todas as características formatadas
      return characteristics.join('\n• ');
    }
    
    // Seção 5 - Benefícios para o Cliente
    if (section === 'benefits') {
      const benefits = copywriting.benefits || [];
      const indexMatch = parts[0].match(/benefits\[(\d+)\]/);
      if (indexMatch) {
        return benefits[parseInt(indexMatch[1])] || '';
      }
      // Retornar todos os benefícios formatados
      return benefits.join('\n• ');
    }
    
    // Seção 9 - Ambientes Ideais
    if (section === 'environments') {
      const environments = copywriting.environments || [];
      const indexMatch = parts[0].match(/environments\[(\d+)\]/);
      if (indexMatch) {
        return environments[parseInt(indexMatch[1])] || '';
      }
      // Retornar todos os ambientes formatados
      return environments.join('\n• ');
    }
    
    return '';
  }
  
  private extractFromUnified(path: string, unified: UnifiedAIResponse): any {
    const parts = path.replace('unified.', '').split('.');
    
    if (parts[0] === 'topicos_conversao') {
      if (parts[1]?.startsWith('benefits')) {
        const benefits = this.extractBenefits(unified.topicos_conversao?.improvedText);
        const indexMatch = parts[1].match(/\[(\d+)\]/);
        if (indexMatch) {
          return benefits[parseInt(indexMatch[1])] || benefits[0] || '';
        }
        return benefits;
      }
    }
    
    if (parts[0] === 'palavras_chave_seo') {
      if (parts[1]?.startsWith('keywords')) {
        const keywords = unified.palavras_chave_seo?.keywords || [];
        const indexMatch = parts[1].match(/\[(\d+)\]/);
        if (indexMatch) {
          return keywords[parseInt(indexMatch[1])] || keywords[0] || '';
        }
        return keywords;
      }
    }
    
    if (parts[0] === 'perguntas_respostas') {
      if (parts[1]?.startsWith('faqs')) {
        const faqs = this.extractFAQs(unified.perguntas_respostas?.improvedText);
        const indexMatch = parts[1].match(/\[(\d+)\]/);
        if (indexMatch) {
          return faqs[parseInt(indexMatch[1])];
        }
        return faqs;
      }
    }
    
    return '';
  }
  
  private extractBenefits(text?: string): string[] {
    if (!text) return [];
    
    // Extract benefits from "✨ PRINCIPAIS BENEFÍCIOS" section
    const benefitMatch = text.match(/\*\*✨ PRINCIPAIS BENEFÍCIOS\*\*\n([\s\S]*?)(?:\n\n|\*\*)/);
    if (!benefitMatch) return [];
    
    return benefitMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'))
      .map(line => line.replace(/^[•\-]\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 10);
  }
  
  private extractFAQs(text?: string): Array<{ q: string; a: string }> {
    if (!text) return [];
    
    const faqs: Array<{ q: string; a: string }> = [];
    const matches = text.matchAll(/❓ PERGUNTA \d+: (.+?)\n✅ RESPOSTA: (.+?)(?=\n\n|❓|$)/gs);
    
    if (matches) {
      for (const match of matches) {
        faqs.push({ 
          q: match[1].trim(), 
          a: match[2].trim() 
        });
      }
    }
    
    return faqs;
  }
}

// Helper function to extract copywriting sections from saved text
export function extractCopywritingSections(copywritingText: string | undefined): {
  characteristics: string[];
  benefits: string[];
  environments: string[];
} {
  if (!copywritingText) {
    return { characteristics: [], benefits: [], environments: [] };
  }
  
  const extractSection = (sectionNumber: number, text: string): string[] => {
    // Patterns para identificar cada seção
    const patterns: Record<number, RegExp> = {
      3: /(?:3\.|SEÇÃO 3|Destaque das Principais Características)[:\s]*([\s\S]*?)(?=\n\n(?:\d+\.|SEÇÃO \d+)|$)/i,
      5: /(?:5\.|SEÇÃO 5|Principais Benefícios para o Cliente)[:\s]*([\s\S]*?)(?=\n\n(?:\d+\.|SEÇÃO \d+)|$)/i,
      9: /(?:9\.|SEÇÃO 9|Ambientes Ideais)[:\s]*([\s\S]*?)(?=\n\n(?:\d+\.|SEÇÃO \d+)|$)/i,
    };
    
    const pattern = patterns[sectionNumber];
    if (!pattern) return [];
    
    const match = text.match(pattern);
    if (!match) return [];
    
    // Extrair itens (linhas com • ou - ou numeradas)
    const content = match[1];
    const items = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.replace(/^[•\-\d\.]+\s*/, '').trim())
      .filter(line => line.length > 3);
    
    return items.slice(0, 10);
  };
  
  return {
    characteristics: extractSection(3, copywritingText),
    benefits: extractSection(5, copywritingText),
    environments: extractSection(9, copywritingText),
  };
}
