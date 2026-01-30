-- ============================================================================
-- CORREÇÃO: Adaptar funções para usar 'credits_reserved' em vez de 'amount'
-- Execute este script no Supabase SQL Editor
-- ============================================================================

-- Dropar funções antigas
DROP FUNCTION IF EXISTS public.reserve_credit(UUID, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.reserve_and_get_id(UUID, TEXT, INTEGER);

-- Recriar reserve_credit usando credits_reserved
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

  -- Calcular créditos já reservados (usando credits_reserved)
  SELECT COALESCE(SUM(credits_reserved), 0) INTO v_reserved_credits
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

  -- Criar reserva (usando credits_reserved)
  INSERT INTO public.credit_reservations (
    user_id, 
    job_id, 
    credits_reserved, 
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

-- Recriar reserve_and_get_id
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

-- Atualizar confirm_credit_debit para usar credits_reserved
CREATE OR REPLACE FUNCTION public.confirm_credit_debit(
  p_reservation_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reservation RECORD;
  v_debited BOOLEAN;
BEGIN
  SELECT * INTO v_reservation
  FROM public.credit_reservations
  WHERE id = p_reservation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Reserva não encontrada'::TEXT;
    RETURN;
  END IF;

  IF v_reservation.status != 'reserved' THEN
    RETURN QUERY SELECT FALSE, format('Reserva já processada. Status: %s', v_reservation.status)::TEXT;
    RETURN;
  END IF;

  IF v_reservation.expires_at < now() THEN
    UPDATE public.credit_reservations
    SET status = 'expired'
    WHERE id = p_reservation_id;
    
    RETURN QUERY SELECT FALSE, 'Reserva expirada'::TEXT;
    RETURN;
  END IF;

  -- Debitar créditos usando credits_reserved
  SELECT public.debit_generation_credit(v_reservation.user_id, v_reservation.credits_reserved) INTO v_debited;

  IF NOT v_debited THEN
    UPDATE public.credit_reservations
    SET status = 'cancelled'
    WHERE id = p_reservation_id;
    
    RETURN QUERY SELECT FALSE, 'Falha ao debitar créditos'::TEXT;
    RETURN;
  END IF;

  UPDATE public.credit_reservations
  SET status = 'confirmed'
  WHERE id = p_reservation_id;

  RETURN QUERY SELECT TRUE, 'Créditos debitados com sucesso'::TEXT;
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION public.reserve_credit TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reserve_and_get_id TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.confirm_credit_debit TO authenticated, service_role;
