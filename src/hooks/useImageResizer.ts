import { useState } from 'react';

export const useImageResizer = () => {
  const [isResizing, setIsResizing] = useState(false);

  const resizeImageTo1000x1000 = async (imageUrl: string): Promise<string> => {
    setIsResizing(true);
    
    // FUNÇÃO INTERNA: Resize com dimensões específicas
    const attemptResize = async (targetSize: number): Promise<string> => {
      console.log(`🖼️ Tentativa redimensionamento para ${targetSize}x${targetSize}:`, imageUrl);
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve, reject) => {
        // ⏱️ TIMEOUT de 15 segundos para evitar travamentos CORS
        const timeout = setTimeout(() => {
          img.src = ''; // Cancelar carregamento
          console.warn(`⏱️ [RESIZE] Timeout após 15s: ${imageUrl.substring(0, 50)}...`);
          reject(new Error(`Timeout: imagem não carregou em 15s (possível bloqueio CORS)`));
        }, 15000);
        img.onload = async () => {
          clearTimeout(timeout); // Cancelar timeout se carregou com sucesso
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            
            if (!ctx) {
              reject(new Error('Não foi possível obter contexto do canvas'));
              return;
            }
            
            // Definir dimensões do canvas
            canvas.width = targetSize;
            canvas.height = targetSize;
            
            // Configurar qualidade máxima
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Calcular dimensões mantendo aspect ratio
            const { width: origWidth, height: origHeight } = img;
            const scale = Math.min(targetSize / origWidth, targetSize / origHeight);
            const newWidth = origWidth * scale;
            const newHeight = origHeight * scale;
            
            // Centralizar a imagem no canvas
            const offsetX = (targetSize - newWidth) / 2;
            const offsetY = (targetSize - newHeight) / 2;
            
            // Preencher fundo branco
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, targetSize, targetSize);
            
            // Desenhar imagem redimensionada
            ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);
            
            // ✅ COMPRESSÃO ADAPTATIVA PARA TARGET DE 1MB (800KB-1024KB)
            console.log(`🎯 [COMPRESSÃO] Iniciando compressão adaptativa para ${targetSize}x${targetSize}px`);
            const compressToTargetSize = async (
              canvas: HTMLCanvasElement, 
              targetSizeKB: number = 900,
              minQuality: number = 0.75,
              maxQuality: number = 0.98
            ): Promise<Blob> => {
              let quality = 0.92; // Começar com 92%
              let attempts = 0;
              const maxAttempts = 5;
              
              console.log(`🔄 [COMPRESSÃO] Target: ${targetSizeKB}KB (range: 800-1000KB), qualidade inicial: ${Math.round(quality * 100)}%`);
              
              while (attempts < maxAttempts) {
                const blob = await new Promise<Blob>((resolve, reject) => {
                  canvas.toBlob((b) => {
                    if (!b) reject(new Error('Falha ao criar blob'));
                    else resolve(b);
                  }, 'image/jpeg', quality);
                });
                
                const sizeKB = Math.round(blob.size / 1024);
                console.log(`🔄 [COMPRESSÃO] Tentativa ${attempts + 1}/${maxAttempts}: ${sizeKB}KB (qualidade ${Math.round(quality * 100)}%)`);
                
                // Verificar se está dentro do range desejado (800-1000KB)
                if (sizeKB >= 800 && sizeKB <= 1000) {
                  console.log(`✅ [COMPRESSÃO] Tamanho IDEAL alcançado: ${sizeKB}KB na tentativa ${attempts + 1}`);
                  return blob;
                }
                
                // Ajustar qualidade baseado no tamanho de forma proporcional
                if (sizeKB > 1000) {
                  const excess = (sizeKB - 900) / 900; // Percentual acima do target
                  const reduction = 0.08 * (1 + excess);
                  quality = Math.max(minQuality, quality - reduction); // Redução proporcional
                  console.log(`📉 [COMPRESSÃO] Arquivo grande (${sizeKB}KB > 1000KB), reduzindo qualidade em ${Math.round(reduction * 100)}% para ${Math.round(quality * 100)}%`);
                } else if (sizeKB < 800) {
                  const deficit = (800 - sizeKB) / 800; // Percentual abaixo do mínimo
                  const increase = 0.05 * (1 + deficit);
                  quality = Math.min(maxQuality, quality + increase); // Aumento proporcional
                  console.log(`📈 [COMPRESSÃO] Arquivo pequeno (${sizeKB}KB < 800KB), aumentando qualidade em ${Math.round(increase * 100)}% para ${Math.round(quality * 100)}%`);
                } else {
                  // Entre 800-1000KB é aceitável
                  console.log(`✅ [COMPRESSÃO] Tamanho aceitável: ${sizeKB}KB`);
                  return blob;
                }
                
                attempts++;
              }
              
              // Fallback: retornar última tentativa
              console.warn(`⚠️ [COMPRESSÃO] Máximo de tentativas atingido (${maxAttempts}), usando última tentativa com qualidade ${Math.round(quality * 100)}%`);
              return new Promise<Blob>((resolve, reject) => {
                canvas.toBlob((b) => {
                  if (!b) reject(new Error('Falha ao criar blob final'));
                  else resolve(b);
                }, 'image/jpeg', quality);
              });
            };
            
            // Executar compressão adaptativa
            const blob = await compressToTargetSize(canvas, 900, 0.75, 0.98);
            const sizeKB = Math.round(blob.size / 1024);
            console.log(`✅ [RESIZE] Redimensionamento ${targetSize}x${targetSize} concluído`);
            console.log(`📊 [RESIZE] Tamanho final: ${sizeKB}KB (target: 800-1000KB para marketplaces)`);
            console.log(`📐 [RESIZE] Dimensões finais: ${canvas.width}x${canvas.height}px`);
            
            // ✅ VALIDAÇÃO FINAL: Verificar se blob está dentro dos limites (relaxado)
            if (sizeKB < 500) {
              console.error(`❌ [RESIZE] FALHA CRÍTICA: Blob muito pequeno (${sizeKB}KB < 500KB mínimo)`);
              throw new Error(`Falha na compressão: ${sizeKB}KB < 500KB mínimo`);
            }
            
            if (sizeKB > 1200) {
              console.error(`❌ [RESIZE] FALHA CRÍTICA: Blob muito grande (${sizeKB}KB > 1200KB máximo)`);
              throw new Error(`Falha na compressão: ${sizeKB}KB > 1200KB máximo`);
            }
            
            console.log(`✅ [RESIZE] Validação final OK: ${sizeKB}KB dentro dos limites (500KB-1200KB)`);
            
            // Criar Blob URL para uso imediato
            const resizedBlobUrl = URL.createObjectURL(blob);
            resolve(resizedBlobUrl);
            
          } catch (error) {
            console.error(`❌ Erro no processamento ${targetSize}x${targetSize}:`, error);
            reject(error);
          }
        };
        
        img.onerror = () => {
          clearTimeout(timeout); // Cancelar timeout se falhou
          console.error(`❌ Erro ao carregar imagem para ${targetSize}x${targetSize}:`, imageUrl);
          reject(new Error('Falha ao carregar imagem'));
        };
        
        img.src = imageUrl;
      });
    };
    
    try {
      // Tentativa única de redimensionamento para 1000x1000
      console.log('🚀 [RESIZE] Tentando redimensionar para 1000x1000...');
      try {
        const result = await attemptResize(1000);
        console.log('✅ [RESIZE] Sucesso - 1000x1000');
        return result;
      } catch (error) {
        console.warn('⚠️ [RESIZE] Falha no redimensionamento, validando original:', error);
      }
      
      // Fallback: Validar e retornar URL original
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          if (img.width >= 900 && img.height >= 900) {
            console.log(`✅ [RESIZE] Usando imagem original: ${img.width}x${img.height}`);
            resolve(imageUrl);
          } else {
            console.error(`❌ [RESIZE] Imagem muito pequena: ${img.width}x${img.height}`);
            reject(new Error(`Imagem insuficiente: ${img.width}x${img.height} - mínimo 900x900`));
          }
        };
        
        img.onerror = () => {
          console.error('❌ [RESIZE] Não foi possível validar imagem original');
          reject(new Error('Falha na validação da imagem'));
        };
        
        img.src = imageUrl;
      });
      
    } catch (error) {
      console.error('❌ [RESIZE] ERRO CRÍTICO no redimensionamento:', error);
      throw error; // Propagar erro para tratamento upstream
    } finally {
      setIsResizing(false);
    }
  };

  return {
    resizeImageTo1000x1000,
    isResizing
  };
};