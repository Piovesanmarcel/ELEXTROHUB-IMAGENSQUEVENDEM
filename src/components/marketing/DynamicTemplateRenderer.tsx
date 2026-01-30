import React from 'react';
import type { TemplateConfig, TemplateData } from '@/types/marketing-templates';

interface BrandSettings {
  logo_url?: string | null;
  logo_position?: string | null;
  logo_size?: number | null;
  show_logo_on_templates?: boolean | null;
}

interface DynamicTemplateRendererProps {
  template: TemplateConfig;
  data: TemplateData;
  logoUrl?: string;
  backgroundClass?: string;
  brandSettings?: BrandSettings | null;
}

const getLogoPositionStyle = (position: string | null | undefined, size: number): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    width: `${size}px`,
    height: 'auto',
    zIndex: 1000,
    objectFit: 'contain' as const,
  };

  switch (position) {
    case 'top-left':
      return { ...baseStyle, top: '20px', left: '20px' };
    case 'top-right':
      return { ...baseStyle, top: '20px', right: '20px' };
    case 'bottom-left':
      return { ...baseStyle, bottom: '20px', left: '20px' };
    case 'bottom-right':
      return { ...baseStyle, bottom: '20px', right: '20px' };
    case 'center':
      return { ...baseStyle, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    default:
      return { ...baseStyle, top: '20px', right: '20px' };
  }
};

export const DynamicTemplateRenderer: React.FC<DynamicTemplateRendererProps> = ({
  template,
  data,
  logoUrl,
  backgroundClass = 'bg-white',
  brandSettings,
}) => {
  const { dimensions, zones, baseImage } = template;

  // Debug logging para verificar brandSettings
  console.log('🔍 DynamicTemplateRenderer brandSettings:', {
    brandSettings,
    logoUrl: brandSettings?.logo_url,
    showOnTemplates: brandSettings?.show_logo_on_templates,
    templateDisableGlobalLogo: template.disableGlobalLogo
  });

  const renderZone = (zone: any, index: number) => {
    const { type, position, style, dataSource, zIndex } = zone;
    
    const positionStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${position.x}%`,
      top: `${position.y}%`,
      width: `${position.width}%`,
      height: `${position.height}%`,
      zIndex: zIndex || index,
      ...style,
    };

    switch (type) {
      case 'image':
        if (dataSource === 'product.image') {
          const imageUrl = data.aiImages?.[0] || data.product.logoUrl || '';
          return (
            <img
              key={`zone-${index}`}
              src={imageUrl}
              alt="Product"
              style={{
                ...positionStyle,
                objectFit: (style?.objectFit as any) || 'contain',
              }}
              className="rounded-lg"
            />
          );
        } else if (dataSource === 'brand.logo' && logoUrl) {
          return (
            <img
              key={`zone-${index}`}
              src={logoUrl}
              alt="Logo"
              style={{
                ...positionStyle,
                objectFit: 'contain',
              }}
            />
          );
        }
        return null;

      case 'text':
        let textContent = '';
        
        if (dataSource === 'product.name') {
          textContent = data.product.name;
        } else if (dataSource === 'ai.benefit') {
          textContent = data.unified?.benefits?.[0] || 'Benefício do produto';
        } else if (dataSource === 'ai.callToAction') {
          textContent = data.unified?.callToAction || 'Compre Agora!';
        }

        // Tratamento especial para texto com 2 linhas em cores diferentes
        if (style?.splitLines && dataSource === 'product.name') {
          const words = textContent.split(' ');
          const mid = Math.ceil(words.length / 2);
          const line1 = words.slice(0, mid).join(' ');
          const line2 = words.slice(mid).join(' ');

          return (
            <div
              key={`zone-${index}`}
              style={{
                ...positionStyle,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: style?.textAlign === 'center' ? 'center' : style?.textAlign === 'right' ? 'flex-end' : 'flex-start',
              }}
            >
              <div style={{ color: style?.line1Color || style?.color, fontSize: style?.fontSize, fontWeight: style?.fontWeight }}>
                {line1}
              </div>
              <div style={{ color: style?.line2Color || style?.color, fontSize: style?.fontSize, fontWeight: style?.fontWeight }}>
                {line2}
              </div>
            </div>
          );
        }

        return (
          <div
            key={`zone-${index}`}
            style={{
              ...positionStyle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: style?.textAlign === 'center' ? 'center' : style?.textAlign === 'right' ? 'flex-end' : 'flex-start',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <span style={{ 
              fontSize: style?.fontSize,
              fontWeight: style?.fontWeight,
              color: style?.color,
              textAlign: style?.textAlign,
              lineHeight: style?.lineHeight,
            }}>
              {textContent}
            </span>
          </div>
        );

      case 'badge':
        return (
          <div
            key={`zone-${index}`}
            style={{
              ...positionStyle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: style?.backgroundColor,
              borderRadius: style?.borderRadius,
              padding: style?.padding,
              border: style?.border,
            }}
          >
            <span style={{ 
              fontSize: style?.fontSize,
              fontWeight: style?.fontWeight || 'bold',
              color: style?.color,
            }}>
              {dataSource === 'static.discount' ? '50% OFF' : 'NOVIDADE'}
            </span>
          </div>
        );

      default:
        return null;
    }
  };

  // Verificar se deve mostrar logo global
  const shouldShowGlobalLogo = 
    brandSettings?.logo_url && 
    brandSettings?.show_logo_on_templates && 
    !template.disableGlobalLogo;

  const logoSize = brandSettings?.logo_size || 100;

  return (
    <div
      className={`relative ${backgroundClass}`}
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        backgroundImage: baseImage ? `url(${baseImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {zones.map((zone, index) => renderZone(zone, index))}
      
      {/* Renderizar logo global se configurado */}
      {shouldShowGlobalLogo && (
        <img
          src={brandSettings.logo_url!}
          alt="Logo da marca"
          style={getLogoPositionStyle(brandSettings.logo_position, logoSize)}
        />
      )}
    </div>
  );
};
