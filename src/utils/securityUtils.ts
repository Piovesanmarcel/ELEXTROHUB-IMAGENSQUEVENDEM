// Security utility functions for input validation and sanitization

/**
 * Validates and sanitizes user input to prevent XSS and injection attacks
 */
export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  // Trim whitespace and limit length
  const trimmed = input.trim().slice(0, maxLength);
  
  // Remove potentially dangerous characters
  return trimmed
    .replace(/[<>\"']/g, '') // Remove HTML/JS injection chars
    .replace(/[\x00-\x1f\x7f-\x9f]/g, ''); // Remove control characters
};

/**
 * Validates UUID format
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 320; // RFC 5321 limit
};

/**
 * Rate limiter for client-side operations
 */
class ClientRateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  /**
   * Check if an operation is allowed based on rate limiting
   */
  isAllowed(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get existing attempts for this key
    const existingAttempts = this.attempts.get(key) || [];
    
    // Filter out attempts outside the time window
    const recentAttempts = existingAttempts.filter(timestamp => timestamp > windowStart);
    
    // Check if we're over the limit
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }
    
    // Add current attempt and update the map
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return true;
  }
  
  /**
   * Clear rate limiting for a specific key
   */
  clearAttempts(key: string): void {
    this.attempts.delete(key);
  }
}

export const rateLimiter = new ClientRateLimiter();

/**
 * Validates SKU format (alphanumeric with dashes/underscores)
 */
export const isValidSKU = (sku: string): boolean => {
  const skuRegex = /^[a-zA-Z0-9_-]+$/;
  return skuRegex.test(sku) && sku.length >= 1 && sku.length <= 50;
};

/**
 * Validates marketplace integration data
 */
export const validateMarketplaceData = (data: {
  marketplace?: string;
  client_id?: string;
  client_secret?: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (data.marketplace) {
    const allowedMarketplaces = ['magalu', 'mercadolivre', 'amazon', 'bling'];
    if (!allowedMarketplaces.includes(data.marketplace)) {
      errors.push('Invalid marketplace');
    }
  }
  
  if (data.client_id && (data.client_id.length < 10 || data.client_id.length > 100)) {
    errors.push('Client ID must be between 10-100 characters');
  }
  
  if (data.client_secret && (data.client_secret.length < 10 || data.client_secret.length > 200)) {
    errors.push('Client secret must be between 10-200 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Security headers for API responses
 */
export const getSecurityHeaders = () => ({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
});

/**
 * Logs security events for monitoring
 */
export const logSecurityEvent = (event: {
  type: 'auth_failure' | 'rate_limit' | 'invalid_input' | 'unauthorized_access';
  details: string;
  userId?: string;
  ip?: string;
}) => {
  console.warn(`🚨 SECURITY EVENT: ${event.type}`, {
    timestamp: new Date().toISOString(),
    ...event
  });
};