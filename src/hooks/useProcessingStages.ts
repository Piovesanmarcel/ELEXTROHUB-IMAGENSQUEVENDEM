import { useState, useEffect, useCallback } from 'react';

// Etapas visuais de processamento (UX otimizada)
export const PROCESSING_STAGES = [
  { id: 'preparing', label: 'Preparando prompt...', emoji: '📝', progress: 0, minDuration: 2000 },
  { id: 'analyzing', label: 'Analisando produto...', emoji: '🔍', progress: 15, minDuration: 3000 },
  { id: 'generating', label: 'Gerando imagem...', emoji: '🎨', progress: 30, minDuration: null }, // dinâmico
  { id: 'enhancing', label: 'Aprimorando detalhes...', emoji: '✨', progress: 70, minDuration: 5000 },
  { id: 'finalizing', label: 'Finalizando...', emoji: '🚀', progress: 90, minDuration: 3000 },
  { id: 'complete', label: 'Pronto!', emoji: '✅', progress: 100, minDuration: 0 }
] as const;

export type StageId = typeof PROCESSING_STAGES[number]['id'];

export interface ProcessingStage {
  id: StageId;
  label: string;
  emoji: string;
  progress: number;
  status: 'pending' | 'active' | 'completed';
}

// Mensagens motivacionais rotativas
export const MOTIVATIONAL_MESSAGES = [
  { text: 'Criando sua imagem perfeita...', emoji: '🎨' },
  { text: 'IA trabalhando na composição...', emoji: '🤖' },
  { text: 'Ajustando iluminação...', emoji: '💡' },
  { text: 'Refinando detalhes...', emoji: '✨' },
  { text: 'Quase pronto...', emoji: '🚀' },
  { text: 'Finalizando os toques finais...', emoji: '🎯' },
  { text: 'Preparando para entregar...', emoji: '📦' },
  { text: 'Otimizando qualidade...', emoji: '⚡' },
  { text: 'Aplicando efeitos profissionais...', emoji: '🌟' }
];

/**
 * Hook para gerenciar etapas visuais de processamento
 * Cria uma progressão suave que sempre mostra atividade
 */
export function useProcessingStages(isProcessing: boolean) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [stages, setStages] = useState<ProcessingStage[]>(() => 
    PROCESSING_STAGES.map(s => ({ ...s, status: 'pending' as const }))
  );

  // Avançar automaticamente pelas etapas iniciais
  useEffect(() => {
    if (!isProcessing) {
      // Reset quando parar
      setCurrentStageIndex(0);
      setStages(PROCESSING_STAGES.map(s => ({ ...s, status: 'pending' })));
      return;
    }

    // Primeira etapa imediatamente
    setStages(prev => prev.map((s, i) => ({
      ...s,
      status: i === 0 ? 'active' : 'pending'
    })));

    // Avançar automaticamente até 'generating' (índice 2)
    const advanceStage = (targetIndex: number) => {
      if (targetIndex > 2) return; // Parar em 'generating'
      
      const stage = PROCESSING_STAGES[targetIndex];
      const delay = stage.minDuration || 2000;

      setTimeout(() => {
        setCurrentStageIndex(targetIndex);
        setStages(prev => prev.map((s, i) => ({
          ...s,
          status: i < targetIndex ? 'completed' : i === targetIndex ? 'active' : 'pending'
        })));
        
        if (targetIndex < 2) {
          advanceStage(targetIndex + 1);
        }
      }, delay);
    };

    advanceStage(0);
  }, [isProcessing]);

  // Marcar como completo
  const markComplete = useCallback(() => {
    setStages(PROCESSING_STAGES.map(s => ({ ...s, status: 'completed' })));
    setCurrentStageIndex(PROCESSING_STAGES.length - 1);
  }, []);

  // Avançar para próxima etapa manualmente
  const advanceToStage = useCallback((stageId: StageId) => {
    const index = PROCESSING_STAGES.findIndex(s => s.id === stageId);
    if (index >= 0) {
      setCurrentStageIndex(index);
      setStages(prev => prev.map((s, i) => ({
        ...s,
        status: i < index ? 'completed' : i === index ? 'active' : 'pending'
      })));
    }
  }, []);

  const currentStage = stages[currentStageIndex];
  const completedCount = stages.filter(s => s.status === 'completed').length;
  const overallProgress = (completedCount / stages.length) * 100;

  return {
    stages,
    currentStage,
    currentStageIndex,
    completedCount,
    overallProgress,
    markComplete,
    advanceToStage
  };
}

/**
 * Hook para mensagens motivacionais rotativas
 */
export function useRotatingMessage(isProcessing: boolean, intervalMs: number = 12000) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!isProcessing) {
      setIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % MOTIVATIONAL_MESSAGES.length);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isProcessing, intervalMs]);

  return MOTIVATIONAL_MESSAGES[index];
}

/**
 * Calcula progresso suavizado que nunca para
 * Usa curva logarítmica para parecer mais rápido no início
 */
export function calculateSmoothProgress(elapsed: number, estimated: number): number {
  if (elapsed >= estimated) return 90; // Trava em 90% até completar
  
  const ratio = elapsed / estimated;
  
  // Curva logarítmica: rápido no início, lento no final
  // Mapeia 0-1 para 0-90 com curva suave
  const smoothed = Math.log(ratio * 99 + 1) / Math.log(100) * 90;
  
  return Math.min(smoothed, 90);
}
