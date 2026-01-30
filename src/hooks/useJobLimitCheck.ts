import { useState, useCallback, useEffect, useRef } from 'react';
import { useUserJobStatus, ActiveJob } from '@/contexts/UserJobStatusContext';

export interface RateLimitErrorData {
  pendingJobs?: number;
  maxConcurrent?: number;
  creditsRemaining?: number;
  reason?: string;
  activeJobs?: ActiveJob[];
  cooldownRemaining?: number;
  errorType?: 'cooldown' | 'concurrent_limit';
}

export interface JobLimitCheckResult {
  allowed: boolean;
  reason?: string;
  activeJobs?: ActiveJob[];
}

export const useJobLimitCheck = () => {
  const { 
    canStartNewJob, 
    activeJobs, 
    activeJobsCount, 
    maxConcurrent,
    remainingSlots,
    refreshStatus 
  } = useUserJobStatus();
  
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [limitAlertData, setLimitAlertData] = useState<RateLimitErrorData | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Countdown timer para cooldown
  useEffect(() => {
    if (cooldownSeconds > 0) {
      cooldownTimerRef.current = setTimeout(() => {
        setCooldownSeconds(prev => Math.max(0, prev - 1));
      }, 1000);
    } else if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
    
    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, [cooldownSeconds]);

  // Verificar se pode iniciar novo job
  const checkCanGenerate = useCallback((): JobLimitCheckResult => {
    if (canStartNewJob) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: `Você já tem ${activeJobsCount} de ${maxConcurrent} gerações em andamento`,
      activeJobs
    };
  }, [canStartNewJob, activeJobsCount, maxConcurrent, activeJobs]);

  // Handler para quando 429 acontecer
  const handleRateLimitError = useCallback((errorResponse: any) => {
    console.log('[useJobLimitCheck] 🚫 Rate limit error:', errorResponse);
    
    // Extrair dados do erro 429 do backend
    const limits = errorResponse?.limits || {};
    const errorType = errorResponse?.errorType as 'cooldown' | 'concurrent_limit' | undefined;
    const cooldownRemaining = limits.cooldownRemaining || 0;
    
    // Atualizar estado local
    const alertData: RateLimitErrorData = {
      pendingJobs: limits.pendingJobs || activeJobsCount,
      maxConcurrent: limits.maxConcurrent || maxConcurrent,
      creditsRemaining: limits.creditsRemaining,
      reason: errorResponse?.error || 'Limite de gerações simultâneas atingido',
      activeJobs: activeJobs,
      cooldownRemaining: cooldownRemaining,
      errorType: errorType
    };
    
    setLimitAlertData(alertData);
    setShowLimitAlert(true);
    
    // Iniciar countdown se for cooldown
    if (errorType === 'cooldown' && cooldownRemaining > 0) {
      setCooldownSeconds(cooldownRemaining);
    }
    
    // Atualizar status dos jobs
    refreshStatus();
    
    return alertData;
  }, [activeJobs, activeJobsCount, maxConcurrent, refreshStatus]);

  // Fechar alert
  const closeLimitAlert = useCallback(() => {
    setShowLimitAlert(false);
    setLimitAlertData(null);
    setCooldownSeconds(0);
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
  }, []);

  // Verificar se erro é 429
  const isRateLimitError = useCallback((error: any): boolean => {
    const status = error?.context?.status || error?.status || 0;
    const message = error?.message || '';
    
    return (
      status === 429 ||
      message.includes('429') ||
      message.toLowerCase().includes('rate limit') ||
      message.toLowerCase().includes('limite de requisições') ||
      message.toLowerCase().includes('limite de gerações') ||
      message.toLowerCase().includes('aguarde')
    );
  }, []);

  return {
    // Verificações
    checkCanGenerate,
    canStartNewJob,
    isRateLimitError,
    
    // Estado dos jobs
    activeJobs,
    activeJobsCount,
    maxConcurrent,
    remainingSlots,
    
    // Handlers
    handleRateLimitError,
    
    // Alert state
    showLimitAlert,
    setShowLimitAlert,
    closeLimitAlert,
    limitAlertData,
    
    // Cooldown state
    cooldownSeconds,
    
    // Ações
    refreshStatus
  };
};
