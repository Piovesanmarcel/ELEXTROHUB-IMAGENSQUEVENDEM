import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Definição das chaves de armazenamento para cada webhook
// Definição das chaves de armazenamento para cada webhook (ALINHADO COM SUPABASE)
export const WEBHOOK_CONFIGS = [
  // === VISUAL START ===
  { key: 'vs_fundo_branco', label: 'Visual Start - Fundo Branco' },
  { key: 'vs_ambientada', label: 'Visual Start - Ambientada' },
  { key: 'vs_magica_1', label: 'Visual Start - Mágica 1' },
  { key: 'vs_magica_2', label: 'Visual Start - Mágica 2' },
  { key: 'vs_magica_3', label: 'Visual Start - Mágica 3' },

  // === VISUAL PRO ===
  { key: 'vp_fundo_branco', label: 'Visual Pro - Fundo Branco' },
  { key: 'vp_ambientada', label: 'Visual Pro - Ambientada' },
  { key: 'vp_magica_1', label: 'Visual Pro - Mágica 1' },
  { key: 'vp_magica_2', label: 'Visual Pro - Mágica 2' },
  { key: 'vp_magica_3', label: 'Visual Pro - Mágica 3' },
  { key: 'vp_magica_4', label: 'Visual Pro - Mágica 4' },

  // === VISUAL EXPERT ===
  { key: 've_fundo_branco', label: 'Visual Expert - Fundo Branco' },
  { key: 've_ambientada', label: 'Visual Expert - Ambientada' },
  { key: 've_em_uso', label: 'Visual Expert - Em Uso' },
  { key: 've_magica_1', label: 'Visual Expert - Mágica 1' },
  { key: 've_magica_2', label: 'Visual Expert - Mágica 2' },
  { key: 've_magica_3', label: 'Visual Expert - Mágica 3' },
  { key: 've_magica_4', label: 'Visual Expert - Mágica 4' },
  { key: 've_magica_5', label: 'Visual Expert - Mágica 5' },
  { key: 've_magica_6', label: 'Visual Expert - Mágica 6' },

  // === VISUAL BRAND ===
  { key: 'vb_fundo_branco', label: 'Visual Brand - Fundo Branco' },
  { key: 'vb_ambientada', label: 'Visual Brand - Ambientada' },
  { key: 'vb_em_uso', label: 'Visual Brand - Em Uso' },
  { key: 'vb_com_pessoas', label: 'Visual Brand - Com Pessoas' },
  { key: 'vb_magica_1', label: 'Visual Brand - Mágica 1' },
  { key: 'vb_magica_2', label: 'Visual Brand - Mágica 2' },
  { key: 'vb_magica_3', label: 'Visual Brand - Mágica 3' },
  { key: 'vb_magica_4', label: 'Visual Brand - Mágica 4' },
  { key: 'vb_magica_5', label: 'Visual Brand - Mágica 5' },
  { key: 'vb_magica_6', label: 'Visual Brand - Mágica 6' },
  { key: 'vb_magica_7', label: 'Visual Brand - Mágica 7' },
  { key: 'vb_magica_8', label: 'Visual Brand - Mágica 8' },

  // === WEBHOOKS GERAIS ===
  { key: 'comando_unificado', label: 'Comando Unificado ATLAS' },
  { key: 'copywriting', label: 'Copywriting LYRA' },
  { key: 'tratamento_combinado', label: 'Tratamento Combinado ORION' },
] as const;

export type WebhookKey = typeof WEBHOOK_CONFIGS[number]['key'];

export function useWebhookStorage() {
  const queryClient = useQueryClient();

  // Fetch webhooks from Supabase
  const { data: webhooks = {}, isLoading } = useQuery({
    queryKey: ['webhook_configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_configs' as any)
        .select('webhook_type, webhook_url')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching webhooks:', error);
        toast.error('Erro ao carregar webhooks do servidor');
        return {};
      }

      // Transform array to Record<string, string>
      const webhookMap: Record<string, string> = {};
      (data as any[]).forEach(item => {
        webhookMap[item.webhook_type] = item.webhook_url;
      });
      return webhookMap;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation to save/update webhook
  const saveMutation = useMutation({
    mutationFn: async ({ key, url }: { key: string; url: string }) => {
      const { error } = await supabase
        .from('webhook_configs' as any)
        .upsert({
          webhook_type: key,
          webhook_url: url,
          display_name: WEBHOOK_CONFIGS.find(c => c.key === key)?.label || key,
          is_active: true
        }, { onConflict: 'webhook_type' });

      if (error) throw error;
      return { key, url };
    },
    onSuccess: (_, variables) => {
      queryClient.setQueryData(['webhook_configs'], (old: Record<string, string> | undefined) => ({
        ...old,
        [variables.key]: variables.url
      }));
      toast.success('Webhook salvo com sucesso!');
    },
    onError: (error) => {
      console.error('Error saving webhook:', error);
      toast.error('Erro ao salvar webhook. Verifique suas permissões.');
    }
  });

  // Função para salvar um webhook específico
  const saveWebhook = (key: string, url: string) => {
    saveMutation.mutate({ key, url });
  };

  // Função para pegar um webhook específico
  const getWebhook = (key: string) => {
    return webhooks[key] || '';
  };

  return {
    webhooks,
    isLoading,
    saveWebhook,
    getWebhook,
    configs: WEBHOOK_CONFIGS,

    // Mapeamento correto para chaves do banco de dados (Supabase)
    webhookComandoUnificado: webhooks['comando_unificado'] || '',
    setWebhookComandoUnificado: (val: string) => saveWebhook('comando_unificado', val),

    webhookCopywriting: webhooks['copywriting'] || '',
    setWebhookCopywriting: (val: string) => saveWebhook('copywriting', val),

    webhookTratamentoCombinado: webhooks['tratamento_combinado'] || '',
    setWebhookTratamentoCombinado: (val: string) => saveWebhook('tratamento_combinado', val),
  };
}
