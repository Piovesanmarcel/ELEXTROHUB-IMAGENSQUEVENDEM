import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';

interface PromptData {
  prompts: string[];
  source: string;
  timestamp: number;
  productId?: string;
}

interface PromptSyncContextType {
  collectedPrompts: PromptData[];
  totalPrompts: number;
  isRunwayReady: boolean;
  addPrompts: (data: PromptData) => void;
  clearPrompts: () => void;
  getPromptsForRunway: () => string[];
  debugInfo: {
    sources: string[];
    lastUpdate: number;
    eventHistory: PromptData[];
  };
}

const PromptSyncContext = createContext<PromptSyncContextType | undefined>(undefined);

export const usePromptSync = () => {
  const context = useContext(PromptSyncContext);
  if (!context) {
    throw new Error('usePromptSync must be used within PromptSyncProvider');
  }
  return context;
};

interface PromptSyncProviderProps {
  children: ReactNode;
}

export const PromptSyncProvider: React.FC<PromptSyncProviderProps> = ({ children }) => {
  const [collectedPrompts, setCollectedPrompts] = useState<PromptData[]>([]);
  const [eventHistory, setEventHistory] = useState<PromptData[]>([]);

  const addPrompts = useCallback((data: PromptData) => {
    console.log('🔄 [PROMPT-SYNC] Adicionando prompts:', data);
    
    setCollectedPrompts(prev => {
      // Check for duplicates
      const isDuplicate = prev.some(existing => 
        existing.source === data.source && 
        existing.timestamp === data.timestamp
      );
      
      if (isDuplicate) {
        console.log('⚠️ [PROMPT-SYNC] Prompt duplicado ignorado:', data.source);
        return prev;
      }
      
      const updated = [...prev, data];
      console.log('📊 [PROMPT-SYNC] Total de prompts coletados:', updated.length);
      return updated;
    });
    
    // Add to history for debugging
    setEventHistory(prev => [...prev, data].slice(-10)); // Keep last 10 events
  }, []);

  const clearPrompts = useCallback(() => {
    console.log('🧹 [PROMPT-SYNC] Limpando prompts coletados');
    setCollectedPrompts([]);
  }, []);

  const getPromptsForRunway = useCallback(() => {
    const allPrompts = collectedPrompts.flatMap(data => data.prompts);
    return allPrompts;
  }, [collectedPrompts]);

  const totalPrompts = useMemo(() => 
    collectedPrompts.reduce((sum, data) => sum + data.prompts.length, 0), 
    [collectedPrompts]
  );
  
  const isRunwayReady = useMemo(() => totalPrompts >= 4, [totalPrompts]);

  const debugInfo = useMemo(() => ({
    sources: collectedPrompts.map(data => data.source),
    lastUpdate: Math.max(...collectedPrompts.map(data => data.timestamp), 0),
    eventHistory
  }), [collectedPrompts, eventHistory]);

  // Listen for prompt events globally
  useEffect(() => {
    const handlePromptsReady = (event: CustomEvent) => {
      console.log('📥 [PROMPT-SYNC] Evento promptsReadyForRunway recebido:', event.detail);
      
      // Add timeout to ensure proper event handling
      setTimeout(() => {
        addPrompts(event.detail);
      }, 100);
    };

    console.log('🎯 [PROMPT-SYNC] Registrando listener para promptsReadyForRunway');
    window.addEventListener('promptsReadyForRunway', handlePromptsReady as EventListener);
    
    return () => {
      console.log('🧹 [PROMPT-SYNC] Removendo listener para promptsReadyForRunway');
      window.removeEventListener('promptsReadyForRunway', handlePromptsReady as EventListener);
    };
  }, [addPrompts]);

  const contextValue = useMemo(() => ({
    collectedPrompts,
    totalPrompts,
    isRunwayReady,
    addPrompts,
    clearPrompts,
    getPromptsForRunway,
    debugInfo
  }), [collectedPrompts, totalPrompts, isRunwayReady, addPrompts, clearPrompts, getPromptsForRunway]);

  return (
    <PromptSyncContext.Provider value={contextValue}>
      {children}
    </PromptSyncContext.Provider>
  );
};