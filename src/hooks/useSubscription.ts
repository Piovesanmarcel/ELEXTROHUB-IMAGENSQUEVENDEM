import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SubscriptionStatus {
  subscribed: boolean;
  planType: 'monthly' | 'yearly' | null;
  subscriptionEnd: string | null;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | null;
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    subscribed: false,
    planType: null,
    subscriptionEnd: null,
    status: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setSubscription({
          subscribed: false,
          planType: null,
          subscriptionEnd: null,
          status: null,
        });
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        setIsLoading(false);
        return;
      }

      setSubscription({
        subscribed: data.subscribed,
        planType: data.plan_type,
        subscriptionEnd: data.subscription_end,
        status: data.status,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createCheckout = async (planType: 'monthly' | 'yearly') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Você precisa estar logado para assinar');
        return null;
      }

      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: { planType },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error creating checkout:', error);
        toast.error('Erro ao criar sessão de pagamento');
        return null;
      }

      if (data.error) {
        toast.error(data.error);
        return null;
      }

      return data.url;
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Erro ao criar sessão de pagamento');
      return null;
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Você precisa estar logado para gerenciar sua assinatura');
        return null;
      }

      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error opening customer portal:', error);
        toast.error('Erro ao abrir portal do cliente');
        return null;
      }

      if (data.error) {
        toast.error(data.error);
        return null;
      }

      return data.url;
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Erro ao abrir portal do cliente');
      return null;
    }
  };

  useEffect(() => {
    checkSubscription();

    // Re-check subscription every 60 seconds
    const interval = setInterval(checkSubscription, 60000);

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    return () => {
      clearInterval(interval);
      authSubscription.unsubscribe();
    };
  }, [checkSubscription]);

  return {
    subscription,
    isLoading,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
};
