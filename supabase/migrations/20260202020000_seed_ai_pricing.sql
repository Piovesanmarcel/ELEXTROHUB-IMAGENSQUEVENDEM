-- População inicial da tabela ai_pricing com modelos Gemini e OpenAI
-- Preços baseados em Janeiro 2026

INSERT INTO ai_pricing (provider, model, input_price_per_1m, output_price_per_1m, image_price, notes)
VALUES 
  ('gemini', 'gemini-2.5-flash', 0.15, 0.60, NULL, 'Balanced model (≤200k tokens)'),
  ('gemini', 'gemini-2.5-flash-preview', 0.15, 0.60, 0.039, 'Flash with image support'),
  ('gemini', 'gemini-2.5-flash-image-preview', 0.15, 0.60, 0.039, 'Flash specialized for images'),
  ('gemini', 'gemini-2.5-pro', 1.25, 10.00, NULL, 'Premium model (≤200k tokens)'),
  ('gemini', 'gemini-2.5-pro-preview', 1.25, 10.00, 0.039, 'Pro with image support'),
  ('gemini', 'gemini-3-pro-image-preview', 2.00, 12.00, 0.134, 'Next-gen Pro Image model'),
  ('openai', 'gpt-4o-mini', 0.15, 0.60, NULL, 'Fast and economical'),
  ('openai', 'gpt-4o', 2.50, 10.00, NULL, 'Complete model'),
  ('openai', 'o3-mini', 1.10, 4.40, NULL, 'Reasoning model')
ON CONFLICT (provider, model) 
DO UPDATE SET 
  input_price_per_1m = EXCLUDED.input_price_per_1m,
  output_price_per_1m = EXCLUDED.output_price_per_1m,
  image_price = EXCLUDED.image_price,
  notes = EXCLUDED.notes,
  updated_at = NOW();
