-- ============================================
-- FASE 1 - PARTE 3: Corrigir últimas políticas RLS permissivas
-- ============================================

-- 1. produtos - Service role já tem bypass, política redundante
DROP POLICY IF EXISTS "Permitir acesso total para service_role" ON produtos;

-- 2. sync_logs - Service role já tem bypass
DROP POLICY IF EXISTS "Permitir acesso total service_role logs" ON sync_logs;

-- 3. usuarios - Service role já tem bypass
DROP POLICY IF EXISTS "Permitir update via service_role" ON usuarios;

-- 4. referrals - Políticas de sistema precisam ser mais restritivas
DROP POLICY IF EXISTS "System can insert referrals" ON referrals;
DROP POLICY IF EXISTS "System can update referrals" ON referrals;

-- Criar políticas mais seguras para referrals
CREATE POLICY "Service role can insert referrals" 
ON referrals 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update referrals" 
ON referrals 
FOR UPDATE 
USING (auth.role() = 'service_role');

-- 5. sync_schedule_logs - Políticas de sistema precisam ser mais restritivas
DROP POLICY IF EXISTS "System can insert sync logs" ON sync_schedule_logs;
DROP POLICY IF EXISTS "System can update sync logs" ON sync_schedule_logs;

-- Criar políticas mais seguras para sync_schedule_logs
CREATE POLICY "Service role can insert sync logs" 
ON sync_schedule_logs 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update sync logs" 
ON sync_schedule_logs 
FOR UPDATE 
USING (auth.role() = 'service_role');