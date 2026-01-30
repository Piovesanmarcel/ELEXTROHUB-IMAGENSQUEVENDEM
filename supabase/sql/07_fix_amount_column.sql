-- ============================================================================
-- CORREÇÃO: Adicionar coluna 'amount' que está faltando
-- Execute este script no Supabase SQL Editor
-- ============================================================================

-- Adicionar coluna amount se não existir
ALTER TABLE public.credit_reservations 
ADD COLUMN IF NOT EXISTS amount INTEGER NOT NULL DEFAULT 1;

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'credit_reservations'
ORDER BY ordinal_position;
