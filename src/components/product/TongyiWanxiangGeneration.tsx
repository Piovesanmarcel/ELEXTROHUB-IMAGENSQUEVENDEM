import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Loader2 } from "lucide-react";

interface TongyiWanxiangGenerationProps {
  generatedPrompts: string[];
  isSequentialGeneration: boolean;
  selectedBaseImages: string[];
  individualGenerationStates: Record<number | string, boolean>;
  isGeneratingAll: boolean;
  currentGenerationProgress: { current: number; total: number; prompt: string };
  onGenerateAllImagesSequentially: () => void;
  onGenerateImageWithPrompt: (index: number) => void;
  // 🆕 Gemini Carousel
  selectedAI: 'tongyi' | 'gemini';
  onGenerateGeminiCarousel?: () => void;
  isGeneratingGeminiCarousel?: boolean;
}

export const TongyiWanxiangGeneration: React.FC<TongyiWanxiangGenerationProps> = ({
  generatedPrompts,
  isSequentialGeneration,
  selectedBaseImages,
  individualGenerationStates,
  isGeneratingAll,
  currentGenerationProgress,
  onGenerateAllImagesSequentially,
  onGenerateImageWithPrompt,
  selectedAI,
  onGenerateGeminiCarousel,
  isGeneratingGeminiCarousel = false,
}) => {
  // 🆕 Modo Gemini: Não precisa de prompts gerados
  if (selectedAI === 'gemini') {
    if (selectedBaseImages.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Brain className="h-8 w-8 mx-auto mb-2 text-orange-300" />
          <p>Selecione 1 imagem base para gerar 4 imagens carrossel</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <h4 className="font-medium mb-3 text-orange-700">
          🍌 Geração com Gemini Nano Banana
        </h4>
        
        <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="text-4xl">🍌</div>
            <div>
              <h5 className="font-semibold text-orange-900 mb-1">Gemini Nano Banana - Modo Rápido</h5>
              <p className="text-sm text-orange-700">
                Geração instantânea: selecione 1 imagem e receba 4 imagens otimizadas para carrossel de publicidade automaticamente.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-orange-600">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              1 Request
            </span>
            <span>•</span>
            <span>4 Imagens</span>
            <span>•</span>
            <span>30-60s</span>
            <span>•</span>
            <span className="font-semibold">Sem análise necessária</span>
          </div>
        </div>
        
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
          <Button
            onClick={onGenerateGeminiCarousel}
            disabled={isGeneratingGeminiCarousel || selectedBaseImages.length === 0}
            className="relative w-full py-8 text-xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 hover:from-yellow-500 hover:via-orange-600 hover:to-yellow-500 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
            size="lg"
          >
            {isGeneratingGeminiCarousel ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-base">Gerando 4 Imagens Carrossel...</span>
                <span className="text-xs opacity-90">Aguarde 30-60 segundos</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">🍌</span>
                <div className="text-left">
                  <div>Gerar 4 Imagens Carrossel</div>
                  <div className="text-xs font-normal opacity-90">com Gemini Nano Banana</div>
                </div>
              </div>
            )}
          </Button>
        </div>
        
        {selectedBaseImages.length === 0 && (
          <div className="mt-4 text-center text-sm text-orange-600 bg-orange-50 rounded-lg p-3 border border-orange-200">
            👆 Selecione 1 imagem acima para começar
          </div>
        )}
      </div>
    );
  }
  
  // 🎨 Modo Tongyi (original)
  if (generatedPrompts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Brain className="h-8 w-8 mx-auto mb-2 text-orange-300" />
        <p>Gere os prompts na aba "Análise e Prompts" primeiro</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="font-medium mb-3 text-orange-700">
        ✨ Geração de Imagens com Gemini 2.5 Flash Image Preview
      </h4>
      
      <h5 className="font-medium mb-2">Selecione as imagens base para geração:</h5>
      
      <div className="mb-4">
        <h5 className="font-medium mb-2 text-green-700">
          🎯 Opções de Geração:
        </h5>
        <Button
          onClick={onGenerateAllImagesSequentially}
          disabled={isSequentialGeneration || selectedBaseImages.length === 0 || generatedPrompts.length === 0}
          className="bg-green-600 hover:bg-green-700 text-white font-medium"
        >
          {isSequentialGeneration ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Gerando {currentGenerationProgress.current + 1}/{currentGenerationProgress.total}
            </>
          ) : (
            `🚀 Gerar Todos os ${generatedPrompts.length} Cenários`
          )}
        </Button>

        {isSequentialGeneration && currentGenerationProgress.total > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progresso: {currentGenerationProgress.current}/{currentGenerationProgress.total}</span>
              <span>{Math.round((currentGenerationProgress.current / currentGenerationProgress.total) * 100)}%</span>
            </div>
            <div className="w-full bg-green-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(currentGenerationProgress.current / currentGenerationProgress.total) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h5 className="font-medium text-orange-700">🎨 Geração Individual:</h5>
        {generatedPrompts.map((prompt, index) => (
          <div key={`generation-${index}`} className="border rounded-lg p-3 bg-orange-50/30">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="text-orange-600 bg-orange-100">
                CENÁRIO {index + 1}
              </Badge>
              <Button
                onClick={() => onGenerateImageWithPrompt(index)}
                disabled={individualGenerationStates[index] || isGeneratingAll || selectedBaseImages.length === 0}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700"
              >
                {individualGenerationStates[index] ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Gerar"
                )}
              </Button>
            </div>
            <Textarea
              value={prompt}
              readOnly
              className="min-h-[80px] bg-white text-sm resize-none"
            />
          </div>
        ))}

        {/* 🚫 REMOVIDO: Seção de prompts extras do Gemini cancelada */}
      </div>
    </div>
  );
};