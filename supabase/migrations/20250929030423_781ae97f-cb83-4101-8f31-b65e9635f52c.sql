-- Migração para padronizar tags das imagens hospedadas
-- Converte tags antigas (source:) para novo formato (ai-source:)

-- Função para migrar tags individuais de uma imagem
CREATE OR REPLACE FUNCTION migrate_hosted_image_tags()
RETURNS TABLE (
  id uuid,
  old_tags text[],
  new_tags text[]
) AS $$
DECLARE
  img_record record;
  old_tag text;
  new_tag_array text[] := '{}';
BEGIN
  -- Processar cada imagem hospedada
  FOR img_record IN 
    SELECT hi.id, hi.tags 
    FROM hosted_images hi 
    WHERE array_length(hi.tags, 1) > 0
  LOOP
    new_tag_array := '{}';
    
    -- Processar cada tag da imagem
    FOREACH old_tag IN ARRAY img_record.tags
    LOOP
      -- Migrar tags de source: para ai-source:
      IF old_tag LIKE 'source:%' THEN
        new_tag_array := array_append(new_tag_array, 'ai-' || old_tag);
      ELSE
        -- Manter tags que não precisam migrar
        new_tag_array := array_append(new_tag_array, old_tag);
      END IF;
    END LOOP;
    
    -- Atualizar a imagem se houve mudanças
    IF new_tag_array != img_record.tags THEN
      UPDATE hosted_images 
      SET tags = new_tag_array 
      WHERE hosted_images.id = img_record.id;
      
      -- Retornar registro da migração para log
      RETURN QUERY SELECT img_record.id, img_record.tags, new_tag_array;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Executar a migração
SELECT * FROM migrate_hosted_image_tags();

-- Função para corrigir file_size zerado
UPDATE hosted_images 
SET file_size = 1024000  -- 1MB padrão para imagens sem tamanho
WHERE file_size = 0 OR file_size IS NULL;