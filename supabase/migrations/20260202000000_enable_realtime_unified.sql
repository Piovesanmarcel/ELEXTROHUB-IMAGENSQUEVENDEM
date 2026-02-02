-- Enable Realtime for ai_unified_results
-- This is necessary for the frontend to receive updates via Supabase Realtime subscription
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'ai_unified_results'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_unified_results;
  END IF;
END $$;

-- Set replica identity to FULL to ensure all columns (like results JSONB) are sent in the Realtime payload
ALTER TABLE public.ai_unified_results REPLICA IDENTITY FULL;
