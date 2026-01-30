-- Adicionar novas colunas para compatibilidade com schema externo
ALTER TABLE marketing_templates 
ADD COLUMN IF NOT EXISTS template_key TEXT,
ADD COLUMN IF NOT EXISTS base_image_url TEXT,
ADD COLUMN IF NOT EXISTS dimensions JSONB DEFAULT '{"width": 1200, "height": 1200}',
ADD COLUMN IF NOT EXISTS zones JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS color_scheme JSONB,
ADD COLUMN IF NOT EXISTS detected_fonts TEXT[],
ADD COLUMN IF NOT EXISTS disable_global_logo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Criar índice único para template_key (permite NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketing_templates_template_key 
ON marketing_templates(template_key) WHERE template_key IS NOT NULL;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_marketing_templates_category ON marketing_templates(category);
CREATE INDEX IF NOT EXISTS idx_marketing_templates_display_order ON marketing_templates(display_order);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_marketing_templates_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_marketing_templates_updated_at ON marketing_templates;
CREATE TRIGGER update_marketing_templates_updated_at
  BEFORE UPDATE ON marketing_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_marketing_templates_updated_at();