-- Criar índice GIN na coluna tags para acelerar buscas em arrays
-- Isso melhora drasticamente a performance de queries com contains() em JSONB arrays
CREATE INDEX IF NOT EXISTS idx_hosted_images_tags 
ON public.hosted_images USING GIN (tags);

-- Adicionar índice composto para user_id + uploaded_at (usado frequentemente juntos)
CREATE INDEX IF NOT EXISTS idx_hosted_images_user_uploaded 
ON public.hosted_images (user_id, uploaded_at DESC);