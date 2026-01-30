import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Brain, TrendingUp, Filter, Cpu, Zap, ExternalLink, Info, Hash } from "lucide-react";
import { useAICosts, API_PRICING_REFERENCE } from "@/hooks/useAICosts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const AICosts = () => {
  const { 
    logs, 
    totals, 
    isLoading,
    selectedProvider,
    setSelectedProvider,
    selectedFunction,
    setSelectedFunction,
    providers,
    functions,
    pricingReference
  } = useAICosts();

  const getProviderLabel = (provider: string) => {
    switch (provider?.toLowerCase()) {
      case 'gemini': return 'Gemini';
      case 'openai': return 'OpenAI';
      default: return provider || 'N/A';
    }
  };

  const getProviderBadgeClass = (provider: string) => {
    switch (provider?.toLowerCase()) {
      case 'gemini': return 'border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950';
      case 'openai': return 'border-green-500 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950';
      default: return 'border-muted-foreground';
    }
  };

  const getFunctionLabel = (func: string) => {
    switch (func) {
      case 'unified-commands': return 'Comandos IA';
      case 'gemini-carousel': return 'Carrossel';
      case 'generate-marketing-image': return 'Marketing';
      case 'openai-copywriting': return 'Copywriting';
      default: return func || 'N/A';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Brain className="h-8 w-8 text-primary" />
          Custos de APIs de IA
        </h1>
        <p className="text-muted-foreground">
          Acompanhe os gastos reais com Gemini e OpenAI baseados nos preços oficiais
        </p>
      </div>

      {/* Referência de Preços Oficiais */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            Referência de Preços Oficiais (por 1M tokens)
          </CardTitle>
          <CardDescription>
            Preços atualizados conforme documentação oficial • Taxa USD→BRL: R$ {pricingReference.usdToBrl}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gemini Pricing */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="border-blue-500 text-blue-700 dark:text-blue-400">
                  <Zap className="h-3 w-3 mr-1" />
                  Google Gemini
                </Badge>
                <a 
                  href="https://ai.google.dev/pricing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  Docs <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Modelo</TableHead>
                    <TableHead className="text-xs text-right">Input</TableHead>
                    <TableHead className="text-xs text-right">Output</TableHead>
                    <TableHead className="text-xs text-right">Imagem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricingReference.gemini.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-xs font-medium">{item.model}</TableCell>
                      <TableCell className="text-xs text-right">${item.input.toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-right">${item.output.toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-right">
                        {item.image ? `$${item.image.toFixed(3)}` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* OpenAI Pricing */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-400">
                  <Cpu className="h-3 w-3 mr-1" />
                  OpenAI
                </Badge>
                <a 
                  href="https://openai.com/api/pricing/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  Docs <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Modelo</TableHead>
                    <TableHead className="text-xs text-right">Input</TableHead>
                    <TableHead className="text-xs text-right">Output</TableHead>
                    <TableHead className="text-xs text-right">Imagem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricingReference.openai.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-xs font-medium">{item.model}</TableCell>
                      <TableCell className="text-xs text-right">${item.input.toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-right">${item.output.toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-right">-</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Provider</label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os providers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os providers</SelectItem>
                  {providers.map(provider => (
                    <SelectItem key={provider} value={provider}>
                      {getProviderLabel(provider)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Função</label>
              <Select value={selectedFunction} onValueChange={setSelectedFunction}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as funções" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as funções</SelectItem>
                  {functions.map(func => (
                    <SelectItem key={func} value={func}>
                      {getFunctionLabel(func)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <DollarSign className="h-4 w-4" />
              Total Gasto R$
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-700 dark:text-green-400">
              R$ {totals.totalCostBRL.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <DollarSign className="h-4 w-4" />
              Total Gasto USD
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
              $ {totals.totalCostUSD.toFixed(4)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
              <Hash className="h-4 w-4" />
              Total Requisições
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">
              {totals.totalRequests.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <TrendingUp className="h-4 w-4" />
              Total Tokens
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">
              {totals.totalTokens.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards por Provider */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-blue-600" />
              Google Gemini
            </CardTitle>
            <CardDescription>Modelos de IA do Google</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Requisições:</span>
              <span className="font-semibold">{totals.byProvider.gemini.requests}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Tokens:</span>
              <span className="font-semibold">{totals.byProvider.gemini.tokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Custo:</span>
              <span className="font-semibold text-blue-600">
                R$ {totals.byProvider.gemini.costBRL.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Cpu className="h-5 w-5 text-green-600" />
              OpenAI
            </CardTitle>
            <CardDescription>GPT e modelos OpenAI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Requisições:</span>
              <span className="font-semibold">{totals.byProvider.openai.requests}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Tokens:</span>
              <span className="font-semibold">{totals.byProvider.openai.tokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Custo:</span>
              <span className="font-semibold text-green-600">
                R$ {totals.byProvider.openai.costBRL.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards por Modelo */}
      {Object.keys(totals.byModel).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Custos por Modelo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(totals.byModel)
              .sort((a, b) => b[1].costBRL - a[1].costBRL)
              .map(([modelName, data]) => (
              <Card key={modelName}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium truncate flex items-center gap-2" title={modelName}>
                    {modelName.includes('gemini') ? (
                      <Zap className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Cpu className="h-4 w-4 text-green-500" />
                    )}
                    {modelName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Requisições:</span>
                    <span className="font-semibold">{data.requests}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Tokens:</span>
                    <span className="font-semibold">{data.tokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Custo:</span>
                    <span className="font-semibold">R$ {data.costBRL.toFixed(4)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Chamadas</CardTitle>
          <CardDescription>
            Detalhes de cada chamada às APIs de IA com custos calculados pelos preços oficiais
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs && logs.length > 0 ? (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead className="text-center">Tokens</TableHead>
                    <TableHead className="text-right">R$</TableHead>
                    <TableHead className="text-right">USD</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getProviderBadgeClass(log.api_provider)}>
                          {getProviderLabel(log.api_provider)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate text-muted-foreground" title={log.model_used || 'N/A'}>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                {log.model_used || 'N/A'}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{log.model_used}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getFunctionLabel(log.function_name)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {log.total_tokens?.toLocaleString() || 0}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        R$ {(log.estimated_cost_brl || 0).toFixed(4)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        $ {(log.estimated_cost_usd || 0).toFixed(6)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Brain className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Nenhuma chamada encontrada</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedProvider !== 'all' || selectedFunction !== 'all' 
                  ? 'Nenhum registro encontrado com os filtros selecionados'
                  : 'Use as funcionalidades de IA para ver os custos aqui'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legenda de Cálculo */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium">Como os custos são calculados:</p>
              <p>• <strong>Tokens de texto:</strong> (tokens / 1.000.000) × preço por 1M tokens</p>
              <p>• <strong>Imagens geradas:</strong> quantidade × preço fixo por imagem</p>
              <p>• <strong>Conversão:</strong> USD × {pricingReference.usdToBrl} = BRL</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AICosts;
