-- STEP 1: Create clean table (fast operation)
CREATE TABLE public.image_generation_queue_clean (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  generation_type TEXT NOT NULL,
  input_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  priority INTEGER DEFAULT 1,
  result JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  credits_debited BOOLEAN DEFAULT false,
  locked_by TEXT,
  locked_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  queue_wait_time_ms INTEGER,
  processing_time_ms INTEGER
);