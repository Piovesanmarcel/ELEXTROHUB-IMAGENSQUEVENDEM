import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AutomationSettings {
  id: string;
  user_id: string;
  paused: boolean;
  updated_at: string;
}

export const useAutomationSettings = () => {
  const [settings, setSettings] = useState<AutomationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('automation_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[useAutomationSettings] Erro ao buscar configurações:', error);
        return;
      }

      if (data) {
        setSettings(data as AutomationSettings);
      } else {
        // Create default settings if none exist
        const { data: newSettings, error: insertError } = await supabase
          .from('automation_settings')
          .insert({ user_id: user.id, paused: false })
          .select()
          .single();

        if (insertError) {
          console.error('[useAutomationSettings] Erro ao criar configurações:', insertError);
        } else {
          setSettings(newSettings as AutomationSettings);
        }
      }
    } catch (error) {
      console.error('[useAutomationSettings] Erro:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const togglePaused = useCallback(async () => {
    if (!settings) return;

    setUpdating(true);
    try {
      const newPausedState = !settings.paused;
      
      const { error } = await supabase
        .from('automation_settings')
        .update({ 
          paused: newPausedState,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);

      if (error) {
        console.error('[useAutomationSettings] Erro ao atualizar:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível atualizar as configurações',
          variant: 'destructive',
        });
        return;
      }

      setSettings(prev => prev ? { ...prev, paused: newPausedState } : null);
      
      toast({
        title: newPausedState ? '⏸️ Automação Pausada' : '▶️ Automação Ativa',
        description: newPausedState 
          ? 'Callbacks do n8n serão bloqueados' 
          : 'Callbacks do n8n serão processados normalmente',
      });
    } catch (error) {
      console.error('[useAutomationSettings] Erro:', error);
    } finally {
      setUpdating(false);
    }
  }, [settings, toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    isPaused: settings?.paused ?? false,
    loading,
    updating,
    togglePaused,
    refetch: fetchSettings,
  };
};
