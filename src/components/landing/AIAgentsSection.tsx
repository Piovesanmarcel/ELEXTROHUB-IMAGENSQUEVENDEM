import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight } from 'lucide-react';
import AIAgentCard from './AIAgentCard';

const aiAgents = [
  {
    name: "ATLAS",
    role: "O Estrategista",
    description: "Analisa seu produto em segundos, identifica público-alvo, ambientes ideais e traça a estratégia de marketing perfeita para maximizar suas vendas.",
    quote: "Eu entendo seu produto e traço a estratégia perfeita.",
    abilities: ["Análise de Produto", "Público-Alvo", "Palavras-chave", "Estratégia"],
    agent: "atlas" as const,
    badge: "Comando Unificado"
  },
  {
    name: "LYRA",
    role: "A Persuasora",
    description: "Transforma características em textos que vendem. Cria copys persuasivas, títulos SEO, FAQ automático e gatilhos emocionais irresistíveis.",
    quote: "Transformo dúvidas em decisões de compra.",
    abilities: ["Copy Persuasiva", "30+ Títulos SEO", "FAQ Automático", "Gatilhos"],
    agent: "lyra" as const,
    badge: "Copywriting + SEO"
  },
  {
    name: "ORION",
    role: "O Artista Visual",
    description: "Cria imagens profissionais em resolução 4K que capturam atenção. Remove fundos, gera cenários únicos e aplica upscale automático.",
    quote: "Transformo qualquer foto em imagem 4K que vende.",
    abilities: ["36+ Imagens", "Upscale 4K", "Cenários Pro", "Templates"],
    agent: "orion" as const,
    badge: "Geração Visual 4K"
  }
];

const AIAgentsSection = () => {
  return (
    <section className="py-10 md:py-14 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-blue-500/5 blob blur-3xl" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-violet-500/5 blob blur-3xl" />
      <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-primary/5 blob blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge className="bg-primary/10 text-primary border-primary/20 px-5 py-2.5 mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            Agentes de Conversão
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-6">
            Conheça Nossos{' '}
            <span className="text-gradient-coral">Agentes de Conversão</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            3 agentes inteligentes trabalhando juntos para criar anúncios perfeitos que vendem mais
          </p>
        </div>

        {/* Agents Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {aiAgents.map((agent, index) => (
            <AIAgentCard key={index} {...agent} />
          ))}
        </div>

        {/* Workflow Timeline */}
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-2">
            {/* ATLAS */}
            <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 shadow-[0_0_20px_-8px_hsl(200,100%,50%)]">
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              <span className="font-semibold text-blue-400">ATLAS</span>
              <span className="text-muted-foreground text-sm">analisa</span>
            </div>

            {/* Linha Animada 1 */}
            <svg className="w-12 h-4 hidden md:block" style={{ color: 'rgba(148, 163, 184, 0.5)' }}>
              <path d="M0 8 L48 8" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4">
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="16"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </path>
            </svg>
            <div className="w-px h-6 bg-muted-foreground/30 md:hidden" />

            {/* LYRA */}
            <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 shadow-[0_0_20px_-8px_hsl(280,100%,50%)]">
              <div className="w-3 h-3 rounded-full bg-violet-500 animate-pulse" style={{ animationDelay: '0.3s' }} />
              <span className="font-semibold text-violet-400">LYRA</span>
              <span className="text-muted-foreground text-sm">escreve</span>
            </div>

            {/* Linha Animada 2 */}
            <svg className="w-12 h-4 hidden md:block" style={{ color: 'rgba(148, 163, 184, 0.5)' }}>
              <path d="M0 8 L48 8" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4">
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="16"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </path>
            </svg>
            <div className="w-px h-6 bg-muted-foreground/30 md:hidden" />

            {/* ORION */}
            <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-[0_0_20px_-8px_hsl(25,100%,50%)]">
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.6s' }} />
              <span className="font-semibold text-primary">ORION</span>
              <span className="text-muted-foreground text-sm">cria</span>
            </div>
          </div>

          <p className="text-center text-muted-foreground text-sm mt-6">
            Trabalhando em sincronia para entregar anúncios completos em segundos
          </p>
        </div>
      </div>
    </section>
  );
};

export default AIAgentsSection;
