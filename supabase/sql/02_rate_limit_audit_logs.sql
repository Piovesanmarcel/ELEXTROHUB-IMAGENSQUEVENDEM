-- ============================================================================
-- RATE LIMIT LOG TABLE
-- Para rastrear requisições e implementar rate limiting server-side
-- ============================================================================

-- Criar tabela de rate limit log
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  limit_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para queries eficientes
CREATE INDEX IF NOT EXISTS idx_rate_limit_user_key 
  ON public.rate_limit_log(user_id, limit_key, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rate_limit_cleanup 
  ON public.rate_limit_log(created_at);

-- Habilitar RLS
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

-- Apenas service role pode gerenciar (usuários não devem ver/modificar)
DROP POLICY IF EXISTS "Service role manages rate limits" ON public.rate_limit_log;
CREATE POLICY "Service role manages rate limits"
  ON public.rate_limit_log FOR ALL
  USING (auth.role() = 'service_role');

-- Comentário
COMMENT ON TABLE public.rate_limit_log IS 
'Tabela para rastrear requisições e implementar rate limiting server-side.
Deve ser limpa periodicamente via cleanup job.';

-- ============================================================================
-- AUDIT LOGS TABLE
-- Para logging de eventos sensíveis
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  event_type TEXT NOT NULL,
  event_details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_audit_user ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event ON public.audit_logs(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_cleanup ON public.audit_logs(created_at);

-- Habilitar RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas seus próprios logs
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own audit logs"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Service role pode gerenciar tudo
DROP POLICY IF EXISTS "Service role manages audit logs" ON public.audit_logs;
CREATE POLICY "Service role manages audit logs"
  ON public.audit_logs FOR ALL
  USING (auth.role() = 'service_role');

-- Comentário
COMMENT ON TABLE public.audit_logs IS 
'Tabela para logging de eventos sensíveis como login, compras, alterações de perfil.';

-- ============================================================================
-- FUNÇÃO DE CLEANUP AUTOMÁTICO
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_logs(p_retention_hours INTEGER DEFAULT 24)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.rate_limit_log
  WHERE created_at < now() - (p_retention_hours || ' hours')::INTERVAL;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_rate_limit_logs(INTEGER) TO service_role;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
SELECT 'rate_limit_log e audit_logs criadas com sucesso!' AS status;
