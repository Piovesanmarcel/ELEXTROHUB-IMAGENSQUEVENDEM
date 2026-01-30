-- PASSO 1: Remover duplicados mantendo apenas o registro mais recente de cada (product_id, user_id)
DELETE FROM public.ai_unified_results 
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY product_id, user_id ORDER BY updated_at DESC) as rn
    FROM public.ai_unified_results
  ) t
  WHERE t.rn > 1
);

-- PASSO 2: Adicionar constraint UNIQUE para prevenir futuros duplicados
ALTER TABLE public.ai_unified_results 
ADD CONSTRAINT ai_unified_results_product_user_unique 
UNIQUE (product_id, user_id);