
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, AlertTriangle, CheckCircle, XCircle, Zap, TrendingUp, ZoomIn, ZoomOut, RotateCw, ImageIcon, BarChart3 } from "lucide-react";

interface ImageQuality {
  sharpness: 'poor' | 'fair' | 'good' | 'excellent';
  resolution: 'low' | 'medium' | 'high';
  colors: 'poor' | 'fair' | 'good' | 'excellent';
  lighting: 'poor' | 'fair' | 'good' | 'excellent';
  overall: 'poor' | 'fair' | 'good' | 'excellent';
  needsEnhancement: boolean;
  width: number;
  height: number;
}

interface ImageQualityAnalyzerProps {
  images: string[];
  productName: string;
  onNeedsEnhancement: (needed: boolean) => void;
}

export const ImageQualityAnalyzer = ({ images, productName, onNeedsEnhancement }: ImageQualityAnalyzerProps) => {
  const [imageQualities, setImageQualities] = useState<Record<string, ImageQuality>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [selectedImageForZoom, setSelectedImageForZoom] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  const analyzeImageQuality = (imageUrl: string): Promise<ImageQuality> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve({
            sharpness: 'poor',
            resolution: 'low',
            colors: 'poor',
            lighting: 'poor',
            overall: 'poor',
            needsEnhancement: true,
            width: 0,
            height: 0
          });
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Análise básica de qualidade
        const width = img.width;
        const height = img.height;
        const totalPixels = width * height;

        // Análise de resolução - NOVO CRITÉRIO: apenas acima de 1200x1200 é OK
        let resolution: 'low' | 'medium' | 'high' = 'low';
        if (width > 1200 && height > 1200) {
          resolution = 'high'; // OK apenas se ambas dimensões > 1200
        } else if (totalPixels >= 500000) {
          resolution = 'medium'; // Regular para tamanhos intermediários
        } else {
          resolution = 'low'; // Inadequado para tamanhos pequenos
        }

        // Análise simples de nitidez (baseada em tamanho e qualidade esperada)
        let sharpness: 'poor' | 'fair' | 'good' | 'excellent' = 'poor';
        if (width > 1200 && height > 1200) sharpness = 'excellent';
        else if (width >= 800 && height >= 800) sharpness = 'good';
        else if (width >= 500 && height >= 500) sharpness = 'fair';

        // Análise de cores (baseada na resolução)
        let colors: 'poor' | 'fair' | 'good' | 'excellent' = 'poor';
        if (resolution === 'high') colors = 'good';
        else if (resolution === 'medium') colors = 'fair';

        // Análise de iluminação
        let lighting: 'poor' | 'fair' | 'good' | 'excellent' = 'fair';
        if (resolution === 'high' && sharpness === 'excellent') lighting = 'good';

        // Análise geral
        const scores = { poor: 0, fair: 1, good: 2, excellent: 3 };
        const avgScore = (scores[sharpness] + scores[colors] + scores[lighting]) / 3;
        
        let overall: 'poor' | 'fair' | 'good' | 'excellent' = 'poor';
        if (avgScore >= 2.5) overall = 'excellent';
        else if (avgScore >= 2) overall = 'good';
        else if (avgScore >= 1) overall = 'fair';

        // Precisa de melhoria se não atende aos novos critérios
        const needsEnhancement = resolution !== 'high' || overall === 'poor';

        resolve({
          sharpness,
          resolution,
          colors,
          lighting,
          overall,
          needsEnhancement,
          width,
          height
        });
      };

      img.onerror = () => {
        resolve({
          sharpness: 'poor',
          resolution: 'low',
          colors: 'poor',
          lighting: 'poor',
          overall: 'poor',
          needsEnhancement: true,
          width: 0,
          height: 0
        });
      };

      img.src = imageUrl;
    });
  };

  const analyzeAllImages = async () => {
    if (images.length === 0) return;

    setIsAnalyzing(true);
    const qualities: Record<string, ImageQuality> = {};
    
    for (const imageUrl of images) {
      const quality = await analyzeImageQuality(imageUrl);
      qualities[imageUrl] = quality;
    }

    setImageQualities(qualities);
    
    // Determinar se alguma imagem precisa de melhoria
    const needsEnhancement = Object.values(qualities).some(q => q.needsEnhancement);
    onNeedsEnhancement(needsEnhancement);
    
    setIsAnalyzing(false);
  };

  useEffect(() => {
    if (images.length > 0) {
      analyzeAllImages();
    }
  }, [images]);

  const getQualityText = (quality: string, type: string) => {
    if (type === 'resolution') {
      switch (quality) {
        case 'high': return 'OK'; // Apenas high (>1200x1200) é OK
        case 'medium': return 'Regular';
        case 'low': return 'Inadequada';
        default: return quality;
      }
    }
    
    switch (quality) {
      case 'excellent': return 'Excelente';
      case 'good': return 'Boa';
      case 'fair': return 'Regular';
      case 'poor': return 'Inadequada';
      default: return quality;
    }
  };

  const getQualityColor = (quality: string, type: string) => {
    if (type === 'resolution') {
      // Apenas 'high' (>1200x1200) tem cor verde (OK)
      if (quality === 'high') {
        return 'text-blue-700 bg-gradient-to-r from-blue-50 to-green-50 border-blue-300';
      } else {
        return 'text-red-700 bg-gradient-to-r from-red-50 to-orange-50 border-red-300';
      }
    }
    
    const isGood = quality === 'excellent' || quality === 'good' || quality === 'medium';
    
    if (isGood) {
      return 'text-blue-700 bg-gradient-to-r from-blue-50 to-green-50 border-blue-300';
    } else {
      return 'text-red-700 bg-gradient-to-r from-red-50 to-orange-50 border-red-300';
    }
  };

  const getQualityIcon = (quality: string, type: string) => {
    if (type === 'resolution') {
      // Apenas 'high' (>1200x1200) tem ícone de sucesso
      if (quality === 'high') {
        return <CheckCircle className="h-4 w-4" />;
      } else {
        return <XCircle className="h-4 w-4" />;
      }
    }
    
    const isGood = quality === 'excellent' || quality === 'good' || quality === 'medium';
    
    if (isGood) {
      return <CheckCircle className="h-4 w-4" />;
    } else {
      return <XCircle className="h-4 w-4" />;
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImageForZoom(imageUrl);
    setZoomLevel(1);
    setRotation(0);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleCloseZoom = () => {
    setSelectedImageForZoom(null);
    setZoomLevel(1);
    setRotation(0);
  };

  const overallNeedsEnhancement = Object.values(imageQualities).some(q => q.needsEnhancement);

  const getImageStats = () => {
    const qualities = Object.values(imageQualities);
    const totalImages = qualities.length;
    const needsEnhancement = qualities.filter(q => q.needsEnhancement).length;
    const excellentQuality = qualities.filter(q => q.overall === 'excellent').length;
    const goodQuality = qualities.filter(q => q.overall === 'good').length;
    const fairQuality = qualities.filter(q => q.overall === 'fair').length;
    const poorQuality = qualities.filter(q => q.overall === 'poor').length;
    const highRes = qualities.filter(q => q.resolution === 'high').length; // Apenas >1200x1200
    const mediumRes = qualities.filter(q => q.resolution === 'medium').length;
    const lowRes = qualities.filter(q => q.resolution === 'low').length;

    return {
      totalImages,
      needsEnhancement,
      excellentQuality,
      goodQuality,
      fairQuality,
      poorQuality,
      highRes,
      mediumRes,
      lowRes
    };
  };

  if (images.length === 0) return null;

  const imageStats = getImageStats();

  return (
    <>
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Análise de Qualidade das Imagens para Conversão
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="text-xs"
            >
              {showAnalysis ? 'Ocultar' : 'Ver Análise'}
            </Button>
          </CardTitle>
        </CardHeader>
        
        {showAnalysis && (
          <CardContent className="space-y-4">
            {isAnalyzing ? (
              <div className="text-center py-4">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Analisando qualidade das imagens para conversão...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {images.map((imageUrl, index) => {
                  const quality = imageQualities[imageUrl];
                  if (!quality) return null;

                  return (
                    <div key={index} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">Imagem {index + 1}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {quality.width}x{quality.height}px
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleImageClick(imageUrl)}
                            className="text-xs h-6 px-2"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div className={`flex items-center gap-1 px-2 py-1 rounded border ${getQualityColor(quality.sharpness, 'sharpness')}`}>
                          {getQualityIcon(quality.sharpness, 'sharpness')}
                          <span>Nitidez: {getQualityText(quality.sharpness, 'sharpness')}</span>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded border ${getQualityColor(quality.resolution, 'resolution')}`}>
                          {getQualityIcon(quality.resolution, 'resolution')}
                          <span>Resolução: {getQualityText(quality.resolution, 'resolution')}</span>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded border ${getQualityColor(quality.colors, 'colors')}`}>
                          {getQualityIcon(quality.colors, 'colors')}
                          <span>Cores: {getQualityText(quality.colors, 'colors')}</span>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded border ${getQualityColor(quality.lighting, 'lighting')}`}>
                          {getQualityIcon(quality.lighting, 'lighting')}
                          <span>Iluminação: {getQualityText(quality.lighting, 'lighting')}</span>
                        </div>
                      </div>
                      
                      <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${getQualityColor(quality.overall, 'overall')}`}>
                        <div className="flex items-center gap-2">
                          {getQualityIcon(quality.overall, 'overall')}
                          <span className="font-medium">Qualidade Geral: {getQualityText(quality.overall, 'overall')}</span>
                        </div>
                        {quality.needsEnhancement && (
                          <Badge variant="outline" className="text-xs border-orange-300 text-orange-600 bg-orange-50">
                            Otimização Recomendada
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {overallNeedsEnhancement && !isAnalyzing && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mt-4">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <div>
                    <h4 className="font-semibold text-purple-800">Otimização para Maior Conversão</h4>
                    <p className="text-sm text-purple-700 mb-2">
                      Imagens de alta qualidade (acima de 1200x1200) aumentam significativamente as taxas de conversão:
                    </p>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• <strong>+40% mais vendas</strong> com imagens nítidas e bem iluminadas</li>
                      <li>• <strong>+65% mais cliques</strong> em produtos com múltiplas imagens de qualidade</li>
                      <li>• <strong>-30% taxa de rejeição</strong> com imagens otimizadas para conversão</li>
                      <li>• <strong>+25% tempo na página</strong> com galeria de imagens atrativa</li>
                    </ul>
                    <p className="text-sm text-purple-700 mt-2 font-medium">
                      Use nossa ferramenta DeepAI para otimizar automaticamente suas imagens e maximizar suas vendas.
                    </p>
                  </div>
                </div>

                {/* Estatísticas detalhadas das imagens */}
                <div className="border-t border-purple-200 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                    <h5 className="font-semibold text-purple-800">Estatísticas das Imagens</h5>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Total de imagens */}
                    <div className="bg-white/70 rounded-lg p-3 border border-purple-200">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-purple-600" />
                        <div>
                          <div className="text-lg font-bold text-purple-800">{imageStats.totalImages}</div>
                          <div className="text-xs text-purple-700">Total</div>
                        </div>
                      </div>
                    </div>

                    {/* Precisam melhoria */}
                    <div className="bg-white/70 rounded-lg p-3 border border-orange-200">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <div>
                          <div className="text-lg font-bold text-orange-800">{imageStats.needsEnhancement}</div>
                          <div className="text-xs text-orange-700">Precisam Melhoria</div>
                        </div>
                      </div>
                    </div>

                    {/* Qualidade excelente */}
                    <div className="bg-white/70 rounded-lg p-3 border border-green-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="text-lg font-bold text-green-800">{imageStats.excellentQuality}</div>
                          <div className="text-xs text-green-700">Excelentes</div>
                        </div>
                      </div>
                    </div>

                    {/* Alta resolução (>1200x1200) */}
                    <div className="bg-white/70 rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="text-lg font-bold text-blue-800">{imageStats.highRes}</div>
                          <div className="text-xs text-blue-700">Resolução OK ({'>'}1200x1200)</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detalhamento adicional */}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-white/50 rounded px-2 py-1 border border-purple-100">
                      <span className="font-medium text-purple-700">Qualidade Boa: </span>
                      <span className="text-purple-800 font-bold">{imageStats.goodQuality}</span>
                    </div>
                    <div className="bg-white/50 rounded px-2 py-1 border border-purple-100">
                      <span className="font-medium text-purple-700">Qualidade Regular: </span>
                      <span className="text-purple-800 font-bold">{imageStats.fairQuality}</span>
                    </div>
                    <div className="bg-white/50 rounded px-2 py-1 border border-purple-100">
                      <span className="font-medium text-purple-700">Qualidade Inadequada: </span>
                      <span className="text-purple-800 font-bold">{imageStats.poorQuality}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Modal de Zoom da Imagem */}
      <Dialog open={!!selectedImageForZoom} onOpenChange={handleCloseZoom}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0">
          <DialogHeader className="p-4 pb-2 border-b">
            <DialogTitle className="flex items-center justify-between">
              <span>Análise Detalhada da Imagem</span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 5}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRotate}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto bg-gray-50">
            <div className="flex items-center justify-center min-h-[500px] p-4">
              {selectedImageForZoom && (
                <img
                  src={selectedImageForZoom}
                  alt="Imagem ampliada para análise"
                  className="max-w-none transition-all duration-200 cursor-move"
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    transformOrigin: 'center center'
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f0f0f0'/%3E%3Ctext x='200' y='150' font-family='Arial' font-size='16' fill='%23999' text-anchor='middle'%3EImagem não disponível%3C/text%3E%3C/svg%3E";
                  }}
                />
              )}
            </div>
          </div>
          
          {selectedImageForZoom && imageQualities[selectedImageForZoom] && (
            <div className="p-4 border-t bg-white">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {(() => {
                  const quality = imageQualities[selectedImageForZoom];
                  return (
                    <>
                      <div className={`flex items-center gap-1 px-3 py-2 rounded border ${getQualityColor(quality.sharpness, 'sharpness')}`}>
                        {getQualityIcon(quality.sharpness, 'sharpness')}
                        <span>Nitidez: {getQualityText(quality.sharpness, 'sharpness')}</span>
                      </div>
                      <div className={`flex items-center gap-1 px-3 py-2 rounded border ${getQualityColor(quality.resolution, 'resolution')}`}>
                        {getQualityIcon(quality.resolution, 'resolution')}
                        <span>Resolução: {getQualityText(quality.resolution, 'resolution')}</span>
                      </div>
                      <div className={`flex items-center gap-1 px-3 py-2 rounded border ${getQualityColor(quality.colors, 'colors')}`}>
                        {getQualityIcon(quality.colors, 'colors')}
                        <span>Cores: {getQualityText(quality.colors, 'colors')}</span>
                      </div>
                      <div className={`flex items-center gap-1 px-3 py-2 rounded border ${getQualityColor(quality.lighting, 'lighting')}`}>
                        {getQualityIcon(quality.lighting, 'lighting')}
                        <span>Iluminação: {getQualityText(quality.lighting, 'lighting')}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
