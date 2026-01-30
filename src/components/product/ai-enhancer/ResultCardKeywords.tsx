import { Badge } from "@/components/ui/badge";
import { Tags } from "lucide-react";

interface ResultCardKeywordsProps {
  keywords: string[];
  onCopy: (text: string) => void;
}

export const ResultCardKeywords = ({ keywords, onCopy }: ResultCardKeywordsProps) => {
  if (!keywords || keywords.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-2">
        <Tags className="h-3 w-3 text-purple-600" />
        <span className="text-xs font-medium text-purple-700">
          Palavras-chave principais
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {keywords.slice(0, 10).map((keyword, index) => (
          <Badge 
            key={index} 
            variant="secondary" 
            className="text-xs cursor-pointer hover:bg-purple-600 hover:text-white transition-colors bg-gray-100 text-gray-700 border-gray-300"
            onClick={() => onCopy(keyword)}
          >
            {keyword}
          </Badge>
        ))}
      </div>
    </div>
  );
};
