import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Crown,
    Sparkles,
    Upload,
    Image,
    Check,
    Star,
    Shield,
    Zap,
    ArrowRight,
    Target,
    TrendingUp,
    Award,
    Package,
    AlertTriangle,
    Users,
    Fingerprint,
    ImagePlus,
    Search,
    FileText,
    Calculator,
    Barcode,
    ChevronRight,
    Lock,
    Eye,
    Layers,
    Copy,
    Plus,
    ShieldCheck,
    HelpCircle,
    UserCheck,
    Wand2,
    Rocket,
    Tag,
    Quote
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';

// ============================================
// LANDING PAGE OFICIAL DO SAAS
// ============================================

const LandingPage = () => {
    // ===== DADOS EXISTENTES =====
    const problems = [
        { icon: Image, text: "Imagens genéricas" },
        { icon: Copy, text: "Concorrentes copiando tudo" },
        { icon: Layers, text: "Anúncios iguais em todos os marketplaces" },
        { icon: Eye, text: "Baixa taxa de cliques" },
        { icon: TrendingUp, text: "Poucas impressões orgânicas" }
    ];

    const solutions = [
        { icon: Image, title: "Imagens profissionais com LOGO", description: "Sua marca em todas as fotos" },
        { icon: Fingerprint, title: "Identidade visual única", description: "Consistente e impossível de copiar" },
        { icon: ImagePlus, title: "Upscale automático", description: "Máxima qualidade final" },
        { icon: Target, title: "Conjuntos estratégicos", description: "Para múltiplos anúncios" },
        { icon: Search, title: "SEO + Copy + Precificação + EAN", description: "Tudo integrado" }
    ];

    const deliverables = [
        "Descrição SEO otimizada",
        "Palavras-chave estratégicas",
        "Sugestões de nomes SEO",
        "Títulos Long Tail",
        "Copywriting profissional",
        "Página de precificação automática",
        "Gerador de EAN brasileiro"
    ];

    const packages = [
        {
            name: "Intermediário",
            features: ["Fundo branco + Ambientada", "3 templates Canva", "Identidade visual + Upscale"],
            highlight: false
        },
        {
            name: "Profissional",
            features: ["Fundo branco + Ambientada", "4 templates Canva", "Mais variações visuais"],
            highlight: false
        },
        {
            name: "Expert",
            badge: "Mais Escolhido",
            features: ["Fundo branco", "Ambientada", "Em uso", "6 templates Canva", "Máximo equilíbrio qualidade/performance"],
            highlight: true
        },
        {
            name: "Hard Full",
            features: ["Fundo branco", "Ambientada", "Em uso", "Com pessoas", "8 templates Canva", "Branding completo de marca"],
            highlight: false
        }
    ];

    const rankingBenefits = [
        { icon: Eye, title: "Visual profissional", description: "Aumenta CTR" },
        { icon: Search, title: "SEO estruturado", description: "Melhora indexação" },
        { icon: Fingerprint, title: "Identidade visual", description: "Gera reconhecimento" },
        { icon: TrendingUp, title: "Mais anúncios", description: "Mais impressões orgânicas" }
    ];

    const extras = [
        "Criar imagens individuais extras",
        "Gerar novos anúncios",
        "Manter a mesma identidade visual",
        "Escalar sem perder branding"
    ];

    // ===== NOVOS DADOS - CHECKOUT E POSICIONAMENTO =====

    // O que você recebe (Checkout)
    const whatYouReceive = [
        "Imagens profissionais geradas por IA",
        "Identidade visual única aplicada com a logo da sua marca",
        "Upscale automático para máxima qualidade e nitidez",
        "Imagens pensadas para criar até 5 anúncios diferentes",
        "Conteúdo otimizado para ranqueamento e conversão"
    ];

    // Solução completa incluída
    const completeSolution = [
        "Descrição SEO otimizada",
        "Palavras-chave estratégicas (Short + Long Tail)",
        "Sugestões de nomes de produto para SEO",
        "Títulos de cauda longa prontos para marketplaces",
        "Copywriting profissional focado em conversão",
        "Kits criativos e estratégias de venda",
        "Página de precificação automática (ML, Shopee, Amazon, etc.)",
        "Gerador de EAN brasileiro válido (789)"
    ];

    // O que resolve (UVP)
    const whatWeResolve = [
        "Falta de destaque nos marketplaces",
        "Concorrência copiando imagens",
        "Anúncios genéricos e amadores",
        "Dependência de preço baixo",
        "Falta de identidade visual",
        "Falta de SEO, copy e estratégia"
    ];

    // Para quem é
    const targetAudience = [
        { icon: Users, text: "Sellers iniciantes que querem começar certo" },
        { icon: TrendingUp, text: "Sellers intermediários que querem escalar" },
        { icon: Shield, text: "Sellers avançados que querem blindar a marca" },
        { icon: Crown, text: "Marcas próprias" },
        { icon: Target, text: "Quem quer parar de competir por preço" }
    ];

    // Objeções
    const objections = [
        {
            question: "Consigo fazer isso sozinho?",
            answer: "Sim, com 5 ferramentas diferentes, mais tempo e custo."
        },
        {
            question: "Vale o investimento?",
            answer: "Um único anúncio bem posicionado paga o pacote."
        },
        {
            question: "Vão copiar minhas imagens?",
            answer: "Não. Sua marca está nelas."
        }
    ];

    // Garantia
    const guarantees = [
        "Plataforma segura",
        "Entrega automática",
        "Conteúdo gerado sob demanda",
        "Suporte especializado"
    ];

    // Comando unificado - 5 categorias
    const unifiedCommand = [
        {
            title: "Conteúdo Estratégico",
            icon: FileText,
            items: ["Descrição SEO otimizada", "Copywriting profissional", "Estrutura de benefícios e objeções"]
        },
        {
            title: "SEO & Descoberta",
            icon: Search,
            items: ["Palavras-chave principais", "Long Tail SEO", "Sugestões de nomes de produto", "Títulos otimizados"]
        },
        {
            title: "Estratégia Comercial",
            icon: Tag,
            items: ["Kits criativos", "Estratégias de venda", "Campanhas sazonais", "Cross-sell inteligente"]
        },
        {
            title: "Precificação",
            icon: Calculator,
            items: ["Precificação automática", "Mercado Livre (Classic e Premium)", "Shopee, Amazon, Magalu", "Margem real e lucro"]
        },
        {
            title: "Legal e Marketplace",
            icon: Barcode,
            items: ["Gerador de EAN brasileiro (789)", "Pronto para anúncios oficiais"]
        }
    ];

    return (
        <div className="min-h-screen bg-background overflow-x-hidden">
            {/* Noise Texture Overlay */}
            <div className="fixed inset-0 pointer-events-none noise-bg z-50" />

            {/* Header Fixo */}
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
                            <a href="#problema" className="px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                                Problema
                            </a>
                            <a href="#solucao" className="px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                                Solução
                            </a>
                            <a href="#como-funciona" className="px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                                Como Funciona
                            </a>
                        </nav>

                        <div className="flex items-center gap-3">
                            <Link to="/auth">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="hidden sm:flex font-medium border-primary/50 text-primary hover:bg-primary/5 px-5"
                                >
                                    Entrar
                                </Button>
                            </Link>
                            <Link to="/auth">
                                <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-primary to-coral-dark hover:opacity-90 text-white font-semibold shadow-lg px-6"
                                >
                                    Criar Anúncio
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* ===== HERO SECTION ===== */}
            <section className="relative pt-28 pb-16 md:pt-36 md:pb-24">
                {/* Background Blobs */}
                <div className="absolute top-20 -left-32 w-96 h-96 bg-primary/20 blob blur-3xl float-slow" />
                <div className="absolute top-40 -right-32 w-80 h-80 bg-accent/20 blob blur-3xl float-slow" style={{ animationDelay: '2s' }} />

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-5xl mx-auto text-center">
                        {/* Badge */}
                        <Badge className="bg-primary/10 text-primary border-primary/20 px-5 py-2.5 text-sm font-semibold mb-6">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Powered by AI
                        </Badge>

                        {/* Headline Principal */}
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-display leading-[1.1] mb-6">
                            Crie anúncios profissionais{' '}
                            <span className="text-gradient-coral">impossíveis de copiar</span>
                        </h1>

                        {/* Subheadline */}
                        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-4 leading-relaxed">
                            com identidade visual única, SEO, copy e precificação automática
                        </p>

                        <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-8">
                            Gere imagens com logo, upscale profissional e um pacote completo para rankear,
                            vender mais e dominar os marketplaces.
                        </p>

                        {/* CTA Principal */}
                        <Link to="/auth">
                            <Button
                                size="lg"
                                className="bg-primary hover:bg-coral-dark text-primary-foreground text-lg px-10 py-7 shadow-coral pulse-glow font-semibold group"
                            >
                                Quero Criar Meu Anúncio Agora
                                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ===== CHECKOUT COPY SECTION (NOVA) ===== */}
            <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-12">
                            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 mb-4">
                                <Rocket className="w-4 h-4 mr-2" />
                                🎯 Objetivo do Checkout
                            </Badge>
                            <h2 className="text-2xl md:text-4xl font-bold font-display mb-4">
                                Você está a 1 passo de criar anúncios profissionais{' '}
                                <span className="text-gradient-coral">impossíveis de copiar</span>
                            </h2>
                            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                                Imagens únicas + identidade visual com logo + SEO + copy + precificação automática.{' '}
                                <strong>Tudo pronto para vender mais</strong>, com aparência profissional desde o primeiro anúncio.
                            </p>
                        </div>

                        {/* Quebra de Objeção Destaque */}
                        <Card className="border-4 border-primary/50 bg-gradient-to-br from-primary/10 to-accent/5 mb-10">
                            <CardContent className="p-8 text-center">
                                <div className="text-2xl md:text-3xl font-bold font-display mb-2">
                                    🔥 Você não está comprando imagens.
                                </div>
                                <p className="text-xl text-muted-foreground">
                                    Você está comprando <span className="text-primary font-semibold">posicionamento, autoridade e vantagem competitiva</span> nos marketplaces.
                                </p>
                            </CardContent>
                        </Card>

                        {/* O que você recebe */}
                        <div className="mb-10">
                            <h3 className="text-xl font-bold text-center mb-6">📦 O QUE VOCÊ RECEBE AO FINAL</h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {whatYouReceive.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-3 p-4 rounded-xl bg-background border-2 border-accent/30 hover:border-accent/60 transition-colors"
                                    >
                                        <Check className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                                        <span className="font-medium">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Solução Completa Incluída */}
                        <div className="p-6 md:p-8 rounded-2xl bg-secondary border-2 border-border">
                            <h3 className="text-xl font-bold text-center mb-6">🧩 SOLUÇÃO COMPLETA INCLUÍDA (DIFERENCIAL FORTE)</h3>
                            <p className="text-center text-muted-foreground mb-6">
                                Junto com cada imagem gerada, você recebe automaticamente:
                            </p>
                            <div className="grid md:grid-cols-2 gap-3">
                                {completeSolution.map((item, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-background">
                                        <span className="text-primary">✔️</span>
                                        <span className="text-sm">{item}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 text-center p-4 rounded-xl bg-primary/10 border border-primary/30">
                                <p className="font-semibold">
                                    📌 Tudo integrado. Tudo pronto. <span className="text-primary">Sem precisar de outras ferramentas.</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== O PROBLEMA ===== */}
            <section id="problema" className="py-16 md:py-24 bg-destructive/5 border-y border-destructive/20">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <AlertTriangle className="w-8 h-8 text-destructive" />
                            <Badge className="bg-destructive/10 text-destructive border-destructive/20 px-4 py-2">
                                🚨 O Problema
                            </Badge>
                        </div>

                        <h2 className="text-2xl md:text-4xl font-bold font-display text-center mb-8">
                            Hoje, a maioria dos sellers enfrenta o mesmo cenário:
                        </h2>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                            {problems.map((problem, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 p-4 rounded-xl bg-background border border-destructive/30"
                                >
                                    <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                                        <span className="text-destructive font-bold">✗</span>
                                    </div>
                                    <span className="font-medium text-foreground">{problem.text}</span>
                                </div>
                            ))}
                        </div>

                        <div className="text-center p-6 rounded-2xl bg-background border-2 border-destructive/30">
                            <p className="text-lg md:text-xl font-semibold">
                                Não é falta de produto.{' '}
                                <span className="text-destructive">É falta de posicionamento visual e estratégia.</span>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== UVP - PROPOSTA ÚNICA DE VALOR (NOVA) ===== */}
            <section className="py-16 md:py-24 bg-gradient-to-b from-background to-accent/5">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-12">
                            <Badge className="bg-accent/10 text-accent border-accent/20 px-4 py-2 mb-4">
                                <Rocket className="w-4 h-4 mr-2" />
                                Proposta Única de Valor
                            </Badge>
                            <h2 className="text-2xl md:text-4xl font-bold font-display mb-4">
                                Gere imagens profissionais com{' '}
                                <span className="text-gradient-coral">identidade visual exclusiva</span> da sua marca
                            </h2>
                            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                                + SEO + copy + precificação automática, <strong>tudo em um único comando</strong>
                            </p>
                        </div>

                        {/* Resultado Destaque */}
                        <Card className="border-4 border-accent/50 bg-gradient-to-br from-accent/10 to-primary/5 mb-10">
                            <CardContent className="p-8 text-center">
                                <div className="text-xl md:text-2xl font-bold font-display">
                                    🎯 Resultado:
                                </div>
                                <p className="text-2xl md:text-3xl text-accent font-semibold mt-2">
                                    Mais destaque, mais cliques, mais conversão e mais vendas orgânicas
                                </p>
                            </CardContent>
                        </Card>

                        {/* O que resolve */}
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-center mb-6">O que isso resolve:</h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {whatWeResolve.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-3 p-4 rounded-xl bg-background border border-border hover:border-accent/50 transition-colors"
                                    >
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

            {/* ===== A SOLUÇÃO ===== */}
            <section id="solucao" className="py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <Badge className="bg-accent/10 text-accent border-accent/20 px-4 py-2 mb-4">
                                <Check className="w-4 h-4 mr-2" />
                                A Solução
                            </Badge>
                            <h2 className="text-2xl md:text-4xl font-bold font-display mb-4">
                                Um sistema que cria{' '}
                                <span className="text-gradient-coral">anúncios completos</span>, não apenas imagens
                            </h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                Com nosso SaaS você gera:
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {solutions.map((solution, index) => (
                                <Card key={index} className="card-hover border-2 border-border hover:border-accent/50 bg-card">
                                    <CardContent className="p-6">
                                        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                                            <solution.icon className="w-6 h-6 text-accent" />
                                        </div>
                                        <div className="flex items-start gap-2 mb-2">
                                            <Check className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                                            <h3 className="font-bold text-lg">{solution.title}</h3>
                                        </div>
                                        <p className="text-muted-foreground text-sm">{solution.description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="text-center">
                            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 text-primary font-semibold">
                                <Zap className="w-5 h-5" />
                                Tudo em um único comando unificado
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== DIFERENCIAL CÓPIA (NOVA) ===== */}
            <section className="py-16 md:py-24 bg-secondary">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-12">
                            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 mb-4">
                                <Shield className="w-4 h-4 mr-2" />
                                Diferencial Exclusivo
                            </Badge>
                            <h2 className="text-2xl md:text-4xl font-bold font-display mb-4">
                                🛡️ Por que isso é{' '}
                                <span className="text-gradient-coral">diferente de tudo que existe?</span>
                            </h2>
                        </div>

                        {/* Comparação lado a lado */}
                        <div className="grid md:grid-cols-2 gap-6 mb-10">
                            {/* Concorrentes */}
                            <Card className="border-2 border-destructive/30 bg-destructive/5">
                                <CardContent className="p-6">
                                    <h3 className="text-xl font-bold text-center mb-6 text-destructive">❌ CONCORRENTES</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background/80">
                                            <span className="text-destructive text-xl">❌</span>
                                            <span>Imagens genéricas</span>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background/80">
                                            <span className="text-destructive text-xl">❌</span>
                                            <span>Qualquer um pode copiar</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Aqui */}
                            <Card className="border-2 border-accent/50 bg-accent/5">
                                <CardContent className="p-6">
                                    <h3 className="text-xl font-bold text-center mb-6 text-accent">✅ AQUI</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background/80">
                                            <span className="text-accent text-xl">✅</span>
                                            <span>Identidade visual própria</span>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background/80">
                                            <span className="text-accent text-xl">✅</span>
                                            <span>Logo da sua marca</span>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background/80">
                                            <span className="text-accent text-xl">✅</span>
                                            <span>Padrão visual entre anúncios</span>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background/80">
                                            <span className="text-accent text-xl">✅</span>
                                            <span>Reconhecimento e profissionalismo</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Frase Forte */}
                        <Card className="border-4 border-primary/50 bg-gradient-to-r from-primary/10 to-accent/10">
                            <CardContent className="p-8 text-center">
                                <p className="text-2xl md:text-3xl font-bold font-display">
                                    👉 Quem copia imagens, <span className="text-primary">não copia marca.</span>
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* ===== COMO FUNCIONA ===== */}
            <section id="como-funciona" className="py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-12">
                            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 mb-4">
                                🧩 Como Funciona
                            </Badge>
                            <h2 className="text-2xl md:text-4xl font-bold font-display">
                                Simples e Direto
                            </h2>
                        </div>

                        {/* 3 Steps */}
                        <div className="grid md:grid-cols-3 gap-8 mb-12">
                            {/* Step 1 */}
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-coral mx-auto mb-4">
                                    <span className="text-2xl font-bold text-primary-foreground">1</span>
                                </div>
                                <h3 className="text-xl font-bold mb-2">Escolha um pacote</h3>
                                <p className="text-muted-foreground text-sm">
                                    Cada pacote foi pensado para criar uma solução completa, não imagens soltas.
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-coral mx-auto mb-4">
                                    <span className="text-2xl font-bold text-primary-foreground">2</span>
                                </div>
                                <h3 className="text-xl font-bold mb-2">Gere suas imagens</h3>
                                <div className="text-muted-foreground text-sm space-y-1">
                                    <p>• Fundo branco</p>
                                    <p>• Ambientadas</p>
                                    <p>• Em uso</p>
                                    <p>• Com pessoas (dependendo do pacote)</p>
                                </div>
                                <div className="mt-3 p-3 rounded-lg bg-accent/10 text-accent text-xs font-medium">
                                    Sempre com: ✓ Logo aplicada ✓ Identidade visual ✓ Upscale final
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-coral mx-auto mb-4">
                                    <span className="text-2xl font-bold text-primary-foreground">3</span>
                                </div>
                                <h3 className="text-xl font-bold mb-2">Receba o pacote completo</h3>
                                <p className="text-muted-foreground text-sm mb-3">
                                    Além das imagens, você recebe automaticamente:
                                </p>
                                <div className="space-y-1">
                                    {deliverables.map((item, index) => (
                                        <div key={index} className="flex items-center gap-2 text-sm">
                                            <span className="text-primary">📌</span>
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== UPSCALE PREMIUM (NOVA) ===== */}
            <section className="py-16 md:py-24 bg-gradient-to-b from-background to-primary/5">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-10">
                            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 mb-4">
                                <Wand2 className="w-4 h-4 mr-2" />
                                Diferencial Premium
                            </Badge>
                            <h2 className="text-2xl md:text-4xl font-bold font-display">
                                ✨ Upscale Profissional
                            </h2>
                        </div>

                        <Card className="border-4 border-primary/50 bg-gradient-to-br from-primary/10 to-accent/5">
                            <CardContent className="p-8 md:p-12">
                                <div className="text-center mb-8">
                                    <Wand2 className="w-16 h-16 text-primary mx-auto mb-4" />
                                    <p className="text-xl font-semibold mb-4">Após a geração:</p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4 mb-8">
                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-background">
                                        <Check className="w-6 h-6 text-accent shrink-0" />
                                        <span className="font-medium">Todas as imagens passam por upscale automático</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-background">
                                        <Check className="w-6 h-6 text-accent shrink-0" />
                                        <span className="font-medium">Mais nitidez</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-background">
                                        <Check className="w-6 h-6 text-accent shrink-0" />
                                        <span className="font-medium">Mais qualidade</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-background">
                                        <Check className="w-6 h-6 text-accent shrink-0" />
                                        <span className="font-medium">Mais aparência profissional</span>
                                    </div>
                                </div>

                                <div className="text-center p-4 rounded-xl bg-accent/10 border border-accent/30">
                                    <p className="font-semibold text-lg">
                                        📌 Ideal para marketplaces exigentes <span className="text-accent">(Mercado Livre, Amazon, etc.)</span>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* ===== COMANDO UNIFICADO (NOVA) ===== */}
            <section className="py-16 md:py-24 bg-secondary">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <Badge className="bg-accent/10 text-accent border-accent/20 px-4 py-2 mb-4">
                                <Zap className="w-4 h-4 mr-2" />
                                Entrega Completa
                            </Badge>
                            <h2 className="text-2xl md:text-4xl font-bold font-display mb-4">
                                Tudo que é entregue{' '}
                                <span className="text-gradient-coral">junto com cada imagem</span>
                            </h2>
                            <p className="text-lg text-muted-foreground">
                                Cada geração inclui automaticamente:
                            </p>
                        </div>

                        {/* 5 Categorias */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                            {unifiedCommand.map((category, index) => (
                                <Card key={index} className="border-2 border-border hover:border-accent/50 transition-colors">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                                                <category.icon className="w-6 h-6 text-accent" />
                                            </div>
                                            <h3 className="font-bold text-lg">{category.title}</h3>
                                        </div>
                                        <ul className="space-y-2">
                                            {category.items.map((item, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm">
                                                    <span className="text-accent mt-0.5">•</span>
                                                    <span className="text-muted-foreground">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <Card className="border-4 border-primary/50 bg-gradient-to-r from-primary/10 to-accent/10">
                            <CardContent className="p-6 text-center">
                                <p className="text-xl md:text-2xl font-bold font-display">
                                    👉 Nenhuma outra ferramenta <span className="text-primary">entrega isso junto.</span>
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* ===== REGRA DE OURO ===== */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <Card className="border-4 border-primary/50 bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden">
                            <CardContent className="p-8 md:p-12">
                                <div className="flex items-center justify-center gap-3 mb-6">
                                    <Lock className="w-8 h-8 text-primary" />
                                    <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 text-lg">
                                        🔒 Regra de Ouro
                                    </Badge>
                                </div>

                                <h2 className="text-2xl md:text-3xl font-bold font-display text-center mb-8">
                                    Diferencial Forte
                                </h2>

                                <div className="grid md:grid-cols-2 gap-6 mb-8">
                                    <div className="p-6 rounded-2xl bg-background border-2 border-primary/30">
                                        <div className="text-center">
                                            <div className="text-4xl font-bold text-primary mb-2">≤ 6</div>
                                            <div className="font-semibold text-lg mb-2">imagens</div>
                                            <div className="text-muted-foreground">= 1 anúncio completo</div>
                                        </div>
                                    </div>

                                    <div className="p-6 rounded-2xl bg-background border-2 border-accent/30">
                                        <div className="text-center">
                                            <div className="text-4xl font-bold text-accent mb-2">&gt; 6</div>
                                            <div className="font-semibold text-lg mb-2">imagens</div>
                                            <div className="text-muted-foreground">= múltiplos anúncios diferentes</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <p className="text-center font-medium">Todos mantendo:</p>
                                    <div className="flex flex-wrap justify-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <Check className="w-5 h-5 text-accent" />
                                            <span>A mesma identidade visual</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Check className="w-5 h-5 text-accent" />
                                            <span>A mesma logo</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Check className="w-5 h-5 text-accent" />
                                            <span>Branding consistente</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                                    <p className="font-bold text-lg">
                                        ➡️ Seus concorrentes <span className="text-destructive">NÃO conseguem copiar</span>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* ===== PARA QUEM É (NOVA) ===== */}
            <section className="py-16 md:py-24 bg-gradient-to-b from-background to-accent/5">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-12">
                            <Badge className="bg-accent/10 text-accent border-accent/20 px-4 py-2 mb-4">
                                <UserCheck className="w-4 h-4 mr-2" />
                                Público-Alvo
                            </Badge>
                            <h2 className="text-2xl md:text-4xl font-bold font-display mb-4">
                                🚀 Para quem é essa solução?
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                            {targetAudience.map((item, index) => (
                                <Card key={index} className="border-2 border-border hover:border-accent/50 transition-colors">
                                    <CardContent className="p-6 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
                                            <item.icon className="w-6 h-6 text-accent" />
                                        </div>
                                        <span className="font-medium">{item.text}</span>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="text-center p-6 rounded-2xl bg-primary/10 border border-primary/30">
                            <p className="text-lg font-semibold">
                                Para quem quer <span className="text-primary">parar de depender só de preço baixo</span>
                            </p>
                        </div>
                    </div>
                </div>
            </section>


            {/* ===== QUEBRA DE OBJEÇÕES (NOVA) ===== */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 mb-4">
                                <HelpCircle className="w-4 h-4 mr-2" />
                                Tire suas dúvidas
                            </Badge>
                            <h2 className="text-2xl md:text-4xl font-bold font-display">
                                Quebrando Objeções
                            </h2>
                        </div>

                        <div className="grid gap-6">
                            {objections.map((obj, index) => (
                                <Card key={index} className="border-2 border-border hover:border-primary/50 transition-colors">
                                    <CardContent className="p-6 md:p-8">
                                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                                            <div className="flex items-center gap-3 md:w-1/2">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                    <span className="text-lg">❓</span>
                                                </div>
                                                <span className="font-bold text-lg">"{obj.question}"</span>
                                            </div>
                                            <div className="flex items-center gap-3 md:w-1/2">
                                                <ArrowRight className="w-5 h-5 text-accent shrink-0" />
                                                <span className="text-muted-foreground">{obj.answer}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== POR QUE RANKEIA MAIS ===== */}
            <section className="py-16 md:py-24 bg-secondary">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-12">
                            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 mb-4">
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Performance
                            </Badge>
                            <h2 className="text-2xl md:text-4xl font-bold font-display mb-4">
                                Por que isso faz você{' '}
                                <span className="text-gradient-coral">ranquear mais</span>
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {rankingBenefits.map((benefit, index) => (
                                <Card key={index} className="text-center card-hover border-2 hover:border-primary/50">
                                    <CardContent className="p-6">
                                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                            <benefit.icon className="w-7 h-7 text-primary" />
                                        </div>
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <Check className="w-5 h-5 text-accent" />
                                            <h3 className="font-bold">{benefit.title}</h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="text-center p-6 rounded-2xl bg-accent/10 border border-accent/30">
                            <p className="text-lg font-semibold">
                                Marketplaces favorecem anúncios completos, <span className="text-accent">não genéricos</span>.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== GARANTIA (NOVA) ===== */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <Badge className="bg-accent/10 text-accent border-accent/20 px-4 py-2 mb-4">
                                <ShieldCheck className="w-4 h-4 mr-2" />
                                Segurança
                            </Badge>
                            <h2 className="text-2xl md:text-4xl font-bold font-display">
                                🔐 Garantia e Segurança
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-8">
                            {guarantees.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-4 p-5 rounded-xl bg-secondary border border-border"
                                >
                                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                                        <Check className="w-5 h-5 text-accent" />
                                    </div>
                                    <span className="font-medium text-lg">{item}</span>
                                </div>
                            ))}
                        </div>

                        <Card className="border-2 border-accent/30 bg-accent/5">
                            <CardContent className="p-6 text-center">
                                <p className="text-lg font-semibold">
                                    Você só avança se fizer sentido <span className="text-accent">para o seu negócio.</span>
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* ===== EXTRAS ===== */}
            <section className="py-16 md:py-24 bg-secondary">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <Badge className="bg-muted text-muted-foreground border-border px-4 py-2 mb-4">
                                <Plus className="w-4 h-4 mr-2" />
                                Extras (sem obrigação)
                            </Badge>
                            <h2 className="text-2xl md:text-4xl font-bold font-display mb-4">
                                Após gerar seu pacote, você pode:
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-8">
                            {extras.map((extra, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 p-4 rounded-xl bg-background border border-border"
                                >
                                    <Check className="w-5 h-5 text-accent shrink-0" />
                                    <span className="font-medium">{extra}</span>
                                </div>
                            ))}
                        </div>

                        <div className="text-center p-6 rounded-2xl bg-muted border border-border">
                            <p className="flex items-center justify-center gap-2">
                                <span className="text-lg">⚠️</span>
                                <span>O pacote resolve tudo. <strong>O extra é apenas para quem quer ir além.</strong></span>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== FRASE FINAL DE POSICIONAMENTO (NOVA) ===== */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <Card className="border-4 border-primary/50 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 overflow-hidden">
                            <CardContent className="p-10 md:p-16 text-center">
                                <Quote className="w-12 h-12 text-primary/50 mx-auto mb-6" />
                                <p className="text-2xl md:text-4xl font-bold font-display leading-relaxed">
                                    Quem vende barato, <span className="text-destructive">briga por preço.</span>
                                </p>
                                <p className="text-2xl md:text-4xl font-bold font-display leading-relaxed mt-4">
                                    Quem constrói marca, <span className="text-accent">domina o mercado.</span>
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* ===== CTA FINAL ===== */}
            <section className="py-16 md:py-24 bg-foreground text-background relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-10 left-10 w-72 h-72 bg-primary/30 rounded-full blur-3xl" />
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <Badge className="bg-primary/20 text-primary border-primary/30 px-5 py-2.5 text-sm font-semibold mb-6">
                            <Award className="w-4 h-4 mr-2" />
                            🏆 Fechamento
                        </Badge>

                        <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
                            Gere agora imagens profissionais com{' '}
                            <span className="text-primary">identidade visual exclusiva</span>
                        </h2>

                        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 my-8">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">👉</span>
                                <span className="text-xl">Destaque sua marca</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">👉</span>
                                <span className="text-xl">Proteja seus anúncios</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">👉</span>
                                <span className="text-xl">Venda com mais autoridade</span>
                            </div>
                        </div>

                        <Link to="/auth">
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-primary to-coral-dark hover:opacity-90 text-primary-foreground text-lg px-12 py-8 shadow-coral pulse-glow font-bold group"
                            >
                                Finalizar e Começar Agora
                                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="py-8 border-t border-border">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <Link to="/" className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-coral-dark flex items-center justify-center">
                                <Crown className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold">Anúncios Que Vende</span>
                        </Link>

                        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
                            <a href="#problema" className="hover:text-foreground transition-colors">Problema</a>
                            <a href="#solucao" className="hover:text-foreground transition-colors">Solução</a>
                            <a href="#pacotes" className="hover:text-foreground transition-colors">Pacotes</a>
                            <a href="#como-funciona" className="hover:text-foreground transition-colors">Como Funciona</a>
                        </nav>

                        <p className="text-sm text-muted-foreground">
                            © 2025 Anúncios Que Vende. Todos os direitos reservados.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
