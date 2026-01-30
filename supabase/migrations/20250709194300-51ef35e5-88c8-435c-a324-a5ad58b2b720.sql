
-- Forçar atualização dos créditos para todos os usuários existentes
-- Primeiro, verificar se existe registro para usuários autenticados
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Para cada usuário na tabela usuarios, garantir que tenha registro de créditos
    FOR user_record IN SELECT id FROM public.usuarios LOOP
        -- Inserir ou atualizar créditos
        INSERT INTO public.user_enhancement_usage (user_id, enhancements_used, enhancements_available)
        VALUES (user_record.id, 0, 6500)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            enhancements_available = public.user_enhancement_usage.enhancements_available + 6000,
            updated_at = now();
    END LOOP;
END $$;

-- Também atualizar para qualquer usuário autenticado atualmente
INSERT INTO public.user_enhancement_usage (user_id, enhancements_used, enhancements_available)
SELECT auth.uid(), 0, 6500
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id) 
DO UPDATE SET 
    enhancements_available = public.user_enhancement_usage.enhancements_available + 6000,
    updated_at = now();
