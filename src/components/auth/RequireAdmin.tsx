import { ReactNode, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminAudit } from '@/hooks/useAdminAudit';
import { Loader2, ShieldX } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface RequireAdminProps {
  children: ReactNode;
  redirectTo?: string;
}

export const RequireAdmin = ({ children, redirectTo = '/painel' }: RequireAdminProps) => {
  const { isAdmin, isLoading, error, refetch } = useAdminAuth();
  const { logAuditEvent } = useAdminAudit();
  const location = useLocation();
  const hasLoggedAccess = useRef(false);

  // Log access when admin is verified
  useEffect(() => {
    if (!isLoading && isAdmin && !hasLoggedAccess.current) {
      hasLoggedAccess.current = true;
      logAuditEvent({
        action: 'page_access',
        pagePath: location.pathname,
        metadata: { search: location.search },
      });
    }
  }, [isLoading, isAdmin, location.pathname, location.search, logAuditEvent]);

  // Log denied access
  useEffect(() => {
    if (!isLoading && !isAdmin && !error) {
      logAuditEvent({
        action: 'page_denied',
        pagePath: location.pathname,
        metadata: { reason: 'not_admin' },
      });
    }
  }, [isLoading, isAdmin, error, location.pathname, logAuditEvent]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <Alert variant="destructive" className="max-w-md">
          <ShieldX className="h-4 w-4" />
          <AlertTitle>Erro de Verificação</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-3">Não foi possível verificar suas permissões.</p>
            <Button variant="outline" size="sm" onClick={refetch}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
