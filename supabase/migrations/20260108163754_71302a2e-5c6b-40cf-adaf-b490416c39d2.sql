-- Criar tabela para armazenar batches de imagens geradas pelo n8n
CREATE TABLE public.generated_images_batch (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  images JSONB DEFAULT '[]'::jsonb,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Criar índices para performance
CREATE INDEX idx_generated_images_batch_user_id ON public.generated_images_batch(user_id);
CREATE INDEX idx_generated_images_batch_job_id ON public.generated_images_batch(job_id);
CREATE INDEX idx_generated_images_batch_status ON public.generated_images_batch(status);

-- Habilitar RLS
ALTER TABLE public.generated_images_batch ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own batches"
ON public.generated_images_batch
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own batches"
ON public.generated_images_batch
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own batches"
ON public.generated_images_batch
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all batches"
ON public.generated_images_batch
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role');

-- Habilitar Realtime para notificações instantâneas
ALTER PUBLICATION supabase_realtime ADD TABLE public.generated_images_batch;