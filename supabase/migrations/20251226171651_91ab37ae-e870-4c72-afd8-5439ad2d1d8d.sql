-- Criar tabela unificada para logs de uso de IA
CREATE TABLE public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  function_name TEXT NOT NULL,
  api_provider TEXT NOT NULL, -- 'gemini', 'openai', etc
  model_used TEXT,
  command TEXT,
  
  -- Métricas de tokens
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  
  -- Métricas de custo
  estimated_cost_usd DECIMAL(10, 6) DEFAULT 0,
  estimated_cost_brl DECIMAL(10, 6) DEFAULT 0,
  usd_to_brl_rate DECIMAL(10, 4) DEFAULT 5.5,
  
  -- Métricas de tempo
  execution_time_ms INTEGER,
  
  -- Status
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  
  -- Metadados
  request_id TEXT,
  client_ip TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Índices para consultas frequentes
CREATE INDEX idx_ai_usage_logs_user_id ON public.ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_function_name ON public.ai_usage_logs(function_name);
CREATE INDEX idx_ai_usage_logs_created_at ON public.ai_usage_logs(created_at DESC);
CREATE INDEX idx_ai_usage_logs_api_provider ON public.ai_usage_logs(api_provider);

-- Enable RLS
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver seus próprios logs
CREATE POLICY "Users can view their own AI usage logs"
ON public.ai_usage_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Service role pode gerenciar todos os logs (para Edge Functions)
CREATE POLICY "Service role can manage all AI usage logs"
ON public.ai_usage_logs
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Permitir insert anônimo (para Edge Functions sem auth)
CREATE POLICY "Allow anonymous insert for logging"
ON public.ai_usage_logs
FOR INSERT
WITH CHECK (true);