-- Adicionar suporte a variações de produtos
-- Fase 1: Adicionar novos campos à tabela produtos

-- Adicionar campo para armazenar variações em formato JSON
ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS variacoes JSONB DEFAULT '[]'::jsonb;

-- Adicionar campo para identificar SKU pai
ALTER TABLE produtos
ADD COLUMN IF NOT EXISTS sku_pai TEXT;

-- Adicionar campo para identificar o tipo de produto
ALTER TABLE produtos
ADD COLUMN IF NOT EXISTS tipo_produto TEXT DEFAULT 'simples';

-- Criar índice para busca rápida por SKU pai
CREATE INDEX IF NOT EXISTS idx_produtos_sku_pai ON produtos(sku_pai);

-- Criar índice para busca por tipo de produto
CREATE INDEX IF NOT EXISTS idx_produtos_tipo_produto ON produtos(tipo_produto);

-- Comentários para documentação
COMMENT ON COLUMN produtos.variacoes IS 'Array JSON com variações do produto (cor, tamanho, estoque, preço, etc)';
COMMENT ON COLUMN produtos.sku_pai IS 'SKU do produto pai. Para produtos com variações, este campo identifica o SKU base';
COMMENT ON COLUMN produtos.tipo_produto IS 'Tipo do produto: "simples" (sem variações), "variavel" (produto pai com variações), ou "variacao" (é uma variação de outro produto)';