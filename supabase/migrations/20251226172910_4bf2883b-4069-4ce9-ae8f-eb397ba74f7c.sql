-- 1. hosted_images - Armazena imagens hospedadas
CREATE TABLE IF NOT EXISTS public.hosted_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  r2_path TEXT,
  tags TEXT[] DEFAULT '{}',
  description TEXT,
  original_filename TEXT,
  product_id TEXT,
  template_id UUID,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for hosted_images
ALTER TABLE public.hosted_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hosted_images
CREATE POLICY "Users can view their own hosted images"
ON public.hosted_images FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hosted images"
ON public.hosted_images FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hosted images"
ON public.hosted_images FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hosted images"
ON public.hosted_images FOR DELETE
USING (auth.uid() = user_id);

-- 2. ai_unified_results - Resultados de IA unificados por produto
CREATE TABLE IF NOT EXISTS public.ai_unified_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id TEXT NOT NULL,
  results JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for ai_unified_results
ALTER TABLE public.ai_unified_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_unified_results
CREATE POLICY "Users can view their own ai unified results"
ON public.ai_unified_results FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ai unified results"
ON public.ai_unified_results FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ai unified results"
ON public.ai_unified_results FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ai unified results"
ON public.ai_unified_results FOR DELETE
USING (auth.uid() = user_id);

-- Unique constraint for product_id + user_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_unified_results_product_user 
ON public.ai_unified_results(product_id, user_id);

-- 3. produtos - Catálogo de produtos
CREATE TABLE IF NOT EXISTS public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  nome TEXT NOT NULL,
  sku TEXT,
  bling_id TEXT,
  descricao_curta TEXT,
  descricao_longa TEXT,
  preco DECIMAL(10,2),
  imagem_original TEXT,
  imagem_melhorada_1 TEXT,
  imagem_melhorada_2 TEXT,
  imagem_melhorada_3 TEXT,
  imagem_melhorada_4 TEXT,
  imagem_melhorada_5 TEXT,
  imagem_melhorada_6 TEXT,
  imagem_melhorada_7 TEXT,
  imagem_melhorada_8 TEXT,
  imagem_melhorada_9 TEXT,
  imagem_melhorada_10 TEXT,
  enhanced_at TIMESTAMPTZ,
  ready_for_ads BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for produtos
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for produtos
CREATE POLICY "Users can view their own produtos"
ON public.produtos FOR SELECT
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert their own produtos"
ON public.produtos FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own produtos"
ON public.produtos FOR UPDATE
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own produtos"
ON public.produtos FOR DELETE
USING (auth.uid() = usuario_id);

-- 4. marketing_templates - Templates de marketing
CREATE TABLE IF NOT EXISTS public.marketing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  config JSONB DEFAULT '{}',
  thumbnail_url TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for marketing_templates
ALTER TABLE public.marketing_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketing_templates (system templates are visible to all)
CREATE POLICY "Users can view system templates or their own"
ON public.marketing_templates FOR SELECT
USING (is_system = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own marketing templates"
ON public.marketing_templates FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own marketing templates"
ON public.marketing_templates FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own marketing templates"
ON public.marketing_templates FOR DELETE
USING (auth.uid() = user_id);

-- 5. usuarios - Configurações de usuário
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  bling_access_token TEXT,
  bling_refresh_token TEXT,
  bling_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for usuarios
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- RLS Policies for usuarios
CREATE POLICY "Users can view their own usuario config"
ON public.usuarios FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usuario config"
ON public.usuarios FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usuario config"
ON public.usuarios FOR UPDATE
USING (auth.uid() = user_id);

-- 6. Triggers for updated_at
CREATE TRIGGER update_ai_unified_results_updated_at
BEFORE UPDATE ON public.ai_unified_results
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_produtos_updated_at
BEFORE UPDATE ON public.produtos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketing_templates_updated_at
BEFORE UPDATE ON public.marketing_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at
BEFORE UPDATE ON public.usuarios
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();