-- ============================================================================
-- SISTEMA DE RESERVA + CONFIRMAÇÃO DE CRÉDITOS
-- Padrão SaaS robusto para débito de créditos em processos assíncronos
-- ============================================================================

-- 1. TABELA: credit_reservations
-- Armazena reservas temporárias de créditos
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.credit_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_id UUID REFERENCES public.image_generation_queue(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'reserved',  -- 'reserved', 'confirmed', 'cancelled', 'expired'
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 minutes'),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_reservations_user ON public.credit_reservations (user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_job ON public.credit_reservations (job_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.credit_reservations (status) WHERE status = 'reserved';
CREATE INDEX IF NOT EXISTS idx_reservations_expires ON public.credit_reservations (expires_at) WHERE status = 'reserved';

-- RLS
ALTER TABLE public.credit_reservations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view their own reservations" ON public.credit_reservations;
DROP POLICY IF EXISTS "Service role can manage all reservations" ON public.credit_reservations;

CREATE POLICY "Users can view their own reservations"
ON public.credit_reservations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all reservations"
ON public.credit_reservations FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- ============================================================================
-- 2. FUNÇÃO: reserve_credit
-- Reserva créditos para um job (não debita ainda, apenas "segura")
-- ============================================================================
CREATE OR REPLACE FUNCTION public.reserve_credit(
  p_user_id UUID,
  p_job_id UUID DEFAULT NULL,
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
  FOR UPDATE; -- Lock para evitar race conditions

  IF v_current_credits IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Usuário não possui conta de créditos'::TEXT;
    RETURN;
  END IF;

  -- Calcular créditos já reservados (não confirmados ainda)
  SELECT COALESCE(SUM(amount), 0) INTO v_reserved_credits
  FROM public.credit_reservations
  WHERE user_id = p_user_id
    AND status = 'reserved'
    AND expires_at > now();

  -- Calcular créditos disponíveis (saldo - reservas pendentes)
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
      -- Já existe reserva válida, retornar ela
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

-- ============================================================================
-- 3. FUNÇÃO: confirm_credit_debit
-- Confirma a reserva e efetivamente debita os créditos
-- ============================================================================
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
  -- Buscar reserva com lock
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
    -- Marcar como expirada
    UPDATE public.credit_reservations
    SET status = 'expired', cancelled_at = now()
    WHERE id = p_reservation_id;
    
    RETURN QUERY SELECT FALSE, 'Reserva expirada'::TEXT;
    RETURN;
  END IF;

  -- Debitar créditos usando a função existente
  SELECT public.debit_generation_credit(v_reservation.user_id, v_reservation.amount) INTO v_debited;

  IF NOT v_debited THEN
    -- Marcar reserva como cancelada por saldo insuficiente
    UPDATE public.credit_reservations
    SET status = 'cancelled', cancelled_at = now(), metadata = metadata || '{"reason": "insufficient_balance"}'::jsonb
    WHERE id = p_reservation_id;
    
    RETURN QUERY SELECT FALSE, 'Falha ao debitar créditos - saldo insuficiente'::TEXT;
    RETURN;
  END IF;

  -- Confirmar reserva
  UPDATE public.credit_reservations
  SET status = 'confirmed', confirmed_at = now()
  WHERE id = p_reservation_id;

  -- Marcar job como debitado (se houver job_id)
  IF v_reservation.job_id IS NOT NULL THEN
    UPDATE public.image_generation_queue
    SET credits_debited = TRUE
    WHERE id = v_reservation.job_id;
  END IF;

  RETURN QUERY SELECT TRUE, 'Créditos debitados com sucesso'::TEXT;
END;
$$;

-- ============================================================================
-- 4. FUNÇÃO: cancel_credit_reservation
-- Cancela uma reserva e libera os créditos
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cancel_credit_reservation(
  p_reservation_id UUID,
  p_reason TEXT DEFAULT 'cancelled_by_user'
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
BEGIN
  -- Buscar reserva
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

  -- Cancelar reserva
  UPDATE public.credit_reservations
  SET 
    status = 'cancelled', 
    cancelled_at = now(),
    metadata = metadata || jsonb_build_object('reason', p_reason)
  WHERE id = p_reservation_id;

  RETURN QUERY SELECT TRUE, 'Reserva cancelada com sucesso'::TEXT;
END;
$$;

-- ============================================================================
-- 5. FUNÇÃO: cleanup_expired_reservations
-- Limpa reservas expiradas (rodar via CRON)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.credit_reservations
  SET status = 'expired', cancelled_at = now()
  WHERE status = 'reserved'
    AND expires_at < now();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================================================
-- 6. FUNÇÃO: get_user_available_credits
-- Retorna créditos disponíveis (saldo - reservas pendentes)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_available_credits(p_user_id UUID)
RETURNS TABLE (
  total_balance INTEGER,
  reserved INTEGER,
  available INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance INTEGER;
  v_reserved INTEGER;
BEGIN
  -- Buscar saldo total
  SELECT COALESCE(credits_balance, 0) INTO v_balance
  FROM public.user_credits
  WHERE user_id = p_user_id;

  -- Buscar reservas ativas
  SELECT COALESCE(SUM(amount), 0) INTO v_reserved
  FROM public.credit_reservations
  WHERE user_id = p_user_id
    AND status = 'reserved'
    AND expires_at > now();

  RETURN QUERY SELECT v_balance, v_reserved, (v_balance - v_reserved);
END;
$$;

-- ============================================================================
-- 7. FUNÇÃO HELPER: reserve_and_get_id (Para uso simplificado no n8n)
-- Retorna apenas o reservation_id ou NULL se falhar
-- ============================================================================
CREATE OR REPLACE FUNCTION public.reserve_and_get_id(
  p_user_id UUID,
  p_job_id UUID DEFAULT NULL,
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

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.reserve_credit TO authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_credit TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_credit_debit TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_credit_debit TO service_role;
GRANT EXECUTE ON FUNCTION public.cancel_credit_reservation TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_credit_reservation TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_reservations TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_available_credits TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_available_credits TO service_role;
GRANT EXECUTE ON FUNCTION public.reserve_and_get_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_and_get_id TO service_role;
