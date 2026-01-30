-- Phase 1: Critical Database Security Fixes

-- Enable Row Level Security on missing tables
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for marketplace_listings
CREATE POLICY "Users can manage listings through their integrations" ON public.marketplace_listings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_integrations mi 
      WHERE mi.id = marketplace_listings.marketplace_integration_id 
      AND mi.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all listings" ON public.marketplace_listings
  FOR ALL USING (auth.role() = 'service_role');

-- Create RLS policies for marketplace_orders  
CREATE POLICY "Users can view orders through their integrations" ON public.marketplace_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_integrations mi 
      WHERE mi.id = marketplace_orders.marketplace_integration_id 
      AND mi.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all orders" ON public.marketplace_orders
  FOR ALL USING (auth.role() = 'service_role');

-- Fix database functions security by adding search_path
CREATE OR REPLACE FUNCTION public.initialize_user_enhancement_usage()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_enhancement_usage (user_id, enhancements_used, enhancements_available)
  VALUES (NEW.id, 0, 500)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_enhancement_package(p_user_id uuid, p_package_id uuid, p_enhancements_to_add integer DEFAULT 500)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.use_enhancement_credit(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.generate_referral_code(p_user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.process_referral_conversion(p_referred_user_id uuid, p_package_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.register_referral(p_referral_code text, p_referred_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;