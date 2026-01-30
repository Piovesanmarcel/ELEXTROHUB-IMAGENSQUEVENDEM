-- Tabela para armazenar múltiplas API Keys do Gemini por usuário
CREATE TABLE gemini_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_exhausted BOOLEAN DEFAULT false,
  exhausted_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(usuario_id, name)
);

-- Habilitar RLS
ALTER TABLE gemini_api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: usuários podem gerenciar suas próprias keys
CREATE POLICY "Users can manage their own API keys"
ON gemini_api_keys FOR ALL USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

-- Função para resetar keys exaustas após 24 horas
CREATE OR REPLACE FUNCTION reset_exhausted_gemini_keys()
RETURNS void AS $$
BEGIN
  UPDATE gemini_api_keys 
  SET is_exhausted = false, exhausted_at = NULL, updated_at = now()
  WHERE is_exhausted = true 
    AND exhausted_at < (now() - INTERVAL '24 hours');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_gemini_api_keys_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gemini_api_keys_timestamp
BEFORE UPDATE ON gemini_api_keys
FOR EACH ROW
EXECUTE FUNCTION update_gemini_api_keys_updated_at();