import { useState, useCallback, useRef } from "react";

export interface ProgressStep {
  id: string;
  name: string;
  progress: number;
  status: 'pending' | 'active' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
  error?: string;
}

export const useOptimizedProgress = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  
  const startTime = useRef<number>(0);
  const completedSteps = useRef<number>(0);

  const initializeSteps = useCallback((stepIds: string[], stepNames: string[]) => {
    const initialSteps: ProgressStep[] = stepIds.map((id, index) => ({
      id,
      name: stepNames[index] || `Step ${index + 1}`,
      progress: 0,
      status: 'pending'
    }));
    
    setSteps(initialSteps);
    setTotalCount(stepIds.length);
    setProcessedCount(0);
    completedSteps.current = 0;
    startTime.current = Date.now();
    
    console.log(`📊 [PROGRESS] Initialized ${stepIds.length} steps`);
  }, []);

  const startProcessing = useCallback(() => {
    setIsProcessing(true);
    setOverallProgress(0);
    setProcessedCount(0);
    startTime.current = Date.now();
    completedSteps.current = 0;
    console.log(`🚀 [PROGRESS] Processing started`);
  }, []);

  const updateStepProgress = useCallback((stepId: string, progress: number, status?: 'pending' | 'active' | 'completed' | 'failed') => {
    setSteps(prev => prev.map(step => {
      if (step.id === stepId) {
        const updated: ProgressStep = {
          ...step,
          progress: Math.min(100, Math.max(0, progress)),
          status: status || (progress >= 100 ? 'completed' : progress > 0 ? 'active' : 'pending'),
          ...(status === 'active' && !step.startTime ? { startTime: Date.now() } : {}),
          ...(status === 'completed' || progress >= 100 ? { endTime: Date.now() } : {})
        };
        
        if (updated.status === 'completed' && step.status !== 'completed') {
          completedSteps.current += 1;
          setProcessedCount(completedSteps.current);
          
          // Calculate estimated time remaining
          const elapsed = Date.now() - startTime.current;
          const avgTimePerStep = elapsed / completedSteps.current;
          const remaining = (totalCount - completedSteps.current) * avgTimePerStep;
          setEstimatedTimeRemaining(remaining);
          
          console.log(`✅ [PROGRESS] Step completed: ${stepId} (${completedSteps.current}/${totalCount})`);
        }
        
        return updated;
      }
      return step;
    }));
    
    // Update current step
    if (status === 'active') {
      setCurrentStep(stepId);
    }
    
    // Update overall progress
    setSteps(currentSteps => {
      const totalProgress = currentSteps.reduce((sum, step) => sum + step.progress, 0);
      const newOverallProgress = totalProgress / Math.max(1, currentSteps.length);
      setOverallProgress(newOverallProgress);
      return currentSteps;
    });
  }, [totalCount]);

  const setStepError = useCallback((stepId: string, error: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status: 'failed', error, endTime: Date.now() }
        : step
    ));
    console.error(`❌ [PROGRESS] Step failed: ${stepId} - ${error}`);
  }, []);

  const finishProcessing = useCallback(() => {
    setIsProcessing(false);
    setOverallProgress(100);
    setEstimatedTimeRemaining(null);
    
    // Complete any remaining steps
    setSteps(prev => prev.map(step => 
      step.status === 'active' || step.status === 'pending' 
        ? { ...step, status: 'completed', progress: 100, endTime: Date.now() }
        : step
    ));
    
    const totalTime = Date.now() - startTime.current;
    console.log(`🏁 [PROGRESS] Processing finished in ${(totalTime / 1000).toFixed(1)}s`);
    
    // Clear progress after delay
    setTimeout(() => {
      if (!isProcessing) {
        setOverallProgress(0);
        setProcessedCount(0);
        setCurrentStep('');
        setSteps([]);
        setEstimatedTimeRemaining(null);
      }
    }, 3000);
  }, [isProcessing]);

  const resetProgress = useCallback(() => {
    setIsProcessing(false);
    setOverallProgress(0);
    setProcessedCount(0);
    setCurrentStep('');
    setSteps([]);
    setEstimatedTimeRemaining(null);
    completedSteps.current = 0;
    console.log(`🔄 [PROGRESS] Progress reset`);
  }, []);

  const getProgressStats = useCallback(() => {
    const completed = steps.filter(s => s.status === 'completed').length;
    const failed = steps.filter(s => s.status === 'failed').length;
    const active = steps.filter(s => s.status === 'active').length;
    const pending = steps.filter(s => s.status === 'pending').length;
    
    return { completed, failed, active, pending, total: steps.length };
  }, [steps]);

  return {
    // State
    isProcessing,
    overallProgress,
    currentStep,
    steps,
    processedCount,
    totalCount,
    estimatedTimeRemaining,
    
    // Actions
    initializeSteps,
    startProcessing,
    updateStepProgress,
    setStepError,
    finishProcessing,
    resetProgress,
    
    // Utilities
    getProgressStats
  };
};