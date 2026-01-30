-- ============================================
-- ATUALIZAÇÃO DE TIMEOUTS DE WEBHOOKS
-- ============================================
-- Aumenta o timeout de todos os webhooks para 7 minutos (420000ms)
-- para evitar falhas em gerações mais lentas do n8n (Visual Start, Brand, etc)
-- ============================================

UPDATE public.webhook_configs
SET config = jsonb_set(config, '{timeout}', '420000'::jsonb)
WHERE config->>'timeout' IS NOT NULL;

-- Confirmação
DO $$
DECLARE
  count_updated INTEGER;
BEGIN
  GET DIAGNOSTICS count_updated = ROW_COUNT;
  RAISE NOTICE 'Atualizados % webhooks com novo timeout de 7 minutos (420000ms).', count_updated;
END $$;
