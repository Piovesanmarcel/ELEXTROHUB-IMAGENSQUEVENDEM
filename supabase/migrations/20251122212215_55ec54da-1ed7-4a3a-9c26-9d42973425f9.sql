-- Criar tabela de fila de geração de imagens
CREATE TABLE IF NOT EXISTS image_generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Tipo de geração
  generation_type TEXT NOT NULL CHECK (generation_type IN ('carousel', 'marketing')),
  
  -- Dados de entrada (JSON)
  input_data JSONB NOT NULL,
  
  -- Status do job
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Prioridade (0 = normal, 1 = alta, 2 = urgente)
  priority INTEGER DEFAULT 0,
  
  -- Resultado (URLs das imagens geradas)
  result JSONB,
  
  -- Erros
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Índices para performance
  CONSTRAINT valid_priority CHECK (priority >= 0 AND priority <= 2)
);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_queue_status_priority ON image_generation_queue(status, priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_queue_user ON image_generation_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_queue_created ON image_generation_queue(created_at DESC);

-- RLS Policies
ALTER TABLE image_generation_queue ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas seus próprios jobs
CREATE POLICY "Users can view own jobs"
  ON image_generation_queue FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem criar jobs
CREATE POLICY "Users can create jobs"
  ON image_generation_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role pode gerenciar todos os jobs
CREATE POLICY "Service role can manage all jobs"
  ON image_generation_queue FOR ALL
  USING (auth.role() = 'service_role');