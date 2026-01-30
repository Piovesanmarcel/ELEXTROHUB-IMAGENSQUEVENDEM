import { BrandSettings, getGlobalLogoStyle } from '@/types/brand-settings';

interface MarketingTemplate6Props {
  productName: string;
  productImages: string[];
  productFaqs?: Array<{ question: string; answer: string }>;
  logoUrl?: string;
  backgroundClass?: string;
  brandSettings?: BrandSettings | null;
}

export const MarketingTemplate6 = ({ 
  productName, 
  productImages, 
  productFaqs,
  logoUrl,
  backgroundClass = "bg-gradient-to-br from-green-400 via-emerald-500 to-green-600",
  brandSettings
}: MarketingTemplate6Props) => {
  // Verificar se deve mostrar logo global - verificação robusta
  const shouldShowGlobalLogo = Boolean(
    brandSettings && 
    brandSettings.logo_url && 
    brandSettings.show_logo_on_templates === true
  );
  const logoSize = brandSettings?.logo_size || 100;
  const backgroundImage = productImages[0];
  const defaultFaqs = [
    { question: "Como usar o produto?", answer: "Muito fácil e intuitivo de usar" },
    { question: "Tem garantia?", answer: "Sim, garantia total de qualidade" },
    { question: "É seguro?", answer: "100% seguro e confiável" },
    { question: "Qual o prazo de entrega?", answer: "Entregamos rapidamente em todo Brasil" }
  ];
  const faqs = productFaqs && productFaqs.length > 0 ? productFaqs : defaultFaqs;

  // Debug log para verificar brandSettings
  console.log('🎨 MarketingTemplate6 brandSettings:', {
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

      {/* Logo - Much Larger */}
      {logoUrl && (
        <div className="absolute top-6 right-6 w-32 h-32 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-3 z-20">
          <img
            src={logoUrl}
            alt="Logo"
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col p-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-8 py-3 inline-block">
            <h2 className="text-gray-800 text-2xl font-bold">
              ❓ PERGUNTAS FREQUENTES
            </h2>
          </div>
        </div>

        {/* FAQ Cards */}
        <div className="flex-1 space-y-6 max-w-4xl mx-auto">
          {faqs.slice(0, 4).map((faq, index) => (
            <div key={index} className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-lg">Q</span>
                  </div>
                  <h3 className="text-gray-800 text-xl font-bold leading-tight">
                    {faq.question}
                  </h3>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">A</span>
                  </div>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="bg-green-400 text-green-900 px-10 py-3 rounded-full inline-block font-bold text-xl">
            💬 TIRE SUAS DÚVIDAS
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
