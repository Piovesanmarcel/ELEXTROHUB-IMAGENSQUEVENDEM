-- Create marketing-templates storage bucket for template images
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketing-templates', 'marketing-templates', true);

-- Create RLS policy to allow authenticated users to upload templates
CREATE POLICY "Authenticated users can upload template images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'marketing-templates');

-- Create RLS policy to allow public read access to template images
CREATE POLICY "Public access to template images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'marketing-templates');