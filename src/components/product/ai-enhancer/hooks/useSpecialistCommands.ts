import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook para comandos especializados (7 Funções)
 * MIGRADO: Agora usa a fila (queue-image) ao invés do deepai-chat direto
 */
export const useSpecialistCommands = () => {
  const [isLoadingGemini, setIsLoadingGemini] = useState(false);
  const [isLoadingOpenAI, setIsLoadingOpenAI] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const successCallbackRef = useRef<((results: any) => void) | null>(null);

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
    const maxPolls = 60; // 3 minutos máximo (60 * 3s)
    
    const checkStatus = async () => {
      pollCount++;
      
      if (pollCount > maxPolls) {
        console.log(`⏰ [SPECIALIST] Timeout após ${maxPolls} tentativas`);
        stopPolling();
        setIsLoadingGemini(false);
        setIsLoadingOpenAI(false);
        setCurrentJobId(null);
        setProgress(0);
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
          toast.loading('🎯 Executando 7 Funções Especializadas...', { id: toastId });
        } else if (job.status === 'completed') {
          setProgress(100);
          stopPolling();
          setIsLoadingGemini(false);
          setIsLoadingOpenAI(false);
          setCurrentJobId(null);
          
          const result = job.result || {};
          
          toast.success(`🎯 7 Funções Especializadas executadas!`, {
            id: toastId,
            duration: 8000,
            description: '✅ Engenheiro de Prompts • ✅ ULTRA GRAINY FLASH • ✅ Analisador de Oferta • ✅ Base de Criativos • ✅ TCHAN • ✅ TCHAN_PLUS • ✅ Preservação 100%'
          });

          // Chamar callback de sucesso
          if (successCallbackRef.current) {
            successCallbackRef.current(result);
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
        console.error('❌ [SPECIALIST] Erro no polling:', err);
        
        const status = err?.context?.status || 0;
        const errorMessage = err?.message || 'Erro desconhecido';
        
        // ✅ IGNORAR 401 NO POLLING - Sessão pode expirar, mas job continua no backend
        // O endpoint check-queue-status agora é público (verify_jwt = false)
        if (status === 401 || errorMessage.includes('401') || errorMessage.toLowerCase().includes('unauthorized')) {
          console.warn('⚠️ [SPECIALIST] 401 no polling - IGNORANDO (job continua no backend)');
          // ❌ NÃO parar polling
          // ✅ Apenas continuar tentando
          return;
        }
        
        // Não parar polling por erros temporários (até 5 tentativas)
        if (pollCount < 5) {
          console.log(`⏳ [SPECIALIST] Tentativa ${pollCount}/5 - Erro temporário, continuando...`);
          return;
        }
        
        stopPolling();
        setIsLoadingGemini(false);
        setIsLoadingOpenAI(false);
        setCurrentJobId(null);
        setProgress(0);
        
        toast.error(`Erro ao verificar status: ${errorMessage}`, { id: toastId });
      }
    };

    // Primeira verificação imediata
    checkStatus();
    
    // Continuar polling a cada 3 segundos
    pollingIntervalRef.current = setInterval(checkStatus, 3000);
  }, [stopPolling]);

  const generateSpecialistCommands = useCallback(async (
    productName: string,
    shortDescription: string,
    selectedAPI: 'gemini' | 'openai',
    onSuccess: (results: any) => void,
    unifiedData?: {
      seoDescription?: string;
      technicalSpecs?: string;
      keywords?: string;
    }
  ) => {
    const setLoading = selectedAPI === 'gemini' ? setIsLoadingGemini : setIsLoadingOpenAI;
    setLoading(true);
    setProgress(5);
    successCallbackRef.current = onSuccess;

    // Declarar toastId fora do try para poder usar no catch
    let toastId: string | number | undefined;

    try {
      console.log(`🎯 [SPECIALIST] Iniciando via FILA com ${selectedAPI.toUpperCase()}...`);
      
      // 1️⃣ TENTAR REFRESH DA SESSÃO (best-effort)
      console.log('🔄 [SPECIALIST] Tentando refresh da sessão...');
      await supabase.auth.refreshSession();
      
      // 2️⃣ VERIFICAR AUTENTICAÇÃO
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session?.access_token) {
        console.error('❌ [SPECIALIST] Usuário não autenticado');
        throw new Error('Usuário não autenticado. Faça login para continuar.');
      }
      
      console.log('✅ [SPECIALIST] Usuário autenticado:', session.user.id);
      console.log('🔐 [SPECIALIST] Token presente:', session.access_token.substring(0, 20) + '...');

      // 3️⃣ VALIDAÇÃO
      if (!productName?.trim()) {
        throw new Error('Nome do produto é obrigatório');
      }
      if (!shortDescription?.trim()) {
        throw new Error('Descrição curta é obrigatória');
      }

      toastId = toast.loading(`🎯 Adicionando à fila (7 Funções Especializadas)...`);

      console.log('🚀 [SPECIALIST] Chamando queue-image...', { 
        productName: productName.trim().substring(0, 50),
        selectedAPI,
        hasUnifiedData: !!unifiedData 
      });

      // 4️⃣ ENFILEIRAR VIA QUEUE-IMAGE (com retry 1x em 401/Invalid JWT)
      const body = {
        generationType: 'specialist_commands',
        inputData: {
          productName: productName.trim(),
          shortDescription: shortDescription.trim(),
          longDescription: shortDescription.trim(),
          forceAPI: selectedAPI,
          unifiedData: unifiedData || null
        }
      };

      const invokeOnce = () =>
        supabase.functions.invoke('queue-image', {
          body,
        });

      let { data, error } = await invokeOnce();

      if (error) {
        const status = (error as any)?.context?.status || 0;
        const msg = typeof (error as any)?.message === 'string' ? (error as any).message : '';
        const isAuth = status === 401 || /invalid jwt/i.test(msg) || /unauthorized/i.test(msg);

        if (isAuth) {
          console.warn('🔄 [SPECIALIST] 401/Invalid JWT no enqueue - tentando refresh e retry 1x...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

          if (!refreshError && refreshData.session?.access_token) {
            ({ data, error } = await invokeOnce());
          }
        }
      }

      console.log('📦 [SPECIALIST] Resposta queue-image:', { data, error });

      if (error) {
        console.error('❌ [SPECIALIST] Erro ao enfileirar:', error);
        
        const status = (error as any)?.context?.status || 0;
        const errorBody = (error as any)?.context?.body || (error as any)?.message;
        
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
        }
        
        throw new Error((error as any).message || 'Erro ao adicionar à fila');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Falha ao enfileirar');
      }

      const jobId = data.jobId;
      setCurrentJobId(jobId);
      setProgress(10);

      console.log(`✅ [SPECIALIST] JOB CRIADO: ${jobId}, posição: ${data.queuePosition}`);
      toast.loading(`📋 Posição na fila: ${data.queuePosition}`, { id: toastId });

      // 5️⃣ INICIAR POLLING
      startPolling(jobId, toastId);

    } catch (error: any) {
      console.error(`💥 [SPECIALIST] ERRO:`, error);
      setLoading(false);
      setProgress(0);
      
      let errorMessage = 'Erro ao executar 7 funções especializadas.';
      
      if (error instanceof Error) {
        if (error.message.includes('autenticado') || error.message.includes('login')) {
          errorMessage = `🔐 ${error.message}`;
        } else if (error.message.includes('Limite') || error.message.includes('limit')) {
          errorMessage = `🚫 ${error.message}`;
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
    }
  }, [startPolling]);

  return {
    isLoadingGemini,
    isLoadingOpenAI,
    isLoading: isLoadingGemini || isLoadingOpenAI,
    currentJobId,
    progress,
    generateSpecialistCommands,
    stopPolling
  };
};
