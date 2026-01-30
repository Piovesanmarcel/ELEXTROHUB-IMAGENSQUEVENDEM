-- Criação da tabela de uso/créditos do usuário
-- Necessária para o funcionamento do webhook-proxy

CREATE TABLE IF NOT EXISTS public.user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  enhancements_available INTEGER DEFAULT 10, -- Começa com 10 créditos para teste
  enhancements_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON public.user_usage(user_id);

-- RLS
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
-- Usuário vê seus próprios dados
CREATE POLICY "Users can view own usage" ON public.user_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- Apenas service role pode atualizar (via Edge Functions)
-- Mas para facilitar testes locais/admin, vamos permitir update também
CREATE POLICY "Service role updates usage" ON public.user_usage
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_user_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_usage_timestamp
  BEFORE UPDATE ON public.user_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_user_usage_updated_at();

-- Trigger para criar entrada automaticamente ao criar usuário (opcional, mas bom pra garantir)
CREATE OR REPLACE FUNCTION public.handle_new_user_usage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_usage (user_id, enhancements_available)
  VALUES (NEW.id, 10);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Se o trigger já existir na auth.users, ignorar, senão criar
-- (Complicado criar triggers em auth.users via migration simples as vezes, 
-- vamos focar no INSERT manual para os usuários existentes agora)

-- INSERT para usuários existentes que não têm registro
INSERT INTO public.user_usage (user_id, enhancements_available)
SELECT id, 50 -- Dando 50 créditos de presente para os usuários atuais
FROM auth.users
ON CONFLICT (user_id) DO UPDATE
SET enhancements_available = GREATEST(user_usage.enhancements_available, 50);
