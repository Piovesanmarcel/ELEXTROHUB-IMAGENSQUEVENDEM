import JSZip from 'jszip';
import { safeBlobDownload } from './safeDownload';
import { Product } from '@/lib/supabase';
import { UnifiedAIResponse } from '@/components/product/ai-enhancer/types';
import { 
  generateEbookPDF, 
  extractCopywritingText,
  generateKeywordsFile,
  generateFAQFile,
  generateDescriptionFile
} from './ebookGenerator';
import { README_CONTENT } from './ebookTemplates';

// Tipo simplificado para produto (usado no Gerador)
interface SimpleProduct {
  nome: string;
  descricao?: string | null;
  sku?: string;
}

interface PackageOptions {
  product: Product | SimpleProduct;
  unifiedData?: UnifiedAIResponse | null;
  copywritingText?: string;
  images?: Array<{ url: string; type?: string }>;
  onProgress?: (stage: string, percent: number) => void;
  templateId?: string;
  includeImagesInPDF?: boolean;
}

export const createCompleteZipPackage = async (options: PackageOptions): Promise<void> => {
  const { product, unifiedData, copywritingText, images = [], onProgress, templateId, includeImagesInPDF = true } = options;
  
  const zip = new JSZip();
  const report = (stage: string, percent: number) => onProgress?.(stage, percent);

  try {
    // 1. Gerar eBook PDF
    report('Gerando eBook PDF', 10);
    
    // Extrair URLs das imagens para o PDF
    const imageUrls = images.map(img => img.url);
    
    const pdfBlob = await generateEbookPDF({
      product: product as any, // Compatível com tipo parcial
      unifiedData,
      copywritingText: copywritingText || extractCopywritingText(unifiedData?.copywriting),
      images: imageUrls,
      templateId: templateId || 'professional',
      includeImagesInPDF
    });
    
    const ebookFolder = zip.folder('ebook');
    if (ebookFolder) {
      const pdfArrayBuffer = await pdfBlob.arrayBuffer();
      ebookFolder.file('Guia_Marketing.pdf', pdfArrayBuffer);
    }
    
    report('eBook criado', 30);

    // 2. Criar pasta de textos
    report('Organizando textos', 40);
    
    const textosFolder = zip.folder('textos');
    if (textosFolder) {
      // Descrição completa
      const descricao = generateDescriptionFile(product as any, unifiedData || null);
      if (descricao) {
        textosFolder.file('descricao_completa.txt', descricao);
      }
      
      // Keywords
      const keywords = generateKeywordsFile(unifiedData);
      if (keywords) {
        textosFolder.file('keywords.txt', keywords);
      }
      
      // FAQ
      const faq = generateFAQFile(unifiedData);
      if (faq) {
        textosFolder.file('faq.txt', faq);
      }
      
      // Copywriting
      const copyText = copywritingText || extractCopywritingText(unifiedData?.copywriting);
      if (copyText) {
        textosFolder.file('copywriting.txt', copyText);
      }
      
      // Tópicos de conversão
      if (unifiedData?.topicos_conversao?.improvedText) {
        textosFolder.file('topicos_conversao.txt', unifiedData.topicos_conversao.improvedText);
      }
      
      // Kits criativos
      if (unifiedData?.kits_criativos?.improvedText) {
        textosFolder.file('kits_criativos.txt', unifiedData.kits_criativos.improvedText);
      }
    }
    
    report('Textos organizados', 50);

    // 3. Baixar e organizar imagens
    if (images.length > 0) {
      report('Baixando imagens', 60);
      
      const imagensFolder = zip.folder('imagens');
      
      // Organizar por tipo
      const fundoBrancoFolder = imagensFolder?.folder('fundo_branco');
      const ambientadasFolder = imagensFolder?.folder('ambientadas');
      const marketingFolder = imagensFolder?.folder('marketing');
      
      let downloadedCount = 0;
      const totalImages = images.length;
      
      for (const image of images) {
        try {
          const response = await fetch(image.url);
          if (response.ok) {
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            
            // Determinar extensão
            let extension = 'jpg';
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('png')) extension = 'png';
            else if (contentType.includes('webp')) extension = 'webp';
            
            // Determinar pasta baseado no tipo
            const imageType = image.type?.toLowerCase() || '';
            let targetFolder = imagensFolder;
            
            if (imageType.includes('branco') || imageType.includes('white')) {
              targetFolder = fundoBrancoFolder;
            } else if (imageType.includes('ambient') || imageType.includes('lifestyle')) {
              targetFolder = ambientadasFolder;
            } else if (imageType.includes('market') || imageType.includes('cta')) {
              targetFolder = marketingFolder;
            }
            
            const fileName = `imagem_${String(downloadedCount + 1).padStart(2, '0')}.${extension}`;
            targetFolder?.file(fileName, arrayBuffer);
            downloadedCount++;
            
            const progress = 60 + Math.round((downloadedCount / totalImages) * 25);
            report(`Baixando imagens (${downloadedCount}/${totalImages})`, progress);
          }
        } catch (error) {
          console.warn(`Erro ao baixar imagem: ${image.url}`, error);
        }
      }
    }
    
    report('Imagens organizadas', 85);

    // 4. Adicionar imagens do produto original se disponíveis (apenas para Product completo)
    if ('imagem_url' in product) {
      const productImages = getProductImageUrls(product as Product);
      if (productImages.length > 0 && images.length === 0) {
        report('Adicionando imagens do produto', 75);
        
        const imagensFolder = zip.folder('imagens');
        const originalFolder = imagensFolder?.folder('originais');
        
        let count = 0;
        for (const imgUrl of productImages) {
          try {
            const response = await fetch(imgUrl);
            if (response.ok) {
              const blob = await response.blob();
              const arrayBuffer = await blob.arrayBuffer();
              
              let extension = 'jpg';
              const contentType = response.headers.get('content-type') || '';
              if (contentType.includes('png')) extension = 'png';
              else if (contentType.includes('webp')) extension = 'webp';
              
              originalFolder?.file(`original_${count + 1}.${extension}`, arrayBuffer);
              count++;
            }
          } catch (error) {
            console.warn(`Erro ao baixar imagem original: ${imgUrl}`);
          }
        }
      }
    }

    // 5. Adicionar README
    report('Finalizando pacote', 90);
    zip.file('README.txt', README_CONTENT);

    // 6. Gerar e baixar ZIP
    report('Compactando arquivos', 95);
    
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    // Nome do arquivo
    const timestamp = new Date().toISOString().split('T')[0];
    const safeName = product.nome.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_').substring(0, 30);
    const sku = product.sku || `gerador_${Date.now()}`;
    const fileName = `${sku}_${safeName}_kit_completo_${timestamp}.zip`;

    await safeBlobDownload(zipBlob, fileName);
    
    report('Concluído', 100);
    
    console.log(`✅ Kit completo gerado: ${fileName} (${(zipBlob.size / 1024 / 1024).toFixed(2)} MB)`);

  } catch (error) {
    console.error('❌ Erro ao gerar pacote completo:', error);
    throw error;
  }
};

// Helper para extrair URLs de imagens do produto
const getProductImageUrls = (product: Product): string[] => {
  const urls: string[] = [];
  
  // Imagens originais
  const originalFields = [
    'imagem_url', 'imagem_url_2', 'imagem_url_3', 'imagem_url_4', 'imagem_url_5',
    'imagem_url_6', 'imagem_url_7', 'imagem_url_8', 'imagem_url_9', 'imagem_url_10'
  ];
  
  // Imagens melhoradas
  const enhancedFields = [
    'imagem_melhorada_1', 'imagem_melhorada_2', 'imagem_melhorada_3', 'imagem_melhorada_4', 'imagem_melhorada_5',
    'imagem_melhorada_6', 'imagem_melhorada_7', 'imagem_melhorada_8', 'imagem_melhorada_9', 'imagem_melhorada_10'
  ];
  
  // Priorizar imagens melhoradas
  enhancedFields.forEach(field => {
    const url = (product as any)[field];
    if (url && typeof url === 'string' && url.startsWith('http')) {
      urls.push(url);
    }
  });
  
  // Adicionar originais se não houver melhoradas
  if (urls.length === 0) {
    originalFields.forEach(field => {
      const url = (product as any)[field];
      if (url && typeof url === 'string' && url.startsWith('http')) {
        urls.push(url);
      }
    });
  }
  
  return urls;
};
