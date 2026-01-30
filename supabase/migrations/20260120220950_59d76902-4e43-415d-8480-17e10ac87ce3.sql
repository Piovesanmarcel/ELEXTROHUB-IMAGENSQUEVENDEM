-- ============================================================================
-- CORREÇÃO DE SEGURANÇA: debit_generation_credit
-- Remove p_user_id do parâmetro e usa auth.uid() para extrair do JWT
-- ============================================================================

-- Tabela de auditoria de uso de créditos (se não existir)
CREATE TABLE IF NOT EXISTS public.credit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  credits_spent INTEGER NOT NULL DEFAULT 1,
  operation_type TEXT NOT NULL DEFAULT 'image_generation',
  operation_details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para auditoria
CREATE INDEX IF NOT EXISTS idx_credit_usage_user ON public.credit_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_created ON public.credit_usage(created_at DESC);

-- RLS para tabela de auditoria
ALTER TABLE public.credit_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own credit usage" ON public.credit_usage;
CREATE POLICY "Users can view own credit usage"
  ON public.credit_usage FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all credit usage" ON public.credit_usage;
CREATE POLICY "Service role can manage all credit usage"
  ON public.credit_usage FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- NOVA FUNÇÃO SEGURA: debit_generation_credit (SEM p_user_id)
-- ============================================================================

-- Primeiro, dropar a função antiga com a assinatura antiga
DROP FUNCTION IF EXISTS public.debit_generation_credit(UUID);
DROP FUNCTION IF EXISTS public.debit_generation_credit(UUID, INTEGER);

-- Criar a nova função segura que extrai user_id do JWT
CREATE OR REPLACE FUNCTION public.debit_generation_credit(p_amount INTEGER DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_current_balance INTEGER;
BEGIN
  -- Extrair user_id diretamente do token JWT (fonte segura)
  v_user_id := auth.uid();
  
  -- Validar autenticação
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado - auth.uid() retornou NULL';
  END IF;

  -- Verificar saldo atual
  SELECT credits_balance INTO v_current_balance
  FROM public.user_credits
  WHERE user_id = v_user_id;

  -- Se não existe registro, criar com saldo inicial
  IF v_current_balance IS NULL THEN
    INSERT INTO public.user_credits (user_id, credits_balance, credits_used)
    VALUES (v_user_id, 10, 0);
    v_current_balance := 10;
  END IF;

  -- Verificar se tem saldo suficiente
  IF v_current_balance < p_amount THEN
    RETURN FALSE;
  END IF;

  -- Debitar atomicamente
  UPDATE public.user_credits
  SET 
    credits_balance = credits_balance - p_amount,
    credits_used = credits_used + p_amount,
    updated_at = now()
  WHERE user_id = v_user_id
    AND credits_balance >= p_amount;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Registrar uso para auditoria
  INSERT INTO public.credit_usage (user_id, credits_spent, operation_type, operation_details)
  VALUES (v_user_id, p_amount, 'image_generation', jsonb_build_object(
    'debited_at', now(),
    'source', 'authenticated_rpc',
    'amount', p_amount
  ));

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao debitar crédito: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Conceder permissão para authenticated users
GRANT EXECUTE ON FUNCTION public.debit_generation_credit(INTEGER) TO authenticated;

-- ============================================================================
-- FUNÇÃO AUXILIAR PARA SERVICE ROLE (Edge Functions)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.debit_generation_credit_admin(
  p_user_id UUID,
  p_amount INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_balance INTEGER;
BEGIN
  -- Esta função é APENAS para uso interno via service_role
  -- Não expor para authenticated users
  
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id não pode ser NULL';
  END IF;

  -- Verificar saldo atual
  SELECT credits_balance INTO v_current_balance
  FROM public.user_credits
  WHERE user_id = p_user_id;

  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
    RETURN FALSE;
  END IF;

  -- Debitar atomicamente
  UPDATE public.user_credits
  SET 
    credits_balance = credits_balance - p_amount,
    credits_used = credits_used + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id
    AND credits_balance >= p_amount;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Registrar uso para auditoria
  INSERT INTO public.credit_usage (user_id, credits_spent, operation_type, operation_details)
  VALUES (p_user_id, p_amount, 'image_generation', jsonb_build_object(
    'debited_at', now(),
    'source', 'service_role_admin',
    'amount', p_amount
  ));

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao debitar crédito (admin): %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- APENAS service_role pode executar a função admin
GRANT EXECUTE ON FUNCTION public.debit_generation_credit_admin(UUID, INTEGER) TO service_role;

-- Documentação
COMMENT ON FUNCTION public.debit_generation_credit IS 
'Debita créditos do usuário autenticado. Extrai user_id do JWT via auth.uid(). 
Uso: SELECT debit_generation_credit(1); -- debita 1 crédito';

COMMENT ON FUNCTION public.debit_generation_credit_admin IS 
'Debita créditos de um usuário específico. APENAS para uso via service_role em Edge Functions.
Uso: SELECT debit_generation_credit_admin(user_id, 1);';

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
SELECT 'Funções de crédito atualizadas com segurança!' AS status;