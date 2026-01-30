import { TemplateConfig, TemplateData, TemplateZone, BrandSettings } from '@/types/marketing-templates';
import { MarketingDataExtractor } from './marketing-data-extractor';

export class MarketingTemplateRenderer {
  private dataExtractor = new MarketingDataExtractor();

  async render(
    templateConfig: TemplateConfig,
    data: TemplateData,
    brandSettings?: BrandSettings | null
  ): Promise<Blob> {
    console.log('🎨 [RENDERER] Iniciando renderização');
    console.log('📐 Dimensões:', templateConfig.dimensions);
    console.log('🖼️ Base image:', templateConfig.baseImage);
    console.log('📊 Zonas:', templateConfig.zones.length);
    console.log('🏷️ Brand settings:', brandSettings ? 'Sim' : 'Não');

    const canvas = document.createElement('canvas');
    canvas.width = templateConfig.dimensions.width;
    canvas.height = templateConfig.dimensions.height;
    const ctx = canvas.getContext('2d')!;

    // Preencher com branco caso a imagem base não carregue
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load and draw base image (opcional - não falhar se não existir)
    try {
      console.log('🔄 Carregando imagem base...');
      const baseImg = await this.loadImage(templateConfig.baseImage);
      ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);
      console.log('✅ Imagem base carregada');
    } catch (error) {
      console.warn('⚠️ Imagem base não encontrada, usando fundo branco:', error);
      // Continuar sem a imagem base
    }

    // Sort zones by zIndex
    const sortedZones = [...templateConfig.zones].sort((a, b) => a.zIndex - b.zIndex);
    console.log('📑 Zonas ordenadas por zIndex');

    // Render each zone
    for (const zone of sortedZones) {
      console.log(`🔄 Renderizando zona ${zone.id} (${zone.type})`);
      const content = this.dataExtractor.extract(zone.dataSource, data);
      console.log(`📝 Conteúdo extraído para ${zone.id}:`, content);
      
      switch(zone.type) {
        case 'image':
          await this.renderImageZone(ctx, zone, content);
          break;
        case 'text':
          this.renderTextZone(ctx, zone, content);
          break;
        case 'badge':
          this.renderBadgeZone(ctx, zone, content);
          break;
      }
    }

    // Renderizar logo global (APÓS todas as zonas)
    if (
      brandSettings?.logo_url && 
      brandSettings?.show_logo_on_templates && 
      !templateConfig.disableGlobalLogo
    ) {
      console.log('🏷️ Renderizando logo global...');
      await this.renderGlobalLogo(ctx, templateConfig.dimensions, brandSettings);
    }

    console.log('✅ Renderização completa, gerando blob...');

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          console.log('✅ Blob gerado:', blob.size, 'bytes');
          resolve(blob);
        } else {
          console.error('❌ Falha ao gerar blob');
          throw new Error('Falha ao gerar blob da imagem');
        }
      }, 'image/png', 1.0);
    });
  }

  private async renderGlobalLogo(
    ctx: CanvasRenderingContext2D,
    dimensions: { width: number; height: number },
    brandSettings: BrandSettings
  ) {
    try {
      const logoImg = await this.loadImage(brandSettings.logo_url!);
      
      const logoSize = brandSettings.logo_size || 100;
      const margin = 20;
      
      // Calcular posição baseada na configuração
      let x: number, y: number;
      
      switch (brandSettings.logo_position) {
        case 'top-left':
          x = margin;
          y = margin;
          break;
        case 'top-right':
          x = dimensions.width - logoSize - margin;
          y = margin;
          break;
        case 'bottom-left':
          x = margin;
          y = dimensions.height - logoSize - margin;
          break;
        case 'bottom-right':
          x = dimensions.width - logoSize - margin;
          y = dimensions.height - logoSize - margin;
          break;
        default:
          x = dimensions.width - logoSize - margin;
          y = margin;
      }

      // Calcular dimensões mantendo aspect ratio
      const aspectRatio = logoImg.width / logoImg.height;
      let drawWidth = logoSize;
      let drawHeight = logoSize / aspectRatio;

      // Se altura for maior que largura, ajustar
      if (drawHeight > logoSize) {
        drawHeight = logoSize;
        drawWidth = logoSize * aspectRatio;
      }

      // Ajustar posição X para logos horizontais no canto direito
      if (brandSettings.logo_position === 'top-right' || brandSettings.logo_position === 'bottom-right') {
        x = dimensions.width - drawWidth - margin;
      }

      ctx.drawImage(logoImg, x, y, drawWidth, drawHeight);
      console.log('✅ Logo global renderizada em', brandSettings.logo_position);
    } catch (error) {
      console.error('❌ Erro ao renderizar logo global:', error);
    }
  }

  private async renderImageZone(
    ctx: CanvasRenderingContext2D,
    zone: TemplateZone,
    imageUrl: string
  ) {
    if (!imageUrl) return;

    try {
      const img = await this.loadImage(imageUrl);
      
      ctx.save();

      // Apply clipping for border-radius
      if (zone.style.borderRadius) {
        this.applyRoundedClip(ctx, zone.position, zone.style.borderRadius);
      }

      // Draw image with object-fit
      this.drawImageWithObjectFit(ctx, img, zone.position, zone.style.objectFit || 'contain');

      // Draw border if specified
      if (zone.style.border) {
        const borderParts = zone.style.border.split(' ');
        const borderWidth = parseInt(borderParts[0]);
        const borderColor = borderParts[2];
        
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        
        if (zone.style.borderRadius) {
          this.roundRect(ctx, zone.position, parseInt(zone.style.borderRadius));
          ctx.stroke();
        } else {
          ctx.strokeRect(zone.position.x, zone.position.y, zone.position.width, zone.position.height);
        }
      }

      ctx.restore();
    } catch (error) {
      console.error('Error rendering image zone:', error);
    }
  }

  private renderTextZone(
    ctx: CanvasRenderingContext2D,
    zone: TemplateZone,
    text: string
  ) {
    if (!text) return;

    ctx.save();

    // Draw background
    if (zone.style.backgroundColor) {
      ctx.fillStyle = zone.style.backgroundColor;
      const radius = parseInt(zone.style.borderRadius || '0');
      this.roundRect(ctx, zone.position, radius);
      ctx.fill();
    }

    // Configure text style
    const fontSize = parseInt(zone.style.fontSize || '16');
    const fontWeight = zone.style.fontWeight || '400';
    const fontFamily = zone.style.fontFamily || 'Inter, sans-serif';
    
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = zone.style.color || '#000000';
    ctx.textAlign = zone.style.textAlign || 'left';

    const padding = zone.style.padding || 0;
    const lineHeight = zone.style.lineHeight || 1.4;

    // Handle split lines for multi-color text
    if (zone.style.splitLines && text.includes('|')) {
      const lines = text.split('|');
      let y = zone.position.y + fontSize + padding;
      
      lines.forEach((line, index) => {
        const color = index === 0 ? (zone.style.line1Color || zone.style.color) : (zone.style.line2Color || zone.style.color);
        ctx.fillStyle = color!;
        
        const x = this.getAlignedX(ctx, zone, line.trim(), padding);
        ctx.fillText(line.trim(), x, y);
        y += fontSize * lineHeight;
      });
    } else {
      // Wrap text if maxLines specified
      const maxWidth = zone.position.width - (padding * 2);
      const lines = this.wrapText(ctx, text, maxWidth, zone.style.maxLines);

      let y = zone.position.y + fontSize + padding;
      lines.forEach(line => {
        const x = this.getAlignedX(ctx, zone, line, padding);
        ctx.fillText(line, x, y);
        y += fontSize * lineHeight;
      });
    }

    ctx.restore();
  }

  private renderBadgeZone(
    ctx: CanvasRenderingContext2D,
    zone: TemplateZone,
    text: string
  ) {
    this.renderTextZone(ctx, zone, text);
  }

  private getAlignedX(ctx: CanvasRenderingContext2D, zone: TemplateZone, text: string, padding: number): number {
    const align = zone.style.textAlign || 'left';
    
    if (align === 'center') {
      return zone.position.x + zone.position.width / 2;
    } else if (align === 'right') {
      return zone.position.x + zone.position.width - padding;
    } else {
      return zone.position.x + padding;
    }
  }

  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxLines?: number
  ): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
        
        if (maxLines && lines.length >= maxLines) {
          return lines;
        }
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return maxLines ? lines.slice(0, maxLines) : lines;
  }

  private applyRoundedClip(
    ctx: CanvasRenderingContext2D,
    position: { x: number; y: number; width: number; height: number },
    borderRadius: string
  ) {
    const radius = parseInt(borderRadius);
    
    if (borderRadius.includes('%')) {
      // Circle
      const centerX = position.x + position.width / 2;
      const centerY = position.y + position.height / 2;
      const r = Math.min(position.width, position.height) / 2;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.clip();
    } else {
      // Rounded rectangle
      this.roundRect(ctx, position, radius);
      ctx.clip();
    }
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    position: { x: number; y: number; width: number; height: number },
    radius: number
  ) {
    ctx.beginPath();
    ctx.moveTo(position.x + radius, position.y);
    ctx.lineTo(position.x + position.width - radius, position.y);
    ctx.quadraticCurveTo(position.x + position.width, position.y, position.x + position.width, position.y + radius);
    ctx.lineTo(position.x + position.width, position.y + position.height - radius);
    ctx.quadraticCurveTo(position.x + position.width, position.y + position.height, position.x + position.width - radius, position.y + position.height);
    ctx.lineTo(position.x + radius, position.y + position.height);
    ctx.quadraticCurveTo(position.x, position.y + position.height, position.x, position.y + position.height - radius);
    ctx.lineTo(position.x, position.y + radius);
    ctx.quadraticCurveTo(position.x, position.y, position.x + radius, position.y);
    ctx.closePath();
  }

  private drawImageWithObjectFit(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    position: { x: number; y: number; width: number; height: number },
    objectFit: 'contain' | 'cover' | 'fill' | 'none'
  ) {
    if (objectFit === 'fill') {
      ctx.drawImage(img, position.x, position.y, position.width, position.height);
      return;
    }

    const imgRatio = img.width / img.height;
    const boxRatio = position.width / position.height;

    let drawWidth, drawHeight, drawX, drawY;

    if (objectFit === 'contain') {
      if (imgRatio > boxRatio) {
        drawWidth = position.width;
        drawHeight = position.width / imgRatio;
        drawX = position.x;
        drawY = position.y + (position.height - drawHeight) / 2;
      } else {
        drawHeight = position.height;
        drawWidth = position.height * imgRatio;
        drawX = position.x + (position.width - drawWidth) / 2;
        drawY = position.y;
      }
    } else if (objectFit === 'cover') {
      if (imgRatio > boxRatio) {
        drawHeight = position.height;
        drawWidth = position.height * imgRatio;
        drawX = position.x + (position.width - drawWidth) / 2;
        drawY = position.y;
      } else {
        drawWidth = position.width;
        drawHeight = position.width / imgRatio;
        drawX = position.x;
        drawY = position.y + (position.height - drawHeight) / 2;
      }
    } else {
      // none
      drawWidth = img.width;
      drawHeight = img.height;
      drawX = position.x + (position.width - drawWidth) / 2;
      drawY = position.y + (position.height - drawHeight) / 2;
    }

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        console.log('✅ Imagem carregada:', src);
        resolve(img);
      };
      
      img.onerror = (error) => {
        console.error('❌ Erro ao carregar imagem:', src, error);
        reject(new Error(`Falha ao carregar imagem: ${src}`));
      };
      
      img.src = src;
      console.log('🔄 Carregando imagem:', src);
    });
  }
}
