-- Criar tabela brand_settings para configurações de logo global
CREATE TABLE public.brand_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  logo_url TEXT,
  logo_position TEXT DEFAULT 'top-right',
  logo_size INTEGER DEFAULT 100,
  show_logo_on_templates BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own brand settings
CREATE POLICY "Users can manage their own brand settings"
  ON public.brand_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Adicionar coluna disable_global_logo na tabela marketing_templates
ALTER TABLE public.marketing_templates 
ADD COLUMN disable_global_logo BOOLEAN DEFAULT false;