
import { useState, useEffect } from "react";

interface ImageDimensions {
  width: number;
  height: number;
}

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalImageUrl: string;
  enhancedImageUrl: string;
}

export const ComparisonModal = ({ 
  isOpen, 
  onClose, 
  originalImageUrl, 
  enhancedImageUrl 
}: ComparisonModalProps) => {
  const [originalDimensions, setOriginalDimensions] = useState<ImageDimensions | null>(null);
  const [enhancedDimensions, setEnhancedDimensions] = useState<ImageDimensions | null>(null);

  // Detectar dimensões da imagem original
  useEffect(() => {
    if (originalImageUrl) {
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height });
      };
      img.src = originalImageUrl;
    }
  }, [originalImageUrl]);

  // Detectar dimensões da imagem melhorada
  useEffect(() => {
    if (enhancedImageUrl) {
      const img = new Image();
      img.onload = () => {
        setEnhancedDimensions({ width: img.width, height: img.height });
      };
      img.src = enhancedImageUrl;
    }
  }, [enhancedImageUrl]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="relative w-full h-full p-4 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 text-white">
          <h2 className="text-3xl font-bold">Comparação Lado a Lado</h2>
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-colors text-xl font-bold w-12 h-12 flex items-center justify-center"
          >
            ✕
          </button>
        </div>
        
        {/* Images Container */}
        <div className="flex-1 grid md:grid-cols-2 gap-8 min-h-0">
          {/* Original Image */}
          <div className="flex flex-col h-full">
            <h3 className="text-xl font-semibold text-white mb-4 text-center flex items-center justify-center gap-2">
              <span>Original</span>
              {originalDimensions && (
                <span className="bg-red-600/80 px-3 py-1 rounded text-sm">
                  {originalDimensions.width}x{originalDimensions.height}px
                </span>
              )}
            </h3>
            <div className="flex-1 flex items-center justify-center bg-white/5 rounded-lg p-4">
              <img 
                src={originalImageUrl}
                alt="Imagem Original" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            </div>
          </div>

          {/* Enhanced Image */}
          <div className="flex flex-col h-full">
            <h3 className="text-xl font-semibold text-green-400 mb-4 text-center flex items-center justify-center gap-2">
              <span>Melhorada</span>
              {enhancedDimensions && (
                <span className="bg-green-600/80 px-3 py-1 rounded text-sm">
                  {enhancedDimensions.width}x{enhancedDimensions.height}px
                </span>
              )}
            </h3>
            <div className="flex-1 flex items-center justify-center bg-white/5 rounded-lg p-4">
              <img 
                src={enhancedImageUrl}
                alt="Imagem Melhorada" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-white/80 max-w-4xl mx-auto">
            {originalDimensions && enhancedDimensions && (
              <span className="text-green-400 font-semibold mr-4">
                Aumento de resolução: {Math.round((enhancedDimensions.width / originalDimensions.width) * 100)}%
              </span>
            )}
            Note a diferença na resolução, qualidade, nitidez dos detalhes, cores mais vibrantes e definição geral da imagem.
          </p>
        </div>
      </div>
    </div>
  );
};
