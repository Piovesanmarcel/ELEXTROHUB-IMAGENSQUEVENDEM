-- Migração para agrupar produtos com variações já sincronizados
-- Esta migração identifica produtos que são variações e cria produtos pai virtuais

-- PASSO 1: Identificar grupos de variações (produtos que compartilham um SKU pai)
-- Atualizar campo sku_pai para produtos que seguem o padrão de variação
UPDATE produtos
SET 
  sku_pai = CASE
    -- Padrão: SKU-NUMERO (ex: II00010-1, II00022-2)
    WHEN sku ~ '^([A-Z0-9-]+)-([0-9]+)$' THEN 
      REGEXP_REPLACE(sku, '-[0-9]+$', '')
    -- Padrão: SKU-LETRA (ex: II00019-P, II00019-GG)
    WHEN sku ~ '^([A-Z0-9-]+)-([A-Z]+)$' THEN 
      REGEXP_REPLACE(sku, '-[A-Z]+$', '')
    -- Padrão: SKU-CODIGO (ex: BC-082-PPS3P)
    WHEN sku ~ '^([A-Z0-9]+-[0-9]+)-([A-Z0-9]+)$' THEN 
      REGEXP_REPLACE(sku, '-[A-Z0-9]+$', '')
    ELSE sku
  END,
  tipo_produto = CASE
    WHEN sku ~ '^.+-[0-9A-Z]+$' AND sku_pai IS NULL THEN 'variacao'
    ELSE COALESCE(tipo_produto, 'simples')
  END
WHERE sku_pai IS NULL
  AND (
    sku ~ '^([A-Z0-9-]+)-([0-9]+)$' OR
    sku ~ '^([A-Z0-9-]+)-([A-Z]+)$' OR
    sku ~ '^([A-Z0-9]+-[0-9]+)-([A-Z0-9]+)$'
  );

-- PASSO 2: Para cada grupo de variações, criar um array JSON no campo variacoes do produto pai
-- Primeiro, vamos criar uma tabela temporária com as variações agrupadas
WITH variation_groups AS (
  SELECT 
    sku_pai,
    usuario_id,
    JSONB_AGG(
      JSONB_BUILD_OBJECT(
        'sku', sku,
        'bling_id', bling_id,
        'nome', nome,
        'estoque', COALESCE(estoque, 0),
        'preco', COALESCE(preco, 0),
        'preco_custo', COALESCE(preco_custo, 0),
        'imagens', ARRAY_REMOVE(ARRAY[
          imagem_url, imagem_url_2, imagem_url_3, imagem_url_4, imagem_url_5,
          imagem_url_6, imagem_url_7, imagem_url_8, imagem_url_9, imagem_url_10
        ], NULL),
        'atributos', '{}'::JSONB
      )
    ) as variacoes_json,
    SUM(COALESCE(estoque, 0)) as total_estoque,
    AVG(COALESCE(preco, 0)) as avg_preco,
    COUNT(*) as total_variacoes
  FROM produtos
  WHERE tipo_produto = 'variacao'
    AND sku_pai IS NOT NULL
  GROUP BY sku_pai, usuario_id
  HAVING COUNT(*) > 1
)
-- Inserir produtos pai para grupos que não têm um produto pai
INSERT INTO produtos (
  sku, sku_pai, nome, tipo_produto, usuario_id, variacoes,
  estoque, preco, preco_custo, situacao, atualizado_em
)
SELECT 
  vg.sku_pai as sku,
  vg.sku_pai as sku_pai,
  REGEXP_REPLACE(
    (SELECT nome FROM produtos WHERE sku_pai = vg.sku_pai LIMIT 1),
    '\([^)]+\)|\s+-\s+\d+\s+\w+|\s+(PP|P|M|G|GG|XG|XGG|XXG)\s*$',
    '',
    'gi'
  ) as nome,
  'variavel' as tipo_produto,
  vg.usuario_id,
  vg.variacoes_json as variacoes,
  vg.total_estoque as estoque,
  ROUND(vg.avg_preco::numeric, 2) as preco,
  (SELECT preco_custo FROM produtos WHERE sku_pai = vg.sku_pai LIMIT 1) as preco_custo,
  'Ativo' as situacao,
  NOW() as atualizado_em
FROM variation_groups vg
WHERE NOT EXISTS (
  SELECT 1 FROM produtos p 
  WHERE p.sku = vg.sku_pai AND p.usuario_id = vg.usuario_id
)
ON CONFLICT (sku, usuario_id) DO NOTHING;

-- PASSO 3: Atualizar produtos pai existentes com suas variações
WITH variation_groups AS (
  SELECT 
    sku_pai,
    usuario_id,
    JSONB_AGG(
      JSONB_BUILD_OBJECT(
        'sku', sku,
        'bling_id', bling_id,
        'nome', nome,
        'estoque', COALESCE(estoque, 0),
        'preco', COALESCE(preco, 0),
        'preco_custo', COALESCE(preco_custo, 0),
        'imagens', ARRAY_REMOVE(ARRAY[
          imagem_url, imagem_url_2, imagem_url_3, imagem_url_4, imagem_url_5,
          imagem_url_6, imagem_url_7, imagem_url_8, imagem_url_9, imagem_url_10
        ], NULL),
        'atributos', '{}'::JSONB
      )
    ) as variacoes_json,
    SUM(COALESCE(estoque, 0)) as total_estoque
  FROM produtos
  WHERE tipo_produto = 'variacao'
    AND sku_pai IS NOT NULL
  GROUP BY sku_pai, usuario_id
  HAVING COUNT(*) > 1
)
UPDATE produtos p
SET 
  variacoes = vg.variacoes_json,
  tipo_produto = 'variavel',
  estoque = vg.total_estoque
FROM variation_groups vg
WHERE p.sku = vg.sku_pai 
  AND p.usuario_id = vg.usuario_id;

-- Log da operação
INSERT INTO sync_logs (usuario_id, tipo, status, detalhes)
SELECT DISTINCT
  usuario_id,
  'produtos',
  'agrupamento_variacoes_concluido',
  JSONB_BUILD_OBJECT(
    'total_grupos', (
      SELECT COUNT(DISTINCT sku_pai) 
      FROM produtos 
      WHERE tipo_produto = 'variavel'
    ),
    'total_variacoes', (
      SELECT COUNT(*) 
      FROM produtos 
      WHERE tipo_produto = 'variacao'
    ),
    'timestamp', NOW()
  )
FROM produtos
WHERE tipo_produto IN ('variavel', 'variacao')
LIMIT 1;