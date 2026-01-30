
import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useInactivityTimeout = (timeoutMinutes: number = 10) => {
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      toast.info('Sessão expirada por inatividade');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      navigate('/login');
    }
  }, [navigate]);

  const showWarning = useCallback(() => {
    toast.warning('Sua sessão expirará em 5 minutos por inatividade', {
      duration: 10000,
    });
  }, []);

  const resetTimeout = useCallback(() => {
    // Limpar timeouts existentes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Definir aviso 5 minutos antes do logout (ou menos se timeout for curto)
    const warningMinutes = Math.min(5, timeoutMinutes - 1);
    warningTimeoutRef.current = setTimeout(() => {
      showWarning();
    }, (timeoutMinutes - warningMinutes) * 60 * 1000);

    // Definir logout automático
    timeoutRef.current = setTimeout(() => {
      logout();
    }, timeoutMinutes * 60 * 1000);
  }, [timeoutMinutes, logout, showWarning]);

  const setupEventListeners = useCallback(() => {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    const resetTimeoutHandler = () => {
      resetTimeout();
    };

    // Adicionar listeners para detectar atividade
    events.forEach(event => {
      document.addEventListener(event, resetTimeoutHandler, true);
    });

    // Iniciar o timeout
    resetTimeout();

    // Função de cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimeoutHandler, true);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [resetTimeout]);

  useEffect(() => {
    return setupEventListeners();
  }, [setupEventListeners]);

  return {
    resetTimeout,
  };
};
