import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CopywritingPersistenceProps {
  productId: string;
  productSku: string;
  copywriting: string | null;
  onCopywritingLoaded: (copywriting: string) => void;
}

export const CopywritingPersistence = ({ 
  productId, 
  productSku, 
  copywriting, 
  onCopywritingLoaded 
}: CopywritingPersistenceProps) => {
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  console.log('🔧 COPYWRITING PERSISTENCE - Props recebidas:', {
    productId: productId || 'VAZIO',
    productSku: productSku || 'VAZIO',
    hasCopywriting: !!copywriting,
    hasLoadedOnce
  });

  // Carregar copywriting salva uma vez ao montar
  useEffect(() => {
    if (productId && productId.trim() && !hasLoadedOnce) {
      console.log('🔍 COPYWRITING PERSISTENCE - Iniciando carregamento para:', productId);
      loadSavedCopywriting();
    }
  }, [productId, hasLoadedOnce]);

  // Salvar copywriting quando chegar novo conteúdo
  useEffect(() => {
    if (copywriting && copywriting.trim() && productId && productId.trim()) {
      console.log('💾 COPYWRITING PERSISTENCE - Salvando copywriting válida');
      saveCopywriting();
    }
  }, [copywriting, productId]);

  // NOVO: Listener para salvar títulos de cauda longa
  useEffect(() => {
    const handleLongTailTitles = async (event: CustomEvent) => {
      if (event.detail?.productId === productId && event.detail?.titles) {
        console.log('📥 [PERSISTENCE] Recebendo títulos de cauda longa para salvar');
        await saveLongTailTitles(event.detail.titles);
      }
    };
    
    window.addEventListener('copywritingLongTailTitles', handleLongTailTitles as EventListener);
    
    return () => {
      window.removeEventListener('copywritingLongTailTitles', handleLongTailTitles as EventListener);
    };
  }, [productId]);

  const loadSavedCopywriting = async () => {
    if (!productId?.trim()) {
      console.log('❌ COPYWRITING PERSISTENCE - Product ID inválido para carregamento');
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ COPYWRITING PERSISTENCE - Usuário não autenticado');
        setHasLoadedOnce(true);
        return;
      }

      console.log('🔍 COPYWRITING PERSISTENCE - Buscando no banco:', { productId, userId: user.id });

      // Usar a tabela ai_unified_results para salvar copywriting
      const { data, error } = await supabase
        .from('ai_unified_results')
        .select('results')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('❌ COPYWRITING PERSISTENCE - Erro ao carregar:', error);
        setHasLoadedOnce(true);
        return;
      }

      if (data?.results && typeof data.results === 'object' && 'copywriting' in data.results) {
        const savedCopywriting = (data.results as any).copywriting;
        if (savedCopywriting && typeof savedCopywriting === 'string' && savedCopywriting.trim()) {
          console.log('✅ COPYWRITING PERSISTENCE - Dados válidos encontrados e carregados');
          onCopywritingLoaded(savedCopywriting);
        }
      } else {
        console.log('ℹ️ COPYWRITING PERSISTENCE - Nenhuma copywriting válida encontrada');
      }
      
      setHasLoadedOnce(true);
    } catch (error) {
      console.error('❌ COPYWRITING PERSISTENCE - Erro inesperado no carregamento:', error);
      setHasLoadedOnce(true);
    }
  };

  const saveCopywriting = async () => {
    if (!copywriting?.trim() || !productId?.trim()) {
      console.log('⚠️ COPYWRITING PERSISTENCE - Dados insuficientes ou inválidos para salvamento');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ COPYWRITING PERSISTENCE - Usuário não autenticado para salvamento');
        return;
      }

      console.log('💾 COPYWRITING PERSISTENCE - Executando salvamento com UPSERT:', {
        productId,
        userId: user.id,
        copywritingLength: copywriting.length
      });

      // Buscar dados existentes primeiro para preservar outros campos
      const { data: existingRecord } = await supabase
        .from('ai_unified_results')
        .select('results')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .maybeSingle();

      // Mesclar com dados existentes para preservar outras IAs
      const currentResults = existingRecord?.results && typeof existingRecord.results === 'object' 
        ? existingRecord.results 
        : {};
      const resultsData = {
        ...(currentResults as Record<string, any>),
        copywriting: copywriting
      };

      // Usar UPSERT com onConflict para garantir um único registro
      const { error } = await supabase
        .from('ai_unified_results')
        .upsert({
          product_id: productId,
          user_id: user.id,
          results: resultsData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'product_id,user_id'
        });

      if (error) {
        console.error('❌ COPYWRITING PERSISTENCE - Erro ao salvar:', error);
        toast.error(`Erro ao salvar copywriting: ${error.message}`);
      } else {
        console.log('✅ COPYWRITING PERSISTENCE - Salvamento UPSERT concluído com sucesso');
        toast.success('Copywriting salva com sucesso!');
      }
    } catch (error) {
      console.error('❌ COPYWRITING PERSISTENCE - Erro inesperado ao salvar:', error);
      toast.error('Erro inesperado ao salvar copywriting');
    }
  };

  const saveLongTailTitles = async (titles: string[]) => {
    if (!productId?.trim() || !titles?.length) {
      console.log('⚠️ [PERSISTENCE] Dados insuficientes para salvar títulos');
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ [PERSISTENCE] Usuário não autenticado');
        return;
      }
      
      console.log(`💾 [PERSISTENCE] Salvando ${titles.length} títulos de cauda longa`);
      
      // Buscar dados existentes
      const { data: existingRecord } = await supabase
        .from('ai_unified_results')
        .select('results')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      const currentResults = existingRecord?.results || {};
      const resultsData = {
        ...(currentResults as Record<string, any>),
        copywriting_long_tail_titles: titles // NOVO CAMPO
      };
      
      // Usar UPSERT com onConflict para garantir um único registro
      const { error } = await supabase
        .from('ai_unified_results')
        .upsert({
          product_id: productId,
          user_id: user.id,
          results: resultsData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'product_id,user_id'
        });
      
      if (error) {
        console.error('❌ [PERSISTENCE] Erro ao salvar títulos:', error);
      } else {
        console.log(`✅ [PERSISTENCE] ${titles.length} títulos salvos com sucesso`);
      }
    } catch (error) {
      console.error('❌ [PERSISTENCE] Erro inesperado:', error);
    }
  };

  return null;
};