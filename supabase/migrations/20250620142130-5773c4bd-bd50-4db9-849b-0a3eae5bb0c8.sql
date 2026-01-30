
-- Criar tabela para rastrear uso de melhorias de imagem por usuário
CREATE TABLE public.user_enhancement_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  enhancements_used INTEGER DEFAULT 0 NOT NULL,
  enhancements_available INTEGER DEFAULT 500 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Criar tabela para rastrear compras de pacotes de melhorias
CREATE TABLE public.enhancement_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  package_type TEXT DEFAULT 'extra_500' NOT NULL,
  price_brl DECIMAL(10,2) DEFAULT 39.90 NOT NULL,
  enhancements_added INTEGER DEFAULT 500 NOT NULL,
  stripe_session_id TEXT,
  payment_status TEXT DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.user_enhancement_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhancement_packages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_enhancement_usage
CREATE POLICY "Users can view their own enhancement usage" 
  ON public.user_enhancement_usage 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own enhancement usage" 
  ON public.user_enhancement_usage 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own enhancement usage" 
  ON public.user_enhancement_usage 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para enhancement_packages
CREATE POLICY "Users can view their own enhancement packages" 
  ON public.enhancement_packages 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own enhancement packages" 
  ON public.enhancement_packages 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Função para inicializar uso de melhorias para novos usuários
CREATE OR REPLACE FUNCTION public.initialize_user_enhancement_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_enhancement_usage (user_id, enhancements_used, enhancements_available)
  VALUES (NEW.id, 0, 500)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger para inicializar automaticamente quando um usuário se registra
CREATE TRIGGER on_auth_user_created_enhancement_usage
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.initialize_user_enhancement_usage();

-- Função para atualizar contadores após compra de pacote
CREATE OR REPLACE FUNCTION public.add_enhancement_package(
  p_user_id UUID,
  p_package_id UUID,
  p_enhancements_to_add INTEGER DEFAULT 500
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar status do pacote para 'paid'
  UPDATE public.enhancement_packages 
  SET payment_status = 'paid', updated_at = now()
  WHERE id = p_package_id AND user_id = p_user_id;
  
  -- Adicionar melhorias disponíveis
  UPDATE public.user_enhancement_usage 
  SET 
    enhancements_available = enhancements_available + p_enhancements_to_add,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Inserir registro se não existir
  INSERT INTO public.user_enhancement_usage (user_id, enhancements_used, enhancements_available)
  VALUES (p_user_id, 0, 500 + p_enhancements_to_add)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$;

-- Função para decrementar contador de melhorias
CREATE OR REPLACE FUNCTION public.use_enhancement_credit(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_available INTEGER;
BEGIN
  -- Verificar melhorias disponíveis
  SELECT enhancements_available INTO current_available
  FROM public.user_enhancement_usage
  WHERE user_id = p_user_id;
  
  -- Se não encontrou o usuário, inicializar
  IF current_available IS NULL THEN
    INSERT INTO public.user_enhancement_usage (user_id, enhancements_used, enhancements_available)
    VALUES (p_user_id, 0, 500);
    current_available := 500;
  END IF;
  
  -- Verificar se tem créditos disponíveis
  IF current_available > 0 THEN
    UPDATE public.user_enhancement_usage 
    SET 
      enhancements_used = enhancements_used + 1,
      enhancements_available = enhancements_available - 1,
      updated_at = now()
    WHERE user_id = p_user_id;
    
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;
