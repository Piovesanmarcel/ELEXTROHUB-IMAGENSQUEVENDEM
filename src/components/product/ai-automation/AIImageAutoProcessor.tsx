import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Square, 
  Settings, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Activity,
  Loader2,
  SkipForward,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useHostedImages } from '@/hooks/useHostedImages';
import { useRetrySystem } from '@/hooks/enhancement/useRetrySystem';
import { aiImagesCache } from '@/services/AIImagesSessionCache';
import { normalizeImageGenerated } from '@/events/normalizeImageGenerated';

interface ImageEntry {
  id: string;
  url: string;
  source: string;
  timestamp: number;
  index: number;
}

interface ProcessingTask {
  id: string;
  imageUrl: string;
  imageIndex: number;
  sourceType: string;
  targetGenerator: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: string;
  error?: string;
  startTime?: number;
  endTime?: number;
}

interface AutoProcessorStats {
  totalTasks: number;
  completed: number;
  failed: number;
  pending: number;
  processing: number;
}

// Mapeamento simplificado: APENAS 2 geradores (Características + Vantagens)
const IMAGE_TO_GENERATOR_MAPPING = {
  // IA Avançada - Runware - 2 geradores
  'runware': {
    0: 'features',   // Imagem #1 - Características do Produto
    1: 'authority',  // Imagem #2 - Vantagens do Produto
  },
  
  // Gerador de fundo - Gemini AI - 2 geradores
  'gemini-background': {
    0: 'features',   // Imagem #1 - Características do Produto
    1: 'authority',  // Imagem #2 - Vantagens do Produto
  },
  
  // Gerador BFL.ai - 2 geradores
  'bfl': {
    0: 'features',   // Imagem #1 - Características do Produto
    1: 'authority',  // Imagem #2 - Vantagens do Produto
  },
  
  // BFL.ai - Fundo Branco - 1 gerador
  'bfl-white-bg': {
    0: 'features',   // Imagem #1 - Características do Produto
  }
} as const;

const GENERATOR_NAMES = {
  'features': 'Características do Produto',
  'authority': 'Vantagens do Produto'
} as const;

const GENERATOR_COLORS = {
  'features': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'authority': 'bg-red-100 text-red-800 border-red-200'
} as const;

interface AIImageAutoProcessorProps {
  productId: string;
  productName: string;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export const AIImageAutoProcessor = ({ 
  productId, 
  productName, 
  isExpanded, 
  onToggleExpanded 
}: AIImageAutoProcessorProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [processingQueue, setProcessingQueue] = useState<ProcessingTask[]>([]);
  const [currentTask, setCurrentTask] = useState<ProcessingTask | null>(null);
  const [stats, setStats] = useState<AutoProcessorStats>({ 
    totalTasks: 0, 
    completed: 0, 
    failed: 0, 
    pending: 0, 
    processing: 0 
  });
  const [showSettings, setShowSettings] = useState(false);
  
  // ✅ FIX: useRef para travas síncronas (evita duplicação por race condition)
  const processedGeneratorsRef = useRef<Set<string>>(new Set());
  const inFlightGeneratorsRef = useRef<Set<string>>(new Set());
  
  // ✅ Mantém processedImages para compatibilidade com UI
  const [processedImages, setProcessedImages] = useState<Set<string>>(new Set());
  
// Hook para salvar imagens hospedadas com tags padronizadas
const { saveHostedImage } = useHostedImages();

// Retry system
const { executeWithRetry } = useRetrySystem();

  // Escutar por novas imagens da galeria - NORMALIZADO para aceitar images[] ou imageUrl
  useEffect(() => {
    const handleImageGenerated = (event: CustomEvent) => {
      // ✅ Usar normalizeImageGenerated para aceitar ambos os formatos
      const normalized = normalizeImageGenerated(event.detail);
      
      if (!normalized) {
        console.log('🔄 [AUTO-PROCESSOR] Evento ignorado (normalização falhou)');
        return;
      }

      const { source, images, productId: eventProductId } = normalized;
      
      if (eventProductId !== productId) {
        return;
      }

      // Verificar se este source tem mapeamento
      const mapping = IMAGE_TO_GENERATOR_MAPPING[source as keyof typeof IMAGE_TO_GENERATOR_MAPPING];
      if (!mapping) {
        console.log(`🔄 [AUTO-PROCESSOR] Source '${source}' não possui mapeamento de automação`);
        return;
      }

      console.log(`🚀 [AUTO-PROCESSOR] Detectadas ${images.length} imagens de '${source}' para automação`);

      // ✅ APENAS 2 geradores: Características e Vantagens do Produto
      const ALL_GENERATORS = ['features', 'authority'] as const;
      const newTasks: ProcessingTask[] = [];
      
      ALL_GENERATORS.forEach((generatorType, generatorIndex) => {
        // ✅ FIX: Verificar SINCRONAMENTE via useRef antes de criar task
        const globalKey = `${productId}:${generatorType}`;
        
        // Se já processado OU em processamento, pular
        if (processedGeneratorsRef.current.has(globalKey)) {
          console.log(`⏭️ [AUTO-PROCESSOR] ${generatorType} já processado (ref), pulando`);
          return;
        }
        
        if (inFlightGeneratorsRef.current.has(globalKey)) {
          console.log(`⏭️ [AUTO-PROCESSOR] ${generatorType} já em processamento (ref), pulando`);
          return;
        }
        
        // ✅ Marcar como "em voo" IMEDIATAMENTE (síncrono)
        inFlightGeneratorsRef.current.add(globalKey);
        console.log(`🔒 [AUTO-PROCESSOR] Marcando ${generatorType} como in-flight`);
        
        // Escolher imagem base com fallback: usa índice ou última disponível
        const imageIndex = Math.min(generatorIndex, images.length - 1);
        const imageUrl = images[imageIndex];
        
        const task: ProcessingTask = {
          id: `${source}-${generatorIndex}-${generatorType}-${Date.now()}-${Math.random()}`,
          imageUrl,
          imageIndex: generatorIndex + 1, // Para display (1-based)
          sourceType: source,
          targetGenerator: generatorType,
          status: 'pending'
        };
        
        newTasks.push(task);
        console.log(`📋 [AUTO-PROCESSOR] Tarefa criada: ${source} → ${GENERATOR_NAMES[generatorType]} (usando imagem #${imageIndex + 1})`);
      });

      if (newTasks.length > 0) {
        // Atualizar queue
        setProcessingQueue(prev => {
          const updated = [...prev, ...newTasks];
          console.log(`📋 [AUTO-PROCESSOR] Queue atualizada: ${updated.length} tarefas totais`);
          return updated;
        });
        
        toast.info(`🤖 ${newTasks.length} tarefas de automação criadas (2 categorias)`);
        
        // Iniciar automação automaticamente
        console.log('🚀 [AUTO-PROCESSOR] Iniciando automação automaticamente...');
        setIsProcessing(true);
        setIsPaused(false);
        setCurrentTask(null);
      }
    };

    window.addEventListener('imageGenerated', handleImageGenerated as EventListener);
    
    return () => {
      window.removeEventListener('imageGenerated', handleImageGenerated as EventListener);
    };
  }, [productId]);

  // Atualizar estatísticas
  useEffect(() => {
    const newStats: AutoProcessorStats = {
      totalTasks: processingQueue.length,
      completed: processingQueue.filter(t => t.status === 'completed').length,
      failed: processingQueue.filter(t => t.status === 'failed').length,
      pending: processingQueue.filter(t => t.status === 'pending').length,
      processing: processingQueue.filter(t => t.status === 'processing').length
    };
    
    setStats(newStats);
  }, [processingQueue]);

  // ✅ FIX: Processar fila automaticamente - APENAS 1 tarefa por vez para evitar duplicação
  useEffect(() => {
    if (!isProcessing || isPaused) return;
    
    // ✅ Se já tem tarefa em processamento, aguardar
    const hasProcessingTask = processingQueue.some(t => t.status === 'processing');
    if (hasProcessingTask) {
      console.log('⏳ [AUTO-PROCESSOR] Já existe tarefa em processamento, aguardando...');
      return;
    }

    const nextTask = processingQueue.find(t => t.status === 'pending');
    if (!nextTask) {
      // Processo finalizado
      setIsProcessing(false);
      const completed = processingQueue.filter(t => t.status === 'completed').length;
      const failed = processingQueue.filter(t => t.status === 'failed').length;
      
      if (completed > 0 || failed > 0) {
        toast.success(`✅ Automação finalizada: ${completed} sucessos, ${failed} falhas`);
        if (failed > 0) {
          toast.warning('Algumas tarefas falharam', {
            description: 'Você pode tentar novamente ou recarregar a página manualmente.',
            action: {
              label: 'Tentar Agora',
              onClick: () => retryAllFailed()
            }
          });
        }
      }
      return;
    }

    // ✅ FIX: Processar APENAS 1 tarefa por vez (evita duplicação)
    console.log(`🚀 [AUTO-PROCESSOR] Processando próxima tarefa: ${nextTask.targetGenerator}`);
    processTask(nextTask);
  }, [isProcessing, isPaused, processingQueue]);

  const processTask = async (task: ProcessingTask) => {
    console.log(`🔄 [AUTO-PROCESSOR] === OPTIMIZED === Iniciando processamento:`, {
      source: task.sourceType,
      imageIndex: task.imageIndex,
      generator: task.targetGenerator,
      imageUrlPreview: task.imageUrl?.substring(0, 80),
      productId,
      productName
    });
    
    setCurrentTask(task);
    setProcessingQueue(prev =>
      prev.map(t => t.id === task.id ? { ...t, status: 'processing', startTime: Date.now() } : t)
    );

    try {
      // ✅ GATE: Verificar se copywriting está disponível antes de processar
      const { aiGeneratorService } = await import('@/services/AIGeneratorService');
      
      console.log(`🔍 [AUTO-PROCESSOR] Verificando copywriting disponível para seção '${task.targetGenerator}'...`);
      
      // Tentar obter copywriting com retry (aguardar até 15 segundos)
      let copywritingText = '';
      let copywritingAttempts = 0;
      const maxCopywritingAttempts = 5;
      
      while (copywritingAttempts < maxCopywritingAttempts) {
        copywritingText = await (aiGeneratorService as any).getCopywritingText(productId, task.targetGenerator);
        
        // Verificar se obteve texto válido (não genérico)
        if (copywritingText && 
            copywritingText.length > 20 && 
            !copywritingText.includes('Produto ad-gen') &&
            !copywritingText.includes('Produto ${')) {
          console.log(`✅ [AUTO-PROCESSOR] Copywriting disponível para '${task.targetGenerator}' (${copywritingText.length} chars)`);
          break;
        }
        
        copywritingAttempts++;
        console.log(`⏳ [AUTO-PROCESSOR] Copywriting ainda não disponível, tentativa ${copywritingAttempts}/${maxCopywritingAttempts}...`);
        
        if (copywritingAttempts < maxCopywritingAttempts) {
          await new Promise(resolve => setTimeout(resolve, 3000)); // Aguardar 3s entre tentativas
        }
      }
      
      if (!copywritingText || copywritingText.length < 20) {
        console.warn(`⚠️ [AUTO-PROCESSOR] Copywriting não disponível após ${maxCopywritingAttempts} tentativas - usando fallback`);
      }
      
      console.log(`🎯 [AUTO-PROCESSOR] === OPTIMIZED === Chamando processImageWithGenerator com generatorType: '${task.targetGenerator}'`);
      
      const retryOutcome = await executeWithRetry(
        () => aiGeneratorService.processImageWithGenerator({
          imageUrl: task.imageUrl,
          productId: productId,
          productName: productName,
          generatorType: task.targetGenerator as any
        }),
        `AutoProcessor:${task.sourceType}:${task.targetGenerator}`,
        { maxRetries: 3, baseDelay: 1500, maxDelay: 8000 }
      );

      if (!retryOutcome.success || !(retryOutcome.data && (retryOutcome.data as any).success)) {
        const errMsg = (retryOutcome.data as any)?.error || retryOutcome.error?.message || 'Falha na geração';
        throw new Error(errMsg);
      }

      const result = retryOutcome.data as { success: boolean; imageUrl?: string; error?: string };
      
      // ✅ VALIDAR que imageUrl existe antes de continuar
      if (!result.imageUrl || typeof result.imageUrl !== 'string' || result.imageUrl.length < 10) {
        console.error(`❌ [AUTO-PROCESSOR] Gerador retornou sem imageUrl válida:`, result);
        throw new Error('Gerador retornou sem imagem válida');
      }
      
      // ✅ FIX: Marcar como processado via useRef (síncrono) e useState (UI)
      const globalKey = `${productId}:${task.targetGenerator}`;
      inFlightGeneratorsRef.current.delete(globalKey);
      processedGeneratorsRef.current.add(globalKey);
      
      setProcessedImages(prev => new Set(prev.add(`${task.sourceType}-${task.imageIndex - 1}-${task.targetGenerator}-${task.imageUrl}`)));
      
      setProcessingQueue(prev =>
        prev.map(t => t.id === task.id 
          ? { ...t, status: 'completed', endTime: Date.now(), result: result.imageUrl }
          : t
        )
      );

      // Determinar IA de origem baseada no sourceType
      let aiOrigin: string;
      switch (task.sourceType) {
        case 'gemini-background':
        case 'gemini-white-background':
          aiOrigin = 'gemini';
          break;
        case 'runware':
          aiOrigin = 'runware';
          break;
        case 'bfl':
        case 'bfl-white-bg':
          aiOrigin = 'bfl';
          break;
        default:
          aiOrigin = 'outros';
      }

      // Disparar evento para galeria com imagem processada incluindo ai-origin
      const processedSource = `${task.targetGenerator}-processed`;
      const event = new CustomEvent('imageGenerated', {
        detail: {
          source: processedSource,
          images: [result.imageUrl!],
          productId: productId,
          batchId: `auto-processed-${task.id}`,
          originalTask: task,
          aiOrigin: aiOrigin,
          processingOrder: task.imageIndex,
          originalSource: task.sourceType
        }
      });
      
      window.dispatchEvent(event);
      
      // ✅ SALVAR NO CACHE DA SESSÃO (independente da galeria estar montada)
      const existingProcessedCache = aiImagesCache.loadImages(productId, processedSource) || [];
      aiImagesCache.saveImages(productId, processedSource, [...existingProcessedCache, result.imageUrl!]);
      console.log(`💾 [AUTO-PROCESSOR] Imagem salva no cache: ${processedSource}`);
      
      // ✅ Toast de sucesso - imagem salva como Blob temporário na sessão
      toast.success(`✅ ${GENERATOR_NAMES[task.targetGenerator as keyof typeof GENERATOR_NAMES]} gerado!`);
      
      console.log(`✅ [AUTO-PROCESSOR] Imagem processada com tags: ai-origin:${aiOrigin}, source:${processedSource}, order:${task.imageIndex}`);
      
      console.log(`✅ [AUTO-PROCESSOR] Concluído: ${task.sourceType} #${task.imageIndex} → ${GENERATOR_NAMES[task.targetGenerator]}`);

    } catch (error) {
      console.error(`❌ [AUTO-PROCESSOR] Erro no processamento:`, error);
      
      // ✅ FIX: Remover do inFlight para permitir retry
      const globalKey = `${productId}:${task.targetGenerator}`;
      inFlightGeneratorsRef.current.delete(globalKey);
      
      setProcessingQueue(prev =>
        prev.map(t => t.id === task.id 
          ? { 
            ...t, 
            status: 'failed', 
            endTime: Date.now(), 
            error: error instanceof Error ? error.message : 'Erro desconhecido' 
          }
          : t
        )
      );
    } finally {
      setCurrentTask(null);
      
      // Reduced delay for better performance
      setTimeout(() => {
        // Allow next task to be processed
      }, 100);  // Reduced from 500ms to 100ms
    }
  };

  const simulateGeneratorProcessing = async (task: ProcessingTask): Promise<void> => {
    // Simular tempo de processamento variável por gerador (5 geradores simplificados)
    const processingTimes: Record<string, number> = {
      'intro': 3000,
      'authority': 3500,
      'benefits': 3000,
      'urgency': 2500,
      'features': 3000
    };
    
    const baseDelay = processingTimes[task.targetGenerator] || 3000;
    const delay = baseDelay + Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Simular possível falha (5% de chance)
    if (Math.random() < 0.05) {
      throw new Error(`Falha na geração ${task.targetGenerator}`);
    }
  };

  const startAutomation = () => {
    if (processingQueue.filter(t => t.status === 'pending').length === 0) {
      toast.warning('Nenhuma tarefa pendente para processar');
      return;
    }
    
    setIsProcessing(true);
    setIsPaused(false);
    toast.info('🤖 Automação iniciada!');
  };

  const pauseAutomation = () => {
    setIsPaused(true);
    toast.info('⏸️ Automação pausada');
  };

  const stopAutomation = () => {
    setIsProcessing(false);
    setIsPaused(false);
    setCurrentTask(null);
    toast.info('⏹️ Automação interrompida');
  };

  const clearQueue = () => {
    setProcessingQueue([]);
    setCurrentTask(null);
    setProcessedImages(new Set());
    toast.info('🗑️ Fila de processamento limpa');
  };

  const retryAllFailed = () => {
    const count = processingQueue.filter(t => t.status === 'failed').length;
    if (count === 0) {
      toast.info('Nenhuma falha para tentar novamente');
      return;
    }
    setProcessingQueue(prev => prev.map(t => t.status === 'failed' ? { ...t, status: 'pending', error: undefined, startTime: undefined, endTime: undefined } : t));
    setIsProcessing(true);
    setIsPaused(false);
    toast.info(`🔄 Reenfileirando ${count} tarefas falhadas`);
  };
  const skipCurrentTask = () => {
    if (currentTask) {
      setProcessingQueue(prev =>
        prev.map(t => t.id === currentTask.id 
          ? { ...t, status: 'failed', endTime: Date.now(), error: 'Pulado pelo usuário' }
          : t
        )
      );
      setCurrentTask(null);
      toast.info('⏭️ Tarefa atual pulada');
    }
  };

  const progress = stats.totalTasks > 0 ? ((stats.completed + stats.failed) / stats.totalTasks) * 100 : 0;

  return (
    <Card className="mb-6 border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Sistema de Automação IA
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Processamento automático das imagens da galeria pelos geradores específicos
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpanded}
          >
            {isExpanded ? '−' : '+'}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
              <div className="text-xl font-bold text-purple-600">{stats.totalTasks}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
              <div className="text-xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-xs text-muted-foreground">Concluídas</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
              <div className="text-xl font-bold text-blue-600">{stats.pending}</div>
              <div className="text-xs text-muted-foreground">Pendentes</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
              <div className="text-xl font-bold text-orange-600">{stats.processing}</div>
              <div className="text-xs text-muted-foreground">Processando</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
              <div className="text-xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-xs text-muted-foreground">Falhas</div>
            </div>
          </div>

          {/* Progress Bar */}
          {stats.totalTasks > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso da Automação</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Tarefa Atual */}
          {currentTask && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="font-medium text-blue-900">Processando agora:</span>
              </div>
              <div className="text-sm text-blue-800">
                <strong>{currentTask.sourceType}</strong> Imagem #{currentTask.imageIndex} → 
                <Badge className={`ml-2 ${GENERATOR_COLORS[currentTask.targetGenerator as keyof typeof GENERATOR_COLORS]}`}>
                  {GENERATOR_NAMES[currentTask.targetGenerator as keyof typeof GENERATOR_NAMES]}
                </Badge>
              </div>
            </div>
          )}

          {/* Controles */}
          <div className="flex flex-wrap gap-2">
            {!isProcessing ? (
              <Button 
                onClick={startAutomation} 
                disabled={stats.pending === 0}
                variant="default"
                size="sm"
              >
                <Play className="h-4 w-4 mr-2" />
                Iniciar Automação
              </Button>
            ) : (
              <>
                {!isPaused ? (
                  <Button onClick={pauseAutomation} variant="outline" size="sm">
                    <Pause className="h-4 w-4 mr-2" />
                    Pausar
                  </Button>
                ) : (
                  <Button onClick={() => setIsPaused(false)} variant="outline" size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Retomar
                  </Button>
                )}
                <Button onClick={stopAutomation} variant="destructive" size="sm">
                  <Square className="h-4 w-4 mr-2" />
                  Parar
                </Button>
              </>
            )}

            {currentTask && (
              <Button onClick={skipCurrentTask} variant="outline" size="sm">
                <SkipForward className="h-4 w-4 mr-2" />
                Pular Atual
              </Button>
            )}

            <Button 
              onClick={clearQueue} 
              variant="outline" 
              size="sm"
              disabled={isProcessing}
            >
              🗑️ Limpar Fila
            </Button>

            <Button 
              onClick={retryAllFailed}
              variant="outline"
              size="sm"
              disabled={isProcessing || stats.failed === 0}
            >
              🔄 Tentar Todas Novamente
            </Button>

            <Button 
              onClick={() => setShowSettings(!showSettings)} 
              variant="ghost" 
              size="sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
          </div>

          {/* Fila de Processamento */}
          {processingQueue.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Fila de Processamento ({processingQueue.length})</h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {processingQueue.map((task) => (
                  <div 
                    key={task.id} 
                    className={`flex items-center justify-between p-2 rounded text-xs border ${
                      task.status === 'completed' ? 'bg-green-50 border-green-200' :
                      task.status === 'failed' ? 'bg-red-50 border-red-200' :
                      task.status === 'processing' ? 'bg-blue-50 border-blue-200' :
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {task.status === 'completed' ? <CheckCircle className="h-3 w-3 text-green-600" /> :
                       task.status === 'failed' ? <AlertCircle className="h-3 w-3 text-red-600" /> :
                       task.status === 'processing' ? <Loader2 className="h-3 w-3 animate-spin text-blue-600" /> :
                       <Clock className="h-3 w-3 text-gray-600" />}
                      
                      <span>
                        <strong>{task.sourceType}</strong> #{task.imageIndex} → {GENERATOR_NAMES[task.targetGenerator as keyof typeof GENERATOR_NAMES]}
                      </span>
                    </div>
                    
                    <Badge variant="outline" className={GENERATOR_COLORS[task.targetGenerator as keyof typeof GENERATOR_COLORS]}>
                      {task.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Configurações */}
          {showSettings && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium">Mapeamento de Automação</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {Object.entries(IMAGE_TO_GENERATOR_MAPPING).map(([source, mapping]) => (
                  <div key={source} className="space-y-1">
                    <div className="font-medium capitalize">{source.replace('-', ' ')}</div>
                    {Object.entries(mapping).map(([index, generator]) => (
                      <div key={index} className="flex justify-between items-start">
                        <span>Imagem #{parseInt(index) + 1}</span>
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant="outline" className={GENERATOR_COLORS[generator]}>
                            {GENERATOR_NAMES[generator]}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};