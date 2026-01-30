/**
 * ============================================
 * useWebhookProxy - Hook para webhooks seguros
 * ============================================
 * Dispara webhooks através da Edge Function proxy
 * URLs nunca expostas no frontend
 * ============================================
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Tipos de webhook disponíveis
export type WebhookType =
  // Visual Start (5 webhooks)
  | 'vs_fundo_branco' | 'vs_ambientada'
  | 'vs_magica_1' | 'vs_magica_2' | 'vs_magica_3'
  // Visual Pro (6 webhooks)
  | 'vp_fundo_branco' | 'vp_ambientada'
  | 'vp_magica_1' | 'vp_magica_2' | 'vp_magica_3' | 'vp_magica_4'
  // Visual Expert (9 webhooks)
  | 've_fundo_branco' | 've_ambientada' | 've_em_uso'
  | 've_magica_1' | 've_magica_2' | 've_magica_3' | 've_magica_4' | 've_magica_5' | 've_magica_6'
  // Visual Brand (12 webhooks)
  | 'vb_fundo_branco' | 'vb_ambientada' | 'vb_em_uso' | 'vb_com_pessoas'
  | 'vb_magica_1' | 'vb_magica_2' | 'vb_magica_3' | 'vb_magica_4'
  | 'vb_magica_5' | 'vb_magica_6' | 'vb_magica_7' | 'vb_magica_8'
  // Gerais
  | 'comando_unificado'
  | 'copywriting'
  | 'tratamento_combinado';

// Pacotes visuais
export type VisualPackageType = 'visual_start' | 'visual_pro' | 'visual_expert' | 'visual_brand';

// Mapeamento de pacotes para webhooks
export const PACKAGE_WEBHOOKS: Record<VisualPackageType, WebhookType[]> = {
  visual_start: ['vs_fundo_branco', 'vs_ambientada', 'vs_magica_1', 'vs_magica_2', 'vs_magica_3'],
  visual_pro: ['vp_fundo_branco', 'vp_ambientada', 'vp_magica_1', 'vp_magica_2', 'vp_magica_3', 'vp_magica_4'],
  visual_expert: ['ve_fundo_branco', 've_ambientada', 've_em_uso', 've_magica_1', 've_magica_2', 've_magica_3', 've_magica_4', 've_magica_5', 've_magica_6'],
  visual_brand: ['vb_fundo_branco', 'vb_ambientada', 'vb_em_uso', 'vb_com_pessoas', 'vb_magica_1', 'vb_magica_2', 'vb_magica_3', 'vb_magica_4', 'vb_magica_5', 'vb_magica_6', 'vb_magica_7', 'vb_magica_8'],
};

// Payload genérico para webhooks
export interface WebhookPayload {
  product_name?: string;
  product_id?: string;
  product_sku?: string;
  product_description?: string;
  images?: string[];
  user_id?: string;
  [key: string]: unknown;
}

// Resposta do webhook proxy
export interface WebhookProxyResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  credits_used?: number;
  credits_refunded?: number;
  log_id?: string;
  duration_ms?: number;
  error?: string;
  code?: string;
  credits_required?: number;
  credits_available?: number;
}

// Estado do hook
interface WebhookProxyState {
  isLoading: boolean;
  error: string | null;
  lastResponse: WebhookProxyResponse | null;
}

// Opções do hook
interface UseWebhookProxyOptions {
  onSuccess?: (response: WebhookProxyResponse) => void;
  onError?: (error: string, code?: string) => void;
  showToasts?: boolean;
}

export function useWebhookProxy(options: UseWebhookProxyOptions = {}) {
  const { onSuccess, onError, showToasts = true } = options;

  const [state, setState] = useState<WebhookProxyState>({
    isLoading: false,
    error: null,
    lastResponse: null,
  });

  /**
   * Dispara um webhook através do proxy seguro
   */
  const fireWebhook = useCallback(
    async (
      webhookType: WebhookType,
      payload: WebhookPayload,
      packageId?: string
    ): Promise<WebhookProxyResponse> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        console.log(`🔐 [WebhookProxy] Disparando: ${webhookType}`);

        // Obter sessão do usuário
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }

        // Chamar Edge Function com timeout do cliente (Safety Net)
        const invokeFunction = supabase.functions.invoke('webhook-proxy', {
          body: {
            webhook_type: webhookType,
            payload,
            package_id: packageId,
          },
        });

        // Race condition: Função vs Timeout de 45s
        const { data, error } = await Promise.race([
          invokeFunction,
          new Promise<{ data: null; error: any }>((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT_CLIENTE: O servidor demorou para responder. Verifique se o webhook foi recebido no n8n. Imagens podem aparecer na galeria em breve.')), 45000)
          )
        ]);

        if (error) {
          if (error.message.includes('Failed to send a request to the Edge Function')) {
            // ... existente ...
            console.warn('⚠️ [WebhookProxy] Falha de conexão/deploy');
            throw new Error('Erro de Conexão: A função Serverless não está acessível. Tente novamente em 1 minuto.');
          }
          throw error; // Lança erro do timeout ou outros
        }

        const response = data as WebhookProxyResponse;

        if (!response.success) {
          // Tratar erros específicos
          if (response.code === 'INSUFFICIENT_CREDITS') {
            const msg = `Créditos insuficientes. Necessário: ${response.credits_required}, Disponível: ${response.credits_available}`;
            if (showToasts) {
              toast.error('💰 ' + msg, {
                action: {
                  label: 'Comprar Créditos',
                  onClick: () => (window.location.href = '/creditos'),
                },
              });
            }
            throw new Error(msg);
          }

          if (response.code === 'WEBHOOK_NOT_FOUND') {
            throw new Error('Webhook não configurado. Contate o suporte.');
          }

          if (response.code === 'WEBHOOK_TIMEOUT') {
            if (showToasts) {
              toast.warning('⏱️ Webhook demorou muito. Seus créditos foram estornados.');
            }
            throw new Error('Timeout no webhook. Créditos estornados.');
          }

          throw new Error(response.error || 'Erro desconhecido');
        }

        // Sucesso
        console.log(`✅ [WebhookProxy] Sucesso: ${response.credits_used} créditos usados`);

        if (showToasts) {
          toast.success(
            `✅ Webhook executado! ${response.credits_used} créditos utilizados.`
          );
        }

        setState({
          isLoading: false,
          error: null,
          lastResponse: response,
        });

        onSuccess?.(response);
        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        console.error('❌ [WebhookProxy] Erro final:', errorMessage);

        setState({
          isLoading: false,
          error: errorMessage,
          lastResponse: null,
        });

        if (showToasts && !errorMessage.includes('Créditos insuficientes')) {
          toast.error(`❌ ${errorMessage}`);
        }

        onError?.(errorMessage);
        throw err;
      }
    },
    [onSuccess, onError, showToasts]
  );

  /**
   * Dispara webhook para pacote visual
   */
  const fireVisualPackage = useCallback(
    async (
      packageType: 'visual_start' | 'visual_pro' | 'visual_expert' | 'visual_brand',
      productData: {
        name: string;
        id: string;
        sku?: string;
        description?: string;
        images: string[];
      }
    ) => {
      return fireWebhook(
        packageType as unknown as WebhookType,
        {
          product_name: productData.name,
          product_id: productData.id,
          product_sku: productData.sku,
          product_description: productData.description,
          images: productData.images,
        },
        packageType
      );
    },
    [fireWebhook]
  );

  /**
   * Dispara comando unificado (ATLAS)
   */
  const fireComandoUnificado = useCallback(
    async (payload: WebhookPayload) => {
      return fireWebhook('comando_unificado', payload);
    },
    [fireWebhook]
  );

  /**
   * Dispara copywriting (LYRA)
   */
  const fireCopywriting = useCallback(
    async (payload: WebhookPayload) => {
      return fireWebhook('copywriting', payload);
    },
    [fireWebhook]
  );

  /**
   * Dispara tratamento combinado (ORION)
   */
  const fireTratamentoCombinado = useCallback(
    async (payload: WebhookPayload) => {
      return fireWebhook('tratamento_combinado', payload);
    },
    [fireWebhook]
  );

  /**
   * Dispara todos os webhooks de um pacote visual em paralelo
   */
  const fireVisualPackageAll = useCallback(
    async (
      packageType: VisualPackageType,
      productData: {
        name: string;
        id: string;
        sku?: string;
        description?: string;
        images: string[];
      },
      onProgress?: (completed: number, total: number, webhookType: WebhookType) => void
    ): Promise<{ success: number; failed: number; results: WebhookProxyResponse[]; errors: string[] }> => {
      const webhooks = PACKAGE_WEBHOOKS[packageType];
      const total = webhooks.length;
      let completed = 0;
      const results: WebhookProxyResponse[] = [];
      const errors: string[] = [];
      let success = 0;
      let failed = 0;

      console.log(`🚀 [WebhookProxy] Disparando ${total} webhooks do pacote ${packageType}`);

      // Disparar webhooks em paralelo (máximo 3 simultâneos para não sobrecarregar)
      const batchSize = 3;
      for (let i = 0; i < webhooks.length; i += batchSize) {
        const batch = webhooks.slice(i, i + batchSize);

        const batchResults = await Promise.allSettled(
          batch.map(async (webhookType) => {
            const result = await fireWebhook(
              webhookType,
              {
                ...productData,
                product_name: productData.name,
                product_id: productData.id,
                product_sku: productData.sku,
                product_description: productData.description,
                images: productData.images,
                webhook_index: webhooks.indexOf(webhookType),
                total_webhooks: total,
              },
              packageType
            );
            return { webhookType, result };
          })
        );

        // Processar resultados do batch
        for (const result of batchResults) {
          completed++;
          if (result.status === 'fulfilled') {
            success++;
            results.push(result.value.result);
            onProgress?.(completed, total, result.value.webhookType);
          } else {
            failed++;
            const errorMsg = result.reason instanceof Error ? result.reason.message : String(result.reason);
            console.error(`❌ Webhook falhou:`, errorMsg);
            errors.push(errorMsg);
          }
        }
      }

      console.log(`✅ [WebhookProxy] Pacote ${packageType} completo: ${success}/${total} sucesso`);

      return { success, failed, results, errors };
    },
    [fireWebhook]
  );

  return {
    // Estado
    isLoading: state.isLoading,
    error: state.error,
    lastResponse: state.lastResponse,

    // Métodos genéricos
    fireWebhook,

    // Métodos específicos
    fireVisualPackage,
    fireVisualPackageAll, // Dispara todos os webhooks de um pacote
    fireComandoUnificado,
    fireCopywriting,
    fireTratamentoCombinado,
  };
}

export default useWebhookProxy;
