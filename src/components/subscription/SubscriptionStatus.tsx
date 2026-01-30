import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Calendar, Settings, Loader2, AlertTriangle } from 'lucide-react';
import { SubscriptionStatus as SubscriptionStatusType } from '@/hooks/useSubscription';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SubscriptionStatusProps {
  subscription: SubscriptionStatusType;
  isLoading: boolean;
  onManageSubscription: () => void;
  isManaging?: boolean;
}

export const SubscriptionStatusComponent = ({
  subscription,
  isLoading,
  onManageSubscription,
  isManaging = false,
}: SubscriptionStatusProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!subscription.subscribed) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="w-5 h-5" />
            Sem Assinatura Ativa
          </CardTitle>
          <CardDescription className="text-amber-700 dark:text-amber-300">
            Você precisa de uma assinatura para acessar a plataforma
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const planName = subscription.planType === 'yearly' ? 'Plano Anual' : 'Plano Mensal';
  const endDate = subscription.subscriptionEnd 
    ? format(new Date(subscription.subscriptionEnd), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">{planName}</CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              Ativo
            </Badge>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onManageSubscription}
            disabled={isManaging}
          >
            {isManaging ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Settings className="w-4 h-4 mr-2" />
                Gerenciar
              </>
            )}
          </Button>
        </div>
        {endDate && (
          <CardDescription className="flex items-center gap-2 mt-2">
            <Calendar className="w-4 h-4" />
            Próxima cobrança: {endDate}
          </CardDescription>
        )}
      </CardHeader>
    </Card>
  );
};
