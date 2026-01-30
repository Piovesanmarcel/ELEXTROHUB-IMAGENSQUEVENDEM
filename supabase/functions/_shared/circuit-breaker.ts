/**
 * Circuit Breaker para chamadas a serviços externos
 * 
 * Previne cascata de falhas quando um serviço externo está indisponível
 */

interface CircuitState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
  lastSuccess: number;
}

interface CircuitBreakerOptions {
  failureThreshold?: number;  // Número de falhas para abrir o circuito
  recoveryTimeout?: number;   // Tempo em ms para tentar recuperar
  halfOpenRequests?: number;  // Requisições permitidas em estado half-open
}

const DEFAULT_OPTIONS: Required<CircuitBreakerOptions> = {
  failureThreshold: 3,
  recoveryTimeout: 5 * 60 * 1000, // 5 minutos
  halfOpenRequests: 1,
};

// Estado dos circuitos (em memória - reseta com redeploy)
const circuits = new Map<string, CircuitState>();

/**
 * Obtém ou cria o estado de um circuito
 */
function getCircuitState(serviceName: string): CircuitState {
  if (!circuits.has(serviceName)) {
    circuits.set(serviceName, {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
      lastSuccess: Date.now(),
    });
  }
  return circuits.get(serviceName)!;
}

/**
 * Verifica se uma chamada ao serviço é permitida
 */
export function canCall(
  serviceName: string,
  options: CircuitBreakerOptions = {}
): { allowed: boolean; reason?: string } {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const state = getCircuitState(serviceName);

  // Se o circuito está fechado, permitir
  if (!state.isOpen) {
    return { allowed: true };
  }

  // Verificar se é hora de tentar recuperar (half-open)
  const timeSinceLastFailure = Date.now() - state.lastFailure;
  if (timeSinceLastFailure >= opts.recoveryTimeout) {
    // Estado half-open - permitir uma tentativa
    return { allowed: true, reason: 'half-open' };
  }

  // Circuito aberto, não permitir
  const remainingTime = Math.ceil((opts.recoveryTimeout - timeSinceLastFailure) / 1000);
  return {
    allowed: false,
    reason: `Circuit open for ${serviceName}. Retry in ${remainingTime}s`,
  };
}

/**
 * Registra uma falha no serviço
 */
export function recordFailure(
  serviceName: string,
  options: CircuitBreakerOptions = {}
): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const state = getCircuitState(serviceName);

  state.failures++;
  state.lastFailure = Date.now();

  // Abrir circuito se atingiu o threshold
  if (state.failures >= opts.failureThreshold) {
    state.isOpen = true;
    console.warn(`[CIRCUIT_BREAKER] Circuit opened for ${serviceName} after ${state.failures} failures`);
  }
}

/**
 * Registra um sucesso no serviço
 */
export function recordSuccess(serviceName: string): void {
  const state = getCircuitState(serviceName);

  // Reset do estado
  state.failures = 0;
  state.isOpen = false;
  state.lastSuccess = Date.now();

  console.log(`[CIRCUIT_BREAKER] Circuit closed for ${serviceName}`);
}

/**
 * Obtém estatísticas de todos os circuitos
 */
export function getCircuitStats(): Record<string, CircuitState> {
  const stats: Record<string, CircuitState> = {};
  circuits.forEach((state, name) => {
    stats[name] = { ...state };
  });
  return stats;
}

/**
 * Reseta um circuito específico
 */
export function resetCircuit(serviceName: string): void {
  circuits.delete(serviceName);
}

/**
 * Wrapper para chamadas com circuit breaker
 */
export async function withCircuitBreaker<T>(
  serviceName: string,
  fn: () => Promise<T>,
  options: CircuitBreakerOptions = {}
): Promise<T> {
  const check = canCall(serviceName, options);

  if (!check.allowed) {
    throw new Error(check.reason);
  }

  try {
    const result = await fn();
    recordSuccess(serviceName);
    return result;
  } catch (error) {
    recordFailure(serviceName, options);
    throw error;
  }
}
