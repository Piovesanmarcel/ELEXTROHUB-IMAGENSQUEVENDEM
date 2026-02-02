import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-worker-key',
};

// URL da imagem de referência de placeholder (o que deve ser REMOVIDO/SUBSTITUÍDO)
const PLACEHOLDER_REFERENCE_URL = "https://bpqtzydsxmjazdzzcvno.supabase.co/storage/v1/object/public/marketing-templates/placeholder-reference-1763672366451.png";

// Helper para converter URLs de imagens em Base64 (requisito da API do Google)
// Também aceita base64 inline (data:image/...) que já vem do frontend
async function urlToBase64(url: string): Promise<string> {
  // Se já é base64 (data URL), extrair apenas a parte base64
  if (url.startsWith('data:')) {
    const base64Match = url.match(/^data:image\/[^;]+;base64,(.+)$/);
    if (base64Match && base64Match[1]) {
      console.log('[urlToBase64] Imagem já é base64 inline, extraindo...');
      return base64Match[1];
    }
    throw new Error('Formato base64 inválido');
  }

  // URL http(s) - fazer fetch e converter
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha ao baixar imagem: ${url}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // Processar em chunks para evitar "Maximum call stack size exceeded"
  const chunkSize = 8192;
  let binary = '';

  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  const base64 = btoa(binary);
  return base64;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 🔐 Verificar chave interna do worker - BLOQUEAR CHAMADAS DIRETAS
  const internalKey = req.headers.get('x-internal-worker-key');
  const expectedKey = Deno.env.get('INTERNAL_WORKER_SECRET');

  if (internalKey !== expectedKey) {
    console.log('❌ [MARKETING] Acesso negado - use a fila de geração');
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Acesso negado. Use a fila de geração assíncrona.',
        code: 'USE_QUEUE'
      }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('✅ [MARKETING] Acesso autorizado via worker');

  try {
    const { templateId, productData, apiKeyId, promptMode = 'complete' } = await req.json();

    console.log('[generate-marketing-image] Recebendo requisição:', {
      templateId,
      hasProductData: !!productData,
      productName: productData?.productName,
      imageCount: productData?.aiImages?.length || 0,
      galleryImagesCount: productData?.selectedGalleryImages?.length || 0,
      logoUrl: productData?.logoUrl || 'SEM LOGO',
      apiKeyId: apiKeyId || 'default',
      promptMode: promptMode, // 🆕 Log do modo de prompt
    });

    // Validações
    if (!templateId || !productData) {
      throw new Error('templateId e productData são obrigatórios');
    }

    // Verificar se há imagens (da galeria ou aiImages)
    const hasImages = (productData.selectedGalleryImages && productData.selectedGalleryImages.length > 0) ||
      (productData.aiImages && productData.aiImages.length > 0);

    if (!hasImages) {
      throw new Error('Nenhuma imagem de produto disponível');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 🔑 Determinar qual API key usar
    let GOOGLE_GEMINI_API_KEY: string | undefined;

    if (apiKeyId && apiKeyId !== 'default') {
      // Buscar key do usuário no banco
      console.log('[generate-marketing-image] Buscando API key do usuário:', apiKeyId);

      const { data: keyData, error: keyError } = await supabaseClient
        .from('user_api_keys')
        .select('api_key_encrypted')
        .eq('id', apiKeyId)
        .eq('provider', 'gemini')
        .single();

      if (keyError || !keyData) {
        console.error('[generate-marketing-image] API Key não encontrada:', keyError);
        throw new Error('API Key selecionada não encontrada');
      }

      // Descriptografar
      try {
        GOOGLE_GEMINI_API_KEY = atob(keyData.api_key_encrypted);
        console.log('[generate-marketing-image] Usando API key do usuário');
      } catch {
        throw new Error('Erro ao descriptografar API key');
      }
    } else {
      // Usar key padrão do sistema
      GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
      console.log('[generate-marketing-image] Usando API key padrão do sistema');
    }

    if (!GOOGLE_GEMINI_API_KEY) {
      throw new Error('GOOGLE_GEMINI_API_KEY não configurada');
    }

    // Buscar template do banco
    console.log('[generate-marketing-image] Buscando template:', templateId);
    const { data: template, error: templateError } = await supabaseClient
      .from('marketing_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      throw new Error(`Template não encontrado: ${templateId}`);
    }

    // Contar zonas de produto para instruir múltiplas imagens
    const zones = template.zones as any[];
    const productZones = zones.filter(zone =>
      zone.type === 'image' && zone.dataSource === 'product.image'
    );
    const productZonesCount = productZones.length;

    console.log('[generate-marketing-image] Template encontrado:', {
      name: template.name,
      dimensions: template.dimensions,
      zonesCount: zones.length,
      productZonesCount: productZonesCount,
      productImagesProvided: 0, // Will be updated later
      needsImageGeneration: false // Will be updated later
    });

    // Construir prompt detalhado para o Gemini
    const dimensions = template.dimensions as { width: number; height: number };

    // 🎯 MODO COMPLETO FIEL: Gerar descrições das zonas COM posição e estilo (formato compacto)
    // Isso permite que o Gemini posicione elementos exatamente onde estão no template
    let zoneDescriptionsComplete = zones.map((zone) => {
      const pos = zone.position as { x: number; y: number; width: number; height: number } | undefined;
      const style = zone.style as {
        fontSize?: string; fontWeight?: string; fontFamily?: string;
        color?: string; backgroundColor?: string; borderRadius?: string;
        textAlign?: string;
      } | undefined;

      // Formatar posição de forma compacta: [x,y wxh]
      const posInfo = pos ? `[${pos.x},${pos.y} ${pos.width}x${pos.height}]` : '';

      // Formatar estilo de forma compacta (apenas valores relevantes)
      const styleInfo = style ? [
        style.fontSize,
        style.fontWeight,
        style.fontFamily && style.fontFamily !== 'inherit' ? style.fontFamily : '',
        style.color,
        style.backgroundColor && style.backgroundColor !== 'transparent' ? `bg:${style.backgroundColor}` : '',
        style.borderRadius && style.borderRadius !== '0px' ? `radius:${style.borderRadius}` : '',
        style.textAlign && style.textAlign !== 'left' ? `align:${style.textAlign}` : ''
      ].filter(Boolean).join(' ') : '';

      if (zone.type === 'image') {
        if (zone.dataSource === 'product.image') {
          const zoneIndex = productZones.findIndex(z => z.id === zone.id);
          const imageNum = zoneIndex + 1;
          return `IMAGEM-PRODUTO ${posInfo}: Inserir imagem ${imageNum} do produto`;
        } else if (zone.dataSource === 'brand.logo') {
          return productData.logoUrl ? `LOGO ${posInfo}: Inserir logo da marca` : '';
        }
      } else if (zone.type === 'text') {
        let textContent = '';
        let textType = '';

        if (zone.dataSource === 'product.name') {
          textContent = productData.productName || productData.unifiedData?.name || '';
          textType = 'NOME';
        } else if (zone.dataSource === 'ai.benefit') {
          textContent = productData.unifiedData?.benefits?.[0] || '';
          textType = 'BENEFICIO';
        } else if (zone.dataSource === 'ai.callToAction') {
          textContent = productData.unifiedData?.callToAction || 'Garanta o Seu';
          textType = 'CTA';
        } else if (zone.dataSource === 'ai.description') {
          textContent = productData.unifiedData?.description || productData.unifiedData?.shortDescription || '';
          textType = 'DESCRICAO';
        } else if (zone.dataSource === 'ai.title' || zone.dataSource === 'ai.headline') {
          textContent = productData.unifiedData?.headline || '';
          textType = 'TITULO';
        } else {
          textType = 'TEXTO';
        }

        const content = textContent || `Criar texto sobre ${productData.productName}`;
        return `${textType} ${posInfo} ${styleInfo}: "${content}"`;
      } else if (zone.type === 'badge') {
        const badgeText = zone.dataSource === 'static.discount' ? '50% OFF' :
          zone.dataSource?.includes('static:') ? zone.dataSource.replace('static:', '') : 'DESTAQUE';
        return `BADGE ${posInfo} ${styleInfo}: "${badgeText}"`;
      }

      return '';
    }).filter(desc => desc !== '').join('\n');

    // ⚡ MODO REDUZIDO: Descrições SEM posição e estilo, apenas conteúdo simples
    // A IA vai interpretar visualmente o template para posicionar os elementos
    let zoneDescriptionsReduced = zones.map((zone) => {
      if (zone.type === 'image') {
        if (zone.dataSource === 'product.image') {
          const zoneIndex = productZones.findIndex(z => z.id === zone.id);
          return `Inserir imagem ${zoneIndex + 1} do produto`;
        } else if (zone.dataSource === 'brand.logo') {
          return productData.logoUrl ? `Inserir logo da marca` : '';
        }
      } else if (zone.type === 'text') {
        let textContent = '';

        if (zone.dataSource === 'product.name') {
          textContent = productData.productName || '';
        } else if (zone.dataSource === 'ai.benefit') {
          textContent = productData.unifiedData?.benefits?.[0] || '';
        } else if (zone.dataSource === 'ai.callToAction') {
          textContent = productData.unifiedData?.callToAction || 'Garanta o Seu';
        } else if (zone.dataSource === 'ai.description') {
          textContent = productData.unifiedData?.description || '';
        } else if (zone.dataSource === 'ai.title' || zone.dataSource === 'ai.headline') {
          textContent = productData.unifiedData?.headline || '';
        }

        return textContent ? `Texto: "${textContent}"` : '';
      } else if (zone.type === 'badge') {
        const badgeText = zone.dataSource === 'static.discount' ? '50% OFF' :
          zone.dataSource?.includes('static:') ? zone.dataSource.replace('static:', '') : 'DESTAQUE';
        return `Badge: "${badgeText}"`;
      }

      return '';
    }).filter(desc => desc !== '').join('\n');

    // 🔥 MODO MINIMALISTA: Apenas uma linha resumindo os elementos
    const hasLogo = productData.logoUrl ? true : false;
    const hasBadge = zones.some((z: any) => z.type === 'badge');
    const textCount = zones.filter((z: any) => z.type === 'text').length;
    const elementsMinimal = [
      productZonesCount > 0 ? `${productZonesCount} foto(s) do produto` : '',
      hasLogo ? 'logo da marca' : '',
      textCount > 0 ? `${textCount} texto(s) sobre ${productData.productName}` : '',
      hasBadge ? 'badge promocional' : ''
    ].filter(Boolean).join(', ');
    const zoneDescriptionsMinimal = `Inserir: ${elementsMinimal}`;

    // 📌 Selecionar versão baseado no modo
    const zoneDescriptions = promptMode === 'complete'
      ? zoneDescriptionsComplete
      : promptMode === 'reduced'
        ? zoneDescriptionsReduced
        : zoneDescriptionsMinimal;

    console.log('[generate-marketing-image] Modo de prompt:', promptMode, '| Tamanho zoneDescriptions:', zoneDescriptions.length);

    const colorSchemeDesc = template.color_scheme
      ? `Esquema de cores: primária ${(template.color_scheme as any).primary}, secundária ${(template.color_scheme as any).secondary}, acento ${(template.color_scheme as any).accent}, fundo ${(template.color_scheme as any).background}`
      : 'Usar cores vibrantes e profissionais';

    // Preparar informações completas do produto
    const productDetails = `
PRODUTO: ${productData.productName}
${productData.unifiedData?.description ? `DESCRICAO: ${productData.unifiedData.description}` : ''}
${productData.unifiedData?.benefits?.length ? `BENEFICIOS: ${productData.unifiedData.benefits.join(', ')}` : ''}
${productData.unifiedData?.targetAudience ? `PUBLICO-ALVO: ${productData.unifiedData.targetAudience}` : ''}
${productData.unifiedData?.callToAction ? `CTA: ${productData.unifiedData.callToAction}` : ''}
${productData.logoUrl ? `LOGO DA MARCA: ✅ INCLUIDA - Posicione no canto superior direito ou na zona definida para logo` : 'LOGO DA MARCA: ⏭️ Não disponível'}`;

    // Preparar array de imagens do produto (máximo 3 para não sobrecarregar a API)
    const sourceImages = productData.selectedGalleryImages && productData.selectedGalleryImages.length > 0
      ? productData.selectedGalleryImages
      : productData.aiImages;

    console.log('[generate-marketing-image] Fonte de imagens:', {
      tipo: productData.selectedGalleryImages?.length > 0 ? 'Galeria' : 'AI Images',
      quantidade: sourceImages.length
    });

    // Selecionar as 2 melhores imagens (por tamanho/qualidade) para dar contexto visual
    // Priorizar imagens de melhor qualidade (maior tamanho = melhor resolução)
    const sortedImages = await Promise.all(
      sourceImages.slice(0, 5).map(async (url: string) => {
        try {
          // Para base64, estimar tamanho pelo comprimento da string
          if (url.startsWith('data:')) {
            const size = url.length * 0.75; // Base64 é ~75% do tamanho real
            return { url, size };
          }
          // Para URLs, fazer HEAD request
          const response = await fetch(url, { method: 'HEAD' });
          const size = parseInt(response.headers.get('content-length') || '0');
          return { url, size };
        } catch {
          return { url, size: 0 };
        }
      })
    );

    // Pegar as 2 melhores imagens (maior = melhor qualidade)
    const productImages: string[] = sortedImages
      .sort((a, b) => b.size - a.size)
      .slice(0, 2)
      .map(img => img.url);

    console.log('[generate-marketing-image] Total de imagens preparadas:', productImages.length);
    console.log('[generate-marketing-image] Análise de zonas:', {
      productZonesCount,
      productImagesProvided: productImages.length,
      needsImageGeneration: productZonesCount > productImages.length
    });

    // Prompt otimizado e reduzido - mantém funcionalidade essencial
    const prompt = `GERE IMAGEM DE MARKETING PROFISSIONAL

📐 DIMENSOES: ${dimensions.width}x${dimensions.height}px

📦 PRODUTO: ${productData.productName}
${productData.unifiedData?.description ? `Descricao: ${productData.unifiedData.description}` : ''}
${productData.unifiedData?.benefits?.length ? `Beneficios: ${productData.unifiedData.benefits.slice(0, 3).join(', ')}` : ''}
${productData.unifiedData?.callToAction ? `CTA: ${productData.unifiedData.callToAction}` : ''}
${productData.logoUrl ? `LOGO: Inclua no canto superior direito` : ''}

🖼️ IMAGENS RECEBIDAS (ordem):
1. Referencia de remocao - APENAS para identificar o que remover, JAMAIS use no resultado
2. Template base - REPLIQUE este layout
3. Placeholder (contexto)
4. ${productImages.length} imagens do produto - USE ESTAS no resultado

⚠️ REGRAS CRITICAS:
• JAMAIS use a primeira imagem (referencia/colinas verdes) no resultado final
• REMOVA COMPLETAMENTE todos os produtos/placeholders do template ANTES de inserir novos
• Use APENAS as ultimas ${productImages.length} imagens (produto do usuario)
• Textos devem ser REAIS sobre "${productData.productName}", nunca placeholders
• Sem acentos nos textos (use a, e, i, o, u)

📋 PROCESSO OBRIGATORIO (4 FASES):

FASE 0 - ESCANEAR: Identifique e CONTE todos os produtos/placeholders no template
FASE 1 - DETECTAR: Localize posicao exata de cada produto encontrado  
FASE 2 - REMOVER: Limpe COMPLETAMENTE cada area (transparente ou cor do fundo)
FASE 3 - INSERIR: Coloque produto do usuario nas areas limpas

${productZonesCount > 1 ? `
📸 MULTIPLAS ZONAS (${productZonesCount}):
• Distribua as ${productImages.length} imagens nas zonas
• Se faltarem imagens, GERE variacoes (angulos/zoom diferentes)
• NAO repita mesma imagem, NAO deixe zonas vazias
` : `
📸 ZONA UNICA:
• Use a melhor imagem do produto
• Remova fundo, centralize na zona
`}

${promptMode === 'complete' ? `🎨 LAYOUT (METADADOS INTERNOS - NAO ESCREVA NA IMAGEM):
${zoneDescriptions}

${colorSchemeDesc}

🎯 ESTILO OBRIGATORIO - COPIE EXATAMENTE DO TEMPLATE:
• CORES: Use EXATAMENTE as mesmas cores do template base (fundos, textos, badges, bordas)
• FONTES: Copie o tamanho, peso e estilo tipografico IDENTICO ao template
• LAYOUT: Mantenha EXATAMENTE a mesma disposicao e proporcao dos elementos
• BORDAS: Replique border-radius, sombras e efeitos visuais do template
• ESPACAMENTO: Mantenha margens e padding IDENTICOS ao template
• O template base e a REFERENCIA VISUAL ABSOLUTA - copie TUDO dele, so mude o produto e textos` : promptMode === 'reduced' ? `🎨 CONTEUDO PARA INSERIR:
${zoneDescriptions}

${colorSchemeDesc}

⚠️ COPIE EXATAMENTE o layout visual do template base
A IA deve INTERPRETAR visualmente as posicoes e estilos do template` : `🎨 CONTEUDO:
${zoneDescriptions}

COPIE o template visualmente, insira conteudo real sobre "${productData.productName}".`}

❌ TEXTOS PROIBIDOS (JAMAIS ESCREVA NA IMAGEM):
PLACEHOLDERS: "INSIRA UM TITULO", "EXEMPLO FICTICIO", "Lorem ipsum", "Texto de exemplo", "Adicione seu texto", "Seu texto aqui", "Titulo aqui"
NOMES TECNICOS: "IMAGEM-PRODUTO", "TEXTO", "BADGE", "CTA", "LOGO", "NOME", "BENEFICIO", "DESCRICAO", "TITULO", "DESTAQUE"
COORDENADAS: Qualquer texto com colchetes "[...]", numeros de posicao como "521,140", dimensoes como "557x792"
ESTILOS: Qualquer texto com "px", "#FFC700", "#333333", "bg:", "radius:", "align:", "800", "bold", "center"
ZONAS: "ZONA 1", "ZONA 2", "ZONA", "Zone", qualquer numero de zona isolado
INSTRUCOES: "Inserir", "Criar texto sobre", "Inserir imagem", "Inserir logo"
COMERCIAIS: "FRETE GRATIS", "FRETE GRÁTIS", "FRETE GR", "GRÁTIS", qualquer valor monetario (R$, $, reais), precos inventados como "29,90", "99,99", "19,90", porcentagens de desconto inventadas

⚠️ Os metadados acima (posicoes, estilos) sao para SEU PROCESSAMENTO INTERNO - NAO sao textos para escrever!

✅ TEXTOS OBRIGATORIOS (escreva SOMENTE estes):
• Nome REAL do produto: "${productData.productName}"
• Beneficios REAIS e ESPECIFICOS do produto
• CTAs criativos: "Garanta o Seu", "Aproveite Agora", "Compre Ja", "Saiba Mais"
• Destaques do produto (qualidade, durabilidade, exclusividade)

📝 VERIFICACAO FINAL (OBRIGATORIA):
• Layout COPIADO IDENTICAMENTE do template? (cores, fontes, espacamentos, bordas)
• Cores EXATAMENTE iguais ao template base? (nao invente cores novas)
• NENHUM texto tecnico aparece na imagem? (ZONA, IMAGEM-PRODUTO, coordenadas, px, #cores, colchetes)
• Todos os textos sao CONTEUDO REAL sobre "${productData.productName}"?
• Produtos antigos do template REMOVIDOS e produto do usuario INSERIDO?
• Imagem de referencia NAO foi usada na composicao final?

SE QUALQUER TEXTO TECNICO, PLACEHOLDER OU IMAGEM DE REFERENCIA APARECER, TRABALHO SERA REJEITADO!
`;

    console.log('[generate-marketing-image] Prompt montado:', prompt.substring(0, 200) + '...');

    // Converter todas as imagens para Base64 (requisito da Google API)
    console.log('[generate-marketing-image] Convertendo imagens para Base64...');

    // 1. Converter imagem de referência de placeholder (para REMOVER)
    console.log('[generate-marketing-image] Convertendo placeholder de referência...');
    const placeholderReferenceBase64 = await urlToBase64(PLACEHOLDER_REFERENCE_URL);

    // 2. Converter template base
    const templateBase64 = template.base_image_url
      ? await urlToBase64(template.base_image_url)
      : null;

    // 3. Placeholder é a mesma imagem base do template
    const placeholderBase64 = templateBase64;

    if (!placeholderBase64) {
      throw new Error('Template base image não disponível');
    }

    // 4. Converter imagens do produto
    const productBase64Array = await Promise.all(
      productImages.map(url => urlToBase64(url))
    );

    console.log('[generate-marketing-image] Conversão concluída:', {
      placeholderReferenceConverted: !!placeholderReferenceBase64,
      templateConverted: !!templateBase64,
      placeholderConverted: !!placeholderBase64,
      productsConverted: productBase64Array.length
    });

    // Montar array de "parts" no formato do Google Gemini API
    const parts: any[] = [
      { text: prompt }
    ];

    // PRIMEIRO: Adicionar imagem de REMOÇÃO (o que NÃO queremos no resultado)
    console.log('[generate-marketing-image] Adicionando imagem de referência para IDENTIFICAÇÃO/REMOÇÃO');
    parts.push({
      text: `⚠️ REFERENCIA DE REMOCAO (NAO USAR NO RESULTADO):`
    });
    parts.push({
      inline_data: {
        mime_type: 'image/png',
        data: placeholderReferenceBase64
      }
    });

    // SEGUNDO: Adicionar imagem base do template (se existir)
    if (templateBase64) {
      console.log('[generate-marketing-image] Adicionando template base');
      parts.push({
        inline_data: {
          mime_type: 'image/png',
          data: templateBase64
        }
      });
    }

    // TERCEIRO: Adicionar placeholder
    console.log('[generate-marketing-image] Adicionando placeholder');
    parts.push({
      inline_data: {
        mime_type: 'image/png',
        data: placeholderBase64
      }
    });

    // QUARTO: Adicionar imagens do produto
    console.log('[generate-marketing-image] Adicionando', productBase64Array.length, 'imagens do produto');
    productBase64Array.forEach((base64, index) => {
      parts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: base64
        }
      });
      console.log(`[generate-marketing-image] Produto ${index + 1} convertido para Base64`);
    });

    // QUINTO: Adicionar logo da marca (se disponível)
    if (productData.logoUrl && productData.logoUrl.startsWith('http')) {
      console.log('[generate-marketing-image] 🏷️ Convertendo LOGO para Base64:', productData.logoUrl);
      try {
        const logoBase64 = await urlToBase64(productData.logoUrl);
        parts.push({
          text: `🏷️ LOGO DA MARCA - INCLUA NO CANTO SUPERIOR DIREITO OU NA ZONA DEFINIDA PARA LOGO:`
        });
        parts.push({
          inline_data: {
            mime_type: 'image/png',
            data: logoBase64
          }
        });
        console.log('[generate-marketing-image] ✅ Logo da marca adicionada ao request');
      } catch (logoErr) {
        console.warn('[generate-marketing-image] ⚠️ Erro ao converter logo:', logoErr);
      }
    } else {
      console.log('[generate-marketing-image] ⏭️ Sem logo URL válida para incluir');
    }

    console.log('[generate-marketing-image] Total de imagens preparadas:', parts.filter(p => p.inline_data).length);

    // Chamar API direta do Google Gemini com retry automático
    console.log('[generate-marketing-image] Chamando Google Gemini API direta...');
    console.log('[generate-marketing-image] Modelo: gemini-3-pro-image-preview');

    const MAX_RETRIES = 3;
    let aiData: any = null;
    let lastError: string | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      console.log(`[generate-marketing-image] Tentativa ${attempt}/${MAX_RETRIES}...`);

      const aiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: parts
            }],
            generationConfig: {
              responseModalities: ['IMAGE'],
              temperature: 0.2,
              topK: 20,
              topP: 0.85
            }
          })
        }
      );

      if (!aiResponse.ok) {
        const errorData = await aiResponse.json().catch(() => ({ error: { message: 'Erro desconhecido' } }));
        console.error('[generate-marketing-image] Erro da Google Gemini API:', {
          status: aiResponse.status,
          error: errorData
        });

        const errorMessage = errorData.error?.message || `HTTP ${aiResponse.status}`;

        // Detectar erro de cota excedida
        const isQuotaExceeded = errorMessage.includes('exceeded your current quota') ||
          errorMessage.includes('Quota exceeded') ||
          errorMessage.includes('RESOURCE_EXHAUSTED') ||
          aiResponse.status === 429;

        if (isQuotaExceeded) {
          console.error('[generate-marketing-image] ⚠️ LIMITE DIÁRIO ATINGIDO - QUOTA EXCEDIDA');
          return new Response(
            JSON.stringify({
              success: false,
              error: 'DAILY_QUOTA_EXCEEDED',
              errorType: 'QUOTA_LIMIT',
              message: 'O limite diário de geração de imagens foi atingido. Tente novamente amanhã.'
            }),
            {
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        throw new Error(`Erro ao gerar imagem com Google Gemini: ${errorMessage}`);
      }

      aiData = await aiResponse.json();
      console.log('[generate-marketing-image] Resposta recebida do Google Gemini');

      // Verificar se é erro de MALFORMED_FUNCTION_CALL
      const finishReason = aiData.candidates?.[0]?.finishReason;
      if (finishReason === 'MALFORMED_FUNCTION_CALL') {
        console.warn(`[generate-marketing-image] ⚠️ MALFORMED_FUNCTION_CALL na tentativa ${attempt}, retrying...`);
        lastError = 'MALFORMED_FUNCTION_CALL';

        // Aguardar antes de tentar novamente (exponential backoff)
        if (attempt < MAX_RETRIES) {
          const waitTime = 1000 * attempt;
          console.log(`[generate-marketing-image] Aguardando ${waitTime}ms antes da próxima tentativa...`);
          await new Promise(r => setTimeout(r, waitTime));
          continue;
        }
      } else {
        // Sucesso ou outro erro - sair do loop
        lastError = null;
        break;
      }
    }

    // Se todas as tentativas falharam com MALFORMED_FUNCTION_CALL
    if (lastError === 'MALFORMED_FUNCTION_CALL') {
      console.error(`[generate-marketing-image] ❌ Falha após ${MAX_RETRIES} tentativas: ${lastError}`);
      throw new Error(`Falha ao gerar imagem após ${MAX_RETRIES} tentativas: modelo retornou MALFORMED_FUNCTION_CALL`);
    }

    // Extrair imagem do formato do Google (inlineData ao invés de image_url)
    const generatedParts = aiData.candidates?.[0]?.content?.parts || [];
    const imagePart = generatedParts.find((part: any) =>
      part.inlineData?.mimeType?.startsWith('image/')
    );

    if (!imagePart?.inlineData?.data) {
      console.error('[generate-marketing-image] Resposta sem imagem:', JSON.stringify(aiData));
      throw new Error('Google Gemini não retornou imagem');
    }

    // Converter Base64 para Data URL
    const imageBase64 = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType || 'image/png';
    const generatedImageUrl = `data:${mimeType};base64,${imageBase64}`;

    console.log('[generate-marketing-image] Imagem gerada com sucesso via Google Gemini API');

    // 📊 Registrar uso na tabela gemini_usage_logs
    try {
      // Buscar nome da API key se foi usada uma key do usuário
      let apiKeyName = 'Sistema (Padrão)';
      if (apiKeyId && apiKeyId !== 'default') {
        const { data: keyInfo } = await supabaseClient
          .from('gemini_api_keys')
          .select('name')
          .eq('id', apiKeyId)
          .single();
        if (keyInfo?.name) {
          apiKeyName = keyInfo.name;
        }
      }

      // Obter user_id do token de autorização
      const authHeader = req.headers.get('authorization');
      let userId: string | null = null;

      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabaseClient.auth.getUser(token);
        userId = user?.id || null;
      }

      if (userId) {
        // Preços OFICIAIS Gemini 3 Pro Image Preview (Fonte: ai.google.dev/pricing)
        // Input: $2.00 per 1M tokens | Output: $12.00 per 1M tokens
        // Imagem gerada: $0.134 por imagem (calculado: 1120 tokens * $120/1M)
        const PRICE_INPUT_PER_M = 2.00;  // Preço oficial input
        const PRICE_PER_IMAGE = 0.134;   // Preço oficial por imagem gerada
        const USD_TO_BRL = 6.10;

        // Estimativa de tokens de prompt (texto + imagens base64)
        const estimatedPromptTokens = 5000;

        const inputCost = (estimatedPromptTokens / 1_000_000) * PRICE_INPUT_PER_M;
        const imageCost = PRICE_PER_IMAGE; // Custo fixo por imagem
        const estimatedCostUSD = inputCost + imageCost;
        const estimatedCostBRL = estimatedCostUSD * USD_TO_BRL;

        await supabaseClient.from('ai_usage_log').insert({
          user_id: userId,
          provider: 'gemini',
          model: 'gemini-3-pro-image-preview',
          operation: 'template_marketing',
          input_tokens: estimatedPromptTokens,
          output_tokens: 0,
          total_tokens: estimatedPromptTokens,
          images_count: 1,
          total_cost: estimatedCostUSD,
          success: true,
          job_id: userId + '-' + Date.now(),
          request_metadata: {
            template: template.name,
            apiKeyName
          }
        });

        console.log('[generate-marketing-image] 📊 Uso registrado no gemini_usage_logs:', {
          source: 'templates',
          apiKeyName,
          estimatedCostBRL: estimatedCostBRL.toFixed(4)
        });
      }
    } catch (logError) {
      console.warn('[generate-marketing-image] ⚠️ Erro ao registrar uso:', logError);
      // Não falhar a requisição por causa do log
    }

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: generatedImageUrl,
        templateName: template.name,
        message: 'Imagem gerada com sucesso usando Google Gemini API direta!'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[generate-marketing-image] Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
