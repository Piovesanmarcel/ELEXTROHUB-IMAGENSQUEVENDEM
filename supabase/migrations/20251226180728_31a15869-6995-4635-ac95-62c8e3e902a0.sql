-- =====================================================
-- SISTEMA DE ROLES (Admin vs Usuário)
-- =====================================================

-- 1. Enum para tipos de role
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tabela de roles de usuários
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Função SECURITY DEFINER para verificar role (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Função para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- 6. RLS Policies para user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.is_admin(auth.uid()));

-- =====================================================
-- SISTEMA DE CRÉDITOS E ASSINATURAS
-- =====================================================

-- 7. Tabela de créditos do usuário
CREATE TABLE IF NOT EXISTS public.user_credits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    credits_balance INTEGER NOT NULL DEFAULT 0,
    credits_used INTEGER NOT NULL DEFAULT 0,
    last_purchase_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Tabela de histórico de compras de créditos
CREATE TABLE IF NOT EXISTS public.credit_purchases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    credits_amount INTEGER NOT NULL,
    price_paid DECIMAL(10,2) NOT NULL,
    stripe_payment_id TEXT,
    stripe_session_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. Tabela de histórico de uso de créditos
CREATE TABLE IF NOT EXISTS public.credit_usage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    credits_spent INTEGER NOT NULL,
    operation_type TEXT NOT NULL,
    operation_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 10. Enable RLS nas novas tabelas
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_usage ENABLE ROW LEVEL SECURITY;

-- 11. Políticas RLS para user_credits
CREATE POLICY "Users can view their own credits"
ON public.user_credits
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage credits"
ON public.user_credits
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all credits"
ON public.user_credits
FOR SELECT
USING (public.is_admin(auth.uid()));

-- 12. Políticas RLS para credit_purchases
CREATE POLICY "Users can view their own purchases"
ON public.credit_purchases
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases"
ON public.credit_purchases
FOR SELECT
USING (public.is_admin(auth.uid()));

-- 13. Políticas RLS para credit_usage
CREATE POLICY "Users can view their own usage"
ON public.credit_usage
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage"
ON public.credit_usage
FOR SELECT
USING (public.is_admin(auth.uid()));

-- 14. Trigger para atualizar updated_at
CREATE TRIGGER update_user_credits_updated_at
BEFORE UPDATE ON public.user_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 15. Função para criar créditos iniciais do usuário
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, credits_balance)
  VALUES (NEW.id, 10) -- 10 créditos iniciais gratuitos
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Verificar se é o admin
  IF NEW.email = 'piovesan.marcel@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 16. Trigger para executar ao criar usuário
DROP TRIGGER IF EXISTS on_auth_user_created_credits ON auth.users;
CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_credits();