-- Permitir admins verem todos os logs de custos de IA
CREATE POLICY "Admins can view all AI usage logs"
ON public.ai_usage_logs
FOR SELECT
TO public
USING (is_admin(auth.uid()));