/**
 * Utilitários de validação para Edge Functions
 * 
 * Validação segura de entradas do usuário
 */

type ValidationResult = {
  valid: boolean;
  errors: Record<string, string>;
};

type ValidationRule<T> = {
  field: keyof T;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => string | null;
};

/**
 * Valida um objeto contra um conjunto de regras
 */
export function validate<T extends Record<string, unknown>>(
  data: T,
  rules: ValidationRule<T>[]
): ValidationResult {
  const errors: Record<string, string> = {};

  for (const rule of rules) {
    const value = data[rule.field];
    const fieldName = String(rule.field);

    // Required check
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors[fieldName] = `${fieldName} é obrigatório`;
      continue;
    }

    // Skip other checks if value is not present and not required
    if (value === undefined || value === null) continue;

    // Type check
    if (rule.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rule.type) {
        errors[fieldName] = `${fieldName} deve ser do tipo ${rule.type}`;
        continue;
      }
    }

    // String validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors[fieldName] = `${fieldName} deve ter no mínimo ${rule.minLength} caracteres`;
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors[fieldName] = `${fieldName} deve ter no máximo ${rule.maxLength} caracteres`;
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        errors[fieldName] = `${fieldName} tem formato inválido`;
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors[fieldName] = `${fieldName} deve ser no mínimo ${rule.min}`;
      }
      if (rule.max !== undefined && value > rule.max) {
        errors[fieldName] = `${fieldName} deve ser no máximo ${rule.max}`;
      }
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        errors[fieldName] = customError;
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Valida se é um UUID válido
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Valida se é uma URL válida
 */
export function isValidURL(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida se é um email válido
 */
export function isValidEmail(value: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Sanitiza string removendo caracteres perigosos
 */
export function sanitizeString(value: string): string {
  return value
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Limita o tamanho de uma string
 */
export function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return value.substring(0, maxLength) + '...';
}

/**
 * Verifica se o valor é um objeto não-nulo
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Extrai campos específicos de um objeto (whitelist)
 */
export function pickFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[]
): Partial<T> {
  const result: Partial<T> = {};
  for (const field of fields) {
    if (field in obj) {
      result[field] = obj[field];
    }
  }
  return result;
}
