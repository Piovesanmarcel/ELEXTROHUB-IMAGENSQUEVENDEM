
-- Reset dos sync states para permitir nova sincronização
UPDATE produtos_sync_state 
SET 
  status = 'pending',
  current_page = 1,
  total_pages = NULL,
  erro_msg = NULL,
  atualizado_em = now()
WHERE status = 'done';

-- Opcional: Também resetar a data da última sincronização dos usuários
UPDATE usuarios 
SET ultima_sincronizacao = NULL 
WHERE bling_access_token IS NOT NULL;
