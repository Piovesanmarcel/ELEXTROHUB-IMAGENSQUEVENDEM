import { Crown, Shield, Target, Users, AlertTriangle, Check, X, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const BrandingSection = () => {
  const brandBenefits = [
    {
      icon: Shield,
      title: "Proteção Anti-Cópia",
      description: "Concorrentes NÃO podem copiar suas fotos. Suas imagens são únicas e proprietárias.",
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-500/10"
    },
    {
      icon: Sparkles,
      title: "Reconhecimento Instantâneo",
      description: "Clientes reconhecem sua marca entre centenas de anúncios. Familiaridade = Confiança = Vendas.",
      color: "text-violet-500",
      bgColor: "bg-violet-50 dark:bg-violet-500/10"
    },
    {
      icon: Target,
      title: "Destaque nas Buscas",
      description: "Anúncios com identidade visual forte aparecem primeiro. Mais cliques = Mais vendas.",
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-500/10"
    },
    {
      icon: Users,
      title: "Fidelização Natural",
      description: "Cliente que comprou uma vez reconhece sua marca. Volta a comprar e indica para amigos.",
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-500/10"
    }
  ];

  const stats = [
    { value: "73%", label: "dos vendedores já tiveram fotos copiadas" },
    { value: "+40%", label: "cliques em anúncios com logo" },
    { value: "3x", label: "mais retorno de clientes fiéis" }
  ];

  return (
    <section className="py-14 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        {/* Problem Hook - Alert Banner */}
        <div className="max-w-3xl mx-auto mb-10">
          <div className="bg-gradient-to-r from-red-500/10 via-orange-500/10 to-amber-500/10 border border-red-500/20 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  Suas fotos de produto podem estar sendo <span className="text-red-500">ROUBADAS</span> agora mesmo
                </h3>
                <p className="text-muted-foreground">
                  Concorrentes copiam suas imagens e vendem mais barato. 
                  <span className="font-medium text-foreground"> Você perde vendas com seu próprio trabalho.</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 px-4 py-2 mb-4">
            <Crown className="w-4 h-4 mr-2" />
            Branding Automático
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
            Sua Logo = Sua Proteção = {' '}
            <span className="text-gradient-coral">Suas Vendas</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Adicione sua marca automaticamente em todas as imagens. 
            Proteja seu conteúdo e crie reconhecimento instantâneo.
          </p>
        </div>

        {/* Social Proof Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-10">
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-4 bg-card/50 rounded-xl border border-border/50">
              <div className="text-2xl md:text-3xl font-bold text-primary mb-1">{stat.value}</div>
              <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Grid de benefícios - 4 cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto mb-10">
          {brandBenefits.map((benefit, index) => (
            <Card 
              key={index} 
              className="text-center border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <CardContent className="p-5">
                <div className={`w-12 h-12 ${benefit.bgColor} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                  <benefit.icon className={`w-6 h-6 ${benefit.color}`} />
                </div>
                <h3 className="font-bold text-base mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>


      </div>
    </section>
  );
};

export default BrandingSection;
