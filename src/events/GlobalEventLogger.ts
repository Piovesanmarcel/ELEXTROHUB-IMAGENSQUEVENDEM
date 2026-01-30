// Logger global de eventos IA - para debug de imagens/automação
interface EventLogEntry {
  timestamp: number;
  eventType: string;
  source?: string;
  productId?: string;
  templateId?: string;      // ✅ NOVO
  jobId?: string;           // ✅ NOVO
  imageCount: number;
  hasImages: boolean;
  hasImageUrl: boolean;
  isDuplicate?: boolean;    // ✅ NOVO
  detail: Record<string, any>;
}

class GlobalEventLogger {
  private static instance: GlobalEventLogger;
  private logs: EventLogEntry[] = [];
  private readonly MAX_LOGS = 50;

  static getInstance(): GlobalEventLogger {
    if (!this.instance) {
      this.instance = new GlobalEventLogger();
      this.instance.init();
    }
    return this.instance;
  }

  private init() {
    // Escutar imageGenerated
    window.addEventListener('imageGenerated', ((event: CustomEvent) => {
      this.logEvent('imageGenerated', event.detail);
    }) as EventListener);

    // Escutar automationComplete
    window.addEventListener('automationComplete', ((event: CustomEvent) => {
      this.logEvent('automationComplete', event.detail);
    }) as EventListener);

    // Escutar startShowcaseGeneration
    window.addEventListener('startShowcaseGeneration', ((event: CustomEvent) => {
      this.logEvent('startShowcaseGeneration', event.detail);
    }) as EventListener);

    console.log('🔍 [GLOBAL-LOGGER] Inicializado - monitorando eventos IA');
  }

  private logEvent(eventType: string, detail: any) {
    const entry: EventLogEntry = {
      timestamp: Date.now(),
      eventType,
      source: detail?.source,
      productId: detail?.productId,
      templateId: detail?.templateId,    // ✅ NOVO
      jobId: detail?.jobId,              // ✅ NOVO
      imageCount: Array.isArray(detail?.images) ? detail.images.length : (detail?.imageUrl ? 1 : 0),
      hasImages: Array.isArray(detail?.images) && detail.images.length > 0,
      hasImageUrl: !!detail?.imageUrl,
      isDuplicate: false,                // ✅ NOVO
      detail: { ...detail, images: undefined, imageUrl: detail?.imageUrl ? '[URL]' : undefined }
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.pop();
    }

    // ✅ LOG APRIMORADO com templateId e jobId
    console.group(`🔍 [GLOBAL-LOGGER] ${eventType}`);
    console.log('📌 templateId:', entry.templateId || 'N/A');
    console.log('🔑 jobId:', entry.jobId ? entry.jobId.substring(0, 12) + '...' : 'N/A');
    console.log('📂 source:', entry.source);
    console.log('📊 imageCount:', entry.imageCount);
    console.log('🏷️ productId:', entry.productId ? entry.productId.substring(0, 12) + '...' : 'N/A');
    console.groupEnd();
  }

  getLogsByTemplateId(templateId: string): EventLogEntry[] {
    return this.logs.filter(log => log.templateId === templateId);
  }

  getLogsByJobId(jobId: string): EventLogEntry[] {
    return this.logs.filter(log => log.jobId === jobId);
  }

  getTemplateIdTimeline(): { templateId: string; timestamp: number; jobId: string; source: string }[] {
    return this.logs
      .filter(log => log.templateId)
      .map(log => ({
        templateId: log.templateId!,
        timestamp: log.timestamp,
        jobId: log.jobId || '',
        source: log.source || ''
      }));
  }

  getLogs(): EventLogEntry[] {
    return [...this.logs];
  }

  getLogsByType(eventType: string): EventLogEntry[] {
    return this.logs.filter(log => log.eventType === eventType);
  }

  getLogsByProductId(productId: string): EventLogEntry[] {
    return this.logs.filter(log => log.productId === productId);
  }

  clearLogs() {
    this.logs = [];
    console.log('🧹 [GLOBAL-LOGGER] Logs limpos');
  }
}

// Inicializar automaticamente
export const globalEventLogger = GlobalEventLogger.getInstance();

// Expor no window para debug via console
(window as any).__AI_EVENT_LOG__ = {
  getLogs: () => globalEventLogger.getLogs(),
  getLogsByType: (type: string) => globalEventLogger.getLogsByType(type),
  getLogsByProductId: (id: string) => globalEventLogger.getLogsByProductId(id),
  getLogsByTemplateId: (id: string) => globalEventLogger.getLogsByTemplateId(id),
  getLogsByJobId: (id: string) => globalEventLogger.getLogsByJobId(id),
  getTemplateIdTimeline: () => globalEventLogger.getTemplateIdTimeline(),
  clear: () => globalEventLogger.clearLogs()
};

console.log('💡 Debug: window.__AI_EVENT_LOG__.getLogs() para ver eventos');
console.log('💡 Debug: window.__AI_EVENT_LOG__.getTemplateIdTimeline() para timeline');
