import { toast } from "sonner";

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: ['timeout', 'rate', 'network', 'temp', '429', '503', '502']
};

export const useRetrySystem = () => {
  const isRetryableError = (error: Error, config: RetryConfig): boolean => {
    const errorMessage = error.message.toLowerCase();
    return config.retryableErrors.some(keyword => errorMessage.includes(keyword));
  };

  const calculateDelay = (attempt: number, config: RetryConfig): number => {
    const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    return Math.min(delay, config.maxDelay);
  };

  const executeWithRetry = async <T>(
    operation: () => Promise<T>,
    operationName: string,
    customConfig?: Partial<RetryConfig>
  ): Promise<RetryResult<T>> => {
    const config = { ...DEFAULT_CONFIG, ...customConfig };
    let lastError: Error;
    
    for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
      try {
        console.log(`🔄 [${operationName}] Tentativa ${attempt}/${config.maxRetries + 1}`);
        const result = await operation();
        
        if (attempt > 1) {
          console.log(`✅ [${operationName}] Sucesso na tentativa ${attempt}`);
          toast.success(`${operationName} bem-sucedido após ${attempt} tentativas`);
        }
        
        return { success: true, data: result, attempts: attempt };
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ [${operationName}] Falha na tentativa ${attempt}:`, error);
        
        if (attempt <= config.maxRetries && isRetryableError(lastError, config)) {
          const delay = calculateDelay(attempt, config);
          console.log(`⏳ [${operationName}] Aguardando ${delay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          break;
        }
      }
    }
    
    console.error(`💥 [${operationName}] Todas as tentativas falharam após ${config.maxRetries + 1} tentativas`);
    return { success: false, error: lastError, attempts: config.maxRetries + 1 };
  };

  return {
    executeWithRetry,
    isRetryableError
  };
};