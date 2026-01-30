import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, ArrowRight, Zap, Target, Layers, Shield, Rocket, Brain, Image as ImageIcon, Box } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SaaSLandingPage() {
    const navigate = useNavigate();

    const handleCtaClick = () => {
        navigate("/gerador-unificado");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 pb-20">

            {/* 🔥 HEADLINE (DOBRA PRINCIPAL) */}
            <section className="relative pt-20 pb-32 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop')] bg-cover bg-center opacity-5 dark:opacity-10 pointer-events-none" />
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <Badge variant="secondary" className="mb-6 px-4 py-1 text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                        Nova Geração de Anúncios
                    </Badge>
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                        Crie anúncios profissionais <br className="hidden md:block" />
                        <span className="text-blue-600 dark:text-blue-400">impossíveis de copiar</span>
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
                        Com identidade visual única, SEO, copy e precificação automática.
                        Gere imagens com logo, upscale profissional e um pacote completo para rankear, vender mais e dominar os marketplaces.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button
                            size="lg"
                            onClick={handleCtaClick}
                            className="h-14 px-8 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 dark:shadow-blue-900/20 transform hover:-translate-y-1 transition-all rounded-full"
                        >
                            Quero Criar Meu Anúncio Agora
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </section>

            {/* 🚨 O PROBLEMA */}
            <section className="py-20 bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
                <div className="max-w-5xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        <span className="text-red-500">🚨 O Problema:</span> A maioria dos sellers enfrenta o mesmo cenário
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            "Imagens genéricas",
                            "Concorrentes copiando tudo",
                            "Anúncios iguais em todos marketplaces",
                            "Baixa taxa de cliques",
                            "Poucas impressões orgãnicas"
                        ].map((item, i) => (
                            <Card key={i} className="border-red-100 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900/30">
                                <CardContent className="pt-6 flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
                                        <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                                    </div>
                                    <span className="font-medium text-slate-800 dark:text-slate-200">{item}</span>
                                </CardContent>
                            </Card>
                        ))}
                        <Card className="border-slate-200 bg-slate-50 dark:bg-slate-800/50">
                            <CardContent className="pt-6 flex items-center justify-center h-full">
                                <p className="font-semibold text-center text-slate-600 dark:text-slate-400">
                                    Não é falta de produto.<br />É falta de <span className="text-slate-900 dark:text-white">posicionamento visual</span>.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* ✅ A SOLUÇÃO */}
            <section className="py-24 px-4 bg-slate-50 dark:bg-slate-950">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">A Solução Definitiva</h2>
                        <p className="text-xl text-slate-600 dark:text-slate-400">Um sistema que cria anúncios completos, não apenas imagens</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            {[
                                { icon: ImageIcon, text: "Imagens profissionais com LOGO da sua marca" },
                                { icon: Target, text: "Identidade visual única e consistente" },
                                { icon: Zap, text: "Upscale automático para máxima qualidade" },
                                { icon: Layers, text: "Conjuntos estratégicos para anúncios" },
                                { icon: Rocket, text: "SEO + Copy + Precificação + EAN integrados" },
                                { icon: Brain, text: "Tudo em um único comando unificado", highlight: true }
                            ].map((item, i) => (
                                <div key={i} className={`flex items-center gap-4 p-4 rounded-xl transition-all ${item.highlight ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none' : 'bg-white dark:bg-slate-900 shadow-sm hover:shadow-md'}`}>
                                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${item.highlight ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                                        <item.icon className={`h-6 w-6 ${item.highlight ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                                    </div>
                                    <span className={`text-lg font-medium ${item.highlight ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>{item.text}</span>
                                </div>
                            ))}
                        </div>
                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl opacity-20 blur-xl animate-pulse" />
                            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-200 dark:border-slate-800">
                                <div className="aspect-square rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6 overflow-hidden">
                                    <img
                                        src="https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=800"
                                        alt="Dashboard Preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 🧩 COMO FUNCIONA */}
            <section className="py-24 px-4">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-16">Como Funciona (Simplificado)</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <Card className="relative overflow-hidden border-2 border-slate-100 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-8xl text-slate-900 dark:text-white">1</div>
                            <CardHeader>
                                <CardTitle>Escolha um pacote</CardTitle>
                                <CardDescription>Pensado para uma solução completa</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-600 dark:text-slate-300">Cada pacote foi desenhado estrategicamente para que você não tenha apenas imagens soltas, mas um kit de vendas.</p>
                            </CardContent>
                        </Card>

                        <Card className="relative overflow-hidden border-2 border-slate-100 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-8xl text-slate-900 dark:text-white">2</div>
                            <CardHeader>
                                <CardTitle>Gere suas imagens</CardTitle>
                                <CardDescription>Qualidade visual extrema</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex gap-2 items-center text-sm"><Check className="h-4 w-4 text-green-500" /> Fundo branco</div>
                                <div className="flex gap-2 items-center text-sm"><Check className="h-4 w-4 text-green-500" /> Ambientadas</div>
                                <div className="flex gap-2 items-center text-sm"><Check className="h-4 w-4 text-green-500" /> Em uso</div>
                                <div className="flex gap-2 items-center text-sm font-semibold text-blue-600 dark:text-blue-400"><Zap className="h-4 w-4" /> Sempre com Logo & Upscale</div>
                            </CardContent>
                        </Card>

                        <Card className="relative overflow-hidden border-2 border-slate-100 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-8xl text-slate-900 dark:text-white">3</div>
                            <CardHeader>
                                <CardTitle>Receba tudo pronto</CardTitle>
                                <CardDescription>O pacote completo</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-1">
                                {["Descrição SEO", "Palavras-chave", "Copywriting", "Sugestões de Nomes", "Precificação Auto"].map(item => (
                                    <div key={item} className="flex gap-2 items-center text-sm text-slate-600 dark:text-slate-400">
                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" /> {item}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* 🔒 REGRA DE OURO */}
            <section className="py-20 bg-slate-900 text-white dark:bg-slate-950 px-4">
                <div className="max-w-4xl mx-auto text-center border border-slate-700 bg-slate-800/50 rounded-2xl p-10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-yellow-200 to-yellow-500" />
                    <Shield className="h-16 w-16 text-yellow-500 mx-auto mb-6" />
                    <h2 className="text-3xl font-bold mb-6 text-yellow-400">🔒 REGRA DE OURO (Diferencial Forte)</h2>
                    <div className="grid md:grid-cols-2 gap-8 text-left max-w-2xl mx-auto mb-8">
                        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                            <h3 className="font-bold text-lg mb-2">Até 6 imagens</h3>
                            <p className="text-slate-300">Formam 1 anúncio completo ultra-otimizado.</p>
                        </div>
                        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                            <h3 className="font-bold text-lg mb-2">Mais de 6 imagens</h3>
                            <p className="text-slate-300">Permitem criar múltiplos anúncios diferentes com variações.</p>
                        </div>
                    </div>
                    <p className="text-xl font-medium mb-8">
                        Todos mantendo: <span className="text-yellow-400">Mesma identidade, Mesma logo, Branding consistente.</span>
                    </p>
                    <div className="inline-block bg-white/10 backdrop-blur-sm px-6 py-2 rounded-full border border-white/20">
                        ➡️ Seus concorrentes não conseguem copiar
                    </div>
                </div>
            </section>

            {/* 📦 OS PACOTES */}
            <section className="py-24 px-4 bg-slate-50 dark:bg-slate-900/20">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold text-center mb-16">Escolha seu Nível de Dominância</h2>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

                        {/* INTERMEDIARIO */}
                        <Card className="border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all hover:-translate-y-1">
                            <CardHeader>
                                <CardTitle className="text-xl">Intermediário</CardTitle>
                                <CardDescription>Para quem está começando</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    <li className="flex gap-2 text-sm"><Check className="h-4 w-4 text-green-500" /> Fundo branco + Ambientada</li>
                                    <li className="flex gap-2 text-sm"><Check className="h-4 w-4 text-green-500" /> 3 templates Canva</li>
                                    <li className="flex gap-2 text-sm"><Check className="h-4 w-4 text-green-500" /> Identidade visual + Upscale</li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" className="w-full" onClick={handleCtaClick}>Selecionar</Button>
                            </CardFooter>
                        </Card>

                        {/* PROFISSIONAL */}
                        <Card className="border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all hover:-translate-y-1">
                            <CardHeader>
                                <CardTitle className="text-xl">Profissional</CardTitle>
                                <CardDescription>Mais variações visuais</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    <li className="flex gap-2 text-sm"><Check className="h-4 w-4 text-green-500" /> Fundo branco + Ambientada</li>
                                    <li className="flex gap-2 text-sm"><Check className="h-4 w-4 text-green-500" /> 4 templates Canva</li>
                                    <li className="flex gap-2 text-sm"><Check className="h-4 w-4 text-green-500" /> Variações de ângulo</li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" className="w-full" onClick={handleCtaClick}>Selecionar</Button>
                            </CardFooter>
                        </Card>

                        {/* EXPERT */}
                        <Card className="border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 relative scale-105 shadow-xl z-10">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-b-lg uppercase tracking-wider">
                                Mais Escolhido
                            </div>
                            <CardHeader>
                                <CardTitle className="text-2xl text-blue-700 dark:text-blue-400">Expert ⭐</CardTitle>
                                <CardDescription>Máximo equilíbrio</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3 font-medium">
                                    <li className="flex gap-2 text-sm"><Check className="h-4 w-4 text-blue-500" /> Fundo branco</li>
                                    <li className="flex gap-2 text-sm"><Check className="h-4 w-4 text-blue-500" /> Ambientada</li>
                                    <li className="flex gap-2 text-sm"><Check className="h-4 w-4 text-blue-500" /> Em uso</li>
                                    <li className="flex gap-2 text-sm"><Check className="h-4 w-4 text-blue-500" /> 6 templates Canva</li>
                                    <li className="flex gap-2 text-sm"><Check className="h-4 w-4 text-blue-500" /> Alta Performance</li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleCtaClick}>Escolher Expert</Button>
                            </CardFooter>
                        </Card>

                        {/* HARD FULL */}
                        <Card className="border-purple-200 dark:border-purple-800/50 bg-purple-50/30 dark:bg-purple-900/5 hover:shadow-xl transition-all hover:-translate-y-1">
                            <CardHeader>
                                <CardTitle className="text-xl text-purple-700 dark:text-purple-400">Hard Full</CardTitle>
                                <CardDescription>Branding completo</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    <li className="flex gap-2 text-sm"><Check className="h-4 w-4 text-purple-500" /> Todas as anteriores</li>
                                    <li className="flex gap-2 text-sm"><Check className="h-4 w-4 text-purple-500" /> Com pessoas</li>
                                    <li className="flex gap-2 text-sm"><Check className="h-4 w-4 text-purple-500" /> 8 templates Canva</li>
                                    <li className="flex gap-2 text-sm"><Check className="h-4 w-4 text-purple-500" /> Branding Total</li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" className="w-full border-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/20" onClick={handleCtaClick}>Selecionar</Button>
                            </CardFooter>
                        </Card>

                    </div>
                </div>
            </section>

            {/* 📈 POR QUE RANQUEAR */}
            <section className="py-20 bg-white dark:bg-slate-950">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-12">Por que isso faz você rankear mais?</h2>
                    <div className="grid sm:grid-cols-2 gap-8">
                        <div className="flex items-start gap-4 text-left p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
                            <div className="bg-green-100 p-2 rounded-lg text-green-600"><Target className="h-6 w-6" /></div>
                            <div>
                                <h4 className="font-bold mb-1">Visual Profissional</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Aumenta drasticamente o CTR (taxa de cliques).</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 text-left p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
                            <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Rocket className="h-6 w-6" /></div>
                            <div>
                                <h4 className="font-bold mb-1">SEO Estruturado</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Melhora a indexação e visibilidade orgânica.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 text-left p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
                            <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><Brain className="h-6 w-6" /></div>
                            <div>
                                <h4 className="font-bold mb-1">Identidade Visual</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Gera reconhecimento de marca imediato.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 text-left p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
                            <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Box className="h-6 w-6" /></div>
                            <div>
                                <h4 className="font-bold mb-1">Mais Anúncios</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Mais impressões orgânicas e domínio da prateleira.</p>
                            </div>
                        </div>
                    </div>
                    <p className="mt-8 text-lg font-medium text-slate-500 italic">Marketplaces favorecem anúncios completos, não genéricos.</p>
                </div>
            </section>

            {/* 🏆 FECHAMENTO */}
            <section className="py-24 px-4 bg-gradient-to-b from-slate-900 to-black text-white text-center">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-4xl font-black mb-6">Você não está comprando imagens</h2>
                    <p className="text-2xl text-slate-300 mb-10">Está construindo <span className="text-blue-400 font-bold">autoridade visual</span></p>

                    <Button
                        size="lg"
                        onClick={handleCtaClick}
                        className="h-16 px-10 text-xl font-bold bg-white text-slate-900 hover:bg-slate-200 hover:scale-105 transition-all rounded-full shadow-2xl shadow-blue-900/50"
                    >
                        Criar Meu Anúncio Profissional Agora
                    </Button>

                    <p className="mt-12 text-sm text-slate-500">
                        ⚠️ O pacote resolve tudo. O extra é apenas para quem quer ir além.
                    </p>
                </div>
            </section>

        </div>
    );
}
