-- ============================================
-- FASE 1: CORREÇÕES DE SEGURANÇA RLS
-- Migração segura: Cria novas políticas antes de remover antigas
-- ============================================

-- 1. Corrigir funções sem search_path definido
-- Essas funções precisam ter search_path para evitar SQL injection via search_path manipulation

-- update_updated_at_column (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    ALTER FUNCTION update_updated_at_column() SET search_path = public, pg_temp;
  END IF;
END $$;

-- check_user_queue_limits
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_user_queue_limits') THEN
    ALTER FUNCTION check_user_queue_limits(uuid) SET search_path = public, pg_temp;
  END IF;
END $$;

-- debit_generation_credit
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'debit_generation_credit') THEN
    ALTER FUNCTION debit_generation_credit(uuid) SET search_path = public, pg_temp;
  END IF;
END $$;

-- get_user_queue_priority
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_queue_priority') THEN
    ALTER FUNCTION get_user_queue_priority(uuid) SET search_path = public, pg_temp;
  END IF;
END $$;

-- acquire_queue_jobs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'acquire_queue_jobs') THEN
    ALTER FUNCTION acquire_queue_jobs(integer) SET search_path = public, pg_temp;
  END IF;
END $$;

-- ============================================
-- 2. Corrigir políticas RLS permissivas
-- NOTA: marketing_templates com USING(true) é INTENCIONAL (templates públicos)
-- Vamos corrigir apenas tabelas que NÃO devem ser públicas
-- ============================================

-- 2.1 authorized_jobs - Remover política permissiva do service_role
-- A política "Service role full access jobs" com USING(true) é problemática
-- Service role já tem acesso via RLS bypass, não precisa de política

DROP POLICY IF EXISTS "Service role full access jobs" ON authorized_jobs;

-- 2.2 n8n_generation_logs - Mesma situação
DROP POLICY IF EXISTS "Service role access n8n logs" ON n8n_generation_logs;

-- 2.3 pedidos - Mesma situação  
DROP POLICY IF EXISTS "Permitir acesso total service_role pedidos" ON pedidos;

-- 2.4 processed_callbacks - Mesma situação
DROP POLICY IF EXISTS "Service role full access callbacks" ON processed_callbacks;

-- 2.5 generation_metrics - A política "System can insert metrics" com WITH CHECK (true) é problemática
-- Deve ser restrita ao service_role ou ao próprio usuário
DROP POLICY IF EXISTS "System can insert metrics" ON generation_metrics;

-- Criar política mais restritiva para inserção de métricas
CREATE POLICY "Service role or user can insert metrics" 
ON generation_metrics 
FOR INSERT 
WITH CHECK (
  auth.role() = 'service_role' OR 
  auth.uid() = user_id
);

-- ============================================
-- 3. Adicionar índices para performance
-- ============================================

-- Índice para busca de jobs por usuário e status
CREATE INDEX IF NOT EXISTS idx_authorized_jobs_user_status 
ON authorized_jobs(user_id, status);

-- Índice para busca de jobs por job_id
CREATE INDEX IF NOT EXISTS idx_authorized_jobs_job_id 
ON authorized_jobs(job_id);

-- Índice para métricas por tipo e data
CREATE INDEX IF NOT EXISTS idx_generation_metrics_type_created 
ON generation_metrics(generation_type, created_at DESC);

-- Índice para métricas por usuário
CREATE INDEX IF NOT EXISTS idx_generation_metrics_user_created 
ON generation_metrics(user_id, created_at DESC);

-- Índice para fila de geração por usuário e status
CREATE INDEX IF NOT EXISTS idx_image_generation_queue_user_status 
ON image_generation_queue(user_id, status);

-- Índice para produtos por usuário
CREATE INDEX IF NOT EXISTS idx_produtos_usuario_id 
ON produtos(usuario_id);

-- Índice para AI results por produto
CREATE INDEX IF NOT EXISTS idx_ai_unified_results_product 
ON ai_unified_results(product_id, user_id);