-- ============================================================================
-- INFRAESTRUTURA COMPLETA: FILA, MÉTRICAS E API KEYS
-- ============================================================================

-- 1. TABELA: image_generation_queue
-- ============================================================================
CREATE TABLE public.image_generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  generation_type TEXT NOT NULL,
  input_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority INTEGER DEFAULT 1,
  result JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  queue_wait_time_ms INTEGER,
  processing_time_ms INTEGER,
  credits_debited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_queue_status_priority ON public.image_generation_queue (status, priority DESC, created_at);
CREATE INDEX idx_queue_user ON public.image_generation_queue (user_id);
CREATE INDEX idx_queue_locked ON public.image_generation_queue (locked_at) WHERE status = 'processing';

-- RLS
ALTER TABLE public.image_generation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own queue jobs"
ON public.image_generation_queue FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own queue jobs"
ON public.image_generation_queue FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own queue jobs"
ON public.image_generation_queue FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all queue jobs"
ON public.image_generation_queue FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- 2. TABELA: generation_metrics
-- ============================================================================
CREATE TABLE public.generation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.image_generation_queue(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  generation_type TEXT NOT NULL,
  model_used TEXT,
  queue_wait_time_ms INTEGER,
  processing_time_ms INTEGER,
  tokens_used INTEGER DEFAULT 0,
  estimated_cost_usd NUMERIC DEFAULT 0,
  estimated_cost_brl NUMERIC DEFAULT 0,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_metrics_user_time ON public.generation_metrics (user_id, created_at DESC);
CREATE INDEX idx_metrics_type ON public.generation_metrics (generation_type, created_at DESC);

-- RLS
ALTER TABLE public.generation_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own metrics"
ON public.generation_metrics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all metrics"
ON public.generation_metrics FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- 3. TABELA: user_api_keys
-- ============================================================================
CREATE TABLE public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  name TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_exhausted BOOLEAN NOT NULL DEFAULT false,
  exhausted_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider, name)
);

-- Índices
CREATE INDEX idx_user_api_keys_user_provider ON public.user_api_keys (user_id, provider);
CREATE INDEX idx_user_api_keys_active ON public.user_api_keys (is_active, is_exhausted) 
  WHERE is_active = true AND is_exhausted = false;

-- RLS
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API keys"
ON public.user_api_keys FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys"
ON public.user_api_keys FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
ON public.user_api_keys FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
ON public.user_api_keys FOR DELETE
USING (auth.uid() = user_id);

-- 4. FUNÇÃO RPC: acquire_queue_jobs (LOCK ATÔMICO)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.acquire_queue_jobs(p_batch_size INTEGER DEFAULT 10)
RETURNS SETOF public.image_generation_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH jobs_to_lock AS (
    SELECT id
    FROM public.image_generation_queue
    WHERE status = 'pending'
    ORDER BY priority DESC, created_at ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.image_generation_queue q
  SET 
    status = 'processing',
    locked_at = now(),
    started_at = now(),
    locked_by = 'worker'
  FROM jobs_to_lock
  WHERE q.id = jobs_to_lock.id
  RETURNING q.*;
END;
$$;

-- 5. FUNÇÃO RPC: check_user_queue_limits
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_user_queue_limits(p_user_id UUID)
RETURNS TABLE (
  can_enqueue BOOLEAN,
  pending_jobs INTEGER,
  max_concurrent INTEGER,
  credits_remaining INTEGER,
  queue_priority INTEGER,
  reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pending INTEGER;
  v_credits INTEGER;
  v_max_concurrent INTEGER := 5;
  v_priority INTEGER := 1;
  v_can_enqueue BOOLEAN := true;
  v_reason TEXT := 'OK';
BEGIN
  -- Contar jobs pendentes/processando
  SELECT COUNT(*) INTO v_pending
  FROM public.image_generation_queue
  WHERE user_id = p_user_id
    AND status IN ('pending', 'processing');

  -- Buscar créditos
  SELECT credits_balance INTO v_credits
  FROM public.user_credits
  WHERE user_id = p_user_id;

  IF v_credits IS NULL THEN
    v_credits := 0;
  END IF;

  -- Verificar limites
  IF v_pending >= v_max_concurrent THEN
    v_can_enqueue := false;
    v_reason := 'Limite de jobs simultâneos atingido';
  ELSIF v_credits <= 0 THEN
    v_can_enqueue := false;
    v_reason := 'Créditos insuficientes';
  END IF;

  -- Prioridade baseada em créditos
  IF v_credits > 100 THEN
    v_priority := 3;
  ELSIF v_credits > 50 THEN
    v_priority := 2;
  END IF;

  RETURN QUERY SELECT 
    v_can_enqueue,
    v_pending,
    v_max_concurrent,
    v_credits,
    v_priority,
    v_reason;
END;
$$;

-- 6. FUNÇÃO RPC: debit_generation_credit
-- ============================================================================
CREATE OR REPLACE FUNCTION public.debit_generation_credit(
  p_user_id UUID, 
  p_amount INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_credits INTEGER;
BEGIN
  -- Verificar e debitar atomicamente
  UPDATE public.user_credits
  SET 
    credits_balance = credits_balance - p_amount,
    credits_used = credits_used + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id
    AND credits_balance >= p_amount
  RETURNING credits_balance INTO v_current_credits;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Registrar uso
  INSERT INTO public.credit_usage (user_id, credits_spent, operation_type, operation_details)
  VALUES (p_user_id, p_amount, 'image_generation', jsonb_build_object('debited_at', now()));

  RETURN TRUE;
END;
$$;

-- 7. FUNÇÃO RPC: complete_queue_job
-- ============================================================================
CREATE OR REPLACE FUNCTION public.complete_queue_job(
  p_job_id UUID,
  p_success BOOLEAN,
  p_result JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_model_used TEXT DEFAULT NULL,
  p_tokens_used INTEGER DEFAULT 0,
  p_cost_usd NUMERIC DEFAULT 0,
  p_cost_brl NUMERIC DEFAULT 0
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job RECORD;
  v_queue_wait INTEGER;
  v_processing_time INTEGER;
BEGIN
  -- Buscar job
  SELECT * INTO v_job
  FROM public.image_generation_queue
  WHERE id = p_job_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Calcular tempos
  v_queue_wait := EXTRACT(EPOCH FROM (v_job.started_at - v_job.created_at)) * 1000;
  v_processing_time := EXTRACT(EPOCH FROM (now() - v_job.started_at)) * 1000;

  -- Atualizar job
  UPDATE public.image_generation_queue
  SET 
    status = CASE WHEN p_success THEN 'completed' ELSE 'failed' END,
    result = p_result,
    error_message = p_error_message,
    completed_at = now(),
    queue_wait_time_ms = v_queue_wait,
    processing_time_ms = v_processing_time
  WHERE id = p_job_id;

  -- Registrar métrica
  INSERT INTO public.generation_metrics (
    job_id, user_id, generation_type, model_used,
    queue_wait_time_ms, processing_time_ms,
    tokens_used, estimated_cost_usd, estimated_cost_brl,
    success, error_message
  ) VALUES (
    p_job_id, v_job.user_id, v_job.generation_type, p_model_used,
    v_queue_wait, v_processing_time,
    p_tokens_used, p_cost_usd, p_cost_brl,
    p_success, p_error_message
  );

  RETURN TRUE;
END;
$$;