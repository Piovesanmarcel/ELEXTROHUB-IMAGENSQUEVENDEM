import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  Check,
  Video,
  FileText,
  Briefcase,
  BookOpen,
  Clock,
  Download,
  Crown,
  Lightbulb,
  Timer,
  Zap,
  Maximize2,
  Film,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  VIDEO_SCRIPTS,
  POST_SCRIPTS,
  LEGENDAS,
  PROJECT_MATERIALS,
  TUTORIALS,
  BRANDING_CONTENT,
  COMPARATIVO_PHOTOSHOP,
  UPSCALE_4K_CONTENT,
  VIDEO_COMPLETO_CONTENT,
  ROTEIRO_UGC_SAAS
} from '@/utils/marketingScripts';

const MarketingContent = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copiado para a área de transferência!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatScriptText = (script: typeof VIDEO_SCRIPTS.explicativo) => {
    return script.sections.map(s => `[${s.label}${s.time ? ` - ${s.time}` : ''}]\n${s.text}`).join('\n\n');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">Central de Conteúdo para Marketing</h1>
            <p className="text-sm text-muted-foreground">Roteiros, scripts e materiais prontos para divulgar</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="comparativo" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-8 gap-2 h-auto p-1">
            <TabsTrigger value="comparativo" className="flex items-center gap-2 py-3 bg-gradient-to-r from-red-500/10 to-amber-500/10 data-[state=active]:from-red-500/20 data-[state=active]:to-amber-500/20">
              <Timer className="w-4 h-4" />
              <span className="hidden sm:inline">Photoshop vs IA</span>
              <span className="sm:hidden">PS vs IA</span>
            </TabsTrigger>
            <TabsTrigger value="video-completo" className="flex items-center gap-2 py-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20">
              <Film className="w-4 h-4" />
              <span className="hidden sm:inline">Vídeo Completo</span>
              <span className="sm:hidden">Vídeo</span>
            </TabsTrigger>
            <TabsTrigger value="ugc-saas" className="flex items-center gap-2 py-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 data-[state=active]:from-orange-500/20 data-[state=active]:to-red-500/20">
              <Film className="w-4 h-4" />
              <span className="hidden sm:inline">Roteiro UGC</span>
              <span className="sm:hidden">UGC</span>
            </TabsTrigger>
            <TabsTrigger value="upscale4k" className="flex items-center gap-2 py-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20">
              <Maximize2 className="w-4 h-4" />
              <span className="hidden sm:inline">Upscale 4K</span>
              <span className="sm:hidden">4K</span>
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2 py-3">
              <Video className="w-4 h-4" />
              <span>Vídeos</span>
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-2 py-3">
              <FileText className="w-4 h-4" />
              <span>Posts</span>
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-2 py-3">
              <Crown className="w-4 h-4" />
              <span>Branding</span>
            </TabsTrigger>
            <TabsTrigger value="materiais" className="flex items-center gap-2 py-3">
              <Briefcase className="w-4 h-4" />
              <span>Materiais</span>
            </TabsTrigger>
            <TabsTrigger value="tutoriais" className="flex items-center gap-2 py-3">
              <BookOpen className="w-4 h-4" />
              <span>Tutoriais</span>
            </TabsTrigger>
          </TabsList>

          {/* NOVO: Comparativo Photoshop vs IA */}
          <TabsContent value="comparativo" className="space-y-6">
            {/* Banner de destaque */}
            <Card className="overflow-hidden border-2 border-red-500/30 bg-gradient-to-br from-red-500/5 via-amber-500/5 to-green-500/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Photoshop vs IA: O Comparativo que Vende</h2>
                    <p className="text-sm text-muted-foreground">Conteúdo de alto impacto para mostrar economia de tempo, dinheiro e o diferencial da marca automática</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center p-3 bg-red-500/10 rounded-lg">
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400">1 hora</span>
                    <p className="text-xs text-muted-foreground">Photoshop</p>
                  </div>
                  <div className="text-center p-3 bg-amber-500/10 rounded-lg">
                    <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">vs</span>
                    <p className="text-xs text-muted-foreground">Comparação</p>
                  </div>
                  <div className="text-center p-3 bg-green-500/10 rounded-lg">
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">3 seg</span>
                    <p className="text-xs text-muted-foreground">Nossa IA</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Roteiro Principal 60s */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-red-500/10 to-amber-500/10">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{COMPARATIVO_PHOTOSHOP.roteiroPrincipal.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{COMPARATIVO_PHOTOSHOP.roteiroPrincipal.title}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {COMPARATIVO_PHOTOSHOP.roteiroPrincipal.duration}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(
                      COMPARATIVO_PHOTOSHOP.roteiroPrincipal.sections.map(s => `[${s.label} - ${s.time}]\n${s.text}`).join('\n\n'),
                      COMPARATIVO_PHOTOSHOP.roteiroPrincipal.id
                    )}
                  >
                    {copiedId === COMPARATIVO_PHOTOSHOP.roteiroPrincipal.id ? (
                      <Check className="w-4 h-4 mr-1 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 mr-1" />
                    )}
                    Copiar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {COMPARATIVO_PHOTOSHOP.roteiroPrincipal.sections.map((section, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="shrink-0 w-28">
                        <Badge variant="secondary" className="text-xs font-medium">
                          {section.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground block mt-1">
                          {section.time}
                        </span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-line flex-1">
                        {section.text}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Grid: Reels + Stories */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Roteiro Reels 15s */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-pink-500/10 to-purple-500/10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{COMPARATIVO_PHOTOSHOP.roteiroReels.icon}</span>
                      <div>
                        <CardTitle className="text-lg">{COMPARATIVO_PHOTOSHOP.roteiroReels.title}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {COMPARATIVO_PHOTOSHOP.roteiroReels.duration}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(
                        COMPARATIVO_PHOTOSHOP.roteiroReels.sections.map(s => `[${s.label} - ${s.time}]\n${s.text}`).join('\n\n'),
                        COMPARATIVO_PHOTOSHOP.roteiroReels.id
                      )}
                    >
                      {copiedId === COMPARATIVO_PHOTOSHOP.roteiroReels.id ? (
                        <Check className="w-4 h-4 mr-1 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 mr-1" />
                      )}
                      Copiar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {COMPARATIVO_PHOTOSHOP.roteiroReels.sections.map((section, idx) => (
                      <div key={idx} className="flex gap-3">
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {section.label}
                        </Badge>
                        <p className="text-sm text-foreground whitespace-pre-line flex-1">
                          {section.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Stories Sequenciais */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{COMPARATIVO_PHOTOSHOP.storiesSequenciais.icon}</span>
                      <div>
                        <CardTitle className="text-lg">{COMPARATIVO_PHOTOSHOP.storiesSequenciais.title}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {COMPARATIVO_PHOTOSHOP.storiesSequenciais.duration}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(
                        COMPARATIVO_PHOTOSHOP.storiesSequenciais.sections.map(s => `[${s.label}]\n${s.text}`).join('\n\n'),
                        COMPARATIVO_PHOTOSHOP.storiesSequenciais.id
                      )}
                    >
                      {copiedId === COMPARATIVO_PHOTOSHOP.storiesSequenciais.id ? (
                        <Check className="w-4 h-4 mr-1 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 mr-1" />
                      )}
                      Copiar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {COMPARATIVO_PHOTOSHOP.storiesSequenciais.sections.map((section, idx) => (
                      <div key={idx} className="flex gap-3">
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {section.label}
                        </Badge>
                        <p className="text-sm text-foreground whitespace-pre-line flex-1">
                          {section.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Carrossel Comparativo */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{COMPARATIVO_PHOTOSHOP.carrosselComparativo.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{COMPARATIVO_PHOTOSHOP.carrosselComparativo.title}</CardTitle>
                      <CardDescription>{COMPARATIVO_PHOTOSHOP.carrosselComparativo.slides} slides</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(
                      COMPARATIVO_PHOTOSHOP.carrosselComparativo.content.join('\n\n'),
                      COMPARATIVO_PHOTOSHOP.carrosselComparativo.id
                    )}
                  >
                    {copiedId === COMPARATIVO_PHOTOSHOP.carrosselComparativo.id ? (
                      <Check className="w-4 h-4 mr-1 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 mr-1" />
                    )}
                    Copiar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {COMPARATIVO_PHOTOSHOP.carrosselComparativo.content.map((slide, idx) => (
                    <div key={idx} className="p-3 bg-muted/50 rounded-lg text-sm whitespace-pre-line">
                      {slide}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Legenda Alto Impacto */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{COMPARATIVO_PHOTOSHOP.legendaComparativo.icon}</span>
                    <CardTitle className="text-lg">{COMPARATIVO_PHOTOSHOP.legendaComparativo.title}</CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(COMPARATIVO_PHOTOSHOP.legendaComparativo.text, COMPARATIVO_PHOTOSHOP.legendaComparativo.id)}
                  >
                    {copiedId === COMPARATIVO_PHOTOSHOP.legendaComparativo.id ? (
                      <Check className="w-4 h-4 mr-1 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 mr-1" />
                    )}
                    Copiar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-line">
                  {COMPARATIVO_PHOTOSHOP.legendaComparativo.text}
                </div>
              </CardContent>
            </Card>

            {/* Tabela Comparativo + Números */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Tabela */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{COMPARATIVO_PHOTOSHOP.tabelaComparativo.icon}</span>
                      <CardTitle className="text-lg">{COMPARATIVO_PHOTOSHOP.tabelaComparativo.title}</CardTitle>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(
                        COMPARATIVO_PHOTOSHOP.tabelaComparativo.comparisons.map(c =>
                          `${c.aspecto}:\n  Photoshop: ${c.photoshop}\n  IA: ${c.ia}`
                        ).join('\n\n'),
                        COMPARATIVO_PHOTOSHOP.tabelaComparativo.id
                      )}
                    >
                      {copiedId === COMPARATIVO_PHOTOSHOP.tabelaComparativo.id ? (
                        <Check className="w-4 h-4 mr-1 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 mr-1" />
                      )}
                      Copiar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {COMPARATIVO_PHOTOSHOP.tabelaComparativo.comparisons.map((comp, idx) => (
                      <div key={idx} className="grid grid-cols-3 gap-2 text-xs p-2 rounded-lg bg-muted/50">
                        <span className="font-medium text-foreground">{comp.aspecto}</span>
                        <span className="text-red-600 dark:text-red-400">{comp.photoshop}</span>
                        <span className="text-green-600 dark:text-green-400">{comp.ia}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Números Críticos */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{COMPARATIVO_PHOTOSHOP.numerosCriticos.icon}</span>
                    <CardTitle className="text-lg">{COMPARATIVO_PHOTOSHOP.numerosCriticos.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {COMPARATIVO_PHOTOSHOP.numerosCriticos.stats.map((stat, idx) => (
                      <div key={idx} className="p-3 bg-gradient-to-br from-primary/5 to-coral/5 rounded-lg text-center">
                        <span className="text-xl font-bold text-primary">{stat.numero}</span>
                        <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* NOVO: Vídeo Completo do Sistema */}
          <TabsContent value="video-completo" className="space-y-6">
            {/* Banner de destaque */}
            <Card className="overflow-hidden border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-violet-500/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Film className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{VIDEO_COMPLETO_CONTENT.meta.title}</h2>
                    <p className="text-sm text-muted-foreground">{VIDEO_COMPLETO_CONTENT.meta.subtitle}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center p-3 bg-purple-500/10 rounded-lg">
                    <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{VIDEO_COMPLETO_CONTENT.meta.totalSegmentos}</span>
                    <p className="text-xs text-muted-foreground">Segmentos</p>
                  </div>
                  <div className="text-center p-3 bg-pink-500/10 rounded-lg">
                    <span className="text-2xl font-bold text-pink-600 dark:text-pink-400">7s</span>
                    <p className="text-xs text-muted-foreground">Por fala</p>
                  </div>
                  <div className="text-center p-3 bg-violet-500/10 rounded-lg">
                    <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">{VIDEO_COMPLETO_CONTENT.meta.duracaoTotal}</span>
                    <p className="text-xs text-muted-foreground">Duração total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botão Copiar Tudo */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const textoCompleto = VIDEO_COMPLETO_CONTENT.blocos
                    .map(bloco =>
                      `=== ${bloco.nome} ===\n\n` +
                      bloco.segmentos.map(seg => `[${seg.num}] (${seg.tempo}) ${seg.texto}`).join('\n\n')
                    )
                    .join('\n\n\n');
                  copyToClipboard(textoCompleto, 'video-completo-all');
                }}
              >
                {copiedId === 'video-completo-all' ? (
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                Copiar Roteiro Completo
              </Button>
            </div>

            {/* Blocos do Roteiro */}
            <div className="space-y-6">
              {VIDEO_COMPLETO_CONTENT.blocos.map((bloco) => {
                const corClasses: Record<string, string> = {
                  purple: 'from-purple-500/10 to-purple-500/5 border-purple-500/30',
                  red: 'from-red-500/10 to-red-500/5 border-red-500/30',
                  green: 'from-green-500/10 to-green-500/5 border-green-500/30',
                  cyan: 'from-cyan-500/10 to-cyan-500/5 border-cyan-500/30',
                  violet: 'from-violet-500/10 to-violet-500/5 border-violet-500/30',
                  orange: 'from-orange-500/10 to-orange-500/5 border-orange-500/30',
                  amber: 'from-amber-500/10 to-amber-500/5 border-amber-500/30',
                  emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/30',
                  gradient: 'from-purple-500/10 via-pink-500/5 to-orange-500/10 border-purple-500/30',
                };

                const badgeClasses: Record<string, string> = {
                  purple: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
                  red: 'bg-red-500/20 text-red-700 dark:text-red-300',
                  green: 'bg-green-500/20 text-green-700 dark:text-green-300',
                  cyan: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300',
                  violet: 'bg-violet-500/20 text-violet-700 dark:text-violet-300',
                  orange: 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
                  amber: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
                  emerald: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
                  gradient: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-700 dark:text-purple-300',
                };

                return (
                  <Card key={bloco.id} className={`overflow-hidden border bg-gradient-to-br ${corClasses[bloco.cor]}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{bloco.icon}</span>
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {bloco.nome}
                              <Badge className={`text-xs ${badgeClasses[bloco.cor]}`}>
                                {bloco.segmentos.length} falas • {bloco.segmentos.length * 7}s
                              </Badge>
                            </CardTitle>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const textoBloco = bloco.segmentos
                              .map(seg => `[${seg.num}] (${seg.tempo}) ${seg.texto}`)
                              .join('\n\n');
                            copyToClipboard(textoBloco, bloco.id);
                          }}
                        >
                          {copiedId === bloco.id ? (
                            <Check className="w-4 h-4 mr-1 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 mr-1" />
                          )}
                          Copiar
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {bloco.segmentos.map((segmento) => (
                          <div
                            key={segmento.num}
                            className="flex items-start gap-4 p-3 bg-background/50 rounded-lg border border-border/50"
                          >
                            <div className="shrink-0 flex flex-col items-center gap-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${badgeClasses[bloco.cor]}`}>
                                {segmento.num}
                              </div>
                              <span className="text-xs text-muted-foreground font-mono">{segmento.tempo}</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-foreground leading-relaxed">
                                "{segmento.texto}"
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="shrink-0"
                              onClick={() => copyToClipboard(segmento.texto, `seg-${segmento.num}`)}
                            >
                              {copiedId === `seg-${segmento.num}` ? (
                                <Check className="w-3 h-3 text-green-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Resumo de Tópicos Cobertos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  Tópicos Cobertos no Vídeo
                </CardTitle>
                <CardDescription>
                  Confira todos os assuntos abordados no roteiro completo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {VIDEO_COMPLETO_CONTENT.resumoTopicos.map((item, idx) => (
                    <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium text-foreground">{item.topico}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Blocos: {item.blocos.join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NOVO: Roteiro UGC SaaS */}
          <TabsContent value="ugc-saas" className="space-y-6">
            {/* Banner de destaque */}
            <Card className="overflow-hidden border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/5 via-red-500/5 to-purple-500/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <Film className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{ROTEIRO_UGC_SAAS.meta.title}</h2>
                    <p className="text-sm text-muted-foreground">{ROTEIRO_UGC_SAAS.meta.subtitle}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center p-3 bg-orange-500/10 rounded-lg">
                    <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">{ROTEIRO_UGC_SAAS.meta.totalSegmentos}</span>
                    <p className="text-xs text-muted-foreground">Cenas</p>
                  </div>
                  <div className="text-center p-3 bg-red-500/10 rounded-lg">
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400">7s</span>
                    <p className="text-xs text-muted-foreground">Por cena (aprox)</p>
                  </div>
                  <div className="text-center p-3 bg-purple-500/10 rounded-lg">
                    <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{ROTEIRO_UGC_SAAS.meta.duracaoTotal}</span>
                    <p className="text-xs text-muted-foreground">Duração total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botão Copiar Tudo */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const textoCompleto = ROTEIRO_UGC_SAAS.blocos
                    .map(bloco =>
                      `=== ${bloco.nome} ===\n\n` +
                      bloco.segmentos.map(seg => `[${seg.num}] (${seg.tempo}) ${seg.texto}`).join('\n\n')
                    )
                    .join('\n\n\n');
                  copyToClipboard(textoCompleto, 'ugc-saas-all');
                }}
              >
                {copiedId === 'ugc-saas-all' ? (
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                Copiar Roteiro Completo
              </Button>
            </div>

            {/* Blocos do Roteiro */}
            <div className="space-y-6">
              {ROTEIRO_UGC_SAAS.blocos.map((bloco) => {
                const corClasses: Record<string, string> = {
                  purple: 'from-purple-500/10 to-purple-500/5 border-purple-500/30',
                  red: 'from-red-500/10 to-red-500/5 border-red-500/30',
                  green: 'from-green-500/10 to-green-500/5 border-green-500/30',
                  cyan: 'from-cyan-500/10 to-cyan-500/5 border-cyan-500/30',
                  violet: 'from-violet-500/10 to-violet-500/5 border-violet-500/30',
                  orange: 'from-orange-500/10 to-orange-500/5 border-orange-500/30',
                  amber: 'from-amber-500/10 to-amber-500/5 border-amber-500/30',
                  emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/30',
                  gradient: 'from-orange-500/10 via-red-500/5 to-purple-500/10 border-orange-500/30',
                };

                const badgeClasses: Record<string, string> = {
                  purple: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
                  red: 'bg-red-500/20 text-red-700 dark:text-red-300',
                  green: 'bg-green-500/20 text-green-700 dark:text-green-300',
                  cyan: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300',
                  violet: 'bg-violet-500/20 text-violet-700 dark:text-violet-300',
                  orange: 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
                  amber: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
                  emerald: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
                  gradient: 'bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-700 dark:text-orange-300',
                };

                return (
                  <Card key={bloco.id} className={`overflow-hidden border bg-gradient-to-br ${corClasses[bloco.cor]}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{bloco.icon}</span>
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {bloco.nome}
                              <Badge className={`text-xs ${badgeClasses[bloco.cor]}`}>
                                {bloco.segmentos.length} falas • {bloco.segmentos.length * 7}s
                              </Badge>
                            </CardTitle>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const textoBloco = bloco.segmentos
                              .map(seg => `[${seg.num}] (${seg.tempo}) ${seg.texto}`)
                              .join('\n\n');
                            copyToClipboard(textoBloco, bloco.id);
                          }}
                        >
                          {copiedId === bloco.id ? (
                            <Check className="w-4 h-4 mr-1 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 mr-1" />
                          )}
                          Copiar
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {bloco.segmentos.map((segmento) => (
                          <div
                            key={segmento.num}
                            className="flex items-start gap-4 p-3 bg-background/50 rounded-lg border border-border/50"
                          >
                            <div className="shrink-0 flex flex-col items-center gap-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${badgeClasses[bloco.cor]}`}>
                                {segmento.num}
                              </div>
                              <span className="text-xs text-muted-foreground font-mono">{segmento.tempo}</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-foreground leading-relaxed">
                                "{segmento.texto}"
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="shrink-0"
                              onClick={() => copyToClipboard(segmento.texto, `seg-${segmento.num}`)}
                            >
                              {copiedId === `seg-${segmento.num}` ? (
                                <Check className="w-3 h-3 text-green-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Resumo de Tópicos Cobertos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  Tópicos Cobertos no Roteiro
                </CardTitle>
                <CardDescription>
                  Confira todos os assuntos abordados no roteiro completo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ROTEIRO_UGC_SAAS.resumoTopicos.map((item, idx) => (
                    <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium text-foreground">{item.topico}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Blocos: {item.blocos.join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NOVO: Upscale 4K / Super Resolução */}
          <TabsContent value="upscale4k" className="space-y-6">
            {/* Banner de destaque */}
            <Card className="overflow-hidden border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 via-blue-500/5 to-violet-500/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                    <Maximize2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Upscale 4K: Super Resolução com IA</h2>
                    <p className="text-sm text-muted-foreground">Scripts e materiais para promover o recurso de ampliação de imagem em alta definição</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center p-3 bg-cyan-500/10 rounded-lg">
                    <span className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">4x</span>
                    <p className="text-xs text-muted-foreground">Aumento de resolução</p>
                  </div>
                  <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">3 seg</span>
                    <p className="text-xs text-muted-foreground">Processamento</p>
                  </div>
                  <div className="text-center p-3 bg-violet-500/10 rounded-lg">
                    <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">8K</span>
                    <p className="text-xs text-muted-foreground">Resolução máxima</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Roteiro Principal 60s */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{UPSCALE_4K_CONTENT.roteiroPrincipal.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{UPSCALE_4K_CONTENT.roteiroPrincipal.title}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {UPSCALE_4K_CONTENT.roteiroPrincipal.duration}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(
                      UPSCALE_4K_CONTENT.roteiroPrincipal.sections.map(s => `[${s.label} - ${s.time}]\n${s.text}`).join('\n\n'),
                      UPSCALE_4K_CONTENT.roteiroPrincipal.id
                    )}
                  >
                    {copiedId === UPSCALE_4K_CONTENT.roteiroPrincipal.id ? (
                      <Check className="w-4 h-4 mr-1 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 mr-1" />
                    )}
                    Copiar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {UPSCALE_4K_CONTENT.roteiroPrincipal.sections.map((section, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="shrink-0 w-28">
                        <Badge variant="secondary" className="text-xs font-medium">
                          {section.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground block mt-1">
                          {section.time}
                        </span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-line flex-1">
                        {section.text}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Grid: Reels + Stories */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Roteiro Reels 15s */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-pink-500/10 to-purple-500/10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{UPSCALE_4K_CONTENT.roteiroReels.icon}</span>
                      <div>
                        <CardTitle className="text-lg">{UPSCALE_4K_CONTENT.roteiroReels.title}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {UPSCALE_4K_CONTENT.roteiroReels.duration}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(
                        UPSCALE_4K_CONTENT.roteiroReels.sections.map(s => `[${s.label} - ${s.time}]\n${s.text}`).join('\n\n'),
                        UPSCALE_4K_CONTENT.roteiroReels.id
                      )}
                    >
                      {copiedId === UPSCALE_4K_CONTENT.roteiroReels.id ? (
                        <Check className="w-4 h-4 mr-1 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 mr-1" />
                      )}
                      Copiar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {UPSCALE_4K_CONTENT.roteiroReels.sections.map((section, idx) => (
                      <div key={idx} className="flex gap-3">
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {section.label}
                        </Badge>
                        <p className="text-sm text-foreground whitespace-pre-line flex-1">
                          {section.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Stories Sequenciais */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{UPSCALE_4K_CONTENT.storiesSequenciais.icon}</span>
                      <div>
                        <CardTitle className="text-lg">{UPSCALE_4K_CONTENT.storiesSequenciais.title}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {UPSCALE_4K_CONTENT.storiesSequenciais.duration}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(
                        UPSCALE_4K_CONTENT.storiesSequenciais.sections.map(s => `[${s.label}]\n${s.text}`).join('\n\n'),
                        UPSCALE_4K_CONTENT.storiesSequenciais.id
                      )}
                    >
                      {copiedId === UPSCALE_4K_CONTENT.storiesSequenciais.id ? (
                        <Check className="w-4 h-4 mr-1 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 mr-1" />
                      )}
                      Copiar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {UPSCALE_4K_CONTENT.storiesSequenciais.sections.map((section, idx) => (
                      <div key={idx} className="flex gap-3">
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {section.label}
                        </Badge>
                        <p className="text-sm text-foreground whitespace-pre-line flex-1">
                          {section.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Carrossel Educativo */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{UPSCALE_4K_CONTENT.carrosselEducativo.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{UPSCALE_4K_CONTENT.carrosselEducativo.title}</CardTitle>
                      <CardDescription>{UPSCALE_4K_CONTENT.carrosselEducativo.slides} slides</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(
                      UPSCALE_4K_CONTENT.carrosselEducativo.content.join('\n\n'),
                      UPSCALE_4K_CONTENT.carrosselEducativo.id
                    )}
                  >
                    {copiedId === UPSCALE_4K_CONTENT.carrosselEducativo.id ? (
                      <Check className="w-4 h-4 mr-1 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 mr-1" />
                    )}
                    Copiar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {UPSCALE_4K_CONTENT.carrosselEducativo.content.map((slide, idx) => (
                    <div key={idx} className="p-3 bg-muted/50 rounded-lg text-sm whitespace-pre-line">
                      {slide}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Grid: Duas Legendas */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Legenda Alto Impacto */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{UPSCALE_4K_CONTENT.legendaAltoImpacto.icon}</span>
                      <CardTitle className="text-lg">{UPSCALE_4K_CONTENT.legendaAltoImpacto.title}</CardTitle>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(UPSCALE_4K_CONTENT.legendaAltoImpacto.text, UPSCALE_4K_CONTENT.legendaAltoImpacto.id)}
                    >
                      {copiedId === UPSCALE_4K_CONTENT.legendaAltoImpacto.id ? (
                        <Check className="w-4 h-4 mr-1 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 mr-1" />
                      )}
                      Copiar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-line max-h-64 overflow-y-auto">
                    {UPSCALE_4K_CONTENT.legendaAltoImpacto.text}
                  </div>
                </CardContent>
              </Card>

              {/* Legenda Técnica */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{UPSCALE_4K_CONTENT.legendaTecnica.icon}</span>
                      <CardTitle className="text-lg">{UPSCALE_4K_CONTENT.legendaTecnica.title}</CardTitle>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(UPSCALE_4K_CONTENT.legendaTecnica.text, UPSCALE_4K_CONTENT.legendaTecnica.id)}
                    >
                      {copiedId === UPSCALE_4K_CONTENT.legendaTecnica.id ? (
                        <Check className="w-4 h-4 mr-1 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 mr-1" />
                      )}
                      Copiar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-line max-h-64 overflow-y-auto">
                    {UPSCALE_4K_CONTENT.legendaTecnica.text}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabela Comparativo + Números */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Tabela */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{UPSCALE_4K_CONTENT.tabelaComparativo.icon}</span>
                      <CardTitle className="text-lg">{UPSCALE_4K_CONTENT.tabelaComparativo.title}</CardTitle>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(
                        UPSCALE_4K_CONTENT.tabelaComparativo.comparisons.map(c =>
                          `${c.aspecto}:\n  Antes: ${c.antes}\n  Depois: ${c.depois}`
                        ).join('\n\n'),
                        UPSCALE_4K_CONTENT.tabelaComparativo.id
                      )}
                    >
                      {copiedId === UPSCALE_4K_CONTENT.tabelaComparativo.id ? (
                        <Check className="w-4 h-4 mr-1 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 mr-1" />
                      )}
                      Copiar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {UPSCALE_4K_CONTENT.tabelaComparativo.comparisons.map((comp, idx) => (
                      <div key={idx} className="grid grid-cols-3 gap-2 text-xs p-2 rounded-lg bg-muted/50">
                        <span className="font-medium text-foreground">{comp.aspecto}</span>
                        <span className="text-muted-foreground">{comp.antes}</span>
                        <span className="text-cyan-600 dark:text-cyan-400">{comp.depois}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Números Críticos */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{UPSCALE_4K_CONTENT.numerosCriticos.icon}</span>
                    <CardTitle className="text-lg">{UPSCALE_4K_CONTENT.numerosCriticos.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {UPSCALE_4K_CONTENT.numerosCriticos.stats.map((stat, idx) => (
                      <div key={idx} className="p-3 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-lg text-center">
                        <span className="text-xl font-bold text-cyan-600 dark:text-cyan-400">{stat.numero}</span>
                        <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="videos" className="space-y-6">
            <div className="grid gap-6">
              {Object.values(VIDEO_SCRIPTS).map((script) => (
                <Card key={script.id} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-coral/5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{script.icon}</span>
                        <div>
                          <CardTitle className="text-lg">{script.title}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {script.duration}
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(formatScriptText(script), script.id)}
                        className="shrink-0"
                      >
                        {copiedId === script.id ? (
                          <Check className="w-4 h-4 mr-1 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 mr-1" />
                        )}
                        Copiar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      {script.sections.map((section, idx) => (
                        <div key={idx} className="flex gap-4">
                          <div className="shrink-0 w-24">
                            <Badge variant="secondary" className="text-xs font-medium">
                              {section.label}
                            </Badge>
                            {section.time && (
                              <span className="text-xs text-muted-foreground block mt-1">
                                {section.time}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-line flex-1">
                            {section.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Scripts para Posts */}
          <TabsContent value="posts" className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Posts e Carrosséis</h3>
            <div className="grid gap-6 md:grid-cols-2">
              {Object.values(POST_SCRIPTS).map((post) => (
                <Card key={post.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{post.icon}</span>
                        <div>
                          <CardTitle className="text-lg">{post.title}</CardTitle>
                          <CardDescription>{post.slides} slide(s)</CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(post.content.join('\n'), post.id)}
                      >
                        {copiedId === post.id ? (
                          <Check className="w-4 h-4 mr-1 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 mr-1" />
                        )}
                        Copiar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-line">
                      {post.content.join('\n')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <h3 className="text-lg font-semibold text-foreground pt-4">Legendas Prontas</h3>
            <div className="grid gap-6 md:grid-cols-3">
              {Object.values(LEGENDAS).map((legenda) => (
                <Card key={legenda.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{legenda.icon}</span>
                        <CardTitle className="text-lg">{legenda.title}</CardTitle>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(legenda.text, legenda.id)}
                      >
                        {copiedId === legenda.id ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-line max-h-48 overflow-y-auto">
                      {legenda.text}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Branding - Identidade Visual */}
          <TabsContent value="branding" className="space-y-6">
            {/* Importância */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-amber-500/10 to-primary/5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{BRANDING_CONTENT.importancia.icon}</span>
                    <CardTitle className="text-lg">{BRANDING_CONTENT.importancia.title}</CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(BRANDING_CONTENT.importancia.content, BRANDING_CONTENT.importancia.id)}
                  >
                    {copiedId === BRANDING_CONTENT.importancia.id ? (
                      <Check className="w-4 h-4 mr-1 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 mr-1" />
                    )}
                    Copiar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-line prose prose-sm max-w-none">
                  {BRANDING_CONTENT.importancia.content}
                </div>
              </CardContent>
            </Card>

            {/* Tutorial de Configuração */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{BRANDING_CONTENT.comoUsar.icon}</span>
                  <CardTitle className="text-lg">{BRANDING_CONTENT.comoUsar.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {BRANDING_CONTENT.comoUsar.steps.map((step) => (
                    <div key={step.step} className="flex gap-4">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-sm">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{step.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Dicas para Logo */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{BRANDING_CONTENT.dicasLogo.icon}</span>
                  <CardTitle className="text-lg">{BRANDING_CONTENT.dicasLogo.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {BRANDING_CONTENT.dicasLogo.tips.map((tip, idx) => (
                    <div key={idx} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        <h4 className="font-semibold text-sm">{tip.titulo}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">{tip.descricao}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Roteiro de Vídeo sobre Branding */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-500/10 to-primary/5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{BRANDING_CONTENT.roteirosVideo.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{BRANDING_CONTENT.roteirosVideo.title}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {BRANDING_CONTENT.roteirosVideo.duration}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(
                      BRANDING_CONTENT.roteirosVideo.sections.map(s => `[${s.label} - ${s.time}]\n${s.text}`).join('\n\n'),
                      BRANDING_CONTENT.roteirosVideo.id
                    )}
                  >
                    {copiedId === BRANDING_CONTENT.roteirosVideo.id ? (
                      <Check className="w-4 h-4 mr-1 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 mr-1" />
                    )}
                    Copiar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {BRANDING_CONTENT.roteirosVideo.sections.map((section, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="shrink-0 w-24">
                        <Badge variant="secondary" className="text-xs font-medium">
                          {section.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground block mt-1">
                          {section.time}
                        </span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-line flex-1">
                        {section.text}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Legenda sobre Branding */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{BRANDING_CONTENT.legendaBrand.icon}</span>
                    <CardTitle className="text-lg">{BRANDING_CONTENT.legendaBrand.title}</CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(BRANDING_CONTENT.legendaBrand.text, BRANDING_CONTENT.legendaBrand.id)}
                  >
                    {copiedId === BRANDING_CONTENT.legendaBrand.id ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-line">
                  {BRANDING_CONTENT.legendaBrand.text}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Materiais do Projeto */}
          <TabsContent value="materiais" className="space-y-6">
            <div className="grid gap-6">
              {Object.values(PROJECT_MATERIALS).map((material) => (
                <Card key={material.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{material.icon}</span>
                        <CardTitle className="text-lg">{material.title}</CardTitle>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(material.content, material.id)}
                      >
                        {copiedId === material.id ? (
                          <Check className="w-4 h-4 mr-1 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 mr-1" />
                        )}
                        Copiar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-line prose prose-sm max-w-none">
                      {material.content}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tutoriais */}
          <TabsContent value="tutoriais" className="space-y-6">
            <div className="grid gap-6">
              {Object.values(TUTORIALS).map((tutorial) => (
                <Card key={tutorial.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{tutorial.icon}</span>
                      <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {tutorial.steps.map((step) => (
                        <div key={step.step} className="flex gap-4">
                          <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                            {step.step}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{step.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default MarketingContent;
