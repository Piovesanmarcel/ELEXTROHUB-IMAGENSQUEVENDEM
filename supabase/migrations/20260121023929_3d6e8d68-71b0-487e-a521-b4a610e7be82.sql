-- =============================================
-- SISTEMA HÍBRIDO DE DÉBITO DE CRÉDITOS
-- Pré-reserva → Confirmação/Estorno
-- =============================================

-- 1. Criar tabela de reservas de créditos
CREATE TABLE public.credit_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  credits_reserved INTEGER NOT NULL DEFAULT 1,
  operation_type TEXT NOT NULL DEFAULT 'image_generation',
  job_id UUID,
  scene_type TEXT,
  status TEXT NOT NULL DEFAULT 'reserved',
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '10 minutes'),
  confirmed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  
  CONSTRAINT valid_status CHECK (status IN ('reserved', 'confirmed', 'refunded', 'expired'))
);

-- 2. Índices para performance
CREATE INDEX idx_credit_reservations_user_id ON public.credit_reservations(user_id);
CREATE INDEX idx_credit_reservations_status ON public.credit_reservations(status);
CREATE INDEX idx_credit_reservations_expires_at ON public.credit_reservations(expires_at) WHERE status = 'reserved';
CREATE INDEX idx_credit_reservations_job_id ON public.credit_reservations(job_id) WHERE job_id IS NOT NULL;

-- 3. Habilitar RLS
ALTER TABLE public.credit_reservations ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS
CREATE POLICY "Users can view their own reservations"
  ON public.credit_reservations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all reservations"
  ON public.credit_reservations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =============================================
-- FUNÇÃO: Reservar crédito (autenticado via JWT)
-- =============================================
CREATE OR REPLACE FUNCTION public.reserve_generation_credit(
  p_amount INTEGER DEFAULT 1,
  p_operation_type TEXT DEFAULT 'image_generation',
  p_scene_type TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_user_id UUID;
  v_current_balance INTEGER;
  v_reservation_id UUID;
BEGIN
  -- Extrair user_id do JWT (fonte segura)
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Verificar saldo atual
  SELECT credits_balance INTO v_current_balance
  FROM public.user_credits
  WHERE user_id = v_user_id
  FOR UPDATE; -- Lock para evitar race condition

  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
    RETURN NULL; -- Saldo insuficiente
  END IF;

  -- Debitar do saldo (pré-reserva)
  UPDATE public.user_credits
  SET 
    credits_balance = credits_balance - p_amount,
    updated_at = now()
  WHERE user_id = v_user_id;

  -- Criar registro de reserva
  INSERT INTO public.credit_reservations (
    user_id,
    credits_reserved,
    operation_type,
    scene_type,
    status,
    metadata
  ) VALUES (
    v_user_id,
    p_amount,
    p_operation_type,
    p_scene_type,
    'reserved',
    p_metadata
  )
  RETURNING id INTO v_reservation_id;

  RETURN v_reservation_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao reservar crédito: %', SQLERRM;
    RETURN NULL;
END;
$$;

-- =============================================
-- FUNÇÃO: Confirmar reserva (autenticado via JWT)
-- =============================================
CREATE OR REPLACE FUNCTION public.confirm_credit_reservation(
  p_reservation_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_user_id UUID;
  v_reservation RECORD;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Buscar reserva (apenas do próprio usuário)
  SELECT * INTO v_reservation
  FROM public.credit_reservations
  WHERE id = p_reservation_id 
    AND user_id = v_user_id
    AND status = 'reserved'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Atualizar status para confirmado
  UPDATE public.credit_reservations
  SET 
    status = 'confirmed',
    confirmed_at = now()
  WHERE id = p_reservation_id;

  -- Registrar uso para auditoria
  UPDATE public.user_credits
  SET credits_used = credits_used + v_reservation.credits_reserved
  WHERE user_id = v_user_id;

  -- Log de auditoria
  INSERT INTO public.credit_usage (user_id, credits_spent, operation_type, operation_details)
  VALUES (
    v_user_id, 
    v_reservation.credits_reserved, 
    v_reservation.operation_type,
    jsonb_build_object(
      'reservation_id', p_reservation_id,
      'scene_type', v_reservation.scene_type,
      'confirmed_at', now(),
      'source', 'reservation_confirmed'
    )
  );

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao confirmar reserva: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- =============================================
-- FUNÇÃO: Estornar reserva (autenticado via JWT)
-- =============================================
CREATE OR REPLACE FUNCTION public.refund_credit_reservation(
  p_reservation_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_user_id UUID;
  v_reservation RECORD;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Buscar reserva (apenas do próprio usuário e status 'reserved')
  SELECT * INTO v_reservation
  FROM public.credit_reservations
  WHERE id = p_reservation_id 
    AND user_id = v_user_id
    AND status = 'reserved'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Devolver créditos ao saldo
  UPDATE public.user_credits
  SET 
    credits_balance = credits_balance + v_reservation.credits_reserved,
    updated_at = now()
  WHERE user_id = v_user_id;

  -- Atualizar status para estornado
  UPDATE public.credit_reservations
  SET 
    status = 'refunded',
    refunded_at = now()
  WHERE id = p_reservation_id;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao estornar reserva: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- =============================================
-- FUNÇÃO ADMIN: Reservar crédito (service_role)
-- =============================================
CREATE OR REPLACE FUNCTION public.reserve_credit_admin(
  p_user_id UUID,
  p_amount INTEGER DEFAULT 1,
  p_job_id UUID DEFAULT NULL,
  p_operation_type TEXT DEFAULT 'image_generation',
  p_scene_type TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_current_balance INTEGER;
  v_reservation_id UUID;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id não pode ser NULL';
  END IF;

  -- Verificar saldo atual
  SELECT credits_balance INTO v_current_balance
  FROM public.user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
    RETURN NULL;
  END IF;

  -- Debitar do saldo
  UPDATE public.user_credits
  SET 
    credits_balance = credits_balance - p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Criar reserva
  INSERT INTO public.credit_reservations (
    user_id,
    credits_reserved,
    operation_type,
    job_id,
    scene_type,
    status
  ) VALUES (
    p_user_id,
    p_amount,
    p_operation_type,
    p_job_id,
    p_scene_type,
    'reserved'
  )
  RETURNING id INTO v_reservation_id;

  RETURN v_reservation_id;
END;
$$;

-- =============================================
-- FUNÇÃO ADMIN: Confirmar reserva (service_role)
-- =============================================
CREATE OR REPLACE FUNCTION public.confirm_credit_admin(
  p_reservation_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_reservation RECORD;
BEGIN
  SELECT * INTO v_reservation
  FROM public.credit_reservations
  WHERE id = p_reservation_id AND status = 'reserved'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  UPDATE public.credit_reservations
  SET status = 'confirmed', confirmed_at = now()
  WHERE id = p_reservation_id;

  UPDATE public.user_credits
  SET credits_used = credits_used + v_reservation.credits_reserved
  WHERE user_id = v_reservation.user_id;

  INSERT INTO public.credit_usage (user_id, credits_spent, operation_type, operation_details)
  VALUES (
    v_reservation.user_id, 
    v_reservation.credits_reserved,
    v_reservation.operation_type,
    jsonb_build_object(
      'reservation_id', p_reservation_id,
      'job_id', v_reservation.job_id,
      'scene_type', v_reservation.scene_type,
      'source', 'admin_confirmed'
    )
  );

  RETURN TRUE;
END;
$$;

-- =============================================
-- FUNÇÃO ADMIN: Estornar reserva (service_role)
-- =============================================
CREATE OR REPLACE FUNCTION public.refund_credit_admin(
  p_reservation_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_reservation RECORD;
BEGIN
  SELECT * INTO v_reservation
  FROM public.credit_reservations
  WHERE id = p_reservation_id AND status = 'reserved'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  UPDATE public.user_credits
  SET credits_balance = credits_balance + v_reservation.credits_reserved
  WHERE user_id = v_reservation.user_id;

  UPDATE public.credit_reservations
  SET status = 'refunded', refunded_at = now()
  WHERE id = p_reservation_id;

  RETURN TRUE;
END;
$$;

-- =============================================
-- FUNÇÃO: Limpar reservas expiradas (cron)
-- =============================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_count INTEGER := 0;
  v_reservation RECORD;
BEGIN
  FOR v_reservation IN
    SELECT id, user_id, credits_reserved
    FROM public.credit_reservations
    WHERE status = 'reserved' AND expires_at < now()
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Devolver créditos
    UPDATE public.user_credits
    SET credits_balance = credits_balance + v_reservation.credits_reserved
    WHERE user_id = v_reservation.user_id;
    
    -- Marcar como expirado
    UPDATE public.credit_reservations
    SET status = 'expired', refunded_at = now()
    WHERE id = v_reservation.id;
    
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;