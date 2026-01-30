-- Adicionar coluna category à tabela marketing_templates
ALTER TABLE marketing_templates 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'Geral 01';

-- Dividir os templates existentes em duas categorias
-- Primeira metade vai para "Geral 01", segunda metade para "Geral 02"
WITH ordered_templates AS (
  SELECT id, 
         ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num,
         COUNT(*) OVER () as total_count
  FROM marketing_templates
  WHERE name NOT LIKE '%placeholder-reference%'
)
UPDATE marketing_templates
SET category = CASE 
  WHEN id IN (
    SELECT id FROM ordered_templates WHERE row_num <= (total_count / 2)
  ) THEN 'Geral 01'
  ELSE 'Geral 02'
END
WHERE name NOT LIKE '%placeholder-reference%';