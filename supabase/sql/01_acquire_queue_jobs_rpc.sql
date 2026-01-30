-- ============================================================================
-- SCRIPT 1: FUNÇÃO RPC acquire_queue_jobs COM LOCK ATÔMICO
-- ============================================================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================================================

-- Primeiro, adicionar coluna locked_at se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'image_generation_queue' AND column_name = 'locked_at'
  ) THEN
    ALTER TABLE public.image_generation_queue ADD COLUMN locked_at TIMESTAMPTZ;
  END IF;
END $$;

-- Adicionar colunas de métricas se não existirem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'image_generation_queue' AND column_name = 'queue_wait_time_ms'
  ) THEN
    ALTER TABLE public.image_generation_queue ADD COLUMN queue_wait_time_ms INTEGER;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'image_generation_queue' AND column_name = 'processing_time_ms'
  ) THEN
    ALTER TABLE public.image_generation_queue ADD COLUMN processing_time_ms INTEGER;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'image_generation_queue' AND column_name = 'credits_debited'
  ) THEN
    ALTER TABLE public.image_generation_queue ADD COLUMN credits_debited BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Atualizar constraint de generation_type para incluir novos tipos
ALTER TABLE public.image_generation_queue 
DROP CONSTRAINT IF EXISTS image_generation_queue_generation_type_check;

ALTER TABLE public.image_generation_queue 
ADD CONSTRAINT image_generation_queue_generation_type_check 
CHECK (generation_type IN ('carousel', 'marketing', 'background', 'stability', 'tongyi'));

-- Criar índice para locked_at para queries mais rápidas
CREATE INDEX IF NOT EXISTS idx_queue_locked_at ON public.image_generation_queue(locked_at);

-- ============================================================================
-- FUNÇÃO PRINCIPAL: acquire_queue_jobs
-- Usa FOR UPDATE SKIP LOCKED para evitar race conditions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.acquire_queue_jobs(p_batch_size INTEGER DEFAULT 10)
RETURNS SETOF public.image_generation_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
BEGIN
  -- Atualiza e retorna os jobs em uma única operação atômica
  -- FOR UPDATE SKIP LOCKED garante que workers concorrentes não peguem o mesmo job
  RETURN QUERY
  WITH locked_jobs AS (
    SELECT id 
    FROM public.image_generation_queue
    WHERE status = 'pending' 
      AND (locked_at IS NULL OR locked_at < v_now - INTERVAL '5 minutes')
    ORDER BY priority DESC, created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT p_batch_size
  )
  UPDATE public.image_generation_queue q
  SET 
    locked_at = v_now,
    status = 'processing',
    started_at = COALESCE(started_at, v_now),
    queue_wait_time_ms = EXTRACT(EPOCH FROM (v_now - created_at)) * 1000
  FROM locked_jobs lj 
  WHERE q.id = lj.id
  RETURNING q.*;
END;
$$;

-- Conceder permissão para service role executar a função
GRANT EXECUTE ON FUNCTION public.acquire_queue_jobs(INTEGER) TO service_role;

-- Comentário para documentação
COMMENT ON FUNCTION public.acquire_queue_jobs IS 
'Adquire jobs pendentes da fila com lock atômico usando FOR UPDATE SKIP LOCKED. 
Retorna até p_batch_size jobs que são imediatamente marcados como processing.
Ideal para cenários com múltiplos workers processando a mesma fila.';

-- ============================================================================
-- TABELA: generation_metrics
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.generation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  user_id UUID NOT NULL,
  generation_type TEXT NOT NULL,
  model_used TEXT,
  queue_wait_time_ms INTEGER,
  processing_time_ms INTEGER,
  tokens_used INTEGER DEFAULT 0,
  estimated_cost_usd DECIMAL(10,6) DEFAULT 0,
  estimated_cost_brl DECIMAL(10,6) DEFAULT 0,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para métricas
CREATE INDEX IF NOT EXISTS idx_metrics_user ON public.generation_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_metrics_created ON public.generation_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_type ON public.generation_metrics(generation_type);

-- RLS para métricas
ALTER TABLE public.generation_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own metrics" ON public.generation_metrics;
CREATE POLICY "Users can view own metrics"
  ON public.generation_metrics FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all metrics" ON public.generation_metrics;
CREATE POLICY "Service role can manage all metrics"
  ON public.generation_metrics FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- FUNÇÃO: debit_generation_credit
-- ============================================================================

CREATE OR REPLACE FUNCTION public.debit_generation_credit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Por enquanto, retorna true (sem controle de créditos)
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.debit_generation_credit(UUID) TO service_role;

-- ============================================================================
-- CHECK USER QUEUE LIMITS: verifica se usuário pode enfileirar mais jobs
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_user_queue_limits(p_user_id UUID)
RETURNS TABLE(
  can_enqueue BOOLEAN,
  reason TEXT,
  pending_jobs INTEGER,
  max_concurrent INTEGER,
  credits_remaining INTEGER,
  queue_priority INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pending_count INTEGER;
  v_max_concurrent INTEGER := 2;  -- ALTERADO: de 50 para 2 (1 ativo + 1 na fila)
  v_credits INTEGER := 9999;
  v_priority INTEGER := 0;
BEGIN
  -- Contar apenas jobs que estão realmente ativos (não expirados)
  SELECT COUNT(*) INTO v_pending_count
  FROM public.image_generation_queue
  WHERE user_id = p_user_id 
    AND status IN ('pending', 'processing')
    -- Ignorar jobs processing que estão presos há mais de 5 minutos
    AND NOT (
      status = 'processing' 
      AND locked_at IS NOT NULL 
      AND locked_at < now() - INTERVAL '5 minutes'
    );
  
  IF v_pending_count >= v_max_concurrent THEN
    RETURN QUERY SELECT 
      FALSE,
      format('Você já tem %s job(s) em andamento. Aguarde a conclusão antes de iniciar outro.', v_pending_count),
      v_pending_count,
      v_max_concurrent,
      v_credits,
      v_priority;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    TRUE,
    'OK'::TEXT,
    v_pending_count,
    v_max_concurrent,
    v_credits,
    v_priority;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_user_queue_limits(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_user_queue_limits(UUID) TO authenticated;

-- ============================================================================
-- VERIFICAR SE FOI CRIADO COM SUCESSO
-- ============================================================================
SELECT 'acquire_queue_jobs criada com sucesso!' AS status;
