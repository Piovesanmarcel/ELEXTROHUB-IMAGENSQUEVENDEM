
-- Adicionar campos para armazenar imagens melhoradas
ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS imagem_melhorada_1 TEXT,
ADD COLUMN IF NOT EXISTS imagem_melhorada_2 TEXT,
ADD COLUMN IF NOT EXISTS imagem_melhorada_3 TEXT,
ADD COLUMN IF NOT EXISTS imagem_melhorada_4 TEXT,
ADD COLUMN IF NOT EXISTS imagem_melhorada_5 TEXT,
ADD COLUMN IF NOT EXISTS imagem_melhorada_6 TEXT,
ADD COLUMN IF NOT EXISTS imagem_melhorada_7 TEXT,
ADD COLUMN IF NOT EXISTS imagem_melhorada_8 TEXT,
ADD COLUMN IF NOT EXISTS imagem_melhorada_9 TEXT,
ADD COLUMN IF NOT EXISTS imagem_melhorada_10 TEXT,
ADD COLUMN IF NOT EXISTS enhanced_at TIMESTAMP WITH TIME ZONE;

-- Índice para consultas de imagens melhoradas
CREATE INDEX IF NOT EXISTS idx_produtos_enhanced_at ON produtos(enhanced_at);

-- Tabela para logs de sincronização automática
CREATE TABLE IF NOT EXISTS sync_schedule_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'running',
  products_synced INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para logs de sincronização
ALTER TABLE sync_schedule_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sync logs" ON sync_schedule_logs
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "System can insert sync logs" ON sync_schedule_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update sync logs" ON sync_schedule_logs
  FOR UPDATE USING (true);
