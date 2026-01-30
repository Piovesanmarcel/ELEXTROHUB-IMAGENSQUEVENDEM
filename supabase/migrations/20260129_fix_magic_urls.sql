-- Migração para corrigir URLs dos webhooks Mágica 1, 2 e 3
-- Baseado na confirmação do usuário

UPDATE public.webhook_configs
SET webhook_url = 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS01',
    updated_at = NOW()
WHERE webhook_type = 'vs_magica_1';

UPDATE public.webhook_configs
SET webhook_url = 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS02',
    updated_at = NOW()
WHERE webhook_type = 'vs_magica_2';

UPDATE public.webhook_configs
SET webhook_url = 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS03',
    updated_at = NOW()
WHERE webhook_type = 'vs_magica_3';

-- Garantir que os de Visual Pro e Expert também apontem para os mesmos lugares se forem os mesmos templates
UPDATE public.webhook_configs
SET webhook_url = 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS01',
    updated_at = NOW()
WHERE webhook_type IN ('vp_magica_1', 've_magica_1', 'vb_magica_1');

UPDATE public.webhook_configs
SET webhook_url = 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS02',
    updated_at = NOW()
WHERE webhook_type IN ('vp_magica_2', 've_magica_2', 'vb_magica_2');

UPDATE public.webhook_configs
SET webhook_url = 'https://nwh.visualvendas.cloud/webhook/generate-IMAGE-CANVAS03',
    updated_at = NOW()
WHERE webhook_type IN ('vp_magica_3', 've_magica_3', 'vb_magica_3');
