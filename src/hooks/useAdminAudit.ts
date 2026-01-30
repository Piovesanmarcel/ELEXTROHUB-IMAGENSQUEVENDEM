import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

type AuditAction = 'page_access' | 'page_denied' | 'action_performed';

interface AuditLogData {
  action: AuditAction;
  pagePath: string;
  metadata?: Json;
}

export const useAdminAudit = () => {
  const logAuditEvent = useCallback(async (data: AuditLogData) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (!session?.user) {
        console.warn('[AdminAudit] No session, skipping audit log');
        return;
      }

      const { error } = await supabase.from('admin_audit_logs').insert([{
        admin_user_id: session.user.id,
        action: `${data.action}:${data.pagePath}`,
        details: { 
          user_email: session.user.email,
          page_path: data.pagePath,
          user_agent: navigator.userAgent,
          metadata: data.metadata || {}
        },
      }]);

      if (error) {
        console.error('[AdminAudit] Failed to log audit event:', error);
      } else {
        console.log('[AdminAudit] Event logged:', data.action, data.pagePath);
      }
    } catch (err) {
      console.error('[AdminAudit] Error logging audit event:', err);
    }
  }, []);

  return { logAuditEvent };
};
