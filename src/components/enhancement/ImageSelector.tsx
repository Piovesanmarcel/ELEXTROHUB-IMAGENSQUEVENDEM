import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getProxiedUrl } from "@/lib/imageProxy";

interface ImageSelectorProps {
  images: string[];
  onSelectionChange: (selectedImages: string[]) => void;
  selectedImages: string[];
}

export const ImageSelector = ({ images, onSelectionChange, selectedImages }: ImageSelectorProps) => {
  const toggleImageSelection = (imageUrl: string) => {
    const isSelected = selectedImages.includes(imageUrl);
    
    if (isSelected) {
      onSelectionChange(selectedImages.filter(url => url !== imageUrl));
    } else {
      onSelectionChange([...selectedImages, imageUrl]);
    }
  };

  const selectAll = () => {
    onSelectionChange(images);
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };
  
  const moveToFirst = (imageUrl: string) => {
    const filtered = selectedImages.filter(url => url !== imageUrl);
    onSelectionChange([imageUrl, ...filtered]);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Selecionar Imagens para Melhorar
          </CardTitle>
          <Badge variant="secondary">
            {selectedImages.length} de {images.length} selecionadas
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={selectAll}
            disabled={selectedImages.length === images.length}
          >
            Selecionar Todas
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearSelection}
            disabled={selectedImages.length === 0}
          >
            Limpar Seleção
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((imageUrl, index) => {
            const isSelected = selectedImages.includes(imageUrl);
            const isPrimary = selectedImages[0] === imageUrl;
            
            return (
              <div
                key={imageUrl}
                className={`relative cursor-pointer rounded-lg border-2 transition-all duration-200 ${
                  isSelected 
                    ? isPrimary
                      ? 'border-green-500 shadow-lg shadow-green-500/20'
                      : 'border-primary shadow-md'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => toggleImageSelection(imageUrl)}
              >
                <div className="aspect-square relative overflow-hidden rounded-lg">
                  <img
                    src={getProxiedUrl(imageUrl)}
                    alt={`Imagem ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  
                  {/* Overlay de seleção */}
                  <div className={`absolute inset-0 transition-all duration-200 ${
                    isSelected 
                      ? isPrimary
                        ? 'bg-green-500/20'
                        : 'bg-primary/20'
                      : 'bg-transparent hover:bg-black/10'
                  }`} />
                  
                  {/* Checkbox */}
                  <div className="absolute top-2 right-2">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => toggleImageSelection(imageUrl)}
                      className="bg-white shadow-sm"
                    />
                  </div>
                  
                  {/* Badge Principal */}
                  {isPrimary && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-green-600 text-white text-xs font-bold">
                        ⭐ PRINCIPAL
                      </Badge>
                    </div>
                  )}
                  
                  {/* Botão para definir como principal */}
                  {isSelected && !isPrimary && (
                    <div className="absolute top-2 left-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-6 text-xs px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveToFirst(imageUrl);
                        }}
                      >
                        Usar como Principal
                      </Button>
                    </div>
                  )}
                  
                  {/* Número da imagem */}
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="secondary" className="text-xs">
                      {index + 1}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {selectedImages.length > 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>⭐ Imagem Principal:</strong> A primeira imagem selecionada será usada como produto principal nos showcases. 
              Clique em "Usar como Principal" para mudar.
            </p>
          </div>
        )}
        
        {selectedImages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Selecione as imagens que deseja melhorar com DeepAI
          </div>
        )}
      </CardContent>
    </Card>
  );
};