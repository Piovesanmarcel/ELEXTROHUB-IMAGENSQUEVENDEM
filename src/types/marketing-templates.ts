export interface TemplateZonePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TemplateZoneStyle {
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  borderRadius?: string;
  padding?: number;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  maxLines?: number;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none';
  border?: string;
  line1Color?: string;
  line2Color?: string;
  splitLines?: boolean;
}

export interface TemplateZone {
  id: string;
  type: 'image' | 'text' | 'badge';
  position: TemplateZonePosition;
  zIndex: number;
  dataSource: string;
  style: TemplateZoneStyle;
}

export interface TemplateConfig {
  id: string;
  name: string;
  baseImage: string;
  dimensions: { width: number; height: number };
  zones: TemplateZone[];
  category?: string;
  colorScheme?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  disableGlobalLogo?: boolean;
  displayOrder?: number;
}

export const TEMPLATE_CATEGORIES = [
  'Geral 01',
  'Geral 02',
  'Brinquedos',
  'Cafeteiras',
  'Utilidades',
  'Pet Shop'
] as const;

export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number];

export interface TemplateData {
  aiImages: string[];
  unified: any; // UnifiedAIResponse
  product: {
    name: string;
    logoUrl?: string;
  };
  copywriting?: {
    characteristics: string[];  // Seção 3 - Destaque das Principais Características
    benefits: string[];         // Seção 5 - Principais Benefícios para o Cliente
    environments: string[];     // Seção 9 - Ambientes Ideais
    fullText?: string;          // Texto completo da copywriting
  };
}

export interface BrandSettings {
  id: string;
  user_id: string;
  logo_url: string | null;
  logo_position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  logo_size: number;
  show_logo_on_templates: boolean;
  created_at: string;
  updated_at: string;
}
