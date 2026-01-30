
-- Create a table to track the sync progress for each user
CREATE TABLE IF NOT EXISTS public.produtos_sync_state (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  current_page integer NOT NULL DEFAULT 1,
  total_pages integer,
  status text NOT NULL DEFAULT 'pending', -- pending, syncing, done, error
  last_synced_at timestamp with time zone DEFAULT now(),
  erro_msg text,
  criado_em timestamp with time zone DEFAULT now(),
  atualizado_em timestamp with time zone DEFAULT now()
);

-- Unique so only one sync state per user
CREATE UNIQUE INDEX IF NOT EXISTS produtos_sync_state_usuario_idx ON public.produtos_sync_state(usuario_id);

-- For simple querying by status
CREATE INDEX IF NOT EXISTS produtos_sync_state_status_idx ON public.produtos_sync_state(status);

-- Optional: allow tracking sync progress/history at a more granular level
-- Add RLS: Only admins/service-role can access this table (since function runs as service)
ALTER TABLE public.produtos_sync_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage all sync states" 
  ON public.produtos_sync_state
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

