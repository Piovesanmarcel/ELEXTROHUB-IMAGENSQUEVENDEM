-- Migration to create tables for Kit Generator API Keys and Usage Logs

-- 1. Table to store user-specific Gemini API Keys
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  name TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_exhausted BOOLEAN DEFAULT false,
  exhausted_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for user_api_keys
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_api_keys
CREATE POLICY "Users can view their own api keys" 
ON public.user_api_keys FOR SELECT 
TO authenticated 
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert their own api keys" 
ON public.user_api_keys FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own api keys" 
ON public.user_api_keys FOR UPDATE 
TO authenticated 
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own api keys" 
ON public.user_api_keys FOR DELETE 
TO authenticated 
USING (auth.uid() = usuario_id);

-- 2. Table to track usage and costs of Gemini API
CREATE TABLE IF NOT EXISTS public.gemini_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id UUID, -- Optional link to a product
  operation_type TEXT NOT NULL,
  model_used TEXT,
  prompt_tokens INTEGER,
  candidates_tokens INTEGER,
  total_tokens INTEGER,
  images_generated INTEGER DEFAULT 0,
  estimated_cost_usd DECIMAL(10, 6),
  estimated_cost_brl DECIMAL(10, 6),
  usd_to_brl_rate DECIMAL(10, 4),
  source TEXT,
  api_key_id UUID REFERENCES public.user_api_keys(id) ON DELETE SET NULL,
  api_key_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for gemini_usage_logs
ALTER TABLE public.gemini_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gemini_usage_logs
CREATE POLICY "Users can view their own usage logs" 
ON public.gemini_usage_logs FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage logs" 
ON public.gemini_usage_logs FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_gemini_usage_logs_user_id ON public.gemini_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_usuario_id ON public.user_api_keys(usuario_id);
