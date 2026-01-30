import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useUnifiedCommands } from "./hooks/useUnifiedCommands";

interface UnifiedAIResponse {
  topicos_conversao: { improvedText: string; keywords: string[] } | null;
  palavras_chave_seo: { improvedText: string; keywords: string[] } | null;
  perguntas_respostas: { improvedText: string; keywords: string[] } | null;
  kits_criativos: { improvedText: string; keywords: string[] } | null;
  errors?: {
    gemini: string | null;
    openai: string | null;
  };
}

interface EnhancementCardProps {
  type: 'short';
  title: string;
  originalText: string;
  icon: React.ReactNode;
  description: string;
  buttonText: string;
  productName: string;
  shortDescription: string;
  onUpdateDescription: (type: 'short' | 'long' | 'name', value: string) => void;
  onEnhancementComplete?: () => void;
}

export const EnhancementCard = ({ 
  type, 
  title, 
  originalText, 
  icon,
  description,
  buttonText,
  productName,
  shortDescription,
  onUpdateDescription,
  onEnhancementComplete
}: EnhancementCardProps) => {
  const [unifiedResults, setUnifiedResults] = useState<UnifiedAIResponse | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [lastUsedAPI, setLastUsedAPI] = useState<string>('');
  
  const { 
    isLoadingGemini, 
    isLoadingOpenAI, 
    generateUnifiedCommands 
  } = useUnifiedCommands();

  const handleGenerateUnifiedCommands = async (selectedAPI: 'gemini' | 'openai') => {
    setUnifiedResults(null);
    setShowResults(false);

    console.log(`🚀 [EnhancementCard] Iniciando geração com ${selectedAPI.toUpperCase()}...`);

    generateUnifiedCommands(
      productName,
      shortDescription,
      selectedAPI,
      (results) => {
        console.log(`✅ [EnhancementCard] Resultados recebidos:`, results);
        setUnifiedResults(results as UnifiedAIResponse);
        setShowResults(true);
        setLastUsedAPI(selectedAPI);
        
        const successCount = [
          results.topicos_conversao,
          results.palavras_chave_seo, 
          results.perguntas_respostas,
          results.kits_criativos
        ].filter(Boolean).length;

        if (successCount > 0) {
          onEnhancementComplete?.();
        }
      }
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Texto copiado para a área de transferência!');
  };

  const applyTopicosConversao = () => {
    if (unifiedResults?.topicos_conversao) {
      onUpdateDescription('short', unifiedResults.topicos_conversao.improvedText);
      toast.success('Tópicos de Conversão aplicados com sucesso!');
    }
  };

  const commandLabels = {
    topicos_conversao: { label: 'Tópicos de Conversão', number: '1', icon: '🎯' },
    palavras_chave_seo: { label: 'Palavras-chave e Sugestões de Nomes SEO', number: '2', icon: '🔍' },
    perguntas_respostas: { label: 'Perguntas & Respostas', number: '3', icon: '❓' },
    kits_criativos: { label: 'Kits Criativos e Estratégias de Venda', number: '4', icon: '🎨' }
  };

  const isAnyLoading = isLoadingGemini || isLoadingOpenAI;
  const isDisabled = isAnyLoading || !originalText.trim();

  return (
    <Card className="border-2 hover:border-primary/20 transition-colors">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Melhoria com IA - Comando Unificado</span>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleGenerateUnifiedCommands('gemini')}
              disabled={isDisabled}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs"
            >
              {isLoadingGemini ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  🤖 Gerar Gemini
                </>
              )}
            </Button>
            
            <Button
              size="sm"
              onClick={() => handleGenerateUnifiedCommands('openai')}
              disabled={isDisabled}
              className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white text-xs"
            >
              {isLoadingOpenAI ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  🧠 Gerar OpenAI
                </>
              )}
            </Button>
          </div>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Seção de Benefícios */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200 p-6">
          {/* Background decorativo */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/30 via-purple-100/30 to-pink-100/30"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-200/40 to-transparent rounded-full blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-200/40 to-transparent rounded-full blur-lg"></div>
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h4 className="text-lg font-bold text-indigo-900">
                ✨ Benefícios do Conteúdo SEO Gerado
              </h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">✓</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">Descrições otimizadas para algoritmos de busca</span>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">✓</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">Palavras-chave estratégicas para marketplaces</span>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">✓</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">FAQ para reduzir dúvidas de clientes</span>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">✓</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">Estratégias de cross-sell e upsell</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toggle de Resultados */}
        {unifiedResults && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-800">Conteúdo SEO para Marketplaces</span>
              <Badge variant="outline" className="text-xs bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300 text-blue-700">
                {lastUsedAPI === 'gemini' ? '🤖 Gerado com Gemini' : '🧠 Gerado com OpenAI'}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResults(!showResults)}
              className="text-xs border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {showResults ? 'Ocultar Resultados' : 'Mostrar Resultados'}
            </Button>
          </div>
        )}

        {/* Resultados das IAs */}
        {unifiedResults && showResults && (
          <>
            <Separator />
            <div className="border rounded-lg p-4 bg-gray-50 space-y-4 dark:bg-gray-800 dark:border-gray-600">
              {Object.entries(commandLabels).map(([commandKey, config]) => {
                const result = unifiedResults[commandKey as keyof typeof commandLabels];
                if (!result) return null;

                return (
                  <div key={commandKey} className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200 p-6">
                    {/* Background decorativo */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/30 via-purple-100/30 to-pink-100/30"></div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-200/40 to-transparent rounded-full blur-xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-200/40 to-transparent rounded-full blur-lg"></div>

                    {/* Header do Resultado */}
                    <div className="relative z-10 flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg">
                          <span className="text-white font-bold text-lg">{config.icon}</span>
                        </div>
                        <div>
                          <Badge variant="outline" className="text-xs font-mono bg-blue-50 text-blue-700 border-blue-300 mb-2">
                            {config.number}
                          </Badge>
                          <h4 className="text-lg font-bold text-indigo-900">
                            {config.label}
                          </h4>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(result.improvedText)}
                          className="text-xs bg-white/80 backdrop-blur-sm border-white/50 text-gray-700 hover:bg-white"
                        >
                          Copiar
                        </Button>
                        {commandKey === 'topicos_conversao' && (
                          <Button
                            size="sm"
                            onClick={applyTopicosConversao}
                            className="text-xs gradient-primary"
                          >
                            Aplicar
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Conteúdo do Resultado */}
                    <div className="relative z-10 bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-white/50 shadow-sm">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                        {result.improvedText}
                      </pre>
                    </div>

                    {/* Keywords */}
                    {result.keywords && result.keywords.length > 0 && (
                      <div className="relative z-10 flex flex-wrap gap-2 mt-4">
                        {result.keywords.slice(0, 8).map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs bg-white/80 backdrop-blur-sm text-gray-700">
                            {keyword}
                          </Badge>
                        ))}
                        {result.keywords.length > 8 && (
                          <Badge variant="outline" className="text-xs bg-white/80 backdrop-blur-sm border-white/50">
                            +{result.keywords.length - 8} mais
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Exibir erros se houver */}
              {unifiedResults.errors && (unifiedResults.errors.gemini || unifiedResults.errors.openai) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                  <h4 className="text-sm font-medium text-red-800">Avisos:</h4>
                  {unifiedResults.errors.gemini && (
                    <p className="text-xs text-red-600">Gemini: {unifiedResults.errors.gemini}</p>
                  )}
                  {unifiedResults.errors.openai && (
                    <p className="text-xs text-red-600">OpenAI: {unifiedResults.errors.openai}</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
