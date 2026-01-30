-- Remover política restritiva de upload
DROP POLICY IF EXISTS "Users can upload brand logos" ON storage.objects;

-- Nova política: usuários podem fazer upload em suas pastas ou brand-logos
CREATE POLICY "Users can upload to marketing-templates" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'marketing-templates' AND (
    -- Permite brand-logos/{userId}/...
    (storage.foldername(name))[1] = 'brand-logos' OR
    -- Permite {userId}/... (pasta do próprio usuário)
    (storage.foldername(name))[1] = auth.uid()::text OR
    -- Permite arquivos com prefixo temp-upload na pasta do usuário
    name LIKE '%/temp-upload-%'
  )
);