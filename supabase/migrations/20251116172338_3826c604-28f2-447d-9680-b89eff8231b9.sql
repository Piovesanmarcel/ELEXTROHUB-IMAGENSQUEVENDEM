-- Adicionar campo ready_for_ads na tabela produtos
ALTER TABLE produtos 
ADD COLUMN ready_for_ads BOOLEAN DEFAULT false;

-- Adicionar índice para melhorar performance de queries com filtro
CREATE INDEX idx_produtos_ready_for_ads ON produtos(ready_for_ads) WHERE ready_for_ads = true;

-- Comentário explicativo
COMMENT ON COLUMN produtos.ready_for_ads IS 'Flag indicando que o produto está pronto para gerar anúncios premium em lote';