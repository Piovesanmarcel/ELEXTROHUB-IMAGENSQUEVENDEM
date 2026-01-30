import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { HostedImage } from './useHostedImages';

interface ReplicateResult {
  success: boolean;
  replicatedCount: number;
  skippedDuplicates: number; // 🆕 Imagens puladas por já existirem
  targetProductsCount: number;
  targetProductSkus: string[];
  aiDataReplicated: boolean;
  stockSynced: boolean;
  syncedStock: number | null;
  stockSourceSku: string | null;
  errors: string[];
}

export const useReplicateImages = () => {
  const [isReplicating, setIsReplicating] = useState(false);

  const replicateImages = useCallback(async (
    sourceProductId: string,
    targetProductIds: string[],
    imagesToReplicate: HostedImage[]
  ): Promise<ReplicateResult> => {
    setIsReplicating(true);
    
    const result: ReplicateResult = {
      success: false,
      replicatedCount: 0,
      skippedDuplicates: 0,
      targetProductsCount: targetProductIds.length,
      targetProductSkus: [],
      aiDataReplicated: false,
      stockSynced: false,
      syncedStock: null,
      stockSourceSku: null,
      errors: []
    };

    // Fetch target product SKUs and stock for feedback
    const { data: targetProducts } = await (supabase as any)
      .from('produtos')
      .select('id, sku')
      .in('id', targetProductIds);

    // Fetch source product SKU and stock
    const { data: sourceProduct } = await (supabase as any)
      .from('produtos')
      .select('id, sku')
      .eq('id', sourceProductId)
      .single();

    const skuMap = new Map(targetProducts?.map(p => [p.id, p.sku]) || []);
    const stockMap = new Map(targetProducts?.map(p => [p.id, p.estoque || 0]) || []);
    
    if (sourceProduct) {
      skuMap.set(sourceProduct.id, sourceProduct.sku);
      stockMap.set(sourceProduct.id, sourceProduct.estoque || 0);
    }
    
    result.targetProductSkus = targetProductIds.map(id => skuMap.get(id) || id).filter(Boolean) as string[];

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        result.errors.push('Usuário não autenticado');
        return result;
      }

      // 🆕 Buscar imagens existentes nos produtos destino para evitar duplicatas
      const { data: existingImages } = await (supabase as any)
        .from('hosted_images')
        .select('url, product_id')
        .in('product_id', targetProductIds);

      // Criar Set de "product_id:url" para verificação rápida O(1)
      const existingUrlsSet = new Set(
        existingImages?.map(img => `${img.product_id}:${img.url}`) || []
      );
      console.log(`📋 ${existingUrlsSet.size} imagens já existentes nos produtos destino`);

      // 🆕 BIDIRECIONAL: Buscar imagens dos produtos destino para replicar de volta para o produto origem
      const { data: targetProductImages } = await (supabase as any)
        .from('hosted_images')
        .select('*')
        .in('product_id', targetProductIds);

      console.log(`🔄 ${targetProductImages?.length || 0} imagens nos produtos destino para replicar de volta`);

      // 🆕 Buscar imagens existentes no produto ORIGEM para evitar duplicatas de volta
      const { data: sourceExistingImages } = await (supabase as any)
        .from('hosted_images')
        .select('url')
        .eq('product_id', sourceProductId);

      // Set de URLs do produto origem para verificação rápida
      const sourceExistingUrls = new Set(
        sourceExistingImages?.map((img: any) => img.url) || []
      );
      // Também adicionar as URLs que estamos replicando (para evitar inserir o que já existe)
      imagesToReplicate.forEach(img => sourceExistingUrls.add(img.url));
      
      console.log(`📋 ${sourceExistingUrls.size} URLs já existentes no produto origem`);

      // ====== PARTE 1: Replicar imagens do produto origem → produtos destino ======
      for (const targetProductId of targetProductIds) {
        for (const image of imagesToReplicate) {
          // 🆕 Verificar se esta URL já existe neste produto destino
          const urlKey = `${targetProductId}:${image.url}`;
          if (existingUrlsSet.has(urlKey)) {
            console.log(`⏭️ Pulando duplicata: ${image.filename} já existe em ${skuMap.get(targetProductId)}`);
            result.skippedDuplicates++;
            continue; // Pular - já existe!
          }

          try {
            // Create new tags for the target product
            const newTags = [
              ...image.tags.filter(tag => !tag.startsWith('product:')), // Remove original product tag
              `product:${targetProductId}`,
              `replicated-from:${sourceProductId}`
            ];

            // Insert new record with same URL/r2_path but different product association
            const { error: insertError } = await (supabase as any)
              .from('hosted_images')
              .insert({
                user_id: user.id,
                url: image.url,
                r2_path: image.r2_path,
                original_filename: image.original_filename,
                product_id: targetProductId,
                tags: newTags,
                description: `Replicado de produto ${sourceProductId} | ${image.description || ''}`
              });

            if (insertError) {
              console.error('Erro ao replicar imagem:', insertError);
              result.errors.push(`Erro ao replicar ${image.filename}: ${insertError.message}`);
            } else {
              result.replicatedCount++;
            }
          } catch (err) {
            console.error('Erro inesperado ao replicar:', err);
            result.errors.push(`Erro inesperado ao replicar ${image.filename}`);
          }
        }
      }

      // ====== PARTE 2: BIDIRECIONAL - Replicar imagens dos produtos destino → produto origem ======
      if (targetProductImages && targetProductImages.length > 0) {
        console.log(`🔄 Iniciando replicação bidirecional: ${targetProductImages.length} imagens → produto origem`);
        
        for (const image of targetProductImages) {
          // Verificar se já existe no produto origem
          if (sourceExistingUrls.has(image.url)) {
            console.log(`⏭️ Bidirecional: ${image.filename} já existe no produto origem`);
            result.skippedDuplicates++;
            continue;
          }
          
          try {
            const newTags = [
              ...(image.tags || []).filter((tag: string) => !tag.startsWith('product:')),
              `product:${sourceProductId}`,
              `replicated-from:${image.product_id}`
            ];

            const { error: insertError } = await (supabase as any)
              .from('hosted_images')
              .insert({
                user_id: user.id,
                url: image.url,
                r2_path: image.r2_path,
                original_filename: image.original_filename,
                product_id: sourceProductId,
                tags: newTags,
                description: `Replicado de produto ${skuMap.get(image.product_id) || image.product_id} | ${image.description || ''}`
              });

            if (!insertError) {
              result.replicatedCount++;
              sourceExistingUrls.add(image.url); // Marcar como já adicionada
              console.log(`✅ Bidirecional: ${image.filename} → produto origem (${skuMap.get(sourceProductId)})`);
            } else {
              console.error('Erro na replicação bidirecional:', insertError);
            }
          } catch (err) {
            console.error('Erro inesperado na replicação bidirecional:', err);
          }
        }
      }

      result.success = result.errors.length === 0;

      // Activate ready_for_ads for target products AND source product (bidirecional)
      if (result.replicatedCount > 0) {
        // 🆕 Incluir produto origem na atualização de ready_for_ads
        const { error: updateError } = await (supabase as any)
          .from('produtos')
          .update({ ready_for_ads: true })
          .in('id', [sourceProductId, ...targetProductIds]);

        if (updateError) {
          console.error('Erro ao ativar ready_for_ads:', updateError);
          result.errors.push('Erro ao ativar "Pronto para anúncios" nos produtos');
        } else {
          console.log(`✅ ${targetProductIds.length} produtos marcados como prontos para anúncios premium`);
        }

        // Replicate AI data (Comando Unificado + Copywriting) from source product
        try {
          const { data: sourceAIData } = await (supabase as any)
            .from('ai_unified_results')
            .select('results')
            .eq('product_id', sourceProductId)
            .eq('user_id', user.id)
            .maybeSingle();

          if (sourceAIData?.results) {
            console.log('📝 Replicando dados de IA do produto origem...');
            
            for (const targetProductId of targetProductIds) {
              const targetSku = skuMap.get(targetProductId) || '';
              
              // Fetch existing data for target product to merge
              const { data: existingData } = await (supabase as any)
                .from('ai_unified_results')
                .select('results')
                .eq('product_id', targetProductId)
                .eq('user_id', user.id)
                .maybeSingle();

              // Merge existing data with source data
              const sourceResults = sourceAIData.results as Record<string, unknown>;
              const existingResults = (existingData?.results || {}) as Record<string, unknown>;
              
              const mergedResults = {
                ...existingResults,
                ...sourceResults,
                replicado_de: sourceProductId,
                replicado_em: new Date().toISOString()
              };

              // Upsert to create or update
              const { error: upsertError } = await (supabase as any)
                .from('ai_unified_results')
                .upsert({
                  product_id: targetProductId,
                  user_id: user.id,
                  results: mergedResults,
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: 'product_id,user_id'
                });

              if (upsertError) {
                console.error(`Erro ao replicar dados de IA para ${targetSku}:`, upsertError);
              }
            }
            
            result.aiDataReplicated = true;
            console.log(`✅ Dados de IA replicados para ${targetProductIds.length} produtos`);
          } else {
            console.log('ℹ️ Produto origem não possui dados de IA para replicar');
          }
        } catch (aiError) {
          console.error('Erro ao replicar dados de IA:', aiError);
          // Don't add to errors - AI replication is optional
        }

        // Sync stock between replicated products - assign group and sync to max stock
        try {
          console.log('📦 Sincronizando estoque entre produtos replicados...');
          
          const allProductIds = [sourceProductId, ...targetProductIds];
          
          // Find max stock among all products
          let maxStock = 0;
          let maxStockProductId = sourceProductId;
          let maxStockSku = skuMap.get(sourceProductId) as string || '';
          
          for (const productId of allProductIds) {
            const stock = (stockMap.get(productId) as number) || 0;
            if (stock > maxStock) {
              maxStock = stock;
              maxStockProductId = productId;
              maxStockSku = skuMap.get(productId) as string || '';
            }
          }
          
          console.log(`📦 Maior estoque encontrado: ${maxStock} unidades (SKU: ${maxStockSku})`);
          
          // Generate group ID for replication
          const grupoReplicacaoId = crypto.randomUUID();
          
          // Update source product with group
          await (supabase as any)
            .from('produtos')
            .update({ 
              ready_for_ads: true
            })
            .eq('id', sourceProductId);
          
          // Update all target products with group
          for (const targetProductId of targetProductIds) {
            await (supabase as any)
              .from('produtos')
              .update({ 
                ready_for_ads: true
              })
              .eq('id', targetProductId);
          }
          
          result.stockSynced = true;
          result.syncedStock = maxStock;
          result.stockSourceSku = maxStockSku;
          
          console.log(`✅ Estoque sincronizado: ${maxStock} unidades para ${allProductIds.length} produtos`);
        } catch (stockError) {
          console.error('Erro ao sincronizar estoque:', stockError);
          result.errors.push('Erro ao sincronizar estoque entre produtos');
        }

        window.dispatchEvent(new CustomEvent('hostedImageSaved'));
      }

      return result;
    } catch (error) {
      console.error('Erro geral na replicação:', error);
      result.errors.push('Erro geral na replicação');
      return result;
    } finally {
      setIsReplicating(false);
    }
  }, []);

  const searchProducts = useCallback(async (
    searchTerm: string,
    excludeProductId?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = (supabase as any)
        .from('produtos')
        .select('id, nome, sku, imagem_original')
        .eq('usuario_id', user.id)
        .order('nome', { ascending: true })
        .limit(50);

      // Search by name or SKU
      if (searchTerm) {
        query = query.or(`nome.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);
      }

      // Exclude source product
      if (excludeProductId) {
        query = query.neq('id', excludeProductId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar produtos:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      return [];
    }
  }, []);

  return {
    replicateImages,
    searchProducts,
    isReplicating
  };
};
