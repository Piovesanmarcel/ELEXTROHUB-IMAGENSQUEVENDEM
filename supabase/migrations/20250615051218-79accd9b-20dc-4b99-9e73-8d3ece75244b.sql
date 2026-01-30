
-- Adiciona índice único para permitir upsert na tabela produtos usando (usuario_id, bling_id)
CREATE UNIQUE INDEX IF NOT EXISTS produtos_usuario_id_bling_id_key ON public.produtos(usuario_id, bling_id);

