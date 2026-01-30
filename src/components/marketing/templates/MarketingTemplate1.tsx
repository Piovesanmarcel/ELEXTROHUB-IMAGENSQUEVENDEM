import { BrandSettings, getGlobalLogoStyle } from '@/types/brand-settings';

interface MarketingTemplate1Props {
  productName: string;
  productImages: string[];
  logoUrl?: string;
  backgroundClass?: string;
  brandSettings?: BrandSettings | null;
}

export const MarketingTemplate1 = ({ 
  productName, 
  productImages, 
  logoUrl,
  backgroundClass = "bg-white",
  brandSettings
}: MarketingTemplate1Props) => {
  // Verificar se deve mostrar logo global - verificação robusta
  const shouldShowGlobalLogo = Boolean(
    brandSettings && 
    brandSettings.logo_url && 
    brandSettings.show_logo_on_templates === true
  );
  const logoSize = brandSettings?.logo_size || 100;
  const mainImage = productImages[0];
  const secondaryImages = productImages.slice(1, 4); // Próximas 3 imagens

  // Debug log para verificar brandSettings
  console.log('🎨 MarketingTemplate1 brandSettings:', {
    brandSettings,
    shouldShowGlobalLogo,
    logoUrl: brandSettings?.logo_url,
    showOnTemplates: brandSettings?.show_logo_on_templates
  });

  return (
    <div className="relative w-[1200px] h-[1200px] overflow-hidden font-sans antialiased bg-white">
      {/* 🔥 DEBUG VISUAL - Indicador de status da logo */}
      <div style={{ 
        position: 'absolute', 
        top: 5, 
        left: 5, 
        background: shouldShowGlobalLogo ? 'green' : 'red', 
        color: 'white', 
        padding: '8px 12px', 
        fontSize: '14px', 
        zIndex: 99999,
        borderRadius: '4px',
        fontWeight: 'bold'
      }}>
        {shouldShowGlobalLogo ? '✅ LOGO ATIVADA' : '❌ LOGO DESATIVADA'}
        {!brandSettings && ' (brandSettings NULL)'}
        {brandSettings && !brandSettings.logo_url && ' (sem logo_url)'}
        {brandSettings && brandSettings.logo_url && !brandSettings.show_logo_on_templates && ' (show=false)'}
      </div>
      
      {/* Elementos decorativos espalhados muito maiores */}
      <div className="absolute inset-0">
        {/* Círculos decorativos grandes */}
        <div className="absolute top-10 left-20 w-32 h-32 bg-purple-200 rounded-full opacity-40"></div>
        <div className="absolute top-40 right-32 w-48 h-48 bg-blue-200 rounded-full opacity-30"></div>
        <div className="absolute bottom-60 left-10 w-24 h-24 bg-green-200 rounded-full opacity-50"></div>
        <div className="absolute bottom-20 right-40 w-40 h-40 bg-pink-200 rounded-full opacity-35"></div>
        <div className="absolute top-[500px] left-[600px] w-20 h-20 bg-yellow-200 rounded-full opacity-60"></div>
        
        {/* Formas geométricas maiores */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-gradient-to-br from-purple-100 to-purple-200 rotate-45 rounded-3xl opacity-25"></div>
        <div className="absolute bottom-80 left-32 w-48 h-48 bg-gradient-to-br from-blue-100 to-blue-200 rotate-12 rounded-2xl opacity-30"></div>
        <div className="absolute top-60 right-[500px] w-32 h-80 bg-gradient-to-b from-green-100 to-green-200 rotate-45 rounded-full opacity-40"></div>
        
        {/* Linhas decorativas maiores */}
        <div className="absolute top-16 left-[400px] w-96 h-4 bg-gradient-to-r from-purple-200 to-transparent rounded-full opacity-30"></div>
        <div className="absolute bottom-40 right-20 w-72 h-4 bg-gradient-to-l from-blue-200 to-transparent rounded-full opacity-35"></div>
        
        {/* Elementos adicionais grandes */}
        <div className="absolute top-[300px] left-4 w-56 h-56 bg-gradient-to-br from-orange-100 to-orange-200 rotate-[30deg] rounded-[3rem] opacity-20"></div>
        <div className="absolute bottom-10 left-[500px] w-36 h-36 bg-gradient-to-br from-red-100 to-red-200 rotate-[60deg] rounded-full opacity-35"></div>
      </div>

      {/* Área principal do produto - 96% da tela */}
      <div className="absolute inset-0 p-6">
        <div className="relative w-full h-full">
          {/* Container principal da imagem - 96% da tela */}
          <div className="w-[96%] h-[96%] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-full h-full bg-white/95 backdrop-blur-sm rounded-[3rem] shadow-2xl p-8 flex items-center justify-center relative border border-gray-100">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={productName}
                  className="max-w-full max-h-full object-contain rounded-2xl"
                  onLoad={(e) => {
                    console.log("Imagem carregada com sucesso:", mainImage);
                  }}
                  onError={(e) => {
                    console.error("Erro ao carregar imagem principal:", mainImage);
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-200">
                  <div className="text-center">
                    <div className="text-gray-400 text-8xl mb-6">📦</div>
                    <span className="text-gray-400 text-4xl font-medium">Produto Principal</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3 Imagens secundárias na vertical - 9x maiores (3x o tamanho anterior) */}
          <div className="absolute top-16 right-4 flex flex-col gap-8">
            {secondaryImages.map((image, index) => (
              <div key={index} className="w-[324px] h-[324px] bg-white rounded-3xl shadow-xl p-6 border border-gray-200">
                {image ? (
                  <img
                    src={image}
                    alt={`${productName} - ${index + 2}`}
                    className="w-full h-full object-cover rounded-2xl"
                    onError={(e) => {
                      console.error(`Erro ao carregar imagem ${index + 2}:`, image);
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 rounded-2xl flex items-center justify-center">
                    <span className="text-gray-400 text-6xl">📷</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Logo em círculo - posicionado melhor */}
          {logoUrl && (
            <div className="absolute bottom-16 left-6 w-40 h-40 bg-white rounded-full shadow-2xl p-4 border border-gray-200">
              <img
                src={logoUrl}
                alt="Logo"
                className="w-full h-full object-contain rounded-full"
                onError={(e) => {
                  console.error("Erro ao carregar logo:", logoUrl);
                }}
              />
            </div>
          )}
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
