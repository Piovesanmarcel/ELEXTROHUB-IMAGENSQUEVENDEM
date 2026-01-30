-- ============================================================================
-- SCRIPT: CONFIGURAR pg_cron PARA WORKERS
-- ============================================================================
-- 
-- IMPORTANTE: Antes de executar este script:
-- 1. Vá em Database → Extensions no Dashboard do Supabase
-- 2. Habilite a extensão: pg_cron
-- 3. Habilite a extensão: pg_net
-- 4. Depois execute este script no SQL Editor
--
-- SUBSTITUIR VALORES:
-- - uuvecdfazedifnixcjoo = seu project_id (já correto)
-- - YOUR_ANON_KEY = sua chave anon do Supabase
--   (obter em Project Settings → API → anon public)
--
-- ============================================================================

-- ============================================================================
-- WORKER 1: Executa a cada 30 segundos (minuto par :00 e :30)
-- ============================================================================

SELECT cron.schedule(
  'process-queue-worker-1',
  '*/1 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://uuvecdfazedifnixcjoo.supabase.co/functions/v1/process-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_ANON_KEY'
    ),
    body := '{"worker": 1, "batch_size": 10}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================================
-- WORKER 2: Executa também a cada minuto (com FOR UPDATE SKIP LOCKED, não há conflito)
-- ============================================================================

SELECT cron.schedule(
  'process-queue-worker-2',
  '*/1 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://uuvecdfazedifnixcjoo.supabase.co/functions/v1/process-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_ANON_KEY'
    ),
    body := '{"worker": 2, "batch_size": 10}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================================
-- WORKER DE LIMPEZA RÁPIDA: Executa a cada 5 minutos para liberar jobs presos
-- ============================================================================

SELECT cron.schedule(
  'cleanup-stuck-jobs',
  '*/5 * * * *',
  $$
  -- Resetar jobs processing travados há mais de 5 minutos (retry)
  UPDATE public.image_generation_queue
  SET status = 'pending',
      locked_at = NULL,
      started_at = NULL,
      retry_count = COALESCE(retry_count, 0) + 1
  WHERE status = 'processing'
    AND (
      locked_at IS NULL 
      OR locked_at < now() - interval '5 minutes'
    )
    AND COALESCE(retry_count, 0) < COALESCE(max_retries, 3);
  
  -- Marcar como FAILED jobs que excederam retries
  UPDATE public.image_generation_queue
  SET status = 'failed',
      error_message = 'Job expirou após múltiplas tentativas',
      completed_at = now()
  WHERE status = 'processing'
    AND (
      locked_at IS NULL 
      OR locked_at < now() - interval '5 minutes'
    )
    AND COALESCE(retry_count, 0) >= COALESCE(max_retries, 3);
    
  -- Marcar como CANCELLED jobs pending há mais de 30 minutos
  UPDATE public.image_generation_queue
  SET status = 'failed',
      error_message = 'Job cancelado por timeout na fila',
      completed_at = now()
  WHERE status = 'pending'
    AND created_at < now() - interval '30 minutes';
  $$
);

-- ============================================================================
-- WORKER DE LIMPEZA DE HISTÓRICO: Executa a cada 6 horas
-- ============================================================================

SELECT cron.schedule(
  'cleanup-old-history',
  '0 */6 * * *',
  $$
  DELETE FROM public.image_generation_queue
  WHERE status IN ('completed', 'failed')
    AND completed_at < now() - interval '7 days';
  $$
);

-- ============================================================================
-- VERIFICAR CRON JOBS CONFIGURADOS
-- ============================================================================

SELECT jobid, jobname, schedule, active 
FROM cron.job 
ORDER BY jobname;

-- ============================================================================
-- COMANDOS ÚTEIS
-- ============================================================================

-- Ver histórico de execuções:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- Remover cron jobs:
-- SELECT cron.unschedule('process-queue-worker-1');
-- SELECT cron.unschedule('process-queue-worker-2');
-- SELECT cron.unschedule('cleanup-old-jobs');

-- Pausar um cron job:
-- UPDATE cron.job SET active = false WHERE jobname = 'process-queue-worker-1';

-- Reativar um cron job:
-- UPDATE cron.job SET active = true WHERE jobname = 'process-queue-worker-1';

-- Ver status da fila:
-- SELECT status, COUNT(*) FROM image_generation_queue GROUP BY status;
