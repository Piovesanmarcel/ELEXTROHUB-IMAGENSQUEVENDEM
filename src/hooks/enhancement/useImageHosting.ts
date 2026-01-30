import { toast } from "sonner";

/**
 * Hook simplificado - SEM hospedagem R2
 * Retorna URLs diretamente sem upload
 */
export const useImageHosting = () => {

  // Função principal: retorna URL direta (sem hospedagem)
  const hostEnhancedImage = async (imageUrl: string, fileName: string): Promise<{
    url: string;
    hosted: boolean;
    service: string;
    message: string;
  }> => {
    console.log('🎯 [HOSTING SIMPLIFICADO] Usando URL direta (sem R2)');
    
    return {
      url: imageUrl,
      hosted: false,
      service: 'direct-url',
      message: 'URL direta (sem hospedagem)'
    };
  };

  // Stubs para compatibilidade
  const uploadToCloudflareR2 = async (imageData: string, fileName: string): Promise<string> => {
    console.log('⚠️ R2 removido - retornando URL original');
    throw new Error('R2 foi removido do projeto');
  };

  const testCloudflareConnectivity = async (): Promise<boolean> => {
    console.log('⚠️ R2 removido');
    return false;
  };

  const testImgBBConnectivity = async (): Promise<boolean> => {
    console.log('⚠️ ImgBB removido');
    return false;
  };

  const uploadToImgBB = async (imageData: string, fileName: string): Promise<string> => {
    throw new Error('ImgBB foi removido do projeto');
  };

  const uploadToCloudflare = uploadToCloudflareR2;

  return {
    hostEnhancedImage,
    uploadToCloudflareR2,
    uploadToCloudflare,
    uploadToImgBB,
    testCloudflareConnectivity,
    testImgBBConnectivity
  };
};
