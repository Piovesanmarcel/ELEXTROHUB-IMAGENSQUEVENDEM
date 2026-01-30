-- Enable Row Level Security on sensitive tables
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bling ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_itens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for usuarios table
CREATE POLICY "Users can view their own data" ON public.usuarios
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.usuarios
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage all users" ON public.usuarios
  FOR ALL USING (auth.role() = 'service_role');

-- Create RLS policies for marketplace_integrations table
CREATE POLICY "Users can manage their own integrations" ON public.marketplace_integrations
  FOR ALL USING (auth.uid() = usuario_id);

CREATE POLICY "Service role can manage all integrations" ON public.marketplace_integrations
  FOR ALL USING (auth.role() = 'service_role');

-- Create RLS policies for bling table
CREATE POLICY "Authenticated users can manage bling tokens" ON public.bling
  FOR ALL USING (auth.role() = 'authenticated');

-- Create RLS policies for tokens table
CREATE POLICY "Service role can manage tokens" ON public.tokens
  FOR ALL USING (auth.role() = 'service_role');

-- Create RLS policies for webhook_events table
CREATE POLICY "Service role can manage webhook events" ON public.webhook_events
  FOR ALL USING (auth.role() = 'service_role');

-- Create RLS policies for pedidos_itens table
CREATE POLICY "Users can manage their order items" ON public.pedidos_itens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.pedidos p 
      WHERE p.id = pedidos_itens.pedido_id 
      AND p.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all order items" ON public.pedidos_itens
  FOR ALL USING (auth.role() = 'service_role');