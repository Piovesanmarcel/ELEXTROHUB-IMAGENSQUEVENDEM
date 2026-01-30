-- ============================================================================
-- SISTEMA COMPLETO DE CRÉDITOS AUTOMÁTICOS (CORRIGIDO)
-- ============================================================================

-- ETAPA 1: Remover TODAS as duplicatas, mantendo apenas o registro mais antigo
DELETE FROM public.user_credits 
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) as rn
    FROM public.user_credits
  ) t WHERE rn > 1
);

-- ETAPA 2: Adicionar constraint UNIQUE em user_id (agora sem duplicatas)
ALTER TABLE public.user_credits 
DROP CONSTRAINT IF EXISTS user_credits_user_id_key;

ALTER TABLE public.user_credits 
ADD CONSTRAINT user_credits_user_id_key UNIQUE (user_id);

-- ETAPA 3: Backfill - adicionar 10 créditos para usuários que não têm registro
INSERT INTO public.user_credits (user_id, credits_balance, credits_used)
SELECT au.id, 10, 0
FROM auth.users au
LEFT JOIN public.user_credits uc ON au.id = uc.user_id
WHERE uc.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;