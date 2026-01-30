import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Sparkles, 
  Wand2, 
  Upload, 
  Download, 
  Image, 
  Type, 
  Search, 
  FileText, 
  Check, 
  Star, 
  Shield, 
  Clock, 
  Zap,
  ArrowRight,
  Camera,
  Palette,
  MessageSquare,
  Target,
  TrendingUp,
  Users,
  Award,
  Layers,
  Play,
  ChevronRight,
  Rocket,
  CheckCircle2,
  Package,
  CreditCard
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import EbookDownloadButton from '@/components/download/EbookDownloadButton';
import AIAgentsSection from '@/components/landing/AIAgentsSection';
import YouTubeVideoSection from '@/components/landing/YouTubeVideoSection';
import GalleryShowcase from '@/components/landing/GalleryShowcase';

import BrandingSection from '@/components/landing/BrandingSection';
// import MarketplaceCards from '@/components/landing/MarketplaceCards';
import { CreditsPlansSection } from '@/components/credits/CreditsPlansSection';
import { creditPlans } from '@/config/siteConfig';
import AnimatedSection from '@/components/ui/AnimatedSection';

const Index = () => {
  const navigate = useNavigate();
  const [counters, setCounters] = useState({
    ads: 0,
    images: 0,
    sellers: 0,
    rating: 0
  });

  useEffect(() => {
    const duration = 2000;
    const steps = 50;
    const interval = duration / steps;
    const targets = { ads: 10000, images: 5000, sellers: 500, rating: 4.9 };
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setCounters({
        ads: Math.floor(targets.ads * progress),
        images: Math.floor(targets.images * progress),
        sellers: Math.floor(targets.sellers * progress),
        rating: Number((targets.rating * progress).toFixed(1))
      });
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: Wand2,
      title: "Fotos Profissionais com IA",
      description: "Transforme qualquer foto amadora em imagem profissional de alta conversão",
      color: "coral"
    },
    {
      icon: Layers,
      title: "Fundo Branco Perfeito",
      description: "Remoção inteligente de fundo para marketplaces em segundos",
      color: "teal"
    },
    {
      icon: MessageSquare,
      title: "Copy que Vende",
      description: "Descrições persuasivas escritas por IA especializada em e-commerce",
      color: "coral"
    },
    {
      icon: Target,
      title: "SEO Otimizado",
      description: "Palavras-chave e títulos que fazem seus produtos aparecerem nas buscas",
      color: "teal"
    },
    {
      icon: Palette,
      title: "Templates de Marketing",
      description: "Artes prontas para redes sociais e campanhas de vendas",
      color: "coral"
    },
    {
      icon: Zap,
      title: "Resultado Instantâneo",
      description: "Anúncio completo pronto para publicar em menos de 1 minuto",
      color: "teal"
    }
  ];

  const steps = [
    {
      num: "01",
      title: "Envie sua foto",
      desc: "Faça upload de qualquer imagem do produto"
    },
    {
      num: "02",
      title: "IA trabalha",
      desc: "Processamento automático em segundos"
    },
    {
      num: "03",
      title: "Baixe tudo",
      desc: "Anúncio completo pronto para publicar"
    }
  ];


  const included = [
    "Foto melhorada com IA",
    "Fundo removido ou otimizado",
    "Título otimizado para SEO",
    "Descrição persuasiva",
    "5-7 benefícios destacados",
    "FAQ do produto",
    "25+ títulos de cauda longa",
    "Palavras-chave estratégicas"
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Noise Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none noise-bg z-50" />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-background/90 border-b border-border/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-coral-dark flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold font-display leading-tight">Anúncios Que Vende</span>
                <span className="text-[10px] text-muted-foreground hidden sm:block">Powered by AI</span>
              </div>
            </Link>
            
            <nav className="hidden md:flex items-center gap-1">
              <a href="#recursos" className="px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                Recursos
              </a>
              <a href="#como-funciona" className="px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                Como Funciona
              </a>
              <a href="#precos" className="px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                Preços
              </a>
              <a href="#galeria" className="px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                Galeria
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <Link to="/auth">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="hidden sm:flex font-medium border-primary/50 text-primary hover:bg-primary/5 px-5"
                >
                  Entrar no Sistema
                </Button>
              </Link>
              <Link to="/auth">
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-primary to-coral-dark hover:opacity-90 text-white font-semibold shadow-lg px-6"
                >
                  Assinar Agora
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-28 pb-12 md:pt-32 md:pb-16">
        {/* Background Blobs */}
        <div className="absolute top-20 -left-32 w-96 h-96 bg-primary/20 blob blur-3xl float-slow" />
        <div className="absolute top-40 -right-32 w-80 h-80 bg-accent/20 blob blur-3xl float-slow" style={{ animationDelay: '2s' }} />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Badge */}
            <div className="flex justify-center mb-6">
              <Badge className="bg-primary/10 text-primary border-primary/20 px-5 py-2.5 text-sm font-semibold">
                <Rocket className="w-4 h-4 mr-2" />
                +10.000 anúncios criados
              </Badge>
            </div>
            
            {/* Headline - Simplified */}
            <h1 className="text-center text-5xl md:text-7xl lg:text-8xl font-bold font-display leading-[1.1] mb-6">
              Transforme Fotos em{' '}
              <span className="text-gradient-coral">Anúncios que Vendem</span>
              {' '}de Verdade
            </h1>
            
            {/* Subheadline */}
            <p className="text-center text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              De foto amadora a anúncio profissional em segundos. 
              Imagem perfeita, copy persuasivo e SEO otimizado — tudo automático.
            </p>

            {/* Marketplace Cards - REMOVIDO */}
            {/* <div className="mb-8">
              <MarketplaceCards />
            </div> */}

            {/* CTAs - REMOVIDO */}
            {/* <div className="flex justify-center mb-8">
              <Link to="/auth">
                <Button size="lg" className="bg-primary hover:bg-coral-dark text-primary-foreground text-lg px-10 py-7 shadow-coral pulse-glow font-semibold group">
                  Criar Meu Primeiro Anúncio
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div> */}

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 text-muted-foreground text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent" />
                <span className="font-medium">100% Seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" />
                <span className="font-medium">Setup em 2 min</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-primary fill-primary" />
                <span className="font-medium">4.9 de avaliação</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2º - Veja em Ação */}
      <AnimatedSection animation="fade-up">
        <YouTubeVideoSection />
      </AnimatedSection>

      {/* 3º - Galeria de Resultados */}
      <AnimatedSection animation="fade-up" delay={100}>
        <GalleryShowcase />
      </AnimatedSection>

      {/* 4º - Agentes de Conversão */}
      <AnimatedSection animation="fade-up" delay={200}>
        <AIAgentsSection />
      </AnimatedSection>

      {/* Pricing - Credits (Moved after Gallery) */}
      <AnimatedSection animation="fade-up" delay={300}>
        <section id="precos" className="py-10 md:py-14">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <Badge className="bg-accent/10 text-accent border-accent/20 px-4 py-2 mb-4">
                <CreditCard className="w-4 h-4 mr-2" />
                Pacotes de Créditos
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
                Escolha Seu <span className="text-gradient-coral">Pacote</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Pague apenas pelo que usar — sem mensalidade, sem compromisso
              </p>
            </div>

            <CreditsPlansSection
              plans={creditPlans}
              isProcessing={false}
              selectedPlan={null}
              onPurchase={() => navigate('/auth')}
            />

            {/* Guarantees */}
            <div className="flex flex-wrap justify-center gap-6 mt-10 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent" />
                <span>Créditos nunca expiram</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-accent" />
                <span>Garantia de satisfação</span>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>


      {/* Branding Section - Sua Marca em Destaque */}
      <AnimatedSection animation="fade-up">
        <BrandingSection />
      </AnimatedSection>

      {/* Features Section */}
      <AnimatedSection animation="fade-up">
        <section id="recursos" className="py-10 md:py-14">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="bg-accent/10 text-accent border-accent/20 px-4 py-2 mb-4">
                <Sparkles className="w-4 h-4 mr-2" />
                Recursos Poderosos
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
                Tudo que Você Precisa para{' '}
                <span className="text-gradient-coral">Vender Mais</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Ferramentas de IA desenvolvidas especificamente para e-commerce e marketplaces
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {features.map((feature, index) => (
                <Card key={index} className={`card-hover border-2 border-border hover:border-${feature.color === 'coral' ? 'primary' : 'accent'}/50 bg-card`}>
                  <CardContent className="p-8">
                    <div className={`w-14 h-14 rounded-2xl ${feature.color === 'coral' ? 'bg-primary/10' : 'bg-accent/10'} flex items-center justify-center mb-6`}>
                      <feature.icon className={`w-7 h-7 ${feature.color === 'coral' ? 'text-primary' : 'text-accent'}`} />
                    </div>
                    <h3 className="font-bold text-xl mb-3 font-display">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* How It Works - Compact Version */}
      <section id="como-funciona" className="py-8 md:py-12 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 mb-4">
              <Zap className="w-4 h-4 mr-2" />
              Simples e Rápido
            </Badge>
            <h2 className="text-2xl md:text-4xl font-bold font-display mb-3">
              Como Funciona
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Em 3 passos simples, seu anúncio está pronto
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-coral mb-3">
                    {index === 0 && <Upload className="w-7 h-7 text-primary-foreground" />}
                    {index === 1 && <Sparkles className="w-7 h-7 text-primary-foreground" />}
                    {index === 2 && <Download className="w-7 h-7 text-primary-foreground" />}
                  </div>
                  <h3 className="text-lg font-bold font-display mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground max-w-[150px]">{step.desc}</p>
                </div>
                
                {index < 2 && (
                  <ChevronRight className="hidden md:block w-6 h-6 text-muted-foreground/50" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* What's Included */}
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="bg-accent/10 text-accent border-accent/20 px-4 py-2 mb-4">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Pacote Completo
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
                  Cada Anúncio Inclui{' '}
                  <span className="text-gradient-coral">Tudo Isso</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Não é só uma imagem bonita — é um anúncio completo, 
                  otimizado e pronto para converter visitantes em compradores.
                </p>
                <Link to="/auth">
                  <Button size="lg" className="bg-primary hover:bg-coral-dark text-primary-foreground font-semibold shadow-coral">
                    Começar Agora
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {included.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 rounded-2xl bg-secondary border border-border">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-accent" />
                    </div>
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 md:py-16 bg-foreground text-background relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/30 blob blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-accent/20 blob blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold font-display mb-6 leading-tight">
              Pronto Para Criar Anúncios que{' '}
              <span className="text-primary">Realmente Vendem</span>?
            </h2>
            <p className="text-xl text-muted mb-10 max-w-xl mx-auto">
              Junte-se a milhares de vendedores que já transformaram seus resultados
            </p>
            <Link to="/auth">
              <Button size="lg" className="bg-primary hover:bg-coral-dark text-primary-foreground text-lg px-12 py-8 shadow-coral pulse-glow font-bold">
                SE CADASTRE AGORA
                <ArrowRight className="w-6 h-6 ml-3" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Crown className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold font-display text-lg">Anúncios Que Vende</span>
            </div>
            
            <div className="flex items-center gap-8 text-muted-foreground text-sm">
              <a href="#" className="hover:text-foreground transition-colors">Termos de Uso</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
              <a href="#" className="hover:text-foreground transition-colors">Contato</a>
            </div>
            
            <p className="text-muted-foreground text-sm">
              © 2025 Anúncios Que Vende. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
