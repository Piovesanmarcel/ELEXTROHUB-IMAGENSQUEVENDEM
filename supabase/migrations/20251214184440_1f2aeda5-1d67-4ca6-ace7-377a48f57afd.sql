-- Tabela para rastrear custos de uso do Gemini
CREATE TABLE gemini_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
  operation_type TEXT NOT NULL, -- 'background', 'white_bg', 'carousel', 'marketing', 'ambient_1', etc.
  model_used TEXT NOT NULL,
  prompt_tokens INTEGER DEFAULT 0,
  candidates_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  images_generated INTEGER DEFAULT 1,
  image_resolution TEXT DEFAULT '1K/2K',
  estimated_cost_usd DECIMAL(10,6) DEFAULT 0,
  estimated_cost_brl DECIMAL(10,4) DEFAULT 0,
  usd_to_brl_rate DECIMAL(6,4) DEFAULT 6.10,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para consultas rápidas
CREATE INDEX idx_gemini_usage_user ON gemini_usage_logs(user_id);
CREATE INDEX idx_gemini_usage_product ON gemini_usage_logs(product_id);
CREATE INDEX idx_gemini_usage_date ON gemini_usage_logs(created_at);
CREATE INDEX idx_gemini_usage_operation ON gemini_usage_logs(operation_type);

-- Habilitar RLS
ALTER TABLE gemini_usage_logs ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem seus próprios logs
CREATE POLICY "Users can view own usage logs"
  ON gemini_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Política para usuários inserirem seus próprios logs
CREATE POLICY "Users can insert own usage logs"
  ON gemini_usage_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);