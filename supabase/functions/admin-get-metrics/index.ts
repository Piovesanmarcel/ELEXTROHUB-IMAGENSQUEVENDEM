import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verificar se é admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verificar role de admin
    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { period = '7d' } = await req.json().catch(() => ({}));
    
    // Calcular data de início baseado no período
    let startDate: Date;
    switch (period) {
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    // Buscar métricas do período
    const { data: metrics, error: metricsError } = await supabaseAdmin
      .from('generation_metrics')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (metricsError) {
      console.error('[ADMIN-METRICS] Erro ao buscar métricas:', metricsError);
      // Se tabela não existe, retornar dados vazios
      if (metricsError.message?.includes('does not exist')) {
        return new Response(
          JSON.stringify({ 
            success: true,
            metrics: {
              totalJobs: 0,
              successfulJobs: 0,
              failedJobs: 0,
              successRate: 0,
              avgQueueTime: 0,
              avgProcessingTime: 0,
              totalCostUSD: 0,
              totalCostBRL: 0,
              totalTokens: 0,
              byType: {},
              byDay: [],
              topUsers: []
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw metricsError;
    }

    // Calcular estatísticas
    const totalJobs = metrics?.length || 0;
    const successfulJobs = metrics?.filter(m => m.success).length || 0;
    const failedJobs = totalJobs - successfulJobs;
    const successRate = totalJobs > 0 ? (successfulJobs / totalJobs * 100) : 0;

    const avgQueueTime = totalJobs > 0
      ? metrics.reduce((acc, m) => acc + (m.queue_wait_time_ms || 0), 0) / totalJobs
      : 0;

    const avgProcessingTime = totalJobs > 0
      ? metrics.reduce((acc, m) => acc + (m.processing_time_ms || 0), 0) / totalJobs
      : 0;

    const totalCostUSD = metrics?.reduce((acc, m) => acc + (m.estimated_cost_usd || 0), 0) || 0;
    const totalCostBRL = metrics?.reduce((acc, m) => acc + (m.estimated_cost_brl || 0), 0) || 0;
    const totalTokens = metrics?.reduce((acc, m) => acc + (m.tokens_used || 0), 0) || 0;

    // Agrupar por tipo
    const byType: Record<string, { count: number; successCount: number; costUSD: number }> = {};
    metrics?.forEach(m => {
      if (!byType[m.generation_type]) {
        byType[m.generation_type] = { count: 0, successCount: 0, costUSD: 0 };
      }
      byType[m.generation_type].count++;
      if (m.success) byType[m.generation_type].successCount++;
      byType[m.generation_type].costUSD += m.estimated_cost_usd || 0;
    });

    // Agrupar por dia
    const byDayMap: Record<string, { date: string; jobs: number; success: number; costUSD: number }> = {};
    metrics?.forEach(m => {
      const date = m.created_at.split('T')[0];
      if (!byDayMap[date]) {
        byDayMap[date] = { date, jobs: 0, success: 0, costUSD: 0 };
      }
      byDayMap[date].jobs++;
      if (m.success) byDayMap[date].success++;
      byDayMap[date].costUSD += m.estimated_cost_usd || 0;
    });
    const byDay = Object.values(byDayMap).sort((a, b) => a.date.localeCompare(b.date));

    // Top usuários por uso
    const userUsage: Record<string, { userId: string; jobs: number; costUSD: number }> = {};
    metrics?.forEach(m => {
      if (!userUsage[m.user_id]) {
        userUsage[m.user_id] = { userId: m.user_id, jobs: 0, costUSD: 0 };
      }
      userUsage[m.user_id].jobs++;
      userUsage[m.user_id].costUSD += m.estimated_cost_usd || 0;
    });
    const topUsers = Object.values(userUsage)
      .sort((a, b) => b.jobs - a.jobs)
      .slice(0, 10);

    // Buscar status da fila atual
    const { count: pendingCount } = await supabaseAdmin
      .from('image_generation_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: processingCount } = await supabaseAdmin
      .from('image_generation_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'processing');

    console.log(`[ADMIN-METRICS] Retornando métricas: ${totalJobs} jobs no período`);

    return new Response(
      JSON.stringify({
        success: true,
        period,
        metrics: {
          totalJobs,
          successfulJobs,
          failedJobs,
          successRate: Math.round(successRate * 100) / 100,
          avgQueueTime: Math.round(avgQueueTime),
          avgProcessingTime: Math.round(avgProcessingTime),
          totalCostUSD: Math.round(totalCostUSD * 10000) / 10000,
          totalCostBRL: Math.round(totalCostBRL * 100) / 100,
          totalTokens,
          byType,
          byDay,
          topUsers
        },
        queue: {
          pending: pendingCount || 0,
          processing: processingCount || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[ADMIN-METRICS] Erro:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
