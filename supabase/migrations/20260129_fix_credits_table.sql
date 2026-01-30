-- Migração para corrigir as funções de créditos
-- Apontando para a tabela correta: public.user_credits
-- Colunas: user_id, credits_balance, credits_used

-- 1. Redefinir debit_credits
CREATE OR REPLACE FUNCTION debit_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT DEFAULT 'Débito de créditos'
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_credits INTEGER;
BEGIN
  -- Verificar créditos atuais na tabela CORRETA
  SELECT credits_balance INTO v_current_credits
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_credits IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado em user_credits';
  END IF;

  IF v_current_credits < p_amount THEN
    RAISE EXCEPTION 'Créditos insuficientes: % < %', v_current_credits, p_amount;
  END IF;

  -- Debitar créditos
  UPDATE user_credits
  SET
    credits_balance = credits_balance - p_amount,
    credits_used = credits_used + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Registrar transação (se a tabela existir, senão ignora ou cria logs básicos)
  INSERT INTO credit_transactions (user_id, amount, type, reason, created_at)
  VALUES (p_user_id, -p_amount, 'debit', p_reason, NOW())
  ON CONFLICT DO NOTHING;

  RETURN TRUE;
EXCEPTION
  WHEN undefined_table THEN
     -- Fallback se credit_transactions não existir
     RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 2. Redefinir refund_credits
CREATE OR REPLACE FUNCTION refund_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT DEFAULT 'Estorno de créditos'
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Estornar créditos
  UPDATE user_credits
  SET
    credits_balance = credits_balance + p_amount,
    credits_used = GREATEST(0, credits_used - p_amount),
    updated_at = NOW()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado em user_credits';
  END IF;

  -- Registrar transação
  INSERT INTO credit_transactions (user_id, amount, type, reason, created_at)
  VALUES (p_user_id, p_amount, 'refund', p_reason, NOW())
  ON CONFLICT DO NOTHING;

  RETURN TRUE;
EXCEPTION
  WHEN undefined_table THEN
     -- Fallback
     RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Permissões
GRANT EXECUTE ON FUNCTION debit_credits(UUID, INTEGER, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION refund_credits(UUID, INTEGER, TEXT) TO service_role;
