
import { safeBlobDownload } from "./safeDownload";

interface TemplateData {
  productName: string;
  productImages: string[];
  logoUrl?: string;
  productDescription?: string;
  productBenefits?: string[];
  productFaqs?: Array<{ question: string; answer: string }>;
  productPainPoints?: string[];
  productSolutions?: string[];
  testimonials?: Array<{ name: string; text: string; rating: number }>;
  seoDescription?: string;
  idealFor?: string;
  guarantee?: string;
}

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn(`Falha ao carregar imagem: ${src}`);
      resolve(img); // Resolve mesmo com erro para não parar o processo
    };
    img.src = src;
  });
};

const createGradient = (ctx: CanvasRenderingContext2D, colors: string[], width: number, height: number) => {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  colors.forEach((color, index) => {
    gradient.addColorStop(index / (colors.length - 1), color);
  });
  return gradient;
};

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
};

const drawTemplate1 = async (ctx: CanvasRenderingContext2D, data: TemplateData) => {
  const { productName, productImages, logoUrl } = data;
  
  // Background gradient
  const gradient = createGradient(ctx, ['#10b981', '#059669', '#047857'], 1200, 1200);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 1200);
  
  // Product image
  if (productImages[0]) {
    try {
      const productImg = await loadImage(productImages[0]);
      if (productImg.complete) {
        ctx.drawImage(productImg, 150, 150, 900, 600);
      }
    } catch (error) {
      console.warn('Erro ao carregar imagem do produto');
    }
  }
  
  // Product name
  ctx.fillStyle = 'white';
  ctx.font = 'bold 72px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(productName, 600, 850);
  
  // Logo
  if (logoUrl) {
    try {
      const logoImg = await loadImage(logoUrl);
      if (logoImg.complete) {
        ctx.drawImage(logoImg, 50, 50, 150, 150);
      }
    } catch (error) {
      console.warn('Erro ao carregar logo');
    }
  }
  
  // Bottom badge
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.roundRect(400, 950, 400, 80, 40);
  ctx.fill();
  
  ctx.fillStyle = '#92400e';
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⭐ PRODUTO PREMIUM', 600, 1000);
};

const drawTemplate2 = async (ctx: CanvasRenderingContext2D, data: TemplateData) => {
  const { productName, productImages, logoUrl, idealFor } = data;
  
  // Background gradient
  const gradient = createGradient(ctx, ['#3b82f6', '#1d4ed8', '#1e40af'], 1200, 1200);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 1200);
  
  // Title
  ctx.fillStyle = 'white';
  ctx.font = 'bold 48px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('💡 IDEAL PARA', 600, 150);
  
  // Product image
  if (productImages[0]) {
    try {
      const productImg = await loadImage(productImages[0]);
      if (productImg.complete) {
        ctx.drawImage(productImg, 200, 200, 800, 500);
      }
    } catch (error) {
      console.warn('Erro ao carregar imagem do produto');
    }
  }
  
  // Description box
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.roundRect(100, 750, 1000, 200, 20);
  ctx.fill();
  
  // Description text
  ctx.fillStyle = '#1f2937';
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.textAlign = 'center';
  const description = idealFor ? idealFor.substring(0, 80) + '...' : 'Ideal para pessoas que valorizam qualidade';
  const lines = wrapText(ctx, description, 900);
  lines.forEach((line, index) => {
    ctx.fillText(line, 600, 820 + index * 35);
  });
  
  // Logo
  if (logoUrl) {
    try {
      const logoImg = await loadImage(logoUrl);
      if (logoImg.complete) {
        ctx.drawImage(logoImg, 1000, 50, 120, 120);
      }
    } catch (error) {
      console.warn('Erro ao carregar logo');
    }
  }
};

const drawTemplate3 = async (ctx: CanvasRenderingContext2D, data: TemplateData) => {
  const { productName, productImages, logoUrl, guarantee } = data;
  
  // Background gradient
  const gradient = createGradient(ctx, ['#8b5cf6', '#7c3aed', '#6d28d9'], 1200, 1200);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 1200);
  
  // Product image
  if (productImages[0]) {
    try {
      const productImg = await loadImage(productImages[0]);
      if (productImg.complete) {
        ctx.drawImage(productImg, 100, 100, 1000, 600);
      }
    } catch (error) {
      console.warn('Erro ao carregar imagem do produto');
    }
  }
  
  // Guarantee section
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.roundRect(150, 750, 900, 300, 30);
  ctx.fill();
  
  // Title
  ctx.fillStyle = '#059669';
  ctx.font = 'bold 36px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🛡️ GARANTIA TOTAL', 600, 820);
  
  // Guarantee text
  ctx.fillStyle = '#374151';
  ctx.font = '24px Arial, sans-serif';
  const guaranteeText = guarantee ? guarantee.substring(0, 100) + '...' : 'Garantia completa ou seu dinheiro de volta!';
  const lines = wrapText(ctx, guaranteeText, 800);
  lines.forEach((line, index) => {
    ctx.fillText(line, 600, 880 + index * 30);
  });
  
  // Logo
  if (logoUrl) {
    try {
      const logoImg = await loadImage(logoUrl);
      if (logoImg.complete) {
        ctx.drawImage(logoImg, 50, 50, 150, 150);
      }
    } catch (error) {
      console.warn('Erro ao carregar logo');
    }
  }
};

const drawTemplate4 = async (ctx: CanvasRenderingContext2D, data: TemplateData) => {
  const { productName, productImages, logoUrl, seoDescription } = data;
  
  // Background gradient
  const gradient = createGradient(ctx, ['#f59e0b', '#d97706', '#b45309'], 1200, 1200);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 1200);
  
  // Product image
  if (productImages[0]) {
    try {
      const productImg = await loadImage(productImages[0]);
      if (productImg.complete) {
        ctx.drawImage(productImg, 150, 100, 900, 700);
      }
    } catch (error) {
      console.warn('Erro ao carregar imagem do produto');
    }
  }
  
  // Description box
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.roundRect(100, 850, 1000, 250, 25);
  ctx.fill();
  
  // Description text
  ctx.fillStyle = '#374151';
  ctx.font = '28px Arial, sans-serif';
  ctx.textAlign = 'center';
  const description = seoDescription ? seoDescription.substring(0, 120) + '...' : 'Produto premium com qualidade garantida';
  const lines = wrapText(ctx, description, 900);
  lines.forEach((line, index) => {
    ctx.fillText(line, 600, 920 + index * 35);
  });
  
  // Logo
  if (logoUrl) {
    try {
      const logoImg = await loadImage(logoUrl);
      if (logoImg.complete) {
        ctx.drawImage(logoImg, 1000, 50, 150, 150);
      }
    } catch (error) {
      console.warn('Erro ao carregar logo');
    }
  }
};

const drawTemplate5 = async (ctx: CanvasRenderingContext2D, data: TemplateData) => {
  const { productName, productImages, logoUrl, productBenefits } = data;
  
  // Background gradient
  const gradient = createGradient(ctx, ['#ef4444', '#dc2626', '#b91c1c'], 1200, 1200);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 1200);
  
  // Title
  ctx.fillStyle = 'white';
  ctx.font = 'bold 48px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✨ BENEFÍCIOS', 600, 100);
  
  // Product image
  if (productImages[0]) {
    try {
      const productImg = await loadImage(productImages[0]);
      if (productImg.complete) {
        ctx.drawImage(productImg, 50, 150, 500, 400);
      }
    } catch (error) {
      console.warn('Erro ao carregar imagem do produto');
    }
  }
  
  // Benefits
  if (productBenefits) {
    productBenefits.slice(0, 4).forEach((benefit, index) => {
      // Benefit box
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.roundRect(600, 200 + index * 120, 550, 80, 15);
      ctx.fill();
      
      // Benefit text
      ctx.fillStyle = '#374151';
      ctx.font = '20px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`✓ ${benefit.substring(0, 40)}`, 875, 245 + index * 120);
    });
  }
  
  // Logo
  if (logoUrl) {
    try {
      const logoImg = await loadImage(logoUrl);
      if (logoImg.complete) {
        ctx.drawImage(logoImg, 50, 600, 120, 120);
      }
    } catch (error) {
      console.warn('Erro ao carregar logo');
    }
  }
};

const drawTemplate6 = async (ctx: CanvasRenderingContext2D, data: TemplateData) => {
  const { productName, productImages, logoUrl, productFaqs } = data;
  
  // Background gradient
  const gradient = createGradient(ctx, ['#10b981', '#059669', '#047857'], 1200, 1200);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 1200);
  
  // Title
  ctx.fillStyle = 'white';
  ctx.font = 'bold 42px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('❓ PERGUNTAS FREQUENTES', 600, 100);
  
  // FAQs
  if (productFaqs) {
    productFaqs.slice(0, 3).forEach((faq, index) => {
      // FAQ box
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath();
      ctx.roundRect(100, 200 + index * 250, 1000, 200, 20);
      ctx.fill();
      
      // Question
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 24px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Q: ${faq.question.substring(0, 50)}`, 150, 250 + index * 250);
      
      // Answer
      ctx.fillStyle = '#374151';
      ctx.font = '20px Arial, sans-serif';
      const answerLines = wrapText(ctx, `A: ${faq.answer.substring(0, 80)}`, 900);
      answerLines.forEach((line, lineIndex) => {
        ctx.fillText(line, 150, 290 + index * 250 + lineIndex * 25);
      });
    });
  }
  
  // Logo
  if (logoUrl) {
    try {
      const logoImg = await loadImage(logoUrl);
      if (logoImg.complete) {
        ctx.drawImage(logoImg, 1000, 50, 120, 120);
      }
    } catch (error) {
      console.warn('Erro ao carregar logo');
    }
  }
};

const drawTemplate7 = async (ctx: CanvasRenderingContext2D, data: TemplateData) => {
  const { productName, productImages, logoUrl, productPainPoints, productSolutions } = data;
  
  // Background gradient
  const gradient = createGradient(ctx, ['#f59e0b', '#d97706', '#b45309'], 1200, 1200);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 1200);
  
  // Title
  ctx.fillStyle = 'white';
  ctx.font = 'bold 42px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🔄 ANTES vs DEPOIS', 600, 80);
  
  // Before section
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.roundRect(50, 150, 500, 400, 20);
  ctx.fill();
  
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('❌ ANTES', 300, 200);
  
  if (productPainPoints) {
    ctx.fillStyle = '#374151';
    ctx.font = '16px Arial, sans-serif';
    ctx.textAlign = 'left';
    productPainPoints.slice(0, 3).forEach((pain, index) => {
      ctx.fillText(`• ${pain.substring(0, 40)}`, 80, 250 + index * 50);
    });
  }
  
  // After section
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.roundRect(650, 150, 500, 400, 20);
  ctx.fill();
  
  ctx.fillStyle = '#059669';
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✅ DEPOIS', 900, 200);
  
  if (productSolutions) {
    ctx.fillStyle = '#374151';
    ctx.font = '16px Arial, sans-serif';
    ctx.textAlign = 'left';
    productSolutions.slice(0, 3).forEach((solution, index) => {
      ctx.fillText(`• ${solution.substring(0, 40)}`, 680, 250 + index * 50);
    });
  }
  
  // Product image
  if (productImages[0]) {
    try {
      const productImg = await loadImage(productImages[0]);
      if (productImg.complete) {
        ctx.drawImage(productImg, 400, 600, 400, 300);
      }
    } catch (error) {
      console.warn('Erro ao carregar imagem do produto');
    }
  }
  
  // Logo
  if (logoUrl) {
    try {
      const logoImg = await loadImage(logoUrl);
      if (logoImg.complete) {
        ctx.drawImage(logoImg, 50, 50, 120, 120);
      }
    } catch (error) {
      console.warn('Erro ao carregar logo');
    }
  }
};

const drawTemplate8 = async (ctx: CanvasRenderingContext2D, data: TemplateData) => {
  const { productName, productImages, logoUrl, testimonials } = data;
  
  // Background gradient
  const gradient = createGradient(ctx, ['#8b5cf6', '#7c3aed', '#6d28d9'], 1200, 1200);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 1200);
  
  // Title
  ctx.fillStyle = 'white';
  ctx.font = 'bold 42px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('💬 DEPOIMENTOS', 600, 80);
  
  // Product image
  if (productImages[0]) {
    try {
      const productImg = await loadImage(productImages[0]);
      if (productImg.complete) {
        ctx.drawImage(productImg, 50, 150, 400, 300);
      }
    } catch (error) {
      console.warn('Erro ao carregar imagem do produto');
    }
  }
  
  // Testimonials
  if (testimonials) {
    testimonials.slice(0, 3).forEach((testimonial, index) => {
      // Testimonial box
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath();
      ctx.roundRect(500, 150 + index * 200, 650, 150, 15);
      ctx.fill();
      
      // Stars
      ctx.fillStyle = '#fbbf24';
      ctx.font = '20px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('⭐⭐⭐⭐⭐', 550, 190 + index * 200);
      
      // Testimonial text
      ctx.fillStyle = '#374151';
      ctx.font = '16px Arial, sans-serif';
      ctx.fillText(`"${testimonial.text.substring(0, 60)}"`, 550, 220 + index * 200);
      
      // Name
      ctx.fillStyle = '#6b7280';
      ctx.font = 'bold 14px Arial, sans-serif';
      ctx.fillText(`- ${testimonial.name}`, 550, 250 + index * 200);
    });
  }
  
  // Logo
  if (logoUrl) {
    try {
      const logoImg = await loadImage(logoUrl);
      if (logoImg.complete) {
        ctx.drawImage(logoImg, 50, 500, 120, 120);
      }
    } catch (error) {
      console.warn('Erro ao carregar logo');
    }
  }
};

export const downloadMarketingImage = async (templateId: string, data: TemplateData) => {
  console.log(`🎯 Iniciando download canvas para template: ${templateId}`);
  
  // Criar canvas
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Contexto canvas não disponível');
  }
  
  // Configurar canvas para melhor qualidade
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  try {
    // Desenhar template específico
    switch (templateId) {
      case 'template1':
        await drawTemplate1(ctx, data);
        break;
      case 'template2':
        await drawTemplate2(ctx, data);
        break;
      case 'template3':
        await drawTemplate3(ctx, data);
        break;
      case 'template4':
        await drawTemplate4(ctx, data);
        break;
      case 'template5':
        await drawTemplate5(ctx, data);
        break;
      case 'template6':
        await drawTemplate6(ctx, data);
        break;
      case 'template7':
        await drawTemplate7(ctx, data);
        break;
      case 'template8':
        await drawTemplate8(ctx, data);
        break;
      default:
        await drawTemplate1(ctx, data);
    }
    
    // Converter para blob e baixar
    return new Promise<void>((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (blob && blob.size > 0) {
          console.log(`✅ Canvas gerado: ${blob.size} bytes`);
          
          const fileName = `${data.productName}-${templateId}.png`;
          await safeBlobDownload(blob, fileName);
          
          console.log('🎉 Download concluído com sucesso!');
          resolve();
        } else {
          reject(new Error('Erro ao gerar imagem do canvas'));
        }
      }, 'image/png', 1.0);
    });
    
  } catch (error) {
    console.error('❌ Erro no download canvas:', error);
    throw error;
  }
};
