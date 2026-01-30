import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Crown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubscriptionPlanCardProps {
  name: string;
  price: number;
  pricePerMonth: number;
  interval: 'month' | 'year';
  features: string[];
  isCurrentPlan?: boolean;
  isPopular?: boolean;
  onSelect: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const SubscriptionPlanCard = ({
  name,
  price,
  pricePerMonth,
  interval,
  features,
  isCurrentPlan = false,
  isPopular = false,
  onSelect,
  isLoading = false,
  disabled = false,
}: SubscriptionPlanCardProps) => {
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card className={cn(
      "relative flex flex-col transition-all duration-300 hover:shadow-xl",
      isCurrentPlan && "ring-2 ring-primary border-primary",
      isPopular && !isCurrentPlan && "ring-2 ring-amber-500 border-amber-500"
    )}>
      {isCurrentPlan && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
          <Crown className="w-3 h-3 mr-1" />
          Seu Plano
        </Badge>
      )}
      
      {isPopular && !isCurrentPlan && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white">
          <Sparkles className="w-3 h-3 mr-1" />
          Mais Popular
        </Badge>
      )}

      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl">{name}</CardTitle>
        <CardDescription>
          {interval === 'year' ? 'Cobrança anual' : 'Cobrança mensal'}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="text-center mb-6">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold">{formatPrice(pricePerMonth)}</span>
            <span className="text-muted-foreground">/mês</span>
          </div>
          {interval === 'year' && (
            <p className="text-sm text-muted-foreground mt-1">
              {formatPrice(price)} cobrados anualmente
            </p>
          )}
          {interval === 'year' && (
            <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              Economia de 57%
            </Badge>
          )}
        </div>

        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={isCurrentPlan ? "outline" : isPopular ? "default" : "secondary"}
          onClick={onSelect}
          disabled={disabled || isLoading || isCurrentPlan}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : isCurrentPlan ? (
            'Plano Atual'
          ) : (
            'Assinar Agora'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
