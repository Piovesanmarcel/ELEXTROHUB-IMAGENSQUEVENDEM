
-- Atualizar créditos de melhoria para o usuário atual
-- Adicionar 6000 créditos extras para testes
UPDATE public.user_enhancement_usage 
SET 
  enhancements_available = enhancements_available + 6000,
  updated_at = now()
WHERE user_id = auth.uid();

-- Se o usuário não tem registro ainda, criar um com os créditos extras
INSERT INTO public.user_enhancement_usage (user_id, enhancements_used, enhancements_available)
SELECT auth.uid(), 0, 6500
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_enhancement_usage WHERE user_id = auth.uid()
);
