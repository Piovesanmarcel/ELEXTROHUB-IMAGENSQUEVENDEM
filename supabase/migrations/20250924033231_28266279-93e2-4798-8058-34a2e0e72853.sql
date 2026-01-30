-- Create storage bucket for Runway reference images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('runway-references', 'runway-references', true);

-- Create policy to allow users to upload their own reference images
CREATE POLICY "Users can upload runway reference images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'runway-references' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to view their own reference images
CREATE POLICY "Users can view their runway reference images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'runway-references' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public access to runway reference images (needed for Runway API to access them)
CREATE POLICY "Public access to runway reference images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'runway-references');

-- Allow users to delete their own reference images  
CREATE POLICY "Users can delete their runway reference images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'runway-references' AND auth.uid()::text = (storage.foldername(name))[1]);