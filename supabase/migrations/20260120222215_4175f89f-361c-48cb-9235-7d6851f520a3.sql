-- =====================================================
-- RATE LIMIT POR CRÉDITO: Cooldown de 5 segundos entre jobs
-- =====================================================

-- 1. Remover função antiga (necessário porque mudamos o retorno)
DROP FUNCTION IF EXISTS public.check_user_queue_limits(UUID);

-- 2. Criar nova função com rate limiting por tempo
CREATE OR REPLACE FUNCTION public.check_user_queue_limits(p_user_id UUID)
RETURNS TABLE(
  can_enqueue BOOLEAN,
  reason TEXT,
  pending_jobs INTEGER,
  max_concurrent INTEGER,
  credits_remaining INTEGER,
  queue_priority INTEGER,
  cooldown_remaining_seconds INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_pending_count INTEGER;
  v_max_concurrent INTEGER := 2;
  v_credits INTEGER := 9999;
  v_priority INTEGER := 0;
  v_last_job_at TIMESTAMPTZ;
  v_cooldown_seconds INTEGER := 5;
  v_seconds_since_last INTEGER;
  v_cooldown_remaining INTEGER := 0;
BEGIN
  -- 1. Verificar cooldown (tempo desde último job criado)
  SELECT created_at INTO v_last_job_at
  FROM public.image_generation_queue
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_last_job_at IS NOT NULL THEN
    v_seconds_since_last := EXTRACT(EPOCH FROM (now() - v_last_job_at))::INTEGER;
    v_cooldown_remaining := GREATEST(0, v_cooldown_seconds - v_seconds_since_last);
    
    IF v_cooldown_remaining > 0 THEN
      RETURN QUERY SELECT 
        FALSE,
        format('Aguarde %s segundos antes de iniciar outra geração', v_cooldown_remaining),
        0,
        v_max_concurrent,
        v_credits,
        v_priority,
        v_cooldown_remaining;
      RETURN;
    END IF;
  END IF;
  
  -- 2. Contar jobs ativos (excluindo jobs travados há mais de 5 minutos)
  SELECT COUNT(*) INTO v_pending_count
  FROM public.image_generation_queue
  WHERE user_id = p_user_id 
    AND status IN ('pending', 'processing')
    AND NOT (
      status = 'processing' 
      AND locked_at IS NOT NULL 
      AND locked_at < now() - INTERVAL '5 minutes'
    );
  
  -- 3. Verificar limite de jobs simultâneos
  IF v_pending_count >= v_max_concurrent THEN
    RETURN QUERY SELECT 
      FALSE,
      format('Você já tem %s geração(ões) em andamento. Aguarde a conclusão.', v_pending_count),
      v_pending_count,
      v_max_concurrent,
      v_credits,
      v_priority,
      0;
    RETURN;
  END IF;
  
  -- 4. OK para enfileirar
  RETURN QUERY SELECT 
    TRUE,
    'OK'::TEXT,
    v_pending_count,
    v_max_concurrent,
    v_credits,
    v_priority,
    0;
END;
$$;

-- 3. Garantir permissões
GRANT EXECUTE ON FUNCTION public.check_user_queue_limits(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_queue_limits(UUID) TO service_role;