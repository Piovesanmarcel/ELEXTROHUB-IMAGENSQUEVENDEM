-- Tabela para configurações do site (YouTube, etc)
CREATE TABLE public.site_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- RLS
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar configurações
CREATE POLICY "Admins can manage site config"
ON public.site_config FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Leitura pública para configurações do site
CREATE POLICY "Anyone can read site config"
ON public.site_config FOR SELECT
TO anon, authenticated
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_site_config_updated_at
BEFORE UPDATE ON public.site_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir configurações iniciais do YouTube
INSERT INTO public.site_config (key, value, description) VALUES
('youtube_video_id', '', 'ID do vídeo YouTube da homepage'),
('youtube_video_title', 'Como a IA transforma suas fotos em anúncios profissionais', 'Título do vídeo');