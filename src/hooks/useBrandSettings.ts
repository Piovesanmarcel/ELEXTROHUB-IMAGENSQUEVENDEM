import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BrandSettings } from '@/types/marketing-templates';
import { toast } from 'sonner';

export const useBrandSettings = () => {
  const [brandSettings, setBrandSettings] = useState<BrandSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBrandSettings = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await (supabase as any)
        .from('brand_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      setBrandSettings(data as BrandSettings | null);
    } catch (err) {
      console.error('Erro ao carregar brand settings:', err);
      setError('Erro ao carregar configurações de marca');
    } finally {
      setIsLoading(false);
    }
  };

  const updateBrandSettings = async (updates: Partial<BrandSettings>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Usuário não autenticado');
        return null;
      }

      if (brandSettings) {
        // Update existing
        const { data, error } = await (supabase as any)
          .from('brand_settings')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        setBrandSettings(data as BrandSettings);
        return data as BrandSettings;
      } else {
        // Create new
        const { data, error } = await (supabase as any)
          .from('brand_settings')
          .insert({
            user_id: user.id,
            ...updates
          })
          .select()
          .single();

        if (error) throw error;
        setBrandSettings(data as BrandSettings);
        return data as BrandSettings;
      }
    } catch (err) {
      console.error('Erro ao atualizar brand settings:', err);
      toast.error('Erro ao salvar configurações');
      return null;
    }
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Usuário não autenticado');
        return null;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `brand-logos/${user.id}/logo-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('marketing-templates')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('marketing-templates')
        .getPublicUrl(data.path);

      const logoUrl = urlData.publicUrl;

      // Update brand settings with new logo
      await updateBrandSettings({ logo_url: logoUrl });
      
      toast.success('Logo enviada com sucesso!');
      return logoUrl;
    } catch (err) {
      console.error('Erro ao fazer upload da logo:', err);
      toast.error('Erro ao enviar logo');
      return null;
    }
  };

  const removeLogo = async () => {
    await updateBrandSettings({ logo_url: null });
    toast.success('Logo removida');
  };

  useEffect(() => {
    loadBrandSettings();
  }, []);

  return {
    brandSettings,
    isLoading,
    error,
    updateBrandSettings,
    uploadLogo,
    removeLogo,
    reloadBrandSettings: loadBrandSettings
  };
};
