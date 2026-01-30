import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BatchImage {
  templateId: string;
  imageUrl: string;
  receivedAt?: string;
}

export interface BatchResult {
  id: string;
  job_id: string;
  user_id: string;
  product_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  images: BatchImage[];
  error_message?: string;
  created_at: string;
  completed_at?: string;
  metadata?: { productId?: string };
}

export interface BatchProgress {
  jobId: string;
  productName: string;
  current: number;
  total: number;
  status: 'pending' | 'processing' | 'completed';
}

/**
 * @deprecated Use useBroadcast from BroadcastContext instead.
 * This hook is kept for backward compatibility but delegates to the global BroadcastProvider.
 */
export function useBatchResults() {
  // Keep batches for interface compatibility but it will always be empty
  const [batches] = useState<BatchResult[]>([]);
  const [isLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeBatchProgress, setActiveBatchProgress] = useState<BatchProgress | null>(null);

  // Get user session
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Listen to global imageGenerated events dispatched by BroadcastProvider
  useEffect(() => {
    const handleImageGenerated = (event: CustomEvent) => {
      const data = event.detail;
      if (data?.aiOrigin === 'n8n-broadcast' || data?.source === 'n8n-stream') {
        // Update progress from global events
        setActiveBatchProgress({
          jobId: data.jobId || 'unknown',
          productName: data.productName || 'Produto',
          current: 1, // Will be updated by subsequent events
          total: 8,
          status: 'processing'
        });
      }
    };

    window.addEventListener('imageGenerated', handleImageGenerated as EventListener);
    return () => window.removeEventListener('imageGenerated', handleImageGenerated as EventListener);
  }, []);

  // No-op functions for interface compatibility
  const fetchBatches = useCallback(async () => {
    console.log('[useBatchResults] fetchBatches: delegated to BroadcastProvider');
  }, []);

  const createPendingBatch = useCallback(async (
    _jobId: string,
    _productName: string
  ): Promise<boolean> => {
    console.log('[useBatchResults] createPendingBatch: delegated to BroadcastProvider');
    return true;
  }, []);

  const getCurrentBatch = useCallback(() => {
    return undefined;
  }, []);

  const clearBatchProgress = useCallback(() => {
    setActiveBatchProgress(null);
  }, []);

  return {
    batches,
    isLoading,
    userId,
    activeBatchProgress,
    fetchBatches,
    createPendingBatch,
    getCurrentBatch,
    clearBatchProgress,
  };
}
