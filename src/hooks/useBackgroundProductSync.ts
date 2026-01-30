
import { useEffect, useRef, useCallback } from "react";
import { useProductsActions } from "./useProductsActions";

export function useBackgroundProductSync(onProductsUpdated?: () => void) {
  const { handleSync } = useProductsActions();
  const hasExecutedRef = useRef(false);
  const isExecutingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastExecutionRef = useRef<number>(0);

  const executeBackgroundSync = useCallback(async () => {
    const now = Date.now();
    
    // Evitar execuções simultâneas
    if (isExecutingRef.current) {
      console.log('🔄 Background sync já em execução, ignorando...');
      return;
    }

    // Evitar execuções muito frequentes (mínimo 15 minutos)
    if (now - lastExecutionRef.current < 15 * 60 * 1000) {
      console.log('🔄 Background sync executado recentemente, aguardando...');
      return;
    }

    // Verificar se já executou na sessão atual (máximo 1x por sessão)
    if (hasExecutedRef.current) {
      console.log('🔄 Background sync já executado nesta sessão, ignorando...');
      return;
    }

    try {
      isExecutingRef.current = true;
      hasExecutedRef.current = true;
      lastExecutionRef.current = now;
      
      console.log('🔄 Iniciando sincronização automática em segundo plano...');
      
      // Executar sincronização silenciosa com timeout
      const syncPromise = handleSync(false, false);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Background sync timeout')), 60000)
      );
      
      const success = await Promise.race([syncPromise, timeoutPromise]);
      
      if (success) {
        console.log('✅ Sincronização automática concluída com sucesso');
        // Só notificar se houve mudanças significativas
        onProductsUpdated?.();
      } else {
        console.log('⚠️ Sincronização automática falhou silenciosamente');
      }
    } catch (error) {
      console.error('❌ Erro na sincronização automática:', error);
      // Em caso de erro, permitir nova tentativa após 30 minutos
      hasExecutedRef.current = false;
    } finally {
      isExecutingRef.current = false;
    }
  }, [handleSync, onProductsUpdated]);

  const startBackgroundSync = useCallback(() => {
    // Verificações mais rigorosas
    if (isExecutingRef.current || hasExecutedRef.current) {
      console.log('🔄 Background sync não iniciado - já executado ou em execução');
      return;
    }
    
    // Verificar se o usuário está ativo (evitar sync em abas inativas)
    if (document.visibilityState === 'hidden') {
      console.log('🔄 Background sync não iniciado - aba inativa');
      return;
    }
    
    console.log('🔄 Agendando background sync para 45 segundos...');
    
    // Delay maior para garantir que o carregamento inicial seja concluído
    timeoutRef.current = setTimeout(() => {
      // Verificar novamente se a aba ainda está ativa
      if (document.visibilityState === 'visible') {
        executeBackgroundSync();
      } else {
        console.log('🔄 Background sync cancelado - aba ficou inativa');
      }
    }, 45000); // 45 segundos de delay
  }, [executeBackgroundSync]);

  // Reset para permitir nova execução (apenas em casos específicos)
  const resetSync = useCallback(() => {
    hasExecutedRef.current = false;
    isExecutingRef.current = false;
    lastExecutionRef.current = 0;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    console.log('🔄 Background sync resetado');
  }, []);

  // Monitorar visibilidade da aba
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && timeoutRef.current) {
        console.log('🔄 Cancelando background sync - aba ficou inativa');
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup ao desmontar
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    startBackgroundSync,
    resetSync,
    isExecuting: isExecutingRef.current
  };
}
