-- ============================================================================
-- CORREÇÃO: confirm_credit_debit deve usar debit_generation_credit_admin
-- Execute este script no Supabase SQL Editor
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

  -- ✅ CORRIGIDO: Usar debit_generation_credit_admin (com user_id e amount)
  SELECT public.debit_generation_credit_admin(
    v_reservation.user_id, 
    v_reservation.credits_reserved
  ) INTO v_debited;

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
GRANT EXECUTE ON FUNCTION public.confirm_credit_debit TO authenticated, service_role;
