// Re-exportar BrandSettings de marketing-templates.ts para evitar duplicação
export type { BrandSettings } from './marketing-templates';

export const getGlobalLogoStyle = (position: string | null | undefined, size: number): React.CSSProperties => {
  console.log('🎯 getGlobalLogoStyle chamada:', { position, size });
  
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    width: `${size}px`,
    height: 'auto',
    zIndex: 9999, // Z-index muito alto para garantir visibilidade
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
