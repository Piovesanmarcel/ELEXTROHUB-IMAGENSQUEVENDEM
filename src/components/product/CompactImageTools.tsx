
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";

interface CompactImageToolsProps {
  productId: string;
  productName: string;
  productSku: string;
  images: string[];
  onImagesUpdated: () => void;
  enhancementRecommended?: boolean;
  shortDescription?: string;
  altura?: number | null;
  largura?: number | null;
  profundidade?: number | null;
  peso_bruto?: number | null;
}

export const CompactImageTools = ({ 
  productId, 
  productName, 
  productSku, 
  images, 
  onImagesUpdated, 
  enhancementRecommended = false,
  shortDescription = '',
  altura,
  largura,
  profundidade,
  peso_bruto
}: CompactImageToolsProps) => {
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

  // Seção simplificada - ferramentas de IA avançada ocultadas
  return null;
};
