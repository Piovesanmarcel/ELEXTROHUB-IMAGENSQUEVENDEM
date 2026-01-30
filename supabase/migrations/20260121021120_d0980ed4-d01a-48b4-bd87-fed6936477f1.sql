-- Corrigir função trigger: novos usuários iniciam com 0 créditos (não 10)
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Criar registro de créditos com 0 créditos (sem bônus grátis)
  -- Créditos só são obtidos via compra (R$ 2,00 = 1 crédito)
  INSERT INTO public.user_credits (user_id, credits_balance, credits_used)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Zerar créditos dos usuários atuais (remover bônus grátis já concedido)
UPDATE public.user_credits SET credits_balance = 0, updated_at = now();