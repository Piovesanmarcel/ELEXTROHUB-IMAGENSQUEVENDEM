import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';
import LoadingScreen from '@/components/ui/loading-screen';

interface RequireAuthProps {
  children: React.ReactNode;
}

// 🔒 VERIFICAÇÃO SÍNCRONA: Existe flag de reset pendente?
const hasPendingPasswordReset = (): boolean => {
  try {
    return localStorage.getItem('pending_password_reset') === '1';
  } catch {
    return false;
  }
};

export default function RequireAuth({ children }: RequireAuthProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const location = useLocation();

  // 🔒 BLOQUEIO IMEDIATO: Se há reset pendente, redirecionar para /auth
  const pendingReset = hasPendingPasswordReset();
  
  // Configurar timeout de inatividade para 6 horas (360 minutos)
  useInactivityTimeout(360);

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;

    // 🔒 Se há reset pendente, não verificar sessão - bloquear imediatamente
    if (hasPendingPasswordReset()) {
      console.log('🔒 RequireAuth - Reset pendente detectado, bloqueando acesso');
      setIsLoading(false);
      setIsAuthenticated(false);
      return;
    }

    // Registrar listener PRIMEIRO (ordem recomendada)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 RequireAuth - Auth state changed:', event, {
          authenticated: !!session,
          userId: session?.user?.id,
          email: session?.user?.email
        });
        
        // 🔒 Mesmo com sessão, se há reset pendente, não autenticar
        if (hasPendingPasswordReset()) {
          console.log('🔒 RequireAuth - Reset pendente, ignorando sessão');
          if (isMounted) {
            setIsAuthenticated(false);
            setIsLoading(false);
          }
          return;
        }
        
        if (isMounted) {
          setIsAuthenticated(!!session);
          setAuthError(null);
          setIsLoading(false);
        }
      }
    );

    const checkAuth = async () => {
      try {
        console.log('🔐 RequireAuth - Verificando sessão existente...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          const isNetworkError = error.message?.includes('fetch') || error.message?.includes('network');
          
          console.error('❌ RequireAuth - Erro ao verificar sessão:', {
            error,
            message: error.message,
            status: error.status,
            isNetworkError
          });

          // Retry automático em caso de erro de rede (máximo 3 tentativas)
          if (retryCount < 3 && isNetworkError) {
            retryCount++;
            console.warn(`⚠️ RequireAuth - Tentando novamente após erro de rede (${retryCount}/3)...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return checkAuth();
          }

          setAuthError(isNetworkError ? 'Erro de conexão' : error.message);
          if (isMounted) {
            setIsAuthenticated(false);
            setIsLoading(false);
          }
          return;
        }

        console.log('✅ RequireAuth - Verificação concluída:', {
          authenticated: !!data.session,
          userId: data.session?.user?.id,
          email: data.session?.user?.email,
          hasSession: !!data.session
        });

        if (isMounted) {
          setIsAuthenticated(!!data.session);
          setAuthError(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('❌ RequireAuth - Erro inesperado na autenticação:', error);
        
        // Retry automático para erros de conexão
        if (retryCount < 3) {
          retryCount++;
          console.warn(`⚠️ RequireAuth - Tentando novamente após erro inesperado (${retryCount}/3)...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return checkAuth();
        }

        if (isMounted) {
          setAuthError('Erro de conexão');
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      }
    };

    // Verificar sessão DEPOIS de registrar o listener
    checkAuth();

    return () => {
      isMounted = false;
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  if (isLoading) {
    return <LoadingScreen message="Verificando autenticação..." />;
  }

  if (authError) {
    console.error('Erro na autenticação, redirecionando para login');
  }

  // 🔒 BLOQUEIO CRÍTICO: Se há reset pendente, redirecionar para página de reset
  if (pendingReset) {
    console.log('🔒 RequireAuth - Bloqueando acesso ao painel, reset pendente');
    return <Navigate to="/redefinir-senha" replace />;
  }

  if (!isAuthenticated || authError) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
