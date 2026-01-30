-- Adicionar coluna display_order para ordenação manual
ALTER TABLE marketing_templates 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Atualizar ordem inicial baseada na criação dentro de cada categoria
UPDATE marketing_templates 
SET display_order = sub.rn 
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY category ORDER BY created_at) as rn 
  FROM marketing_templates
) sub 
WHERE marketing_templates.id = sub.id;