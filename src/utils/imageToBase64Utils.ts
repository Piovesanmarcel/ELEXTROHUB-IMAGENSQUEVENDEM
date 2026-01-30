
export const convertImageToBase64 = async (url: string): Promise<string> => {
  try {
    console.log('🔄 Convertendo imagem para base64:', url);
    
    // Tentar fetch com CORS primeiro
    const response = await fetch(url, { 
      mode: 'cors',
      headers: {
        'Accept': 'image/*'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('✅ Imagem convertida para base64 com sucesso');
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        console.error('❌ Erro ao converter blob para base64');
        reject(new Error('Erro ao converter para base64'));
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('❌ Erro ao converter imagem:', url, error);
    
    // Se for erro de CORS, lançar erro específico
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('CORS_ERROR');
    }
    
    throw error;
  }
};

// Nova função para tentar diferentes métodos de acesso à imagem
export const getImageData = async (url: string): Promise<{ data: string; isBase64: boolean }> => {
  try {
    // Primeiro, tentar conversão para base64
    const base64Data = await convertImageToBase64(url);
    return { data: base64Data, isBase64: true };
  } catch (error) {
    console.log('⚠️ Conversão para base64 falhou, usando URL direta:', error);
    
    // Se falhar (provavelmente CORS), retornar a URL direta
    // Muitas APIs de IA aceitam URLs diretas de imagens
    return { data: url, isBase64: false };
  }
};

export const convertMultipleImagesToBase64 = async (urls: string[]): Promise<string[]> => {
  console.log(`🔄 Convertendo ${urls.length} imagens para base64...`);
  
  const results = await Promise.allSettled(
    urls.map(url => convertImageToBase64(url))
  );
  
  const base64Images: string[] = [];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      base64Images.push(result.value);
      console.log(`✅ Imagem ${index + 1} convertida com sucesso`);
    } else {
      console.warn(`⚠️ Falha ao converter imagem ${index + 1}:`, urls[index], result.reason);
      // Manter URL original como fallback
      base64Images.push(urls[index]);
    }
  });
  
  console.log(`✅ Conversão concluída: ${base64Images.length}/${urls.length} imagens processadas`);
  return base64Images;
};

// Alias para compatibilidade
export const imageToBase64 = convertImageToBase64;
