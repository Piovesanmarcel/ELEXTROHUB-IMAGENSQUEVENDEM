/**
 * LoggerService - Serviço centralizado de logging
 * 
 * Substitui console.log em produção por logs estruturados.
 * Em desenvolvimento, mantém os logs normais.
 * Em produção, apenas warnings e errors são exibidos.
 * 
 * USO:
 * import { logger } from '@/services/LoggerService';
 * logger.info('Mensagem', { dados });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
}

class LoggerService {
  private isDev = import.meta.env.DEV;
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  /**
   * Log de debug - apenas em desenvolvimento
   */
  debug(message: string, data?: unknown): void {
    if (this.isDev) {
      console.log(`🔍 [DEBUG] ${message}`, data !== undefined ? data : '');
      this.addToHistory('debug', message, data);
    }
  }

  /**
   * Log informativo - apenas em desenvolvimento
   */
  info(message: string, data?: unknown): void {
    if (this.isDev) {
      console.info(`ℹ️ [INFO] ${message}`, data !== undefined ? data : '');
      this.addToHistory('info', message, data);
    }
  }

  /**
   * Log de aviso - sempre exibido
   */
  warn(message: string, data?: unknown): void {
    console.warn(`⚠️ [WARN] ${message}`, data !== undefined ? data : '');
    this.addToHistory('warn', message, data);
  }

  /**
   * Log de erro - sempre exibido
   */
  error(message: string, error?: unknown): void {
    console.error(`❌ [ERROR] ${message}`, error !== undefined ? error : '');
    this.addToHistory('error', message, error);
    
    // Futuramente: enviar para serviço de monitoramento (Sentry, etc)
    // this.sendToMonitoring({ level: 'error', message, error });
  }

  /**
   * Log de segurança - sempre exibido, para eventos de autenticação/autorização
   */
  security(event: string, data?: unknown): void {
    console.warn(`🔒 [SECURITY] ${event}`, data !== undefined ? data : '');
    this.addToHistory('warn', `[SECURITY] ${event}`, data);
  }

  /**
   * Log de performance - apenas em desenvolvimento
   */
  performance(label: string, durationMs: number, data?: unknown): void {
    if (this.isDev) {
      const emoji = durationMs > 1000 ? '🐌' : durationMs > 500 ? '⏱️' : '⚡';
      console.log(`${emoji} [PERF] ${label}: ${durationMs}ms`, data !== undefined ? data : '');
      this.addToHistory('debug', `[PERF] ${label}: ${durationMs}ms`, data);
    }
  }

  /**
   * Agrupa logs relacionados
   */
  group(label: string): void {
    if (this.isDev) {
      console.group(`📦 ${label}`);
    }
  }

  /**
   * Fecha grupo de logs
   */
  groupEnd(): void {
    if (this.isDev) {
      console.groupEnd();
    }
  }

  /**
   * Timer para medir performance
   */
  time(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.performance(label, Math.round(duration));
    };
  }

  /**
   * Retorna histórico de logs recentes
   */
  getHistory(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Limpa histórico de logs
   */
  clearHistory(): void {
    this.logs = [];
  }

  private addToHistory(level: LogLevel, message: string, data?: unknown): void {
    this.logs.push({
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    });

    // Manter apenas os últimos N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }
}

// Singleton instance
export const logger = new LoggerService();

// Export type for external use
export type { LogEntry, LogLevel };
