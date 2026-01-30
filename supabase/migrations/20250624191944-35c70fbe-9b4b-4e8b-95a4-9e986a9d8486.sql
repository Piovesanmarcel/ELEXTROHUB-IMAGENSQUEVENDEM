
-- Adicionar coluna marca na tabela usuarios para corrigir erro de sincronização
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS marca TEXT;
