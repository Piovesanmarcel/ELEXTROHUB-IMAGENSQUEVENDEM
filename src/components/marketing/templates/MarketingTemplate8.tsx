import { BrandSettings, getGlobalLogoStyle } from '@/types/brand-settings';

interface MarketingTemplate8Props {
  productName: string;
  productImages: string[];
  testimonials?: Array<{ name: string; text: string; rating: number }>;
  logoUrl?: string;
  backgroundClass?: string;
  brandSettings?: BrandSettings | null;
}

export const MarketingTemplate8 = ({ 
  productName, 
  productImages, 
  testimonials,
  logoUrl,
  backgroundClass = "bg-gradient-to-br from-blue-400 via-purple-500 to-pink-600",
  brandSettings
}: MarketingTemplate8Props) => {
  // Verificar se deve mostrar logo global - verificação robusta
  const shouldShowGlobalLogo = Boolean(
    brandSettings && 
    brandSettings.logo_url && 
    brandSettings.show_logo_on_templates === true
  );
  const logoSize = brandSettings?.logo_size || 100;
  const backgroundImage = productImages[0];
  const defaultTestimonials = [
    { name: "Maria Silva", text: "Produto excelente! Superou minhas expectativas.", rating: 5 },
    { name: "João Santos", text: "Qualidade incrível, recomendo para todos!", rating: 5 },
    { name: "Ana Costa", text: "Melhor compra que já fiz. Vale cada centavo!", rating: 5 },
    { name: "Carlos Oliveira", text: "Atendimento perfeito e produto de primeira!", rating: 5 },
    { name: "Lucia Mendes", text: "Chegou rapidinho e exatamente como esperava.", rating: 5 },
    { name: "Roberto Lima", text: "Durabilidade excepcional, já indiquei para amigos.", rating: 5 }
  ];
  
  const reviews = testimonials && testimonials.length > 0 ? testimonials : defaultTestimonials;

  // Debug log para verificar brandSettings
  console.log('🎨 MarketingTemplate8 brandSettings:', {
    brandSettings,
    shouldShowGlobalLogo,
    logoUrl: brandSettings?.logo_url,
    showOnTemplates: brandSettings?.show_logo_on_templates
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-2xl ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>
        ⭐
      </span>
    ));
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
      <div className="relative z-10 h-full flex flex-col p-10">
        {/* Header - Maior */}
        <div className="text-center mb-10">
          <div className="bg-white/95 backdrop-blur-sm rounded-full px-12 py-6 inline-block shadow-2xl">
            <h2 className="text-gray-800 text-4xl font-bold">
              👥 QUEM COMPROU APROVOU!
            </h2>
          </div>
        </div>

        {/* Testimonials Grid - 3x2 layout para melhor visibilidade */}
        <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-8 max-w-full mx-auto">
          {reviews.slice(0, 6).map((review, index) => (
            <div key={index} className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-white/50">
              <div className="flex flex-col h-full">
                {/* Avatar and Name */}
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-white font-bold text-xl">
                      {review.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-800 text-xl font-bold mb-2">
                      {review.name}
                    </h3>
                    <div className="flex justify-center">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                </div>
                
                {/* Review Text - Fontes muito maiores */}
                <div className="flex-1 flex items-center">
                  <p className="text-gray-700 text-lg leading-relaxed italic text-center font-medium">
                    "{review.text.length > 100 ? `${review.text.substring(0, 100)}...` : review.text}"
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats - Maiores */}
        <div className="flex justify-center space-x-8 mt-10">
          <div className="bg-yellow-500 text-yellow-900 px-8 py-4 rounded-3xl text-center shadow-2xl">
            <div className="text-4xl font-black">98%</div>
            <div className="text-xl font-bold">Satisfação</div>
          </div>
          <div className="bg-green-500 text-green-900 px-8 py-4 rounded-3xl text-center shadow-2xl">
            <div className="text-4xl font-black">5⭐</div>
            <div className="text-xl font-bold">Avaliação</div>
          </div>
          <div className="bg-blue-500 text-blue-900 px-8 py-4 rounded-3xl text-center shadow-2xl">
            <div className="text-4xl font-black">1000+</div>
            <div className="text-xl font-bold">Clientes</div>
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
