
-- Add missing columns to produtos table for enhanced images persistence
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

-- Create index for enhanced images queries
CREATE INDEX IF NOT EXISTS idx_produtos_enhanced_at ON produtos(enhanced_at);

-- Create sync_schedule_logs table that's missing from the database
CREATE TABLE IF NOT EXISTS sync_schedule_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'running',
  products_synced INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for sync_schedule_logs
ALTER TABLE sync_schedule_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for sync_schedule_logs
CREATE POLICY "Users can view their own sync logs" ON sync_schedule_logs
  FOR SELECT USING (usuario_id = (SELECT id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "System can insert sync logs" ON sync_schedule_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update sync logs" ON sync_schedule_logs
  FOR UPDATE USING (true);
