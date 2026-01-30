import { useState } from "react";
import { 
  TrendingUp, 
  Star, 
  Target,
  Clock,
  Shield,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { useEnhancementUsage } from "@/hooks/useEnhancementUsage";
import { EnhancementUsageDisplay } from "@/components/enhancement/EnhancementUsageDisplay";
import { CreditsHeader } from "@/components/credits/CreditsHeader";
import { CreditsPlansSection } from "@/components/credits/CreditsPlansSection";
import { CreditsBenefitsSection } from "@/components/credits/CreditsBenefitsSection";
import { CreditsGuaranteeSection } from "@/components/credits/CreditsGuaranteeSection";
import { supabase } from "@/integrations/supabase/client";

// Mapeamento dos planos - PRODUÇÃO
const CREDIT_PLANS_PROD = [
  {
    id: "price_1Srhz0LhRGF1A3qGK3W51NSk",
    name: "Pacote Pro",
    credits: 100,
    price: 200.00,
    popular: false,
    savings: 0,
    description: "Ideal para começar"
  },
  {
    id: "price_1SrhzKLhRGF1A3qGqes8BwHO",
    name: "Pacote Standard",
    credits: 200,
    price: 360.00,
    popular: true,
    savings: 10,
    description: "O mais vendido"
  },
  {
    id: "price_1SrhztLhRGF1A3qGs6TuBxCN",
    name: "Pacote Avançado",
    credits: 300,
    price: 510.00,
    popular: false,
    savings: 15,
    description: "Melhor custo-benefício"
  },
  {
    id: "price_1Sri0ELhRGF1A3qGseNNGFiQ",
    name: "Pacote Premium",
    credits: 500,
    price: 800.00,
    popular: false,
    savings: 20,
    description: "Para grandes volumes"
  }
];

// Mapeamento dos planos - TESTE (Price IDs criados no Stripe Test Mode)
const CREDIT_PLANS_TEST = [
  {
    id: "price_1SrtSPLhRGF1A3qGM7AU1jr5",
    name: "Pacote Pro",
    credits: 100,
    price: 200.00,
    popular: false,
    savings: 0,
    description: "Ideal para começar"
  },
  {
    id: "price_1SrtSeLhRGF1A3qGl6kascFI",
    name: "Pacote Standard",
    credits: 200,
    price: 360.00,
    popular: true,
    savings: 10,
    description: "O mais vendido"
  },
  {
    id: "price_1SrtSsLhRGF1A3qGpY9lvlzb",
    name: "Pacote Avançado",
    credits: 300,
    price: 510.00,
    popular: false,
    savings: 15,
    description: "Melhor custo-benefício"
  },
  {
    id: "price_1SrtT4LhRGF1A3qGdrBZOvUf",
    name: "Pacote Premium",
    credits: 500,
    price: 800.00,
    popular: false,
    savings: 20,
    description: "Para grandes volumes"
  }
];

// Detectar modo de teste de forma inteligente
const detectTestMode = () => {
  // Localhost/desenvolvimento
  if (import.meta.env.DEV) return true;
  
  // Preview do Lovable (URL contém 'preview')
  if (typeof window !== 'undefined' && window.location.hostname.includes('preview')) return true;
  
  // Query parameter explícito (?test_mode=true)
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('test_mode') === 'true') return true;
  }
  
  return false;
};

const ComprarCreditos = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { usage, isLoading } = useEnhancementUsage();
  
  // Modo de teste ativo no preview ou localhost
  const isTestMode = detectTestMode();
  
  // Selecionar planos corretos baseado no modo
  const CREDIT_PLANS = isTestMode ? CREDIT_PLANS_TEST : CREDIT_PLANS_PROD;

  const benefits = [
    {
      icon: TrendingUp,
      title: "Aumento nas Vendas",
      description: "Imagens de alta qualidade aumentam as conversões em até 67%"
    },
    {
      icon: Star,
      title: "Qualidade Profissional",
      description: "IA avançada que melhora resolução, cores e nitidez automaticamente"
    },
    {
      icon: Target,
      title: "Destaque nos Marketplaces",
      description: "Produtos com imagens melhores ficam melhor posicionados"
    },
    {
      icon: Clock,
      title: "Economia de Tempo",
      description: "Processe centenas de imagens em minutos, não horas"
    },
    {
      icon: Shield,
      title: "Resultados Garantidos",
      description: "Melhoria visível ou seu dinheiro de volta"
    },
    {
      icon: Sparkles,
      title: "Múltiplos Formatos",
      description: "Suporte para JPG, PNG, WebP e outros formatos populares"
    }
  ];

  // isTestMode já definido via detectTestMode()

  const handlePurchase = async (priceId: string) => {
    setIsProcessing(true);
    setSelectedPlan(priceId);

    const isInvalidJwtError = (err: unknown) => {
      const anyErr = err as any;
      const msg = typeof anyErr?.message === "string" ? anyErr.message : "";
      return anyErr?.status === 401 || anyErr?.code === 401 || /Invalid JWT/i.test(msg);
    };

    const invokeCheckout = async (accessToken: string) => {
      // Adiciona header de modo teste se estiver em desenvolvimento
      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
      };
      
      if (isTestMode) {
        headers["x-stripe-test-mode"] = "true";
        console.log("[ComprarCreditos] 🧪 Modo TESTE ativo - usando chave de teste do Stripe");
      }

      return await supabase.functions.invoke("create-credits-checkout", {
        body: { priceId },
        headers,
      });
    };

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const existingSession = sessionData.session;

      if (!existingSession?.access_token) {
        toast.error("Você precisa estar logado para comprar créditos.");
        return;
      }

      // Tenta primeiro com o token atual (evita revogar tokens desnecessariamente)
      let { data, error } = await invokeCheckout(existingSession.access_token);

      // Se der 401 / Invalid JWT, tenta 1x fazer refresh e repetir
      if (error && isInvalidJwtError(error)) {
        const { data: refreshData, error: refreshError } =
          await supabase.auth.refreshSession();

        if (refreshError || !refreshData.session?.access_token) {
          toast.error("Sessão expirada. Faça login novamente.");
          return;
        }

        // Pequena espera para garantir que o token recém-gerado esteja válido em todos os serviços
        await new Promise((r) => setTimeout(r, 200));

        ({ data, error } = await invokeCheckout(refreshData.session.access_token));
      }

      if (error) {
        // Melhor mensagem quando a função retorna non-2xx
        if (error.name === "FunctionsHttpError" && (error as any).context) {
          const res = (error as any).context as Response;
          const text = await res.text().catch(() => "");
          throw new Error(text || `Erro HTTP ${res.status} ao iniciar checkout`);
        }
        throw new Error(error.message);
      }

      if (!data?.url) {
        throw new Error("URL de checkout não recebida");
      }

      toast.success("Redirecionando para pagamento...");
      window.location.href = data.url;
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast.error("Erro ao processar compra", {
        description:
          error instanceof Error
            ? error.message
            : "Tente novamente ou entre em contato conosco",
      });
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Indicador de Modo Teste */}
      {isTestMode && (
        <div className="fixed top-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold z-50 shadow-lg">
          🧪 MODO TESTE
        </div>
      )}
      
      <CreditsHeader />

      {/* Status Atual */}
      {usage && (
        <div className="max-w-md mx-auto">
          <EnhancementUsageDisplay 
            enhancements_used={usage.enhancements_used}
            enhancements_available={usage.enhancements_available}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Preço por crédito */}
      <div className="text-center">
        <p className="text-lg text-muted-foreground">
          <span className="font-semibold text-primary">R$ 2,00</span> por crédito • 
          <span className="font-semibold text-primary"> 1 crédito = 1 imagem</span>
        </p>
      </div>

      <CreditsPlansSection
        plans={CREDIT_PLANS}
        isProcessing={isProcessing}
        selectedPlan={selectedPlan}
        onPurchase={handlePurchase}
      />

      <CreditsBenefitsSection benefits={benefits} />

      <CreditsGuaranteeSection />
    </div>
  );
};

export default ComprarCreditos;
