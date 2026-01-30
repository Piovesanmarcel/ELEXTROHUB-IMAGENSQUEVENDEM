
import { Button } from "@/components/ui/button";
import { Check, Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EnhancementResultsHeaderProps {
  imageCount: number;
  productSku: string;
  onDownloadAll: () => void;
}

export const EnhancementResultsHeader = ({
  imageCount,
  productSku,
  onDownloadAll
}: EnhancementResultsHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3 text-green-700">
        <Check className="h-6 w-6" />
        <span className="font-semibold text-xl">
          {imageCount} imagem(ns) melhorada(s) com sucesso!
        </span>
        <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
          SKU: {productSku}
        </Badge>
      </div>
      
      <Button
        onClick={onDownloadAll}
        className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
      >
        <Archive className="h-4 w-4 mr-2" />
        Baixar Todas em ZIP
      </Button>
    </div>
  );
};
