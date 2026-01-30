import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * @deprecated Este hook usa arquitetura antiga (ai-chat-proxy direto).
 * Para novas implementações, use:
 * - useUnifiedCommands para comandos unificados
 * - useSpecialistCommands para 7 funções especializadas
 * - useImageQueue para geração de imagens
 * 
 * Todos usam a fila (queue-image → process-queue) que:
 * - Escala melhor
 * - Usa API keys do usuário com rotação
 * - Tem retry automático
 * - Logging centralizado
 */

interface AIRequestOptions {
  action?: string;
  imageData?: string;
  prompt?: string;
  apiKeyId?: string;
  dimensions?: any;
  targetFunction?: 'gemini-background-generator' | 'deepai-chat' | 'openai-normal-chat' | 'openai-assistant-chat';
  [key: string]: any;
}

interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
  generatedPrompt?: string;
  generated_image_text?: string;
  modelUsed?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    estimated_cost_usd?: number;
  };
}

/**
 * @deprecated Use os hooks específicos baseados em fila ao invés deste.
 * Mantido apenas para compatibilidade com gemini-background-generator.
 */
export const useSecureAI = () => {
  const callAI = useCallback(async (options: AIRequestOptions): Promise<AIResponse> => {
    console.warn('⚠️ [DEPRECATED] useSecureAI.callAI - Use hooks baseados em fila');
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat-proxy', {
        body: options
      });

      if (error) {
        return { success: false, error: error.message || 'Erro ao chamar IA' };
      }

      if (data?.error) {
        return { success: false, error: data.error, data };
      }

      return { success: true, ...data };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido'
      };
    }
  }, []);

  /**
   * @deprecated Para geração de prompts, use a fila via useImageQueue
   */
  const generatePrompt = useCallback(async (
    imageData: string,
    prompt: string,
    apiKeyId?: string
  ): Promise<AIResponse> => {
    console.warn('⚠️ [DEPRECATED] useSecureAI.generatePrompt');
    return callAI({
      action: 'generate_prompt',
      imageData,
      prompt,
      apiKeyId,
      targetFunction: 'gemini-background-generator'
    });
  }, [callAI]);

  /**
   * @deprecated Para geração de background, use a fila via useImageQueue
   */
  const generateBackground = useCallback(async (
    imageData: string,
    prompt: string,
    apiKeyId?: string,
    dimensions?: any
  ): Promise<AIResponse> => {
    console.warn('⚠️ [DEPRECATED] useSecureAI.generateBackground');
    return callAI({
      action: 'generate_background',
      imageData,
      prompt,
      apiKeyId,
      dimensions,
      targetFunction: 'gemini-background-generator'
    });
  }, [callAI]);

  /**
   * @deprecated REMOVIDO - Arquitetura antiga não escala
   */
  const chatWithDeepAI = useCallback(async (
    _command: string,
    _productName: string,
    _shortDescription: string,
    _options?: Partial<AIRequestOptions>
  ): Promise<AIResponse> => {
    console.error('❌ [REMOVED] chatWithDeepAI foi removido. Use useUnifiedCommands ou useSpecialistCommands');
    return {
      success: false,
      error: 'chatWithDeepAI foi deprecado. Use useUnifiedCommands ou useSpecialistCommands'
    };
  }, []);

  /**
   * @deprecated REMOVIDO - Arquitetura antiga não escala
   */
  const chatWithOpenAI = useCallback(async (
    _message: string,
    _documents?: any[]
  ): Promise<AIResponse> => {
    console.error('❌ [REMOVED] chatWithOpenAI foi removido. Use useUnifiedCommands ou useSpecialistCommands');
    return {
      success: false,
      error: 'chatWithOpenAI foi deprecado. Use useUnifiedCommands ou useSpecialistCommands'
    };
  }, []);

  /**
   * @deprecated REMOVIDO - Arquitetura antiga não escala
   */
  const chatWithAssistant = useCallback(async (
    _message: string,
    _threadId?: string
  ): Promise<AIResponse> => {
    console.error('❌ [REMOVED] chatWithAssistant foi removido');
    return {
      success: false,
      error: 'chatWithAssistant foi deprecado'
    };
  }, []);

  return {
    callAI,
    generatePrompt,
    generateBackground,
    chatWithDeepAI,
    chatWithOpenAI,
    chatWithAssistant
  };
};
