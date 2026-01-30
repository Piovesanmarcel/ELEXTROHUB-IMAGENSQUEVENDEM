import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GeminiApiKey {
  id: string;
  name: string;
  is_active: boolean;
  is_exhausted: boolean;
  exhausted_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

export const useGeminiApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<GeminiApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedKeyId, setSelectedKeyId] = useState<string>('default');

  const fetchApiKeys = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setApiKeys([]);
        setIsLoading(false);
        return;
      }

      // Usar a tabela user_api_keys com provider = 'gemini'
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('id, name, is_active, is_exhausted, exhausted_at, last_used_at, created_at')
        .eq('usuario_id', user.id)
        .eq('provider', 'gemini')
        .order('created_at', { ascending: true });

      if (error) {
        // Fallback gracioso - não mostrar erro se tabela não existe ou vazia
        console.warn('Aviso ao buscar API keys (fallback para backend):', error.message);
        setApiKeys([]);
        setIsLoading(false);
        return;
      }

      setApiKeys(data || []);

      // Selecionar automaticamente a primeira key ativa
      const activeKey = data?.find(key => key.is_active && !key.is_exhausted);
      if (activeKey) {
        setSelectedKeyId(activeKey.id);
        console.log('🔑 [API KEY] Selecionada automaticamente:', activeKey.name);
      } else {
        // Fallback para backend keys
        setSelectedKeyId('default');
        console.log('🔑 [API KEY] Nenhuma key do usuário, usando backend');
      }
    } catch (error) {
      console.warn('Aviso ao buscar API keys:', error);
      setApiKeys([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const addApiKey = async (name: string, apiKey: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return false;
      }

      // Verificar limite de 5 keys
      if (apiKeys.length >= 5) {
        toast.error('Limite máximo de 5 API keys atingido');
        return false;
      }

      // Criptografar a key (base64 simples - em produção usar algo mais robusto)
      const encryptedKey = btoa(apiKey);

      const { error } = await supabase
        .from('user_api_keys')
        .insert({
          usuario_id: user.id,
          provider: 'gemini',
          name,
          api_key_encrypted: encryptedKey
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Já existe uma API key com este nome');
        } else {
          console.error('Erro ao adicionar API key:', error);
          toast.error('Erro ao adicionar API key');
        }
        return false;
      }

      toast.success('API key adicionada com sucesso!');
      await fetchApiKeys();
      return true;
    } catch (error) {
      console.error('Erro ao adicionar API key:', error);
      toast.error('Erro ao adicionar API key');
      return false;
    }
  };

  const removeApiKey = async (keyId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_api_keys')
        .delete()
        .eq('id', keyId);

      if (error) {
        toast.error('Erro ao remover API key');
        return false;
      }

      // Se a key removida era a selecionada, voltar para default
      if (selectedKeyId === keyId) {
        setSelectedKeyId('default');
      }

      toast.success('API key removida!');
      await fetchApiKeys();
      return true;
    } catch (error) {
      console.error('Erro ao remover API key:', error);
      toast.error('Erro ao remover API key');
      return false;
    }
  };

  const testApiKey = async (keyId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-gemini-keys', {
        body: { action: 'test', keyId }
      });

      if (error || !data?.success) {
        toast.error('API key inválida ou sem créditos');
        return false;
      }

      toast.success('API key válida e funcionando!');
      return true;
    } catch (error) {
      console.error('Erro ao testar API key:', error);
      toast.error('Erro ao testar API key');
      return false;
    }
  };

  const markKeyAsExhausted = async (keyId: string): Promise<void> => {
    try {
      await supabase
        .from('user_api_keys')
        .update({ 
          is_exhausted: true, 
          exhausted_at: new Date().toISOString() 
        })
        .eq('id', keyId);

      await fetchApiKeys();
    } catch (error) {
      console.error('Erro ao marcar key como exausta:', error);
    }
  };

  const getAvailableKeys = (): GeminiApiKey[] => {
    return apiKeys.filter(key => key.is_active && !key.is_exhausted);
  };

  const getNextAvailableKey = (): GeminiApiKey | null => {
    const available = getAvailableKeys();
    return available.length > 0 ? available[0] : null;
  };

  // Verificar se está usando fallback (backend keys)
  const isUsingBackendFallback = (): boolean => {
    return selectedKeyId === 'default' || apiKeys.length === 0;
  };

  return {
    apiKeys,
    isLoading,
    selectedKeyId,
    setSelectedKeyId,
    addApiKey,
    removeApiKey,
    testApiKey,
    markKeyAsExhausted,
    getAvailableKeys,
    getNextAvailableKey,
    isUsingBackendFallback,
    refetch: fetchApiKeys
  };
};
