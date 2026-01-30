-- Habilitar Realtime para a tabela image_generation_queue
ALTER TABLE image_generation_queue REPLICA IDENTITY FULL;

-- Adicionar a tabela à publicação do Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE image_generation_queue;