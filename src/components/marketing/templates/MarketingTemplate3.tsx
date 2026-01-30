import { BrandSettings, getGlobalLogoStyle } from '@/types/brand-settings';

interface MarketingTemplate3Props {
  productName: string;
  productImages: string[];
  guarantee?: string;
  logoUrl?: string;
  backgroundClass?: string;
  brandSettings?: BrandSettings | null;
}

export const MarketingTemplate3 = ({ 
  productName, 
  productImages, 
  guarantee,
  logoUrl,
  backgroundClass = "bg-gradient-to-br from-green-400 via-emerald-500 to-green-600",
  brandSettings
}: MarketingTemplate3Props) => {
  // Verificar se deve mostrar logo global - verificação robusta
  const shouldShowGlobalLogo = Boolean(
    brandSettings && 
    brandSettings.logo_url && 
    brandSettings.show_logo_on_templates === true
  );
  const logoSize = brandSettings?.logo_size || 100;
  const fourthImage = productImages[3];
  const backgroundImage = productImages[0];

  // Debug log para verificar brandSettings
  console.log('🎨 MarketingTemplate3 brandSettings:', {
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
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex items-center justify-center h-full p-12">
        <div className="text-center">
          {/* Product Image Container - Much Larger */}
          <div className="mb-12">
            <div className="relative inline-block">
              <div className="w-[800px] h-[800px] bg-white/95 backdrop-blur-sm rounded-[3rem] shadow-2xl p-10 transform rotate-2 hover:rotate-0 transition-transform duration-500 relative">
                {fourthImage ? (
                  <img
                    src={fourthImage}
                    alt=""
                    className="w-full h-full object-contain rounded-2xl"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-2xl flex items-center justify-center">
                    <span className="text-gray-500 text-2xl">Quarta Imagem</span>
                  </div>
                )}
              </div>
              
              {/* Logo in Circle - Much Larger */}
              <div className="absolute -top-8 -right-8 w-[240px] h-[240px] bg-white rounded-full shadow-xl p-4 border-6 border-white">
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
              
              {/* Glow Effect */}
              <div className="absolute -inset-3 bg-white/20 rounded-[3.5rem] blur-xl -z-10"></div>
            </div>
          </div>

          {/* Guarantee Section */}
          {guarantee ? (
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl px-12 py-6 inline-block">
              <h2 className="text-gray-800 text-2xl font-bold mb-2">
                🛒 GARANTA JÁ O SEU!
              </h2>
              <p className="text-gray-700 text-lg max-w-2xl">
                {guarantee}
              </p>
            </div>
          ) : (
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl px-12 py-6 inline-block">
              <p className="text-gray-800 text-3xl font-semibold">
                🛒 GARANTA JÁ O SEU!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-12 left-12 w-16 h-16 bg-white/30 rounded-full blur-sm"></div>
      <div className="absolute top-24 right-12 w-12 h-12 bg-white/40 rotate-45 blur-sm"></div>
      <div className="absolute bottom-12 left-24 w-14 h-14 bg-white/35 rounded-full blur-sm"></div>
      <div className="absolute bottom-24 right-24 w-18 h-18 border-3 border-white/40 rounded-full blur-sm"></div>

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
