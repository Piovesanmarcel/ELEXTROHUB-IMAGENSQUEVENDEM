-- ============================================================================
-- CORREÇÃO: Alterar job_id de UUID para TEXT
-- Execute este script no Supabase SQL Editor
-- ============================================================================

-- 0. DROPAR FUNÇÕES ANTIGAS (com assinatura UUID)
DROP FUNCTION IF EXISTS public.reserve_credit(UUID, UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.reserve_and_get_id(UUID, UUID, INTEGER);

-- 1. Alterar a coluna job_id na tabela para TEXT
ALTER TABLE public.credit_reservations 
DROP CONSTRAINT IF EXISTS credit_reservations_job_id_fkey;

ALTER TABLE public.credit_reservations 
ALTER COLUMN job_id TYPE TEXT USING job_id::TEXT;

-- 2. Dropar e recriar o índice
DROP INDEX IF EXISTS idx_reservations_job;
CREATE INDEX idx_reservations_job ON public.credit_reservations (job_id);

-- 3. Recriar função reserve_credit com TEXT
CREATE OR REPLACE FUNCTION public.reserve_credit(
  p_user_id UUID,
  p_job_id TEXT DEFAULT NULL,
  p_amount INTEGER DEFAULT 1,
  p_expires_in_minutes INTEGER DEFAULT 30
)
RETURNS TABLE (
  success BOOLEAN,
  reservation_id UUID,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_credits INTEGER;
  v_reserved_credits INTEGER;
  v_available_credits INTEGER;
  v_reservation_id UUID;
BEGIN
  -- Buscar créditos atuais
  SELECT credits_balance INTO v_current_credits
  FROM public.user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_credits IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Usuário não possui conta de créditos'::TEXT;
    RETURN;
  END IF;

  -- Calcular créditos já reservados
  SELECT COALESCE(SUM(amount), 0) INTO v_reserved_credits
  FROM public.credit_reservations
  WHERE user_id = p_user_id
    AND status = 'reserved'
    AND expires_at > now();

  v_available_credits := v_current_credits - v_reserved_credits;

  IF v_available_credits < p_amount THEN
    RETURN QUERY SELECT 
      FALSE, 
      NULL::UUID, 
      format('Créditos insuficientes. Disponível: %s, Necessário: %s', v_available_credits, p_amount)::TEXT;
    RETURN;
  END IF;

  -- Verificar se já existe reserva para este job
  IF p_job_id IS NOT NULL THEN
    SELECT id INTO v_reservation_id
    FROM public.credit_reservations
    WHERE job_id = p_job_id
      AND status = 'reserved'
      AND expires_at > now();
    
    IF v_reservation_id IS NOT NULL THEN
      RETURN QUERY SELECT TRUE, v_reservation_id, 'Reserva já existente para este job'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Criar reserva
  INSERT INTO public.credit_reservations (
    user_id, 
    job_id, 
    amount, 
    status,
    expires_at
  )
  VALUES (
    p_user_id, 
    p_job_id, 
    p_amount, 
    'reserved',
    now() + (p_expires_in_minutes || ' minutes')::INTERVAL
  )
  RETURNING id INTO v_reservation_id;

  RETURN QUERY SELECT TRUE, v_reservation_id, 'Créditos reservados com sucesso'::TEXT;
END;
$$;

-- 4. Recriar função reserve_and_get_id com TEXT
CREATE OR REPLACE FUNCTION public.reserve_and_get_id(
  p_user_id UUID,
  p_job_id TEXT DEFAULT NULL,
  p_amount INTEGER DEFAULT 1
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result RECORD;
BEGIN
  SELECT * INTO v_result
  FROM public.reserve_credit(p_user_id, p_job_id, p_amount, 30);
  
  IF v_result.success THEN
    RETURN v_result.reservation_id;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- 5. Permissões
GRANT EXECUTE ON FUNCTION public.reserve_credit TO authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_credit TO service_role;
GRANT EXECUTE ON FUNCTION public.reserve_and_get_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_and_get_id TO service_role;
