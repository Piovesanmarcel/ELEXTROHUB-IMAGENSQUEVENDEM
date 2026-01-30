-- Create generic user_api_keys table for multiple providers
CREATE TABLE public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  provider TEXT NOT NULL, -- 'gemini', 'openai', 'runware', 'stability', etc.
  name VARCHAR NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_exhausted BOOLEAN DEFAULT false,
  exhausted_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, provider, name)
);

-- Enable RLS
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can manage their own API keys
CREATE POLICY "Users can manage their own API keys"
ON public.user_api_keys
FOR ALL
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_api_keys_updated_at
BEFORE UPDATE ON public.user_api_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing gemini_api_keys to user_api_keys
INSERT INTO public.user_api_keys (id, usuario_id, provider, name, api_key_encrypted, is_active, is_exhausted, exhausted_at, last_used_at, created_at, updated_at)
SELECT id, usuario_id, 'gemini', name, api_key_encrypted, is_active, is_exhausted, exhausted_at, last_used_at, created_at, updated_at
FROM public.gemini_api_keys
ON CONFLICT DO NOTHING;