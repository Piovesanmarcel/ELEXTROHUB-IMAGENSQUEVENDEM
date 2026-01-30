import { useState, useEffect } from "react";

// Definição das chaves de armazenamento para cada webhook
export const WEBHOOK_CONFIGS = [
  // Filas Redis - Imagens
  { key: 'n8n_redis_ambientada_melhor', label: 'Gerar Fila Redis - Image Queue Ambientada Melhor' },
  { key: 'n8n_redis_com_pessoas', label: 'Gerar Fila Redis - Image Queue com Pessoas' },
  { key: 'n8n_redis_ambientada_4', label: 'Gerar Fila Redis - Image Queue Ambientada 4' },
  { key: 'n8n_redis_embalagem', label: 'Gerar Fila Redis - Image Queue Embalagem' },
  { key: 'n8n_redis_mockup_realista', label: 'Gerar Fila Redis - Image Queue Mockup Realista' },
  { key: 'n8n_redis_ambientada_6', label: 'Gerar Fila Redis - Image Queue Ambientada 6' },
  { key: 'n8n_redis_em_uso_melhor', label: 'Gerar Fila Redis - Image Queue Em Uso Melhor' },
  { key: 'n8n_redis_fundo_branco', label: 'Gerar Fila Redis - Image Queue Fundo Branco' },

  // Comandos Unificados
  { key: 'n8n_cmd_unificado_01', label: 'Comando Unificado 01' },
  { key: 'n8n_cmd_unificado_02', label: 'Comando Unificado 02' },
  { key: 'n8n_cmd_unificado_03', label: 'Comando Unificado 03' },
  { key: 'n8n_cmd_unificado_04', label: 'Comando Unificado 04' },

  // Copywriting
  { key: 'n8n_copy_01', label: 'Copywriting 01' },
  { key: 'n8n_copy_02', label: 'Copywriting 02' },
  { key: 'n8n_copy_03', label: 'Copywriting 03' },
  { key: 'n8n_copy_04', label: 'Copywriting 04' },

  // Templates Marketing Canvas
  { key: 'n8n_canvas_01', label: 'Tamplate Marketing Canvas 01' },
  { key: 'n8n_canvas_02', label: 'Tamplate Marketing Canvas 02' },
  { key: 'n8n_canvas_03', label: 'Tamplate Marketing Canvas 03' },
  { key: 'n8n_canvas_04', label: 'Tamplate Marketing Canvas 04' },
  { key: 'n8n_canvas_05', label: 'Tamplate Marketing Canvas 05' },

  // Webhook Unificado 4 (Disparo Simultâneo)
  { key: 'n8n_unified_4_url_1', label: 'Gerar Fila Redis - Image Queue Fundo Branco' },
  { key: 'n8n_unified_4_url_2', label: 'Gerar Fila Redis - Image Queue Ambientada Melhor' },
  { key: 'n8n_unified_4_url_3', label: 'Gerar Fila Redis - Image Queue Em Uso Melhor' },


  // Legado (Mantido para compatibilidade se necessário, ou mapeado para novos)
  { key: 'n8n_unified_webhook_url', label: 'Comando Unificado (Legado)' },
  { key: 'copywriting_n8n_webhook_url', label: 'Copywriting (Legado)' },
  { key: 'gerador_webhook_tratamento_combinado', label: 'Tratamento Combinado (Legado)' },
] as const;

export type WebhookKey = typeof WEBHOOK_CONFIGS[number]['key'];

export function useWebhookStorage() {
  // Estado para armazenar todos os webhooks
  const [webhooks, setWebhooks] = useState<Record<string, string>>({});

  // Carregar do localStorage na montagem
  useEffect(() => {
    const loadedWebhooks: Record<string, string> = {};
    WEBHOOK_CONFIGS.forEach(config => {
      const stored = localStorage.getItem(config.key);
      if (stored) {
        loadedWebhooks[config.key] = stored;
      }
    });
    setWebhooks(prev => ({ ...prev, ...loadedWebhooks }));
  }, []);

  // Função para salvar um webhook específico
  const saveWebhook = (key: string, url: string) => {
    localStorage.setItem(key, url);
    setWebhooks(prev => ({ ...prev, [key]: url }));
  };

  // Função para pegar um webhook específico
  const getWebhook = (key: string) => {
    return webhooks[key] || localStorage.getItem(key) || '';
  };

  return {
    webhooks,
    saveWebhook,
    getWebhook,
    configs: WEBHOOK_CONFIGS,

    // Legacy Support (Backward Compatibility)
    webhookComandoUnificado: webhooks['n8n_cmd_unificado_01'] || localStorage.getItem('n8n_cmd_unificado_01') || localStorage.getItem('n8n_unified_webhook_url') || '',
    setWebhookComandoUnificado: (val: string) => saveWebhook('n8n_cmd_unificado_01', val),

    webhookCopywriting: webhooks['n8n_copy_01'] || localStorage.getItem('n8n_copy_01') || localStorage.getItem('copywriting_n8n_webhook_url') || '',
    setWebhookCopywriting: (val: string) => saveWebhook('n8n_copy_01', val),

    webhookTratamentoCombinado: webhooks['gerador_webhook_tratamento_combinado'] || localStorage.getItem('gerador_webhook_tratamento_combinado') || '',
    setWebhookTratamentoCombinado: (val: string) => saveWebhook('gerador_webhook_tratamento_combinado', val),
  };
}
