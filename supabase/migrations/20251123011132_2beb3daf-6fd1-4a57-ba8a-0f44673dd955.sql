-- Fase 1: Criar produtos pai virtuais quando não existem
INSERT INTO produtos (
  sku, sku_pai, nome, tipo_produto, usuario_id, 
  estoque, preco, preco_custo, situacao, unidade, atualizado_em, variacoes
)
SELECT DISTINCT ON (sku_pai)
  sku_pai as sku,
  sku_pai,
  -- Remover atributos específicos do nome (cores, tamanhos, etc)
  TRIM(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(nome, '\([^)]+\)', '', 'g'),
        '\s+-\s+\d+\s+\w+', '', 'g'
      ),
      '\s+(P|M|G|GG|XG|XGG)\s*$', '', 'gi'
    )
  ) as nome,
  'variavel' as tipo_produto,
  usuario_id,
  0 as estoque,
  preco,
  preco_custo,
  situacao,
  unidade,
  NOW() as atualizado_em,
  '[]'::jsonb as variacoes
FROM produtos
WHERE tipo_produto = 'variacao' 
  AND sku_pai IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM produtos p2 
    WHERE p2.sku = produtos.sku_pai
  )
ON CONFLICT (sku, usuario_id) DO NOTHING;

-- Fase 2: Agregar variações no JSONB e calcular estoque total
WITH variacoes_agrupadas AS (
  SELECT 
    sku_pai,
    usuario_id,
    jsonb_agg(
      jsonb_build_object(
        'sku', sku,
        'bling_id', bling_id,
        'nome', nome,
        'estoque', COALESCE(estoque, 0),
        'preco', COALESCE(preco, 0),
        'preco_custo', COALESCE(preco_custo, 0),
        'imagens', (
          SELECT jsonb_agg(url ORDER BY idx)
          FROM (
            SELECT url, idx FROM (
              VALUES 
                (imagem_url, 1), (imagem_url_2, 2), (imagem_url_3, 3),
                (imagem_url_4, 4), (imagem_url_5, 5), (imagem_url_6, 6),
                (imagem_url_7, 7), (imagem_url_8, 8), (imagem_url_9, 9),
                (imagem_url_10, 10)
            ) AS imgs(url, idx)
            WHERE url IS NOT NULL
          ) AS filtered_imgs
        ),
        'atributos', jsonb_build_object(
          'cor', COALESCE(
            NULLIF(REGEXP_REPLACE(nome, '^.*\(([^)]+)\).*$', '\1'), nome),
            ''
          )
        )
      ) ORDER BY sku
    ) as variacoes_json,
    SUM(COALESCE(estoque, 0)) as estoque_total,
    AVG(COALESCE(preco, 0)) as preco_medio,
    COUNT(*) as num_variacoes
  FROM produtos
  WHERE tipo_produto = 'variacao'
    AND sku_pai IS NOT NULL
  GROUP BY sku_pai, usuario_id
)
UPDATE produtos p
SET 
  variacoes = va.variacoes_json,
  estoque = va.estoque_total,
  preco = ROUND(va.preco_medio, 2),
  tipo_produto = 'variavel',
  atualizado_em = NOW()
FROM variacoes_agrupadas va
WHERE p.sku = va.sku_pai
  AND p.usuario_id = va.usuario_id;

-- Validação: Log de resultados
DO $$
DECLARE
  total_pais INTEGER;
  total_vars INTEGER;
BEGIN
  SELECT 
    COUNT(*),
    SUM(jsonb_array_length(variacoes))
  INTO total_pais, total_vars
  FROM produtos
  WHERE tipo_produto = 'variavel'
    AND variacoes IS NOT NULL
    AND jsonb_array_length(variacoes) > 0;
    
  RAISE NOTICE 'Agrupamento concluído: % produtos pai com % variações totais', total_pais, total_vars;
END $$;