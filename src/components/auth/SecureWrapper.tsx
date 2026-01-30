import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, RefreshCw } from 'lucide-react';
import { rateLimiter, logSecurityEvent } from '@/utils/securityUtils';

interface SecureWrapperProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredPermissions?: string[];
  maxAttempts?: number;
  operationName: string;
}

export const SecureWrapper = ({ 
  children, 
  requireAuth = true, 
  requiredPermissions = [],
  maxAttempts = 5,
  operationName 
}: SecureWrapperProps) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      // Check rate limiting for this operation
      if (!rateLimiter.isAllowed(`secure-${operationName}`, maxAttempts, 300000)) { // 5 minutes
        setIsBlocked(true);
        setAuthError('Muitas tentativas de acesso. Tente novamente em alguns minutos.');
        logSecurityEvent({
          type: 'rate_limit',
          details: `Rate limit exceeded for secure operation: ${operationName}`
        });
        setIsLoading(false);
        return;
      }

      if (!requireAuth) {
        setIsAuthorized(true);
        setIsLoading(false);
        return;
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        setAuthError('Erro ao verificar autenticação');
        logSecurityEvent({
          type: 'auth_failure',
          details: `Authentication check failed for ${operationName}: ${error.message}`
        });
        setIsLoading(false);
        return;
      }

      if (!session) {
        setAuthError('Acesso não autorizado. Faça login para continuar.');
        logSecurityEvent({
          type: 'unauthorized_access',
          details: `Unauthorized access attempt to ${operationName}`
        });
        setIsLoading(false);
        return;
      }

      // Check additional permissions if required
      if (requiredPermissions.length > 0) {
        // In a real app, you'd check user roles/permissions here
        // For now, we'll assume authenticated users have access
      }

      setIsAuthorized(true);
      setAuthError(null);
    } catch (error) {
      console.error('Security check error:', error);
      setAuthError('Erro interno de segurança');
      logSecurityEvent({
        type: 'auth_failure',
        details: `Security check error for ${operationName}: ${error}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (isBlocked) {
      rateLimiter.clearAttempts(`secure-${operationName}`);
      setIsBlocked(false);
    }
    setIsLoading(true);
    setAuthError(null);
    checkAuthorization();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <Alert variant={isBlocked ? "destructive" : "default"} className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Acesso Restrito
        </AlertTitle>
        <AlertDescription className="mt-2">
          {authError}
          {!isBlocked && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry}
              className="mt-3"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (!isAuthorized) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Acesso Negado</AlertTitle>
        <AlertDescription>
          Você não tem permissão para acessar este recurso.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};