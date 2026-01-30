import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { templateIdTracker } from '@/events/TemplateIdTracker';

interface ReceivedImage {
  jobId: string;
  templateId: string;
  imageBase64: string;
  productName: string;
  productId?: string;
  receivedAt: string;
}

interface BatchProgress {
  jobId: string;
  productName: string;
  current: number;
  total: number;
  status: 'processing' | 'completed' | 'error';
}

export type WorkerState = 'idle' | 'active' | 'inactive';

interface DebugState {
  isConnected: boolean;
  userId: string | null;
  channelName: string | null;
  lastMessageAt: string | null;
  messagesReceived: number;
  connectionAttempts: number;
  workerState: WorkerState;
}

interface BroadcastContextType {
  receivedImages: ReceivedImage[];
  activeBatchProgress: BatchProgress | null;
  clearImages: () => void;
  isConnected: boolean;
  debugState: DebugState;
}

const BroadcastContext = createContext<BroadcastContextType | null>(null);

// ===== SINGLETON: Uma única conexão compartilhada =====
let singletonChannel: ReturnType<typeof supabase.channel> | null = null;
let singletonUserId: string | null = null;
const processedBroadcasts = new Set<string>();

export function BroadcastProvider({ children }: { children: ReactNode }) {
  const [receivedImages, setReceivedImages] = useState<ReceivedImage[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeBatchProgress, setActiveBatchProgress] = useState<BatchProgress | null>(null);
  const [debugState, setDebugState] = useState<DebugState>({
    isConnected: false,
    userId: null,
    channelName: null,
    lastMessageAt: null,
    messagesReceived: 0,
    connectionAttempts: 0,
    workerState: 'inactive'
  });
  const jobImageCountRef = useRef<Map<string, number>>(new Map());

  // Função para calcular o estado do worker
  const calculateWorkerState = (
    activeBatch: BatchProgress | null,
    lastMessage: string | null
  ): WorkerState => {
    // Se tem batch ativo processando, está ativo
    if (activeBatch && activeBatch.status === 'processing') {
      return 'active';
    }
    
    // Se nunca recebeu mensagem
    if (!lastMessage) {
      return 'inactive';
    }
    
    const timeSinceLastMessage = Date.now() - new Date(lastMessage).getTime();
    const FIVE_MINUTES = 5 * 60 * 1000;
    
    // Se faz mais de 5 minutos sem atividade, inativo
    if (timeSinceLastMessage > FIVE_MINUTES) {
      return 'inactive';
    }
    
    // Caso contrário, idle (acabou de processar ou aguardando novos jobs)
    return 'idle';
  };

  // Atualizar estado do worker periodicamente
  useEffect(() => {
    const updateWorkerState = () => {
      setDebugState(prev => ({
        ...prev,
        workerState: calculateWorkerState(activeBatchProgress, prev.lastMessageAt)
      }));
    };

    // Atualizar imediatamente
    updateWorkerState();

    // Atualizar a cada 5 segundos
    const interval = setInterval(updateWorkerState, 5000);
    
    return () => clearInterval(interval);
  }, [activeBatchProgress]);

  // Expose debug state globally
  useEffect(() => {
    (window as any).__N8N_STREAM_DEBUG__ = debugState;
  }, [debugState]);

  // Get user session with retry
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id || null;
      setUserId(uid);
      setDebugState(prev => ({ ...prev, userId: uid }));
    };
    
    getUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const uid = session?.user?.id || null;
      setUserId(uid);
      setDebugState(prev => ({ ...prev, userId: uid }));
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Subscribe to broadcast channel (SINGLETON - always active)
  useEffect(() => {
    if (!userId) {
      console.log('[BroadcastProvider] ⏳ Aguardando userId...');
      return;
    }

    // Se já existe conexão para este usuário, reutilizar
    if (singletonChannel && singletonUserId === userId) {
      console.log('[BroadcastProvider] ♻️ Reutilizando conexão singleton para:', userId.substring(0, 8));
      setIsConnected(true);
      setDebugState(prev => ({ ...prev, isConnected: true }));
      return;
    }

    // Limpar conexão anterior se userId mudou
    if (singletonChannel && singletonUserId !== userId) {
      console.log('[BroadcastProvider] 🔄 Usuário mudou, removendo canal antigo');
      supabase.removeChannel(singletonChannel);
      singletonChannel = null;
      processedBroadcasts.clear();
    }

    singletonUserId = userId;
    const channelName = `user-images-${userId}`;
    console.log('[BroadcastProvider] 🔌 Criando conexão GLOBAL para:', channelName);
    
    setDebugState(prev => ({ 
      ...prev, 
      channelName,
      connectionAttempts: prev.connectionAttempts + 1 
    }));

    singletonChannel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'new-image' }, (payload) => {
        const data = payload.payload as {
          jobId: string;
          templateId: string;
          imageBase64: string;
          productName: string;
          productId?: string;
          receivedAt: string;
          isLast?: boolean;
          progress?: { received: number; expected: number };
        };
        
        // ✅ LOG DETALHADO: Imagem chegando do n8n
        console.group(`📥 [BROADCAST] Nova imagem do n8n`);
        console.log('📌 templateId:', data.templateId);
        console.log('🔑 jobId:', data.jobId);
        console.log('📦 productName:', data.productName);
        console.log('⏰ receivedAt:', data.receivedAt);
        console.log('🏁 isLast:', data.isLast);
        console.log('📊 progress:', data.progress);
        console.log('📏 base64 length:', data.imageBase64?.length || 0);
        console.groupEnd();

        // Deduplicação global
        const broadcastKey = `${data.jobId}-${data.templateId}-${data.receivedAt}`;
        
        if (processedBroadcasts.has(broadcastKey)) {
          // ✅ LOG de duplicata
          console.warn(`⚠️ [BROADCAST] DUPLICATA DETECTADA:`, {
            templateId: data.templateId,
            jobId: data.jobId?.substring(0, 12),
            key: broadcastKey
          });
          
          // Rastrear como duplicata
          templateIdTracker.track(
            data.templateId,
            data.jobId,
            'broadcast',
            'duplicate',
            data.productName
          );
          return;
        }
        
        processedBroadcasts.add(broadcastKey);
        
        // ✅ Rastrear templateId aceito
        const trackResult = templateIdTracker.track(
          data.templateId,
          data.jobId,
          'broadcast',
          'received',
          data.productName
        );
        
        console.log(`✅ [BROADCAST] Imagem aceita: ${data.templateId}`, {
          isDuplicate: trackResult.isDuplicate,
          totalCount: trackResult.count
        });
        
        // Update debug state
        setDebugState(prev => ({
          ...prev,
          lastMessageAt: new Date().toISOString(),
          messagesReceived: prev.messagesReceived + 1
        }));
        
        // Limpar broadcasts antigos (manter últimos 100)
        if (processedBroadcasts.size > 100) {
          const oldest = [...processedBroadcasts][0];
          processedBroadcasts.delete(oldest);
        }

        // Update progress tracking
        const expectedTotal = data.progress?.expected || 8;
        const currentCount = data.progress?.received || (jobImageCountRef.current.get(data.jobId) || 0) + 1;
        jobImageCountRef.current.set(data.jobId, currentCount);

        setActiveBatchProgress({
          jobId: data.jobId,
          productName: data.productName,
          current: currentCount,
          total: expectedTotal,
          status: data.isLast ? 'completed' : 'processing'
        });

        const newImage: ReceivedImage = {
          jobId: data.jobId,
          templateId: data.templateId,
          imageBase64: data.imageBase64,
          productName: data.productName,
          productId: data.productId,
          receivedAt: data.receivedAt
        };

        setReceivedImages(prev => [...prev, newImage]);

        // Dispatch event for components that are listening
        console.log('[BroadcastProvider] 🎉 Disparando evento imageGenerated');
        window.dispatchEvent(new CustomEvent('imageGenerated', {
          detail: {
            source: 'n8n-stream',
            images: [data.imageBase64],
            productId: data.productId,
            productName: data.productName,
            jobId: data.jobId,
            templateId: data.templateId,
            receivedAt: data.receivedAt,
            aiOrigin: 'n8n-broadcast'
          }
        }));

        // Clear progress after delay if last image
        if (data.isLast) {
          setTimeout(() => {
            setActiveBatchProgress(null);
            jobImageCountRef.current.delete(data.jobId);
          }, 5000);
        }
      })
      .subscribe((status) => {
        console.log('[BroadcastProvider] 📡 Status do canal:', status);
        const connected = status === 'SUBSCRIBED';
        setIsConnected(connected);
        setDebugState(prev => ({ ...prev, isConnected: connected }));
        
        if (connected) {
          console.log('[BroadcastProvider] ✅ CONECTADO E OUVINDO:', channelName);
        }
      });

    // NÃO remover canal no cleanup - manter singleton ativo
    return () => {
      // Mantém conexão singleton viva
    };
  }, [userId]);

  const clearImages = () => {
    setReceivedImages([]);
    processedBroadcasts.clear();
    jobImageCountRef.current.clear();
    setActiveBatchProgress(null);
    setDebugState(prev => ({ ...prev, messagesReceived: 0, lastMessageAt: null }));
  };

  return (
    <BroadcastContext.Provider value={{ 
      receivedImages, 
      activeBatchProgress,
      clearImages, 
      isConnected,
      debugState
    }}>
      {children}
    </BroadcastContext.Provider>
  );
}

export const useBroadcast = () => {
  const context = useContext(BroadcastContext);
  if (!context) {
    throw new Error('useBroadcast must be used within BroadcastProvider');
  }
  return context;
};
