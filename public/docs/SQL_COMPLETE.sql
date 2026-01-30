-- ============================================================================
-- ELECTROHUB - SCRIPT SQL COMPLETO PARA MIGRAÇÃO
-- ============================================================================
-- 
-- INSTRUÇÕES:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Execute na ordem: Extensões → Enum → Tabelas → Funções → Triggers → RLS → Indexes
-- 3. Após execução, verifique se todas as tabelas foram criadas
--
-- Última atualização: 2026-01-14
-- ============================================================================

-- ============================================================================
-- PARTE 1: EXTENSÕES (já vem habilitadas no Supabase, mas garantir)
-- ============================================================================

-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pg_cron"; -- Habilitar via Dashboard
-- CREATE EXTENSION IF NOT EXISTS "pg_net";  -- Habilitar via Dashboard

-- ============================================================================
-- PARTE 2: ENUM
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- PARTE 3: TABELAS CORE
-- ============================================================================

-- 3.1: user_roles - Roles de usuário (admin/user)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user'::public.app_role,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 3.2: user_credits - Saldo de créditos
CREATE TABLE IF NOT EXISTS public.user_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  credits_balance INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  last_purchase_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.3: user_subscriptions - Assinaturas Stripe
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT,
  plan_type TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.4: credit_purchases - Histórico de compras
CREATE TABLE IF NOT EXISTS public.credit_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  credits_amount INTEGER NOT NULL,
  price_paid NUMERIC NOT NULL,
  stripe_session_id TEXT,
  stripe_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'::text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.5: credit_usage - Uso detalhado de créditos
CREATE TABLE IF NOT EXISTS public.credit_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  credits_spent INTEGER NOT NULL,
  operation_type TEXT NOT NULL,
  operation_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.6: admin_audit_logs - Logs de auditoria admin
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  page_path TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- PARTE 4: TABELAS DE PRODUTOS E GERAÇÃO
-- ============================================================================

-- 4.1: produtos - Produtos do usuário
CREATE TABLE IF NOT EXISTS public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL,
  nome TEXT NOT NULL,
  sku TEXT,
  bling_id TEXT,
  preco NUMERIC,
  descricao_curta TEXT,
  descricao_longa TEXT,
  imagem_original TEXT,
  imagem_melhorada_1 TEXT,
  imagem_melhorada_2 TEXT,
  imagem_melhorada_3 TEXT,
  imagem_melhorada_4 TEXT,
  imagem_melhorada_5 TEXT,
  imagem_melhorada_6 TEXT,
  imagem_melhorada_7 TEXT,
  imagem_melhorada_8 TEXT,
  imagem_melhorada_9 TEXT,
  imagem_melhorada_10 TEXT,
  enhanced_at TIMESTAMPTZ,
  ready_for_ads BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4.2: hosted_images - Imagens hospedadas
CREATE TABLE IF NOT EXISTS public.hosted_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  r2_path TEXT,
  original_filename TEXT,
  description TEXT,
  product_id TEXT,
  template_id UUID,
  tags TEXT[] DEFAULT '{}'::text[],
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.3: marketing_templates - Templates de marketing
CREATE TABLE IF NOT EXISTS public.marketing_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  template_key TEXT,
  thumbnail_url TEXT,
  base_image_url TEXT,
  zones JSONB DEFAULT '[]'::jsonb,
  dimensions JSONB DEFAULT '{"width": 1200, "height": 1200}'::jsonb,
  color_scheme JSONB,
  detected_fonts TEXT[],
  config JSONB DEFAULT '{}'::jsonb,
  is_system BOOLEAN DEFAULT false,
  disable_global_logo BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4.4: ai_unified_results - Resultados IA consolidados
CREATE TABLE IF NOT EXISTS public.ai_unified_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id TEXT NOT NULL,
  results JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4.5: ai_usage_logs - Logs de uso de IA
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  function_name TEXT NOT NULL,
  api_provider TEXT NOT NULL,
  model_used TEXT,
  command TEXT,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  estimated_cost_usd NUMERIC DEFAULT 0,
  estimated_cost_brl NUMERIC DEFAULT 0,
  usd_to_brl_rate NUMERIC DEFAULT 5.5,
  execution_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  request_id TEXT,
  client_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- PARTE 5: TABELAS DE FILA E PROCESSAMENTO (n8n)
-- ============================================================================

-- 5.1: image_generation_queue - Fila de processamento
CREATE TABLE IF NOT EXISTS public.image_generation_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  generation_type TEXT NOT NULL,
  input_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending'::text,
  result JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  queue_wait_time_ms INTEGER,
  processing_time_ms INTEGER,
  credits_debited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5.2: generation_metrics - Métricas de geração
CREATE TABLE IF NOT EXISTS public.generation_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID,
  user_id UUID NOT NULL,
  generation_type TEXT NOT NULL,
  model_used TEXT,
  queue_wait_time_ms INTEGER,
  processing_time_ms INTEGER,
  tokens_used INTEGER DEFAULT 0,
  estimated_cost_usd NUMERIC DEFAULT 0,
  estimated_cost_brl NUMERIC DEFAULT 0,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5.3: generated_images_batch - Batches de imagens (n8n callback)
CREATE TABLE IF NOT EXISTS public.generated_images_batch (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'::text,
  images JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5.4: authorized_jobs - Jobs autorizados para callback
CREATE TABLE IF NOT EXISTS public.authorized_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  expected_images INTEGER DEFAULT 8,
  received_images INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active'::text,
  metadata JSONB DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '10 minutes'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5.5: processed_callbacks - Callbacks processados (deduplicação)
CREATE TABLE IF NOT EXISTS public.processed_callbacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  callback_hash TEXT NOT NULL,
  user_id UUID NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now()
);

-- 5.6: n8n_generation_logs - Logs de geração n8n
CREATE TABLE IF NOT EXISTS public.n8n_generation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  scene_type TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'::text,
  request_payload JSONB,
  response_data JSONB,
  n8n_node_config JSONB,
  image_url TEXT,
  error_message TEXT,
  duration_ms INTEGER,
  attempts INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- PARTE 6: TABELAS DE CONFIGURAÇÃO
-- ============================================================================

-- 6.1: brand_settings - Configurações de marca/logo
CREATE TABLE IF NOT EXISTS public.brand_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  logo_url TEXT,
  logo_position TEXT DEFAULT 'top-right'::text,
  logo_size INTEGER DEFAULT 100,
  show_logo_on_templates BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6.2: automation_settings - Configurações de automação
CREATE TABLE IF NOT EXISTS public.automation_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  paused BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6.3: user_api_keys - API Keys do usuário
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_exhausted BOOLEAN NOT NULL DEFAULT false,
  exhausted_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6.4: usuarios - Dados extras do usuário (Bling)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  bling_access_token TEXT,
  bling_refresh_token TEXT,
  bling_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- PARTE 7: FUNÇÕES DE BANCO
-- ============================================================================

-- 7.1: is_admin - Verifica se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- 7.2: has_role - Verifica se usuário tem role específica
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 7.3: debit_generation_credit - Debitar crédito de geração
CREATE OR REPLACE FUNCTION public.debit_generation_credit(p_user_id UUID, p_amount INTEGER DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_credits INTEGER;
BEGIN
  -- Verificar e debitar atomicamente
  UPDATE public.user_credits
  SET 
    credits_balance = credits_balance - p_amount,
    credits_used = credits_used + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id
    AND credits_balance >= p_amount
  RETURNING credits_balance INTO v_current_credits;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Registrar uso
  INSERT INTO public.credit_usage (user_id, credits_spent, operation_type, operation_details)
  VALUES (p_user_id, p_amount, 'image_generation', jsonb_build_object('debited_at', now()));

  RETURN TRUE;
END;
$$;

-- 7.4: check_user_queue_limits - Verificar limites de fila
CREATE OR REPLACE FUNCTION public.check_user_queue_limits(p_user_id UUID)
RETURNS TABLE(can_enqueue BOOLEAN, pending_jobs INTEGER, max_concurrent INTEGER, credits_remaining INTEGER, queue_priority INTEGER, reason TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pending INTEGER;
  v_credits INTEGER;
  v_max_concurrent INTEGER := 5;
  v_priority INTEGER := 1;
  v_can_enqueue BOOLEAN := true;
  v_reason TEXT := 'OK';
BEGIN
  -- Contar jobs pendentes/processando
  SELECT COUNT(*) INTO v_pending
  FROM public.image_generation_queue
  WHERE user_id = p_user_id
    AND status IN ('pending', 'processing');

  -- Buscar créditos
  SELECT credits_balance INTO v_credits
  FROM public.user_credits
  WHERE user_id = p_user_id;

  IF v_credits IS NULL THEN
    v_credits := 0;
  END IF;

  -- Verificar limites
  IF v_pending >= v_max_concurrent THEN
    v_can_enqueue := false;
    v_reason := 'Limite de jobs simultâneos atingido';
  ELSIF v_credits <= 0 THEN
    v_can_enqueue := false;
    v_reason := 'Créditos insuficientes';
  END IF;

  -- Prioridade baseada em créditos
  IF v_credits > 100 THEN
    v_priority := 3;
  ELSIF v_credits > 50 THEN
    v_priority := 2;
  END IF;

  RETURN QUERY SELECT 
    v_can_enqueue,
    v_pending,
    v_max_concurrent,
    v_credits,
    v_priority,
    v_reason;
END;
$$;

-- 7.5: acquire_queue_jobs - Adquirir jobs da fila (FOR UPDATE SKIP LOCKED)
CREATE OR REPLACE FUNCTION public.acquire_queue_jobs(p_batch_size INTEGER DEFAULT 10)
RETURNS SETOF public.image_generation_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
BEGIN
  RETURN QUERY
  WITH locked_jobs AS (
    SELECT id 
    FROM public.image_generation_queue
    WHERE status = 'pending' 
      AND (locked_at IS NULL OR locked_at < v_now - INTERVAL '5 minutes')
    ORDER BY priority DESC, created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT p_batch_size
  )
  UPDATE public.image_generation_queue q
  SET 
    locked_at = v_now,
    status = 'processing',
    started_at = COALESCE(started_at, v_now),
    queue_wait_time_ms = EXTRACT(EPOCH FROM (v_now - created_at)) * 1000
  FROM locked_jobs lj 
  WHERE q.id = lj.id
  RETURNING q.*;
END;
$$;

-- 7.6: complete_queue_job - Completar job da fila
CREATE OR REPLACE FUNCTION public.complete_queue_job(
  p_job_id UUID, 
  p_success BOOLEAN, 
  p_result JSONB DEFAULT NULL, 
  p_error_message TEXT DEFAULT NULL, 
  p_model_used TEXT DEFAULT NULL, 
  p_tokens_used INTEGER DEFAULT 0, 
  p_cost_usd NUMERIC DEFAULT 0, 
  p_cost_brl NUMERIC DEFAULT 0
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_job RECORD;
  v_queue_wait INTEGER;
  v_processing_time INTEGER;
BEGIN
  -- Buscar job
  SELECT * INTO v_job
  FROM public.image_generation_queue
  WHERE id = p_job_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Calcular tempos
  v_queue_wait := EXTRACT(EPOCH FROM (v_job.started_at - v_job.created_at)) * 1000;
  v_processing_time := EXTRACT(EPOCH FROM (now() - v_job.started_at)) * 1000;

  -- Atualizar job
  UPDATE public.image_generation_queue
  SET 
    status = CASE WHEN p_success THEN 'completed' ELSE 'failed' END,
    result = p_result,
    error_message = p_error_message,
    completed_at = now(),
    queue_wait_time_ms = v_queue_wait,
    processing_time_ms = v_processing_time
  WHERE id = p_job_id;

  -- Registrar métrica
  INSERT INTO public.generation_metrics (
    job_id, user_id, generation_type, model_used,
    queue_wait_time_ms, processing_time_ms,
    tokens_used, estimated_cost_usd, estimated_cost_brl,
    success, error_message
  ) VALUES (
    p_job_id, v_job.user_id, v_job.generation_type, p_model_used,
    v_queue_wait, v_processing_time,
    p_tokens_used, p_cost_usd, p_cost_brl,
    p_success, p_error_message
  );

  RETURN TRUE;
END;
$$;

-- 7.7: reset_stuck_jobs - Resetar jobs travados
CREATE OR REPLACE FUNCTION public.reset_stuck_jobs(p_stuck_threshold_minutes INTEGER DEFAULT 10, p_max_retries INTEGER DEFAULT 3)
RETURNS TABLE(reset_count INTEGER, failed_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_reset INTEGER := 0;
  v_failed INTEGER := 0;
BEGIN
  -- Jobs travados que podem ser reenfileirados
  WITH reset_jobs AS (
    UPDATE public.image_generation_queue
    SET status = 'pending',
        locked_at = NULL,
        locked_by = NULL,
        retry_count = COALESCE(retry_count, 0) + 1,
        error_message = 'Reset automatico - job travado por mais de ' || p_stuck_threshold_minutes || ' minutos'
    WHERE status = 'processing'
      AND started_at < now() - (p_stuck_threshold_minutes || ' minutes')::interval
      AND COALESCE(retry_count, 0) < p_max_retries
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER INTO v_reset FROM reset_jobs;

  -- Jobs que excederam retries - marcar como failed
  WITH failed_jobs AS (
    UPDATE public.image_generation_queue
    SET status = 'failed',
        locked_at = NULL,
        locked_by = NULL,
        error_message = 'Excedeu limite de ' || p_max_retries || ' retries',
        completed_at = now()
    WHERE status = 'processing'
      AND started_at < now() - (p_stuck_threshold_minutes || ' minutes')::interval
      AND COALESCE(retry_count, 0) >= p_max_retries
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER INTO v_failed FROM failed_jobs;

  RETURN QUERY SELECT v_reset, v_failed;
END;
$$;

-- 7.8: cleanup_completed_jobs - Limpar jobs completados
CREATE OR REPLACE FUNCTION public.cleanup_completed_jobs(p_retention_hours INTEGER DEFAULT 24)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM public.image_generation_queue
    WHERE status IN ('completed', 'failed')
      AND completed_at < now() - (p_retention_hours || ' hours')::interval
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER INTO v_deleted FROM deleted;
  
  RETURN v_deleted;
END;
$$;

-- 7.9: cleanup_old_processed_callbacks - Limpar callbacks antigos
CREATE OR REPLACE FUNCTION public.cleanup_old_processed_callbacks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM processed_callbacks 
  WHERE processed_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- 7.10: update_updated_at_column - Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 7.11: handle_new_user_credits - Trigger para novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Criar créditos iniciais (10 grátis)
  INSERT INTO public.user_credits (user_id, credits_balance)
  VALUES (NEW.id, 10)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Definir role padrão
  -- IMPORTANTE: Alterar 'piovesan.marcel@gmail.com' para o email do admin desejado
  IF NEW.email = 'piovesan.marcel@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- PARTE 8: TRIGGERS
-- ============================================================================

-- 8.1: Trigger para updated_at em marketing_templates
DROP TRIGGER IF EXISTS update_marketing_templates_updated_at ON public.marketing_templates;
CREATE TRIGGER update_marketing_templates_updated_at
  BEFORE UPDATE ON public.marketing_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8.2: Trigger para novos usuários (executar no auth.users)
-- IMPORTANTE: Este trigger precisa ser criado via Dashboard do Supabase
-- Database → Triggers → Create Trigger
-- Schema: auth, Table: users, Event: AFTER INSERT
-- Function: public.handle_new_user_credits

-- ============================================================================
-- PARTE 9: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hosted_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_unified_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_generation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_images_batch ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorized_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_callbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES: user_roles
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (is_admin(auth.uid()));

-- ============================================================================
-- POLICIES: user_credits
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own credits" ON public.user_credits;
CREATE POLICY "Users can view their own credits" ON public.user_credits
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all credits" ON public.user_credits;
CREATE POLICY "Admins can view all credits" ON public.user_credits
  FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "System can manage credits" ON public.user_credits;
CREATE POLICY "System can manage credits" ON public.user_credits
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- POLICIES: user_subscriptions
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can insert their own subscription" ON public.user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can update their own subscription" ON public.user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.user_subscriptions;
CREATE POLICY "Service role can manage subscriptions" ON public.user_subscriptions
  FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- ============================================================================
-- POLICIES: credit_purchases
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.credit_purchases;
CREATE POLICY "Users can view their own purchases" ON public.credit_purchases
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all purchases" ON public.credit_purchases;
CREATE POLICY "Admins can view all purchases" ON public.credit_purchases
  FOR SELECT USING (is_admin(auth.uid()));

-- ============================================================================
-- POLICIES: credit_usage
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own usage" ON public.credit_usage;
CREATE POLICY "Users can view their own usage" ON public.credit_usage
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all usage" ON public.credit_usage;
CREATE POLICY "Admins can view all usage" ON public.credit_usage
  FOR SELECT USING (is_admin(auth.uid()));

-- ============================================================================
-- POLICIES: admin_audit_logs
-- ============================================================================
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view all audit logs" ON public.admin_audit_logs
  FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Service role can insert audit logs" ON public.admin_audit_logs
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- POLICIES: produtos
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own produtos" ON public.produtos;
CREATE POLICY "Users can view their own produtos" ON public.produtos
  FOR SELECT USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Users can insert their own produtos" ON public.produtos;
CREATE POLICY "Users can insert their own produtos" ON public.produtos
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Users can update their own produtos" ON public.produtos;
CREATE POLICY "Users can update their own produtos" ON public.produtos
  FOR UPDATE USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Users can delete their own produtos" ON public.produtos;
CREATE POLICY "Users can delete their own produtos" ON public.produtos
  FOR DELETE USING (auth.uid() = usuario_id);

-- ============================================================================
-- POLICIES: hosted_images
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own hosted images" ON public.hosted_images;
CREATE POLICY "Users can view their own hosted images" ON public.hosted_images
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own hosted images" ON public.hosted_images;
CREATE POLICY "Users can insert their own hosted images" ON public.hosted_images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own hosted images" ON public.hosted_images;
CREATE POLICY "Users can update their own hosted images" ON public.hosted_images
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own hosted images" ON public.hosted_images;
CREATE POLICY "Users can delete their own hosted images" ON public.hosted_images
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- POLICIES: marketing_templates
-- ============================================================================
DROP POLICY IF EXISTS "Users can view system templates or their own" ON public.marketing_templates;
CREATE POLICY "Users can view system templates or their own" ON public.marketing_templates
  FOR SELECT USING ((is_system = true) OR (auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can insert their own marketing templates" ON public.marketing_templates;
CREATE POLICY "Users can insert their own marketing templates" ON public.marketing_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own marketing templates" ON public.marketing_templates;
CREATE POLICY "Users can update their own marketing templates" ON public.marketing_templates
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own marketing templates" ON public.marketing_templates;
CREATE POLICY "Users can delete their own marketing templates" ON public.marketing_templates
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- POLICIES: ai_unified_results
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own ai unified results" ON public.ai_unified_results;
CREATE POLICY "Users can view their own ai unified results" ON public.ai_unified_results
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own ai unified results" ON public.ai_unified_results;
CREATE POLICY "Users can insert their own ai unified results" ON public.ai_unified_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own ai unified results" ON public.ai_unified_results;
CREATE POLICY "Users can update their own ai unified results" ON public.ai_unified_results
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own ai unified results" ON public.ai_unified_results;
CREATE POLICY "Users can delete their own ai unified results" ON public.ai_unified_results
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- POLICIES: ai_usage_logs
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own AI usage logs" ON public.ai_usage_logs;
CREATE POLICY "Users can view their own AI usage logs" ON public.ai_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all AI usage logs" ON public.ai_usage_logs;
CREATE POLICY "Admins can view all AI usage logs" ON public.ai_usage_logs
  FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Allow anonymous insert for logging" ON public.ai_usage_logs;
CREATE POLICY "Allow anonymous insert for logging" ON public.ai_usage_logs
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage all AI usage logs" ON public.ai_usage_logs;
CREATE POLICY "Service role can manage all AI usage logs" ON public.ai_usage_logs
  FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- ============================================================================
-- POLICIES: image_generation_queue
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own queue jobs" ON public.image_generation_queue;
CREATE POLICY "Users can view their own queue jobs" ON public.image_generation_queue
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own queue jobs" ON public.image_generation_queue;
CREATE POLICY "Users can insert their own queue jobs" ON public.image_generation_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own queue jobs" ON public.image_generation_queue;
CREATE POLICY "Users can update their own queue jobs" ON public.image_generation_queue
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all queue jobs" ON public.image_generation_queue;
CREATE POLICY "Service role can manage all queue jobs" ON public.image_generation_queue
  FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- ============================================================================
-- POLICIES: generation_metrics
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own metrics" ON public.generation_metrics;
CREATE POLICY "Users can view their own metrics" ON public.generation_metrics
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all metrics" ON public.generation_metrics;
CREATE POLICY "Service role can manage all metrics" ON public.generation_metrics
  FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- ============================================================================
-- POLICIES: generated_images_batch
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own batches" ON public.generated_images_batch;
CREATE POLICY "Users can view their own batches" ON public.generated_images_batch
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own batches" ON public.generated_images_batch;
CREATE POLICY "Users can insert their own batches" ON public.generated_images_batch
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own batches" ON public.generated_images_batch;
CREATE POLICY "Users can update their own batches" ON public.generated_images_batch
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all batches" ON public.generated_images_batch;
CREATE POLICY "Service role can manage all batches" ON public.generated_images_batch
  FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- ============================================================================
-- POLICIES: authorized_jobs
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own authorized jobs" ON public.authorized_jobs;
CREATE POLICY "Users can view own authorized jobs" ON public.authorized_jobs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own authorized jobs" ON public.authorized_jobs;
CREATE POLICY "Users can create own authorized jobs" ON public.authorized_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own authorized jobs" ON public.authorized_jobs;
CREATE POLICY "Users can update own authorized jobs" ON public.authorized_jobs
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access" ON public.authorized_jobs;
CREATE POLICY "Service role full access" ON public.authorized_jobs
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- POLICIES: processed_callbacks
-- ============================================================================
DROP POLICY IF EXISTS "Service role can manage processed_callbacks" ON public.processed_callbacks;
CREATE POLICY "Service role can manage processed_callbacks" ON public.processed_callbacks
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- POLICIES: n8n_generation_logs
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own n8n logs" ON public.n8n_generation_logs;
CREATE POLICY "Users can view own n8n logs" ON public.n8n_generation_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own n8n logs" ON public.n8n_generation_logs;
CREATE POLICY "Users can insert own n8n logs" ON public.n8n_generation_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own n8n logs" ON public.n8n_generation_logs;
CREATE POLICY "Users can update own n8n logs" ON public.n8n_generation_logs
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own n8n logs" ON public.n8n_generation_logs;
CREATE POLICY "Users can delete own n8n logs" ON public.n8n_generation_logs
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- POLICIES: brand_settings
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own brand settings" ON public.brand_settings;
CREATE POLICY "Users can view own brand settings" ON public.brand_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own brand settings" ON public.brand_settings;
CREATE POLICY "Users can insert own brand settings" ON public.brand_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own brand settings" ON public.brand_settings;
CREATE POLICY "Users can update own brand settings" ON public.brand_settings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own brand settings" ON public.brand_settings;
CREATE POLICY "Users can delete own brand settings" ON public.brand_settings
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- POLICIES: automation_settings
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own automation settings" ON public.automation_settings;
CREATE POLICY "Users can view their own automation settings" ON public.automation_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own automation settings" ON public.automation_settings;
CREATE POLICY "Users can insert their own automation settings" ON public.automation_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own automation settings" ON public.automation_settings;
CREATE POLICY "Users can update their own automation settings" ON public.automation_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- POLICIES: user_api_keys
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own API keys" ON public.user_api_keys;
CREATE POLICY "Users can view their own API keys" ON public.user_api_keys
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own API keys" ON public.user_api_keys;
CREATE POLICY "Users can insert their own API keys" ON public.user_api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own API keys" ON public.user_api_keys;
CREATE POLICY "Users can update their own API keys" ON public.user_api_keys
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own API keys" ON public.user_api_keys;
CREATE POLICY "Users can delete their own API keys" ON public.user_api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- POLICIES: usuarios
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own usuario config" ON public.usuarios;
CREATE POLICY "Users can view their own usuario config" ON public.usuarios
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own usuario config" ON public.usuarios;
CREATE POLICY "Users can insert their own usuario config" ON public.usuarios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own usuario config" ON public.usuarios;
CREATE POLICY "Users can update their own usuario config" ON public.usuarios
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- PARTE 10: INDEXES PARA PERFORMANCE
-- ============================================================================

-- Indexes para fila de processamento
CREATE INDEX IF NOT EXISTS idx_queue_status_priority ON public.image_generation_queue(status, priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_queue_user_status ON public.image_generation_queue(user_id, status);
CREATE INDEX IF NOT EXISTS idx_queue_locked_at ON public.image_generation_queue(locked_at);

-- Indexes para produtos
CREATE INDEX IF NOT EXISTS idx_produtos_usuario ON public.produtos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_produtos_bling_id ON public.produtos(bling_id);

-- Indexes para logs
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user ON public.ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created ON public.ai_usage_logs(created_at DESC);

-- Indexes para batches
CREATE INDEX IF NOT EXISTS idx_batches_user ON public.generated_images_batch(user_id);
CREATE INDEX IF NOT EXISTS idx_batches_job ON public.generated_images_batch(job_id);

-- Indexes para templates
CREATE INDEX IF NOT EXISTS idx_templates_user ON public.marketing_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_system ON public.marketing_templates(is_system);

-- ============================================================================
-- PARTE 11: STORAGE BUCKET
-- ============================================================================

-- Criar bucket para templates de marketing
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketing-templates', 'marketing-templates', true)
ON CONFLICT (id) DO NOTHING;

-- Policy para leitura pública
DROP POLICY IF EXISTS "Public read access for marketing templates" ON storage.objects;
CREATE POLICY "Public read access for marketing templates" ON storage.objects
  FOR SELECT USING (bucket_id = 'marketing-templates');

-- Policy para upload autenticado
DROP POLICY IF EXISTS "Authenticated users can upload marketing templates" ON storage.objects;
CREATE POLICY "Authenticated users can upload marketing templates" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'marketing-templates' AND auth.role() = 'authenticated');

-- Policy para atualização pelo dono
DROP POLICY IF EXISTS "Users can update their own templates" ON storage.objects;
CREATE POLICY "Users can update their own templates" ON storage.objects
  FOR UPDATE USING (bucket_id = 'marketing-templates' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy para deleção pelo dono
DROP POLICY IF EXISTS "Users can delete their own templates" ON storage.objects;
CREATE POLICY "Users can delete their own templates" ON storage.objects
  FOR DELETE USING (bucket_id = 'marketing-templates' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- PARTE 12: CONFIGURAR PRIMEIRO ADMIN (EXECUTAR MANUALMENTE APÓS SIGNUP)
-- ============================================================================

-- Após o primeiro usuário se cadastrar, execute:
-- UPDATE public.user_roles 
-- SET role = 'admin' 
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'seu-email@admin.com');

-- Ou use a função:
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin' FROM auth.users WHERE email = 'seu-email@admin.com'
-- ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
