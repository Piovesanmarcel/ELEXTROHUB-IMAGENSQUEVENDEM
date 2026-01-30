import { supabase } from "@/integrations/supabase/client";

/**
 * Sincroniza imagens hospedadas para os slots imagem_url_* do produto
 * Regras de inserção:
 * - Fundo branco (white) → posição 1 (imagem_original ou imagem_melhorada_1)
 * - Ambientes (ambient) → posições 2-5 (imagem_melhorada_2, 3, 4, 5)
 * - Showcases → posições 6-10 (imagem_melhorada_6, 7, 8, 9, 10)
 * - Marketing processado (intro-processed, benefits-processed, etc.) → NÃO entra (são peças de anúncio)
 */

export type ImageRole = 'white' | 'ambient' | 'showcase' | 'marketing' | 'other';

interface SyncOptions {
  productId: string;
  hostedUrl: string;
  source: string;
  role?: ImageRole;
}

// Detectar role baseado no source
// ✅ AGORA: imagens processadas TAMBÉM entram na galeria do produto
function detectImageRole(source: string): ImageRole {
  const lowerSource = source.toLowerCase();
  
  // Fundo branco - PRIORIDADE MÁXIMA (slot 1)
  if (lowerSource.includes('white') || 
      lowerSource.includes('branco') ||
      lowerSource.includes('prompt_9') ||
      lowerSource.includes('prompt9')) {
    return 'white';
  }
  
  // Ambientes (slots 2-5)
  if (lowerSource.includes('ambient') ||
      lowerSource.includes('ambiente') ||
      lowerSource.includes('prompt_1') ||
      lowerSource.includes('prompt1') ||
      lowerSource.includes('prompt_2') ||
      lowerSource.includes('prompt2') ||
      lowerSource.includes('gemini-background') ||
      lowerSource.includes('bfl-ambient')) {
    return 'ambient';
  }
  
  // Showcases (slots 6-10)
  if (lowerSource.includes('showcase') ||
      lowerSource.includes('vitrine')) {
    return 'showcase';
  }
  
  // ✅ PROCESSADOS agora vão para 'other' (slots 6-10) - NÃO mais 'marketing'
  // Isso inclui: intro-processed, benefits-processed, etc.
  if (lowerSource.includes('-processed') || 
      lowerSource.includes('intro') ||
      lowerSource.includes('authority') ||
      lowerSource.includes('benefits') ||
      lowerSource.includes('urgency') ||
      lowerSource.includes('cta') ||
      lowerSource.includes('faq') ||
      lowerSource.includes('conversion') ||
      lowerSource.includes('features')) {
    return 'other'; // ✅ MUDANÇA: era 'marketing', agora é 'other' (vai para slots 6-10)
  }
  
  return 'other';
}

// Buscar slots disponíveis do produto
async function getProductImageSlots(productId: string, userId: string): Promise<{
  product: any;
  occupiedSlots: Map<number, string>;
  availableSlots: number[];
}> {
  const { data: product, error } = await supabase
    .from('produtos')
    .select('*')
    .eq('id', productId)
    .eq('usuario_id', userId)
    .single();

  if (error || !product) {
    console.error('❌ [SYNC] Erro ao buscar produto:', error);
    throw new Error('Produto não encontrado');
  }

  const occupiedSlots = new Map<number, string>();
  const availableSlots: number[] = [];

  // ✅ FIX: Verificar slots 1-11 (imagem_original + imagem_melhorada_1..10)
  for (let i = 1; i <= 11; i++) {
    const slotKey = i === 1 ? 'imagem_original' : `imagem_melhorada_${i - 1}`;
    const slotValue = product[slotKey];
    
    if (slotValue && slotValue.trim() !== '') {
      occupiedSlots.set(i, slotValue);
    } else {
      availableSlots.push(i);
    }
  }

  return { product, occupiedSlots, availableSlots };
}

// Encontrar slot ideal para a imagem baseado no role
function findIdealSlot(
  role: ImageRole,
  occupiedSlots: Map<number, string>,
  availableSlots: number[],
  existingUrl: string | null
): number | null {
  // Se URL já existe em algum slot, não duplicar
  if (existingUrl) {
    for (const [slot, url] of occupiedSlots) {
      if (url === existingUrl) {
        console.log(`📌 [SYNC] URL já existe no slot ${slot}, ignorando duplicata`);
        return null;
      }
    }
  }

  // ✅ FIX: Preferências de slot por role (11 slots total)
  const slotPreferences: Record<ImageRole, number[]> = {
    white: [1],                    // Fundo branco → slot 1 (principal)
    ambient: [2, 3, 4, 5, 6],      // Ambientes → slots 2-6
    showcase: [7, 8, 9, 10, 11],   // Showcases → slots 7-11
    marketing: [],                 // Marketing → não entra
    other: [7, 8, 9, 10, 11]       // Outros (processados) → slots 7-11
  };

  const preferences = slotPreferences[role];
  
  // Encontrar primeiro slot preferido disponível
  for (const slot of preferences) {
    if (availableSlots.includes(slot)) {
      return slot;
    }
  }

  // Fallback: qualquer slot disponível
  if (availableSlots.length > 0 && role !== 'marketing') {
    return availableSlots[0];
  }

  return null;
}

// Atualizar produto com a nova imagem no slot
async function updateProductSlot(
  productId: string,
  userId: string,
  slot: number,
  imageUrl: string
): Promise<boolean> {
  const slotKey = slot === 1 ? 'imagem_original' : `imagem_melhorada_${slot - 1}`;

  console.log(`💾 [SYNC] Atualizando ${slotKey} com URL: ${imageUrl.substring(0, 50)}...`);

  const { error } = await supabase
    .from('produtos')
    .update({ 
      [slotKey]: imageUrl,
      atualizado_em: new Date().toISOString()
    })
    .eq('id', productId)
    .eq('usuario_id', userId);

  if (error) {
    console.error(`❌ [SYNC] Erro ao atualizar slot ${slot}:`, error);
    return false;
  }

  console.log(`✅ [SYNC] Slot ${slot} (${slotKey}) atualizado com sucesso`);
  return true;
}

/**
 * Sincronizar imagem hospedada para galeria do produto
 */
export async function syncHostedImageToProductGallery(options: SyncOptions): Promise<{
  success: boolean;
  slot?: number;
  error?: string;
}> {
  const { productId, hostedUrl, source, role: explicitRole } = options;

  console.log(`🔄 [SYNC] Sincronizando imagem para produto ${productId}...`);
  console.log(`📦 [SYNC] Source: ${source}, URL: ${hostedUrl.substring(0, 50)}...`);

  // ✅ GUARD: Não sincronizar para produtos ad-gen-* (não existem na tabela produtos)
  if (productId.startsWith('ad-gen-')) {
    console.log(`📋 [SYNC] Produto ad-gen-* detectado, pulando sync (não existe na tabela produtos)`);
    return { success: true, error: 'Produto ad-gen-* não requer sync com DB' };
  }

  try {
    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ [SYNC] Usuário não autenticado');
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Detectar role
    const role = explicitRole || detectImageRole(source);
    console.log(`🎯 [SYNC] Role detectado: ${role}`);

    // ✅ REMOVIDO: Marketing agora é classificado como 'other' e entra na galeria
    // (a lógica de exclusão foi removida porque detectImageRole agora retorna 'other' para processados)

    // Buscar slots do produto
    const { occupiedSlots, availableSlots } = await getProductImageSlots(productId, user.id);
    console.log(`📊 [SYNC] Slots ocupados: ${occupiedSlots.size}, disponíveis: ${availableSlots.length}`);

    // Encontrar slot ideal
    const targetSlot = findIdealSlot(role, occupiedSlots, availableSlots, hostedUrl);

    if (!targetSlot) {
      console.log(`⚠️ [SYNC] Nenhum slot disponível para role ${role} ou URL duplicada`);
      return { success: false, error: 'Nenhum slot disponível ou imagem duplicada' };
    }

    // Atualizar produto
    const updated = await updateProductSlot(productId, user.id, targetSlot, hostedUrl);

    if (updated) {
      // Disparar evento para atualizar UI
      window.dispatchEvent(new CustomEvent('productUpdated', {
        detail: { productId, slot: targetSlot, imageUrl: hostedUrl }
      }));

      console.log(`🎉 [SYNC] Sincronização completa: slot ${targetSlot}`);
      return { success: true, slot: targetSlot };
    }

    return { success: false, error: 'Falha ao atualizar slot' };

  } catch (error) {
    console.error('❌ [SYNC] Erro na sincronização:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Listener global para sincronizar imagens automaticamente
 * Chame setupImageSyncListener() uma vez na inicialização do app
 */
export function setupImageSyncListener(): () => void {
  const handleHostedImageSaved = async (event: CustomEvent) => {
    const { productId, hostedUrl, source, tags } = event.detail || {};

    if (!productId || !hostedUrl) {
      console.log('⚠️ [SYNC LISTENER] Evento incompleto, ignorando');
      return;
    }

    console.log(`📡 [SYNC LISTENER] Evento hostedImageSaved recebido:`, { productId, source });

    // Sincronizar imagem para galeria do produto
    await syncHostedImageToProductGallery({
      productId,
      hostedUrl,
      source: source || 'unknown'
    });
  };

  window.addEventListener('hostedImageSaved', handleHostedImageSaved as EventListener);

  // Retornar cleanup function
  return () => {
    window.removeEventListener('hostedImageSaved', handleHostedImageSaved as EventListener);
  };
}
