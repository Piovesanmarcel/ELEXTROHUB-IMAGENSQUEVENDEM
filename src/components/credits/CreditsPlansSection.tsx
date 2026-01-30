
import { CreditsPlanCard } from "./CreditsPlanCard";
import { Sparkles, Shield, CreditCard, CheckCircle } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  credits: number;
  price: number;
  popular: boolean;
  savings: number;
  description: string;
}

interface CreditsPlansProps {
  plans: Plan[];
  isProcessing: boolean;
  selectedPlan: string | null;
  onPurchase: (planId: string) => void;
}

export const CreditsPlansSection = ({ 
  plans, 
  isProcessing, 
  selectedPlan, 
  onPurchase 
}: CreditsPlansProps) => {
  return (
    <section className="py-16 md:py-20 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      
      <div className="relative z-10">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Créditos para Geração de Imagens
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Escolha Seu Pacote de Créditos
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Planos flexíveis para todos os tamanhos de negócio
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4">
          {plans.map((plan, index) => (
            <CreditsPlanCard
              key={plan.id}
              plan={plan}
              index={index}
              isProcessing={isProcessing}
              selectedPlan={selectedPlan}
              onPurchase={onPurchase}
            />
          ))}
        </div>
        
        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-10 mt-12 px-4 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="w-5 h-5 text-green-500" />
            <span className="text-sm">Créditos nunca expiram</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm">Garantia de satisfação</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="w-5 h-5 text-green-500" />
            <span className="text-sm">Pagamento seguro</span>
          </div>
        </div>
      </div>
    </section>
  );
};
