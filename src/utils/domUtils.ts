/**
 * Utilities for safe DOM manipulation without causing React reconciliation issues
 */

export const safeDownloadFile = async (url: string, filename: string): Promise<void> => {
  try {
    // Use método seguro de download sem DOM manipulation
    const { safeDownload } = await import('@/utils/safeDownload');
    safeDownload(url, filename);
    
    console.log(`✅ Download iniciado: ${filename}`);
  } catch (error) {
    console.error('Erro no download:', error);
    throw error;
  }
};

export const safeDownloadBlob = async (blob: Blob, filename: string): Promise<void> => {
  try {
    const url = URL.createObjectURL(blob);
    safeDownloadFile(url, filename);
    
    // Clean up the URL after download
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (error) {
    console.error('Erro no download do blob:', error);
    throw error;
  }
};

export const safeDOMOperation = (operation: () => void): void => {
  try {
    // Use requestAnimationFrame to queue DOM operations safely
    requestAnimationFrame(() => {
      operation();
    });
  } catch (error) {
    console.error('Erro na operação DOM:', error);
  }
};

export const safeCreateTempElement = (tag: string): HTMLElement => {
  const element = document.createElement(tag);
  element.style.position = 'absolute';
  element.style.top = '-9999px';
  element.style.left = '-9999px';
  element.style.visibility = 'hidden';
  element.style.pointerEvents = 'none';
  return element;
};

export const safeRemoveElement = (element: HTMLElement): void => {
  if (!element) return;
  
  requestAnimationFrame(() => {
    try {
      // Verificações múltiplas de segurança
      if (element && 
          element.isConnected && 
          element.parentNode && 
          element.parentNode.contains(element)) {
        element.remove();
        console.log('🧹 Elemento removido com segurança');
      }
    } catch (error) {
      console.warn('Erro ao remover elemento:', error);
      // Fallback: tentar via parentNode se remove() falhar
      try {
        if (element.parentNode && element.parentNode.contains(element)) {
          element.parentNode.removeChild(element);
          console.log('🧹 Elemento removido via fallback');
        }
      } catch (fallbackError) {
        console.warn('Erro no fallback de remoção:', fallbackError);
      }
    }
  });
};