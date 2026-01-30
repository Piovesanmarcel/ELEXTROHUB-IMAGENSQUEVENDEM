import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    Check,
    Zap,
    Clock,
    DollarSign,
    Sparkles,
    TrendingUp,
    Shield,
    Users,
    ChevronDown,
    Star,
    Rocket,
    Target,
    Award,
    BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const SubscriptionLanding = () => {
    const navigate = useNavigate();
    const [activeFaq, setActiveFaq] = useState<string>('');

    const benefits = [
        {
            icon: Clock,
            title: 'Economia de Tempo',
            description: 'Gere imagens profissionais em 3 segundos. Não perca mais horas editando no Photoshop.',
            stat: '99% mais rápido',
            color: 'from-blue-500 to-cyan-500'
        },
        {
            icon: DollarSign,
            title: 'Redução de Custos',
            description: 'Elimine gastos com designers e softwares caros. Uma fração do custo tradicional.',
            stat: 'Economia de 90%',
            color: 'from-green-500 to-emerald-500'
        },
        {
            icon: Sparkles,
            title: 'Qualidade Profissional',
            description: 'IA treinada para criar imagens de alta qualidade para todos os marketplaces.',
            stat: 'Qualidade 4K',
            color: 'from-purple-500 to-pink-500'
        },
        {
            icon: TrendingUp,
            title: 'Aumente suas Vendas',
            description: 'Imagens atrativas aumentam conversão. Destaque-se da concorrência.',
            stat: '+40% conversão',
            color: 'from-orange-500 to-red-500'
        },
        {
            icon: Target,
            title: 'Múltiplos Marketplaces',
            description: 'Otimizado para Shein, Amazon, Mercado Livre, Shopee e muito mais.',
            stat: '10+ plataformas',
            color: 'from-indigo-500 to-violet-500'
        },
        {
            icon: Rocket,
            title: 'Escale seu Negócio',
            description: 'Processe centenas de produtos por dia sem esforço manual.',
            stat: 'Ilimitado',
            color: 'from-amber-500 to-yellow-500'
        }
    ];

    const comparison = [
        { aspect: 'Tempo por imagem', photoshop: '1 hora', ia: '3 segundos', winner: 'ia' },
        { aspect: 'Custo mensal', photoshop: 'R$ 2.000+', ia: 'R$ 29,90', winner: 'ia' },
        { aspect: 'Qualidade', photoshop: 'Depende do designer', ia: 'Consistente e profissional', winner: 'ia' },
        { aspect: 'Escalabilidade', photoshop: 'Limitada', ia: 'Ilimitada', winner: 'ia' },
        { aspect: 'Aprendizado', photoshop: 'Meses de prática', ia: 'Imediato', winner: 'ia' }
    ];

    const plans = [
        {
            id: 'monthly',
            name: 'Mensal',
            price: 69.90,
            pricePerMonth: 69.90,
            description: 'Perfeito para começar',
            features: [
                'Acesso completo à plataforma',
                'Geração ilimitada de imagens',
                'Suporte por email',
                'Atualizações gratuitas',
                'Cancele quando quiser'
            ],
            popular: false
        },
        {
            id: 'yearly',
            name: 'Anual',
            price: 358.80,
            pricePerMonth: 29.90,
            description: 'Melhor custo-benefício',
            features: [
                'Tudo do plano mensal',
                'Economia de 57% (R$ 480/ano)',
                'Suporte prioritário',
                'Acesso antecipado a novidades',
                '2 meses grátis'
            ],
            popular: true,
            badge: 'MAIS POPULAR'
        }
    ];

    const faqs = [
        {
            question: 'Como funciona a geração de imagens?',
            answer: 'Nossa IA analisa sua imagem de produto e automaticamente remove o fundo, ajusta iluminação, aplica efeitos profissionais e gera variações otimizadas para cada marketplace. Tudo em segundos.'
        },
        {
            question: 'Preciso ter conhecimento técnico?',
            answer: 'Não! A plataforma é extremamente intuitiva. Basta fazer upload da imagem do produto e nossa IA faz todo o trabalho pesado. Qualquer pessoa consegue usar.'
        },
        {
            question: 'Posso cancelar a qualquer momento?',
            answer: 'Sim! Não há fidelidade. Você pode cancelar sua assinatura a qualquer momento pelo painel de controle. Sem taxas de cancelamento.'
        },
        {
            question: 'Qual a diferença entre assinatura e créditos?',
            answer: 'A assinatura dá acesso à plataforma. Os créditos são usados para gerar imagens e são comprados separadamente conforme sua necessidade.'
        },
        {
            question: 'As imagens geradas têm direitos autorais?',
            answer: 'Sim! Todas as imagens geradas são 100% suas. Você pode usar comercialmente sem restrições em qualquer plataforma.'
        },
        {
            question: 'Funciona para todos os tipos de produtos?',
            answer: 'Sim! Nossa IA é treinada para trabalhar com roupas, acessórios, eletrônicos, decoração e praticamente qualquer tipo de produto físico.'
        }
    ];

    const testimonials = [
        {
            name: 'Maria Silva',
            role: 'Vendedora Shein',
            avatar: '👩‍💼',
            text: 'Antes eu gastava 2 horas editando cada foto. Agora faço 100 produtos em minutos!',
            rating: 5
        },
        {
            name: 'João Santos',
            role: 'Lojista Amazon',
            avatar: '👨‍💻',
            text: 'Minhas vendas aumentaram 35% depois que comecei a usar imagens profissionais.',
            rating: 5
        },
        {
            name: 'Ana Costa',
            role: 'Dropshipper',
            avatar: '👩‍🎨',
            text: 'Economizo mais de R$ 2.000 por mês que gastava com designer freelancer.',
            rating: 5
        }
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 border-b">
                <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px]" />
                <div className="container mx-auto px-4 py-16 md:py-24 relative">
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        {/* Badge */}
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 px-4 py-1.5 text-sm">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Tecnologia de IA Avançada
                        </Badge>

                        {/* Headline */}
                        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
                            Crie Imagens Profissionais para E-commerce em 3 Segundos
                        </h1>

                        {/* Subheadline */}
                        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                            Pare de perder tempo e dinheiro com Photoshop. Nossa IA gera imagens de alta qualidade para todos os marketplaces automaticamente.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg group"
                                onClick={() => navigate('/planos')}
                            >
                                Começar Agora
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="px-8 py-6 text-lg"
                                onClick={() => document.getElementById('comparison')?.scrollIntoView({ behavior: 'smooth' })}
                            >
                                Ver Comparação
                                <ChevronDown className="ml-2 w-5 h-5" />
                            </Button>
                        </div>

                        {/* Social Proof */}
                        <div className="flex flex-wrap justify-center items-center gap-8 pt-8 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span>+1.000 vendedores</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                <span>4.9/5 avaliação</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4" />
                                <span>+100k imagens geradas</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Problem/Solution Section */}
            <section className="container mx-auto px-4 py-16 md:py-24">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Problem */}
                        <Card className="border-2 border-red-500/20 bg-gradient-to-br from-red-500/5 to-orange-500/5">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
                                    <Clock className="w-6 h-6 text-red-600" />
                                </div>
                                <CardTitle className="text-2xl">O Problema</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-muted-foreground">❌ Horas editando cada imagem no Photoshop</p>
                                <p className="text-muted-foreground">❌ Gastos altos com designers freelancers</p>
                                <p className="text-muted-foreground">❌ Resultados inconsistentes</p>
                                <p className="text-muted-foreground">❌ Dificuldade para escalar o negócio</p>
                                <p className="text-muted-foreground">❌ Imagens amadoras que não convertem</p>
                            </CardContent>
                        </Card>

                        {/* Solution */}
                        <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                                    <Zap className="w-6 h-6 text-green-600" />
                                </div>
                                <CardTitle className="text-2xl">A Solução</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-muted-foreground">✅ Geração automática em 3 segundos</p>
                                <p className="text-muted-foreground">✅ Economia de até 90% nos custos</p>
                                <p className="text-muted-foreground">✅ Qualidade profissional garantida</p>
                                <p className="text-muted-foreground">✅ Processe centenas de produtos por dia</p>
                                <p className="text-muted-foreground">✅ Imagens otimizadas que vendem mais</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Benefits Grid */}
            <section className="bg-muted/30 py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Por Que Escolher Nossa Plataforma?</h2>
                            <p className="text-xl text-muted-foreground">Benefícios que transformam seu negócio</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {benefits.map((benefit, idx) => (
                                <Card key={idx} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                                    <CardHeader>
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${benefit.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                            <benefit.icon className="w-6 h-6 text-white" />
                                        </div>
                                        <CardTitle className="text-xl">{benefit.title}</CardTitle>
                                        <Badge variant="secondary" className="w-fit">{benefit.stat}</Badge>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground">{benefit.description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Comparison Table */}
            <section id="comparison" className="container mx-auto px-4 py-16 md:py-24">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <Badge className="bg-gradient-to-r from-red-500 to-amber-500 text-white border-0 mb-4">
                            Comparação Direta
                        </Badge>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Photoshop vs Nossa IA</h2>
                        <p className="text-xl text-muted-foreground">Veja a diferença na prática</p>
                    </div>

                    <Card className="overflow-hidden">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="text-left p-4 font-semibold">Aspecto</th>
                                            <th className="text-center p-4 font-semibold text-red-600">Photoshop</th>
                                            <th className="text-center p-4 font-semibold text-green-600">Nossa IA</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {comparison.map((item, idx) => (
                                            <tr key={idx} className="border-t hover:bg-muted/50 transition-colors">
                                                <td className="p-4 font-medium">{item.aspect}</td>
                                                <td className="p-4 text-center text-muted-foreground">{item.photoshop}</td>
                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Check className="w-4 h-4 text-green-600" />
                                                        <span className="font-semibold text-green-600">{item.ia}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="mt-8 p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20 text-center">
                        <p className="text-2xl font-bold text-green-600 mb-2">Economia Total: R$ 1.970 por mês</p>
                        <p className="text-muted-foreground">Baseado em 100 imagens/mês vs designer freelancer</p>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="bg-muted/30 py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">O Que Nossos Clientes Dizem</h2>
                            <p className="text-xl text-muted-foreground">Resultados reais de vendedores reais</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            {testimonials.map((testimonial, idx) => (
                                <Card key={idx} className="hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="text-4xl">{testimonial.avatar}</div>
                                            <div>
                                                <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                                                <CardDescription>{testimonial.role}</CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            {[...Array(testimonial.rating)].map((_, i) => (
                                                <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                            ))}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground italic">"{testimonial.text}"</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section className="container mx-auto px-4 py-16 md:py-24">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Escolha Seu Plano</h2>
                        <p className="text-xl text-muted-foreground">Comece hoje e transforme seu negócio</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {plans.map((plan) => (
                            <Card
                                key={plan.id}
                                className={`relative ${plan.popular ? 'border-2 border-primary shadow-xl scale-105' : ''}`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 px-4 py-1">
                                            {plan.badge}
                                        </Badge>
                                    </div>
                                )}

                                <CardHeader className="text-center pb-8 pt-6">
                                    <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                                    <CardDescription className="text-base">{plan.description}</CardDescription>
                                    <div className="mt-4">
                                        <div className="flex items-baseline justify-center gap-2">
                                            <span className="text-5xl font-bold">R$ {plan.pricePerMonth.toFixed(2)}</span>
                                            <span className="text-muted-foreground">/mês</span>
                                        </div>
                                        {plan.id === 'yearly' && (
                                            <p className="text-sm text-muted-foreground mt-2">
                                                Cobrado anualmente (R$ {plan.price.toFixed(2)})
                                            </p>
                                        )}
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-6">
                                    <ul className="space-y-3">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                                <span className="text-muted-foreground">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        className={`w-full py-6 text-lg ${plan.popular
                                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                                                : ''
                                            }`}
                                        variant={plan.popular ? 'default' : 'outline'}
                                        onClick={() => navigate('/planos')}
                                    >
                                        {plan.popular ? 'Começar Agora' : 'Selecionar Plano'}
                                        <ArrowRight className="ml-2 w-5 h-5" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <p className="text-center text-sm text-muted-foreground mt-8">
                        💳 Pagamento seguro via Stripe • 🔒 Cancele quando quiser • ✅ Sem taxas ocultas
                    </p>
                </div>
            </section>

            {/* FAQ */}
            <section className="bg-muted/30 py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Perguntas Frequentes</h2>
                            <p className="text-xl text-muted-foreground">Tire suas dúvidas</p>
                        </div>

                        <Accordion type="single" collapsible className="space-y-4">
                            {faqs.map((faq, idx) => (
                                <AccordionItem key={idx} value={`item-${idx}`} className="bg-card border rounded-lg px-6">
                                    <AccordionTrigger className="text-left hover:no-underline">
                                        <span className="font-semibold">{faq.question}</span>
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground">
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="container mx-auto px-4 py-16 md:py-24">
                <div className="max-w-4xl mx-auto">
                    <Card className="bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 border-2 border-primary/20">
                        <CardContent className="p-12 text-center space-y-6">
                            <Award className="w-16 h-16 mx-auto text-primary" />
                            <h2 className="text-3xl md:text-4xl font-bold">
                                Pronto para Transformar Seu Negócio?
                            </h2>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                                Junte-se a milhares de vendedores que já economizam tempo e dinheiro com nossa plataforma de IA.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                                <Button
                                    size="lg"
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg group"
                                    onClick={() => navigate('/planos')}
                                >
                                    Começar Agora Grátis
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="px-8 py-6 text-lg"
                                    onClick={() => navigate('/auth')}
                                >
                                    Já tenho conta
                                </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Sem cartão de crédito necessário para testar • Cancele quando quiser
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t bg-muted/30 py-8">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                        <p>© 2026 Gerador de Imagens IA. Todos os direitos reservados.</p>
                        <div className="flex gap-6">
                            <button onClick={() => navigate('/marketing-content')} className="hover:text-foreground transition-colors">
                                Conteúdo Marketing
                            </button>
                            <button onClick={() => navigate('/planos')} className="hover:text-foreground transition-colors">
                                Planos
                            </button>
                            <button onClick={() => navigate('/auth')} className="hover:text-foreground transition-colors">
                                Login
                            </button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default SubscriptionLanding;
