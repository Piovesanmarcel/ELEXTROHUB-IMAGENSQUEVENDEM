import { BrandSettings, getGlobalLogoStyle } from '@/types/brand-settings';

interface MarketingTemplate4Props {
  productName: string;
  productImages: string[];
  productDescription?: string;
  logoUrl?: string;
  backgroundClass?: string;
  brandSettings?: BrandSettings | null;
}

export const MarketingTemplate4 = ({ 
  productName, 
  productImages, 
  productDescription,
  logoUrl,
  backgroundClass = "bg-gradient-to-br from-green-400 via-emerald-500 to-green-600",
  brandSettings
}: MarketingTemplate4Props) => {
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
  console.log('🎨 MarketingTemplate4 brandSettings:', {
    brandSettings,
    shouldShowGlobalLogo,
    logoUrl: brandSettings?.logo_url,
    showOnTemplates: brandSettings?.show_logo_on_templates
  });

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

      {/* Content Container - Centralizado */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center p-8">
        
        {/* Product Image - Muito maior (80% da altura) */}
        <div className="mb-8 flex-1 flex items-center justify-center max-h-[70%]">
          <div className="w-full max-w-[900px] h-full bg-white/95 backdrop-blur-sm rounded-[3rem] shadow-2xl p-6 flex items-center justify-center">
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

        {/* SEO Description Section - Apenas o texto da descrição */}
        <div className="max-w-5xl w-full">
          <div className="bg-white/95 backdrop-blur-sm rounded-[2rem] p-8 shadow-2xl">
            {productDescription ? (
              <div className="text-gray-700 text-lg leading-relaxed text-center font-medium">
                {productDescription.length > 300 
                  ? `${productDescription.substring(0, 300)}...` 
                  : productDescription}
              </div>
            ) : (
              <div className="text-gray-700 text-lg leading-relaxed text-center font-medium">
                Produto de alta qualidade com tecnologia avançada, design moderno e excelente custo-benefício. 
                Desenvolvido para proporcionar máxima satisfação ao cliente com materiais premium e acabamento impecável.
              </div>
            )}
          </div>
        </div>

        {/* Bottom Badge - menor */}
        <div className="mt-6">
          <div className="bg-green-500 text-white px-8 py-3 rounded-full font-bold text-lg shadow-2xl">
            ✨ QUALIDADE PREMIUM GARANTIDA
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
