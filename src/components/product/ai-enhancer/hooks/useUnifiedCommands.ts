import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UnifiedAIResponse } from "../types";

// ============ NORMALIZAÇÃO DE DADOS ============
const normalizeImprovedText = (text: any, depth: number = 0): string => {
  if (depth > 10) {
    console.warn('⚠️ [NORMALIZE] Profundidade máxima atingida');
    return typeof text === 'string' ? text : '';
  }

  if (!text) return '';
  
  if (typeof text === 'string') {
    const trimmed = text.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
      return text;
    }
    
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.improvedText !== undefined) {
        return normalizeImprovedText(parsed.improvedText, depth + 1);
      }
      if (parsed.topicos_conversao?.improvedText) {
        return normalizeImprovedText(parsed.topicos_conversao.improvedText, depth + 1);
      }
      return text;
    } catch {
      return text;
    }
  }
  
  if (typeof text === 'object' && text !== null) {
    if (text.improvedText !== undefined) {
      return normalizeImprovedText(text.improvedText, depth + 1);
    }
    if (text.topicos_conversao?.improvedText) {
      return normalizeImprovedText(text.topicos_conversao.improvedText, depth + 1);
    }
    return '';
  }
  
  return String(text);
};

const normalizeCommandData = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const commands = ['topicos_conversao', 'palavras_chave_seo', 'perguntas_respostas', 'kits_criativos', 'cauda_longa'];
  const normalized = { ...data };
  
  for (const cmd of commands) {
    if (normalized[cmd]) {
      const cmdData = { ...normalized[cmd] };
      if (cmdData.improvedText !== undefined) {
        cmdData.improvedText = normalizeImprovedText(cmdData.improvedText);
      }
      normalized[cmd] = cmdData;
    }
  }
  
  return normalized;
};

// ============ HOOK PRINCIPAL ============
export const useUnifiedCommands = () => {
  const [isLoadingGemini, setIsLoadingGemini] = useState(false);
  const [isLoadingOpenAI, setIsLoadingOpenAI] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const successCallbackRef = useRef<((results: UnifiedAIResponse) => void) | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback((jobId: string, toastId: string | number) => {
    let pollCount = 0;
    const maxPolls = 120; // 6 minutos máximo (120 * 3s)
    
    const checkStatus = async () => {
      pollCount++;
      
      if (pollCount > maxPolls) {
        console.log(`⏰ [UNIFIED] Timeout após ${maxPolls} tentativas`);
        stopPolling();
        setIsLoadingGemini(false);
        setIsLoadingOpenAI(false);
        setCurrentJobId(null);
        toast.error('⏰ Timeout: Processamento demorou muito', { id: toastId });
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('check-queue-status', {
          body: { jobId }
        });

        if (error) throw error;

        const job = data?.job;
        if (!job) return;

        // Atualizar progresso
        if (job.status === 'pending') {
          setProgress(10 + (pollCount % 20));
          toast.loading(`🕐 Posição na fila: ${job.queuePosition || '...'}`, { id: toastId });
        } else if (job.status === 'processing') {
          setProgress(30 + Math.min(pollCount * 2, 60));
          toast.loading('🔄 Processando com IA...', { id: toastId });
        } else if (job.status === 'completed') {
          setProgress(100);
          stopPolling();
          setIsLoadingGemini(false);
          setIsLoadingOpenAI(false);
          setCurrentJobId(null);
          
          // Normalizar resultado
          const result = job.result || {};
          const normalizedData = normalizeCommandData(result);
          
          // Contar sucessos
          const successCount = [
            normalizedData.topicos_conversao,
            normalizedData.palavras_chave_seo, 
            normalizedData.perguntas_respostas,
            normalizedData.kits_criativos,
            normalizedData.cauda_longa
          ].filter(item => item && typeof item === 'object' && item.improvedText).length;

          const apiUsed = normalizedData.usedAPI || 'IA';
          
          if (successCount > 0) {
            toast.success(`✅ ${successCount} comando(s) executado(s) com ${apiUsed}!`, {
              id: toastId,
              duration: 8000
            });
          } else {
            toast.warning('⚠️ Processamento concluído sem resultados', { id: toastId });
          }

          // Chamar callback de sucesso
          if (successCallbackRef.current) {
            successCallbackRef.current(normalizedData);
          }
        } else if (job.status === 'failed') {
          setProgress(0);
          stopPolling();
          setIsLoadingGemini(false);
          setIsLoadingOpenAI(false);
          setCurrentJobId(null);
          
          const errorMsg = job.errorMessage || 'Falha no processamento';
          toast.error(`❌ ${errorMsg}`, { id: toastId, duration: 10000 });
        }

      } catch (err: any) {
        console.error('❌ [UNIFIED] Erro no polling:', err);
        
        // Extrair detalhes do erro HTTP se disponível
        const status = err?.context?.status || 0;
        const errorMessage = err?.message || 'Erro desconhecido';
        
        // ✅ IGNORAR 401 NO POLLING - Sessão pode expirar, mas job continua no backend
        // O endpoint check-queue-status agora é público (verify_jwt = false)
        // Então 401 aqui é raro, mas se acontecer, apenas logar e continuar
        if (status === 401 || errorMessage.includes('401') || errorMessage.toLowerCase().includes('unauthorized')) {
          console.warn('⚠️ [UNIFIED] 401 no polling - IGNORANDO (job continua no backend)');
          // ❌ NÃO parar polling
          // ❌ NÃO disparar automationError  
          // ✅ Apenas continuar tentando
          return;
        }
        
        // Não parar polling por erros temporários (até 5 tentativas)
        if (pollCount < 5) {
          console.log(`⏳ [UNIFIED] Tentativa ${pollCount}/5 - Erro temporário, continuando...`);
          return;
        }
        
        stopPolling();
        setIsLoadingGemini(false);
        setIsLoadingOpenAI(false);
        setCurrentJobId(null);
        
        toast.error(`Erro ao verificar status: ${errorMessage}`, { id: toastId });
        
        // Disparar evento de erro para automação (com source = polling para ser ignorado)
        window.dispatchEvent(new CustomEvent('automationError', {
          detail: { step: 'unified', error: errorMessage, status, source: 'polling' }
        }));
      }
    };

    // Primeira verificação imediata
    checkStatus();
    
    // Continuar polling a cada 3 segundos
    pollingIntervalRef.current = setInterval(checkStatus, 3000);
  }, [stopPolling]);

  const generateUnifiedCommands = useCallback(async (
    productName: string,
    shortDescription: string,
    selectedAPI: 'gemini' | 'openai',
    onSuccess: (results: UnifiedAIResponse) => void,
    apiKeyId?: string
  ) => {
    const setLoading = selectedAPI === 'gemini' ? setIsLoadingGemini : setIsLoadingOpenAI;
    setLoading(true);
    setProgress(5);
    successCallbackRef.current = onSuccess;

    // Declarar toastId fora do try para poder usar no catch
    let toastId: string | number | undefined;

    try {
      console.log(`🚀 [UNIFIED] Iniciando geração com ${selectedAPI.toUpperCase()}...`);
      
      // 1️⃣ TENTAR REFRESH DA SESSÃO (best-effort)
      console.log('🔄 [UNIFIED] Tentando refresh da sessão...');
      await supabase.auth.refreshSession();
      
      // 2️⃣ VERIFICAR AUTENTICAÇÃO
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session?.access_token) {
        console.error('❌ [UNIFIED] Usuário não autenticado:', authError);
        throw new Error('Usuário não autenticado. Faça login para continuar.');
      }
      
      console.log('✅ [UNIFIED] Usuário autenticado:', session.user.id);
      console.log('🔐 [UNIFIED] Token presente:', session.access_token.substring(0, 20) + '...');

      // 3️⃣ VALIDAÇÃO
      if (!productName?.trim()) {
        throw new Error('Nome do produto é obrigatório');
      }
      if (!shortDescription?.trim()) {
        throw new Error('Descrição curta é obrigatória');
      }

      toastId = toast.loading(`🔄 Adicionando à fila (${selectedAPI === 'gemini' ? 'Gemini' : 'OpenAI'})...`);

      console.log('🚀 [UNIFIED] Chamando queue-image...', { 
        productName: productName.trim().substring(0, 50),
        selectedAPI 
      });

      // 4️⃣ ENFILEIRAR VIA QUEUE-IMAGE (com retry 1x em 401/Invalid JWT)
      const body = {
        generationType: 'unified_commands',
        inputData: {
          productName: productName.trim(),
          shortDescription: shortDescription.trim(),
          longDescription: shortDescription.trim(),
          forceAPI: selectedAPI,
          apiKeyId: apiKeyId || 'default'
        }
      };

      const invokeOnce = () =>
        supabase.functions.invoke('queue-image', {
          body,
        });

      let { data, error } = await invokeOnce();

      // Se der 401/Invalid JWT, tenta 1x fazer refresh e repetir
      if (error) {
        const status = (error as any)?.context?.status || 0;
        const msg = typeof (error as any)?.message === 'string' ? (error as any).message : '';
        const isAuth = status === 401 || /invalid jwt/i.test(msg) || /unauthorized/i.test(msg);

        if (isAuth) {
          console.warn('🔄 [UNIFIED] 401/Invalid JWT no enqueue - tentando refresh e retry 1x...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

          if (!refreshError && refreshData.session?.access_token) {
            ({ data, error } = await invokeOnce());
          }
        }
      }

      console.log('📦 [UNIFIED] Resposta queue-image:', { data, error });

      if (error) {
        console.error('❌ [UNIFIED] Erro ao enfileirar:', error);
        
        // Extrair status HTTP do erro
        const status = (error as any)?.context?.status || 0;
        const errorBody = (error as any)?.context?.body || (error as any)?.message;
        
        console.error('❌ [UNIFIED] Status HTTP:', status, 'Body:', errorBody);
        
        if (status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        } else if (status === 429) {
          // Capturar dados ricos do 429
          let parsedBody: any = {};
          try {
            if (typeof errorBody === 'string') {
              parsedBody = JSON.parse(errorBody);
            } else if (typeof errorBody === 'object') {
              parsedBody = errorBody;
            }
          } catch {}
          
          const rateLimitError = new Error(parsedBody?.error || 'Limite de gerações atingido') as any;
          rateLimitError.status = 429;
          rateLimitError.limits = parsedBody?.limits || {};
          rateLimitError.context = { status: 429, body: errorBody };
          throw rateLimitError;
        } else if (status === 403) {
          throw new Error('Acesso negado. Verifique suas permissões.');
        }
        
        throw new Error((error as any).message || 'Erro ao adicionar à fila');
      }

      if (!data?.success) {
        const errorMsg = data?.error || 'Falha ao enfileirar';
        console.error('❌ [UNIFIED] Falha no enqueue:', errorMsg, data?.limits);
        throw new Error(errorMsg);
      }

      const jobId = data.jobId;
      setCurrentJobId(jobId);
      setProgress(10);

      console.log(`✅ [UNIFIED] JOB CRIADO: ${jobId}, posição: ${data.queuePosition}`);
      toast.loading(`📋 Posição na fila: ${data.queuePosition} (~${data.estimatedWaitMinutes}min)`, { id: toastId });

      // 5️⃣ INICIAR POLLING
      startPolling(jobId, toastId);
      
      // 🔥 DISPARAR WORKER MANUALMENTE (enquanto pg_cron não está ativo)
      console.log('🔥 [WORKER] Disparando process-queue para unified commands...');
      supabase.functions.invoke('process-queue', {
        body: { trigger: 'manual', targetJobId: jobId }
      }).catch(err => console.warn('⚠️ [WORKER] Trigger failed:', err));

    } catch (error: any) {
      console.error(`💥 [UNIFIED] ERRO COMPLETO:`, error);
      setLoading(false);
      setProgress(0);
      
      let errorMessage = 'Erro ao executar comandos.';
      
      if (error instanceof Error) {
        if (error.message.includes('autenticado') || error.message.includes('login')) {
          errorMessage = `🔐 ${error.message}`;
        } else if (error.message.includes('Limite') || error.message.includes('limit')) {
          errorMessage = `🚫 ${error.message}`;
        } else if (error.message.includes('créditos') || error.message.includes('credits')) {
          errorMessage = `💰 ${error.message}`;
        } else {
          errorMessage = `❌ ${error.message}`;
        }
      }

      // Substituir toast de loading por erro (usando mesmo ID)
      if (toastId) {
        toast.error(errorMessage, { id: toastId, duration: 10000 });
      } else {
        toast.error(errorMessage, { duration: 10000 });
      }
      
      // Disparar evento de erro para automação (source = enqueue PARA a automação)
      window.dispatchEvent(new CustomEvent('automationError', {
        detail: { step: 'unified', error: error?.message || error, source: 'enqueue' }
      }));
    }
  }, [startPolling]);

  return {
    isLoadingGemini,
    isLoadingOpenAI,
    isLoading: isLoadingGemini || isLoadingOpenAI,
    currentJobId,
    progress,
    generateUnifiedCommands,
    stopPolling
  };
};
