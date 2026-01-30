
import { Button } from "@/components/ui/button";
import { Copy, CheckSquare } from "lucide-react";

interface ResultCardActionsProps {
  improvedText: string;
  onCopy: (text: string) => void;
  onApply?: () => void;
}

export const ResultCardActions = ({ improvedText, onCopy, onApply }: ResultCardActionsProps) => {
  return (
    <div className="flex gap-2 mt-4">
      <Button
        size="sm"
        variant="outline"
        onClick={() => onCopy(improvedText)}
        className="text-xs bg-white/80 backdrop-blur-sm border-white/50 text-gray-700 hover:bg-white"
      >
        <Copy className="h-3 w-3 mr-1" />
        Copiar
      </Button>
      
      {onApply && (
        <Button
          size="sm"
          onClick={onApply}
          className="text-xs gradient-primary"
        >
          <CheckSquare className="h-3 w-3 mr-1" />
          Aplicar
        </Button>
      )}
    </div>
  );
};
