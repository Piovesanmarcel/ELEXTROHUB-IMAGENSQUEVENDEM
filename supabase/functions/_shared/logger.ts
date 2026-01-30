/**
 * Logging estruturado para Edge Functions
 * 
 * Logs consistentes com contexto de request
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  requestId?: string;
  userId?: string;
  functionName?: string;
  [key: string]: unknown;
}

/**
 * Logger para Edge Functions
 */
class EdgeLogger {
  private context: LogContext = {};

  /**
   * Define o contexto para todos os logs subsequentes
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Limpa o contexto
   */
  clearContext(): void {
    this.context = {};
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    const logEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...this.context,
      ...(data !== undefined ? { data } : {}),
    };

    const logString = JSON.stringify(logEntry);

    switch (level) {
      case 'debug':
        console.log(`[DEBUG] ${logString}`);
        break;
      case 'info':
        console.log(`[INFO] ${logString}`);
        break;
      case 'warn':
        console.warn(`[WARN] ${logString}`);
        break;
      case 'error':
        console.error(`[ERROR] ${logString}`);
        break;
    }
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, error?: unknown): void {
    // Extrair informações úteis do erro
    let errorData: unknown = error;
    if (error instanceof Error) {
      errorData = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }
    this.log('error', message, errorData);
  }

  /**
   * Log de início de request
   */
  requestStart(method: string, path: string): void {
    this.info('Request started', { method, path });
  }

  /**
   * Log de fim de request
   */
  requestEnd(status: number, durationMs: number): void {
    this.info('Request completed', { status, durationMs });
  }

  /**
   * Log de chamada externa (API, serviço)
   */
  externalCall(service: string, operation: string, durationMs?: number): void {
    this.info('External call', { service, operation, durationMs });
  }

  /**
   * Log de segurança
   */
  security(event: string, data?: unknown): void {
    this.warn(`[SECURITY] ${event}`, data);
  }
}

/**
 * Cria um logger com contexto inicial
 */
export function createLogger(functionName: string, requestId?: string): EdgeLogger {
  const logger = new EdgeLogger();
  logger.setContext({
    functionName,
    requestId: requestId || crypto.randomUUID(),
  });
  return logger;
}

/**
 * Logger singleton para uso geral
 */
export const logger = new EdgeLogger();
