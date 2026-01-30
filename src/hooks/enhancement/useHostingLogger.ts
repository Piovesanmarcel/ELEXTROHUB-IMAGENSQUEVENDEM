export interface HostingLogEntry {
  timestamp: string;
  processingOrder: number;
  fileName: string;
  originalUrl: string;
  enhancedUrl?: string;
  attempts: number;
  finalUrl: string;
  hosted: boolean;
  service: string;
  fallbackReason?: string;
  errorDetails?: string;
  duration: number;
}

export const useHostingLogger = () => {
  const logs: HostingLogEntry[] = [];

  const logHostingAttempt = (entry: HostingLogEntry) => {
    logs.push(entry);
    
    const status = entry.hosted ? '✅ HOSPEDADO' : '⚠️ FALLBACK';
    const attemptInfo = entry.attempts > 1 ? ` (${entry.attempts} tentativas)` : '';
    const fallbackInfo = entry.fallbackReason ? ` [${entry.fallbackReason}]` : '';
    
    console.log(`📊 [${entry.processingOrder}] ${status}: ${entry.service}${attemptInfo}${fallbackInfo}`);
    console.log(`⏱️ Duração: ${entry.duration}ms | Final: ${entry.finalUrl}`);
    
    if (entry.errorDetails) {
      console.log(`❌ Erro: ${entry.errorDetails}`);
    }
  };

  const generateReport = () => {
    const total = logs.length;
    const hosted = logs.filter(l => l.hosted).length;
    const failed = total - hosted;
    const successRate = total > 0 ? ((hosted / total) * 100).toFixed(1) : '0';
    
    const services = logs.reduce((acc, log) => {
      acc[log.service] = (acc[log.service] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgDuration = total > 0 
      ? (logs.reduce((sum, log) => sum + log.duration, 0) / total).toFixed(0)
      : '0';

    console.log('\n=== RELATÓRIO DE HOSPEDAGEM 100% GARANTIDA ===');
    console.log(`📊 Total processado: ${total} imagens`);
    console.log(`✅ Hospedadas: ${hosted} (${successRate}%)`);
    console.log(`⚠️ Fallbacks: ${failed}`);
    console.log(`⏱️ Tempo médio: ${avgDuration}ms`);
    console.log('🏢 Serviços utilizados:', services);
    
    if (failed > 0) {
      const reasons = logs
        .filter(l => !l.hosted && l.fallbackReason)
        .reduce((acc, log) => {
          const reason = log.fallbackReason!;
          acc[reason] = (acc[reason] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      
      console.log('🔍 Motivos dos fallbacks:', reasons);
    }
    
    console.log('===============================================\n');

    return {
      total,
      hosted,
      failed,
      successRate: parseFloat(successRate),
      services,
      avgDuration: parseFloat(avgDuration),
      fallbackReasons: logs
        .filter(l => !l.hosted && l.fallbackReason)
        .map(l => l.fallbackReason!)
    };
  };

  const clearLogs = () => {
    logs.length = 0;
  };

  const getFailedImages = () => {
    return logs.filter(l => !l.hosted).map(l => ({
      processingOrder: l.processingOrder,
      fileName: l.fileName,
      reason: l.fallbackReason,
      error: l.errorDetails
    }));
  };

  return {
    logHostingAttempt,
    generateReport,
    clearLogs,
    getFailedImages,
    getLogs: () => [...logs]
  };
};