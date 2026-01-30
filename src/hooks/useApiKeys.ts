import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ApiProvider = 'gemini' | 'openai' | 'runware' | 'stability' | 'replicate';

export interface ApiKey {
  id: string;
  name: string;
  provider: ApiProvider;
  isActive: boolean;
  isExhausted: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export function useApiKeys(provider: ApiProvider) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApiKeys = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setApiKeys([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_api_keys')
        .select('id, name, provider, is_active, is_exhausted, last_used_at, created_at')
        .eq('usuario_id', user.id)
        .eq('provider', provider)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setApiKeys((data || []).map(key => ({
        id: key.id,
        name: key.name,
        provider: key.provider as ApiProvider,
        isActive: key.is_active ?? true,
        isExhausted: key.is_exhausted ?? false,
        lastUsedAt: key.last_used_at,
        createdAt: key.created_at
      })));
    } catch (error) {
      console.error(`Error fetching ${provider} API keys:`, error);
      toast.error(`Erro ao carregar chaves ${provider}`);
    } finally {
      setIsLoading(false);
    }
  }, [provider]);

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

      // Encrypt key using base64
      const encryptedKey = btoa(apiKey);

      const { error } = await supabase
        .from('user_api_keys')
        .insert({
          usuario_id: user.id,
          provider,
          name,
          api_key_encrypted: encryptedKey
        });

      if (error) {
        if (error.code === '23505') {
          toast.error(`Já existe uma chave com o nome "${name}" para ${provider}`);
        } else {
          throw error;
        }
        return false;
      }

      toast.success(`Chave ${provider.toUpperCase()} adicionada com sucesso`);
      await fetchApiKeys();
      return true;
    } catch (error) {
      console.error(`Error adding ${provider} API key:`, error);
      toast.error(`Erro ao adicionar chave ${provider}`);
      return false;
    }
  };

  const removeApiKey = async (keyId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_api_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;

      toast.success('Chave removida com sucesso');
      await fetchApiKeys();
      return true;
    } catch (error) {
      console.error(`Error removing ${provider} API key:`, error);
      toast.error('Erro ao remover chave');
      return false;
    }
  };

  const testApiKey = async (keyId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-api-keys', {
        body: { action: 'test', keyId, provider }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Chave ${provider.toUpperCase()} válida!`);
        await fetchApiKeys();
        return true;
      } else {
        toast.error(data?.error || `Chave ${provider.toUpperCase()} inválida`);
        return false;
      }
    } catch (error) {
      console.error(`Error testing ${provider} API key:`, error);
      toast.error(`Erro ao testar chave ${provider}`);
      return false;
    }
  };

  const markKeyAsExhausted = async (keyId: string): Promise<void> => {
    try {
      await supabase.functions.invoke('manage-api-keys', {
        body: { action: 'mark-exhausted', keyId, provider }
      });
      await fetchApiKeys();
    } catch (error) {
      console.error(`Error marking ${provider} key as exhausted:`, error);
    }
  };

  const getAvailableKeys = (): ApiKey[] => {
    return apiKeys.filter(key => key.isActive && !key.isExhausted);
  };

  const getNextAvailableKey = (): ApiKey | null => {
    const available = getAvailableKeys();
    return available.length > 0 ? available[0] : null;
  };

  return {
    apiKeys,
    isLoading,
    addApiKey,
    removeApiKey,
    testApiKey,
    markKeyAsExhausted,
    getAvailableKeys,
    getNextAvailableKey,
    refetch: fetchApiKeys
  };
}
