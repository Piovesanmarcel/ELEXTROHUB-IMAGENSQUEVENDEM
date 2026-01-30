import { supabase } from '@/integrations/supabase/client';

/**
 * Faz upload de uma imagem blob/base64 para o Storage do Supabase
 * e retorna a URL pública https
 */
export const uploadBlobToStorage = async (
  imageData: string,
  userId: string,
  prefix: string = 'gallery'
): Promise<string> => {
  let blob: Blob;
  
  // Converter para blob se necessário
  if (imageData.startsWith('blob:')) {
    const response = await fetch(imageData);
    blob = await response.blob();
  } else if (imageData.startsWith('data:')) {
    // Extrair o tipo e dados do base64
    const [header, base64Data] = imageData.split(',');
    const mimeMatch = header.match(/data:([^;]+)/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
    
    // Converter base64 para blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    blob = new Blob([byteArray], { type: mimeType });
  } else {
    throw new Error('Formato de imagem não suportado. Use blob: ou data: URLs');
  }
  
  // Gerar nome único para o arquivo - usar temp-upload- para RLS
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const extension = blob.type.split('/')[1] || 'png';
  const fileName = `temp-upload-${timestamp}-${randomId}.${extension}`;
  const filePath = `${userId}/${fileName}`;
  
  console.log(`📤 Fazendo upload de imagem para Storage: ${filePath} (${(blob.size / 1024).toFixed(1)}KB)`);
  
  // Fazer upload para o bucket marketing-templates
  const { data, error } = await supabase.storage
    .from('marketing-templates')
    .upload(filePath, blob, {
      contentType: blob.type,
      upsert: false
    });
  
  if (error) {
    console.error('❌ Erro no upload:', error);
    throw new Error(`Falha no upload: ${error.message}`);
  }
  
  // Obter URL pública
  const { data: urlData } = supabase.storage
    .from('marketing-templates')
    .getPublicUrl(filePath);
  
  console.log(`✅ Upload concluído: ${urlData.publicUrl}`);
  
  return urlData.publicUrl;
};

/**
 * Processa um array de imagens, fazendo upload das locais (blob/data) 
 * e mantendo as URLs https como estão
 */
export const processImagesToHttps = async (
  images: string[],
  userId: string
): Promise<string[]> => {
  const results: string[] = [];
  
  for (const img of images) {
    if (!img || typeof img !== 'string') continue;
    
    // URLs https - manter como estão
    if (img.startsWith('https://') || img.startsWith('http://')) {
      results.push(img);
      continue;
    }
    
    // Blob ou data URLs - fazer upload
    if (img.startsWith('blob:') || img.startsWith('data:')) {
      try {
        const httpsUrl = await uploadBlobToStorage(img, userId, 'temp-upload');
        results.push(httpsUrl);
      } catch (e) {
        console.warn('⚠️ Falha ao fazer upload de imagem local:', e);
        // Não incluir imagens que falharam
      }
    }
  }
  
  return results;
};
