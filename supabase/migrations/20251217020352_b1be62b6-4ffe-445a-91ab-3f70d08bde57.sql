-- Adicionar colunas para rastrear API Key e Source na tabela gemini_usage_logs
ALTER TABLE public.gemini_usage_logs
ADD COLUMN IF NOT EXISTS api_key_id uuid REFERENCES public.gemini_api_keys(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS api_key_name text,
ADD COLUMN IF NOT EXISTS source text DEFAULT 'products';

-- Criar índices para melhor performance nas queries de filtro
CREATE INDEX IF NOT EXISTS idx_gemini_usage_logs_api_key_id ON public.gemini_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_gemini_usage_logs_source ON public.gemini_usage_logs(source);
CREATE INDEX IF NOT EXISTS idx_gemini_usage_logs_api_key_name ON public.gemini_usage_logs(api_key_name);

-- Atualizar registros existentes com source baseado no operation_type
UPDATE public.gemini_usage_logs 
SET source = CASE 
  WHEN operation_type ILIKE '%carousel%' THEN 'carousel'
  WHEN operation_type ILIKE '%background%' THEN 'products'
  ELSE 'products'
END
WHERE source IS NULL OR source = 'products';