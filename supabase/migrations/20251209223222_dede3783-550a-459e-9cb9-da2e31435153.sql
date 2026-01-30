-- Adicionar colunas product_id e template_id na tabela hosted_images
ALTER TABLE hosted_images 
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES marketing_templates(id) ON DELETE SET NULL;

-- Criar índices para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_hosted_images_product_id ON hosted_images(product_id);
CREATE INDEX IF NOT EXISTS idx_hosted_images_template_id ON hosted_images(template_id);