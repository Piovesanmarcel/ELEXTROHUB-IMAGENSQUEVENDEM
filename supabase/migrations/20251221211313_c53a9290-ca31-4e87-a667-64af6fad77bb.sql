-- Adicionar colunas de rastreamento de sincronização de estoque
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS grupo_replicacao uuid DEFAULT NULL;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS estoque_sincronizado_em timestamp with time zone DEFAULT NULL;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS estoque_sincronizado_de uuid DEFAULT NULL;

-- Criar índice para performance nas buscas por grupo
CREATE INDEX IF NOT EXISTS idx_produtos_grupo_replicacao ON produtos(grupo_replicacao) WHERE grupo_replicacao IS NOT NULL;

-- Função que sincroniza estoque entre produtos do mesmo grupo
CREATE OR REPLACE FUNCTION sync_replicated_stock()
RETURNS TRIGGER AS $$
DECLARE
  max_stock INTEGER;
  max_stock_product_id UUID;
BEGIN
  -- Só executa se:
  -- 1. O produto pertence a um grupo de replicação
  -- 2. O estoque foi alterado
  IF NEW.grupo_replicacao IS NOT NULL AND 
     (OLD.estoque IS DISTINCT FROM NEW.estoque) THEN
    
    -- Encontrar o maior estoque no grupo (incluindo o novo valor)
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
    
    -- Atualizar todos os outros produtos do grupo com o maior estoque
    UPDATE produtos
    SET 
      estoque = max_stock,
      estoque_sincronizado_em = now(),
      estoque_sincronizado_de = max_stock_product_id
    WHERE grupo_replicacao = NEW.grupo_replicacao
      AND id != NEW.id
      AND (estoque IS DISTINCT FROM max_stock);
      
    -- Se o produto atual não é a fonte do maior estoque, atualizar ele também
    IF NEW.id != max_stock_product_id AND NEW.estoque != max_stock THEN
      NEW.estoque := max_stock;
      NEW.estoque_sincronizado_em := now();
      NEW.estoque_sincronizado_de := max_stock_product_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Dropar trigger se existir para recriar
DROP TRIGGER IF EXISTS trigger_sync_replicated_stock ON produtos;

-- Trigger que executa antes de update de estoque
CREATE TRIGGER trigger_sync_replicated_stock
BEFORE UPDATE OF estoque ON produtos
FOR EACH ROW
EXECUTE FUNCTION sync_replicated_stock();