import { safeDownload } from "@/utils/safeDownload";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageIcon, Palette, Download, Star, Users, Megaphone, TrendingUp, Link, Copy } from "lucide-react";
import { toast } from "sonner";
import React from "react";

// Import all templates
import { MarketingTemplate1 } from "./templates/MarketingTemplate1";
import { MarketingTemplate2 } from "./templates/MarketingTemplate2";
import { MarketingTemplate3 } from "./templates/MarketingTemplate3";
import { MarketingTemplate4 } from "./templates/MarketingTemplate4";
import { MarketingTemplate5 } from "./templates/MarketingTemplate5";
import { MarketingTemplate6 } from "./templates/MarketingTemplate6";
import { MarketingTemplate7 } from "./templates/MarketingTemplate7";
import { MarketingTemplate8 } from "./templates/MarketingTemplate8";

// Import utils
import { captureElementAsImage, createCaptureElement, cleanupCaptureElement } from "@/utils/imageGenerationUtils";
import { convertMultipleImagesToBase64 } from "@/utils/imageToBase64Utils";

// Import hooks and dynamic renderer
import { useMarketingTemplates } from "@/hooks/useMarketingTemplates";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { DynamicTemplateRenderer } from "./DynamicTemplateRenderer";
import { GlobalLogoSettings } from "./GlobalLogoSettings";
import type { TemplateData } from "@/types/marketing-templates";

interface MarketingImageGeneratorProps {
  productName: string;
  productImages: string[];
  productDescription?: string;
  productBenefits?: string[];
  productFaqs?: Array<{ question: string; answer: string }>;
  productPainPoints?: string[];
  productSolutions?: string[];
  testimonials?: Array<{ name: string; text: string; rating: number }>;
  seoDescription?: string;
  idealFor?: string;
  guarantee?: string;
}

const backgroundColors = [
  { name: "Branco", class: "bg-white" },
  { name: "Verde Clássico", class: "bg-gradient-to-br from-green-400 via-emerald-500 to-green-600" },
  { name: "Azul Oceano", class: "bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600" },
  { name: "Roxo Real", class: "bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600" },
  { name: "Rosa Elegante", class: "bg-gradient-to-br from-pink-400 via-pink-500 to-pink-600" },
  { name: "Laranja Vibrante", class: "bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600" },
  { name: "Vermelho Intenso", class: "bg-gradient-to-br from-red-400 via-red-500 to-red-600" },
  { name: "Amarelo Dourado", class: "bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600" },
  { name: "Ciano Moderno", class: "bg-gradient-to-br from-cyan-400 via-cyan-500 to-cyan-600" },
  { name: "Índigo Profundo", class: "bg-gradient-to-br from-indigo-400 via-indigo-500 to-indigo-600" },
  { name: "Turquesa Tropical", class: "bg-gradient-to-br from-teal-400 via-teal-500 to-teal-600" },
  { name: "Lime Energético", class: "bg-gradient-to-br from-lime-400 via-lime-500 to-lime-600" },
  { name: "Sunset Premium", class: "bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600" },
  { name: "Ocean Breeze", class: "bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-600" },
  { name: "Forest Magic", class: "bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600" },
  { name: "Royal Purple", class: "bg-gradient-to-br from-purple-400 via-indigo-500 to-blue-600" },
  { name: "Fire Gradient", class: "bg-gradient-to-br from-red-400 via-orange-500 to-yellow-600" },
  { name: "Cool Mint", class: "bg-gradient-to-br from-green-300 via-cyan-400 to-blue-500" },
];

const buttonColors = [
  "bg-blue-500 hover:bg-blue-600 text-white",
  "bg-green-500 hover:bg-green-600 text-white", 
  "bg-purple-500 hover:bg-purple-600 text-white",
  "bg-pink-500 hover:bg-pink-600 text-white",
  "bg-orange-500 hover:bg-orange-600 text-white",
  "bg-red-500 hover:bg-red-600 text-white",
  "bg-cyan-500 hover:bg-cyan-600 text-white",
  "bg-indigo-500 hover:bg-indigo-600 text-white"
];

export const MarketingImageGenerator = (props: MarketingImageGeneratorProps) => {
  const [backgroundClass, setBackgroundClass] = useState(backgroundColors[1].class);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState("template1");
  const [generatedImageUrls, setGeneratedImageUrls] = useState<{ [key: string]: string }>({});
  const [base64Images, setBase64Images] = useState<string[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(true);

  // Carregar templates salvos do banco
  const { templates: savedTemplates, isLoading: isLoadingTemplates } = useMarketingTemplates();
  
  // Carregar configurações de logo global
  const { brandSettings, isLoading: isLoadingBrandSettings } = useBrandSettings();
  
  // Logo URL derivado do brandSettings
  const logoUrl = brandSettings?.logo_url || "";

  // 🔥 DEBUG: Log das configurações de marca
  console.log('📦 MARKETING IMAGE GENERATOR - brandSettings:', JSON.stringify(brandSettings, null, 2));
  console.log('🎯 Logo URL:', logoUrl);
  console.log('🔘 Show on templates:', brandSettings?.show_logo_on_templates);

  // 🔒 SEGURANÇA: ImgBB removido - usando armazenamento local

  // Converter imagens para base64 na inicialização
  useEffect(() => {
    const convertImages = async () => {
      if (props.productImages.length === 0) {
        setIsLoadingImages(false);
        return;
      }

      try {
        console.log('🔄 Iniciando conversão de imagens para base64...');
        setIsLoadingImages(true);
        
        const convertedImages = await convertMultipleImagesToBase64(props.productImages);
        setBase64Images(convertedImages);
        
        console.log('✅ Todas as imagens convertidas para base64');
      } catch (error) {
        console.error('❌ Erro na conversão das imagens:', error);
        // Usar imagens originais como fallback
        setBase64Images(props.productImages);
      } finally {
        setIsLoadingImages(false);
      }
    };

    convertImages();
  }, [props.productImages]);

  // Templates estáticos (originais)
  const staticTemplates = [
    { id: "template1", name: "Produto em Destaque", component: MarketingTemplate1, props: { productName: props.productName, productImages: base64Images }, isDynamic: false },
    { id: "template2", name: "Ideal Para", component: MarketingTemplate2, props: { productName: props.productName, productImages: base64Images, idealFor: props.idealFor }, isDynamic: false },
    { id: "template3", name: "Garantia", component: MarketingTemplate3, props: { productName: props.productName, productImages: base64Images, guarantee: props.guarantee }, isDynamic: false },
    { id: "template4", name: "Descrição SEO", component: MarketingTemplate4, props: { productName: props.productName, productImages: base64Images, productDescription: props.seoDescription }, isDynamic: false },
    { id: "template5", name: "Benefícios", component: MarketingTemplate5, props: { productName: props.productName, productImages: base64Images, productBenefits: props.productBenefits }, isDynamic: false },
    { id: "template6", name: "FAQ", component: MarketingTemplate6, props: { productName: props.productName, productImages: base64Images, productFaqs: props.productFaqs }, isDynamic: false },
    { id: "template7", name: "Antes vs Depois", component: MarketingTemplate7, props: { productName: props.productName, productImages: base64Images, productPainPoints: props.productPainPoints, productSolutions: props.productSolutions }, isDynamic: false },
    { id: "template8", name: "Depoimentos", component: MarketingTemplate8, props: { productName: props.productName, productImages: base64Images, testimonials: props.testimonials }, isDynamic: false },
  ];

  // Templates dinâmicos do banco
  const dynamicTemplates = savedTemplates.map(template => ({
    id: `dynamic-${template.id}`,
    name: `🤖 ${template.name}`,
    templateConfig: template,
    isDynamic: true,
  }));

  // Combinar templates
  const templates = [...staticTemplates, ...dynamicTemplates];

  const uploadToImgBB = async (canvas: HTMLCanvasElement, templateId: string): Promise<string> => {
    // 🔒 SEGURANÇA: ImgBB removido - retornando data URL local
    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error('Erro ao gerar blob da imagem'));
          return;
        }

        try {
          console.log('📦 Convertendo imagem para Data URL local...');

          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            console.log('✅ Imagem convertida para Data URL com sucesso!');
            resolve(dataUrl);
          };

          reader.onerror = () => reject(new Error('Erro ao converter blob para base64'));
          reader.readAsDataURL(blob);
        } catch (error) {
          console.error('❌ Erro ao processar imagem:', error);
          reject(error);
        }
      }, 'image/png', 1.0);
    });
  };

  const generateImage = async (templateId: string) => {
    console.log(`🎯 GERANDO IMAGEM COM BASE64 - Template: ${templateId}`);
    console.log(`📊 Imagens Base64 disponíveis: ${base64Images.length}`);
    console.log(`🖼️ Primeira imagem: ${base64Images[0] ? base64Images[0].substring(0, 50) + '...' : 'NENHUMA'}`);
    
    setIsDownloading(templateId);
    
    let captureElement: HTMLElement | null = null;
    
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) {
        throw new Error('Template não encontrado');
      }

      console.log('🔄 Criando elemento para captura com imagens base64...');
      
      // Debug: verificar se as imagens base64 estão válidas
      if (base64Images.length === 0) {
        console.warn('⚠️ AVISO: Nenhuma imagem base64 disponível!');
        toast.error("Nenhuma imagem disponível para captura");
        return;
      }

      // Verificar se a primeira imagem base64 é válida
      const firstImage = base64Images[0];
      if (!firstImage || !firstImage.startsWith('data:image')) {
        console.warn('⚠️ AVISO: Primeira imagem não é base64 válida:', firstImage);
      }
      
      let templateElement;

      // Verificar se é template dinâmico ou estático
      if ((template as any).isDynamic && (template as any).templateConfig) {
        // Template dinâmico do banco
        const templateData: TemplateData = {
          aiImages: base64Images,
          unified: {}, // Pode adicionar dados de AI aqui se disponível
          product: {
            name: props.productName,
            logoUrl: logoUrl,
          },
        };

        templateElement = React.createElement(DynamicTemplateRenderer, {
          template: (template as any).templateConfig,
          data: templateData,
          logoUrl: logoUrl,
          backgroundClass: backgroundClass,
          brandSettings: brandSettings,
        });
      } else {
        // Template estático - passar brandSettings
        templateElement = React.createElement((template as any).component, {
          ...(template as any).props,
          productImages: base64Images,
          logoUrl: logoUrl,
          backgroundClass: backgroundClass,
          brandSettings: brandSettings,
        });
      }

      console.log('🏗️ Criando elemento DOM temporário...');
      // Criar elemento DOM temporário para captura
      captureElement = await createCaptureElement(templateElement);
      
      console.log('📸 Capturando elemento com html2canvas (imagens base64)...');
      
      // Debug final antes da captura
      const finalImages = captureElement.querySelectorAll('img');
      console.log('🔍 DEBUG FINAL - Imagens no elemento antes da captura:');
      finalImages.forEach((img, index) => {
        console.log(`Imagem final ${index + 1}:`, {
          src: img.src.substring(0, 50) + '...',
          isBase64: img.src.startsWith('data:image'),
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          complete: img.complete
        });
      });
      
      const canvas = await captureElementAsImage(captureElement);
      
      console.log('✅ Canvas gerado com imagens base64, enviando para ImgBB...');
      
      const imageUrl = await uploadToImgBB(canvas, templateId);
      
      setGeneratedImageUrls(prev => ({
        ...prev,
        [templateId]: imageUrl
      }));
      
      console.log('🎉 IMAGEM GERADA COM BASE64 E HOSPEDADA COM SUCESSO!');
      toast.success("✅ Imagem gerada com base64 e hospedada com sucesso!");
      
    } catch (error) {
      console.error("❌ ERRO NA GERAÇÃO COM BASE64:", error);
      toast.error("Erro ao gerar a imagem. Tente novamente.");
    } finally {
      // Limpar elemento temporário
      if (captureElement) {
        cleanupCaptureElement(captureElement);
      }
      setIsDownloading(null);
    }
  };

  const copyImageUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copiada para a área de transferência!");
  };

  const downloadImage = (url: string, templateId: string) => {
    const fileName = `${props.productName}-${templateId}.png`;
    safeDownload(url, fileName);
    toast.success("Download iniciado!");
  };

  // Mostrar loading enquanto converte imagens ou carrega templates
  if (isLoadingImages || isLoadingTemplates || isLoadingBrandSettings) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">
          {isLoadingImages ? '🔄 Convertendo imagens para base64...' : 
           isLoadingBrandSettings ? '🔄 Carregando configurações da marca...' : 
           '🔄 Carregando templates do banco...'}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          {isLoadingImages ? 'Eliminando problemas de CORS para captura perfeita' : 'Buscando seus templates salvos'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Título principal */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold gradient-text">
          🚀 Gerador de Imagens de Marketing
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <p className="text-lg font-semibold text-green-700 bg-green-50 px-6 py-3 rounded-xl border border-green-200">
            IMAGENS CONVERTIDAS PARA BASE64 - CAPTURA GARANTIDA SEM CORS
          </p>
          {savedTemplates.length > 0 && (
            <p className="text-lg font-semibold text-purple-700 bg-purple-50 px-6 py-3 rounded-xl border border-purple-200">
              🤖 {savedTemplates.length} TEMPLATES IA CARREGADOS
            </p>
          )}
        </div>
      </div>

      {/* Controles */}
      <Card className="glass-effect border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-purple-700 text-lg">
            <Palette className="h-4 w-4 text-purple-600" />
            Personalização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Global Logo Settings */}
          <GlobalLogoSettings />

          <div className="space-y-2">
            <Label className="text-sm">Cor de Fundo</Label>
            <Select value={backgroundClass} onValueChange={setBackgroundClass}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma cor" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {backgroundColors.map((color) => (
                  <SelectItem key={color.name} value={color.class}>
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full ${color.class} border border-gray-300`}></div>
                      <span className="text-sm">{color.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates */}
      <Tabs value={currentTemplate} onValueChange={setCurrentTemplate} className="w-full">
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full h-auto p-1 mb-8 overflow-x-auto">
          {templates.map((template, index) => {
            const isDynamic = (template as any).isDynamic;
            return (
              <TabsTrigger
                key={template.id}
                value={template.id}
                className={`text-xs p-2 flex flex-col items-center gap-1 transition-all whitespace-nowrap ${
                  currentTemplate === template.id 
                    ? isDynamic 
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'
                      : buttonColors[index % buttonColors.length]
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{template.name}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {templates.map((template) => {
          const isDynamic = (template as any).isDynamic;
          const dimensions = isDynamic ? (template as any).templateConfig.dimensions : { width: 1200, height: 1200 };
          
          return (
            <TabsContent key={template.id} value={template.id} className="mt-8">
              <Card className="glass-effect">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-purple-600" />
                      {template.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                        Base64 ✅
                      </Badge>
                      {isDynamic && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                          🤖 IA Gemini
                        </Badge>
                      )}
                      <Badge variant="secondary">{dimensions.width}x{dimensions.height}px</Badge>
                      <Button
                        onClick={() => generateImage(template.id)}
                        disabled={isDownloading === template.id || base64Images.length === 0}
                        className="h-8"
                        size="sm"
                      >
                        <Link className="h-4 w-4 mr-2" />
                        {isDownloading === template.id ? "Gerando..." : "Gerar Imagem"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              <CardContent className="pt-4">
                <div className="flex justify-center">
                  <div className="border border-gray-200 rounded-lg shadow-lg bg-white">
                    <div 
                      className="relative bg-gray-50"
                      style={{ 
                        width: `${dimensions.width / 2}px`, 
                        height: `${dimensions.height / 2}px` 
                      }}
                    >
                      {/* Preview renderizado em escala reduzida com imagens base64 */}
                      <div 
                        style={{ 
                          transform: 'scale(0.5)', 
                          transformOrigin: 'top left', 
                          width: `${dimensions.width}px`,
                          height: `${dimensions.height}px` 
                        }}
                      >
                        {isDynamic ? (
                          <DynamicTemplateRenderer
                            template={(template as any).templateConfig}
                            data={{
                              aiImages: base64Images,
                              unified: {},
                              product: {
                                name: props.productName,
                                logoUrl: logoUrl,
                              },
                            }}
                            logoUrl={logoUrl}
                            backgroundClass={backgroundClass}
                            brandSettings={brandSettings}
                          />
                        ) : (
                          React.createElement((template as any).component, {
                            ...(template as any).props,
                            productImages: base64Images,
                            logoUrl: logoUrl,
                            backgroundClass: backgroundClass,
                            brandSettings: brandSettings,
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* URL da imagem gerada */}
                {generatedImageUrls[template.id] && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-800">Imagem Hospedada com Sucesso!</span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="text"
                        value={generatedImageUrls[template.id]}
                        readOnly
                        className="flex-1 px-3 py-2 text-sm border border-green-300 rounded bg-white"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyImageUrl(generatedImageUrls[template.id])}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copiar
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => downloadImage(generatedImageUrls[template.id], template.id)}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Baixar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(generatedImageUrls[template.id], '_blank')}
                      >
                        <Link className="h-4 w-4 mr-1" />
                        Ver Imagem
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        );
        })}
      </Tabs>

      {/* Seção de Benefícios */}
      <Card className="glass-effect bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-700 text-lg">
            <Megaphone className="h-5 w-5" />
            🚀 Por que ter Imagens de Marketing Profissionais?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <h3 className="text-sm font-bold text-green-700">+94% Vendas</h3>
              </div>
              <p className="text-gray-700 text-xs">
                Imagens profissionais vendem muito mais.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow border border-purple-100">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm font-bold text-purple-700">+650% Engajamento</h3>
              </div>
              <p className="text-gray-700 text-xs">
                Mais curtidas, comentários e compartilhamentos.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300 rounded-lg p-3 text-center">
            <p className="text-yellow-800 text-sm font-bold">
              💡 8 templates diferentes hospedados automaticamente!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
