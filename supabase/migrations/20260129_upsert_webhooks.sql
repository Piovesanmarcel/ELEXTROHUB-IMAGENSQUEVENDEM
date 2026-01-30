-- ============================================
-- CORREÇÃO DEFINITIVA DE WEBHOOKS
-- ============================================
-- Usa INSERT ... ON CONFLICT para garantir que os registros existam
-- mesmo que a tabela estivesse vazia antes.

INSERT INTO public.webhook_configs (webhook_type, display_name, webhook_url, description, credits_cost, config)
VALUES
  -- Visual Start - Imagens Mágicas (URLs CORRIGIDAS)
  ('vs_magica_1', 'Visual Start - Mágica 1', 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS01', 'Template mágica com logo #1', 1, '{"timeout": 120000, "retry": 2, "package": "visual_start", "template": true}'::jsonb),
  ('vs_magica_2', 'Visual Start - Mágica 2', 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS02', 'Template mágica com logo #2', 1, '{"timeout": 120000, "retry": 2, "package": "visual_start", "template": true}'::jsonb),
  ('vs_magica_3', 'Visual Start - Mágica 3', 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS03', 'Template mágica com logo #3', 1, '{"timeout": 120000, "retry": 2, "package": "visual_start", "template": true}'::jsonb),

  -- Visual Start - Imagens Base (URLs Padrão - Se tiver as corretas, avise)
  ('vs_fundo_branco', 'Visual Start - Fundo Branco', 'https://nwh.visualvendas.cloud/webhook/c9e47c8b-8095-4ada-96ab-d64c4d604a91', 'Imagem com fundo branco profissional', 1, '{"timeout": 120000, "retry": 2, "package": "visual_start"}'::jsonb),
  ('vs_ambientada', 'Visual Start - Ambientada', 'https://nwh.visualvendas.cloud/webhook/882659cc-55c2-409d-a79c-894b395e9724', 'Imagem ambientada em cenário', 1, '{"timeout": 120000, "retry": 2, "package": "visual_start"}'::jsonb),

  -- Replicar para outros pacotes se necessário (Visual Pro, etc) usa as mesmas URLs
  ('vp_magica_1', 'Visual Pro - Mágica 1', 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS01', 'Template mágica #1', 1, '{"timeout": 120000, "retry": 2, "package": "visual_start", "template": true}'::jsonb),
  ('vp_magica_2', 'Visual Pro - Mágica 2', 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS02', 'Template mágica #2', 1, '{"timeout": 120000, "retry": 2, "package": "visual_start", "template": true}'::jsonb),
  ('vp_magica_3', 'Visual Pro - Mágica 3', 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS03', 'Template mágica #3', 1, '{"timeout": 120000, "retry": 2, "package": "visual_start", "template": true}'::jsonb)

ON CONFLICT (webhook_type) DO UPDATE SET
  webhook_url = EXCLUDED.webhook_url,
  credits_cost = EXCLUDED.credits_cost,
  config = EXCLUDED.config,
  updated_at = NOW();
