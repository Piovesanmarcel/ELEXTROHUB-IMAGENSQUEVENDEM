import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'user' | null;

interface UserRoleState {
  role: UserRole;
  isAdmin: boolean;
  isLoading: boolean;
  credits: number;
  creditsUsed: number;
  refreshRole: () => Promise<void>;
  refreshCredits: () => Promise<void>;
}

export const useUserRole = (): UserRoleState => {
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [credits, setCredits] = useState(0);
  const [creditsUsed, setCreditsUsed] = useState(0);

  const fetchRole = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setRole(null);
        setIsLoading(false);
        return;
      }

      // Verificar role do usuário
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar role:', error);
        setRole('user'); // Default para user
      } else {
        setRole(roleData?.role as UserRole || 'user');
      }
    } catch (error) {
      console.error('Erro ao verificar role:', error);
      setRole('user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCredits = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from('user_credits')
        .select('credits_balance, credits_used')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setCredits(data.credits_balance || 0);
        setCreditsUsed(data.credits_used || 0);
      }
    } catch (error) {
      console.error('Erro ao buscar créditos:', error);
    }
  }, []);

  useEffect(() => {
    fetchRole();
    fetchCredits();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRole();
      fetchCredits();
    });

    return () => subscription.unsubscribe();
  }, [fetchRole, fetchCredits]);

  return {
    role,
    isAdmin: role === 'admin',
    isLoading,
    credits,
    creditsUsed,
    refreshRole: fetchRole,
    refreshCredits: fetchCredits
  };
};
