
import { Progress } from "@/components/ui/progress";
import { RefreshCw } from "lucide-react";

interface EnhancementProgressProps {
  progress: number;
  processedCount: number;
  totalImages: number;
}

export const EnhancementProgress = ({ progress, processedCount, totalImages }: EnhancementProgressProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Processando com IA...
        </span>
        <span>{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="text-sm text-muted-foreground">
        {processedCount} de {totalImages} imagem(ns) processada(s)
      </div>
    </div>
  );
};
