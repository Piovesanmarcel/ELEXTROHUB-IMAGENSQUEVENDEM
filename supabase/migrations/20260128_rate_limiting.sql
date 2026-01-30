-- ============================================
-- RATE LIMITING TABLE
-- ============================================
-- Tabela para armazenar logs de rate limiting
-- Usada pelas Edge Functions para controlar número de requisições

CREATE TABLE IF NOT EXISTS public.rate_limit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    limit_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Índices para performance
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Índices para queries rápidas
CREATE INDEX IF NOT EXISTS idx_rate_limit_user_key_time
    ON public.rate_limit_log(user_id, limit_key, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rate_limit_created_at
    ON public.rate_limit_log(created_at);

-- RLS (Row Level Security)
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

-- Política: Usuários não podem ler seus próprios logs (apenas Edge Functions)
CREATE POLICY "Service role can manage rate limits"
    ON public.rate_limit_log
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Comentários
COMMENT ON TABLE public.rate_limit_log IS 'Logs de rate limiting para Edge Functions';
COMMENT ON COLUMN public.rate_limit_log.user_id IS 'ID do usuário que fez a requisição';
COMMENT ON COLUMN public.rate_limit_log.limit_key IS 'Tipo de limite (auth, gemini, openai, etc)';
COMMENT ON COLUMN public.rate_limit_log.created_at IS 'Timestamp da requisição';

-- ============================================
-- FUNÇÃO DE LIMPEZA AUTOMÁTICA (OPCIONAL)
-- ============================================
-- Remove logs com mais de 24 horas automaticamente

CREATE OR REPLACE FUNCTION cleanup_old_rate_limit_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.rate_limit_log
    WHERE created_at < NOW() - INTERVAL '24 hours';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_rate_limit_logs IS 'Remove logs de rate limit com mais de 24 horas';

-- ============================================
-- CRON JOB PARA LIMPEZA AUTOMÁTICA
-- ============================================
-- Executar diariamente às 3:00 AM
-- Descomente as linhas abaixo se quiser ativar limpeza automática

-- SELECT cron.schedule(
--     'cleanup-rate-limits',
--     '0 3 * * *', -- Diariamente às 3:00 AM
--     $$ SELECT cleanup_old_rate_limit_logs(); $$
-- );
