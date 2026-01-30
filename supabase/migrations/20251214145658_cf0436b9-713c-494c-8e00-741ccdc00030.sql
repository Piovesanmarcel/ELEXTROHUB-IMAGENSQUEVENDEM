-- Template 54150392: Atualizar zonas de texto para usar copywriting.characteristics (Seção 3)
-- Este template tem 8 bullet-points que devem mostrar características

UPDATE marketing_templates 
SET zones = (
  SELECT jsonb_agg(
    CASE 
      WHEN zone->>'id' LIKE 'bullet-point-%' THEN 
        jsonb_set(zone, '{dataSource}', '"copywriting.characteristics"')
      ELSE zone
    END
  )
  FROM jsonb_array_elements(zones) AS zone
)
WHERE id = '54150392-0640-4918-93c0-6c680c3f9431';

-- Template 2dca34a7: Atualizar zona benefits-box para usar copywriting.benefits (Seção 5)
UPDATE marketing_templates 
SET zones = (
  SELECT jsonb_agg(
    CASE 
      WHEN zone->>'id' = 'benefits-box' THEN 
        jsonb_set(zone, '{dataSource}', '"copywriting.benefits"')
      ELSE zone
    END
  )
  FROM jsonb_array_elements(zones) AS zone
)
WHERE id = '2dca34a7-1e65-4683-a19d-a889fe4d25d7';

-- Template be9a0b03: Atualizar zona description-product para usar copywriting.environments (Seção 9)
UPDATE marketing_templates 
SET zones = (
  SELECT jsonb_agg(
    CASE 
      WHEN zone->>'id' = 'description-product' THEN 
        jsonb_set(zone, '{dataSource}', '"copywriting.environments"')
      ELSE zone
    END
  )
  FROM jsonb_array_elements(zones) AS zone
)
WHERE id = 'be9a0b03-219f-4664-a539-8b48744ce0c9';