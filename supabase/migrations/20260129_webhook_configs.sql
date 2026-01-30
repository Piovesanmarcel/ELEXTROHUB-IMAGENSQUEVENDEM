-- ============================================
-- WEBHOOK CONFIGS - Sistema de Segurança para Webhooks n8n
-- ============================================
-- Tabela para armazenar URLs de webhooks de forma segura
-- As URLs ficam no servidor, nunca expostas no frontend
-- ============================================

-- Criar tabela webhook_configs
CREATE TABLE IF NOT EXISTS public.webhook_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificador do tipo de webhook
  webhook_type TEXT NOT NULL UNIQUE,

  -- Nome amigável para exibição
  display_name TEXT NOT NULL,

  -- URL do webhook (sensível - nunca expor no frontend)
  webhook_url TEXT NOT NULL,

  -- Descrição do propósito
  description TEXT,

  -- Se está ativo ou não
  is_active BOOLEAN DEFAULT true,

  -- Custo em créditos por uso (0 = gratuito)
  credits_cost INTEGER DEFAULT 0,

  -- Configurações extras em JSON (headers, timeout, etc)
  config JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índice para busca por tipo
CREATE INDEX IF NOT EXISTS idx_webhook_configs_type ON public.webhook_configs(webhook_type);
CREATE INDEX IF NOT EXISTS idx_webhook_configs_active ON public.webhook_configs(is_active);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_webhook_configs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS webhook_configs_updated_at ON public.webhook_configs;
CREATE TRIGGER webhook_configs_updated_at
  BEFORE UPDATE ON public.webhook_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_webhook_configs_timestamp();

-- ============================================
-- RLS (Row Level Security) - Segurança Crítica
-- ============================================
-- Apenas admins podem ver/editar webhooks
-- Usuários normais NUNCA veem as URLs

ALTER TABLE public.webhook_configs ENABLE ROW LEVEL SECURITY;

-- Política para admins (acesso total) - usa função is_admin existente
DROP POLICY IF EXISTS "webhook_configs_admin_all" ON public.webhook_configs;
CREATE POLICY "webhook_configs_admin_all" ON public.webhook_configs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================
-- Tabela de logs de uso de webhooks
-- ============================================
CREATE TABLE IF NOT EXISTS public.webhook_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Referência ao usuário
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Tipo do webhook usado
  webhook_type TEXT NOT NULL,

  -- Pacote visual (se aplicável)
  package_id TEXT,

  -- Status da execução
  status TEXT NOT NULL DEFAULT 'pending', -- pending, success, error

  -- Créditos consumidos
  credits_used INTEGER DEFAULT 0,

  -- Payload enviado (sem dados sensíveis)
  request_summary JSONB,

  -- Resposta recebida (resumida)
  response_summary JSONB,

  -- Mensagem de erro (se houver)
  error_message TEXT,

  -- IP do cliente (para auditoria)
  client_ip TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Índices para consultas
CREATE INDEX IF NOT EXISTS idx_webhook_usage_user ON public.webhook_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_usage_type ON public.webhook_usage_logs(webhook_type);
CREATE INDEX IF NOT EXISTS idx_webhook_usage_status ON public.webhook_usage_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_usage_created ON public.webhook_usage_logs(created_at DESC);

-- RLS para logs
ALTER TABLE public.webhook_usage_logs ENABLE ROW LEVEL SECURITY;

-- Usuários só veem seus próprios logs
DROP POLICY IF EXISTS "webhook_logs_own" ON public.webhook_usage_logs;
CREATE POLICY "webhook_logs_own" ON public.webhook_usage_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins veem todos os logs
DROP POLICY IF EXISTS "webhook_logs_admin" ON public.webhook_usage_logs;
CREATE POLICY "webhook_logs_admin" ON public.webhook_usage_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Sistema pode inserir logs (via service role)
DROP POLICY IF EXISTS "webhook_logs_insert" ON public.webhook_usage_logs;
CREATE POLICY "webhook_logs_insert" ON public.webhook_usage_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- Inserir webhooks padrão para Visual Packages
-- ============================================
-- NOTA: Substitua as URLs abaixo pelas URLs reais do seu n8n
-- Cada pacote tem múltiplos webhooks específicos

INSERT INTO public.webhook_configs (webhook_type, display_name, webhook_url, description, credits_cost, config)
VALUES
  -- ============================================
  -- VISUAL START (5 imagens = 2 base + 3 mágicas)
  -- ============================================
  ('vs_fundo_branco', 'Visual Start - Fundo Branco', 'https://nwh.visualvendas.cloud/webhook/c9e47c8b-8095-4ada-96ab-d64c4d604a91', 'Imagem com fundo branco profissional', 1, '{"timeout": 120000, "retry": 2, "package": "visual_start"}'::jsonb),
  ('vs_ambientada', 'Visual Start - Ambientada', 'https://nwh.visualvendas.cloud/webhook/882659cc-55c2-409d-a79c-894b395e9724', 'Imagem ambientada em cenário', 1, '{"timeout": 120000, "retry": 2, "package": "visual_start"}'::jsonb),
  ('vs_magica_1', 'Visual Start - Mágica 1', 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS01', 'Template mágica com logo #1', 1, '{"timeout": 120000, "retry": 2, "package": "visual_start", "template": true}'::jsonb),
  ('vs_magica_2', 'Visual Start - Mágica 2', 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS02', 'Template mágica com logo #2', 1, '{"timeout": 120000, "retry": 2, "package": "visual_start", "template": true}'::jsonb),
  ('vs_magica_3', 'Visual Start - Mágica 3', 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS03', 'Template mágica com logo #3', 1, '{"timeout": 120000, "retry": 2, "package": "visual_start", "template": true}'::jsonb),

  -- ============================================
  -- VISUAL PRO (6 imagens = 2 base + 4 mágicas)
  -- ============================================
  ('vp_fundo_branco', 'Visual Pro - Fundo Branco', 'https://nwh.visualvendas.cloud/webhook/c9e47c8b-8095-4ada-96ab-d64c4d604a91', 'Imagem com fundo branco premium', 1, '{"timeout": 120000, "retry": 2, "package": "visual_pro"}'::jsonb),
  ('vp_ambientada', 'Visual Pro - Ambientada', 'https://nwh.visualvendas.cloud/webhook/882659cc-55c2-409d-a79c-894b395e9724', 'Imagem ambientada premium', 1, '{"timeout": 120000, "retry": 2, "package": "visual_pro"}'::jsonb),
  ('vp_magica_1', 'Visual Pro - Mágica 1', 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS01', 'Template mágica com logo #1', 1, '{"timeout": 120000, "retry": 2, "package": "visual_pro", "template": true}'::jsonb),
  ('vp_magica_2', 'Visual Pro - Mágica 2', 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS02', 'Template mágica com logo #2', 1, '{"timeout": 120000, "retry": 2, "package": "visual_pro", "template": true}'::jsonb),
  ('vp_magica_3', 'Visual Pro - Mágica 3', 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS03', 'Template mágica com logo #3', 1, '{"timeout": 120000, "retry": 2, "package": "visual_pro", "template": true}'::jsonb),
  ('vp_magica_4', 'Visual Pro - Mágica 4', 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS04', 'Template mágica com logo #4', 1, '{"timeout": 120000, "retry": 2, "package": "visual_pro", "template": true}'::jsonb),

  -- ============================================
  -- VISUAL EXPERT SCALE (9 imagens = 3 base + 6 mágicas)
  -- ============================================
  ('ve_fundo_branco', 'Visual Expert - Fundo Branco', 'https://nwh.visualvendas.cloud/webhook/c9e47c8b-8095-4ada-96ab-d64c4d604a91', 'Imagem fundo branco expert', 1, '{"timeout": 180000, "retry": 3, "package": "visual_expert"}'::jsonb),
  ('ve_ambientada', 'Visual Expert - Ambientada', 'https://seu-n8n.com/webhook/ve-ambientada', 'Imagem ambientada expert', 1, '{"timeout": 180000, "retry": 3, "package": "visual_expert"}'::jsonb),
  ('ve_em_uso', 'Visual Expert - Em Uso', 'https://nwh.visualvendas.cloud/webhook/882659cc-55c2-409d-a79c-894b395e9724', 'Produto em uso/demonstração', 1, '{"timeout": 180000, "retry": 3, "package": "visual_expert"}'::jsonb),
  ('ve_magica_1', 'Visual Expert - Mágica 1', 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS01', 'Template mágica com logo #1', 1, '{"timeout": 180000, "retry": 3, "package": "visual_expert", "template": true}'::jsonb),
  ('ve_magica_2', 'Visual Expert - Mágica 2', 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS02', 'Template mágica com logo #2', 1, '{"timeout": 180000, "retry": 3, "package": "visual_expert", "template": true}'::jsonb),
  ('ve_magica_3', 'Visual Expert - Mágica 3', 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS03', 'Template mágica com logo #3', 1, '{"timeout": 180000, "retry": 3, "package": "visual_expert", "template": true}'::jsonb),
  ('ve_magica_4', 'Visual Expert - Mágica 4', 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS04', 'Template mágica com logo #4', 1, '{"timeout": 180000, "retry": 3, "package": "visual_expert", "template": true}'::jsonb),
  ('ve_magica_5', 'Visual Expert - Mágica 5', 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS05', 'Template mágica com logo #5', 1, '{"timeout": 180000, "retry": 3, "package": "visual_expert", "template": true}'::jsonb),
  ('ve_magica_6', 'Visual Expert - Mágica 6', 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS06', 'Template mágica com logo #6', 1, '{"timeout": 180000, "retry": 3, "package": "visual_expert", "template": true}'::jsonb),

  -- ============================================
  -- VISUAL BRAND PRO EXPERT (12 imagens = 4 base + 8 mágicas)
  -- ============================================
  ('vb_fundo_branco', 'Visual Brand - Fundo Branco', 'https://nwh.visualvendas.cloud/webhook/c9e47c8b-8095-4ada-96ab-d64c4d604a91', 'Imagem fundo branco premium', 1, '{"timeout": 240000, "retry": 3, "package": "visual_brand"}'::jsonb),
  ('vb_ambientada', 'Visual Brand - Ambientada', 'https://nwh.visualvendas.cloud/webhook/882659cc-55c2-409d-a79c-894b395e9724', 'Imagem ambientada premium', 1, '{"timeout": 240000, "retry": 3, "package": "visual_brand"}'::jsonb),
  ('vb_em_uso', 'Visual Brand - Em Uso', 'https://seu-n8n.com/webhook/vb-em-uso', 'Produto em uso premium', 1, '{"timeout": 240000, "retry": 3, "package": "visual_brand"}'::jsonb),
  ('vb_com_pessoas', 'Visual Brand - Com Pessoas', 'https://seu-n8n.com/webhook/vb-com-pessoas', 'Produto com pessoas/lifestyle', 1, '{"timeout": 240000, "retry": 3, "package": "visual_brand"}'::jsonb),
  ('vb_magica_1', 'Visual Brand - Mágica 1', 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS01', 'Template mágica com logo #1', 1, '{"timeout": 240000, "retry": 3, "package": "visual_brand", "template": true}'::jsonb),
  ('vb_magica_2', 'Visual Brand - Mágica 2', 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS02', 'Template mágica com logo #2', 1, '{"timeout": 240000, "retry": 3, "package": "visual_brand", "template": true}'::jsonb),
  ('vb_magica_3', 'Visual Brand - Mágica 3', 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS03', 'Template mágica com logo #3', 1, '{"timeout": 240000, "retry": 3, "package": "visual_brand", "template": true}'::jsonb),
  ('vb_magica_4', 'Visual Brand - Mágica 4', 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS04', 'Template mágica com logo #4', 1, '{"timeout": 240000, "retry": 3, "package": "visual_brand", "template": true}'::jsonb),
  ('vb_magica_5', 'Visual Brand - Mágica 5', 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS05', 'Template mágica com logo #5', 1, '{"timeout": 240000, "retry": 3, "package": "visual_brand", "template": true}'::jsonb),
  ('vb_magica_6', 'Visual Brand - Mágica 6', 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS06', 'Template mágica com logo #6', 1, '{"timeout": 240000, "retry": 3, "package": "visual_brand", "template": true}'::jsonb),
  ('vb_magica_7', 'Visual Brand - Mágica 7', 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS07', 'Template mágica com logo #7', 1, '{"timeout": 240000, "retry": 3, "package": "visual_brand", "template": true}'::jsonb),
  ('vb_magica_8', 'Visual Brand - Mágica 8', 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS08', 'Template mágica com logo #8', 1, '{"timeout": 240000, "retry": 3, "package": "visual_brand", "template": true}'::jsonb),

  -- ============================================
  -- WEBHOOKS GERAIS (ATLAS, LYRA, ORION)
  -- ============================================
  ('comando_unificado', 'Comando Unificado ATLAS', 'https://seu-n8n.com/webhook/comando-unificado', 'Webhook principal de análise ATLAS', 1, '{"timeout": 60000, "retry": 2}'::jsonb),
  ('copywriting', 'Copywriting LYRA', 'https://seu-n8n.com/webhook/copywriting', 'Webhook de geração de copy com LYRA', 1, '{"timeout": 90000, "retry": 2}'::jsonb),
  ('tratamento_combinado', 'Tratamento Combinado ORION', 'https://seu-n8n.com/webhook/tratamento-combinado', 'Webhook de tratamento de imagens ORION', 1, '{"timeout": 120000, "retry": 2}'::jsonb)
ON CONFLICT (webhook_type) DO UPDATE SET
  webhook_url = EXCLUDED.webhook_url,
  credits_cost = EXCLUDED.credits_cost,
  config = EXCLUDED.config,
  updated_at = NOW();

-- ============================================
-- Função para buscar todos os webhooks de um pacote
-- ============================================
CREATE OR REPLACE FUNCTION get_package_webhooks(p_package TEXT)
RETURNS TABLE(
  webhook_type TEXT,
  webhook_url TEXT,
  credits_cost INTEGER,
  config JSONB
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    wc.webhook_type,
    wc.webhook_url,
    wc.credits_cost,
    wc.config
  FROM public.webhook_configs wc
  WHERE wc.config->>'package' = p_package
    AND wc.is_active = true
  ORDER BY wc.webhook_type;
END;
$$ LANGUAGE plpgsql;

-- Revogar acesso público
REVOKE ALL ON FUNCTION get_package_webhooks(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_package_webhooks(TEXT) TO service_role;

-- ============================================
-- Função RPC para executar webhook (via Edge Function)
-- ============================================
-- Esta função retorna a URL apenas para o service role

CREATE OR REPLACE FUNCTION get_webhook_url(p_webhook_type TEXT)
RETURNS TABLE(
  webhook_url TEXT,
  credits_cost INTEGER,
  config JSONB
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Apenas retorna se o webhook estiver ativo
  RETURN QUERY
  SELECT
    wc.webhook_url,
    wc.credits_cost,
    wc.config
  FROM public.webhook_configs wc
  WHERE wc.webhook_type = p_webhook_type
    AND wc.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Revogar acesso público à função
REVOKE ALL ON FUNCTION get_webhook_url(TEXT) FROM PUBLIC;

-- Apenas service role pode chamar (Edge Functions)
GRANT EXECUTE ON FUNCTION get_webhook_url(TEXT) TO service_role;

-- ============================================
-- Comentários para documentação
-- ============================================
COMMENT ON TABLE public.webhook_configs IS 'Configurações seguras de webhooks - URLs nunca expostas ao frontend';
COMMENT ON TABLE public.webhook_usage_logs IS 'Logs de uso de webhooks para auditoria e análise';
COMMENT ON FUNCTION get_webhook_url IS 'Retorna URL do webhook - apenas service role pode chamar';

-- ============================================
-- Funções para gerenciamento de créditos
-- ============================================

-- Função para debitar créditos
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
  -- Verificar créditos atuais
  SELECT enhancements_available INTO v_current_credits
  FROM user_usage
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_credits IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  IF v_current_credits < p_amount THEN
    RAISE EXCEPTION 'Créditos insuficientes: % < %', v_current_credits, p_amount;
  END IF;

  -- Debitar créditos
  UPDATE user_usage
  SET
    enhancements_available = enhancements_available - p_amount,
    enhancements_used = enhancements_used + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Registrar transação
  INSERT INTO credit_transactions (user_id, amount, type, reason, created_at)
  VALUES (p_user_id, -p_amount, 'debit', p_reason, NOW())
  ON CONFLICT DO NOTHING;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Função para estornar créditos
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
  UPDATE user_usage
  SET
    enhancements_available = enhancements_available + p_amount,
    enhancements_used = GREATEST(0, enhancements_used - p_amount),
    updated_at = NOW()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Registrar transação
  INSERT INTO credit_transactions (user_id, amount, type, reason, created_at)
  VALUES (p_user_id, p_amount, 'refund', p_reason, NOW())
  ON CONFLICT DO NOTHING;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Revogar acesso público às funções
REVOKE ALL ON FUNCTION debit_credits(UUID, INTEGER, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION refund_credits(UUID, INTEGER, TEXT) FROM PUBLIC;

-- Apenas service role pode chamar
GRANT EXECUTE ON FUNCTION debit_credits(UUID, INTEGER, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION refund_credits(UUID, INTEGER, TEXT) TO service_role;

-- Criar tabela de transações de créditos se não existir
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'debit', 'refund', 'purchase', 'bonus'
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON public.credit_transactions(type);

-- RLS para transações
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "credit_transactions_own" ON public.credit_transactions;
CREATE POLICY "credit_transactions_own" ON public.credit_transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

COMMENT ON FUNCTION debit_credits IS 'Debita créditos do usuário - apenas service role';
COMMENT ON FUNCTION refund_credits IS 'Estorna créditos para o usuário - apenas service role';
