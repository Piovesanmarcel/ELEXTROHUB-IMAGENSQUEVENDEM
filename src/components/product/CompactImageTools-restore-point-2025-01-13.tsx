// ============= PONTO DE RESTAURAÇÃO - 13/01/2025 =============
// Este é um backup do componente CompactImageTools.tsx
// Para restaurar: renomeie este arquivo para CompactImageTools.tsx

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, ImageIcon, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import { ImageEnhancer } from "@/components/ImageEnhancer";

interface CompactImageToolsProps {
  productId: string;
  productName: string;
  productSku: string;
  images: string[];
  onImagesUpdated: () => void;
  enhancementRecommended?: boolean;
}

export const CompactImageTools = ({ 
  productId, 
  productName, 
  productSku, 
  images, 
  onImagesUpdated,
  enhancementRecommended = false
}: CompactImageToolsProps) => {
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  // Verificar se o produto já tem melhorias DeepAI
  const hasDeepAIEnhancements = localStorage.getItem(`deepai_enhanced_${productId}`) === 'true';

  const toggleTool = (tool: string) => {
    setExpandedTool(expandedTool === tool ? null : tool);
  };

  if (images.length === 0) {
    return (
      <Card className="glass-effect">
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            <ImageIcon className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Nenhuma imagem disponível para processamento</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* DeepAI Enhancement */}
      <Card className="glass-effect border-2 border-purple-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Melhoria com DeepAI</CardTitle>
              {hasDeepAIEnhancements ? (
                <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Já Melhorado
                </Badge>
              ) : enhancementRecommended ? (
                <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 text-xs">
                  Recomendado
                </Badge>
              ) : null}
            </div>
            {!hasDeepAIEnhancements && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleTool('deepai')}
                className="text-purple-600 border-purple-300 hover:bg-purple-50"
              >
                {expandedTool === 'deepai' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
          </div>
          {hasDeepAIEnhancements && (
            <p className="text-sm text-green-600 mt-2">
              ✅ Este produto já teve suas imagens melhoradas com DeepAI
            </p>
          )}
        </CardHeader>
        
        {/* Sempre mostrar o ImageEnhancer se já foi melhorado, senão só quando expandido */}
        {(hasDeepAIEnhancements || expandedTool === 'deepai') && (
          <CardContent className="pt-0">
            <ImageEnhancer
              productId={productId}
              productName={productName}
              productSku={productSku}
              images={images}
              onImagesUpdated={onImagesUpdated}
            />
          </CardContent>
        )}
      </Card>
    </div>
  );
};