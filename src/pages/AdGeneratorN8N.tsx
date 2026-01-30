import { useState, useCallback, useEffect, useRef } from "react";
import { RefreshCw, Sparkles, Rocket, Send, CheckCircle2, Clock, AlertCircle, Loader2, Trash2, Copy, Download, Edit2, Check, X, Image as ImageIcon, ChevronDown, ChevronUp, Plus, Settings2, Eye, User, Wifi, WifiOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ProductFormContent } from "@/components/product/ProductFormContent";
import { ProductDetailsLayout } from "@/components/product/ProductDetailsLayout";
import { SafeErrorBoundary } from "@/components/SafeErrorBoundary";
import { ProductImagesGrid } from "@/components/product/ProductImagesGrid";
import { toast } from "sonner";
import { clearAllImageCaches } from "@/utils/clearAllImageCaches";
import { supabase } from "@/integrations/supabase/client";

type JobStatus = 'idle' | 'sending' | 'processing' | 'completed' | 'failed';

// Tipos para resposta do n8n
interface ImagemGerada {
  tipo: string;
  base64: string;
  descricao?: string;
}

interface TextosGerados {
  titulo_curto?: string;
  titulo_longo?: string;
  descricao_curta?: string;
  descricao_completa?: string;
  bullet_points?: string[];
  hashtags?: string[];
  cta?: string;
}

interface N8NResult {
  imagens_geradas?: ImagemGerada[];
  textos_gerados?: TextosGerados;
  processamento?: {
    tempo_ms?: number;
    modelo_usado?: string;
    creditos_consumidos?: number;
  };
}

interface N8NResponse {
  success: boolean;
  data?: N8NResult;
  error?: string;
  errorCode?: string;
  jobId?: string;
  rawData?: any;
}

// Configurações de geração expandidas
interface GenerationConfig {
  gerar_imagens: boolean;
  gerar_textos: boolean;
  quantidade_imagens: number;
  estilo_texto: 'profissional' | 'casual' | 'tecnico' | 'criativo';
  tipos_imagem: string[];
  // Novas configurações
  idioma: 'pt-BR' | 'en-US' | 'es-ES';
  tom_voz: 'formal' | 'informal' | 'luxo' | 'acessivel';
  incluir_emojis: boolean;
  quantidade_bullets: number;
  cor_fundo: string;
  dimensoes: '1:1' | '4:3' | '16:9' | 'custom';
  qualidade: 'standard' | 'HD' | 'ultra-HD';
}

// Header customizado
interface CustomHeader {
  key: string;
  value: string;
}

// Tipos de imagem disponíveis
const TIPOS_IMAGEM = [
  { id: 'fundo_branco', label: 'Fundo Branco', emoji: '⬜' },
  { id: 'lifestyle', label: 'Lifestyle', emoji: '🏠' },
  { id: 'banner', label: 'Banner Promocional', emoji: '🎯' },
  { id: 'ambientada', label: 'Ambientada', emoji: '🌿' },
  { id: 'pack_kit', label: 'Pack/Kit', emoji: '📦' },
];

export default function AdGeneratorN8N() {
  // Estado do usuário autenticado
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Estado do webhook n8n
  const [webhookUrl, setWebhookUrl] = useState(() => {
    return localStorage.getItem('n8n_webhook_url') || '';
  });

  // Headers customizados
  const [customHeaders, setCustomHeaders] = useState<CustomHeader[]>(() => {
    const saved = localStorage.getItem('n8n_custom_headers');
    return saved ? JSON.parse(saved) : [];
  });

  const [jobStatus, setJobStatus] = useState<JobStatus>('idle');
  const [response, setResponse] = useState<N8NResponse | null>(() => {
    const saved = sessionStorage.getItem('n8n_last_response');
    return saved ? JSON.parse(saved) : null;
  });
  const [processingTime, setProcessingTime] = useState<number>(0);
  const [retryCount, setRetryCount] = useState(0);

  // Configurações de geração expandidas
  const [config, setConfig] = useState<GenerationConfig>(() => {
    const defaults: GenerationConfig = {
      gerar_imagens: true,
      gerar_textos: true,
      quantidade_imagens: 3,
      estilo_texto: 'profissional',
      tipos_imagem: ['fundo_branco', 'lifestyle', 'banner'],
      idioma: 'pt-BR',
      tom_voz: 'formal',
      incluir_emojis: false,
      quantidade_bullets: 5,
      cor_fundo: '#FFFFFF',
      dimensoes: '1:1',
      qualidade: 'HD'
    };

    try {
      const saved = sessionStorage.getItem('n8n_generation_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge com defaults para garantir que todos os campos existam
        return { ...defaults, ...parsed };
      }
    } catch (e) {
      console.warn('Erro ao carregar config do sessionStorage:', e);
    }

    return defaults;
  });

  // Estado de imagens do produto
  const [productImages, setProductImages] = useState<string[]>([]);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);

  // ✅ Ref para lock de execução (evita duplo clique)
  const processingRef = useRef(false);

  // Estado de edição de textos
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editedTexts, setEditedTexts] = useState<TextosGerados>({});

  // Preview do payload
  const [showPayloadPreview, setShowPayloadPreview] = useState(false);
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
  const [showHeaders, setShowHeaders] = useState(false);

  // ID único para o produto temporário
  const [productId] = useState(() => {
    const existingId = sessionStorage.getItem('ad_generator_n8n_product_id');
    if (existingId) {
      return existingId;
    }
    const newId = `n8n-gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('ad_generator_n8n_product_id', newId);
    return newId;
  });

  // Dados do formulário
  const [formData, setFormData] = useState({
    nome: '',
    sku: '',
    descricao_curta: '',
    descricao: '',
    preco_custo: 0,
    preco_venda: 0,
    peso_liquido: 0,
    altura: null as number | null,
    largura: null as number | null,
    profundidade: null as number | null,
    peso_bruto: null as number | null,
  });

  // Buscar sessão do usuário autenticado
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserId(session.user.id);
          setUserEmail(session.user.email || null);
        }
      } catch (error) {
        console.error('Erro ao buscar sessão:', error);
      } finally {
        setIsAuthLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email || null);
      } else {
        setUserId(null);
        setUserEmail(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Produto mock para componentes
  const product: any = {
    id: productId,
    nome: formData.nome,
    sku: formData.sku || 'N8N-GEN',
    descricao_curta: formData.descricao_curta,
    descricao: formData.descricao,
    preco_custo: formData.preco_custo,
    preco_venda: formData.preco_venda,
    preco: formData.preco_venda,
    peso_liquido: formData.peso_liquido,
    altura: formData.altura,
    largura: formData.largura,
    profundidade: formData.profundidade,
    peso_bruto: formData.peso_bruto,
    imagens: productImages,
    estoque: 100,
    imagem_url: productImages[0] || null,
  };

  // Salvar no localStorage/sessionStorage
  useEffect(() => {
    if (webhookUrl) {
      localStorage.setItem('n8n_webhook_url', webhookUrl);
    }
  }, [webhookUrl]);

  useEffect(() => {
    localStorage.setItem('n8n_custom_headers', JSON.stringify(customHeaders));
  }, [customHeaders]);

  useEffect(() => {
    sessionStorage.setItem('n8n_generation_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    if (response) {
      sessionStorage.setItem('n8n_last_response', JSON.stringify(response));
    }
  }, [response]);

  // Inicializar textos editados quando receber resposta
  useEffect(() => {
    if (response?.data?.textos_gerados) {
      setEditedTexts(response.data.textos_gerados);
    }
  }, [response?.data?.textos_gerados]);

  // Handler para mudanças no formulário
  const handleFormDataChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handler para atualizar descrição
  const handleUpdateDescription = useCallback((newDescription: string) => {
    setFormData(prev => ({ ...prev, descricao: newDescription }));
    toast.success('Descrição atualizada!');
  }, []);

  // Handler para imagens uploadadas
  const handleImagesUploaded = useCallback((newImages: string[]) => {
    setProductImages(newImages);

    if (referenceImages.length < 2 && newImages.length >= 1) {
      if (referenceImages.length === 0) {
        const refs = newImages.slice(0, Math.min(2, newImages.length));
        setReferenceImages(refs);
      }
    }
  }, [referenceImages]);

  // Converter imagens para base64
  const imagesToBase64 = async (urls: string[]): Promise<string[]> => {
    const results: string[] = [];

    for (const url of urls) {
      try {
        if (url.startsWith('data:image')) {
          results.push(url);
          continue;
        }

        if (url.startsWith('blob:')) {
          const response = await fetch(url);
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          results.push(base64);
          continue;
        }

        results.push(url);
      } catch (error) {
        console.error('Erro ao converter imagem:', error);
        results.push(url);
      }
    }

    return results;
  };

  // Gerar payload completo
  const generatePayload = async () => {
    const imagesData = await imagesToBase64(productImages.slice(0, 5));

    return {
      request_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      source: 'lovable-ad-generator-n8n',
      version: '2.0',

      user: {
        id: userId || 'anonymous',
        email: userEmail || null,
      },

      product: {
        id: productId,
        nome: formData.nome,
        sku: formData.sku || 'N8N-GEN',
        descricao_curta: formData.descricao_curta,
        descricao: formData.descricao,
        preco_custo: formData.preco_custo,
        preco_venda: formData.preco_venda,
        peso_liquido: formData.peso_liquido,
        dimensoes: {
          altura: formData.altura,
          largura: formData.largura,
          profundidade: formData.profundidade,
          peso_bruto: formData.peso_bruto,
        }
      },

      images: imagesData,

      config: {
        gerar_imagens: config.gerar_imagens,
        gerar_textos: config.gerar_textos,
        quantidade_imagens: config.quantidade_imagens,
        tipos_imagem: config.tipos_imagem,
        dimensoes: config.dimensoes,
        qualidade: config.qualidade,
        cor_fundo: config.cor_fundo,
        estilo_texto: config.estilo_texto,
        idioma: config.idioma,
        tom_voz: config.tom_voz,
        incluir_emojis: config.incluir_emojis,
        quantidade_bullets: config.quantidade_bullets,
      }
    };
  };

  // Tratamento de erros específicos
  const handleError = (error: any, status?: number): { message: string; code: string; canRetry: boolean } => {
    console.error('❌ [N8N] Erro detalhado:', { error, status, timestamp: new Date().toISOString() });

    if (error.name === 'AbortError') {
      return {
        message: 'n8n não respondeu em 60 segundos. Tente novamente.',
        code: 'TIMEOUT',
        canRetry: true
      };
    }

    if (!navigator.onLine) {
      return {
        message: 'Sem conexão com a internet. Verifique sua rede.',
        code: 'OFFLINE',
        canRetry: true
      };
    }

    if (error.message?.includes('CORS') || error.message?.includes('Failed to fetch')) {
      return {
        message: 'Erro de CORS. Configure os headers no n8n ou use callback assíncrono.',
        code: 'CORS',
        canRetry: false
      };
    }

    switch (status) {
      case 401:
        return {
          message: 'Webhook requer autenticação. Adicione header Authorization.',
          code: 'UNAUTHORIZED',
          canRetry: false
        };
      case 403:
        return {
          message: 'Acesso negado ao webhook. Verifique permissões no n8n.',
          code: 'FORBIDDEN',
          canRetry: false
        };
      case 404:
        return {
          message: 'Webhook não encontrado. Verifique a URL.',
          code: 'NOT_FOUND',
          canRetry: false
        };
      case 408:
      case 504:
        return {
          message: 'Timeout do servidor. Tente novamente.',
          code: 'GATEWAY_TIMEOUT',
          canRetry: true
        };
      case 429:
        return {
          message: 'Muitas requisições. Aguarde alguns segundos e tente novamente.',
          code: 'RATE_LIMITED',
          canRetry: true
        };
      case 500:
      case 502:
      case 503:
        return {
          message: 'Erro interno no n8n. Verifique os logs do workflow.',
          code: 'SERVER_ERROR',
          canRetry: true
        };
      default:
        return {
          message: error.message || 'Erro desconhecido',
          code: 'UNKNOWN',
          canRetry: true
        };
    }
  };

  // 🚀 Enviar para n8n
  const sendToN8N = async (isRetry = false) => {
    // ✅ Check lock
    if (processingRef.current) {
      console.log('⚠️ [N8N] Já processando, ignorando clique duplicado');
      return;
    }

    if (!webhookUrl) {
      toast.error('Configure a URL do webhook n8n primeiro!');
      return;
    }

    if (!formData.nome) {
      toast.error('Preencha o nome do produto!');
      return;
    }

    if (productImages.length === 0) {
      toast.error('Adicione pelo menos uma imagem!');
      return;
    }

    if (isRetry) {
      setRetryCount(prev => prev + 1);
    } else {
      setRetryCount(0);
    }

    // ✅ Set lock
    processingRef.current = true;
    setJobStatus('sending');
    setResponse(null);
    const startTime = Date.now();

    try {
      console.log('🚀 [N8N] Enviando para webhook:', webhookUrl);

      const payload = await generatePayload();

      setJobStatus('processing');

      console.log('📦 [N8N] Payload:', {
        ...payload,
        images: `[${payload.images.length} imagens em base64]`
      });

      // Montar headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      customHeaders.forEach(h => {
        if (h.key && h.value) {
          headers[h.key] = h.value;
        }
      });

      // Chamar via proxy n8n-proxy (elimina CORS)
      console.log('📡 [N8N] Chamando via proxy n8n-proxy...');

      const { data: proxyResponse, error: proxyError } = await supabase.functions.invoke('n8n-proxy', {
        body: {
          webhookUrl: webhookUrl,
          payload: payload
        }
      });

      const endTime = Date.now();
      setProcessingTime(endTime - startTime);

      if (proxyError) {
        console.error('❌ [N8N] Erro do proxy:', proxyError);
        throw new Error(proxyError.message || 'Erro ao chamar proxy n8n');
      }

      if (!proxyResponse) {
        throw new Error('Resposta vazia do proxy');
      }

      console.log('✅ [N8N] Resposta do proxy:', proxyResponse);

      // Processar resposta - tentar extrair estrutura esperada
      const data = proxyResponse;
      const result: N8NResult = {
        imagens_geradas: data.imagens_geradas || data.images || [],
        textos_gerados: data.textos_gerados || data.texts || data.textos || {},
        processamento: {
          tempo_ms: data.processamento?.tempo_ms || (endTime - startTime),
          modelo_usado: data.processamento?.modelo_usado || data.model || 'n8n-workflow',
          creditos_consumidos: data.processamento?.creditos_consumidos || 0,
        }
      };

      setResponse({
        success: true,
        data: result,
        rawData: data,
        jobId: data.jobId || data.id || 'N/A'
      });

      setJobStatus('completed');
      setRetryCount(0);

      // ✅ Enviar imagens automaticamente para a galeria
      const imagesToSend: string[] = [];

      // Extrair de imagens_geradas (array com base64)
      if (result.imagens_geradas && result.imagens_geradas.length > 0) {
        result.imagens_geradas.forEach((img: any) => {
          if (img.base64) {
            imagesToSend.push(`data:image/png;base64,${img.base64}`);
          } else if (img.url) {
            imagesToSend.push(img.url);
          } else if (typeof img === 'string') {
            imagesToSend.push(img.startsWith('data:') ? img : `data:image/png;base64,${img}`);
          }
        });
      }

      // Extrair de campos diretos da resposta
      const directImage = data.imageUrl || data.imagem || data.result?.imageUrl || data.image;
      if (directImage) {
        imagesToSend.push(directImage);
      }

      // Extrair base64 direto
      if (data.base64 && !imagesToSend.some(i => i.includes(data.base64.substring(0, 50)))) {
        imagesToSend.push(`data:${data.mimeType || 'image/png'};base64,${data.base64}`);
      }

      // Disparar evento se tiver imagens
      if (imagesToSend.length > 0) {
        console.log(`📤 [N8N] Enviando ${imagesToSend.length} imagem(ns) para galeria`);

        window.dispatchEvent(new CustomEvent('imageGenerated', {
          detail: {
            source: 'n8n',
            productId: productId,
            images: imagesToSend,
            timestamp: Date.now()
          }
        }));

        toast.success(`${imagesToSend.length} imagem(ns) adicionada(s) à galeria!`);
      } else {
        toast.success('Processamento concluído!');
      }

    } catch (error: any) {
      console.error('❌ [N8N] Erro:', error);
      const endTime = Date.now();
      setProcessingTime(endTime - startTime);

      const errorInfo = handleError(error);
      setResponse({
        success: false,
        error: errorInfo.message,
        errorCode: errorInfo.code,
        rawData: { error: errorInfo.message, details: error.message }
      });

      setJobStatus('failed');

      if (errorInfo.canRetry && retryCount < 3) {
        toast.error(errorInfo.message, {
          action: {
            label: 'Tentar novamente',
            onClick: () => sendToN8N(true)
          }
        });
      } else {
        toast.error(errorInfo.message);
      }

      setJobStatus('failed');

      if (errorInfo.canRetry && retryCount < 3) {
        toast.error(errorInfo.message, {
          action: {
            label: 'Tentar novamente',
            onClick: () => sendToN8N(true)
          }
        });
      } else {
        toast.error(errorInfo.message);
      }
    } finally {
      // ✅ Release lock
      processingRef.current = false;
    }
  };

  // Copiar texto para clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  // Copiar payload
  const copyPayload = async () => {
    const payload = await generatePayload();
    const payloadWithoutImages = {
      ...payload,
      images: `[${payload.images.length} imagens em base64 - omitidas para cópia]`
    };
    navigator.clipboard.writeText(JSON.stringify(payloadWithoutImages, null, 2));
    toast.success('Payload copiado!');
  };

  // Copiar todos os textos
  const copyAllTexts = () => {
    const texts = editedTexts;
    const allText = [
      texts.titulo_curto && `Título: ${texts.titulo_curto}`,
      texts.titulo_longo && `Título Longo: ${texts.titulo_longo}`,
      texts.descricao_curta && `Descrição Curta: ${texts.descricao_curta}`,
      texts.descricao_completa && `Descrição: ${texts.descricao_completa}`,
      texts.bullet_points?.length && `Bullet Points:\n${texts.bullet_points.map(b => `• ${b}`).join('\n')}`,
      texts.hashtags?.length && `Hashtags: ${texts.hashtags.join(' ')}`,
      texts.cta && `CTA: ${texts.cta}`,
    ].filter(Boolean).join('\n\n');

    navigator.clipboard.writeText(allText);
    toast.success('Todos os textos copiados!');
  };

  // Download de imagem
  const downloadImage = (base64: string, filename: string) => {
    const link = document.createElement('a');
    link.href = base64;
    link.download = filename;
    link.click();
  };

  // Download de todas as imagens
  const downloadAllImages = () => {
    const images = response?.data?.imagens_geradas || [];
    images.forEach((img, index) => {
      setTimeout(() => {
        downloadImage(img.base64, `${formData.nome || 'produto'}_${img.tipo || index + 1}.png`);
      }, index * 500);
    });
    toast.success(`Baixando ${images.length} imagens...`);
  };

  // Handler para Novo Produto
  const handleNewProduct = useCallback(() => {
    sessionStorage.removeItem('ad_generator_n8n_product_id');
    sessionStorage.removeItem('n8n_last_response');
    sessionStorage.removeItem('n8n_generation_config');

    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('ad_generator_n8n_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));

    toast.success('Cache limpo! Recarregando...');
    window.location.reload();
  }, []);

  // Adicionar header customizado
  const addCustomHeader = () => {
    setCustomHeaders(prev => [...prev, { key: '', value: '' }]);
  };

  // Remover header customizado
  const removeCustomHeader = (index: number) => {
    setCustomHeaders(prev => prev.filter((_, i) => i !== index));
  };

  // Atualizar header customizado
  const updateCustomHeader = (index: number, field: 'key' | 'value', value: string) => {
    setCustomHeaders(prev => prev.map((h, i) => i === index ? { ...h, [field]: value } : h));
  };

  // Toggle tipo de imagem
  const toggleTipoImagem = (tipoId: string) => {
    setConfig(prev => ({
      ...prev,
      tipos_imagem: prev.tipos_imagem.includes(tipoId)
        ? prev.tipos_imagem.filter(t => t !== tipoId)
        : [...prev.tipos_imagem, tipoId]
    }));
  };

  // Renderizar status
  const renderStatusBadge = () => {
    switch (jobStatus) {
      case 'idle':
        return <Badge variant="secondary">Aguardando</Badge>;
      case 'sending':
        return <Badge className="bg-blue-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Enviando...</Badge>;
      case 'processing':
        return <Badge className="bg-purple-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> n8n processando...</Badge>;
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Concluído</Badge>;
      case 'failed':
        return <Badge className="bg-red-500"><AlertCircle className="h-3 w-3 mr-1" /> Erro</Badge>;
      default:
        return null;
    }
  };

  const isFormValid = formData.nome.length >= 3 && productImages.length >= 1;

  // Componente de card de texto editável
  const TextCard = ({
    label,
    field,
    value,
    multiline = false
  }: {
    label: string;
    field: keyof TextosGerados;
    value?: string;
    multiline?: boolean;
  }) => {
    const isEditing = editingField === field;
    const currentValue = (editedTexts[field] as string) || value || '';

    if (!currentValue && !isEditing) return null;

    return (
      <div className="p-4 bg-white/60 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <Label className="font-semibold text-gray-700">{label}</Label>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(currentValue, label)}
              className="h-7 w-7 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
            {!isEditing ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingField(field)}
                className="h-7 w-7 p-0"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingField(null)}
                  className="h-7 w-7 p-0 text-green-600"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditedTexts(prev => ({ ...prev, [field]: value }));
                    setEditingField(null);
                  }}
                  className="h-7 w-7 p-0 text-red-600"
                >
                  <X className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
        {isEditing ? (
          multiline ? (
            <Textarea
              value={currentValue}
              onChange={(e) => setEditedTexts(prev => ({ ...prev, [field]: e.target.value }))}
              className="min-h-[100px]"
              autoFocus
            />
          ) : (
            <Input
              value={currentValue}
              onChange={(e) => setEditedTexts(prev => ({ ...prev, [field]: e.target.value }))}
              autoFocus
            />
          )
        ) : (
          <p className={`text-sm text-gray-600 ${multiline ? 'whitespace-pre-wrap' : ''}`}>
            {currentValue}
          </p>
        )}
      </div>
    );
  };

  return (
    <SafeErrorBoundary>
      <ProductDetailsLayout>
        {/* Header */}
        <Card className="glass-effect shadow-lg border-0 bg-gradient-to-br from-white/90 to-cyan-50/80 backdrop-blur-sm mb-6">
          <CardHeader className="bg-gradient-to-r from-cyan-100/50 to-blue-100/50 border-b border-cyan-200/30">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                    🧪 Teste n8n - Gerador de Anúncios
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Envia dados → n8n processa → Retorna imagens e textos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Status de autenticação */}
                {!isAuthLoading && (
                  <Badge
                    variant={userId ? "default" : "secondary"}
                    className={userId ? "bg-green-500/80" : "bg-amber-500/80"}
                  >
                    <User className="h-3 w-3 mr-1" />
                    {userId ? (userEmail?.split('@')[0] || 'Autenticado') : 'Anônimo'}
                  </Badge>
                )}
                {/* Status de conexão */}
                <Badge variant="outline" className="text-xs">
                  {navigator.onLine ? (
                    <><Wifi className="h-3 w-3 mr-1 text-green-500" /> Online</>
                  ) : (
                    <><WifiOff className="h-3 w-3 mr-1 text-red-500" /> Offline</>
                  )}
                </Badge>
                {processingTime > 0 && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {(processingTime / 1000).toFixed(1)}s
                  </Badge>
                )}
                <Button
                  onClick={() => {
                    const count = clearAllImageCaches();
                    setProductImages([]);
                    setReferenceImages([]);
                    toast.success(`Cache limpo! ${count} itens removidos.`);
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  title="Limpar cache"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleNewProduct}
                  variant="outline"
                  size="sm"
                  className="border-amber-400 text-amber-700 hover:bg-amber-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Novo Produto
                </Button>
                {renderStatusBadge()}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Configuração do Webhook n8n */}
        <Card className="glass-effect shadow-lg border-2 border-cyan-300 bg-gradient-to-br from-cyan-50/90 to-blue-50/80 backdrop-blur-sm mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-2xl">🔗</span>
              Configuração do Webhook n8n
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">URL do Webhook n8n</Label>
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://seu-n8n.app.n8n.cloud/webhook/xxxx-xxxx-xxxx"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className={`font-mono text-sm ${response?.errorCode === 'NOT_FOUND' ? 'border-red-500' : ''}`}
              />
            </div>

            {/* Configurações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="gerar-imagens"
                  checked={config.gerar_imagens}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, gerar_imagens: !!checked }))}
                />
                <Label htmlFor="gerar-imagens" className="text-sm">Gerar Imagens</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="gerar-textos"
                  checked={config.gerar_textos}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, gerar_textos: !!checked }))}
                />
                <Label htmlFor="gerar-textos" className="text-sm">Gerar Textos</Label>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Qtd. Imagens</Label>
                <Select
                  value={config.quantidade_imagens.toString()}
                  onValueChange={(value) => setConfig(prev => ({ ...prev, quantidade_imagens: parseInt(value) }))}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n} {n === 1 ? 'imagem' : 'imagens'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Estilo do Texto</Label>
                <Select
                  value={config.estilo_texto}
                  onValueChange={(value: any) => setConfig(prev => ({ ...prev, estilo_texto: value }))}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="profissional">Profissional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="criativo">Criativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tipos de Imagem */}
            <div className="pt-4 border-t">
              <Label className="text-sm font-medium mb-3 block">Tipos de Imagem</Label>
              <div className="flex flex-wrap gap-2">
                {TIPOS_IMAGEM.map(tipo => (
                  <Button
                    key={tipo.id}
                    variant={config.tipos_imagem.includes(tipo.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTipoImagem(tipo.id)}
                    className={config.tipos_imagem.includes(tipo.id) ? "bg-cyan-600 hover:bg-cyan-700" : ""}
                  >
                    {tipo.emoji} {tipo.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Configurações Avançadas */}
            <Collapsible open={showAdvancedConfig} onOpenChange={setShowAdvancedConfig}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between mt-2">
                  <span className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    Configurações Avançadas
                  </span>
                  {showAdvancedConfig ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Idioma */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Idioma</Label>
                    <Select
                      value={config.idioma}
                      onValueChange={(value: any) => setConfig(prev => ({ ...prev, idioma: value }))}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">🇧🇷 Português</SelectItem>
                        <SelectItem value="en-US">🇺🇸 English</SelectItem>
                        <SelectItem value="es-ES">🇪🇸 Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tom de Voz */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Tom de Voz</Label>
                    <Select
                      value={config.tom_voz}
                      onValueChange={(value: any) => setConfig(prev => ({ ...prev, tom_voz: value }))}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="informal">Informal</SelectItem>
                        <SelectItem value="luxo">Luxo</SelectItem>
                        <SelectItem value="acessivel">Acessível</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dimensões */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Dimensões</Label>
                    <Select
                      value={config.dimensoes}
                      onValueChange={(value: any) => setConfig(prev => ({ ...prev, dimensoes: value }))}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1:1">1:1 (Quadrado)</SelectItem>
                        <SelectItem value="4:3">4:3 (Paisagem)</SelectItem>
                        <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Qualidade */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Qualidade</Label>
                    <Select
                      value={config.qualidade}
                      onValueChange={(value: any) => setConfig(prev => ({ ...prev, qualidade: value }))}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="HD">HD</SelectItem>
                        <SelectItem value="ultra-HD">Ultra HD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Cor de Fundo */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Cor de Fundo</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.cor_fundo}
                        onChange={(e) => setConfig(prev => ({ ...prev, cor_fundo: e.target.value }))}
                        className="h-8 w-12 p-1"
                      />
                      <Input
                        value={config.cor_fundo}
                        onChange={(e) => setConfig(prev => ({ ...prev, cor_fundo: e.target.value }))}
                        className="h-8 font-mono text-xs"
                        placeholder="#FFFFFF"
                      />
                    </div>
                  </div>

                  {/* Qtd Bullets */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Qtd. Bullet Points</Label>
                    <Select
                      value={config.quantidade_bullets.toString()}
                      onValueChange={(value) => setConfig(prev => ({ ...prev, quantidade_bullets: parseInt(value) }))}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[3, 4, 5, 6, 7, 8].map(n => (
                          <SelectItem key={n} value={n.toString()}>{n} bullets</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Emojis */}
                  <div className="flex items-center space-x-2 pt-5">
                    <Checkbox
                      id="incluir-emojis"
                      checked={config.incluir_emojis}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, incluir_emojis: !!checked }))}
                    />
                    <Label htmlFor="incluir-emojis" className="text-sm">Incluir Emojis nos Textos</Label>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Headers Customizados */}
            <Collapsible open={showHeaders} onOpenChange={setShowHeaders}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between mt-2">
                  <span className="flex items-center gap-2">
                    🔐 Headers Customizados ({customHeaders.length})
                  </span>
                  {showHeaders ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-3">
                {customHeaders.map((header, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      placeholder="Header-Key"
                      value={header.key}
                      onChange={(e) => updateCustomHeader(index, 'key', e.target.value)}
                      className="h-8 font-mono text-xs flex-1"
                    />
                    <span className="text-muted-foreground">:</span>
                    <Input
                      placeholder="value"
                      value={header.value}
                      onChange={(e) => updateCustomHeader(index, 'value', e.target.value)}
                      className="h-8 font-mono text-xs flex-1"
                      type={header.key.toLowerCase().includes('auth') ? 'password' : 'text'}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomHeader(index)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addCustomHeader}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Header
                </Button>
                <p className="text-xs text-muted-foreground">
                  Sugestões: <code className="bg-muted px-1 rounded">Authorization</code>, <code className="bg-muted px-1 rounded">X-Workflow-Id</code>, <code className="bg-muted px-1 rounded">X-Source</code>
                </p>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Galeria de Imagens do Produto */}
        <SafeErrorBoundary>
          <ProductImagesGrid
            images={productImages}
            productName={formData.nome || 'Novo Produto'}
            productId={productId}
            onImagesUploaded={handleImagesUploaded}
            longTailTitles={[]}
            isAutomationComplete={false}
            referenceImageUrls={referenceImages}
          />
        </SafeErrorBoundary>

        {/* Informações do Produto */}
        <SafeErrorBoundary>
          <Card className="glass-effect shadow-lg border-0 bg-gradient-to-br from-white/90 to-blue-50/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-100/50 to-purple-100/50 border-b border-blue-200/30">
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Informações do Produto
                </span>
              </CardTitle>
            </CardHeader>
            <ProductFormContent
              product={product}
              isEditing={true}
              formData={formData}
              onFormDataChange={handleFormDataChange}
              onUpdateDescription={handleUpdateDescription}
              isAutomationRunning={false}
              automationStep={null}
              copywritingData={null}
              unifiedCommandsData={null}
            />
          </Card>
        </SafeErrorBoundary>

        {/* Preview do Payload */}
        {isFormValid && (
          <Collapsible open={showPayloadPreview} onOpenChange={setShowPayloadPreview}>
            <Card className="glass-effect shadow-lg border-2 border-purple-300 bg-gradient-to-br from-purple-50/90 to-indigo-50/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Eye className="h-5 w-5 text-purple-600" />
                      <span className="text-purple-700">Preview do Payload</span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{productImages.length} imagens</Badge>
                      <Badge variant="outline">{config.tipos_imagem.length} tipos</Badge>
                      {userId && <Badge variant="outline" className="bg-green-100">✓ Auth</Badge>}
                      {showPayloadPreview ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {/* Resumo Visual */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-white/50 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{productImages.length}</p>
                      <p className="text-xs text-muted-foreground">Imagens</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{config.quantidade_imagens}</p>
                      <p className="text-xs text-muted-foreground">Gerar</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{config.idioma}</p>
                      <p className="text-xs text-muted-foreground">Idioma</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{config.qualidade}</p>
                      <p className="text-xs text-muted-foreground">Qualidade</p>
                    </div>
                  </div>

                  {/* JSON Preview */}
                  <div className="relative">
                    <pre className="bg-black/5 p-4 rounded-lg overflow-auto max-h-64 text-xs font-mono">
                      {`{
  "request_id": "uuid-gerado",
  "timestamp": "${new Date().toISOString()}",
  "source": "lovable-ad-generator-n8n",
  "version": "2.0",
  
  "user": {
    "id": "${userId || 'anonymous'}",
    "email": ${userEmail ? `"${userEmail}"` : 'null'}
  },
  
  "product": {
    "id": "${productId}",
    "nome": "${formData.nome}",
    "sku": "${formData.sku || 'N8N-GEN'}",
    "preco_venda": ${formData.preco_venda}
  },
  
  "images": "[${productImages.length} imagens em base64]",
  
  "config": ${JSON.stringify(config, null, 4).split('\n').map((l, i) => i === 0 ? l : '  ' + l).join('\n')}
}`}
                    </pre>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={copyPayload}
                      className="absolute top-2 right-2"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar
                    </Button>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Botão de Envio para n8n */}
        {isFormValid && (
          <Card className="glass-effect shadow-lg border-2 border-cyan-300 bg-gradient-to-br from-cyan-50/90 to-blue-50/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-cyan-700">🚀 Enviar para n8n</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {config.gerar_imagens && config.gerar_textos
                      ? `Gerar ${config.quantidade_imagens} imagens + textos (${config.estilo_texto})`
                      : config.gerar_imagens
                        ? `Gerar ${config.quantidade_imagens} imagens`
                        : 'Gerar textos'}
                  </p>
                  {!userId && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ Não autenticado - será enviado como anônimo
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => sendToN8N()}
                  disabled={jobStatus === 'sending' || jobStatus === 'processing' || !webhookUrl}
                  size="lg"
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold px-8 py-6 text-lg"
                >
                  {jobStatus === 'sending' || jobStatus === 'processing' ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      {jobStatus === 'sending' ? 'Enviando...' : 'n8n processando...'}
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Enviar para n8n
                    </>
                  )}
                </Button>
                {!webhookUrl && (
                  <p className="text-xs text-amber-600">
                    ⚠️ Configure a URL do webhook acima primeiro
                  </p>
                )}
                {retryCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Tentativa {retryCount + 1} de 3
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ==================== RESULTADOS ==================== */}

        {/* Galeria de Imagens Geradas */}
        {response?.success && response.data?.imagens_geradas && response.data.imagens_geradas.length > 0 && (
          <Card className="glass-effect shadow-lg border-2 border-green-300 bg-gradient-to-br from-green-50/90 to-emerald-50/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-green-600" />
                  <span className="text-green-700">Imagens Geradas ({response.data.imagens_geradas.length})</span>
                </CardTitle>
                <Button
                  onClick={downloadAllImages}
                  variant="outline"
                  size="sm"
                  className="border-green-400 text-green-700 hover:bg-green-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Todas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {response.data.imagens_geradas.map((img, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-white shadow-md">
                      <img
                        src={img.base64}
                        alt={img.tipo || `Imagem ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => downloadImage(img.base64, `${formData.nome || 'produto'}_${img.tipo || index + 1}.png`)}
                        className="h-8"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Baixar
                      </Button>
                    </div>
                    {img.tipo && (
                      <Badge className="absolute top-2 left-2 bg-black/60 text-white text-xs">
                        {img.tipo}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Textos Gerados */}
        {response?.success && editedTexts && Object.keys(editedTexts).length > 0 && (
          <Card className="glass-effect shadow-lg border-2 border-blue-300 bg-gradient-to-br from-blue-50/90 to-indigo-50/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Edit2 className="h-5 w-5 text-blue-600" />
                  <span className="text-blue-700">Textos Gerados</span>
                </CardTitle>
                <Button
                  onClick={copyAllTexts}
                  variant="outline"
                  size="sm"
                  className="border-blue-400 text-blue-700 hover:bg-blue-50"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Tudo
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextCard label="Título Curto" field="titulo_curto" value={response.data?.textos_gerados?.titulo_curto} />
                <TextCard label="Título Longo" field="titulo_longo" value={response.data?.textos_gerados?.titulo_longo} />
              </div>
              <TextCard label="Descrição Curta" field="descricao_curta" value={response.data?.textos_gerados?.descricao_curta} />
              <TextCard label="Descrição Completa" field="descricao_completa" value={response.data?.textos_gerados?.descricao_completa} multiline />

              {/* Bullet Points */}
              {editedTexts.bullet_points && editedTexts.bullet_points.length > 0 && (
                <div className="p-4 bg-white/60 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-semibold text-gray-700">Bullet Points</Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(editedTexts.bullet_points!.map(b => `• ${b}`).join('\n'), 'Bullet Points')}
                      className="h-7 w-7 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <ul className="space-y-1">
                    {editedTexts.bullet_points.map((bullet, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-green-500">•</span>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Hashtags */}
              {editedTexts.hashtags && editedTexts.hashtags.length > 0 && (
                <div className="p-4 bg-white/60 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-semibold text-gray-700">Hashtags</Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(editedTexts.hashtags!.join(' '), 'Hashtags')}
                      className="h-7 w-7 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editedTexts.hashtags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="bg-blue-100 text-blue-700">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <TextCard label="CTA (Call to Action)" field="cta" value={response.data?.textos_gerados?.cta} />
            </CardContent>
          </Card>
        )}

        {/* Resposta Raw do n8n (debug) */}
        {response && (
          <Card className={`glass-effect shadow-lg border-2 ${response.success ? 'border-gray-300 bg-gradient-to-br from-gray-50/90 to-slate-50/80' : 'border-red-300 bg-gradient-to-br from-red-50/90 to-pink-50/80'} backdrop-blur-sm`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                {response.success ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-700">Resposta Raw (Debug)</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="text-red-700">Erro {response.errorCode && `(${response.errorCode})`}</span>
                  </>
                )}
                {response.success && (
                  <Button
                    onClick={() => sendToN8N()}
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reprocessar
                  </Button>
                )}
                {!response.success && (
                  <Button
                    onClick={() => sendToN8N(true)}
                    variant="outline"
                    size="sm"
                    className="ml-auto border-red-400 text-red-700 hover:bg-red-50"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-black/5 p-4 rounded-lg overflow-auto max-h-64 text-xs font-mono">
                {JSON.stringify(response.rawData || response, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Instruções / Documentação */}
        <Card className="glass-effect shadow-lg border-0 bg-gradient-to-br from-white/90 to-gray-50/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">📋 Documentação n8n</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">🔧 Configuração do Webhook</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Método: <code className="bg-muted px-1 rounded">POST</code></li>
                  <li>• Response: <code className="bg-muted px-1 rounded">Last Node</code></li>
                  <li>• CORS: Habilitar se necessário</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">🔌 Nodes Recomendados</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• <strong>Imagens:</strong> Gemini Image ou DALL-E</li>
                  <li>• <strong>Textos:</strong> OpenAI GPT-4</li>
                  <li>• <strong>Merge:</strong> Combinar resultados</li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">📤 Estrutura esperada da resposta n8n</h4>
              <pre className="bg-black/5 p-4 rounded-lg overflow-auto max-h-48 text-xs font-mono text-gray-700">
                {`{
  "imagens_geradas": [
    {
      "tipo": "fundo_branco",
      "base64": "data:image/png;base64,iVBORw0KGgo...",
      "descricao": "Produto com fundo branco"
    }
  ],
  "textos_gerados": {
    "titulo_curto": "Nome do Produto",
    "titulo_longo": "Nome Completo do Produto Premium",
    "descricao_curta": "Descrição breve...",
    "descricao_completa": "Descrição detalhada...",
    "bullet_points": ["Benefício 1", "Benefício 2"],
    "hashtags": ["#produto", "#qualidade"],
    "cta": "Compre agora!"
  },
  "processamento": {
    "tempo_ms": 5000,
    "modelo_usado": "gpt-4-vision",
    "creditos_consumidos": 1
  }
}`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </ProductDetailsLayout>
    </SafeErrorBoundary>
  );
}
