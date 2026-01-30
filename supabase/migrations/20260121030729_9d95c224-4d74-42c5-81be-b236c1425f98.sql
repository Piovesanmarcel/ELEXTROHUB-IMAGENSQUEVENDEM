-- ============================================================================
-- FUNÇÃO: reset_stuck_jobs
-- Reseta jobs travados na fila de processamento
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reset_stuck_jobs(
  p_timeout_minutes INTEGER DEFAULT 30,
  p_max_retries INTEGER DEFAULT 3
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_reset_count INTEGER;
BEGIN
  -- Resetar jobs processing travados
  UPDATE public.image_generation_queue
  SET 
    status = 'pending',
    locked_at = NULL,
    error_message = 'Auto-reset: job travado por timeout',
    retry_count = COALESCE(retry_count, 0) + 1
  WHERE 
    status = 'processing'
    AND locked_at < NOW() - (p_timeout_minutes || ' minutes')::interval
    AND COALESCE(retry_count, 0) < p_max_retries;
    
  GET DIAGNOSTICS v_reset_count = ROW_COUNT;
  
  -- Marcar como failed os que excederam retries
  UPDATE public.image_generation_queue
  SET 
    status = 'failed',
    error_message = 'Excedeu máximo de tentativas após timeout',
    completed_at = NOW()
  WHERE 
    status = 'processing'
    AND locked_at < NOW() - (p_timeout_minutes || ' minutes')::interval
    AND COALESCE(retry_count, 0) >= p_max_retries;
  
  RETURN v_reset_count;
END;
$$;

-- Permissão para service_role executar
GRANT EXECUTE ON FUNCTION public.reset_stuck_jobs(INTEGER, INTEGER) TO service_role;