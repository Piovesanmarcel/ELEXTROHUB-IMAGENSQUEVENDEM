import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdModelConfig, AdConfig, DEFAULT_AD_CONFIGS } from '@/types/ad-config';
import { toast } from 'sonner';

export function useAdConfigs() {
  const [models, setModels] = useState<AdModelConfig[]>([]);
  const [currentConfig, setCurrentConfig] = useState<AdConfig[]>(DEFAULT_AD_CONFIGS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setModels([]);
        return;
      }

      const { data, error: fetchError } = await (supabase as any)
        .from('ad_model_configs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const parsedModels: AdModelConfig[] = (data || []).map(row => ({
        id: row.id,
        name: row.name,
        userId: row.user_id,
        isDefault: row.is_default ?? false,
        ads: (row.config as unknown) as AdConfig[],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      setModels(parsedModels);
    } catch (err) {
      console.error('Error loading ad configs:', err);
      setError('Erro ao carregar modelos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveModel = useCallback(async (name: string, ads: AdConfig[], isDefault: boolean = false): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Você precisa estar logado para salvar modelos');
        return false;
      }

      // If setting as default, unset other defaults first
      if (isDefault) {
        await (supabase as any)
          .from('ad_model_configs')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { error: insertError } = await (supabase as any)
        .from('ad_model_configs')
        .insert([{
          user_id: user.id,
          name,
          config: ads as unknown as any,
          is_default: isDefault,
        }]);

      if (insertError) throw insertError;

      toast.success(`Modelo "${name}" salvo com sucesso!`);
      await loadModels();
      return true;
    } catch (err) {
      console.error('Error saving ad config:', err);
      toast.error('Erro ao salvar modelo');
      return false;
    }
  }, [loadModels]);

  const updateModel = useCallback(async (id: string, updates: Partial<Pick<AdModelConfig, 'name' | 'ads' | 'isDefault'>>): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // If setting as default, unset other defaults first
      if (updates.isDefault) {
        await (supabase as any)
          .from('ad_model_configs')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.ads !== undefined) updateData.config = updates.ads;
      if (updates.isDefault !== undefined) updateData.is_default = updates.isDefault;

      const { error: updateError } = await (supabase as any)
        .from('ad_model_configs')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast.success('Modelo atualizado!');
      await loadModels();
      return true;
    } catch (err) {
      console.error('Error updating ad config:', err);
      toast.error('Erro ao atualizar modelo');
      return false;
    }
  }, [loadModels]);

  const deleteModel = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error: deleteError } = await (supabase as any)
        .from('ad_model_configs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      toast.success('Modelo excluído!');
      await loadModels();
      return true;
    } catch (err) {
      console.error('Error deleting ad config:', err);
      toast.error('Erro ao excluir modelo');
      return false;
    }
  }, [loadModels]);

  const loadModelConfig = useCallback((model: AdModelConfig) => {
    setCurrentConfig(model.ads);
  }, []);

  const resetToDefault = useCallback(() => {
    setCurrentConfig(DEFAULT_AD_CONFIGS);
  }, []);

  const addNewAd = useCallback(() => {
    setCurrentConfig(prev => {
      const maxId = Math.max(...prev.map(c => c.id), 0);
      const newAd: AdConfig = {
        id: maxId + 1,
        name: `📦 Novo Anúncio ${maxId + 1}`,
        enabled: true,
        imageSources: [
          { id: `${maxId + 1}-1`, source: 'runware', quantity: 'all', order: 1 },
        ],
        templateSources: []
      };
      return [...prev, newAd];
    });
    toast.success('Novo anúncio adicionado!');
  }, []);

  const removeAd = useCallback((adId: number) => {
    setCurrentConfig(prev => prev.filter(c => c.id !== adId));
    toast.success('Anúncio removido!');
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  return {
    models,
    currentConfig,
    setCurrentConfig,
    isLoading,
    error,
    saveModel,
    updateModel,
    deleteModel,
    loadModelConfig,
    resetToDefault,
    reloadModels: loadModels,
    addNewAd,
    removeAd,
  };
}
