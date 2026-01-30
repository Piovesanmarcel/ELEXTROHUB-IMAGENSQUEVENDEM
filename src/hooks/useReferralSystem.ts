import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Type-safe wrapper for legacy tables
const legacyDb = supabase as any;

interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  uses_count: number;
  max_uses: number;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
}

interface Referral {
  id: string;
  referrer_user_id: string;
  referred_user_id: string;
  referral_code: string;
  status: string;
  credits_awarded: number;
  conversion_date: string | null;
  created_at: string;
}

export const useReferralSystem = () => {
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReferralCodes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return;
      }

      const { data, error } = await legacyDb
        .from('referral_codes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar códigos de referral:', error);
        return;
      }

      setReferralCodes((data || []) as ReferralCode[]);
    } catch (error) {
      console.error('Erro inesperado:', error);
    }
  };

  const fetchReferrals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return;
      }

      const { data, error } = await legacyDb
        .from('referrals')
        .select('*')
        .eq('referrer_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar indicações:', error);
        return;
      }

      setReferrals((data || []) as Referral[]);
    } catch (error) {
      console.error('Erro inesperado:', error);
    }
  };

  const generateReferralCode = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Usuário não autenticado');
        return false;
      }

      // Gerar código único
      const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };

      const codeData = generateCode();

      // Criar registro do código
      const { error: insertError } = await legacyDb
        .from('referral_codes')
        .insert({
          user_id: user.id,
          code: codeData,
          uses_count: 0,
          max_uses: 100,
          is_active: true
        });

      if (insertError) {
        console.error('Erro ao salvar código de referral:', insertError);
        toast.error('Erro ao salvar código de referral');
        return false;
      }

      toast.success('Código de referral gerado com sucesso!');
      await fetchReferralCodes();
      return true;
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro interno');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const registerReferral = async (referralCode: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Usuário não autenticado');
        return false;
      }

      // Buscar código de referral válido
      const { data: codeData, error: codeError } = await legacyDb
        .from('referral_codes')
        .select('*')
        .eq('code', referralCode)
        .eq('is_active', true)
        .maybeSingle();

      if (codeError || !codeData) {
        toast.error('Código de referral inválido ou já utilizado');
        return false;
      }

      // Registrar referral
      const { error: insertError } = await legacyDb
        .from('referrals')
        .insert({
          referrer_user_id: codeData.user_id,
          referred_user_id: user.id,
          referral_code: referralCode,
          status: 'pending',
          credits_awarded: 0
        });

      if (insertError) {
        console.error('Erro ao registrar indicação:', insertError);
        toast.error('Erro ao registrar indicação');
        return false;
      }

      // Atualizar contador de uso
      await legacyDb
        .from('referral_codes')
        .update({ uses_count: (codeData.uses_count || 0) + 1 })
        .eq('id', codeData.id);

      toast.success('Indicação registrada com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro interno');
      return false;
    }
  };

  const deactivateReferralCode = async (codeId: string): Promise<boolean> => {
    try {
      const { error } = await legacyDb
        .from('referral_codes')
        .update({ is_active: false })
        .eq('id', codeId);

      if (error) {
        console.error('Erro ao desativar código:', error);
        toast.error('Erro ao desativar código');
        return false;
      }

      toast.success('Código desativado com sucesso!');
      await fetchReferralCodes();
      return true;
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro interno');
      return false;
    }
  };

  useEffect(() => {
    fetchReferralCodes();
    fetchReferrals();
  }, []);

  return {
    referralCodes,
    referrals,
    isLoading,
    generateReferralCode,
    registerReferral,
    deactivateReferralCode,
    refetchData: () => {
      fetchReferralCodes();
      fetchReferrals();
    }
  };
};
