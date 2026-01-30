-- ============================================================================
-- FUNÇÃO RPC: get_failed_jobs (COM FILTRO CORRIGIDO)
-- Tipos válidos: 'carousel', 'marketing', 'background', 'stability', 'tongyi'
-- ============================================================================

-- Remover versões antigas
DROP FUNCTION IF EXISTS public.get_failed_jobs(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.get_failed_jobs(INTEGER, INTEGER, TEXT[]);

CREATE OR REPLACE FUNCTION public.get_failed_jobs(
  max_retry_count INTEGER DEFAULT 3,
  limit_count INTEGER DEFAULT 10,
  allowed_types TEXT[] DEFAULT ARRAY['background', 'stability', 'tongyi']
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  generation_type TEXT,
  status TEXT,
  retry_count INTEGER,
  error_message TEXT,
  job_data JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.user_id,
    q.generation_type,
    q.status,
    COALESCE(q.retry_count, 0) AS retry_count,
    q.error_message,
    q.input_data AS job_data,
    q.created_at
  FROM public.image_generation_queue q
  WHERE q.status = 'failed'
    AND COALESCE(q.retry_count, 0) < max_retry_count
    AND q.created_at > now() - INTERVAL '24 hours'
    AND (
      array_length(allowed_types, 1) IS NULL 
      OR q.generation_type = ANY(allowed_types)
    )
  ORDER BY q.priority DESC, q.created_at ASC
  LIMIT limit_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_failed_jobs(INTEGER, INTEGER, TEXT[]) TO service_role;

-- Testar a função
SELECT * FROM public.get_failed_jobs(3, 10, ARRAY['background', 'stability', 'tongyi']);
