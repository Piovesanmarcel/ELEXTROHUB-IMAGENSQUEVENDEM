-- ============================================================
-- FASE 2-4: Recriar e criar funções de queue robusta
-- ============================================================

-- ============================================================
-- 2.1 RECRIAR acquire_queue_jobs com FOR UPDATE SKIP LOCKED
-- ============================================================
CREATE OR REPLACE FUNCTION public.acquire_queue_jobs(p_batch_size INTEGER DEFAULT 10)
RETURNS SETOF public.image_generation_queue
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
BEGIN
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

GRANT EXECUTE ON FUNCTION public.acquire_queue_jobs(INTEGER) TO service_role;

-- ============================================================
-- 3.1 CRIAR reset_stuck_jobs - Reseta jobs travados
-- ============================================================
CREATE OR REPLACE FUNCTION public.reset_stuck_jobs(
  p_stuck_threshold_minutes INTEGER DEFAULT 10,
  p_max_retries INTEGER DEFAULT 3
)
RETURNS TABLE(reset_count INTEGER, failed_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_reset INTEGER := 0;
  v_failed INTEGER := 0;
BEGIN
  -- Jobs travados que podem ser reenfileirados
  WITH reset_jobs AS (
    UPDATE public.image_generation_queue
    SET status = 'pending',
        locked_at = NULL,
        locked_by = NULL,
        retry_count = COALESCE(retry_count, 0) + 1,
        error_message = 'Reset automatico - job travado por mais de ' || p_stuck_threshold_minutes || ' minutos'
    WHERE status = 'processing'
      AND started_at < now() - (p_stuck_threshold_minutes || ' minutes')::interval
      AND COALESCE(retry_count, 0) < p_max_retries
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER INTO v_reset FROM reset_jobs;

  -- Jobs que excederam retries - marcar como failed
  WITH failed_jobs AS (
    UPDATE public.image_generation_queue
    SET status = 'failed',
        locked_at = NULL,
        locked_by = NULL,
        error_message = 'Excedeu limite de ' || p_max_retries || ' retries',
        completed_at = now()
    WHERE status = 'processing'
      AND started_at < now() - (p_stuck_threshold_minutes || ' minutes')::interval
      AND COALESCE(retry_count, 0) >= p_max_retries
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER INTO v_failed FROM failed_jobs;

  RETURN QUERY SELECT v_reset, v_failed;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_stuck_jobs(INTEGER, INTEGER) TO service_role;

-- ============================================================
-- 4.1 CRIAR cleanup_completed_jobs - Limpa jobs antigos
-- ============================================================
CREATE OR REPLACE FUNCTION public.cleanup_completed_jobs(
  p_retention_hours INTEGER DEFAULT 24
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM public.image_generation_queue
    WHERE status IN ('completed', 'failed')
      AND completed_at < now() - (p_retention_hours || ' hours')::interval
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER INTO v_deleted FROM deleted;
  
  RETURN v_deleted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_completed_jobs(INTEGER) TO service_role;