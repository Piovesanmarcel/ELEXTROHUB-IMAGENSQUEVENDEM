/**
 * Helper simplificado - SEM hospedagem R2
 * Apenas dispara eventos para atualização da galeria
 */

import { supabase } from '@/integrations/supabase/client';

interface HostAndSaveOptions {
  imageUrl: string;
  productId: string;
  productName: string;
  source: string;
  templateName?: string;
  tags?: string[];
  originalSource?: string;
}

interface HostAndSaveResult {
  success: boolean;
  hostedUrl?: string;
  imageId?: string;
  error?: string;
}

/**
 * Versão simplificada - sem hospedagem R2
 * Apenas retorna a URL original e dispara evento
 */
export async function hostAndSaveGeneratedImage(options: HostAndSaveOptions): Promise<HostAndSaveResult> {
  const { imageUrl, productId, productName, source, templateName, tags = [], originalSource } = options;

  console.log(`🔄 [HOST-SAVE] Processando imagem (sem R2): source=${source}, productId=${productId}`);

  try {
    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('❌ [HOST-SAVE] Usuário não autenticado');
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Montar tags finais
    const finalTags = [
      `product:${productId}`,
      `source:${source}`,
      ...tags,
      ...(originalSource ? [`original-source:${originalSource}`] : [])
    ];

    // Usar URL original diretamente (sem hospedagem R2)
    const hostedUrl = imageUrl;
    console.log(`✅ [HOST-SAVE] Usando URL direta (sem R2): ${hostedUrl.substring(0, 80)}...`);

    // Disparar evento para galeria atualizar
    window.dispatchEvent(new CustomEvent('hostedImageSaved', {
      detail: {
        url: hostedUrl,
        hostedUrl: hostedUrl,
        imageId: `local-${Date.now()}`,
        productId,
        source,
        tags: finalTags
      }
    }));

    return {
      success: true,
      hostedUrl: hostedUrl,
      imageId: `local-${Date.now()}`
    };
  } catch (error) {
    console.error('❌ [HOST-SAVE] Erro inesperado:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Processa múltiplas imagens
 */
export async function hostAndSaveMultipleImages(
  images: string[],
  options: Omit<HostAndSaveOptions, 'imageUrl'>
): Promise<HostAndSaveResult[]> {
  console.log(`🔄 [HOST-SAVE] Processando ${images.length} imagens (sem R2)...`);
  
  const results = await Promise.all(
    images.map((imageUrl, index) => 
      hostAndSaveGeneratedImage({
        ...options,
        imageUrl,
        templateName: options.templateName ? `${options.templateName}-${index + 1}` : undefined
      })
    )
  );

  const successCount = results.filter(r => r.success).length;
  console.log(`✅ [HOST-SAVE] ${successCount}/${images.length} imagens processadas`);

  return results;
}
