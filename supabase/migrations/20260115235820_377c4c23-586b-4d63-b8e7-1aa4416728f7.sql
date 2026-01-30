-- Tabela n8n_generation_logs para logs de geração do n8n
CREATE TABLE IF NOT EXISTS n8n_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  scene_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  error_message TEXT,
  request_payload JSONB,
  response_data JSONB,
  image_url TEXT,
  duration_ms INTEGER,
  n8n_node_config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE n8n_generation_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users manage own n8n logs" ON n8n_generation_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role access n8n logs" ON n8n_generation_logs FOR ALL TO service_role USING (true) WITH CHECK (true);