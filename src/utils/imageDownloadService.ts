import JSZip from 'jszip';
import { Product } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';

export interface ImageDownloadResult {
  success: boolean;
  total: number;
  successful: number;
  images: Array<{
    url: string;
    data: string;
    contentType: string;
    size: number;
  }>;
}

export const downloadImagesFromProxy = async (imageUrls: string[]): Promise<ImageDownloadResult> => {
  const MAX_IMAGES_PER_REQUEST = 20;
  
  // Validação rigorosa do limite
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    throw new Error('Lista de URLs de imagem inválida ou vazia');
  }

  if (imageUrls.length > MAX_IMAGES_PER_REQUEST) {
    throw new Error(`Muitas imagens para processar de uma vez. Máximo: ${MAX_IMAGES_PER_REQUEST}, encontradas: ${imageUrls.length}. Tente filtrar menos produtos por página.`);
  }

  // Validar cada URL individualmente
  const validUrls = imageUrls.filter(url => {
    if (!url || typeof url !== 'string') return false;
    const trimmedUrl = url.trim();
    if (trimmedUrl === '') return false;
    
    try {
      new URL(trimmedUrl);
      return /\.(jpg|jpeg|png|webp|gif|bmp|svg)(\?.*)?$/i.test(trimmedUrl);
    } catch {
      return false;
    }
  });

  if (validUrls.length === 0) {
    throw new Error('Nenhuma URL de imagem válida encontrada');
  }

  console.log(`🔍 URLs validadas: ${validUrls.length}/${imageUrls.length}`);

  try {
    console.log(`📤 Enviando ${validUrls.length} URLs válidas para o proxy...`);

    const { data: result, error } = await supabase.functions.invoke('download-images-proxy', {
      body: { imageUrls: validUrls }
    });

    if (error) {
      console.error(`❌ Erro na chamada:`, error);
      throw new Error(`Erro do servidor: ${error.message}`);
    }
    
    if (!result.success) {
      throw new Error(result.error || 'Erro desconhecido do servidor de download');
    }

    // Validar estrutura da resposta
    if (!result.images || !Array.isArray(result.images)) {
      throw new Error('Resposta do servidor inválida - dados de imagens ausentes');
    }

    console.log(`✅ Resposta do proxy válida: ${result.successful}/${result.total} imagens`);
    
    return result;

  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('❌ Timeout na requisição para o proxy');
      throw new Error('Timeout no download - tente com menos produtos');
    }
    
    console.error('❌ Erro na requisição para o proxy:', error);
    throw error;
  }
};

export const createProductImageMapping = (products: Product[]) => {
  const allImageUrls: string[] = [];
  const imageToProductMap: Record<string, { product: Product; imageIndex: number }> = {};

  products.forEach((product) => {
    const potentialUrls = [
      product.imagem_url,
      product.imagem_url_2,
      product.imagem_url_3,
      product.imagem_url_4,
      product.imagem_url_5,
      product.imagem_url_6,
      product.imagem_url_7,
      product.imagem_url_8,
      product.imagem_url_9,
      product.imagem_url_10,
    ];

    const validImageUrls = potentialUrls.filter(url => {
      if (!url || typeof url !== 'string') return false;
      const trimmedUrl = url.trim();
      if (trimmedUrl === '') return false;
      
      // Validação mais rigorosa da URL
      try {
        new URL(trimmedUrl);
        return /\.(jpg|jpeg|png|webp|gif|bmp|svg)(\?.*)?$/i.test(trimmedUrl);
      } catch {
        return false;
      }
    });

    console.log(`📋 Produto ${product.sku}: ${validImageUrls.length} imagens válidas encontradas`);
    
    validImageUrls.forEach((imageUrl, index) => {
      const cleanUrl = imageUrl!.trim();
      allImageUrls.push(cleanUrl);
      imageToProductMap[cleanUrl] = { product, imageIndex: index };
      console.log(`🔗 Mapeando: ${cleanUrl} -> ${product.sku}[${index}]`);
    });
  });

  return { allImageUrls, imageToProductMap };
};
