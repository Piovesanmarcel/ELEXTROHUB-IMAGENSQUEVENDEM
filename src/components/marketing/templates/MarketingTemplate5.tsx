import { BrandSettings, getGlobalLogoStyle } from '@/types/brand-settings';

interface MarketingTemplate5Props {
  productName: string;
  productImages: string[];
  productBenefits?: string[];
  logoUrl?: string;
  backgroundClass?: string;
  brandSettings?: BrandSettings | null;
}

export const MarketingTemplate5 = ({ 
  productName, 
  productImages, 
  productBenefits,
  logoUrl,
  backgroundClass = "bg-gradient-to-br from-green-400 via-emerald-500 to-green-600",
  brandSettings
}: MarketingTemplate5Props) => {
  // Verificar se deve mostrar logo global - verificação robusta
  const shouldShowGlobalLogo = Boolean(
    brandSettings && 
    brandSettings.logo_url && 
    brandSettings.show_logo_on_templates === true
  );
  const logoSize = brandSettings?.logo_size || 100;
  const mainImage = productImages[0];
  const backgroundImage = productImages[0];
  const defaultBenefits = [
    "Alta Qualidade",
    "Durabilidade Garantida", 
    "Design Moderno",
    "Fácil de Usar",
    "Excelente Custo-Benefício",
    "Suporte Especializado"
  ];
  const benefits = productBenefits && productBenefits.length > 0 ? productBenefits : defaultBenefits;

  // Debug log para verificar brandSettings
  console.log('🎨 MarketingTemplate5 brandSettings:', {
    brandSettings,
    shouldShowGlobalLogo,
    logoUrl: brandSettings?.logo_url,
    showOnTemplates: brandSettings?.show_logo_on_templates
  });

  return (
    <div className="relative w-[1200px] h-[1200px] overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        {backgroundImage ? (
          <>
            <img
              src={backgroundImage}
              alt=""
              className="w-full h-full object-cover opacity-30"
            />
            <div className={`absolute inset-0 ${backgroundClass}/80`}></div>
          </>
        ) : (
          <div className={`w-full h-full ${backgroundClass}`}></div>
        )}
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-12 left-12 w-48 h-48 bg-white rounded-full blur-2xl"></div>
        <div className="absolute bottom-12 right-12 w-64 h-64 bg-white rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="text-center py-10">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 inline-block">
            <p className="text-gray-800 text-2xl font-bold">
              🚀 PRINCIPAIS BENEFÍCIOS
            </p>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Left Side - Product Image - Much Larger */}
          <div className="w-1/2 flex items-center justify-center p-6">
            <div className="relative">
              <div className="w-[600px] h-[600px] bg-white/95 backdrop-blur-sm rounded-[2.5rem] shadow-2xl p-8 flex items-center justify-center">
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt=""
                    className="max-w-full max-h-full object-contain rounded-2xl"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-2xl flex items-center justify-center">
                    <span className="text-gray-500 text-xl">Produto</span>
                  </div>
                )}
              </div>
              
              {/* Logo in Circle - Much Larger */}
              <div className="absolute -top-6 -right-6 w-[180px] h-[180px] bg-white rounded-full shadow-xl p-4 border-6 border-white">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-full h-full object-contain rounded-full"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-500 text-sm text-center">Logo</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Benefits */}
          <div className="w-1/2 flex items-center justify-center p-6">
            <div className="space-y-4 w-full max-w-md">
              {benefits.slice(0, 6).map((benefit, index) => (
                <div key={index} className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl transform hover:scale-105 transition-transform duration-300">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">✓</span>
                    </div>
                    <span className="text-gray-800 text-lg font-semibold">
                      {benefit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pb-10">
          <div className="bg-yellow-400 text-yellow-900 px-10 py-3 rounded-full inline-block font-bold text-2xl">
            ⭐ ESCOLHA PREMIUM ⭐
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
