/**
 * TemplateIdTracker - Sistema dedicado para rastrear templateIds do n8n
 * Fornece timeline, detecção de duplicatas e estatísticas
 */

export type TemplateIdStatus = 'received' | 'processed' | 'duplicate' | 'displayed';
export type TemplateIdSource = 'broadcast' | 'event' | 'gallery';

export interface TemplateIdEvent {
  templateId: string;
  jobId: string;
  receivedAt: string;
  source: TemplateIdSource;
  status: TemplateIdStatus;
  processingTimeMs?: number;
  productName?: string;
}

export interface TemplateIdStats {
  total: number;
  unique: number;
  duplicates: number;
  byTemplateId: Record<string, number>;
  byStatus: Record<TemplateIdStatus, number>;
  bySource: Record<TemplateIdSource, number>;
}

class TemplateIdTrackerClass {
  private events: TemplateIdEvent[] = [];
  private seenKeys = new Map<string, number>(); // key -> count
  private readonly MAX_EVENTS = 200;

  constructor() {
    console.log('📊 [TEMPLATE-TRACKER] Inicializado');
  }

  /**
   * Rastreia um evento de templateId
   */
  track(
    templateId: string,
    jobId: string,
    source: TemplateIdSource,
    status: TemplateIdStatus,
    productName?: string,
    processingTimeMs?: number
  ): { isDuplicate: boolean; count: number } {
    const key = `${jobId}-${templateId}`;
    const existingCount = this.seenKeys.get(key) || 0;
    const isDuplicate = existingCount > 0;

    // Atualizar contagem
    this.seenKeys.set(key, existingCount + 1);

    const event: TemplateIdEvent = {
      templateId,
      jobId,
      receivedAt: new Date().toISOString(),
      source,
      status: isDuplicate ? 'duplicate' : status,
      processingTimeMs,
      productName
    };

    this.events.unshift(event);

    // Limitar tamanho
    if (this.events.length > this.MAX_EVENTS) {
      this.events.pop();
    }

    // Log detalhado
    const emoji = isDuplicate ? '⚠️' : '✅';
    console.log(`${emoji} [TEMPLATE-TRACKER] ${templateId}`, {
      jobId: jobId.substring(0, 8) + '...',
      source,
      status: event.status,
      count: existingCount + 1,
      productName
    });

    return { isDuplicate, count: existingCount + 1 };
  }

  /**
   * Retorna a timeline completa de eventos
   */
  getTimeline(): TemplateIdEvent[] {
    return [...this.events];
  }

  /**
   * Retorna apenas os eventos duplicados
   */
  getDuplicates(): TemplateIdEvent[] {
    return this.events.filter(e => e.status === 'duplicate');
  }

  /**
   * Retorna eventos por templateId específico
   */
  getByTemplateId(templateId: string): TemplateIdEvent[] {
    return this.events.filter(e => e.templateId === templateId);
  }

  /**
   * Retorna eventos por jobId específico
   */
  getByJobId(jobId: string): TemplateIdEvent[] {
    return this.events.filter(e => e.jobId === jobId);
  }

  /**
   * Retorna estatísticas agregadas
   */
  getStats(): TemplateIdStats {
    const byTemplateId: Record<string, number> = {};
    const byStatus: Record<TemplateIdStatus, number> = {
      received: 0,
      processed: 0,
      duplicate: 0,
      displayed: 0
    };
    const bySource: Record<TemplateIdSource, number> = {
      broadcast: 0,
      event: 0,
      gallery: 0
    };

    for (const event of this.events) {
      byTemplateId[event.templateId] = (byTemplateId[event.templateId] || 0) + 1;
      byStatus[event.status]++;
      bySource[event.source]++;
    }

    const uniqueTemplateIds = new Set(this.events.map(e => `${e.jobId}-${e.templateId}`));

    return {
      total: this.events.length,
      unique: uniqueTemplateIds.size,
      duplicates: byStatus.duplicate,
      byTemplateId,
      byStatus,
      bySource
    };
  }

  /**
   * Limpa todos os eventos e contagens
   */
  clear(): void {
    this.events = [];
    this.seenKeys.clear();
    console.log('🧹 [TEMPLATE-TRACKER] Limpo');
  }

  /**
   * Verifica se um templateId já foi visto para um job
   */
  hasSeen(jobId: string, templateId: string): boolean {
    return this.seenKeys.has(`${jobId}-${templateId}`);
  }
}

// Singleton instance
export const templateIdTracker = new TemplateIdTrackerClass();

// Expor no window para debug
(window as any).__TEMPLATE_ID_TRACKER__ = {
  getTimeline: () => templateIdTracker.getTimeline(),
  getStats: () => templateIdTracker.getStats(),
  getDuplicates: () => templateIdTracker.getDuplicates(),
  getByTemplateId: (id: string) => templateIdTracker.getByTemplateId(id),
  getByJobId: (id: string) => templateIdTracker.getByJobId(id),
  hasSeen: (jobId: string, templateId: string) => templateIdTracker.hasSeen(jobId, templateId),
  clear: () => templateIdTracker.clear()
};

console.log('💡 Debug templateIds: window.__TEMPLATE_ID_TRACKER__.getStats()');
