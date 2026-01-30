import React, { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Image as ImageIcon, Loader2, RefreshCw } from "lucide-react";
import { EnhancedImage } from "@/hooks/enhancement/types";
import { useEnhancedImagesCache } from "@/hooks/useEnhancedImagesCache";
import { ImageSkeleton } from "@/components/ui/image-skeleton";

interface DeepAIImageSelectorProps {
  productId: string;
  onImageSelected: (imageUrls: string[]) => void;
  selectedImageUrls?: string[];
}

const DeepAIImageSelectorComponent = ({ 
  productId, 
  onImageSelected, 
  selectedImageUrls = [] 
}: DeepAIImageSelectorProps) => {
  const { enhancedImages, isLoading, error, refetch } = useEnhancedImagesCache(productId);

  if (isLoading) {
    return (
      <Card className="border-dashed border-2 border-gray-300">
        <CardContent className="p-4">
          <div className="text-center mb-4">
            <Loader2 className="h-8 w-8 mx-auto mb-2 text-gray-400 animate-spin" />
            <p className="text-sm text-gray-500">
              Carregando imagens melhoradas...
            </p>
          </div>
          {/* Skeleton placeholders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <ImageSkeleton />
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="p-4 text-center">
          <div className="text-red-500 mb-2">❌</div>
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <Button 
            onClick={refetch} 
            variant="outline" 
            size="sm"
            className="text-red-600 border-red-300 hover:bg-red-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (enhancedImages.length === 0) {
    return (
      <Card className="border-dashed border-2 border-gray-300">
        <CardContent className="p-4 text-center">
          <ImageIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500">
            Nenhuma imagem melhorada encontrada. 
            <br />
            Execute primeiro a "Melhoria com DeepAI" para disponibilizar imagens para seleção.
          </p>
          <Button 
            onClick={refetch} 
            variant="outline" 
            size="sm"
            className="mt-3"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-green-700">
          Selecionar Imagens Melhoradas (DeepAI)
        </CardTitle>
        <p className="text-xs text-green-600">
          Escolha uma ou várias imagens melhoradas para usar como base na IA Avançada
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Label className="text-sm font-medium">
          Imagens Disponíveis ({enhancedImages.length}) - Selecionadas ({selectedImageUrls.length})
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {enhancedImages.map((image, index) => (
            <div
              key={index}
              className={`relative border-2 rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-105 bg-gradient-to-br from-green-100 to-emerald-100 ${
                selectedImageUrls.includes(image.enhanced)
                  ? 'border-green-500 shadow-lg'
                  : 'border-gray-200 hover:border-green-300'
              }`}
              onClick={() => {
                const isSelected = selectedImageUrls.includes(image.enhanced);
                let newSelection: string[];
                
                if (isSelected) {
                  // Remove da seleção
                  newSelection = selectedImageUrls.filter(url => url !== image.enhanced);
                } else {
                  // Adiciona à seleção
                  newSelection = [...selectedImageUrls, image.enhanced];
                }
                
                onImageSelected(newSelection);
              }}
            >
              {/* Container da imagem com proporção quadrada igual à galeria */}
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-green-100 to-emerald-100">
                <img
                  src={image.enhanced}
                  alt={`Imagem melhorada ${index + 1}`}
                  className="w-full h-full object-cover transition-all duration-300"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text y="50%" x="50%" text-anchor="middle" dy=".3em">❌</text></svg>';
                  }}
                />
                {selectedImageUrls.includes(image.enhanced) && (
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-green-600 bg-white rounded-full shadow-lg" />
                  </div>
                )}
              </div>
              
              {/* Info da imagem */}
              <div className="p-3 bg-white border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Imagem {index + 1}
                  </span>
                  {selectedImageUrls.includes(image.enhanced) && (
                    <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 text-xs">
                      Selecionada
                    </Badge>
                  )}
                </div>
                {image.metadata?.processor && (
                  <div className="text-xs text-gray-500 mt-1">
                    {image.metadata.processor}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {selectedImageUrls.length > 0 && (
          <div className="mt-3 p-3 bg-green-100 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">
                {selectedImageUrls.length === 1 
                  ? 'Imagem selecionada com sucesso!' 
                  : `${selectedImageUrls.length} imagens selecionadas com sucesso!`
                }
              </span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              {selectedImageUrls.length === 1 
                ? 'Esta imagem será usada como base para a transformação na IA Avançada'
                : 'Estas imagens serão usadas como base para a transformação na IA Avançada'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const DeepAIImageSelector = memo(DeepAIImageSelectorComponent);