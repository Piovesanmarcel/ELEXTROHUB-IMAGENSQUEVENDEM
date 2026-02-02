-- =====================================================
-- TABELAS DE CUSTOS DE IA
-- ai_usage_log: Registro de cada chamada de API
-- ai_pricing: Tabela de precos de referencia
-- =====================================================

-- Tabela de log de uso de IA
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  operation TEXT DEFAULT 'text',
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  images_count INTEGER DEFAULT 0,
  total_cost DECIMAL(12,6) DEFAULT 0,
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  job_id TEXT,
  session_id TEXT,
  request_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para ai_usage_log
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_user_id ON ai_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_created_at ON ai_usage_log(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_provider ON ai_usage_log(provider);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_job_id ON ai_usage_log(job_id);

-- Tabela de precos de IA
CREATE TABLE IF NOT EXISTS ai_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_price_per_1m DECIMAL(10,4),
  output_price_per_1m DECIMAL(10,4),
  image_price DECIMAL(10,4),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, model)
);

-- Indices para ai_pricing
CREATE INDEX IF NOT EXISTS idx_ai_pricing_provider ON ai_pricing(provider);

-- Habilitar RLS
ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_pricing ENABLE ROW LEVEL SECURITY;

-- Policies para ai_usage_log
DROP POLICY IF EXISTS "Users view own ai usage" ON ai_usage_log;
CREATE POLICY "Users view own ai usage" ON ai_usage_log
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own ai usage" ON ai_usage_log;
CREATE POLICY "Users insert own ai usage" ON ai_usage_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access ai_usage_log" ON ai_usage_log;
CREATE POLICY "Service role full access ai_usage_log" ON ai_usage_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Policies para ai_pricing (todos podem ler)
DROP POLICY IF EXISTS "Anyone can view pricing" ON ai_pricing;
CREATE POLICY "Anyone can view pricing" ON ai_pricing
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role manage pricing" ON ai_pricing;
CREATE POLICY "Service role manage pricing" ON ai_pricing
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE ai_usage_log;
