
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Target, Search, FileText, Bot, Zap } from "lucide-react";
import { toast } from "sonner";
import { AIResponse } from "./DualAIResponse";

interface EnhancedResultCardProps {
  result: AIResponse;
  aiType: 'gemini' | 'openai';
  type: 'short';
  onCopy: (text: string) => void;
  onApply: (type: 'short', aiType: 'gemini' | 'openai') => void;
}

export const EnhancedResultCard = ({ 
  result, 
  aiType, 
  type, 
  onCopy, 
  onApply 
}: EnhancedResultCardProps) => {
  const icon = aiType === 'gemini' ? 
    <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" /> : 
    <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />;

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-4 rounded-md space-y-4 dark:from-gray-700 dark:to-gray-600 dark:border-gray-500">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-sm font-medium text-green-800 dark:text-green-200">
          Versão {aiType === 'gemini' ? 'Gemini' : 'ChatGPT'}
        </span>
      </div>
      
      {/* Descrição estruturada */}
      <div className="text-sm text-green-800 mb-3 whitespace-pre-line leading-relaxed max-h-96 overflow-y-auto border border-green-300 p-3 rounded bg-white dark:text-gray-100 dark:border-gray-400 dark:bg-gray-800">
        {result.improvedText}
      </div>

      {/* Ficha Técnica Detalhada */}
      {result.technicalSheet && (
        <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg dark:bg-gray-700 dark:border-gray-500">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Ficha Técnica Detalhada</span>
          </div>
          <div className="text-sm text-orange-800 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto cursor-pointer hover:bg-orange-100 p-2 rounded border border-orange-300 bg-white dark:text-gray-100 dark:hover:bg-gray-600 dark:border-gray-400 dark:bg-gray-800" 
               onClick={() => onCopy(result.technicalSheet!)}>
            {result.technicalSheet}
          </div>
        </div>
      )}

      {/* Títulos baseados em palavras-chave extraídas */}
      {result.searchTitles && result.searchTitles.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg dark:bg-gray-700 dark:border-gray-500">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Títulos Baseados em Palavras-chave</span>
          </div>
          <div className="space-y-1">
            {result.searchTitles.map((title, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-200">
                <span className="font-medium">{index + 1}.</span>
                <span className="cursor-pointer hover:bg-blue-100 p-1 rounded border border-blue-300 bg-white flex-1 dark:hover:bg-gray-600 dark:border-gray-400 dark:bg-gray-800 dark:text-gray-100" onClick={() => onCopy(title)}>
                  {title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Palavras-chave completas para SEO e Marketing */}
      {result.allKeywords && result.allKeywords.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg dark:bg-gray-700 dark:border-gray-500">
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Palavras-chave para SEO e Marketing</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {result.allKeywords.map((keyword, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs cursor-pointer hover:bg-purple-600 hover:text-white transition-colors dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-purple-500 dark:hover:text-white dark:border-gray-500"
                onClick={() => onCopy(keyword)}
              >
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onCopy(result.improvedText)}
          className="text-xs dark:border-gray-500 dark:text-gray-200 dark:hover:bg-gray-700 dark:bg-gray-800"
        >
          <Copy className="h-3 w-3 mr-1" />
          Copiar Descrição
        </Button>
        {result.technicalSheet && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCopy(result.technicalSheet!)}
            className="text-xs dark:border-gray-500 dark:text-gray-200 dark:hover:bg-gray-700 dark:bg-gray-800"
          >
            <FileText className="h-3 w-3 mr-1" />
            Copiar Ficha Técnica
          </Button>
        )}
        <Button
          size="sm"
          onClick={() => onApply(type, aiType)}
          className="bg-green-600 hover:bg-green-700 text-white text-xs dark:bg-green-700 dark:hover:bg-green-600"
        >
          Aplicar Esta Versão
        </Button>
      </div>

      {/* Palavras-chave SEO básicas */}
      {result.keywords && result.keywords.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">Palavras-chave SEO Básicas</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {result.keywords.map((keyword, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs cursor-pointer hover:bg-green-600 hover:text-white transition-colors dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-green-500 dark:hover:text-white dark:border-gray-500"
                onClick={() => onCopy(keyword)}
              >
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
