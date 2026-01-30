-- Create processed_callbacks table for deduplication
CREATE TABLE processed_callbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  callback_hash TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_processed_callbacks_hash ON processed_callbacks(callback_hash);
CREATE INDEX idx_processed_callbacks_processed_at ON processed_callbacks(processed_at);
CREATE INDEX idx_processed_callbacks_user_id ON processed_callbacks(user_id);

-- Create automation_settings table for kill switch
CREATE TABLE automation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  paused BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_automation_settings_user_id ON automation_settings(user_id);

-- Enable RLS on both tables
ALTER TABLE processed_callbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for processed_callbacks (service role only - edge function uses service key)
CREATE POLICY "Service role can manage processed_callbacks"
ON processed_callbacks
FOR ALL
USING (true)
WITH CHECK (true);

-- RLS policies for automation_settings
CREATE POLICY "Users can view their own automation settings"
ON automation_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own automation settings"
ON automation_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automation settings"
ON automation_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Function to clean old processed_callbacks (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_processed_callbacks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM processed_callbacks 
  WHERE processed_at < NOW() - INTERVAL '24 hours';
END;
$$;