-- Tabela para registrar jobs autorizados pelo app
-- Apenas jobs registrados aqui serão aceitos pelo image-stream
CREATE TABLE IF NOT EXISTS public.authorized_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  expected_images INTEGER DEFAULT 8,
  received_images INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes'),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para performance
CREATE INDEX idx_authorized_jobs_job_id ON public.authorized_jobs(job_id);
CREATE INDEX idx_authorized_jobs_user_status ON public.authorized_jobs(user_id, status);
CREATE INDEX idx_authorized_jobs_expires ON public.authorized_jobs(expires_at);

-- Enable RLS
ALTER TABLE public.authorized_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own jobs
CREATE POLICY "Users can view own authorized jobs"
  ON public.authorized_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own jobs
CREATE POLICY "Users can create own authorized jobs"
  ON public.authorized_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own jobs
CREATE POLICY "Users can update own authorized jobs"
  ON public.authorized_jobs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role policy for edge functions
CREATE POLICY "Service role full access"
  ON public.authorized_jobs
  FOR ALL
  USING (true)
  WITH CHECK (true);