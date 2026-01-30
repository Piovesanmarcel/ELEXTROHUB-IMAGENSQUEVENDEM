-- Create admin audit logs table
CREATE TABLE public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  page_path TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view all audit logs"
ON public.admin_audit_logs
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Service role can insert logs (via edge function or direct insert)
CREATE POLICY "Service role can insert audit logs"
ON public.admin_audit_logs
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_admin_audit_logs_user_id ON public.admin_audit_logs(user_id);
CREATE INDEX idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX idx_admin_audit_logs_action ON public.admin_audit_logs(action);