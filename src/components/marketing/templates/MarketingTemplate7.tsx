import { BrandSettings, getGlobalLogoStyle } from '@/types/brand-settings';

interface MarketingTemplate7Props {
  productName: string;
  productImages: string[];
  productPainPoints?: string[];
  productSolutions?: string[];
  logoUrl?: string;
  backgroundClass?: string;
  brandSettings?: BrandSettings | null;
}

export const MarketingTemplate7 = ({ 
  productName, 
  productImages, 
  productPainPoints, 
  productSolutions,
  logoUrl,
  backgroundClass = "bg-gradient-to-br from-red-400 via-orange-500 to-green-600",
  brandSettings
}: MarketingTemplate7Props) => {
  // Verificar se deve mostrar logo global - verificação robusta
  const shouldShowGlobalLogo = Boolean(
    brandSettings && 
    brandSettings.logo_url && 
    brandSettings.show_logo_on_templates === true
  );
  const logoSize = brandSettings?.logo_size || 100;
  const backgroundImage = productImages[0];

  // Debug log para verificar brandSettings
  console.log('🎨 MarketingTemplate7 brandSettings:', {
    brandSettings,
    shouldShowGlobalLogo,
    logoUrl: brandSettings?.logo_url,
    showOnTemplates: brandSettings?.show_logo_on_templates
  });
  
  // Gerar problemas e soluções específicos baseados no nome do produto
  const generateProductSpecificContent = (productName: string) => {
    const productLower = productName.toLowerCase();
    
    // Problemas específicos baseados no tipo de produto
    let specificPainPoints = [];
    let specificSolutions = [];
    
    if (productLower.includes('celular') || productLower.includes('smartphone') || productLower.includes('phone')) {
      specificPainPoints = [
        "Bateria que descarrega rapidamente",
        "Tela que quebra facilmente",
        "Armazenamento insuficiente",
        "Câmera de baixa qualidade",
        "Sistema lento e travando"
      ];
      specificSolutions = [
        "Bateria de longa duração",
        "Tela resistente a impactos",
        "Grande capacidade de armazenamento",
        "Câmera profissional de alta resolução",
        "Processador rápido e eficiente"
      ];
    } else if (productLower.includes('roupa') || productLower.includes('camisa') || productLower.includes('vestido')) {
      specificPainPoints = [
        "Tecido de baixa qualidade que desbota",
        "Tamanhos que não servem bem",
        "Costuras que se desfazem",
        "Modelos fora de moda",
        "Preços elevados sem qualidade"
      ];
      specificSolutions = [
        "Tecidos premium que não desbotam",
        "Modelagem perfeita para todos os corpos",
        "Costuras reforçadas e duráveis",
        "Design moderno e atemporal",
        "Preço justo com qualidade superior"
      ];
    } else if (productLower.includes('sapato') || productLower.includes('tênis') || productLower.includes('sandal')) {
      specificPainPoints = [
        "Calçados desconfortáveis que machucam",
        "Sola que desgasta rapidamente",
        "Material que racha e descola",
        "Falta de ventilação causando odor",
        "Design ultrapassado"
      ];
      specificSolutions = [
        "Conforto extremo durante todo o dia",
        "Sola ultra resistente e durável",
        "Materiais premium que não desgastam",
        "Tecnologia respirável anti-odor",
        "Design moderno e elegante"
      ];
    } else if (productLower.includes('casa') || productLower.includes('decoração') || productLower.includes('móvel')) {
      specificPainPoints = [
        "Móveis que quebram facilmente",
        "Decoração sem personalidade",
        "Materiais de baixa qualidade",
        "Montagem complicada e demorada",
        "Preços abusivos no mercado"
      ];
      specificSolutions = [
        "Móveis ultra resistentes e duráveis",
        "Design exclusivo e personalizado",
        "Materiais premium selecionados",
        "Montagem rápida e simples",
        "Preço justo e acessível"
      ];
    } else {
      // Problemas e soluções genéricos para outros produtos
      specificPainPoints = [
        `${productName} de baixa qualidade no mercado`,
        "Preços elevados sem justificativa",
        "Produtos que quebram facilmente",
        "Falta de garantia adequada",
        "Atendimento ao cliente deficiente"
      ];
      specificSolutions = [
        `${productName} com qualidade premium`,
        "Preço justo e competitivo",
        "Durabilidade testada e comprovada",
        "Garantia extendida completa",
        "Suporte especializado 24/7"
      ];
    }
    
    return {
      painPoints: specificPainPoints,
      solutions: specificSolutions
    };
  };
  
  const { painPoints: defaultPainPoints, solutions: defaultSolutions } = generateProductSpecificContent(productName);
  
  const painPoints = productPainPoints && productPainPoints.length > 0 ? productPainPoints : defaultPainPoints;
  const solutions = productSolutions && productSolutions.length > 0 ? productSolutions : defaultSolutions;

  return (
    <div className="relative w-[1200px] h-[1200px] overflow-hidden">
      {/* Background Image with Overlay e Filtro */}
      <div className="absolute inset-0">
        {backgroundImage ? (
          <>
            <img
              src={backgroundImage}
              alt=""
              className="w-full h-full object-cover opacity-15 blur-sm"
            />
            <div className={`absolute inset-0 ${backgroundClass}/90 backdrop-blur-sm`}></div>
          </>
        ) : (
          <div className={`w-full h-full ${backgroundClass} backdrop-blur-sm`}></div>
        )}
      </div>

      {/* Logo - Maior */}
      {logoUrl && (
        <div className="absolute top-8 right-8 w-40 h-40 bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-4 z-20">
          <img
            src={logoUrl}
            alt="Logo"
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col p-12">
        {/* Header - Maior */}
        <div className="text-center mb-12">
          <div className="bg-white/95 backdrop-blur-sm rounded-full px-12 py-6 inline-block shadow-2xl">
            <h2 className="text-gray-800 text-4xl font-bold">
              💡 ANTES vs DEPOIS
            </h2>
          </div>
        </div>

        <div className="flex-1 flex gap-12">
          {/* Left Side - Problems */}
          <div className="w-1/2 flex flex-col">
            <div className="text-center mb-8">
              <div className="bg-red-600/90 backdrop-blur-sm rounded-full px-8 py-4 inline-block shadow-xl">
                <h3 className="text-white text-2xl font-bold">
                  😰 PROBLEMAS
                </h3>
              </div>
            </div>
            
            <div className="space-y-6 flex-1">
              {painPoints.slice(0, 5).map((pain, index) => (
                <div key={index} className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-2xl transform hover:-translate-x-4 transition-all duration-300 border-l-8 border-red-500">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                      <span className="text-white font-bold text-xl">✗</span>
                    </div>
                    <p className="text-gray-800 text-xl font-bold leading-relaxed">
                      {pain}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Solutions */}
          <div className="w-1/2 flex flex-col">
            <div className="text-center mb-8">
              <div className="bg-green-600/90 backdrop-blur-sm rounded-full px-8 py-4 inline-block shadow-xl">
                <h3 className="text-white text-2xl font-bold">
                  🎯 SOLUÇÕES
                </h3>
              </div>
            </div>
            
            <div className="space-y-6 flex-1">
              {solutions.slice(0, 5).map((solution, index) => (
                <div key={index} className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-2xl transform hover:translate-x-4 transition-all duration-300 border-l-8 border-green-500">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                      <span className="text-white font-bold text-xl">✓</span>
                    </div>
                    <p className="text-gray-800 text-xl font-bold leading-relaxed">
                      {solution}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer - Maior */}
        <div className="text-center mt-12">
          <div className="bg-blue-600 text-white px-12 py-4 rounded-full font-bold text-2xl shadow-2xl">
            💡 A SOLUÇÃO ESTÁ AQUI!
          </div>
        </div>
      </div>

      {/* Logo Global */}
      {shouldShowGlobalLogo && (
        <img
          src={brandSettings!.logo_url!}
          alt="Logo da marca"
          style={getGlobalLogoStyle(brandSettings!.logo_position, logoSize)}
        />
      )}
    </div>
  );
};
