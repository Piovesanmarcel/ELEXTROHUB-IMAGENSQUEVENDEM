-- Reset do estado de sincronização para forçar nova sincronização completa
UPDATE produtos_sync_state 
SET 
  status = 'pending',
  current_page = 1,
  total_pages = NULL,
  erro_msg = NULL,
  atualizado_em = now()
WHERE status = 'syncing';

-- Criar função para auto-reset de syncs travados
CREATE OR REPLACE FUNCTION public.reset_stuck_sync_states()
RETURNS INTEGER AS $$
DECLARE
  reset_count INTEGER := 0;
BEGIN
  -- Atualiza syncs que estão travados há mais de 1 hora
  UPDATE produtos_sync_state 
  SET 
    status = 'pending',
    current_page = 1,
    erro_msg = 'Auto-reset: sync travado por mais de 1 hora',
    atualizado_em = now()
  WHERE 
    status = 'syncing' 
    AND atualizado_em < (now() - INTERVAL '1 hour');
    
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  
  -- Registra o reset nos logs se houve mudanças
  IF reset_count > 0 THEN
    INSERT INTO sync_logs (usuario_id, tipo, status, detalhes)
    SELECT 
      usuario_id,
      'produtos',
      'auto_reset',
      jsonb_build_object(
        'motivo', 'sync_travado_mais_1h',
        'timestamp', now(),
        'reset_count', reset_count
      )
    FROM produtos_sync_state 
    WHERE status = 'pending' AND current_page = 1
    LIMIT reset_count;
  END IF;
  
  RETURN reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';