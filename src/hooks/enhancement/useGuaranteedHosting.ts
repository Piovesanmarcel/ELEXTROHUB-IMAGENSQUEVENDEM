import { toast } from "sonner";

export interface HostingResult {
  url: string;
  hosted: boolean;
  service: string;
  message: string;
  fallback_reason?: string;
  original_url?: string;
  attempts: number;
}

export interface ImageSource {
  enhanced?: string;
  original: string;
}

/**
 * Hook simplificado - SEM hospedagem R2
 * Retorna URLs diretamente sem upload
 */
export const useGuaranteedHosting = () => {

  const guaranteedHost = async (
    imageSources: ImageSource,
    fileName: string,
    processingOrder?: number
  ): Promise<HostingResult> => {
    console.log(`🎯 [HOSTING SIMPLIFICADO] Usando URL direta (sem R2)`);
    
    // Usar imagem enhanced se disponível, senão original
    const finalUrl = imageSources.enhanced || imageSources.original;
    
    return {
      url: finalUrl,
      hosted: false,
      service: 'direct-url',
      message: 'URL direta (sem hospedagem)',
      attempts: 1
    };
  };

  return {
    guaranteedHost
  };
};
