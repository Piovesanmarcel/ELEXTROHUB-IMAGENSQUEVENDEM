import jsPDF from 'jspdf';
import { Product } from '@/lib/supabase';
import { UnifiedAIResponse } from '@/components/product/ai-enhancer/types';
import {
  EBOOK_INTRO,
  EBOOK_DIFERENCIAIS,
  EBOOK_COMO_USAR,
  EBOOK_BRANDING,
  EBOOK_PSICOLOGIA,
  EBOOK_FOOTER,
  EBOOK_DEPOIMENTOS,
  EBOOK_COMPARATIVO,
  EBOOK_CHECKLIST,
  PDF_TEMPLATES,
  getTemplateById,
  PDFTemplateColors
} from './ebookTemplates';

// Tipo simplificado para produto (usado no Gerador)
interface SimpleProduct {
  nome: string;
  descricao?: string | null;
  sku?: string;
}

interface EbookData {
  product: Product | SimpleProduct;
  unifiedData?: UnifiedAIResponse | null;
  copywritingText?: string;
  images?: string[];
  templateId?: string;
  includeImagesInPDF?: boolean;
}

// ============================================
// HELPER: CARREGAR IMAGEM COMO BASE64
// ============================================
const loadImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    // Se já for base64, retornar diretamente
    if (url.startsWith('data:image')) {
      return url;
    }
    
    // Se for blob URL, converter para base64
    if (url.startsWith('blob:')) {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    }
    
    // Para URLs HTTPS, fazer fetch
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Erro ao carregar imagem para PDF:', error);
    return null;
  }
};

// ============================================
// HELPER: ADICIONAR IMAGEM AO PDF
// ============================================
const addImageToPDF = async (
  doc: jsPDF,
  imageUrl: string,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number
): Promise<{ width: number; height: number } | null> => {
  try {
    const base64 = await loadImageAsBase64(imageUrl);
    if (!base64) return null;
    
    // Criar imagem temporária para obter dimensões
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = base64;
    });
    
    // Calcular dimensões mantendo proporção
    let width = img.width;
    let height = img.height;
    
    if (width > maxWidth) {
      const ratio = maxWidth / width;
      width = maxWidth;
      height = height * ratio;
    }
    
    if (height > maxHeight) {
      const ratio = maxHeight / height;
      height = maxHeight;
      width = width * ratio;
    }
    
    // Adicionar imagem ao PDF
    doc.addImage(base64, 'JPEG', x, y, width, height);
    
    return { width, height };
  } catch (error) {
    console.error('Erro ao adicionar imagem ao PDF:', error);
    return null;
  }
};

export const generateEbookPDF = async (data: EbookData): Promise<Blob> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let currentY = margin;

  // Obter template selecionado
  const template = getTemplateById(data.templateId || 'professional');
  const COLORS: PDFTemplateColors = template.colors;

  // Helper functions
  const addNewPage = () => {
    doc.addPage();
    currentY = margin;
    addFooter();
  };

  const checkPageBreak = (requiredSpace: number) => {
    if (currentY + requiredSpace > pageHeight - 30) {
      addNewPage();
      return true;
    }
    return false;
  };

  const addFooter = () => {
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textLight);
    doc.text(EBOOK_FOOTER.text, pageWidth / 2, pageHeight - 10, { align: 'center' });
  };

  const addTitle = (text: string, size: number = 18) => {
    checkPageBreak(20);
    doc.setFontSize(size);
    doc.setTextColor(...COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin, currentY);
    currentY += size * 0.5 + 5;
  };

  const addSubtitle = (text: string) => {
    checkPageBreak(15);
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.secondary);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin, currentY);
    currentY += 10;
  };

  const addParagraph = (text: string, indent: number = 0) => {
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'normal');
    
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    lines.forEach((line: string) => {
      checkPageBreak(7);
      doc.text(line, margin + indent, currentY);
      currentY += 6;
    });
    currentY += 3;
  };

  const addBulletList = (items: string[], indent: number = 5) => {
    items.forEach(item => {
      checkPageBreak(8);
      doc.setFontSize(11);
      doc.setTextColor(...COLORS.text);
      doc.text('•', margin + indent, currentY);
      const lines = doc.splitTextToSize(item, contentWidth - indent - 8);
      lines.forEach((line: string, idx: number) => {
        if (idx > 0) checkPageBreak(6);
        doc.text(line, margin + indent + 6, currentY);
        currentY += 6;
      });
    });
    currentY += 3;
  };

  const addDivider = () => {
    checkPageBreak(10);
    doc.setDrawColor(...COLORS.divider);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;
  };

  const addCheckbox = (text: string, indent: number = 5) => {
    checkPageBreak(8);
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.text);
    
    // Desenhar checkbox
    doc.setDrawColor(...COLORS.secondary);
    doc.setLineWidth(0.3);
    doc.rect(margin + indent, currentY - 3, 4, 4);
    
    const lines = doc.splitTextToSize(text.replace(/^□\s*/, ''), contentWidth - indent - 10);
    lines.forEach((line: string, idx: number) => {
      if (idx > 0) checkPageBreak(6);
      doc.text(line, margin + indent + 7, currentY);
      currentY += 6;
    });
  };

  // ===== PÁGINA 1: CAPA =====
  // Background gradient simulation
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 80, 'F');
  
  // Título principal
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('KIT COMPLETO DE MARKETING', pageWidth / 2, 35, { align: 'center' });
  
  doc.setFontSize(16);
  doc.text('ANÚNCIOS QUE VENDE', pageWidth / 2, 50, { align: 'center' });
  
  // Badge
  doc.setFillColor(...COLORS.accent);
  doc.roundedRect(pageWidth / 2 - 30, 58, 60, 12, 3, 3, 'F');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('GERADO POR IA', pageWidth / 2, 66, { align: 'center' });

  currentY = 100;

  // Nome do produto
  doc.setFontSize(22);
  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'bold');
  const productName = data.product.nome.substring(0, 60);
  const nameLines = doc.splitTextToSize(productName, contentWidth);
  nameLines.forEach((line: string) => {
    doc.text(line, pageWidth / 2, currentY, { align: 'center' });
    currentY += 12;
  });

  // Adicionar imagem principal na capa se disponível e habilitado
  if (data.includeImagesInPDF && data.images && data.images.length > 0) {
    currentY += 5;
    const imageResult = await addImageToPDF(
      doc, 
      data.images[0], 
      pageWidth / 2 - 35, 
      currentY, 
      70, 
      70
    );
    if (imageResult) {
      currentY += imageResult.height + 10;
    } else {
      currentY += 10;
    }
  } else {
    currentY += 10;
  }

  // SKU
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.textLight);
  if (data.product.sku) {
    doc.text(`SKU: ${data.product.sku}`, pageWidth / 2, currentY, { align: 'center' });
  }
  
  currentY += 20;

  // Box de destaques
  const boxHeight = 60;
  if (currentY + boxHeight < pageHeight - 40) {
    doc.setFillColor(...COLORS.background);
    doc.roundedRect(margin, currentY, contentWidth, boxHeight, 5, 5, 'F');
    
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('O QUE VOCÊ ENCONTRARÁ NESTE GUIA:', margin + 10, currentY + 15);
    
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'normal');
    
    const highlights = [
      '📖 Estratégias de marketing que convertem',
      '🖼️ Como usar as imagens em cada plataforma',
      '✍️ Textos prontos para copiar e colar',
      '🎯 Dicas específicas para marketplaces'
    ];
    
    let highlightY = currentY + 25;
    highlights.forEach(h => {
      doc.text(h, margin + 10, highlightY);
      highlightY += 8;
    });
  }

  addFooter();

  // ===== PÁGINA 2: INTRODUÇÃO =====
  addNewPage();
  
  addTitle(EBOOK_INTRO.title, 20);
  currentY += 5;
  addParagraph(EBOOK_INTRO.content);
  
  currentY += 10;
  addDivider();
  
  addTitle(EBOOK_DIFERENCIAIS.title, 16);
  addBulletList(EBOOK_DIFERENCIAIS.items);

  // ===== PÁGINA 3: PSICOLOGIA =====
  addNewPage();
  
  addTitle(EBOOK_PSICOLOGIA.title, 20);
  currentY += 5;
  
  const psicoParagraphs = EBOOK_PSICOLOGIA.content.split('\n\n');
  psicoParagraphs.forEach(p => {
    if (p.trim()) {
      addParagraph(p.trim());
    }
  });

  // ===== PÁGINA 4: BRANDING =====
  addNewPage();
  
  addTitle(EBOOK_BRANDING.title, 20);
  currentY += 5;
  
  const brandParagraphs = EBOOK_BRANDING.content.split('\n\n');
  brandParagraphs.forEach(p => {
    if (p.trim()) {
      addParagraph(p.trim());
    }
  });

  // ===== PÁGINA 5: COMO USAR =====
  addNewPage();
  
  addTitle(EBOOK_COMO_USAR.title, 20);
  currentY += 5;
  
  EBOOK_COMO_USAR.sections.forEach(section => {
    checkPageBreak(50);
    addSubtitle(section.platform);
    addBulletList(section.tips);
    currentY += 5;
  });

  // ===== PÁGINA: CONTEÚDO GERADO =====
  if (data.unifiedData) {
    addNewPage();
    addTitle('CONTEÚDO GERADO PARA SEU PRODUTO', 20);
    currentY += 5;

    // Tópicos de Conversão
    if (data.unifiedData.topicos_conversao?.improvedText) {
      checkPageBreak(40);
      addSubtitle('📌 Tópicos de Conversão');
      addParagraph(data.unifiedData.topicos_conversao.improvedText);
      currentY += 5;
    }

    // Palavras-chave SEO
    if (data.unifiedData.palavras_chave_seo?.keywords?.length) {
      checkPageBreak(40);
      addSubtitle('🔍 Palavras-chave SEO');
      const keywords = data.unifiedData.palavras_chave_seo.keywords.join(', ');
      addParagraph(keywords);
      currentY += 5;
    }

    // FAQs
    if (data.unifiedData.perguntas_respostas?.faqs?.length) {
      checkPageBreak(40);
      addSubtitle('❓ Perguntas Frequentes (FAQ)');
      data.unifiedData.perguntas_respostas.faqs.forEach((faq, idx) => {
        checkPageBreak(20);
        doc.setFont('helvetica', 'bold');
        addParagraph(`${idx + 1}. ${faq.question}`);
        doc.setFont('helvetica', 'normal');
        addParagraph(faq.answer, 5);
      });
      currentY += 5;
    }

    // Kits Criativos
    if (data.unifiedData.kits_criativos?.improvedText) {
      checkPageBreak(40);
      addSubtitle('🎨 Kits Criativos');
      addParagraph(data.unifiedData.kits_criativos.improvedText);
      currentY += 5;
    }
  }

  // ===== PÁGINA: COPYWRITING =====
  if (data.copywritingText) {
    addNewPage();
    addTitle('COPYWRITING PERSUASIVO', 20);
    currentY += 5;

    // Quebrar o copywriting em seções
    const sections = data.copywritingText.split(/(?=\d+\.\s|#{1,3}\s)/);
    sections.forEach(section => {
      if (section.trim()) {
        addParagraph(section.trim());
      }
    });
  }

  // ===== PÁGINA: GALERIA DE IMAGENS =====
  if (data.includeImagesInPDF && data.images && data.images.length > 1) {
    addNewPage();
    addTitle('GALERIA DE IMAGENS DO PRODUTO', 20);
    currentY += 10;

    const imagesPerRow = 2;
    const imageWidth = (contentWidth - 10) / imagesPerRow;
    const imageHeight = 60;
    let col = 0;

    for (let i = 0; i < Math.min(data.images.length, 6); i++) {
      if (col === 0 && checkPageBreak(imageHeight + 20)) {
        col = 0;
      }

      const x = margin + (col * (imageWidth + 10));
      
      await addImageToPDF(doc, data.images[i], x, currentY, imageWidth - 5, imageHeight);
      
      // Legenda da imagem
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.textLight);
      const caption = i === 0 ? 'Imagem Principal' : `Imagem ${i + 1}`;
      doc.text(caption, x + (imageWidth - 5) / 2, currentY + imageHeight + 5, { align: 'center' });
      
      col++;
      if (col >= imagesPerRow) {
        col = 0;
        currentY += imageHeight + 15;
      }
    }

    if (col !== 0) {
      currentY += imageHeight + 15;
    }
  }

  // ===== PÁGINA: MODELOS DE DEPOIMENTOS =====
  addNewPage();
  addTitle(EBOOK_DEPOIMENTOS.title, 20);
  currentY += 5;
  addParagraph(EBOOK_DEPOIMENTOS.intro);
  currentY += 5;

  EBOOK_DEPOIMENTOS.templates.forEach((depo, idx) => {
    checkPageBreak(35);
    
    // Box do depoimento
    doc.setFillColor(...COLORS.background);
    doc.roundedRect(margin, currentY, contentWidth, 25, 3, 3, 'F');
    
    // Estrelas
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.accent);
    doc.text('★'.repeat(depo.stars), margin + 5, currentY + 8);
    
    // Texto do depoimento
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'italic');
    const depoLines = doc.splitTextToSize(`"${depo.text}"`, contentWidth - 15);
    doc.text(depoLines, margin + 5, currentY + 15);
    
    // Dica
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.secondary);
    doc.text(`💡 ${depo.tip}`, margin + 5, currentY + 22);
    
    currentY += 30;
  });

  currentY += 5;
  addSubtitle('Como conseguir depoimentos:');
  addBulletList(EBOOK_DEPOIMENTOS.howToUse);

  // ===== PÁGINA: TABELA COMPARATIVA =====
  addNewPage();
  addTitle(EBOOK_COMPARATIVO.title, 20);
  currentY += 5;
  addParagraph(EBOOK_COMPARATIVO.intro);
  currentY += 10;

  // Desenhar tabela
  const colWidths = [45, 40, 40, 40];
  const rowHeight = 12;
  let tableX = margin;
  
  // Header da tabela
  doc.setFillColor(...COLORS.primary);
  doc.rect(tableX, currentY, contentWidth, rowHeight, 'F');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  
  let colX = tableX;
  EBOOK_COMPARATIVO.headers.forEach((header, idx) => {
    doc.text(header, colX + 2, currentY + 8);
    colX += colWidths[idx];
  });
  currentY += rowHeight;

  // Linhas da tabela
  doc.setFont('helvetica', 'normal');
  EBOOK_COMPARATIVO.rows.forEach((row, rowIdx) => {
    checkPageBreak(rowHeight + 5);
    
    // Alternating row colors
    if (rowIdx % 2 === 0) {
      doc.setFillColor(...COLORS.background);
      doc.rect(tableX, currentY, contentWidth, rowHeight, 'F');
    }
    
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(9);
    
    colX = tableX;
    row.forEach((cell, colIdx) => {
      // Destacar coluna "Seu Produto" em verde
      if (colIdx === 1) {
        doc.setTextColor(...COLORS.accent);
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setTextColor(...COLORS.text);
        doc.setFont('helvetica', 'normal');
      }
      doc.text(cell, colX + 2, currentY + 8);
      colX += colWidths[colIdx];
    });
    currentY += rowHeight;
  });

  // Bordas da tabela
  doc.setDrawColor(...COLORS.divider);
  doc.setLineWidth(0.3);
  doc.rect(tableX, currentY - (EBOOK_COMPARATIVO.rows.length * rowHeight) - rowHeight, contentWidth, (EBOOK_COMPARATIVO.rows.length + 1) * rowHeight);

  currentY += 10;
  addSubtitle('💡 Dicas para sua tabela:');
  addBulletList(EBOOK_COMPARATIVO.tips);

  // ===== PÁGINA: CHECKLIST DE IMPLEMENTAÇÃO =====
  addNewPage();
  addTitle(EBOOK_CHECKLIST.title, 20);
  currentY += 5;
  addParagraph(EBOOK_CHECKLIST.intro);
  currentY += 10;

  EBOOK_CHECKLIST.sections.forEach(section => {
    checkPageBreak(60);
    
    // Header da seção
    doc.setFillColor(...COLORS.secondary);
    doc.roundedRect(margin, currentY, contentWidth, 10, 2, 2, 'F');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(section.name, margin + 5, currentY + 7);
    currentY += 15;

    // Itens do checklist
    section.items.forEach(item => {
      addCheckbox(item);
    });
    
    currentY += 8;
  });

  // Dica final
  checkPageBreak(30);
  doc.setFillColor(...COLORS.accent);
  doc.roundedRect(margin, currentY, contentWidth, 20, 3, 3, 'F');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  const tipLines = doc.splitTextToSize(EBOOK_CHECKLIST.finalTip, contentWidth - 10);
  doc.text(tipLines, margin + 5, currentY + 8);
  currentY += 25;

  // ===== PÁGINA FINAL: CONSOLIDAÇÃO =====
  addNewPage();
  
  // Header especial
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('COPIE E COLE', pageWidth / 2, 25, { align: 'center' });
  
  currentY = 55;

  addSubtitle('📋 Descrição Completa');
  if (data.product.descricao) {
    addParagraph(data.product.descricao.substring(0, 1500) + (data.product.descricao.length > 1500 ? '...' : ''));
  } else if (data.unifiedData?.topicos_conversao?.improvedText) {
    addParagraph(data.unifiedData.topicos_conversao.improvedText.substring(0, 1500));
  }

  currentY += 10;

  if (data.unifiedData?.palavras_chave_seo?.keywords?.length) {
    addSubtitle('🏷️ Keywords (separadas por vírgula)');
    addParagraph(data.unifiedData.palavras_chave_seo.keywords.join(', '));
  }

  addFooter();

  // Gerar blob
  return doc.output('blob');
};

// Função para extrair texto do copywriting de forma segura
export const extractCopywritingText = (copywriting: any): string => {
  if (!copywriting) return '';
  
  if (typeof copywriting === 'string') return copywriting;
  
  if (typeof copywriting === 'object') {
    if (copywriting.improvedText) {
      return typeof copywriting.improvedText === 'string' 
        ? copywriting.improvedText 
        : JSON.stringify(copywriting.improvedText);
    }
    return JSON.stringify(copywriting, null, 2);
  }
  
  return '';
};

// Gerar arquivo de texto com keywords
export const generateKeywordsFile = (unifiedData: UnifiedAIResponse | null): string => {
  if (!unifiedData) return '';
  
  const allKeywords: string[] = [];
  
  if (unifiedData.palavras_chave_seo?.keywords) {
    allKeywords.push(...unifiedData.palavras_chave_seo.keywords);
  }
  if (unifiedData.topicos_conversao?.keywords) {
    allKeywords.push(...unifiedData.topicos_conversao.keywords);
  }
  if (unifiedData.cauda_longa?.keywords) {
    allKeywords.push(...unifiedData.cauda_longa.keywords);
  }
  
  // Remover duplicatas
  const uniqueKeywords = [...new Set(allKeywords)];
  
  return uniqueKeywords.join(', ');
};

// Gerar arquivo de FAQ formatado
export const generateFAQFile = (unifiedData: UnifiedAIResponse | null): string => {
  if (!unifiedData?.perguntas_respostas?.faqs?.length) return '';
  
  let content = 'PERGUNTAS FREQUENTES (FAQ)\n';
  content += '═'.repeat(50) + '\n\n';
  
  unifiedData.perguntas_respostas.faqs.forEach((faq, idx) => {
    content += `${idx + 1}. ${faq.question}\n`;
    content += `   R: ${faq.answer}\n\n`;
  });
  
  return content;
};

// Gerar descrição completa formatada
export const generateDescriptionFile = (
  product: Product | SimpleProduct, 
  unifiedData: UnifiedAIResponse | null
): string => {
  let content = `DESCRIÇÃO COMPLETA - ${product.nome}\n`;
  content += '═'.repeat(50) + '\n\n';
  
  if (product.sku) {
    content += `SKU: ${product.sku}\n\n`;
  }
  
  // Verificar se é um Product completo com descricao
  if ('descricao' in product && product.descricao) {
    content += 'DESCRIÇÃO ORIGINAL:\n';
    content += '─'.repeat(30) + '\n';
    content += product.descricao + '\n\n';
  } else if (product.descricao) {
    content += 'DESCRIÇÃO ORIGINAL:\n';
    content += '─'.repeat(30) + '\n';
    content += product.descricao + '\n\n';
  }
  
  if (unifiedData?.topicos_conversao?.improvedText) {
    content += 'DESCRIÇÃO OTIMIZADA:\n';
    content += '─'.repeat(30) + '\n';
    content += unifiedData.topicos_conversao.improvedText + '\n\n';
  }
  
  // Verificar se é um Product completo com descricao_curta
  if ('descricao_curta' in product && product.descricao_curta) {
    content += 'DESCRIÇÃO CURTA:\n';
    content += '─'.repeat(30) + '\n';
    content += product.descricao_curta + '\n';
  }
  
  return content;
};
