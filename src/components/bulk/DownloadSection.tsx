
import { safeDownload } from "@/utils/safeDownload";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, ZoomIn, Eye } from "lucide-react";
import { ZoomModal } from "./ZoomModal";
import { ComparisonModal } from "./ComparisonModal";

export const DownloadSection = () => {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const originalImageUrl = "/lovable-uploads/513f5e57-627f-4783-a45b-7875991c47a1.png";
  const enhancedImageUrl = "/lovable-uploads/98261f0a-0225-4482-acf5-da15a177fab3.png";

  const handleDownload = (url: string, filename: string) => {
    safeDownload(url, filename);
  };

  const handleImageClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleZoomClick = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomedImage(url);
  };

  return (
    <>
      <div className="flex justify-center mt-12">
        <Card className="glass-effect shadow-lg max-w-7xl w-full">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-center sm:text-left">
                <CardTitle className="flex items-center justify-center sm:justify-start gap-2 text-green-700">
                  <Download className="h-5 w-5" />
                  Exemplos para Download - Veja a Diferença na Prática
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Baixe as imagens de exemplo para comparar a qualidade original vs melhorada em alta resolução
                </p>
              </div>
              <div className="flex gap-3 justify-center sm:justify-end">
                <Button
                  onClick={() => handleDownload(originalImageUrl, 'bola_futebol_original.png')}
                  variant="outline"
                  size="sm"
                  className="text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Original
                </Button>
                <Button
                  onClick={() => handleDownload(enhancedImageUrl, 'bola_futebol_melhorada.png')}
                  size="sm"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Melhorada
                </Button>
                <Button
                  onClick={() => setShowComparison(true)}
                  variant="outline"
                  size="sm"
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Comparar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Original Image */}
              <div className="text-center space-y-6">
                <div className="relative group cursor-pointer">
                  <img 
                    src={originalImageUrl}
                    alt="Imagem Original" 
                    className="w-full h-96 object-cover rounded-lg shadow-lg transition-transform hover:scale-105"
                    onClick={() => handleImageClick(originalImageUrl)}
                  />
                  <div className="absolute top-3 left-3 bg-gray-800/80 text-white px-3 py-2 rounded text-sm font-medium">
                    Original - 512x512px
                  </div>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleZoomClick(originalImageUrl, e)}
                      className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-sm transition-colors flex items-center gap-1"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <ExternalLink className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>

              {/* Enhanced Image */}
              <div className="text-center space-y-6">
                <div className="relative group cursor-pointer">
                  <img 
                    src={enhancedImageUrl}
                    alt="Imagem Melhorada" 
                    className="w-full h-96 object-cover rounded-lg shadow-lg transition-transform hover:scale-105"
                    onClick={() => handleImageClick(enhancedImageUrl)}
                  />
                  <div className="absolute top-3 left-3 bg-green-600/90 text-white px-3 py-2 rounded text-sm font-medium">
                    Melhorada - 2048x2048px (4x)
                  </div>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleZoomClick(enhancedImageUrl, e)}
                      className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-sm transition-colors flex items-center gap-1"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <ExternalLink className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Comparison Text */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground max-w-3xl mx-auto">
                Compare as duas imagens para ver a diferença na qualidade, nitidez e detalhes. 
                A imagem melhorada possui resolução 4x maior (2048x2048px), cores mais vibrantes e detalhes mais definidos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <ZoomModal 
        isOpen={!!zoomedImage} 
        onClose={() => setZoomedImage(null)} 
        imageUrl={zoomedImage || ""} 
      />

      <ComparisonModal
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
        originalImageUrl={originalImageUrl}
        enhancedImageUrl={enhancedImageUrl}
      />
    </>
  );
};
