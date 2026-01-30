import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Check } from "lucide-react";
import { DownloadSection } from "./DownloadSection";
import { useEffect } from "react";

const DEMO_IMAGES = {
  enhance: "/lovable-uploads/9cc4050d-b0bf-4efa-9eb9-8159f90e2721.png",
  background: "/lovable-uploads/b5b5c6fa-8f75-40da-b221-b69b43bcc9bb.png"
};

interface DemoSectionProps {
  activeTab: 'enhance' | 'background';
}

export const DemoSection = ({ activeTab }: DemoSectionProps) => {
  // Pré-carrega ambas as imagens no cache do navegador (fallback)
  useEffect(() => {
    Object.values(DEMO_IMAGES).forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const enhancementBenefits = [
    { feature: "Super Resolution 4x", description: "2048x2048 → 8192x8192" },
    { feature: "Redução de Ruído", description: "Remove imperfeições" },
    { feature: "Aumento de Nitidez", description: "Detalhes definidos" },
    { feature: "Melhoria de Cores", description: "Cores vibrantes" },
    { feature: "Correção de Contraste", description: "Balanço automático" },
  ];

  const backgroundRemovalBenefits = [
    { feature: "Remoção Automática", description: "IA detecta e remove" },
    { feature: "Bordas Precisas", description: "Preserva detalhes" },
    { feature: "Fundo Transparente", description: "PNG transparente" },
    { feature: "Ideal para E-commerce", description: "Produtos limpos" },
    { feature: "Processamento em Lote", description: "Múltiplas imagens" },
  ];

  const currentBenefits = activeTab === 'enhance' ? enhancementBenefits : backgroundRemovalBenefits;
  const currentTitle = activeTab === 'enhance' ? 'Super Resolução com DeepAI' : 'Remoção de Fundo Inteligente';
  const currentDescription = activeTab === 'enhance' 
    ? 'Veja o poder da nossa tecnologia de melhoria de imagens'
    : 'Remova fundos automaticamente com precisão profissional';

  const benefitColors = activeTab === 'enhance'
    ? "bg-gradient-to-br from-purple-50 to-blue-50 border-l-4 border-l-purple-500"
    : "bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-l-blue-500";

  const benefitItemColors = activeTab === 'enhance'
    ? "bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100"
    : "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100";

  const checkIconColor = activeTab === 'enhance' ? "text-purple-600" : "text-blue-600";

  return (
    <div className="space-y-6 mb-8">
      {/* Demo Section */}
      <div className="flex justify-center">
        <Card className={`glass-effect shadow-lg max-w-6xl w-full ${benefitColors}`}>
          <CardHeader className={`text-center ${
            activeTab === 'enhance' 
              ? 'bg-gradient-to-r from-purple-50 to-blue-50' 
              : 'bg-gradient-to-r from-blue-50 to-indigo-50'
          }`}>
            <CardTitle className={`flex items-center justify-center gap-2 ${
              activeTab === 'enhance' ? 'text-purple-700' : 'text-blue-700'
            }`}>
              <Sparkles className="h-5 w-5" />
              {currentTitle}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {currentDescription}
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-8 items-start">
              {/* Demo Image - Dual rendering for instant switch */}
              <div className="relative w-full h-80">
                <img 
                  src={DEMO_IMAGES.enhance}
                  alt="Exemplo melhoria DeepAI" 
                  className={`absolute inset-0 w-full h-full object-cover rounded-lg shadow-md ${
                    activeTab === 'enhance' ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                />
                <img 
                  src={DEMO_IMAGES.background}
                  alt="Exemplo remoção de fundo" 
                  className={`absolute inset-0 w-full h-full object-cover rounded-lg shadow-md ${
                    activeTab === 'background' ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                />
                <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs z-20">
                  Exemplo: Antes → Depois
                </div>
              </div>

              {/* Benefits Table */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {activeTab === 'enhance' ? 'Benefícios da Melhoria DeepAI' : 'Benefícios da Remoção de Fundo'}
                </h3>
                <div className="space-y-2">
                  {currentBenefits.map((benefit, index) => (
                    <div key={index} className={`flex items-start gap-3 p-2 rounded-lg ${benefitItemColors}`}>
                      <div className="flex-shrink-0 mt-0.5">
                        <Check className={`h-4 w-4 ${checkIconColor}`} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-800 text-xs">{benefit.feature}</div>
                        <div className="text-xs text-gray-600">{benefit.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Export DownloadExamplesSection for compatibility
export const DownloadExamplesSection = () => <DownloadSection />;
