
import { toast } from "sonner";
import { EnhancedImage } from "./types";

export const useImageProcessor = () => {
  // 🔒 SEGURANÇA: Função testImgBBConnectivity removida - não mais necessária

  // Função alternativa para quando ImgBB não estiver disponível
  const createDataUrlFallback = async (imageUrl: string, fileName: string): Promise<string> => {
    try {
      console.log('🔄 Usando fallback: mantendo imagem como Data URL...');
      
      // Se já é um data URL, retornar diretamente
      if (imageUrl.startsWith('data:')) {
        console.log('✅ Imagem já é Data URL, retornando diretamente');
        return imageUrl;
      }
      
      // Se é blob URL, converter para data URL
      if (imageUrl.startsWith('blob:')) {
        console.log('🔧 Convertendo blob para Data URL...');
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
      
      // Para URLs normais, baixar e converter
      console.log('📥 Baixando imagem para Data URL...');
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Erro ao baixar imagem: ${response.status}`);
      }
      
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
    } catch (error) {
      console.error('❌ Erro no fallback Data URL:', error);
      throw new Error(`Falha no fallback: ${error.message}`);
    }
  };

  const resizeImageTo1400 = async (imageUrl: string): Promise<string> => {
    try {
      console.log('🔧 REDIMENSIONANDO IMAGEM PARA 1400x1400px GARANTIDO...');
      
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Falha ao baixar imagem: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('📥 Imagem baixada, tamanho:', blob.size, 'bytes');
      
      const imageBitmap = await createImageBitmap(blob);
      console.log('📏 Dimensões originais:', imageBitmap.width, 'x', imageBitmap.height);
      
      let newWidth: number;
      let newHeight: number;
      
      const maxSize = 1400;
      const aspectRatio = imageBitmap.width / imageBitmap.height;
      
      if (imageBitmap.width > imageBitmap.height) {
        newWidth = Math.min(imageBitmap.width, maxSize);
        newHeight = Math.round(newWidth / aspectRatio);
        
        if (newHeight > maxSize) {
          newHeight = maxSize;
          newWidth = Math.round(newHeight * aspectRatio);
        }
      } else {
        newHeight = Math.min(imageBitmap.height, maxSize);
        newWidth = Math.round(newHeight * aspectRatio);
        
        if (newWidth > maxSize) {
          newWidth = maxSize;
          newHeight = Math.round(newWidth / aspectRatio);
        }
      }
      
      newWidth = Math.min(newWidth, maxSize);
      newHeight = Math.min(newHeight, maxSize);
      
      console.log('🎯 DIMENSÕES FINAIS CALCULADAS:', newWidth, 'x', newHeight);
      
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Não foi possível criar contexto 2D');
      }
      
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, newWidth, newHeight);
      ctx.drawImage(imageBitmap, 0, 0, newWidth, newHeight);
      
      const resizedBase64 = canvas.toDataURL('image/jpeg', 0.95);
      
      console.log('✅ REDIMENSIONAMENTO CONCLUÍDO! Dimensões garantidas:', newWidth, 'x', newHeight);
      
      const testImg = new Image();
      await new Promise((resolve, reject) => {
        testImg.onload = () => {
          console.log('🔍 VERIFICAÇÃO FINAL - Dimensões da imagem redimensionada:', testImg.width, 'x', testImg.height);
          if (testImg.width > 1400 || testImg.height > 1400) {
            console.error('❌ ERRO: Imagem ainda ultrapassa 1400px!');
            reject(new Error('Falha no redimensionamento'));
          } else {
            console.log('✅ SUCESSO: Imagem está dentro do limite de 1400x1400px');
            resolve(resizedBase64);
          }
        };
        testImg.onerror = () => reject(new Error('Erro ao verificar dimensões'));
        testImg.src = resizedBase64;
      });
      
      return resizedBase64;
      
    } catch (error) {
      console.error('❌ ERRO no redimensionamento local:', error);
      throw error;
    }
  };

  const uploadToImgBB = async (imageData: string, fileName: string): Promise<string> => {
    try {
      // 🔒 SEGURANÇA: ImgBB removido - usando armazenamento local
      console.log('📦 Usando armazenamento local de imagem...');
      return await createDataUrlFallback(imageData, fileName);
    } catch (error) {
      console.error('❌ Erro ao processar imagem:', error);
      toast.error(`Erro ao processar imagem: ${error.message}`);
      throw error;
    }
  };

  return {
    resizeImageTo1400,
    uploadToImgBB
  };
};
