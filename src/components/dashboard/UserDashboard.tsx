import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { 
  Sparkles, 
  Image, 
  TrendingUp, 
  CreditCard,
  Zap,
  Star,
  ArrowRight,
  CheckCircle,
  Gift
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

export const UserDashboard = () => {
  const { credits, creditsUsed } = useUserRole();
  const totalCredits = credits + creditsUsed;
  const usagePercentage = totalCredits > 0 ? (creditsUsed / totalCredits) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Header com Copy de Conversão */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-yellow-300" />
            <Badge className="bg-yellow-400 text-yellow-900 font-bold">TRANSFORME SUAS VENDAS</Badge>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Imagens Profissionais = <span className="text-yellow-300">Mais Vendas</span>
          </h1>
          
          <p className="text-lg text-indigo-100 mb-6 max-w-2xl leading-relaxed">
            Seus concorrentes já descobriram: <strong className="text-white">fotos profissionais aumentam conversões em até 40%</strong>. 
            Nossos Agentes de Conversão transformam suas imagens em segundos, criando descrições que vendem e 
            palavras-chave que colocam seus produtos no topo das buscas.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link to="/produtos">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold">
                <Image className="mr-2 h-5 w-5" />
                Melhorar Minhas Imagens
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/comprar-creditos">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/20">
                <CreditCard className="mr-2 h-5 w-5" />
                Comprar Mais Créditos
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Decoração */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-pink-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Card de Créditos */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Seus Créditos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold text-primary">{credits}</div>
                <p className="text-sm text-muted-foreground">créditos disponíveis</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold text-muted-foreground">{creditsUsed}</div>
                <p className="text-sm text-muted-foreground">créditos usados</p>
              </div>
            </div>
            
            <Progress value={100 - usagePercentage} className="h-3" />
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{usagePercentage.toFixed(0)}% utilizado</span>
              <Link to="/comprar-creditos">
                <Button variant="link" className="text-primary p-0">
                  Comprar mais créditos →
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Gift className="h-5 w-5" />
              Bônus de Indicação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-600 mb-4">
              Indique amigos e ganhe <strong>50 créditos</strong> por cada indicação!
            </p>
            <Link to="/indicacoes">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <Star className="mr-2 h-4 w-4" />
                Indicar Agora
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Por que imagens profissionais importam */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            Por que investir em imagens profissionais?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-900">+40% Conversão</span>
              </div>
              <p className="text-sm text-blue-700">
                Produtos com fotos profissionais têm taxa de conversão 40% maior que imagens amadoras.
              </p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-purple-600" />
                <span className="font-semibold text-purple-900">-35% Devoluções</span>
              </div>
              <p className="text-sm text-purple-700">
                Imagens claras e detalhadas reduzem devoluções porque clientes sabem exatamente o que estão comprando.
              </p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-900">Top do Ranking</span>
              </div>
              <p className="text-sm text-green-700">
                Marketplaces priorizam anúncios com imagens de qualidade, aumentando sua visibilidade orgânica.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Final */}
      <div className="text-center p-8 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-2xl border">
        <h2 className="text-2xl font-bold mb-3">
          Cada crédito é um passo para vender mais! 🚀
        </h2>
        <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
          Não deixe suas vendas para depois. Comece agora a transformar suas imagens 
          e veja a diferença nos resultados.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/produtos">
            <Button size="lg">
              <Image className="mr-2 h-5 w-5" />
              Começar Agora
            </Button>
          </Link>
          <Link to="/comprar-creditos">
            <Button size="lg" variant="outline">
              <CreditCard className="mr-2 h-5 w-5" />
              Ver Pacotes de Créditos
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
