// Download seguro sem manipular DOM
export const safeDownload = (url: string, filename: string) => {
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    console.log(`✅ Download iniciado: ${filename}`);
  } catch (error) {
    console.error('Erro no download:', error);
    throw error;
  }
};

// Download de blob (para ZIP/PDF)
export const safeBlobDownload = async (blob: Blob, filename: string) => {
  try {
    const url = URL.createObjectURL(blob);
    safeDownload(url, filename);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (error) {
    console.error('Erro no download do blob:', error);
    throw error;
  }
};