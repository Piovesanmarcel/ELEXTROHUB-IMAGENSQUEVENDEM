import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminAuthState {
  isAdmin: boolean;
  isLoading: boolean;
  userId: string | null;
  email: string | null;
  error: string | null;
}

export const useAdminAuth = () => {
  const [state, setState] = useState<AdminAuthState>({
    isAdmin: false,
    isLoading: true,
    userId: null,
    email: null,
    error: null,
  });

  const checkAdminStatus = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setState({
          isAdmin: false,
          isLoading: false,
          userId: null,
          email: null,
          error: null,
        });
        return;
      }

      // Query direta à tabela user_roles (RLS permite leitura própria)
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError) {
        console.error('[useAdminAuth] Error checking role:', roleError);
        setState({
          isAdmin: false,
          isLoading: false,
          userId: session.user.id,
          email: session.user.email || null,
          error: roleError.message,
        });
        return;
      }

      const isAdmin = !!roleData;
      console.log('[useAdminAuth] Admin check:', { isAdmin, userId: session.user.id });

      setState({
        isAdmin,
        isLoading: false,
        userId: session.user.id,
        email: session.user.email || null,
        error: null,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useAdminAuth] Exception:', errorMessage);
      setState(prev => ({
        ...prev,
        isAdmin: false,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, []);

  useEffect(() => {
    checkAdminStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdminStatus();
    });

    return () => subscription.unsubscribe();
  }, [checkAdminStatus]);

  return {
    ...state,
    refetch: checkAdminStatus,
  };
};
