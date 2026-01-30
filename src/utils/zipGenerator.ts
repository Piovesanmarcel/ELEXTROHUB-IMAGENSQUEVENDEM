
import { safeBlobDownload } from "./safeDownload";
import JSZip from 'jszip';
import { Product } from '@/lib/supabase';
import { ImageDownloadResult } from './imageDownloadService';

export const processImagesAndCreateZip = async (
  result: ImageDownloadResult,
  imageToProductMap: Record<string, { product: Product; imageIndex: number }>
): Promise<Blob> => {
  const zip = new JSZip();
  let addedFiles = 0;
  const processedProducts = new Set<string>();
  const errors: string[] = [];
  
  console.log(`🔄 Processando ${result.images.length} imagens baixadas...`);
  
  result.images.forEach((imageData: any, index: number) => {
    try {
      console.log(`🔍 Processando imagem ${index + 1}: ${imageData.url}`);
      
      if (!imageData.url || !imageData.data) {
        console.error(`❌ Imagem ${index + 1} tem dados inválidos`);
        errors.push(`Imagem ${index + 1}: dados inválidos`);
        return;
      }

      const mapping = imageToProductMap[imageData.url];
      if (!mapping) {
        console.error(`❌ URL não encontrada no mapeamento: ${imageData.url}`);
        errors.push(`URL não mapeada: ${imageData.url}`);
        return;
      }

      const { product, imageIndex } = mapping;
      const folderName = `${product.sku}_${product.nome.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}`.substring(0, 100);
      processedProducts.add(product.sku);
      
      // Determinar extensão do arquivo
      let extension = 'jpg';
      if (imageData.contentType) {
        if (imageData.contentType.includes('png')) extension = 'png';
        else if (imageData.contentType.includes('gif')) extension = 'gif';
        else if (imageData.contentType.includes('webp')) extension = 'webp';
      }
      
      const fileName = `${product.sku}_imagem_${imageIndex + 1}.${extension}`;
      
      // Conversão base64 simplificada
      try {
        const base64Data = imageData.data;
        
        console.log(`🔍 Convertendo base64 para ${fileName}: ${base64Data.length} caracteres`);
        
        // Validação básica do base64
        if (!base64Data || typeof base64Data !== 'string' || base64Data.length === 0) {
          throw new Error('Dados base64 inválidos ou vazios');
        }
        
        // Conversão direta - o servidor já envia base64 válido
        let binaryString;
        try {
          binaryString = atob(base64Data);
        } catch (e) {
          throw new Error('Falha na decodificação base64: ' + e.message);
        }
        
        if (!binaryString || binaryString.length === 0) {
          throw new Error('Decodificação resultou em dados vazios');
        }
        
        // Criar array de bytes
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        if (bytes.length === 0) {
          throw new Error('Conversão resultou em array vazio');
        }
        
        // Verificar se os dados fazem sentido
        if (bytes.length < 100) {
          throw new Error('Arquivo muito pequeno, possível corrupção');
        }
        
        const folder = zip.folder(folderName);
        if (!folder) {
          throw new Error('Falha ao criar pasta no ZIP');
        }
        
        folder.file(fileName, bytes);
        addedFiles++;
        
        console.log(`✅ Adicionada ao ZIP: ${folderName}/${fileName} (${bytes.length} bytes)`);
      } catch (conversionError) {
        console.error(`❌ Erro ao converter imagem ${fileName}:`, conversionError);
        errors.push(`Erro na conversão ${fileName}: ${conversionError.message}`);
      }
    } catch (processingError) {
      console.error(`❌ Erro ao processar imagem ${index + 1}:`, processingError);
      errors.push(`Erro no processamento ${index + 1}: ${processingError.message}`);
    }
  });

  console.log(`📋 Resumo: ${processedProducts.size} produtos processados, ${addedFiles} imagens adicionadas`);
  
  if (errors.length > 0) {
    console.warn(`⚠️ Erros encontrados:`, errors);
  }

  if (addedFiles === 0) {
    const errorDetails = errors.length > 0 ? `\n\nDetalhes dos erros:\n${errors.join('\n')}` : '';
    throw new Error(`Nenhuma imagem foi adicionada ao arquivo ZIP${errorDetails}`);
  }

  // Gerar o arquivo ZIP
  console.log(`📦 Gerando arquivo ZIP com ${addedFiles} imagens...`);
  const content = await zip.generateAsync({ 
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
  
  // Verificar se o ZIP foi gerado corretamente
  if (!content || content.size === 0) {
    throw new Error('Falha ao gerar arquivo ZIP');
  }

  return content;
};

export const downloadZipFile = async (content: Blob, products: Product[]) => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = products.length === 1 
    ? `imagens_${products[0].sku}_${timestamp}.zip`
    : `imagens_produtos_${timestamp}.zip`;
  
  await safeBlobDownload(content, filename);
};
