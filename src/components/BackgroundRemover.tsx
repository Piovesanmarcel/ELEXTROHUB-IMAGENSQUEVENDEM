
import { safeDownload, safeBlobDownload } from "@/utils/safeDownload";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scissors, AlertCircle, Download, Eye, Archive, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ProcessedImage {
  original: string;
  processed: string;
  metadata?: any;
}

interface BackgroundRemoverProps {
  productId: string;
  productName: string;
  productSku: string;
  images: string[];
}

export const BackgroundRemover = ({ 
  productId, 
  productName, 
  productSku,
  images
}: BackgroundRemoverProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [backgroundType, setBackgroundType] = useState<'remove' | 'white'>('white');
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);

  const handleProcessImages = async () => {
    console.log('=== INICIANDO PROCESSO DE REMOÇÃO/ALTERAÇÃO DE FUNDO ===');
    console.log('Tipo de processamento:', backgroundType);
    
    if (images.length === 0) {
      toast.info("Não há imagens para processar");
      return;
    }

    const validImages = images.filter(img => {
      const isValid = img && img.trim() !== '' && img !== 'null' && img !== 'undefined';
      return isValid;
    });

    if (validImages.length === 0) {
      toast.error("Nenhuma imagem válida encontrada para processar");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setProcessedCount(0);
    setProcessedImages([]);

    try {
      const processed: ProcessedImage[] = [];
      
      const processingMessage = `Iniciando ${backgroundType === 'remove' ? 'remoção' : 'alteração para fundo branco'} de ${validImages.length} imagem(ns)...`;
      toast.info(processingMessage);
      
      for (let i = 0; i < validImages.length; i++) {
        const imageUrl = validImages[i];
        
        try {
          console.log(`=== PROCESSANDO IMAGEM ${i + 1}/${validImages.length} ===`);
          console.log(`URL: ${imageUrl}`);
          console.log(`Tipo: ${backgroundType}`);
          
          // Aqui você pode integrar com a API de sua escolha para remoção/alteração de fundo
          // Por enquanto, vou simular o processamento
          const { data, error } = await supabase.functions.invoke('background-processor', {
            body: {
              imageUrl: imageUrl,
              background_type: backgroundType
            }
          });

          console.log('Resposta recebida:', { data, error });

          if (error) {
            console.error(`Erro ao processar imagem ${i + 1}:`, error);
            toast.error(`Erro ao processar imagem ${i + 1}: ${error.message}`);
            continue;
          }

          if (data && data.success === true && data.processed_url) {
            console.log(`✅ Imagem ${i + 1} processada com sucesso!`);
            
            processed.push({
              original: imageUrl,
              processed: data.processed_url,
              metadata: data.metadata
            });
            
            const successMessage = `Imagem ${i + 1} processada com sucesso!`;
            toast.success(successMessage);
          } else {
            console.error(`❌ Falha no processamento da imagem ${i + 1}:`, data);
            toast.error(`Erro na imagem ${i + 1}: ${data?.error || 'erro desconhecido'}`);
          }
          
          setProcessedCount(i + 1);
          const newProgress = ((i + 1) / validImages.length) * 100;
          setProgress(newProgress);
          
        } catch (error) {
          console.error(`Erro inesperado na imagem ${i + 1}:`, error);
          toast.error(`Erro inesperado na imagem ${i + 1}: ${error.message}`);
        }
      }

      console.log(`=== PROCESSO DE FUNDO CONCLUÍDO ===`);
      console.log(`Imagens processadas: ${processed.length} de ${validImages.length}`);
      
      setProcessedImages(processed);

      if (processed.length > 0) {
        const completionMessage = `${processed.length} imagem(ns) processada(s) com sucesso!`;
        toast.success(completionMessage);
      } else {
        toast.warning("Nenhuma imagem foi processada com sucesso.");
      }
      
    } catch (error) {
      console.error('Erro no processo de alteração de fundo:', error);
      toast.error(`Erro no processo: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        if (!isProcessing) {
          setProgress(0);
          setProcessedCount(0);
        }
      }, 3000);
    }
  };

  const downloadProcessedImage = async (processedUrl: string, index: number) => {
    try {
      const fileName = `${productSku}_fundo_${backgroundType}_${index + 1}.jpg`;
      safeDownload(processedUrl, fileName);
      toast.success(`Download da imagem ${index + 1} iniciado`);
    } catch (error) {
      console.error('Erro no download:', error);
      toast.error(`Erro ao baixar imagem ${index + 1}`);
    }
  };

  const viewProcessedImage = (processedUrl: string) => {
    window.open(processedUrl, '_blank');
  };

  const downloadAllAsZip = async () => {
    try {
      toast.info("Preparando download das imagens...");
      
      const imagePromises = processedImages.map(async (item, index) => {
        const response = await fetch(item.processed);
        const blob = await response.blob();
        return {
          name: `${productSku}_fundo_${backgroundType}_${index + 1}.jpg`,
          blob
        };
      });

      const imageFiles = await Promise.all(imagePromises);
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      imageFiles.forEach(({ name, blob }) => {
        zip.file(name, blob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const fileName = `${productSku}_imagens_fundo_${backgroundType}.zip`;
      await safeBlobDownload(zipBlob, fileName);
      
      toast.success(`Download de ${processedImages.length} imagens concluído!`);
    } catch (error) {
      console.error('Erro ao criar arquivo zip:', error);
      toast.error('Erro ao criar arquivo zip. Tente baixar as imagens individualmente.');
    }
  };

  if (images.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg border">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">
          Nenhuma imagem disponível para processamento de fundo
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resultados das Imagens Processadas */}
      {processedImages.length > 0 && (
        <div className="bg-white border border-blue-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-blue-700">
              <Scissors className="h-5 w-5" />
              <span className="font-semibold text-lg">
                {processedImages.length} imagem(ns) processada(s) com sucesso!
              </span>
            </div>
            
            <Button
              onClick={downloadAllAsZip}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              <Archive className="h-4 w-4 mr-2" />
              Baixar Todas em ZIP
            </Button>
          </div>
          
          {/* Grid de Imagens */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
            {processedImages.map((item, index) => (
              <div key={index} className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={item.processed}
                    alt={`${productName} - Fundo ${backgroundType} ${index + 1}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f0f0f0'/%3E%3Ctext x='100' y='100' font-family='Arial' font-size='14' fill='%23999' text-anchor='middle'%3EErro ao carregar%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewProcessedImage(item.processed)}
                        className="bg-white/90 hover:bg-white text-black border-white"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => downloadProcessedImage(item.processed, index)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-white border-t border-gray-100">
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    Imagem {index + 1}
                  </div>
                  <div className="text-xs text-gray-500">
                    Fundo {backgroundType === 'remove' ? 'removido' : 'branco'}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md border border-blue-200">
            💡 <strong>Dica:</strong> As imagens foram processadas para {backgroundType === 'remove' ? 'remoção de fundo' : 'fundo branco'}. Use o botão "Baixar Todas em ZIP" para obter todas as imagens organizadas.
          </div>
        </div>
      )}

      {/* Seção Principal de Processamento de Fundo */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-gray-900">
              Processamento de Fundo
            </span>
          </div>
          <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">
            {images.length} imagem(ns)
          </Badge>
        </div>

        <div className="space-y-4">
          {/* Opções de Tipo de Fundo - MELHORADO */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-800">Escolha o tipo de processamento:</label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant={backgroundType === 'white' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setBackgroundType('white')}
                className={`
                  w-full h-auto p-4 flex flex-col items-center justify-center gap-2 text-left
                  ${backgroundType === 'white' 
                    ? 'bg-white border-2 border-blue-500 text-blue-700 shadow-md' 
                    : 'bg-gray-50 border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                  }
                `}
              >
                <div className="text-lg font-medium">🤍 Fundo Branco</div>
                <div className="text-xs text-center opacity-80">
                  Substitui o fundo por branco sólido
                </div>
              </Button>
              
              <Button
                variant={backgroundType === 'remove' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setBackgroundType('remove')}
                className={`
                  w-full h-auto p-4 flex flex-col items-center justify-center gap-2 text-left
                  ${backgroundType === 'remove' 
                    ? 'bg-white border-2 border-blue-500 text-blue-700 shadow-md' 
                    : 'bg-gray-50 border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                  }
                `}
              >
                <div className="text-lg font-medium">✂️ Remover Fundo</div>
                <div className="text-xs text-center opacity-80">
                  Remove completamente o fundo
                </div>
              </Button>
            </div>
            
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border">
              <strong>Selecionado:</strong> {backgroundType === 'white' ? 'Fundo Branco' : 'Remover Fundo'} • 
              {backgroundType === 'white' 
                ? ' Ideal para marketplaces e catálogos' 
                : ' Ideal para sobreposições e designs'
              }
            </div>
          </div>

          {/* Progresso */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Processando...
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="text-sm text-muted-foreground">
                {processedCount} de {images.length} imagem(ns) processada(s)
              </div>
            </div>
          )}

          <Button 
            onClick={handleProcessImages}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-3 text-lg font-medium"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Processando {backgroundType === 'remove' ? 'Remoção' : 'Fundo Branco'}...
              </>
            ) : (
              <>
                <Scissors className="h-5 w-5 mr-2" />
                {backgroundType === 'remove' ? 'Remover Fundo' : 'Aplicar Fundo Branco'} em {images.length} Imagem(ns)
              </>
            )}
          </Button>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="space-y-2">
              <p className="text-xs text-gray-700">
                <span className="inline-flex items-center gap-1">
                  <Scissors className="h-3 w-3 text-blue-500" />
                  <strong>Processamento de Fundo</strong>
                </span>
                • {backgroundType === 'remove' ? 'Remove completamente o fundo' : 'Substitui o fundo por branco'} das imagens usando IA avançada
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
