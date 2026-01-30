
import { safeBlobDownload } from "./safeDownload";

export const downloadSVGAsImage = async (svgElement: SVGElement, filename: string) => {
  try {
    console.log('🎯 Iniciando download SVG');
    
    // Converter SVG para string
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    
    // Criar canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas context não disponível');
    }
    
    canvas.width = 1200;
    canvas.height = 1200;
    
    // Criar imagem a partir do SVG
    const img = new Image();
    const url = URL.createObjectURL(svgBlob);
    
    return new Promise<void>((resolve, reject) => {
      img.onload = () => {
        console.log('✅ SVG carregado como imagem');
        
        // Desenhar no canvas
        ctx.drawImage(img, 0, 0, 1200, 1200);
        
        // Converter para PNG e baixar
        canvas.toBlob(async (blob) => {
          if (blob) {
            console.log('💾 PNG gerado, iniciando download');
            await safeBlobDownload(blob, filename);
            
            // Limpar URLs
            URL.revokeObjectURL(url);
            
            console.log('🎉 Download concluído');
            resolve();
          } else {
            reject(new Error('Erro ao converter para PNG'));
          }
        }, 'image/png', 1.0);
      };
      
      img.onerror = () => {
        reject(new Error('Erro ao carregar SVG'));
      };
      
      img.src = url;
    });
    
  } catch (error) {
    console.error('❌ Erro no download SVG:', error);
    throw error;
  }
};
