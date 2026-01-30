// Função segura de download que não manipula o DOM diretamente
export const safeDownload = (url: string, filename: string) => {
  try {
    // Criar link temporário sem adicionar ao DOM
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Forçar o download sem manipular o DOM
    link.click();
    
    console.log(`✅ Download iniciado: ${filename}`);
  } catch (error) {
    console.error('Erro no download:', error);
    throw error;
  }
};

// Função para download de blob
export const safeBlobDownload = async (blob: Blob, filename: string) => {
  try {
    const url = URL.createObjectURL(blob);
    safeDownload(url, filename);
    
    // Aguardar um tempo antes de revogar para garantir que o download começou
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
    
  } catch (error) {
    console.error('Erro no download do blob:', error);
    throw error;
  }
};