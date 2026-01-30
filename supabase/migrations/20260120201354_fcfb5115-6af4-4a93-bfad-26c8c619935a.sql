-- Add second YouTube video configuration keys
INSERT INTO public.site_config (key, value, description)
VALUES 
  ('youtube_video_id_2', NULL, 'ID do segundo vídeo YouTube na homepage'),
  ('youtube_video_title_2', 'Tutorial Passo a Passo', 'Título do segundo vídeo para acessibilidade')
ON CONFLICT (key) DO NOTHING;