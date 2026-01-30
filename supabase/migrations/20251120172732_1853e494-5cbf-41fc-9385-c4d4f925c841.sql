-- Create marketing_templates table
CREATE TABLE IF NOT EXISTS public.marketing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  base_image_url TEXT NOT NULL,
  dimensions JSONB NOT NULL DEFAULT '{"width": 1200, "height": 1200}'::jsonb,
  zones JSONB NOT NULL DEFAULT '[]'::jsonb,
  color_scheme JSONB,
  detected_fonts TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read templates
CREATE POLICY "Public templates are viewable by everyone"
ON public.marketing_templates
FOR SELECT
TO public
USING (true);

-- Policy: Only authenticated users can insert templates
CREATE POLICY "Authenticated users can insert templates"
ON public.marketing_templates
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Only authenticated users can update templates
CREATE POLICY "Authenticated users can update templates"
ON public.marketing_templates
FOR UPDATE
TO authenticated
USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_marketing_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_marketing_templates_updated_at
BEFORE UPDATE ON public.marketing_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_marketing_templates_updated_at();