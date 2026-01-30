import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  Play,
  Copy,
  Check,
  Settings,
  FileJson,
  Clock,
  Coins,
  AlertCircle,
  ChevronDown,
  Sparkles,
  Search,
  HelpCircle,
  Palette,
  FileText,
  Loader2,
  Bot,
  RefreshCw,
  CheckCircle2,
  Send
} from "lucide-react";
import type { UnifiedAIResponse } from "@/components/product/ai-enhancer/types";

// Constantes de retry
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAYS = [2000, 4000, 8000, 15000, 30000]; // ms

interface ProductInput {
  nome: string;
  descricao_curta: string;
}

interface ExecutionStats {
  tempo_resposta_ms: number;
  tokens_utilizados?: number;
  api_utilizada?: string;
  modelo?: string;
}

interface UnifiedWebhookStatus {
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
  currentAttempt: number;
  maxAttempts: number;
  nextRetryAt: string | null;
}

export default function ComandoUnificadoN8N() {
  // Webhook URL principal
  const [webhookUrl, setWebhookUrl] = useState(() => {
    return localStorage.getItem('n8n_unified_webhook_url') || '';
  });

  // Webhook URL de tratamento
  const [webhookTrataUrl, setWebhookTrataUrl] = useState(() => {
    return localStorage.getItem('n8n_unified_trata_webhook_url') || 'https://n8n.visualvendas.cloud/webhook-test/trataunificado5';
  });

  // Produto input
  const [product, setProduct] = useState<ProductInput>({
    nome: '',
    descricao_curta: ''
  });

  // Estado de execução
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<UnifiedAIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ExecutionStats | null>(null);

  // Estado do webhook de tratamento
  const [unifiedWebhookStatus, setUnifiedWebhookStatus] = useState<UnifiedWebhookStatus>({
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

  // Ref para timeout de retry
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // UI states
  const [showPayload, setShowPayload] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Cleanup do timeout ao desmontar
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Salvar webhook URLs
  useEffect(() => {
    if (webhookUrl) {
      localStorage.setItem('n8n_unified_webhook_url', webhookUrl);
    }
  }, [webhookUrl]);

  useEffect(() => {
    if (webhookTrataUrl) {
      localStorage.setItem('n8n_unified_trata_webhook_url', webhookTrataUrl);
    }
  }, [webhookTrataUrl]);

  // Funções de extração de dados
  const extractListItems = (text: string): string[] => {
    if (!text) return [];
    const lines = text.split('\n');
    return lines
      .filter(line => /^[-•✅✨🔍🎯⚙️🔄📋💡🛒🎁💰🏆❓]\s|^\d+\.\s/.test(line.trim()))
      .map(line => line.replace(/^[-•✅✨🔍🎯⚙️🔄📋💡🛒🎁💰🏆❓]\s*/, '').replace(/^\d+\.\s*/, '').trim())
      .filter(Boolean);
  };

  const extractFAQs = (text: string): Array<{ pergunta: string; resposta: string }> => {
    if (!text) return [];
    const faqs: Array<{ pergunta: string; resposta: string }> = [];
    const matches = text.matchAll(/❓\s*(?:PERGUNTA\s*\d*:?\s*)?(.+?)\n✅\s*(?:RESPOSTA:?\s*)?(.+?)(?=❓|$)/gs);
    for (const match of matches) {
      faqs.push({ pergunta: match[1].trim(), resposta: match[2].trim() });
    }
    return faqs;
  };

  const extractSection = (text: string, sectionEmoji: string): string[] => {
    if (!text) return [];
    const regex = new RegExp(`${sectionEmoji}[^\\n]*\\n([\\s\\S]*?)(?=\\n[🔍🎯⚙️🔄📋✨💡🛒🎁💰🏆❓]|$)`, 'g');
    const match = regex.exec(text);
    if (match) {
      return extractListItems(match[1]);
    }
    return [];
  };

  // Extrair seção completa como texto (não lista)
  const extractFullSection = (text: string, sectionEmoji: string): string => {
    if (!text) return '';
    const regex = new RegExp(`${sectionEmoji}[^\\n]*\\n([\\s\\S]*?)(?=\\n[🔍🎯⚙️🔄📋✨💡🛒🎁💰🏆❓]|$)`, 'g');
    const match = regex.exec(text);
    if (match) {
      return match[1].trim();
    }
    return '';
  };

  // Extrair apenas dados relevantes para geração de imagem
  const extractDadosParaImagem = (resultsData: UnifiedAIResponse, productData: ProductInput) => {
    const topicosText = resultsData.topicos_conversao?.improvedText || '';

    return {
      titulo_produto: productData.nome || '',
      descricao_seo: extractFullSection(topicosText, '🔍'),
      especificacoes_tecnicas: extractSection(topicosText, '📋'),
      ambientes_ideais: extractSection(topicosText, '💡').slice(0, 6),
      beneficios: extractSection(topicosText, '✨').slice(0, 6),
      timestamp: new Date().toISOString()
    };
  };

  // Enviar para webhook de tratamento com retry automático
  const sendToUnifiedWebhook = async (
    resultsData: UnifiedAIResponse,
    productData: ProductInput,
    statsData: ExecutionStats,
    attempt: number = 1
  ) => {
    // Limpar timer anterior se existir
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (!webhookTrataUrl) {
      console.log("Webhook de tratamento não configurado");
      return;
    }

    // Extrair apenas dados relevantes para imagem
    const dadosImagem = extractDadosParaImagem(resultsData, productData);

    // Consolidar todos os dados em uma única string para facilitar mapeamento no n8n
    const dadosCompletos = [
      `Título: ${dadosImagem.titulo_produto}`,
      `Descrição SEO: ${dadosImagem.descricao_seo}`,
      `Especificações: ${dadosImagem.especificacoes_tecnicas.join(', ')}`,
      `Ambientes Ideais: ${dadosImagem.ambientes_ideais.join(', ')}`,
      `Benefícios: ${dadosImagem.beneficios.join(', ')}`
    ].join(' | ');

    const payload = {
      request_id: `unified_img_${Date.now()}`,
      source: "comando_unificado_n8n",
      dados_completos: dadosCompletos,
      timestamp: new Date().toISOString()
    };

    const extractedInfo = {
      titulo: dadosImagem.titulo_produto,
      descricao_seo: dadosImagem.descricao_seo.length > 0,
      specs: dadosImagem.especificacoes_tecnicas.length,
      ambientes: dadosImagem.ambientes_ideais.length,
      beneficios: dadosImagem.beneficios.length
    };

    setUnifiedWebhookStatus(prev => ({
      ...prev,
      status: attempt === 1 ? "sending" : "retrying",
      attemptedAt: new Date().toISOString(),
      payload,
      extractedData: extractedInfo,
      currentAttempt: attempt,
      nextRetryAt: null
    }));

    console.log(`[UnifiedWebhook] Tentativa ${attempt}/${MAX_RETRY_ATTEMPTS} - Enviando para:`, webhookTrataUrl);

    try {
      // Usar n8n-proxy para o webhook de tratamento
      const { data: responseData, error: proxyError } = await supabase.functions.invoke("n8n-proxy", {
        body: {
          webhookUrl: webhookTrataUrl,
          payload: payload
        }
      });

      const responseText = proxyError ? proxyError.message : "Sucesso";

      if (!proxyError) {
        setUnifiedWebhookStatus(prev => ({
          ...prev,
          status: "success",
          httpStatus: 200,
          responseText: JSON.stringify(responseData).substring(0, 500),
          errorMessage: null,
          currentAttempt: attempt,
          nextRetryAt: null
        }));
        toast.success(`Dados enviados para tratamento! (Tentativa ${attempt})`);
        console.log(`[UnifiedWebhook] Sucesso na tentativa ${attempt}`);
      } else {
        // Verificar se é erro de webhook-test não ativo
        const isTestWebhook = webhookTrataUrl.includes('/webhook-test/');
        let errorMsg = `Erro proxy: ${proxyError.message}`;

        if (isTestWebhook && proxyError.message.includes("404")) {
          errorMsg = "Workflow n8n não está em 'Listen for test event'. Ative o workflow ou use modo Produção.";
        }

        throw new Error(errorMsg);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error(`[UnifiedWebhook] Erro na tentativa ${attempt}:`, errorMessage);

      // Retry automático se ainda tiver tentativas
      if (attempt < MAX_RETRY_ATTEMPTS) {
        const delay = RETRY_DELAYS[attempt - 1] || 30000;
        const nextRetryTime = new Date(Date.now() + delay).toISOString();

        setUnifiedWebhookStatus(prev => ({
          ...prev,
          status: "retrying",
          httpStatus: null,
          errorMessage: `${errorMessage} - Tentativa ${attempt}/${MAX_RETRY_ATTEMPTS}`,
          currentAttempt: attempt,
          nextRetryAt: nextRetryTime
        }));

        console.log(`[UnifiedWebhook] Agendando retry ${attempt + 1} em ${delay}ms`);

        retryTimeoutRef.current = setTimeout(() => {
          sendToUnifiedWebhook(resultsData, productData, statsData, attempt + 1);
        }, delay);

        toast.warning(`Tentativa ${attempt} falhou. Reenviando em ${delay / 1000}s...`);
      } else {
        setUnifiedWebhookStatus(prev => ({
          ...prev,
          status: "error",
          httpStatus: null,
          errorMessage: `Falhou após ${MAX_RETRY_ATTEMPTS} tentativas: ${errorMessage}`,
          currentAttempt: attempt,
          nextRetryAt: null
        }));
        toast.error(`Webhook de tratamento falhou após ${MAX_RETRY_ATTEMPTS} tentativas`);
      }
    }
  };

  // Reenviar manualmente
  const resendToUnifiedWebhook = () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (results && stats) {
      sendToUnifiedWebhook(results, product, stats, 1);
    }
  };

  // Gerar payload
  const generatePayload = () => {
    return {
      product_name: product.nome,
      short_description: product.descricao_curta,
      long_description: product.descricao_curta,
      original_text: product.descricao_curta,
      request_id: `unified_${Date.now()}`,
      user_id: "test_user"
    };
  };

  // Executar comando unificado
  const executeUnifiedCommand = async () => {
    if (!webhookUrl) {
      toast.error("Configure a URL do webhook n8n primeiro");
      return;
    }

    if (!product.nome || !product.descricao_curta) {
      toast.error("Preencha pelo menos o nome e descrição do produto");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);
    setStats(null);
    setUnifiedWebhookStatus(prev => ({
      ...prev,
      status: "idle",
      errorMessage: null,
      extractedData: null
    }));

    const startTime = Date.now();

    try {
      const payload = generatePayload();

      // Usar supabase.functions.invoke para chamar o n8n via proxy
      const { data, error: functionError } = await supabase.functions.invoke("n8n-proxy", {
        body: {
          webhookUrl: webhookUrl,
          payload: payload
        }
      });

      const endTime = Date.now();
      const tempoResposta = endTime - startTime;

      if (functionError) {
        throw new Error(`Erro na função: ${functionError.message}`);
      }

      // O proxy retorna os dados diretamente ou dentro de 'data' se for array
      if (!data) {
        throw new Error("Resposta vazia do n8n");
      }

      // Mapear resposta para formato esperado
      const mappedResults: UnifiedAIResponse = {
        topicos_conversao: data.topicos_conversao || null,
        palavras_chave_seo: data.palavras_chave_seo || null,
        perguntas_respostas: data.perguntas_respostas || null,
        kits_criativos: data.kits_criativos || null,
        cauda_longa: data.cauda_longa || null,
        copywriting: data.copywriting || null,
        usedAPI: data.usedAPI || 'openai',
        apiInfo: data.apiInfo || 'OpenAI GPT-4o-mini via n8n'
      };

      const statsData: ExecutionStats = {
        tempo_resposta_ms: tempoResposta,
        tokens_utilizados: data.tokens_used,
        api_utilizada: data.usedAPI || 'openai',
        modelo: data.model || 'gpt-4o-mini'
      };

      setResults(mappedResults);
      setStats(statsData);

      toast.success("Comando Unificado executado com sucesso!");

      // Disparo automático para webhook de tratamento (fire-and-forget)
      sendToUnifiedWebhook(mappedResults, product, statsData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(`Erro: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Copiar para clipboard
  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      toast.success("Copiado!");
      setTimeout(() => setCopiedSection(null), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  // Renderizar lista de items
  const renderItemList = (items: string[] | undefined, title: string) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-sm text-muted-foreground">{title}</h4>
        <ul className="space-y-1">
          {items.map((item, index) => (
            <li key={index} className="text-sm bg-muted/50 p-2 rounded-md">
              {item}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Renderizar FAQs
  const renderFAQs = (faqs: Array<{ question: string; answer: string }> | undefined) => {
    if (!faqs || faqs.length === 0) return null;
    return (
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div key={index} className="border rounded-lg p-3 bg-muted/30">
            <p className="font-medium text-sm mb-1">❓ {faq.question}</p>
            <p className="text-sm text-muted-foreground">{faq.answer}</p>
          </div>
        ))}
      </div>
    );
  };

  // Processar negrito **texto**
  const processBold = (content: string) => {
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-purple-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Formatar linha individual
  const formatLine = (line: string, index: number) => {
    // Títulos com emojis (🎯, 📝, 🔍, etc.)
    if (/^[🎯📝🔍✨💡🎁🎄💰🏆❓📋🔑⚡🌟💪🛒📌🔥✅]/u.test(line.trim())) {
      return (
        <div key={index} className="mt-4 first:mt-0">
          <h3 className="font-bold text-purple-900 text-sm mb-2">
            {processBold(line.trim())}
          </h3>
        </div>
      );
    }

    // Itens de lista com - ou •
    if (/^[-•]\s/.test(line.trim())) {
      return (
        <div key={index} className="flex items-start gap-2 ml-3 py-0.5">
          <span className="text-purple-600 mt-0.5 text-xs">•</span>
          <span className="text-sm text-purple-800">{processBold(line.trim().slice(2))}</span>
        </div>
      );
    }

    // Itens numerados (1. 2. 3. etc)
    if (/^\d+\.\s/.test(line.trim())) {
      const number = line.trim().match(/^(\d+)\./)?.[1];
      const content = line.trim().replace(/^\d+\.\s*/, '');
      return (
        <div key={index} className="flex items-start gap-2 ml-3 py-0.5">
          <span className="bg-purple-200 text-purple-800 text-xs font-medium px-1.5 py-0.5 rounded shrink-0">
            {number}
          </span>
          <span className="text-sm text-purple-800">{processBold(content)}</span>
        </div>
      );
    }

    // Texto normal
    return (
      <p key={index} className="text-sm text-purple-800 py-0.5">
        {processBold(line.trim())}
      </p>
    );
  };

  // Componente de Card de Resultado no estilo premium
  const ResultSectionCard = ({
    title,
    icon,
    content,
    sectionKey
  }: {
    title: string;
    icon: React.ReactNode;
    content: string | undefined;
    sectionKey: string;
  }) => {
    if (!content) return null;

    const lines = content.split('\n').filter(line => line.trim() !== '');

    return (
      <Card className="overflow-hidden">
        <CardHeader className="py-3 bg-muted/30 border-b">
          <CardTitle className="text-sm flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 p-4 rounded-lg space-y-3">
            {/* Header IA */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Resultado IA</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 hover:bg-purple-100"
                onClick={() => copyToClipboard(content, sectionKey)}
              >
                {copiedSection === sectionKey ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3 text-purple-600" />
                )}
              </Button>
            </div>

            {/* Conteúdo formatado */}
            <div className="bg-white border border-purple-200 p-4 rounded-md">
              <div className="space-y-1">
                {lines.map((line, idx) => formatLine(line, idx))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Verificar se está em modo retry ativo
  const isRetrying = unifiedWebhookStatus.status === "retrying" && unifiedWebhookStatus.nextRetryAt;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Comando Unificado via n8n
          </h1>
          <p className="text-muted-foreground">
            Teste do workflow 5 em 1 com OpenAI GPT-4o-mini
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Settings className="h-3 w-3" />
          OpenAI
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda - Configuração e Input */}
        <div className="space-y-4">
          {/* Configuração Webhook */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuração n8n
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">URL do Webhook Principal</Label>
                <Input
                  id="webhook-url"
                  placeholder="https://seu-n8n.app/webhook/unified-commands"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Webhook que processa o Comando Unificado 5 em 1
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-trata-url" className="flex items-center gap-2">
                  <Send className="h-3 w-3" />
                  URL Webhook Tratamento
                </Label>
                <Input
                  id="webhook-trata-url"
                  placeholder="https://n8n.visualvendas.cloud/webhook-test/trataunificado5"
                  value={webhookTrataUrl}
                  onChange={(e) => setWebhookTrataUrl(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Recebe dados estruturados (benefícios, palavras-chave, FAQs, títulos) para tratamento posterior
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Produto */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Dados do Produto</CardTitle>
              <CardDescription>
                Preencha as informações do produto para gerar conteúdo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Produto *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Camiseta Básica Algodão Premium"
                  value={product.nome}
                  onChange={(e) => setProduct(prev => ({ ...prev, nome: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao_curta">Descrição *</Label>
                <Textarea
                  id="descricao_curta"
                  placeholder="Descrição do produto com especificações, benefícios, materiais..."
                  value={product.descricao_curta}
                  onChange={(e) => setProduct(prev => ({ ...prev, descricao_curta: e.target.value }))}
                  rows={5}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview do Payload */}
          <Collapsible open={showPayload} onOpenChange={setShowPayload}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileJson className="h-4 w-4" />
                      Preview do Payload
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showPayload ? 'rotate-180' : ''}`} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <div className="relative">
                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto font-mono">
                      {JSON.stringify(generatePayload(), null, 2)}
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(JSON.stringify(generatePayload(), null, 2), 'payload')}
                    >
                      {copiedSection === 'payload' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Botão Executar */}
          <Button
            className="w-full h-12 text-lg gap-2"
            onClick={executeUnifiedCommand}
            disabled={isLoading || !webhookUrl || !product.nome || !product.descricao_curta}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                Executar Comando Unificado (5 em 1)
              </>
            )}
          </Button>
        </div>

        {/* Coluna Direita - Resultados */}
        <div className="space-y-4">
          {/* Stats */}
          {stats && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      <strong>{stats.tempo_resposta_ms}ms</strong> tempo de resposta
                    </span>
                  </div>
                  {stats.tokens_utilizados && (
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-primary" />
                      <span className="text-sm">
                        <strong>{stats.tokens_utilizados}</strong> tokens
                      </span>
                    </div>
                  )}
                  <Badge variant="secondary">
                    {stats.modelo || 'gpt-4o-mini'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card de Status do Webhook de Tratamento */}
          {unifiedWebhookStatus.status !== "idle" && (
            <Card className={`border-2 ${unifiedWebhookStatus.status === "success" ? "border-green-500 bg-green-50" :
                unifiedWebhookStatus.status === "error" ? "border-red-500 bg-red-50" :
                  "border-blue-500 bg-blue-50"
              }`}>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  {unifiedWebhookStatus.status === "sending" && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                  {unifiedWebhookStatus.status === "retrying" && <RefreshCw className="h-4 w-4 animate-spin text-orange-600" />}
                  {unifiedWebhookStatus.status === "success" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  {unifiedWebhookStatus.status === "error" && <AlertCircle className="h-4 w-4 text-red-600" />}
                  <span>Webhook Tratamento</span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {unifiedWebhookStatus.status === "sending" && "Enviando..."}
                    {unifiedWebhookStatus.status === "retrying" && "Reenviando..."}
                    {unifiedWebhookStatus.status === "success" && "Enviado"}
                    {unifiedWebhookStatus.status === "error" && "Falhou"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                {/* Tentativas */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">
                    Tentativa {unifiedWebhookStatus.currentAttempt}/{unifiedWebhookStatus.maxAttempts}
                  </Badge>
                  {isRetrying && unifiedWebhookStatus.nextRetryAt && (
                    <span className="text-xs text-muted-foreground">
                      Próxima em {Math.max(0, Math.ceil((new Date(unifiedWebhookStatus.nextRetryAt).getTime() - Date.now()) / 1000))}s
                    </span>
                  )}
                </div>

                {/* Dados extraídos para imagem */}
                {unifiedWebhookStatus.extractedData && (
                  <div className="space-y-1 text-xs bg-white/50 p-2 rounded">
                    <p className="font-medium text-purple-800">📸 Dados para Imagem:</p>
                    <span className="block">📦 Título: <strong>{unifiedWebhookStatus.extractedData.titulo || 'N/A'}</strong></span>
                    <span className="block">🔍 Descrição SEO: <strong>{unifiedWebhookStatus.extractedData.descricao_seo ? '✅' : '❌'}</strong></span>
                    <div className="grid grid-cols-3 gap-2">
                      <span>📋 Specs: <strong>{unifiedWebhookStatus.extractedData.specs}</strong></span>
                      <span>💡 Ambientes: <strong>{unifiedWebhookStatus.extractedData.ambientes}</strong></span>
                      <span>✨ Benefícios: <strong>{unifiedWebhookStatus.extractedData.beneficios}</strong></span>
                    </div>
                  </div>
                )}

                {/* Mensagem de erro */}
                {unifiedWebhookStatus.errorMessage && (
                  <p className="text-red-600 text-xs bg-red-100 p-2 rounded">{unifiedWebhookStatus.errorMessage}</p>
                )}

                {/* Botão reenviar (apenas em erro ou se não estiver retrying) */}
                {(unifiedWebhookStatus.status === "error" || unifiedWebhookStatus.status === "success") && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={resendToUnifiedWebhook}
                    disabled={!!isRetrying}
                    className="gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Reenviar
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Erro */}
          {error && (
            <Card className="border-destructive bg-destructive/10">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Erro na execução</p>
                    <p className="text-sm text-muted-foreground mt-1">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resultados em Cards Premium */}
          {results && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-600" />
                Resultados do Comando Unificado
              </h2>

              <ResultSectionCard
                title="Tópicos de Conversão"
                icon={<Sparkles className="h-4 w-4 text-purple-600" />}
                content={results.topicos_conversao?.improvedText}
                sectionKey="conversao"
              />

              <ResultSectionCard
                title="Palavras-chave SEO"
                icon={<Search className="h-4 w-4 text-purple-600" />}
                content={results.palavras_chave_seo?.improvedText}
                sectionKey="seo"
              />

              <ResultSectionCard
                title="Perguntas & Respostas"
                icon={<HelpCircle className="h-4 w-4 text-purple-600" />}
                content={results.perguntas_respostas?.improvedText}
                sectionKey="faq"
              />

              <ResultSectionCard
                title="Kits Criativos"
                icon={<Palette className="h-4 w-4 text-purple-600" />}
                content={results.kits_criativos?.improvedText}
                sectionKey="criativos"
              />

              <ResultSectionCard
                title="Títulos Cauda Longa"
                icon={<FileText className="h-4 w-4 text-purple-600" />}
                content={results.cauda_longa?.improvedText}
                sectionKey="cauda"
              />
            </div>
          )}

          {/* Estado inicial */}
          {!results && !error && !isLoading && (
            <Card className="border-dashed">
              <CardContent className="py-16">
                <div className="text-center text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Aguardando execução</p>
                  <p className="text-sm mt-1">
                    Configure o webhook n8n, preencha os dados do produto e clique em Executar
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
