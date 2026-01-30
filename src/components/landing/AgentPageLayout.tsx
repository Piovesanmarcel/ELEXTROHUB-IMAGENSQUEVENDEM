import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle, Zap, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import AIAgentAvatar from "./AIAgentAvatar";
import BeforeAfterSlider from "./BeforeAfterSlider";
import { cn } from "@/lib/utils";

interface ProcessStep {
  title: string;
  description: string;
}

interface Example {
  title: string;
  description: string;
  icon: LucideIcon;
}

interface BeforeAfterExample {
  title: string;
  beforeImage: string;
  beforeLabel: string;
  afterImage: string;
  afterLabel: string;
}

interface AgentPageLayoutProps {
  agent: 'atlas' | 'lyra' | 'orion';
  name: string;
  role: string;
  badge: string;
  quote: string;
  description: string;
  capabilities: string[];
  processSteps: ProcessStep[];
  examples: Example[];
  beforeAfterExamples?: BeforeAfterExample[];
  linkTo: string;
  linkLabel: string;
  prevAgent?: { name: string; path: string };
  nextAgent?: { name: string; path: string };
}

const agentColors = {
  atlas: {
    primary: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    glow: "shadow-cyan-500/20",
    gradient: "from-cyan-500/20 via-blue-500/20 to-cyan-500/20",
  },
  lyra: {
    primary: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    glow: "shadow-violet-500/20",
    gradient: "from-violet-500/20 via-purple-500/20 to-violet-500/20",
  },
  orion: {
    primary: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    glow: "shadow-orange-500/20",
    gradient: "from-orange-500/20 via-amber-500/20 to-orange-500/20",
  },
};

const AgentPageLayout = ({
  agent,
  name,
  role,
  badge,
  quote,
  description,
  capabilities,
  processSteps,
  examples,
  beforeAfterExamples,
  linkTo,
  linkLabel,
  prevAgent,
  nextAgent,
}: AgentPageLayoutProps) => {
  const colors = agentColors[agent];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </Link>
          <Link to="/" className="font-display font-bold text-xl">
            Anúncios<span className="text-primary">QueVende</span>
          </Link>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Hero Section */}
      <section className={cn("py-16 md:py-24 relative overflow-hidden")}>
        {/* Background gradient */}
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-30", colors.gradient)} />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Avatar */}
            <div className="mb-8">
              <AIAgentAvatar agent={agent} size="lg" animated />
            </div>

            {/* Badge */}
            <Badge className={cn("mb-4 px-4 py-2", colors.bg, colors.border, colors.primary)}>
              {badge}
            </Badge>

            {/* Name & Role */}
            <h1 className={cn("text-4xl md:text-6xl font-bold font-display mb-2", colors.primary)}>
              {name}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-6">
              {role}
            </p>

            {/* Quote */}
            <blockquote className="text-lg md:text-xl italic text-foreground/80 max-w-2xl mb-8">
              "{quote}"
            </blockquote>

            {/* Capability Badges */}
            <div className="flex flex-wrap justify-center gap-2">
              {capabilities.slice(0, 4).map((cap, idx) => (
                <Badge key={idx} variant="outline" className="text-sm">
                  {cap}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Description Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold font-display mb-6">
              O Que {name} Faz Por Você
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              {description}
            </p>

            {/* Capabilities Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {capabilities.map((cap, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl bg-background border",
                    colors.border
                  )}
                >
                  <CheckCircle className={cn("w-5 h-5 flex-shrink-0", colors.primary)} />
                  <span className="text-left">{cap}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Before/After Section */}
      {beforeAfterExamples && beforeAfterExamples.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold font-display text-center mb-4">
                Veja a Diferença
              </h2>
              <p className="text-center text-muted-foreground mb-12">
                Compare os resultados antes e depois de usar {name}
              </p>

              <div className="space-y-12">
                {beforeAfterExamples.map((example, idx) => (
                  <div key={idx}>
                    <h3 className={cn("text-lg font-semibold text-center mb-4", colors.primary)}>
                      {example.title}
                    </h3>
                    <BeforeAfterSlider
                      beforeImage={example.beforeImage}
                      afterImage={example.afterImage}
                      beforeLabel={example.beforeLabel}
                      afterLabel={example.afterLabel}
                      className={cn("border-2", colors.border)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Process Section */}
      <section className={cn("py-16", beforeAfterExamples?.length ? "bg-muted/30" : "")}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold font-display text-center mb-12">
              Como {name} Trabalha
            </h2>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-accent to-secondary hidden md:block" />

              {/* Steps */}
              <div className="space-y-8">
                {processSteps.map((step, idx) => (
                  <div key={idx} className="flex gap-6 items-start">
                    <div className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0",
                      colors.bg,
                      colors.primary,
                      "border-2",
                      colors.border
                    )}>
                      {idx + 1}
                    </div>
                    <div className="pt-3">
                      <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Examples Section */}
      <section className={cn("py-16", !beforeAfterExamples?.length ? "bg-muted/30" : "")}>
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold font-display text-center mb-12">
              Exemplos de Uso
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {examples.map((example, idx) => {
                const Icon = example.icon;
                return (
                  <Card key={idx} className={cn("border-2 hover:shadow-lg transition-all", colors.border)}>
                    <CardContent className="p-6">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", colors.bg)}>
                        <Icon className={cn("w-6 h-6", colors.primary)} />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{example.title}</h3>
                      <p className="text-muted-foreground text-sm">{example.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className={cn(
            "max-w-3xl mx-auto text-center p-10 rounded-3xl border-2",
            colors.border,
            colors.bg
          )}>
            <Zap className={cn("w-12 h-12 mx-auto mb-4", colors.primary)} />
            <h2 className="text-2xl md:text-3xl font-bold font-display mb-4">
              Pronto para Experimentar {name}?
            </h2>
            <p className="text-muted-foreground mb-8">
              Comece agora e veja como {name} pode transformar seus produtos em anúncios que vendem.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link to={linkTo}>
                  <Zap className="w-4 h-4" />
                  {linkLabel}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/">Voltar à Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation between agents */}
      <section className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center max-w-4xl mx-auto">
            {prevAgent ? (
              <Link
                to={prevAgent.path}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Conhecer {prevAgent.name}</span>
              </Link>
            ) : (
              <div />
            )}
            {nextAgent ? (
              <Link
                to={nextAgent.path}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>Conhecer {nextAgent.name}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Anúncios Que Vende. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default AgentPageLayout;
