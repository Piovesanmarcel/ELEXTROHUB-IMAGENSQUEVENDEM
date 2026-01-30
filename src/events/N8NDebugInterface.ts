/**
 * Interface de Debug Unificada para n8n
 * Consolida todas as ferramentas de debug em um único objeto global
 */

import { globalEventLogger } from './GlobalEventLogger';
import { templateIdTracker } from './TemplateIdTracker';

interface N8NDebugInterface {
  // Logs de eventos
  getEventLogs: () => any[];
  getEventsByTemplateId: (id: string) => any[];
  getEventsByJobId: (id: string) => any[];
  
  // Timeline de templateIds
  getTemplateIdTimeline: () => any[];
  getTemplateIdStats: () => any;
  getDuplicates: () => any[];
  
  // Estado do broadcast
  getBroadcastState: () => any;
  
  // Utilitários
  clearAll: () => void;
  printStats: () => void;
  help: () => void;
}

// Criar e expor interface global
const n8nDebug: N8NDebugInterface = {
  // Logs de eventos
  getEventLogs: () => globalEventLogger.getLogs(),
  getEventsByTemplateId: (id: string) => globalEventLogger.getLogsByTemplateId(id),
  getEventsByJobId: (id: string) => globalEventLogger.getLogsByJobId(id),
  
  // Timeline de templateIds
  getTemplateIdTimeline: () => templateIdTracker.getTimeline(),
  getTemplateIdStats: () => templateIdTracker.getStats(),
  getDuplicates: () => templateIdTracker.getDuplicates(),
  
  // Estado do broadcast
  getBroadcastState: () => (window as any).__N8N_STREAM_DEBUG__,
  
  // Utilitários
  clearAll: () => {
    globalEventLogger.clearLogs();
    templateIdTracker.clear();
    console.log('🧹 [N8N-DEBUG] Todos os logs limpos');
  },
  
  printStats: () => {
    const stats = templateIdTracker.getStats();
    const broadcastState = (window as any).__N8N_STREAM_DEBUG__;
    
    console.group('📊 [N8N-DEBUG] Estatísticas Completas');
    console.log('📡 Broadcast conectado:', broadcastState?.isConnected);
    console.log('📥 Mensagens recebidas:', broadcastState?.messagesReceived);
    console.log('🔄 Worker state:', broadcastState?.workerState);
    console.log('');
    console.log('📌 TemplateIds:');
    console.log('   Total eventos:', stats.total);
    console.log('   Únicos:', stats.unique);
    console.log('   Duplicatas:', stats.duplicates);
    console.log('');
    console.log('📊 Por templateId:', stats.byTemplateId);
    console.log('📂 Por source:', stats.bySource);
    console.log('🏷️ Por status:', stats.byStatus);
    console.groupEnd();
    
    return stats;
  },
  
  help: () => {
    console.group('💡 [N8N-DEBUG] Comandos Disponíveis');
    console.log('window.__N8N_DEBUG__.getEventLogs()           - Todos os eventos');
    console.log('window.__N8N_DEBUG__.getEventsByTemplateId(id) - Eventos por templateId');
    console.log('window.__N8N_DEBUG__.getEventsByJobId(id)      - Eventos por jobId');
    console.log('');
    console.log('window.__N8N_DEBUG__.getTemplateIdTimeline()   - Timeline de templateIds');
    console.log('window.__N8N_DEBUG__.getTemplateIdStats()      - Estatísticas agregadas');
    console.log('window.__N8N_DEBUG__.getDuplicates()           - Apenas duplicatas');
    console.log('');
    console.log('window.__N8N_DEBUG__.getBroadcastState()       - Estado do broadcast');
    console.log('window.__N8N_DEBUG__.printStats()              - Print formatado');
    console.log('window.__N8N_DEBUG__.clearAll()                - Limpar tudo');
    console.groupEnd();
  }
};

// Expor globalmente
(window as any).__N8N_DEBUG__ = n8nDebug;

console.log('🔧 [N8N-DEBUG] Interface de debug carregada. Use window.__N8N_DEBUG__.help() para ver comandos.');

export { n8nDebug };
