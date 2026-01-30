
-- Criar tabela para códigos de referral
CREATE TABLE public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  uses_count INTEGER DEFAULT 0 NOT NULL,
  max_uses INTEGER DEFAULT 100 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true NOT NULL
);

-- Criar tabela para rastrear indicações
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL, -- pending, completed, credited
  credits_awarded INTEGER DEFAULT 0,
  conversion_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(referred_user_id) -- Um usuário só pode ser indicado uma vez
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para referral_codes
CREATE POLICY "Users can view their own referral codes" 
  ON public.referral_codes 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral codes" 
  ON public.referral_codes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own referral codes" 
  ON public.referral_codes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Políticas RLS para referrals
CREATE POLICY "Users can view referrals they made" 
  ON public.referrals 
  FOR SELECT 
  USING (auth.uid() = referrer_user_id);

CREATE POLICY "Users can view their own referral status" 
  ON public.referrals 
  FOR SELECT 
  USING (auth.uid() = referred_user_id);

CREATE POLICY "System can insert referrals" 
  ON public.referrals 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "System can update referrals" 
  ON public.referrals 
  FOR UPDATE 
  USING (true);

-- Função para gerar código de referral único
CREATE OR REPLACE FUNCTION public.generate_referral_code(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_code TEXT;
  final_code TEXT;
  counter INTEGER := 0;
BEGIN
  -- Gerar código base usando os primeiros 6 caracteres do user_id
  base_code := upper(substring(replace(p_user_id::text, '-', ''), 1, 6));
  final_code := base_code;
  
  -- Verificar se o código já existe e adicionar sufixo se necessário
  WHILE EXISTS (SELECT 1 FROM public.referral_codes WHERE code = final_code) LOOP
    counter := counter + 1;
    final_code := base_code || counter::text;
  END LOOP;
  
  RETURN final_code;
END;
$$;

-- Função para processar indicação e creditar créditos
CREATE OR REPLACE FUNCTION public.process_referral_conversion(
  p_referred_user_id UUID,
  p_package_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  referral_record RECORD;
  credits_to_award INTEGER := 500;
BEGIN
  -- Buscar a indicação pendente
  SELECT * INTO referral_record
  FROM public.referrals
  WHERE referred_user_id = p_referred_user_id 
    AND status = 'pending';
    
  -- Se não há indicação, não fazer nada
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Marcar indicação como convertida
  UPDATE public.referrals 
  SET 
    status = 'completed',
    conversion_date = now()
  WHERE id = referral_record.id;
  
  -- Creditar os créditos para quem indicou
  UPDATE public.user_enhancement_usage 
  SET 
    enhancements_available = enhancements_available + credits_to_award,
    updated_at = now()
  WHERE user_id = referral_record.referrer_user_id;
  
  -- Inserir registro se o usuário indicador não existir na tabela de uso
  INSERT INTO public.user_enhancement_usage (user_id, enhancements_used, enhancements_available)
  VALUES (referral_record.referrer_user_id, 0, 500 + credits_to_award)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Marcar como creditado
  UPDATE public.referrals 
  SET 
    status = 'credited',
    credits_awarded = credits_to_award
  WHERE id = referral_record.id;
  
  RETURN TRUE;
END;
$$;

-- Função para registrar uma nova indicação
CREATE OR REPLACE FUNCTION public.register_referral(
  p_referral_code TEXT,
  p_referred_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  referrer_id UUID;
BEGIN
  -- Verificar se o código de referral existe e está ativo
  SELECT user_id INTO referrer_id
  FROM public.referral_codes
  WHERE code = p_referral_code 
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND uses_count < max_uses;
    
  -- Se código não encontrado ou inválido
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se o usuário não está tentando se auto-indicar
  IF referrer_id = p_referred_user_id THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se o usuário já foi indicado antes
  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_user_id = p_referred_user_id) THEN
    RETURN FALSE;
  END IF;
  
  -- Registrar a indicação
  INSERT INTO public.referrals (referrer_user_id, referred_user_id, referral_code, status)
  VALUES (referrer_id, p_referred_user_id, p_referral_code, 'pending');
  
  -- Incrementar contador de usos do código
  UPDATE public.referral_codes 
  SET uses_count = uses_count + 1
  WHERE code = p_referral_code;
  
  RETURN TRUE;
END;
$$;
