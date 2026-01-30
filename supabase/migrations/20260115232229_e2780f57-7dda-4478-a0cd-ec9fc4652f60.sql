-- 1. authorized_jobs (CRÍTICA - valida jobs do n8n)
CREATE TABLE IF NOT EXISTS authorized_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  expected_images INTEGER DEFAULT 8,
  received_images INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  metadata JSONB,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '60 minutes'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. processed_callbacks (CRÍTICA - evita duplicatas)
CREATE TABLE IF NOT EXISTS processed_callbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  callback_hash TEXT NOT NULL UNIQUE,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. automation_settings (kill switch)
CREATE TABLE IF NOT EXISTS automation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  paused BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. user_credits
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  credits_used INTEGER DEFAULT 0,
  credits_balance INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ai_usage_logs
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  operation_type TEXT NOT NULL,
  model_used TEXT,
  tokens_used INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. credit_purchases
CREATE TABLE IF NOT EXISTS credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  credits_purchased INTEGER NOT NULL,
  price_paid DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. admin_audit_logs
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_user_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE authorized_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_callbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies para authorized_jobs
CREATE POLICY "Users view own jobs" ON authorized_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own jobs" ON authorized_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own jobs" ON authorized_jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access jobs" ON authorized_jobs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Policies para processed_callbacks
CREATE POLICY "Users view own callbacks" ON processed_callbacks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own callbacks" ON processed_callbacks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access callbacks" ON processed_callbacks FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Policies para automation_settings
CREATE POLICY "Users manage own automation" ON automation_settings FOR ALL USING (auth.uid() = user_id);

-- Policies para user_credits
CREATE POLICY "Users manage own credits" ON user_credits FOR ALL USING (auth.uid() = user_id);

-- Policies para ai_usage_logs
CREATE POLICY "Users view own ai_logs" ON ai_usage_logs FOR ALL USING (auth.uid() = user_id);

-- Policies para credit_purchases
CREATE POLICY "Users view own purchases" ON credit_purchases FOR ALL USING (auth.uid() = user_id);

-- Policies para admin_audit_logs (apenas admins)
CREATE POLICY "Admins manage audit logs" ON admin_audit_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);