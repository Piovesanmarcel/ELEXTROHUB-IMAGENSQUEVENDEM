import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Product, ProductVariation } from "@/utils/productFilterUtils";

// ============= CONSTANTES DE ENRIQUECIMENTO DE TÍTULOS =============
// 6 categorias de palavras para percepção de valor e conversão
const TITLE_ENRICHMENT_WORDS = {
  // Percepção de Valor
  value: [
    'Mais Vendido', 'Premium', 'Profissional', 'Exclusivo', 'Autêntico',
    'Alta Qualidade', 'Linha Premium', 'Superior', 'Top de Linha', 'Seleção Especial'
  ],
  
  // Benefícios Principais
  benefit: [
    'Potente', 'Eficiente', 'Alta Performance', 'Alto Desempenho', 'Seguro',
    'Confiável', 'Durável', 'Resistente', 'Confortável', 'Prático'
  ],
  
  // Diferenciais
  differentiator: [
    'Elegante', 'Moderno', 'Sofisticado', 'Luxuoso', 'Ergonômico',
    'Inteligente', 'Edição Limitada', 'Inovador', 'Tecnologia Avançada', 'Design Exclusivo'
  ],
  
  // Intenção de Compra (alta conversão)
  purchaseIntent: [
    'Ideal para', 'Indicado para', 'Perfeito para', 'Uso Diário',
    'Uso Doméstico', 'Uso Profissional', 'Compatível com', 'Recomendado para'
  ],
  
  // Resolução de Problema
  problemSolving: [
    'Elimina', 'Reduz', 'Evita', 'Facilita', 'Otimiza',
    'Economiza Tempo', 'Economia de Energia', 'Sem Esforço'
  ],
  
  // Micro-Benefícios (baixa concorrência)
  microBenefits: [
    'Silencioso', 'Compacto', 'Leve', 'Portátil', 'Dobrável',
    'Fácil de Usar', 'Plug & Play', 'Sem Fio'
  ]
} as const;

// Função para enriquecer títulos com palavras de percepção de valor (com controle de repetição)
function enrichTitleWithValueWords(
  title: string, 
  adIndex: number, 
  usedEnrichmentWords?: Set<string>
): { enrichedTitle: string; wordUsed: string | null } {
  // Verificar se título já contém palavras de enriquecimento
  const allWords = [
    ...TITLE_ENRICHMENT_WORDS.value,
    ...TITLE_ENRICHMENT_WORDS.benefit,
    ...TITLE_ENRICHMENT_WORDS.differentiator,
    ...TITLE_ENRICHMENT_WORDS.purchaseIntent,
    ...TITLE_ENRICHMENT_WORDS.problemSolving,
    ...TITLE_ENRICHMENT_WORDS.microBenefits
  ];
  
  const hasEnrichment = allWords.some(word => 
    title.toLowerCase().includes(word.toLowerCase())
  );
  
  if (hasEnrichment) {
    console.log(`📝 [ENRICH] Título já enriquecido, mantendo original`);
    return { enrichedTitle: clipTitle(title, 150), wordUsed: null };
  }
  
  // Selecionar categoria baseada no índice do anúncio (rotação entre 6 categorias)
  const categories = Object.keys(TITLE_ENRICHMENT_WORDS) as (keyof typeof TITLE_ENRICHMENT_WORDS)[];
  const categoryIndex = adIndex % categories.length;
  const category = categories[categoryIndex];
  const words = TITLE_ENRICHMENT_WORDS[category];
  
  // Encontrar palavra que ainda não foi usada
  let selectedWord: string | null = null;
  for (let w = 0; w < words.length; w++) {
    const wordIndex = (Math.floor(adIndex / categories.length) + w) % words.length;
    const candidateWord = words[wordIndex];
    if (!usedEnrichmentWords || !usedEnrichmentWords.has(candidateWord.toLowerCase())) {
      selectedWord = candidateWord;
      break;
    }
  }
  
  // Se todas as palavras da categoria já foram usadas, usar qualquer uma não usada
  if (!selectedWord) {
    for (const cat of categories) {
      for (const word of TITLE_ENRICHMENT_WORDS[cat]) {
        if (!usedEnrichmentWords || !usedEnrichmentWords.has(word.toLowerCase())) {
          selectedWord = word;
          break;
        }
      }
      if (selectedWord) break;
    }
  }
  
  // Fallback: usar palavra baseada no índice original
  if (!selectedWord) {
    const wordIndex = Math.floor(adIndex / categories.length) % words.length;
    selectedWord = words[wordIndex];
  }
  
  // Padrões de combinação baseados na categoria
  let enrichedTitle: string;
  
  switch (category) {
    case 'purchaseIntent':
      enrichedTitle = `${selectedWord} ${title}`;
      break;
      
    case 'problemSolving':
      if (['Elimina', 'Reduz', 'Evita', 'Facilita', 'Otimiza'].includes(selectedWord)) {
        enrichedTitle = `${title} que ${selectedWord}`;
      } else {
        enrichedTitle = `${title} - ${selectedWord}`;
      }
      break;
      
    case 'microBenefits':
      enrichedTitle = `${title} - ${selectedWord}`;
      break;
      
    default:
      if (adIndex % 2 === 0) {
        enrichedTitle = `${title} - ${selectedWord}`;
      } else {
        enrichedTitle = `${selectedWord} ${title}`;
      }
  }
  
  console.log(`✨ [ENRICH] Ad ${adIndex + 1}: Categoria "${category}" → "${selectedWord}"`);
  return { enrichedTitle: clipTitle(enrichedTitle, 150), wordUsed: selectedWord };
}

export interface PremiumAdProduct {
  nome: string;
  sku: string;
  descricao?: string;
  descricao_curta?: string;
  preco?: number;
  categoria?: string;
  marca?: string;
  gtin?: string;
  peso_bruto?: number;
  largura?: number;
  altura?: number;
  profundidade?: number;
  unidade?: string;
  situacao?: string;
  estoque?: number;
  kitQuantity?: number;
  imageUrls: string[];
}

export interface HostedImage {
  id: string;
  url: string;
  tags: string[];
  description?: string;
  original_filename: string;
}

export interface SEOTitles {
  titles: string[];
}

// ============= FILTRO DE PALAVRAS PROIBIDAS EM TÍTULOS =============
const FORBIDDEN_TITLE_PREFIXES = [
  'comprar',
  'onde comprar',
  'preço',
  'promoção',
  'melhor',
  'oferta',
  'cor',
  '1 cor',
  '1 tamanho',
  '1 cor | 1 tamanho',
  '- 1 cor | 1 tamanho disponíveis',
  '- 1 cor',
  '- 1 tamanho'
];

// Verificar se título começa com palavra proibida
function startsWithForbiddenWord(title: string): boolean {
  const lowerTitle = title.toLowerCase().trim();
  return FORBIDDEN_TITLE_PREFIXES.some(prefix => 
    lowerTitle.startsWith(prefix.toLowerCase())
  );
}

// Filtrar títulos válidos (remover os que começam com palavras proibidas)
function filterValidSEOTitles(titles: string[]): string[] {
  return titles.filter(title => {
    const isValid = !startsWithForbiddenWord(title);
    if (!isValid) {
      console.log(`🚫 [FILTRO] Título removido (palavra proibida): "${title.substring(0, 60)}..."`);
    }
    return isValid;
  });
}

export interface AdStructureAnalysis {
  adNumber: number;
  adType: string;
  isValid: boolean;
  imageBreakdown: {
    total: number;
    kit: { exact: number; generic: number; wrong: number };
    marketing: { description: number; features: number; benefits: number; canva: number; total: number };
    runware: number;
    geminiWhite: number;
    geminiBackground: number;
    bfl: number;
    bflWhite: number;
    runway: number;
    deepai: number;
    whiteBackground: number;
    showcase: number;
  };
  expectedCounts: {
    description: string;
  };
  issues: string[];
  notes: string[];
}

export interface AdsStructureReport {
  totalAds: number;
  validAds: number;
  invalidAds: number;
  poolCounts: Record<string, number>;
  adsAnalysis: AdStructureAnalysis[];
}

// Função para mapear número do anúncio para nome descritivo
export function getAdTypeName(adNumber: number): string {
  const kitQuantities = [2, 4, 6, 8, 10, 20, 30];
  
  const adTypeMap: Record<number, string> = {
    1: '🚀 IA Avançada - Runware',
    2: '🎨 Gemini Background + White',
    3: '🌟 BFL.ai + BFL White',
    4: '🎭 Mix BFL White + Runway + Gemini',
    5: '💎 Gemini White + Marketing Gatilhos Gemini',
    6: '⚡ BFL White + Marketing Gatilhos Runware',
    7: '🔥 BFL White + Marketing Gatilhos BFL',
    8: '🤍 Mix Fundo Branco (4 imagens)',
    9: '🎲 1 Fundo Branco + 6 Aleatórias (A)',
    10: '🎲 1 Fundo Branco + 6 Aleatórias (B)',
    11: `📦 KIT ${kitQuantities[0]} UNIDADES`,
    12: `📦 KIT ${kitQuantities[1]} UNIDADES`,
    13: `📦 KIT ${kitQuantities[2]} UNIDADES`,
    14: `📦 KIT ${kitQuantities[3]} UNIDADES`,
    15: `📦 KIT ${kitQuantities[4]} UNIDADES`,
    16: `📦 KIT ${kitQuantities[5]} UNIDADES`,
    17: `📦 KIT ${kitQuantities[6]} UNIDADES`,
    18: '🌈 MIX BALANCED (sem Marketing)',
    19: '🤖 MIX AI FOCUS (sem Marketing)',
    20: '🎯 MIX DIVERSE (sem Marketing)',
    21: '💎 Melhoria com DeepAI + Marketing Gatilhos',
    22: '🚀 3 IA Avançada (Runware) + Marketing Gemini (TODOS)',
    23: '🌟 3 BFL/BFL White + Marketing Runware (TODOS)',
    24: '🎨 3 Gemini Background + Marketing BFL (TODOS)',
    25: '🎯 8 Templates Galeria Hospedada (Combo A)',
    26: '🎪 8 Templates Galeria Hospedada (Combo B)',
    27: '🎭 8 Templates Galeria Hospedada (Combo C)',
    28: '🎨 8 Templates Galeria Hospedada (Combo D)'
  };
  
  return adTypeMap[adNumber] || `Anúncio ${adNumber}`;
}

export const isRunware = (img: HostedImage): boolean => {
  if (!img?.tags?.length) return false;
  const tagsLower = img.tags.map(t => t.toLowerCase());
  const hasRunware = tagsLower.some(tag => 
    tag.includes('runware') || 
    tag === 'original-source:runware' ||
    tag === 'ai-source:runware' ||
    tag === 'source:runware-hosted' ||
    tag === 'source:runware-upscale-hosted' ||
    tag === 'ai-source:runware-upscale' ||
    tag === 'ai-origin:runware' ||
    tag === 'enhancement:runware' ||
    tag === 'hosted-from:runware'
  );
  const hasRunway = tagsLower.some(tag => tag.includes('runway'));
  return hasRunware && !hasRunway;
};
export const isGeminiBackground = (img: HostedImage): boolean => {
  if (!img?.tags?.length) return false;
  const tagsLower = img.tags.map(t => t.toLowerCase());
  return tagsLower.some(tag => 
    tag === 'original-source:gemini-background' ||
    tag === 'ai-source:gemini-background' ||
    tag === 'source:gemini-background-hosted' ||
    tag === 'ai-origin:gemini' ||
    tag === 'enhancement:gemini' ||
    tag === 'hosted-from:gemini-background' ||
    (tag.includes('gemini') && tag.includes('background') && !tag.includes('white'))
  );
};

export const isGeminiWhite = (img: HostedImage): boolean => {
  if (!img?.tags?.length) return false;
  const tagsLower = img.tags.map(t => t.toLowerCase());
  return tagsLower.some(tag => 
    tag === 'original-source:gemini-white-background' ||
    tag === 'ai-source:gemini-white-background' ||
    tag === 'source:gemini-white-background-hosted' ||
    tag === 'enhancement:gemini-white' ||
    tag === 'hosted-from:gemini-white' ||
    (tag.includes('gemini') && tag.includes('white'))
  );
};
export const isBfl = (img: HostedImage): boolean => {
  if (!img?.tags?.length) return false;
  const tagsLower = img.tags.map(t => t.toLowerCase());
  return tagsLower.some(tag => 
    tag.includes('bfl') && !tag.includes('white') ||
    tag === 'ai-source:bfl' ||
    tag === 'ai-origin:bfl' ||
    tag === 'source:bfl-hosted' ||
    tag === 'enhancement:bfl' ||
    tag === 'hosted-from:bfl'
  );
};

export const isBflWhite = (img: HostedImage): boolean => {
  if (!img?.tags?.length) return false;
  const tagsLower = img.tags.map(t => t.toLowerCase());
  return tagsLower.some(tag => 
    (tag.includes('bfl') && tag.includes('white')) ||
    tag === 'source:bfl-white-background-hosted' ||
    tag === 'original-source:bfl-white-background' ||
    tag === 'ai-source:bfl-white-background' ||
    tag === 'enhancement:bfl-white' ||
    tag === 'hosted-from:bfl-white'
  );
};
const isRunway = (image: HostedImage) => image.tags.some(tag => tag.toLowerCase().includes('original-source:runway'));
const isDeepAI = (image: HostedImage) => image.tags.some(tag => {
  const t = tag.toLowerCase();
  return t.includes('source:deepai-enhancement') || 
         t.includes('source:deepai-hosted') || 
         t.includes('original-source:deepai') || 
         t.includes('ai-source:deepai') ||
         t.includes('enhancement:deepai');
});

// Funções específicas para Marketing Gatilhos por IA
const isMarketingGemini = (image: HostedImage) => image.tags.some(tag => tag.includes('marketing-gatilhos-gemini'));
const isMarketingRunware = (image: HostedImage) => image.tags.some(tag => tag.includes('marketing-gatilhos-runware'));
const isMarketingBfl = (image: HostedImage) => image.tags.some(tag => tag.includes('marketing-gatilhos-bfl'));
const isMarketingOthers = (image: HostedImage) => image.tags.some(tag => tag.includes('marketing-gatilhos-outros'));

// ✅ Função para identificar Templates de Marketing Estilo Canva
const isMarketingCanvaTemplate = (image: HostedImage) => image.tags.some(tag => tag.includes('source:marketing-templates-hosted'));

// ✅ Funções específicas para os 3 tipos de Marketing Gatilhos que queremos (Descrição, Características, Benefícios)
const isMarketingDescription = (image: HostedImage) => image.tags.some(tag => tag.includes('generator:intro')); // "Descrição" = generator:intro
const isMarketingFeatures = (image: HostedImage) => image.tags.some(tag => tag.includes('generator:features')); // "Características"
const isMarketingBenefits = (image: HostedImage) => image.tags.some(tag => tag.includes('generator:benefits')); // "Benefícios"

const isMarketingTriggers = (image: HostedImage) => image.tags.some(tag => tag.includes('-processed') || tag.includes('marketing-gatilhos'));
const hasMarketingProcessing = (image: HostedImage) => image.tags.some(tag => tag.includes('-processed') || tag.includes('marketing'));
// ✅ Detector estrito: Imagens de KIT (tags explícitas)
const isKitImage = (image: HostedImage) => {
  return image.tags.some(tag => {
    const t = tag.toLowerCase();
    return (
      t === 'type:kit-image' ||
      t.includes('source:cloudinary-kit-hosted') ||
      t.includes('ai-source:cloudinary-kit') ||
      t.includes('original-source:cloudinary-kit')
    );
  });
};

// ✅ Detector fallback: KIT por padrões (só quando não houver tags)
const isKitImageFallback = (image: HostedImage): boolean => {
  const filename = (image.original_filename || '').toLowerCase();
  const description = (image.description || '').toLowerCase();
  const combined = `${filename} ${description}`;
  
  // Padrões robustos de KIT com quantidade
  const kitPatterns = [
    /\bkit\s*(?:com|de)?\s*(\d+)\s*(?:unidade|produto|peça|item)/i,
    /(\d+)\s*(?:unidade|produto|peça|item).*\bkit\b/i,
    /\bkit\s*(\d+)x/i
  ];
  
  return kitPatterns.some(pattern => pattern.test(combined));
};
const isWhiteBackground = (image: HostedImage) => 
  image.tags.some(tag => tag.includes('white-background') || tag.includes('gemini-white-background') || tag.includes('white')) || 
  (image.description?.toLowerCase() || '').includes('white') || (image.description?.toLowerCase() || '').includes('branco');
const isShowcase = (image: HostedImage) => 
  image.tags.some(tag => tag.includes('showcase-hosted') || tag.includes('source:showcase'));

// Buscar imagens R2 por tipo de IA
// FASE 4: Cache global para imagens (5 minutos de validade)
const imageCache = new Map<string, { data: Record<string, HostedImage[]>, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// 🔎 Busca imagens melhoradas DeepAI diretamente da tabela produtos
async function fetchDeepAIEnhancedFromProdutos(productId: string): Promise<HostedImage[]> {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        id, sku, nome, enhanced_at,
        imagem_url, imagem_url_2, imagem_url_3, imagem_url_4, imagem_url_5,
        imagem_url_6, imagem_url_7, imagem_url_8, imagem_url_9, imagem_url_10,
        imagem_melhorada_1, imagem_melhorada_2, imagem_melhorada_3, imagem_melhorada_4, imagem_melhorada_5,
        imagem_melhorada_6, imagem_melhorada_7, imagem_melhorada_8, imagem_melhorada_9, imagem_melhorada_10
      `)
      .eq('id', productId)
      .maybeSingle();

    if (error) {
      console.warn('⚠️ [DEEPAI MERGE] Erro ao buscar imagens melhoradas do produto:', error);
      return [];
    }
    if (!data) return [];

    const out: HostedImage[] = [];
    for (let i = 1; i <= 10; i++) {
      const origField = i === 1 ? 'imagem_url' : `imagem_url_${i}`;
      const enhField = `imagem_melhorada_${i}`;
      const originalUrl = (data as any)[origField] as string | null | undefined;
      const enhancedUrl = (data as any)[enhField] as string | null | undefined;
      if (enhancedUrl && typeof enhancedUrl === 'string') {
        out.push({
          id: `deepai-${productId}-${i}`,
          url: enhancedUrl,
          original_filename: `${(data as any).sku || (data as any).nome || 'produto'}_enhanced_${i}.jpg`,
          description: `Imagem melhorada ${i} - ${(data as any).nome || (data as any).sku || ''}`.trim(),
          tags: [
            `product:${productId}`,
            'source:deepai-enhancement',
            'ai-source:deepai',
            ...(originalUrl ? [`original:${originalUrl}`] : []),
            'hosted'
          ]
        });
      }
    }
    console.log(`🔎 [DEEPAI MERGE] Encontradas ${out.length} imagens em produtos.imagem_melhorada_*`);
    return out;
  } catch (e) {
    console.error('❌ [DEEPAI MERGE] Falha inesperada ao buscar imagens melhoradas:', e);
    return [];
  }
}

export async function fetchR2ImagesBySource(userId: string, productId?: string, maxRetries: number = 2): Promise<Record<string, HostedImage[]>> {
  // FASE 4: Verificar cache
  const cacheKey = `${userId}-${productId || 'all'}`;
  const cached = imageCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    // Se o cache não contém DeepAI, forçar refetch para corrigir cenários após melhorias
    const deepaiCachedCount = (cached.data?.deepai || []).length;
    if (deepaiCachedCount > 0) {
      console.log(`📦 [CACHE HIT] Usando ${Object.values(cached.data).flat().length} imagens em cache`);
      return cached.data;
    }
  }

  // ✅ PAGINAÇÃO: Buscar TODAS as imagens em lotes de 500
  const PAGE_SIZE = 500;
  let allImages: any[] = [];
  let currentPage = 0;
  let hasMore = true;
  
  console.log(`🔄 [FETCH R2] Iniciando busca paginada de imagens para user ${userId.substring(0, 8)}...`);
  
  for (let attempt = 1; attempt <= maxRetries + 1 && hasMore; attempt++) {
    try {
      while (hasMore) {
        const rangeStart = currentPage * PAGE_SIZE;
        const rangeEnd = rangeStart + PAGE_SIZE - 1;
        
        let query = supabase
          .from('hosted_images')
          .select('id,url,tags,description,original_filename,r2_path,uploaded_at')
          .eq('user_id', userId)
          .order('uploaded_at', { ascending: false })
          .range(rangeStart, rangeEnd);
        
        const { data: images, error } = await query;
        
        if (error) {
          const code = error.code;
          const msg = (error.message || '').toLowerCase();
          const isTimeout = code === '57014' || msg.includes('timeout');
          const isSchemaCache = code === 'PGRST002' || msg.includes('schema cache') || msg.includes('service unavailable');
          if ((isTimeout || isSchemaCache) && attempt <= maxRetries) {
            const delayMs = Math.min(8000, 1000 * Math.pow(2, attempt - 1));
            console.log(`⏳ [FETCH R2] Aguardando ${delayMs}ms antes de tentar novamente...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            break; // Retry from beginning
          }
          throw new Error(`Failed to fetch images: ${error.message}`);
        }
        
        if (!images || images.length === 0) {
          hasMore = false;
        } else {
          allImages.push(...images);
          currentPage++;
          
          if (images.length < PAGE_SIZE) {
            hasMore = false; // Última página
          }
          
          console.log(`📦 [FETCH R2] Página ${currentPage}: ${images.length} imagens (total: ${allImages.length})`);
        }
      }
      break; // Success, exit retry loop
    } catch (err) {
      if (attempt > maxRetries) throw err;
    }
  }

  if (!allImages || allImages.length === 0) {
    console.log('⚠️ [FETCH R2] Nenhuma imagem encontrada');
    return {};
  }
  
  const images = allImages;
  console.log(`📦 [DATABASE] ${images.length} imagens encontradas no banco (TODAS - sem limite)`);
  
  // Continuar com o loop de retry original para o processamento
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      // FASE 1: Filtrar por product no código (em vez do banco via contains)
      const productFilteredImages = productId 
        ? images.filter(img => img.tags?.some(tag => tag === `product:${productId}`))
        : images;
      
      console.log(`✅ [FILTER] ${productFilteredImages.length} imagens após filtro de produto (de ${images.length} totais)`);

      // ✅ IMPORTANTE: Descartar imagens 'not-hosted' (sem r2_path válido)
      const notHostedCount = productFilteredImages.filter(img => !img.r2_path || img.r2_path.trim() === '' || img.tags?.includes('not-hosted')).length;
      if (notHostedCount > 0) {
        console.log(`⚠️ [fetchR2ImagesBySource] Descartando ${notHostedCount} imagens 'not-hosted'`);
      }
      
const hostedImages = productFilteredImages.filter(img => {
  const isValidUrl = img.url.startsWith('https://');
  const hasR2Path = img.r2_path && img.r2_path !== '';
  const notFlagged = !img.tags?.includes('not-hosted');
  
  // ✅ EXCEÇÃO: Aceitar imagens KIT do Cloudinary mesmo sem r2_path
  const isKitCloudinary = (isKitImage(img) || isKitImageFallback(img)) && img.url.includes('res.cloudinary.com');

  // ✅ DEEPAI: Aceitar qualquer imagem marcada como DeepAI, mesmo sem r2_path
  const isDeepAITagged = isDeepAI(img);
  
  // ✅ EXCEÇÃO: Aceitar imagens DeepAI diretas (api.deepai.org) mesmo sem r2_path
  const isDeepAIDirect = isDeepAITagged && img.url.includes('deepai.org');
  
  return isValidUrl && ((hasR2Path && notFlagged) || isKitCloudinary || isDeepAIDirect || isDeepAITagged);
});

const kitCloudinaryCount = hostedImages.filter(img => 
  (isKitImage(img) || isKitImageFallback(img)) && img.url.includes('res.cloudinary.com')
).length;

if (kitCloudinaryCount > 0) {
  console.log(`🎯 [KIT CLOUDINARY] ${kitCloudinaryCount} imagens KIT do Cloudinary aceitas (sem r2_path)`);
}

const deepAIDirectCount = hostedImages.filter(img => 
  isDeepAI(img) && img.url.includes('deepai.org') && (!img.r2_path || img.r2_path === '' || img.tags?.includes('not-hosted'))
).length;

if (deepAIDirectCount > 0) {
  console.log(`💎 [DEEPAI DIRECT] ${deepAIDirectCount} imagens DeepAI diretas aceitas (sem r2_path)`);
}

const deepAITaggedNoR2Count = hostedImages.filter(img => 
  isDeepAI(img) && (!img.r2_path || img.r2_path === '') && !img.url.includes('deepai.org')
).length;

if (deepAITaggedNoR2Count > 0) {
  console.log(`💎 [DEEPAI TAGGED] ${deepAITaggedNoR2Count} imagens DeepAI taggeadas aceitas (sem r2_path)`);
}

console.log(`✅ [VALIDATION] ${productFilteredImages.length} imagens após filtro → ${hostedImages.length} imagens HOSPEDADAS válidas`);

      if (hostedImages.length === 0) {
        console.log('❌ Nenhuma imagem HOSPEDADA válida encontrada após validação');
        return {};
      }
      
      // Deduplicate by URL
      const uniqueImages = hostedImages.reduce((acc: HostedImage[], current) => {
        if (!acc.find(img => img.url === current.url)) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      console.log(`✅ [DEDUP] ${uniqueImages.length} imagens únicas após deduplicação`);

    const imagesBySource: Record<string, HostedImage[]> = {
        whiteBackground: [],
        runware: [],
        geminiBackground: [],
        geminiWhite: [],
      bfl: [],
      bflWhite: [],
      runway: [],
      deepai: [],
      geminiCarousel: [],
      marketingGemini: [],
      marketingRunware: [],
      marketingBfl: [],
      marketingOthers: [],
      marketingTriggers: [],
      // ✅ Novas categorias específicas de Marketing Gatilhos (apenas os 3 tipos que queremos)
        marketingDescription: [],
        marketingFeatures: [],
        marketingBenefits: [],
      // 🎨 Templates de Marketing Estilo Canva (gerados pelo CanvaStyleTemplateGenerator)
      marketingCanvaTemplates: [],
        kitImages: [],
      showcases: [],
      allAI: [],
      // Categorias limpas para isolamento
      allAI_NoKitNoMarketing: [],
      marketingTriggers_NoKit: [],
      kitImages_NoMarketing: [],
      // 🌍 Fallback global de KITs (quando produto não tem KITs)
      kitImagesGlobal: [],
      kitImagesGlobal_NoMarketing: [],
      // 🎯 Pools SEPARADOS por quantidade de KIT (para anúncios específicos)
      kit2: [],
      kit4: [],
      kit6: [],
      kit8: [],
      kit10: [],
      kit20: [],
      kit30: []
    };

    // Sistema de classificação exclusiva com prioridade hierárquica
    uniqueImages.forEach((img: HostedImage) => {
      let classified = false;
      
      // PRIORIDADE 1: Kit Images (maior prioridade - imagens específicas de kits)
      if (!classified && (isKitImage(img) || isKitImageFallback(img))) {
        imagesBySource.kitImages.push(img);
        
        // 🎯 Classificar em pools específicos por quantidade
        const detectedQuantity = detectKitQuantity(img);
        if (detectedQuantity === 2) imagesBySource.kit2.push(img);
        else if (detectedQuantity === 4) imagesBySource.kit4.push(img);
        else if (detectedQuantity === 6) imagesBySource.kit6.push(img);
        else if (detectedQuantity === 8) imagesBySource.kit8.push(img);
        else if (detectedQuantity === 10) imagesBySource.kit10.push(img);
        else if (detectedQuantity === 20) imagesBySource.kit20.push(img);
        else if (detectedQuantity === 30) imagesBySource.kit30.push(img);
        
        classified = true;
      }
      
      // PRIORIDADE 2: Marketing Triggers Específicos (Descrição, Características, Benefícios) - MAIOR PRIORIDADE
      if (!classified && isMarketingDescription(img)) {
        imagesBySource.marketingDescription.push(img);
        imagesBySource.marketingTriggers.push(img);
        // Classificar também na categoria de IA específica
        if (isMarketingGemini(img)) imagesBySource.marketingGemini.push(img);
        if (isMarketingRunware(img)) imagesBySource.marketingRunware.push(img);
        if (isMarketingBfl(img)) imagesBySource.marketingBfl.push(img);
        classified = true;
      }
      
      if (!classified && isMarketingFeatures(img)) {
        imagesBySource.marketingFeatures.push(img);
        imagesBySource.marketingTriggers.push(img);
        // Classificar também na categoria de IA específica
        if (isMarketingGemini(img)) imagesBySource.marketingGemini.push(img);
        if (isMarketingRunware(img)) imagesBySource.marketingRunware.push(img);
        if (isMarketingBfl(img)) imagesBySource.marketingBfl.push(img);
        classified = true;
      }
      
      if (!classified && isMarketingBenefits(img)) {
        imagesBySource.marketingBenefits.push(img);
        imagesBySource.marketingTriggers.push(img);
        // Classificar também na categoria de IA específica
        if (isMarketingGemini(img)) imagesBySource.marketingGemini.push(img);
        if (isMarketingRunware(img)) imagesBySource.marketingRunware.push(img);
        if (isMarketingBfl(img)) imagesBySource.marketingBfl.push(img);
        classified = true;
      }
      
      // PRIORIDADE 2.5: Outros Marketing Triggers (serão ignorados nos anúncios, mas classificados)
      if (!classified && isMarketingGemini(img)) {
        imagesBySource.marketingGemini.push(img);
        imagesBySource.marketingTriggers.push(img);
        classified = true;
      }
      
      if (!classified && isMarketingRunware(img)) {
        imagesBySource.marketingRunware.push(img);
        imagesBySource.marketingTriggers.push(img);
        classified = true;
      }
      
      if (!classified && isMarketingBfl(img)) {
        imagesBySource.marketingBfl.push(img);
        imagesBySource.marketingTriggers.push(img);
        classified = true;
      }
      
      if (!classified && isMarketingOthers(img)) {
        imagesBySource.marketingOthers.push(img);
        imagesBySource.marketingTriggers.push(img);
        classified = true;
      }
      
      // 🎨 PRIORIDADE 2.6: Templates de Marketing Estilo Canva (CanvaStyleTemplateGenerator)
      if (!classified && isMarketingCanvaTemplate(img)) {
        imagesBySource.marketingCanvaTemplates.push(img);
        classified = true;
      }
      
      // PRIORIDADE 3: Fundo Branco Específico por IA
      if (!classified && isGeminiWhite(img)) {
        imagesBySource.geminiWhite.push(img);
        imagesBySource.whiteBackground.push(img); // Adiciona também no genérico
        classified = true;
      }
      
      if (!classified && isBflWhite(img)) {
        imagesBySource.bflWhite.push(img);
        imagesBySource.whiteBackground.push(img); // Adiciona também no genérico
        classified = true;
      }
      
      // PRIORIDADE 4: IA Específica com Background
      if (!classified && isGeminiBackground(img)) {
        imagesBySource.geminiBackground.push(img);
        classified = true;
      }
      
      if (!classified && isBfl(img)) {
        imagesBySource.bfl.push(img);
        classified = true;
      }
      
      if (!classified && isRunway(img)) {
        imagesBySource.runway.push(img);
        classified = true;
      }
      
      if (!classified && isRunware(img)) {
        imagesBySource.runware.push(img);
        classified = true;
      }
      
      // PRIORIDADE 4.5: Imagens melhoradas com DeepAI
      if (!classified && isDeepAI(img)) {
        imagesBySource.deepai.push(img);
        classified = true;
      }
      
      // PRIORIDADE 4.6: Gemini Carousel (4 imagens carrossel)
      if (!classified && (img.tags.some(tag => tag.includes('gemini-carousel') || tag.includes('source:gemini-carousel')))) {
        imagesBySource.geminiCarousel.push(img);
        classified = true;
      }
      
      // PRIORIDADE 5: Showcases de Produto
      if (!classified && isShowcase(img)) {
        imagesBySource.showcases.push(img);
        classified = true;
      }
      
      // PRIORIDADE 6: Fundo Branco Genérico (se não foi classificado especificamente)
      if (!classified && isWhiteBackground(img)) {
        imagesBySource.whiteBackground.push(img);
        classified = true;
      }
      
      // PRIORIDADE 6: Fallback - AllAI (menor prioridade)
      if (!classified && img.tags.some(tag => tag.includes('original-source:') || tag.includes('-processed'))) {
        imagesBySource.allAI.push(img);
        classified = true;
      }
      
        // Todas as imagens classificadas também vão para allAI (para seleção aleatória)
        if (classified) {
          imagesBySource.allAI.push(img);
        }
    });

    // Popular categorias limpas para isolamento
    imagesBySource.allAI_NoKitNoMarketing = imagesBySource.allAI.filter(img => 
      !isKitImage(img) && 
      !isMarketingGemini(img) && 
      !isMarketingRunware(img) && 
      !isMarketingBfl(img) && 
      !isMarketingOthers(img)
    );

    imagesBySource.marketingTriggers_NoKit = imagesBySource.marketingTriggers.filter(img => 
      !isKitImage(img)
    );

    imagesBySource.kitImages_NoMarketing = imagesBySource.kitImages.filter(img => 
      !isMarketingGemini(img) && 
      !isMarketingRunware(img) && 
      !isMarketingBfl(img) && 
      !isMarketingOthers(img)
    );

    // 🔗 Merge: imagens DeepAI do produto (tabela produtos.imagem_melhorada_*)
    if (productId) {
      const deepAIEnhanced = await fetchDeepAIEnhancedFromProdutos(productId);
      if (deepAIEnhanced.length > 0) {
        const seen = new Set<string>([
          ...imagesBySource.deepai.map(i => i.url),
          ...imagesBySource.allAI.map(i => i.url),
        ]);
        const toAdd = deepAIEnhanced.filter(i => !seen.has(i.url));
        if (toAdd.length > 0) {
          imagesBySource.deepai.push(...toAdd);
          imagesBySource.allAI.push(...toAdd);

          const noKitNoMktToAdd = toAdd.filter(img => 
            !isKitImage(img) && 
            !isMarketingGemini(img) && 
            !isMarketingRunware(img) && 
            !isMarketingBfl(img) && 
            !isMarketingOthers(img)
          );
          imagesBySource.allAI_NoKitNoMarketing.push(...noKitNoMktToAdd);

          console.log(`✨ [DEEPAI MERGE] Adicionados ${toAdd.length} do Melhoria com DeepAI (total deepai: ${imagesBySource.deepai.length})`);
        } else {
          console.log('ℹ️ [DEEPAI MERGE] Sem novas URLs DeepAI do produto (já deduplicadas)');
        }
      } else {
        console.log('ℹ️ [DEEPAI MERGE] Produto sem imagens melhoradas DeepAI ou não compatíveis');
      }
    }

    // 🌍 FALLBACK GLOBAL: Se o produto não tem KITs, buscar KITs de outros produtos do usuário
    if (productId && imagesBySource.kitImages_NoMarketing.length === 0) {
      console.warn(`⚠️ [FALLBACK GLOBAL] Produto não tem KITs. Buscando KITs de outros produtos do usuário...`);
      
      const { data: globalKitImages, error: globalError } = await supabase
        .from('hosted_images')
        .select('id,url,tags,description,original_filename,r2_path,uploaded_at')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false })
        .limit(200); // Projeção enxuta + limite menor para estabilidade
      
      if (!globalError && globalKitImages && globalKitImages.length > 0) {
        // Filtrar apenas KITs hospedados
        const globalKitsHosted = globalKitImages.filter(img => {
          const isValidUrl = img.url.startsWith('https://');
          const hasR2Path = img.r2_path && img.r2_path !== '';
          const notFlagged = !img.tags?.includes('not-hosted');
          const isKit = isKitImage(img) || isKitImageFallback(img);
          
          // ✅ EXCEÇÃO: Aceitar imagens KIT do Cloudinary mesmo sem r2_path
          const isKitCloudinary = isKit && img.url.includes('res.cloudinary.com');
          
          return isValidUrl && isKit && ((hasR2Path && notFlagged) || isKitCloudinary);
        });
        
        const globalKitCloudinaryCount = globalKitsHosted.filter(img => 
          img.url.includes('res.cloudinary.com')
        ).length;
        
        if (globalKitCloudinaryCount > 0) {
          console.log(`🌍🎯 [FALLBACK GLOBAL + KIT CLOUDINARY] ${globalKitCloudinaryCount} KITs Cloudinary aceitos globalmente (sem r2_path)`);
        }
        
        // Deduplicate
        const globalKitsUnique = globalKitsHosted.reduce((acc: HostedImage[], current) => {
          if (!acc.find(img => img.url === current.url)) {
            acc.push(current);
          }
          return acc;
        }, []);
        
        imagesBySource.kitImagesGlobal = globalKitsUnique;
        imagesBySource.kitImagesGlobal_NoMarketing = globalKitsUnique.filter(img => 
          !isMarketingGemini(img) && 
          !isMarketingRunware(img) && 
          !isMarketingBfl(img) && 
          !isMarketingOthers(img)
        );
        
        console.log(`🌍 [FALLBACK GLOBAL] ${imagesBySource.kitImagesGlobal.length} KITs globais encontrados`);
        console.log(`🌍 [FALLBACK GLOBAL] ${imagesBySource.kitImagesGlobal_NoMarketing.length} KITs globais sem marketing`);
      } else {
        console.warn(`❌ [FALLBACK GLOBAL] Nenhum KIT encontrado em outros produtos do usuário`);
      }
    }

      // Log category counts for debugging
      console.log('📊 Images organized by category:', {
        whiteBackground: imagesBySource.whiteBackground.length,
        runware: imagesBySource.runware.length,
        geminiBackground: imagesBySource.geminiBackground.length,
        geminiWhite: imagesBySource.geminiWhite.length,
        bfl: imagesBySource.bfl.length,
        bflWhite: imagesBySource.bflWhite.length,
        runway: imagesBySource.runway.length,
        deepai: imagesBySource.deepai.length,
        marketingGemini: imagesBySource.marketingGemini.length,
        marketingRunware: imagesBySource.marketingRunware.length,
        marketingBfl: imagesBySource.marketingBfl.length,
        marketingOthers: imagesBySource.marketingOthers.length,
        marketingTriggers: imagesBySource.marketingTriggers.length,
        '✅ marketingDescription': imagesBySource.marketingDescription.length,
        '✅ marketingFeatures': imagesBySource.marketingFeatures.length,
        '✅ marketingBenefits': imagesBySource.marketingBenefits.length,
        '🎨 marketingCanvaTemplates': imagesBySource.marketingCanvaTemplates.length,
        '📦 kitImages (produto)': imagesBySource.kitImages.length,
        '📦 kitImages_NoMarketing (produto)': imagesBySource.kitImages_NoMarketing.length,
        '🌍 kitImagesGlobal (fallback)': imagesBySource.kitImagesGlobal.length,
        '🌍 kitImagesGlobal_NoMarketing (fallback)': imagesBySource.kitImagesGlobal_NoMarketing.length,
        '🎯 KIT 2': imagesBySource.kit2.length,
        '🎯 KIT 4': imagesBySource.kit4.length,
        '🎯 KIT 6': imagesBySource.kit6.length,
        '🎯 KIT 8': imagesBySource.kit8.length,
        '🎯 KIT 10': imagesBySource.kit10.length,
        '🎯 KIT 20': imagesBySource.kit20.length,
        '🎯 KIT 30': imagesBySource.kit30.length,
        showcases: imagesBySource.showcases.length,
        allAI: imagesBySource.allAI.length,
        '🛡️ allAI_NoKitNoMarketing': imagesBySource.allAI_NoKitNoMarketing.length,
        '🛡️ marketingTriggers_NoKit': imagesBySource.marketingTriggers_NoKit.length
      });

      // FASE 4: Salvar no cache
      imageCache.set(cacheKey, { data: imagesBySource, timestamp: Date.now() });
      console.log(`💾 [CACHE SAVE] Resultado salvo em cache para ${cacheKey} (válido por ${CACHE_TTL / 1000}s)`);

      return imagesBySource;
      
    } catch (error) {
      // FASE 3: Se ainda tem tentativas, continuar o loop
      if (attempt <= maxRetries) {
        console.log(`🔄 [FETCH R2] Retry ${attempt}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      
      // Última tentativa falhou
      console.error('💥 [FETCH R2] Todas as tentativas falharam:', error);
      throw error;
    }
  }
  
  // Nunca deveria chegar aqui, mas TypeScript exige
  throw new Error('Failed to fetch images after all retries');
}

// Verificar se produto é elegível para anúncios premium
export async function checkPremiumEligibility(product: Product, userId: string): Promise<{ eligible: boolean; reason?: string; seoTitles?: string[] }> {
  try {
    // Helpers locais para extrair títulos em múltiplos formatos
    const parseLongTailBlock = (text: string): string[] => {
      return text
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .filter((line) => {
          // Excluir linhas com texto explicativo
          if (/estratégia|visa|busca|convers|em vez de|ao invés|otimiza|técnica|objetivo|processo|passo a passo|como|guia|aprenda|dica|consiste em/i.test(line)) return false;
          // Excluir linhas muito longas (explicações)
          if (line.length > 100) return false;
          // Excluir linhas que começam com minúscula (continuação)
          if (line[0] && line[0] === line[0].toLowerCase() && !/^\d/.test(line)) return false;
          // Excluir metadados
          return !line.startsWith('🎯') &&
                 !line.startsWith('📝') &&
                 !line.includes('ESTRATÉGIA') &&
                 !line.includes('TÍTULOS OTIMIZADOS') &&
                 !line.includes('Long Tail SEO') &&
                 !line.includes('**') &&
                 line.length > 10;
        })
        .map((line) => {
          // Remove marcadores de lista e enumeração
          let cleaned = line.replace(/^\d+[\.\)]/, '').trim();
          cleaned = cleaned.replace(/^[-*]\s*/, '').trim();
          cleaned = cleaned.replace(/^["']|["']$/g, '').trim();
          return cleaned;
        })
        .filter((t) => t.length > 10)
        .slice(0, 10);
    };

    const extractSeoTitlesFromResults = (results: any): string[] => {
      console.log('🔍 [extractSeoTitlesFromResults] Extraindo títulos SEO...');
      const all: string[] = [];
      try {
        if (!results || typeof results !== 'object') return all;
        
        // NOVO: Priorizar títulos da copywriting profissional
        if (Array.isArray(results.copywriting_long_tail_titles)) {
          console.log(`📝 [COPYWRITING] Encontrados ${results.copywriting_long_tail_titles.length} títulos de cauda longa`);
          all.push(...results.copywriting_long_tail_titles);
        }
        
        // 1) Priorizar arrays diretos (mantém como fallback)
        const arrays = [
          results?.cauda_longa?.titles,
          results?.palavras_chave_seo?.seoTitles,
          results?.palavras_chave_seo?.titles,
        ].filter(Array.isArray) as string[][];

        for (const arr of arrays) {
          for (const t of arr) if (typeof t === 'string') all.push(t.trim());
        }
        
        // 2) Texto longo melhorado (secondary)
        const lt = results?.cauda_longa?.improvedText as string | undefined;
        if (lt) all.push(...parseLongTailBlock(lt));
      } catch (_) {}

      // Dedup e normalização leve
      const seen = new Set<string>();
      const cleaned = all
        .map(t => t.replace(/^\d+\.\s*/, '').trim())
        .filter(t => t.length > 5 && t.length <= 200) // Aumentar limite para 200 caracteres
        .slice(0, 50); // corta excesso antes do dedup

      const out: string[] = [];
      for (const t of cleaned) {
        const key = t.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          out.push(t);
        }
      }
      
      // ✅ APLICAR FILTRO DE PALAVRAS PROIBIDAS
      const filtered = filterValidSEOTitles(out);
      console.log(`📝 [extractSeoTitlesFromResults] ${out.length} títulos únicos → ${filtered.length} após filtro de palavras proibidas`);
      return filtered.slice(0, 40); // GARANTIR 40 TÍTULOS (30 Copywriting + 10 Comando Unificado)
    };

    const createFallbackSEOTitles = (): string[] => {
      const base = (product.nome || 'Produto').trim();
      return [
        `${base} Original`,
        `${base} Fundo Branco`,
        `${base} Alta Qualidade`,
        `${base} Oferta Especial`,
        `${base} Pronto para Envio`,
        `${base} Design Premium`,
        `${base} Durável e Confiável`,
        `${base} Uso Diário`,
        `${base} Edição Especial`,
        `${base} Lançamento`,
      ];
    };

    // Buscar as ÚLTIMAS 10 linhas para maior robustez
    const { data: aiRows, error } = await supabase
      .from('ai_unified_results')
      .select('results, created_at')
      .eq('product_id', product.id)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Erro ao buscar resultados AI:', error);
      return { eligible: false, reason: 'Erro ao acessar dados AI' };
    }

    console.log(`🔍 [ELEGIBILIDADE] Linhas AI encontradas: ${aiRows?.length || 0}`);

    // Extrair títulos varrendo múltiplas linhas - GARANTIR 40 TÍTULOS
    const titlesSet = new Set<string>();
    for (const row of aiRows || []) {
      let results: any = row.results;
      if (typeof results === 'string') {
        try { results = JSON.parse(results); } catch { /* ignora */ }
      }
      const extracted = extractSeoTitlesFromResults(results);
      for (const t of extracted) {
        const key = t.toLowerCase();
        if (!titlesSet.has(key)) titlesSet.add(key);
        if (titlesSet.size >= 40) break; // CORRIGIDO: 40 títulos SEO
      }
      if (titlesSet.size >= 40) break; // CORRIGIDO: 40 títulos SEO
    }

    let seoTitles = Array.from(titlesSet).slice(0, 40); // GARANTIR 40 TÍTULOS (30 Copywriting + 10 Comando Unificado)
    
    // ✅ APLICAR FILTRO DE PALAVRAS PROIBIDAS NOS TÍTULOS COLETADOS
    seoTitles = filterValidSEOTitles(seoTitles);
    console.log(`🚫 [FILTRO] Títulos após remoção de palavras proibidas: ${seoTitles.length}`);

    // Completar com fallback somente se necessário
    if (seoTitles.length < 40) {
      const fallback = createFallbackSEOTitles();
      for (const t of fallback) {
        if (seoTitles.length >= 40) break;
        if (!seoTitles.find(x => x.toLowerCase() === t.toLowerCase())) seoTitles.push(t);
      }
    }

    console.log(`✅ [ELEGIBILIDADE] Títulos SEO capturados: ${seoTitles.length}`);

    // Verificar imagens R2 disponíveis (contando URLs únicas)
    const imagesBySource = await fetchR2ImagesBySource(userId, product.id);
    const urlSet = new Set<string>();
    Object.values(imagesBySource).forEach((arr) => {
      (arr || []).forEach(img => urlSet.add(img.url));
    });
    const uniqueImageCount = urlSet.size;

    console.log(`✅ [ELEGIBILIDADE] Imagens R2 únicas: ${uniqueImageCount}`);

    if (uniqueImageCount < 10) {
      return { eligible: false, reason: `Apenas ${uniqueImageCount} imagens R2 válidas. Mínimo: 10.` };
    }

    return { eligible: true, seoTitles };
  } catch (error: any) {
    console.error('❌ Erro ao verificar elegibilidade premium:', error?.message || error);
    return { eligible: false, reason: `Erro ao verificar: ${error?.message || 'desconhecido'}` };
  }
}

// Selecionar imagens aleatórias de uma lista (mantido para compatibilidade)
function selectRandomImages(images: HostedImage[], count: number): HostedImage[] {
  if (!images || images.length === 0) return [];
  if (images.length <= count) return [...images];
  
  const shuffled = [...images].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// ✅ NOVO: Selecionar imagens RESPEITANDO A ORDEM (uploaded_at DESC - mais recentes primeiro)
// Usado pelo Modelo 1 do Configurador de Anúncios Premium
function selectImagesInOrder(images: HostedImage[], count: number): HostedImage[] {
  if (!images || images.length === 0) return [];
  if (images.length <= count) return [...images];
  
  // Manter ordem original - já vem ordenado por uploaded_at DESC do banco
  return images.slice(0, count);
}

// Helper para adicionar 2 imagens aleatórias dos Templates Canva
function addCanvaTemplates(canvaPool: HostedImage[], existingUrls: Set<string>): HostedImage[] {
  if (!canvaPool || canvaPool.length === 0) return [];
  
  const available = canvaPool.filter(img => !existingUrls.has(img.url));
  const selected = selectRandomImages(available, Math.min(2, available.length));
  selected.forEach(img => existingUrls.add(img.url));
  
  return selected;
}

// Helper para limitar combinação a 10 imagens (respeitando prioridades)
function limitTo10Images(combination: HostedImage[]): HostedImage[] {
  if (combination.length <= 10) return combination;
  
  // Priorizar: Showcases, KITs, depois o resto
  const showcases = combination.filter(img => isShowcase(img));
  const kits = combination.filter(img => isKitImage(img) && !isShowcase(img));
  const others = combination.filter(img => !isShowcase(img) && !isKitImage(img));
  
  // Garantir showcases e KITs primeiro, depois completar com outros até 10
  const result: HostedImage[] = [];
  result.push(...showcases);
  result.push(...kits);
  
  const remaining = 10 - result.length;
  if (remaining > 0) {
    result.push(...others.slice(0, remaining));
  }
  
  console.log(`✂️ [LIMIT] Reduzido de ${combination.length} para ${result.length} imagens (limite: 10)`);
  return result.slice(0, 10); // Garantia final
}

// Util para limitar título a 150 caracteres preservando palavras
function clipTitle(input: string, max = 150): string {
  const clean = (input || '').trim();
  if (clean.length <= max) return clean;
  const clipped = clean.slice(0, max);
  const lastSpace = clipped.lastIndexOf(' ');
  const safe = lastSpace > 60 ? clipped.slice(0, lastSpace) : clipped;
  return safe.trim();
}

// Quantidades conhecidas de KIT
const KNOWN_KIT_QUANTITIES = [2, 4, 6, 8, 10, 20, 30];

// Helper para verificar se uma imagem é exatamente de um KIT com quantidade específica
function isExactKitQuantity(img: HostedImage, quantity: number): boolean {
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s]/g, ' '); // Remove pontuação, mantém espaços
  };
  
  const desc = normalizeText(img.description || '');
  const filename = normalizeText(img.original_filename || '');
  const tags = img.tags.map(t => normalizeText(t)).join(' ');
  const allText = `${desc} ${filename} ${tags}`;
  
  // Palavras por extenso em português
  const numberWords: Record<number, string[]> = {
    2: ['dois', 'duas'],
    4: ['quatro'],
    6: ['seis'],
    8: ['oito'],
    10: ['dez'],
    20: ['vinte'],
    30: ['trinta']
  };
  
  // Criar padrões de regex com fronteiras que evitam confusão (ex: "2" não deve casar com "20")
  const qtyStr = quantity.toString();
  const patterns: RegExp[] = [
    // "kit 4", "kit-4", "kit_4", "kit4" (com fronteira não-numérica)
    new RegExp(`\\bkit\\s*[-_]?\\s*${qtyStr}(?!\\d)`, 'i'),
    // "4 unidades", "4 un", "4 und", "4 unid", "4 unids", "4 u"
    new RegExp(`\\b${qtyStr}\\s+(unidades?|un|und|unid|unids|u)\\b`, 'i'),
    // "4 peças", "4 pcs", "4 pçs", "4 pzs"
    new RegExp(`\\b${qtyStr}\\s+(pecas?|pcs?|pzs?)\\b`, 'i'),
    // "x4", "4x", "×4" (multiplicador)
    new RegExp(`\\b[x×]\\s*${qtyStr}(?!\\d)\\b`, 'i'),
    new RegExp(`\\b${qtyStr}\\s*[x×](?!\\d)\\b`, 'i'),
    // "pack 4", "pacote 4", "combo 4", "conjunto 4"
    new RegExp(`\\b(pack|pacote|combo|conjunto)\\s+${qtyStr}(?!\\d)\\b`, 'i'),
    // "com 4 unidades", "com 4"
    new RegExp(`\\bcom\\s+${qtyStr}\\s+(unidades?|un)?(?!\\d)`, 'i')
  ];
  
  // Adicionar padrões por extenso se disponíveis para esta quantidade
  if (numberWords[quantity]) {
    numberWords[quantity].forEach(word => {
      patterns.push(new RegExp(`\\bkit\\s+${word}\\b`, 'i'));
      patterns.push(new RegExp(`\\b${word}\\s+(unidades?|pecas?)\\b`, 'i'));
      patterns.push(new RegExp(`\\bcom\\s+${word}\\b`, 'i'));
      // Padrão para "quatro (4)" ou "4 (quatro)"
      patterns.push(new RegExp(`\\b${word}\\s*\\(?${qtyStr}\\)?\\b`, 'i'));
      patterns.push(new RegExp(`\\b${qtyStr}\\s*\\(?${word}\\)?\\b`, 'i'));
    });
  }
  
  return patterns.some(pattern => pattern.test(allText));
}

// Detectar quantidade de KIT na imagem (retorna número ou null para genérico)
function detectKitQuantity(img: HostedImage): number | null {
  for (const qty of KNOWN_KIT_QUANTITIES) {
    if (isExactKitQuantity(img, qty)) return qty;
  }
  return null; // KIT genérico (sem número explícito)
}

// Verificar se uma imagem é um KIT genérico (sem quantidade específica)
const isGenericKit = (img: HostedImage) => isKitImage(img) && detectKitQuantity(img) === null;

/**
 * 🔍 ANALISADOR DE ESTRUTURA DE ANÚNCIOS
 * Compara os anúncios gerados com a estrutura esperada e reporta divergências
 */
export function analyzeAdsAgainstStructure(
  imagesBySource: Record<string, HostedImage[]>,
  ads: PremiumAdProduct[]
): AdsStructureReport {
  console.log('🔍 [ANÁLISE] Iniciando análise de estrutura dos anúncios...');
  
  const adsAnalysis: AdStructureAnalysis[] = [];
  const kitQuantities = [2, 4, 6, 8, 10, 20, 30];
  
  // Criar mapa de URL para HostedImage para classificação rápida
  const urlToImageMap = new Map<string, HostedImage>();
  Object.values(imagesBySource).flat().forEach((img: HostedImage) => {
    if (img && img.url) {
      urlToImageMap.set(img.url, img);
    }
  });
  
  ads.forEach((ad, index) => {
    const adNumber = index + 1;
    const adType = getAdTypeName(adNumber);
    const issues: string[] = [];
    const notes: string[] = [];
    
    // Classificar cada imagem do anúncio
    const breakdown = {
      total: ad.imageUrls.length,
      kit: { exact: 0, generic: 0, wrong: 0 },
      marketing: { description: 0, features: 0, benefits: 0, canva: 0, total: 0 },
      runware: 0,
      geminiWhite: 0,
      geminiBackground: 0,
      geminiCarousel: 0,
      bfl: 0,
      bflWhite: 0,
      runway: 0,
      deepai: 0,
      whiteBackground: 0,
      showcase: 0
    };
    
    ad.imageUrls.forEach((url) => {
      const img = urlToImageMap.get(url);
      if (!img) {
        issues.push(`URL não encontrada nos pools: ${url.substring(0, 50)}...`);
        return;
      }
      
      // Classificar por prioridade (mesma hierarquia da geração)
      if (isKitImage(img) || isKitImageFallback(img)) {
        const detectedQty = detectKitQuantity(img);
        if (detectedQty) {
          // KIT com quantidade
          if (adNumber >= 11 && adNumber <= 17) {
            const expectedQty = kitQuantities[adNumber - 11];
            if (detectedQty === expectedQty) {
              breakdown.kit.exact++;
            } else {
              breakdown.kit.wrong++;
              issues.push(`KIT com quantidade errada: esperado ${expectedQty}, encontrado ${detectedQty}`);
            }
          } else {
            breakdown.kit.wrong++;
            issues.push(`KIT em anúncio não-KIT (${detectedQty} unidades)`);
          }
        } else {
          breakdown.kit.generic++;
        }
      } else if (isMarketingDescription(img)) {
        breakdown.marketing.description++;
        breakdown.marketing.total++;
      } else if (isMarketingFeatures(img)) {
        breakdown.marketing.features++;
        breakdown.marketing.total++;
      } else if (isMarketingBenefits(img)) {
        breakdown.marketing.benefits++;
        breakdown.marketing.total++;
      } else if (isMarketingCanvaTemplate(img)) {
        breakdown.marketing.canva++;
        breakdown.marketing.total++;
      } else if (isRunware(img)) {
        breakdown.runware++;
      } else if (isGeminiWhite(img)) {
        breakdown.geminiWhite++;
      } else if (isGeminiBackground(img)) {
        breakdown.geminiBackground++;
      } else if (img.tags?.some(tag => tag.includes('gemini-carousel') || tag.includes('source:gemini-carousel'))) {
        breakdown.geminiCarousel++;
      } else if (isBflWhite(img)) {
        breakdown.bflWhite++;
      } else if (isBfl(img)) {
        breakdown.bfl++;
      } else if (isRunway(img)) {
        breakdown.runway++;
      } else if (isDeepAI(img)) {
        breakdown.deepai++;
      } else if (isShowcase(img)) {
        breakdown.showcase++;
      } else if (isWhiteBackground(img)) {
        breakdown.whiteBackground++;
      }
    });
    
    // Validação específica por tipo de anúncio
    let expectedDescription = '';
    let isValid = true;
    
    if (adNumber === 1) {
      // Ad #1: Runware ALL + até 3 marketing + até 1 showcase
      const expectedRunware = imagesBySource.runware?.length || 0;
      expectedDescription = `Runware: ${expectedRunware} (todas), Marketing: até 3, Showcase: até 1`;
      
      if (breakdown.runware < expectedRunware) {
        const diff = expectedRunware - breakdown.runware;
        issues.push(`Faltam ${diff} imagens Runware (esperado ${expectedRunware}, encontrado ${breakdown.runware})`);
        notes.push(`Possível motivo: imagens 'not-hosted' ou classificadas como KIT/Marketing foram descartadas`);
        isValid = false;
      }
      if (breakdown.kit.exact + breakdown.kit.generic + breakdown.kit.wrong > 0) {
        issues.push(`Contém ${breakdown.kit.exact + breakdown.kit.generic + breakdown.kit.wrong} imagens de KIT (não deveria ter)`);
        notes.push(`KITs foram corretamente removidos pela sanitização`);
      }
      if (breakdown.marketing.total > 3) {
        issues.push(`Contém ${breakdown.marketing.total} marketing triggers (máximo 3)`);
        isValid = false;
      }
      if (breakdown.showcase > 1) {
        issues.push(`Contém ${breakdown.showcase} showcases (máximo 1)`);
        isValid = false;
      }
    } else if (adNumber === 2) {
      // Ad #2: Gemini White ALL + Gemini Background ALL + até 3 marketing + até 1 showcase
      const expectedGeminiWhite = imagesBySource.geminiWhite?.length || 0;
      const expectedGeminiBackground = imagesBySource.geminiBackground?.length || 0;
      expectedDescription = `Gemini White: ${expectedGeminiWhite}, Gemini Background: ${expectedGeminiBackground}, Marketing: até 3, Showcase: até 1`;
      
      if (breakdown.geminiWhite < expectedGeminiWhite) {
        issues.push(`Faltam ${expectedGeminiWhite - breakdown.geminiWhite} Gemini White`);
        isValid = false;
      }
      if (breakdown.geminiBackground < expectedGeminiBackground) {
        issues.push(`Faltam ${expectedGeminiBackground - breakdown.geminiBackground} Gemini Background`);
        isValid = false;
      }
      if (breakdown.kit.exact + breakdown.kit.generic + breakdown.kit.wrong > 0) {
        issues.push(`Contém KITs (não deveria ter)`);
      }
    } else if (adNumber === 3) {
      // Ad #3: BFL ALL + BFL White ALL + até 3 marketing + até 1 showcase
      const expectedBfl = imagesBySource.bfl?.length || 0;
      const expectedBflWhite = imagesBySource.bflWhite?.length || 0;
      expectedDescription = `BFL: ${expectedBfl}, BFL White: ${expectedBflWhite}, Marketing: até 3, Showcase: até 1`;
      
      if (breakdown.bfl < expectedBfl) {
        issues.push(`Faltam ${expectedBfl - breakdown.bfl} BFL`);
        isValid = false;
      }
      if (breakdown.bflWhite < expectedBflWhite) {
        issues.push(`Faltam ${expectedBflWhite - breakdown.bflWhite} BFL White`);
        isValid = false;
      }
      if (breakdown.kit.exact + breakdown.kit.generic + breakdown.kit.wrong > 0) {
        issues.push(`Contém KITs (não deveria ter)`);
      }
    } else if (adNumber >= 11 && adNumber <= 17) {
      // Ads KIT: 1 KIT exato + 9 aleatórias + 3 marketing + 1 showcase
      const expectedQty = kitQuantities[adNumber - 11];
      const kitPoolKey = `kit${expectedQty}`;
      const specificPoolSize = imagesBySource[kitPoolKey]?.length || 0;
      
      expectedDescription = `KIT ${expectedQty}: 1 exato, 9 aleatórias não-KIT, 3 marketing, 1 showcase`;
      
      if (breakdown.kit.exact === 0 && breakdown.kit.generic === 0) {
        issues.push(`Nenhuma imagem de KIT encontrada`);
        notes.push(`Pool específico [${kitPoolKey}]: ${specificPoolSize} imagens`);
        isValid = false;
      } else if (breakdown.kit.exact === 0 && breakdown.kit.generic > 0) {
        notes.push(`Usando KIT genérico (pool específico [${kitPoolKey}] vazio)`);
      } else if (breakdown.kit.exact > 1) {
        issues.push(`Múltiplos KITs exatos (${breakdown.kit.exact}), esperado apenas 1`);
        isValid = false;
      }
      
      if (breakdown.kit.wrong > 0) {
        issues.push(`${breakdown.kit.wrong} KITs com quantidade errada`);
        isValid = false;
      }
      
      if (breakdown.marketing.total < 3) {
        notes.push(`Apenas ${breakdown.marketing.total} marketing triggers (esperado 3)`);
      }
    } else {
      // Outros anúncios (4-10, 18-21)
      expectedDescription = `Mix de imagens conforme template do anúncio ${adNumber}`;
      
      if (breakdown.kit.exact + breakdown.kit.generic + breakdown.kit.wrong > 0) {
        issues.push(`Contém KITs (não deveria ter)`);
        notes.push(`KITs foram removidos pela sanitização (correto)`);
      }
    }
    
    // Validação de marketing específico (Desc, Feat, Ben)
    if (breakdown.marketing.total > 0) {
      const marketingBreakdown = `Desc: ${breakdown.marketing.description}, Feat: ${breakdown.marketing.features}, Ben: ${breakdown.marketing.benefits}, Canva: ${breakdown.marketing.canva}`;
      notes.push(`Marketing breakdown: ${marketingBreakdown}`);
    }
    
    adsAnalysis.push({
      adNumber,
      adType,
      isValid,
      imageBreakdown: breakdown,
      expectedCounts: { description: expectedDescription },
      issues,
      notes
    });
  });
  
  const validAds = adsAnalysis.filter(a => a.isValid).length;
  const invalidAds = adsAnalysis.length - validAds;
  
  // Contadores dos pools
  const poolCounts: Record<string, number> = {
    runware: imagesBySource.runware?.length || 0,
    geminiWhite: imagesBySource.geminiWhite?.length || 0,
    geminiBackground: imagesBySource.geminiBackground?.length || 0,
    geminiCarousel: imagesBySource.geminiCarousel?.length || 0,
    bfl: imagesBySource.bfl?.length || 0,
    bflWhite: imagesBySource.bflWhite?.length || 0,
    runway: imagesBySource.runway?.length || 0,
    deepai: imagesBySource.deepai?.length || 0,
    kit2: imagesBySource.kit2?.length || 0,
    kit4: imagesBySource.kit4?.length || 0,
    kit6: imagesBySource.kit6?.length || 0,
    kit8: imagesBySource.kit8?.length || 0,
    kit10: imagesBySource.kit10?.length || 0,
    kit20: imagesBySource.kit20?.length || 0,
    kit30: imagesBySource.kit30?.length || 0,
    marketingDescription: imagesBySource.marketingDescription?.length || 0,
    marketingFeatures: imagesBySource.marketingFeatures?.length || 0,
    marketingBenefits: imagesBySource.marketingBenefits?.length || 0,
    showcases: imagesBySource.showcases?.length || 0
  };
  
  console.log(`✅ [ANÁLISE] Concluída: ${validAds} válidos, ${invalidAds} com ajustes`);
  
  return {
    totalAds: ads.length,
    validAds,
    invalidAds,
    poolCounts,
    adsAnalysis
  };
}

// Filtrar imagens de KIT por quantidade específica usando detecção robusta
function filterKitsByQuantity(kitImages: HostedImage[], quantity: number): HostedImage[] {
  const exact = kitImages.filter(img => isExactKitQuantity(img, quantity));
  
  console.log(`📦 [FILTER KIT ${quantity}] ${exact.length} imagens EXATAS de ${kitImages.length} totais KITs`);
  
  if (exact.length > 0) {
    console.log(`   ✅ Usando ${exact.length} imagens EXATAS de KIT ${quantity}`);
    // Log de exemplos
    const examples = exact.slice(0, 2);
    examples.forEach(img => {
      console.log(`   📦 Exemplo: "${img.description?.substring(0, 50)}..." | Arquivo: "${img.original_filename?.substring(0, 30)}..."`);
    });
    return exact;
  }
  
  // Preferir KITs genéricos (sem número) em vez de trazer KIT errado
  const genericOnly = kitImages.filter(isGenericKit);
  if (genericOnly.length > 0) {
    console.warn(`   ⚠️ Nenhuma imagem exata de KIT ${quantity}. Usando ${genericOnly.length} KITs GENÉRICOS como fallback`);
    return genericOnly;
  }
  
  // Se nem genérico existir, último recurso: devolver todos (com log crítico)
  console.error(`   🚨 Nenhum KIT EXATO nem GENÉRICO para ${quantity}. Retornando todos ${kitImages.length} KITs (pode conter quantidade errada)`);
  return kitImages;
}

// Gerar combinações específicas de imagens para cada anúncio (17 modelos)
function generateImageCombinations(imagesBySource: Record<string, HostedImage[]>): HostedImage[][] {
  const combinations: HostedImage[][] = [];

  // Checks de pools essenciais
  if ((imagesBySource.runware?.length || 0) < 7) {
    console.warn(`⚠️ [RUNWARE] Poucas imagens Runware: ${imagesBySource.runware?.length || 0} (ideal: 7)`);
  }
  if ((imagesBySource.geminiWhite?.length || 0) < 2 || (imagesBySource.geminiBackground?.length || 0) < 7) {
    console.warn(`⚠️ [GEMINI] White=${imagesBySource.geminiWhite?.length || 0}, Background=${imagesBySource.geminiBackground?.length || 0} (ideais: 2/7)`);
  }
  
  // 🖼️ Pool de Showcases (duplicar se necessário para cobrir 20 anúncios)
  const showcasesPool = imagesBySource.showcases || [];
  const expandedShowcases: HostedImage[] = [];
  
  if (showcasesPool.length > 0) {
    // Repetir showcases até ter pelo menos 20 (1 por anúncio)
    while (expandedShowcases.length < 24) {
      expandedShowcases.push(...showcasesPool);
    }
    console.log(`🖼️ [SHOWCASES] Pool expandido: ${showcasesPool.length} únicos → ${expandedShowcases.length} disponíveis para 24 anúncios`);
  } else {
    console.log('⚠️ [SHOWCASES] Nenhuma imagem de showcase encontrada');
  }
  
  // Helper para pegar 1 showcase único por anúncio
  const getShowcaseForAd = (adIndex: number): HostedImage | null => {
    if (expandedShowcases.length === 0) return null;
    return expandedShowcases[adIndex % expandedShowcases.length];
  };

  // ✅ Pool FILTRADO de Marketing Gatilhos (APENAS Descrição, Características, Benefícios)
  const marketingTriggersPool: HostedImage[] = [
    ...imagesBySource.marketingDescription || [],
    ...imagesBySource.marketingFeatures || [],
    ...imagesBySource.marketingBenefits || []
  ];

  console.log(`🎯 [MARKETING TRIGGERS] Pool FILTRADO: ${marketingTriggersPool.length} imagens`);
  console.log(`   - 🔍 Descrição (generator:intro): ${imagesBySource.marketingDescription?.length || 0}`);
  console.log(`   - 📋 Características (generator:features): ${imagesBySource.marketingFeatures?.length || 0}`);
  console.log(`   - ✨ Benefícios (generator:benefits): ${imagesBySource.marketingBenefits?.length || 0}`);

  // Helper para pegar Marketing Gatilhos aleatórios (Descrição, Características, Benefícios) para cada anúncio
  const getMarketingForAd = (count: number, existingUrls: Set<string> = new Set(), ensureAllTypes: boolean = false): HostedImage[] => {
    if (marketingTriggersPool.length === 0) {
      console.log(`⚠️ [MARKETING] Nenhuma imagem de Descrição/Características/Benefícios disponível`);
      return [];
    }
    
    const available = marketingTriggersPool.filter(img => !existingUrls.has(img.url));
    
    // Se ensureAllTypes = true, garantir pelo menos 1 de cada tipo
    if (ensureAllTypes && count >= 3) {
      console.log(`🔍 [MARKETING DEBUG] Pool disponível: ${available.length} imagens`);
      console.log(`   - Descrição disponível: ${available.filter(img => isMarketingDescription(img)).length}`);
      console.log(`   - Características disponível: ${available.filter(img => isMarketingFeatures(img)).length}`);
      console.log(`   - Benefícios disponível: ${available.filter(img => isMarketingBenefits(img)).length}`);
      
      const desc = available.find(img => isMarketingDescription(img));
      const feat = available.find(img => isMarketingFeatures(img));
      const ben = available.find(img => isMarketingBenefits(img));
      
      const guaranteed: HostedImage[] = [];
      if (desc) { guaranteed.push(desc); existingUrls.add(desc.url); }
      if (feat) { guaranteed.push(feat); existingUrls.add(feat.url); }
      if (ben) { guaranteed.push(ben); existingUrls.add(ben.url); }
      
      // Se conseguiu garantir os 3 tipos
      if (guaranteed.length === 3) {
        console.log(`   ✅ [MARKETING] 3 tipos garantidos: Introdução + Características + Benefícios`);
        
        // Completar até o count solicitado com imagens aleatórias
        const remaining = count - 3;
        if (remaining > 0) {
          const availableRemaining = available.filter(img => !existingUrls.has(img.url));
          const extra = selectRandomImages(availableRemaining, Math.min(remaining, availableRemaining.length));
          extra.forEach(img => existingUrls.add(img.url));
          return [...guaranteed, ...extra];
        }
        
        return guaranteed;
      } else {
        const missing = [];
        if (!desc) missing.push('Introdução Captadora');
        if (!feat) missing.push('Características');
        if (!ben) missing.push('Benefícios');
        
        console.error(`   ❌ [MARKETING] Faltando: ${missing.join(', ')}`);
        console.warn(`      Descrição: ${desc ? 'Sim' : 'Não'} | Características: ${feat ? 'Sim' : 'Não'} | Benefícios: ${ben ? 'Sim' : 'Não'}`);
        
        toast.warning(`⚠️ Faltando: ${missing.join(', ')}. Gere no Sistema de Automação IA.`, {
          duration: 8000
        });
      }
    }
    
    // Fallback: seleção aleatória normal
    const selected = selectRandomImages(available, Math.min(count, available.length));
    selected.forEach(img => existingUrls.add(img.url));
    
    // Log de debug para verificar quais tipos foram selecionados
    const descCount = selected.filter(img => isMarketingDescription(img)).length;
    const featCount = selected.filter(img => isMarketingFeatures(img)).length;
    const benCount = selected.filter(img => isMarketingBenefits(img)).length;
    if (selected.length > 0) {
      console.log(`   📌 Selecionados: ${descCount} Descrição + ${featCount} Características + ${benCount} Benefícios`);
    }
    
    return selected;
  };
  
  // Helper function to safely get images with fallback and deduplication
  const safeGetImages = (source: HostedImage[] | undefined, count: number, fallback: HostedImage[] = [], existingUrls: Set<string> = new Set()): HostedImage[] => {
    const available = (source || []).filter(img => !existingUrls.has(img.url));
    if (available.length >= count) {
      const selected = selectRandomImages(available, count);
      selected.forEach(img => existingUrls.add(img.url));
      
      // ✅ VALIDAÇÃO: Verificar se alguma imagem de KIT foi selecionada indevidamente
      const kitsFound = selected.filter(img => isKitImage(img));
      if (kitsFound.length > 0) {
        console.warn(`⚠️ [VALIDATION WARNING] ${kitsFound.length} imagem(ns) de KIT detectada(s) em seleção não-KIT!`);
        kitsFound.forEach(kit => {
          console.warn(`   🚨 KIT INDEVIDO: "${kit.description?.substring(0, 40)}..." | Tags: ${kit.tags.join(', ')}`);
        });
      }
      
      return selected;
    }
    
    // Use fallback if not enough images
    const fallbackFiltered = fallback.filter(img => !existingUrls.has(img.url));
    const combined = [...available, ...fallbackFiltered];
    const selected = selectRandomImages(combined, Math.min(count, combined.length));
    selected.forEach(img => existingUrls.add(img.url));
    
    // ✅ VALIDAÇÃO: Verificar KITs no fallback também
    const kitsFound = selected.filter(img => isKitImage(img));
    if (kitsFound.length > 0) {
      console.warn(`⚠️ [VALIDATION WARNING] ${kitsFound.length} imagem(ns) de KIT detectada(s) em fallback não-KIT!`);
    }
    
    return selected;
  };

  // Helper to create combination with deduplication
  const createCombination = (parts: HostedImage[][]): HostedImage[] => {
    const seen = new Set<string>();
    const result: HostedImage[] = [];
    
    parts.forEach(part => {
      part.forEach(img => {
        if (!seen.has(img.url)) {
          seen.add(img.url);
          result.push(img);
        }
      });
    });
    
    return result;
  };

  // 🔧 SANITIZADOR: Remove imagens KIT de anúncios não-KIT
  const sanitizeNonKitCombination = (combination: HostedImage[], adNumber: number): HostedImage[] => {
    const isKitAd = adNumber >= 11 && adNumber <= 17;
    if (isKitAd) return combination; // KIT ads devem TER imagens de KIT
    
    const kitsFound = combination.filter(img => isKitImage(img));
    if (kitsFound.length === 0) return combination; // Já está limpo
    
    console.warn(`🔧 [SANITIZE NON-KIT] Anúncio ${adNumber}: Encontradas ${kitsFound.length} imagens KIT indevidas - removendo...`);
    
    const cleaned = combination.filter(img => !isKitImage(img));
    const existingUrls = new Set(cleaned.map(i => i.url));
    const pool = imagesBySource.allAI_NoKitNoMarketing.filter(img => !existingUrls.has(img.url));
    const needed = kitsFound.length;
    const replacements = selectRandomImages(pool, Math.min(needed, pool.length));
    
    console.log(`   ✅ Removidas ${kitsFound.length} KITs, adicionadas ${replacements.length} imagens seguras`);
    
    return [...cleaned, ...replacements];
  };

  // 🔧 SANITIZADOR: Garante que anúncios KIT tenham imagens de KIT (exatas prioritariamente, genéricas se necessário)
  const sanitizeKitCombination = (combination: HostedImage[], quantity: number): HostedImage[] => {
    const exactKits = combination.filter(img => isExactKitQuantity(img, quantity));
    const explicitWrongKits = combination.filter(img => {
      const q = detectKitQuantity(img);
      return isKitImage(img) && q !== null && q !== quantity;
    });
    const genericKits = combination.filter(isGenericKit);

    // CASO A: existe pelo menos 1 exata → manter exatas e remover todo o resto de KIT (errados e genéricos)
    if (exactKits.length > 0) {
      if (explicitWrongKits.length > 0 || genericKits.length > 0) {
        console.warn(`🔧 [SANITIZE KIT ${quantity}] Tem ${exactKits.length} exato(s). Removendo ${explicitWrongKits.length} errado(s) e ${genericKits.length} genérico(s)`);
      }
      const cleaned = combination.filter(img => !isKitImage(img) || isExactKitQuantity(img, quantity));
      // Completar com imagens neutras se precisar manter o total
      const removedCount = combination.length - cleaned.length;
      if (removedCount > 0) {
        const existingUrls = new Set(cleaned.map(i => i.url));
        const pool = imagesBySource.allAI_NoKitNoMarketing.filter(img => !existingUrls.has(img.url));
        const replacements = selectRandomImages(pool, Math.min(removedCount, pool.length));
        return [...cleaned, ...replacements];
      }
      return cleaned;
    }

    // CASO B: não tem exata → remover apenas os errados (com número diferente), manter genéricos
    if (explicitWrongKits.length > 0) {
      console.warn(`⚠️ [SANITIZE KIT ${quantity}] Sem exata. Removendo ${explicitWrongKits.length} KIT(s) com número errado. Mantendo genéricos: ${genericKits.length}`);
      const cleaned = combination.filter(img => !explicitWrongKits.includes(img));
      const existingUrls = new Set(cleaned.map(i => i.url));
      const pool = imagesBySource.allAI_NoKitNoMarketing.filter(img => !existingUrls.has(img.url));
      const replacements = selectRandomImages(pool, Math.min(explicitWrongKits.length, pool.length));
      return [...cleaned, ...replacements];
    }

    // CASO C: só genéricos ou nenhum KIT → manter como está
    return combination;
  };

  // 🎨 Pool de Templates Canva (usado em todos os anúncios 1-24)
  const canvaTemplatesPool: HostedImage[] = imagesBySource.marketingCanvaTemplates || [];
  console.log(`🎨 [CANVA TEMPLATES] Pool disponível: ${canvaTemplatesPool.length} templates`);

  // ⚠️ Anúncio #1: 🚀 IA Avançada - Runware (TODAS as Runware + 3 Marketing + 2 Canva + 4 Carousel)
  const runwareAll = (imagesBySource.runware || []).filter(img => !!img.url);
  const carousel1 = imagesBySource.geminiCarousel || [];
  console.log(`📊 [Ad #1] Usando TODAS as ${runwareAll.length} imagens Runware + ${carousel1.length} Carousel`);
  if (runwareAll.length > 0) {
    const urlSet1 = new Set<string>();
    const marketing3_1 = getMarketingForAd(3, urlSet1, true);
    const canva2_1 = addCanvaTemplates(canvaTemplatesPool, urlSet1);
    const showcase1 = getShowcaseForAd(0);
    let ad1Combination = createCombination([runwareAll, carousel1, marketing3_1, canva2_1]);
    ad1Combination = sanitizeNonKitCombination(ad1Combination, 1);
    ad1Combination = limitTo10Images(ad1Combination);
    combinations.push(showcase1 ? [...ad1Combination, showcase1] : ad1Combination);
    console.log(`✅ [Ad #1] Total final: ${ad1Combination.length} imagens (${canva2_1.length} Canva)`);
  } else {
    console.warn(`⚠️ [generateImageCombinations] Anúncio #1 (Runware): Nenhuma imagem disponível`);
  }

  // ⚠️ Anúncio #2: 🎨 Gemini Background + White (TODAS as imagens + 3 marketing + 2 Canva + 4 Carousel)
  const whiteAll = (imagesBySource.geminiWhite || []).filter(img => !!img.url);
  const backAll = (imagesBySource.geminiBackground || []).filter(img => !!img.url);
  const carousel2 = imagesBySource.geminiCarousel || [];
  console.log(`📊 [Ad #2] Usando TODAS: ${whiteAll.length} Gemini White + ${backAll.length} Gemini Background + ${carousel2.length} Carousel`);
  if (whiteAll.length > 0 || backAll.length > 0) {
    const urlSet2 = new Set<string>();
    const marketing3_2 = getMarketingForAd(3, urlSet2, true);
    const canva2_2 = addCanvaTemplates(canvaTemplatesPool, urlSet2);
    const showcase2 = getShowcaseForAd(1);
    let ad2Combination = createCombination([whiteAll, backAll, carousel2, marketing3_2, canva2_2]);
    ad2Combination = sanitizeNonKitCombination(ad2Combination, 2);
    ad2Combination = limitTo10Images(ad2Combination);
    combinations.push(showcase2 ? [...ad2Combination, showcase2] : ad2Combination);
    console.log(`✅ [Ad #2] Total final: ${ad2Combination.length} imagens (${canva2_2.length} Canva)`);
  } else {
    console.warn(`⚠️ [generateImageCombinations] Anúncio #2 (Gemini): Nenhuma imagem disponível`);
  }

  // 3. ANÚNCIO COM AS IMAGENS DO Gerador BFL.ai (TODAS as imagens + 3 Marketing + 2 Canva + 4 Carousel)
  const bflAll = (imagesBySource.bfl || []).filter(img => !!img.url);
  const bflWhiteAll = (imagesBySource.bflWhite || []).filter(img => !!img.url);
  const carousel3 = imagesBySource.geminiCarousel || [];
  console.log(`📊 [Ad #3] Usando TODAS: ${bflAll.length} BFL + ${bflWhiteAll.length} BFL White + ${carousel3.length} Carousel`);
  if (bflAll.length > 0 || bflWhiteAll.length > 0) {
    const urlSet3 = new Set<string>();
    const marketing3_3 = getMarketingForAd(3, urlSet3, true);
    const canva2_3 = addCanvaTemplates(canvaTemplatesPool, urlSet3);
    const showcase3 = getShowcaseForAd(2);
    let ad3Combination = createCombination([bflAll, bflWhiteAll, carousel3, marketing3_3, canva2_3]);
    ad3Combination = sanitizeNonKitCombination(ad3Combination, 3);
    ad3Combination = limitTo10Images(ad3Combination);
    combinations.push(showcase3 ? [...ad3Combination, showcase3] : ad3Combination);
    console.log(`✅ [Ad #3] Total final: ${ad3Combination.length} imagens (${canva2_3.length} Canva)`);
  } else {
    console.warn(`⚠️ [generateImageCombinations] Anúncio #3 (BFL): Nenhuma imagem disponível`);
  }

  // 4. ANÚNCIO COM AS IMAGENS DO BFL.ai - Fundo Branco 2 imagens + Runway AI 3 imagens + 1 Gemini + 3 Marketing + 2 Canva + 4 Carousel
  const urlSet4 = new Set<string>();
  const bflWhite2_4 = safeGetImages(imagesBySource.bflWhite, 2, imagesBySource.whiteBackground, urlSet4);
  const runway_4 = safeGetImages(imagesBySource.runway, 3, imagesBySource.allAI_NoKitNoMarketing, urlSet4);
  const geminiRandom1 = safeGetImages(imagesBySource.geminiBackground, 1, imagesBySource.allAI_NoKitNoMarketing, urlSet4);
  const marketing3_4 = getMarketingForAd(3, urlSet4, true);
  const canva2_4 = addCanvaTemplates(canvaTemplatesPool, urlSet4);
  const carousel4 = imagesBySource.geminiCarousel || [];
  const showcase4 = getShowcaseForAd(3);
  let ad4Combination = createCombination([bflWhite2_4, runway_4, geminiRandom1, carousel4, marketing3_4, canva2_4]);
  ad4Combination = sanitizeNonKitCombination(ad4Combination, 4);
  ad4Combination = limitTo10Images(ad4Combination);
  combinations.push(showcase4 ? [...ad4Combination, showcase4] : ad4Combination);

  // 5. ANÚNCIO COM AS IMAGENS DO Gemini - Fundo Branco 2 imagens + 3 Marketing garantidos + Marketing Gemini 5 imagens + 2 Canva + 4 Carousel
  const urlSet5 = new Set<string>();
  const geminiWhite2_5 = safeGetImages(imagesBySource.geminiWhite, 2, imagesBySource.whiteBackground, urlSet5);
  const marketing3_5 = getMarketingForAd(3, urlSet5, true);
  const marketingGemini5 = safeGetImages(imagesBySource.marketingGemini, 5, imagesBySource.marketingTriggers_NoKit, urlSet5);
  const canva2_5 = addCanvaTemplates(canvaTemplatesPool, urlSet5);
  const carousel5 = imagesBySource.geminiCarousel || [];
  const showcase5 = getShowcaseForAd(4);
  let ad5Combination = createCombination([geminiWhite2_5, marketing3_5, marketingGemini5, carousel5, canva2_5]);
  ad5Combination = sanitizeNonKitCombination(ad5Combination, 5);
  ad5Combination = limitTo10Images(ad5Combination);
  combinations.push(showcase5 ? [...ad5Combination, showcase5] : ad5Combination);

  // 6. ANÚNCIO COM AS IMAGENS DO BFL.ai - Fundo Branco 2 imagens + 3 Marketing garantidos + Marketing Runware 5 imagens + 2 Canva + 4 Carousel
  const urlSet6 = new Set<string>();
  const bflWhite2_6 = safeGetImages(imagesBySource.bflWhite, 2, imagesBySource.whiteBackground, urlSet6);
  const marketing3_6 = getMarketingForAd(3, urlSet6, true);
  const marketingRunware5 = safeGetImages(imagesBySource.marketingRunware, 5, imagesBySource.marketingTriggers_NoKit, urlSet6);
  const canva2_6 = addCanvaTemplates(canvaTemplatesPool, urlSet6);
  const carousel6 = imagesBySource.geminiCarousel || [];
  const showcase6 = getShowcaseForAd(5);
  let ad6Combination = createCombination([bflWhite2_6, marketing3_6, marketingRunware5, carousel6, canva2_6]);
  ad6Combination = sanitizeNonKitCombination(ad6Combination, 6);
  ad6Combination = limitTo10Images(ad6Combination);
  combinations.push(showcase6 ? [...ad6Combination, showcase6] : ad6Combination);

  // 7. ANÚNCIO COM AS IMAGENS DO BFL.ai - Fundo Branco 2 imagens + 3 Marketing garantidos + Marketing BFL 3 imagens + 2 Canva + 4 Carousel
  const urlSet7 = new Set<string>();
  const bflWhite2_7 = safeGetImages(imagesBySource.bflWhite, 2, imagesBySource.whiteBackground, urlSet7);
  const marketing3_7 = getMarketingForAd(3, urlSet7, true);
  const marketingBfl3 = safeGetImages(imagesBySource.marketingBfl, 3, imagesBySource.marketingTriggers_NoKit, urlSet7);
  const canva2_7 = addCanvaTemplates(canvaTemplatesPool, urlSet7);
  const carousel7 = imagesBySource.geminiCarousel || [];
  const showcase7 = getShowcaseForAd(6);
  let ad7Combination = createCombination([bflWhite2_7, marketing3_7, marketingBfl3, carousel7, canva2_7]);
  ad7Combination = sanitizeNonKitCombination(ad7Combination, 7);
  ad7Combination = limitTo10Images(ad7Combination);
  combinations.push(showcase7 ? [...ad7Combination, showcase7] : ad7Combination);

  // 8. ANÚNCIO COM AS IMAGENS FUNDO BRANCO (4 imagens) + 5 ALEATÓRIAS DAS IAS + 3 Marketing + 2 Canva + 4 Carousel
  const urlSet8 = new Set<string>();
  const runwareWhite = safeGetImages(imagesBySource.runware.filter(isWhiteBackground), 1, [], urlSet8);
  const geminiWhite_8 = safeGetImages(imagesBySource.geminiWhite, 1, [], urlSet8);
  const bflWhite_8 = safeGetImages(imagesBySource.bflWhite, 2, imagesBySource.whiteBackground, urlSet8);
  const random5_8 = safeGetImages(imagesBySource.allAI_NoKitNoMarketing, 5, [], urlSet8);
  const marketing3_8 = getMarketingForAd(3, urlSet8, true);
  const canva2_8 = addCanvaTemplates(canvaTemplatesPool, urlSet8);
  const carousel8 = imagesBySource.geminiCarousel || [];
  const showcase8 = getShowcaseForAd(7);
  let ad8Combination = createCombination([runwareWhite, geminiWhite_8, bflWhite_8, random5_8, carousel8, marketing3_8, canva2_8]);
  ad8Combination = sanitizeNonKitCombination(ad8Combination, 8);
  ad8Combination = limitTo10Images(ad8Combination);
  combinations.push(showcase8 ? [...ad8Combination, showcase8] : ad8Combination);

  // 9. ANÚNCIO COM UMA FOTO FUNDO BRANCO E MAIS 5 IMAGENS aleatória DAS IAs geradas + 3 Marketing + 2 Canva + 4 Carousel
  const urlSet9 = new Set<string>();
  const white1_9 = safeGetImages(imagesBySource.whiteBackground, 1, [], urlSet9);
  const random5_9 = safeGetImages(imagesBySource.allAI_NoKitNoMarketing, 5, [], urlSet9);
  const marketing3_9 = getMarketingForAd(3, urlSet9, true);
  const canva2_9 = addCanvaTemplates(canvaTemplatesPool, urlSet9);
  const carousel9 = imagesBySource.geminiCarousel || [];
  const showcase9 = getShowcaseForAd(8);
  let ad9Combination = createCombination([white1_9, random5_9, carousel9, marketing3_9, canva2_9]);
  ad9Combination = sanitizeNonKitCombination(ad9Combination, 9);
  ad9Combination = limitTo10Images(ad9Combination);
  combinations.push(showcase9 ? [...ad9Combination, showcase9] : ad9Combination);

  // 10. ANÚNCIO COM UMA FOTO FUNDO BRANCO E MAIS 5 IMAGENS aleatória DAS IAs geradas + 3 Marketing + 2 Canva + 4 Carousel
  const urlSet10 = new Set<string>();
  const white1_10 = safeGetImages(imagesBySource.whiteBackground, 1, [], urlSet10);
  const random5_10 = safeGetImages(imagesBySource.allAI_NoKitNoMarketing, 5, [], urlSet10);
  const marketing3_10 = getMarketingForAd(3, urlSet10, true);
  const canva2_10 = addCanvaTemplates(canvaTemplatesPool, urlSet10);
  const carousel10 = imagesBySource.geminiCarousel || [];
  const showcase10 = getShowcaseForAd(9);
  let ad10Combination = createCombination([white1_10, random5_10, carousel10, marketing3_10, canva2_10]);
  ad10Combination = sanitizeNonKitCombination(ad10Combination, 10);
  ad10Combination = limitTo10Images(ad10Combination);
  combinations.push(showcase10 ? [...ad10Combination, showcase10] : ad10Combination);

  // 11-17. ANÚNCIOS KIT (2, 4, 6, 8, 10, 20, 30 UNIDADES) - KIT ESPECÍFICO + 10 IMAGENS ALEATÓRIAS + SHOWCASE
  const kitQuantities = [2, 4, 6, 8, 10, 20, 30];
  const kitPoolKeys: Record<number, string> = {
    2: 'kit2',
    4: 'kit4',
    6: 'kit6',
    8: 'kit8',
    10: 'kit10',
    20: 'kit20',
    30: 'kit30'
  };
  
  kitQuantities.forEach((quantity, kitIndex) => {
    const urlSetKit = new Set<string>();
    const adNumber = 11 + kitIndex;
    
    // 🎯 Usar pool ESPECÍFICO da quantidade (ex: kit2 para KIT 2 unidades)
    const poolKey = kitPoolKeys[quantity];
    const specificPool = imagesBySource[poolKey] || [];
    
    console.log(`📦 [KIT ${quantity}] Pool ESPECÍFICO [${poolKey}]: ${specificPool.length} imagens disponíveis`);
    
    // 🚨 CENÁRIO CRÍTICO: Nenhum KIT disponível no pool específico
    if (specificPool.length === 0) {
      console.error(`🚨 [KIT ${quantity}] NENHUM KIT ${quantity} DISPONÍVEL! Anúncio será gerado sem imagem de KIT ${quantity}.`);
      
      // Avisar apenas uma vez (primeiro anúncio KIT)
      if (kitIndex === 0) {
        toast.warning(`⚠️ Nenhuma imagem de KIT encontrada. Gere KITs com Cloudinary e hospede-os primeiro.`, {
          duration: 8000
        });
      }
      
      // Criar anúncio sem KIT (apenas imagens aleatórias + 3 marketing)
      const random10 = safeGetImages(imagesBySource.allAI_NoKitNoMarketing, 10, [], urlSetKit);
      const marketing3_kit = getMarketingForAd(3, urlSetKit, true);
      const showcaseKit = getShowcaseForAd(10 + kitIndex);
      let kitCombination = createCombination([random10, marketing3_kit]);
      
      combinations.push(showcaseKit ? [...kitCombination, showcaseKit] : kitCombination);
      return; // Pular para próximo KIT
    }
    
    // 📊 AUDITORIA: Contar KITs por tipo (exatos, genéricos, errados)
    const exactsCount = specificPool.filter(img => isExactKitQuantity(img, quantity)).length;
    const genericsCount = specificPool.filter(isGenericKit).length;
    const wrongsCount = specificPool.filter(img => {
      const q = detectKitQuantity(img);
      return q !== null && q !== quantity;
    }).length;
    
    console.log(`📊 [AUDITORIA KIT ${quantity}] Pool: ${exactsCount} exatos | ${genericsCount} genéricos | ${wrongsCount} errados`);
    
    // ✅ Filtrar KIT específico por quantidade (priorizar exatos)
    const exactKits = specificPool.filter(img => isExactKitQuantity(img, quantity));
    const genericKits = specificPool.filter(isGenericKit);
    
    // PRIORIDADE: Usar KIT EXATO primeiro, depois GENÉRICO, NUNCA errado
    let kitFirst: HostedImage[] = [];
    
    if (exactKits.length > 0) {
      // CASO A: Tem KIT exato → usar o primeiro KIT exato
      kitFirst = [exactKits[0]];
      urlSetKit.add(exactKits[0].url);
      console.log(`   ✅ Primeira imagem: KIT EXATO ${quantity} unidades (tag correta)`);
    } else if (genericKits.length > 0) {
      // CASO B: Não tem exato, mas tem genérico → usar genérico
      kitFirst = [genericKits[0]];
      urlSetKit.add(genericKits[0].url);
      console.warn(`   ⚠️ Primeira imagem: KIT GENÉRICO (sem número específico, mas é KIT)`);
    } else {
      // CASO C: Pool tem imagens mas nenhuma é exata ou genérica → ERRO
      console.error(`   🚨 ERRO: Pool tem ${specificPool.length} imagens mas nenhuma é KIT válido!`);
      kitFirst = [];
    }
    
    // 🔍 LOG DETALHADO da primeira imagem selecionada
    if (kitFirst.length > 0) {
      const selectedKit = kitFirst[0];
      console.log(`   🏷️ Tags da primeira imagem: ${selectedKit.tags.join(', ')}`);
      console.log(`   📝 Descrição: ${selectedKit.description || 'N/A'}`);
      console.log(`   🔗 URL: ${selectedKit.url.substring(0, 60)}...`);
    } else {
      console.error(`   ❌ Nenhuma primeira imagem de KIT selecionada! Anúncio ficará sem KIT.`);
    }
    
    // 9 imagens aleatórias (nunca usar KITs nas complementares) + 3 Marketing + 2 Canva + 4 Carousel
    const random9 = safeGetImages(imagesBySource.allAI_NoKitNoMarketing, 9, [], urlSetKit);
    const marketing3_kit = getMarketingForAd(3, urlSetKit, true);
    const canva2_kit = addCanvaTemplates(canvaTemplatesPool, urlSetKit);
    const carouselKit = imagesBySource.geminiCarousel || [];
    
    // Adicionar 1 showcase único
    const showcaseKit = getShowcaseForAd(10 + kitIndex); // Anúncios 11-17
    let kitCombination = createCombination([kitFirst, random9, carouselKit, marketing3_kit, canva2_kit]);
    
    // 🔧 SANITIZAÇÃO FINAL: Garantir que apenas KITs da quantidade correta permaneçam
    kitCombination = sanitizeKitCombination(kitCombination, quantity);
    kitCombination = limitTo10Images(kitCombination);
    
    // 📊 LOG FINAL: Verificar resultado da sanitização
    const finalExacts = kitCombination.filter(img => isExactKitQuantity(img, quantity)).length;
    const finalGenerics = kitCombination.filter(isGenericKit).length;
    const finalWrongs = kitCombination.filter(img => {
      const q = detectKitQuantity(img);
      return isKitImage(img) && q !== null && q !== quantity;
    }).length;
    
    console.log(`✅ [KIT ${quantity}] Combinação final: ${kitCombination.length} imagens`);
    console.log(`   - ${finalExacts} KIT(s) EXATO(s) de ${quantity}`);
    console.log(`   - ${finalGenerics} KIT(s) GENÉRICO(s)`);
    if (finalWrongs > 0) {
      console.error(`   🚨 PROBLEMA: ${finalWrongs} KIT(s) com quantidade ERRADA ainda presente!`);
    }
    
    combinations.push(showcaseKit ? [...kitCombination, showcaseKit] : kitCombination);
  });

  // Helper para filtrar imagens SEM Marketing Gatilhos
  const filterNoMarketing = (images: HostedImage[]): HostedImage[] => {
    return images.filter(img => 
      !isMarketingGemini(img) && 
      !isMarketingRunware(img) && 
      !isMarketingBfl(img) && 
      !isMarketingOthers(img)
    );
  };

  // 18. ANÚNCIO MIX BALANCED - 2 Fundo Branco + 1 Runware + 2 Gemini Background + 1 BFL + 1 Runway + 3 Marketing + 2 Canva + 4 Carousel
  const urlSet18 = new Set<string>();
  const white2_18 = safeGetImages(filterNoMarketing(imagesBySource.whiteBackground), 2, imagesBySource.allAI_NoKitNoMarketing, urlSet18);
  const runware1_18 = safeGetImages(filterNoMarketing(imagesBySource.runware), 1, imagesBySource.allAI_NoKitNoMarketing, urlSet18);
  const geminiBackground2_18 = safeGetImages(filterNoMarketing(imagesBySource.geminiBackground), 2, imagesBySource.allAI_NoKitNoMarketing, urlSet18);
  const bfl1_18 = safeGetImages(filterNoMarketing(imagesBySource.bfl), 1, imagesBySource.allAI_NoKitNoMarketing, urlSet18);
  const runway1_18 = safeGetImages(filterNoMarketing(imagesBySource.runway), 1, imagesBySource.allAI_NoKitNoMarketing, urlSet18);
  const marketing3_18 = getMarketingForAd(3, urlSet18, true);
  const canva2_18 = addCanvaTemplates(canvaTemplatesPool, urlSet18);
  const carousel18 = imagesBySource.geminiCarousel || [];
  const showcase18 = getShowcaseForAd(17);
  let ad18Combination = createCombination([white2_18, runware1_18, geminiBackground2_18, bfl1_18, runway1_18, carousel18, marketing3_18, canva2_18]);
  ad18Combination = sanitizeNonKitCombination(ad18Combination, 18);
  ad18Combination = limitTo10Images(ad18Combination);
  combinations.push(showcase18 ? [...ad18Combination, showcase18] : ad18Combination);

  // 19. ANÚNCIO MIX AI FOCUS - 2 Fundo Branco + 2 BFL + 1 Runway + 1 Gemini Background + 3 Marketing + 2 Canva + 4 Carousel
  const urlSet19 = new Set<string>();
  const white2_19 = safeGetImages(filterNoMarketing(imagesBySource.whiteBackground), 2, imagesBySource.allAI_NoKitNoMarketing, urlSet19);
  const bfl2_19 = safeGetImages(filterNoMarketing(imagesBySource.bfl), 2, imagesBySource.allAI_NoKitNoMarketing, urlSet19);
  const runway1_19 = safeGetImages(filterNoMarketing(imagesBySource.runway), 1, imagesBySource.allAI_NoKitNoMarketing, urlSet19);
  const geminiBackground1_19 = safeGetImages(filterNoMarketing(imagesBySource.geminiBackground), 1, imagesBySource.allAI_NoKitNoMarketing, urlSet19);
  const marketing3_19 = getMarketingForAd(3, urlSet19, true);
  const canva2_19 = addCanvaTemplates(canvaTemplatesPool, urlSet19);
  const carousel19 = imagesBySource.geminiCarousel || [];
  const showcase19 = getShowcaseForAd(18);
  let ad19Combination = createCombination([white2_19, bfl2_19, runway1_19, geminiBackground1_19, carousel19, marketing3_19, canva2_19]);
  ad19Combination = sanitizeNonKitCombination(ad19Combination, 19);
  ad19Combination = limitTo10Images(ad19Combination);
  combinations.push(showcase19 ? [...ad19Combination, showcase19] : ad19Combination);

  // 20. ANÚNCIO MIX DIVERSE - 2 Fundo Branco + 1 Runware + 1 Gemini Background + 1 BFL + 1 Runway + 3 Marketing + 2 Canva + 4 Carousel
  const urlSet20 = new Set<string>();
  const white2_20 = safeGetImages(filterNoMarketing(imagesBySource.whiteBackground), 2, imagesBySource.allAI_NoKitNoMarketing, urlSet20);
  const runware1_20 = safeGetImages(filterNoMarketing(imagesBySource.runware), 1, imagesBySource.allAI_NoKitNoMarketing, urlSet20);
  const geminiBackground1_20 = safeGetImages(filterNoMarketing(imagesBySource.geminiBackground), 1, imagesBySource.allAI_NoKitNoMarketing, urlSet20);
  const bfl1_20 = safeGetImages(filterNoMarketing(imagesBySource.bfl), 1, imagesBySource.allAI_NoKitNoMarketing, urlSet20);
  const runway1_20 = safeGetImages(filterNoMarketing(imagesBySource.runway), 1, imagesBySource.allAI_NoKitNoMarketing, urlSet20);
  const marketing3_20 = getMarketingForAd(3, urlSet20, true);
  const canva2_20 = addCanvaTemplates(canvaTemplatesPool, urlSet20);
  const carousel20 = imagesBySource.geminiCarousel || [];
  const showcase20 = getShowcaseForAd(19);
  let ad20Combination = createCombination([white2_20, runware1_20, geminiBackground1_20, bfl1_20, runway1_20, carousel20, marketing3_20, canva2_20]);
  ad20Combination = sanitizeNonKitCombination(ad20Combination, 20);
  ad20Combination = limitTo10Images(ad20Combination);
  combinations.push(showcase20 ? [...ad20Combination, showcase20] : ad20Combination);

  // 21. ANÚNCIO COM IMAGENS MELHORADAS COM DeepAI + 3 Marketing Gatilhos
  // ✅ REGRA: Sempre usar SOMENTE imagens DeepAI. Só fazer MIX se houver menos de 3 imagens DeepAI.
  const urlSet21 = new Set<string>();
  const deepaiPool = imagesBySource.deepai;
  const deepaiCount = deepaiPool.length;

  console.log(`💎 [DEEPAI] Imagens disponíveis: ${deepaiCount}`);

  let deepaiImages: HostedImage[] = [];
  let complementaryImages: HostedImage[] = [];

  if (deepaiCount < 3) {
    // CASO 1: Menos de 3 imagens DeepAI → Fazer MIX com IAs aleatórias
    console.log(`   ⚠️ Apenas ${deepaiCount} imagens DeepAI. Completando com imagens de IA para atingir 7 imagens...`);
    deepaiImages = safeGetImages(deepaiPool, deepaiCount, [], urlSet21);
    const needed = 7 - deepaiCount; // Total 7 imagens (10 - 3 marketing)
    complementaryImages = safeGetImages(imagesBySource.allAI_NoKitNoMarketing, needed, [], urlSet21);
    
    // Toast de aviso
    if (deepaiCount === 0) {
      toast.info('ℹ️ Nenhuma imagem DeepAI encontrada. Anúncio 21 usará apenas imagens de IA.', {
        duration: 5000
      });
    } else {
      toast.info(`ℹ️ Apenas ${deepaiCount} imagem(ns) DeepAI encontrada(s). Completando com ${needed} imagens de IA para criar MIX.`, {
        duration: 5000
      });
    }
  } else {
    // CASO 2: 3 ou mais imagens DeepAI → Usar TODAS as imagens DeepAI disponíveis
    console.log(`   ✅ ${deepaiCount} imagens DeepAI disponíveis. Usando TODAS as imagens DeepAI (sem MIX).`);
    deepaiImages = deepaiPool; // ✅ Incluir TODAS as imagens DeepAI sem limite
    deepaiImages.forEach(img => urlSet21.add(img.url)); // Adicionar ao set para evitar duplicatas
    complementaryImages = []; // Não usar complementares
    
    toast.success(`✅ Anúncio 21: ${deepaiCount} imagens DeepAI puras (100% DeepAI).`, {
      duration: 4000
    });
  }

  // 3 Marketing Gatilhos garantidos + 2 Canva + 4 Carousel
  const marketing3_21 = getMarketingForAd(3, urlSet21, true);
  const canva2_21 = addCanvaTemplates(canvaTemplatesPool, urlSet21);
  const carousel21 = imagesBySource.geminiCarousel || [];

  // Showcase
  const showcase21 = getShowcaseForAd(20);

  // Montar combinação com carousel
  let ad21Combination = createCombination([deepaiImages, complementaryImages, carousel21, marketing3_21, canva2_21]);
  ad21Combination = sanitizeNonKitCombination(ad21Combination, 21);
  ad21Combination = limitTo10Images(ad21Combination);

  // Log detalhado
  console.log(`✅ [ANÚNCIO 21] Combinação final:`);
  console.log(`   - ${deepaiImages.length} imagens DeepAI`);
  console.log(`   - ${complementaryImages.length} imagens complementares`);
  console.log(`   - ${carousel21.length} imagens Carousel`);
  console.log(`   - ${marketing3_21.length} imagens Marketing`);
  console.log(`   - Total: ${ad21Combination.length} imagens`);

  combinations.push(showcase21 ? [...ad21Combination, showcase21] : ad21Combination);

  // ===== ANÚNCIO 22: 3 IA Avançada (Runware) + TODOS Marketing Gemini + 2 Canva + 4 Carousel + 1 Showcase =====
  const urlSet22 = new Set<string>();
  const runware22 = selectRandomImages(imagesBySource.runware || [], 3);
  runware22.forEach(img => urlSet22.add(img.url));
  const marketingGeminiAll_22 = (imagesBySource.marketingGemini || []).filter(img => !!img.url);
  marketingGeminiAll_22.forEach(img => urlSet22.add(img.url));
  const canva2_22 = addCanvaTemplates(canvaTemplatesPool, urlSet22);
  const carousel22 = imagesBySource.geminiCarousel || [];
  console.log(`📊 [Ad #22] 3 Runware (${runware22.length}) + TODOS Marketing Gemini (${marketingGeminiAll_22.length}) + ${canva2_22.length} Canva + Carousel (${carousel22.length})`);

  if (runware22.length > 0 && marketingGeminiAll_22.length > 0) {
    const showcase22 = getShowcaseForAd(21);
    let ad22Combination = createCombination([runware22, marketingGeminiAll_22, carousel22, canva2_22]);
    ad22Combination = sanitizeNonKitCombination(ad22Combination, 22);
    ad22Combination = limitTo10Images(ad22Combination);
    combinations.push(showcase22 ? [...ad22Combination, showcase22] : ad22Combination);
    console.log(`✅ [Ad #22] Total: ${ad22Combination.length} imagens (3 Runware + ${marketingGeminiAll_22.length} Marketing Gemini + ${canva2_22.length} Canva + ${carousel22.length} Carousel + ${showcase22 ? 1 : 0} Showcase)`);
  } else {
    console.warn(`⚠️ [Ad #22] Pulado - Runware: ${runware22.length}, Marketing Gemini: ${marketingGeminiAll_22.length}`);
  }

  // ===== ANÚNCIO 23: 3 BFL/BFL White + TODOS Marketing Runware + 2 Canva + 4 Carousel + 1 Showcase =====
  const urlSet23 = new Set<string>();
  const bfl23 = selectRandomImages(imagesBySource.bfl || [], 2);
  const bflWhite23 = selectRandomImages(imagesBySource.bflWhite || [], 1);
  const combinedBfl23 = [...bfl23, ...bflWhite23];
  combinedBfl23.forEach(img => urlSet23.add(img.url));
  const marketingRunwareAll_23 = (imagesBySource.marketingRunware || []).filter(img => !!img.url);
  marketingRunwareAll_23.forEach(img => urlSet23.add(img.url));
  const canva2_23 = addCanvaTemplates(canvaTemplatesPool, urlSet23);
  const carousel23 = imagesBySource.geminiCarousel || [];
  console.log(`📊 [Ad #23] 3 BFL/White (${combinedBfl23.length}) + TODOS Marketing Runware (${marketingRunwareAll_23.length}) + ${canva2_23.length} Canva + Carousel (${carousel23.length})`);

  if (combinedBfl23.length > 0 && marketingRunwareAll_23.length > 0) {
    const showcase23 = getShowcaseForAd(22);
    let ad23Combination = createCombination([combinedBfl23, marketingRunwareAll_23, carousel23, canva2_23]);
    ad23Combination = sanitizeNonKitCombination(ad23Combination, 23);
    ad23Combination = limitTo10Images(ad23Combination);
    combinations.push(showcase23 ? [...ad23Combination, showcase23] : ad23Combination);
    console.log(`✅ [Ad #23] Total: ${ad23Combination.length} imagens (3 BFL + ${marketingRunwareAll_23.length} Marketing Runware + ${canva2_23.length} Canva + ${carousel23.length} Carousel + ${showcase23 ? 1 : 0} Showcase)`);
  } else {
    console.warn(`⚠️ [Ad #23] Pulado - BFL: ${combinedBfl23.length}, Marketing Runware: ${marketingRunwareAll_23.length}`);
  }

  // ===== ANÚNCIO 24: 3 Gemini Background + TODOS Marketing BFL + 2 Canva + 4 Carousel + 1 Showcase =====
  const urlSet24 = new Set<string>();
  const geminiBackground24 = selectRandomImages(imagesBySource.geminiBackground || [], 3);
  geminiBackground24.forEach(img => urlSet24.add(img.url));
  const marketingBflAll_24 = (imagesBySource.marketingBfl || []).filter(img => !!img.url);
  marketingBflAll_24.forEach(img => urlSet24.add(img.url));
  const canva2_24 = addCanvaTemplates(canvaTemplatesPool, urlSet24);
  const carousel24 = imagesBySource.geminiCarousel || [];
  console.log(`📊 [Ad #24] 3 Gemini Background (${geminiBackground24.length}) + TODOS Marketing BFL (${marketingBflAll_24.length}) + ${canva2_24.length} Canva + Carousel (${carousel24.length})`);

  if (geminiBackground24.length > 0 && marketingBflAll_24.length > 0) {
    const showcase24 = getShowcaseForAd(23);
    let ad24Combination = createCombination([geminiBackground24, marketingBflAll_24, carousel24, canva2_24]);
    ad24Combination = sanitizeNonKitCombination(ad24Combination, 24);
    ad24Combination = limitTo10Images(ad24Combination);
    combinations.push(showcase24 ? [...ad24Combination, showcase24] : ad24Combination);
    console.log(`✅ [Ad #24] Total: ${ad24Combination.length} imagens (3 Gemini Bg + ${marketingBflAll_24.length} Marketing BFL + ${canva2_24.length} Canva + ${carousel24.length} Carousel + ${showcase24 ? 1 : 0} Showcase)`);
  } else {
    console.warn(`⚠️ [Ad #24] Pulado - Gemini Bg: ${geminiBackground24.length}, Marketing BFL: ${marketingBflAll_24.length}`);
  }

  // ===== ANÚNCIOS 25-28: 8 Templates da Galeria Hospedada (Marketing Canva) =====
  
  console.log(`📸 [Ads 25-28] Gerando 4 anúncios com 8 Templates de Marketing Estilo Canva cada`);
  console.log(`   - Total de Templates Canva disponíveis: ${canvaTemplatesPool.length}`);
  console.log(`   - Tag de identificação: 'source:marketing-templates-hosted'`);
  
  // Encontrar templates 002 e 001 dentro dos Templates Canva
  const template002 = canvaTemplatesPool.find(img => 
    img.original_filename?.includes('002') || 
    img.description?.includes('002') ||
    img.tags?.some(tag => tag.includes('002'))
  );
  const template001 = canvaTemplatesPool.find(img => 
    img.original_filename?.includes('001') || 
    img.description?.includes('001') ||
    img.tags?.some(tag => tag.includes('001'))
  );
  
  // Helper para priorizar templates 002 e 001 no início
  const prioritizeCanvaTemplates = (templates: HostedImage[]): HostedImage[] => {
    const prioritized: HostedImage[] = [];
    const urlsUsed = new Set<string>();
    
    // Adicionar 002 primeiro (se existir)
    if (template002) {
      prioritized.push(template002);
      urlsUsed.add(template002.url);
      console.log(`   ✅ Template 002 priorizado: ${template002.original_filename}`);
    }
    
    // Depois adicionar 001
    if (template001 && !urlsUsed.has(template001.url)) {
      prioritized.push(template001);
      urlsUsed.add(template001.url);
      console.log(`   ✅ Template 001 priorizado: ${template001.original_filename}`);
    }
    
    // Adicionar o resto (exceto os já usados)
    const remaining = templates.filter(img => !urlsUsed.has(img.url));
    
    return [...prioritized, ...remaining];
  };
  
  // Priorizar templates 002 e 001 no pool de Templates Canva
  const prioritizedCanvaTemplates = prioritizeCanvaTemplates(canvaTemplatesPool);
  
  if (canvaTemplatesPool.length === 0) {
    console.warn(`⚠️ [Ads 25-28] AVISO: Nenhum Template Canva encontrado! Gere templates no bloco "🎨 Templates de Marketing Estilo Canva" primeiro.`);
  } else {
    console.log(`   🎯 ${prioritizedCanvaTemplates.length} Templates Canva prontos para uso`);
    if (template002) console.log(`      - Template 002: ${template002.original_filename}`);
    if (template001) console.log(`      - Template 001: ${template001.original_filename}`);
  }
  
  // Anúncio 25: 8 Templates Canva (Combo A) - Prioriza 002 e 001
  const hostedGallery25 = selectRandomImages(prioritizedCanvaTemplates, 8);
  if (hostedGallery25.length >= 6) {
    const showcase25 = getShowcaseForAd(24);
    let ad25Combination = [...hostedGallery25];
    ad25Combination = sanitizeNonKitCombination(ad25Combination, 25);
    combinations.push(showcase25 ? [...ad25Combination, showcase25] : ad25Combination);
    console.log(`✅ [Ad #25] Total: ${ad25Combination.length} Templates Canva (Combo A) + ${showcase25 ? 1 : 0} Showcase`);
    console.log(`   📋 Primeiras imagens: ${ad25Combination.slice(0, 2).map(img => img.original_filename).join(', ')}`);
  } else {
    console.warn(`⚠️ [Ad #25] Pulado - Templates Canva: ${hostedGallery25.length} (mínimo: 6)`);
  }

  // Anúncio 26: 8 Templates Canva (Combo B) - Prioriza 002 e 001
  const hostedGallery26 = selectRandomImages(prioritizedCanvaTemplates, 8);
  if (hostedGallery26.length >= 6) {
    const showcase26 = getShowcaseForAd(25);
    let ad26Combination = [...hostedGallery26];
    ad26Combination = sanitizeNonKitCombination(ad26Combination, 26);
    combinations.push(showcase26 ? [...ad26Combination, showcase26] : ad26Combination);
    console.log(`✅ [Ad #26] Total: ${ad26Combination.length} Templates Canva (Combo B) + ${showcase26 ? 1 : 0} Showcase`);
    console.log(`   📋 Primeiras imagens: ${ad26Combination.slice(0, 2).map(img => img.original_filename).join(', ')}`);
  } else {
    console.warn(`⚠️ [Ad #26] Pulado - Templates Canva: ${hostedGallery26.length} (mínimo: 6)`);
  }

  // Anúncio 27: 8 Templates Canva (Combo C) - Prioriza 002 e 001
  const hostedGallery27 = selectRandomImages(prioritizedCanvaTemplates, 8);
  if (hostedGallery27.length >= 6) {
    const showcase27 = getShowcaseForAd(26);
    let ad27Combination = [...hostedGallery27];
    ad27Combination = sanitizeNonKitCombination(ad27Combination, 27);
    combinations.push(showcase27 ? [...ad27Combination, showcase27] : ad27Combination);
    console.log(`✅ [Ad #27] Total: ${ad27Combination.length} Templates Canva (Combo C) + ${showcase27 ? 1 : 0} Showcase`);
    console.log(`   📋 Primeiras imagens: ${ad27Combination.slice(0, 2).map(img => img.original_filename).join(', ')}`);
  } else {
    console.warn(`⚠️ [Ad #27] Pulado - Templates Canva: ${hostedGallery27.length} (mínimo: 6)`);
  }

  // Anúncio 28: 8 Templates Canva (Combo D) - Prioriza 002 e 001
  const hostedGallery28 = selectRandomImages(prioritizedCanvaTemplates, 8);
  if (hostedGallery28.length >= 6) {
    const showcase28 = getShowcaseForAd(27);
    let ad28Combination = [...hostedGallery28];
    ad28Combination = sanitizeNonKitCombination(ad28Combination, 28);
    combinations.push(showcase28 ? [...ad28Combination, showcase28] : ad28Combination);
    console.log(`✅ [Ad #28] Total: ${ad28Combination.length} Templates Canva (Combo D) + ${showcase28 ? 1 : 0} Showcase`);
    console.log(`   📋 Primeiras imagens: ${ad28Combination.slice(0, 2).map(img => img.original_filename).join(', ')}`);
  } else {
    console.warn(`⚠️ [Ad #28] Pulado - Templates Canva: ${hostedGallery28.length} (mínimo: 6)`);
  }

  // Log detalhado para cada anúncio
  combinations.forEach((combination, index) => {
    const adNumber = index + 1;
    const whiteCount = combination.filter(img => isWhiteBackground(img)).length;
    const runwareCount = combination.filter(img => isRunware(img)).length;
    const deepaiCount = combination.filter(img => isDeepAI(img)).length;
    const geminiBackgroundCount = combination.filter(img => isGeminiBackground(img)).length;
    const geminiWhiteCount = combination.filter(img => isGeminiWhite(img)).length;
    const bflCount = combination.filter(img => isBfl(img)).length;
    const bflWhiteCount = combination.filter(img => isBflWhite(img)).length;
    const runwayCount = combination.filter(img => isRunway(img)).length;
    const marketingGeminiCount = combination.filter(img => isMarketingGemini(img)).length;
    const marketingRunwareCount = combination.filter(img => isMarketingRunware(img)).length;
    const marketingBflCount = combination.filter(img => isMarketingBfl(img)).length;
    const marketingCanvaCount = combination.filter(img => isMarketingCanvaTemplate(img)).length;
    const kitCount = combination.filter(img => isKitImage(img)).length;
    const showcaseCount = combination.filter(img => isShowcase(img)).length;
    
    // ✅ Contadores específicos de Marketing Gatilhos (Descrição, Características, Benefícios)
    const marketingDescCount = combination.filter(img => isMarketingDescription(img)).length;
    const marketingFeatCount = combination.filter(img => isMarketingFeatures(img)).length;
    const marketingBenCount = combination.filter(img => isMarketingBenefits(img)).length;
    
    let adType = '';
    if (adNumber === 1) adType = 'IA Avançada - Runware';
    else if (adNumber === 2) adType = 'Gemini Background + Gemini White';
    else if (adNumber === 3) adType = 'BFL.ai + BFL White';
    else if (adNumber === 4) adType = 'BFL White + Runway + Gemini Aleatória';
    else if (adNumber === 5) adType = 'Gemini White + Marketing Gatilhos Gemini';
    else if (adNumber === 6) adType = 'BFL White + Marketing Gatilhos Runware';
    else if (adNumber === 7) adType = 'BFL White + Marketing Gatilhos BFL';
    else if (adNumber === 8) adType = 'Mix Fundo Branco (4 imagens)';
    else if (adNumber === 9 || adNumber === 10) adType = '1 Fundo Branco + 6 Aleatórias';
    else if (adNumber >= 11 && adNumber <= 17) {
      const kitQty = kitQuantities[adNumber - 11];
      adType = `KIT ${kitQty} UNIDADES`;
    }
    else if (adNumber === 18) adType = 'MIX BALANCED (sem Marketing Gatilhos)';
    else if (adNumber === 19) adType = 'MIX AI FOCUS (sem Marketing Gatilhos)';
    else if (adNumber === 20) adType = 'MIX DIVERSE (sem Marketing Gatilhos)';
    else if (adNumber === 21) adType = 'Melhoria com DeepAI + Marketing Gatilhos';
    else if (adNumber === 22) adType = '3 IA Avançada (Runware) + Marketing Gemini (TODOS)';
    else if (adNumber === 23) adType = '3 BFL/BFL White + Marketing Runware (TODOS)';
    else if (adNumber === 24) adType = '3 Gemini Background + Marketing BFL (TODOS)';
    else if (adNumber === 25) adType = '8 Templates Galeria Hospedada (Combo A)';
    else if (adNumber === 26) adType = '8 Templates Galeria Hospedada (Combo B)';
    else if (adNumber === 27) adType = '8 Templates Galeria Hospedada (Combo C)';
    else if (adNumber === 28) adType = '8 Templates Galeria Hospedada (Combo D)';
    
    console.log(`📸 Anúncio ${adNumber} (${adType}): ${combination.length} imagens totais`);
    console.log(`   - Fundo Branco: ${whiteCount}, Runware: ${runwareCount}, DeepAI: ${deepaiCount}, Gemini Background: ${geminiBackgroundCount}`);
    console.log(`   - Gemini White: ${geminiWhiteCount}, BFL: ${bflCount}, BFL White: ${bflWhiteCount}, Runway: ${runwayCount}`);
    console.log(`   - Marketing Gemini: ${marketingGeminiCount}, Marketing Runware: ${marketingRunwareCount}, Marketing BFL: ${marketingBflCount}`);
    console.log(`   - 🎨 Templates Canva: ${marketingCanvaCount}`);
    console.log(`   - ✅ Marketing Descrição: ${marketingDescCount}, Características: ${marketingFeatCount}, Benefícios: ${marketingBenCount}`);
    console.log(`   - Kit: ${kitCount}, Showcases: ${showcaseCount}`);
    
    // ✅ VALIDAÇÃO CRÍTICA: Verificar se anúncios não-KIT têm imagens de KIT
    const isKitAd = adNumber >= 11 && adNumber <= 17;
    if (!isKitAd && kitCount > 0) {
      console.error(`🚨 [ERRO CRÍTICO] Anúncio ${adNumber} (NÃO-KIT) contém ${kitCount} imagem(ns) de KIT!`);
      combination.filter(img => isKitImage(img)).forEach(kit => {
        console.error(`   ❌ KIT INDEVIDO: "${kit.description?.substring(0, 50)}..." | Filename: "${kit.original_filename}"`);
      });
    }
    
    // ✅ VALIDAÇÃO: Verificar se anúncios KIT têm pelo menos 1 imagem de KIT
    if (isKitAd && kitCount === 0) {
      console.warn(`⚠️ [AVISO] Anúncio ${adNumber} (KIT) não contém nenhuma imagem de KIT!`);
    }
    
    // ✅ LOG ESPECÍFICO: DeepAI no Anúncio 21
    if (adNumber === 21 && deepaiCount > 0) {
      console.log(`   💎 [DEEPAI] Anúncio 21 contém ${deepaiCount} imagens melhoradas com DeepAI`);
    }
  });

  return combinations;
}

// Buscar e formatar Tópicos de Conversão do banco (EXATAMENTE como Planilha Bling Melhorada)
export async function fetchFormattedConversionTopics(productId: string, userId: string): Promise<string> {
  try {
    const { data: aiRows, error } = await supabase
      .from('ai_unified_results')
      .select('results, created_at')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !aiRows || aiRows.length === 0) {
      console.warn('⚠️ [TOPICS] Nenhum resultado AI encontrado');
      return '';
    }

    let results: any = aiRows[0].results;
    if (typeof results === 'string') {
      try { results = JSON.parse(results); } catch { return ''; }
    }

    // Helper to remove emojis (SAME AS BLING SPREADSHEET)
    const removeEmojis = (text: string): string => {
      if (!text) return '';
      return text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
    };

    const sections: string[] = [];

    // ============================================================
    // STEP 1: Extract "2. Introdução Captadora de Atenção" text (WITHOUT title)
    // ============================================================
    const copywritingData = results?.copywriting;
    if (copywritingData) {
      let copyText = '';
      if (typeof copywritingData === 'string') copyText = copywritingData;
      else if (copywritingData?.improvedText) copyText = copywritingData.improvedText;
      else if (copywritingData?.text) copyText = copywritingData.text;

      if (copyText) {
        // Regex robusta para capturar SOMENTE o conteúdo do tópico 2 (sem o título), parando no início do tópico 3
        // Aceita variações como: "2.", "2)", "2 -", com/sem negrito (**), e pequenas variações de acentuação
        const introRegex = /^\s*\**\s*2[\.\)\-]?\s*Introdu[cç][aã]o\s+Captadora(?:\s+de\s+Aten[cç][aã]o)?\s*\**\s*[:\-–—]?\s*\n([\s\S]*?)(?=\n\s*\**\s*3[\.\)\-]|$)/im;
        const m = copyText.match(introRegex);
        if (m && m[1]) {
          const intro = removeEmojis(m[1]).trim();
          if (intro) {
            sections.push(intro);
            console.log(`✅ [COPYWRITING] Introdução Captadora extraída: ${intro.length} chars`);
          }
        } else {
          console.warn('⚠️ [COPYWRITING] Introdução Captadora não encontrada via regex, tentando fallback genérico');
          // FALLBACK: pegar trecho entre o cabeçalho "2" e o próximo cabeçalho "3", independente do título/formatação
          try {
            const header2Re = /(\n|^)\s*(?:#{1,6}\s*)?\**\s*2[\.\)\-–—:]?\s.*$/im;
            const h2 = header2Re.exec(copyText);
            if (h2) {
              const startIdx = h2.index + h2[0].length;
              const rest = copyText.slice(startIdx);
              const header3Re = /\n\s*(?:#{1,6}\s*)?\**\s*3[\.\)\-–—:]?\s/im;
              const h3 = header3Re.exec(rest);
              const endIdx = h3 ? startIdx + (h3.index ?? 0) : copyText.length;
              let introRaw = copyText.slice(startIdx, endIdx);
              // Se conteúdo estiver na MESMA linha do cabeçalho após ":" ou "-", tenta capturar
              if (!introRaw.trim()) {
                const headerLine = h2[0];
                const sameLineContent = headerLine.split(/[:\-–—]\s*/).slice(1).join(':').trim();
                if (sameLineContent) introRaw = sameLineContent + '\n';
              }
              const intro = removeEmojis(introRaw).trim();
              if (intro) {
                sections.push(intro);
                console.log(`✅ [COPYWRITING:FALLBACK] Introdução Captadora extraída: ${intro.length} chars`);
              } else {
                console.warn('⚠️ [COPYWRITING] Fallback não encontrou conteúdo para a Introdução');
              }
            } else {
              console.warn('⚠️ [COPYWRITING] Cabeçalho "2" não localizado para fallback');
            }
          } catch (e) {
            console.error('❌ [COPYWRITING] Erro no fallback de extração da Introdução:', e);
          }
        }
      }
    } else {
      console.warn('⚠️ [COPYWRITING] Campo copywriting não encontrado');
    }

    // ============================================================
    // STEP 2: Extract topicos_conversao.improvedText (EXACTLY AS BLING SPREADSHEET)
    // ============================================================
    const topicosData = results?.topicos_conversao;
    if (topicosData) {
      console.log('🔍 [TOPICS] Estrutura topicos_conversao:', typeof topicosData);
      
      let topicosText = '';
      
      // Extract text based on structure (SAME AS BLING)
      if (typeof topicosData === 'string') {
        topicosText = topicosData;
      } else if (typeof topicosData === 'object' && topicosData !== null) {
        if (topicosData.improvedText) {
          topicosText = topicosData.improvedText;
          console.log('✅ [TOPICS] Usando improvedText');
        } else if (topicosData.text) {
          topicosText = topicosData.text;
          console.log('✅ [TOPICS] Usando text');
        } else if (topicosData.content) {
          topicosText = topicosData.content;
          console.log('✅ [TOPICS] Usando content');
        }
      }

      if (topicosText) {
        // EXACTLY THE SAME PROCESSING AS BLING SPREADSHEET (lines 42-47 of blingSpreadsheetUtils.ts):
        
        // 1. Remove the header "**🔍 DESCRIÇÃO SEO OTIMIZADA**"
        topicosText = topicosText.replace(/\*\*🔍\s*DESCRIÇÃO\s+SEO\s+OTIMIZADA\*\*/gi, '').trim();
        
        // 2. Remove leading line breaks
        topicosText = topicosText.replace(/^[\n\r\s]+/, '');
        
        // 3. Remove emojis
        topicosText = removeEmojis(topicosText);
        
        console.log(`✅ [TOPICS] Tópicos de Conversão processados: ${topicosText.length} chars`);
        
        if (topicosText) {
          sections.push(topicosText);
        }
      } else {
        console.warn('⚠️ [TOPICS] Texto de tópicos não encontrado');
      }
    } else {
      console.warn('⚠️ [TOPICS] Campo topicos_conversao não encontrado');
    }

    // ============================================================
    // STEP 3: Combine sections with blank line separator
    // ============================================================
    const finalDescription = sections.join('\n\n');
    console.log(`✅ [TOPICS] Descrição final gerada: ${finalDescription.length} chars (${sections.length} seções)`);

    return finalDescription;

  } catch (e) {
    console.error('❌ [TOPICS] Erro ao buscar tópicos de conversão:', e);
    return '';
  }
}

// Gerar os anúncios premium usando configuração do banco (Modelo 1) ou padrão
// Importar tipos de AdConfig
import { AdConfig, DEFAULT_AD_CONFIGS, ImageSourceType } from '@/types/ad-config';

// Resultado da geração de combinações com configs correspondentes
interface CombinationResult {
  combinations: HostedImage[][];
  usedConfigs: AdConfig[];
}

// Função para gerar combinações de imagens a partir da configuração do modelo
function generateImageCombinationsFromConfig(
  imagesBySource: Record<string, HostedImage[]>,
  adConfigs: AdConfig[],
  usedImageUrls: Set<string>
): CombinationResult {
  const combinations: HostedImage[][] = [];
  const usedConfigs: AdConfig[] = [];
  
  // Log detalhado das fontes disponíveis
  console.log('📊 [SOURCES DISPONÍVEIS]:', Object.entries(imagesBySource)
    .filter(([_, arr]) => arr.length > 0)
    .map(([k, arr]) => `${k}: ${arr.length}`)
    .join(', '));
  
  const enabledConfigs = adConfigs.filter(c => c.enabled);
  console.log(`🔧 [CONFIG] Processando ${enabledConfigs.length} anúncios habilitados da configuração do modelo`);
  
  for (const adConfig of enabledConfigs) {
    const adImages: HostedImage[] = [];
    const adUrlSet = new Set<string>();
    
    // Ordenar fontes por ordem definida no configurador
    const sortedSources = [...(adConfig.imageSources || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // Log detalhado da configuração do anúncio
    console.log(`🔧 [CONFIG] Anúncio "${adConfig.name}" (ID: ${adConfig.id}) - Sources:`, 
      sortedSources.map(s => ({
        source: s.source,
        geminiModel: s.geminiModel || 'N/A',
        quantity: s.quantity,
        templates: s.selectedTemplateIds?.length || 0
      }))
    );
    
    // ✅ CORREÇÃO 2 FASES: Separar sources numéricas de sources 'all'
    const numericSources = sortedSources.filter(s => typeof s.quantity === 'number');
    const allSources = sortedSources.filter(s => s.quantity === 'all');
    
    console.log(`   📋 [2 FASES] Numéricas: ${numericSources.length} | All: ${allSources.length}`);
    
    // FASE 1: Processar PRIMEIRO as fontes com quantidade numérica
    for (const source of numericSources) {
      // Mapear o source para a chave correta em imagesBySource
      let sourceKey = mapSourceToKey(source.source);
      
      // ✅ CORREÇÃO 1: Se source é geminiBackground mas tem geminiModel específico, ajustar a chave
      if (source.source === 'geminiBackground' && source.geminiModel) {
        if (source.geminiModel === 'gemini-white-background') {
          sourceKey = 'geminiWhite';
          console.log(`🎯 [GEMINI MODEL] Ajustando source para geminiWhite (gemini-white-background)`);
        } else if (source.geminiModel === 'gemini-carousel') {
          sourceKey = 'geminiCarousel';
          console.log(`🎯 [GEMINI MODEL] Ajustando source para geminiCarousel (gemini-carousel)`);
        }
      }
      
      let sourceImages = imagesBySource[sourceKey] || [];
      
      // ✅ CORREÇÃO 2: Se source é canvaTemplate com selectedTemplateIds, filtrar por template E distribuir round-robin
      if (source.source === 'canvaTemplate' && source.selectedTemplateIds && source.selectedTemplateIds.length > 0) {
        const originalCount = sourceImages.length;
        
        // Agrupar imagens por template
        const imagesByTemplate: Record<string, HostedImage[]> = {};
        sourceImages.forEach(img => {
          const templateTag = img.tags?.find(t => t.startsWith('template:'));
          const templateId = templateTag?.replace('template:', '');
          if (templateId && source.selectedTemplateIds!.includes(templateId)) {
            if (!imagesByTemplate[templateId]) imagesByTemplate[templateId] = [];
            imagesByTemplate[templateId].push(img);
          }
        });
        
        // Round-robin: pegar 1 imagem de cada template alternadamente
        const roundRobinImages: HostedImage[] = [];
        const templateIds = Object.keys(imagesByTemplate);
        let templateIndex = 0;
        const maxIterations = originalCount; // Safety limit
        let iterations = 0;
        
        while (roundRobinImages.length < originalCount && iterations < maxIterations) {
          const currentTemplate = templateIds[templateIndex % templateIds.length];
          const templateImages = imagesByTemplate[currentTemplate];
          
          if (templateImages && templateImages.length > 0) {
            const img = templateImages.shift()!;
            roundRobinImages.push(img);
          }
          
          templateIndex++;
          iterations++;
          
          // Se todos os templates estão vazios, parar
          if (templateIds.every(tid => imagesByTemplate[tid].length === 0)) break;
        }
        
        sourceImages = roundRobinImages;
        console.log(`🎨 [TEMPLATE ROUND-ROBIN] ${sourceImages.length}/${originalCount} imagens distribuídas por ${templateIds.length} templates`);
      }
      
      const available = sourceImages.filter(img => !usedImageUrls.has(img.url) && !adUrlSet.has(img.url));
      
      // Calcular slots restantes
      const remainingSlots = 10 - adImages.length;
      if (remainingSlots <= 0) {
        console.log(`   ⏭️ [SOURCE NUMERIC] ${source.source} - Anúncio já tem 10 imagens, pulando`);
        continue;
      }
      
      const requestedQuantity = Math.min(source.quantity as number, available.length, remainingSlots);
      
      console.log(`   📦 [FASE 1 NUMERIC] ${source.source}${source.geminiModel ? ` (${source.geminiModel})` : ''} → key: ${sourceKey} | disponíveis: ${available.length} | solicitado: ${source.quantity} | slots: ${remainingSlots} | selecionando: ${requestedQuantity}`);
      
      // Usar seleção EM ORDEM (não aleatória) - respeita uploaded_at DESC
      const selected = selectImagesInOrder(available, requestedQuantity);
      selected.forEach(img => {
        adUrlSet.add(img.url);
        adImages.push(img);
      });
    }
    
    // FASE 2: Processar fontes com quantity='all' APENAS para preencher até 10
    for (const source of allSources) {
      const remainingSlots = 10 - adImages.length;
      if (remainingSlots <= 0) {
        console.log(`   ⏭️ [SOURCE ALL] ${source.source} - Anúncio já tem 10 imagens, pulando`);
        continue;
      }
      
      let sourceKey = mapSourceToKey(source.source);
      
      if (source.source === 'geminiBackground' && source.geminiModel) {
        if (source.geminiModel === 'gemini-white-background') {
          sourceKey = 'geminiWhite';
        } else if (source.geminiModel === 'gemini-carousel') {
          sourceKey = 'geminiCarousel';
        }
      }
      
      let sourceImages = imagesBySource[sourceKey] || [];
      
      // Canva template round-robin também para 'all'
      if (source.source === 'canvaTemplate' && source.selectedTemplateIds && source.selectedTemplateIds.length > 0) {
        const imagesByTemplate: Record<string, HostedImage[]> = {};
        sourceImages.forEach(img => {
          const templateTag = img.tags?.find(t => t.startsWith('template:'));
          const templateId = templateTag?.replace('template:', '');
          if (templateId && source.selectedTemplateIds!.includes(templateId)) {
            if (!imagesByTemplate[templateId]) imagesByTemplate[templateId] = [];
            imagesByTemplate[templateId].push(img);
          }
        });
        
        const roundRobinImages: HostedImage[] = [];
        const templateIds = Object.keys(imagesByTemplate);
        let templateIndex = 0;
        
        while (roundRobinImages.length < sourceImages.length && templateIds.some(tid => imagesByTemplate[tid].length > 0)) {
          const currentTemplate = templateIds[templateIndex % templateIds.length];
          const templateImages = imagesByTemplate[currentTemplate];
          
          if (templateImages && templateImages.length > 0) {
            roundRobinImages.push(templateImages.shift()!);
          }
          templateIndex++;
        }
        
        sourceImages = roundRobinImages;
      }
      
      const available = sourceImages.filter(img => !usedImageUrls.has(img.url) && !adUrlSet.has(img.url));
      
      // quantity='all' mas limitado ao remaining slots
      const requestedQuantity = Math.min(available.length, remainingSlots);
      
      console.log(`   📦 [FASE 2 ALL] ${source.source} → key: ${sourceKey} | disponíveis: ${available.length} | slots restantes: ${remainingSlots} | selecionando: ${requestedQuantity}`);
      
      const selected = selectImagesInOrder(available, requestedQuantity);
      selected.forEach(img => {
        adUrlSet.add(img.url);
        adImages.push(img);
      });
    }
    
    // Marcar como usadas APENAS as imagens que realmente entraram no anúncio
    adImages.forEach(img => usedImageUrls.add(img.url));
    
    if (adImages.length > 0) {
      combinations.push(adImages);
      usedConfigs.push(adConfig);
      console.log(`✅ [CONFIG Ad ${adConfig.id}] ${adConfig.name}: ${adImages.length} imagens`);
    } else {
      console.warn(`⚠️ [CONFIG Ad ${adConfig.id}] ${adConfig.name}: Nenhuma imagem encontrada - PULANDO`);
    }
  }
  
  console.log(`📊 [RESULTADO] Total de combinações geradas: ${combinations.length}/${enabledConfigs.length} anúncios configurados`);
  return { combinations, usedConfigs };
}

// Mapear tipo de fonte para chave em imagesBySource
function mapSourceToKey(source: ImageSourceType): string {
  const mapping: Record<ImageSourceType, string> = {
    runware: 'runware',
    geminiWhite: 'geminiWhite',
    geminiBackground: 'geminiBackground',
    bfl: 'bfl',
    bflWhite: 'bflWhite',
    runway: 'runway',
    deepai: 'deepai',
    carousel: 'geminiCarousel',
    marketingDescription: 'marketingDescription',
    marketingFeatures: 'marketingFeatures',
    marketingBenefits: 'marketingBenefits',
    showcase: 'showcases',
    canvaTemplate: 'marketingCanvaTemplates',
  };
  return mapping[source] || source;
}

// Função auxiliar para gerar texto de variações
function generateVariationsText(product: Product): string {
  if (!product.variacoes || product.variacoes.length === 0) {
    return '';
  }
  
  const colors = new Set<string>();
  const sizes = new Set<string>();
  
  product.variacoes.forEach(v => {
    if (v.atributos?.cor) colors.add(v.atributos.cor);
    if (v.atributos?.tamanho) sizes.add(v.atributos.tamanho);
  });
  
  const variations: string[] = [];
  if (colors.size > 0) variations.push(`${colors.size} ${colors.size === 1 ? 'Cor' : 'Cores'}`);
  if (sizes.size > 0) variations.push(`${sizes.size} ${sizes.size === 1 ? 'Tamanho' : 'Tamanhos'}`);
  
  if (variations.length > 0) {
    return ` - ${variations.join(' | ')} Disponíveis`;
  }
  
  return ` - ${product.variacoes.length} Variações`;
}

// Função auxiliar para gerar lista detalhada de variações na descrição
function generateVariationsDescription(product: Product): string {
  if (!product.variacoes || product.variacoes.length === 0) {
    return '';
  }
  
  let text = '\n\n📦 VARIAÇÕES DISPONÍVEIS:\n';
  
  product.variacoes.forEach((v, idx) => {
    const attrs = Object.entries(v.atributos || {})
      .map(([key, val]) => `${key.replace(/_/g, ' ')}: ${val}`)
      .join(' | ');
    
    text += `\n• ${attrs || v.nome} - Estoque: ${v.estoque}`;
  });
  
  return text;
}

export async function generatePremium20Ads(
  product: Product,
  seoTitles: string[],
  imagesBySource: Record<string, HostedImage[]>,
  userId: string
): Promise<PremiumAdProduct[]> {
  console.log('\n🎯 [generatePremium20Ads] Iniciando geração de anúncios premium...');
  console.log(`📦 Produto: ${product.nome || 'Sem nome'}`);
  console.log(`📝 Títulos SEO recebidos: ${seoTitles.length} (mínimo recomendado: 40)`);
  if (seoTitles.length < 40) {
    console.warn(`⚠️ [generatePremium20Ads] Apenas ${seoTitles.length} títulos disponíveis. Alguns anúncios usarão títulos reciclados.`);
  }
  if (seoTitles.length > 0) {
    console.log('📝 Primeiros títulos SEO:');
    seoTitles.slice(0, 5).forEach((t, i) => console.log(`   ${i+1}. "${t}"`));
  }
  
  // Log de variações se existirem
  if (product.variacoes && product.variacoes.length > 0) {
    console.log(`🎨 [VARIAÇÕES] Produto com ${product.variacoes.length} variações detectadas`);
  }
  
  try {
    const ads: PremiumAdProduct[] = [];
    
    // ========== CONTROLE DE TÍTULOS E PALAVRAS USADAS (SEM REPETIÇÃO) ==========
    const usedTitles = new Set<string>();
    const usedEnrichmentWords = new Set<string>();
    let sequentialTitleIndex = 0; // Índice sequencial para títulos
    
    // ========== BUSCAR MODELO 1 DO CONFIGURADOR (BANCO DE DADOS) ==========
    console.log('\n' + '='.repeat(80));
    console.log('🎯 [CONFIG] BUSCANDO MODELO PADRÃO DO CONFIGURADOR DE ANÚNCIOS PREMIUM');
    console.log('='.repeat(80));
    console.log(`👤 User ID: ${userId}`);
    
    let adConfigs: AdConfig[] = DEFAULT_AD_CONFIGS;
    let usingCustomConfig = false;
    let modelName = 'DEFAULT_AD_CONFIGS';
    
    try {
      const { data: defaultModel, error: modelError } = await (supabase as any)
        .from('ad_model_configs')
        .select('id, config, name, is_default')
        .eq('user_id', userId)
        .eq('is_default', true)
        .maybeSingle();
      
      console.log('\n📋 [CONFIG] RESULTADO DA QUERY:');
      console.log(`   ├─ Model encontrado: ${defaultModel ? 'SIM' : 'NÃO'}`);
      if (defaultModel) {
        console.log(`   ├─ ID: ${defaultModel.id}`);
        console.log(`   ├─ Nome: ${defaultModel.name}`);
        console.log(`   ├─ is_default: ${defaultModel.is_default}`);
        console.log(`   ├─ Tipo do config: ${typeof defaultModel.config}`);
        console.log(`   └─ Config é array: ${Array.isArray(defaultModel.config)} (length: ${Array.isArray(defaultModel.config) ? defaultModel.config.length : 'N/A'})`);
      }
      if (modelError) {
        console.log(`   └─ ERRO: ${modelError.message}`);
      }
      
      if (modelError) {
        console.error('❌ [CONFIG] Erro ao buscar modelo padrão:', modelError);
        toast.error('Erro ao carregar modelo de anúncios. Usando configuração padrão.');
      } else if (defaultModel?.config) {
        let parsedConfig: AdConfig[];
        
        if (Array.isArray(defaultModel.config)) {
          parsedConfig = defaultModel.config as unknown as AdConfig[];
        } else if (typeof defaultModel.config === 'string') {
          parsedConfig = JSON.parse(defaultModel.config) as AdConfig[];
        } else {
          parsedConfig = (defaultModel.config as unknown as AdConfig[]) || [];
        }
        
        if (parsedConfig.length > 0) {
          const enabledAds = parsedConfig.filter(ad => ad.enabled !== false);
          adConfigs = enabledAds;
          usingCustomConfig = true;
          modelName = defaultModel.name;
          
          console.log('\n✅ [CONFIG] MODELO PERSONALIZADO CARREGADO:');
          console.log(`   ├─ Nome: "${modelName}"`);
          console.log(`   ├─ Anúncios habilitados: ${enabledAds.length}/${parsedConfig.length}`);
          console.log('   └─ PRIMEIROS 5 ANÚNCIOS:');
          
          enabledAds.slice(0, 5).forEach((ad, idx) => {
            const sources = ad.imageSources?.map(s => {
              const qty = s.quantity === 'all' ? 'ALL' : s.quantity;
              return `${s.source}(${qty})`;
            }).join(' + ');
            console.log(`       ${idx + 1}. "${ad.name}": ${sources}`);
          });
          
          if (enabledAds.length > 5) {
            console.log(`       ... e mais ${enabledAds.length - 5} anúncios`);
          }
        } else {
          console.warn('⚠️ [CONFIG] Modelo encontrado mas config está vazia - usando DEFAULT');
          toast.warning('Modelo de anúncios está vazio. Configure no Configurador de Anúncios Premium.');
        }
      } else {
        console.log('\n⚠️ [CONFIG] NENHUM MODELO PADRÃO ENCONTRADO!');
        console.log('   ├─ Verifique se você tem um modelo marcado como "padrão" no Configurador');
        console.log(`   └─ Usando DEFAULT_AD_CONFIGS com ${DEFAULT_AD_CONFIGS.length} anúncios`);
        toast.info('Nenhum modelo padrão encontrado. Configure seu modelo no Configurador de Anúncios Premium.');
      }
    } catch (configError) {
      console.error('❌ [CONFIG] Exceção ao buscar modelo:', configError);
      toast.error('Erro inesperado ao carregar modelo. Usando configuração padrão.');
    }
    
    console.log('\n' + '─'.repeat(80));
    console.log(`📊 [CONFIG FINAL] RESUMO:`);
    console.log(`   ├─ Modelo: ${modelName}`);
    console.log(`   ├─ Custom Config: ${usingCustomConfig ? 'SIM ✅' : 'NÃO ❌'}`);
    console.log(`   └─ Total de anúncios: ${adConfigs.length}`);
    console.log('─'.repeat(80) + '\n');
    
    // ========== RASTREAR IMAGENS USADAS PARA CRIAR EXTRAS ==========
    const usedImageUrls = new Set<string>();
    
    // Gerar combinações de imagens a partir da configuração
    let imageCombinations: HostedImage[][];
    let usedAdConfigs: AdConfig[]; // ✅ Configs correspondentes às combinações geradas
    
    if (usingCustomConfig) {
      const result = generateImageCombinationsFromConfig(imagesBySource, adConfigs, usedImageUrls);
      imageCombinations = result.combinations;
      usedAdConfigs = result.usedConfigs;
      console.log(`📊 [CONFIG CUSTOM] ${imageCombinations.length} combinações geradas de ${adConfigs.filter(c => c.enabled).length} configs habilitadas`);
    } else {
      imageCombinations = generateImageCombinations(imagesBySource);
      usedAdConfigs = adConfigs.slice(0, imageCombinations.length); // Fallback
      // Popular usedImageUrls
      imageCombinations.forEach(combo => {
        combo.forEach(img => usedImageUrls.add(img.url));
      });
    }
    
    // Buscar descrição complementar formatada (Tópicos de Conversão sem emojis)
    console.log('📝 [TOPICS] Buscando tópicos de conversão do banco...');
    const baseComplementaryDescription = await fetchFormattedConversionTopics(product.id, userId);
    console.log(`📝 [TOPICS] Descrição base obtida: ${baseComplementaryDescription ? 'SIM' : 'NÃO'} (${baseComplementaryDescription.length} chars)`);
    
    // Verificar se há imagens KIT suficientes e informar o usuário
    const kitImagesCount = imagesBySource.kitImages?.length || 0;
    if (kitImagesCount < 7) {
      console.log(`⚠️ Apenas ${kitImagesCount} imagens do Gerador de KIT encontradas (mínimo: 7). Anúncios KIT serão gerados como anúncios normais.`);
    } else {
      console.log(`✅ ${kitImagesCount} imagens do Gerador de KIT encontradas. Anúncios KIT serão gerados corretamente.`);
    }
    
    // Definir quantidades de KIT
    const kitQuantities = [2, 4, 6, 8, 10, 20, 30];
    
    // Número de anúncios baseado nas combinações geradas (já correspondem aos configs)
    const totalAdsToGenerate = imageCombinations.length;
    console.log(`🔢 [CONFIG] Gerando ${totalAdsToGenerate} anúncios (baseado nas combinações com imagens)`);
    
    for (let i = 0; i < totalAdsToGenerate; i++) {
      // ✅ USAR usedAdConfigs para manter correspondência correta
      const currentAdConfig = usedAdConfigs[i];
      const isKit = currentAdConfig?.name?.toLowerCase().includes('kit') || false;
      const adNumber = i + 1;
      const titleIndex = i % seoTitles.length; // Usar todos os 40 títulos disponíveis
      
      let rawTitle: string;
      
      // Fallback se não houver títulos SEO
      if (titleIndex >= seoTitles.length) {
        console.warn(`⚠️ [Ad ${adNumber}] Sem título SEO (index ${titleIndex}), usando nome do produto`);
        rawTitle = product.nome || `Produto ${adNumber}`;
      } else {
        rawTitle = seoTitles[titleIndex];
      }
      
      console.log(`📝 [Ad ${adNumber}] Título bruto (index ${titleIndex}): "${rawTitle}"`);
      
      let baseTitle = rawTitle
        .replace(/^🎯.*?:\s*/g, '')
        .replace(/^📝.*?:\s*/g, '')
        .replace(/^\*\*.*?\*\*:\s*/g, '')
        .trim();
      
      // Aplicar enriquecimento com palavras de percepção de valor (6 categorias) - SEM REPETIÇÃO
      const enrichResult = enrichTitleWithValueWords(baseTitle, i, usedEnrichmentWords);
      let finalTitle = enrichResult.enrichedTitle;
      if (enrichResult.wordUsed) {
        usedEnrichmentWords.add(enrichResult.wordUsed.toLowerCase());
      }
      
      // REMOVIDO: Não adicionar texto de variações ao título do anúncio
      // As variações são exibidas apenas na descrição (generateVariationsDescription)
      // const variationsText = generateVariationsText(product);
      // if (variationsText && finalTitle.length + variationsText.length <= 200) {
      //   finalTitle += variationsText;
      // }
      
      console.log(`✂️ [Ad ${adNumber}] Título final: "${finalTitle}"`);
      
      // ✅ CONTROLE DE TÍTULOS USADOS - Evitar repetição
      const normalizedTitle = finalTitle.toLowerCase().trim();
      if (usedTitles.has(normalizedTitle)) {
        // Título já usado, adicionar sufixo de variação
        const variation = ` - Variação ${usedTitles.size + 1}`;
        finalTitle = clipTitle(finalTitle + variation, 150);
        console.log(`♻️ [Ad ${adNumber}] Título repetido, adicionando variação: "${finalTitle}"`);
      }
      usedTitles.add(finalTitle.toLowerCase().trim());
      
      // Usar descrição complementar dos Tópicos de Conversão (sem emojis)
      let finalDescription = baseComplementaryDescription || product.descricao_curta || product.descricao || '';
      
      // Adicionar lista de variações à descrição
      const variationsDesc = generateVariationsDescription(product);
      if (variationsDesc) {
        finalDescription += variationsDesc;
      }
      
      let finalSku = i === 0 ? product.sku : `${product.sku}-IA${i}`;
      
      // Se for anúncio de KIT, ajustar título, descrição e SKU
      if (isKit) {
        const kitIndex = i - 10;
        const kitQuantity = kitQuantities[kitIndex];
        finalSku = `${product.sku}-KIT${kitQuantity}`;
        
        // Adicionar prefixo KIT se ainda não tiver
        if (!finalTitle.toUpperCase().startsWith('KIT')) {
          finalTitle = `KIT COM ${kitQuantity} UNIDADES - ${finalTitle}`;
          // Para KIT, adicionar prefixo na descrição também
          if (finalDescription) {
            finalDescription = `KIT COM ${kitQuantity} UNIDADES - ${finalDescription}`;
          }
          console.log(`🎁 [Ad ${adNumber}] Aplicado prefixo KIT: "${finalTitle}"`);
        }
      }
      
      console.log(`✅ [Ad ${adNumber}] Título final: "${finalTitle}"`);

      // Enforce 150 chars max for title
      finalTitle = clipTitle(finalTitle, 150);
      
      let imageUrls = imageCombinations[i]?.map(img => img.url) || [];
      
      // 🔄 NOVA LÓGICA: Se anúncio tiver MENOS DE 3 imagens, completar até 10
      // Coletar todas as imagens disponíveis de todas as IAs (priorizando as principais)
      const allAvailableImages = [
        // Prioridade 1: Fundo branco
        ...(imagesBySource.geminiWhite || []),
        ...(imagesBySource.whiteBackground || []),
        ...(imagesBySource.bflWhite || []),
        // Prioridade 2: Backgrounds e principais
        ...(imagesBySource.geminiBackground || []),
        ...(imagesBySource.runware || []),
        ...(imagesBySource.bfl || []),
        // Prioridade 3: Outras IAs
        ...(imagesBySource.runway || []),
        ...(imagesBySource.stability || []),
        ...(imagesBySource.tongyiWanxiang || []),
        ...(imagesBySource.showcase || []),
        ...(imagesBySource.geminiCarousel || []),
        // Prioridade 4: Marketing
        ...(imagesBySource.marketingGemini || []),
        ...(imagesBySource.marketingRunware || []),
        ...(imagesBySource.marketingBfl || []),
      ].filter(img => img?.url);
      
      // ✅ CORREÇÃO: MÍNIMO 10 IMAGENS POR ANÚNCIO (não 3)
      if (imageUrls.length < 10) {
        console.log(`⚠️ [Ad ${adNumber}] Apenas ${imageUrls.length} imagens (< 10), completando até 10...`);
        
        // Primeiro: usar imagens NÃO utilizadas em nenhum outro anúncio (RESPEITANDO ORDEM)
        const availableUnused = allAvailableImages.filter(img => 
          !imageUrls.includes(img.url) && !usedImageUrls.has(img.url)
        );
        
        const neededImages = 10 - imageUrls.length;
        // ✅ Usar slice (mantém ordem) em vez de random
        const additionalFromUnused = availableUnused.slice(0, neededImages);
        imageUrls = [...imageUrls, ...additionalFromUnused.map(img => img.url)];
        additionalFromUnused.forEach(img => usedImageUrls.add(img.url));
        
        console.log(`✅ [Ad ${adNumber}] Adicionadas ${additionalFromUnused.length} imagens não usadas. Total: ${imageUrls.length}`);
        
        // Se ainda tiver menos de 10, reutilizar imagens já usadas (SEM repetir no mesmo anúncio)
        if (imageUrls.length < 10) {
          const stillNeeded = 10 - imageUrls.length;
          const reusableImages = allAvailableImages
            .filter(img => !imageUrls.includes(img.url)) // Não repetir dentro do anúncio
            .slice(0, stillNeeded);
          imageUrls = [...imageUrls, ...reusableImages.map(img => img.url)];
          console.log(`♻️ [Ad ${adNumber}] Reutilizadas ${reusableImages.length} imagens para completar 10. Total: ${imageUrls.length}`);
        }
      }
      
      const ad: PremiumAdProduct = {
        nome: finalTitle,
        sku: finalSku,
        descricao: finalDescription,
        descricao_curta: finalDescription,
        preco: product.preco,
        categoria: product.categoria,
        marca: product.marca,
        gtin: product.gtin,
        peso_bruto: product.peso_bruto,
        largura: product.largura,
        altura: product.altura,
        profundidade: product.profundidade,
        unidade: product.unidade,
        situacao: product.situacao,
        estoque: product.estoque,
        kitQuantity: isKit ? kitQuantities[i - 10] : undefined,
        imageUrls
      };
      
      ads.push(ad);
    }
    
    console.log(`✅ Gerados ${ads.length} anúncios premium para ${product.nome}`);
    
    // ========== CRIAR ANÚNCIOS EXTRAS COM IMAGENS NÃO UTILIZADAS ==========
    console.log('\n📸 [EXTRAS] Verificando imagens não utilizadas...');
    
    // Coletar TODAS as imagens disponíveis
    const allImages: HostedImage[] = [];
    Object.values(imagesBySource).forEach(arr => {
      if (Array.isArray(arr)) {
        arr.forEach(img => {
          if (img?.url && !allImages.find(existing => existing.url === img.url)) {
            allImages.push(img);
          }
        });
      }
    });
    
    // Identificar imagens NÃO utilizadas
    const unusedImages = allImages.filter(img => !usedImageUrls.has(img.url));
    console.log(`📸 [EXTRAS] ${unusedImages.length} imagens não utilizadas de ${allImages.length} totais`);
    
    // ✅ CORREÇÃO: Usar TODAS as imagens restantes (sem mínimo de 6)
    if (unusedImages.length > 0) {
      // ✅ CORREÇÃO: MANTER ORDEM (uploaded_at DESC) - não aleatorizar
      const chunksOf10: HostedImage[][] = [];
      
      // Coletar TODAS as imagens disponíveis para completar o último chunk
      const allImages: HostedImage[] = [];
      Object.values(imagesBySource).forEach(arr => {
        if (Array.isArray(arr)) {
          arr.forEach(img => {
            if (img?.url && !allImages.find(existing => existing.url === img.url)) {
              allImages.push(img);
            }
          });
        }
      });
      
      for (let i = 0; i < unusedImages.length; i += 10) {
        const chunk = unusedImages.slice(i, i + 10);
        
        // ✅ CORREÇÃO: Se último chunk tiver < 10 imagens, completar com imagens já usadas
        if (chunk.length < 10) {
          const stillNeeded = 10 - chunk.length;
          const chunkUrls = new Set(chunk.map(img => img.url));
          const reusableImages = allImages
            .filter(img => !chunkUrls.has(img.url)) // Não repetir dentro do anúncio
            .slice(0, stillNeeded);
          chunk.push(...reusableImages);
          console.log(`♻️ [EXTRAS] Último chunk completado com ${reusableImages.length} imagens reutilizadas. Total: ${chunk.length}`);
        }
        
        chunksOf10.push(chunk);
      }
      
      console.log(`🎁 [EXTRAS] Criando ${chunksOf10.length} anúncio(s) extra(s) com ${unusedImages.length} imagens não usadas`);
      
      // Gerar anúncios extras
      for (let j = 0; j < chunksOf10.length; j++) {
        const extraIndex = ads.length;
        const titleIndex = extraIndex % seoTitles.length;
        const extraEnrichResult = enrichTitleWithValueWords(
          seoTitles[titleIndex] || product.nome || 'Produto Extra',
          extraIndex,
          usedEnrichmentWords
        );
        let extraTitle = extraEnrichResult.enrichedTitle;
        if (extraEnrichResult.wordUsed) {
          usedEnrichmentWords.add(extraEnrichResult.wordUsed.toLowerCase());
        }
        
        // Evitar título repetido nos extras
        const normalizedExtraTitle = extraTitle.toLowerCase().trim();
        if (usedTitles.has(normalizedExtraTitle)) {
          extraTitle = clipTitle(extraTitle + ` - Extra ${j + 1}`, 150);
        }
        usedTitles.add(extraTitle.toLowerCase().trim());
        
        // Marcar imagens como usadas
        chunksOf10[j].forEach(img => usedImageUrls.add(img.url));
        
        const extraAd: PremiumAdProduct = {
          nome: clipTitle(extraTitle, 150),
          sku: `${product.sku}-EXTRA${j + 1}`,
          descricao: baseComplementaryDescription || product.descricao || '',
          descricao_curta: product.descricao_curta || '',
          preco: product.preco,
          categoria: product.categoria,
          marca: product.marca,
          gtin: product.gtin,
          peso_bruto: product.peso_bruto,
          largura: product.largura,
          altura: product.altura,
          profundidade: product.profundidade,
          unidade: product.unidade,
          situacao: product.situacao,
          estoque: product.estoque,
          imageUrls: chunksOf10[j].map(img => img.url)
        };
        
        ads.push(extraAd);
        console.log(`✅ [EXTRA ${j + 1}] ${chunksOf10[j].length} imagens: ${extraTitle.substring(0, 50)}...`);
      }
      
      toast.success(`🎁 ${chunksOf10.length} anúncio(s) extra(s) criado(s) com imagens restantes!`, {
        duration: 5000
      });
    } else {
      console.log(`✅ [EXTRAS] Todas as imagens já foram utilizadas nos anúncios`);
    }
    
    // ✅ LOG DE USO DE IMAGENS - GARANTIR 100%
    const usagePercentage = ((usedImageUrls.size / allImages.length) * 100).toFixed(1);
    console.log(`📊 [USO DE IMAGENS] ${usedImageUrls.size}/${allImages.length} = ${usagePercentage}% utilizadas`);
    
    if (usedImageUrls.size < allImages.length) {
      console.warn(`⚠️ [ALERTA] ${allImages.length - usedImageUrls.size} imagens não foram utilizadas!`);
    }
    
    // ========== VALIDAÇÃO FINAL AUTOMÁTICA ==========
    console.log('\n' + '='.repeat(80));
    console.log('🔍 VALIDAÇÃO FINAL DOS ANÚNCIOS GERADOS');
    console.log('='.repeat(80));
    
    let validationIssues = 0;
    const imageUsageByAd: Map<string, number[]> = new Map();
    
    ads.forEach((ad, idx) => {
      const adNumber = idx + 1;
      const imageCount = ad.imageUrls.length;
      
      // Rastrear uso de imagens entre anúncios
      ad.imageUrls.forEach(url => {
        if (!imageUsageByAd.has(url)) {
          imageUsageByAd.set(url, []);
        }
        imageUsageByAd.get(url)!.push(adNumber);
      });
      
      // Verificar se tem exatamente 10 imagens
      if (imageCount !== 10) {
        console.warn(`⚠️ [VALIDAÇÃO] Anúncio ${adNumber} "${ad.nome.substring(0, 30)}...": ${imageCount} imagens (esperado: 10)`);
        validationIssues++;
      }
      
      // Verificar duplicatas dentro do mesmo anúncio
      const uniqueUrls = new Set(ad.imageUrls);
      if (uniqueUrls.size !== ad.imageUrls.length) {
        console.error(`❌ [VALIDAÇÃO] Anúncio ${adNumber}: ${ad.imageUrls.length - uniqueUrls.size} imagens DUPLICADAS dentro do anúncio!`);
        validationIssues++;
      }
    });
    
    // Verificar repetição entre anúncios (exceto últimos)
    const repeatedImages = Array.from(imageUsageByAd.entries())
      .filter(([_, adsUsing]) => adsUsing.length > 1);
    
    if (repeatedImages.length > 0) {
      // Verificar se repetições são apenas nos últimos anúncios (aceitável)
      const lastAdIndex = ads.length;
      const problematicRepeats = repeatedImages.filter(([_, adsUsing]) => {
        // Problema apenas se algum dos anúncios NÃO é um dos últimos 2
        return adsUsing.some(adNum => adNum < lastAdIndex - 1);
      });
      
      if (problematicRepeats.length > 0) {
        console.warn(`⚠️ [VALIDAÇÃO] ${problematicRepeats.length} imagens repetidas entre anúncios (não nos últimos)`);
        problematicRepeats.slice(0, 3).forEach(([url, adsUsing]) => {
          console.warn(`   └─ URL ${url.substring(0, 50)}... usada em anúncios: ${adsUsing.join(', ')}`);
        });
      } else {
        console.log(`ℹ️ [VALIDAÇÃO] ${repeatedImages.length} imagens repetidas (apenas nos últimos anúncios - OK)`);
      }
    }
    
    // Resumo final
    console.log('\n─'.repeat(80));
    console.log('📊 RESUMO DA VALIDAÇÃO:');
    console.log(`   ├─ Total de anúncios: ${ads.length}`);
    console.log(`   ├─ Anúncios com 10 imagens: ${ads.filter(a => a.imageUrls.length === 10).length}`);
    console.log(`   ├─ Anúncios com menos de 10: ${ads.filter(a => a.imageUrls.length < 10).length}`);
    console.log(`   ├─ Imagens únicas utilizadas: ${usedImageUrls.size}`);
    console.log(`   ├─ Imagens repetidas entre anúncios: ${repeatedImages.length}`);
    console.log(`   └─ Issues encontradas: ${validationIssues}`);
    console.log('─'.repeat(80) + '\n');
    
    if (validationIssues > 0) {
      toast.warning(`⚠️ ${validationIssues} problema(s) encontrado(s) na validação. Verifique o console.`, {
        duration: 6000
      });
    }
    
    console.log(`✅ Total final: ${ads.length} anúncios premium gerados`);
    return ads;
    
  } catch (error) {
    console.error('❌ Erro ao gerar anúncios premium:', error);
    toast.error(`Erro ao gerar anúncios: ${error.message}`);
    throw error;
  }
}