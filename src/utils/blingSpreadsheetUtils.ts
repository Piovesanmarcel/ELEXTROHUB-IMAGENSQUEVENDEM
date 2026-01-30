
import { safeBlobDownload } from "./safeDownload";
import * as XLSX from "xlsx";
import { Product } from "./productFilterUtils";
import { formatTopicosConversao, removeEmojis } from "./textProcessingUtils";

// Função para truncar texto se exceder o limite do Excel
const truncateText = (text: string, maxLength: number = 32000): string => {
  if (!text || typeof text !== 'string') return '';
  
  if (text.length <= maxLength) {
    return text;
  }
  
  console.log(`⚠️ Texto truncado de ${text.length} para ${maxLength} caracteres`);
  return text.substring(0, maxLength - 3) + '...';
};

export const processBlingProducts = (eligibleProducts: Product[], aiResultsMap: Map<string, any>) => {
  const blingEnhancedProducts = [];
  
  for (let i = 0; i < eligibleProducts.length; i++) {
    const product = eligibleProducts[i];
    console.log(`⏳ Processando ${i + 1}/${eligibleProducts.length}: ${product.sku || 'SKU não definido'}`);
    
    // Buscar tópicos de conversão do mapa
    let topicosConversao = '';
    const aiResult = aiResultsMap.get(product.id);
    
    if (aiResult && aiResult.topicos_conversao) {
      console.log(`🔍 Estrutura topicos_conversao:`, typeof aiResult.topicos_conversao);
      
      // CORREÇÃO PRINCIPAL: Extrair apenas o improvedText
      if (typeof aiResult.topicos_conversao === 'string') {
        // Se for string, processar diretamente
        topicosConversao = formatTopicosConversao(aiResult.topicos_conversao);
      } else if (typeof aiResult.topicos_conversao === 'object' && aiResult.topicos_conversao !== null) {
        // Se for objeto, verificar se tem improvedText
        if (aiResult.topicos_conversao.improvedText) {
          // Usar diretamente o improvedText mas remover emojis e cabeçalho
          let rawText = aiResult.topicos_conversao.improvedText;
          // Remover o cabeçalho "**🔍 DESCRIÇÃO SEO OTIMIZADA**"
          rawText = rawText.replace(/\*\*🔍\s*DESCRIÇÃO\s+SEO\s+OTIMIZADA\*\*/gi, '').trim();
          // Remover quebras de linha no início
          rawText = rawText.replace(/^[\n\r\s]+/, '');
          // Remover emojis
          topicosConversao = removeEmojis(rawText);
          console.log(`✅ Usando improvedText processado para ${product.sku}`);
        } else if (aiResult.topicos_conversao.content) {
          topicosConversao = formatTopicosConversao(aiResult.topicos_conversao.content);
        } else {
          // Se for objeto mas sem improvedText, converter para string e processar
          topicosConversao = formatTopicosConversao(JSON.stringify(aiResult.topicos_conversao));
        }
      }
      
      // CORREÇÃO CRÍTICA: Truncar tópicos se necessário
      topicosConversao = truncateText(topicosConversao, 32000);
      console.log(`✅ Tópicos processados para ${product.sku}: ${topicosConversao.length} caracteres`);
    } else {
      console.log(`ℹ️ Tópicos não encontrados para ${product.sku}`);
    }

    // Compilar URLs de imagens melhoradas e truncar se necessário
    const enhancedImageUrls = [
      product.imagem_melhorada_1,
      product.imagem_melhorada_2,
      product.imagem_melhorada_3,
      product.imagem_melhorada_4,
      product.imagem_melhorada_5,
      product.imagem_melhorada_6,
      product.imagem_melhorada_7,
      product.imagem_melhorada_8,
      product.imagem_melhorada_9,
      product.imagem_melhorada_10,
    ].filter(url => url && url.trim()).join('|');

    // CORREÇÃO: Truncar URLs se muito longas
    const truncatedImageUrls = truncateText(enhancedImageUrls, 32000);

    console.log(`📸 Imagens melhoradas para ${product.sku}: ${truncatedImageUrls ? truncatedImageUrls.split('|').length : 0} URLs (${truncatedImageUrls.length} chars)`);

    // Criar objeto formatado para o Bling
    const formattedProduct = createBlingFormattedProduct(product, topicosConversao, truncatedImageUrls, (product as any).kitQuantity);
    blingEnhancedProducts.push(formattedProduct);
    console.log(`✅ Produto ${product.sku} formatado com sucesso`);
  }

  return blingEnhancedProducts;
};

export const createBlingFormattedProduct = (product: Product, topicosConversao: string, enhancedImageUrls: string, kitQuantity?: number) => {
  // Função para garantir que todos os campos de texto estejam dentro do limite
  const safeText = (text: any, maxLength: number = 32000): string => {
    if (!text) return '';
    const textStr = String(text);
    return truncateText(textStr, maxLength);
  };

  const multiplier = kitQuantity || 1;
  
  const calculateBoxDimensions = (original: number | null | undefined): number => {
    if (!original || multiplier === 1) return original || 0;
    if (multiplier <= 6) return original;
    if (multiplier <= 10) return Math.round(original * 1.5);
    return Math.round(original * 2);
  };

  return {
    'ID': safeText(product.bling_id || ''),
    'Código': safeText(product.sku || ''),
    'Descrição': safeText(product.nome || ''),
    'Unidade': safeText(product.unidade || 'UN'),
    'NCM': '',
    'Origem': '0',
    'Preço': (product.preco || 0) * multiplier,
    'Valor IPI fixo': 0,
    'Observações': '',
    'Situação': 'Ativo',
    'Estoque': product.estoque || 0,
    'Preço de custo': (product.preco_custo || 0) * multiplier,
    'Cód. no fornecedor': safeText(product.codigo_fornecedor || ''),
    'Fornecedor': safeText(product.nome_fornecedor || ''),
    'Localização': '',
    'Estoque máximo': 0,
    'Estoque mínimo': 0,
    'Peso líquido (Kg)': 0,
    'Peso bruto (Kg)': (product.peso_bruto || 0) * multiplier,
    'GTIN/EAN': safeText(product.gtin || ''),
    'GTIN/EAN da Embalagem': safeText(product.gtin || ''),
    'Largura do produto': calculateBoxDimensions(product.largura),
    'Altura do Produto': calculateBoxDimensions(product.altura),
    'Profundidade do produto': product.profundidade ? Math.round(product.profundidade * multiplier) : 0,
    'Data Validade': '',
    'Descrição do Produto no Fornecedor': '',
    'Descrição Complementar': safeText(product.descricao || ''),
    'Itens p/ caixa': 0,
    'Produto Variação': 'Variação',
    'Tipo Produção': 'Própria',
    'Classe de enquadramento do IPI': '',
    'Código na Lista de Serviços': '',
    'Tipo do item': '',
    'Grupo de Tags/Tags': '',
    'Tributos': '',
    'Código Pai': 0,
    'Código Integração': '',
    'Grupo de produtos': 0,
    'Marca': safeText(product.marca || ''),
    'CEST': '',
    'Volumes': 1,
    'Descrição Curta': safeText(topicosConversao || product.descricao_curta || '', 32000),
    'Cross-Docking': 0,
    'URL Imagens Externas': safeText(enhancedImageUrls || '', 32000),
    'Link Externo': '',
    'Meses Garantia no Fornecedor': 0,
    'Clonar dados do pai': 'NÃO',
    'Condição do Produto': 'NOVO',
    'Frete Grátis': 'NÃO',
    'Número FCI': '',
    'Vídeo': '',
    'Departamento': '',
    'Unidade de Medida': 'Centímetro',
    'Preço de Compra': (product.preco_custo || 0) * multiplier,
    'Valor base ICMS ST para retenção': 0,
    'Valor ICMS ST para retenção': 0,
    'Valor ICMS próprio do substituto': 0,
    'Categoria do produto': '',
    'Informações Adicionais': '',
  };
};

export const generateExcelFile = (blingEnhancedProducts: any[]) => {
  console.log("📋 Criando workbook Excel...");
  
  // Verificar se há produtos com campos muito longos
  blingEnhancedProducts.forEach((product, index) => {
    Object.entries(product).forEach(([key, value]) => {
      if (typeof value === 'string' && value.length > 32000) {
        console.warn(`⚠️ Campo '${key}' no produto ${index + 1} tem ${value.length} caracteres (limite: 32000)`);
      }
    });
  });
  
  const workbook = XLSX.utils.book_new();
  console.log("📋 Workbook criado");
  
  const worksheet = XLSX.utils.json_to_sheet(blingEnhancedProducts);
  console.log("📋 Worksheet criado");
  
  XLSX.utils.book_append_sheet(workbook, worksheet, "Produtos Bling Melhorados");
  console.log("📋 Worksheet adicionado ao workbook");

  return workbook;
};

export const downloadExcelFile = async (workbook: XLSX.WorkBook, fileName: string) => {
  console.log(`💾 Nome do arquivo: ${fileName}`);
  console.log("🔄 Iniciando download...");
  
  try {
    XLSX.writeFile(workbook, fileName);
    console.log("🎉 Download executado com sucesso!");
    return true;
  } catch (downloadError) {
    console.error("❌ ERRO ESPECÍFICO NO DOWNLOAD:", downloadError);
    
    // Tentar método alternativo de download
    console.log("🔄 Tentando método alternativo...");
    
    try {
      const wbout = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'array',
        compression: true 
      });
      
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      console.log(`📦 Blob criado com tamanho: ${blob.size} bytes`);
      
      await safeBlobDownload(blob, fileName);
      
      console.log("🎉 Download alternativo executado com sucesso!");
      return true;
      
    } catch (alternativeError) {
      console.error("❌ ERRO NO MÉTODO ALTERNATIVO:", alternativeError);
      throw alternativeError;
    }
  }
};
