-- 1. Remover o trigger atual que causa recursão
DROP TRIGGER IF EXISTS trigger_sync_replicated_stock ON produtos;

-- 2. Recriar a função com proteção anti-recursão
CREATE OR REPLACE FUNCTION public.sync_replicated_stock()
RETURNS TRIGGER AS $$
DECLARE
  max_stock INTEGER;
  max_stock_product_id UUID;
  is_syncing BOOLEAN;
BEGIN
  -- Verificar se já estamos em processo de sincronização
  -- Usamos um campo especial para evitar recursão
  IF NEW.grupo_replicacao IS NOT NULL AND 
     (OLD.estoque IS DISTINCT FROM NEW.estoque) AND
     NEW.estoque_sincronizado_de IS NULL THEN
    
    -- Encontrar o maior estoque no grupo
    SELECT p.id, p.estoque INTO max_stock_product_id, max_stock
    FROM produtos p
    WHERE p.grupo_replicacao = NEW.grupo_replicacao
    ORDER BY p.estoque DESC NULLS LAST
    LIMIT 1;
    
    -- Se o novo estoque é o maior, usar ele
    IF NEW.estoque > COALESCE(max_stock, 0) THEN
      max_stock := NEW.estoque;
      max_stock_product_id := NEW.id;
    END IF;
    
    -- Atualizar o registro atual se necessário
    IF NEW.id != max_stock_product_id AND NEW.estoque != max_stock THEN
      NEW.estoque := max_stock;
      NEW.estoque_sincronizado_em := now();
      NEW.estoque_sincronizado_de := max_stock_product_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 3. Recriar o trigger
CREATE TRIGGER trigger_sync_replicated_stock
BEFORE UPDATE OF estoque ON produtos
FOR EACH ROW
EXECUTE FUNCTION sync_replicated_stock();

-- 4. Agora fazer a migração retroativa SEM disparar o trigger
-- Primeiro: Criar grupo_replicacao para produtos origem
WITH grupos_replicados AS (
  SELECT 
    (ai.results->>'replicado_de')::uuid as origem_id,
    array_agg(DISTINCT ai.product_id::uuid) as destinos_ids
  FROM ai_unified_results ai
  WHERE ai.results->>'replicado_de' IS NOT NULL
    AND (ai.results->>'replicado_de') != ''
  GROUP BY ai.results->>'replicado_de'
)
UPDATE produtos p
SET grupo_replicacao = gen_random_uuid()
FROM grupos_replicados g
WHERE p.id = g.origem_id
  AND p.grupo_replicacao IS NULL;

-- 5. Copiar grupo_replicacao da origem para destinos
WITH grupos_replicados AS (
  SELECT 
    (ai.results->>'replicado_de')::uuid as origem_id,
    ai.product_id::uuid as destino_id
  FROM ai_unified_results ai
  WHERE ai.results->>'replicado_de' IS NOT NULL
    AND (ai.results->>'replicado_de') != ''
),
origem_grupos AS (
  SELECT p.id, p.grupo_replicacao
  FROM produtos p
  WHERE p.grupo_replicacao IS NOT NULL
)
UPDATE produtos p
SET grupo_replicacao = og.grupo_replicacao
FROM grupos_replicados gr
JOIN origem_grupos og ON og.id = gr.origem_id
WHERE p.id = gr.destino_id
  AND p.grupo_replicacao IS NULL;

-- 6. Sincronizar estoques usando UPDATE direto com estoque_sincronizado_de preenchido
-- (isso evita que o trigger dispare recursivamente)
WITH max_estoques AS (
  SELECT DISTINCT ON (grupo_replicacao)
    grupo_replicacao,
    estoque as max_estoque,
    id as fonte_id
  FROM produtos
  WHERE grupo_replicacao IS NOT NULL
    AND estoque IS NOT NULL
  ORDER BY grupo_replicacao, estoque DESC NULLS LAST
)
UPDATE produtos p
SET 
  estoque = m.max_estoque,
  estoque_sincronizado_em = now(),
  estoque_sincronizado_de = m.fonte_id
FROM max_estoques m
WHERE p.grupo_replicacao = m.grupo_replicacao
  AND p.id != m.fonte_id
  AND (p.estoque IS DISTINCT FROM m.max_estoque OR p.estoque IS NULL);