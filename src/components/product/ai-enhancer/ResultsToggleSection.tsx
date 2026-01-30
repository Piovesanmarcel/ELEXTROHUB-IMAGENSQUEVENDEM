
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";

interface ResultsToggleSectionProps {
  showResults: boolean;
  onToggleResults: () => void;
}

export const ResultsToggleSection = ({ showResults, onToggleResults }: ResultsToggleSectionProps) => {
  return (
    <div className="flex justify-center">
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleResults}
        className="bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
      >
        {showResults ? (
          <>
            <EyeOff className="h-4 w-4 mr-2" />
            Ocultar Resultados
            <ChevronUp className="h-4 w-4 ml-2" />
          </>
        ) : (
          <>
            <Eye className="h-4 w-4 mr-2" />
            Mostrar Resultados Salvos
            <ChevronDown className="h-4 w-4 ml-2" />
          </>
        )}
      </Button>
    </div>
  );
};
