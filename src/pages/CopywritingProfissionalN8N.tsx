import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  FileText, 
  Loader2, 
  Clock, 
  Bot, 
  Copy, 
  Check, 
  ChevronDown,
  AlertCircle,
  Zap,
  Settings,
  User,
  Send,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { CopywritingFormatter } from "@/components/product/copywriting/CopywritingFormatter";
import { supabase } from "@/integrations/supabase/client";

interface ProductInput {
  name: string;
  shortDescription: string;
}

interface ExecutionStats {
  responseTime: number;
  tokensUsed: number;
  apiUsed: string;
  model: string;
}

// Constantes de retry
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAYS = [2000, 4000, 8000, 15000, 30000]; // ms

interface ImageWebhookStatus {
  status: "idle" | "sending" | "success" | "error" | "retrying";
  attemptedAt: string | null;
  httpStatus: number | null;
  responseText: string | null;
  errorMessage: string | null;
  payload: any | null;
  extractedData: {
    titulo: string;
    descricao_seo: boolean;
    specs: number;
    ambientes: number;
    beneficios: number;
  } | null;
  // Retry tracking
  currentAttempt: number;
  maxAttempts: number;
  nextRetryAt: string | null;
}

const CopywritingProfissionalN8N = () => {
  const [webhookUrl, setWebhookUrl] = useState(() => 
    localStorage.getItem("copywriting_n8n_webhook_url") || ""
  );
  const [webhookImageUrl, setWebhookImageUrl] = useState(() => 
    localStorage.getItem("copywriting_n8n_webhook_image_url") || 
    "https://n8n.visualvendas.cloud/webhook-test/dadosImagem"
  );
  const [product, setProduct] = useState<ProductInput>({
    name: "",
    shortDescription: ""
  });
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ExecutionStats | null>(null);
  const [showPayload, setShowPayload] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // Estado do webhook de imagem - visibilidade total
  const [imageWebhookStatus, setImageWebhookStatus] = useState<ImageWebhookStatus>({
    status: "idle",
    attemptedAt: null,
    httpStatus: null,
    responseText: null,
    errorMessage: null,
    payload: null,
    extractedData: null,
    currentAttempt: 0,
    maxAttempts: MAX_RETRY_ATTEMPTS,
    nextRetryAt: null
  });

  // Ref para controlar o timer de retry e evitar múltiplos
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup do timer ao desmontar
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Fetch authenticated user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email || null);
      }
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
      setUserEmail(session?.user?.email || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (webhookUrl) {
      localStorage.setItem("copywriting_n8n_webhook_url", webhookUrl);
    }
  }, [webhookUrl]);

  const generatePayload = () => {
    return {
      product_name: product.name,
      short_description: product.shortDescription,
      long_description: product.shortDescription,
      image_url: imageUrl || undefined,
      user_id: userId,
      user_email: userEmail,
      request_id: `copywriting_${Date.now()}`
    };
  };

  const executeCopywriting = async () => {
    if (!webhookUrl) {
      toast.error("Configure a URL do webhook n8n");
      return;
    }

    if (!product.name) {
      toast.error("Informe o nome do produto");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setStats(null);

    const startTime = Date.now();

    try {
      // Usar supabase.functions.invoke para chamar o n8n via proxy
      const { data, error: functionError } = await supabase.functions.invoke("n8n-proxy", {
        body: {
          webhookUrl: webhookUrl,
          payload: generatePayload()
        }
      });

      if (functionError) {
        throw new Error(`Erro na função: ${functionError.message}`);
      }

      // O proxy retorna { success: true/false, data: ... } ou erro direto
      if (!data) {
        throw new Error("Resposta vazia do n8n");
      }

      const responseTime = Date.now() - startTime;

      // Função robusta para extrair texto de diferentes formatos de resposta
      const extractTextFromResponse = (rawData: any): string => {
        console.log("[CopywritingN8N] ===== EXTRACTION START =====");
        console.log("[CopywritingN8N] Type:", typeof rawData);
        
        if (!rawData) {
          console.log("[CopywritingN8N] Empty data");
          return '';
        }
        
        const dataStr = typeof rawData === 'string' ? rawData : JSON.stringify(rawData);
        console.log("[CopywritingN8N] String preview:", dataStr.substring(0, 400));
        
        // ESTRATÉGIA 1: Se já é um objeto parseado com content.parts
        if (typeof rawData === 'object' && !Array.isArray(rawData)) {
          if (rawData?.content?.parts?.[0]?.text) {
            console.log("[CopywritingN8N] ✅ Found parsed content.parts[0].text");
            return rawData.content.parts[0].text;
          }
        }
        
        // ESTRATÉGIA 2: Tentar JSON.parse normal
        if (typeof rawData === 'string') {
          try {
            const parsed = JSON.parse(rawData);
            if (parsed?.content?.parts?.[0]?.text) {
              console.log("[CopywritingN8N] ✅ Parsed JSON and found text");
              return parsed.content.parts[0].text;
            }
          } catch {
            console.log("[CopywritingN8N] JSON.parse failed, trying manual extraction");
          }
        }
        
        // Função auxiliar para limpar texto extraído
        const cleanExtractedText = (text: string): string => {
          return text
            // Barras triplas escapadas
            .replace(/\\\\\\n/g, '\n')
            // Barras duplas escapadas
            .replace(/\\\\n/g, '\n')
            // Barras simples
            .replace(/\\n/g, '\n')
            // Outras escapes
            .replace(/\\"/g, '"')
            .replace(/\\'/g, "'")
            .replace(/\\\\/g, '\\')
            .replace(/\\t/g, '  ')
            .replace(/\\r/g, '')
            // Remover chaves e brackets extras no final
            .replace(/}+$/, '')
            .replace(/\]+$/, '')
            .trim();
        };

        // ESTRATÉGIA 3: Parse manual para {content:{parts:[{text:"..."}]}}
        // O formato do N8N é: {content:{parts:[{text:CONTEUDO}],role:model},...}
        // Buscar texto entre "text:" e o próximo "},role:" ou "}],role:"
        const textMatch = dataStr.match(/text:\s*([^]*?)(?:},\s*role:|}\s*],\s*role:|,\s*role:model)/);
        
        if (textMatch && textMatch[1]) {
          let extracted = textMatch[1].trim();
          // Remover aspas do início/fim se existirem
          if (extracted.startsWith('"') || extracted.startsWith("'")) {
            extracted = extracted.slice(1);
          }
          if (extracted.endsWith('"') || extracted.endsWith("'")) {
            extracted = extracted.slice(0, -1);
          }
          
          extracted = cleanExtractedText(extracted);
          
          if (extracted.includes('####') || extracted.includes('Título')) {
            console.log("[CopywritingN8N] ✅ Manual extraction successful, length:", extracted.length);
            return extracted;
          }
        }
        
        // ESTRATÉGIA 4: Buscar qualquer coisa que pareça markdown de copywriting
        const markdownPattern = /(####\s*\d+\.[\s\S]+)/;
        const markdownMatch = dataStr.match(markdownPattern);
        
        if (markdownMatch && markdownMatch[1]) {
          let extracted = markdownMatch[1]
            .replace(/}+,?\s*role:model.*$/s, '')
            .replace(/}\s*],?\s*finishReason.*$/s, '');
          
          extracted = cleanExtractedText(extracted);
          
          console.log("[CopywritingN8N] ✅ Markdown pattern found, length:", extracted.length);
          return extracted;
        }
        
        // ESTRATÉGIA 5: Última tentativa - extrair tudo entre primeiro #### e final
        const firstMarkdown = dataStr.indexOf('####');
        if (firstMarkdown >= 0) {
          // Buscar onde termina o texto (antes de }] ou role:model ou final)
          let endPos = dataStr.length;
          const endPatterns = ['}],role:', '},role:', '}]', 'finishReason'];
          for (const pattern of endPatterns) {
            const pos = dataStr.indexOf(pattern, firstMarkdown);
            if (pos > firstMarkdown && pos < endPos) {
              endPos = pos;
            }
          }
          
          let extracted = dataStr.substring(firstMarkdown, endPos);
          extracted = cleanExtractedText(extracted);
          
          if (extracted.length > 50) {
            console.log("[CopywritingN8N] ✅ Extracted by position, length:", extracted.length);
            return extracted;
          }
        }
        
        console.log("[CopywritingN8N] ❌ FAILED - No text extracted");
        return '';
      };

      const copywriting = extractTextFromResponse(data);
      
      if (!copywriting) {
        console.error("[CopywritingN8N] Could not extract text from:", data);
        throw new Error("Não foi possível extrair o texto da resposta. Verifique o formato no N8N.");
      }

      setResult(copywriting);
      setStats({
        responseTime,
        tokensUsed: data.tokens_used || data.tokensUsed || 0,
        apiUsed: data.usedAPI || data.api || "n8n",
        model: data.model || "gemini-1.5-flash"
      });

      // === EXTRAÇÃO E ENVIO PARA WEBHOOK DE IMAGEM ===
      const extractDadosParaImagem = (copywritingText: string) => {
        const extractSection = (text: string, sectionNum: number): string => {
          const pattern = new RegExp(
            `####\\s*${sectionNum}\\.\\s*[^:\\n]+:?\\s*([\\s\\S]*?)(?=####\\s*\\d+\\.|$)`,
            'i'
          );
          const match = text.match(pattern);
          return match ? match[1].trim() : '';
        };

        const extractListItems = (text: string): string[] => {
          return text
            .split('\n')
            .map(line => line
              .replace(/^\d+\.\s*/, '')
              .replace(/^\*\s*/, '')
              .replace(/^-\s*/, '')
              .replace(/\*\*([^*]+)\*\*/g, '$1')
              .trim()
            )
            .filter(line => line.length > 3 && line.length < 150 && !line.startsWith('P:') && !line.startsWith('R:'));
        };

        const secao1 = extractSection(copywritingText, 1);  // Título
        const secao2 = extractSection(copywritingText, 2);  // Descrição SEO
        const secao4 = extractSection(copywritingText, 4);  // Especificações
        const secao5 = extractSection(copywritingText, 5);  // Benefícios
        const secao9 = extractSection(copywritingText, 9);  // Ambientes

        return {
          titulo_produto: secao1.split('\n')[0]?.trim() || '',
          descricao_seo: secao2.split('\n').slice(0, 3).join(' ').trim(),
          especificacoes_tecnicas: extractListItems(secao4).slice(0, 8),
          ambientes_ideais: extractListItems(secao9).slice(0, 10),
          beneficios: extractListItems(secao5).slice(0, 8),
          timestamp: new Date().toISOString()
        };
      };

      const dadosImagem = extractDadosParaImagem(copywriting);
      
      const extractedInfo = {
        titulo: dadosImagem.titulo_produto,
        descricao_seo: dadosImagem.descricao_seo.length > 0,
        specs: dadosImagem.especificacoes_tecnicas.length,
        ambientes: dadosImagem.ambientes_ideais.length,
        beneficios: dadosImagem.beneficios.length
      };
      
      console.log("[CopywritingN8N] 📦 Dados extraídos para imagem:", extractedInfo);

      // Salvar no localStorage para uso pelo Gemini Generator
      const productKey = product.name.replace(/\s+/g, '_').toLowerCase();
      localStorage.setItem(`gemini_context_${productKey}`, JSON.stringify(dadosImagem));
      console.log("[CopywritingN8N] 💾 Dados salvos no localStorage:", productKey);

      // Consolidar todos os dados em uma única string para facilitar mapeamento no n8n
      const dadosCompletos = [
        `Título: ${dadosImagem.titulo_produto}`,
        `Descrição SEO: ${dadosImagem.descricao_seo}`,
        `Especificações: ${dadosImagem.especificacoes_tecnicas.join(', ')}`,
        `Ambientes Ideais: ${dadosImagem.ambientes_ideais.join(', ')}`,
        `Benefícios: ${dadosImagem.beneficios.join(', ')}`
      ].join(' | ');

      // Criar payload para webhook de imagem (estrutura simplificada)
      const imagePayload = {
        request_id: `copy_img_${Date.now()}`,
        source: 'copywriting_profissional_n8n',
        product_name: product.name,
        user_id: userId,
        dados_completos: dadosCompletos,
        timestamp: new Date().toISOString()
      };

      // Atualizar estado inicial do webhook
      setImageWebhookStatus({
        status: "idle",
        attemptedAt: null,
        httpStatus: null,
        responseText: null,
        errorMessage: null,
        payload: imagePayload,
        extractedData: extractedInfo,
        currentAttempt: 0,
        maxAttempts: MAX_RETRY_ATTEMPTS,
        nextRetryAt: null
      });

      // Enviar para webhook de imagem (fire-and-forget, não bloqueia o copywriting)
      sendToImageWebhook(imagePayload, extractedInfo, 1);

      toast.success("Copywriting gerado com sucesso!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      toast.error(`Falha: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Função separada para enviar ao webhook de imagem (permite reenvio)
  // ✅ SEMPRE envia, mesmo sem dados extraídos (n8n decide o que fazer)
  // ✅ Retry automático com backoff exponencial
  const sendToImageWebhook = useCallback(async (
    payload: any, 
    extractedInfo: { titulo: string; descricao_seo: boolean; specs: number; ambientes: number; beneficios: number },
    attempt: number = 1
  ) => {
    console.log("[CopywritingN8N] ========================================");
    console.log(`[CopywritingN8N] 🔄 TENTATIVA ${attempt}/${MAX_RETRY_ATTEMPTS} - WEBHOOK IMAGEM`);
    console.log("[CopywritingN8N] URL:", webhookImageUrl);
    console.log("[CopywritingN8N] ========================================");

    // Limpar qualquer timer anterior
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Validar URL - se não tem, erro mas copy já foi processada
    if (!webhookImageUrl) {
      console.error("[CopywritingN8N] ❌ URL do webhook de imagem não configurada!");
      setImageWebhookStatus(prev => ({
        ...prev,
        status: "error",
        errorMessage: "⚠️ URL do webhook de imagem não configurada! Configure abaixo.",
        attemptedAt: new Date().toISOString(),
        currentAttempt: attempt,
        nextRetryAt: null
      }));
      toast.error("Configure a URL do webhook de imagem para completar o fluxo!");
      return;
    }

    // ✅ REMOVER verificação que impedia envio - SEMPRE ENVIAR
    // Apenas adicionar flag se dados estão vazios para n8n saber
    if (!payload.dados_imagem?.titulo_produto && payload.dados_imagem?.beneficios?.length === 0) {
      console.warn("[CopywritingN8N] ⚠️ Enviando mesmo sem dados extraídos (dados_vazio=true)");
      payload.dados_vazio = true;
    } else {
      payload.dados_vazio = false;
    }

    // Atualizar status para "enviando" ou "retrying"
    setImageWebhookStatus(prev => ({
      ...prev,
      status: attempt === 1 ? "sending" : "retrying",
      attemptedAt: new Date().toISOString(),
      httpStatus: null,
      responseText: null,
      errorMessage: null,
      payload,
      extractedData: extractedInfo,
      currentAttempt: attempt,
      nextRetryAt: null
    }));

    console.log("[CopywritingN8N] 📤 Enviando para webhook de imagem:", webhookImageUrl);
    console.log("[CopywritingN8N] 📦 Payload completo:", JSON.stringify(payload, null, 2));

    let shouldRetry = false;
    let errorForRetry = "";

    try {
      // Usar n8n-proxy para o webhook de imagem também
      const { data: imageResponseData, error: imageError } = await supabase.functions.invoke("n8n-proxy", {
        body: {
          webhookUrl: webhookImageUrl,
          payload: payload
        }
      });
      
      let httpStatus = 200;
      let responseText = "";
      
      if (imageError) {
        httpStatus = 500;
        responseText = imageError.message;
        throw new Error(imageError.message);
      }
      
      // Se sucesso
      console.log("[CopywritingN8N] ✅ Webhook 2 (dadosImagem) SUCESSO!", imageResponseData);
      responseText = JSON.stringify(imageResponseData).substring(0, 500);

      console.log("[CopywritingN8N] 📡 Resposta HTTP:", httpStatus, responseText.substring(0, 200));

      setImageWebhookStatus(prev => ({
        ...prev,
        status: "success",
        httpStatus,
        responseText: responseText,
        currentAttempt: attempt,
        nextRetryAt: null
      }));
      toast.success(`Webhook de imagem: sucesso! ${extractedInfo.ambientes} ambientes, ${extractedInfo.beneficios} benefícios.`);

      // Erros serão capturados pelo catch abaixo
    } catch (networkErr) {
      const errorMsg = networkErr instanceof Error ? networkErr.message : String(networkErr);
      console.error("[CopywritingN8N] ❌ Erro ao enviar:", errorMsg);
      
      shouldRetry = true;
      errorForRetry = `Erro: ${errorMsg}`;
      
      if (webhookImageUrl.includes('/webhook-test/')) {
        errorForRetry += " (Verifique se o workflow de teste está ativo)";
      }
      
      setImageWebhookStatus(prev => ({
        ...prev,
        status: "error",
        httpStatus: 500,
        responseText: errorMsg,
        errorMessage: errorForRetry,
        currentAttempt: attempt
      }));
    }

    // ✅ RETRY AUTOMÁTICO
    if (shouldRetry && attempt < MAX_RETRY_ATTEMPTS) {
      const nextDelay = RETRY_DELAYS[attempt - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
      const nextRetryTime = new Date(Date.now() + nextDelay).toISOString();
      
      console.log(`[CopywritingN8N] 🔄 Agendando retry ${attempt + 1}/${MAX_RETRY_ATTEMPTS} em ${nextDelay / 1000}s...`);
      
      setImageWebhookStatus(prev => ({
        ...prev,
        status: "retrying",
        errorMessage: `${errorForRetry} — Tentativa ${attempt}/${MAX_RETRY_ATTEMPTS}. Reenviando em ${nextDelay / 1000}s...`,
        nextRetryAt: nextRetryTime
      }));

      retryTimeoutRef.current = setTimeout(() => {
        sendToImageWebhook(payload, extractedInfo, attempt + 1);
      }, nextDelay);
    } else if (shouldRetry && attempt >= MAX_RETRY_ATTEMPTS) {
      console.error(`[CopywritingN8N] ❌ Falhou após ${MAX_RETRY_ATTEMPTS} tentativas.`);
      setImageWebhookStatus(prev => ({
        ...prev,
        status: "error",
        errorMessage: `${errorForRetry} — Falhou após ${MAX_RETRY_ATTEMPTS} tentativas. Use o botão "Reenviar" para tentar novamente.`,
        nextRetryAt: null
      }));
      toast.error(`Webhook imagem falhou após ${MAX_RETRY_ATTEMPTS} tentativas.`);
    }

    console.log("[CopywritingN8N] ========================================");
    console.log("[CopywritingN8N] ✅ FLUXO WEBHOOK IMAGEM FINALIZADO");
    console.log("[CopywritingN8N] ========================================");
  }, [webhookImageUrl]);

  // Função para reenviar ao webhook (reset para attempt 1)
  const resendToImageWebhook = () => {
    // Limpar timer de retry pendente
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    if (imageWebhookStatus.payload && imageWebhookStatus.extractedData) {
      sendToImageWebhook(imageWebhookStatus.payload, imageWebhookStatus.extractedData, 1);
    } else {
      toast.error("Nenhum payload disponível para reenvio. Gere a copywriting primeiro.");
    }
  };

  // Função para alternar entre webhook-test e webhook (prod)
  const toggleWebhookMode = () => {
    if (webhookImageUrl.includes('/webhook-test/')) {
      const prodUrl = webhookImageUrl.replace('/webhook-test/', '/webhook/');
      setWebhookImageUrl(prodUrl);
      localStorage.setItem("copywriting_n8n_webhook_image_url", prodUrl);
      toast.info("Alterado para modo PRODUÇÃO (/webhook/)");
    } else if (webhookImageUrl.includes('/webhook/')) {
      const testUrl = webhookImageUrl.replace('/webhook/', '/webhook-test/');
      setWebhookImageUrl(testUrl);
      localStorage.setItem("copywriting_n8n_webhook_image_url", testUrl);
      toast.info("Alterado para modo TESTE (/webhook-test/)");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Falha ao copiar");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold">Copywriting Profissional via N8N</h1>
            <p className="text-muted-foreground text-sm">
              Gera copywriting completo com 10 tópicos profissionais
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {userEmail && (
            <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-200">
              <User className="h-3 w-3" />
              {userEmail}
            </Badge>
          )}
          <Badge variant="outline" className="gap-1 bg-purple-50 text-purple-700 border-purple-200">
            <Settings className="h-3 w-3" />
            10 Tópicos Completos
          </Badge>
        </div>
      </div>

      {/* Inputs Section - 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Webhook URL */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Configuração N8N
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="webhook">URL do Webhook Copywriting</Label>
              <Input
                id="webhook"
                placeholder="https://seu-n8n.app/webhook/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="webhookImage">Webhook Dados Imagem</Label>
              <Input
                id="webhookImage"
                placeholder="https://n8n.visualvendas.cloud/webhook-test/dadosImagem"
                value={webhookImageUrl}
                onChange={(e) => {
                  setWebhookImageUrl(e.target.value);
                  localStorage.setItem("copywriting_n8n_webhook_image_url", e.target.value);
                }}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Envia automaticamente: ambientes e benefícios extraídos
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Product Info */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Dados do Produto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input
                id="name"
                placeholder="Ex: Kit Organizador de Maquiagem"
                value={product.name}
                onChange={(e) => setProduct(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="short">Descrição *</Label>
              <Textarea
                id="short"
                placeholder="Descrição do produto com características, benefícios..."
                rows={4}
                value={product.shortDescription}
                onChange={(e) => setProduct(p => ({ ...p, shortDescription: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="image">URL da Imagem (opcional)</Label>
              <Input
                id="image"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payload Preview & Execute Button */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Collapsible open={showPayload} onOpenChange={setShowPayload} className="flex-1">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              Ver Payload JSON
              <ChevronDown className={`h-4 w-4 transition-transform ${showPayload ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-48">
              {JSON.stringify(generatePayload(), null, 2)}
            </pre>
          </CollapsibleContent>
        </Collapsible>

        <Button 
          onClick={executeCopywriting} 
          disabled={isLoading || !webhookUrl || !product.name}
          className="bg-purple-600 hover:bg-purple-700 sm:w-auto w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Gerando Copywriting...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Gerar Copywriting Profissional
            </>
          )}
        </Button>
      </div>

      {/* Results Section - Full Width Below */}
      {/* Stats Card */}
      {stats && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-3">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-green-600" />
                <span>{(stats.responseTime / 1000).toFixed(2)}s</span>
              </div>
              <Badge variant="secondary">{stats.apiUsed}</Badge>
              <Badge variant="outline">{stats.model}</Badge>
              {stats.tokensUsed > 0 && (
                <span className="text-muted-foreground">{stats.tokensUsed} tokens</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Card */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webhook de Imagem Status Card - Visibilidade Total */}
      {(imageWebhookStatus.status !== "idle" || imageWebhookStatus.extractedData) && (
        <Card className={`border ${
          imageWebhookStatus.status === "success" ? "border-green-300 bg-green-50" :
          imageWebhookStatus.status === "error" ? "border-red-300 bg-red-50" :
          imageWebhookStatus.status === "sending" || imageWebhookStatus.status === "retrying" ? "border-blue-300 bg-blue-50" :
          "border-muted"
        }`}>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Status do Webhook de Imagem
                {(imageWebhookStatus.status === "sending" || imageWebhookStatus.status === "retrying") && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                )}
                {imageWebhookStatus.status === "retrying" && (
                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                    Tentativa {imageWebhookStatus.currentAttempt}/{imageWebhookStatus.maxAttempts}
                  </Badge>
                )}
                {imageWebhookStatus.status === "success" && (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}
                {imageWebhookStatus.status === "error" && (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="flex items-center gap-2">
                {webhookImageUrl.includes('/webhook-test/') && (
                  <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Modo Teste
                  </Badge>
                )}
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={toggleWebhookMode}
                  className="h-7 text-xs"
                >
                  {webhookImageUrl.includes('/webhook-test/') ? "Usar Produção" : "Usar Teste"}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* URL do webhook */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">URL:</span>
              <code className="bg-muted px-2 py-1 rounded text-xs flex-1 truncate">
                {webhookImageUrl || "(não configurado)"}
              </code>
            </div>

            {/* Dados extraídos */}
            {imageWebhookStatus.extractedData && (
              <div className="space-y-2 text-xs">
                <div className="bg-background p-2 rounded border">
                  <span className="text-muted-foreground">📦 Título:</span>
                  <p className="font-medium truncate" title={imageWebhookStatus.extractedData.titulo}>
                    {imageWebhookStatus.extractedData.titulo || "(vazio)"}
                  </p>
                </div>
                <div className="bg-background p-2 rounded border">
                  <span className="text-muted-foreground">🔍 Descrição SEO:</span>
                  <p className="font-medium">{imageWebhookStatus.extractedData.descricao_seo ? '✅' : '❌'}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-background p-2 rounded border">
                    <span className="text-muted-foreground">📋 Specs:</span>
                    <p className="font-medium">{imageWebhookStatus.extractedData.specs}</p>
                  </div>
                  <div className="bg-background p-2 rounded border">
                    <span className="text-muted-foreground">💡 Ambientes:</span>
                    <p className="font-medium">{imageWebhookStatus.extractedData.ambientes}</p>
                  </div>
                  <div className="bg-background p-2 rounded border">
                    <span className="text-muted-foreground">✨ Benefícios:</span>
                    <p className="font-medium">{imageWebhookStatus.extractedData.beneficios}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Status do envio */}
            <div className="flex items-center justify-between">
              <div className="text-xs space-y-1">
                {imageWebhookStatus.attemptedAt && (
                  <p className="text-muted-foreground">
                    Última tentativa: {new Date(imageWebhookStatus.attemptedAt).toLocaleTimeString()}
                    {imageWebhookStatus.currentAttempt > 0 && (
                      <span className="ml-2">
                        ({imageWebhookStatus.currentAttempt}/{imageWebhookStatus.maxAttempts})
                      </span>
                    )}
                  </p>
                )}
                {imageWebhookStatus.httpStatus && (
                  <p>
                    <span className="text-muted-foreground">HTTP Status:</span>{" "}
                    <Badge variant={imageWebhookStatus.httpStatus < 300 ? "default" : "destructive"} className="text-xs">
                      {imageWebhookStatus.httpStatus}
                    </Badge>
                  </p>
                )}
                {imageWebhookStatus.errorMessage && (
                  <p className="text-red-600 font-medium">{imageWebhookStatus.errorMessage}</p>
                )}
                {imageWebhookStatus.status === "retrying" && imageWebhookStatus.nextRetryAt && (
                  <p className="text-blue-600 font-medium flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Reenviando automaticamente...
                  </p>
                )}
                {imageWebhookStatus.status === "success" && (
                  <p className="text-green-600 font-medium">✅ Enviado com sucesso!</p>
                )}
              </div>
              
              {/* Botão de reenvio */}
              <Button
                size="sm"
                variant={imageWebhookStatus.status === "error" ? "default" : "outline"}
                onClick={resendToImageWebhook}
                disabled={imageWebhookStatus.status === "sending" || imageWebhookStatus.status === "retrying" || !imageWebhookStatus.payload}
                className="gap-1"
              >
                <RefreshCw className={`h-4 w-4 ${(imageWebhookStatus.status === "sending" || imageWebhookStatus.status === "retrying") ? "animate-spin" : ""}`} />
                {imageWebhookStatus.status === "retrying" ? "Reenviando..." : "Reenviar"}
              </Button>
            </div>

            {/* Aviso para webhook-test */}
            {webhookImageUrl.includes('/webhook-test/') && (
              <div className="bg-yellow-100 border border-yellow-300 rounded p-2 text-xs text-yellow-800">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                <strong>Atenção:</strong> Para receber no modo TESTE, o workflow no n8n precisa estar com 
                "Listen for test event" ativo. Caso contrário, use o modo Produção.
              </div>
            )}

            {/* Response text (debug) */}
            {imageWebhookStatus.responseText && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs w-full justify-between">
                    Ver resposta do webhook
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-24 mt-1">
                    {imageWebhookStatus.responseText}
                  </pre>
                </CollapsibleContent>
              </Collapsible>
            )}
          </CardContent>
        </Card>
      )}

      {/* Result Card - Full Width */}
      {result ? (
        <Card className="border rounded-lg overflow-hidden">
          <CardHeader className="py-3 bg-muted/30 border-b">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              🤖 Resultado IA - Copywriting Profissional
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 p-4 rounded-md">
              {/* AI Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-600" />
                  <span className="text-base font-medium text-purple-800">🤖 Resultado IA</span>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 px-3 text-purple-600 hover:text-purple-800 hover:bg-purple-100"
                  onClick={() => copyToClipboard(result)}
                >
                  {copied ? (
                    <><Check className="h-4 w-4 mr-1" /> Copiado</>
                  ) : (
                    <><Copy className="h-4 w-4 mr-1" /> Copiar</>
                  )}
                </Button>
              </div>
              
              {/* Formatted Content - Full Width */}
              <div className="bg-white border border-purple-300 p-6 rounded-lg">
                <CopywritingFormatter copywriting={result} />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>O copywriting gerado aparecerá aqui</p>
              <p className="text-xs mt-1">Configure o webhook e clique em gerar</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CopywritingProfissionalN8N;
