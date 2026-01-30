-- ============================================================================
-- RLS POLICIES PARA TABELAS CRÍTICAS SAAS
-- Garantir isolamento de dados entre usuários
-- ============================================================================

-- ============================================================================
-- TABELA: user_credits
-- ============================================================================

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas seus próprios créditos
DROP POLICY IF EXISTS "Users can view own credits" ON public.user_credits;
CREATE POLICY "Users can view own credits"
  ON public.user_credits FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem atualizar apenas seus próprios créditos (via RPC é mais seguro)
DROP POLICY IF EXISTS "Users can update own credits" ON public.user_credits;
CREATE POLICY "Users can update own credits"
  ON public.user_credits FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role pode gerenciar tudo
DROP POLICY IF EXISTS "Service role manages all credits" ON public.user_credits;
CREATE POLICY "Service role manages all credits"
  ON public.user_credits FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- TABELA: credit_purchases
-- ============================================================================

ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas suas próprias compras
DROP POLICY IF EXISTS "Users can view own purchases" ON public.credit_purchases;
CREATE POLICY "Users can view own purchases"
  ON public.credit_purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Apenas service role pode inserir (evita fraude)
DROP POLICY IF EXISTS "Service role manages purchases" ON public.credit_purchases;
CREATE POLICY "Service role manages purchases"
  ON public.credit_purchases FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- TABELA: credit_usage
-- ============================================================================

ALTER TABLE public.credit_usage ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas seu próprio uso
DROP POLICY IF EXISTS "Users can view own usage" ON public.credit_usage;
CREATE POLICY "Users can view own usage"
  ON public.credit_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Apenas service role pode inserir
DROP POLICY IF EXISTS "Service role manages usage" ON public.credit_usage;
CREATE POLICY "Service role manages usage"
  ON public.credit_usage FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- TABELA: image_generation_queue
-- ============================================================================

ALTER TABLE public.image_generation_queue ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas seus próprios jobs
DROP POLICY IF EXISTS "Users can view own queue jobs" ON public.image_generation_queue;
CREATE POLICY "Users can view own queue jobs"
  ON public.image_generation_queue FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem inserir jobs (com user_id deles)
DROP POLICY IF EXISTS "Users can insert own queue jobs" ON public.image_generation_queue;
CREATE POLICY "Users can insert own queue jobs"
  ON public.image_generation_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem cancelar apenas seus próprios jobs (update status)
DROP POLICY IF EXISTS "Users can cancel own queue jobs" ON public.image_generation_queue;
CREATE POLICY "Users can cancel own queue jobs"
  ON public.image_generation_queue FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role pode gerenciar tudo
DROP POLICY IF EXISTS "Service role manages queue" ON public.image_generation_queue;
CREATE POLICY "Service role manages queue"
  ON public.image_generation_queue FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- TABELA: products (se existir)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
    EXECUTE 'ALTER TABLE public.products ENABLE ROW LEVEL SECURITY';
    
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own products" ON public.products';
    EXECUTE 'CREATE POLICY "Users can view own products"
      ON public.products FOR SELECT
      USING (auth.uid() = user_id)';
    
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage own products" ON public.products';
    EXECUTE 'CREATE POLICY "Users can manage own products"
      ON public.products FOR ALL
      USING (auth.uid() = user_id)';
      
    EXECUTE 'DROP POLICY IF EXISTS "Service role manages products" ON public.products';
    EXECUTE 'CREATE POLICY "Service role manages products"
      ON public.products FOR ALL
      USING (auth.role() = ''service_role'')';
      
    RAISE NOTICE 'RLS aplicado em products';
  END IF;
END $$;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

SELECT 'RLS policies criadas com sucesso!' AS status;

-- Listar tabelas sem RLS (para auditoria)
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false
ORDER BY tablename;
