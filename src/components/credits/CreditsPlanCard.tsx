
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  credits: number;
  price: number;
  popular: boolean;
  savings: number;
  description: string;
}

interface CreditsPlanCardProps {
  plan: Plan;
  index: number;
  isProcessing: boolean;
  selectedPlan: string | null;
  onPurchase: (planId: string) => void;
}

export const CreditsPlanCard = ({
  plan,
  index,
  isProcessing,
  selectedPlan,
  onPurchase
}: CreditsPlanCardProps) => {
  const pricePerCredit = plan.price / plan.credits;

  // Cores para cada plano baseado no índice
  const planColors = [
    {
      // Pro - Azul
      border: 'border-blue-500/50 hover:border-blue-500/70',
      shadow: 'shadow-[0_0_25px_-10px_hsl(200,100%,50%)] hover:shadow-[0_0_35px_-8px_hsl(200,100%,50%)]',
      bg: 'bg-gradient-to-b from-blue-500/5 to-blue-500/0'
    },
    {
      // Standard - Laranja (popular)
      border: 'border-primary/50 hover:border-primary/70',
      shadow: 'shadow-[0_0_30px_-8px_rgba(249,115,22,0.3)] hover:shadow-[0_0_40px_-6px_rgba(249,115,22,0.4)]',
      bg: 'bg-gradient-to-b from-primary/10 to-primary/5'
    },
    {
      // Avançado - Verde
      border: 'border-green-500/50 hover:border-green-500/70',
      shadow: 'shadow-[0_0_25px_-10px_hsl(142,76%,36%)] hover:shadow-[0_0_35px_-8px_hsl(142,76%,36%)]',
      bg: 'bg-gradient-to-b from-green-500/5 to-green-500/0'
    },
    {
      // Premium - Roxo
      border: 'border-violet-500/50 hover:border-violet-500/70',
      shadow: 'shadow-[0_0_25px_-10px_hsl(280,100%,50%)] hover:shadow-[0_0_35px_-8px_hsl(280,100%,50%)]',
      bg: 'bg-gradient-to-b from-violet-500/5 to-violet-500/0'
    }
  ];

  const colors = planColors[index] || planColors[0];

  return (
    <Card
      className={cn(
        "relative flex flex-col h-full transition-all duration-300 border-2",
        "hover:scale-105 hover:-translate-y-2",
        colors.border,
        colors.shadow,
        colors.bg,
        plan.popular && 'scale-[1.02]'
      )}
      style={{
        animation: `fade-in 0.5s ease-out ${index * 0.15}s forwards`,
        opacity: 0
      }}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <Badge className="bg-primary text-primary-foreground px-4 py-1.5 text-sm font-semibold shadow-lg animate-pulse">
            <Sparkles className="w-4 h-4 mr-1.5" />
            Mais Popular
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center pb-2 pt-8">
        <CardTitle className="text-xl lg:text-2xl font-bold">{plan.name}</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
      </CardHeader>
      
      <CardContent className="flex flex-col flex-grow pt-2">
        <div className="text-center mb-6">
          <div className="text-4xl lg:text-5xl font-bold text-primary">
            R$ {plan.price.toFixed(2).replace('.', ',')}
          </div>
          <div className="text-base lg:text-lg font-medium text-foreground mt-2">
            {plan.credits.toLocaleString('pt-BR')} créditos
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            R$ {pricePerCredit.toFixed(2).replace('.', ',')} por imagem
          </div>
          {plan.savings > 0 && (
            <Badge variant="secondary" className="mt-3 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-sm px-3 py-1">
              <Zap className="w-4 h-4 mr-1" />
              Economize {plan.savings}%
            </Badge>
          )}
        </div>
        
        <div className="space-y-3 mb-6 flex-grow">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span className="text-sm">Melhoria de {plan.credits} imagens</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span className="text-sm">Super resolução (até 4x)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span className="text-sm">Correção de cores</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span className="text-sm">Processamento em lote</span>
          </div>
        </div>
        
        <Button 
          className={cn(
            "w-full mt-auto text-base py-5",
            plan.popular && "shadow-lg"
          )}
          size="lg"
          onClick={() => onPurchase(plan.id)}
          disabled={isProcessing}
          variant={plan.popular ? "default" : "outline"}
        >
          {isProcessing && selectedPlan === plan.id ? (
            "Processando..."
          ) : (
            `Comprar Agora`
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
