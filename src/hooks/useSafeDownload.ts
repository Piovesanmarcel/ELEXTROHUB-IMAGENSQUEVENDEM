import { useCallback } from 'react';

export const useSafeDownload = () => {
  const downloadFile = useCallback(async (url: string, filename: string) => {
    try {
      // Use método seguro de download
      const { safeDownload } = await import('@/utils/safeDownload');
      safeDownload(url, filename);
      
      console.log(`✅ Download iniciado: ${filename}`);
    } catch (error) {
      console.error('Erro no download:', error);
      throw error;
    }
  }, []);

  const downloadBlob = useCallback(async (blob: Blob, filename: string) => {
    try {
      // Use método seguro de download de blob
      const { safeBlobDownload } = await import('@/utils/safeDownload');
      await safeBlobDownload(blob, filename);
      
    } catch (error) {
      console.error('Erro no download do blob:', error);
      throw error;
    }
  }, []);

  return { downloadFile, downloadBlob };
};