
import { Product } from '@/lib/supabase';
import { downloadImagesFromProxy, createProductImageMapping } from './imageDownloadService';
import { processImagesAndCreateZip, downloadZipFile } from './zipGenerator';

export const downloadAllProductImages = async (products: Product[]) => {
  console.log(`🚀 Iniciando download via proxy para ${products.length} produtos`);

  try {
    // Coletar e validar todas as URLs de imagens
    const { allImageUrls, imageToProductMap } = createProductImageMapping(products);

    console.log(`📊 Total de ${allImageUrls.length} imagens válidas para baixar`);
    console.log(`🗺️ Mapeamento criado para ${Object.keys(imageToProductMap).length} URLs`);

    if (allImageUrls.length === 0) {
      throw new Error('Nenhuma imagem válida encontrada para download');
    }

    // Se há mais de 20 imagens, processar em lotes
    const BATCH_SIZE = 20;
    const allDownloadedImages: any[] = [];
    const totalBatches = Math.ceil(allImageUrls.length / BATCH_SIZE);

    console.log(`📦 Processando ${allImageUrls.length} imagens em ${totalBatches} lotes de até ${BATCH_SIZE} imagens`);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * BATCH_SIZE;
      const endIndex = Math.min(startIndex + BATCH_SIZE, allImageUrls.length);
      const batchUrls = allImageUrls.slice(startIndex, endIndex);

      console.log(`📤 Processando lote ${batchIndex + 1}/${totalBatches}: ${batchUrls.length} imagens`);

      try {
        // Fazer requisição para a Edge Function
        const result = await downloadImagesFromProxy(batchUrls);

        console.log(`📥 Lote ${batchIndex + 1} resultado: ${result.successful}/${result.total} imagens baixadas`);

        if (result.successful === 0) {
          console.warn(`⚠️ Lote ${batchIndex + 1} falhou completamente, continuando com próximo lote`);
          continue;
        }

        if (result.images && Array.isArray(result.images)) {
          allDownloadedImages.push(...result.images);
        }

        // Pequena pausa entre lotes para não sobrecarregar o servidor
        if (batchIndex < totalBatches - 1) {
          console.log(`⏳ Aguardando 2 segundos antes do próximo lote...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (batchError) {
        console.error(`❌ Erro no lote ${batchIndex + 1}:`, batchError);
        // Continue com o próximo lote mesmo se um falhar
        continue;
      }
    }

    console.log(`📊 Resultado final: ${allDownloadedImages.length} imagens baixadas de ${allImageUrls.length} solicitadas`);

    if (allDownloadedImages.length === 0) {
      throw new Error('Nenhuma imagem foi baixada com sucesso de nenhum lote');
    }

    // Criar resultado consolidado
    const consolidatedResult = {
      success: true,
      images: allDownloadedImages,
      total: allImageUrls.length,
      successful: allDownloadedImages.length
    };

    // Processar as imagens baixadas e criar ZIP
    console.log(`🔄 Processando ${allDownloadedImages.length} imagens para criar ZIP...`);
    const zipContent = await processImagesAndCreateZip(consolidatedResult, imageToProductMap);
    
    // Verificar se o ZIP foi criado com sucesso
    if (!zipContent || zipContent.size === 0) {
      throw new Error('Falha ao criar arquivo ZIP - arquivo vazio');
    }

    // Fazer download do ZIP
    downloadZipFile(zipContent, products);
    
    console.log(`🎉 Download concluído! ZIP criado com ${zipContent.size} bytes contendo ${allDownloadedImages.length} imagens`);

  } catch (error) {
    console.error('❌ Erro detalhado no download:', error);
    
    // Melhor tratamento de diferentes tipos de erro
    if (error?.name === 'AbortError') {
      throw new Error('Timeout no download - tente com menos produtos ou aguarde alguns minutos');
    }
    
    if (error?.message?.includes('fetch')) {
      throw new Error('Erro de conexão - verifique sua conexão com a internet');
    }
    
    // Se já é um erro tratado, repassar
    if (error instanceof Error) {
      throw error;
    }
    
    // Erro genérico
    throw new Error('Erro interno no download das imagens');
  }
};
