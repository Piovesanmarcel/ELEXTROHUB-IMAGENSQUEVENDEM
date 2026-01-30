import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Shield, Zap, HeadphonesIcon } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionPlanCard } from '@/components/subscription/SubscriptionPlanCard';
import { SubscriptionStatusComponent } from '@/components/subscription/SubscriptionStatus';
import { toast } from 'sonner';

const SUBSCRIPTION_PLANS = [
  {
    id: 'monthly',
    name: 'Plano Mensal',
    price: 69.90,
    pricePerMonth: 69.90,
    interval: 'month' as const,
    features: [
      'Acesso completo à plataforma',
      'Suporte por email',
      'Atualizações gratuitas',
      'Cancele quando quiser',
    ],
  },
  {
    id: 'yearly',
    name: 'Plano Anual',
    price: 358.80,
    pricePerMonth: 29.90,
    interval: 'year' as const,
    features: [
      'Tudo do plano mensal',
      'Economia de 57%',
      'Suporte prioritário',
      'Acesso antecipado a novidades',
    ],
    isPopular: true,
  },
];

const BENEFITS = [
  {
    icon: Zap,
    title: 'Acesso Ilimitado',
    description: 'Use todas as ferramentas da plataforma sem restrições',
  },
  {
    icon: Shield,
    title: 'Segurança Garantida',
    description: 'Seus dados são protegidos com criptografia de ponta',
  },
  {
    icon: HeadphonesIcon,
    title: 'Suporte Dedicado',
    description: 'Equipe pronta para ajudar quando você precisar',
  },
];

const Planos = () => {
  const navigate = useNavigate();
  const { subscription, isLoading, createCheckout, openCustomerPortal } = useSubscription();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [isManaging, setIsManaging] = useState(false);

  const handleSelectPlan = async (planType: 'monthly' | 'yearly') => {
    setProcessingPlan(planType);
    
    try {
      const url = await createCheckout(planType);
      if (url) {
        window.open(url, '_blank');
      }
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    setIsManaging(true);
    
    try {
      const url = await openCustomerPortal();
      if (url) {
        window.open(url, '_blank');
      }
    } finally {
      setIsManaging(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Planos de Assinatura</h1>
            <p className="text-sm text-muted-foreground">Escolha o plano ideal para você</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Current Subscription Status */}
        <div className="mb-8">
          <SubscriptionStatusComponent
            subscription={subscription}
            isLoading={isLoading}
            onManageSubscription={handleManageSubscription}
            isManaging={isManaging}
          />
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                Assinatura para Manutenção da Plataforma
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                A assinatura mantém seu acesso à plataforma. Os créditos para geração de imagens são 
                comprados separadamente na página de créditos.
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Plans */}
        {!subscription.subscribed && (
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <SubscriptionPlanCard
                key={plan.id}
                name={plan.name}
                price={plan.price}
                pricePerMonth={plan.pricePerMonth}
                interval={plan.interval}
                features={plan.features}
                isPopular={plan.isPopular}
                isCurrentPlan={subscription.planType === plan.id}
                onSelect={() => handleSelectPlan(plan.id as 'monthly' | 'yearly')}
                isLoading={processingPlan === plan.id}
                disabled={processingPlan !== null && processingPlan !== plan.id}
              />
            ))}
          </div>
        )}

        {/* Benefits Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">Por que assinar?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {BENEFITS.map((benefit, index) => (
              <div 
                key={index}
                className="text-center p-6 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                  <benefit.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ / Additional Info */}
        <div className="bg-muted/50 rounded-lg p-6 text-center">
          <h3 className="font-semibold mb-2">Dúvidas?</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Entre em contato conosco pelo email suporte@exemplo.com
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => navigate('/comprar-creditos')}>
              Ver Créditos
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Planos;
