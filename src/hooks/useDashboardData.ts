import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useDashboardData() {
  const [data, setData] = useState({
    // Marketplace integrations
    marketplaceIntegrations: [],
    activeIntegrations: 0,
    
    // Orders data
    ordersToday: 0,
    ordersThisMonth: 0,
    totalRevenue: 0,
    
    // Sync activity
    lastSyncDate: null as Date | null,
    syncStatus: 'unknown' as 'success' | 'error' | 'running' | 'unknown',
    
    // Image hosting
    hostedImages: 0,
    storageUsed: 0,
    
    // AI enhancements
    aiResultsCount: 0,
    
    // Referrals
    referralCount: 0,
    referralCredits: 0,
    
    // System health
    systemHealth: 'healthy' as 'healthy' | 'warning' | 'error'
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Buscar integrações de marketplace
      const { data: integrations, error: integrationsError } = await (supabase as any)
        .from('marketplace_integrations')
        .select('*')
        .eq('usuario_id', user.id);

      // Buscar pedidos
      const { data: orders, error: ordersError } = await (supabase as any)
        .from('pedidos')
        .select('*')
        .eq('usuario_id', user.id);

      // Buscar última sincronização
      const { data: syncLogs, error: syncError } = await (supabase as any)
        .from('sync_logs')
        .select('*')
        .eq('usuario_id', user.id)
        .order('criado_em', { ascending: false })
        .limit(1);

      // Buscar imagens hospedadas
      const { data: hostedImages, error: imagesError } = await (supabase as any)
        .from('hosted_images')
        .select('id')
        .eq('user_id', user.id);

      // Buscar resultados de IA
      const { data: aiResults, error: aiError } = await (supabase as any)
        .from('ai_unified_results')
        .select('id')
        .eq('user_id', user.id);

      // Buscar indicações
      const { data: referrals, error: referralsError } = await (supabase as any)
        .from('referrals')
        .select('id')
        .eq('referrer_user_id', user.id)
        .eq('status', 'credited');

      // Calcular métricas
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const ordersToday = orders?.filter((order: any) => 
        new Date(order.criado_em || order.created_at) >= startOfToday
      ).length || 0;

      const ordersThisMonth = orders?.filter((order: any) => 
        new Date(order.criado_em || order.created_at) >= startOfMonth
      ).length || 0;

      const totalRevenue = orders?.reduce((sum: number, order: any) => sum + (order.total || 0), 0) || 0;

      const totalStorageUsed = 0; // Simplified since file_size column doesn't exist

      const totalReferralCredits = referrals?.length || 0;

      setData({
        marketplaceIntegrations: integrations || [],
        activeIntegrations: integrations?.filter((i: any) => i.ativo).length || 0,
        ordersToday,
        ordersThisMonth,
        totalRevenue,
        lastSyncDate: syncLogs?.[0]?.criado_em ? new Date(syncLogs[0].criado_em) : null,
        syncStatus: syncLogs?.[0]?.status === 'sucesso' ? 'success' : 
                   syncLogs?.[0]?.status === 'erro' ? 'error' : 'unknown',
        hostedImages: hostedImages?.length || 0,
        storageUsed: totalStorageUsed / (1024 * 1024 * 1024), // Convert to GB
        aiResultsCount: aiResults?.length || 0,
        referralCount: referrals?.length || 0,
        referralCredits: totalReferralCredits,
        systemHealth: 'healthy'
      });

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    refreshData: loadDashboardData
  };
}