import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";
import { copyAllPrompts } from "@/utils/tongyiHelpers";

interface TongyiWanxiangPromptsProps {
  generatedPrompts: string[];
  // 🚫 REMOVIDO: geminiExtraPrompts - funcionalidade cancelada
  isGeneratingPrompts: boolean;
  onGeneratePromptsClick: () => void;
  selectedImagesForAnalysis: string[];
}

export const TongyiWanxiangPrompts: React.FC<TongyiWanxiangPromptsProps> = ({
  generatedPrompts,
  // 🚫 REMOVIDO: geminiExtraPrompts - funcionalidade cancelada
  isGeneratingPrompts,
  onGeneratePromptsClick,
  selectedImagesForAnalysis
}) => {
  const handleCopyAllPrompts = async () => {
    try {
      await copyAllPrompts(generatedPrompts);
      toast.success('Todos os prompts copiados para área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar prompts:', error);
      toast.error('Erro ao copiar prompts');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mt-4">
        <Button
          onClick={onGeneratePromptsClick}
          disabled={isGeneratingPrompts || selectedImagesForAnalysis.length === 0}
          className="flex-1 bg-orange-600 hover:bg-orange-700"
        >
          {isGeneratingPrompts ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Brain className="h-4 w-4 mr-2" />
          )}
          {isGeneratingPrompts ? 'Gerando...' : 'Gerar 5 Prompts Ultra Realistas'}
        </Button>
        
        {generatedPrompts.length > 0 && (
          <Button
            onClick={handleCopyAllPrompts}
            variant="outline"
            size="sm"
            className="text-orange-600 border-orange-300 hover:bg-orange-50"
          >
            <Copy className="h-4 w-4" />
          </Button>
        )}
      </div>

      {generatedPrompts.length > 0 && (
        <>
          <div className="space-y-3">
            <h5 className="font-medium text-orange-700 flex items-center gap-2">
              🎨 Prompts Gerados ({generatedPrompts.length}/5):
            </h5>
            {generatedPrompts.map((prompt, index) => (
              <div key={`prompt-${index}`} className="border rounded-lg p-3 bg-orange-50/50">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="text-orange-600 bg-orange-100">
                    Cenário {index + 1}
                  </Badge>
                </div>
                <Textarea
                  value={prompt}
                  readOnly
                  className="min-h-[100px] bg-white border-orange-200 text-sm resize-none"
                />
              </div>
            ))}
          </div>

          {/* 🚫 REMOVIDO: Seção de prompts extras do Gemini cancelada */}
        </>
      )}
    </div>
  );
};