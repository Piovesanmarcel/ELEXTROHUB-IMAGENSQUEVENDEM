import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TemplateConfig } from '@/types/marketing-templates';
import { validateN8NPayload, validatePrerequisites } from '@/lib/validators/n8n-payload-schema';

// Mesma URL de referência usada na edge function
const PLACEHOLDER_REFERENCE_URL = "https://bpqtzydsxmjazdzzcvno.supabase.co/storage/v1/object/public/marketing-templates/placeholder-reference-1763672366451.png";

export interface N8NTemplatePayload {
  request_id: string;
  job_id: string;
  user_id: string;
  timestamp: string;
  source: 'lovable-canva-template-n8n';
  version: '1.0';

  // Prompt completo montado (igual edge function)
  prompt: string;

  // Imagens em base64
  images: {
    reference_base64: string;
    template_base64: string;
    product_images_base64: string[];
    logo_base64?: string;
  };

  // Metadados
  metadata: {
    templateId: string;
    templateName: string;
    productName: string;
    dimensions: { width: number; height: number };
    promptMode: string;
    zones: any[];
  };

  config: {
    quality: 'standard' | 'HD';
    promptMode: 'complete' | 'reduced' | 'minimal';
    incluir_logo: boolean;
  };
}

// Função para montar o prompt - replica linhas 346-435 da edge function
function buildTemplatePrompt(
  template: TemplateConfig,
  product: { name: string; description?: string; benefits?: string[]; callToAction?: string },
  promptMode: 'complete' | 'reduced' | 'minimal',
  incluirLogo: boolean
): string {
  const { dimensions, zones, name: templateName } = template;
  const { name: productName, description, benefits, callToAction } = product;

  // Descrição das zonas do template
  const zoneDescriptions = zones.map((zone, idx) => {
    const pos = zone.position;
    return `- Zona ${idx + 1} (${zone.type}): ${zone.dataSource || zone.id} em posição (${pos.x}, ${pos.y}) tamanho ${pos.width}x${pos.height}`;
  }).join('\n');

  if (promptMode === 'minimal') {
    return `Crie imagem de marketing ${dimensions.width}x${dimensions.height}px para "${productName}".
Use o template como base, substitua placeholders pelo produto das imagens.
${incluirLogo ? 'Inclua logo no canto superior direito.' : ''}`;
  }

  if (promptMode === 'reduced') {
    return `GERE IMAGEM DE MARKETING PROFISSIONAL

📐 DIMENSÕES: ${dimensions.width}x${dimensions.height}px
📦 PRODUTO: ${productName}
${description ? `Descrição: ${description}` : ''}
${benefits?.length ? `Benefícios: ${benefits.slice(0, 3).join(', ')}` : ''}

🖼️ IMAGENS (ordem):
1. Referência de placeholder - REMOVA elementos assim
2. Template base - REPLIQUE este layout
3. Imagens do produto - USE ESTAS
${incluirLogo ? '4. Logo - INCLUA no canto superior direito' : ''}

⚠️ REGRAS:
• REMOVA todos placeholders antes de inserir produto
• Use APENAS imagens do produto fornecidas
• Textos REAIS sobre "${productName}", sem acentos`;
  }

  // Prompt completo (default)
  return `VOCÊ É UM DESIGNER GRÁFICO PROFISSIONAL ESPECIALIZADO EM MARKETING VISUAL.

SUA MISSÃO: Criar uma imagem de marketing PROFISSIONAL e ATRAENTE.

📐 ESPECIFICAÇÕES TÉCNICAS:
- Dimensões EXATAS: ${dimensions.width}x${dimensions.height} pixels
- Template: ${templateName}
- Qualidade: Alta resolução, cores vibrantes

📦 INFORMAÇÕES DO PRODUTO:
- Nome: ${productName}
${description ? `- Descrição: ${description}` : ''}
${benefits?.length ? `- Benefícios principais:\n${benefits.map(b => `  • ${b}`).join('\n')}` : ''}
${callToAction ? `- Call to Action: ${callToAction}` : ''}

🖼️ IMAGENS RECEBIDAS (em ordem):
1. IMAGEM DE REFERÊNCIA - Mostra o tipo de placeholder/produto a ser REMOVIDO
2. TEMPLATE BASE - Layout que DEVE ser replicado EXATAMENTE
3. IMAGENS DO PRODUTO - Fotos do produto que DEVEM ser inseridas
${incluirLogo ? '4. LOGO DA MARCA - Deve aparecer no canto superior direito' : ''}

📋 ZONAS DO TEMPLATE:
${zoneDescriptions}

⚠️ REGRAS CRÍTICAS - SIGA RIGOROSAMENTE:

1. REMOÇÃO DE PLACEHOLDERS:
   - IDENTIFIQUE todos os produtos/placeholders existentes no template
   - REMOVA COMPLETAMENTE cada um deles
   - A área deve ficar LIMPA antes de inserir o novo produto

2. INSERÇÃO DO PRODUTO:
   - Use SOMENTE as imagens do produto fornecidas
   - Posicione nas mesmas áreas onde estavam os placeholders
   - Mantenha proporções adequadas ao espaço

3. PRESERVAÇÃO DO LAYOUT:
   - COPIE EXATAMENTE: cores, fontes, espaçamentos, bordas
   - NÃO altere elementos decorativos do template
   - Mantenha a hierarquia visual original

4. TEXTOS:
   - Use informações REAIS do produto "${productName}"
   - SEM ACENTOS (use a, e, i, o, u simples)
   - CTAs sugeridos: "Garanta o Seu", "Aproveite Agora", "Compre Já"

❌ TEXTOS ABSOLUTAMENTE PROIBIDOS:
- "Product Name", "Nome do Produto", "Produto"
- "XX%", "R$ XX", preços genéricos
- "Lorem ipsum" ou qualquer placeholder
- Coordenadas, nomes de zonas, instruções técnicas

✅ TEXTOS OBRIGATÓRIOS:
- Nome real: "${productName}"
- Benefícios reais do produto
- CTAs criativos e vendedores

🎨 RESULTADO ESPERADO:
Uma imagem de marketing PROFISSIONAL que:
- Pareça criada por um designer experiente
- Destaque o produto de forma atraente
- Mantenha a identidade visual do template
- Converta visualizadores em compradores`;
}

export interface N8NTemplateResponse {
  success: boolean;
  imageUrl?: string;
  mimeType?: string;
  metadata?: {
    template?: string;
    tempo_ms?: number;
  };
  error?: string;
}

type JobStatus = 'idle' | 'sending' | 'processing' | 'completed' | 'failed';

export function useCanvaTemplateN8N() {
  const [webhookUrl, setWebhookUrl] = useState(() => {
    return localStorage.getItem('n8n_canva_webhook_url') || '';
  });
  const [jobStatus, setJobStatus] = useState<JobStatus>('idle');
  const [response, setResponse] = useState<N8NTemplateResponse | null>(null);
  const [processingTime, setProcessingTime] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Buscar sessão do usuário com listener para mudanças
  useEffect(() => {
    let isMounted = true;

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (isMounted) {
        setUserId(session?.user?.id || null);
        setIsLoadingUser(false);
      }
    };

    getSession();

    // Listener para mudanças de auth (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (isMounted) {
        setUserId(session?.user?.id || null);
        setIsLoadingUser(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Salvar webhook URL no localStorage
  useEffect(() => {
    if (webhookUrl) {
      localStorage.setItem('n8n_canva_webhook_url', webhookUrl);
    }
  }, [webhookUrl]);

  // Converter blob para base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Converter imagem URL para base64 - COM LOGS DETALHADOS
  const imageToBase64 = async (url: string): Promise<string> => {
    if (!url) {
      console.log('⚠️ [imageToBase64] URL vazia');
      return '';
    }

    // Já é base64
    if (url.startsWith('data:image')) {
      console.log('✅ [imageToBase64] Já é base64, tamanho:', url.length);
      return url;
    }

    // É blob URL
    if (url.startsWith('blob:')) {
      console.log('🔄 [imageToBase64] Convertendo blob URL...');
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const base64 = await blobToBase64(blob);
        console.log('✅ [imageToBase64] Blob convertido, tamanho:', base64.length);
        return base64;
      } catch (error) {
        console.error('❌ [imageToBase64] Erro ao converter blob:', error);
        throw new Error(`Falha ao converter blob: ${error instanceof Error ? error.message : 'erro desconhecido'}`);
      }
    }

    // É URL HTTP - precisa fazer fetch com tratamento CORS
    if (url.startsWith('http')) {
      const urlPreview = url.substring(0, 80) + (url.length > 80 ? '...' : '');
      console.log('🔄 [imageToBase64] Convertendo URL HTTP:', urlPreview);

      try {
        const response = await fetch(url, {
          mode: 'cors',
          credentials: 'omit',
          headers: {
            'Accept': 'image/*'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        const base64 = await blobToBase64(blob);
        console.log('✅ [imageToBase64] URL convertida, tamanho base64:', base64.length, 'tipo:', blob.type);
        return base64;

      } catch (error) {
        console.error('❌ [imageToBase64] Erro CORS/fetch para URL:', urlPreview, error);

        // Tentar via image-proxy como fallback
        console.log('🔄 [imageToBase64] Tentando via image-proxy...');
        try {
          const { data: proxyData, error: proxyError } = await supabase.functions.invoke('image-proxy', {
            body: { imageUrl: url }
          });

          if (proxyError) {
            throw new Error(`Proxy error: ${proxyError.message}`);
          }

          if (proxyData?.base64) {
            console.log('✅ [imageToBase64] Proxy retornou base64, tamanho:', proxyData.base64.length);
            return proxyData.base64;
          }

          throw new Error('Proxy não retornou base64');
        } catch (proxyErr) {
          console.error('❌ [imageToBase64] Falha no proxy também:', proxyErr);
          throw new Error(`Falha ao converter imagem (CORS + proxy falharam): ${url.substring(0, 50)}...`);
        }
      }
    }

    console.log('⚠️ [imageToBase64] URL não reconhecida, retornando como está:', url.substring(0, 50));
    return url;
  };

  // Gerar template via n8n
  const generateTemplate = useCallback(async (
    template: TemplateConfig,
    product: {
      name: string;
      description?: string;
      benefits?: string[];
      callToAction?: string;
    },
    images: string[],
    config: {
      quality: 'standard' | 'HD';
      promptMode: 'complete' | 'reduced' | 'minimal';
      incluir_logo: boolean;
      logo_url?: string;
    }
  ): Promise<N8NTemplateResponse> => {
    // ========== RETRY: Buscar sessão se userId for null ==========
    let currentUserId = userId;

    if (!currentUserId) {
      console.log('⏳ [Canva-N8N] userId null, tentando buscar sessão...');
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        currentUserId = session.user.id;
        setUserId(currentUserId);
        console.log('✅ [Canva-N8N] Sessão recuperada:', currentUserId);
      }
    }

    // ========== PRÉ-VALIDAÇÃO DE REQUISITOS ==========
    const prereqValidation = validatePrerequisites({
      webhookUrl,
      userId: currentUserId,
      productName: product.name,
      images,
      templateId: template.id,
    });

    if (!prereqValidation.valid) {
      const missingList = prereqValidation.missing.join(', ');
      console.error('❌ [Canva-N8N] Pré-requisitos faltando:', prereqValidation.missing);
      toast.error(`Requisitos faltando: ${missingList}`, {
        description: 'Preencha todos os campos obrigatórios',
        duration: 6000,
      });
      return { success: false, error: `Requisitos faltando: ${missingList}` };
    }

    // Usar currentUserId daqui em diante
    const validatedUserId = currentUserId!;

    setJobStatus('sending');
    setResponse(null);
    const startTime = Date.now();

    try {
      console.log('🚀 [Canva-N8N] Preparando payload completo...');

      // 1. Montar o prompt completo (igual edge function)
      const prompt = buildTemplatePrompt(
        template,
        product,
        config.promptMode,
        config.incluir_logo
      );

      // 2. Converter TODAS as imagens para base64 em paralelo
      const [
        referenceBase64,
        templateBase64,
        ...productImagesBase64
      ] = await Promise.all([
        imageToBase64(PLACEHOLDER_REFERENCE_URL),
        imageToBase64(template.baseImage),
        ...images.slice(0, 5).map(img => imageToBase64(img))
      ]);

      // 3. Converter logo se existir
      let logoBase64: string | undefined;
      if (config.incluir_logo && config.logo_url) {
        logoBase64 = await imageToBase64(config.logo_url);
      }

      // 4. Gerar jobId e registrar na tabela authorized_jobs
      const jobId = `job_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
      console.log('📋 [Canva-N8N] JobId gerado:', jobId);

      // Registrar job na tabela de autorização (CRÍTICO para segurança)
      const { error: authError } = await supabase
        .from('authorized_jobs')
        .insert({
          job_id: jobId,
          user_id: validatedUserId,
          expected_images: 1,
          status: 'active',
          metadata: {
            template_id: template.id,
            template_name: template.name,
            product_name: product.name,
            source: 'canva-template-n8n'
          }
        });

      if (authError) {
        console.error('❌ [Canva-N8N] Erro ao registrar job autorizado:', authError);
        toast.error('Erro ao registrar job. Tente novamente.');
        setJobStatus('failed');
        return { success: false, error: 'Falha ao registrar job autorizado' };
      }
      console.log('✅ [Canva-N8N] Job registrado em authorized_jobs');

      // 5. Montar payload estruturado com jobId e userId
      const payload: N8NTemplatePayload = {
        request_id: crypto.randomUUID(),
        job_id: jobId,
        user_id: validatedUserId,
        timestamp: new Date().toISOString(),
        source: 'lovable-canva-template-n8n',
        version: '1.0',

        prompt,

        images: {
          reference_base64: referenceBase64,
          template_base64: templateBase64,
          product_images_base64: productImagesBase64.filter(Boolean),
          logo_base64: logoBase64,
        },

        metadata: {
          templateId: template.id,
          templateName: template.name,
          productName: product.name,
          dimensions: template.dimensions,
          promptMode: config.promptMode,
          zones: template.zones,
        },

        config: {
          quality: config.quality,
          promptMode: config.promptMode,
          incluir_logo: config.incluir_logo,
        },
      };

      // ========== VALIDAÇÃO COMPLETA DO PAYLOAD ==========
      const validation = validateN8NPayload(payload);

      if (!validation.valid) {
        console.error('❌ [Canva-N8N] Payload inválido:', validation.errors);
        console.error('📋 [Canva-N8N] Detalhes da validação:', validation.details);

        const firstError = validation.errors[0] || 'Erro de validação desconhecido';
        toast.error(`Payload inválido: ${firstError}`, {
          description: `${validation.errors.length} erro(s) encontrado(s). Verifique o console.`,
          duration: 8000,
        });

        setJobStatus('failed');
        return {
          success: false,
          error: `Validação falhou: ${firstError}`,
        };
      }

      console.log('✅ [Canva-N8N] Payload validado com sucesso');

      setJobStatus('processing');

      console.log('📦 [Canva-N8N] Payload preparado:', {
        prompt: `[${prompt.length} chars]`,
        images: {
          reference: referenceBase64?.startsWith('data:image') ? `✅ base64 (${referenceBase64.length} chars)` : '❌ NÃO é base64',
          template: templateBase64?.startsWith('data:image') ? `✅ base64 (${templateBase64.length} chars)` : '❌ NÃO é base64',
          products: productImagesBase64.map((p, i) =>
            p?.startsWith('data:image') ? `✅ produto${i + 1} (${p.length} chars)` : `❌ produto${i + 1} NÃO é base64`
          ),
          logo: logoBase64?.startsWith('data:image') ? `✅ base64 (${logoBase64.length} chars)` : (config.incluir_logo ? '❌ NÃO é base64' : '⏭️ não solicitado'),
        },
        validation: 'PASSED ✅'
      });

      // Chamar via n8n-proxy
      const { data, error } = await supabase.functions.invoke('n8n-proxy', {
        body: {
          webhookUrl,
          payload
        }
      });

      const elapsed = Date.now() - startTime;
      setProcessingTime(elapsed);

      if (error) {
        console.error('❌ [Canva-N8N] Erro do proxy:', error);
        setJobStatus('failed');
        const response = { success: false, error: error.message };
        setResponse(response);
        toast.error(`Erro: ${error.message}`);
        return response;
      }

      console.log('✅ [Canva-N8N] Resposta recebida:', data);

      // Processar resposta do n8n - aceitar imageUrl ou imageBase64 ou imagem
      const imageData = data?.imageUrl || data?.imageBase64 || data?.imagem;

      // ✅ MELHORADO: Aceitar resposta com imagem mesmo sem success explícito
      const hasValidImage = imageData && (
        typeof imageData === 'string' &&
        (imageData.startsWith('data:image') || imageData.startsWith('http') || imageData.startsWith('blob:'))
      );

      if ((data?.success || hasValidImage) && imageData) {
        // Converter base64 para Blob URL se necessário
        let finalImageUrl = imageData;
        if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
          console.log('🔄 [Canva-N8N] Convertendo base64 para Blob URL...');
          try {
            // Extrair dados base64
            const [header, base64Data] = imageData.split(',');
            const mimeMatch = header.match(/data:(image\/[^;]+)/);
            const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';

            // Converter para Blob
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mimeType });

            // Criar Blob URL
            finalImageUrl = URL.createObjectURL(blob);
            console.log('✅ [Canva-N8N] Blob URL criada:', finalImageUrl);
          } catch (convError) {
            console.error('❌ [Canva-N8N] Erro ao converter base64:', convError);
            // Usar base64 como fallback
            finalImageUrl = imageData;
          }
        }

        setJobStatus('completed');
        const response: N8NTemplateResponse = {
          success: true,
          imageUrl: finalImageUrl,
          mimeType: data.mimeType || 'image/png',
          metadata: {
            template: template.id,
            tempo_ms: elapsed,
          }
        };
        setResponse(response);
        toast.success(`Template gerado em ${(elapsed / 1000).toFixed(1)}s!`);
        return response;
      }

      // Tratar resposta sem sucesso
      setJobStatus('failed');
      const errorMsg = data?.error || 'Resposta do n8n não contém imagem válida';
      const response = { success: false, error: errorMsg };
      setResponse(response);
      toast.error(`Erro: ${errorMsg}`);
      return response;

    } catch (error) {
      const elapsed = Date.now() - startTime;
      setProcessingTime(elapsed);
      setJobStatus('failed');

      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ [Canva-N8N] Erro:', errorMsg);

      const response = { success: false, error: errorMsg };
      setResponse(response);
      toast.error(`Erro: ${errorMsg}`);
      return response;
    }
  }, [webhookUrl]);

  const resetState = useCallback(() => {
    setJobStatus('idle');
    setResponse(null);
    setProcessingTime(0);
  }, []);

  return {
    webhookUrl,
    setWebhookUrl,
    jobStatus,
    response,
    processingTime,
    generateTemplate,
    resetState,
    userId,
    isLoadingUser,
  };
}
