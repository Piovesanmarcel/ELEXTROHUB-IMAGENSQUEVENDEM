-- =====================================================
-- TABELA DE PRECOS DE IA - Google Gemini e OpenAI
-- Execute no Supabase SQL Editor
-- Atualizado: 2026-02
-- =====================================================

-- Garantir que a tabela existe
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

-- Policy para leitura publica
ALTER TABLE ai_pricing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view pricing" ON ai_pricing;
CREATE POLICY "Anyone can view pricing" ON ai_pricing FOR SELECT USING (true);

-- Limpar dados existentes para atualizar
DELETE FROM ai_pricing;

-- =====================================================
-- GOOGLE GEMINI MODELS
-- =====================================================

INSERT INTO ai_pricing (provider, model, input_price_per_1m, output_price_per_1m, image_price, notes)
VALUES
  -- Gemini 3 Series
  ('gemini', 'gemini-3-pro', 2.00, 12.00, NULL, 'Gemini 3 Pro - 200K context'),
  ('gemini', 'gemini-3-pro-1m', 4.00, 18.00, NULL, 'Gemini 3 Pro - 1M context'),
  ('gemini', 'gemini-3-flash', 0.50, 3.00, NULL, 'Gemini 3 Flash - 1M context'),

  -- Gemini 2.5 Series
  ('gemini', 'gemini-2.5-flash', 0.30, 2.50, NULL, 'Gemini 2.5 Flash - 1M context'),
  ('gemini', 'gemini-2.5-flash-lite', 0.10, 0.40, NULL, 'Gemini 2.5 Flash Lite - 1M context'),
  ('gemini', 'gemini-2.5-pro-preview-03-25', 1.25, 10.00, NULL, 'Gemini 2.5 Pro - 200K context'),
  ('gemini', 'gemini-2.5-pro-1m', 2.50, 15.00, NULL, 'Gemini 2.5 Pro - 1M context'),

  -- Gemini 2.0 Series
  ('gemini', 'gemini-2.0-flash', 0.10, 0.40, NULL, 'Gemini 2.0 Flash - 1M context'),
  ('gemini', 'gemini-2.0-flash-lite', 0.075, 0.30, NULL, 'Gemini 2.0 Flash Lite - 1M context'),

  -- Gemini 1.5 Series
  ('gemini', 'gemini-1.5-pro', 1.25, 5.00, NULL, 'Gemini 1.5 Pro - 128K context'),
  ('gemini', 'gemini-1.5-flash', 0.075, 0.30, NULL, 'Gemini 1.5 Flash - 1M context'),
  ('gemini', 'gemini-1.5-flash-8b', 0.0375, 0.15, NULL, 'Gemini 1.5 Flash 8B - 1M context');

-- =====================================================
-- OPENAI GPT-5 SERIES
-- =====================================================

INSERT INTO ai_pricing (provider, model, input_price_per_1m, output_price_per_1m, image_price, notes)
VALUES
  ('openai', 'gpt-5-2', 1.75, 14.00, NULL, 'GPT-5.2 - 400K/128K context'),
  ('openai', 'gpt-5-2-pro', 21.00, 168.00, NULL, 'GPT-5.2 Pro - 400K/128K context'),
  ('openai', 'gpt-5-1', 1.25, 10.00, NULL, 'GPT-5.1 - 400K/128K context'),
  ('openai', 'gpt-5-pro', 2.00, 10.00, NULL, 'GPT-5 Pro - 512K context'),
  ('openai', 'gpt-5', 1.25, 10.00, NULL, 'GPT-5 - 400K/128K context'),
  ('openai', 'gpt-5-codex', 1.25, 10.00, NULL, 'GPT-5 Codex - 400K context'),
  ('openai', 'gpt-5-mini', 0.25, 2.00, NULL, 'GPT-5 mini - 400K/128K context'),
  ('openai', 'gpt-5-nano', 0.05, 0.40, NULL, 'GPT-5 nano - 400K/128K context');

-- =====================================================
-- OPENAI GPT-4.5/4.1/4o SERIES
-- =====================================================

INSERT INTO ai_pricing (provider, model, input_price_per_1m, output_price_per_1m, image_price, notes)
VALUES
  ('openai', 'gpt-4.5-preview', 75.00, 150.00, NULL, 'GPT-4.5 Preview - 128K/16K context'),
  ('openai', 'gpt-4.1', 2.00, 8.00, NULL, 'GPT-4.1 - 1M/32K context'),
  ('openai', 'gpt-4.1-mini', 0.40, 1.60, NULL, 'GPT-4.1 mini - 1M/32K context'),
  ('openai', 'gpt-4.1-nano', 0.10, 0.40, NULL, 'GPT-4.1 nano - 1M/32K context'),
  ('openai', 'gpt-4o', 2.50, 10.00, NULL, 'GPT-4o - 128K/16K context'),
  ('openai', 'gpt-4o-mini', 0.15, 0.60, NULL, 'GPT-4o mini - 128K/16K context'),
  ('openai', 'gpt-4o-mini-audio-preview', 0.15, 0.60, NULL, 'GPT-4o Mini Audio (Text) - 128K context'),
  ('openai', 'gpt-4o-mini-realtime-preview', 0.60, 2.40, NULL, 'GPT-4o Mini Realtime (Text) - 128K context'),
  ('openai', 'gpt-4o-realtime-preview', 5.00, 20.00, NULL, 'GPT-4o Realtime (Text) - 128K/16K context'),
  ('openai', 'gpt-4o-audio-preview', 2.50, 10.00, NULL, 'GPT-4o Audio (Text) - 128K/16K context'),
  ('openai', 'gpt-4-turbo-preview', 10.00, 30.00, NULL, 'GPT-4 Turbo - 128K/4K context'),
  ('openai', 'gpt-3.5-turbo', 0.50, 1.50, NULL, 'GPT-3.5 Turbo - 16K/4K context');

-- =====================================================
-- OPENAI O-SERIES (Reasoning Models)
-- =====================================================

INSERT INTO ai_pricing (provider, model, input_price_per_1m, output_price_per_1m, image_price, notes)
VALUES
  ('openai', 'o4-mini', 1.10, 4.40, NULL, 'o4-mini - 200K/100K context'),
  ('openai', 'o3-pro', 20.00, 80.00, NULL, 'o3-pro - 200K/100K context'),
  ('openai', 'o3', 2.00, 8.00, NULL, 'o3 - 200K/100K context'),
  ('openai', 'o3-mini', 1.10, 4.40, NULL, 'o3-mini - 200K/100K context'),
  ('openai', 'o1', 15.00, 60.00, NULL, 'o1 - 200K/100K context'),
  ('openai', 'o1-mini', 1.10, 4.40, NULL, 'o1-mini - 128K/65K context');

-- =====================================================
-- ANTHROPIC CLAUDE SERIES (para referencia)
-- =====================================================

INSERT INTO ai_pricing (provider, model, input_price_per_1m, output_price_per_1m, image_price, notes)
VALUES
  ('anthropic', 'claude-opus-4-5', 15.00, 75.00, NULL, 'Claude Opus 4.5 - 200K context'),
  ('anthropic', 'claude-sonnet-4', 3.00, 15.00, NULL, 'Claude Sonnet 4 - 200K context'),
  ('anthropic', 'claude-3-5-sonnet', 3.00, 15.00, NULL, 'Claude 3.5 Sonnet - 200K context'),
  ('anthropic', 'claude-3-5-haiku', 0.80, 4.00, NULL, 'Claude 3.5 Haiku - 200K context'),
  ('anthropic', 'claude-3-opus', 15.00, 75.00, NULL, 'Claude 3 Opus - 200K context'),
  ('anthropic', 'claude-3-haiku', 0.25, 1.25, NULL, 'Claude 3 Haiku - 200K context');

-- =====================================================
-- IMAGEM AI (precos por imagem)
-- =====================================================

INSERT INTO ai_pricing (provider, model, input_price_per_1m, output_price_per_1m, image_price, notes)
VALUES
  ('openai', 'dall-e-3-standard-1024', NULL, NULL, 0.040, 'DALL-E 3 Standard 1024x1024'),
  ('openai', 'dall-e-3-standard-1792', NULL, NULL, 0.080, 'DALL-E 3 Standard 1792x1024'),
  ('openai', 'dall-e-3-hd-1024', NULL, NULL, 0.080, 'DALL-E 3 HD 1024x1024'),
  ('openai', 'dall-e-3-hd-1792', NULL, NULL, 0.120, 'DALL-E 3 HD 1792x1024'),
  ('openai', 'dall-e-2-1024', NULL, NULL, 0.020, 'DALL-E 2 1024x1024'),
  ('openai', 'dall-e-2-512', NULL, NULL, 0.018, 'DALL-E 2 512x512'),
  ('openai', 'dall-e-2-256', NULL, NULL, 0.016, 'DALL-E 2 256x256'),
  ('gemini', 'imagen-3', NULL, NULL, 0.040, 'Imagen 3 - Google'),
  ('gemini', 'imagen-3-fast', NULL, NULL, 0.020, 'Imagen 3 Fast - Google');

-- =====================================================
-- RESULTADO
-- =====================================================

SELECT provider, COUNT(*) as total_models,
       ROUND(AVG(COALESCE(input_price_per_1m, 0))::numeric, 2) as avg_input_price
FROM ai_pricing
GROUP BY provider
ORDER BY provider;
