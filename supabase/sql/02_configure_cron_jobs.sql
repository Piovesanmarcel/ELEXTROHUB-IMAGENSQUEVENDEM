-- ============================================================================
-- SCRIPT 2: CONFIGURAR CRON JOBS PARA PROCESS-QUEUE
-- ============================================================================
-- IMPORTANTE: Execute este script APÓS habilitar as extensões:
-- 1. Vá em Database → Extensions no Dashboard do Supabase
-- 2. Habilite: pg_cron e pg_net
-- 3. Então execute este script
-- ============================================================================

-- Substituir valores:
-- bpqtzydsxmjazdzzcvno = seu project_id (já correto para este projeto)
-- YOUR_ANON_KEY = sua chave anon do Supabase (obter em Project Settings → API)

-- ============================================================================
-- WORKER 1: Executa a cada minuto
-- ============================================================================

SELECT cron.schedule(
  'process-queue-worker-1',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://bpqtzydsxmjazdzzcvno.supabase.co/functions/v1/process-queue',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{"worker": 1}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================================
-- WORKER 2: Executa também a cada minuto (com FOR UPDATE SKIP LOCKED, não há conflito)
-- ============================================================================

SELECT cron.schedule(
  'process-queue-worker-2',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://bpqtzydsxmjazdzzcvno.supabase.co/functions/v1/process-queue',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{"worker": 2}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================================
-- VERIFICAR CRON JOBS CONFIGURADOS
-- ============================================================================

SELECT * FROM cron.job ORDER BY jobname;

-- ============================================================================
-- COMANDOS ÚTEIS
-- ============================================================================

-- Ver histórico de execuções:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- Remover cron jobs:
-- SELECT cron.unschedule('process-queue-worker-1');
-- SELECT cron.unschedule('process-queue-worker-2');

-- Pausar um cron job:
-- UPDATE cron.job SET active = false WHERE jobname = 'process-queue-worker-1';

-- Reativar um cron job:
-- UPDATE cron.job SET active = true WHERE jobname = 'process-queue-worker-1';
