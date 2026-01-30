
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, CheckCircle, Maximize2, Package } from "lucide-react";
import { EnhancedImage } from "@/hooks/enhancement/types";
import { EnhancementResults } from "./EnhancementResults";
import { FullScreenComparisonModal } from "./FullScreenComparisonModal";
import { ZoomableImageModal } from "./ZoomableImageModal";
import { ImageGalleryModal } from "./ImageGalleryModal";
import { toast } from "sonner";

interface ImageEnhancementResultsProps {
  enhancedImages: EnhancedImage[];
  productName: string;
  productSku: string;
  isPersisted?: boolean;
  isSaving?: boolean;
}

export const ImageEnhancementResults = ({ 
  enhancedImages, 
  productName, 
  productSku,
  isPersisted = false,
  isSaving = false
}: ImageEnhancementResultsProps) => {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<EnhancedImage | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);

  console.log(`🎯 ImageEnhancementResults: Renderizando com ${enhancedImages.length} imagens`);

  // Renderizar sempre para evitar problemas de reconciliação do React
  if (enhancedImages.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>Nenhuma imagem melhorada para exibir.</p>
      </div>
    );
  }

  const handleViewImage = (url: string) => {
    console.log(`👁️ Visualização rápida da imagem:`, url);
    setSelectedImageUrl(url);
  };

  const handleOpenGallery = (index: number) => {
    console.log(`🖼️ FUNÇÃO handleOpenGallery CHAMADA! Índice: ${index}`);
    console.log(`📊 Total de imagens: ${enhancedImages.length}`);
    console.log(`🎯 Definindo galleryStartIndex para: ${index}`);
    console.log(`🔄 Abrindo modal da galeria...`);
    
    setGalleryStartIndex(index);
    setIsGalleryModalOpen(true);
    
    console.log(`✅ Estado do modal definido como true`);
  };

  const handleDownloadImage = async (url: string, index: number) => {
    try {
      console.log(`🔽 Baixando imagem ${index + 1} com SKU: ${productSku}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      const fileName = `${productSku}_enhanced_${index + 1}.jpg`;
      
      // Importar e usar método seguro para download
      const { safeBlobDownload } = await import('@/utils/safeDownload');
      await safeBlobDownload(blob, fileName);
      
      console.log(`✅ Download concluído: ${fileName}`);
      toast.success(`Download concluído: ${fileName}`);
    } catch (error) {
      console.error('Erro no download:', error);
      toast.error(`Erro ao baixar imagem: ${error.message}`);
    }
  };

  const handleComparisonView = (image: EnhancedImage, index: number) => {
    console.log(`🔍 Abrindo comparação para imagem ${index + 1}`);
    setSelectedImage(image);
    setSelectedImageIndex(index);
    setIsComparisonModalOpen(true);
  };

  return (
    <>
      <Card className="glass-effect shadow-lg border-2 border-green-200">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <span className="text-xl font-bold text-green-700">
                Imagens Melhoradas ({enhancedImages.length})
              </span>
              {isPersisted && (
                <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                  <Save className="h-3 w-3 mr-1" />
                  Salvas
                </Badge>
              )}
              {isSaving && (
                <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Salvando...
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Package className="h-4 w-4" />
              <span>SKU: {productSku}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <Tabs defaultValue="results" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="results" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Resultados
              </TabsTrigger>
              <TabsTrigger value="comparison" className="flex items-center gap-2">
                <Maximize2 className="h-4 w-4" />
                Comparação
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="results" className="mt-6">
              <EnhancementResults
                enhancedImages={enhancedImages}
                productName={productName}
                productSku={productSku}
                onViewImage={handleViewImage}
                onDownloadImage={handleDownloadImage}
                onOpenGallery={handleOpenGallery}
              />
            </TabsContent>
            
            <TabsContent value="comparison" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {enhancedImages.map((item, index) => (
                  <div key={`enhanced-comp-${index}-${item.enhanced?.substring?.(item.enhanced.length - 10) || index}`} className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Imagem {index + 1}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleComparisonView(item, index)}
                          className="h-7 px-3 text-xs"
                        >
                          <Maximize2 className="h-3 w-3 mr-1" />
                          Comparar com Zoom
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-2 font-medium">Original</div>
                          <div className="aspect-square relative overflow-hidden rounded border">
                            <img
                              src={item.original}
                              alt={`Original ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.warn(`Erro ao carregar imagem original ${index + 1}`);
                                e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text y="50%" x="50%" text-anchor="middle" dy=".3em">❌</text></svg>';
                              }}
                            />
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-xs text-green-600 mb-2 font-medium">Melhorada</div>
                          <div className="aspect-square relative overflow-hidden rounded border border-green-200">
                            <img
                              src={item.enhanced}
                              alt={`Melhorada ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.warn(`Erro ao carregar imagem melhorada ${index + 1}`);
                                e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text y="50%" x="50%" text-anchor="middle" dy=".3em">❌</text></svg>';
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500 text-center">
                        {item.metadata?.hosted ? '🌐 Hospedada' : '📱 Local'} • 
                        {item.metadata?.processor || 'DeepAI'} • 
                        <span className="text-green-600 font-medium">🔍 Clique em "Comparar com Zoom" para ver detalhes!</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Sempre renderizar modais para evitar problemas de DOM */}
      <ZoomableImageModal
        isOpen={!!selectedImageUrl}
        onClose={() => setSelectedImageUrl(null)}
        imageUrl={selectedImageUrl || ''}
        alt="Imagem ampliada"
      />

      <ImageGalleryModal
        isOpen={isGalleryModalOpen}
        onClose={() => {
          console.log(`❌ FECHANDO GALERIA`);
          setIsGalleryModalOpen(false);
        }}
        images={enhancedImages}
        initialIndex={galleryStartIndex}
        productName={productName}
        productSku={productSku}
      />

      <FullScreenComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        image={selectedImage || enhancedImages[0]}
        productName={productName}
        index={selectedImageIndex}
      />
    </>
  );
};
