-- Tabela para salvar logs de geração N8N
CREATE TABLE public.n8n_generation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  scene_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER DEFAULT 1,
  error_message TEXT,
  request_payload JSONB,
  response_data JSONB,
  image_url TEXT,
  duration_ms INTEGER,
  n8n_node_config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_n8n_logs_user_id ON public.n8n_generation_logs(user_id);
CREATE INDEX idx_n8n_logs_created_at ON public.n8n_generation_logs(created_at DESC);
CREATE INDEX idx_n8n_logs_status ON public.n8n_generation_logs(status);
CREATE INDEX idx_n8n_logs_scene_type ON public.n8n_generation_logs(scene_type);

-- Enable RLS
ALTER TABLE public.n8n_generation_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own n8n logs"
  ON public.n8n_generation_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own n8n logs"
  ON public.n8n_generation_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own n8n logs"
  ON public.n8n_generation_logs
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own n8n logs"
  ON public.n8n_generation_logs
  FOR DELETE
  USING (auth.uid() = user_id);