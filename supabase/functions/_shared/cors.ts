/**
 * CORS Configuration - Secure Version
 * 
 * Configura CORS com domínios permitidos por ambiente.
 * Em produção, apenas domínios da whitelist são permitidos.
 */

// Domínios permitidos (adicione seus domínios de produção aqui)
const ALLOWED_ORIGINS = [
  'https://electrohub.vercel.app',
  'https://electrohub.com.br',
  'https://app.electrohub.com.br',
  // Lovable Cloud
  'https://lovable.app',
  'https://*.lovable.app',
];

// Em desenvolvimento, permitir localhost
const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

/**
 * Verifica se a origem é permitida
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  const isProduction = Deno.env.get('ENVIRONMENT') === 'production';
  const allowedList = isProduction
    ? ALLOWED_ORIGINS
    : [...ALLOWED_ORIGINS, ...DEV_ORIGINS];

  return allowedList.some(allowed => {
    if (allowed.includes('*')) {
      // Suporte a wildcard simples (*.domain.com)
      const pattern = allowed.replace('*', '.*');
      return new RegExp(`^${pattern}$`).test(origin);
    }
    return origin === allowed;
  });
}

/**
 * Retorna headers CORS baseado na origem da requisição
 * 
 * @param origin - Header Origin da requisição
 * @returns Headers CORS configurados
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const isProduction = Deno.env.get('ENVIRONMENT') === 'production';

  // Em produção, validar origem estritamente
  if (isProduction) {
    const allowedOrigin = isOriginAllowed(origin) ? origin : ALLOWED_ORIGINS[0];
    return {
      'Access-Control-Allow-Origin': allowedOrigin || ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-callback-secret, x-internal-worker-key',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Max-Age': '86400',
    };
  }

  // Em desenvolvimento, permitir qualquer origem para facilitar debug
  // TODO: Remover este fallback quando ambiente estiver estável
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-callback-secret, x-internal-worker-key',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Headers CORS padrão (retrocompatíveis)
 * 
 * @deprecated Use getCorsHeaders(origin) para maior segurança
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-callback-secret, x-internal-worker-key',
};
