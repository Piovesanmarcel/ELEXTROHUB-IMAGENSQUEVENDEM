
import html2canvas from 'html2canvas';

export const preloadImages = (imageUrls: string[]): Promise<HTMLImageElement[]> => {
  const promises = imageUrls.map((url) => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  });

  return Promise.all(promises);
};

export const waitForFonts = (): Promise<void> => {
  if ('fonts' in document) {
    return document.fonts.ready.then(() => {});
  }
  return Promise.resolve();
};

// Função melhorada para aguardar imagens base64 especificamente
export const waitForImages = (elemento: HTMLElement): Promise<void> => {
  return new Promise((resolve) => {
    const imagens = elemento.querySelectorAll('img');
    console.log(`🖼️ Encontradas ${imagens.length} imagens para aguardar`);
    
    if (imagens.length === 0) {
      console.log('✅ Nenhuma imagem encontrada, prosseguindo');
      resolve();
      return;
    }

    let loadedCount = 0;
    const totalImages = imagens.length;

    const checkComplete = (img: HTMLImageElement, status: string) => {
      console.log(`📸 Imagem ${status}:`, img.src.substring(0, 50) + '...', `(${img.naturalWidth}x${img.naturalHeight})`);
      loadedCount++;
      if (loadedCount === totalImages) {
        console.log(`✅ Todas as ${totalImages} imagens processadas`);
        // Extra delay aumentado para garantir renderização completa
        setTimeout(() => resolve(), 3000);
      }
    };

    // Promise.all para aguardar todas as imagens simultaneamente
    const imagePromises = Array.from(imagens).map((img, index) => {
      return new Promise<void>((resolveImg) => {
        console.log(`🔄 Processando imagem ${index + 1}:`, img.src.substring(0, 50) + '...');
        
        // Garantir crossOrigin para imagens externas (não base64)
        if (img.src.startsWith('http') && !img.src.includes(window.location.hostname)) {
          img.crossOrigin = 'anonymous';
          console.log('🌐 CrossOrigin definido para:', img.src.substring(0, 50) + '...');
        }
        
        // Verificar se já está carregada (incluindo base64)
        if (img.complete && img.naturalHeight !== 0 && img.naturalWidth !== 0) {
          console.log(`✅ Imagem ${index + 1} já carregada:`, img.naturalWidth + 'x' + img.naturalHeight);
          checkComplete(img, 'já carregada');
          resolveImg();
        } else {
          // Aguardar carregamento para imagens base64 e externas
          let loadTimeout: NodeJS.Timeout;
          
          const onLoad = () => {
            clearTimeout(loadTimeout);
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
              checkComplete(img, 'carregada com sucesso');
            } else {
              console.warn('⚠️ Imagem carregada mas sem dimensões válidas:', img.src.substring(0, 50));
              checkComplete(img, 'carregada sem dimensões');
            }
            resolveImg();
          };
          
          const onError = (e: Event) => {
            clearTimeout(loadTimeout);
            console.warn('⚠️ Erro ao carregar imagem:', img.src.substring(0, 50), e);
            checkComplete(img, 'erro no carregamento');
            resolveImg();
          };
          
          img.addEventListener('load', onLoad, { once: true });
          img.addEventListener('error', onError, { once: true });
          
          // Timeout de segurança para imagens base64 (que deveriam carregar instantaneamente)
          loadTimeout = setTimeout(() => {
            console.warn('⏰ Timeout para imagem:', img.src.substring(0, 50));
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
              checkComplete(img, 'carregada por timeout');
            } else {
              checkComplete(img, 'timeout sem carregamento');
            }
            resolveImg();
          }, img.src.startsWith('data:') ? 1000 : 5000); // 1s para base64, 5s para externas
          
          // Forçar reload se necessário
          if (!img.src || img.src === '') {
            console.log('🔄 Forçando reload da imagem:', index + 1);
            const originalSrc = img.getAttribute('src') || '';
            img.src = originalSrc;
          }
        }
      });
    });

    // Aguardar todas as imagens carregarem
    Promise.all(imagePromises).then(() => {
      console.log('✅ Todas as promessas de imagem resolvidas');
    });
  });
};

export const createCaptureElement = (templateComponent: React.ReactElement): Promise<HTMLElement> => {
  return new Promise((resolve) => {
    // Criar um container temporário fora da tela para renderização
    const captureContainer = document.createElement('div');
    captureContainer.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: 1200px;
      height: 1200px;
      background: white;
      z-index: 999;
      transform: none !important;
      overflow: visible;
      pointer-events: none;
    `;
    
    let root: any = null;
    
    // Anexar de forma mais segura usando requestAnimationFrame
    requestAnimationFrame(() => {
      try {
        if (document.body && 
            captureContainer && 
            !captureContainer.isConnected &&
            !document.body.contains(captureContainer)) {
          document.body.appendChild(captureContainer);
        }
      } catch (error) {
        console.warn('Erro ao anexar container:', error);
        // Se falhar, tentar de forma alternativa
        try {
          if (document.body && 
              captureContainer && 
              !document.body.contains(captureContainer)) {
            document.body.insertBefore(captureContainer, document.body.firstChild);
          }
        } catch (fallbackError) {
          console.warn('Erro no fallback de anexar:', fallbackError);
        }
        return;
      }
    });
    
    // Renderizar o componente React no container
    import('react-dom/client').then(({ createRoot }) => {
      try {
        if (captureContainer && !root) {
          root = createRoot(captureContainer);
          root.render(templateComponent);
          
          // Aguardar mais tempo para garantir renderização completa
          setTimeout(() => {
            console.log('📦 Container de captura criado e renderizado');
            resolve(captureContainer);
          }, 4000); // Aumentado para 4 segundos
        }
      } catch (error) {
        console.warn('Erro ao criar root:', error);
        resolve(captureContainer);
      }
    });
  });
};

export const captureElementAsImage = async (element: HTMLElement): Promise<HTMLCanvasElement> => {
  console.log('🎯 Iniciando captura da imagem...');
  
  // Aguardar fonts carregarem
  await waitForFonts();
  console.log('✅ Fontes carregadas');
  
  // Aguardar imagens carregarem com função melhorada
  await waitForImages(element);
  console.log('✅ Imagens carregadas e aguardadas');
  
  // Aguardar ainda mais tempo para garantir renderização completa
  await new Promise(resolve => setTimeout(resolve, 3000));
  console.log('✅ Renderização completa garantida');

  // Debug: verificar imagens antes da captura
  const debugImages = element.querySelectorAll('img');
  console.log('🔍 DEBUG - Imagens encontradas antes da captura:');
  debugImages.forEach((img, index) => {
    console.log(`Imagem ${index + 1}:`, {
      src: img.src.substring(0, 50) + '...',
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete,
      visible: img.offsetWidth > 0 && img.offsetHeight > 0
    });
  });
  
  const canvas = await html2canvas(element, {
    useCORS: true,
    allowTaint: false,
    scrollY: 0,
    scrollX: 0,
    backgroundColor: null,
    scale: 2,
    width: 1200,
    height: 1200,
    logging: true,
    foreignObjectRendering: true, // Alterado para true conforme sugestão
    imageTimeout: 45000, // Timeout aumentado para 45 segundos
    removeContainer: true,
    onclone: (clonedDoc, element) => {
      console.log('🔄 Processando elementos clonados...');
      
      // Forçar reflow múltiplas vezes
      clonedDoc.body.style.display = 'block';
      clonedDoc.body.offsetHeight; // Trigger reflow
      
      // Processar todas as imagens no documento clonado
      const clonedImages = clonedDoc.querySelectorAll('img');
      console.log(`🖼️ Encontradas ${clonedImages.length} imagens no clone`);
      
      clonedImages.forEach((img, index) => {
        console.log(`🔧 Processando imagem clonada ${index + 1}:`, img.src.substring(0, 50) + '...');
        
        // Debug: verificar se a imagem no clone tem dimensões válidas
        console.log(`📏 Dimensões imagem ${index + 1}:`, {
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          width: img.width,
          height: img.height,
          complete: img.complete
        });
        
        // ✅ FORÇA RENDERIZAÇÃO DA IMAGEM NO CLONE
        // Aplica width/height fixos se estiverem auto ou percentuais
        if (!img.getAttribute('width') || img.width === 0) {
          img.width = img.naturalWidth || 400;
        }
        if (!img.getAttribute('height') || img.height === 0) {
          img.height = img.naturalHeight || 400;
        }

        // Remove qualquer estilo que esconda a imagem
        const style = img.style as any;
        style.visibility = 'visible';
        style.display = 'block';
        style.opacity = '1';
        style.transform = 'none';
        style.filter = 'none';
        style.maxWidth = 'none';
        style.maxHeight = 'none';
        style.objectFit = 'contain';
        style.position = 'static';

        // Reforça o atributo crossorigin
        img.setAttribute('crossorigin', 'anonymous');
        
        // Configurar crossOrigin para imagens externas
        if (img.src && img.src.startsWith('http') && !img.src.includes(window.location.hostname)) {
          img.crossOrigin = 'anonymous';
          console.log('🌐 CrossOrigin definido para imagem clonada:', img.src.substring(0, 50) + '...');
        }
        
        // Verificar se a imagem está válida
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          console.log(`✅ Imagem clonada ${index + 1} válida:`, img.naturalWidth + 'x' + img.naturalHeight);
        } else {
          console.log(`⚠️ Imagem clonada ${index + 1} pode estar inválida:`, img.src.substring(0, 50) + '...');
          
          // ✅ REFLOW FORÇADO se necessário - com verificação de segurança
          try {
            const clonedImg = img.cloneNode(true) as HTMLImageElement;
            clonedImg.style.cssText = style.cssText; // Manter os estilos aplicados
            
            if (img.parentNode && img.parentNode.contains(img)) {
              img.parentNode.replaceChild(clonedImg, img);
              console.log('🔄 Imagem substituída para forçar reflow');
            }
          } catch (replaceError) {
            console.warn('Erro ao substituir imagem:', replaceError);
          }
        }
      });
      
      // Garantir que todos os elementos estejam visíveis
      const allElements = clonedDoc.querySelectorAll('*');
      allElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.style) {
          htmlEl.style.visibility = 'visible';
          htmlEl.style.opacity = '1';
          htmlEl.style.transform = 'none';
          htmlEl.style.animation = 'none';
          htmlEl.style.transition = 'none';
          htmlEl.style.pointerEvents = 'none';
        }
      });
      
      // Forçar recálculo de layout múltiplas vezes com delays
      clonedDoc.body.style.display = 'block';
      clonedDoc.body.offsetHeight; // Trigger reflow
      
      // Aguardar um pouco mais para garantir que tudo foi processado
      setTimeout(() => {
        clonedDoc.body.offsetHeight; // Trigger reflow novamente
        console.log('🔄 Segundo reflow executado');
      }, 100);
      
      setTimeout(() => {
        clonedDoc.body.offsetHeight; // Trigger reflow final
        console.log('🔄 Terceiro reflow executado');
      }, 200);
      
      console.log('✅ Elementos clonados processados completamente com correção avançada de imagens');
    }
  });
  
  console.log('✅ Canvas gerado com sucesso:', canvas.width + 'x' + canvas.height);
  return canvas;
};

export const cleanupCaptureElement = (element: HTMLElement) => {
  if (!element) return;
  
  requestAnimationFrame(() => {
    try {
      // Verificações múltiplas antes da remoção
      if (element && 
          element.isConnected && 
          element.parentNode && 
          element.parentNode.contains(element)) {
        element.remove();
        console.log('🧹 Elemento temporário limpo com segurança');
      }
    } catch (error) {
      console.warn('Erro no cleanup:', error);
      // Fallback seguro
      try {
        if (element.parentNode && element.parentNode.contains(element)) {
          element.parentNode.removeChild(element);
          console.log('🧹 Cleanup realizado via fallback');
        }
      } catch (fallbackError) {
        console.warn('Erro no fallback de cleanup:', fallbackError);
      }
    }
  });
};
