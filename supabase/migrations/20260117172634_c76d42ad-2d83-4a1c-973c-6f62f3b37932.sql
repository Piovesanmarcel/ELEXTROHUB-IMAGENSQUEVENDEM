-- ============================================
-- FASE 1 - PARTE 2: Corrigir funções restantes
-- ============================================

-- Adicionar search_path às funções de trigger restantes
ALTER FUNCTION update_gemini_api_keys_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION update_marketing_templates_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION update_marketplace_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION update_pedidos_itens_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION update_sync_timestamp() SET search_path = public, pg_temp;

-- ============================================
-- Corrigir políticas RLS de marketing_templates
-- Templates são PÚBLICOS para leitura (intencional)
-- Mas INSERT/UPDATE/DELETE devem ser restritos a admins
-- ============================================

-- Remover políticas permissivas de escrita
DROP POLICY IF EXISTS "Authenticated users can delete templates" ON marketing_templates;
DROP POLICY IF EXISTS "Authenticated users can insert templates" ON marketing_templates;
DROP POLICY IF EXISTS "Authenticated users can update templates" ON marketing_templates;

-- Criar políticas restritivas para admins apenas
CREATE POLICY "Admins can insert templates" 
ON marketing_templates 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'::app_role
  )
);

CREATE POLICY "Admins can update templates" 
ON marketing_templates 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'::app_role
  )
);

CREATE POLICY "Admins can delete templates" 
ON marketing_templates 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'::app_role
  )
);