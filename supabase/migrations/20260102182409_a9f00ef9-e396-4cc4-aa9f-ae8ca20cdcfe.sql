-- Criar tabela brand_settings
CREATE TABLE public.brand_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  logo_url TEXT,
  logo_position TEXT DEFAULT 'top-right' 
    CHECK (logo_position IN ('top-left', 'top-right', 'bottom-left', 'bottom-right')),
  logo_size INTEGER DEFAULT 100 
    CHECK (logo_size >= 50 AND logo_size <= 200),
  show_logo_on_templates BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own brand settings" 
  ON public.brand_settings FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand settings" 
  ON public.brand_settings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand settings" 
  ON public.brand_settings FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand settings" 
  ON public.brand_settings FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger para updated_at automático
CREATE TRIGGER update_brand_settings_updated_at
  BEFORE UPDATE ON public.brand_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Criar bucket público para logos de marca
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marketing-templates',
  'marketing-templates',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
);

-- Política para upload (usuários autenticados em brand-logos/)
CREATE POLICY "Users can upload brand logos" 
  ON storage.objects FOR INSERT 
  TO authenticated
  WITH CHECK (
    bucket_id = 'marketing-templates' AND 
    (storage.foldername(name))[1] = 'brand-logos'
  );

-- Política para visualização pública
CREATE POLICY "Public can view marketing templates" 
  ON storage.objects FOR SELECT 
  TO public
  USING (bucket_id = 'marketing-templates');

-- Política para atualizar próprias logos
CREATE POLICY "Users can update own brand logos" 
  ON storage.objects FOR UPDATE 
  TO authenticated
  USING (
    bucket_id = 'marketing-templates' AND 
    auth.uid()::text = (storage.foldername(name))[2]
  );

-- Política para deletar próprias logos
CREATE POLICY "Users can delete own brand logos" 
  ON storage.objects FOR DELETE 
  TO authenticated
  USING (
    bucket_id = 'marketing-templates' AND 
    auth.uid()::text = (storage.foldername(name))[2]
  );