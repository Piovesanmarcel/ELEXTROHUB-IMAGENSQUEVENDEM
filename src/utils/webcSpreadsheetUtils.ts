import * as XLSX from 'xlsx';
import { PremiumAdProduct } from './premiumAdsUtils';

interface WebcFormattedProduct {
  SKU: string;
  Titulo: string;
  Descricao: string;
  Marca: string;
  EAN: string;
  Estoque: number;
  Categoria: string;
  'Preco de Custo': number;
  'Preco de Venda': number;
  'Peso (kg)': number;
  'Altura (cm)': number;
  'Largura (cm)': number;
  'Comprimento (cm)': number;
  Origem: number;
  CSOSN: string;
  NCM: string;
  CEST: string;
  Imagens: string;
  'Codigo Empresa Faturamento': string;
  Unidade: string;
  'Dias Garantia': string;
  'Fabricacao Propria': string;
  'Bloquear Estoque': string;
  'Endereco Estoque': string;
}

export function createWebcFormattedProduct(ad: PremiumAdProduct): WebcFormattedProduct {
  const multiplier = ad.kitQuantity || 1;
  
  const calculateBoxDimensions = (original: number | null | undefined): number => {
    if (!original || multiplier === 1) return original || 0;
    if (multiplier <= 6) return original;
    if (multiplier <= 10) return Math.round(original * 1.5);
    return Math.round(original * 2);
  };

  return {
    SKU: ad.sku,
    Titulo: ad.nome,
    Descricao: ad.descricao || '',
    Marca: ad.marca || '',
    EAN: ad.gtin || '',
    Estoque: ad.estoque || 0,
    Categoria: ad.categoria || '',
    'Preco de Custo': (ad.preco || 0) * multiplier,
    'Preco de Venda': (ad.preco || 0) * multiplier,
    'Peso (kg)': (ad.peso_bruto || 0) * multiplier,
    'Altura (cm)': calculateBoxDimensions(ad.altura),
    'Largura (cm)': calculateBoxDimensions(ad.largura),
    'Comprimento (cm)': ad.profundidade ? Math.round(ad.profundidade * multiplier) : 0,
    Origem: 0,
    CSOSN: '',
    NCM: '',
    CEST: '',
    Imagens: '', // URLs de imagens removidas - planilha sem URLs
    'Codigo Empresa Faturamento': '',
    Unidade: ad.unidade || 'UN',
    'Dias Garantia': '',
    'Fabricacao Propria': '',
    'Bloquear Estoque': '',
    'Endereco Estoque': ''
  };
}

export function generateWebcExcelFile(premiumAds: PremiumAdProduct[]): XLSX.WorkBook {
  console.log(`📊 Gerando planilha WEBC com ${premiumAds.length} anúncios`);
  
  const webcFormattedAds = premiumAds.map(ad => createWebcFormattedProduct(ad));
  
  const worksheet = XLSX.utils.json_to_sheet(webcFormattedAds);
  
  // Ajustar largura das colunas
  const colWidths = [
    { wch: 20 },  // SKU
    { wch: 60 },  // Titulo
    { wch: 100 }, // Descricao
    { wch: 20 },  // Marca
    { wch: 15 },  // EAN
    { wch: 10 },  // Estoque
    { wch: 30 },  // Categoria
    { wch: 12 },  // Preco de Custo
    { wch: 12 },  // Preco de Venda
    { wch: 10 },  // Peso
    { wch: 10 },  // Altura
    { wch: 10 },  // Largura
    { wch: 10 },  // Comprimento
    { wch: 10 },  // Origem
    { wch: 10 },  // CSOSN
    { wch: 10 },  // NCM
    { wch: 10 },  // CEST
    { wch: 150 }, // Imagens
    { wch: 20 },  // Codigo Empresa Faturamento
    { wch: 10 },  // Unidade
    { wch: 12 },  // Dias Garantia
    { wch: 15 },  // Fabricacao Propria
    { wch: 15 },  // Bloquear Estoque
    { wch: 20 }   // Endereco Estoque
  ];
  worksheet['!cols'] = colWidths;
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Anuncios WEBC');
  
  console.log('✅ Planilha WEBC gerada com sucesso');
  return workbook;
}

export function downloadWebcExcelFile(workbook: XLSX.WorkBook, fileName: string): boolean {
  try {
    XLSX.writeFile(workbook, fileName);
    console.log(`✅ Download da planilha WEBC iniciado: ${fileName}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao fazer download da planilha WEBC:', error);
    return false;
  }
}
