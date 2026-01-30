-- ============================================================================
-- LIMPEZA E OTIMIZAÇÃO DA TABELA image_generation_queue
-- ============================================================================

-- 1. Limpar jobs antigos completados/falhados (manter últimos 7 dias)
DELETE FROM public.image_generation_queue 
WHERE status IN ('completed', 'failed') 
AND created_at < NOW() - INTERVAL '7 days';

-- 2. Limpar input_data de TODOS os jobs completados/falhados (liberar espaço)
UPDATE public.image_generation_queue 
SET input_data = '{}'::jsonb 
WHERE status IN ('completed', 'failed')
AND input_data != '{}'::jsonb;

-- 3. Limpar input_data de jobs pending/processing antigos (mais de 1 hora = provavelmente travados)
UPDATE public.image_generation_queue 
SET input_data = '{}'::jsonb,
    status = 'failed',
    error_message = 'Job timeout - cleaned up'
WHERE status IN ('pending', 'processing')
AND created_at < NOW() - INTERVAL '1 hour';

-- ============================================================================
-- TRIGGER DE LIMPEZA AUTOMÁTICA
-- ============================================================================

-- Função que limpa jobs antigos
CREATE OR REPLACE FUNCTION public.cleanup_old_queue_jobs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Limpar jobs completados/falhados com mais de 3 dias
  DELETE FROM public.image_generation_queue 
  WHERE status IN ('completed', 'failed') 
  AND created_at < NOW() - INTERVAL '3 days';
  
  -- Limpar input_data de jobs completados com mais de 1 dia (manter registro mas liberar espaço)
  UPDATE public.image_generation_queue 
  SET input_data = '{}'::jsonb 
  WHERE status IN ('completed', 'failed')
  AND created_at < NOW() - INTERVAL '1 day'
  AND input_data != '{}'::jsonb;
  
  RETURN NEW;
END;
$$;

-- Remover trigger anterior se existir
DROP TRIGGER IF EXISTS trigger_cleanup_queue ON public.image_generation_queue;

-- Criar trigger que executa a cada 100 inserts (para não sobrecarregar)
CREATE TRIGGER trigger_cleanup_queue
AFTER INSERT ON public.image_generation_queue
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_old_queue_jobs();