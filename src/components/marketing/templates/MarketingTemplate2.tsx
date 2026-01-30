import { BrandSettings, getGlobalLogoStyle } from '@/types/brand-settings';

interface MarketingTemplate2Props {
  productName: string;
  productImages: string[];
  idealFor?: string;
  logoUrl?: string;
  backgroundClass?: string;
  brandSettings?: BrandSettings | null;
}

export const MarketingTemplate2 = ({ 
  productName, 
  productImages, 
  idealFor,
  logoUrl,
  backgroundClass = "bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600",
  brandSettings
}: MarketingTemplate2Props) => {
  // Verificar se deve mostrar logo global - verificação robusta
  const shouldShowGlobalLogo = Boolean(
    brandSettings && 
    brandSettings.logo_url && 
    brandSettings.show_logo_on_templates === true
  );
  const logoSize = brandSettings?.logo_size || 100;
  const mainImage = productImages[0];
  const backgroundImage = productImages[0];

  // Debug log para verificar brandSettings
  console.log('🎨 MarketingTemplate2 brandSettings:', {
    brandSettings,
    shouldShowGlobalLogo,
    logoUrl: brandSettings?.logo_url,
    showOnTemplates: brandSettings?.show_logo_on_templates
  });

  // Função para gerar texto ideal para bem curto e objetivo
  const getShortIdealFor = () => {
    if (idealFor) {
      // Extrair apenas a primeira frase ou até 50 caracteres
      const firstSentence = idealFor.split('.')[0];
      if (firstSentence.length > 60) {
        return firstSentence.substring(0, 60) + '...';
      }
      return firstSentence + '.';
    }
    
    const productNameLower = productName.toLowerCase();
    
    if (productNameLower.includes('celular') || productNameLower.includes('smartphone')) {
      return "Para quem busca tecnologia avançada.";
    } else if (productNameLower.includes('roupa') || productNameLower.includes('camisa')) {
      return "Para quem valoriza estilo e conforto.";
    } else if (productNameLower.includes('sapato') || productNameLower.includes('tênis')) {
      return "Para quem precisa de conforto o dia todo.";
    } else if (productNameLower.includes('casa') || productNameLower.includes('decoração')) {
      return "Para quem quer um lar mais bonito.";
    } else if (productNameLower.includes('beleza') || productNameLower.includes('cosmético')) {
      return "Para quem quer se cuidar melhor.";
    } else {
      return "Para quem busca qualidade premium.";
    }
  };

  return (
    <div className="relative w-[1200px] h-[1200px] overflow-hidden">
      {/* Background Image with Overlay e Filtro */}
      <div className="absolute inset-0">
        {backgroundImage ? (
          <>
            <img
              src={backgroundImage}
              alt=""
              className="w-full h-full object-cover opacity-20 blur-sm"
            />
            <div className={`absolute inset-0 ${backgroundClass}/90 backdrop-blur-sm`}></div>
          </>
        ) : (
          <div className={`w-full h-full ${backgroundClass} backdrop-blur-sm`}></div>
        )}
      </div>

      {/* Logo - Top Right */}
      {logoUrl && (
        <div className="absolute top-8 right-8 w-40 h-40 bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-4 z-20">
          <img
            src={logoUrl}
            alt="Logo"
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* Content Container */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center p-8">
        
        {/* Product Image - Grande */}
        <div className="mb-8 flex-1 flex items-center justify-center max-h-[65%]">
          <div className="w-full max-w-[800px] h-full bg-white/95 backdrop-blur-sm rounded-[3rem] shadow-2xl p-6 flex items-center justify-center">
            {mainImage ? (
              <img
                src={mainImage}
                alt={productName}
                className="max-w-full max-h-full object-contain rounded-2xl"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-2xl flex items-center justify-center">
                <span className="text-gray-500 text-3xl">Imagem do Produto</span>
              </div>
            )}
          </div>
        </div>

        {/* Ideal For Section - Texto bem mais curto */}
        <div className="max-w-4xl w-full">
          <div className="bg-white/95 backdrop-blur-sm rounded-[2rem] p-8 shadow-2xl">
            <div className="text-center">
              <h2 className="text-blue-600 text-3xl font-bold mb-6">
                🎯 IDEAL PARA
              </h2>
              <div className="text-gray-800 text-xl leading-relaxed font-medium">
                {getShortIdealFor()}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Badge */}
        <div className="mt-8">
          <div className="bg-blue-500 text-white px-8 py-4 rounded-full font-bold text-xl shadow-2xl">
            ✨ ESCOLHA PERFEITA PARA VOCÊ
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
